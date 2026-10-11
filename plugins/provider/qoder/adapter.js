/**
 * The route's adapter: the platform's contract against our own transport, and the declaration that
 * makes the route usable from the product's doors.
 *
 * The platform's model service calls this object: `providerInfo` at registration,
 * `providerRetryPolicy` once with it, `listModels`/`resolveModel` for the picker and the settings
 * page, `prepareCall`/`stream` for one attempt. Registration is duck-typed — the service reads those
 * methods off the object and never asks what it extends — which is why this module imports nothing
 * from the platform: **our failure codes travel in the terminal chunk we yield ourselves**, while a
 * thrown error keeps its code only when it is an instance of the harness's own class
 * (`harnessErrorCode`) — and the copy of that class a plugin can import is not guaranteed to be the
 * app's own instance.
 *
 * The mapping is the whole of the platform's chunk vocabulary: block starts and ends, text, reasoning
 * and tool-call deltas, usage, and exactly one terminal `finish`. The vendor's own order is not the
 * platform's: the wire writes `finish_reason` **before** its `usage` frame (measured on the live
 * contour), so the terminal is held until the usage has arrived — the harness's rule is "usage
 * precedes the terminal", not "the vendor says so".
 *
 * @module @coreness/dsh/plugins/provider/qoder/adapter
 */

import { FrameError, channelsOf, readLine, usageOf, vendorUsageOf } from './frames.js'
import { refusalOfRead } from './in.js'
import { createShutter } from './markup.js'
import { resolveImages } from './images.js'

/** The route id the live profile already names. */
export const ROUTE = 'qoder'

/** The name the platform's own pages show for the route. */
export const DISPLAY_NAME = 'Qoder'

/**
 * The output budget this route declares for a model whose row names none.
 *
 * The vendor's own fallback, which is also what the body uses for a call that names nothing: this node
 * publishes no per-model output ceiling — the discovery answer carries none for any of the fifteen
 * models, and nor did the four rows read through the page (`dfmodel`, `efficient`, `qmodel_38max`,
 * `qfmodel`) — and neither number in play is a ceiling of the model. 256 000, which the platform's own road declares, is a quarter of *that* road's
 * 1 000 000-token window (`dsh-llm-deepseek`), and the platform charges the declaration to the same
 * window the prompt is spent from: a 400 000-token row that reserves 256 000 leaves 78 464 tokens of
 * prompt before the harness condenses, and a 200 000-token row leaves none and is refused outright
 * (`dsh-compaction-basic`, `TargetPressureConfigError`). 32 768 leaves the 400 000 rows 301 696 and the
 * 200 000 row 101 696 — the numbers this route's windows were chosen against — while staying 65% above
 * the longest answer the measured runs have produced (19 863 tokens). A row that knows its model's real
 * ceiling still names its own
 * in `models[]`, and a node that publishes one still wins through discovery; what this constant is, is a
 * declaration that fits the windows it is spent from.
 */
export const DEFAULT_MODEL_MAX_TOKENS = 32_768

/**
 * The window given to a model the row does not declare. The smallest tier the vendor's own catalogue
 * declares for these models — `200 000`, the tier it marks as the recommended one (every menu-bearing
 * model leads with `200 000`, and the two menu-less ones carry it as their only figure). A declared
 * window that is too small makes the harness compact earlier than it must, one that is too large lets
 * a request overflow — the cheap error is the first.
 */
export const DEFAULT_CONTEXT_WINDOW = 200_000

/**
 * The size at which a swallowed retelling is a compaction request in disguise rather than an empty
 * turn (the donor's own `SUMMARY_ARTIFACT_CHARS`). Under it the turn is
 * an empty response; at or above it the harness compacts and re-runs the step, which is the treatment
 * the user decided for a retelling.
 */
export const SUMMARY_ARTIFACT_CHARS = 2_000

/**
 * The platform's own three names, and the base of the vocabulary this route declares.
 *
 * `off` is why they stay: no vendor menu publishes it (their client expresses a switch-off as a budget
 * of zero), and the other two are the platform's words for the request this route sends — what travels
 * is the effort the row names, exactly as it stands there.
 *
 * They are the declaration's base and not the whole of it: a model whose row names a level the vendor
 * publishes declares that level beside them ({@link declaredEfforts}), because the platform validates
 * every effort it resolves against this list and refuses one it does not find, before any provider I/O.
 */
export const REASONING_EFFORTS = Object.freeze([
  Object.freeze({ id: 'off', name: 'Off', description: 'No reasoning: the answer only.' }),
  Object.freeze({ id: 'high', name: 'High', description: 'Reasoning for ordinary work.' }),
  Object.freeze({ id: 'max', name: 'Max', description: 'Reasoning for the hardest work.' }),
])

