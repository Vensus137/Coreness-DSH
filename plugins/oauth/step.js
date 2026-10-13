/**
 * The person's step: the platform hands the link out, the platform's own web server takes the callback
 * back, and the flow's core finishes it.
 *
 * The flow is offered to the platform's authorization registry rather than driven from a window of
 * ours: one registration per server, one attempt per key at a time, and the attempt's own session is
 * what a person's surface talks to. The callback's address is computed from the web server's own
 * listening port and never written down, because a profile may bind any port and the OS may assign one.
 *
 * Nothing of the token passes through this file: the code comes back from the platform's own route, the
 * core exchanges it and writes the record, and the record is handed to the platform's commit door as it
 * stands. What is logged is a server's name and a refusal's code — never a code, a token or a secret.
 *
 * The answer a browser lands on is one sentence a person can act on; what the authorization server said
 * and which link of the flow was missing are a reader's business, and they stand on the console's door
 * with the rest of what the step writes.
 *
 * @module @coreness/dsh/plugins/oauth/step
 */

import { CODES, Refusal, refuse } from './refusals.js'
import { keyOf, slugOf } from './stores.js'

/** The route prefix every callback of this plugin stands under. */
export const CALLBACK_PATH = '/oauth/callback'

/** The method name a person's surface selects for the browser step. */
export const METHOD = 'browser'

/** How long one request of an attempt may take before it is read as a server that does not answer. */
export const WIRE_MS = 20_000

/**
 * How long one browser step may wait for its answer before it is read as one that will not come.
 *
 * The wire's deadline is a request's measure and a person is not a server, so the browser step takes a
 * person's own. Ten minutes is longer than any sign-in this product asks for — an account made at the
 * provider, a second factor — and short enough that a step nobody finished ends while the person is still
 * in front of the page. Without it the attempt waits for ever: measured on a live leg, a sign-in started
 * at 00:48 was still waiting fifty-eight minutes later, with the state it kept standing and no tokens.
 */
export const CALLBACK_MS = 600_000

/**
 * The fetch an attempt asks with: the platform's own, with a deadline on every request that brings none.
 *
 * A server that accepts a connection and never answers is a failure of the sign-in like any other, and
 * without a deadline it is the one failure that never arrives: the attempt waits, the person waits with
 * it, and no code is ever written. The deadline turns it into the refusal the discovery already carries
 * — the address could not be reached — so the branch ends in words. A caller that brought its own signal
 * keeps it: a caller withdrawing an attempt is not the deadline's business.
 * @param {number} [ms] the deadline of one request
 * @param {object} [base] the fetch to ask with
 * @returns {object} the fetch
 */
export function wireFetch(ms = WIRE_MS, base = globalThis.fetch) {
  return (address, options = {}) => base(address, options.signal === undefined ? { ...options, signal: AbortSignal.timeout(ms) } : options)
}

/** The path one server's callback stands at, the folded name as its tail. */
export const callbackPathOf = (server) => `${CALLBACK_PATH}/${slugOf(server)}`

/**
 * The server a callback's path names.
 * @param {string} pathname the request's path
 * @returns {string | undefined} the folded name, or undefined when the path is not this plugin's
 */
export function serverOf(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith(`${CALLBACK_PATH}/`)) return undefined
  const tail = pathname.slice(CALLBACK_PATH.length + 1).replace(/\/+$/u, '')
  return tail === '' ? undefined : tail
}

/**
 * The host a browser can reach.
 *
 * A carrier bound to all interfaces answers on the loopback, which is the address a browser on the same
 * machine reaches; a carrier already bound to the loopback is used as it stands.
 * @param {string} host the carrier's own bind host
 * @returns {string} the host to write into an address
 */
export function browserHost(host) {
  return host === '0.0.0.0' || host === '::' || host === undefined || host === '' ? '127.0.0.1' : host
}

/**
 * The address a browser comes back to, computed from the web server's own port.
 *
 * The port read here is the one the carrier is listening on, which is the port the OS assigned when the
 * configuration asked for none. A carrier that is absent or not yet listening is refused in words rather
 * than answered with a guessed port.
 * @param {object} webServer the platform's browser carrier
 * @param {string} server the server's name
 * @returns {string} the redirect address
 * @throws {Refusal} `no-web-server` when the carrier has no listening port to compute from
 */
