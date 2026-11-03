/**
 * The proxy's door: the picture the card draws, and the check it presses.
 *
 * The picture is the one place the stored URL leaves the host: the card draws it in a masked, editable
 * field so a configured proxy does not have to be retyped. Everywhere else — a log line, a tool error, a
 * refusal's reason — the URL stays host-side and a proxy is named as `host:port` only. The check reads
 * the stored value here, runs exactly one reachability probe, and answers the card's three words.
 *
 * The picture's `editable` says whether the switch can be written at all: the settings service projects
 * the row's volatile fields, and the profile's own config editor is what addresses the row. A
 * composition without either answers `editable: false` rather than offering a control that cannot act.
 *
 * @module @coreness/proxy/src/route
 */

import { live } from './live.js'
import { checkProxy, redact, resolveStored } from './proxy.js'

/** The path the card reads and presses. */
export const ROUTE = '/api/coreness.proxy'

/** The one action the check accepts; the URL is never part of the body. */
export const CHECK_ACTION = 'check'

/** The code a thrown value carries, or the one this door gives a value that carries none. */
const codeOf = (error) => (typeof error?.code === 'string' && error.code !== '' ? error.code : 'UNKNOWN')

/** The reason of a thrown value, in words. */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/** A refusal with the code the answer carries. */
function failure(message, code) {
  return Object.assign(new Error(message), { code })
}

/** The row this plugin's fiber answers for, as the profile's own config editor addresses it. */
function rowIdOf(ctx) {
  return ctx.fiber?.entry?.options?.id ?? null
}

/**
 * Whether the profile's editor can address this plugin's row.
 *
 * The editor's own list is the addressable rows: a row a nested include carries is not one of them, and
 * a profile that mounts the plugin from another layer leaves the list without it.
 * @param {object} ctx the cordis context
 * @returns {boolean} true when the row is addressable
 */
function editableIn(ctx) {
  const editor = ctx.get('configEditor')
  if (editor === undefined) return false
  const ns = rowIdOf(ctx)
  if (ns === null) return false
  return editor.entries().some((entry) => entry.options.id === ns)
}

/**
 * The picture the card draws.
 *
 * `configured` is asked of the credential store — the same answer its own configuration surfaces show —
 * so a stored value, an environment fallback and an unset name read distinctly; a store that refuses to
 * describe the reference is a fault in words, not a silent `false`. `url` is the resolved value itself,
 * read once for the picture, because the card's field shows it masked and editable; a profile with
 * nothing stored, or a store that cannot answer the resolve, reads `url: null`. The credential service
 * is not optional here: the web composition that serves this route carries it, so a missing one is a
 * read that failed, not a second answer code.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {Promise<object>} the picture
 */
export async function stateOf(ctx, config) {
  const credentials = ctx.get('credentials')
  const proxyRef = String(live(config.proxyRef) ?? '')
  let described
  try {
    described = await credentials.describe(proxyRef)
  } catch (error) {
    throw failure(`the stored proxy URL could not be read: ${redact(messageOf(error))}`, 'READ_REFUSED')
  }
  const url = await resolveStored(credentials, proxyRef).catch(() => null)
  const ns = rowIdOf(ctx)
  return {
    enabled: live(config.enabled) === true,
    configured: described?.configured === true,
    proxyRef,
    url,
    writable: described?.writable === true,
    editable: editableIn(ctx) && ctx.get('settings') !== undefined,
    ns,
  }
}

/**
 * One reachability check of the stored proxy, in the card's three words.
 *
 * The stored value is the only source: a body naming a URL is refused before this point, because the
 * card's check is a check of what is stored, and a value that fails the shape is a refusal of the check
 * itself rather than a connection attempt. The probe is bounded; the resolve before it is not.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {Promise<{verdict: string, hostPort: string|null, reason?: string}>} the verdict
 */
export async function checkOf(ctx, config) {
  const credentials = ctx.get('credentials')
  const proxyRef = String(live(config.proxyRef) ?? '')
  let stored
  try {
    stored = await resolveStored(credentials, proxyRef)
  } catch (error) {
    throw failure(`the stored proxy URL could not be read: ${redact(messageOf(error))}`, 'READ_REFUSED')
  }
  if (stored === null) {
    throw failure('no proxy URL is stored, so there is nothing to check', 'NO_PROXY')
  }
  return await checkProxy(stored)
}

/**
 * The answer of one request on the route.
 *
 * The status is 200 in both cases — `{ok:true, value}` or `{ok:false, error}` — as the product's other
 * routes answer: a refusal is a state of the page, and its words are what the page shows.
 * @param {object} ctx the cordis context
 * @param {Request} request the request
 * @param {(message: string) => void} [warn] where a refusal is said
 * @param {object} config the plugin's resolved config
 * @returns {Promise<Response>} the answer
 */
export async function answerOf(ctx, request, warn = () => {}, config) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    if (request.method === 'GET') return json({ ok: true, value: await stateOf(ctx, config) })
    const body = await bodyOf(request)
    const fields = Object.keys(body)
    if (fields.length !== 1 || fields[0] !== 'action' || body.action !== CHECK_ACTION) {
      throw failure(`the proxy route's body carries only {"action":"${CHECK_ACTION}"}: the check reads the stored URL`, 'BAD_REQUEST')
    }
    return json({ ok: true, value: await checkOf(ctx, config) })
  } catch (error) {
    warn(`the proxy route refused a ${request.method}: ${codeOf(error)} — ${messageOf(error)}`)
    return json({ ok: false, error: { code: codeOf(error), message: messageOf(error) } })
  }
}

/**
 * The body of a request. A body that is not a JSON object is a refusal in words, not a crash; a body
 * that cannot be read at all is a fault of the transport and travels as one.
 * @param {Request} request the request
 * @returns {Promise<object>} the body
 */
async function bodyOf(request) {
  const text = await request.text()
  try {
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('the body is not an object')
    return parsed
  } catch (error) {
    throw failure(`the proxy route's body is not a JSON object: ${messageOf(error)}`, 'BAD_REQUEST')
  }
}