/**
 * What this route declares one model supports: the platform's three, and the level the row names when
 * it is not one of them.
 *
 * The row carries the **vendor's own** name — the page draws every model's menu from the vendor's live
 * catalogue and writes the chosen name into the row — so the declaration must admit it, or the
 * platform would refuse the very value this route is going to ask for: `defaultEffort` has to be a
 * member of `efforts`, and any effort a call resolves to has to be one too, with no clamping and no
 * aliasing.
 *
 * The platform's three stay in every case, not only where no vendor name stands: a session that chose
 * `high` at the platform's own picker would otherwise meet `UNSUPPORTED_REASONING_EFFORT` in the middle
 * of a conversation the moment a row moved. The order is the platform's, and the row's level is
 * appended once, the vendor's spelling serving as both its id and its label.
 *
 * The model's **live menu** is deliberately not part of this: it is what the product's own page offers
 * a reader, read over the page's route, while this list is the platform's vocabulary of what may be
 * asked of the route. Reading the catalogue here would make the platform's own model catalogue wait on
 * the vendor — against the decision that the model list is never waited on — or, if it were read
 * lazily, would let a session's admissible vocabulary move with the vendor's listing and refuse a
 * level already chosen.
 * @param {string} effort the effort the row names, or the route's answer where the row names none
 * @returns {readonly object[]} the efforts the platform may ask this model for
 */
export function declaredEfforts(effort) {
  if (effort === '' || REASONING_EFFORTS.some((one) => one.id === effort)) return REASONING_EFFORTS
  return Object.freeze([...REASONING_EFFORTS, Object.freeze({ id: effort, name: effort })])
}

/** The platform's five retryable codes plus the one reason this route exists; an exhausted allowance is not among them, because a retry does not buy back a count. */
export const DEFAULT_RETRYABLE_CODES = Object.freeze(['EMPTY_RESPONSE', 'RATE_LIMIT', 'SERVER', 'TIMEOUT', 'TRANSPORT', 'MALFORMED_RESPONSE'])

/** The platform's own retry defaults, kept as they are: the budget, the mode and the backoff. */
export const RETRY_DEFAULTS = Object.freeze({ maxRetries: 5, initialDelayMs: 500, maxDelayMs: 10_000, jitterRatio: 0.1 })

/**
 * Our transport's codes in the platform's vocabulary, where the two differ.
 *
 * Everything else passes through unchanged: `AUTH`, `QUOTA`, `RATE_LIMIT`, `SERVER`, `TIMEOUT`,
 * `TRANSPORT` and `MISSING_CREDENTIAL` are already the platform's own words — `QUOTA` being the one
 * this route reads for a counted allowance (`codeFor`) — and a code that means nothing to the platform
 * is still worth carrying: it is what a reader routes on.
 */
export const PLATFORM_CODES = Object.freeze({
  MALFORMED: 'MALFORMED_RESPONSE',
  EMPTY: 'EMPTY_RESPONSE',
  NO_NODE: 'TRANSPORT',
})

/**
 * The value of one row field, live or plain.
 *
 * A `volatile` field does not arrive as a value: the platform resolves it into a live reference so that
 * a change to it applies to the running plugin **without re-mounting the row**. The reference is stable
 * and immutable — `.get()` answers the snapshot that stands now — so a reader that wants the value the
 * row holds at this moment reads it here, and one that captured the reference itself would be reading a
 * box, not a list: `models` would stop being an array, and `inferBase` would stop being an address.
 * Plain values (the shape the config takes outside the Loader, as this plugin's own checks pass it)
 * stand as they are.
 * @param {unknown} field the row's field
 * @returns {unknown} the plain value
 */
export function liveValue(field) {
  return field !== null && typeof field === 'object' && typeof field.get === 'function' ? field.get() : field
}

/**
 * The policy as the platform's retry listener reads it: flat, with the backoff fields beside the mode.
 *
 * `RetryPolicySchema` carries the backoff as a nested object, while the listener reads
 * `policy.initialDelayMs`, `policy.maxDelayMs` and `policy.jitterRatio` — and the registration takes
 * the adapter's answer as it stands, without resolving it. So the row's words are resolved into the
 * listener's shape here, and the answer is frozen: a policy captured with a route must not move.
 * @param {object} [config] the row's `retryPolicy`
 * @returns {object} the resolved policy
 */
export function resolveRetryPolicy(config = {}) {
  const backoff = config.backoff ?? {}
  const maxRetries = Number.isSafeInteger(config.maxRetries) && config.maxRetries >= 0 ? config.maxRetries : RETRY_DEFAULTS.maxRetries
  const codes = Array.isArray(config.retryableCodes) && config.retryableCodes.length > 0 ? config.retryableCodes : DEFAULT_RETRYABLE_CODES
  return Object.freeze({
    mode: 'normal',
    maxRetries,
    retryableCodes: Object.freeze([...codes]),
    initialDelayMs: Number.isFinite(backoff.initialDelayMs) && backoff.initialDelayMs > 0 ? backoff.initialDelayMs : RETRY_DEFAULTS.initialDelayMs,
    maxDelayMs: Number.isFinite(backoff.maxDelayMs) && backoff.maxDelayMs > 0 ? backoff.maxDelayMs : RETRY_DEFAULTS.maxDelayMs,
    jitterRatio: Number.isFinite(backoff.jitterRatio) && backoff.jitterRatio >= 0 && backoff.jitterRatio <= 1 ? backoff.jitterRatio : RETRY_DEFAULTS.jitterRatio,
  })
}

