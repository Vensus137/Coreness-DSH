/**
 * The platform's own words about a server, taken where the platform writes them.
 *
 * The harness's MCP client says exactly what is wrong with a row — `connection failed; retrying in
 * 4000ms (attempt 5/10)`, `giving up after 10 consecutive failed reconnect attempts`, `reconnected and
 * re-synced tools (attempt 2/10)` — and writes it through `ctx.logger`. This build mounts no console
 * sink for that service, and the one sink it has, the service's own in-memory ring, names no severity
 * and is therefore handed errors and info only: the client's warnings are dropped before any sink sees
 * them, and nothing reaches the page, the launcher's stdout or the host's own log files either. The plugin registers
 * a receiver of its own, asking for the severities the client speaks with, and keeps the lines.
 *
 * The receiver is held by the plugin's own effect rather than left to the service's bookkeeping:
 * `ctx.logger.exporter()` registers on the root, so a receiver it owns outlives the plugin.
 *
 * A line is attributed to a row by the label the client builds for that row's server name,
 * `mcp-client(<serverName>): ` — composed for the row, not guessed out of the text, so a server named
 * `scratch` cannot claim a line of `scratchy`. The labels of the declared servers are compared with the
 * longest first, because the platform builds its label by interpolation: a hand-edited name carrying
 * `): ` inside it makes one line start with two rows' labels, and the longest is the one the client
 * actually wrote. A line no declared label matches belongs to nobody here and is dropped.
 *
 * @module @coreness/mcp/src/trouble
 */

import { Logger } from '@deepseek-ai/cordis'

/**
 * How many lines the host's own logger may write before the oldest fall out of the store.
 *
 * A ring over the whole service rather than a list per server: a line is attributed when it is read, by
 * the labels of the rows that ask, so nothing has to be guessed at write time — and a profile whose
 * servers retry every thirty seconds writes a few dozen lines a minute, so the newest word about any
 * one of them stays inside a ring of this size.
 */
export const RING = 200

/** The levels that count as trouble: the platform's own names for the two severities it cries with. */
const TROUBLE = ['warn', 'error']

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

/** The label the platform's client puts in front of every sentence about one server. */
export const labelOf = (server) => `mcp-client(${server}): `

/** Whether a line is the host crying rather than reporting: its own severity decides. */
export const isTrouble = (line) => line !== null && line !== undefined && TROUBLE.includes(line.level)

/**
 * The newest line naming each of these servers.
 * @param {object[]} lines the kept lines, oldest first
 * @param {(string | null)[]} servers the server names of the rows of the picture
 * @returns {Map<string, object>} server name → the newest line naming it
 */
export function named(lines, servers) {
  const labels = [...new Set(servers.filter((server) => typeof server === 'string' && server !== ''))]
    .map((server) => ({ server, label: labelOf(server) }))
    .sort((left, right) => right.label.length - left.label.length)

  const namedBy = new Map()
  for (const line of lines) {
    const hit = labels.find(({ label }) => line.text.startsWith(label))
    if (hit !== undefined) namedBy.set(hit.server, line)
  }
  return namedBy
}

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
      if (!text.startsWith('mcp-client(')) return

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
