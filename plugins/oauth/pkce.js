/**
 * PKCE for one authorization: the verifier a flow keeps, and the challenge a server can check.
 *
 * `S256` is the only method this plugin asks for — the plain method is not offered, and a server that
 * publishes only `plain` is a server this flow cannot enter. The verifier comes from the platform's
 * own randomness and is checked against the standard's grammar before it is stored, so a value that
 * did not come from here is refused rather than sent.
 *
 * @module @coreness/dsh/plugins/oauth/pkce
 */

import { createHash, randomBytes } from 'node:crypto'

/** The method every request of this flow names. */
export const METHOD = 'S256'

/** The verifier's own grammar: 43 to 128 characters of the unreserved set. */
export const VERIFIER = /^[A-Za-z0-9\-._~]{43,128}$/u

/**
 * A fresh verifier: 32 bytes of the platform's randomness, spelled without padding.
 *
 * The spelling is the one the standard's own grammar takes, and 32 bytes is the shortest length that
 * still reaches the grammar's lower bound after base64url — a shorter draw would be refused below.
 * @returns {string} the verifier
 */
export function verifier() {
  return randomBytes(32).toString('base64url')
}

/**
 * The challenge of a verifier: its SHA-256, spelled the same way.
 * @param {string} value the verifier
 * @returns {string} the challenge a server checks
 */
export function challengeOf(value) {
  return createHash('sha256').update(value).digest('base64url')
}

/**
 * Whether a string could be a verifier this flow stored.
 * @param {unknown} value the candidate
 * @returns {boolean} true when the grammar takes it
 */
export function isVerifier(value) {
  return typeof value === 'string' && VERIFIER.test(value)
}
