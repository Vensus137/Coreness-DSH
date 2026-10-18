/**
 * The rate gate: a ceiling in tokens per minute attached to a **model**, held at the platform's own
 * `llm/stream` waterfall.
 *
 * The gate stands where every streaming model call in the process passes — an agent's step, a subagent's
 * step, the compaction call, the session title — and it stands there for the product's own road as much as
 * for the platform's providers, because that road is a registered adapter of the platform's one model
 * service and not a transport beside it. What it stands on is the pair the platform routes by: **a limit is
 * attached to a model named as that pair**, and a pair no row names reaches the adapter untouched, with no
 * wrapper and no queue.
 *
 * The listener is registered `{ global: true }` and deliberately **not** `prepend`ed: it stands in the chain
 * outside the adapter, so what it holds and counts is exactly what would otherwise be dispatched — a listener
 * that answers without dispatching is a call the vendor never sees and must not be charged to a window.
 *
 * The rule at the ceiling is a **hold, not a refusal**: a refusal is handed to the platform's retry policy,
 * which re-asks the same step with the same history and pays for it again, while a hold spends nothing. The
 * hold is bounded, and a request whose bound is spent goes anyway, marked `forced`, so a full window is a
 * delay with a name rather than a hung turn. The session title pays the window and never waits for it: it
 * carries a deadline of its own, and a held title would turn the limiter into a source of failed titles.
 *
 * **Nothing secret, nothing written.** The gate keeps no file, writes no patch and reshapes no request: the
 * request arrives deep-frozen from the agent loop and is only read, the stream is passed through chunk by
 * chunk, and the one thing it adds is a terminal `finish` of the kind the runtime itself produces for a
 * caller's cancellation.
 *
 * The settings are volatile fields, read at every decision and never captured at the mount, and the state a
 * surface reads is this plugin's own route on the connection — read-only, because the values are written
 * through the platform's own settings service and never through a door of ours.
 *
 * @module @coreness/rate-gate
 */

import z from '@deepseek-ai/schemastery'
import { GateLedger } from './ledger.js'
import {
  DEFAULTS,
  abortReason,
  chargedTokens,
  estimateRequestTokens,
  isAborted,
  keyOf,
  observedInputTokens,
  outputReserve,
  resolveSettings,
} from './gate.js'

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-rate-gate'

/**
 * The model service is the only service the gate cannot exist without: its listener stands on the
 * service's own waterfall and its check of "is this model real here" is the service's registry. A
 * declared name is an activation gate in Cordis, so a composition without a model service leaves the
 * plugin pending rather than mounted over nothing.
 *
 * `connection` is **not** declared: it carries the one route and the road must mount where there is no
 * web surface. The route is registered in a scoped area in `apply` instead, the platform's own idiom
 * for a service that may be absent.
 */
export const inject = ['llm']

/** The exact route a surface reads the gate's state through. One answer, one shape, read-only. */
export const ROUTE = '/api/coreness.rateGate'

/** How long a terminal reason may be: it travels into the transcript as the step's own words. */
const REASON_MAX = 300

/**
 * The code a provider's refusal arrives under.
 *
 * The platform's own taxonomy and not this plugin's reading of a status: it is assigned by that reader
 * out of the answer's text, it is the one code the retry policy treats as transient, and a quota or an
 * allowance that is spent arrives under codes of its own (`QUOTA`, `ACCOUNT_QUOTA`) — a limit that does
 * not reopen at a window's edge, which this closure would state wrongly if it answered for them.
 */
const REFUSAL_CODE = 'RATE_LIMIT'

/**
 * The row's settings.
 *
 * The plugin-level numbers are ordinary fields: `windowMs`, `maxWaitMs`, the watching mode and the
 * caution ratio. `limits` is the whole of the gate — one row per model under a ceiling — and every
 * field the page moves is `volatile`, which is both the platform's word for "a write applies to the
 * running plugin without re-mounting the row" and the condition a write goes through at all.
 *
 * **Why the row's own fields are untyped here.** A limit row is data a page writes and a hand edits,
 * and a schema that refuses a row takes the whole plugin down with it: the row fails, the plugin never
 * applies, its settings namespace is never described, and the form that would repair the value is gone
 * with it — the shape of the trap the port already paid for once (a provider row that failed its
 * schema simply disappeared from the model list, with nothing said). So the shape of the list is
 * declared and the *values* of a row are resolved by the gate's own reader, which refuses an unusable row by name
 * in the log and in this plugin's own answer, keeps the rest of the rows running, and leaves the page
 * a door to repair it.
 *
 * **A default is not a declaration.** A row that omits `thresholdRatio` or `dryRun` follows the
 * plugin-level field as it stands at that moment — the resolution leaves the key absent rather than
 * writing a value into it — so a change of the plugin-level number still reaches the rows that never
 * chose their own.
 *
 * The shipped row names **no model**: the gate then mounts, says in its log that nothing is limited,
 * and wraps nothing at all. A limit that shipped by default would silently throttle turns nobody asked
 * to throttle, which is what this product refuses.
 */
