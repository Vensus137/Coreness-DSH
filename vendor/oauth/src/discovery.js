/**
 * Discovery, with both habits the measured beds demand.
 *
 * The first habit is the pointer a `401` carries: the server names its protected-resource document in
 * the header, and the flow follows what it named. The second is the address the standard inserts
 * before the resource's path, used when the pointer is absent **or when the address the pointer named
 * answers nothing** — a bed that publishes its document only at the well-known address is invisible to
 * a flow that trusts the pointer alone, and a bed whose pointer is stale is invisible to a flow that
 * trusts the address alone. Both are tried, in that order, and a resource that answers neither is
 * refused in words that name which link was missing.
 *
 * The authorization server's own metadata is then read the same way: the well-known addresses derived
 * from the issuer — the RFC 8414 address with the path inserted, and the OpenID configuration with the
 * path appended, which is the address that standard names — and a resource or an issuer that is not an
 * http(s) address is refused in words before anything is asked of it.
 *
 * @module @coreness/oauth/src/discovery
 */

import { refuse } from './refusals.js'

/** The header a `401` carries its pointer in. */
export const POINTER_HEADER = 'www-authenticate'

/** The parameter of that header this flow reads. */
export const POINTER = 'resource_metadata'

/** Where a resource's own document stands, path inserted the way the standard describes. */
const RESOURCE_WELL_KNOWN = '/.well-known/oauth-protected-resource'

/** Where an authorization server's metadata stands. */
const SERVER_WELL_KNOWN = '/.well-known/oauth-authorization-server'

/** The OpenID configuration, the second address a server may publish its metadata at. */
const OPENID_WELL_KNOWN = '/.well-known/openid-configuration'

/** The largest document this flow reads from a server; a bigger answer is refused, not parsed. */
export const MAX_DOCUMENT = 64 * 1024

/**
 * Check that an address is one this flow follows: an absolute http or https URL.
 *
 * A metadata document, a pointer or an endpoint is the server's own word, and a flow that hands the
 * page whatever the server named turns a server's link into the page's action. The rule lives here —
 * one predicate, used by every address the flow is about to ask or hand out — so no branch can add a
 * scheme of its own.
 * @param {string} address the address to check
 * @param {string} [what] what the address is, for the words
 * @returns {string} the address, normalized by the URL parser
 * @throws {Refusal} `bad-metadata` naming the address and the rule it broke
 */
