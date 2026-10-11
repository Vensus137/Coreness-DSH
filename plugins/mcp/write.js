/**
 * The write path of the servers file: the four saves the form asks for, each one confirmed by
 * reading the tree back.
 *
 * The file has one writer — the Loader's `cordis:include` — so a save is a call to the Loader and
 * never a YAML edit: `create` for a new row, `update` for a change or a switch, and a removal asked
 * of the row's own parent group by the id that group knows.
 *
 * The confirmation is the point of this module. `EntryTree.remove` resolves a root-qualified id and
 * then hands that same qualified id to the group that holds the row, whose lookup is keyed by the
 * row's short id: the lookup misses, the group returns in silence, the file is written with the row
 * still in it, and the caller is told nothing. A save that trusted that silence would answer
 * "removed" and the row would be back at the next read. So every write here ends by reading the tree
 * and comparing it with what was written, and a disagreement is a refusal in words — never a
 * success.
 *
 * @module @coreness/dsh/plugins/mcp/write
 */

import { MCP_MODULE, buildConfig, isRef, refsOf, rowId, sameConfig, serverNameOf } from './row.js'
import { createRow, entryOf, removeRow, rowsOf, updateRow } from './tree.js'

/**
 * The words a refusal answers with. The page carries its own dictionary by code — the same
 * vocabulary, held together by a check — and this one is the host's account of the same code: a
 * client that does not know a code still reads something true.
 */
const WORDS = {
  'bad-action': 'the page asked for a save this route does not take',
  'bad-name': 'a server name is 1 to 32 characters of letters, digits, underscore or hyphen',
  'name-taken': 'another row of this file already takes that name',
  'bad-transport': 'a row is either streamable-http or stdio, and the two branches do not mix',
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
export const ACTIONS = ['add', 'edit', 'remove', 'toggle']

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
  const built = buildConfig(form, {})
  if (built.error !== undefined) throw new Refusal(built.error, built.detail)
  const server = built.config.serverName
  if (namesIn(include).has(server)) throw new Refusal('name-taken', `the file already declares a server named "${server}"`)

  const id = rowId(server)
  const address = String(await createRow(ctx, String(include.id), { id, config: built.config }))
  const back = readAgain(ctx, address)
  if (!sameConfig(back.config, built.config)) throw new Refusal('not-saved', disagreement(`the server "${server}"`, built.config, back.config))
  return { result: 'created', entryId: address, server }
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
  const built = buildConfig(form, row.config)
  if (built.error !== undefined) throw new Refusal(built.error, built.detail)

  const server = built.config.serverName
  const current = typeof row.config.serverName === 'string' ? row.config.serverName : serverNameOf(row.id)
  if (server !== current) {
    /* The row id is derived from the name, so a rename is a new row plus a removal — an action this
       form does not offer, and one it must not perform as a side effect of a save. */
    throw new Refusal('bad-name', `the row "${row.id}" carries the name "${current}" and a save cannot rename it: a rename is a new row plus a removal`)
  }

  if (sameConfig(built.config, row.config)) return { result: 'nothing', entryId: row.entryId, server }

  await updateRow(ctx, row.entryId, { config: built.config })
  const back = readAgain(ctx, row.entryId)
  if (!sameConfig(back.config, built.config)) throw new Refusal('not-saved', disagreement(`the server "${server}"`, built.config, back.config))
  return { result: 'updated', entryId: row.entryId, server }
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
  if ((row.disabled !== true) === enabled) return { result: 'nothing', entryId: row.entryId, server: serverNameOf(row.id) }

  await updateRow(ctx, row.entryId, { disabled: enabled ? undefined : true })
  const back = readAgain(ctx, row.entryId)
  if (back.disabledRef === true || back.disabled !== !enabled) {
    throw new Refusal('not-saved', disagreement(`the row "${row.id}"`, { disabled: !enabled }, { disabled: back.disabled }))
  }
  return { result: enabled ? 'enabled' : 'disabled', entryId: row.entryId, server: serverNameOf(row.id) }
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
  shapeable(row)
  if (row.live === null) throw new Refusal('no-row', `the servers file holds no tree row for "${row.entryId}"`)
  removeRow(row.live)
  const still = entryOf(include, row.id)
  if (still !== null) {
    throw new Refusal('not-saved', `the removal of "${row.id}" did not stand: the Loader reported no error and the servers file still holds the row. A removal is asked of the row's own group by the id that group knows — a row addressed by its path from the root is resolved, missed and left in the file in silence.`)
  }
  return { result: 'removed', entryId: row.entryId, server: serverNameOf(row.id) }
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
  return removeServer(include, row)
}
