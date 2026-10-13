/**
 * The gate's arithmetic: what a request is expected to cost, what it did cost, and the windows of the
 * models it holds.
 *
 * Nothing here knows the platform. The clock, the timers and the place complaints are written to are handed
 * in, so all of the accounting is decided by a deterministic run — the tests drive it with a clock of their
 * own — and the plugin's own registration keeps only the joint with the platform's `llm/stream`.
 *
 * **A reservation before the send, the fact after it.** Nothing knows a request's token cost before the
 * answer — the build carries no tokenizer, and the harness's own meter prices text as four characters per
 * token plus block and role overhead — so a request is reserved at that estimate times a factor calibrated
 * from the pairs already settled, plus an output reserve. The provider's own `usage` replaces the
 * reservation the moment it arrives, and a stream that carries none leaves the reservation standing until
 * the window ages it out: the input of a request that reached the vendor is spent whether or not an answer
 * came back.
 *
 * **A sliding window, and a queue whose only head is admitted.** A tokens-per-minute ceiling is a rolling
 * budget, so entries carry their own moment and leave the window as they age. Only the head of a model's
 * queue is admitted, so no request overtakes another and none starves, and the wake is armed for the moment
 * the window frees rather than for a poll interval.
 *
 * **A ceiling on the wait, and a way past it that is visible.** Waiting a whole window always empties the
 * window, so a longer wait cannot make room for anything but a request larger than the ceiling itself. A
 * request whose ceiling on the wait is spent is sent anyway and marked `forced`, and a request larger than
 * the whole ceiling waits only until the window is empty and then goes, marked `oversize`: a named
 * overspend beats a hung turn and a lost step alike.
 *
 * **A model with no row is not the ledger's business.** The engine holds one state per configured pair and
 * nothing else; the caller asks `holds()` before it wraps anything, and a pair the rows do not name reaches
 * the adapter through the caller untouched.
 *
 * @module @coreness/dsh/plugins/rate-gate/gate
 */

const BASE64_DATA_URL = /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/iu;

/** The floor on a wake, so a timer that is armed for "almost now" is still a timer. */
const MIN_WAKE_MS = 20;

/** How many decisions of one model the snapshot carries: the page explains the latest ones by them. */
const RECENT_LIMIT = 6;

/** The numbers the gate runs at when the row names none of them. Every one is moved from the row. */
export const DEFAULTS = Object.freeze({
  windowMs: 60_000,
  maxWaitMs: 60_000,
  dryRun: false,
  thresholdRatio: 0.9,
  charsPerToken: 4,
  blockOverheadTokens: 4,
  imageTokens: 1_000,
  outputReserveTokens: 4_096,
  maxOutputReserveTokens: 8_192,
  calibrationAlpha: 0.25,
  maxEstimateFactor: 5,
})

/** The bounds a plugin-level number is held inside, with the reason each bound exists. */
export const BOUNDS = Object.freeze({
  windowMs: { min: 1_000, max: 24 * 60 * 60 * 1000 },
  maxWaitMs: { min: 0, max: 24 * 60 * 60 * 1000 },
  charsPerToken: { min: 1, max: 16 },
  blockOverheadTokens: { min: 0, max: 1_000 },
  imageTokens: { min: 0, max: 100_000 },
  outputReserveTokens: { min: 0, max: 1_000_000 },
  maxOutputReserveTokens: { min: 0, max: 1_000_000 },
  maxEstimateFactor: { min: 1, max: 100 },
})

/** The pair a limit is attached to, in one string: the platform's own identity is the two together. */
export function keyOf(provider, model) {
  return JSON.stringify([provider, model])
}

/** A finite number, or nothing at all: how every value handed in from a row is read. */
function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * A plugin-level number, held inside its bounds.
 *
 * A value outside them is not obeyed and not hidden: the number that is used instead, and the number
 * the row asked for, both go to the place complaints are written. A row cannot be refused here for the
 * reason a row of limits can: the plugin needs a window to exist at all, and a plugin that fails its
 * schema is not mounted, which would take its settings namespace away with it and leave the user no
 * form to repair the number from.
 * @param {unknown} value the row's own value
 * @param {string} name the field, as the row spells it
 * @param {number} fallback the number to run at when the row's is unusable
 * @param {{min: number, max: number}} bounds what the field may be
 * @param {(message: string) => void} warn where a substituted number is said
 * @returns {number} the number to run at
 */
