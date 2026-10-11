/**
 * The stream of the chat call: the framing, the envelope around each chunk, the channels,
 * and the three signals that end a turn.
 *
 * The framing is read defensively in one place and one way: a gateway that answers with a string
 * body, an object body, a status inside the body, or a terminal in either of its two shapes is
 * the same contour seen on different days, not four protocols.
 *
 * The visible channel goes through the shutter wherever a turn is read: the model
 * sometimes writes its reasoning, a call or a whole retelling into that channel as tags, and a tag
 * that reached the answer as text would be stored, folded back up on the next turn and never
 * recognised as our own mistake.
 *
 * @module @coreness/dsh/plugins/provider/qoder/frames
 */

import { createShutter } from './markup.js'

/** The terminal sentinel of the feed. */
export const DONE = '[DONE]'

/** The chunk kinds the harness assembles from; the reader names them, it does not build them. */
export const CHANNELS = ['reasoning', 'text', 'tool-call', 'usage', 'finish']

/** The channel a frame with no `choices` carries: telemetry, and nothing else. */
export const TELEMETRY = 'telemetry'

/**
 * The delta keys this reader **knows**: the three channels it reads (`content`, `reasoning_content`,
 * `tool_calls`) and `role`, which the first frame of a turn carries and which no channel uses. The list
 * is what is read, not what is legal. The vendor's own delta type declares two fields beyond it —
 * `ResponseChatMessage.reasoning_item = 5` and `.extends = 6` — and the reference client, the Qoder
 * application itself, refuses no key at all: it forwards
 * `choices[0].delta` whole and tests only the fields it reads, so a delta carrying only `extends` is a
 * no-op event and the stream continues. A key outside this list is therefore not refused — refusing one
 * killed seven attempts of the live session `session-db4f652b` mid-turn, every one naming `extends`. The
 * frame keeps the names it did not act on (`unknownKeys`) and the caller counts them: tolerated is not
 * the same as unrecorded.
 */
export const DELTA_KEYS = ['role', 'content', 'reasoning_content', 'tool_calls']

/**
 * A frame that is not an envelope: not JSON, or not carrying a usable status.
 * The caller decides what to do with it; this module does not drop it in silence.
 */
export class FrameError extends Error {}

/**
 * The status of one envelope.
 *
 * It is read **numerically**: the gateway reports a refusal in this field, and a `"500"`
 * taken for success would turn a refusal into an ordinary chunk.
 * @param {unknown} value the `statusCodeValue` field
 * @returns {number} the status
 * @throws {FrameError} when the field is present but not a finite number
 */
export function statusOf(value) {
  if (value === undefined || value === null) return 200
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  throw new FrameError(`the frame's status is not a number: ${JSON.stringify(value).slice(0, 40)}`)
}

/**
 * The envelope of one `data:` payload.
 * @param {string} payload the payload after `data:`
 * @returns {{status: number, body: unknown}} the envelope
 * @throws {FrameError} when the payload is not envelope JSON
 */
export function parseEnvelope(payload) {
  let parsed
  try {
    parsed = JSON.parse(payload)
  } catch {
    throw new FrameError('the frame is not JSON')
  }
  const record = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  return { status: statusOf(record.statusCodeValue), body: record.body }
}

/**
 * One `data:` line, read as far as its kind.
 *
 * The sentinel is read **before** the status: the vendor's own parser skips its status throw for the
 * finish event and parses the body as it always does, so a frame that carries the sentinel ends the
 * stream whatever its `statusCodeValue` says. Narrowly — the sentinel itself is the only body that needs
 * no status; every other non-200 body stays a refusal.
 * @param {string} line the raw line
 * @returns {{kind: 'chunk' | 'done' | 'refusal' | 'skip', status?: number, body?: unknown, text?: string}}
 *   `done` for either shape of the sentinel, `refusal` for a non-200 status (with the body
 *   as text when it is a string), `skip` for anything that carries no chunk
 * @throws {FrameError} when the line is an envelope that cannot be read
 */
export function readLine(line) {
  const trimmed = line.replace(/\r$/u, '').trim()
  if (!trimmed.startsWith('data:')) return { kind: 'skip' }
  const payload = trimmed.slice(5).trim()
  if (payload === '' || payload === DONE) return payload === DONE ? { kind: 'done' } : { kind: 'skip' }
  const envelope = parseEnvelope(payload)
  if (typeof envelope.body === 'string' && envelope.body.trim() === DONE) return { kind: 'done' }
  if (envelope.status !== 200) {
    return { kind: 'refusal', status: envelope.status, text: textOfBody(envelope.body) }
  }
  const chunk = innerChunk(envelope.body)
  if (chunk === undefined) return { kind: 'skip' }
  return { kind: 'chunk', body: chunk }
}

