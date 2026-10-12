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
 * @module @coreness/dsh/plugins/provider/qoder/in
 */

import crypto from 'node:crypto'
import { MAX_TIMER_DELAY_MS, clampTimeout, deadline, idleWatchdog, timeoutOf } from '@deepseek-ai/dsh-timeout'
import { buildChatBody, encodeBody, toWireMessages, toWireTools, DEFAULT_MAX_TOKENS } from './body.js'
import { readLine } from './frames.js'
import { cosyHeaders, machineIdOf, tokenHeaders } from './sign.js'

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
const FIRST_BYTE_CODE = 'QODER_FIRST_BYTE'
const IDLE_CODE = 'QODER_STREAM_IDLE'

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
async function refusalOf(response, what, warn) {
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
async function jsonOf(response, what) {
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
 * The answer's lines, under two ceilings that mean two different things.
 *
 * **Before the first byte**: the stream has opened and not one byte has arrived, so the answer has
 * not started. That is not a model thinking — it is what a corrupted signature looks like on this
 * contour (the vendor answers `200` and then says nothing at all for ~180 s) — and it is bounded by
 * the *time to first byte*.
 *
 * **After the first byte**: the answer is running, and what is bounded is silence between its bytes,
 * by the harness's own idle number. The watchdog is armed only while a read is outstanding, so the
 * consumer's own thinking between lines is not counted as the vendor being idle: a long answer that
 * keeps streaming is never cut short, and the ceiling is not a ceiling on the turn's length.
 * @param {Response} response the answer to read
 * @param {object} [options] the read
 * @param {number} [options.firstByteCeilingMs] how long the answer may take to start speaking
 * @param {number} [options.idleCeilingMs] how long it may stay silent once it has
 * @param {AbortSignal} [options.signal] the caller's cancellation
 * @param {object} [options.watch] the request's own watch, when `chat` opened it
 * @param {string} [options.what] the reader's name for its own messages
 * @param {(strike: object) => void} [options.strike] where a firing is counted
 * @yields {string} one line of the stream-encoded answer
 * @throws {QoderError} `TIMEOUT` on either ceiling, `ABORTED` on a caller's cancellation
 */
export async function* readFrames(response, options = {}) {
  const what = options.what ?? 'the Qoder answer'
  const firstByteCeilingMs = options.firstByteCeilingMs ?? DEFAULT_FIRST_BYTE_CEILING_MS
  const idleCeilingMs = options.idleCeilingMs ?? DEFAULT_IDLE_CEILING_MS
  const caller = options.signal
  const strike = options.strike ?? (() => {})
  if (response === null || typeof response !== 'object' || response.body === null || response.body === undefined) {
    throw new QoderError(`${what} carried no stream to read`, 'TRANSPORT')
  }
  const reader = response.body.getReader()
  // The harness's watchdog drives an iterator, and a stream reader is not one: it reads where an
  // iterator steps. This is the whole of the adapter between the two shapes.
  const source = { next: () => reader.read() }
  const decoder = new TextDecoder()
  let buffer = ''
  let spoke = false
  const startedAt = Date.now()
  // The ceiling on the first byte was armed when the request went out if `chat` opened this read;
  // a reader over a bare response arms its own, so the ceiling holds on both doors.
  const firstByte = options.watch?.firstByte ?? deadline(caller, firstByteCeilingMs, FIRST_BYTE_CODE)
  // One promise per phase, not one per read: a signal is stable for the whole call, and a listener
  // per chunk would grow with the length of the answer.
  const firstByteEnded = abortOf(firstByte.signal)
  let watchdog
  let idleEnded
  try {
    for (;;) {
      let read
      try {
        // Both phases are a race against the signal that names the ceiling: the harness's watchdog
        // only *notifies*, and a stream reader does not watch a signal the way its own iterator
        // does, so the read has to be cancelled by us when the reason arrives.
        read = spoke
          ? await Promise.race([watchdog.next(source), idleEnded])
          : await Promise.race([reader.read(), firstByteEnded])
      } catch (error) {
        if (timeoutOf(firstByte.signal, FIRST_BYTE_CODE) !== undefined) {
          strike({ ceiling: CEILING_SETTINGS.firstByte, ms: firstByteCeilingMs, elapsedMs: Date.now() - startedAt, where: what })
          throw new QoderError(`${what} never spoke: no byte within ${secondsOf(firstByteCeilingMs)}`, 'TIMEOUT', { cause: error })
        }
        if (watchdog !== undefined && timeoutOf(watchdog.signal, IDLE_CODE) !== undefined) {
          strike({ ceiling: CEILING_SETTINGS.idle, ms: idleCeilingMs, elapsedMs: Date.now() - startedAt, where: what })
          throw new QoderError(`${what} went silent: no byte for ${secondsOf(idleCeilingMs)}`, 'TIMEOUT', { cause: error })
        }
        if (caller?.aborted === true) throw new QoderError(`${what} was cancelled by the caller`, 'ABORTED', { cause: error })
        throw new QoderError(`${what} could not be read: ${error.message}`, 'TRANSPORT', { cause: error })
      }
      if (read.done === true) {
        if (buffer !== '') {
          // A stream can end without a newline, and the contour's refusal then *is* this leftover: a
          // reader that yields it unjudged turns the vendor's own words into an empty answer (measured,
          // `403 {"code":"110","message":"Billing daily count exceeded"}` settling as EMPTY_RESPONSE).
          const refused = refusalIn(buffer, what)
          if (refused !== undefined) throw refused
          yield buffer
        }
        return
      }
      if (!spoke) {
        // The answer has started: the first-byte ceiling has done its work and must not be left
        // armed, or it would abort a turn that is legitimately still running.
        spoke = true
        firstByte[Symbol.dispose]()
        watchdog = idleWatchdog(caller, idleCeilingMs, IDLE_CODE)
        idleEnded = abortOf(watchdog.signal)
      }
      buffer += decoder.decode(read.value, { stream: true })
      let end = buffer.indexOf('\n')
      while (end !== -1) {
        const line = buffer.slice(0, end).replace(/\r$/u, '')
        // A refusal inside the stream is a refusal, not a line of data: handing it up as content
        // would make the caller wait for an answer the contour has already declined to give.
        const refused = refusalIn(line, what)
        if (refused !== undefined) throw refused
        yield line
        buffer = buffer.slice(end + 1)
        end = buffer.indexOf('\n')
      }
    }
  } finally {
    options.watch?.consumer.abort()
    watchdog?.[Symbol.dispose]()
    if (!spoke) firstByte[Symbol.dispose]()
    await reader.cancel().catch(() => {})
  }
}

/**
 * A promise that rejects the moment a signal aborts, so a read can be raced against a ceiling.
 *
 * The rejection is handled by the race that consumes it; the extra `catch` keeps a signal that
 * aborts after the race is over from becoming an unhandled one.
 * @param {AbortSignal} signal the signal to watch
 * @returns {Promise<never>} a promise that only ever rejects
 */
function abortOf(signal) {
  const ended = new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason)
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
  ended.catch(() => {})
  return ended
}

/**
 * The refusal a first-byte ceiling produces, whichever phase it fired in — the wait for headers or
 * the wait for the body's first byte. One ceiling, one meaning, one wording.
 * @param {object} input what happened
 * @returns {QoderError | unknown} the refusal, or the original error when the ceiling is innocent
 */
function firstByteRefusal({ error, firstByte, ms, elapsedMs, what, where, signal, strike }) {
  if (timeoutOf(firstByte.signal, FIRST_BYTE_CODE) !== undefined) {
    strike({ ceiling: CEILING_SETTINGS.firstByte, ms, elapsedMs, where })
    return new QoderError(`${what} never spoke: no byte within ${secondsOf(ms)}`, 'TIMEOUT', { cause: error })
  }
  if (signal?.aborted === true) return new QoderError(`${what} was cancelled by the caller`, 'ABORTED', { cause: error })
  return error
}

/**
 * The answer as a response that begins with the byte already read, so that whoever reads it next
 * starts after the ceiling has done its work.
 * @param {Response} response the response as it arrived
 * @param {Uint8Array} first the first chunk, already read under the ceiling
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader the rest of the stream
 * @returns {Response} the answer, starting at its first byte
 */
function bodyFrom(response, first, reader) {
  let pending = first
  const body = new ReadableStream({
    async pull(controller) {
      if (pending !== undefined) {
        controller.enqueue(pending)
        pending = undefined
        return
      }
      const chunk = await reader.read()
      if (chunk.done === true) controller.close()
      else controller.enqueue(chunk.value)
    },
    async cancel(reason) {
      await reader.cancel(reason)
    },
  })
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers })
}

