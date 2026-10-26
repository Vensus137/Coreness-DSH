/**
 * The package files the builder reads and the one transformation it applies to `assets/site.css`.
 * Fragments are text files read by their contract names; assets are text files copied
 * as bytes. Nothing here is imported by the builder from `src/shells`, `src/sections` or `src/layouts`.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COLOUR_TOKENS, LOOKS } from '../lib/library.mjs'

/** `packages/studio/src` — the root the contract's file names are relative to. */
export const PACKAGE_SRC = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The contract's file names, corrected for `present.js`'s origin under `shells/`. */
export const PATHS = {
  pageShell: 'shells/page.html',
  deckShell: 'shells/deck.html',
  presentJs: 'shells/present.js',
  siteCss: 'assets/site.css',
  deckCss: 'assets/deck.css',
  section: (type) => `sections/${type}.html`,
  layout: (id) => `layouts/${id}.html`,
}

/** One text file of the package; a missing or unreadable file is a composition fault, thrown. */
export function readPackageFile(packageRoot, relativePath) {
  try {
    return readFileSync(join(packageRoot, relativePath), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  } catch (error) {
    throw new Error(`page-studio package file ${relativePath} cannot be read: ${error.message}`)
  }
}

/** One text file the build emits: LF endings and exactly one trailing newline. */
export function finalizeText(text) {
  const clean = String(text).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  return clean.endsWith('\n') ? clean : `${clean}\n`
}

/** One `/*@look <id>…@end*\/` region; the body is a declaration list, never a rule. */
const LOOK_REGION = /\/\*@look ([a-z]+)\*\/([\s\S]*?)\/\*@end\*\//g

/** The single `:root` block of a stylesheet: `{ open, close }` are the braces' indices. */
function findRootBlock(source) {
  const matches = [...source.matchAll(/:root\s*\{/g)]
  if (matches.length === 0) throw new Error('compose: the package site.css carries no :root block')
  if (matches.length > 1) throw new Error('compose: the package site.css carries more than one :root block')
  const open = matches[0].index + matches[0][0].length - 1
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return { open, close: i }
    }
  }
  throw new Error('compose: the :root block is not closed')
}

/** Split a declaration block on the semicolons that separate declarations (not inside (), [] or a string). */
function splitDeclarations(block) {
  const chunks = []
  let start = 0
  let depth = 0
  let comment = false
  let quote = null
  for (let i = 0; i < block.length; i += 1) {
    const ch = block[i]
    const next = block[i + 1]
    if (comment) {
      if (ch === '*' && next === '/') {
        comment = false
        i += 1
      }
      continue
    }
    if (quote !== null) {
      if (ch === quote && block[i - 1] !== '\\') quote = null
      continue
    }
    if (ch === '/' && next === '*') {
      comment = true
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '(' || ch === '[') depth += 1
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1)
    else if (ch === ';' && depth === 0) {
      chunks.push(block.slice(start, i + 1))
      start = i + 1
    }
  }
  if (block.slice(start).trim() !== '') chunks.push(block.slice(start))
  return chunks
}

/** The custom property a declaration chunk sets, or null for a comment/blank chunk. */
function propertyOf(chunk) {
  const withoutComments = chunk.replace(/\/\*[\s\S]*?\*\//g, '')
  const match = /^\s*(--[A-Za-z0-9-]+)\s*:/.exec(withoutComments)
  return match === null ? null : match[1]
}

/**
 * The emitted `assets/site.css`: the package base with every look region removed but the chosen one,
 * whose declarations replace the base's colour declarations inside the one `:root` block. The result
 * carries each of the twelve colour tokens exactly once and no other `--c-*` name.
 * @param {string} source the package `assets/site.css`
 * @param {string} look the chosen look id
 * @returns {string} the emitted stylesheet
 */
export function composeSiteCss(source, look) {
  if (!LOOKS.includes(look)) throw new Error(`compose: "${look}" is not a look`)
  const text = String(source).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const regions = new Map()
  let stripped = ''
  let cursor = 0
  for (const match of text.matchAll(LOOK_REGION)) {
    const id = match[1]
    if (!LOOKS.includes(id)) throw new Error(`compose: site.css carries a region for the unknown look "${id}"`)
    if (regions.has(id)) throw new Error(`compose: site.css carries two /*@look ${id}*/ regions`)
    regions.set(id, match[2])
    stripped += text.slice(cursor, match.index)
    cursor = match.index + match[0].length
  }
  stripped += text.slice(cursor)
  if (/\/\*@(?:look|end)\b/.test(stripped)) throw new Error('compose: site.css leaves an unmatched /*@look*/ or /*@end*/ marker')
  if (look !== 'quiet' && !regions.has(look)) throw new Error(`compose: site.css carries no /*@look ${look}*/ region for the chosen look`)
  const root = findRootBlock(stripped)
  const declarationText = (regions.get(look) ?? '').trim()
  const regionProperties = new Set([...declarationText.matchAll(/(--[A-Za-z0-9-]+)\s*:/g)].map((match) => match[1]))
  const regionColours = [...regionProperties].filter((property) => property.startsWith('--c-'))
  // quiet's region is empty because its values ARE the base; a named look must carry all
  // twelve colour declarations, or the emitted sheet would silently keep quiet's colours.
  if (look !== 'quiet') {
    for (const token of COLOUR_TOKENS) {
      if (!regionProperties.has(token)) throw new Error(`compose: the /*@look ${look}*/ region does not declare ${token}`)
    }
  }
  const kept = splitDeclarations(stripped.slice(root.open + 1, root.close))
    .filter((chunk) => {
      const property = propertyOf(chunk)
      if (property === null) return true
      if (regionColours.length > 0 && property.startsWith('--c-')) return false
      return !regionProperties.has(property)
    })
    .join('')
    .trim()
  const inserted = declarationText === '' ? '' : `\n${declarationText}`
  const emitted = `${stripped.slice(0, root.open + 1)}\n${kept}${inserted}\n}${stripped.slice(root.close + 1)}`
  const emittedRoot = emitted.slice(findRootBlock(emitted).open + 1, findRootBlock(emitted).close)
  const properties = [...emittedRoot.matchAll(/(--c-[A-Za-z0-9-]+)\s*:/g)].map((match) => match[1])
  for (const token of COLOUR_TOKENS) {
    const count = properties.filter((property) => property === token).length
    if (count !== 1) throw new Error(`compose: the emitted :root carries ${token} ${count} times; every colour role is declared exactly once`)
  }
  for (const property of properties) {
    if (!COLOUR_TOKENS.includes(property)) throw new Error(`compose: the emitted :root carries the unknown colour token ${property}`)
  }
  return finalizeText(emitted)
}
