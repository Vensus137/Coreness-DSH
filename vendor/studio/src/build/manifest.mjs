/**
 * Manifest normalization and validation, in the fixed step order. Validation is pure: it reads
 * no file, writes nothing and knows no target; the first refusal a caller sees is the most structural
 * one, and every problem of that kind accumulates in manifest order before the pass stops.
 *
 * The field tables come from `src/lib/library.mjs` (one owner); the recipe selection comes from the
 * library's plain-data entries, which `recipes.mjs` proves equal to the package's recipe files.
 */
import {
  SECTIONS,
  LAYOUTS,
  RECIPES,
  KINDS,
  LOOKS,
  DEFAULT_LOOK,
  DEFAULT_LANG,
  LANG_PATTERN,
} from '../lib/library.mjs'
import { recipeFor } from './recipes.mjs'

const PAGE = 'page'
const DECK = 'deck'
/* The document roots: the one owner of the keys a manifest may carry at its top level, exported so the
   fixture that reads the skill's text follows a key added here instead of keeping a copy of the list. */
export const PAGE_ROOT_KEYS = ['title', 'description', 'lang', 'variant', 'sections']
export const DECK_ROOT_KEYS = ['title', 'description', 'lang', 'slides']
const CONTROL = /[\u0000-\u001f\u007f]/
const INTERNAL_ID = /^#s-[a-z]+(?:-\d+)?$/
const EXTERNAL_HTTP = /^https?:\/\/[^\s]+$/
const MAILTO = /^mailto:[^\s@]+@[^\s@]+$/

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
/** A character ceiling counts code points, so one visible character is one character. */
const lengthOf = (value) => Array.from(value).length
const listOf = (values) => values.join(', ')

/** A refusal value; every refusal the model can act on is this shape, never a thrown error. */
export function refusal(code, path, detail, extra = {}) {
  const problems = [{ code, path, detail }]
  return { ok: false, code, message: detail, problems, ...extra }
}

/** The step order lives here: the first non-empty bucket is the refusal. */
class Problems {
  constructor() {
    this.byStep = new Map()
  }
  add(step, code, path, detail) {
    const bucket = this.byStep.get(step) ?? []
    bucket.push({ code, path, detail })
    this.byStep.set(step, bucket)
  }
  first() {
    for (let step = 1; step <= 14; step += 1) {
      const bucket = this.byStep.get(step)
      if (bucket !== undefined && bucket.length > 0) return bucket
    }
    return null
  }
}

/** A short reading of a field's expected shape, for the detail line. */
function describe(spec) {
  switch (spec.type) {
    case 'string': {
      const max = spec.role === 'href' ? 0 : spec.max
      return max === undefined || max === 0 ? 'a one-line string' : `a one-line string of 1–${max} characters`
    }
    case 'integer':
      return 'a 0-based index (integer)'
    case 'array':
      return spec.min === undefined ? 'an array' : spec.min === spec.max ? `exactly ${spec.min} items` : `${spec.min}–${spec.max} items`
    case 'tagged':
      return `an object tagged with kind (${listOf(Object.keys(spec.tags))})`
    default:
      return 'an object'
  }
}

/** The tag a tagged value resolves to, or null when the tag is absent or unknown. */
function tagOf(value, spec) {
  if (!isPlainObject(value)) return null
  const tag = value[spec.tag]
  if (typeof tag !== 'string') return null
  return Object.prototype.hasOwnProperty.call(spec.tags, tag) ? tag : null
}

/* ------------------------------------------------------------------ step 1: shape */

/** A fatal shape problem stops the pass before anything is normalized. */
function shapeProblems(manifest, kind) {
  if (!isPlainObject(manifest)) {
    return [{
      code: 'manifest.shape',
      path: 'manifest',
      detail: kind === 'presentation'
        ? 'the manifest must be a JSON object with title and slides'
        : 'the manifest must be a JSON object with title, description and sections',
    }]
  }
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  const problems = []
  if (manifest[arrayName] !== undefined && !Array.isArray(manifest[arrayName])) {
    problems.push({ code: 'manifest.shape', path: arrayName, detail: `the manifest's ${arrayName} must be an array` })
  }
  if (Array.isArray(manifest[arrayName])) {
    manifest[arrayName].forEach((entry, index) => {
      if (!isPlainObject(entry)) {
        problems.push({ code: 'manifest.shape', path: `${arrayName}[${index}]`, detail: 'every entry must be an object' })
      }
    })
  }
  return problems
}

