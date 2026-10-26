/**
 * The switch's door: what stands, and the one write that moves it.
 *
 * The page reads the picture here — the settings namespace (the composition's row id, never a copy in
 * the client), the Host's own read of the field, whether the profile's editor can address the row, and
 * whether the model-facing set stands right now — and writes `enabled` through the platform's own
 * profile editor, the same service the platform's settings form writes through. The write therefore
 * needs no client-side settings plugin: a profile that carries the page but not the platform's settings
 * surface still switches the feature.
 *
 * A refusal is a payload, not a status: the product's routes answer 200 with `{ok:false,error}` and the
 * page's words carry the sentence.
 *
 * @module @coreness/studio/route
 */

import { live } from './live.js'

/** The one route the page reads and writes. */
export const ROUTE = '/api/coreness.studio'

const codeOf = (error) => (typeof error?.code === 'string' && error.code !== '' ? error.code : 'UNKNOWN')
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/** A refusal with the code the answer carries. */
function failure(message, code) {
  return Object.assign(new Error(message), { code })
}

/**
 * The picture a page reads.
 * @param {object} ctx the cordis context
 * @param {{config: object, modelFacing: {active: () => boolean}, ns: string|null}} state
 * @returns {{ns: string|null, enabled: boolean, editable: boolean, mounted: boolean}} the picture
 */
export function stateOf(ctx, state) {
  const editor = state.ns === null ? undefined : ctx.get('configEditor')
  const row = editor === undefined ? undefined : editor.entries().find((entry) => entry.options.id === state.ns)
  return {
    /* The client never carries the namespace: this is the only place it is read. */
    ns: state.ns,
    /* The Host's own read of the field, which the write below then re-reads. */
    enabled: live(state.config?.enabled) === true,
    /* The profile's editor can address the row, which is what makes a write possible here at all. */
    editable: row !== undefined,
    /* The model-facing set standing right now, for the acceptance's second and third readings. */
    mounted: state.modelFacing.active() === true,
  }
}

/**
 * Write the field through the platform's profile editor and answer what now stands.
 *
 * The editor validates the value against the row's schema, persists the complete config to the active
 * profile's patch and reconciles the row — a volatile field then applies to the running plugin without
 * a remount, which is what the switch reads at its next sync. Its refusals (an entry that went away, a
 * row another layer overrides, a plugin that is no longer active) travel as the editor's own words, so
 * the page never guesses at a cause.
 * @param {object} ctx the cordis context
 * @param {unknown} enabled the value the page asked for
 * @param {{config: object, modelFacing: {active: () => boolean}, ns: string|null}} state
 * @returns {Promise<object>} the picture after the write
 */
export async function setEnabled(ctx, enabled, state) {
  if (typeof enabled !== 'boolean') throw failure('the body must carry "enabled" as true or false', 'BAD_REQUEST')
  if (state.ns === null) throw failure('this composition addresses no settings namespace for the row', 'NO_NAMESPACE')
  const editor = ctx.get('configEditor')
  if (editor === undefined) {
    throw failure("this composition carries no profile config editor, so the switch is set in the profile's Cordis config", 'NO_EDITOR')
  }
  const entry = editor.entries().find((candidate) => candidate.options.id === state.ns)
  if (entry === undefined) {
    throw failure(`the profile carries no "${state.ns}" row`, 'NO_ROW')
  }
  try {
    /* The complete config the row already carries, with the one field replaced: the editor persists what
       it is given, so a partial object would drop the row's other fields. */
    await editor.edit(entry, (current) => ({ ...current, enabled }))
  } catch (error) {
    throw failure(`the platform's editor refused the write: ${messageOf(error)}`, 'EDIT_REFUSED')
  }
  return stateOf(ctx, state)
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
    throw failure(`the studio route's body is not a JSON object: ${messageOf(error)}`, 'BAD_REQUEST')
  }
}

/**
 * One request on the route.
 * @param {object} ctx the cordis context
 * @param {Request} request the request
 * @param {(message: string) => void} warn where a refusal is said
 * @param {object} state the plugin's own doors
 * @returns {Promise<Response>} the answer
 */
export async function answerOf(ctx, request, warn, state) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    if (request.method === 'GET') return json({ ok: true, value: stateOf(ctx, state) })
    if (request.method === 'POST') {
      const body = await bodyOf(request)
      return json({ ok: true, value: await setEnabled(ctx, body.enabled, state) })
    }
    throw failure('the studio route answers GET and POST', 'METHOD')
  } catch (error) {
    warn(`the studio route refused a ${request.method}: ${codeOf(error)} — ${messageOf(error)}`)
    return json({ ok: false, error: { code: codeOf(error), message: messageOf(error) } })
  }
}
