/**
 * The HTML reader a dependency-free check may use. Its contract is the boundary between "the
 * check failed" and "the check could not read the subject": it never guesses. A construct it cannot read is
 * `malformed` (a failure of the document) or `unreadable` (a limit of this reader), and the caller answers
 * `fail` or `unchecked` — never `pass`.
 *
 * What it is not: an HTML validator. No content models, no ARIA, no optional close tags, no `<template>`
 * semantics and no SVG. Only the emitted subset is accepted, and a package fragment is held to explicit
 * closing by the package's own fixture. That is safe because the checker refuses a folder the studio did
 * not write.
 *
 * The reader keeps what the catalogue's hooks read: tag names and attribute names lowercased, attributes
 * decoded, `script`/`style` bodies raw (their content is not text), `title`/`textarea` RCDATA, comments and
 * doctypes skipped.
 */

const MAX_SOURCE_BYTES = 2 * 1024 * 1024
const MAX_DEPTH = 512

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const RAW = new Set(['script', 'style'])
const RCDATA = new Set(['title', 'textarea'])

const NAMED_ENTITIES = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['nbsp', '\u00a0'],
])

/** Decode the five named entities and numeric references; an unknown entity stays literal. */
export function decodeEntities(text) {
  return String(text).replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X'
      const code = hex ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10)
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return whole
      try {
        return String.fromCodePoint(code)
      } catch {
        return whole
      }
    }
    const mapped = NAMED_ENTITIES.get(body)
    return mapped === undefined ? whole : mapped
  })
}

/** Collapse a run of whitespace (including `&nbsp;`) to one space and trim the ends. */
export function collapse(text) {
  return String(text).replace(/\s+/g, ' ').trim()
}

function makeElement(tag, attrs, start, parent) {
  return { tag, attrs, children: [], parent, depth: parent === undefined ? 0 : parent.depth + 1, start, end: start }
}

function textNode(value) {
  return { text: value }
}

const isNameStart = (ch) => /[a-zA-Z]/.test(ch)
const isNameChar = (ch) => /[^\s/>]/.test(ch)

/**
 * Parse one HTML document. See the module header for the contract.
 * @param {string} source
 * @returns {{ ok: true, elements: object[], text: string, root: object }
 *          | { ok: false, malformed: true, at: number, detail: string }
 *          | { ok: false, unreadable: true, at: number, detail: string }}
 */
