/**
 * The write path of the servers file: the saves the form asks for, each one confirmed by reading the
 * tree back.
 *
 * The file has one writer — the Loader's `cordis:include` — so a save is a call to the Loader and
 * never a YAML edit: `create` for a new row, `update` for a change or a switch, and a removal asked
 * of the row's own parent group by the id that group knows.
 *
 * The confirmation is the point of this module, and it is the tree's answer. `EntryTree.remove` resolves
 * a root-qualified id and then hands that same qualified id to the group that holds the row, whose lookup
 * is keyed by the row's short id: the lookup misses, the group returns in silence, the file is written
 * with the row still in it, and the caller is told nothing. A save that trusted that silence would answer
 * "removed" and the row would be back at the next read. So every write here ends by reading the tree back
 * and comparing it with what was written, and a disagreement is a refusal in words — never a success.
 *
 * The file's own write is the include's, debounced on a timer of its own, and a write that fails reaches
 * only the log: a save on a read-only file therefore answers through the tree and says so beside the
 * result. That is the seam the platform offers; the door does not pretend to a file it cannot read
 * back.
 *
 * @module @coreness/mcp/src/write
 */

import { MCP_MODULE, REFERENCE_HEADER, REFERENCE_OPTION, buildConfig, isRef, referenceOf, refsOf, rowId, sameConfig, serverNameOf } from './row.js'
import { createRow, entryOf, removeRow, rowsOf, updateRow } from './tree.js'

/**
 * The words a refusal answers with. The page carries its own dictionary by code — the same
 * vocabulary, held together by a check in `check-codes` — and this one is the host's account of the
 * same code: a client that does not know a code still reads something true.
 */
export const WORDS = {
  'bad-action': 'the page asked for a save this route does not take',
  'bad-name': 'a server name is 1 to 32 characters of letters, digits, underscore or hyphen',
  'name-taken': 'another row of this file already takes that name',
  'bad-transport': 'a server connects by one of the platform\'s two transports, and this save names neither',
  'bad-url': 'the address must parse as an http or https URL',
  'bad-command': 'a stdio row needs the command it starts',
  'bad-timeout': 'the call timeout is a whole number of milliseconds',
  'bad-header': 'a header carries a name of the wire\'s own charset',
  'bad-env': 'an environment variable carries a name of letters, digits and underscores, not starting with a digit',
  'bad-value': 'a value with a line break, or one of spaces alone, is not a value this file can hold',
  'header-ref': 'a header of this row stands as an expression, and the form does not write over it',
  'env-ref': 'an environment variable of this row stands as an expression, and the form does not write over it',
  'config-ref': 'a setting this form owns stands as an expression in the file, and the form does not write over it',
  'disabled-ref': 'the enablement of this row stands as an expression, and the toggle does not write over it',
  'no-file': 'this composition declares no row for the servers file',
  'no-row': 'the servers file holds no such row',
  'not-an-mcp-row': 'this row is not an MCP client row, so the MCP form does not shape it',
  'not-saved': 'the save did not stand: what the file now holds is not what was written',
  'write-failed': 'the Loader refused the write',
  unreadable: 'the profile could not be read here',
}

/** The actions the route takes. */
export const ACTIONS = ['add', 'edit', 'remove', 'toggle', 'reference', 'reload']

/**
 * A refusal of a save: the code the route answers with, and the words the user reads beside it.
 */
export class Refusal extends Error {
  /**
   * @param {string} code one of the refusals this plugin names
   * @param {string} [detail] what the code means here — the row, the value, the Loader's own words
   */
  constructor(code, detail) {
    super(detail ?? WORDS[code] ?? code)
    this.code = code
  }
}

/**
 * The rows of the servers file, with the live tree row each address stands for.
 * @param {object} include the include entry
 * @returns {object[]} the rows
 */
function rowsWithEntry(include) {
  return rowsOf(include).map((row) => ({ ...row, live: entryOf(include, row.id) }))
}

/**
 * The OAuth flow this composition carries, when it carries one.
 *
 * The flow is the owner of a row's reference — the credential key and the expression that reads it — and
 * it is optional: a composition without it keeps the file's own freedom over literal values, and offers no
 * sign-in. The service is resolved per call and never held, for the same reason the door resolves the
 * others: a reload of the tree may replace it underneath this plugin.
 * @param {object} ctx the plugin's context
 * @returns {object | null} the flow, or null when none stands
 */