export const Config = z.object({
  windowMs: z.number().default(DEFAULTS.windowMs).volatile(),
  /**
   * How long a request may be held for room. One window by default, and the reason is arithmetic:
   * waiting a whole window always empties the window, so a longer wait cannot make room for anything
   * but a request larger than the ceiling itself — and such a request is admitted as soon as the
   * window is empty. The bound limits both the queueing and the waiting, or it would only be noticed
   * once the window freed and would not work at all.
   */
  maxWaitMs: z.number().default(DEFAULTS.maxWaitMs).volatile(),
  /** The watching mode: every request is charged and the wait it would have taken is counted, and nothing is held. */
  dryRun: z.boolean().default(DEFAULTS.dryRun).volatile(),
  /** The caution kept under a ceiling: the estimate is an estimate, and a key may be shared. */
  thresholdRatio: z.number().default(DEFAULTS.thresholdRatio).volatile(),
  /** One limit per model: the pair, its ceiling, and what it may say about the two fields above. */
  limits: z.array(z.object({
    provider: z.any(),
    model: z.any(),
    tokensPerMinute: z.any(),
    thresholdRatio: z.any(),
    dryRun: z.any(),
  })).default([]).volatile(),
  /** How the input is priced before the provider answers: the harness's own heuristic, moved from the row. */
  charsPerToken: z.number().default(DEFAULTS.charsPerToken),
  blockOverheadTokens: z.number().default(DEFAULTS.blockOverheadTokens),
  imageTokens: z.number().default(DEFAULTS.imageTokens),
  outputReserveTokens: z.number().default(DEFAULTS.outputReserveTokens),
  maxOutputReserveTokens: z.number().default(DEFAULTS.maxOutputReserveTokens),
  /** How fast the estimate's factor follows the facts, and how far it may travel from 1. */
  calibrationAlpha: z.number().default(DEFAULTS.calibrationAlpha),
  maxEstimateFactor: z.number().default(DEFAULTS.maxEstimateFactor),
})

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * The value of a field, whether it arrived as one or as the live reference a volatile field is.
 *
 * A volatile field is resolved into a reference rather than into a value,
 * so a reader that forgot would hold a box where a number belongs. The helper is this plugin's own and
 * not the provider plugin's: a shared import would tie two plugins' release together, and the platform
 * reads its own volatile fields the same local way.
 * @param {unknown} field the config field
 * @returns {unknown} the value it holds now
 */
export function live(field) {
  return typeof field?.get === 'function' ? field.get() : field
}

/**
 * The gate's own state, as a surface reads it.
 *
 * The state is the gate's, and the page is told it rather than keeping a copy: the window is
 * process-wide, it moves while no session event is written, and a snapshot read on demand is the only
 * figure that is true when it is read.
 * @param {object} ctx the cordis context
 * @param {GateLedger} ledger the windows
 * @param {{settings: object, rows: object[], refused: object[]}} resolved the rows as they stand
 * @param {string} ns the settings namespace of the row
 * @returns {Promise<object>} the picture
 */
