/**
 * The reason a row did not start, read where the platform keeps it, and carried by the picture once.
 *
 * A row whose server cannot be reached is drawn with one word, and the words a person needs are already
 * standing in the process: the row's plugin never activates, and the error that ended it stays on the fiber
 * the Loader holds. Nothing publishes it — the inventory carries the phase alone, and the picture carries the
 * client's newest log line, which for a row whose activation ended is the retry it will never make — so this
 * reading goes to the record itself. `fiber.await()` is the platform's own door to it: it rethrows exactly
 * the error the fiber kept, cause and all.
 *
 * It lives here, beside the picture, because the picture is the one place every reader takes a row's facts
 * from: a second reader of the Loader's fiber would be a second shape of the same record, drifting with the
 * platform's error chain on its own.
 *
 * The record is read as a **chain** and not as a sentence, because the two ends are two different errors: the
 * platform's MCP client wraps what the SDK raised as its `cause`, and the SDK keeps the responder's own answer
 * in its `data` — the HTTP status, and the response body verbatim in `data.text`. Each fact is taken from
 * wherever in the chain it first stands, and the chain is walked through `cause` as well as `data.cause`,
 * because a shape the SDK classifies as a transport failure (a server that answered, but not as an MCP
 * server) is nested one level deeper.
 *
 * The two shapes of a body are both read, because where it lands depends on the path the failure took: a
 * request inside era negotiation carries it in `data.text`, while the SDK's request posted outside that
 * negotiation throws a plain error whose whole text is its own sentence with the body appended
 * (`Error POSTing to endpoint (HTTP 403): <the body>`) and no `data` at all. A shape with neither — a probe
 * that timed out, a process that closed — is answered by the family alone.
 *
 * **What stands on the platform rather than on a seam of ours:** the field names above (`cause`, `status`,
 * `data.text`) and the SDK's own sentence for the body-bearing path are implementation details of the
 * installed assembly, read here as shapes because there is no published door to a failed row's record. A
 * platform that moved them would leave the family standing and the responder's own words missing, and the
 * sentence drawn would then be the page's own — which is why the family is decided before the words.
 *
 * @module @coreness/mcp/src/failure
 */

/** The state a fiber stands in when its plugin's own start threw: the one state a record is kept in. */
const FAILED = 3

/** The HTTP statuses whose meaning is a family of its own. A status outside these is read as `unknown`. */
const BY_STATUS = new Map([[401, 'unauthorized'], [403, 'forbidden'], [404, 'missing']])

/** The SDK's own codes whose meaning is a family, for the shapes that carry no status at all. */
const BY_CODE = new Map([
  ['CLIENT_HTTP_UNEXPECTED_CONTENT', 'unexpected'],
  ['CONNECTION_CLOSED', 'closed'],
  ['REQUEST_TIMEOUT', 'silent'],
])

/**
 * The SDK's own sentence for the path that appends the body to it, read as a shape.
 *
 * Deliberately narrow: a message is read for a body only when it carries the parenthesis and the status, so
 * the client's own `initial connection or tool synchronization failed` — which is the outer error of every
 * failed row — yields nothing. A message read by its colons would take half a sentence for the server's words.
 */
const POSTING = /^Error POSTing to endpoint \((?:HTTP )?(\d{3})\):\s*([\s\S]*)$/u

/** How much of a responder's body is kept for the console: enough to quote, not a page of markup. */
export const DETAIL_MAX = 400

/**
 * How long the one sentence drawn in the card's body may be.
 *
 * A responder's message can be a page: the door of a gateway answers with markup, a proxy with its own HTML.
 * The sentence is cut at this length rather than drawn whole, and what was cut stays in the console with the
 * body's own text — the face carries a sentence a person reads, never a wall.
 */
export const SENTENCE_MAX = 240

/** The fields of a JSON body that carry a message for a person, in the order they are looked for. */
const MESSAGE_FIELDS = ['message', 'error_description', 'detail', 'title', 'error', 'reason']

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * The error and everything under it, read from the outside in: the value the platform kept, its `cause`, and
 * each node's own `data.cause` — the last one because the SDK nests a classification one level deeper.
 * @param {unknown} error the value the platform kept
 * @returns {object[]} the nodes of the chain that are objects
 */
function chainOf(error) {
  const nodes = []
  const seen = new Set()
  let one = error
  while (one !== null && one !== undefined && typeof one === 'object' && nodes.length < 8 && !seen.has(one)) {
    seen.add(one)
    nodes.push(one)
    one = one.cause ?? one.data?.cause ?? null
  }
  return nodes
}