function flowFor(ctx) {
  const flow = typeof ctx?.get === 'function' ? ctx.get('oauthFlow') : undefined
  return flow !== null && flow !== undefined && typeof flow.reference === 'function' ? flow : null
}

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * The names the rows of this file already take.
 *
 * A name is taken twice over: the platform refuses a second connection with one `serverName`, and a
 * row's own id is derived from it (`mcp-<name>`), so both the declared name and the id's own name
 * count.
 * @param {object} include the include entry
 * @param {string | null} except the row id to leave out of the count
 * @returns {Set<string>} the names
 */
function namesIn(include, except = null) {
  const names = new Set()
  for (const row of rowsOf(include)) {
    if (except !== null && row.id === except) continue
    if (row.module === MCP_MODULE && typeof row.config.serverName === 'string' && row.config.serverName !== '') names.add(row.config.serverName)
    const named = serverNameOf(row.id)
    if (named !== '') names.add(named)
  }
  return names
}

/**
 * The row of the servers file an address names.
 * @param {object} include the include entry
 * @param {unknown} entryId the address the page sent
 * @returns {object} the row, with its tree entry
 * @throws {Refusal} `no-row` when this file holds no such row
 */
function ownRow(include, entryId) {
  const address = String(entryId ?? '')
  const found = rowsWithEntry(include).find((row) => row.entryId === address)
  if (found === undefined) throw new Refusal('no-row', `the servers file holds no row addressed "${address}"`)
  return found
}

/**
 * Refuse to shape a row the form does not own.
 * @param {object} row the row of the file
 * @returns {void}
 * @throws {Refusal} `not-an-mcp-row`, `config-ref` or `disabled-ref`
 */
function shapeable(row) {
  if (row.module !== MCP_MODULE) {
    throw new Refusal('not-an-mcp-row', `the row "${row.id}" is a "${row.module}" row, and this form shapes MCP client rows only`)
  }
  const refs = refsOf(row.config)
  if (refs.length > 0) {
    throw new Refusal('config-ref', `the row "${row.id}" stands as an expression in ${refs.join(', ')}, and the form does not write over it`)
  }
}

/**
 * The tree's own answer after a write: the row read again at the address it was written to.
 *
 * A row that cannot be resolved is not a row with an empty config — it is a row whose state is
 * unknown, and the Loader's own words travel instead of a substituted empty object.
 *
 * What this reads is the tree the Loader holds, not the servers file: the include writes that file on a
 * timer of its own and reports a failed write only to the log, so a file that is read-only or busy still
 * answers through the tree. The door's answer is therefore the tree's answer, and it says so; a save that
 * claims the file is a save this door cannot stand behind.
 * @param {object} ctx the plugin's context
 * @param {string} entryId the address
 * @returns {object} the row's config and enablement as the tree now holds them
 * @throws {Refusal} `not-saved` when the Loader cannot answer for the address it confirmed
 */
function readAgain(ctx, entryId) {
  let entry
  try {
    entry = ctx.loader.resolve(entryId)
  } catch (error) {
    throw new Refusal('not-saved', `the save could not be confirmed: the Loader now answers "${error instanceof Error ? error.message : String(error)}" for "${entryId}"`)
  }
  return {
    config: entry.options?.config ?? {},
    disabled: entry.disabled === true,
    disabledRef: isRef(entry.options?.disabled),
    inject: Array.isArray(entry.options?.inject) ? entry.options.inject : [],
    injectRef: isRef(entry.options?.inject),
  }
}

/**
 * What is said when the write's answer and the re-read disagree.
 * @param {string} what the row or the action
 * @param {unknown} written what was written
 * @param {unknown} found what the tree now holds
 * @returns {string} the words
 */
function disagreement(what, written, found) {
  return `the save of ${what} did not stand: the Loader reported no error, and the tree now holds ${JSON.stringify(found)} instead of ${JSON.stringify(written)}`
}

/**
 * Add a row to the servers file.
 * @param {object} ctx the plugin's context
 * @param {object} include the include entry
 * @param {object} form the form's fields
 * @returns {Promise<object>} what was done
 * @throws {Refusal} a refusal of the form, or of the confirmation
 */