async function pictureOf(ctx, ledger, resolved, ns) {
  const listing = await listingOf(ctx)
  const snapshot = ledger.snapshot()
  const rows = snapshot.rows.map((row) => {
    const entry = listing.pairs.get(keyOf(row.provider, row.model))
    const provider = listing.providers.get(row.provider)
    return {
      ...row,
      name: entry?.name ?? null,
      listed: entry !== undefined,
      /* A pair the registry does not carry is named, not refused: the platform routes an unlisted id,
         so a row for one is not dead — what is missing is the advertisement, and a mistyped id must be
         visible instead of being a limiter that does nothing. */
      unlisted: entry !== undefined ? null : listing.failed.get(row.provider)
        ?? (provider === undefined
          ? 'this profile registers no route under that provider id'
          : 'the route advertises no model with that id (the platform still routes an unlisted id)'),
    }
  })
  const providers = []
  for (const row of rows) {
    let group = providers.find((one) => one.provider === row.provider)
    if (group === undefined) {
      group = {
        provider: row.provider,
        name: listing.providers.get(row.provider)?.name ?? null,
        registered: listing.providers.has(row.provider),
        ceilingSum: 0,
        rows: 0,
      }
      providers.push(group)
    }
    group.ceilingSum += row.ceiling
    group.rows += 1
  }
  return {
    v: 1,
    at: snapshot.at,
    ns,
    settings: {
      windowMs: resolved.settings.windowMs,
      maxWaitMs: resolved.settings.maxWaitMs,
      dryRun: resolved.settings.dryRun,
      thresholdRatio: resolved.settings.thresholdRatio,
    },
    rows,
    refused: resolved.refused,
    providers,
  }
}

/**
 * The models this profile's routes advertise, and the routes whose catalogue could not be read.
 *
 * The registry is the platform's own door to the same facts a request is routed by: `listProviders()`
 * for the routes and `listModels(provider)` for what each of them advertises. A catalogue that fails is
 * a named reason and not an empty list, so a route in trouble cannot look like a route with no models.
 * @param {object} ctx the cordis context
 * @returns {Promise<{pairs: Map<string, object>, providers: Map<string, object>, failed: Map<string, string>}>} the listing
 */
async function listingOf(ctx) {
  const llm = ctx.get('llm') ?? ctx.llm
  const pairs = new Map()
  const providers = new Map()
  const failed = new Map()
  if (llm === undefined) return { pairs, providers, failed }
  for (const provider of llm.listProviders()) {
    providers.set(provider.id, provider)
    try {
      for (const model of await llm.listModels(provider.id)) pairs.set(keyOf(provider.id, model.id), model)
    } catch (error) {
      failed.set(provider.id, `the route's own catalogue could not be read: ${reasonOf(error)}`)
    }
  }
  return { pairs, providers, failed }
}

/**
 * The terminal the gate yields when a request it stopped itself never went.
 *
 * The shape is the runtime's own for a caller's cancellation — an aborted finish chunk — and the
 * stream validator accepts it whether or not it stands
 * outside this listener. The reason is the caller's own when it
 * left one, so a user reads why the turn stopped rather than a sentence invented here.
 * @param {AbortSignal} [signal] the caller's signal
 * @returns {object} the chunk
 */
export function abortedFinish(signal) {
  return {
    type: 'finish',
    reason: { kind: 'aborted', failure: { code: 'ABORTED', message: abortReason(signal).slice(0, REASON_MAX) } },
  }
}

/** The code a failure's own facts carry, or null where this shape names none. */
function codeIn(failure) {
  const code = failure?.code
  return typeof code === 'string' && code !== '' ? code : null
}

/**
 * The code a refusal carries, from either shape a provider's error takes, or null where it is not one.
 *
 * A provider's error arrives as a chunk or as a throw, and each shape keeps the code where its own
 * vocabulary puts it: a completion's reason carries the `failure` the platform assigned by reading the
 * answer's text, and a thrown error carries the same code as its own taxonomy, with that failure beside
 * it. One reader for the two, so a pair cannot be closed by one shape and left open by the other.
 * @param {unknown} source the chunk a stream yielded, or the error it threw
 * @returns {string|null} the refusal's code
 */
function refusalCodeOf(source) {
  if (source === null || typeof source !== 'object') return null
  /* A thrown error is the failure itself; a chunk names it under the completion's own reason. */
  if (source instanceof Error) return codeIn(source) ?? codeIn(source.failure)
  return source.type === 'finish' && source.reason?.kind === 'error' ? codeIn(source.reason.failure) : null
}

/**
 * What the decision was, in the words a reader of the log wants: nothing when the request simply went.
 *
 * A gate whose ordinary case is silent cannot be read at a live ceiling — the numbers of one run and the
 * next would be indistinguishable — so every request says what it was charged and what the window stood
 * at, and this names the rest: the wait, the bound it spent, or the wait it would have taken while the
 * gate was only watching.
 * @param {object} decision the ledger's decision
 * @param {object} state the pair's state
 * @returns {string} the tail of the line
 */
