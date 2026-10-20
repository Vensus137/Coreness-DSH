/**
 * Getting in: the node map, the token exchange, the profile, the catalogue, and the one
 * call that matters — the chat turn.
 *
 * The job token lives 24 hours by the vendor's own field, and **two live job tokens of one personal
 * token coexist**: a second exchange, and a refresh, leave the first one answering — measured over three
 * repetitions, a refresh, bursts and a flood of exchanges. What a job token cannot survive is the
 * vendor's own eviction: the contour then answers `403 {"code":"105","message":"Login expired"}` — the
 * wording for "the token I was given is not active", reachable with a token no account event ever touched —
 * and a cached token refused this way stays worthless for the rest of its declared life, so the cache is
 * keyed by the personal token's fingerprint and **a dead-session refusal drops it** wherever the refusal
 * arrives (`sessionExpired`).
 *
 * @module @coreness/qoder/src/in
 */

import { deadline, timeoutOf } from '@deepseek-ai/dsh-timeout'
import { readLine } from './frames.js'
import { SUMMARY_ARTIFACT_CHARS } from './models.js'

/** The centre of the international contour: the node map is asked there. */
export const DEFAULT_CENTER_ORIGIN = 'https://center.qoder.sh'
/** The OpenAPI host: the token exchange, the refresh and the profile. */
export const DEFAULT_OPENAPI_ORIGIN = 'https://openapi.qoder.sh'
/** The node-map path. */
export const ENDPOINTS_PATH = '/algo/api/v2/service/region/endpoints'
/** The catalogue path, on the inference node. */
export const MODEL_LIST_PATH = '/algo/api/v2/model/list'
/** The chat path, on the inference node; `Encode=1` turns the body encoder on. */
export const CHAT_PATH = '/algo/api/v2/service/pro/sse/agent_chat_generation?FetchKeys=llm_model_result&AgentId=agent_common&Encode=1'
/** The exchange path. */
export const EXCHANGE_PATH = '/api/v1/jobToken/exchange'
/** The refresh path. */
export const REFRESH_PATH = '/api/v1/jobToken/refresh'
/** The profile path. */
export const USERINFO_PATH = '/api/v1/userinfo'
/**
 * The web-search path on the centre. The vendor's own `prepareRequest` prefixes the centre path
 * with `/algo`; the signature strips it again. The bare `/api` path answers `401` to every COSY
 * shape — measured live — so the `/algo` form is the address, not a decoration.
 */
export const WEB_SEARCH_PATH = '/algo/api/v1/webSearch/oneSearch'

/** How long a job token lives when the answer names no expiry. */
const ASSUMED_TTL_MS = 24 * 60 * 60 * 1000

/**
 * The three ceilings, each on a different thing. The numbers are chosen — two from measurement, one
 * from the harness — and each is a setting of the row, so calibration is a row edit and never a code
 * edit. Every firing is counted (`strikes`), because a ceiling nobody can see is a ceiling nobody
 * can calibrate.
 */

/** The ceiling of a control call: the node map, the exchange, the refresh, the profile, the catalogue. */
export const DEFAULT_CONTROL_CEILING_MS = 10_000

/** The ceiling on the wait for the answer's **first byte**: a stream that has opened and never spoke. */
export const DEFAULT_FIRST_BYTE_CEILING_MS = 15_000

/**
 * The ceiling on the silence *inside* an answer that has started.
 *
 * The one number taken from the harness rather than measured here: its own providers use
 * `DEFAULT_STREAM_IDLE_TIMEOUT_MS = 3e5` for a stream read that outlives its demand. Their reason is
 * ours: while a model is producing a long
 * reasoning stretch, only the transport owes frames, and cutting that at seconds risks killing a
 * legitimate turn — and no measurement of ours says a legitimate gap is short.
 */
export const DEFAULT_IDLE_CEILING_MS = 300_000

/** The code the harness's own timeout reason carries for each ceiling, so a firing can be classified. */
const CONTROL_CODE = 'QODER_CONTROL'
export const FIRST_BYTE_CODE = 'QODER_FIRST_BYTE'
export const IDLE_CODE = 'QODER_STREAM_IDLE'

/** The ceiling names as the row's settings spell them, so a strike can name the row setting. */
export const CEILING_SETTINGS = Object.freeze({
  control: 'controlCeilingMs',
  firstByte: 'firstByteCeilingMs',
  idle: 'idleCeilingMs',
})

