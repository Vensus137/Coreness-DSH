/**
 * The page's own door into a server's sign-in: whether the flow can run on a row, and the attempt a press starts.
 *
 * The platform runs the flow and commits the record; what this file owns is the two ends a browser needs.
 * The first is the precondition — a row is offered a control only where the flow can actually run, and that
 * is settled by the flow's own discovery against the row's own address: a `401`'s pointer read by the
 * flow's rule, then the metadata of the authorization server it names. A server that answers nothing, or
 * answers without a door, is offered nothing rather than a button that cannot work.
 *
 * The second is the interaction. The platform's registry carries the interaction **with the request** and
 * not in a registry of its own, so whoever starts an attempt is the one who must reach the person: the
 * notice carrying the link and the question the flow cannot answer for itself arrive here and are held for
 * the page to draw, and the answer a person types comes back through this file. Nothing of a token, a code
 * or a secret is kept here beyond forwarding it: the attempt's record holds what a surface draws.
 *
 * An attempt lives in this process and only while the flow that runs it stands. A read that finds the flow
 * gone closes the attempt as `signin-lost` rather than leaving a surface waiting for an answer that no
 * longer has a question behind it.
 *
 * @module @coreness/oauth/src/signin
 */

/** The actions this door takes, and the one place they are named. */
export const ACTIONS = ['sign-ins', 'sign-in', 'answer', 'cancel', 'forget']

/** How long one request of a probe may take before the address is read as a server that does not answer. */
export const PROBE_MS = 4000

/** How long a probe's answer stands before the address is asked again — long enough that a page's own
    repeated reads do not knock on a server, short enough that a server which came up is seen. */
export const PROBE_HOLD_MS = 60_000

/**
 * The refusals of this door, each with the words the page draws.
 *
 * The flow's own codes are not listed here: they arrive from the attempt as they are, and the page draws
 * its own sentence for each of them. These are the failures of the door itself, which the flow never sees —
 * and they are spelled apart from the codes of the servers route beside this one, because two vocabularies
 * sharing a word would leave one of them drawing the other's sentence.
 */
export const OWN_CODES = ['signin-action', 'signin-body', 'signin-lost', 'signin-failed']

/** A refusal of this door: a code the page branches on and a sentence a person reads. */
export class Refused extends Error {
  /**
   * @param {string} code one of `OWN_CODES`
   * @param {string} message what happened
   */
  constructor(code, message) {
    super(message)
    this.name = 'Refused'
    this.code = code
  }
}

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/** Whether a value is a stored grant with a token in it. */
const tokenIn = (tokens) => typeof tokens?.access_token === 'string' && tokens.access_token !== ''

/**
 * One page's sign-ins: the precondition of each row, and the attempt each press starts.
 *
 * The flow and the registry are read through thunks rather than held: a composition may reload either of
 * them while this desk stands, and a held reference would then answer for a plugin that is gone — the same
 * reason the flow itself resolves its own services per call.
 */
export class SignInDesk {
  /** @type {() => object | undefined} the flow, as it stands at the call */
  #flow
  /** @type {() => object | undefined} the platform's authorization registry, as it stands at the call */
  #registry
  /** @type {object} the fetch a probe asks with */
  #fetch
  /** @type {() => number} the clock, handed in so a case can hold a probe's age */
  #now
  /** @type {Map<string, {at: number, possible: boolean, pointer: string | null, why: string}>} probes, by server and address */
  #probes = new Map()
  /** @type {Map<string, object>} the attempts, by server */
  #attempts = new Map()

  /**
   * @param {object} options what this desk stands on
   * @param {() => object | undefined} options.flow the flow service, read at every call
   * @param {() => object | undefined} options.registry the platform's authorization registry, read at every call
   * @param {object} [options.fetch] the fetch a probe asks with
   * @param {() => number} [options.now] the clock
   */
  constructor({ flow, registry, fetch = globalThis.fetch, now = Date.now }) {
    this.#flow = flow
    this.#registry = registry
    this.#fetch = fetch
    this.#now = now
  }

  /** Whether a sign-in can be run in this composition at all. */
  get available() {
    const flow = this.#flow()
    return typeof flow?.signIn === 'function' && typeof flow?.discover === 'function' && typeof flow?.stores === 'function'
  }