function noteOf(decision, state) {
  if (decision.forced === true) return `, forced over the window after the ${state.settings.maxWaitMs} ms bound (about ${decision.wouldWaitMs} ms more would have been needed)`
  if (decision.waitedMs > 0) return `, held ${decision.waitedMs} ms for room`
  if (decision.watching === true && decision.wouldWaitMs > 0) return `, watching: this request would have waited ${decision.wouldWaitMs} ms`
  return ', sent at once'
}

/**
 * The stream of one gated call: a place in the window first, then the adapter's own chunks, unchanged.
 *
 * The generator is what the waterfall listener returns, so `next()` is reached on the consumer's first
 * pull rather than at the listener's call, and exactly once — a listener that called it eagerly would
 * build the adapter's stream for a request that may yet be cancelled while it waits.
 * @param {object} options the call's own options
 * @param {() => AsyncIterable<object>} next the downstream stream
 * @param {{ledger: GateLedger, settings: object, log: (message: string) => void}} gate the windows and where a decision is said
 * @returns {AsyncIterable<object>} the chunks
 */
async function* gatedStream(options, next, { ledger, settings, log }) {
  const state = ledger.stateOf(options.provider, options.model)
  if (state === undefined) {
    for await (const chunk of next()) yield chunk
    return
  }
  const where = `${state.provider}/${state.model}`
  const estimate = estimateRequestTokens(options, settings)
  const reserve = outputReserve(options, settings)
  const tokens = ledger.plannedTokens(state, estimate, reserve)
  const decision = await ledger.acquire(state, tokens, {
    signal: options.signal,
    /* The session title pays for the window like everything else and never waits for it: its own
       deadline is shorter than any window, so a hold here would be a failed title and not a delay. */
    noWait: options.purpose === 'session-title',
    purpose: options.purpose,
  })

  if (decision.kind === 'aborted') {
    log(`${where}: cancelled while waiting for room, nothing was sent`)
    yield abortedFinish(options.signal)
    return
  }
  if (decision.kind === 'released') {
    if (isAborted(options.signal)) {
      yield abortedFinish(options.signal)
      return
    }
    log(`${where}: the limit was taken away while this request waited, it goes untouched`)
    for await (const chunk of next()) yield chunk
    return
  }
  if (isAborted(options.signal)) {
    /* Cancelled between the place being granted and the send: the place goes back whole. */
    decision.lease.release()
    log(`${where}: cancelled between the window and the send, the place is released`)
    yield abortedFinish(options.signal)
    return
  }

  /* One line per request, and one per fact. The gate's ordinary case is silence, and a limiter whose
     ordinary case is silence cannot be read at all: the numbers of one run and the next would be
     indistinguishable, and a hold would be inferred from a clock instead of read from the gate. */
  log(`${where}: request ${tokens} tokens (input ${estimate} + reserve ${reserve}), window ${ledger.usedOf(state)}/${state.limit}${noteOf(decision, state)}`)

  let settled = false
  try {
    for await (const chunk of next()) {
      if (chunk !== null && typeof chunk === 'object' && chunk.type === 'usage') {
        const fact = chargedTokens(chunk.usage)
        if (fact !== undefined) {
          settled = true
          const observed = observedInputTokens(chunk.usage)
          decision.lease.settle(fact, { estimate, inputTokens: observed })
          log(`${where}: the fact ${fact} tokens (input ${observed ?? '—'}) replaces the reservation of ${tokens}, window ${ledger.usedOf(state)}/${state.limit}, estimate factor ${state.factor.toFixed(2)}`)
        }
      }
      /* A refusal closes the pair for the rest of its window: the one fact about the provider's window
         that reaches us, and the only one our own estimate cannot reach. It is read here, where the
         stream is walked, and marked through the same ending the throw below uses. */
      if (refusalCodeOf(chunk) === REFUSAL_CODE) {
        decision.lease.refuse()
        log(`${where}: the provider refused this pair (${REFUSAL_CODE}), it is closed for ${settings.windowMs} ms`)
      }
      yield chunk
    }
  } catch (error) {
    /* A provider's error arrives as a chunk or as a throw, and the throw is the same refusal: the pair is
       closed before the error goes on to whoever decides whether the step is asked again. */
    if (refusalCodeOf(error) === REFUSAL_CODE) {
      decision.lease.refuse()
      log(`${where}: the provider refused this pair (${REFUSAL_CODE}) by a throw, it is closed for ${settings.windowMs} ms`)
    }
    throw error
  } finally {
    /* A stream that carried no usage — and one that died before it — leaves the reservation standing
       for the rest of the window, read as a charge without a fact: the input of a request that reached
       the vendor is spent whether or not an answer came back. */
    if (!settled) decision.lease.settle()
  }
  if (!settled) log(`${where}: the stream carried no usage, the reservation of ${tokens} tokens stands for the window`)
}

