/**
 * The gate's ledger: the sliding windows of the models under a limit, the queue each of them admits
 * from, and the decisions it records. The arithmetic it reads lives in `gate.js`.
 *
 * @module @coreness/rate-gate/src/ledger
 */

import { isAborted, keyOf } from './gate.js'

/** The floor on a wake, so a timer that is armed for "almost now" is still a timer. */
const MIN_WAKE_MS = 20;

/** How many decisions of one model the snapshot carries: the page explains the latest ones by them. */
const RECENT_LIMIT = 6;

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
