/**
 * The words of this plugin's refusals, and the one shape they leave in.
 *
 * Every failure of the flow reaches its caller as one of these codes with a sentence beside it — a
 * metadata document that is not there, a registration the server refuses, an exchange that comes back
 * wrong, a refresh on an expired grant. A branch that ends in silence is a defect of the same family
 * as a value that disappears on save, so a branch this plugin cannot finish throws here rather than
 * returning nothing for a caller to guess at.
 *
 * @module @coreness/oauth/src/refusals
 */

/**
 * The codes, each with the sentence it carries. The keys are the vocabulary a caller branches on and
 * the values are what a person reads; the fixture holds every code to a sentence of its own.
 */
export const WORDS = {
  'no-resource-metadata': 'the server answers 401, and neither the pointer it gave nor the well-known address of the standard carries a protected-resource document',
  'no-server-metadata': 'the protected resource names an authorization server, and no metadata of that server answers',
  'bad-metadata': 'the metadata document answered, and it is not the document the standard describes',
  'registration-refused': 'the authorization server refused to register this client',
  'registration-invalid': 'the registration answered, and not with a client id',
  'exchange-refused': 'the token endpoint refused the exchange, in its own words',
  'exchange-invalid': 'the token endpoint answered, and not with the fields an exchange returns',
  'refresh-refused': 'the refresh was refused, in the server\'s own words',
  'refresh-invalid': 'the refresh answered, and not with the fields a refresh returns',
  'no-code-verifier': 'the exchange was asked for with no verifier stored for this server, so PKCE cannot be finished',
  'no-redirect': 'the browser step was asked for with no redirect address for this flow to hand back',
  'no-authorization-url': 'the authorization server published no authorization endpoint',
  'no-token-endpoint': 'the authorization server published no token endpoint',
  'state-mismatch': 'the answer to the browser step carries a state this plugin never stored for that server',
  'no-code': 'the callback came back without a code to exchange',
  'provider-refused': 'the authorization server sent its own refusal back with the callback',
  'no-attempt': 'a callback came back for a server whose sign-in is not waiting for one',
  'no-callback': 'the browser did not come back to this app with an answer, so nothing was exchanged',
  'no-web-server': 'the platform\'s web server is not in this composition, so a callback has no home',
  'cancelled': 'the sign-in was withdrawn before an answer came back',
}

/** Every code, in one list: the vocabulary as a whole. */
export const CODES = Object.keys(WORDS)

/**
 * A refusal of the flow: a code to branch on and a sentence to read.
 *
 * The sentence names what was missing or what the server said, because a caller that only knows "the
 * sign-in failed" cannot tell a person which of the flow's links to look at.
 */
export class Refusal extends Error {
  /**
   * @param {string} code the code, one of `CODES`
   * @param {string} words what happened, naming the server or the link when one is known
   * @param {object} [detail] what a caller may want beside the words, never a secret
   */
  constructor(code, words, detail = {}) {
    super(words)
    this.name = 'Refusal'
    this.code = code
    this.detail = detail
  }
}

/**
 * Refuse with one of the vocabulary's own sentences, with what the caller knows appended.
 * @param {string} code the code, one of `CODES`
 * @param {string} [about] what the sentence is about — an address, a server, a link
 * @param {object} [detail] what a caller may want beside the words
 * @returns {Refusal} the refusal, ready to throw
 */
export function refuse(code, about = '', detail = {}) {
  const words = WORDS[code]
  if (words === undefined) throw new Error(`oauth: no such refusal code: ${code}`)
  return new Refusal(code, about === '' ? words : `${words} — ${about}`, detail)
}