/**
 * The endpoints the account was granted.
 * @param {object} options the transport's facts
 * @param {number} [options.ceilingMs] how long the map may take to answer
 * @param {(strike: object) => void} [options.strike] where a firing is counted
 * @param {(message: string) => void} [options.warn] where a refusal's own body is reported
 * @returns {Promise<object>} the map as the centre sent it
 */
export async function readEndpointMap({ fetchImpl, centerOrigin, signal, ceilingMs = DEFAULT_CONTROL_CEILING_MS, strike, warn }) {
  const url = `${centerOrigin}${ENDPOINTS_PATH}`
  return bounded({
    what: 'the Qoder node map',
    ms: ceilingMs,
    signal,
    strike,
    run: async (inner) => {
      const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: inner })
      if (!response.ok) throw await refusalOf(response, 'the Qoder node map', warn)
      const map = await jsonOf(response, 'the Qoder node map')
      const inferNodes = Array.isArray(map.inferNodes) ? map.inferNodes.filter((node) => typeof node === 'string' && node !== '') : []
      if (inferNodes.length === 0) throw new QoderError('the Qoder node map carries no inference node', 'NO_NODE')
      return { ...map, inferNodes }
    },
  })
}

/**
 * A node address as a base for joining paths: a bare host gets https, a trailing slash goes.
 * @param {string} value the node address
 * @param {string} what the field's name for the message
 * @returns {string} the base
 */