/**
 * The input modalities one model's row declares.
 *
 * The vendor serves pictures on every model its catalogue carried when the catalogue was read — the
 * flag it publishes is `is_vl`, and all fifteen entries of the live node's `chat` category carry it
 * true, `dfmodel`, `efficient`, `qmodel_38max` and `qfmodel` among them, which the transport already
 * reads as `vision` — and the donor declared `vision: true` for every one of them. So the row's
 * `vision` decides, and it defaults to what the catalogue says for this vendor: pictures are carried
 * unless the row marks the model text-only.
 * @param {boolean | undefined} vision the row's own flag for this model
 * @returns {string[]} the modalities the platform reads
 */
export function modalitiesOf(vision) {
  return vision === false ? ['text'] : ['text', 'image']
}

/**
 * The advisory list of one route: the models the row declares, in the row's order.
 * @param {readonly object[]} models the row's `models`
 * @param {string} provider the route
 * @returns {object[]} selector metadata per model
 */
export function declaredModels(models, provider) {
  return (models ?? []).map((model) => ({
    provider,
    id: model.id,
    name: model.name === undefined || model.name === '' ? model.id : model.name,
    contextWindow: model.contextWindow ?? DEFAULT_CONTEXT_WINDOW,
    maxTokens: model.maxTokens ?? DEFAULT_MODEL_MAX_TOKENS,
    inputModalities: modalitiesOf(model.vision),
  }))
}

/**
 * The exact model metadata of one call.
 *
 * The fields the declaration owes: the window — the row's, or the conservative default — the output budget
 * the platform materialises into a request that names none, the reasoning menu, and **`inputModalities`**,
 * the field that decides whether the platform lets a picture reach this route at all. Two platform guards
 * read it and were both refusing this route while it said `['text']`: the session controller refuses a
 * prompt carrying an attachment (the refusal the user met), and the runtime replaces every picture of a
 * message with the text-only placeholder before dispatch, which is why the pictures inside `read_image`
 * results never reached the model. The flag is per model and comes from the row.
 *
 * `systemPromptUpdate: 'in-history'` and `toolUpdate: 'addition-only'` are the platform's own route's
 * declarations, and both say what this route does. The first is what makes the loop treat a prompt change as
 * **an appended system message** rather than a rewrite of the leading one, which is why this project's own
 * sessions carry system messages after the first; the body answers it by flattening **every** system-role
 * message into the top-level prompt in their order, so the newest update is read as part of the prompt and
 * nothing is dropped. A route that declared nothing would be told to replace the leading prompt in place,
 * and the earlier text would be lost.
 */
export function modelInfo(settings, provider, model) {
  const declared = (settings.models ?? []).find((entry) => entry.id === model)
  const effort = effortOf(settings, model)
  return {
    provider,
    id: model,
    name: declared?.name === undefined || declared.name === '' ? model : declared.name,
    inputModalities: modalitiesOf(declared?.vision),
    context: { contextWindow: declared?.contextWindow ?? settings.defaultContextWindow ?? DEFAULT_CONTEXT_WINDOW },
    defaultMaxTokens: declared?.maxTokens ?? DEFAULT_MODEL_MAX_TOKENS,
    systemPromptUpdate: 'in-history',
    toolUpdate: 'addition-only',
    // `defaultEffort` is published only where a level is named: the platform refuses a default that is
    // not a member of `efforts`, and an empty string means "nothing is named" — left out, the platform
    // shows its own provider default and the request carries no effort.
    reasoning: effort === '' ? { efforts: declaredEfforts(effort) } : { efforts: declaredEfforts(effort), defaultEffort: effort },
  }
}

/**
 * The effort a model is asked for: its own setting where the row declares one, the route's otherwise.
 *
 * A model carries its own effort beside its window and its vision, in the row's own `models` schema, and
 * that setting is what the platform's picker applies as the default of a session — the picker reads
 * `reasoning.defaultEffort` here and does not remember a choice made in a chat. The route-level
 * `reasoningEffort` therefore stays as the answer for a model that names none, which is the case a row
 * written before this setting existed is in, and a model the catalogue never answered for keeps the same
 * answer. An empty string is "names none", not an effort.
 *
 * The name a row carries is the **vendor's own** level, chosen from the menu its model publishes on the
 * product's page: the platform's three words are this route's earlier vocabulary, and a row may still
 * carry one of them. The value is what the platform is told this route asks for ({@link modelInfo},
 * `defaultEffort`), so the declaration carries it too ({@link declaredEfforts}).
 *
 * What travels is exactly this value and nothing rewrites it on the way out: the wire takes a name a
 * model's menu does not publish (measured — a live turn carried `max` to a model whose menu is
 * `xhigh|low|medium` and was answered normally), so the row's level is the request itself.
 * @param {object} settings the generation's settings
 * @param {string} model the requested id
 * @returns {string} the effort to ask for
 */
