/**
 * The reference one row carries: the credential key of a server's tokens, and the expression a row's
 * header reads that token through.
 *
 * The expression is the product's way into the platform's store, and it is synchronous because the
 * platform's loader evaluates a row's configuration with a synchronous evaluator in that row's own
 * context. The record's shape is the store's own: the seam keeps a grant as a kind and a payload, and
 * this plugin writes the token response under a `tokens` key, so the token stands at
 * `payload.tokens.access_token` — read at the wire through a row's own header before this file was
 * written, with the other shape measured beside it and answering nothing.
 *
 * The expression refuses in words instead of sending a header that means nothing. A row whose record is
 * gone, whose payload stands in another shape, or whose token is not a string ends its own activation
 * with a sentence carrying a code — which is how a reference pointing at nothing stops being silence and
 * becomes a refusal somebody can read.
 *
 * @module @coreness/oauth/src/reference
 */

import { keyOf } from './stores.js'

/** The code the expression's own refusal carries, for a person and for a log to read. */
export const NO_TOKEN = 'oauth-no-token'

/**
 * The credential key of one server's tokens: the record a row's header reads.
 * @param {string} server the server's name
 * @returns {string} the credential key
 */
export function tokenKeyOf(server) {
  return keyOf(server, 'tokens')
}

/**
 * The expression a row's header carries: the token out of the stored grant, or a refusal in words.
 * @param {string} server the server's name
 * @returns {string} the expression, as the loader's own evaluator reads it
 */
export function bearerExpression(server) {
  const key = tokenKeyOf(server)
  return `(() => { const held = credentials.records.get(${JSON.stringify(key)}); const token = held && held.payload && held.payload.tokens && held.payload.tokens.access_token; if (typeof token !== 'string' || token === '') throw new Error(${JSON.stringify(`${NO_TOKEN}: no token stands in the credential record ${key}`)}); return 'Bearer ' + token })()`
}

/**
 * What a row needs for one server: where the token stands, and how its header reads it.
 * @param {string} server the server's name
 * @returns {{key: string, expression: string}} the reference
 */
export function referenceFor(server) {
  return { key: tokenKeyOf(server), expression: bearerExpression(server) }
}