/* ------------------------------------------------------------------ normalization */

/** Trim every string, fill `lang` when absent; nothing else is added or removed. */
function normalizeValue(value) {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(normalizeValue)
  if (isPlainObject(value)) {
    const out = {}
    for (const [key, entry] of Object.entries(value)) out[key] = normalizeValue(entry)
    return out
  }
  return value
}

/** The normalized manifest recorded in `page.json`. */
function normalizeManifest(manifest) {
  const normalized = normalizeValue(manifest)
  if (normalized.lang === undefined) normalized.lang = DEFAULT_LANG
  return normalized
}

/* ------------------------------------------------------------------ step 2: unknown fields */

function collectUnknownValue(value, spec, path, problems) {
  if (value === undefined) return
  if (spec.type === 'array') {
    if (!Array.isArray(value)) return
    value.forEach((entry, index) => collectUnknownValue(entry, spec.of, `${path}[${index}]`, problems))
    return
  }
  if (spec.type === 'tagged') {
    const tag = tagOf(value, spec)
    if (tag === null) return
    const shape = spec.tags[tag]
    const allowed = [spec.tag, ...Object.keys(shape.fields)]
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) problems.add(2, 'manifest.unknownField', `${path}.${key}`, `unknown field; kind "${tag}" takes ${listOf(allowed)}`)
    }
    for (const [key, entry] of Object.entries(shape.fields)) collectUnknownValue(value[key], entry, `${path}.${key}`, problems)
    return
  }
  if (spec.type !== 'object' || !isPlainObject(value)) return
  const allowed = Object.keys(spec.fields)
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) problems.add(2, 'manifest.unknownField', `${path}.${key}`, `unknown field; this object takes ${listOf(allowed)}`)
  }
  for (const [key, entry] of Object.entries(spec.fields)) collectUnknownValue(value[key], entry, `${path}.${key}`, problems)
}

function collectUnknown(manifest, kind, problems) {
  const rootKeys = kind === 'presentation' ? DECK_ROOT_KEYS : PAGE_ROOT_KEYS
  for (const key of Object.keys(manifest)) {
    if (rootKeys.includes(key)) continue
    const detail = key === 'look' || key === 'kind'
      ? 'look/kind is a studio_build argument, not a manifest field'
      : `unknown field; the manifest takes ${listOf(rootKeys)}`
    problems.add(2, 'manifest.unknownField', key, detail)
  }
  const table = kind === 'presentation' ? LAYOUTS : SECTIONS
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  const discriminator = kind === 'presentation' ? 'layout' : 'type'
  const entries = manifest[arrayName]
  if (!Array.isArray(entries)) return
  entries.forEach((entry, index) => {
    if (!isPlainObject(entry)) return
    const id = entry[discriminator]
    const shape = typeof id === 'string' ? table[id] : undefined
    if (shape === undefined) return
    const allowed = [discriminator, ...Object.keys(shape.fields)]
    for (const key of Object.keys(entry)) {
      if (!allowed.includes(key)) problems.add(2, 'manifest.unknownField', `${arrayName}[${index}].${key}`, `unknown field; ${id} takes ${listOf(allowed)}`)
    }
    for (const [key, spec] of Object.entries(shape.fields)) {
      collectUnknownValue(entry[key], spec, `${arrayName}[${index}].${key}`, problems)
    }
  })
}

/* ------------------------------------------------------------------ step 4: fields */

const overLimit = (value, max) => `the field is ${lengthOf(value)} characters; the limit is ${max}`