export function scanDocument(source) {
  if (typeof source !== 'string') {
    return { ok: false, unreadable: true, at: 0, detail: 'the document is not text this reader can read' }
  }
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    return { ok: false, unreadable: true, at: 0, detail: `the document is larger than ${MAX_SOURCE_BYTES} bytes; a reader that guesses would produce a false pass` }
  }

  const root = makeElement('#document', new Map(), 0, undefined)
  const elements = []
  const stack = [root]
  const len = source.length
  let i = 0

  const top = () => stack[stack.length - 1]
  const fail = (at, detail) => ({ ok: false, malformed: true, at, detail })

  while (i < len) {
    const lt = source.indexOf('<', i)
    if (lt === -1) {
      if (i < len) top().children.push(textNode(decodeEntities(source.slice(i))))
      i = len
      break
    }
    if (lt > i) top().children.push(textNode(decodeEntities(source.slice(i, lt))))
    i = lt

    if (source.startsWith('<!--', i)) {
      const close = source.indexOf('-->', i + 4)
      if (close === -1) return fail(i, 'a comment is not closed before the end of the document')
      i = close + 3
      continue
    }
    if (source.startsWith('<![CDATA[', i)) {
      const close = source.indexOf(']]>', i + 9)
      if (close === -1) return fail(i, 'a CDATA section is not closed before the end of the document')
      i = close + 3
      continue
    }
    if (source.startsWith('<!', i) || source.startsWith('<?', i)) {
      const close = source.indexOf('>', i + 2)
      if (close === -1) return fail(i, 'a declaration is not closed before the end of the document')
      i = close + 1
      continue
    }
    if (source.startsWith('</', i)) {
      const match = /^<\/([^\s>]+)\s*>/.exec(source.slice(i))
      if (match === null) return fail(i, 'an end tag is not terminated')
      const name = match[1].toLowerCase()
      const open = top()
      if (open.tag !== name) {
        return fail(i, `the end tag </${name}> does not close the open element <${open.tag}>`)
      }
      open.end = i + match[0].length
      stack.pop()
      i += match[0].length
      continue
    }
    if (!isNameStart(source[i + 1] ?? '')) {
      top().children.push(textNode('<'))
      i += 1
      continue
    }

    /* A start tag. */
    const tagStart = i
    let nameEnd = i + 1
    while (nameEnd < len && isNameChar(source[nameEnd])) nameEnd += 1
    const tag = source.slice(i + 1, nameEnd).toLowerCase()
    i = nameEnd
    const attrs = new Map()
    let selfClosed = false
    let closed = false
    while (i < len) {
      while (i < len && /\s/.test(source[i])) i += 1
      if (i >= len) break
      if (source[i] === '>') { i += 1; closed = true; break }
      if (source[i] === '/' && source[i + 1] === '>') { i += 2; selfClosed = true; closed = true; break }
      if (source[i] === '/') { i += 1; continue }
      const aStart = i
      while (i < len && !/[\s=/>]/.test(source[i])) i += 1
      const attrName = source.slice(aStart, i).toLowerCase()
      if (attrName === '') return fail(i, `an attribute of <${tag}> has no name`)
      while (i < len && /\s/.test(source[i])) i += 1
      let value = ''
      if (source[i] === '=') {
        i += 1
        while (i < len && /\s/.test(source[i])) i += 1
        const quote = source[i]
        if (quote === '"' || quote === "'") {
          const close = source.indexOf(quote, i + 1)
          if (close === -1) return fail(i, `the value of the attribute ${attrName} of <${tag}> is not closed`)
          value = source.slice(i + 1, close)
          i = close + 1
        } else {
          const vStart = i
          while (i < len && !/[\s>]/.test(source[i])) i += 1
          value = source.slice(vStart, i)
        }
      }
      if (attrs.has(attrName)) return fail(aStart, `the attribute ${attrName} appears twice on <${tag}>`)
      attrs.set(attrName, decodeEntities(value))
    }
    if (!closed) return fail(tagStart, `the start tag <${tag}> is not closed`)

    const parent = top()
    if (parent.depth + 1 > MAX_DEPTH) {
      return { ok: false, unreadable: true, at: tagStart, detail: `the document nests deeper than ${MAX_DEPTH} elements; a reader that guesses would produce a false pass` }
    }
    const element = makeElement(tag, attrs, tagStart, parent)
    parent.children.push(element)
    elements.push(element)

    if (VOID.has(tag)) {
      element.end = i
      continue
    }
    if (selfClosed) {
      element.end = i
      continue
    }
    if (RAW.has(tag)) {
      /* Raw text: content is opaque until the matching close tag. `if (a < b)` in a script is not markup. */
      const closeRe = new RegExp(`</${tag}\\s*>`, 'i')
      const rest = source.slice(i)
      const match = closeRe.exec(rest)
      if (match === null) return fail(tagStart, `the <${tag}> element is not closed before the end of the document`)
      const body = rest.slice(0, match.index)
      element.raw = body
      element.end = i + match.index + match[0].length
      i = element.end
      continue
    }
    if (RCDATA.has(tag)) {
      const closeRe = new RegExp(`</${tag}\\s*>`, 'i')
      const rest = source.slice(i)
      const match = closeRe.exec(rest)
      if (match === null) return fail(tagStart, `the <${tag}> element is not closed before the end of the document`)
      const body = rest.slice(0, match.index)
      element.raw = body
      element.children.push(textNode(decodeEntities(body)))
      element.end = i + match.index + match[0].length
      i = element.end
      continue
    }
    stack.push(element)
  }

  if (stack.length > 1) {
    const open = top()
    return fail(open.start, `the element <${open.tag}> is not closed before the end of the document`)
  }

  return { ok: true, elements, text: documentText(root), root }
}

