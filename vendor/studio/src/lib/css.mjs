/**
 * The CSS reader a dependency-free check may use.
 *
 * Reads what the checks read and nothing else: the declarations of every rule, the at-rule that encloses it,
 * and every statement at-rule (`@import`, `@charset`) as a string. **No cascade, no specificity and no
 * inheritance** — a check that needs "the rule that applies" is an Edge gate, not this reader. Values are
 * kept as written; the reader resolves nothing.
 *
 * The one trap this reader exists to avoid: a statement at-rule does not end at `{`. A reader that looks only
 * for a block glues `@import url(…)` to the next selector and loses every rule after it.
 *
 * Unbalanced braces or an unterminated comment make the whole read fail (`ok: false`); the CSS-dependent
 * gates then answer `unchecked` with the reason, never `pass`.
 */

const MAX_SOURCE_BYTES = 4 * 1024 * 1024

/** Strip comments; `result.ok` is false when one is unterminated. */
function stripComments(source) {
  let out = ''
  let i = 0
  while (i < source.length) {
    const open = source.indexOf('/*', i)
    if (open === -1) {
      out += source.slice(i)
      break
    }
    out += source.slice(i, open)
    const close = source.indexOf('*/', open + 2)
    if (close === -1) return { ok: false, detail: 'a comment is not closed before the end of the sheet' }
    out += ' '
    i = close + 2
  }
  return { ok: true, value: out }
}

/** Split a declaration block on `;` at depth zero, respecting quotes and parentheses. */
function splitDeclarations(body) {
  const parts = []
  let current = ''
  let depth = 0
  let quote = ''
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i]
    if (quote !== '') {
      current += ch
      if (ch === quote && body[i - 1] !== '\\') quote = ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue }
    if (ch === '(') { depth += 1; current += ch; continue }
    if (ch === ')') { depth = Math.max(0, depth - 1); current += ch; continue }
    if (ch === ';' && depth === 0) { parts.push(current); current = ''; continue }
    current += ch
  }
  if (current.trim() !== '') parts.push(current)
  return parts
}

const PROPERTY = /^\s*(--[A-Za-z0-9_-]+|[A-Za-z-]+)\s*:\s*([\s\S]*)$/

function parseDeclarations(body) {
  const declarations = new Map()
  for (const part of splitDeclarations(body)) {
    const match = PROPERTY.exec(part)
    if (match === null) continue
    const name = match[1].toLowerCase()
    if (declarations.has(name)) continue /* first wins, per the reader's contract */
    declarations.set(name, match[2].trim())
  }
  return declarations
}

/**
 * Find the index just past the block that starts at `open` (which points at `{`), respecting strings and
 * nested braces. Returns -1 when the block is not closed.
 */
function blockEnd(source, open) {
  let depth = 0
  let quote = ''
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i]
    if (quote !== '') {
      if (ch === quote && source[i - 1] !== '\\') quote = ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; continue }
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return i + 1
    }
  }
  return -1
}

/**
 * Parse one CSS sheet.
 * @param {string} source
 * @returns {{ ok: true, rules: { selector: string, declarations: Map<string,string>, context: string|null, raw: string }[], atRules: string[] }
 *          | { ok: false, detail: string }}
 */
export function scanCss(source) {
  if (typeof source !== 'string') return { ok: false, detail: 'the sheet is not text this reader can read' }
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    return { ok: false, detail: `the sheet is larger than ${MAX_SOURCE_BYTES} bytes; a reader that guesses would produce a false pass` }
  }
  const stripped = stripComments(source)
  if (!stripped.ok) return { ok: false, detail: stripped.detail }
  const text = stripped.value

  const rules = []
  const atRules = []

  const parseBlock = (from, to, context) => {
    let i = from
    while (i < to) {
      while (i < to && /\s/.test(text[i])) i += 1
      if (i >= to) return true
      const open = text.indexOf('{', i)
      const semi = text.indexOf(';', i)
      if (open === -1 || open >= to) {
        /* Only statement at-rules (or trailing junk) remain. */
        const statement = text.slice(i, to)
        const trimmed = statement.trim().replace(/;$/, '').trim()
        if (trimmed.startsWith('@')) atRules.push(trimmed)
        return true
      }
      if (semi !== -1 && semi < to && semi < open) {
        const statement = text.slice(i, semi).trim()
        if (statement.startsWith('@') === false) return { detail: `a declaration stands outside a rule: ${statement.slice(0, 80)}` }
        atRules.push(statement)
        i = semi + 1
        continue
      }
      const header = text.slice(i, open).trim()
      const end = blockEnd(text, open)
      if (end === -1 || end > to) return { detail: `the block of "${header.slice(0, 80)}" is not closed` }
      const body = text.slice(open + 1, end - 1)
      if (header.startsWith('@')) {
        /* The header names the at-rule; the block carries what a gate may need (a font source, a keyframe). */
        atRules.push(`${header} {${body}}`)
        const nested = parseBlock(open + 1, end - 1, context === null ? header : `${context} → ${header}`)
        if (nested !== true) return nested
      } else {
        rules.push({ selector: header, declarations: parseDeclarations(body), context, raw: text.slice(i, end) })
      }
      i = end
    }
    return true
  }

  const result = parseBlock(0, text.length, null)
  if (result !== true) return { ok: false, detail: result.detail }
  return { ok: true, rules, atRules }
}

/** Every `url(…)` reference in a rule's raw text, in order. */
export function urlRefs(raw) {
  const found = []
  const re = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi
  let match
  while ((match = re.exec(raw)) !== null) {
    found.push((match[1] ?? match[2] ?? match[3] ?? '').trim())
  }
  return found
}

/** Split a selector list on commas that are not inside parentheses or strings. */
export function selectorParts(selector) {
  const parts = []
  let current = ''
  let depth = 0
  let quote = ''
  for (const ch of selector) {
    if (quote !== '') {
      current += ch
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue }
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue }
    current += ch
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

/**
 * The last compound selector of a complex selector, with pseudo-classes and pseudo-elements kept in the
 * text but not read: `p a:hover` → `a:hover`, `.look-quiet a` → `a`.
 */
export function lastCompound(part) {
  const trimmed = part.trim()
  let depth = 0
  let start = 0
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]
    if (ch === '(' || ch === '[') depth += 1
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1)
    else if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) start = i + 1
  }
  return trimmed.slice(start)
}

/** True when a complex selector's subject is an anchor (`a`, `a:hover`, `p a`, `.prose a`). */
export function targetsAnchor(part) {
  const compound = lastCompound(part)
  const match = /^([a-zA-Z][\w-]*)/.exec(compound)
  return match !== null && match[1].toLowerCase() === 'a'
}

/** The value of a declaration, `!important` stripped. */
export function valueOf(declarations, name) {
  const raw = declarations.get(name.toLowerCase())
  if (raw === undefined) return undefined
  return raw.replace(/!\s*important\s*$/i, '').trim()
}

/** True when the declaration is marked `!important`. */
export function isImportant(declarations, name) {
  const raw = declarations.get(name.toLowerCase())
  return raw !== undefined && /!\s*important\s*$/i.test(raw)
}