  /**
   * What stands for each row: whether a control may be drawn, whether a grant stands, and the attempt's own state.
   *
   * The rows are settled together and not one after another: a probe is a request to somebody else's server
   * and is bounded by `PROBE_MS`, so a page with five rows would otherwise hold its own read open for five
   * deadlines while every card waited for a control. The answers keep the order they were asked in.
   * @param {object[]} rows the rows to answer about
   * @returns {Promise<object[]>} one answer per row, in the order asked
   */
  async states(rows) {
    const asked = Array.isArray(rows) ? rows : []
    return Promise.all(asked.map((row) => this.#stateOf(row)))
  }

  /**
   * Start the sign-in of one server, or answer the attempt already running for it.
   * @param {object} request the row's own facts
   * @param {string} request.server the server's name
   * @param {string} request.resource the row's address
   * @param {string | null} [request.entryId] the row's entry, so the answer names the row it belongs to
   * @returns {Promise<object>} the attempt's state
   * @throws {Refused} `signin-failed` when nothing can run the sign-in
   */
  async start({ server, resource, entryId = null } = {}) {
    const name = String(server ?? '')
    if (name === '') throw new Refused('signin-body', 'a sign-in is started for a server, and this request names none')
    const held = this.#attempts.get(name)
    if (held !== undefined && held.state === 'waiting') return this.#stateOf({ entryId: held.entryId, server: name, resource: held.resource })
    const flow = this.#flow()
    if (flow === undefined) throw new Refused('signin-failed', 'this composition carries no OAuth flow, so no sign-in can run')
    if (typeof flow.signIn !== 'function') throw new Refused('signin-failed', 'this composition has no authorization registry, so no sign-in can be offered to a person')
    const address = String(resource ?? '')
    if (address === '') throw new Refused('signin-body', `the row of ${name} carries no address, so there is nothing to discover a door at`)

    const pointer = this.#probes.get(this.#keyOf(name, address))?.pointer ?? null
    const registered = flow.signIn({ server: name, resource: address, pointer })
    const attempt = {
      server: name,
      entryId: entryId ?? null,
      resource: address,
      key: registered.key,
      state: 'waiting',
      url: null,
      message: null,
      code: null,
      prompt: null,
      settle: null,
      abandon: null,
      controller: new AbortController(),
    }
    this.#attempts.set(name, attempt)

    /* The attempt is not awaited here: the person's browser step outlives this request, and the page
       follows the record. Its outcome is what the record keeps — nothing else observes it. */
    void this.#registry().begin({
      key: registered.key,
      signal: attempt.controller.signal,
      interaction: {
        notify: (notice) => {
          if (typeof notice?.message === 'string') attempt.message = notice.message
          if (typeof notice?.url === 'string') attempt.url = notice.url
        },
        prompt: (question) => this.#asked(attempt, question),
      },
    }).then(
      (outcome) => {
        if (outcome?.status === 'authorized') {
          attempt.state = 'authorized'
          attempt.prompt = null
          attempt.settle = null
          attempt.abandon = null
          return
        }
        if (attempt.state === 'waiting') attempt.state = 'cancelled'
      },
      (error) => {
        /* A withdrawal is the person's own act and its outcome is already written; an error arriving
           after it is the flow settling late and does not overwrite what the person did. */
        if (attempt.state === 'cancelled') return
        attempt.state = 'refused'
        attempt.code = typeof error?.code === 'string' ? error.code : 'signin-failed'
        attempt.message = reasonOf(error)
        attempt.prompt = null
        this.#abandon(attempt, error)
      },
    )
    return this.#stateOf({ entryId: attempt.entryId, server: name, resource: address })
  }

  /**
   * Hand a person's answer to the question the flow asked.
   * @param {object} request the answer
   * @param {string} request.server the server whose attempt asked
   * @param {string} request.value what the person typed
   * @returns {Promise<object>} the attempt's state
   * @throws {Refused} `no-attempt` when no question of that server waits for an answer
   */
  async answer({ server, value } = {}) {
    const name = String(server ?? '')
    const attempt = this.#attempts.get(name)
    if (attempt === undefined || typeof attempt.settle !== 'function') {
      throw new Refused('no-attempt', `no question of ${name === '' ? 'a server' : name} is waiting for an answer`)
    }
    const settle = attempt.settle
    attempt.settle = null
    attempt.abandon = null
    attempt.prompt = null
    settle(String(value ?? ''))
    return this.#stateOf({ entryId: attempt.entryId, server: name, resource: attempt.resource })
  }