async function addServer(ctx, include, form) {
  const built = buildConfig(form, {}, { offerSignIn: flowFor(ctx) !== null })
  if (built.error !== undefined) throw new Refusal(built.error, built.detail)
  const server = built.config.serverName
  if (namesIn(include).has(server)) throw new Refusal('name-taken', `the file already declares a server named "${server}"`)

  const id = rowId(server)
  const address = String(await createRow(ctx, String(include.id), { id, config: built.config }))
  const back = readAgain(ctx, address)
  if (!sameConfig(back.config, built.config)) throw new Refusal('not-saved', disagreement(`the server "${server}"`, built.config, back.config))
  return { result: 'created', entryId: address, server, confirmed: 'tree' }
}

/**
 * Change a row of the servers file.
 *
 * A save that changes nothing writes nothing: the row is already what the form asks for, and a
 * write would restart its connection for no reason.
 * @param {object} ctx the plugin's context
 * @param {object} include the include entry
 * @param {object} row the row as the file holds it
 * @param {object} form the form's fields
 * @returns {Promise<object>} what was done
 * @throws {Refusal} a refusal of the form, or of the confirmation
 */
async function editServer(ctx, include, row, form) {
  shapeable(row)
  const built = buildConfig(form, row.config, { offerSignIn: flowFor(ctx) !== null })
  if (built.error !== undefined) throw new Refusal(built.error, built.detail)

  const server = built.config.serverName
  const current = typeof row.config.serverName === 'string' ? row.config.serverName : serverNameOf(row.id)
  if (server !== current) {
    /* The row id is derived from the name, so a rename is a new row plus a removal — an action this
       form does not offer, and one it must not perform as a side effect of a save. */
    throw new Refusal('bad-name', `the row "${row.id}" carries the name "${current}" and a save cannot rename it: a rename is a new row plus a removal`)
  }

  if (sameConfig(built.config, row.config)) return { result: 'nothing', entryId: row.entryId, server, confirmed: 'tree' }

  await updateRow(ctx, row.entryId, { config: built.config })
  const back = readAgain(ctx, row.entryId)
  if (!sameConfig(back.config, built.config)) throw new Refusal('not-saved', disagreement(`the server "${server}"`, built.config, back.config))
  return { result: 'updated', entryId: row.entryId, server, confirmed: 'tree' }
}

/**
 * Switch a row of the servers file on or off.
 *
 * The file's own route is the only writer here: the platform's manager writes the profile's patch
 * and does not address a row that lives in an include file.
 * @param {object} ctx the plugin's context
 * @param {object} include the include entry
 * @param {object} row the row as the file holds it
 * @param {boolean} enabled the state the page asks for
 * @returns {Promise<object>} what was done
 * @throws {Refusal} `disabled-ref`, or a refusal of the confirmation
 */
async function setEnabled(ctx, include, row, enabled) {
  shapeable(row)
  if (row.disabledRef === true) {
    throw new Refusal('disabled-ref', `the row "${row.id}" carries its enablement as an expression, and the toggle does not write over it`)
  }
  if ((row.disabled !== true) === enabled) return { result: 'nothing', entryId: row.entryId, server: serverNameOf(row.id), confirmed: 'tree' }

  await updateRow(ctx, row.entryId, { disabled: enabled ? undefined : true })
  const back = readAgain(ctx, row.entryId)
  if (back.disabledRef === true || back.disabled !== !enabled) {
    throw new Refusal('not-saved', disagreement(`the row "${row.id}"`, { disabled: !enabled }, { disabled: back.disabled }))
  }
  return { result: enabled ? 'enabled' : 'disabled', entryId: row.entryId, server: serverNameOf(row.id), confirmed: 'tree' }
}

/**
 * Remove a row from the servers file, and confirm that it is gone.
 *
 * The removal is asked of the row's own parent group, and then the same tree is asked
 * again for the row: the platform's own spelling of this call is silent when it misses, and this is
 * the one save where that silence would read as success.
 * @param {object} include the include entry
 * @param {object} row the row as the file holds it
 * @returns {object} what was done
 * @throws {Refusal} `not-an-mcp-row`, `no-row` or `not-saved`
 */