/**
 * The body of an envelope as text, for a refusal's message.
 * @param {unknown} body the envelope body
 * @returns {string} the text
 */
export function textOfBody(body) {
  if (typeof body === 'string') return body
  try {
    return JSON.stringify(body) ?? String(body)
  } catch {
    return String(body)
  }
}

/**
 * The inner chunk: the gateway sends it as a JSON **string** and sometimes as an object.
 * @param {unknown} body the envelope body
 * @returns {object | undefined} the chunk, or nothing when the body carries none
 * @throws {FrameError} when the body claims to be a chunk and is not
 */
export function innerChunk(body) {
  if (typeof body === 'string') {
    const trimmed = body.trim()
    if (trimmed === '' || trimmed === DONE) return undefined
    let parsed
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      throw new FrameError(`the inner chunk is not JSON: ${trimmed.slice(0, 80)}`)
    }
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined
  }
  if (body !== null && typeof body === 'object' && !Array.isArray(body)) return body
  return undefined
}

/**
 * The reason one choice gives for ending, or nothing where the wire gave none.
 *
 * The string `"null"` is a reason the vendor's own client reads as **no reason at all** — its reader takes
 * a non-empty `finish_reason` other than that spelling — so a turn whose only reason is that spelling
 * ended without one and is settled by what it carried. Every other non-empty string is a reason, mapped
 * or refused by the caller's classifier.
 * @param {object} [choice] one choice of the chunk
 * @returns {string | undefined} the reason, or nothing
 */
function finishReasonOf(choice) {
  const reason = choice?.finish_reason
  return typeof reason === 'string' && reason !== '' && reason !== 'null' ? reason : undefined
}

/**
 * The failure one chunk carries in its own `error` field, in the far side's own words.
 *
 * The vendor's own reader takes this field **first** — before usage, the finish reason and the delta —
 * and fails the turn with it; its classifier reads the message from the object itself or from a nested
 * `error`, and keeps the far side's own code and status. Both nestings arrive on this wire, and a bare
 * string does too; none of them is a frame to count as telemetry. The field is judged the way their own
 * reader judges it — by truthiness — so an empty spelling of it is the absence of an error, not a turn to
 * fail.
 * @param {unknown} value the chunk's `error` field
 * @returns {{message: string, code?: string, status?: number} | undefined} the far side's words, or
 *   nothing when the chunk carries no error
 */
function errorOf(value) {
  if (!value) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) return { message: textOfBody(value) }
  const nested = value.error !== null && typeof value.error === 'object' && !Array.isArray(value.error) ? value.error : undefined
  const message = [value.message, nested?.message].find((one) => typeof one === 'string' && one.trim() !== '')
  const code = [value.code, nested?.code].find((one) => typeof one === 'string' && one.trim() !== '')
  const status = [value.status, nested?.status].find((one) => Number.isInteger(one))
  return {
    message: message ?? textOfBody(value),
    ...code === undefined ? {} : { code },
    ...status === undefined ? {} : { status },
  }
}

/**
 * What one inner chunk carries, by channel.
 *
 * Recognition of the wire's own channels, and of nothing else: the caller assembles blocks and
 * decides what the end of a turn means, and a stretch of the visible channel must go through the
 * shutter before it becomes text — this function reports the channel, not the answer.
 *
 * The reader acts on the channels it knows and refuses no frame over a key it does not: the vendor's own
 * delta type declares fields beyond `DELTA_KEYS`, and the reference client forwards such a delta as the
 * no-op it is. Nothing is flattened into an answer and nothing is invented — the names not acted on come
 * back in `unknownKeys` for the caller to count, which is what keeps tolerance from being silence. A
 * frame that is genuinely unreadable is refused before this function sees it (`parseEnvelope`,
 * `innerChunk`). Two frames are named rather than tolerated: one carrying the far side's own `error`,
 * which is the end of the turn, and one whose only field is a `finish_reason` spelled `"null"`, which is
 * no reason at all.
 * @param {object} chunk the inner chunk
 * @returns {{channel: string, unknownKeys: string[], reasoning?: string, text?: string, calls?: object[],
 *   usage?: object, finishReason?: string, error?: object}} the frame's content; `unknownKeys` names the
 *   delta keys (or, for a choice carrying nothing readable, the choice keys) this reader did not act on,
 *   and is empty when there were none
 */