export function redirectUrlFor(webServer, server) {
  const port = webServer?.port
  if (typeof port !== 'number' || !Number.isInteger(port) || port <= 0) {
    throw refuse('no-web-server', `the carrier reports ${port === undefined ? 'no listening port' : String(port)}`)
  }
  return `http://${browserHost(webServer.host)}:${port}${callbackPathOf(server)}`
}

/**
 * What a callback address carries, read as the wire writes it.
 * @param {string | URL} address the callback's address
 * @returns {object} the code, the state, and whatever refusal the authorization server sent back
 */
export function answerOf(address) {
  const url = address instanceof URL ? address : new URL(String(address), 'http://127.0.0.1')
  const said = (name) => {
    const value = url.searchParams.get(name)
    return value === null ? undefined : value
  }
  return { code: said('code'), state: said('state'), error: said('error'), description: said('error_description') }
}

/**
 * The code inside what a person pasted: the code alone, or the whole callback address with its query.
 * @param {string} pasted what the person handed over
 * @returns {string} the code
 */
export function codeIn(pasted) {
  const text = String(pasted ?? '').trim()
  if (text === '') return ''
  if (!text.includes('?') && !text.includes('code=')) return text
  const url = new URL(text, 'http://127.0.0.1')
  return url.searchParams.get('code') ?? text
}

/**
 * What the page a person returns to says: one sentence for the branch, in the product's voice, and the
 * flow's own code beside a refusal.
 *
 * The words are the branch's own and never the server's: what an authorization server said, or which
 * link of the flow answered nothing, is what the console's door keeps, and the page a person lands on
 * holds what that person can do about it.
 */
export const RETURNED = 'Signed in — go back to the page and close this window.'
/** The answer came back and could not be finished: the person signs in again. */
export const NOT_FINISHED = 'The sign-in did not finish — go back to the page and sign in again.'
/** The answer belongs to a sign-in nothing waits for, so nothing was finished here. */
export const NOT_WAITING = 'This sign-in is not waiting here — go back to the page.'
/** The address is not a callback of this plugin's at all. */
export const ELSEWHERE = 'This is not a sign-in address — go back to the page.'

/**
 * The document one answer carries: one sentence, and the flow's own code under it when a refusal has one.
 *
 * The drawing is the product's own and invents nothing. The tokens are the platform's, named where the
 * platform defines them and never copied into this file — a second copy of a palette ages against the
 * first — and the measures are the page's own roles: a sentence at its 14/22, a code at its 12/18 in the
 * face it gives a code. A document this route answers stands outside the shell that carries those
 * tokens, so where they do not stand the reader's own scheme draws the page rather than a colour of
 * ours; where they do, they are what paints it.
 *
 * Both the sentence and the code are this plugin's own: the code is printed only when it is one of the
 * vocabulary's, so nothing a server or a caller wrote reaches the document.
 * @param {object} answer what the page says
 * @param {string} answer.words the one sentence
 * @param {string} [answer.code] the flow's own code, when a refusal carries one
 * @returns {string} the document
 */
