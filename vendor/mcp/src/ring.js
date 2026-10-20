/**
 * The ring's rules: which line speaks for a row, what a row's sentence owes its reader, and how long it
 * owes it for.
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
 * A sentence also owes its reader a limit, and the promise is the clock: a line that names a retry speaks
 * until that retry is due and no longer, one round trip of allowance after it. A client that is still
 * failing writes again inside that window, so the sentence stays fresh while it is true; one that came
 * back writes either its `reconnected` line or, coming up on its first attempt, nothing at all. That
 * nothing is what a replaced row leaves behind — the row was switched, reloaded or written again and its
 * client came up clean, while the line of the instance before it stands in the ring — and without the
 * limit the card would draw that old failure as the row's state for as long as the host runs.
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

/**
 * The clause the client appends to a failure that means to try again, with the delay it promises.
 * The client spells the clause by what it lost — `retrying` for a row that never came up, `reconnecting`
 * for one that had — and both are the same promise to the reader.
 */
const RETRY_CLAUSE = /;\s*(?:retrying|reconnecting) in (\d+(?:\.\d+)?)\s*ms\b/i

/**
 * What one attempt may spend before it reports: one round trip, the ceiling the MCP client SDK itself gives
 * a request that names no timeout — `DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4`, applied to the initialize the
 * connect sends. A promised delay plus this is the last moment the sentence can still be true without a
 * newer line beside it.
 */
export const ATTEMPT_MS = 60_000

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

/**
 * When the retry a line promises falls due, as the last moment the sentence still speaks.
 *
 * The promise is read from the line itself (`retrying in 4000ms`), so the platform's own words are the
 * clock; the allowance is one attempt's. A line that promises nothing — `giving up after 10 …`, a client
 * whose reconnect is disabled — has no such moment: it states what happened and keeps standing.
 * @param {string} text the platform's line, verbatim, without the label
 * @param {string | null} at the moment the line was written, as the receiver kept it
 * @returns {number | null} the deadline in epoch milliseconds, or nothing when no retry is promised
 */
export function dueOf(text, at) {
  const hit = typeof text === 'string' ? RETRY_CLAUSE.exec(text) : null
  if (hit === null) return null
  const written = typeof at === 'string' ? Date.parse(at) : Number.NaN
  return Number.isFinite(written) ? written + Number(hit[1]) + ATTEMPT_MS : null
}

/** Whether a line is the host crying rather than reporting: its own severity decides. */
export const isTrouble = (line) => line !== null && line !== undefined && TROUBLE.includes(line.level)

/**
 * Whether a kept line still speaks for its row: it must be the host crying, and the retry it promises —
 * when it promises one — must not be due yet.
 * @param {object | null} line the kept line as the election left it
 * @param {number} now the moment the picture is read, in epoch milliseconds
 * @returns {boolean} whether the line is the row's news now
 */
export function speaks(line, now) {
  if (!isTrouble(line)) return false
  return typeof line.due !== 'number' || now < line.due
}

/**
 * The newest line naming each of these servers, as the row's own sentence: the client's label, which only
 * addresses the row, and its retry promise both cut off, because neither is news about the row — and the
 * promise's due moment kept beside the sentence, which is what decides how long it speaks.
 * @param {object[]} lines the kept lines, oldest first
 * @param {(string | null)[]} servers the server names of the rows of the picture
 * @returns {Map<string, object>} server name → the newest sentence naming it, with its deadline
 */
export function named(lines, servers) {
  const labels = [...new Set(servers.filter((server) => typeof server === 'string' && server !== ''))]
    .map((server) => ({ server, label: labelOf(server) }))
    .sort((left, right) => right.label.length - left.label.length)

  const namedBy = new Map()
  for (const line of lines) {
    const hit = labels.find(({ label }) => line.text.startsWith(label))
    if (hit === undefined) continue
    const said = line.text.slice(hit.label.length)
    namedBy.set(hit.server, { ...line, text: electedOf(said), due: dueOf(said, line.at) })
  }
  return namedBy
}