export function effortOf(settings, model) {
  const declared = (settings.models ?? []).find((entry) => entry.id === model)
  const own = typeof declared?.effort === 'string' ? declared.effort : ''
  return own === '' ? settings.defaultReasoningEffort ?? '' : own
}

/**
 * The failure a thrown value stands for, in the platform's words.
 *
 * The kind is the platform's distinction, not a courtesy: a caller's cancellation is `aborted` — an
 * outcome of its own in the contract, which the loop and the retry policy both read — while everything
 * else is `error`. The status travels when the contour gave one, because a reader looking at a refusal
 * wants the number the vendor sent.
 * @param {unknown} error what was thrown
 * @param {AbortSignal} [signal] the caller's signal
 * @returns {{kind: 'aborted' | 'error', failure: object}} the terminal reason
 */
export function terminalOfFailure(error, signal) {
  const code = error instanceof FrameError ? 'MALFORMED_RESPONSE'
    : typeof error?.code === 'string' && error.code !== '' ? PLATFORM_CODES[error.code] ?? error.code
      : 'UNKNOWN'
  const aborted = signal?.aborted === true || code === 'ABORTED'
  const status = Number.isInteger(error?.status) && error.status >= 100 && error.status <= 599 ? error.status : undefined
  return {
    kind: aborted ? 'aborted' : 'error',
    failure: {
      message: typeof error?.message === 'string' && error.message !== '' ? error.message : `${code}: the Qoder route failed`,
      code: aborted ? 'ABORTED' : code,
      ...status === undefined ? {} : { status },
    },
  }
}

/** The terminal the route refuses an attempt with, in words. */
function refusalOf(code, message, signal) {
  return { type: 'finish', reason: { kind: signal?.aborted === true ? 'aborted' : 'error', failure: { message, code: signal?.aborted === true ? 'ABORTED' : code } } }
}

/** A malformed response of our own reading, carrying the platform's code. */
function malformed(message) {
  return Object.assign(new Error(message), { code: 'MALFORMED_RESPONSE' })
}

/**
 * The far side's own failure, carried into the platform's vocabulary.
 *
 * A chunk-level `error` is not a frame this route counts and walks past: the vendor's own client takes it
 * first and fails the turn with it. Ours fails with the platform's `SERVER` — the code whose policy
 * re-asks the step — and keeps the far side's own message, its own code and the status it sent: a
 * reader looking at a failed attempt wants the contour's words, not a summary of them.
 * @param {{message: string, code?: string, status?: number}} error the frame's own error
 * @returns {Error} the failure to throw
 */
function vendorFailure(error) {
  const code = error.code === undefined ? '' : ` (${error.code})`
  return Object.assign(
    new Error(`the Qoder contour failed the turn inside the stream: ${error.message}${code}`),
    { code: 'SERVER', ...error.status === undefined ? {} : { status: error.status } },
  )
}

/**
 * The adapter of one route.
 *
 * `settings` is read through a function rather than captured once: the row's config may be re-read by
 * the Loader, and an attempt must use one generation of it from beginning to end — which is what
 * `prepareCall` binds (the reason the research gives for overriding it: a call must not combine one
 * generation's capabilities with another's endpoint). `imageData` is the reader of attachment bytes:
 * the harness hands an attempt durable references and no bytes, so the attempt resolves
 * them into the messages before the transport builds the body, and a picture it cannot resolve ends
 * the attempt in words with its own code rather than leaving the model to talk about a picture it
 * never saw.
 * @param {object} options the adapter's facts
 * @param {object} options.transport the `qoderTransport` service
 * @param {() => object} options.settings the row's settings, read per generation
 * @param {(ref: object, signal?: AbortSignal) => Promise<string>} [options.imageData] the reader of one attachment's bytes
 * @param {string} [options.displayName] the route's name in the platform's pages
 * @param {object} [options.journal] the spend journal, told what one request cost
 * @param {(message: string) => void} [options.log] where a wiring defect is reported
 * @returns {object} the adapter the platform registers
 */