function collectFieldValue(value, spec, path, problems) {
  if (value === undefined) return
  if (spec.type === 'tagged') {
    if (!isPlainObject(value)) {
      problems.add(4, 'manifest.field', path, `expected ${describe(spec)}`)
      return
    }
    const tag = value[spec.tag]
    if (tag === undefined) {
      problems.add(4, 'manifest.field', `${path}.${spec.tag}`, `required: ${spec.tag} is ${describe({ type: 'string' })} naming ${listOf(Object.keys(spec.tags))}`)
      return
    }
    if (typeof tag !== 'string') {
      problems.add(4, 'manifest.field', `${path}.${spec.tag}`, `expected a string naming ${listOf(Object.keys(spec.tags))}`)
      return
    }
    if (!Object.prototype.hasOwnProperty.call(spec.tags, tag)) {
      problems.add(4, 'manifest.field', `${path}.${spec.tag}`, `kind must be one of ${listOf(Object.keys(spec.tags))}`)
      return
    }
    collectObject(value, spec.tags[tag], path, problems)
    return
  }
  if (spec.type === 'array') {
    if (!Array.isArray(value)) {
      problems.add(4, 'manifest.field', path, `expected ${describe(spec)}`)
      return
    }
    value.forEach((entry, index) => collectFieldValue(entry, spec.of, `${path}[${index}]`, problems))
    return
  }
  if (spec.type === 'object') {
    if (!isPlainObject(value)) {
      problems.add(4, 'manifest.field', path, `expected ${describe(spec)}`)
      return
    }
    collectObject(value, spec, path, problems)
    return
  }
  if (spec.type === 'integer') {
    if (!Number.isInteger(value)) problems.add(4, 'manifest.field', path, `expected ${describe(spec)}`)
    return
  }
  if (typeof value !== 'string') {
    problems.add(4, 'manifest.field', path, `expected ${describe(spec)}`)
    return
  }
  if (spec.max !== undefined && lengthOf(value) > spec.max) {
    problems.add(4, 'manifest.field', path, overLimit(value, spec.max))
    return
  }
  if (spec.role === 'lang' && (!LANG_PATTERN.test(value))) {
    problems.add(4, 'manifest.field', path, `lang must match ${LANG_PATTERN.source} (for example "en" or "en-GB")`)
  }
}

function collectObject(value, spec, path, problems) {
  for (const key of spec.required) {
    if (value[key] === undefined) problems.add(4, 'manifest.field', `${path}.${key}`, `required: ${describe(spec.fields[key])}`)
  }
  for (const [key, entry] of Object.entries(spec.fields)) collectFieldValue(value[key], entry, `${path}.${key}`, problems)
}

/** The field-level rules that need a sibling: indices, sources, labels, numeric columns. */
function collectSectionFields(entry, kind, index, problems) {
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  const path = `${arrayName}[${index}]`
  if (kind === 'presentation') {
    if (entry.layout === 'points' || entry.layout === 'steps') {
      const items = entry.layout === 'points' ? entry.items : entry.steps
      if (Array.isArray(items) && items.every(isPlainObject)) {
        const labelled = items.map((item) => item.label !== undefined)
        if (labelled.some(Boolean) && !labelled.every(Boolean)) {
          const at = labelled.indexOf(false)
          problems.add(4, 'manifest.field', `${path}.${entry.layout === 'points' ? 'items' : 'steps'}[${at}].label`, 'labels must be present on every item or on none')
        }
      }
    }
    return
  }
  if (entry.type === 'cards' && Array.isArray(entry.items)) {
    const lead = entry.lead
    if (Number.isInteger(lead) && (lead < 0 || lead >= entry.items.length)) {
      problems.add(4, 'manifest.field', `${path}.lead`, `the leading card index must be 0–${Math.max(0, entry.items.length - 1)}`)
    }
  }
  if (entry.type === 'stats') {
    const items = Array.isArray(entry.items) ? entry.items : []
    if (Number.isInteger(entry.dominant) && (entry.dominant < 0 || entry.dominant >= items.length)) {
      problems.add(4, 'manifest.field', `${path}.dominant`, `the dominant number index must be 0–${Math.max(0, items.length - 1)}`)
    }
    if (items.length > 0 && (entry.source === undefined || entry.source === '')) {
      items.forEach((item, at) => {
        if (!isPlainObject(item)) return
        if (item.source === undefined || item.source === '') {
          problems.add(4, 'manifest.field', `${path}.items[${at}].source`, 'every stats number needs a source: the item\'s source or the section\'s source')
        }
      })
    }
  }
  if (entry.type === 'table') {
    const columns = Array.isArray(entry.columns) ? entry.columns : []
    if (Array.isArray(entry.numeric)) {
      const seen = new Set()
      entry.numeric.forEach((value, at) => {
        if (!Number.isInteger(value)) return
        if (value < 0 || value >= columns.length) {
          problems.add(4, 'manifest.field', `${path}.numeric[${at}]`, `numeric names column ${value}; the table has ${columns.length} columns`)
        } else if (seen.has(value)) {
          problems.add(4, 'manifest.field', `${path}.numeric[${at}]`, `numeric repeats column ${value}`)
        }
        seen.add(value)
      })
      if (entry.numeric.length > 0 && (entry.source === undefined || entry.source === '')) {
        problems.add(4, 'manifest.field', `${path}.source`, 'a numeric column needs the table\'s source')
      }
    }
  }
}