  /**
   * Withdraw the attempt of one server, through the platform's own door.
   * @param {object} request the withdrawal
   * @param {string} request.server the server whose attempt is withdrawn
   * @returns {Promise<object>} the attempt's state
   * @throws {Refused} `no-attempt` when nothing runs for that server
   */
  async cancel({ server } = {}) {
    const name = String(server ?? '')
    const attempt = this.#attempts.get(name)
    if (attempt === undefined) throw new Refused('no-attempt', `no sign-in of ${name === '' ? 'a server' : name} is running here`)
    if (attempt.state === 'waiting') {
      attempt.state = 'cancelled'
      attempt.code = 'cancelled'
      attempt.message = this.#flow()?.words?.cancelled ?? null
      this.#abandon(attempt, new Refused('cancelled', 'the sign-in was withdrawn'))
    }
    const registry = this.#registry()
    if (registry !== undefined && typeof registry.cancel === 'function') registry.cancel(attempt.key)
    return this.#stateOf({ entryId: attempt.entryId, server: name, resource: attempt.resource })
  }

  /**
   * Drop what the flow holds for one server, before the row that carried it goes.
   *
   * A row is removed from the person's own servers file, and the grant it signed in with would outlive the row
   * it belonged to: the store would keep a token nothing names, and the next row written under that name would
   * silently inherit a sign-in nobody made. The dropping is the flow's own act — this desk never reaches into
   * the store itself — and it is asked **before** the write that takes the row away, so a row added again is
   * signed in again.
   *
   * A composition whose flow carries no such half answers `dropped: []` rather than refusing: the servers file
   * is the person's own, and a grant that could not be dropped is not a reason to hold their press. An attempt
   * of that server is closed with it — the row it belonged to is going, and a question nothing will answer must
   * not keep the flow waiting.
   * @param {object} request the row that is going
   * @param {string} request.server the server's name
   * @returns {Promise<{server: string, dropped: string[]}>} what the flow dropped
   * @throws {Refused} `signin-body` when the request names no server
   */
  async forget({ server } = {}) {
    const name = String(server ?? '')
    if (name === '') throw new Refused('signin-body', 'a grant is dropped for a named server, and this request names none')
    const flow = this.#flow()
    const drop = typeof flow?.forget === 'function' ? flow.forget.bind(flow) : null
    const answer = drop === null ? { server: name, dropped: [] } : await drop(name)
    const attempt = this.#attempts.get(name)
    if (attempt !== undefined) {
      this.#abandon(attempt, new Refused('cancelled', `the row of ${name} is gone, so nothing is waiting for this sign-in any more`))
      this.#attempts.delete(name)
    }
    for (const key of [...this.#probes.keys()]) {
      if (key.startsWith(`${name}\u0000`)) this.#probes.delete(key)
    }
    return { server: name, dropped: Array.isArray(answer?.dropped) ? answer.dropped : [] }
  }

  /** Close every attempt, withdraw every prompt, and forget every probe. */
  dispose() {
    for (const attempt of this.#attempts.values()) {
      attempt.controller.abort()
      this.#abandon(attempt, new Refused('cancelled', 'the page that asked for this sign-in is gone'))
      if (attempt.state === 'waiting') {
        attempt.state = 'cancelled'
        attempt.code = 'cancelled'
      }
    }
    this.#attempts.clear()
    this.#probes.clear()
  }

  /**
   * What stands for one row.
   * @param {object} row the row's own facts
   * @returns {Promise<object>} the answer
   */
  async #stateOf(row) {
    const server = String(row?.server ?? '')
    const entryId = row?.entryId ?? null
    const resource = String(row?.resource ?? '')
    const available = this.available
    if (server === '') return { entryId, server, available, possible: false, grant: false, state: null, url: null, code: null, message: null, prompt: null, reference: null }
    const attempt = this.#attempts.get(server)
    /* The flow that ran an attempt is what makes the attempt real: a read that finds it gone closes the
       attempt rather than answering a wait nothing can end. */
    if (attempt !== undefined && !available && attempt.state === 'waiting') {
      attempt.state = 'cancelled'
      attempt.code = 'signin-lost'
      attempt.message = 'the plugin that was running this sign-in is gone, so nothing is waiting for an answer any more'
      this.#abandon(attempt, new Refused('signin-lost', attempt.message))
    }
    const grant = available ? await this.#grantOf(server) : false
    const reference = grant ? this.#flow().reference(server) : null
    if (attempt !== undefined) {
      return {
        entryId: attempt.entryId ?? entryId,
        server,
        available,
        /* A control is offered again after a refusal or a withdrawal, and only while the flow stands to run
           it: `available` is not implied by an attempt that is over, and a control whose press could only be
           refused is the dead button this door exists to keep off the page. */
        possible: available && (attempt.state === 'refused' || attempt.state === 'cancelled'),
        grant,
        state: attempt.state,
        url: attempt.url,
        code: attempt.code,
        message: attempt.message,
        prompt: attempt.prompt === null ? null : { kind: attempt.prompt.kind, message: attempt.prompt.message, placeholder: attempt.prompt.placeholder ?? null },
        reference,
      }
    }
    if (!available) return { entryId, server, available, possible: false, grant, state: null, url: null, code: null, message: null, prompt: null, reference }
    if (grant) return { entryId, server, available, possible: false, grant: true, state: null, url: null, code: null, message: null, prompt: null, reference }
    const probed = resource === '' ? { possible: false, why: 'the row carries no address' } : await this.#probe(server, resource)
    return { entryId, server, available, possible: probed.possible, grant: false, state: null, url: null, code: null, message: null, prompt: null, why: probed.why, reference: null }
  }