export function createAdapter(options) {
  const transport = options.transport
  const displayName = options.displayName ?? DISPLAY_NAME
  const journal = options.journal
  const log = options.log ?? (() => {})
  const snapshot = () => {
    const raw = options.settings() ?? {}
    return {
      models: liveValue(raw.models) ?? [],
      defaultContextWindow: liveValue(raw.defaultContextWindow) ?? DEFAULT_CONTEXT_WINDOW,
      defaultReasoningEffort: raw.reasoningEffort ?? '',
      retryPolicy: resolveRetryPolicy(raw.retryPolicy),
    }
  }

  return {
    providerInfo: (provider) => ({ id: provider, name: displayName }),
    providerRetryPolicy: () => snapshot().retryPolicy,
    /**
     * No route-owned image pricing: `undefined`, which is what the platform's own base adapter
     * answers and what its consumers are written for — "the default declares none, so consumers fall
     * back to their own neutral estimate". What a Qoder picture costs in tokens is not measured here,
     * and a number invented to fill the field would be read as a measurement by the token meter and
     * by the spill policy.
     *
     * The method is declared although it answers nothing, because the runtime calls it **unguarded**
     * on the very object it was handed: `imageRequestPricing(provider, model)` runs
     * `this.adapters.get(provider)?.adapter.imageRequestPricing(provider, model)`, and registration
     * stores the adapter as it stands, without wrapping it in the base class that would have carried
     * the default. The token meter asks it on every measurement, the compaction policy measures on
     * every trigger decision, and `imageRequestPricing` is only reached when the routed header names a
     * provider — so an adapter without the method is a `TypeError` waiting for the first measurement,
     * not a missing number.
     */
    imageRequestPricing: () => undefined,
    listModels: (provider) => Promise.resolve(declaredModels(snapshot().models, provider)),
    /**
     * The live catalogue of the vendor's own models, for the platform's discovery door.
     *
     * `listModels` above is this row's **declaration** — what the harness may route to — while this is
     * what the node itself advertises, asked over the same signed transport the node sweep uses and
     * under the same control ceiling. The two are different answers on purpose: the platform's own
     * model menu reads the declaration, and a surface that offers a model to *adopt* reads this one
     * (the page's picker does, through `llm/discoverModels`).
     *
     * The request is not read: its contract carries a provider, an address and a one-shot key
     * (`LlmModelDiscoveryRequest`), and there is no field that would say "the live one" — the donor's
     * own note on the same joint. The catalogue is always asked with the credential the row's
     * reference holds, which is the account whose models this row is about; a draft provider carrying
     * a key nobody has stored yet is answered from the stored one, and the caller's own cancellation
     * is honoured through the transport.
     * @param {object} [request] the platform's draft request, named here for the joint's shape
     * @param {AbortSignal} [signal] the caller's cancellation
     * @returns {Promise<object[]>} the models the node advertises, in the node's order
     */
    discoveredModels: async (request, signal) => {
      const models = await transport.catalogue({ signal })
      /* What the node itself published, written down once per read: the vendor's own output ceiling per
         model, which is the number this route declares to the platform. Two roads can be compared only
         by their numbers — the platform's own road declares its own models' ceiling, and this line says
         whether this route is poorer than its node or exactly as rich. */
      log(`qoder: the node published ${models.length} models, output ceilings ${JSON.stringify(models.map((model) => [model.id, model.maxTokens ?? null]))}`)
      return models.map((model) => ({
        id: model.id,
        name: model.name,
        inputModalities: modalitiesOf(model.vision),
        ...model.contextWindow === undefined ? {} : { contextWindow: model.contextWindow },
        ...model.maxTokens === undefined ? {} : { maxTokens: model.maxTokens },
      }))
    },
    resolveModel: (provider, model) => Promise.resolve(modelInfo(snapshot(), provider, model)),
    prepareCall: (provider, model) => {
      const bound = snapshot()
      return Promise.resolve({ model: modelInfo(bound, provider, model), stream: (call) => stream(call, bound) })
    },
    stream: (call) => stream(call, snapshot()),
  }

  /**
   * One attempt, as the platform's chunk stream.
   * @param {object} call the platform's `GenerateOptions`
   * @param {object} settings the generation bound to this attempt
   * @yields {object} the platform's chunks, ending with exactly one terminal `finish`
   */
  async function* stream(call, settings) {
    // The vendor executes neither of these, and the route refuses a request that
    // names them rather than dropping them in silence: a caller that asked for a temperature would
    // otherwise believe it was applied.
    const unsupported = call.temperature !== undefined ? 'temperature' : Array.isArray(call.stop) && call.stop.length > 0 ? 'stop' : undefined
    if (unsupported !== undefined) {
      yield refusalOf('UNSUPPORTED_OPTION', `the Qoder contour executes no ${unsupported}: the request names it and the vendor would ignore it`, call.signal)
      return
    }
    /* The attempt's own wall time, from before the pictures are read to the terminal: what a row of the
       spend journal means by the duration of a turn. */
    const startedAt = Date.now()
    let answer
    try {
      // The pictures of the request are resolved before the transport builds the body: the harness
      // gives durable references, the wire wants bytes, and a body builder that read files would stop
      // being the pure function the rest of this module is checked against.
      const messages = await resolveImages(call.messages ?? [], options.imageData, call.signal)
      // `call.system` is a caller's own prompt, not the harness's: a loop-built request carries the
      // prompt as the leading system **message** and leaves `options.system` undefined, so the body
      // builds the top-level string from the messages and keeps this value, when there is one, as the
      // prefix (`toWireMessages`).
      answer = await transport.chat({
        model: call.model,
        system: call.system ?? '',
        messages,
        tools: call.tools ?? [],
        maxTokens: call.maxTokens,
        reasoningEffort: call.reasoningEffort ?? effortOf(settings, call.model),
        signal: call.signal,
      })
    } catch (error) {
      yield { type: 'finish', reason: terminalOfFailure(error, call.signal) }
      return
    }
    try {
      yield* translate(answer.response, call, { transport, log, journal, startedAt })
    } catch (error) {
      yield { type: 'finish', reason: terminalOfFailure(error, call.signal) }
    }
  }
}