function collectFields(manifest, kind, problems) {
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  const discriminator = kind === 'presentation' ? 'layout' : 'type'
  const table = kind === 'presentation' ? LAYOUTS : SECTIONS
  // The document root: title, description, lang, variant, and the section/slide array.
  const rootFields = kind === 'presentation'
    ? { title: { type: 'string', max: 80 }, description: { type: 'string', max: 200 }, lang: { type: 'string', role: 'lang' } }
    : { title: { type: 'string', max: 80 }, description: { type: 'string', max: 200 }, lang: { type: 'string', role: 'lang' }, variant: { type: 'string', role: 'variant' } }
  for (const [key, spec] of Object.entries(rootFields)) collectFieldValue(manifest[key], spec, key, problems)
  if (manifest.title === undefined) problems.add(4, 'manifest.field', 'title', 'required: a one-line string of 1–80 characters')
  if (kind !== 'presentation' && manifest.description === undefined) {
    problems.add(4, 'manifest.field', 'description', 'required: a one-line string of 1–200 characters')
  }
  const entries = manifest[arrayName]
  if (entries === undefined) {
    problems.add(4, 'manifest.field', arrayName, `required: the ${arrayName} array`)
    return
  }
  if (!Array.isArray(entries)) return
  entries.forEach((entry, index) => {
    if (!isPlainObject(entry)) return
    const id = entry[discriminator]
    if (id === undefined) {
      problems.add(4, 'manifest.field', `${arrayName}[${index}].${discriminator}`, `required: the ${discriminator} id (${listOf(Object.keys(table))})`)
      return
    }
    if (typeof id !== 'string') {
      problems.add(4, 'manifest.field', `${arrayName}[${index}].${discriminator}`, 'expected the id string')
      return
    }
    const shape = table[id]
    if (shape === undefined) return // step 11 names the unknown id
    collectObject(entry, shape, `${arrayName}[${index}]`, problems)
    collectSectionFields(entry, kind, index, problems)
  })
}

/* ------------------------------------------------------------------ step 5: text */

function collectTextValue(value, spec, path, problems) {
  if (value === undefined) return
  if (spec.type === 'array') {
    if (!Array.isArray(value)) return
    value.forEach((entry, index) => collectTextValue(entry, spec.of, `${path}[${index}]`, problems))
    return
  }
  if (spec.type === 'tagged' || spec.type === 'object') {
    if (!isPlainObject(value)) return
    const shape = spec.type === 'tagged' ? (tagOf(value, spec) === null ? null : spec.tags[tagOf(value, spec)]) : spec
    if (shape === null) return
    for (const [key, entry] of Object.entries(shape.fields)) collectTextValue(value[key], entry, `${path}.${key}`, problems)
    return
  }
  if (typeof value !== 'string') return
  if (spec.role === 'href' || spec.role === 'variant') return
  if (value === '') problems.add(5, 'manifest.text', path, 'a text field must not be empty after trimming')
  else if (CONTROL.test(value)) problems.add(5, 'manifest.text', path, 'a text field is one line; newlines and control characters are not allowed')
}

function collectText(manifest, kind, problems) {
  const entries = manifest[kind === 'presentation' ? 'slides' : 'sections']
  const table = kind === 'presentation' ? LAYOUTS : SECTIONS
  const discriminator = kind === 'presentation' ? 'layout' : 'type'
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  for (const key of ['title', 'description', 'lang']) collectTextValue(manifest[key], { type: 'string' }, key, problems)
  if (!Array.isArray(entries)) return
  entries.forEach((entry, index) => {
    if (!isPlainObject(entry)) return
    const shape = table[entry[discriminator]]
    if (shape === undefined) return
    collectObjectText(entry, shape, `${arrayName}[${index}]`, problems)
  })
}