/** A refusal from the contour, carrying what the caller needs to route it. */
export class QoderError extends Error {
  /**
   * @param {string} message what happened, in words
   * @param {string} code the stable code the caller routes on
   * @param {{status?: number, cause?: unknown, vendor?: string, vendorCode?: string|null}} [details] the
   *   wire status, the cause, the far side's own words when a refusal carried them — the words are what a
   *   reader routes a dead session by (`sessionExpired`), and reading them off our own sentence would be a
   *   copy — and the far side's **own code** out of that body (`vendorCodeOf`), which is the only thing a
   *   reader may convict a value by: our own `AUTH` is a status read, and every `401`/`403` gets it
   */
  constructor(message, code, details = {}) {
    super(message, details.cause === undefined ? undefined : { cause: details.cause })
    this.name = 'QoderError'
    this.code = code
    this.status = details.status
    this.vendor = details.vendor
    this.vendorCode = details.vendorCode ?? null
  }
}

/**
 * The contour's own code out of a refusal body — the `code` it sends, or the `errorCode` of a rejected
 * request — and `null` where the body carries none this route can read.
 *
 * This is the fact the check convicts a value by and nothing else is: a status is what the *envelope*
 * says, and this contour answers `403` both for a value that is not active (`{"code":"105"}`) and for an
 * account whose counted allowance is spent (`{"code":"110"}`), which are statements about different
 * things. A body that is not JSON, or one without a code, answers `null` — "the vendor said nothing about
 * a code" — and a reader must treat that as unknown rather than as a refusal (`verifyToken`).
 * @param {string} text the refusal's own words, as `refusalOf` read them
 * @returns {string|null} the code, as a string, or null
 */
export function vendorCodeOf(text) {
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  const code = body?.code ?? body?.errorCode
  if (typeof code === 'string' && code !== '') return code
  if (Number.isFinite(code)) return String(code)
  return null
}

/**
 * The vendor's own request id out of a refusal body, when it sent one.
 *
 * The one field of that body a support question needs — measured on the exchange door:
 * `{"errorCode":"BadRequest","errorMessage":"Bad request","requestId":"7ceed3ff-…"}` — and the only
 * thing the sentence a reader acts on may carry out of it. The body itself belongs to the log and to
 * `QoderError.vendor`, not to a message a surface draws whole: the panel draws the message as its own
 * reason ("the vendor refused this token: {reason}"), where a body welded in is the whole of what the
 * reader sees and the sentence that matters is lost inside it. A
 * body that is not JSON, or one without a usable id, answers `null` and nothing is invented for it.
 * @param {string} text the refusal's own words, as `refusalOf` read them
 * @returns {string|null} the id, or null
 */
export function requestIdOf(text) {
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  const id = body?.requestId
  return typeof id === 'string' && id !== '' ? id : null
}

/** The room a drawn sentence gives the vendor's own words: a line's budget, not a measured constant. */
const VENDOR_WORDS_LIMIT = 160

/**
 * The vendor's own words out of a refusal body, for the shape that carries no request id.
 *
 * The second measured shape of the same door — `403 {"code":"105","message":"Login expired"}`, a dead
 * credential — where the message is the whole of what a user can act on and there is no id at all.
 * They are read only where the id is absent: a body that carries **both** shows the id alone, because an
 * id is the vendor asking for a request to be traced while its message is a formality (`Bad request` is
 * the measured one). That is the price of the rule, and it is revisited on a measurement rather than
 * broadened on a guess. The bound is a line's budget — the log keeps the whole body — and the cut ends
 * at a word, with the ellipsis saying it was cut. A body that is not JSON, or one without words,
 * answers `null` and nothing is invented for it.
 * @param {string} text the refusal's own words, as `refusalOf` read them
 * @returns {string|null} the vendor's words, one line and bounded, or null
 */
export function vendorWordsOf(text) {
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  const words = body?.message ?? body?.errorMessage
  if (typeof words !== 'string') return null
  const line = words.replace(/\s+/gu, ' ').trim()
  if (line === '') return null
  if (line.length <= VENDOR_WORDS_LIMIT) return line
  const head = line.slice(0, VENDOR_WORDS_LIMIT)
  const at = head.lastIndexOf(' ')
  return `${at > 0 ? head.slice(0, at) : head}…`
}