function bounded(value, name, fallback, bounds, warn) {
  const asked = finite(value)
  if (asked === undefined) {
    if (value !== undefined) warn(`${name} is not a number (${JSON.stringify(value)}): running at ${fallback}`)
    return fallback
  }
  if (asked < bounds.min) {
    warn(`${name} is ${asked}, under the floor of ${bounds.min}: running at ${bounds.min}`)
    return bounds.min
  }
  if (asked > bounds.max) {
    warn(`${name} is ${asked}, over the ceiling of ${bounds.max}: running at ${bounds.max}`)
    return bounds.max
  }
  return asked
}

/**
 * The numbers one decision runs at, read from the row as it stands at that moment.
 *
 * Read per decision and never captured at the mount: the fields are volatile, the page writes them
 * while the route runs, and a gate that kept the numbers it started with would obey a form nobody
 * could see it ignoring.
 * @param {object} config the row's config, resolved by the Loader against the plugin's schema
 * @param {(message: string) => void} [warn] where a substituted number is said
 * @returns {{settings: object, rows: object[], refused: object[]}} the numbers, the usable rows, and the rows refused with their reason
 */
export function resolveSettings(config = {}, warn = () => {}) {
  const settings = {
    windowMs: bounded(config.windowMs, 'windowMs', DEFAULTS.windowMs, BOUNDS.windowMs, warn),
    maxWaitMs: bounded(config.maxWaitMs, 'maxWaitMs', DEFAULTS.maxWaitMs, BOUNDS.maxWaitMs, warn),
    dryRun: config.dryRun === undefined ? DEFAULTS.dryRun : config.dryRun === true,
    thresholdRatio: ratioOf(config.thresholdRatio, DEFAULTS.thresholdRatio, 'thresholdRatio', warn),
    charsPerToken: bounded(config.charsPerToken, 'charsPerToken', DEFAULTS.charsPerToken, BOUNDS.charsPerToken, warn),
    blockOverheadTokens: bounded(config.blockOverheadTokens, 'blockOverheadTokens', DEFAULTS.blockOverheadTokens, BOUNDS.blockOverheadTokens, warn),
    imageTokens: bounded(config.imageTokens, 'imageTokens', DEFAULTS.imageTokens, BOUNDS.imageTokens, warn),
    outputReserveTokens: bounded(config.outputReserveTokens, 'outputReserveTokens', DEFAULTS.outputReserveTokens, BOUNDS.outputReserveTokens, warn),
    maxOutputReserveTokens: bounded(config.maxOutputReserveTokens, 'maxOutputReserveTokens', DEFAULTS.maxOutputReserveTokens, BOUNDS.maxOutputReserveTokens, warn),
    calibrationAlpha: ratioOf(config.calibrationAlpha, DEFAULTS.calibrationAlpha, 'calibrationAlpha', warn),
    maxEstimateFactor: bounded(config.maxEstimateFactor, 'maxEstimateFactor', DEFAULTS.maxEstimateFactor, BOUNDS.maxEstimateFactor, warn),
  }
  const { rows, refused } = resolveRows(config.limits, settings, warn)
  return { settings, rows, refused }
}

/**
 * The caution ratio of one row: the ceiling the row's own number is spent to, and never more than it.
 * @param {unknown} value the row's own value
 * @param {number} fallback the plugin's own ratio
 * @param {string} name the field, as the row spells it
 * @param {(message: string) => void} warn where a substituted number is said
 * @returns {number} the ratio to run at
 */
function ratioOf(value, fallback, name, warn) {
  const asked = finite(value)
  if (asked === undefined) {
    if (value !== undefined) warn(`${name} is not a number (${JSON.stringify(value)}): running at ${fallback}`)
    return fallback
  }
  if (asked <= 0 || asked > 1) {
    warn(`${name} is ${asked}, outside (0, 1]: running at ${asked > 1 ? 1 : fallback}`)
    return asked > 1 ? 1 : fallback
  }
  return asked
}

