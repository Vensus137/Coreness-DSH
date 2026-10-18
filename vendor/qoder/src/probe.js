/**
 * The node sweep: every node the map names, each asked for its own catalogue.
 *
 * One sweep answers one question — *which node is serving this account right now* — and it answers by
 * asking each node for the model listing rather than for a bare reachability: one call proves both that the
 * node is up and that it takes this account's token, and it is the call the route makes anyway. The shape is
 * the donor's, kept whole: the node the row pins goes first (it is where the route is sending at this
 * moment), the map's list follows, each address once; one node's failure does not stop the sweep; and a
 * sweep that cannot start at all — no token, a map that does not answer — is an error of the answer, never
 * an empty list that would read as "no node answered".
 *
 * Each node is asked under the transport's own control ceiling, one at a time: there is no second number
 * here and no second writer of a signed call — how this vendor is spoken to belongs to the transport. A
 * caller's cancellation ends the sweep, and the nodes it never reached are named as cancelled rather than
 * reported as failures of their own.
 *
 * Nothing here writes. The answer carries the results and the node the sweep would pin — the row's own node
 * when it answered, otherwise the first that did — and the write is the page's, through the platform's
 * settings remote, because the row's section is the profile's Cordis patch and no host half of this product
 * writes that file. The decision of *which* node to pin lives here rather than in the page for one reason:
 * the address as the transport will use it is known only here, and a second comparer in the browser would
 * drift from it.
 *
 * @module @coreness/qoder/src/probe
 */

/** The action the sweep's route answers; the page presses it. */
export const PROBE_ACTION = 'probe'

/** How long a node's own reason may be in the answer, in characters. */
export const REASON_LIMIT = 200

/**
 * The address a node is compared by: a bare host gets its scheme, a trailing slash goes.
 *
 * Tolerant on purpose, and unlike the transport's own `normalizeNode`: the map is the vendor's, and one
 * entry that is not an address must end as that node's own failure rather than as a sweep that never
 * ran.
 * @param {unknown} node an address as it was named
 * @returns {string} the key two spellings of one node share
 */
export function comparableNode(node) {
  const raw = typeof node === 'string' ? node.trim() : String(node ?? '')
  try {
    const parsed = new URL(/^https?:\/\//iu.test(raw) ? raw : `https://${raw}`)
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/u, '')}`
  } catch {
    return raw
  }
}

/**
 * The nodes one sweep asks, in order: the node the row pins, then the map's own, each address once.
 * @param {string | undefined} configured the node the row pins, when it pins one
 * @param {readonly string[]} discovered the nodes the map names
 * @returns {string[]} the addresses, in the order they are asked
 */
export function sweepTargets(configured, discovered) {
  const seen = new Set()
  const targets = []
  for (const node of [configured, ...(Array.isArray(discovered) ? discovered : [])]) {
    if (typeof node !== 'string' || node.trim() === '') continue
    const key = comparableNode(node)
    if (seen.has(key)) continue
    seen.add(key)
    targets.push(node.trim())
  }
  return targets
}

/**
 * The status a node's refusal carried, when it carried one.
 *
 * A missing status stays missing: zero in its place would read as an answer the node gave.
 * @param {unknown} error the node's refusal
 * @returns {number | undefined} the status
 */
function statusOf(error) {
  const status = error?.status
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined
}

/**
 * A node's failure in words: the status when the node answered with one, otherwise its own reason,
 * whitespace collapsed and bounded.
 * @param {unknown} error the node's refusal
 * @returns {string} the words of the failure
 */
function failureWords(error) {
  const status = statusOf(error)
  if (status !== undefined) return `HTTP ${status}`
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/\s+/gu, ' ').trim().slice(0, REASON_LIMIT)
}

/** The reason a sweep was cancelled, in words. */
const cancelledWords = (signal) => failureWords(signal?.reason ?? new Error('the sweep was cancelled by the caller'))

/**
 * One sweep: ask every node of the map for its catalogue, in order.
 * @param {object} transport the route's transport, the one owner of a signed call to a node
 * @param {object} [options] the sweep
 * @param {AbortSignal} [options.signal] the caller's cancellation
 * @param {() => number} [options.now] the clock, for a test
 * @returns {Promise<{nodes: object[], pin: string | null}>} one result per node, in the sweep's order,
 *   and the node the route should use — `null` when no node answered
 * @throws {Error | object} when the sweep could not start: the map is unreachable, or the token is refused
 */
export async function sweepNodes(transport, { signal, now = () => Date.now() } = {}) {
  const map = await transport.nodeMap(signal)
  const current = await transport.resolvedEndpoints(signal)
  const configured = current.source === 'configured' ? current.inferBase : undefined
  const targets = sweepTargets(configured, map.inferNodes)

  const nodes = []
  for (const node of targets) {
    if (signal?.aborted === true) {
      nodes.push({ node, ok: false, error: cancelledWords(signal), durationMs: 0 })
      continue
    }
    const startedAt = now()
    try {
      const models = await transport.catalogue({ signal, node })
      nodes.push({ node, ok: true, models: models.length, durationMs: now() - startedAt })
    } catch (error) {
      const status = statusOf(error)
      nodes.push({
        node,
        ok: false,
        ...status === undefined ? {} : { status },
        error: failureWords(error),
        durationMs: now() - startedAt,
      })
    }
  }

  const answered = nodes.filter((one) => one.ok === true)
  const inside = answered.some((one) => comparableNode(one.node) === comparableNode(current.inferBase))
  /* A node that answered keeps its place: the sweep is a check, not a re-election. Only when the node
     the route is using did not answer does the first node that did take its place. */
  const pin = answered.length === 0 ? null : inside ? current.inferBase : answered[0].node
  return { nodes, pin }
}