/**
 * The contour's own refusal of an allowance it counts, rather than of a credential.
 *
 * `403 {"code":"110","message":"Billing daily count exceeded"}` — measured on the live route while the
 * stored personal token exchanged, the balance and the campaigns answered `200` and the catalogue was
 * read. Read as an authentication failure it sends every reader to the
 * credential store and nowhere else: the platform paints **every** `AUTH` as "API key is invalid"
 * (`message.failure.auth`, in the application's own bundle) whatever the vendor said, and the route then
 * looks broken in a way no restart repairs. The platform's own reading of a quota does not know this
 * wording either — "daily count exceeded" matches none of the phrases of `isQuotaExceededError` — so the
 * contour's shape is read here: the code it sends for a
 * counted allowance, and the words it says it in.
 * @param {string} text the refusal's own words
 * @returns {boolean} true when the refusal is over an allowance, not over a credential
 */
function allowanceRefused(text) {
  return /"code"\s*:\s*"?110"?/u.test(text) || /\bdaily[\s_-]+count\b/iu.test(text)
}

/**
 * The contour's own codes for a credential or a signature that is not good — and the only ones a **turn**
 * convicts the store by. `401`/`403` are what the envelope says; what the vendor says is its code, and this
 * contour answers `403` for a plan without seats (`{"code":"999"}`), for a body a proxy wrote and for no
 * body at all, none of which is a statement about the credential. Reading those as `AUTH` sends a reader to
 * the credential store on a claim the vendor never made: the platform paints **every** `AUTH` as "API key is
 * invalid" (`message.failure.auth`, in the application's own bundle). The value check reads the same fact
 * with its own list (`VALUE_REFUSED_CODES`: `105`, `TOKEN_EXPIRE`, `BadRequest` — the shape a wrong paste
 * gets on the exchange door, which no turn travels).
 */
export const TURN_REFUSED_CODES = Object.freeze(['105', 'TOKEN_EXPIRE', '101'])

/**
 * The stable code for a refusal, by the status the contour named.
 *
 * 401/403 read as an authentication failure, `429` as throttling, `5xx` as an upstream fault — and two
 * shapes of this contour are **not** what their status says. A saturated queue is a rate limit, not an
 * authentication failure, even when it arrives with an authentication status: a fresh token does not
 * bypass a queue, and an authentication code is outside the platform's retry set. A counted allowance is
 * the platform's `QUOTA` — the code whose own words are an exhausted account quota or balance, and the
 * one a reader
 * routes on — for the same reason (`allowanceRefused`). The vendor's message travels either way: the code
 * decides the label, never the words.
 * @param {number} status the status the refusal carried
 * @param {string} [text] the refusal's own words
 * @returns {string} the code the caller routes on
 */
export function codeFor(status, text = '', { credentialDoor = false } = {}) {
  if (/"(?:isQueued|queueCount|serviceAvailable|retryAfterSeconds)"/u.test(text)) return 'RATE_LIMIT'
  if (allowanceRefused(text)) return 'QUOTA'
  if (status === 429) return 'RATE_LIMIT'
  if (status === 401 || status === 403) {
    if (credentialDoor) return 'AUTH'
    if (sessionExpired(text)) return 'AUTH'
    const vendorCode = vendorCodeOf(text)
    if (vendorCode !== null && TURN_REFUSED_CODES.includes(vendorCode)) return 'AUTH'
    return 'UPSTREAM'
  }
  if (status >= 500) return 'SERVER'
  return 'UPSTREAM'
}

/**
 * The contour's own statement that the job token it was given is not active.
 *
 * `403 {"code":"105","message":"Login expired"}` on the signed chat door, while the REST door answers a
 * different vocabulary for the same state (`{"code":"TOKEN_EXPIRE","message":"token is not active"}`,
 * `401`); both are measured, the chat door with a token the vendor never issued, so this is the wording
 * of "not active" and not a claim about the personal token, which exchanges and answers while the turn
 * is refused. It is **not** about a superseded token: two live job tokens of one personal token coexist,
 * three repetitions over, so a fresh
 * exchange is what a refusal of this kind asks for and the only thing that answers it — while an exhausted
 * allowance and a broken signature are not cured by one (`allowanceRefused`, `codeFor`).
 * @param {string} text the refusal's own words
 * @returns {boolean} true when the refusal names a token that is not active
 */
