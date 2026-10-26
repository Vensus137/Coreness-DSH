/**
 * The asset, placeholder, byte and evidence gates: `external.asset` through
 * `evidence.outside`, with `external.script`, `script.classic` and `asset.image` between them.
 */
import { urlRefs } from '../../../lib/css.mjs'
import { allElements, attr, byTag } from '../../../lib/html.mjs'
import { BYTE_LIMIT, EVIDENCE_DIR_NAMES, FORBIDDEN_FILE_EXTENSIONS } from '../design.mjs'
import { recordedFiles } from '../folder.mjs'
import { fail, list, pass, unchecked } from '../result.mjs'
import { emittedSet, withTree } from './shared.mjs'

const SCHEME = /^[a-z][a-z0-9+.-]*:/i

/** The local file a reference names, or `undefined` when it is external or not a file. */
function localFile(value) {
  const text = value.trim()
  if (text === '') return undefined
  if (text.startsWith('//')) return { external: true, needle: text }
  if (SCHEME.test(text)) return { external: true, needle: text }
  if (text.startsWith('#')) return { fragment: true, needle: text }
  const withoutQuery = text.split(/[?#]/)[0]
  const withoutDot = withoutQuery.replace(/^\.\//, '')
  return { file: withoutDot, needle: text }
}

function checkReference(value, where, emitted, problems) {
  const ref = localFile(value)
  if (ref === undefined) { problems.push(`${where} is empty`); return }
  if (ref.external === true) {
    problems.push(`${where} is an absolute or data: reference ${JSON.stringify(ref.needle)}`)
    return
  }
  if (ref.fragment === true) { problems.push(`${where} names a fragment ${JSON.stringify(ref.needle)}, not a file`); return }
  if (!emitted.has(ref.file)) problems.push(`${where} names ${JSON.stringify(ref.file)}, which is not in the emitted set`)
}

function cssReferences(facts) {
  const found = []
  for (const [path, scan] of facts.css) {
    if (scan.ok !== true) return { problem: `${path} could not be read: ${scan.detail}` }
    for (const rule of scan.rules) {
      for (const ref of urlRefs(rule.raw)) found.push({ value: ref, where: `${path}: ${rule.selector} url(${ref})` })
    }
    for (const atRule of scan.atRules) {
      for (const ref of urlRefs(atRule)) found.push({ value: ref, where: `${path}: @import url(${ref})` })
      const quoted = /@import\s+(?:url\()?\s*['"]([^'"]+)['"]/i.exec(atRule)
      if (quoted !== null) found.push({ value: quoted[1], where: `${path}: @import ${JSON.stringify(quoted[1])}` })
    }
  }
  return { found }
}

function srcdocPresent(tree) {
  return allElements(tree.root).filter((element) => attr(element, 'srcdoc') !== undefined)
}

export const externalAsset = {
  code: 'external.asset',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    /* The references live in the sheets as well as the document: an unread sheet is an unread subject. */
    const references = cssReferences(facts)
    if (references.problem !== undefined) return unchecked(references.problem)
    const emitted = emittedSet(facts)
    const problems = []
    for (const element of allElements(tree.value.root)) {
      for (const name of ['src', 'srcset', 'poster']) {
        const value = attr(element, name)
        if (value === undefined) continue
        const candidates = name === 'srcset'
          ? value.split(',').map((part) => part.trim().split(/\s+/)[0]).filter((part) => part !== '')
          : [value]
        for (const candidate of candidates) checkReference(candidate, `<${element.tag}> ${name} at offset ${element.start}`, emitted, problems)
      }
      if (element.tag === 'link') {
        const href = attr(element, 'href')
        const rel = (attr(element, 'rel') ?? '').toLowerCase()
        if (href !== undefined && (rel === 'stylesheet' || rel === 'preload' || rel === 'icon' || rel === 'preconnect' || rel === 'dns-prefetch')) {
          checkReference(href, `<link rel="${rel}" href>`, emitted, problems)
        }
      }
    }
    for (const ref of references.found) checkReference(ref.value, ref.where, emitted, problems)
    if (problems.length > 0) return fail(list(problems))
    return pass('every stylesheet, source and url() names an emitted local file; no absolute URL and no data: reference')
  },
}

export const externalScript = {
  code: 'external.script',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const emitted = emittedSet(facts)
    const problems = []
    for (const script of byTag(tree.value.root, 'script')) {
      const src = attr(script, 'src')
      if (src === undefined) continue /* script.classic owns the inline case */
      checkReference(src, `<script src> at offset ${script.start}`, emitted, problems)
    }
    for (const element of srcdocPresent(tree.value)) problems.push(`<${element.tag}> at offset ${element.start} carries srcdoc`)
    if (problems.length > 0) return fail(list(problems))
    return pass('every <script src> names an emitted local file; no absolute URL and no srcdoc')
  },
}

export const scriptClassic = {
  code: 'script.classic',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const body = byTag(tree.value.root, 'body')[0]
    const scripts = byTag(tree.value.root, 'script')
    const problems = []
    for (const script of scripts) {
      const src = attr(script, 'src')
      const type = (attr(script, 'type') ?? '').trim().toLowerCase()
      if (src === undefined || src.trim() === '') problems.push(`<script> at offset ${script.start} carries no src (an inline body is not a classic script)`)
      if (type === 'module') problems.push(`<script> at offset ${script.start} is type="module"`)
      if (type === 'importmap') problems.push(`<script> at offset ${script.start} is an importmap`)
      if (attr(script, 'nomodule') !== undefined) problems.push(`<script> at offset ${script.start} carries nomodule`)
    }
    if (scripts.length > 1) problems.push(`${scripts.length} <script> elements; at most one`)
    if (scripts.length === 1 && body !== undefined) {
      const children = (body.children ?? []).filter((child) => child.text === undefined)
      const last = children[children.length - 1]
      if (last !== scripts[0]) problems.push('the script is not the last child of <body>')
    }
    if (problems.length > 0) return fail(list(problems))
    if (scripts.length === 0) return pass('the document carries no script')
    return pass('one classic <script src>, last child of <body>, no module, importmap or nomodule')
  },
}

const FORBIDDEN_TAGS = ['img', 'picture', 'video', 'audio', 'iframe', 'object', 'embed', 'canvas', 'svg']

export const assetImage = {
  code: 'asset.image',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const problems = []
    for (const element of allElements(tree.value.root)) {
      if (FORBIDDEN_TAGS.includes(element.tag)) problems.push(`<${element.tag}> at offset ${element.start}; the MVP carries no image, media or drawn object`)
    }
    for (const path of emittedSet(facts)) {
      const lower = path.toLowerCase()
      if (FORBIDDEN_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension))) problems.push(`the emitted set carries ${path}`)
    }
    if (problems.length > 0) return fail(list(problems))
    return pass('no image, media or drawn-object element and no image or font file')
  },
}