function collectObjectText(entry, shape, path, problems) {
  for (const [key, spec] of Object.entries(shape.fields)) collectTextValue(entry[key], spec, `${path}.${key}`, problems)
}

/* ------------------------------------------------------------------ step 6: variant */

function collectVariant(manifest, kind, problems) {
  const variant = manifest.variant
  if (variant === undefined) return
  if (typeof variant !== 'string') return // step 4 owns the type
  if (variant !== 'event') {
    problems.add(6, 'manifest.variant', 'variant', 'variant must be "event"')
    return
  }
  if (kind !== 'landing') problems.add(6, 'manifest.variant', 'variant', 'variant "event" is accepted only on kind landing')
}

/* ------------------------------------------------------------------ step 7: hrefs */

/** Every section id the built document will emit: `s-<type>`, then `s-<type>-<n>` from the second. */
function emittedIds(sections) {
  const counts = new Map()
  const ids = new Set()
  for (const entry of sections) {
    if (!isPlainObject(entry) || typeof entry.type !== 'string') continue
    const count = (counts.get(entry.type) ?? 0) + 1
    counts.set(entry.type, count)
    ids.add(count === 1 ? `s-${entry.type}` : `s-${entry.type}-${count}`)
  }
  return ids
}

function hrefProblem(href, ids) {
  if (EXTERNAL_HTTP.test(href) || MAILTO.test(href)) return null
  if (INTERNAL_ID.test(href)) {
    return ids.has(href.slice(1)) ? null : `${href} names no section this document emits`
  }
  return 'an href is https://…, http://…, mailto:<address> or #s-<type> of a section this document emits'
}

function collectHrefValue(value, spec, path, problems, ids) {
  if (value === undefined) return
  if (spec.type === 'array') {
    if (!Array.isArray(value)) return
    value.forEach((entry, index) => collectHrefValue(entry, spec.of, `${path}[${index}]`, problems, ids))
    return
  }
  if (spec.type === 'object' || spec.type === 'tagged') {
    if (!isPlainObject(value)) return
    const shape = spec.type === 'tagged' ? (tagOf(value, spec) === null ? null : spec.tags[tagOf(value, spec)]) : spec
    if (shape === null) return
    for (const [key, entry] of Object.entries(shape.fields)) collectHrefValue(value[key], entry, `${path}.${key}`, problems, ids)
    return
  }
  if (spec.role !== 'href' || typeof value !== 'string') return
  const problem = hrefProblem(value, ids)
  if (problem !== null) problems.add(7, 'manifest.href', path, problem)
}

function collectHrefs(manifest, kind, problems) {
  const entries = manifest[kind === 'presentation' ? 'slides' : 'sections']
  if (!Array.isArray(entries)) return
  const ids = kind === 'presentation' ? new Set() : emittedIds(entries)
  const table = kind === 'presentation' ? LAYOUTS : SECTIONS
  const discriminator = kind === 'presentation' ? 'layout' : 'type'
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  entries.forEach((entry, index) => {
    if (!isPlainObject(entry)) return
    const shape = table[entry[discriminator]]
    if (shape === undefined) return
    for (const [key, spec] of Object.entries(shape.fields)) {
      collectHrefValue(entry[key], spec, `${arrayName}[${index}].${key}`, problems, ids)
    }
  })
}

/* ------------------------------------------------------------------ step 8: table geometry */

function collectTables(manifest, problems) {
  const sections = manifest.sections
  if (!Array.isArray(sections)) return
  sections.forEach((entry, index) => {
    if (!isPlainObject(entry) || entry.type !== 'table') return
    if (!Array.isArray(entry.columns) || !Array.isArray(entry.rows)) return
    entry.rows.forEach((row, at) => {
      if (!Array.isArray(row)) return
      if (row.length !== entry.columns.length) {
        problems.add(8, 'manifest.table', `sections[${index}].rows[${at}]`, `a row must have ${entry.columns.length} cells, found ${row.length}`)
      }
    })
  })
}