function removeServer(include, row) {
  /* A removal shapes no config, so a row holding an expression in a drawn field is still a row this
     door can take away: the shape rule belongs to the saves that write the config, and applying it here
     would leave a row the page offers to remove with no press that could ever take it. */
  if (row.module !== MCP_MODULE) {
    throw new Refusal('not-an-mcp-row', `the row "${row.id}" is a "${row.module}" row, and this form shapes MCP client rows only`)
  }
  if (row.live === null) throw new Refusal('no-row', `the servers file holds no tree row for "${row.entryId}"`)
  removeRow(row.live)
  const still = entryOf(include, row.id)
  if (still !== null) {
    throw new Refusal('not-saved', `the removal of "${row.id}" did not stand: the Loader reported no error and the servers file still holds the row. A removal is asked of the row's own group by the id that group knows — a row addressed by its path from the root is resolved, missed and left in the file in silence.`)
  }
  return { result: 'removed', entryId: row.entryId, server: serverNameOf(row.id), confirmed: 'tree' }
}

/**
 * Write the reference a row's token is read through: the header carrying the expression, and the row
 * option the expression needs beside it.
 *
 * The flow owns the reference, and this save asks it: the credential key and the expression are the
 * flow's answer for the row's server, and the body's own text is only a claim to hold against it. A body
 * that names another key or another expression writes nothing — a reference is not a parameter a page
 * may compose, and a row whose expression differs from the one the flow reads writes a value the flow
 * never reads. A row that already carries a hand-written expression under the reference header is
 * refused as well: the file owns that text, and this form does not write over it.
 *
 * The option is written before the header, in a write of its own: the Loader evaluates a row's
 * configuration as the write lands, so a header expression that reads the credential service is refused
 * while the option that puts that service in the row's own context is not there yet — measured at this
 * door, where one write carrying both answered `cannot get property "credentials" without inject`. An
 * option the file holds as an expression is refused rather than replaced.
 *
 * What is confirmed is what the tree holds: the expression under the header, and the option beside it.
 * @param {object} ctx the plugin's context
 * @param {object} include the include entry
 * @param {object} row the row as the file holds it
 * @param {object} body the request's body: the credential key and the expression the page drew
 * @returns {Promise<object>} what was done
 * @throws {Refusal} `not-an-mcp-row`, `bad-value`, `config-ref`, or a refusal of the confirmation
 */
async function setReference(ctx, include, row, body) {
  if (row.module !== MCP_MODULE) {
    throw new Refusal('not-an-mcp-row', `the row "${row.id}" is a "${row.module}" row, and this form shapes MCP client rows only`)
  }
  const flow = flowFor(ctx)
  if (flow === null) {
    throw new Refusal('bad-value', 'this composition carries no OAuth flow, so no reference can be saved: a reference is the flow\'s answer for one server, and this save does not compose one')
  }
  const server = typeof row.config.serverName === 'string' && row.config.serverName !== '' ? row.config.serverName : serverNameOf(row.id)
  const expected = flow.reference(server)
  if (expected === null || typeof expected?.key !== 'string' || typeof expected?.expression !== 'string') {
    throw new Refusal('bad-value', `the OAuth flow answers no reference for "${server}", so a save has nothing to write`)
  }

  const reference = typeof body?.reference === 'string' ? body.reference.trim() : ''
  const claimed = typeof body?.expression === 'string' ? body.expression.trim() : ''
  if (reference === '') {
    throw new Refusal('bad-value', `a reference save names the credential key it stands for "${server}" under, and this request carries none`)
  }
  if (reference !== expected.key) {
    throw new Refusal('bad-value', `the request names the credential key "${reference}", and the flow's record for "${server}" stands under "${expected.key}": a reference names the flow's own record, not one a page composed`)
  }
  if (claimed !== '' && claimed !== expected.expression) {
    throw new Refusal('bad-value', `the request's expression is not the one the flow reads the record for "${server}" through: a reference carries the flow's expression, and this save writes nothing over the flow's own answer`)
  }
  const held = referenceOf(row.config)
  if (held !== null && held !== expected.expression) {
    throw new Refusal('config-ref', `the row "${row.id}" carries a hand-written authorization expression, and the form does not write over a value the file owns`)
  }

  const headers = { ...(typeof row.config.headers === 'object' && row.config.headers !== null ? row.config.headers : {}), [REFERENCE_HEADER]: { __jsExpr: expected.expression } }
  const next = { ...row.config, headers }
  const current = readAgain(ctx, row.entryId)
  if (current.injectRef === true) {
    throw new Refusal('config-ref', `the row "${row.id}" carries its inject as an expression, and the save does not write over the option a reference needs beside it`)
  }

  if (!current.inject.includes('credentials')) {
    await updateRow(ctx, row.entryId, { inject: [...new Set([...current.inject, ...REFERENCE_OPTION])] })
  }
  await updateRow(ctx, row.entryId, { config: next })

  const back = readAgain(ctx, row.entryId)
  if (back.injectRef === true || !back.inject.includes('credentials')) {
    throw new Refusal('not-saved', `the save of the reference for "${row.id}" did not stand: the row now reads the store without the row option that puts the credential service in its own context, so the platform would refuse it at its next activation. A row option is set by a save that names it — creation sets a row's options whole, and an update sets the keys it is given.`)
  }
  if (referenceOf(back.config) !== expected.expression) {
    throw new Refusal('not-saved', disagreement(`the reference of "${row.id}"`, { [REFERENCE_HEADER]: expected.expression }, referenceOf(back.config)))
  }
  return { result: held === null ? 'reference' : 'reference-updated', entryId: row.entryId, server, reference: expected.key, confirmed: 'tree' }
}

