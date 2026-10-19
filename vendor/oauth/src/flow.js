/**
 * The exchanges: registration, the authorization address, the code exchange, and the refresh.
 *
 * Four calls, each with its own refusals, each taking the fetch it asks with so a test can answer for a
 * bed without a bed. Nothing here stores anything: a caller hands in what the flow keeps and takes back
 * what the server said, so the stores and the wire stay two subjects.
 *
 * @module @coreness/oauth/src/flow
 */

import { METHOD } from './pkce.js'
import { authorizationEndpointOf, tokenEndpointOf } from './discovery.js'
import { refuse } from './refusals.js'

/** The name this flow registers itself as, when a server asks for a name rather than a client id. */
export const CLIENT_NAME = 'Coreness MCP'

/** The scopes this flow asks for when a server publishes none it must ask for. */
export const DEFAULT_SCOPE = ''

/**
 * The client authentication methods this flow can use, in the order it prefers them: the secret in the body,
 * the secret in a Basic header, and a public client. A server that lists any of them names what its token
 * endpoint will accept; a server that lists none is asked for a public client, the shape it answers without
 * the field.
 */
export const AUTH_METHODS = ['client_secret_post', 'client_secret_basic', 'none']

/**
 * The method to register and to sign a grant with: the first this flow can use that the server publishes.
 * @param {object} metadata the authorization server's metadata
 * @returns {string} one of `AUTH_METHODS`
 */
export function authMethodFor(metadata) {
  const supported = Array.isArray(metadata?.token_endpoint_auth_methods_supported)
    ? metadata.token_endpoint_auth_methods_supported.map(String)
    : []
  return AUTH_METHODS.find((method) => supported.includes(method)) ?? 'none'
}

/**
 * The headers a grant is signed with: a Basic header when the registration chose it, nothing otherwise.
 * @param {string} method the method the client was registered with
 * @param {string} clientId the client id
 * @param {string} clientSecret the client secret, empty for a public client
 * @returns {object} the headers, never a secret for a method that keeps it in the body
 */
function grantHeaders(method, clientId, clientSecret) {
  if (method !== 'client_secret_basic' || typeof clientSecret !== 'string' || clientSecret === '') return {}
  /* The standard's own encoding: both halves are form-encoded before they are joined and base64'd. */
  const pair = `${encodeURIComponent(String(clientId))}:${encodeURIComponent(String(clientSecret))}`
  return { authorization: `Basic ${Buffer.from(pair).toString('base64')}` }
}

/**
 * Ask a form-encoded POST of a token endpoint.
 *
 * A refusal is read from both shapes the wire uses: the standard's `error`/`error_description`, and the bare
 * `message` a platform's own API answers — a sentence a person can act on, where the standard's fields are
 * absent.
 * @param {string} endpoint the endpoint's address
 * @param {object} form the parameters
 * @param {object} fetchImpl the fetch to ask with
 * @param {object} [headers] the headers the grant is signed with
 * @returns {Promise<{ body: object | null, error: string, description: string, status: number }>} what answered
 */
async function postForm(endpoint, form, fetchImpl, headers = {}) {
  const body = new URLSearchParams(form).toString()
  let response
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', ...headers },
      body,
    })
  } catch (error) {
    return { body: null, error: 'network', description: error instanceof Error ? error.message : String(error), status: 0 }
  }
  let parsed = null
  try {
    parsed = await response.json()
  } catch {
    /* an endpoint that answers no JSON is reported by its status below */
  }
  const error = typeof parsed?.error === 'string' ? parsed.error : ''
  const description = typeof parsed?.error_description === 'string'
    ? parsed.error_description
    : (typeof parsed?.message === 'string' ? parsed.message : '')
  if (!response.ok || error !== '') return { body: null, error: error === '' ? `http ${response.status}` : error, description, status: response.status }
  return { body: parsed !== null && typeof parsed === 'object' ? parsed : null, error: '', description: '', status: response.status }
}

/**
 * Register this client with an authorization server that offers dynamic registration.
 *
 * A server that publishes no registration endpoint is not a failure: the caller then needs a client id
 * from somewhere else, and this function says so by answering null rather than by refusing.
 * @param {object} metadata the authorization server's metadata
 * @param {object} options the flow's own options
 * @param {string} options.redirectUrl the address the browser step comes back to
 * @param {object} [options.fetch] the fetch to ask with
 * @param {string} [options.name] the name to register
 * @returns {Promise<object | null>} the client information, or null when the server registers none
 * @throws {Refusal} `registration-refused` (the server refused) or `registration-invalid` (no client id)
 */
export async function registerClient(metadata, { redirectUrl, fetch = globalThis.fetch, name = CLIENT_NAME } = {}) {
  const endpoint = metadata?.registration_endpoint
  if (typeof endpoint !== 'string' || endpoint === '') return null
  const wanted = {
    client_name: name,
    redirect_uris: [redirectUrl],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: authMethodFor(metadata),
  }
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(wanted),
    })
  } catch (error) {
    throw refuse('registration-refused', `${endpoint} could not be reached (${error instanceof Error ? error.message : String(error)})`)
  }
  if (!response.ok) throw refuse('registration-refused', `${endpoint} answered ${response.status}`)
  let document
  try {
    document = await response.json()
  } catch (error) {
    throw refuse('registration-invalid', `${endpoint} answered a body that does not parse (${error instanceof Error ? error.message : String(error)})`)
  }
  if (typeof document?.client_id !== 'string' || document.client_id === '') {
    throw refuse('registration-invalid', `${endpoint} answered without a client id`)
  }
  return document
}