/**
 * The answer's frames as the platform's chunks, ending with exactly one terminal.
 *
 * The visible channel is read through the shutter: a retelling is dropped and counted,
 * a call written as markup is assembled, a thought written into that channel goes to reasoning, and
 * the turn's own words are what leaves it as text. What the shutter counts decides the classification
 * below — a swallowed retelling of 2 000 characters or more is a compaction request in disguise, not
 * an empty turn.
 * @param {Response} response the answer `chat` returned
 * @param {object} call the platform's `GenerateOptions`
 * @param {object} deps what the reading needs
 * @param {object} deps.transport the `qoderTransport` service, for its own ceilings on the read
 * @param {object} [deps.journal] the spend journal, told what this attempt cost
 * @param {number} [deps.startedAt] when the attempt left, for the row's own duration
 * @param {(message: string) => void} deps.log where a wiring defect is reported
 * @yields {object} the platform's chunks
 */
async function* translate(response, call, { transport, log, journal, startedAt }) {
  const shutter = createShutter({ summary: call.purpose === 'compaction' ? 'keep' : 'drop' })
  /** The one open text-or-reasoning block, and the counter the block indices come from. */
  let open
  let nextIndex = 0
  /** The wire's tool calls, by their own index; each carries the block index it was given. */
  const calls = new Map()
  let usage
  let finishReason
  let sawTerminal = false
  let textChars = 0
  let callCount = 0
  /**
   * The length of the reasoning channel: everything that entered it, whether the wire sent it as
   * `reasoning_content` or the model wrote a thought into the visible channel as markup. The channel is
   * one channel, and its length is the measurement an empty turn leaves behind — how long the model
   * thought before it died. It is the same figure the tally reports as `reasoningChars`.
   */
  let reasoningChars = 0
  /**
   * The delta keys the wire sent that this reader did not act on, by name and count. The reader tolerates
   * them, which must not read as not having seen them: the attempt carries them to its classification,
   * where the failure names them.
   */
  const unknownKeys = {}

  function* closeOpen() {
    if (open === undefined) return
    const block = open.kind === 'text' ? { type: 'text', text: open.text } : { type: 'reasoning', text: open.text }
    yield { type: 'block-end', index: open.index, block }
    open = undefined
  }

  function* say(kind, text) {
    if (open !== undefined && open.kind !== kind) yield* closeOpen()
    if (open === undefined) {
      open = { kind, index: nextIndex, text: '' }
      nextIndex += 1
      yield { type: 'block-start', index: open.index, blockType: kind }
    }
    open.text += text
    if (kind === 'reasoning') reasoningChars += text.length
    yield { type: kind === 'text' ? 'text-delta' : 'reasoning-delta', index: open.index, text }
  }

  /** One wire fragment of a call: the length of the block and its argument string, never a value. */
  function* wireCall(fragment) {
    const wireIndex = Number.isInteger(fragment.index) ? fragment.index : calls.size
    const id = typeof fragment.id === 'string' && fragment.id !== '' ? fragment.id : undefined
    const name = typeof fragment.function?.name === 'string' && fragment.function.name !== '' ? fragment.function.name : undefined
    let call0 = calls.get(wireIndex)
    if (call0 === undefined) {
      // A call begins where the prose has ended: the open text or reasoning block is closed first, so
      // the assembled message reads the way the model wrote it and no block is left hanging.
      yield* closeOpen()
      call0 = { blockIndex: nextIndex, id: id ?? '', name: name ?? '', json: '' }
      nextIndex += 1
      calls.set(wireIndex, call0)
      yield { type: 'block-start', index: call0.blockIndex, blockType: 'tool-call' }
    } else {
      // The wire's own rule: the id and the name arrive with the first fragment and must not
      // change afterwards. A call that changes them is malformed, and never executed with the
      // substituted values — the step is re-asked instead (the route's retry policy heals this code).
      if (id !== undefined && call0.id !== '' && id !== call0.id) throw malformed(`the Qoder tool call at index ${wireIndex} changed its id inside one block: ${call0.id} then ${id}`)
      if (name !== undefined && call0.name !== '' && name !== call0.name) throw malformed(`the Qoder tool call at index ${wireIndex} changed its name inside one block: ${call0.name} then ${name}`)
    }
    call0.id ||= id ?? ''
    call0.name ||= name ?? ''
    const argumentsDelta = typeof fragment.function?.arguments === 'string' ? fragment.function.arguments : ''
    call0.json += argumentsDelta
    yield { type: 'tool-call-delta', index: call0.blockIndex, id: call0.id, ...call0.name === '' ? {} : { name: call0.name }, argumentsDelta }
  }

  /** Close every call the wire left open, with the argument string it arrived with. */
  function* closeCalls() {
    for (const call0 of [...calls.values()].sort((left, right) => left.blockIndex - right.blockIndex)) {
      if (call0.closed === true) continue
      call0.closed = true
      if (call0.id === '' || call0.name === '') throw malformed(`a Qoder tool call ended without ${call0.id === '' ? 'an id' : 'a name'} and cannot be executed`)
      // No fragments at all is a legal no-argument call; a string that arrived is handed over
      // **exactly as it arrived** — never re-serialised, never repaired, never emptied. The harness
      // parses it itself: its own reading of arguments keeps an unparseable string as text, and the
      // tool's validation turns it into an error result the model can answer — a call the model wrote
      // wrongly is a step's problem, not a reason to end the session, and it is not ours to correct.
      callCount += 1
      yield { type: 'block-end', index: call0.blockIndex, block: { type: 'tool-call', id: call0.id, name: call0.name, arguments: call0.json === '' ? '{}' : call0.json } }
    }
  }

  for await (const line of transport.frames(response, { signal: call.signal })) {
    const read = readLine(line)
    if (read.kind === 'skip') continue
    if (read.kind === 'done') {
      sawTerminal = true
      continue
    }
    if (read.kind === 'refusal') {
      // Read through the same reader the first chunk goes through, and for the reason that reader exists:
      // the code a refusal travels as decides whether the policy may re-ask the turn. As a malformation of
      // our own reading it was retryable, so a counted allowance arriving in a later chunk was re-asked
      // five times, each re-ask meeting the same refusal, and the attempt finally reported an answer it
      // could not read instead of the contour's own words.
      throw refusalOfRead(read, 'the Qoder chat turn')
    }
    const frame = channelsOf(read.body)
    for (const key of frame.unknownKeys) unknownKeys[key] = (unknownKeys[key] ?? 0) + 1
    // The far side said the turn failed: never a frame to count and walk past. The vendor's own reader
    // takes this field before anything the frame carries.
    if (frame.error !== undefined) throw vendorFailure(frame.error)
    if (frame.reasoning !== undefined) yield* say('reasoning', frame.reasoning)
    if (frame.text !== undefined) {
      const decided = shutter.feed(frame.text)
      if (decided.reasoning !== '') yield* say('reasoning', decided.reasoning)
      if (decided.text !== '') {
        textChars += decided.text.length
        yield* say('text', decided.text)
      }
      for (const assembled of decided.calls) {
        // A call the shutter assembled out of markup: already complete, and its argument string is
        // the one the shutter built — this module never touches it.
        const blockIndex = nextIndex
        nextIndex += 1
        callCount += 1
        yield { type: 'block-start', index: blockIndex, blockType: 'tool-call' }
        yield { type: 'tool-call-delta', index: blockIndex, id: assembled.id, name: assembled.function.name, argumentsDelta: assembled.function.arguments }
        yield { type: 'block-end', index: blockIndex, block: { type: 'tool-call', id: assembled.id, name: assembled.function.name, arguments: assembled.function.arguments } }
      }
    }
    if (frame.calls !== undefined) for (const fragment of frame.calls) yield* wireCall(fragment)
    if (frame.usage !== undefined) usage = frame.usage
    if (frame.finishReason !== undefined) finishReason = frame.finishReason
  }

  const flushed = shutter.flush()
  if (flushed.reasoning !== '') yield* say('reasoning', flushed.reasoning)
  if (flushed.text !== '') {
    textChars += flushed.text.length
    yield* say('text', flushed.text)
  }
  yield* closeOpen()
  yield* closeCalls()

  const counters = { ...shutter.counters(), unknownKeys, reasoningChars }
  // The platform's journal is the only place a counter can be kept here, so anything the shutter had
  // to take out of the visible channel is said once, by name — a mark with no word is a defect of the
  // card this module closes, not a quiet detail.
  if (Object.keys(counters.tagsNeutral).length > 0) {
    log(`qoder: markup met in the visible channel of route ${ROUTE}: ${JSON.stringify(counters.tagsNeutral)}${counters.summaryChars === 0 ? '' : `, a summary of ${counters.summaryChars} characters dropped`}`)
  }

  /**
   * One row of the spend journal, when this attempt is one the wire counted. A turn whose answer carried
   * no usage frame spent nothing this route can name, and a row of zeros in a ledger of costs is worse
   * than no row: the journal is told only what arrived. The write here is the last thing before the
   * terminal leaves — a generator's code after a `yield` runs on the next `next()`, and a reader that
   * stops at the terminal would leave the turn unrecorded — and it never throws.
   */
  function recordSpend(finish) {
    if (usage === undefined) return
    journal?.record({ model: call.model, finish, durationMs: Date.now() - startedAt, usage })
  }

  // The wire's terminal, held back until the usage has arrived: the harness's rule is that the usage
  // precedes the terminal, and the vendor writes its usage frame *after* `finish_reason` (measured).
  if (!sawTerminal && finishReason === undefined) {
    const reason = terminalOfFailure(Object.assign(new Error('the Qoder answer ended without a terminal: no finish reason and no sentinel'), { code: 'TRANSPORT' }), call.signal)
    /* Counters that arrived before the stream broke are still what the vendor charged for, so the row
       stands even though the platform is told the attempt failed: this ledger is the spend's, not the
       platform's bookkeeping. A stream that sent no usage frame leaves no row at all. */
    recordSpend(reason)
    yield { type: 'finish', reason }
    return
  }
  if (usage !== undefined) {
    const counted = usageOf(usage)
    const vendor = vendorUsageOf(usage)
    yield {
      type: 'usage',
      usage: {
        inputTokens: counted.inputTokens,
        outputTokens: counted.outputTokens,
        // The platform's own arithmetic: the total is the sum of the parts, so a cache read is counted
        // once and not twice.
        totalTokens: counted.inputTokens + counted.outputTokens + (counted.cacheReadTokens ?? 0),
        ...counted.cacheReadTokens === undefined ? {} : { cacheReadTokens: counted.cacheReadTokens },
        ...vendor.reasoningTokens === undefined ? {} : { reasoningTokens: vendor.reasoningTokens },
      },
    }
  }
  const reason = reasonOf({ finishReason, sawTerminal, textChars, callCount, counters })
  recordSpend(reason)
  yield { type: 'finish', reason }
}

