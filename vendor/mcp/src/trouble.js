/**
 * The receiver of the host's own words about a server, and the ring they are kept in.
 *
 * The harness's MCP client says exactly what is wrong with a row — `connection failed; retrying in
 * 4000ms (attempt 5/10)`, `giving up after 10 consecutive failed reconnect attempts`, `reconnected and
 * re-synced tools (attempt 2/10)` — and writes it through `ctx.logger`. No console sink is mounted
 * sink for that service, and the one sink it has, the service's own in-memory ring, names no severity
 * and is therefore handed errors and info only: the client's warnings are dropped before any sink sees
 * them, and nothing reaches the page, the launcher's stdout or the host's own log files either. The
 * plugin registers a receiver of its own, asking for the severities the client speaks with, and keeps
 * the lines; which line speaks for a row, and what the row's sentence says, is the rules' own reading,
 * which touches nothing of the platform.
 *
 * The receiver is held by the plugin's own effect rather than left to the service's bookkeeping:
 * `ctx.logger.exporter()` registers on the root, so a receiver it owns outlives the plugin.
 *
 * @module @coreness/mcp/src/trouble
 */

import { Logger } from '@deepseek-ai/cordis'

import { PREFIX } from './ring.js'

/**
 * How many lines the host's own logger may write before the oldest fall out of the store.
 *
 * A ring over the whole service rather than a list per server: a line is attributed when it is read, by
 * the labels of the rows that ask, so nothing has to be guessed at write time — and a profile whose
 * servers retry every thirty seconds writes a few dozen lines a minute, so the newest word about any
 * one of them stays inside a ring of this size.
 */
export const RING = 200

/**
 * The severities this receiver is handed, as the service gates them: a
 * message is delivered when its own level is not above the receiver's threshold, and a receiver that
 * names none is handed `INFO` (1) — which drops every **warning**, the platform's client's ordinary way
 * of saying that it cannot connect. A receiver without this line therefore sees an error when the
 * client finally gives up, and nothing at all while it is still trying. The threshold is the number
 * `LoggerLevel.WARN` (2), spelled out because that enum is compile-time only: error (0), info (1) and
 * warn (2) arrive, and only debug (3) is left out. The platform's own startup collector declares the
 * same two.
 */
const LEVELS = { default: 2 }

/** A receiver that keeps text, not colour: the page draws plain words. */
const PLAIN = { colors: false }

/**
 * Keep the lines the host writes about the servers of this profile.
 * @returns {object} the receiver to register, and the ring of lines it kept
 */
export function troubleStore() {
  /** The last lines the host wrote about any server, oldest first. */
  const kept = []

  const receiver = {
    colors: false,
    levels: LEVELS,
    export(message) {
      /* A receiver runs inside the host's own logging call, and a throw here would reach the caller of
         `logger.warn` and take the lines after it with it. A value the platform's logger could not have
         produced is therefore dropped, not repaired — the shape itself is the platform's own. */
      if (message === null || typeof message !== 'object' || !Array.isArray(message.args)) return

      /* The platform's own formatter: the line as the host would print it, verbatim. */
      const text = Logger.format(PLAIN, message)
      /* Every sentence the client writes about one server carries its label; the rest is not ours. */
      if (!text.startsWith(PREFIX)) return

      const at = typeof message.ts === 'number' ? new Date(message.ts).toISOString() : null
      kept.push({ at, level: String(message.type ?? ''), text })
      if (kept.length > RING) kept.splice(0, kept.length - RING)
    },
  }

  return {
    receiver,
    /** The lines kept so far, oldest first. */
    lines: () => kept.slice(),
  }
}
