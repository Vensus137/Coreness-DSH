/**
 * The ceiling door: what the row carries now, and what a write leaves in force.
 *
 * The value is read from the row's **resolved** config (`fiber.config`): the schema's default is part of
 * what stands, and a row that names no ceiling still has one. A row whose fiber has not resolved has no
 * ceiling in force — the answer says `null` rather than substituting the raw patch, which may name a
 * value the row never validated.
 */

import { outcomeOf } from './policy.js'

/** The row the product's bundle inserts; its config carries the ceiling. */
export const ROW = 'agent-team'

/** A volatile field's live value: the box a write reaches, or the plain value. */
const live = (field) => (typeof field?.get === 'function' ? field.get() : field)

/** The code a thrown value carries, or the one this door gives a value that carries none. */
const codeOf = (error) => (typeof error?.code === 'string' && error.code !== '' ? error.code : 'UNKNOWN')

/** The reason of a thrown value, in words. */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/** A refusal with the code the answer carries. */
function failure(message, code) {
  return Object.assign(new Error(message), { code })
}

/**
 * The team as a surface reads it.
 *
 * `mounted` is the platform's team service — the roster, the mailbox and the board — and not this
 * plugin: the row may stand while a composition has switched the service off. `editable` says whether
 * the profile's own config editor can address the row at all, so a page knows whether the value it
 * shows can be written here. `maxMembers` is the resolved config of the row, so a row that names no
 * value answers with the schema's default, and a row that has not resolved answers `null`. `prompt` and
 * `review` are the two switches as the page draws them: the review one stands inside the text the prompt
 * one supplies, and the page says so rather than refusing the write.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {{mounted: boolean, editable: boolean, maxMembers: number|null, prompt: boolean, review: boolean, policy: string, ns: string|null}} the picture
 */
export function stateOf(ctx, config) {
  const editor = ctx.get('configEditor')
  const entry = editor === undefined ? undefined : rowOf(editor)
  const value = entry?.fiber?.config?.maxMembers
  return {
    mounted: ctx.get('agentTeams') !== undefined,
    editable: entry !== undefined,
    maxMembers: typeof value === 'number' ? value : null,
    prompt: live(config?.prompt) === true,
    review: live(config?.review) === true,
    policy: outcomeOf(),
    /* The settings namespace is the row's own id in the composition — one owner, and the page reads it
       here rather than carrying a second copy of the name. `null` says this composition addresses no row,
       and the page then offers no switch. */
    ns: ctx.fiber?.entry?.options?.id ?? null,
  }
}

/**
 * The row, as the profile's own config editor addresses it.
 *
 * The editor's list is the addressable profile rows: a row of a nested include is not one of them, and
 * a composition that mounts the team from another layer leaves this list without the row — the write
 * then refuses by name instead of editing a file the editor does not own.
 * @param {object} editor the profile's config editor
 * @returns {object|undefined} the entry
 */
function rowOf(editor) {
  return editor.entries().find((entry) => entry.options.id === ROW)
}

/**
 * Write a new ceiling and answer with what the row now carries.
 *
 * The platform's editor does the work: it validates the value against the row's schema, persists the
 * complete config to the active profile's patch, and re-applies the row through the Loader. Its
 * refusals — an entry that went away, a changed entry, a plugin that is no longer active — are marked
 * as the editor's, so a page can tell them from a fault of this door, and travel in its own words.
 * @param {object} ctx the cordis context
 * @param {unknown} value the ceiling the page asked for
 * @param {object} config the plugin's resolved config
 * @returns {Promise<{mounted: boolean, editable: boolean, maxMembers: number|null, prompt: boolean, review: boolean, policy: string, ns: string|null}>} the picture after the write
 */
export async function setCeiling(ctx, value, config) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw failure('the ceiling is a whole number of at least 1', 'BAD_REQUEST')
  }
  const editor = ctx.get('configEditor')
  if (editor === undefined) {
    throw failure("this composition carries no profile config editor, so the ceiling is set in the profile's Cordis config", 'NO_EDITOR')
  }
  const entry = rowOf(editor)
  if (entry === undefined) {
    throw failure(`the profile carries no "${ROW}" row`, 'NO_ROW')
  }
  /* The complete config the row already carries, with the one field replaced: the editor persists what
     it is given, so a partial object would drop the row's other fields. */
  try {
    await editor.edit(entry, (current) => ({ ...current, maxMembers: value }))
  } catch (error) {
    throw failure(refusalOf(error), 'EDIT_REFUSED')
  }
  return stateOf(ctx, config)
}

/**
 * The words of an editor refusal, for the case a reader can settle alone.
 *
 * A row configured by two layers — the product's bundle and the platform's own Agent Team bundle — is the
 * one refusal that names a thing to change rather than a mechanism to understand: the platform's sentence
 * for it says `overridden by a home patch or command-line overlay`, which is true and tells a reader
 * nothing they can do. Every other refusal travels in the platform's own words.
 * @param {unknown} error the refusal the editor raised
 * @returns {string} the sentence the console carries
 */
function refusalOf(error) {
  const said = messageOf(error)
  if (said.includes('overridden by a home patch')) {
    return `The "${ROW}" row is configured by another layer as well — the platform's own Agent Team bundle — so the profile's editor cannot write it: enable one of the two.`
  }
  return `the platform's editor refused the write: ${said}`
}

/**
 * The answer of one request on the route.
 *
 * The status is 200 in both cases — `{ok:true, value}` or `{ok:false, error}` — as the product's other
 * routes answer: a refusal is a state of the page, and its words are what the page shows.
 * @param {object} ctx the cordis context
 * @param {Request} request the request
 * @param {(message: string) => void} warn where a refusal is said
 * @param {object} config the plugin's resolved config
 * @returns {Promise<Response>} the answer
 */
export async function answerOf(ctx, request, warn, config) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    if (request.method === 'GET') return json({ ok: true, value: stateOf(ctx, config) })
    const body = await bodyOf(request)
    return json({ ok: true, value: await setCeiling(ctx, body.maxMembers, config) })
  } catch (error) {
    warn(`the team route refused a ${request.method}: ${codeOf(error)} — ${messageOf(error)}`)
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
    throw failure(`the team route's body is not a JSON object: ${messageOf(error)}`, 'BAD_REQUEST')
  }
}
