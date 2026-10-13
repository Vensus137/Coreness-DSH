/**
 * One server's authorization, from the discovery to the tokens — three calls a caller makes.
 *
 * `begin` discovers, registers where the server allows it, keeps a verifier and a state, and answers
 * the address a person opens. `finish` takes the code the browser step came back with and stores the
 * tokens. `refresh` rotates them. Nothing here draws, routes or connects: the browser step leaves as an
 * address, and the row's own reload after a refresh belongs to whoever owns the row.
 *
 * @module @coreness/dsh/plugins/oauth/authorize
 */

import { randomBytes } from 'node:crypto'
import { discover } from './discovery.js'
import { authorizationUrlFor, exchangeCode, refreshTokens, registerClient } from './flow.js'
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
 * Finish a browser step: the code back into stored tokens.
 *
 * The state the answer carries is held against the one this flow stored, because a code arriving with
 * somebody else's state is not this authorization's answer. A code a person pasted carries no state at
 * all: the check is skipped for that door rather than faked, and the door that can carry a state always
 * passes one.
 *
 * The state is taken back here, before the exchange: the answer is in hand, a code is one-use, and a state
 * that outlived its callback is a door left open for an answer nobody will send. An attempt that ends
 * without ever reaching this call takes its own state back where that attempt ends.
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
 * @returns {Promise<object>} the tokens as they were stored
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
    code,
    verifier: await stores.codeVerifier(),
    redirectUrl,
    resource,
    fetch,
  })
  await stores.saveTokens(tokens)
  return tokens
}

/**
 * Rotate the tokens of a stored grant.
 *
 * The answer replaces what the store holds; a refresh the server refuses as an expired grant is
 * reported with its own code and `expired` in the detail, because that is the one refusal a person has
 * to answer by signing in again.
 * @param {object} options what this refresh stands on
 * @param {object} options.credentials the platform's credential service
 * @param {string} options.server the server's name
 * @param {string} options.resource the resource's address
 * @param {string | null} [options.pointer] what a `401` pointed at, when one was read
 * @param {string} [options.clientId] a client id to use when none is stored
 * @param {string} [options.scope] the scopes to ask for
 * @param {object} [options.fetch] the fetch to ask with
 * @returns {Promise<object>} the tokens as they were stored
 * @throws {Refusal} `registration-refused` when no client stands, or the refresh's own codes
 */
export async function refresh({ credentials, server, resource, pointer = null, clientId = '', scope = '', fetch = globalThis.fetch } = {}) {
  const stores = new RecordStores(credentials, server)
  const held = await stores.tokens()
  if (held === undefined || typeof held.refresh_token !== 'string' || held.refresh_token === '') {
    throw refuse('refresh-refused', `${server} holds no refresh token to rotate`)
  }
  const client = (await stores.clientInformation()) ?? (clientId === '' ? undefined : { client_id: clientId })
  if (client === undefined || typeof client.client_id !== 'string' || client.client_id === '') {
    throw refuse('registration-refused', `${server} holds no client registration to refresh with`)
  }

  const found = await discover(resource, { pointer, fetch })
  const tokens = await refreshTokens(found.server, {
    clientId: client.client_id,
    refreshToken: held.refresh_token,
    resource,
    scope,
    fetch,
  })
  const merged = { ...tokens }
  if (typeof merged.refresh_token !== 'string' || merged.refresh_token === '') merged.refresh_token = held.refresh_token
  await stores.saveTokens(merged)
  return merged
}
