/**
 * The product's own place under the harness home, and the one resolution of that home.
 *
 * The home is the platform's, not this tree's: `resolveDshHome` applies the platform's precedence (an
 * explicit path, then `$DSH_HOME`, else `~/.dsh`), ignores a blank `$DSH_HOME`, expands a bare `~` and
 * answers an absolute path. The product takes that answer once and derives every path of its own from it —
 * `coreness/qoder/` — so the layout has one owner, and no second reading of the environment can drift from
 * it.
 *
 * The layout is this file's whole subject: a caller that joins `$DSH_HOME` with a folder of its own is a
 * second owner of knowledge of place.
 *
 * @module @coreness/qoder/src/home
 */

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'

/** The product's folder in the harness home; everything this product writes lies under it. */
export const PRODUCT_DIR = 'coreness'

/**
 * The harness home, by the platform's own rule. The product has no configured home of its own: the
 * profile's environment is the only input, and the platform's helper is what reads it.
 * @param {object} [env] the environment mapping to read (`process.env` by default)
 * @returns {string} the absolute harness home
 */
export function homeOf(env = process.env) {
  return resolveDshHome(undefined, env)
}

/**
 * The product's folder under one home.
 * @param {string} home the harness home
 * @returns {string} the folder
 */
export function productHome(home) {
  return join(home, PRODUCT_DIR)
}

/**
 * The Qoder feature's folder under one home.
 * @param {string} home the harness home
 * @returns {string} the folder
 */
export function qoderHome(home) {
  return join(productHome(home), 'qoder')
}

/**
 * The folder the machine id is kept in.
 * @param {string} home the harness home
 * @returns {string} the folder
 */
export function machineIdDir(home) {
  return qoderHome(home)
}

/**
 * The effort-menu cache's path: the vendor's levels, kept beside the machine id.
 * @param {string} home the harness home
 * @returns {string} the cache's path
 */
export function menusPath(home) {
  return join(qoderHome(home), 'model-menus.json')
}

/**
 * Creates the product's folder.
 *
 * Both writers already create their own parent (the machine id's store and the menus), so this is not what
 * keeps a write alive. It is what makes the product's place exist at the mount rather than at the first
 * vendor call, and what turns an unwritable home into a failure with a name at the mount instead of a later
 * one inside a signed request.
 * @param {string} home the harness home
 * @returns {void}
 */
export function ensureLayout(home) {
  mkdirSync(qoderHome(home), { recursive: true, mode: 0o700 })
}