/** A name a row has to carry, or the reason it cannot be used. */
function nameOf(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * The rows that can be run, and the rows that cannot, each with the reason it was refused.
 *
 * A refused row is never replaced by a guess: a row with no ceiling, no provider or no model limits
 * nothing, and a pair named twice is one pair — the first row stands and the second is named. The
 * reasons travel to the log at the mount and to the page in the gate's own answer, because a limit
 * the gate silently ignored would look exactly like a limiter that does not work.
 * @param {unknown} limits the row's own `limits`
 * @param {object} settings the plugin-level numbers, which a row without its own follows
 * @param {(message: string) => void} warn where a refused row is said
 * @returns {{rows: object[], refused: object[]}} the rows to run, and the refusals
 */
export function resolveRows(limits, settings, warn = () => {}) {
  const rows = []
  const refused = []
  const seen = new Set()
  if (limits !== undefined && !Array.isArray(limits)) {
    warn(`limits is not a list (${JSON.stringify(limits)}): no model is limited by it`)
    return { rows, refused }
  }
  for (const [index, row] of (limits ?? []).entries()) {
    const at = `limits[${index}]`
    const provider = nameOf(row?.provider)
    const model = nameOf(row?.model)
    const where = provider === '' && model === '' ? at : `${at} ${provider === '' ? '?' : provider}/${model === '' ? '?' : model}`
    const refuse = (reason) => {
      refused.push({ provider, model, reason })
      warn(reason)
    }
    if (provider === '') {
      refuse(`${where}: the row names no provider`)
      continue
    }
    if (model === '') {
      refuse(`${where}: the row names no model`)
      continue
    }
    const tokensPerMinute = finite(row?.tokensPerMinute)
    if (tokensPerMinute === undefined || tokensPerMinute <= 0) {
      refuse(`${where}: tokensPerMinute must be a positive number, it is ${JSON.stringify(row?.tokensPerMinute)}`)
      continue
    }
    const key = keyOf(provider, model)
    if (seen.has(key)) {
      refuse(`${where}: ${provider}/${model} is named more than once, the first row stands`)
      continue
    }
    seen.add(key)
    const thresholdRatio = row?.thresholdRatio === undefined
      ? settings.thresholdRatio
      : ratioOf(row.thresholdRatio, settings.thresholdRatio, `${where}.thresholdRatio`, warn)
    const dryRun = row?.dryRun === undefined ? settings.dryRun : row.dryRun === true
    rows.push({
      provider,
      model,
      tokensPerMinute,
      thresholdRatio,
      dryRun,
      /** The allowance the gate actually runs at: the row's ceiling, cautious by its own ratio. */
      ceiling: Math.max(1, Math.floor(tokensPerMinute * thresholdRatio)),
    })
  }
  return { rows, refused }
}

/** Walk a request's text and blocks, adding up what the platform's own heuristic would price. */
function collect(value, acc, depth = 0) {
  if (depth > 24) return
  if (typeof value === 'string') {
    acc.chars += value.length
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collect(item, acc, depth + 1)
    return
  }
  if (value === null || typeof value !== 'object') return
  if (typeof value.type === 'string') {
    acc.blocks += 1
    /* A picture is a block of its own kind in the platform's vocabulary — `{type:'image', attachment}`
       — and its price is not derivable from the request, so it is reserved at a flat figure and
       settled by the fact like everything else. */
    if (value.type === 'image') acc.images += 1
  }
  for (const [key, item] of Object.entries(value)) {
    /* The platform's own vocabulary is not text: the kind of a block is priced by the block overhead
       below, and the role of a message the same way — the harness's own heuristic counts characters
       "plus block and role overhead" and not the length of the word `user`. Everything else a request
       carries is priced as the text the vendor will be sent. */
    if (key === 'type' || key === 'role') continue
    /* A caller of our own may write the picture's bytes into the request instead of a reference. */
    if (typeof item === 'string' && BASE64_DATA_URL.test(item)) {
      acc.images += 1
      continue
    }
    collect(item, acc, depth + 1)
  }
}

/**
 * What one request is expected to cost in input tokens.
 * @param {object} request the call's own options
 * @param {object} settings the numbers the estimate runs at
 * @returns {number} the estimate
 */
export function estimateRequestTokens(request, settings) {
  const acc = { chars: 0, blocks: 0, images: 0 }
  collect(request.system, acc)
  collect(request.messages, acc)
  collect(request.tools, acc)
  collect(request.toolHistory, acc)
  return Math.ceil(acc.chars / settings.charsPerToken)
    + acc.blocks * settings.blockOverheadTokens
    + acc.images * settings.imageTokens
}

/**
 * What the answer may add on top of the input.
 *
 * The request's own declared budget when it carries one, held under the plugin's ceiling: `maxTokens`
 * is not a bound the vendor honours on every route, so the reserve is a figure to
 * argue with rather than a promise, and the fact replaces it.
 * @param {object} request the call's own options
 * @param {object} settings the numbers the reserve runs at
 * @returns {number} the reserve
 */
export function outputReserve(request, settings) {
  const declared = finite(request.maxTokens)
  const wanted = declared !== undefined && declared >= 0 ? declared : settings.outputReserveTokens
  return Math.min(wanted, settings.maxOutputReserveTokens)
}

/** A count of tokens in a usage, treating anything absent or unusable as nothing. */
function count(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * What one request did cost, as the platform's own accounting reads it.
 *
 * The harness sums the four buckets — uncached input, output, cache read, cache write — while a route
 * may instead answer a `totalTokens` that
 * covers them; the larger of the two is taken, because the one number that cannot undercount is the
 * only honest charge for a ceiling.
 * @param {object} usage the `usage` chunk's own usage
 * @returns {number | undefined} the charge, or nothing when the usage carries no count at all
 */
export function chargedTokens(usage) {
  if (usage === null || typeof usage !== 'object') return undefined
  const sum = count(usage.inputTokens) + count(usage.outputTokens) + count(usage.cacheReadTokens) + count(usage.cacheWriteTokens)
  const charged = Math.max(sum, count(usage.totalTokens))
  return charged > 0 ? Math.ceil(charged) : undefined
}

/**
 * The input a settled charge proves, which is what the estimate is calibrated against.
 * @param {object} usage the `usage` chunk's own usage
 * @returns {number | undefined} the input tokens, or nothing when there is no charge
 */
export function observedInputTokens(usage) {
  const charged = chargedTokens(usage)
  if (charged === undefined) return undefined
  return Math.max(0, charged - count(usage?.outputTokens))
}

/** Whether the caller has already cancelled this call. */
export function isAborted(signal) {
  return signal !== undefined && signal.aborted === true
}

/**
 * Why a waiting request was stopped, in the caller's own words when it left any.
 * @param {AbortSignal} [signal] the caller's signal
 * @returns {string} the reason
 */
export function abortReason(signal) {
  const reason = signal?.reason
  if (typeof reason === 'string' && reason.length > 0) return reason
  if (reason instanceof Error && typeof reason.message === 'string' && reason.message.length > 0) return reason.message
  return 'the request was cancelled while it waited for a model rate budget'
}

/**
 * The windows of the models under a limit, and the queue each of them admits from.
 *
 * One state per configured pair, held for the whole process: sessions, subagents, the compaction call
 * and the session title all spend the same window, because what the ceiling belongs to is the account
 * or the key and not a session.
 */
export class GateLedger {
  #states = new Map()
  #now
  #setTimer
  #clearTimer

  /**
   * @param {object} [clock] the clock and the timers, handed in so a run decides the accounting
   * @param {() => number} [clock.now] the current moment
   * @param {(fn: () => void, ms: number) => unknown} [clock.setTimer] how a wake is armed
   * @param {(timer: unknown) => void} [clock.clearTimer] how a wake is dropped
   */
  constructor({ now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    this.#now = now
    this.#setTimer = setTimer
    this.#clearTimer = clearTimer
  }

  /**
   * Bring the states to the rows as they stand now: rows that appeared gain a window, rows that went
   * release whoever waited for them, and the numbers of every row are refreshed.
   *
   * The rows are read per decision, so a limit edited on the page applies to the next request — and a
   * limit taken away lets the requests already waiting for it go, because a wall nobody is asking for
   * any more must not keep holding them.
   * @param {{rows: object[], settings: object}} resolved the resolved rows and the plugin-level numbers
   * @returns {void}
   */
  reconcile({ rows, settings }) {
    const live = new Set()
    for (const row of rows) {
      const key = keyOf(row.provider, row.model)
      live.add(key)
      const state = this.#states.get(key)
      if (state === undefined) {
        this.#states.set(key, {
          key,
          provider: row.provider,
          model: row.model,
          tokensPerMinute: row.tokensPerMinute,
          thresholdRatio: row.thresholdRatio,
          dryRun: row.dryRun,
          limit: row.ceiling,
          settings,
          entries: [],
          queue: [],
          recent: [],
          timer: null,
          pumping: false,
          factor: 1,
          /* The moment a refusal reopens the pair, or 0 while the provider has refused nothing. */
          closedUntil: 0,
          maxUsed: 0,
          maxWouldWaitMs: 0,
          counters: { sends: 0, holds: 0, forced: 0, oversize: 0, wouldWait: 0, aborted: 0, cancelled: 0, released: 0 },
        })
        continue
      }
      Object.assign(state, {
        provider: row.provider,
        model: row.model,
        tokensPerMinute: row.tokensPerMinute,
        thresholdRatio: row.thresholdRatio,
        dryRun: row.dryRun,
        limit: row.ceiling,
        settings,
      })
    }
    for (const [key, state] of [...this.#states]) {
      if (live.has(key)) continue
      this.#release(state)
      this.#states.delete(key)
    }
  }

  /** Whether a pair is under a limit at this moment. */
  holds(provider, model) {
    return this.#states.has(keyOf(provider, model))
  }

  /** The state of one pair, for the caller's own reading. */
  stateOf(provider, model) {
    return this.#states.get(keyOf(provider, model))
  }

  /** The tokens a request of this pair is reserved for: the calibrated estimate plus the reserve. */
  plannedTokens(state, estimate, reserve) {
    return Math.ceil(Math.max(0, estimate) * state.factor) + reserve
  }

  /** What this pair's window holds now: the facts that settled and the reservations still standing. */
  usedOf(state) {
    return this.#used(state, this.#now())
  }

  /**
   * A place in a pair's window.
   *
   * Cancellation never throws: the ticket is taken out, the place it held is released, and the
   * caller decides what to hand its consumer.
   * @param {object} state the pair's state
   * @param {number} tokens the reservation
   * @param {{signal?: AbortSignal, noWait?: boolean, purpose?: string}} [options] the caller's own facts
   * @returns {Promise<object>} the decision: an admitted lease, an aborted request, or a released wall
   */
  async acquire(state, tokens, { signal, noWait = false, purpose } = {}) {
    const charge = Math.max(0, Math.ceil(tokens))
    const { settings } = state
    if (isAborted(signal)) {
      state.counters.aborted += 1
      return { kind: 'aborted', provider: state.provider, model: state.model }
    }
    const now = this.#now()
    if (noWait || state.dryRun) {
      /* The prediction answers the question "would a live run have waited for this", so a request that
         is admitted without waiting by design (a session title, whose own deadline is shorter than any
         window) is not predicted and not counted: it never waits, whatever the window holds, and saying
         it would have waited a window would be a figure about a decision the gate never made. */
      const watching = state.dryRun && !noWait
      const wouldWaitMs = watching ? this.#timeUntilFree(state, this.#deficit(state, charge, now), now) : 0
      if (watching && wouldWaitMs > 0) state.counters.wouldWait += 1
      if (watching && wouldWaitMs > state.maxWouldWaitMs) state.maxWouldWaitMs = wouldWaitMs
      const lease = this.#admit(state, charge, now, {
        purpose,
        outcome: watching ? 'watching' : 'sent',
        waitedMs: 0,
        wouldWaitMs,
      })
      return { kind: 'admitted', provider: state.provider, model: state.model, lease, waitedMs: 0, noWait: true, wouldWaitMs, oversize: charge > state.limit, watching }
    }
    const deficit = this.#deficit(state, charge, now)
    if (deficit === 0) {
      const lease = this.#admit(state, charge, now, { purpose, outcome: 'sent', waitedMs: 0, wouldWaitMs: 0 })
      return { kind: 'admitted', provider: state.provider, model: state.model, lease, waitedMs: 0, wouldWaitMs: 0, oversize: charge > state.limit, watching: false }
    }
    return await new Promise((resolve) => {
      const ticket = {
        tokens: charge,
        signal,
        purpose,
        oversize: charge > state.limit,
        enqueuedAt: now,
        held: false,
        done: false,
        releaseAtMs: undefined,
        resolve,
      }
      ticket.onAbort = () => {
        if (ticket.done) return
        ticket.done = true
        const index = state.queue.indexOf(ticket)
        if (index !== -1) state.queue.splice(index, 1)
        state.counters.aborted += 1
        if (ticket.held) this.#record(state, { purpose, charge, outcome: 'cancelled', waitedMs: this.#now() - ticket.enqueuedAt })
        resolve({ kind: 'aborted', provider: state.provider, model: state.model })
        this.#pump(state)
      }
      if (signal !== undefined) signal.addEventListener('abort', ticket.onAbort, { once: true })
      state.queue.push(ticket)
      this.#pump(state)
    })
  }

  /** The windows as the page reads them: serializable numbers, flags and the latest decisions. */
  snapshot() {
    const now = this.#now()
    const rows = []
    for (const state of this.#states.values()) {
      const used = this.#used(state, now)
      let reserved = 0
      for (const entry of state.entries) if (entry.provisional) reserved += entry.tokens
      const head = state.queue[0]
      rows.push({
        provider: state.provider,
        model: state.model,
        tokensPerMinute: state.tokensPerMinute,
        thresholdRatio: state.thresholdRatio,
        dryRun: state.dryRun,
        ceiling: state.limit,
        windowMs: state.settings.windowMs,
        maxWaitMs: state.settings.maxWaitMs,
        used,
        reserved,
        queued: state.queue.length,
        waitingMs: head === undefined ? 0 : Math.max(0, now - head.enqueuedAt),
        holdUntilMs: head?.releaseAtMs ?? null,
        /* A pair the provider has refused: the moment it reopens, read beside the wait a surface already
           draws, so a hold can be told from a refusal without a clock. */
        closedUntilMs: state.closedUntil > now ? state.closedUntil : null,
        sends: state.counters.sends,
        holds: state.counters.holds,
        forced: state.counters.forced,
        oversize: state.counters.oversize,
        wouldWait: state.counters.wouldWait,
        aborted: state.counters.aborted,
        cancelled: state.counters.cancelled,
        released: state.counters.released,
        maxUsed: state.maxUsed,
        maxWouldWaitMs: state.maxWouldWaitMs,
        factor: Number(state.factor.toFixed(3)),
        recent: state.recent.map((record) => ({ ...record })),
      })
    }
    return { v: 1, at: now, rows }
  }

  /** Drop every timer and let everyone still waiting go: the gate cannot decide for them any more. */
  dispose() {
    for (const state of this.#states.values()) {
      if (state.timer !== null) {
        this.#clearTimer(state.timer)
        state.timer = null
      }
      for (const ticket of state.queue.splice(0)) {
        ticket.done = true
        ticket.signal?.removeEventListener('abort', ticket.onAbort)
        state.counters.released += 1
        ticket.resolve({ kind: 'released', provider: state.provider, model: state.model, reason: 'the gate let the waiting requests go' })
      }
    }
    this.#states.clear()
  }

  /** Let the requests waiting for one row go, because the row is no longer a limit. */
  #release(state) {
    if (state.timer !== null) {
      this.#clearTimer(state.timer)
      state.timer = null
    }
    for (const ticket of state.queue.splice(0)) {
      ticket.done = true
      ticket.signal?.removeEventListener('abort', ticket.onAbort)
      state.counters.released += 1
      ticket.resolve({ kind: 'released', provider: state.provider, model: state.model, reason: 'the row that held this request was taken away' })
    }
  }

  /** Take a place in the window and hand back the two ways it ends: settled by a fact, or released. */
  #admit(state, tokens, now, note) {
    const entry = { at: now, tokens, provisional: true }
    state.entries.push(entry)
    state.counters.sends += 1
    if (tokens > state.limit) state.counters.oversize += 1
    const record = this.#record(state, { ...note, at: now, charge: tokens })
    this.#observe(state, now)
    let closed = false
    /**
     * Close the entry with what the request cost.
     *
     * Called with a charge, it is the provider's own fact and it replaces the reservation. Called with
     * nothing — a stream that carried no `usage`, or one that died before it — the reservation stands
     * as it was made and the entry stays *provisional*: the window keeps the tokens, and the page reads
     * the entry as a charge without a fact rather than as a measured one.
     * @param {number} [charged] the tokens the provider reported
     * @param {{estimate: number, inputTokens?: number}} [observation] what the fact proves about the estimate
     * @returns {void}
     */
    const settle = (charged, observation) => {
      if (closed) return
      closed = true
      if (Number.isFinite(charged) && charged >= 0) {
        entry.tokens = Math.ceil(charged)
        entry.provisional = false
        record.charged = entry.tokens
      }
      if (observation !== undefined) this.#calibrate(state, observation)
      this.#pump(state)
    }
    return {
      /** The fact replaces the reservation; a stream that carried none leaves the estimate standing. */
      settle,
      /** The request never went: the place goes back whole. */
      release: () => {
        if (closed) return
        closed = true
        record.outcome = 'cancelled'
        state.counters.cancelled += 1
        const index = state.entries.indexOf(entry)
        if (index !== -1) state.entries.splice(index, 1)
        this.#pump(state)
      },
      /**
       * The provider refused this pair: the pair is closed to the end of its own window.
       *
       * The third ending, and the only one that carries news about the provider's window rather than about
       * this entry: it stands apart from `settle` and `release`, so a refusal reads the same whether the
       * stream yielded it as a completion or threw it, and so it lands whatever became of the reservation.
       */
      refuse: () => this.#refuse(state, this.#now()),
    }
  }

  /**
   * Close a pair the provider has refused, to the end of its own window.
   *
   * A refusal is a fact about the provider's window and not about ours, and it is the one fact our own
   * count cannot reach: it arrives while our window may stand nearly empty — twenty refusals were measured
   * at a hundred spent tokens — so the requests of that pair would keep going out to a closed door until
   * our own estimate climbed to the ceiling. One window is the whole of the closure, and it is exact: the
   * entry the refusal met was admitted a breath earlier, so it leaves the window at the same moment the
   * closure ends, and nothing enters while the pair is closed. A refusal that arrives while the pair is
   * already closed — a request sent before the closure — extends it rather than shortening it; the moment
   * lives on the pair's own state, ages out by time alone, and goes when the pair's row does.
   * @param {object} state the pair's own state
   * @param {number} now the moment the provider refused
   */
  #refuse(state, now) {
    state.closedUntil = Math.max(state.closedUntil, now + state.settings.windowMs)
    /* Whoever waits is woken at the closure's end rather than at the moment its own window would have
       freed: a ticket armed earlier is re-armed here, or a pair that reopened would stand idle. */
    this.#pump(state)
  }

  /** The ring of latest decisions: the page explains a held or forced request by them. */
  #record(state, record) {
    const entry = { at: this.#now(), charge: 0, charged: null, outcome: 'sent', waitedMs: 0, wouldWaitMs: 0, purpose: null, ...record }
    state.recent.push(entry)
    if (state.recent.length > RECENT_LIMIT) state.recent.splice(0, state.recent.length - RECENT_LIMIT)
    return entry
  }

  /** Admit from the head of the queue until it must wait again. */
  #pump(state) {
    if (state.pumping) return
    state.pumping = true
    try {
      while (state.queue.length > 0) {
        const ticket = state.queue[0]
        if (ticket.done) {
          state.queue.shift()
          continue
        }
        const now = this.#now()
        const deficit = this.#deficit(state, ticket.tokens, now)
        const waitedMs = now - ticket.enqueuedAt
        const forced = deficit > 0 && waitedMs >= state.settings.maxWaitMs
        if (deficit > 0 && !forced) {
          const freeInMs = this.#timeUntilFree(state, deficit, now)
          const remainingMs = Math.max(0, state.settings.maxWaitMs - waitedMs)
          /* The wake is armed for whichever comes first: the window freeing, or the ceiling on the wait. */
          ticket.releaseAtMs = now + Math.min(freeInMs, remainingMs)
          if (!ticket.held) {
            ticket.held = true
            state.counters.holds += 1
          }
          this.#schedule(state, ticket.releaseAtMs - now)
          break
        }
        state.queue.shift()
        ticket.done = true
        ticket.signal?.removeEventListener('abort', ticket.onAbort)
        const predictedWaitMs = deficit === 0 ? waitedMs : waitedMs + this.#timeUntilFree(state, deficit, now)
        const lease = this.#admit(state, ticket.tokens, now, {
          purpose: ticket.purpose,
          outcome: forced ? 'forced' : 'sent',
          waitedMs,
          wouldWaitMs: forced ? predictedWaitMs : 0,
        })
        if (forced) state.counters.forced += 1
        ticket.resolve({
          kind: 'admitted',
          provider: state.provider,
          model: state.model,
          lease,
          waitedMs,
          wouldWaitMs: predictedWaitMs,
          oversize: ticket.oversize,
          forced,
          watching: false,
        })
      }
      this.#observe(state, this.#now())
      /* Nobody is waiting any more, so no wake is owed: a timer left armed would fire into an empty
         queue and keep a plugin that is otherwise idle holding a live timer. */
      if (state.queue.length === 0 && state.timer !== null) {
        this.#clearTimer(state.timer)
        state.timer = null
      }
    } finally {
      state.pumping = false
    }
  }

  /** Arm the one wake of a pair: the moment its window frees, or its ceiling on the wait. */
  #schedule(state, waitMs) {
    if (state.timer !== null) this.#clearTimer(state.timer)
    state.timer = this.#setTimer(() => {
      state.timer = null
      this.#pump(state)
    }, Math.max(MIN_WAKE_MS, Math.ceil(waitMs)))
  }

  /** Remember the fullest the window has been: the page shows the peak beside the current figure. */
  #observe(state, now) {
    const used = this.#used(state, now)
    if (used > state.maxUsed) state.maxUsed = used
  }

  /** Move the calibration toward the ratio this settlement proved, inside the plugin's own bound. */
  #calibrate(state, { estimate, inputTokens }) {
    if (!(estimate > 0) || !(inputTokens > 0)) return
    const observed = inputTokens / estimate
    if (!Number.isFinite(observed)) return
    const next = state.factor + (observed - state.factor) * state.settings.calibrationAlpha
    state.factor = Math.min(state.settings.maxEstimateFactor, Math.max(1, next))
  }

  /** What the window holds now, after the entries that have aged out are gone. */
  #used(state, now) {
    this.#prune(state, now)
    let total = 0
    for (const entry of state.entries) total += entry.tokens
    return total
  }

  #prune(state, now) {
    while (state.entries.length > 0 && state.entries[0].at + state.settings.windowMs <= now) state.entries.shift()
  }

  /**
   * How much of the window a request of this size is short of.
   *
   * A request larger than the whole ceiling can never fit; it waits for the window to be empty and no
   * longer, which is what keeps it from waiting forever for room that cannot exist.
   *
   * A pair the provider has refused is short of room whatever its window holds, and by however little it
   * spent: the closure is the whole shortfall, for every request of the pair and for one larger than the
   * ceiling too. Its length is not a number of tokens and is answered where a length is answered —
   * `#timeUntilFree` — which is why the figure here only has to be non-zero.
   */
  #deficit(state, tokens, now) {
    if (state.closedUntil > now) return Math.max(1, tokens)
    const used = this.#used(state, now)
    if (tokens > state.limit) return used === 0 ? 0 : used
    return Math.max(0, used + tokens - state.limit)
  }

  /**
   * When the shortfall will be gone: the moment the closure ends, or the entries adding up to it leave.
   *
   * A pair the provider refused waits for its closure and not for its window, whatever the window holds:
   * the closure outlives the entries that would free an ordinary shortfall, so it is read first.
   */
  #timeUntilFree(state, deficit, now) {
    if (state.closedUntil > now) return state.closedUntil - now
    if (deficit <= 0) return 0
    let accumulated = 0
    for (const entry of state.entries) {
      accumulated += entry.tokens
      if (accumulated >= deficit) return Math.max(0, entry.at + state.settings.windowMs - now)
    }
    return state.settings.windowMs
  }
}