export function normalizeNode(value, what) {
  if (typeof value !== 'string' || value.trim() === '') throw new QoderError(`${what}: expected a node address`, 'NO_NODE')
  const raw = value.trim()
  const withScheme = /^https?:\/\//iu.test(raw) ? raw : `https://${raw}`
  const parsed = new URL(withScheme)
  if (parsed.search !== '' || parsed.hash !== '') {
    throw new QoderError(`${what}: a node address carries no query and no fragment`, 'NO_NODE')
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/$/u, '')}`
}

/**
 * The transport of one route: the facts it needs, the caches it keeps, and the calls.
 *
 * The personal token is a value, not a setting: the caller resolves it (in the product,
 * from the platform's own credentials store) and passes it in. Nothing here writes it
 * anywhere.
 * @param {object} options the transport's facts
 * @param {() => Promise<string> | string} options.apiKey the personal token, resolved per call
 * @param {typeof fetch} [options.fetchImpl] the transport
 * @param {string} [options.centerOrigin] the centre host
 * @param {string} [options.openapiOrigin] the OpenAPI host
 * @param {string | (() => string)} [options.inferBase] a configured inference node, instead of the map's
 *   first; a function is read per call, because the row's field is live (`resolvedEndpoints`)
 * @param {string} [options.machineIdStoreDir] where the machine id is kept
 * @param {number} [options.controlCeilingMs] how long a control call may take
 * @param {number} [options.firstByteCeilingMs] how long the answer may take to start speaking
 * @param {number} [options.idleCeilingMs] how long a started answer may stay silent
 * @param {(strike: object) => void} [options.onStrike] where a ceiling's firing is reported
 * @param {() => number} [options.now] the clock, for tests
 * @param {(message: string) => void} [options.warn] where a re-exchange and a refusal's own body are
 *   reported
 * @returns {object} the transport
 */
export function createTransport(options) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const now = options.now ?? (() => Date.now())
  const warn = options.warn ?? (() => {})
  // Every number goes through the harness's own clamp: a hint of ours is filled from the default,
  // capped at the largest delay a timer can carry, and refused outright when it could not be a
  // duration at all — before any work starts.
  const controlCeilingMs = clampTimeout(options.controlCeilingMs, DEFAULT_CONTROL_CEILING_MS, MAX_TIMER_DELAY_MS, 'controlCeilingMs')
  const firstByteCeilingMs = clampTimeout(options.firstByteCeilingMs, DEFAULT_FIRST_BYTE_CEILING_MS, MAX_TIMER_DELAY_MS, 'firstByteCeilingMs')
  const idleCeilingMs = clampTimeout(options.idleCeilingMs, DEFAULT_IDLE_CEILING_MS, MAX_TIMER_DELAY_MS, 'idleCeilingMs')
  /** What the ceilings have done so far: a ceiling nobody can count is a ceiling nobody can calibrate. */
  const strikes = []
  const strike = (fired) => {
    const record = { ...fired, at: new Date(now()).toISOString() }
    strikes.push(record)
    options.onStrike?.(record)
  }
  const centerOrigin = normalizeNode(options.centerOrigin ?? DEFAULT_CENTER_ORIGIN, 'the Qoder centre')
  const openapiOrigin = normalizeNode(options.openapiOrigin ?? DEFAULT_OPENAPI_ORIGIN, 'the Qoder OpenAPI host')
  /** The ceiling of one control call, as the calls themselves name it. */
  const ceiling = (what, signal, run) => bounded({ what, ms: controlCeilingMs, signal, run, strike })
  /** Per-token state: the job token, what refreshes it, and when it dies. */
  const sessions = new Map()
  /** The identity of a token, read once: the profile is a cache keyed by the personal token. */
  const identities = new Map()
  /** In-flight exchanges and map reads, so two callers cannot race the same token. */
  const flights = new Map()
  let machineId
  let endpoints

  const fingerprint = (pat) => crypto.createHash('sha256').update(pat).digest('hex').slice(0, 16)

  /** One flight per key: the second caller waits for the first instead of repeating it. */
  const singleFlight = (map, key, load) => {
    const running = map.get(key)
    if (running !== undefined) return running
    const started = Promise.resolve().then(load).finally(() => map.delete(key))
    map.set(key, started)
    return started
  }

  const machineIdValue = () => {
    machineId ??= machineIdOf({ storeDir: options.machineIdStoreDir ?? process.cwd() })
    return machineId
  }

  /**
   * The node the row asks for, read at every call.
   *
   * The row's `inferBase` is a volatile field: the platform hands it over as a live reference so that a
   * change applies without re-mounting the route, and an address captured once at
   * construction would keep sending every request to the node the user has just replaced. A plain
   * string is read as it stands — the shape this option takes outside the Loader, as this module's own
   * checks pass it.
   * @returns {string | undefined} the node the row names, if it names one
   */
  const askedNode = () => (typeof options.inferBase === 'function' ? options.inferBase() : options.inferBase)

  /**
   * The node map: the addresses the centre lists, read once per transport and shared with every caller
   * that resolves an address through it.
   *
   * One read, one cache, because this is the list the route itself resolves against: a sweep that read
   * its own fresh copy would be checking a list the running route is not using. `endpointMap` below is
   * the reader for a caller that wants the map as it stands now and is not resolving through it.
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<object>} the map as the centre sent it, `inferNodes` being the nodes it names
   */
  async function nodeMap(signal) {
    endpoints ??= await singleFlight(flights, 'endpoints', () => readEndpointMap({ fetchImpl, centerOrigin, signal, ceilingMs: controlCeilingMs, strike, warn }))
    return endpoints
  }

  /** The node the row asks for, if it asks for one: the address the route is sending to now. */
  async function resolvedEndpoints(signal) {
    const asked = askedNode()
    if (asked !== undefined && asked !== '') {
      return { inferBase: normalizeNode(asked, 'the configured inference node'), source: 'configured' }
    }
    const map = await nodeMap(signal)
    return { inferBase: normalizeNode(map.inferNodes[0], 'the node map inference node'), source: 'map' }
  }

  /** The token exchange: the personal token goes in, a short-lived job token comes out. */
  async function exchange(pat, signal) {
    return ceiling('the Qoder token exchange', signal, async (inner) => {
      const response = await fetchImpl(`${openapiOrigin}${EXCHANGE_PATH}`, {
        method: 'POST',
        headers: { ...tokenHeaders(), ...attribution() },
        body: JSON.stringify({ personal_token: pat }),
        signal: inner,
      })
      if (!response.ok) throw await refusalOf(response, 'the Qoder token exchange', warn)
      const answer = await jsonOf(response, 'the Qoder token exchange')
      if (typeof answer.token !== 'string' || answer.token === '') {
        throw new QoderError('the Qoder token exchange returned no job token', 'AUTH')
      }
      return {
        jobToken: answer.token,
        jobRefreshToken: typeof answer.refresh_token === 'string' ? answer.refresh_token : '',
        expiresAt: expiryOf(answer, now()),
      }
    })
  }

  /** The refresh: the refresh token goes in, a new job token comes out. */
  async function refresh(session, signal) {
    if (session.jobRefreshToken === '') throw new QoderError('the job token expired and no refresh token was issued', 'AUTH')
    return ceiling('the Qoder job token refresh', signal, async (inner) => {
      const response = await fetchImpl(`${openapiOrigin}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { ...tokenHeaders(), ...attribution() },
        body: JSON.stringify({ refresh_token: session.jobRefreshToken }),
        signal: inner,
      })
      if (!response.ok) throw await refusalOf(response, 'the Qoder job token refresh', warn)
      const answer = await jsonOf(response, 'the Qoder job token refresh')
      if (typeof answer.token !== 'string' || answer.token === '') {
        throw new QoderError('the Qoder job token refresh returned no job token', 'AUTH')
      }
      return {
        jobToken: answer.token,
        jobRefreshToken: typeof answer.refresh_token === 'string' && answer.refresh_token !== '' ? answer.refresh_token : session.jobRefreshToken,
        expiresAt: expiryOf(answer, now()),
      }
    })
  }

  /** The profile: the user id the signature cannot be built without. */
  async function profile(jobToken, signal) {
    return ceiling('the Qoder profile call', signal, async (inner) => {
      const response = await fetchImpl(`${openapiOrigin}${USERINFO_PATH}`, {
        headers: { ...tokenHeaders({ json: false }), Authorization: `Bearer ${jobToken}`, ...attribution() },
        signal: inner,
      })
      if (!response.ok) throw await refusalOf(response, 'the Qoder profile call', warn)
      const answer = await jsonOf(response, 'the Qoder profile call')
      if (typeof answer.id !== 'string' || answer.id === '') {
        throw new QoderError('the Qoder profile call returned no user id', 'AUTH')
      }
      return {
        userID: answer.id,
        email: typeof answer.email === 'string' ? answer.email : '',
        name: typeof answer.name === 'string' && answer.name !== ''
          ? answer.name
          : typeof answer.username === 'string' ? answer.username : '',
      }
    })
  }

  /**
   * The identity of one personal token: the profile, read once, plus the live session.
   *
   * The profile is cached because it is the same for the life of a token; the session is
   * read fresh every time, because the exchange replaces it and the signature must carry
   * the token that is alive at the moment of the call.
   */
  async function identityOf(signal) {
    const pat = await resolvedPat()
    const key = fingerprint(pat)
    let identity = identities.get(key)
    if (identity === undefined) {
      identity = await singleFlight(flights, `identity:${key}`, async () => {
        const value = await profile((await tokenFor(key, signal)).jobToken, signal)
        identities.set(key, value)
        return value
      })
    }
    return { session: await tokenFor(key, signal), identity, pat, key }
  }

  /** The job token for one fingerprint, cached until it dies. */
  async function tokenFor(key, signal) {
    const held = sessions.get(key)
    if (held !== undefined && held.expiresAt - now() > 30_000) return held
    return singleFlight(flights, `token:${key}`, async () => {
      const pat = await resolvedPat()
      const fresh = held !== undefined && held.jobRefreshToken !== ''
        ? await refresh(held, signal).catch(() => exchange(pat, signal))
        : await exchange(pat, signal)
      sessions.set(key, fresh)
      return fresh
    })
  }

  /** The personal token, resolved through the caller's own door every time. */
  async function resolvedPat() {
    const pat = await options.apiKey()
    if (typeof pat !== 'string' || pat.trim() === '') {
      throw new QoderError('no Qoder credential is stored for this route', 'MISSING_CREDENTIAL')
    }
    return pat.trim()
  }

  /** The harness's own attribution: a provider request names the application it comes from. */
  function attribution() {
    return { 'user-agent': options.userAgent ?? 'coreness-dsh' }
  }

  /** The headers of one signed call, with the machine id and the identity already resolved. */
  async function signedHeaders({ url, body, signal }) {
    const { session, identity } = await identityOf(signal)
    return cosyHeaders({ body, url, credentials: { ...identity, jobToken: session.jobToken }, machineId: machineIdValue() })
  }

  /**
   * The catalogue: what the account's node offers.
   *
   * `node` asks one named node instead of the row's own — the node sweep needs the same signing and the
   * same ceiling against an address the row has not chosen, and a second writer of a signed call would
   * be a second owner of how this vendor is spoken to. The named node is not cached either: an answer
   * about another node kept under the transport's key would be read later as an answer about this one.
   * @param {{signal?: AbortSignal, node?: string}} [call] the caller's cancellation, and the node to ask
   * @returns {Promise<object[]>} the enabled models, in the node's order
   */
  async function catalogue({ signal, node } = {}) {
    const { inferBase } = node === undefined || node === ''
      ? await resolvedEndpoints(signal)
      : { inferBase: normalizeNode(node, 'the node under check') }
    const url = `${inferBase}${MODEL_LIST_PATH}`
    return ceiling('the Qoder model listing', signal, async (inner) => {
      const headers = { Accept: 'application/json', ...await signedHeaders({ url, body: null, signal: inner }) }
      const response = await fetchImpl(url, { headers, signal: inner })
      if (!response.ok) throw await refusalOf(response, 'the Qoder model listing', warn)
      const payload = await jsonOf(response, 'the Qoder model listing')
      return modelsOf(payload)
    })
  }

  /** The catalogue's models, read at most once for the transport's life, and the failure that stopped it. */
  let catalogueModels
  let catalogueRefusal

  /**
   * What the catalogue reads for one model, or `undefined` when the catalogue has not answered.
   *
   * It is read **once per transport**, on the first turn that needs it, and a failure is remembered: the
   * catalogue is a control call under this transport's own ceiling, and a node that is down must not
   * turn every turn into another control call — while no turn waits on it for its model key, which the
   * row declares. The failure is reported once through `warn`, because the fallback
   * is a decision and not a mask: without a catalogue the flag travels derived from the effort, as it
   * did before this joint existed. A caller's own cancellation is not the catalogue's answer and is
   * neither remembered nor reported — it is the turn ending, which the caller already knows.
   * @param {string} model the wire model key
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<{isReasoning: boolean, efforts: string[]} | undefined>} the record's read
   */
  async function modelRecordOf(model, signal) {
    if (catalogueModels === undefined && catalogueRefusal === undefined) {
      try {
        catalogueModels = await singleFlight(flights, 'catalogue', () => catalogue({ signal }))
      } catch (error) {
        if (signal?.aborted === true) throw error
        catalogueRefusal = error
        warn(`the Qoder catalogue did not answer (${error?.message ?? String(error)}); the reasoning flag travels as the effort asks`)
      }
    }
    if (catalogueModels === undefined) return undefined
    // The catalogue answered, so its own flag is the claim that travels — and for a model it does not
    // carry, the claim is `true` with the effort as asked. That is a deliberate divergence from their
    // builder, which reads the record it does not have as `false`: their client cannot reach that
    // branch, because the model it asks for comes from the catalogue, while this route's list is the
    // row's own. On doubt the user's rule
    // is to err toward more reasoning, so a model the catalogue does not name is not read as one that
    // cannot reason, and the effort the user asked for travels.
    const entry = catalogueModels.find((candidate) => candidate.id === model)
    return entry === undefined ? { isReasoning: true, efforts: [] } : { isReasoning: entry.reasoning, efforts: entry.efforts }
  }

  /**
   * One request of a chat turn: the body is built, encoded, signed, sent, and read to its first chunk.
   *
   * The identity is read **here**, per request, which is what makes a retry a retry with another token:
   * `identityOf` answers the session this transport has cached until `renew` drops it.
   *
   * The ceiling here covers the wait for the answer's *headers* and no more: once the contour has
   * started talking, a long answer is legitimate, and what bounds it is the silence between its
   * bytes — `readFrames` — together with the caller's signal.
   *
   * The body carries the model as the catalogue reads it (`modelRecordOf`): the vendor's own flag, and
   * the effort exactly as the row names it — a name a model's menu does not publish travels as asked,
   * because the wire takes it (a live turn carried `max` to a model whose menu is `xhigh|low|medium` and
   * was answered normally). A catalogue that has not answered changes neither — the flag is derived from
   * the effort, and the effort travels as the user asked.
   * @param {object} call the turn
   * @param {string} call.model the wire model key
   * @param {string} [call.system] the system prompt
   * @param {object[]} [call.messages] harness-shaped messages
   * @param {object[]} [call.tools] harness-shaped tool definitions
   * @param {number} [call.maxTokens] the output budget
   * @param {string} [call.reasoningEffort] the effort; `off` means the field is left out
   * @param {AbortSignal} [call.signal] the caller's cancellation
   * @returns {Promise<{url: string, body: string, response: Response}>} what was sent and the answer
   */
  async function chatOnce(call) {
    const { signal } = call
    const { inferBase } = await resolvedEndpoints(signal)
    const url = `${inferBase}${CHAT_PATH}`
    const { session, identity } = await identityOf(signal)
    const wire = toWireMessages(call.messages ?? [], { system: call.system ?? '' })
    const modelRecord = await modelRecordOf(call.model, signal)
    const fresh = { requestId: crypto.randomUUID(), startedAt: now() }
    const plain = JSON.stringify(buildChatBody({
      model: call.model,
      userID: identity.userID,
      system: wire.system,
      messages: wire.messages,
      originalContent: wire.originalContent,
      tools: toWireTools(call.tools),
      maxTokens: Number.isFinite(call.maxTokens) && call.maxTokens > 0 ? call.maxTokens : DEFAULT_MAX_TOKENS,
      reasoningEffort: call.reasoningEffort,
      modelRecord,
      requestId: fresh.requestId,
      startedAt: fresh.startedAt,
    }))
    const body = encodeBody(plain)
    const headers = {
      ...call.headers,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Accept-Encoding': 'identity',
      'X-Model-Key': call.model,
      'X-Model-Source': 'system',
      ...cosyHeaders({ body, url, credentials: { ...identity, jobToken: session.jobToken }, machineId: machineIdValue() }),
    }
    // The first byte is bounded from the moment the request goes out, and *inside this call*: the
    // answer is not handed over until it has started speaking. A contour that answers `200` and then
    // never says a word is exactly the case this ceiling exists for, and a caller cannot bypass it by
    // reading the raw stream — by the time there is a raw stream to read, the answer has begun.
    const consumer = new AbortController()
    const fused = signal === undefined ? consumer.signal : AbortSignal.any([signal, consumer.signal])
    const firstByte = deadline(fused, firstByteCeilingMs, FIRST_BYTE_CODE)
    const startedAt = now()
    let response
    try {
      response = await fetchImpl(url, { method: 'POST', headers, body, signal: firstByte.signal })
    } catch (error) {
      throw firstByteRefusal({ error, firstByte, ms: firstByteCeilingMs, elapsedMs: now() - startedAt, what: 'the Qoder chat turn', where: 'the Qoder chat turn (its headers)', signal, strike })
    }
    const reader = response.body?.getReader()
    if (reader === undefined) throw new QoderError('the Qoder chat turn carried no stream to read', 'TRANSPORT')
    let first
    try {
      first = await Promise.race([reader.read(), abortOf(firstByte.signal)])
    } catch (error) {
      throw firstByteRefusal({ error, firstByte, ms: firstByteCeilingMs, elapsedMs: now() - startedAt, what: 'the Qoder chat answer', where: 'the Qoder chat answer (its first byte)', signal, strike })
    } finally {
      // The answer has started (or the ceiling fired): the timer must not stay armed, or it would
      // abort a turn that is legitimately still running.
      firstByte[Symbol.dispose]()
    }
    if (first.done === true) throw new QoderError('the Qoder chat answer was empty', 'EMPTY', { status: response.status })
    // The first chunk is already in hand: if it carries the contour's refusal, that refusal is the
    // answer, and saying so here is what keeps a wrong signature from looking like a silent turn.
    // Every complete line of the chunk is looked at, because where a chunk ends is the network's
    // business and not a property of the wire.
    const refused = refusalInText(new TextDecoder().decode(first.value), 'the Qoder chat turn')
    if (refused !== undefined) throw refused
    return { url, body, response: bodyFrom(response, first.value, reader), watch: { consumer } }
  }

  /**
   * One chat turn, with the one renewal a refusal of the job token is worth.
   *
   * A token the contour calls not active (`sessionExpired`) is worth exactly one fresh exchange, and the
   * exchange harms nobody: two live job tokens of one personal token coexist, measured three repetitions
   * over, so this is not a race against another session. Measured on the
   * live route: the contour answered `403 {"code":"105","message":"Login expired"}` while the account's own
   * personal token still exchanged, and the profile stayed dead — every turn of it, subagents included —
   * until the application was restarted, which is what this heal exists for. It is bounded (one renewal,
   * never a loop) and it is not a mask: `renew` reports itself through `warn`, and a second refusal is
   * thrown exactly as it came. A refusal over an allowance, or over a signature, is not renewed: a fresh
   * token buys back neither a count the vendor keeps nor a signature the gateway would not read.
   * @param {object} call the turn
   * @returns {Promise<{url: string, body: string, response: Response}>} what was sent and the answer
   */
  async function chat(call) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await chatOnce(call)
      } catch (error) {
        if (attempt > 0 || !sessionExpired(error?.vendor ?? '')) throw error
        await renew()
      }
    }
  }

  /**
   * The lines of one answer, under the first-byte and idle ceilings.
   * @param {Response} response the answer `chat` returned
   * @param {object} [options] the read
   * @param {object} [options.watch] the request's own watch, passed on from `chat`
   * @param {number} [options.firstByteCeilingMs] overrides the transport's own ceiling
   * @param {number} [options.idleCeilingMs] overrides the transport's own ceiling
   * @param {AbortSignal} [options.signal] the caller's cancellation
   * @yields {string} one line of the stream-encoded answer
   */
  function frames(response, options = {}) {
    const lines = readFrames(response, {
      what: 'the Qoder chat answer',
      firstByteCeilingMs,
      idleCeilingMs,
      strike,
      ...options,
    })
    // A refusal that arrives **after** the first chunk is thrown here, at the reader, where `chat` has
    // already returned and cannot renew anything: the turn is refused either way, but the cached token
    // must not outlive it. Otherwise a token the contour calls not active stays cached for the rest of its
    // declared 24 hours and every following turn in this process is refused the same way — the profile is
    // then dead until the application is restarted, which is what the owner met and reported.
    return (async function* watched() {
      try {
        yield* lines
      } catch (error) {
        if (error instanceof QoderError && sessionExpired(error.vendor ?? '')) await forgetSession()
        throw error
      }
    })()
  }

  /**
   * Forget the cached job token of the current credential and its identity.
   *
   * Called when the contour says the token it was given is not active: from that moment the cached value is
   * worthless — it stays refused for the rest of its declared 24 hours — and with the token goes the
   * identity read, because that read is signed with the same token. Forgetting costs one exchange and
   * harms nobody: two live job tokens of one personal token coexist.
   *
   * The credential is read here exactly as the option is documented to answer (`options.apiKey`, above):
   * a promise or a plain value, since one caller of this transport hands a string. A read that fails is
   * not this call's business and does not replace the refusal that asked for the renewal: there is then no
   * cached session to drop, and the next attempt re-reads the credential and reports it in its own words.
   * @returns {Promise<boolean>} whether a cached session was dropped
   */
  async function forgetSession() {
    const pat = await Promise.resolve(options.apiKey()).catch(() => '')
    if (typeof pat !== 'string' || pat.trim() === '') return false
    const key = fingerprint(pat.trim())
    const dropped = sessions.delete(key)
    identities.delete(key)
    flights.delete(`identity:${key}`)
    return dropped
  }

  /** Forget the session and say so, in the log the platform keeps for whoever reads the failure. */
  async function renew() {
    await forgetSession()
    warn('the Qoder job token was renewed')
  }

  return {
    endpointMap: (options) => readEndpointMap({ fetchImpl, centerOrigin, warn, ...options }),
    nodeMap,
    resolvedEndpoints,
    exchange: (pat, signal) => exchange(pat, signal),
    profile,
    identity: identityOf,
    catalogue,
    chat,
    frames,
    renew,
    origins: () => ({ centerOrigin, openapiOrigin }),
    // The machine id belongs to the transport — it reads it from the harness home and generates it
    // once — so the account calls of the credits reader ask for it here instead of reading the same file
    // a second time under a second name of their own.
    machineId: () => machineIdValue(),
    ceilings: () => ({ controlCeilingMs, firstByteCeilingMs, idleCeilingMs }),
    strikes: () => strikes.slice(),
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
