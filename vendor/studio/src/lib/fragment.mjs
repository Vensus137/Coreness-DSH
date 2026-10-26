/**
 * The fragment renderer: one literal placeholder dialect, no template dependency, no
 * expressions. The package's shells, sections and layouts are text fragments written against it.
 *
 *   {{name}}                 a scalar from the view, HTML-escaped
 *   {{#name}}…{{/name}}      once per array item, or once for an object; item properties in scope,
 *                            {{.}} is a string item, {{@index}} is its 1-based index
 *   {{?name}}…{{/name}}      once when `name` is present and non-empty (string, object, non-empty
 *                            array, true); an object's properties are in scope
 *   {{>name}}                trusted HTML insertion, builder-only (pre-rendered sections in a shell)
 *
 * Block names are read from the fragment text, never from the view: an absent optional field leaves
 * `{{?name}}` empty instead of surviving. A scalar missing from the view is left as written; the
 * composer refuses a document in which any `{{` survives (a package fault).
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** The one escape for text and attribute values. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch])
}

/** Split `source` into text, scalar, trusted and block nodes; an unbalanced token stays literal text. */
function parse(source) {
  const root = { children: [] }
  const stack = [root]
  const push = (node) => stack[stack.length - 1].children.push(node)
  let i = 0
  while (i < source.length) {
    const open = source.indexOf('{{', i)
    if (open < 0) {
      push({ type: 'text', value: source.slice(i) })
      break
    }
    if (open > i) push({ type: 'text', value: source.slice(i, open) })
    const close = source.indexOf('}}', open + 2)
    if (close < 0) {
      push({ type: 'text', value: source.slice(open) })
      break
    }
    const raw = source.slice(open, close + 2)
    const token = source.slice(open + 2, close).trim()
    if (token.startsWith('/')) {
      const top = stack[stack.length - 1]
      if (stack.length > 1 && top.name === token.slice(1).trim()) stack.pop()
      else push({ type: 'text', value: raw })
    } else if (token.startsWith('#')) {
      const node = { type: 'block', mode: 'each', name: token.slice(1).trim(), children: [] }
      push(node)
      stack.push(node)
    } else if (token.startsWith('?')) {
      const node = { type: 'block', mode: 'presence', name: token.slice(1).trim(), children: [] }
      push(node)
      stack.push(node)
    } else if (token.startsWith('>')) {
      push({ type: 'trusted', name: token.slice(1).trim() })
    } else if (token === '' || token.includes('{') || token.includes('}')) {
      push({ type: 'text', value: raw })
    } else {
      push({ type: 'scalar', name: token, raw })
    }
    i = close + 2
  }
  return root.children
}

/** Look `name` up from the innermost context outward; `undefined` when nothing holds it. */
function lookup(state, name) {
  if (name === '.') {
    const value = state.contexts[state.contexts.length - 1]
    return typeof value === 'object' && value !== null ? undefined : String(value)
  }
  if (name === '@index') {
    for (let i = state.indexes.length - 1; i >= 0; i -= 1) if (state.indexes[i] !== undefined) return String(state.indexes[i])
    return undefined
  }
  for (let i = state.contexts.length - 1; i >= 0; i -= 1) {
    const context = state.contexts[i]
    if (context !== null && typeof context === 'object' && Object.prototype.hasOwnProperty.call(context, name)) {
      return context[name]
    }
  }
  return undefined
}

/** A value is present for `{{?}}`/`{{#}}` when it is not null/undefined/false/empty text/empty list. */
function present(value) {
  if (value === undefined || value === null || value === false) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/** Render nodes against one scope: root view first, then block contexts innermost last. */
function render(nodes, state) {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'text') {
      out += node.value
    } else if (node.type === 'trusted') {
      const value = state.contexts[0]?.[node.name]
      out += value === undefined || value === null ? '' : String(value)
    } else if (node.type === 'scalar') {
      const value = lookup(state, node.name)
      out += value === undefined ? node.raw : escapeHtml(value)
    } else if (node.mode === 'each') {
      const value = lookup(state, node.name)
      if (!present(value)) continue
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
          out += render(node.children, {
            contexts: [...state.contexts, value[i]],
            indexes: [...state.indexes, i + 1],
          })
        }
      } else {
        out += render(node.children, { contexts: [...state.contexts, value], indexes: [...state.indexes, undefined] })
      }
    } else {
      const value = lookup(state, node.name)
      if (!present(value)) continue
      const context = typeof value === 'boolean' ? undefined : value
      out += render(node.children, {
        contexts: context === undefined ? state.contexts : [...state.contexts, context],
        indexes: [...state.indexes, undefined],
      })
    }
  }
  return out
}

/**
 * Render one fragment against one view.
 * @param {string} source the fragment text
 * @param {object} view the values a fragment may name
 * @returns {string} the rendered text
 */
export function renderFragment(source, view) {
  return render(parse(String(source ?? '')), { contexts: [view ?? {}], indexes: [] })
}
