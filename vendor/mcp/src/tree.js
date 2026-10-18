/**
 * The servers file as the Loader holds it: the include row that mounts it, the rows inside it, and
 * the three writes that change it.
 *
 * Nothing here reads or writes YAML: the file belongs to the Loader's `cordis:include`, which owns
 * its content and rewrites it whenever an entry is created, updated or removed. What this module
 * adds is addressing — and addressing is the one place where the platform is unsafe.
 *
 * `EntryTree.update(id, …)` resolves a root-qualified id through the tree path and works. Removing
 * cannot: `EntryTree.remove(id)` resolves the row and then hands **the same qualified id** to the
 * group that holds it, whose lookup is keyed by the row's own id — the lookup misses, the group
 * returns in silence, and the file is written with the row still in it. So a removal is asked of
 * the row's own parent, by the id that group knows (`removeRow` below), and every write is confirmed
 * by reading the tree back, because a silence is exactly what this defect produces.
 *
 * @module @coreness/mcp/src/tree
 */

import { MCP_MODULE, isRef } from './row.js'

/**
 * The include row that mounts the servers file, when this composition declares one.
 *
 * A missing row is not an error of this plugin: a profile without the servers file is a state the
 * picture names, and the section says so instead of failing. A row that is declared and cannot be
 * resolved is a different state, and it carries the Loader's own words: collapsing the two into one
 * "no file" would hide a wrongly spelled address behind an empty picture.
 * @param {object} ctx the plugin's context
 * @param {string} includeId the address of the include row
 * @returns {{ entry: object | null, unable: string | null }} the entry, or why it cannot be read
 */
export function includeOf(ctx, includeId) {
  try {
    return { entry: ctx.loader.resolve(includeId), unable: null }
  } catch (error) {
    return { entry: null, unable: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * The file an include row mounts, as its own config spells it.
 * @param {object} entry the include entry
 * @returns {string | null} the path
 */
export function fileOf(entry) {
  const path = entry?.options?.config?.path
  return typeof path === 'string' ? path : null
}

/**
 * The rows of the servers file, as the tree holds them.
 *
 * Every row of the file is a row of the include's own subtree; a nested include inside that file
 * would be walked too, and such a row's address is the path the tree itself reports, never one this
 * module builds. The config is read off the entry the Loader holds — the same object it writes from
 * — so a read cannot disagree with what a write will produce.
 * @param {object} entry the include entry
 * @returns {object[]} the rows
 */
export function rowsOf(entry) {
  const rows = []
  for (const row of entry.subtree?.entries() ?? []) {
    rows.push({
      entryId: String(row.id),
      id: String(row.options?.id ?? ''),
      module: String(row.options?.name ?? ''),
      config: row.options?.config ?? {},
      disabled: row.disabled === true,
      /* The raw enablement as the file spells it: an expression is a decision the form does not own,
         and the toggle must refuse to overwrite it rather than read it as a plain value. */
      disabledRef: isRef(row.options?.disabled),
    })
  }
  return rows
}

/**
 * One row of the file by the id it carries inside its own tree.
 * @param {object} entry the include entry
 * @param {string} id the row's id in the file
 * @returns {object | null} the row of the tree, or null
 */
export function entryOf(entry, id) {
  for (const row of entry.subtree?.entries() ?? []) {
    if (String(row.options?.id ?? '') === String(id)) return row
  }
  return null
}

/**
 * Create a row in the servers file.
 * @param {object} ctx the plugin's context
 * @param {string} includeId the id of the include row
 * @param {{ id: string, config: object }} options the row's id and config
 * @returns {Promise<string>} the address the Loader gave the created row
 */
export function createRow(ctx, includeId, { id, config }) {
  return ctx.loader.create({ id, name: MCP_MODULE, config }, includeId)
}

/**
 * Change a row of the servers file: its config, its enablement, or both.
 *
 * The address is the row's own — the path the tree reports — because that is what the Loader
 * resolves; a row addressed by hand-built path would work only while the file stays flat.
 * @param {object} ctx the plugin's context
 * @param {string} entryId the row's address
 * @param {object} options what to change: `config`, `disabled`
 * @returns {Promise<void>} when the Loader has taken the change
 */
export function updateRow(ctx, entryId, options) {
  return ctx.loader.update(entryId, options)
}

/**
 * Remove a row from the servers file.
 *
 * The removal is asked of the row's own parent group by the id that group knows, then the tree the
 * group belongs to writes its file — the same two steps `EntryTree.remove` takes, with the id it
 * cannot look up replaced by the one it can.
 * @param {object} entry the row as the tree holds it
 * @returns {void}
 */
export function removeRow(entry) {
  const group = entry.parent
  group.remove(entry.options.id)
  group.tree.write()
}