/**
 * Mount the gate.
 *
 * Three things and no more: the listener on the platform's model waterfall, the read-only route a
 * surface reads the state through, and the lines that say what the gate is doing — because this build
 * mounts no console sink and reaches no log file, the route is the only place the behaviour can be
 * seen, and the log lines reach whoever reads the platform's own ring.
 * @param {object} ctx the cordis context
 * @param {object} config the row's config, resolved by the Loader against {@link Config}
 * @returns {void}
 */
export function apply(ctx, config) {
  const log = (message) => ctx.logger?.info?.(`${name}: ${message}`)
  const warn = (message) => ctx.logger?.warn?.(`${name}: ${message}`)
  const settingsNs = ctx.fiber?.entry?.options?.id ?? name
  const ledger = new GateLedger()

  /**
   * The rows and the numbers as they stand at this moment.
   *
   * Read per decision rather than captured at the mount — the fields are volatile, the page writes them
   * while the route runs, and a gate holding the numbers it started with would obey a form nobody could
   * see it ignoring. A complaint is written once per distinct complaint rather than once per request:
   * the reader of the ring wants the fact, not the repetition.
   */
  let said = ''
  const read = () => {
    const values = {
      windowMs: live(config.windowMs),
      maxWaitMs: live(config.maxWaitMs),
      dryRun: live(config.dryRun),
      thresholdRatio: live(config.thresholdRatio),
      limits: live(config.limits),
      charsPerToken: live(config.charsPerToken),
      blockOverheadTokens: live(config.blockOverheadTokens),
      imageTokens: live(config.imageTokens),
      outputReserveTokens: live(config.outputReserveTokens),
      maxOutputReserveTokens: live(config.maxOutputReserveTokens),
      calibrationAlpha: live(config.calibrationAlpha),
      maxEstimateFactor: live(config.maxEstimateFactor),
    }
    const complaints = []
    const resolved = resolveSettings(values, (message) => complaints.push(message))
    const now = complaints.join('\n')
    if (now !== said) {
      said = now
      for (const line of complaints) warn(line)
    }
    return resolved
  }

  ctx.on('llm/stream', (options, next) => {
    const resolved = read()
    ledger.reconcile(resolved)
    /* A pair no row names is not the gate's business: the neighbour's own stream object is handed back
       as it stands, which is what lets the gate stand on the path of every request at all. */
    if (!ledger.holds(options.provider, options.model)) return next()
    return gatedStream(options, next, { ledger, settings: resolved.settings, log })
  }, { global: true })

  /* The registry's own notification: a pair whose route has just arrived (or just gone) is named again,
     because a limiter on an id nothing routes is exactly the silent thing this gate refuses to be. The
     same check runs one turn after the mount rather than inside it: at the mount this composition's
     other routes may not have registered yet, and a complaint about a route that is about to arrive
     would be a lie. A row is named once per distinct fact and not once per event: a route that mounts
     after the gate makes the registry move several times, and the same sentence six times is noise that
     hides the seventh. */
  const named = new Map()
  const write = { log, warn }
  ctx.on('llm/adapters-updated', () => {
    void nameUnlisted(ctx, ledger, read(), write, named)
  }, { global: true })
  ctx.effect(() => {
    const timer = setTimeout(() => {
      void nameUnlisted(ctx, ledger, read(), write, named)
    }, 0)
    return () => clearTimeout(timer)
  }, `${name}: name the rows this profile's registry does not carry`)
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['GET'],
        /* The bridge reads no byte before the route declares how its body is handled, and a route that
           declares nothing is answered 400 rather than served — measured live by the page's own walk, which
           asked this path and read `400 Bad Request` while the same shape two plugins over answered. The
           gate answers a picture and reads no body: the declaration is what the bridge needs to route it. */
        requestBody: 'buffered',
        fetch: () => answerOf(ctx, ledger, read, settingsNs, warn),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the gate's own route`)
    log(`the state stands at ${ROUTE}`)
  })
  if (ctx.get('connection') === undefined) {
    log(`this composition carries no web surface, so nothing serves ${ROUTE}: the gate holds and counts without a surface`)
  }

  ctx.effect(() => () => {
    /* The plugin is going away — a reload of the profile, the row switched off, the application
       closing. Everyone still waiting goes rather than being dropped: the gate cannot decide for a
       request whose gate no longer exists, and a request that never went is not a request that failed. */
    ledger.dispose()
  }, `${name}: release the requests still waiting`)

  const start = read()
  ledger.reconcile(start)
  const limited = start.rows.map((row) => `${row.provider}/${row.model} (${row.ceiling} tokens per ${start.settings.windowMs} ms${row.dryRun ? ', watching' : ''})`)
  if (start.rows.length === 0) {
    log(`no model is limited: no row of "limits" names one, so every request passes untouched${start.refused.length === 0 ? '' : ` (${start.refused.length} row(s) could not be used, named above)`}`)
  } else {
    log(`${start.rows.length} model(s) under a limit: ${limited.join(', ')} — a window of ${start.settings.windowMs} ms, a wait bound of ${start.settings.maxWaitMs} ms${start.settings.dryRun ? ', watching: requests are charged but never held' : ''}`)
  }
}