export function pageOf({ words, code } = {}) {
  const named = CODES.includes(code) ? `\n<p class="oauth-code"><code>${code}</code></p>` : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in</title>
<style>
:root{color-scheme:light dark}
body{margin:0;padding:24px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
p{margin:0}
.oauth-code{margin:8px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.oauth-code code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
</style>
</head>
<body>
<main>
<p>${words}</p>${named}
</main>
</body>
</html>
`
}

/**
 * One server's step: its registration with the platform, its callback, and the attempt in flight.
 */
export class PersonStep {
  /** @type {object} the flow's own calls, the core this step drives */
  #flow
  /** @type {object} the platform's credential service */
  #credentials
  /** @type {object} the platform's browser carrier */
  #webServer
  /** @type {object} the platform's authorization registry */
  #registry
  /** @type {object | null} where a step's own lines go */
  #logger
  /** @type {object} the fetch the flow asks with */
  #fetch
  /** @type {number} how long one browser step waits for its answer */
  #callbackMs
  /** @type {Map<string, {promise: Promise<object>, settle: (answer: object) => void}>} the attempts waiting for a callback */
  #waiting = new Map()
  /** @type {Map<string, () => void>} the platform's own disposers, one per registered flow */
  #flows = new Map()
  /** @type {(() => void) | null} the callback route's own disposer */
  #route = null

  /**
   * @param {object} options what this step stands on
   * @param {object} options.flow the core's calls (`begin`, `finish`)
   * @param {object} options.credentials the platform's credential service
   * @param {object} options.webServer the platform's browser carrier
   * @param {object} options.registry the platform's authorization registry
   * @param {object} [options.logger] where a step's own lines go
   * @param {object} [options.fetch] the fetch the flow asks with, with a deadline on every request by default
   * @param {number} [options.callbackMs] how long one browser step waits for its answer
   */
  constructor({ flow, credentials, webServer, registry, logger = null, fetch = wireFetch(), callbackMs = CALLBACK_MS }) {
    this.#flow = flow
    this.#credentials = credentials
    this.#webServer = webServer
    this.#registry = registry
    this.#logger = logger
    this.#fetch = fetch
    this.#callbackMs = callbackMs
  }

  /**
   * Offer one server's sign-in to the platform, and answer the address it comes back to.
   *
   * A second call for the same server answers the same thing and registers nothing again: the registry
   * keeps one flow per key, and a second claim of one key is a refusal of the platform's own.
   * @param {object} request what this sign-in asks for
   * @param {string} request.server the server's name
   * @param {string} request.resource the resource's address, as the row holds it
   * @param {string | null} [request.pointer] what a `401` pointed at, when one was read
   * @param {string} [request.scope] the scopes to ask for
   * @param {string} [request.clientId] a client id the caller already holds
   * @param {string} [request.label] what a surface shows for this flow
   * @returns {{key: string, redirectUrl: string, server: string}} the registration's own facts
   * @throws {Refusal} `no-registry` when no registry stands, or `no-web-server` when no port does
   */
  signIn(request) {
    const server = String(request?.server ?? '')
    if (this.#registry === null || this.#registry === undefined) throw refuse('no-registry', 'no authorization registry stands in this composition')
    const redirectUrl = redirectUrlFor(this.#webServer, server)
    this.#registerRoute()

    const key = keyOf(server, 'tokens')
    if (!this.#flows.has(key)) {
      const dispose = this.#registry.registerFlow({
        key,
        label: typeof request.label === 'string' && request.label !== '' ? request.label : `Sign in to ${server}`,
        methods: [{ id: METHOD, label: 'Open a browser' }],
        run: (session) => this.#run(session, { ...request, server, redirectUrl }),
      })
      this.#flows.set(key, dispose)
    }
    return { key, redirectUrl, server }
  }

  /**
   * Hand one callback's answer to the attempt that waits for it.
   *
   * An answer touches an attempt only by naming the state that attempt stored: the code that finishes it,
   * the authorization server's own refusal that ends it, and the empty answer that ends it all stand under
   * that state. A callback that names nothing, or names another state, or belongs to no attempt of this
   * server, is refused as it stands and leaves the attempt to its own answer — which the step's own
   * deadline bounds, so that "still on its way" cannot be read as "never coming" for ever.
   *
   * Nothing waiting for the server is answered as such before the state is judged: a callback a person's
   * browser reloads lands on a sign-in that has already finished, and that is a fact about the attempt and
   * not about the state the answer carries.
   * @param {object} answer what the callback carried
   * @param {string} answer.server the folded name the path named
   * @param {string} [answer.code] the code
   * @param {string} [answer.state] the state the answer carries
   * @param {string} [answer.error] the refusal's own name, when the server sent one
   * @param {string} [answer.description] the refusal's own words
   * @returns {Promise<object>} what was delivered
   * @throws {Refusal} `provider-refused`, `no-code`, `state-mismatch` or `no-attempt`
   */
  async deliver({ server, code, state, error, description } = {}) {
    const waiting = this.#waiting.get(String(server))
    const matches = state === undefined ? undefined : await this.#stateMatches(server, state)

    if (typeof error === 'string' && error !== '') {
      const refusal = refuse('provider-refused', typeof description === 'string' && description !== '' ? `${error}: ${description}` : error)
      if (waiting !== undefined && matches === true) waiting.fail(refusal)
      throw refusal
    }
    if (typeof code !== 'string' || code === '') {
      const refusal = refuse('no-code', `${callbackPathOf(server)} answered without one`)
      if (waiting !== undefined && matches === true) waiting.fail(refusal)
      throw refusal
    }
    if (waiting === undefined) throw refuse('no-attempt', String(server))
    if (matches !== true) {
      throw refuse('state-mismatch', `${server} — ${state === undefined ? 'the answer carries no state, and this sign-in keeps one' : 'the answer carries another state than the one this sign-in stored'}`)
    }
    waiting.settle({ code, state })
    return { server: String(server), delivered: true }
  }

  /**
   * Whether an answer's state is the one this server's sign-in stored.
   * @param {string} server the server's name
   * @param {string} state the state the answer carried
   * @returns {Promise<boolean>} true when it is the stored one
   */
  async #stateMatches(server, state) {
    const record = await this.#credentials.readRecord(keyOf(server, 'state'))
    const kept = record?.payload?.state
    return typeof kept === 'string' && kept === String(state)
  }

  /**
   * The carrier's own route: read the answer out of the query, hand it to the attempt, and answer the
   * browser with the page this branch's own sentence stands on.
   *
   * A branch that could not be finished names its code on the page and its reason on the console's door:
   * the person reads what to do about it, and a reader who needs the rest finds the refusal's own words
   * and the addresses the flow tried in the log the step already writes.
   * @param {object} request the carrier's request
   * @param {object} response the carrier's response
   * @returns {Promise<void>} when the request has been answered
   */
  async handler(request, response) {
    const url = new URL(request?.url ?? '/', 'http://127.0.0.1')
    const server = serverOf(url.pathname)
    if (server === undefined) {
      this.#answer(response, 404, ELSEWHERE)
      return
    }
    try {
      await this.deliver({ server, ...answerOf(url) })
      this.#answer(response, 200, RETURNED)
    } catch (failure) {
      const code = failure instanceof Refusal ? failure.code : ''
      const words = failure instanceof Error ? failure.message : String(failure)
      this.#logger?.warn?.(`oauth: callback for ${server} was not finished — ${code === '' ? '' : `${code}: `}${words}`)
      this.#answer(response, 400, code === 'no-attempt' ? NOT_WAITING : NOT_FINISHED, code)
    }
  }

  /** Remove the registration, the route and every flow this step offered. */
  dispose() {
    for (const dispose of this.#flows.values()) dispose()
    this.#flows.clear()
    this.#route?.()
    this.#route = null
    for (const waiting of this.#waiting.values()) waiting.settle(undefined)
    this.#waiting.clear()
  }

  /** Register the callback route once, under the carrier's own path space. */
  #registerRoute() {
    if (this.#route !== null) return
    if (this.#webServer === null || this.#webServer === undefined) throw refuse('no-web-server', 'no browser carrier stands in this composition')
    this.#route = this.#webServer.register({
      kind: 'prefix',
      path: CALLBACK_PATH,
      handler: (request, response) => this.handler(request, response),
    })
  }

  /**
   * One attempt: discover and keep what the exchange needs, hand the link out, wait for the answer from
   * either door, finish the flow, and hand the record that stands to the platform's own commit door.
   * @param {object} session the platform's own session for this attempt
   * @param {object} request what the sign-in asked for
   * @returns {Promise<void>} when the attempt is settled
   */
  async #run(session, request) {
    const { server, resource, redirectUrl } = request
    try {
      const started = await this.#flow.begin({
        server,
        resource,
        redirectUrl,
        pointer: request.pointer ?? null,
        scope: request.scope ?? '',
        clientId: request.clientId ?? '',
        fetch: this.#fetch,
      })
      this.#logger?.info?.(`oauth: sign-in for ${server} is waiting for an answer at ${redirectUrl}`)
      session.notify({ message: `${server} asks you to sign in`, url: started.url })

      const answer = await this.#waitFor(server, session, redirectUrl)
      const tokens = await this.#flow.finish({
        server,
        resource,
        redirectUrl,
        code: answer.code,
        state: answer.state,
        pointer: request.pointer ?? null,
        clientId: request.clientId ?? '',
        fetch: this.#fetch,
      })
      void tokens

      const record = await this.#credentials.readRecord(keyOf(server, 'tokens'))
      if (record === undefined) throw refuse('no-attempt', `${server} committed no record to hand over`)
      await session.commit(record)
      this.#logger?.info?.(`oauth: sign-in for ${server} finished`)
    } catch (failure) {
      /* The attempt is over and no answer of its own can come any more. The core takes the state back when
         it has the answer in hand; every other end of an attempt — a deadline that ran out, a withdrawal, a
         wire that refused, a registration refused before the browser was ever sent — is this one. */
      await this.#abandonState(server)
      throw failure
    }
  }

  /**
   * Take back the state an attempt kept, because that attempt is over.
   *
   * A store that will not give it back is a line on the console's door rather than the failure the person
   * reads: the attempt's own end is the fact a caller branches on, and it is not replaced by the seam's.
   * @param {string} server the server whose attempt ended
   * @returns {Promise<void>} when the record has been asked back
   */
  async #abandonState(server) {
    try {
      await this.#flow.stores(server).write('state', undefined)
    } catch (beside) {
      this.#logger?.warn?.(`oauth: the state of ${server} was not taken back — ${beside instanceof Error ? beside.message : String(beside)}`)
    }
  }

  /**
   * Wait for the code from whichever door answers first: the platform's callback route, a person who pasted
   * what the browser showed them, or the deadline that reads silence as an answer nobody will send.
   * @param {string} server the server's name
   * @param {object} session the platform's own session for this attempt
   * @param {string} redirectUrl the address the browser was told to come back to
   * @returns {Promise<{code: string, state?: string}>} the answer
   */
  async #waitFor(server, session, redirectUrl) {
    let settle
    let fail
    const promise = new Promise((resolve, reject) => {
      settle = resolve
      fail = reject
    })
    const waiting = { promise, settle, fail }
    this.#waiting.set(slugOf(server), waiting)
    const deadline = this.#deadline(redirectUrl)
    try {
      const pasted = this.#prompt(session, server)
      const answer = await Promise.race([promise, pasted, deadline.promise])
      if (answer === undefined) throw refuse('cancelled', server)
      if (answer instanceof Refusal) throw answer
      return answer
    } finally {
      deadline.stop()
      this.#waiting.delete(slugOf(server))
    }
  }

  /**
   * The browser step's own deadline: the one end of an attempt a person cannot reach by acting.
   *
   * A tab closed, a provider that never redirects, a callback that lands where nothing answers — the flow
   * cannot tell any of them from an answer still on its way, so only time can. The refusal names the address
   * that was waited at, which is what tells a reader which door stayed shut; the address is the flow's own
   * and carries no code, so nothing of the answer travels with it.
   * @param {string} redirectUrl the address the browser was told to come back to
   * @returns {{promise: Promise<object>, stop: () => void}} the deadline, and its own canceller
   */
  #deadline(redirectUrl) {
    let timer = null
    const promise = new Promise((resolve) => {
      timer = setTimeout(() => resolve(refuse('no-callback', redirectUrl)), this.#callbackMs)
    })
    timer.unref?.()
    return {
      promise,
      stop: () => {
        if (timer !== null) clearTimeout(timer)
      },
    }
  }

  /** The paste door, when the platform's surface offers one; a closed door never wins the race. */
  #prompt(session, server) {
    try {
      return session
        .prompt({
          kind: 'secret',
          message: `Paste the code for ${server} if the browser did not come back by itself`,
          signal: session.signal,
        })
        .then((value) => {
          const code = codeIn(value)
          return code === '' ? undefined : { code }
        })
        .catch(() => undefined)
    } catch {
      return new Promise(() => {})
    }
  }

  /**
   * Answer an HTTP request with the page a person reads, under the two headers a page a browser lands on
   * carries.
   *
   * `no-store` and `no-referrer` are the branch's own price: the address this route answers at holds the
   * code the authorization server sent, and a stored copy of the answer, or a copy that carries the
   * address onward, would outlive the sign-in it belongs to.
   * @param {object} response the carrier's response
   * @param {number} status the status this branch answers with
   * @param {string} words the branch's one sentence
   * @param {string} [code] the flow's own code, when a refusal carries one
   * @returns {void}
   */
  #answer(response, status, words, code = '') {
    if (response === null || response === undefined) return
    if (typeof response.writeHead === 'function') {
      response.writeHead(status, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
      })
    }
    if (typeof response.end === 'function') response.end(pageOf({ words, code }))
  }
}
