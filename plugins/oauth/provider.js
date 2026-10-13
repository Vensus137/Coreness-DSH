/**
 * The provider the SDK asks for, over this plugin's own stores.
 *
 * The interface is small and exact, and the required calls are the ones the installed client makes
 * unconditionally: `redirectUrl`, `clientMetadata`, `clientInformation()` with `saveClientInformation()`,
 * `tokens()` with `saveTokens()`, `codeVerifier()` with `saveCodeVerifier()`, and
 * `redirectToAuthorization()` for the browser step. `state()`, `saveState()` and
 * `invalidateCredentials()` are the optional half the same client looks for before calling; the rest of
 * its optional hooks are left out deliberately, because this provider has no client secret to add to a
 * request and no resource check of its own to make.
 *
 * The provider owns no store: every value it hands out comes from the platform's credential records,
 * re-read at the call, so a token another hand rotated reaches the next operation.
 *
 * @module @coreness/dsh/plugins/oauth/provider
 */

import { RecordStores } from './stores.js'
import { refuse } from './refusals.js'

export class FlowProvider {
  /** @type {RecordStores} the four stores of this server */
  #stores
  /** @type {URL} the address the browser step comes back to */
  #redirectUrl
  /** @type {object} what this client tells a server about itself when it registers */
  #clientMetadata
  /** @type {(url: URL) => unknown} how the browser step leaves this process */
  #handOut

  /**
   * @param {object} options what this provider stands on
   * @param {object} options.credentials the platform's credential service
   * @param {string} options.server the server this provider speaks for
   * @param {URL | string} options.redirectUrl the address the browser step comes back to
   * @param {object} [options.clientMetadata] what to register this client as
   * @param {(url: URL) => unknown} [options.handOut] how the browser step reaches a person
   */
  constructor({ credentials, server, redirectUrl, clientMetadata = {}, handOut = null }) {
    this.#stores = new RecordStores(credentials, server)
    this.#redirectUrl = redirectUrl instanceof URL ? redirectUrl : new URL(String(redirectUrl))
    this.#clientMetadata = clientMetadata
    this.#handOut = handOut
  }

  /** The address the browser step comes back to; its absence selects the non-interactive flow. */
  get redirectUrl() {
    return this.#redirectUrl
  }

  /** What this client tells a server about itself. */
  get clientMetadata() {
    return this.#clientMetadata
  }

  /** The client registration this server holds, or undefined while it holds none. */
  clientInformation() {
    return this.#stores.clientInformation()
  }

  /** Store a client registration. */
  saveClientInformation(client) {
    return this.#stores.saveClientInformation(client)
  }

  /** The tokens this server holds, or undefined while it holds none. */
  tokens() {
    return this.#stores.tokens()
  }

  /** Store tokens. */
  saveTokens(tokens) {
    return this.#stores.saveTokens(tokens)
  }

  /** The verifier of this server's authorization, refused in words when none stands. */
  codeVerifier() {
    return this.#stores.codeVerifier()
  }

  /** Store the verifier of this server's authorization. */
  saveCodeVerifier(value) {
    return this.#stores.saveCodeVerifier(value)
  }

  /** The state this server's browser step was started with, or undefined. */
  state() {
    return this.#stores.state()
  }

  /** Store the state of this server's browser step. */
  saveState(state) {
    return this.#stores.saveState(state)
  }

  /**
   * Hand the browser step to whoever owns it.
   * @param {URL} url the address to open
   * @returns {unknown} what the hand-out answers with
   * @throws {Refusal} `no-redirect` when this provider was built without a way to hand the step out
   */
  redirectToAuthorization(url) {
    if (this.#handOut === null) throw refuse('no-redirect', 'this flow has no browser step to hand out')
    return this.#handOut(url)
  }

  /**
   * Drop what the SDK asks to invalidate.
   * @param {string} scope `client`, `tokens`, `verifier`, `state` or `all`
   * @returns {Promise<void>} when the writes have committed
   */
  invalidateCredentials(scope) {
    return this.#stores.invalidateCredentials(scope)
  }
}