const PLACEHOLDER_PATTERNS = [
  ['lorem', /\blorem\b/i],
  ['ipsum', /\bipsum\b/i],
  ['dolor sit amet', /\bdolor sit amet\b/i],
  ['todo', /\btodo\b/i],
  ['tbd', /\btbd\b/i],
  ['your text/headline/content/company', /\byour (text|headline|content|company)\b/i],
  ['company name', /\bcompany name\b/i],
  ['example.com', /\bexample\.com\b/i],
  ['undefined', /\bundefined\b/i],
  ['null', /\bnull\b/i],
  ['placeholder', /\bplaceholder\b/i],
  /* The copy's banned filler words: the ban is machine-checked here, or it is only a wish. */
  ['filler word', /\b(seamlessly|empower(?:s|ed|ing)?|unlock(?:s|ed|ing)?|elevate(?:s|d|ing)?|revolutioni[sz](?:e|es|ed|ing)|next-generation|cutting-edge|supercharg(?:e|es|ed|ing)|robust(?:ly)?|holistic(?:ally)?|leverag(?:e|es|ed|ing))\b/i],
]

function manifestStrings(value, path, found) {
  if (typeof value === 'string') { found.push({ path, value }); return }
  if (Array.isArray(value)) { value.forEach((item, index) => manifestStrings(item, `${path}[${index}]`, found)); return }
  if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) manifestStrings(item, path === '' ? key : `${path}.${key}`, found)
  }
}

export const contentPlaceholder = {
  code: 'content.placeholder',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const problems = []
    for (const [name, pattern] of PLACEHOLDER_PATTERNS) {
      const match = pattern.exec(tree.value.text)
      if (match !== null) problems.push(`the visible text carries ${JSON.stringify(match[0])} (${name})`)
    }
    const strings = []
    manifestStrings(facts.record?.manifest, '', strings)
    for (const { path, value } of strings) {
      for (const [name, pattern] of PLACEHOLDER_PATTERNS) {
        const match = pattern.exec(value)
        if (match !== null) problems.push(`the recorded manifest field ${path} carries ${JSON.stringify(match[0])} (${name})`)
      }
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`no placeholder word and none of the banned filler words in the visible text or in ${strings.length} manifest string(s)`)
  },
}

export const bytesTotal = {
  code: 'bytes.total',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    /* A budget is a sum over the folder: a walk that did not complete cannot prove one. */
    if (facts.walkError !== undefined) return unchecked(facts.walkError)
    if (!facts.files.has('index.html')) return unchecked('the folder carries no index.html')
    /* The budget is the deliverable's: the files the record names, not whatever else the user keeps in the folder. */
    const recorded = recordedFiles(facts)
    const paths = recorded !== undefined ? [...recorded] : [...facts.files.keys()]
    const counted = []
    let sum = 0
    for (const path of paths) {
      if (!(path === 'index.html' || (path.startsWith('assets/') && (path.endsWith('.css') || path.endsWith('.js'))))) continue
      const size = facts.files.get(path)
      if (size === undefined) return unchecked(`the record names ${path}, which the folder does not carry, so the byte sum cannot be completed`)
      counted.push(path)
      sum += size
    }
    if (counted.length === 0) return unchecked('the folder carries no emitted file to count')
    const scope = recorded !== undefined ? 'emitted file(s) the record names' : 'emitted files the folder carries (no record names them)'
    if (sum > BYTE_LIMIT) return fail(`${sum} bytes over ${counted.length} ${scope}: over the ${BYTE_LIMIT}-byte budget`)
    return pass(`${sum} bytes over ${counted.length} ${scope}, at most ${BYTE_LIMIT}; a file the studio did not write is not counted`)
  },
}

export const evidenceOutside = {
  code: 'evidence.outside',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    if (facts.walkError !== undefined) return unchecked(facts.walkError)
    const found = facts.entries
      .filter((entry) => entry.path.split('/').some((segment) => EVIDENCE_DIR_NAMES.includes(segment)))
      .map((entry) => entry.path)
    if (found.length > 0) return fail(`the deliverable carries evidence: ${list(found)}`)
    return pass(`no ${EVIDENCE_DIR_NAMES.join(' or ')} entry under the target`)
  },
}

