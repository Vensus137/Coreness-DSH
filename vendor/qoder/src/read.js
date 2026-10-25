/**
 * The reading half of the transport: the answer's lines under their two ceilings, the refusal a first
 * byte produces, the answer rebuilt from the byte already read, and the node map with a node address.
 *
 * @module @coreness/qoder/src/read
 */

import { deadline, idleWatchdog, timeoutOf } from '@deepseek-ai/dsh-timeout'
import { CEILING_SETTINGS, DEFAULT_CONTROL_CEILING_MS, DEFAULT_FIRST_BYTE_CEILING_MS, DEFAULT_IDLE_CEILING_MS, ENDPOINTS_PATH, FIRST_BYTE_CODE, IDLE_CODE, QoderError, bounded, jsonOf, refusalIn, refusalOf, secondsOf } from './in.js'

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
  // The ceiling on the first byte is armed when the read starts: one ceiling, and no caller hands in a
  // watch that would arm a second one after the first chunk is already buffered.
  const firstByte = deadline(caller, firstByteCeilingMs, FIRST_BYTE_CODE)
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
        // does, so the read has to be cancelled here when the reason arrives.
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
export function abortOf(signal) {
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
export function firstByteRefusal({ error, firstByte, ms, elapsedMs, what, where, signal, strike }) {
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
export function bodyFrom(response, first, reader) {
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
  if (parsed.protocol !== 'https:') {
    throw new QoderError(`${what}: a node address must use https, not ${parsed.protocol.replace(/:$/u, '')}`, 'NO_NODE')
  }
  if (parsed.search !== '' || parsed.hash !== '') {
    throw new QoderError(`${what}: a node address carries no query and no fragment`, 'NO_NODE')
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/$/u, '')}`
}