/** The document's visible text: raw-text bodies (script/style) are code, not text. */
function documentText(root) {
  const parts = []
  const walk = (node, insideRaw) => {
    if (node.text !== undefined) {
      if (!insideRaw) parts.push(node.text)
      return
    }
    const raw = insideRaw || RAW.has(node.tag)
    for (const child of node.children) walk(child, raw)
  }
  walk(root, false)
  return collapse(parts.join(' '))
}

/** The descendant text of one element, whitespace-collapsed, entities decoded; raw-text bodies excluded. */
export function textOf(element) {
  if (element === undefined || element === null) return ''
  if (element.text !== undefined) return element.text
  const parts = []
  const walk = (node) => {
    if (node.text !== undefined) {
      parts.push(node.text)
      return
    }
    if (RAW.has(node.tag)) return
    for (const child of node.children) walk(child)
  }
  for (const child of element.children) walk(child)
  return collapse(parts.join(' '))
}

/** The decoded attribute value, or `undefined` when the element carries none. */
export function attr(element, name) {
  if (element === undefined || element === null || element.attrs === undefined) return undefined
  return element.attrs.get(String(name).toLowerCase())
}

/** The class tokens of an element as a set. */
export function classesOf(element) {
  const raw = attr(element, 'class')
  if (raw === undefined) return new Set()
  return new Set(raw.split(/\s+/).filter((token) => token !== ''))
}

function walkElements(root, visit) {
  if (root.text !== undefined) return
  for (const child of root.children) {
    if (child.text !== undefined) continue
    visit(child)
    walkElements(child, visit)
  }
}

/** Every element below `root` carrying the class token, in document order. */
export function byClass(root, token) {
  const found = []
  walkElements(root, (element) => {
    if (classesOf(element).has(token)) found.push(element)
  })
  return found
}

/** Every element below `root` with the tag, in document order. */
export function byTag(root, tag) {
  const wanted = String(tag).toLowerCase()
  const found = []
  walkElements(root, (element) => {
    if (element.tag === wanted) found.push(element)
  })
  return found
}

/** The first element below `root` with the id, or `undefined`. */
export function byId(root, id) {
  let found
  if (root.text === undefined && attr(root, 'id') === id) return root
  walkElements(root, (element) => {
    if (found === undefined && attr(element, 'id') === id) found = element
  })
  return found
}

/** Every element below `root`, in document order. */
export function allElements(root) {
  const found = []
  walkElements(root, (element) => found.push(element))
  return found
}

/** True when `element` sits inside a tag. */
export function insideTag(element, tag) {
  let cursor = element?.parent
  while (cursor !== undefined && cursor !== null) {
    if (cursor.tag === tag) return true
    cursor = cursor.parent
  }
  return false
}

/** The nearest ancestor carrying the class token, or `undefined`. */
export function closestClass(element, token) {
  let cursor = element?.parent
  while (cursor !== undefined && cursor !== null) {
    if (classesOf(cursor).has(token)) return cursor
    cursor = cursor.parent
  }
  return undefined
}

/** True when `element` is a descendant of `ancestor`. */
export function isDescendantOf(element, ancestor) {
  let cursor = element?.parent
  while (cursor !== undefined && cursor !== null) {
    if (cursor === ancestor) return true
    cursor = cursor.parent
  }
  return false
}

/** The section type of an element carrying `s` and `s-<type>` classes, or `undefined`. */
export function sectionType(element) {
  const classes = classesOf(element)
  if (!classes.has('s')) {
    for (const token of classes) {
      const match = /^s-([a-z]+)(?:-\d+)?$/.exec(token)
      if (match !== null) return match[1]
    }
    return undefined
  }
  for (const token of classes) {
    const match = /^s-([a-z]+)$/.exec(token)
    if (match !== null) return match[1]
  }
  for (const token of classes) {
    const match = /^s-([a-z]+)-\d+$/.exec(token)
    if (match !== null) return match[1]
  }
  return undefined
}

/** The elements that are page section elements (class `s` and class `s-<type>`), in document order. */
export function sectionsOf(root) {
  return allElements(root).filter((element) => classesOf(element).has('s') && sectionType(element) !== undefined)
}