export function sessionExpired(text) {
  return /"code"\s*:\s*"?105"?/u.test(text) || /"code"\s*:\s*"?TOKEN_EXPIRE"?/u.test(text) || /\blogin[\s_-]+expired\b/iu.test(text) || /\btoken is not active\b/iu.test(text)
}

/**
 * A token or profile answer that the contour refused, or that carried no usable token.
 *
 * The message is a sentence a surface draws whole — the panel draws it as the reason beside "the
 * vendor refused this token" — and a face carries the **state**: what failed and the status. The
 * vendor's own sentence and its request id do not stand on it: a value fresh on every call is not a
 * state, and the row that draws this message would differ between two runs of a page that did not
 * move. What lets a user act stays: the status is what a dead credential is met by, and the code
 * `codeFor` read of the body is what a caller routes on.
 *
 * The vendor's detail is not dropped, it moves: the whole body, the id inside it, goes out through
 * `warn` — the door this half keeps for reasons — and stands verbatim on `QoderError.vendor` for a
 * reader that routes by it. The price is named here rather than discovered later: `warn` is the
 * platform's logger, and in this build that logger has no sink beyond its own in-memory ring, so this
 * is the right home for the vendor's detail and not yet a place a user can open. Their copy of it is
 * whatever a caller of this module publishes beside the state.
 * @param {Response} response the refused answer
 * @param {string} what the call's name for its own message
 * @param {(message: string) => void} [warn] where the vendor's own body is reported
 * @returns {Promise<QoderError>} the error to throw
 */
export async function refusalOf(response, what, warn) {
  const text = await response.text().then((value) => value.slice(0, 300), () => '')
  const detail = text.replace(/\s+/gu, ' ').trim()
  warn?.(`${what}: the vendor answered ${response.status}${detail === '' ? '' : ` — ${detail}`}`)
  return new QoderError(`${what} failed: ${response.status}`, codeFor(response.status, detail, { credentialDoor: true }), { status: response.status, vendor: detail, vendorCode: vendorCodeOf(detail) })
}

/**
 * The refusal a line carries, when it carries one.
 *
 * The contour refuses **inside the stream**: a wrong signature is answered `200` and then a frame
 * whose `statusCodeValue` is `403` with `{"code":"101","message":"Signature invalid"}`. A reader that
 * treats that frame as ordinary data waits for
 * an end that never comes — which is exactly how this contour's refusals were mistaken for silence.
 * @param {string} line one line of the stream
 * @param {string} what the reader's name for its own message
 * @returns {QoderError | undefined} the refusal, or nothing when the line is ordinary
 */
export function refusalIn(line, what) {
  let read
  try {
    read = readLine(line)
  } catch {
    // A line that cannot be parsed is not a refusal, and judging it is not this reader's business:
    // the refusal is recognised here, while the malformation is named by whoever parses the frames, so
    // the same defect is not reported twice in two vocabularies.
    return undefined
  }
  return refusalOfRead(read, what)
}

/**
 * The refusal one **already-read** line carries, worded and coded in one place.
 *
 * Two readers of this wire meet the same refusal in two places — the first chunk, read under the
 * first-byte ceiling (`refusalInText`), and a line a later chunk carried (`translate`) — and both answer
 * the platform with these words and this code. The code is what decides whether the attempt
 * may be re-asked, so a refusal is classified by what it says and not by which chunk carried it: read as
 * a malformation of our own, a counted allowance was re-asked five times and finally reported as an
 * unreadable answer.
 *
 * The sentence is the failure of a turn, drawn where a turn's failure is drawn, so it carries the
 * **state** — what was refused and the status — and the vendor's own words where the body had any,
 * marked as the vendor's and bounded to a line: `Login expired` is the measured one, and it is what a
 * user acts on. The body does not stand on it, and neither does a request id out of it: a JSON blob is
 * not a state, and a value fresh on every call would differ between two runs of a turn that did not
 * move. The body stays verbatim on `QoderError.vendor` for a reader that routes by it; this road keeps
 * no log door of its own, so a caller that wants it written down reports it.
 * @param {{kind?: string, status?: number, text?: string}} read the line as `readLine` read it
 * @param {string} what the reader's name for its own message
 * @returns {QoderError | undefined} the refusal, or nothing when the line is ordinary
 */
