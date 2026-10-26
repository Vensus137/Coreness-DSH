/**
 * The recipe front matter the builder reads: one `recipes/<name>.md` per recipe and per
 * variant, YAML front matter that selects and orders sections, then prose the model reads.
 *
 * The library carries the same selection as plain data (`RECIPES`), because the validator and the
 * fixtures must read it without touching the disk. A recipe file that disagrees with the library
 * is a package fault — thrown, never a user refusal — so the two copies cannot drift silently.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LIBRARY, RECIPES, SECTIONS, LAYOUTS } from '../lib/library.mjs'

const RECIPES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'recipes')

const SCALARS = new Set(['id', 'kind', 'variant'])
const LISTS = new Set(['allowed', 'required', 'order', 'stack'])
const REQUIRED_KEYS = ['id', 'kind', 'allowed', 'required', 'order', 'stack']
/** A recipe id is the library's recipe key for its base form: landing, portfolio, article, deck. */
const RECIPE_IDS = new Set(['landing', 'portfolio', 'article', 'deck'])
const KINDS = new Set(['landing', 'portfolio', 'article', 'presentation'])

/** A flow sequence `[a, b, c]` or a scalar; a `#` outside a value starts a comment. */
function parseValue(raw) {
  const value = raw.trim()
  if (value.startsWith('[')) {
    if (!value.endsWith(']')) throw new Error(`unterminated sequence: ${value}`)
    const body = value.slice(1, -1)
    return body.split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0)
  }
  const hash = value.indexOf(' #')
  return hash < 0 ? value : value.slice(0, hash).trim()
}

/** Parse one recipe file into its front matter and prose. */
function parseRecipeFile(name, text) {
  const source = text.replace(/\r\n/g, '\n')
  if (!source.startsWith('---\n')) throw new Error(`${name}: the file does not open with YAML front matter`)
  const end = source.indexOf('\n---\n', 4)
  if (end < 0) throw new Error(`${name}: the front matter is not closed with ---`)
  const frontMatter = {}
  for (const [index, line] of source.slice(4, end).split('\n').entries()) {
    const body = line.trim()
    if (body === '' || body.startsWith('#')) continue
    const match = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(body)
    if (!match) throw new Error(`${name}: line ${index + 2} is not a front-matter key`)
    const [, key, rest] = match
    if (!SCALARS.has(key) && !LISTS.has(key)) throw new Error(`${name}: unknown front-matter key '${key}'`)
    if (key in frontMatter) throw new Error(`${name}: front-matter key '${key}' is written twice`)
    const value = parseValue(rest)
    if (LISTS.has(key) !== Array.isArray(value)) {
      throw new Error(`${name}: front-matter key '${key}' must be ${LISTS.has(key) ? 'a flow sequence [a, b]' : 'a scalar'}, found ${JSON.stringify(value)}`)
    }
    frontMatter[key] = value
  }
  const prose = source.slice(end + 5).trim()
  return { frontMatter, prose }
}

/** A list of ids all belonging to `known`. */
function knownList(name, key, value, known) {
  for (const id of value) if (!known.has(id)) throw new Error(`${name}: ${key} names '${id}', which the library does not carry`)
}

/** The stack must be a subsequence of the order list: the documented default keeps the order. */
function assertStack(name, recipe) {
  let cursor = 0
  for (const id of recipe.stack) {
    const at = recipe.order.indexOf(id, cursor)
    if (at < 0) throw new Error(`${name}: stack breaks the order list at '${id}'`)
    cursor = at + 1
  }
}

/** Validate one recipe against the library entry of the same key; a mismatch is a package fault. */
function assertAgainstLibrary(name, key, frontMatter) {
  const expected = RECIPES[key]
  if (expected === undefined) throw new Error(`${name}: no library recipe '${key}'`)
  for (const keyName of REQUIRED_KEYS) if (!(keyName in frontMatter)) throw new Error(`${name}: front matter is missing '${keyName}'`)
  const expectedKeys = Object.keys(expected).filter((field) => field !== 'min' && field !== 'max')
  for (const field of expectedKeys) {
    const actual = frontMatter[field]
    const library = expected[field]
    const same = Array.isArray(library) ? Array.isArray(actual) && actual.length === library.length && actual.every((entry, i) => entry === library[i]) : actual === library
    if (!same) throw new Error(`${name}: '${field}' disagrees with the library recipe '${key}'`)
  }
  for (const field of Object.keys(frontMatter)) if (!expectedKeys.includes(field)) throw new Error(`${name}: '${field}' is not a library recipe key`)
}

let cached = null

/**
 * Read and validate every recipe file once per process.
 * @returns {Record<string, { frontMatter: object, prose: string }>} by file key
 */
export function loadRecipes() {
  if (cached !== null) return cached
  const files = readdirSync(RECIPES_DIR).filter((entry) => entry.endsWith('.md')).sort()
  if (files.length === 0) throw new Error(`no recipe files in ${RECIPES_DIR}`)
  const recipes = {}
  for (const file of files) {
    const name = `recipes/${file}`
    const key = file.slice(0, -'.md'.length)
    const { frontMatter, prose } = parseRecipeFile(name, readFileSync(join(RECIPES_DIR, file), 'utf8'))
    if (prose === '') throw new Error(`${name}: the prose the model reads is empty`)
    const expectedKey = frontMatter.variant === undefined ? String(frontMatter.id) : `${frontMatter.id}-${frontMatter.variant}`
    if (key !== expectedKey) throw new Error(`${name}: the file name must be '${expectedKey}.md'`)
    if (!RECIPE_IDS.has(frontMatter.id)) throw new Error(`${name}: unknown recipe id '${frontMatter.id}'`)
    if (!KINDS.has(frontMatter.kind)) throw new Error(`${name}: unknown kind '${frontMatter.kind}'`)
    const known = frontMatter.kind === 'presentation' ? new Set(Object.keys(LAYOUTS)) : new Set(Object.keys(SECTIONS))
    for (const key of ['allowed', 'required', 'order', 'stack']) knownList(name, key, frontMatter[key], known)
    for (const id of frontMatter.required) if (!frontMatter.allowed.includes(id)) throw new Error(`${name}: required '${id}' is not allowed`)
    for (const id of frontMatter.order) if (!frontMatter.allowed.includes(id)) throw new Error(`${name}: order names '${id}', which is not allowed`)
    assertStack(name, frontMatter)
    assertAgainstLibrary(name, key, frontMatter)
    recipes[key] = { frontMatter: { ...RECIPES[key] }, prose }
  }
  const missing = Object.keys(RECIPES).filter((key) => recipes[key] === undefined)
  if (missing.length > 0) throw new Error(`no recipe file for: ${missing.join(', ')}`)
  cached = recipes
  return cached
}

/**
 * The recipe a build answers: `kind` selects it, a landing's `variant: "event"` selects its variant.
 * The caller passes a validated kind and variant, so this only names the entry.
 * @param {string} kind one of the four studio_build kinds
 * @param {string} [variant] the landing's validated variant
 * @returns {object} the library recipe entry
 */
export function recipeFor(kind, variant) {
  const base = LIBRARY.kinds[kind].recipe
  const key = variant === undefined ? base : `${base}-${variant}`
  const recipe = RECIPES[key]
  if (recipe === undefined) throw new Error(`no recipe '${key}' for kind '${kind}'`)
  return recipe
}