  /**
   * Whether a grant stands for one server.
   * @param {string} server the server's name
   * @returns {Promise<boolean>} whether a token stands in the store
   */
  async #grantOf(server) {
    const tokens = await this.#flow().stores(server).tokens()
    return tokenIn(tokens)
  }

  /**
   * Settle a question the flow asked, and keep it for the page to draw.
   * @param {object} attempt the attempt
   * @param {object} question the flow's own question
   * @returns {Promise<string>} what the person answers
   */
  #asked(attempt, question) {
    const previous = attempt.abandon
    if (typeof previous === 'function') previous(new Refused('cancelled', 'the question was replaced by another'))
    attempt.prompt = {
      kind: typeof question?.kind === 'string' ? question.kind : 'text',
      message: typeof question?.message === 'string' ? question.message : '',
      placeholder: typeof question?.placeholder === 'string' ? question.placeholder : null,
    }
    return new Promise((resolve, reject) => {
      attempt.settle = resolve
      attempt.abandon = reject
    })
  }

  /** Refuse a question that will never be answered, so the flow does not wait on a person who is gone. */
  #abandon(attempt, error) {
    const abandon = attempt.abandon
    attempt.settle = null
    attempt.abandon = null
    attempt.prompt = null
    if (typeof abandon === 'function') abandon(error)
  }

  /**
   * Whether the flow can run at one address, by the flow's own discovery.
   *
   * The address is asked first, because the standard's first habit is the pointer a `401` carries and a
   * server whose document stands only at the address it named is invisible to the well-known address
   * alone. The answer is held for `PROBE_HOLD_MS`: a page reads again while a row is moving, and a probe
   * per read would knock on somebody's server once a second.
   * @param {string} server the server's name
   * @param {string} resource the row's address
   * @returns {Promise<{possible: boolean, pointer: string | null, why: string}>} what stands
   */
  async #probe(server, resource) {
    const key = this.#keyOf(server, resource)
    const held = this.#probes.get(key)
    if (held !== undefined && this.#now() - held.at < PROBE_HOLD_MS) return held
    const answer = await this.#look(resource)
    this.#probes.set(key, { at: this.#now(), ...answer })
    return answer
  }

  /**
   * Ask one address whether the flow can run there.
   * @param {string} resource the row's address
   * @returns {Promise<{possible: boolean, pointer: string | null, why: string}>} what stands
   */
  async #look(resource) {
    const flow = this.#flow()
    const signal = AbortSignal.timeout(PROBE_MS)
    const bounded = (address, options = {}) => this.#fetch(address, options.signal === undefined ? { ...options, signal } : options)
    let pointer = null
    let why = ''
    try {
      const answer = await bounded(resource, {
        method: 'POST',
        headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
        body: '{}',
      })
      if (answer?.status === 401 && typeof flow.pointerOf === 'function') pointer = flow.pointerOf(answer)
    } catch (error) {
      why = `${resource} did not answer (${reasonOf(error)})`
    }
    try {
      const found = await flow.discover(resource, { pointer, fetch: bounded })
      return { possible: true, pointer, why, issuer: found.issuer }
    } catch (error) {
      return { possible: false, pointer, why: why === '' ? reasonOf(error) : `${why}; ${reasonOf(error)}` }
    }
  }

  /** The key a probe's answer stands under: one server at one address. */
  #keyOf(server, resource) {
    return `${server}\u0000${resource}`
  }
}