export function channelsOf(chunk) {
  const choices = Array.isArray(chunk.choices) ? chunk.choices : []
  const choice = choices.length > 0 && choices[0] !== null && typeof choices[0] === 'object' ? choices[0] : undefined
  const delta = choice?.delta !== null && typeof choice?.delta === 'object' ? choice.delta : undefined
  const frame = { unknownKeys: [] }
  if (delta !== undefined) {
    frame.unknownKeys = Object.keys(delta).filter((key) => !DELTA_KEYS.includes(key))
  } else if (choice !== undefined && finishReasonOf(choice) === undefined && !DELTA_KEYS.some((key) => key in choice)) {
    // A choice that carries nothing this reader acts on: no delta, no reason with a value, no key of the
    // list. Its names are recorded and the frame carries no channel — the vendor's non-streaming shape, or
    // a field added after this reader was written, is not a reason to end a turn. `finish_reason` is not
    // among the names: a reason spelled `"null"` is a key this reader acted on, having read it as none.
    frame.unknownKeys = Object.keys(choice).filter((key) => key !== 'finish_reason')
  }
  const failure = errorOf(chunk.error)
  if (failure !== undefined) frame.error = failure
  if (typeof delta?.reasoning_content === 'string' && delta.reasoning_content !== '') frame.reasoning = delta.reasoning_content
  if (typeof delta?.content === 'string' && delta.content !== '') frame.text = delta.content
  const calls = Array.isArray(delta?.tool_calls) ? delta.tool_calls.filter((call) => call !== null && typeof call === 'object') : []
  if (calls.length > 0) frame.calls = calls
  if (chunk.usage !== null && typeof chunk.usage === 'object' && !Array.isArray(chunk.usage)) frame.usage = chunk.usage
  const finishReason = finishReasonOf(choice)
  if (finishReason !== undefined) frame.finishReason = finishReason
  frame.channel = frame.error !== undefined ? 'error'
    : frame.reasoning !== undefined ? 'reasoning'
      : frame.text !== undefined ? 'text'
        : frame.calls !== undefined ? 'tool-call'
          : frame.usage !== undefined ? 'usage'
            : frame.finishReason !== undefined ? 'finish'
              : TELEMETRY
  return frame
}

/**
 * The usage of one call, in the harness's counts.
 *
 * The contour's `prompt_tokens` **includes** the cache hits; the harness's input count
 * must not, and the cached part is reported separately — without the subtraction every
 * request's input is counted twice.
 * @param {object} usage the wire usage object
 * @returns {{inputTokens: number, outputTokens: number, totalTokens?: number, cacheReadTokens?: number}}
 *   the harness counts
 */
export function usageOf(usage) {
  const prompt = Number.isFinite(usage?.prompt_tokens) ? usage.prompt_tokens : 0
  const cached = Number.isFinite(usage?.prompt_tokens_details?.cached_tokens) ? usage.prompt_tokens_details.cached_tokens : 0
  const completion = Number.isFinite(usage?.completion_tokens) ? usage.completion_tokens : 0
  return {
    inputTokens: Math.max(prompt - cached, 0),
    outputTokens: completion,
    ...Number.isFinite(usage?.total_tokens) ? { totalTokens: usage.total_tokens } : {},
    ...cached > 0 ? { cacheReadTokens: cached } : {},
  }
}

/**
 * The numbers the contour reports about itself, which the harness contract has no field
 * for. They are observation, not a request: they go to the caller's journal.
 * @param {object} usage the wire usage object
 * @returns {object} the contour's own counters, empty when it reported none
 */
export function vendorUsageOf(usage) {
  const numbers = {
    credits: usage?.credits,
    originalCredits: usage?.original_credits,
    reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens,
    cachedTokens: usage?.prompt_tokens_details?.cached_tokens,
  }
  const out = {}
  for (const [key, value] of Object.entries(numbers)) {
    if (Number.isFinite(value)) out[key] = value
  }
  if (typeof usage?.billable === 'boolean') out.billable = usage.billable
  return out
}

/**
 * Whether a turn has ended, and by which of the three equal signals.
 *
 * The literal sentinel, the sentinel inside the body, and a `finish_reason` on a chunk all
 * end a turn; a feed that closes with none of them is a broken stream, not a short answer.
 * @param {{sawDone: boolean, sawFinishReason: boolean}} seen what the reader saw
 * @returns {{ended: boolean, signal: 'sentinel' | 'finish-reason' | 'none'}} the verdict
 */
export function terminalOf({ sawDone, sawFinishReason }) {
  if (sawDone && sawFinishReason) return { ended: true, signal: 'sentinel' }
  if (sawDone) return { ended: true, signal: 'sentinel' }
  if (sawFinishReason) return { ended: true, signal: 'finish-reason' }
  return { ended: false, signal: 'none' }
}

