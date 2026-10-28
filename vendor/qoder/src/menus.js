/**
 * The vendor's effort menus, kept between launches.
 *
 * The platform's model picker draws the efforts a route declares, and the declaration must answer without
 * the network: the levels a catalogue last published are held here, one file for the home, keyed by model
 * id. Nothing here decides anything — a menu widens what a picker offers — and a file that cannot be read
 * is said in the log and treated as empty rather than taking the route with it.
 *
 * @module @coreness/qoder/src/menus
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** The file's own shape: a file written by another version is said and read as empty, never guessed at. */
export const MENUS_VERSION = 1

/**
 * Reads the cache: a map of model id to the levels the catalogue last published for it.
 *
 * A file that is absent is not a fault — the first launch has none. A file that does not parse, or whose
 * version this build does not know, is said in the log and read as empty: a shape that changed is not
 * guessed at. An entry that is not a list of words is dropped without a line — a level is a word, and a
 * word is not invented.
 * @param {string} path the cache's path
 * @param {(message: string) => void} [warn] where an unreadable file is said
 * @returns {Map<string, string[]>} the menus
 */
export function readMenus(path, warn = () => {}) {
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      warn(`the effort menus were not read (${error?.message ?? String(error)}); the vendor's levels stand empty`)
    }
    return new Map()
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    warn(`the effort menus do not parse (${error?.message ?? String(error)}); the vendor's levels stand empty`)
    return new Map()
  }
  if (parsed?.version !== MENUS_VERSION) {
    warn(`the effort menus carry version ${JSON.stringify(parsed?.version)} and this build writes ${MENUS_VERSION}; the vendor's levels stand empty`)
    return new Map()
  }
  const source = parsed !== null && typeof parsed === 'object' && parsed.menus !== null && typeof parsed.menus === 'object' ? parsed.menus : {}
  const menus = new Map()
  for (const [id, menu] of Object.entries(source)) {
    if (!Array.isArray(menu)) continue
    const levels = menu.filter((level) => typeof level === 'string' && level !== '')
    if (levels.length > 0) menus.set(id, levels)
  }
  return menus
}

/**
 * Merges one listing into the menus held.
 *
 * A listing only ever **adds**: every level it publishes joins the menu held for its id, and no level ever
 * leaves. The declaration is the platform's gate, so a level a session may already have chosen cannot
 * vanish from it when the vendor's listing moves; a level the vendor stops publishing stays offered (the
 * vendor's answer decides whether it works) until the cache is cleared. An entry that publishes no levels
 * changes nothing, and an id the listing does not name keeps its menu: a node that answers for fewer
 * models must not empty the ones it did not mention.
 * @param {Map<string, string[]>} menus the menus to update
 * @param {readonly object[]} models the listing, each with `id` and `efforts`
 * @returns {boolean} whether anything changed
 */
export function mergeMenus(menus, models) {
  let changed = false
  for (const entry of models) {
    if (entry === null || typeof entry !== 'object' || typeof entry.id !== 'string') continue
    if (!Array.isArray(entry.efforts)) continue
    const published = entry.efforts.filter((level) => typeof level === 'string' && level !== '')
    if (published.length === 0) continue
    const held = menus.get(entry.id) ?? []
    const merged = [...held]
    for (const level of published) {
      if (!merged.includes(level)) merged.push(level)
    }
    if (merged.length === held.length) continue
    menus.set(entry.id, merged)
    changed = true
  }
  return changed
}

/**
 * Writes the cache: the whole map, in the folder it lives in.
 * @param {string} path the cache's path
 * @param {Map<string, string[]>} menus the menus to keep
 * @param {(message: string) => void} [warn] where a failed write is said
 * @returns {boolean} whether the file was written
 */
export function writeMenus(path, menus, warn = () => {}) {
  try {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, `${JSON.stringify({ version: MENUS_VERSION, menus: Object.fromEntries(menus) }, null, 2)}\n`, 'utf8')
    return true
  } catch (error) {
    warn(`the effort menus were not saved (${error?.message ?? String(error)})`)
    return false
  }
}
