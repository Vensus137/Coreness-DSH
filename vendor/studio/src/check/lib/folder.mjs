/**
 * Reading one folder once, for every gate.
 *
 * `checkDir` reads the subject here and the gates take this record as data: the folder's entries and sizes,
 * `page.json`, the document parse, every CSS and JS sheet the emitted set can carry, and the emitted set the
 * record names. A reader that fails leaves a problem on the record; the gates that needed it answer
 * `unchecked` with that problem, never `pass`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { scanCss } from '../../lib/css.mjs'
import { scanDocument } from '../../lib/html.mjs'
import { GENERATOR, SCHEMA } from '../../lib/library.mjs'

const MAX_HTML_BYTES = 2 * 1024 * 1024
const MAX_SHEET_BYTES = 4 * 1024 * 1024

const toPosix = (value) => value.split(sep).join('/')

function walk(dir, base, out) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    return { error: `the folder could not be read: ${error.message}` }
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name)
    const rel = toPosix(relative(base, abs))
    let isDir = entry.isDirectory()
    let isFile = entry.isFile()
    if (entry.isSymbolicLink()) {
      try {
        const info = statSync(abs)
        isDir = info.isDirectory()
        isFile = info.isFile()
      } catch {
        isFile = false
        isDir = false
      }
    }
    if (isDir) {
      out.push({ path: rel, kind: 'dir' })
      const nested = walk(abs, base, out)
      if (nested !== undefined) return nested
    } else if (isFile) {
      let size = 0
      try {
        size = statSync(abs).size
      } catch (error) {
        return { error: `the file ${rel} could not be read: ${error.message}` }
      }
      out.push({ path: rel, kind: 'file', size })
    }
  }
  return undefined
}

function readText(dir, rel, limit) {
  try {
    const buffer = readFileSync(join(dir, ...rel.split('/')))
    if (buffer.byteLength > limit) return { ok: false, detail: `the file is larger than ${limit} bytes` }
    return { ok: true, text: buffer.toString('utf8') }
  } catch (error) {
    return { ok: false, detail: error.message }
  }
}

/**
 * Read the folder once.
 * @param {string} dir absolute path of the folder to check
 * @returns {object} the facts every gate takes
 */
export function readFolder(dir) {
  const entries = []
  const walked = walk(dir, dir, entries)
  const facts = {
    dir,
    entries,
    walkError: walked?.error,
    files: new Map(entries.filter((entry) => entry.kind === 'file').map((entry) => [entry.path, entry.size])),
    record: undefined,
    recordError: undefined,
    html: undefined,
    htmlProblem: undefined,
    css: new Map(),
    js: new Map(),
    jsProblems: new Map(),
    colours: new Map(),
    colourProblem: undefined,
  }

  /* page.json: the marker and the record. */
  const recordRead = readText(dir, 'page.json', 1024 * 1024)
  if (!recordRead.ok) {
    facts.recordError = `page.json could not be read: ${recordRead.detail}`
    return facts
  }
  let parsed
  try {
    parsed = JSON.parse(recordRead.text)
  } catch (error) {
    facts.recordError = `page.json is not valid JSON: ${error.message}`
    return facts
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    facts.recordError = 'page.json is not an object'
    return facts
  }
  facts.record = parsed

  /* index.html: the document. */
  if (facts.files.has('index.html')) {
    const htmlRead = readText(dir, 'index.html', MAX_HTML_BYTES)
    if (!htmlRead.ok) {
      facts.html = { ok: false, unreadable: true, at: 0, detail: htmlRead.detail }
    } else {
      facts.html = scanDocument(htmlRead.text)
    }
  } else {
    facts.htmlProblem = 'the folder carries no index.html'
  }

  /* Every sheet and every script the record names — the deliverable, not whatever else the folder carries. A
     file the studio did not write is not a gate's subject: a user's own stylesheet or note may stand beside the
     page, and the builder never touches it. A recorded file that could not be read is not an empty one: it is
     named on `jsProblems` (and as a failed scan on the sheet's record), so a gate whose subject it is answers
     `unchecked` with that reason. */
  const recordedFiles = new Set((Array.isArray(facts.record.files) ? facts.record.files : []).filter((entry) => typeof entry === 'string'))
  const named = (path) => recordedFiles.size === 0 || recordedFiles.has(path)
  for (const [path] of facts.files) {
    if (!named(path)) continue
    if (path.endsWith('.css')) {
      const read = readText(dir, path, MAX_SHEET_BYTES)
      facts.css.set(path, read.ok ? scanCss(read.text) : { ok: false, detail: read.detail })
    } else if (path.endsWith('.js')) {
      const read = readText(dir, path, MAX_SHEET_BYTES)
      if (read.ok) facts.js.set(path, read.text)
      else facts.jsProblems.set(path, `the script ${path} could not be read: ${read.detail}`)
    }
  }
  /* A recorded file the folder does not carry: the read failed at the record, and a gate that needs the file
     answers `unchecked` rather than passing over a subject that is not there. */
  for (const path of recordedFiles) {
    if (facts.files.has(path)) continue
    if (path.endsWith('.css')) facts.css.set(path, { ok: false, detail: 'the record names it and the folder does not carry it' })
    else if (path.endsWith('.js')) facts.jsProblems.set(path, `the record names ${path} and the folder does not carry it`)
  }

  /* The colour block: exactly one `:root` rule carrying `--c-*` declarations in assets/site.css. */
  const site = facts.css.get('assets/site.css')
  if (site === undefined) {
    facts.colourProblem = facts.files.has('assets/site.css')
      ? 'the record does not name assets/site.css, so the colour block was not read'
      : 'the folder carries no assets/site.css'
  } else if (site.ok !== true) {
    facts.colourProblem = `assets/site.css could not be read: ${site.detail}`
  } else {
    const carrying = site.rules.filter((rule) => [...rule.declarations.keys()].some((name) => name.startsWith('--c-')))
    const roots = carrying.filter((rule) => rule.context === null && rootSelector(rule.selector))
    if (roots.length === 1) {
      facts.colours = new Map([...roots[0].declarations].filter(([name]) => name.startsWith('--c-')))
      facts.colourRoot = roots[0]
    } else if (roots.length === 0) {
      facts.colourProblem = 'assets/site.css carries no :root colour declarations'
    } else {
      facts.colourProblem = `assets/site.css carries ${roots.length} :root colour blocks; exactly one is required`
    }
  }

  /* Every token the emitted `:root` declares: the motion layer's durations are read from here, not assumed. */
  facts.rootTokens = new Map()
  for (const scan of facts.css.values()) {
    if (scan.ok !== true) continue
    for (const rule of scan.rules) {
      if (rule.context !== null || !rootSelector(rule.selector)) continue
      for (const [name, value] of rule.declarations) {
        if (!facts.rootTokens.has(name)) facts.rootTokens.set(name, value)
      }
    }
  }

  return facts
}