/** The first value a reader answers somewhere along the chain, or null. */
function firstIn(nodes, read) {
  for (const node of nodes) {
    const value = read(node)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

/**
 * The responder's own words, taken out of its body: a JSON body's message field where it has one, the first
 * sentence of anything else, and nothing at all from a body that is markup or empty.
 * @param {string} body the body as the platform kept it
 * @returns {string | null} one sentence, or nothing
 */
export function sentenceIn(body) {
  const text = String(body ?? '').replace(/\s+/gu, ' ').trim()
  if (text === '') return null
  let words = text
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      const found = MESSAGE_FIELDS
        .map((field) => parsed[field])
        .find((value) => typeof value === 'string' && value.trim() !== '')
      if (found === undefined) return null
      words = found.replace(/\s+/gu, ' ').trim()
    } catch {
      /* A body that opens like JSON and does not parse is not a message anybody wrote for a person. */
      return null
    }
  }
  /* Markup is not a sentence: what a gateway's error page says belongs in the console, not on the face. */
  if (words.startsWith('<')) return null
  const stop = words.search(/[.!?](\s|$)/u)
  const one = stop === -1 ? words : words.slice(0, stop + 1)
  return one.length <= SENTENCE_MAX ? one : `${one.slice(0, SENTENCE_MAX).trimEnd()}…`
}

/**
 * The reason a failure carries: its family, the responder's own words when it has any, and the platform's own
 * record of the chain for the console.
 * @param {unknown} error the error the fiber kept
 * @returns {{family: string, server: string | null, detail: string | null}} the reading
 */
export function readReason(error) {
  const nodes = chainOf(error)
  const codes = nodes.map((node) => (typeof node.code === 'string' ? node.code : null)).filter((one) => one !== null)
  const status = firstIn(nodes, (node) => (typeof node.status === 'number' ? node.status : node.data?.status ?? null))
  const body = firstIn(nodes, (node) => (typeof node.data?.text === 'string' ? node.data.text : null))

  /* The body a path appended to its own sentence, where no `data` carries one. */
  let appended = null
  let appendedStatus = null
  if (body === null) {
    for (const node of nodes) {
      const hit = POSTING.exec(String(node.message ?? ''))
      if (hit === null) continue
      appendedStatus = Number(hit[1])
      appended = hit[2]
      break
    }
  }

  const verdict = typeof status === 'number' ? status : appendedStatus
  const family = verdict !== null && BY_STATUS.has(verdict)
    ? BY_STATUS.get(verdict)
    : verdict !== null && verdict >= 500
      ? 'broken'
      : codes.map((code) => BY_CODE.get(code)).find((one) => one !== undefined) ?? 'unknown'

  const server = sentenceIn(body ?? appended ?? '')
  const said = nodes.map((node) => `${node.name ?? 'Error'}: ${reasonOf(node)}`).join(' <-- ')
  const kept = body ?? appended ?? ''
  const detail = [said, kept === '' ? null : `the server answered: ${kept.length <= DETAIL_MAX ? kept : `${kept.slice(0, DETAIL_MAX)}…`}`]
    .filter((one) => one !== null)
    .join(' — ')

  return { family, server, detail }
}

/**
 * The reason of one row, read off the Loader's own entry.
 *
 * The fiber is asked only in the failed state: `await()` waits out a load in flight, and a request of the page
 * must not stand for the length of somebody else's connection attempt. A row whose entry is not in the Loader,
 * whose fiber is not failed any more, or a composition that carries no Loader at all, is answered with nothing:
 * the picture and the Loader are read a moment apart, and a row that came up in between has no reason to give.
 * @param {object} ctx the context carrying the Loader
 * @param {string} entryId the row's own entry, as the picture names it
 * @returns {Promise<{family: string, server: string | null, detail: string | null} | null>} the reason
 */
export async function reasonOfRow(ctx, entryId) {
  const loader = ctx.get?.('loader')
  if (loader === undefined) return null
  const entries = [...(loader.entries?.() ?? [])]
  const entry = entries.find((one) => String(one?.id ?? '') === String(entryId))
  if (entry === undefined) return null
  const fiber = entry.fiber
  if (fiber === undefined || fiber.state !== FAILED) return null
  try {
    await fiber.await()
    return null
  } catch (error) {
    return readReason(error)
  }
}

/**
 * The reason of every row the picture reports as failed, keyed by the row's own entry.
 *
 * The rows are read only while the inventory says their fiber failed, so the reading waits on no row that is
 * still coming up.
 * @param {object} ctx the context carrying the Loader
 * @param {object[]} rows the rows of the picture
 * @param {object[]} inventory the platform's own listing, as the picture read it
 * @returns {Promise<Map<string, object>>} entryId → the reason, one entry per failed row
 */
export async function failuresOf(ctx, rows, inventory) {
  const failed = new Set(inventory
    .filter((one) => String(one?.fiberPhase ?? '') === 'failed')
    .map((one) => String(one?.entryId ?? '')))
  const out = new Map()
  for (const row of rows) {
    const entryId = String(row?.entryId ?? '')
    if (!failed.has(entryId)) continue
    const reason = await reasonOfRow(ctx, entryId)
    if (reason !== null) out.set(entryId, reason)
  }
  return out
}