/* ------------------------------------------------------------------ step 9: budgets */

function collectBudgetValue(value, spec, path, problems) {
  if (value === undefined) return
  if (spec.type === 'array') {
    if (!Array.isArray(value)) return
    if (spec.min !== undefined && (value.length < spec.min || value.length > spec.max)) {
      problems.add(9, 'manifest.budget', path, `expected ${describe(spec)}, found ${value.length}`)
    }
    value.forEach((entry, index) => collectBudgetValue(entry, spec.of, `${path}[${index}]`, problems))
    return
  }
  if (spec.type === 'object' || spec.type === 'tagged') {
    if (!isPlainObject(value)) return
    const shape = spec.type === 'tagged' ? (tagOf(value, spec) === null ? null : spec.tags[tagOf(value, spec)]) : spec
    if (shape === null) return
    for (const [key, entry] of Object.entries(shape.fields)) collectBudgetValue(value[key], entry, `${path}.${key}`, problems)
  }
}

function collectBudgets(manifest, kind, recipe, problems) {
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  const table = kind === 'presentation' ? LAYOUTS : SECTIONS
  const discriminator = kind === 'presentation' ? 'layout' : 'type'
  const entries = manifest[arrayName]
  if (Array.isArray(entries)) {
    entries.forEach((entry, index) => {
      if (!isPlainObject(entry)) return
      const shape = table[entry[discriminator]]
      if (shape === undefined) return
      for (const [key, spec] of Object.entries(shape.fields)) {
        collectBudgetValue(entry[key], spec, `${arrayName}[${index}].${key}`, problems)
      }
    })
    const count = entries.length
    if (count < recipe.min || count > recipe.max) {
      problems.add(9, 'manifest.budget', arrayName, `recipe ${recipe.id} takes ${recipe.min}–${recipe.max} ${arrayName === 'slides' ? 'slides' : 'sections'}, found ${count}`)
    }
  }
  if (kind === 'presentation') {
    entries.forEach((entry, index) => {
      if (!isPlainObject(entry) || entry.layout !== 'points') return
      if (entry.source === undefined) return
      /* The source line is legal while the slide's six rendered lines hold it — heading,
         one line per item, the source. Five items plus a source is seven lines and refuses here. */
      const items = Array.isArray(entry.items) ? entry.items.length : 0
      if (items > 4) {
        problems.add(9, 'manifest.budget', `slides[${index}].source`, `a points slide with a source carries at most four items: heading + ${items} items + the source is ${items + 2} lines, over the six-line ceiling`)
      }
    })
  }
}

/* ------------------------------------------------------------------ step 10: singletons */

function collectSingletons(manifest, kind, problems) {
  if (kind === 'presentation' || !Array.isArray(manifest.sections)) return
  const seen = new Set()
  manifest.sections.forEach((entry, index) => {
    if (!isPlainObject(entry) || typeof entry.type !== 'string') return
    const shape = SECTIONS[entry.type]
    if (shape === undefined || !shape.singleton) return
    if (seen.has(entry.type)) {
      problems.add(10, 'manifest.singleton', `sections[${index}].type`, `"${entry.type}" is a singleton and may appear once per page`)
    }
    seen.add(entry.type)
  })
}

/* ------------------------------------------------------------------ step 11: library ids */

function collectIds(manifest, kind, problems) {
  const arrayName = kind === 'presentation' ? 'slides' : 'sections'
  const discriminator = kind === 'presentation' ? 'layout' : 'type'
  const table = kind === 'presentation' ? LAYOUTS : SECTIONS
  const code = kind === 'presentation' ? 'manifest.layout' : 'manifest.section'
  const entries = manifest[arrayName]
  if (!Array.isArray(entries)) return
  entries.forEach((entry, index) => {
    if (!isPlainObject(entry)) return
    const id = entry[discriminator]
    if (typeof id !== 'string' || table[id] !== undefined) return
    problems.add(11, code, `${arrayName}[${index}].${discriminator}`, `unknown ${discriminator} id; the library carries ${listOf(Object.keys(table))}`)
  })
}

/* ------------------------------------------------------------------ step 12: bookend */