/**
 * Read a whole response body, line by line, into a tally.
 *
 * The reader is deliberately one pass that never holds the feed: it counts what came,
 * remembers the channels seen, and reports the terminal. Frames that carry no chunk are
 * counted too — telemetry is the only sign of life a silent turn has.
 *
 * The visible channel is counted **as the answer it would become**: it passes through the shutter, so a
 * tag's body never stands in `textChars` — a retelling in the summary family leaves it at zero, and the
 * counters below say what was met and what was done with it. That is the whole point of the tally:
 * without a name for it, a dropped retelling and a silent turn read alike.
 * A delta key this reader did not act on is counted the same way, by name (`unknownKeys`): a field the
 * vendor added after this reader was written shows up in every instrument that reads a feed back.
 * @param {string} text the whole body
 * @param {object} [options] the read
 * @param {'drop' | 'keep'} [options.summary] `keep` for the auxiliary compaction call, whose body the
 *   harness itself asked for; every ordinary turn drops a summary block
 * @returns {{frames: number, chunks: number, telemetry: number, refusals: object[], reasoning: number,
 *   text: number, calls: number, textChars: number, reasoningChars: number, markupReasoningChars: number,
 *   markupCalls: number, usage?: object, vendor?: object, finishReasons: string[], done: boolean,
 *   signal: string, ended: boolean, summaryBlocks: number, summaryChars: number, summaryHead: string,
 *   unknownKeys: object, markupSeen: object, tagsNeutral: object, tagsQuoted: object,
 *   markupUnclosed: object}}
 *   the tally
 * @throws {FrameError} when a frame cannot be read
 */
export function tallyBody(text, options = {}) {
  const shutter = createShutter(options)
  const tally = {
    frames: 0,
    chunks: 0,
    telemetry: 0,
    refusals: [],
    reasoning: 0,
    text: 0,
    calls: 0,
    textChars: 0,
    reasoningChars: 0,
    markupReasoningChars: 0,
    markupCalls: 0,
    finishReasons: [],
    unknownKeys: {},
    done: false,
    ended: false,
    signal: 'none',
  }
  /** What the shutter decided about a stretch of the visible channel, wherever it came from. */
  const decidedByShutter = (decided) => {
    tally.textChars += decided.text.length
    if (decided.reasoning !== '') {
      tally.markupReasoningChars += decided.reasoning.length
      tally.reasoningChars += decided.reasoning.length
    }
    for (const call of decided.calls) {
      tally.calls += 1
      tally.markupCalls += 1
    }
  }
  let sawFinishReason = false
  for (const line of String(text).split('\n')) {
    const read = readLine(line)
    if (read.kind === 'skip') {
      // A `data:` line that carries no chunk is a shape of its own, not nothing: the vendor writes its
      // own timings this way once per turn (`data:{"firstTokenDuration":…,"totalDuration":…}`, measured
      // in all ten captured feeds), so it is counted as telemetry — the same
      // bucket as the frames that carry neither a channel nor a choice. A line that is not `data:` at
      // all (an `event:` line, a banner) is the framing of the stream and is counted nowhere.
      if (line.trim().startsWith('data:')) {
        tally.frames += 1
        tally.telemetry += 1
      }
      continue
    }
    tally.frames += 1
    if (read.kind === 'done') {
      tally.done = true
      continue
    }
    if (read.kind === 'refusal') {
      tally.refusals.push({ status: read.status, detail: read.text })
      continue
    }
    const frame = channelsOf(read.body)
    // Counted before the channel is judged: a frame that carries no channel at all can still be the one
    // that names a field this reader has never acted on, and that fact must not fall with the frame.
    for (const key of frame.unknownKeys) tally.unknownKeys[key] = (tally.unknownKeys[key] ?? 0) + 1
    if (frame.channel === TELEMETRY) {
      tally.telemetry += 1
      continue
    }
    tally.chunks += 1
    if (frame.reasoning !== undefined) {
      tally.reasoning += 1
      tally.reasoningChars += frame.reasoning.length
    }
    if (frame.text !== undefined) {
      tally.text += 1
      decidedByShutter(shutter.feed(frame.text))
    }
    if (frame.calls !== undefined) tally.calls += frame.calls.length
    if (frame.usage !== undefined) tally.usage = usageOf(frame.usage)
    if (frame.usage !== undefined) tally.vendor = vendorUsageOf(frame.usage)
    if (frame.finishReason !== undefined) {
      tally.finishReasons.push(frame.finishReason)
      sawFinishReason = true
    }
  }
  decidedByShutter(shutter.flush())
  Object.assign(tally, shutter.counters())
  const terminal = terminalOf({ sawDone: tally.done, sawFinishReason })
  tally.ended = terminal.ended
  tally.signal = terminal.signal
  return tally
}