function rootSelector(selector) {
  return selector.split(',').map((part) => part.trim()).includes(':root')
}

/** The record's marker is the folder's proof of ownership. */
export function ownershipOf(facts) {
  if (facts.recordError !== undefined) return { ok: false, detail: facts.recordError }
  const record = facts.record
  if (record._generator !== GENERATOR) {
    return { ok: false, detail: `page.json carries _generator ${JSON.stringify(record._generator)}; ${JSON.stringify(GENERATOR)} is the studio's marker` }
  }
  if (record._schema !== SCHEMA) {
    return { ok: false, detail: `page.json carries _schema ${JSON.stringify(record._schema)}; this reader knows ${SCHEMA}` }
  }
  return { ok: true }
}

/** The emitted set the record names, when it can be read. */
export function recordedFiles(facts) {
  const files = facts.record?.files
  if (!Array.isArray(files)) return undefined
  return new Set(files.filter((entry) => typeof entry === 'string').map((entry) => toPosix(entry)))
}

/** The folder's own files, as POSIX-relative paths. */
export function actualFiles(facts) {
  return new Set(facts.files.keys())
}

/** The tree the gates read, or `undefined` with the reason. */
export function treeOf(facts) {
  if (facts.htmlProblem !== undefined) return { ok: false, detail: facts.htmlProblem }
  if (facts.html === undefined) return { ok: false, detail: 'the document was not read' }
  if (facts.html.ok !== true) {
    if (facts.html.malformed === true) {
      return { ok: false, malformed: true, detail: `the document is malformed at offset ${facts.html.at}: ${facts.html.detail}` }
    }
    return { ok: false, unreadable: true, detail: `the document could not be read at offset ${facts.html.at}: ${facts.html.detail}` }
  }
  return { ok: true, root: facts.html.root, text: facts.html.text, elements: facts.html.elements }
}

/**
 * One script's text, or the reader's reason it is not there.
 * @param {object} facts the folder record
 * @param {string} path the script's folder-relative path
 * @returns {{ ok: true, text: string } | { ok: false, detail: string }}
 */
export function scriptOf(facts, path) {
  const problem = facts.jsProblems?.get(path)
  if (problem !== undefined) return { ok: false, detail: problem }
  const text = facts.js?.get(path)
  if (text === undefined) return { ok: false, detail: `the folder carries no ${path} to read` }
  return { ok: true, text }
}

/** Every script the reader could not read, with its reason, in folder order. */
export function scriptProblems(facts) {
  return [...(facts.jsProblems ?? new Map()).values()]
}