function collectBookend(manifest, kind, problems) {
  if (kind === 'presentation' || !Array.isArray(manifest.sections)) return
  const headerAt = manifest.sections.findIndex((entry) => isPlainObject(entry) && entry.type === 'header')
  const footerAt = manifest.sections.findIndex((entry) => isPlainObject(entry) && entry.type === 'footer')
  if (headerAt < 0 || footerAt < 0) return
  const header = manifest.sections[headerAt]
  const footer = manifest.sections[footerAt]
  if (typeof header.brand !== 'string' || typeof footer.brand !== 'string') return
  if (header.brand !== footer.brand) {
    problems.add(12, 'manifest.bookend', `sections[${footerAt}].brand`, 'footer.brand must equal header.brand (the bookend)')
  }
}

/* ------------------------------------------------------------------ step 13: recipe composition */

/** The first occurrence of each repeated type must respect the order list. */
function orderProblem(types, recipe) {
  const seen = new Set()
  let cursor = 0
  for (const type of types) {
    if (seen.has(type)) continue
    const at = recipe.order.indexOf(type, cursor)
    if (at < 0) return type
    cursor = at + 1
    seen.add(type)
  }
  return null
}

function collectComposition(manifest, kind, recipe, problems) {
  const entries = manifest[kind === 'presentation' ? 'slides' : 'sections']
  if (!Array.isArray(entries)) return
  if (kind === 'presentation') {
    const layouts = entries.map((entry) => (isPlainObject(entry) ? entry.layout : undefined))
    if (layouts[0] !== 'title') {
      problems.add(13, 'recipe.composition', 'slides[0].layout', `the first slide must be the title layout, found ${layouts[0] ?? 'none'}`)
    }
    if (layouts[layouts.length - 1] !== 'closing') {
      problems.add(13, 'recipe.composition', `slides[${layouts.length - 1}].layout`, `the last slide must be the closing layout, found ${layouts[layouts.length - 1] ?? 'none'}`)
    }
    const caps = { title: 1, closing: 1, data: 1, quote: 2 }
    for (const [layout, cap] of Object.entries(caps)) {
      let seen = 0
      layouts.forEach((id, index) => {
        if (id !== layout) return
        seen += 1
        if (seen > cap) problems.add(13, 'recipe.composition', `slides[${index}].layout`, cap === 1 ? `the ${layout} layout may appear once per deck` : `the ${layout} layout may appear at most ${cap} times per deck`)
      })
    }
    return
  }
  const types = entries.map((entry) => (isPlainObject(entry) ? entry.type : undefined))
  types.forEach((type, index) => {
    if (typeof type !== 'string' || SECTIONS[type] === undefined) return
    if (!recipe.allowed.includes(type)) {
      problems.add(13, 'recipe.composition', `sections[${index}].type`, `"${type}" is outside recipe ${recipe.id}'s allowed set (${listOf(recipe.allowed)})`)
    }
  })
  for (const required of recipe.required) {
    if (!types.includes(required)) {
      problems.add(13, 'recipe.composition', 'sections', `recipe ${recipe.id} requires "${required}", which the manifest does not carry`)
    }
  }
  const broken = orderProblem(types, recipe)
  if (broken !== null) {
    const index = types.indexOf(broken)
    problems.add(13, 'recipe.composition', `sections[${index}].type`, `"${broken}" is outside the order of recipe ${recipe.id} (${listOf(recipe.order)}); a subset keeps the order`)
  }
}

/* ------------------------------------------------------------------ step 14: rhythm */

const densityOfSection = (type) => (SECTIONS[type] === undefined ? 'quiet' : SECTIONS[type].density)
const densityOfLayout = (layout) => (LAYOUTS[layout] === undefined ? 'sparse' : LAYOUTS[layout].density)