/** The phases a row passes through while the Loader is still bringing it up. */
const SETTLING = ['pending', 'loading']

/**
 * The row's own phase as the Loader reports it, waited for while the row is still coming up.
 *
 * The off of a reload lands at once and the on is applied beside it, so a read taken straight after meets
 * the row in `loading`, and a row the Loader has not named at all answers nothing yet. The wait is bounded,
 * and past the bound the phase is named as it came: a door that waits for ever is a door that hangs.
 * @param {object} ctx the plugin's context
 * @param {string} entryId the row's address
 * @returns {Promise<string | null>} the phase, or null when the inventory names no row for it
 */
async function phaseOf(ctx, entryId) {
  const started = Date.now()
  for (;;) {
    const inventory = await ctx.pluginManager.listPlugins()
    const found = inventory.find((one) => String(one?.entryId ?? '') === entryId)
    const phase = found?.fiberPhase ?? null
    if ((phase !== null && !SETTLING.includes(phase)) || Date.now() - started >= 4000) return phase
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

/**
 * What a reload's confirmation makes of the two facts it can read: the tree's switch and the Loader's own
 * phase for the row.
 *
 * A row that comes back **failed** was activated and threw — the client whose own config could not resolve
 * carries no tools and writes no line of its own, and `reloaded` over it would be a claim the door cannot
 * stand behind. A row the Loader does not name at all is refused the same way: nothing confirms it came up.
 * The phase a row is still coming up in is named as it came rather than guessed: the door says what it saw.
 * @param {object} facts the row's id, the tree's switch and the phase the Loader reports
 * @returns {{refusal?: string, phase: string | null}} the refusal, or the phase the answer names
 */
export function reloadVerdict({ id, disabled, phase }) {
  if (disabled) {
    return { refusal: `the reload of "${id}" left the row switched off: the tree now holds it disabled, and the next read of this profile will not connect it` }
  }
  if (phase === 'failed') {
    return { refusal: `the reload of "${id}" left the row in the failed phase: the Loader activated it and its fiber threw, so it serves nothing — no tools and no line of its own — whatever the file now says` }
  }
  if (phase === null) {
    return { refusal: `the reload of "${id}" left the Loader unable to name the row: no entry of it stands in the inventory, so nothing confirms the row came up` }
  }
  return { phase }
}

/**
 * Reload a row without changing it, so a token that was rotated in the store reaches its connection.
 *
 * A rotated token is not a configuration change, so nothing in the file moves — and the row's own
 * transport holds the headers it was built with, so nothing reaches its connection either. The reload is
 * therefore the mechanism and not a convenience, and the door is measured rather than assumed: the
 * Loader's own update, asked with no key of its own, restarts the entry and leaves the row's header
 * standing as it activated, while a fresh activation reads the store again. So the row is switched off
 * and switched on — two updates, and the include's own file write coalesces them, so the file need not
 * carry the intermediate switch; neither update touches anything else the row holds.
 *
 * A row the file already holds switched off is refused before any write: switching it on to reload it
 * would leave a row the person never asked to connect connected. The refusal says which. A row whose
 * switch stands as an expression is refused the same way — the file owns that text, and a reload that
 * wrote over it would decide a switch the person wrote.
 *
 * The two updates are two acts, and the second one can fail on its own: the row is then switched back on
 * before the answer, because a refusal that left the row off would be a reload that disconnected it. When
 * even that write fails, the refusal names what happened and that the row may stand switched off until it
 * is switched on by hand — the door does not claim a restore it could not make.
 *
 * The confirmation reads two facts, not one: the tree's switch and the Loader's phase for the row. A row
 * that came back failed answers a refusal that names the phase, because `reloaded` over a row that serves
 * nothing is a claim the door cannot stand behind.
 * @param {object} ctx the plugin's context
 * @param {object} include the include entry
 * @param {object} row the row as the file holds it
 * @returns {Promise<object>} what was done, with the row's phase
 * @throws {Refusal} `not-an-mcp-row`, `not-saved` when the switch pair or the confirmation failed, or
 *   `disabled-ref` when the row's switch is an expression
 */
async function reloadRow(ctx, include, row) {
  if (row.module !== MCP_MODULE) {
    throw new Refusal('not-an-mcp-row', `the row "${row.id}" is a "${row.module}" row, and this form shapes MCP client rows only`)
  }
  if (row.disabledRef === true) {
    throw new Refusal('disabled-ref', `the row "${row.id}" carries its enablement as an expression, and a reload does not write over it: switch the row by its own text, then reload it`)
  }
  if (row.disabled === true) {
    throw new Refusal('not-saved', `the reload of "${row.id}" was asked for a row the file holds switched off: a reload switches a row on and off again, and that would leave a row the person never asked to connect connected. Switch it on first if it should serve.`)
  }
  try {
    await updateRow(ctx, row.entryId, { disabled: true })
  } catch (error) {
    throw new Refusal('not-saved', `the reload of "${row.id}" did not start its own switch: ${reasonOf(error)}`)
  }
  try {
    await updateRow(ctx, row.entryId, { disabled: null })
  } catch (error) {
    let restoreFailure = null
    try {
      await updateRow(ctx, row.entryId, { disabled: null })
    } catch (beside) {
      restoreFailure = beside
      ctx.logger?.warn?.(`coreness-mcp: the row "${row.entryId}" may stand switched off — the switch back failed: ${reasonOf(beside)}`)
    }
    throw new Refusal('not-saved', restoreFailure === null
      ? `the reload of "${row.id}" did not finish its own switch: ${reasonOf(error)} — the row was switched back on before this answer`
      : `the reload of "${row.id}" did not finish its own switch: ${reasonOf(error)}, and switching it back on failed too (${reasonOf(restoreFailure)}) — the row may stand switched off until it is switched on by hand`)
  }

  const back = readAgain(ctx, row.entryId)
  const phase = await phaseOf(ctx, row.entryId)
  const verdict = reloadVerdict({ id: row.id, disabled: back.disabled === true, phase })
  if (verdict.refusal !== undefined) throw new Refusal('not-saved', verdict.refusal)
  ctx.logger?.info?.(`coreness-mcp: the row "${row.entryId}" was activated afresh, so a token that changed in the store reaches its connection again`)
  return { result: 'reloaded', entryId: row.entryId, server: serverNameOf(row.id), phase: verdict.phase, confirmed: 'tree' }
}

/**
 * One save: the action the page asked for, written through the Loader and confirmed by a read.
 * @param {object} ctx the plugin's context
 * @param {object} include the include entry
 * @param {object} body the page's request body
 * @returns {Promise<object>} what was done
 * @throws {Refusal} any refusal of the save
 */
export async function write(ctx, include, body) {
  const action = String(body?.action ?? '')
  if (!ACTIONS.includes(action)) {
    throw new Refusal('bad-action', `the request asks for "${action === '' ? 'no action' : action}", and this route takes ${ACTIONS.join(', ')}`)
  }
  if (action === 'add') return addServer(ctx, include, body.form)
  const row = ownRow(include, body.entryId)
  if (action === 'edit') return editServer(ctx, include, row, body.form)
  if (action === 'toggle') return setEnabled(ctx, include, row, body.enabled === true)
  if (action === 'reference') return setReference(ctx, include, row, body)
  if (action === 'reload') return reloadRow(ctx, include, row)
  return removeServer(include, row)
}