export function refusalOfRead(read, what) {
  if (read?.kind !== 'refusal') return undefined
  const detail = String(read.text ?? '').replace(/\s+/gu, ' ').trim()
  const words = vendorWordsOf(detail)
  return new QoderError(`${what} was refused: ${read.status}${words === null ? '' : ` · the vendor says: ${words}`}`, codeFor(read.status, detail), { status: read.status, vendor: detail })
}

/**
 * The refusal among a chunk's complete lines, when it carries one.
 *
 * Every line is judged, the last one included: where a chunk ends is the network's decision, so the
 * contour's refusal can arrive as an **unterminated** final line — measured live, where exactly that made
 * `403 {"code":"110","message":"Billing daily count exceeded"}` settle as an empty answer instead of the
 * refusal it was. A line whose frame is cut in half is not JSON and so is not read as a refusal; the
 * reader that parses the frames names it (`readFrames`).
 * @param {string} text the text of one chunk
 * @param {string} what the reader's name for its own message
 * @returns {QoderError | undefined} the refusal, or nothing
 */
export function refusalInText(text, what) {
  for (const line of String(text).split('\n')) {
    const refused = refusalIn(line, what)
    if (refused !== undefined) return refused
  }
  return undefined
}

/**
 * The reading of one JSON answer, with the refusal named rather than swallowed.
 * @param {Response} response the answer
 * @param {string} what the call's name
 * @returns {Promise<object>} the parsed object
 */
export async function jsonOf(response, what) {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text)
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch (cause) {
    throw new QoderError(`${what} did not answer with JSON: ${text.slice(0, 120)}`, 'MALFORMED', { cause })
  }
}

/** A duration as the words of a refusal: whole seconds, or milliseconds when it is shorter. */
export function secondsOf(ms) {
  return ms >= 1000 ? `${Math.round(ms / 1000)} s` : `${ms} ms`
}

/**
 * One control call under its ceiling, with the two ways it can end early told apart.
 *
 * A ceiling that fires is `TIMEOUT` — the platform's own word for a stalled request, and one of the
 * five codes its retry policy already heals. A caller's cancellation is `ABORTED`, because the
 * platform's contract makes an abort an outcome of its own rather than a failure. The distinction is
 * the point: a wrong signing step must look like a request that did not answer, not like an agent
 * that stopped.
 *
 * The timer comes from the harness's `deadline`, and the classification from its `timeoutOf`, so the
 * reason this refuses on is the platform's own shape rather than an arithmetic of ours.
 * @param {object} call the call
 * @param {string} call.what the call's name for its own message
 * @param {number} call.ms the ceiling
 * @param {AbortSignal} [call.signal] the caller's cancellation
 * @param {(signal: AbortSignal) => Promise<unknown>} call.run the call itself, under the fused signal
 * @param {(strike: object) => void} [call.strike] where a firing is counted
 * @returns {Promise<unknown>} what `run` returned
 */