function collectRhythm(manifest, kind, problems) {
  const entries = manifest[kind === 'presentation' ? 'slides' : 'sections']
  if (!Array.isArray(entries)) return
  if (kind === 'presentation') {
    const layouts = entries.map((entry) => (isPlainObject(entry) ? entry.layout : undefined))
    layouts.forEach((layout, index) => {
      if (densityOfLayout(layout) !== 'dense') return
      const next = layouts[index + 1]
      if (next === undefined) return
      const nextDensity = densityOfLayout(next)
      if (next !== 'steps' && nextDensity !== 'sparse') {
        problems.add(14, 'recipe.rhythm', `slides[${index + 1}].layout`, `a dense slide must be followed by a sparse layout or by steps, found ${next}`)
      }
    })
    return
  }
  const types = entries.map((entry) => (isPlainObject(entry) ? entry.type : undefined))
  types.forEach((type, index) => {
    if (typeof type !== 'string') return
    if (densityOfSection(type) !== 'dense') return
    if (index === 0) return
    const previous = types[index - 1]
    if (typeof previous !== 'string') return
    if (densityOfSection(previous) === 'dense') {
      problems.add(14, 'recipe.rhythm', `sections[${index}].type`, `two dense sections are adjacent (${previous}, ${type})`)
    } else if (previous === 'hero') {
      problems.add(14, 'recipe.rhythm', `sections[${index}].type`, `a dense section is never the section right after the hero (${type})`)
    }
  })
  const footerAt = types.lastIndexOf('footer')
  if (footerAt > 0) {
    const previous = types[footerAt - 1]
    if (typeof previous === 'string' && densityOfSection(previous) !== 'quiet') {
      problems.add(14, 'recipe.rhythm', `sections[${footerAt - 1}].type`, `the last section before the footer must be quiet, found ${previous}`)
    }
  }
}

/* ------------------------------------------------------------------ the entry point */

/** The refusal's message: one sentence naming the first problem, never a thrown error. */
function refusalMessage(problems) {
  const first = problems[0]
  if (problems.length === 1) return `${first.path}: ${first.detail}`
  return `${problems.length} problems in the manifest; the first is ${first.path}: ${first.detail}`
}

/**
 * Validate one manifest for one kind and one look, in the fixed step order.
 * @param {{ kind: string, look?: string, manifest: object|string }} input
 * @returns {object} a refusal `{ ok: false, code, message, problems }` or
 *   `{ ok: true, kind, look, recipe, variant?, manifest, structure }`
 */
export function validateManifest({ kind, look, manifest }) {
  if (!KINDS[kind]) {
    return refusal('kind.unknown', 'kind', `kind is one of ${listOf(Object.keys(KINDS))}`)
  }
  let value = manifest
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch (error) {
      return refusal('manifest.shape', 'manifest', `the manifest is not valid JSON: ${error.message}`)
    }
  }
  const shape = shapeProblems(value, kind)
  if (shape.length > 0) return refusal(shape[0].code, shape[0].path, shape[0].detail, { problems: shape })

  const normalized = normalizeManifest(value)
  const problems = new Problems()
  collectUnknown(normalized, kind, problems)
  const lookId = look === undefined || look === null ? DEFAULT_LOOK : look
  if (!LOOKS.includes(lookId)) {
    problems.add(3, 'look.unknown', 'look', `look is one of ${listOf(LOOKS)}`)
  }
  collectFields(normalized, kind, problems)
  collectText(normalized, kind, problems)
  collectVariant(normalized, kind, problems)
  collectHrefs(normalized, kind, problems)
  collectTables(normalized, problems)
  // An invalid variant is step 6's refusal and stops the pass before the recipe matters; the recipe
  // selected here is only the base one in that case.
  const variant = normalized.variant === 'event' && kind === 'landing' ? 'event' : undefined
  const recipe = recipeFor(kind, variant)
  collectBudgets(normalized, kind, recipe, problems)
  collectSingletons(normalized, kind, problems)
  collectIds(normalized, kind, problems)
  collectBookend(normalized, kind, problems)
  collectComposition(normalized, kind, recipe, problems)
  collectRhythm(normalized, kind, problems)

  const found = problems.first()
  if (found !== null) {
    return { ok: false, code: found[0].code, message: refusalMessage(found), problems: found }
  }
  const structure = kind === 'presentation'
    ? normalized.slides.map((entry) => entry.layout)
    : normalized.sections.map((entry) => entry.type)
  return {
    ok: true,
    kind,
    look: lookId,
    recipe: recipe.id,
    ...recipe.variant === undefined ? {} : { variant: recipe.variant },
    manifest: normalized,
    structure,
  }
}

/** The four kinds and the six looks, for argument checks outside the step order. */
export { KINDS, LOOKS, RECIPES }
