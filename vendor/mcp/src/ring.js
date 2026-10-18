/**
 * The ring's rules: which line speaks for a row, and what a row's sentence owes its reader.
 *
 * The platform's client writes one line about a server — `connection failed; retrying in 4000ms
 * (attempt 5/10)`, `giving up after 10 consecutive failed reconnect attempts`, `reconnected and
 * re-synced tools (attempt 2/10)` — and a line is attributed to a row by the label the client builds
 * for that row's server name, `mcp-client(<serverName>): `, composed for the row and not guessed out of
 * the text, so a server named `scratch` cannot claim a line of `scratchy`. The labels of the declared
 * servers are compared with the longest first, because the platform builds its label by interpolation:
 * a hand-edited name carrying `): ` inside it makes one line start with two rows' labels, and the
 * longest is the one the client actually wrote. A line no declared label matches belongs to nobody
 * here and is dropped.
 *
 * The election keeps the reason and leaves the promise beside it. A client whose attempts stopped leaves
 * the promise standing, so a sentence that promises a retry is not a fact this product can keep: what
 * happened is.
 *
 * This file holds no platform import: the rules answer to a fixture as well as to the receiver, and the
 * receiver is the only part of the ring that touches the host.
 *
 * @module @coreness/mcp/src/ring
 */

/** The levels that count as trouble: the platform's own names for the two severities it cries with. */
const TROUBLE = ['warn', 'error']

/** The start of the label the platform's client puts in front of every sentence about one server. */
export const PREFIX = 'mcp-client('

/** The label the platform's client puts in front of every sentence about one server. */
export const labelOf = (server) => `${PREFIX}${server}): `

/** The clause the client appends to a failure that means to try again. */
const RETRY_CLAUSE = /;\s*retrying\b/i

/**
 * A line as the row's own sentence: the platform's words verbatim up to the retry promise.
 *
 * The client writes `connection failed; retrying in 4000ms (attempt 5/10)`, and the promise is not a
 * fact this product can keep: a client whose attempts stopped leaves the sentence claiming a retry that
 * is not coming. What the row owes its reader is what happened, so the promise is cut at its own clause
 * and the reason stands (`connection failed`), the words still the platform's own and untouched. A line
 * with no such clause stands whole, and so does a promise that names no reason at all: with nothing else
 * to say, the attempt is the only word there is.
 * @param {string} text the platform's line, verbatim
 * @returns {string} the line with its retry promise left beside it, not in it
 */
export function electedOf(text) {
  const at = typeof text === 'string' ? text.search(RETRY_CLAUSE) : -1
  return at < 0 ? text : text.slice(0, at)
}

/** Whether a line is the host crying rather than reporting: its own severity decides. */
export const isTrouble = (line) => line !== null && line !== undefined && TROUBLE.includes(line.level)

/**
 * The newest line naming each of these servers, as the row's own sentence: the client's label, which only
 * addresses the row, and its retry promise both cut off, because neither is news about the row.
 * @param {object[]} lines the kept lines, oldest first
 * @param {(string | null)[]} servers the server names of the rows of the picture
 * @returns {Map<string, object>} server name → the newest sentence naming it
 */
export function named(lines, servers) {
  const labels = [...new Set(servers.filter((server) => typeof server === 'string' && server !== ''))]
    .map((server) => ({ server, label: labelOf(server) }))
    .sort((left, right) => right.label.length - left.label.length)

  const namedBy = new Map()
  for (const line of lines) {
    const hit = labels.find(({ label }) => line.text.startsWith(label))
    if (hit !== undefined) namedBy.set(hit.server, { ...line, text: electedOf(line.text.slice(hit.label.length)) })
  }
  return namedBy
}
