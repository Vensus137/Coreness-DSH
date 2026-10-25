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
 * @module @coreness/rate-gate/src/gate
 */

const BASE64_DATA_URL = /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/iu;

/** The role line the platform's meter prices on every model-visible message: four tokens, as its own
 * `estimateMessage` adds — `estimateContent(...) + 4` — and once more for the system message. */
const ROLE_OVERHEAD = 4

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
const BOUNDS = Object.freeze({
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
  /* The platform's meter charges four tokens for each message and four for the system message, beside the
     characters of its blocks (`estimateMessage` / `estimateSystemMessage`). The estimate copies that shape,
     so the first waits are not undercounted until the calibration factor has climbed. */
  const messages = (Array.isArray(request.messages) ? request.messages.length : 0)
    + (Array.isArray(request.toolHistory) ? request.toolHistory.length : 0)
  const system = request.system === undefined || request.system === null || request.system === '' ? 0 : ROLE_OVERHEAD
  return Math.ceil(acc.chars / settings.charsPerToken)
    + acc.blocks * settings.blockOverheadTokens
    + acc.images * settings.imageTokens
    + messages * ROLE_OVERHEAD
    + system
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