export function assertHttpAddress(address, what = 'the address') {
  let url
  try {
    url = new URL(String(address))
  } catch {
    throw refuse('bad-metadata', `${what} ${JSON.stringify(String(address))} is not an absolute address`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw refuse('bad-metadata', `${what} ${url.href} is not an http(s) address`)
  }
  return url.href
}

/**
 * The pointer a response carries, or null when it names none.
 *
 * The header is read as the wire writes it — a bearer challenge with parameters — rather than by
 * assuming a shape, because a server that answers `Bearer` without a pointer is exactly the bed the
 * second habit exists for.
 * @param {object} response a response, or anything with `headers.get`
 * @returns {string | null} the address the response pointed at
 */
export function pointerOf(response) {
  const header = response?.headers?.get?.(POINTER_HEADER) ?? null
  if (typeof header !== 'string') return null
  const found = new RegExp(`${POINTER}\\s*=\\s*"([^"]+)"`, 'iu').exec(header)
  return found === null ? null : found[1]
}

/**
 * The well-known address of a resource: the standard's path insertion, before the resource's own path.
 * @param {string} resource the resource's address
 * @returns {string} the address its document would stand at
 * @throws {Refusal} `bad-metadata` when the resource is not an http(s) address
 */
export function resourceWellKnownAt(resource) {
  const url = new URL(assertHttpAddress(resource, 'the resource'))
  return `${url.origin}${RESOURCE_WELL_KNOWN}${url.pathname === '/' ? '' : url.pathname}`
}

/**
 * The well-known addresses of an authorization server, in the order they are tried: the RFC 8414
 * address with the issuer's path inserted, then the OpenID configuration with that path appended.
 * @param {string} issuer the issuer's address
 * @returns {string[]} the addresses to try
 * @throws {Refusal} `bad-metadata` when the issuer is not an http(s) address
 */
export function serverWellKnownAt(issuer) {
  const url = new URL(assertHttpAddress(issuer, 'the issuer'))
  const path = url.pathname === '/' ? '' : url.pathname
  return [`${url.origin}${SERVER_WELL_KNOWN}${path}`, `${url.origin}${path}${OPENID_WELL_KNOWN}`]
}

/**
 * Ask one address for one document.
 *
 * A document that answers is parsed; anything else — an address this flow does not follow, a network
 * failure, a status outside 200, an answer bigger than `MAX_DOCUMENT`, a body that does not parse —
 * answers null, so the caller can try its next habit and name the link that was missing only once every
 * habit has been tried. The reason is kept for the words, and no answer is trusted with an unbounded
 * parse: a server's document is read as text first, capped, and only then parsed.
 * @param {string} address the address to ask
 * @param {object} fetchImpl the fetch to ask with
 * @returns {Promise<{ document: object | null, why: string }>} the document, or why it did not come
 */
async function documentAt(address, fetchImpl) {
  let checked
  try {
    checked = assertHttpAddress(address, 'the document address')
  } catch (error) {
    return { document: null, why: error instanceof Error ? error.message : String(error) }
  }
  let response
  try {
    response = await fetchImpl(checked, { headers: { accept: 'application/json' } })
  } catch (error) {
    return { document: null, why: `${checked} could not be reached (${error instanceof Error ? error.message : String(error)})` }
  }
  if (!response?.ok) return { document: null, why: `${checked} answered ${response?.status ?? 'nothing'}` }
  try {
    const text = await response.text()
    if (typeof text !== 'string') return { document: null, why: `${checked} answered no text to parse` }
    if (text.length > MAX_DOCUMENT) return { document: null, why: `${checked} answered more than ${MAX_DOCUMENT} characters` }
    const document = JSON.parse(text)
    if (document === null || typeof document !== 'object' || Array.isArray(document)) return { document: null, why: `${checked} answered a document that is not an object` }
    return { document, why: '' }
  } catch (error) {
    return { document: null, why: `${checked} answered a body that does not parse (${error instanceof Error ? error.message : String(error)})` }
  }
}

/**
 * The addresses a protected resource's document may stand at, the pointer first.
 * @param {string} resource the resource's address
 * @param {string | null} [pointer] what the `401` pointed at, when it pointed
 * @returns {string[]} the addresses to try, in order, without repeats
 */
export function resourceDocumentAt(resource, pointer = null) {
  const addresses = []
  if (typeof pointer === 'string' && pointer !== '') addresses.push(pointer)
  addresses.push(resourceWellKnownAt(resource))
  return [...new Set(addresses)]
}

/**
 * The protected-resource document of one server, by both habits.
 * @param {string} resource the resource's address
 * @param {object} options the flow's own options
 * @param {string | null} [options.pointer] what the `401` pointed at
 * @param {object} [options.fetch] the fetch to ask with
 * @returns {Promise<object>} the document
 * @throws {Refusal} `no-resource-metadata` naming every address tried and why each answered nothing
 */
export async function resourceMetadata(resource, { pointer = null, fetch = globalThis.fetch } = {}) {
  const tried = []
  for (const address of resourceDocumentAt(resource, pointer)) {
    const { document, why } = await documentAt(address, fetch)
    if (document !== null) return document
    tried.push(why)
  }
  throw refuse('no-resource-metadata', tried.join('; '))
}

/**
 * The metadata of one authorization server, by the addresses the standard derives from its issuer.
 * @param {string} issuer the issuer's address
 * @param {object} [options] the flow's own options
 * @param {object} [options.fetch] the fetch to ask with
 * @returns {Promise<object>} the document
 * @throws {Refusal} `no-server-metadata` naming every address tried and why each answered nothing
 */
export async function serverMetadata(issuer, { fetch = globalThis.fetch } = {}) {
  const tried = []
  for (const address of serverWellKnownAt(issuer)) {
    const { document, why } = await documentAt(address, fetch)
    if (document !== null) return document
    tried.push(why)
  }
  throw refuse('no-server-metadata', `${issuer} — ${tried.join('; ')}`)
}

/**
 * The issuer's own name from a protected-resource document.
 * @param {object} document the protected-resource document
 * @returns {string} the first authorization server it names
 * @throws {Refusal} `bad-metadata` when it names none
 */
export function issuerOf(document) {
  const servers = document?.authorization_servers
  if (!Array.isArray(servers) || servers.length === 0 || typeof servers[0] !== 'string') {
    throw refuse('bad-metadata', 'the protected-resource document names no authorization server')
  }
  return servers[0]
}

/**
 * The token endpoint of an authorization server's metadata, checked rather than assumed.
 * @param {object} metadata the authorization server's metadata
 * @returns {string} the endpoint
 * @throws {Refusal} `no-token-endpoint` when the document publishes none, or `bad-metadata` when it
 *   publishes an address this flow does not follow
 */
export function tokenEndpointOf(metadata) {
  const endpoint = metadata?.token_endpoint
  if (typeof endpoint !== 'string' || endpoint === '') throw refuse('no-token-endpoint', 'the authorization server\'s metadata names no token endpoint')
  return assertHttpAddress(endpoint, 'the token endpoint')
}

/**
 * The authorization endpoint of an authorization server's metadata, checked rather than assumed.
 * @param {object} metadata the authorization server's metadata
 * @returns {string} the endpoint
 * @throws {Refusal} `no-authorization-url` when the document publishes none, or `bad-metadata` when it
 *   publishes an address this flow does not follow
 */
export function authorizationEndpointOf(metadata) {
  const endpoint = metadata?.authorization_endpoint
  if (typeof endpoint !== 'string' || endpoint === '') throw refuse('no-authorization-url', 'the authorization server\'s metadata names no authorization endpoint')
  return assertHttpAddress(endpoint, 'the authorization endpoint')
}

/**
 * The whole discovery of one server: its resource document, the issuer it names, and that issuer's
 * metadata.
 * @param {string} resource the resource's address
 * @param {object} [options] the flow's own options
 * @param {string | null} [options.pointer] what the `401` pointed at
 * @param {object} [options.fetch] the fetch to ask with
 * @returns {Promise<object>} the resource document and the server's metadata
 */
export async function discover(resource, { pointer = null, fetch = globalThis.fetch } = {}) {
  const resource_ = await resourceMetadata(resource, { pointer, fetch })
  const issuer = issuerOf(resource_)
  const server = await serverMetadata(issuer, { fetch })
  return { resource: resource_, issuer, server }
}
