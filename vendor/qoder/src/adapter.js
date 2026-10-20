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
 * @module @coreness/qoder/src/adapter
 */

import { FrameError, channelsOf, readLine, usageOf, vendorUsageOf } from './frames.js'
import { reasonOf, refusalOfRead } from './in.js'
import { createShutter } from './markup.js'
import { resolveImages } from './images.js'
import { DEFAULT_CONTEXT_WINDOW, declaredModels, effortOf, modelInfo, modalitiesOf } from './models.js'

/** The route id the live profile already names. */
export const ROUTE = 'qoder'

/** The name the platform's own pages show for the route. */
export const DISPLAY_NAME = 'Qoder'

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
 * Node's network causes, the ones a `fetch` failure carries instead of its own code.
 *
 * The outer `TypeError: fetch failed` is the same for a reset, a refused connection and a dead DNS; the
 * reason a reader routes on is one level down, in `cause.code` — and, for a host with several addresses,
 * in `cause.errors[].code`. Only these causes are transport: a certificate failure is permanent, and a
 * retry would spend the budget without healing it.
 */
const TRANSPORT_CAUSES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'EPIPE', 'ETIMEDOUT',
  'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH', 'ENETUNREACH', 'ENETDOWN',
  'UND_ERR_SOCKET', 'UND_ERR_CLOSED', 'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
])

/**
 * The transport reason in an error and its cause chain, and whether any node at all carried a code.
 *
 * The walk is breadth-first, bounded and skips a node it has already seen: an `AggregateError` with
 * several addresses, a self-referencing cause and a cycle all return. The `coded` flag is what keeps a
 * permanent cause — a certificate failure, whose code is not transport — from falling into the generic
 * `fetch failed` door.
 * @param {unknown} error what was thrown
 * @param {number} [depth] how many cause levels to read
 * @returns {{code?: string, first?: string, coded: boolean}} the first transport code, the first code seen, and whether any node carried one
 */
export function causesOf(error, depth = 5) {
  let level = [error]
  const seen = new Set()
  let coded = false
  let first
  for (let step = 0; step < depth && level.length > 0; step += 1) {
    const next = []
    for (const node of level) {
      if (node === null || typeof node !== 'object' || seen.has(node)) continue
      seen.add(node)
      if (typeof node.code === 'string' && node.code !== '') {
        coded = true
        first ??= node.code
        if (TRANSPORT_CAUSES.has(node.code)) return { code: node.code, first, coded: true }
      }
      if (node.cause !== undefined) next.push(node.cause)
      if (Array.isArray(node.errors)) next.push(...node.errors)
    }
    level = next
  }
  return { code: undefined, first, coded }
}

/** Whether the value is the TypeError Node's `fetch` rejects a network failure with. */
function fetchFailure(error) {
  return error?.name === 'TypeError' && error?.message === 'fetch failed'
}

/**
 * The failure a thrown value stands for, in the platform's words.
 *
 * The kind is the platform's distinction, not a courtesy: a caller's cancellation is `aborted` — an
 * outcome of its own in the contract, which the loop and the retry policy both read — while everything
 * else is `error`. The status travels when the contour gave one, because a reader looking at a refusal
 * wants the number the vendor sent.
 *
 * A transport failure from Node's `fetch` is the case the outer value cannot name: its `TypeError` has no
 * `code`, and the reason is in the cause chain (or `cause.errors`), so the code travels from there. An
 * explicit code still wins; a cause code outside the transport set is not turned into one.
 * @param {unknown} error what was thrown
 * @param {AbortSignal} [signal] the caller's signal
 * @returns {{kind: 'aborted' | 'error', failure: object}} the terminal reason
 */
export function terminalOfFailure(error, signal) {
  const explicit = typeof error?.code === 'string' && error.code !== ''
  const causes = causesOf(error)
  const code = error instanceof FrameError ? 'MALFORMED_RESPONSE'
    : explicit ? PLATFORM_CODES[error.code] ?? (TRANSPORT_CAUSES.has(error.code) ? 'TRANSPORT' : error.code)
      : causes.code !== undefined || (fetchFailure(error) && !causes.coded) ? 'TRANSPORT'
        : 'UNKNOWN'
  const aborted = signal?.aborted === true || code === 'ABORTED'
  const status = Number.isInteger(error?.status) && error.status >= 100 && error.status <= 599 ? error.status : undefined
  const fallback = `${code}: the Qoder route failed`
  const base = typeof error?.message === 'string' && error.message !== '' ? error.message : fallback
  const cause = causes.code ?? (explicit ? undefined : causes.first)
  return {
    kind: aborted ? 'aborted' : 'error',
    failure: {
      message: cause === undefined || base.includes(cause) ? base : `${base} (${cause})`,
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
    journal?.record({ model: call.model, session: call.sessionId, finish, durationMs: Date.now() - startedAt, usage })
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