/**
 * The address the browser step is handed out with.
 * @param {object} metadata the authorization server's metadata
 * @param {object} request what this authorization asks for
 * @param {string} request.clientId the client id
 * @param {string} request.redirectUrl the address the browser comes back to
 * @param {string} request.challenge the PKCE challenge
 * @param {string} [request.state] the state the answer must carry
 * @param {string} [request.resource] the resource the token is for
 * @param {string} [request.scope] the scopes to ask for
 * @returns {string} the address to open
 * @throws {Refusal} `no-authorization-url` when the metadata names no authorization endpoint
 */
export function authorizationUrlFor(metadata, { clientId, redirectUrl, challenge, state, resource, scope = DEFAULT_SCOPE } = {}) {
  const endpoint = authorizationEndpointOf(metadata)
  const url = new URL(endpoint)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', String(clientId))
  url.searchParams.set('redirect_uri', String(redirectUrl))
  url.searchParams.set('code_challenge', String(challenge))
  url.searchParams.set('code_challenge_method', METHOD)
  if (typeof state === 'string' && state !== '') url.searchParams.set('state', state)
  if (typeof resource === 'string' && resource !== '') url.searchParams.set('resource', resource)
  if (typeof scope === 'string' && scope !== '') url.searchParams.set('scope', scope)
  return url.toString()
}

/**
 * Exchange the code the browser step came back with for tokens.
 * @param {object} metadata the authorization server's metadata
 * @param {object} request what the exchange carries
 * @param {string} request.clientId the client id
 * @param {string} request.code the code
 * @param {string} request.verifier the PKCE verifier of this authorization
 * @param {string} request.redirectUrl the same address the authorization named
 * @param {string} [request.clientSecret] the secret the registration answered with, empty for a public client
 * @param {string} [request.authMethod] the method the client was registered with
 * @param {string} [request.resource] the resource the token is for
 * @param {object} [request.fetch] the fetch to ask with
 * @returns {Promise<object>} the token response
 * @throws {Refusal} `exchange-refused` (the endpoint refused, in its own words) or `exchange-invalid`
 */
export async function exchangeCode(metadata, { clientId, clientSecret = '', authMethod = 'none', code, verifier, redirectUrl, resource, fetch = globalThis.fetch } = {}) {
  const endpoint = tokenEndpointOf(metadata)
  const form = {
    grant_type: 'authorization_code',
    code: String(code),
    client_id: String(clientId),
    redirect_uri: String(redirectUrl),
    code_verifier: String(verifier),
  }
  if (typeof resource === 'string' && resource !== '') form.resource = resource
  /* The client authenticates the way its registration says: a secret in the body, or in a Basic header. A
     server that requires client authentication refuses an exchange that carries neither — and a public
     client is one that was registered without a secret, not one that kept it back. */
  const headers = grantHeaders(authMethod, clientId, clientSecret)
  if (authMethod !== 'client_secret_basic' && typeof clientSecret === 'string' && clientSecret !== '') form.client_secret = clientSecret
  const answer = await postForm(endpoint, form, fetch, headers)
  if (answer.body === null) throw refuse('exchange-refused', `${endpoint} answered ${answer.error}${answer.description === '' ? '' : `: ${answer.description}`}`)
  if (typeof answer.body.access_token !== 'string' || answer.body.access_token === '') {
    throw refuse('exchange-invalid', `${endpoint} answered without an access token`)
  }
  return answer.body
}

/**
 * Refresh an access token with the refresh token of a stored grant.
 *
 * A refresh the server refuses as `invalid_grant` is the one shape a caller must be able to tell from
 * every other refusal: it means the grant is gone and the person has to sign in again, and it is
 * reported as its own code rather than as "the refresh failed".
 * @param {object} metadata the authorization server's metadata
 * @param {object} request what the refresh carries
 * @param {string} request.clientId the client id
 * @param {string} request.refreshToken the refresh token
 * @param {string} [request.resource] the resource the token is for
 * @param {string} [request.clientSecret] the secret the registration answered with, empty for a public client
 * @param {string} [request.authMethod] the method the client was registered with
 * @param {string} [request.scope] the scopes to ask for
 * @param {object} [request.fetch] the fetch to ask with
 * @returns {Promise<object>} the token response
 * @throws {Refusal} `refresh-refused` (with `invalid_grant` named in the detail) or `refresh-invalid`
 */
export async function refreshTokens(metadata, { clientId, clientSecret = '', authMethod = 'none', refreshToken, resource, scope = DEFAULT_SCOPE, fetch = globalThis.fetch } = {}) {
  const endpoint = tokenEndpointOf(metadata)
  const form = {
    grant_type: 'refresh_token',
    refresh_token: String(refreshToken),
    client_id: String(clientId),
  }
  if (typeof resource === 'string' && resource !== '') form.resource = resource
  if (typeof scope === 'string' && scope !== '') form.scope = scope
  const headers = grantHeaders(authMethod, clientId, clientSecret)
  if (authMethod !== 'client_secret_basic' && typeof clientSecret === 'string' && clientSecret !== '') form.client_secret = clientSecret
  const answer = await postForm(endpoint, form, fetch, headers)
  if (answer.body === null) throw refuse('refresh-refused', `${endpoint} answered ${answer.error}${answer.description === '' ? '' : `: ${answer.description}`}`, { expired: answer.error === 'invalid_grant' })
  if (typeof answer.body.access_token !== 'string' || answer.body.access_token === '') {
    throw refuse('refresh-invalid', `${endpoint} answered without an access token`)
  }
  return answer.body
}
