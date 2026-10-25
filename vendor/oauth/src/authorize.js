/**
 * One server's authorization, from the discovery to the tokens — two calls a caller makes.
 *
 * `begin` discovers, registers where the server allows it, keeps a verifier and a state, and answers
 * the address a person opens. `finish` takes the code the browser step came back with and answers the
 * tokens; the record those tokens are committed as is the platform's commit door's, written by the
 * step that owns the attempt. Nothing here draws, routes or connects.
 *
 * @module @coreness/oauth/src/authorize
 */

import { randomBytes } from 'node:crypto'
import { discover } from './discovery.js'
import { AUTH_METHODS, authorizationUrlFor, exchangeCode, registerClient } from './flow.js'
import { challengeOf, verifier } from './pkce.js'
import { RecordStores } from './stores.js'
import { CLIENT_NAME } from './flow.js'
import { refuse } from './refusals.js'

/**
 * Start an authorization for one server.
 *
 * A server that offers dynamic registration is registered once and its client information kept; a
 * server that offers none is used with the client id a caller already holds, and when neither stands
 * the refusal says so rather than opening an address that cannot be answered.
 *
 * A registration is this sign-in's client only while it names the address this sign-in comes back to: a
 * provider holds the address of the request against the ones it registered, so a registration made at
 * another port is not a client this flow can use — the request is refused whole, or the browser is sent
 * to a door nothing answers at, and either way the person is told nothing. Such a registration is left
 * behind and the flow registers anew; a client id a caller named carries no address of its own, so there
 * is nothing to compare and it is taken as it stands.
 * @param {object} options what this authorization stands on
 * @param {object} options.credentials the platform's credential service
 * @param {string} options.server the server's name
 * @param {string} options.resource the resource's address, as the row holds it
 * @param {string} options.redirectUrl the address the browser step comes back to
 * @param {string | null} [options.pointer] what a `401` pointed at, when one was read
 * @param {string} [options.clientId] a client id the caller already holds
 * @param {string} [options.scope] the scopes to ask for
 * @param {string} [options.name] the name to register as
 * @param {object} [options.fetch] the fetch to ask with
 * @returns {Promise<object>} the address to open and what the flow kept to finish it
 * @throws {Refusal} the discovery's own codes, `registration-refused`, `registration-invalid`, or
 *   `bad-metadata` when the server registers none and the caller holds no client id
 */
export async function begin({ credentials, server, resource, redirectUrl, pointer = null, clientId = '', scope = '', name = CLIENT_NAME, fetch = globalThis.fetch } = {}) {
  const stores = new RecordStores(credentials, server)
  const found = await discover(resource, { pointer, fetch })

  let client = await stores.clientInformation()
  if (client === undefined && clientId !== '') client = { client_id: clientId }
  const stale = client !== undefined && namesAnotherAddress(client, redirectUrl)
  if (stale) client = undefined
  if (client === undefined) {
    const registered = await registerClient(found.server, { redirectUrl, fetch, name })
    if (registered !== null) {
      client = registered
      await stores.saveClientInformation(registered)
    }
  }
  if (client === undefined || typeof client.client_id !== 'string' || client.client_id === '') {
    throw refuse('registration-refused', stale
      ? `${found.issuer} registers no client, and the registration it holds names another address than ${redirectUrl}`
      : `${found.issuer} registers no client and no client id stands for it`)
  }

  const kept = verifier()
  const state = randomBytes(16).toString('base64url')
  await stores.saveCodeVerifier(kept)
  await stores.saveState(state)

  const url = authorizationUrlFor(found.server, {
    clientId: client.client_id,
    redirectUrl,
    challenge: challengeOf(kept),
    state,
    resource,
    scope,
  })
  return { url, state, issuer: found.issuer, server: found.server, resource: found.resource, clientId: client.client_id }
}

/**
 * The method a stored registration signs a grant with: the one the registration answered with, or — for a
 * record made before the field was read — the method its own secret implies, and a public client otherwise.
 * @param {object} client the stored registration
 * @returns {string} one of `AUTH_METHODS`
 */
function authMethodOf(client) {
  const named = typeof client?.token_endpoint_auth_method === 'string' ? client.token_endpoint_auth_method : ''
  if (AUTH_METHODS.includes(named)) return named
  return typeof client?.client_secret === 'string' && client.client_secret !== '' ? 'client_secret_post' : 'none'
}

/**
 * Whether a stored registration names addresses, and none of them the one this sign-in comes back to.
 *
 * A registration that names none is not a mismatch: a client id a caller brought has no address to hold
 * this flow to, and refusing the caller's own client because of a list it never carried would be this
 * file inventing a rule the standard does not have.
 * @param {object} client the stored registration
 * @param {string} redirectUrl the address this sign-in comes back to
 * @returns {boolean} true when the registration names addresses and not this one
 */
function namesAnotherAddress(client, redirectUrl) {
  const named = client?.redirect_uris
  if (!Array.isArray(named) || named.length === 0) return false
  return !named.map(String).includes(String(redirectUrl))
}

/**
 * Finish a browser step: the code back into the tokens the step commits.
 *
 * The state the answer carries is held against the one this flow stored, because a code arriving with
 * somebody else's state is not this authorization's answer. A code a person pasted carries no state at
 * all: the check is skipped for that door rather than faked, and the door that can carry a state always
 * passes one.
 *
 * The state and the verifier are taken back here, before the tokens leave: the answer is in hand, a code
 * is one-use, and a state or a verifier that outlived its attempt is a door left open for an answer
 * nobody will send. An attempt that ends without ever reaching this call takes its own two back where
 * that attempt ends.
 *
 * The tokens are answered, not stored: the grant's one write is the platform's commit door, which the
 * callers that own an attempt hold. A caller that has no door writes through the stores itself.
 * @param {object} options what this exchange stands on
 * @param {object} options.credentials the platform's credential service
 * @param {string} options.server the server's name
 * @param {string} options.resource the resource's address
 * @param {string} options.code the code the browser step came back with
 * @param {string} options.state the state it carried
 * @param {string} options.redirectUrl the same address the authorization named
 * @param {string | null} [options.pointer] what a `401` pointed at, when one was read
 * @param {string} [options.clientId] a client id to use when none is stored
 * @param {object} [options.fetch] the fetch to ask with
 * @returns {Promise<object>} the token response
 * @throws {Refusal} `state-mismatch`, `no-code-verifier`, or the exchange's own codes
 */
export async function finish({ credentials, server, resource, code, state, redirectUrl, pointer = null, clientId = '', fetch = globalThis.fetch } = {}) {
  const stores = new RecordStores(credentials, server)
  if (state !== undefined) {
    const kept = await stores.state()
    if (kept === undefined || kept !== String(state)) throw refuse('state-mismatch', `${server} — the answer carried another state than the one this flow stored`)
  }
  await stores.write('state', undefined)

  const client = (await stores.clientInformation()) ?? (clientId === '' ? undefined : { client_id: clientId })
  if (client === undefined || typeof client.client_id !== 'string' || client.client_id === '') {
    throw refuse('registration-refused', `${server} holds no client registration to exchange with`)
  }

  const found = await discover(resource, { pointer, fetch })
  const tokens = await exchangeCode(found.server, {
    clientId: client.client_id,
    clientSecret: typeof client.client_secret === 'string' ? client.client_secret : '',
    authMethod: authMethodOf(client),
    code,
    verifier: await stores.codeVerifier(),
    redirectUrl,
    resource,
    fetch,
  })
  await stores.write('verifier', undefined)
  return tokens
}