/**
 * Name every row whose pair this profile's registry does not carry, once per distinct fact.
 *
 * A limit on an id nothing routes is invisible by nature — it holds nothing, counts nothing and looks
 * exactly like a limiter that works — so the pair is named where it is configured: at the mount, and
 * again whenever the registry changes. A route mounting after the gate makes that registry move several
 * times, and each move would repeat the same sentence; the sentence is therefore written when the fact
 * changes and not when the event fires, and a pair that later appears is said to have appeared rather
 * than left under the earlier complaint.
 * @param {object} ctx the cordis context
 * @param {GateLedger} ledger the windows
 * @param {{settings: object, rows: object[]}} resolved the rows as they stand
 * @param {{log: (message: string) => void, warn: (message: string) => void}} say where a fact is written
 * @param {Map<string, string>} said what was last named for each pair
 * @returns {Promise<void>} nothing
 */
async function nameUnlisted(ctx, ledger, resolved, say, said) {
  ledger.reconcile(resolved)
  const listing = await listingOf(ctx)
  for (const row of resolved.rows) {
    const pair = keyOf(row.provider, row.model)
    if (listing.pairs.has(pair)) {
      if (said.has(pair)) {
        said.delete(pair)
        say.log(`${row.provider}/${row.model} is now in this profile's registry: the limit on it holds`)
      }
      continue
    }
    const reason = listing.failed.get(row.provider)
      ?? (listing.providers.has(row.provider)
        ? 'the route advertises no model with that id (the platform still routes an unlisted id)'
        : 'this profile registers no route under that provider id')
    if (said.get(pair) === reason) continue
    said.set(pair, reason)
    say.warn(`the row ${row.provider}/${row.model} is not in this profile's registry: ${reason}`)
  }
}

/**
 * One answer of the gate's route: the state as it stands, or a refusal in words.
 *
 * `json` answers 200 whatever happened — `{ok:true, value}` or `{ok:false, error}`.
 * @param {object} ctx the cordis context
 * @param {GateLedger} ledger the windows
 * @param {() => {settings: object, rows: object[], refused: object[]}} read the rows as they stand
 * @param {string} ns the settings namespace of the row
 * @param {(message: string) => void} warn where a refusal is said
 * @returns {Promise<Response>} the answer
 */
async function answerOf(ctx, ledger, read, ns, warn) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    const resolved = read()
    ledger.reconcile(resolved)
    return json({ ok: true, value: await pictureOf(ctx, ledger, resolved, ns) })
  } catch (error) {
    warn(`the state route refused a request: ${reasonOf(error)}`)
    return json({ ok: false, error: { code: 'state-failed', message: reasonOf(error) } })
  }
}