export async function bounded({ what, ms, signal, run, strike = () => {} }) {
  const startedAt = Date.now()
  const bound = deadline(signal, ms, CONTROL_CODE)
  try {
    return await run(bound.signal)
  } catch (error) {
    const expired = timeoutOf(bound.signal, CONTROL_CODE)
    if (expired !== undefined) {
      strike({ ceiling: CEILING_SETTINGS.control, ms, elapsedMs: Date.now() - startedAt, where: what })
      throw new QoderError(`${what} did not answer within ${secondsOf(ms)}`, 'TIMEOUT', { cause: error })
    }
    if (signal?.aborted === true) {
      throw new QoderError(`${what} was cancelled by the caller`, 'ABORTED', { cause: error })
    }
    throw error
  } finally {
    bound[Symbol.dispose]()
  }
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

/**
 * When a job token dies: the absolute field first, then the relative one.
 * @param {object} answer the exchange or refresh answer
 * @param {number} at the moment the answer arrived
 * @returns {number} epoch milliseconds
 */
export function expiryOf(answer, at) {
  const absolute = typeof answer.expires_at === 'string' ? Date.parse(answer.expires_at) : Number.NaN
  if (Number.isFinite(absolute)) return absolute
  const relative = Number.isFinite(answer.expires_in) ? answer.expires_in : Number.NaN
  if (Number.isFinite(relative) && relative > 0) return at + relative
  return at + ASSUMED_TTL_MS
}

/**
 * The usable models of a catalogue answer.
 *
 * An entry counts when it is enabled and names a key; the wire key is the id, and the name
 * for the user is the display name when there is one. The tiers of `context_config` are
 * the node's menu, and the declared window is its default tier — the largest only when no
 * tier says it is the default. `reasoning` is the contour's own flag for the model, read exactly as it
 * parses it (`is_reasoning:!!i.is_reasoning`) — a capability the entry publishes, not
 * one derived from a request's effort. `efforts` is the menu the entry publishes, empty when it
 * publishes none, which is what their own reader makes of an empty menu as well (`Srn`).
 * `priceFactor` is the vendor's own multiplier to its own base rate (`price_factor`), with
 * `originalPriceFactor` beside it where the vendor published one; a value that is not a finite number is
 * dropped rather than read as a rate, and no field at all stands where the vendor published none.
 * @param {unknown} payload the catalogue answer
 * @returns {object[]} the models, in the node's order
 */
export function modelsOf(payload) {
  const root = payload !== null && typeof payload === 'object' ? payload : {}
  const list = Array.isArray(payload) ? payload : Array.isArray(root.chat) ? root.chat : []
  const seen = new Set()
  const models = []
  for (const value of list) {
    if (value === null || typeof value !== 'object') continue
    const key = typeof value.key === 'string' ? value.key.trim() : ''
    if (key === '' || value.enable !== true || seen.has(key)) continue
    seen.add(key)
    const tiers = contextTiersOf(value)
    models.push({
      id: key,
      name: typeof value.display_name === 'string' && value.display_name.trim() !== '' ? value.display_name.trim() : key,
      contextWindow: tiers.fallback ?? tiers.tiers.at(-1) ?? (Number.isFinite(value.max_input_tokens) ? value.max_input_tokens : undefined),
      contextWindows: tiers.tiers,
      maxTokens: Number.isFinite(value.max_output_tokens) ? value.max_output_tokens : undefined,
      reasoning: value.is_reasoning === true,
      vision: value.is_vl === true,
      efforts: effortsOf(value),
      /* The vendor's own multiplier to its own base rate, as the vendor sent it, with the base beside it
         where it published one. Nothing here is derived and no word is made of it: the live listing has
         one entry whose `is_free` contradicts its own number (`qmodel_38max`: `is_free` true,
         `price_factor` 0.2), so the number is the only thing that can travel — and an
         entry that publishes none carries **no field** rather than a zero in its place. */
      ...Number.isFinite(value.price_factor) ? { priceFactor: value.price_factor } : {},
      ...Number.isFinite(value.original_price_factor) ? { originalPriceFactor: value.original_price_factor } : {},
    })
  }
  return models
}

/**
 * The context menu of one entry: its default tier and every tier it names.
 * @param {object} entry the catalogue entry
 * @returns {{fallback: number | undefined, tiers: number[]}} the menu
 */
function contextTiersOf(entry) {
  const tiers = []
  let fallback
  const config = entry.context_config !== null && typeof entry.context_config === 'object' ? entry.context_config : {}
  for (const value of Object.values(config)) {
    const tokens = value !== null && typeof value === 'object' && Number.isFinite(value.token_count) ? value.token_count : undefined
    if (tokens === undefined) continue
    if (value.is_default === true && fallback === undefined) fallback = tokens
    if (!tiers.includes(tokens)) tiers.push(tokens)
  }
  tiers.sort((left, right) => left - right)
  return { fallback, tiers }
}

/**
 * The reasoning efforts the node offers for one entry, when it publishes a menu.
 * @param {object} entry the catalogue entry
 * @returns {string[]} the effort ids, the default first when it is marked
 */
function effortsOf(entry) {
  const enabled = entry.thinking_config?.enabled
  const menu = enabled !== null && typeof enabled === 'object' && enabled.efforts !== null && typeof enabled.efforts === 'object'
    ? enabled.efforts
    : undefined
  if (menu === undefined) return []
  const names = Object.keys(menu)
  return names.sort((left, right) => Number(menu[right]?.is_default === true) - Number(menu[left]?.is_default === true))
}