/**
 * The reason one attempt ended with, or the failure that stands where an answer should have been.
 *
 * The two classifications are the point of this module: a turn that ends carrying only reasoning
 * (or nothing usable) is **not** a normal `stop` — the harness would settle it as an empty turn and
 * the loop would stop with nothing to act on — so it is refused as
 * `EMPTY_RESPONSE`, the platform's own first retryable code, which is the only lever that recovers
 * such a turn (20 of 23 re-asks answered). A swallowed retelling of 2 000 characters or more is a
 * compaction request in disguise and is refused as `CONTEXT_WINDOW_EXCEEDED`: there the harness
 * compacts and re-runs the step.
 *
 * The sentence an empty turn is refused with is the record of what the attempt measured — the reasoning
 * channel's length, the dropped summary when there was one, and the delta keys this reader did not act
 * on — and it is carried there rather than logged because the platform writes a failure into its session
 * log, which is the only durable place a figure of one attempt reaches on this route.
 * @param {object} input what the attempt saw
 * @returns {object} the terminal reason
 */
export function reasonOf({ finishReason, sawTerminal, textChars, callCount, counters }) {
  const hasAnswer = textChars > 0 || callCount > 0
  const empty = () => {
    const reasoning = counters.reasoningChars ?? 0
    if (counters.summaryChars >= SUMMARY_ARTIFACT_CHARS) {
      return {
        kind: 'error',
        failure: {
          code: 'CONTEXT_WINDOW_EXCEEDED',
          message: `the model answered with a context-compaction summary instead of an answer: ${counters.summaryChars} characters of the summary were dropped${reasoning === 0 ? '' : `, and ${reasoning} characters of reasoning`}, no tool calls`,
        },
      }
    }
    // The reasoning characters are the measurement an empty turn leaves behind — how long the model
    // thought before it died — and this sentence is the only place that figure reaches a durable record,
    // because the platform writes the failure into its session log. The dropped summary is named beside
    // it only when there was one: on a reasoning-only turn the summary is zero, and a zero standing where
    // the measurement belongs is what the sentence used to report. The delta keys are named when the
    // attempt met any, because a channel this reader did not act on is the other explanation of an empty
    // turn that must not stay invisible.
    const summary = counters.summaryChars === 0 ? '' : `, ${counters.summaryChars} characters of a dropped summary`
    const keys = Object.keys(counters.unknownKeys ?? {})
    const unknown = keys.length === 0 ? '' : `; the frames also carried delta keys this route does not act on: ${keys.join(', ')}`
    return {
      kind: 'error',
      failure: {
        code: 'EMPTY_RESPONSE',
        message: `the model returned a completed response with no answer: ${reasoning} characters of reasoning${summary}, no text and no tool calls${unknown}`,
      },
    }
  }
  if (finishReason === undefined) {
    // The sentinel arrived without a reason: the turn ended, and what it carried decides what it was.
    if (!hasAnswer) return empty()
    return { kind: callCount > 0 ? 'tool-calls' : 'stop' }
  }
  switch (finishReason) {
    case 'stop':
      return hasAnswer ? { kind: 'stop' } : empty()
    case 'tool_calls':
      return hasAnswer ? { kind: 'tool-calls' } : empty()
    case 'length':
      return { kind: 'max-tokens' }
    default:
      // A reason this route does not map is a response it cannot read: refused with the platform's own
      // code for that, which is retryable, rather than settled as a `stop` nobody asked for.
      return { kind: 'error', failure: { code: 'MALFORMED_RESPONSE', message: `the Qoder contour ended the turn with a finish reason this route does not map: ${JSON.stringify(finishReason)}` } }
  }
}
