/**
 * The six looks' colour sets, derived from the package's own sheet.
 *
 * The values are **not** transcribed here: `src/assets/site.css` is the builder's source for the palette, and
 * its `:root` block carries Quiet's twelve colour roles plus one `/*@look <id>*\/ … /*@end*\/` region per named
 * look (the builder merges the chosen region into that block at compose time). This module reads the sheet and
 * merges the same way, so a palette edit reaches `look.tokens` without a second copy here going stale.
 *
 * `LOOK_STATED_RATIOS` and `STATED_RANGES` below are a different kind of number: they are the ratios and
 * extents the design states, and they exist to be checked — `check-page.mjs` recomputes all 36 stated
 * ratios and all 10 stated ranges against the derived table, so a sheet edit that moves a ratio fails a run.
 *
 * A derivation that cannot be made (the sheet is unreadable, a region is missing, a role is undeclared) leaves
 * `LOOK_TABLE_PROBLEM` set; `look.tokens` then answers `unchecked` with that reason rather than comparing
 * against an empty table.
 */
import { readFileSync } from 'node:fs'

import { COLOUR_TOKENS, LOOKS } from '../../lib/library.mjs'

const SHEET = new URL('../../assets/site.css', import.meta.url)

/** Every `--c-*` declaration in a slice of the sheet, first declaration winning, in sheet order. */
function colourDeclarations(text) {
  const found = new Map()
  for (const match of text.matchAll(/(--c-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    const name = match[1].toLowerCase()
    if (!found.has(name)) found.set(name, match[2].trim())
  }
  return found
}

function deriveLooks() {
  let source
  try {
    source = readFileSync(SHEET, 'utf8')
  } catch (error) {
    return { problem: `the package sheet could not be read: ${error instanceof Error ? error.message : String(error)}` }
  }
  const rootStart = source.indexOf(':root')
  if (rootStart < 0) return { problem: 'the package sheet carries no :root block to read the palette from' }
  const regions = new Map()
  for (const match of source.matchAll(/\/\*@look\s+([a-z0-9-]+)\s*\*\/\s*([\s\S]*?)\/\*@end\*\//g)) {
    regions.set(match[1], match[2])
  }
  const firstRegion = source.indexOf('/*@look')
  const base = colourDeclarations(source.slice(rootStart, firstRegion < 0 ? source.length : firstRegion))
  if (base.size === 0) return { problem: 'the package sheet’s :root block carries no colour declaration' }
  const looks = new Map()
  for (const id of LOOKS) {
    const merged = new Map(base)
    for (const [name, value] of colourDeclarations(regions.get(id) ?? '')) merged.set(name, value)
    const missing = COLOUR_TOKENS.filter((name) => !merged.has(name))
    if (missing.length > 0) {
      return { problem: `the package sheet’s ${id} look leaves ${missing.join(', ')} undeclared` }
    }
    looks.set(id, Object.fromEntries(COLOUR_TOKENS.map((name) => [name, merged.get(name)])))
  }
  return { looks }
}

const derived = deriveLooks()

/** Why the table could not be derived, or `undefined`. `look.tokens` answers `unchecked` when it is set. */
export const LOOK_TABLE_PROBLEM = derived.problem

/** The six looks' twelve colour roles, read from the package sheet at load. */
export const LOOK_COLOURS = derived.looks ?? new Map()

/**
 * The 36 stated ratios were recomputed and agree: per look ink/bg, muted/bg, accent/bg,
 * on-accent/accent, strong/bg (the five ratio columns stated) and muted/surface
 * (stated as the range 5.81–6.75, its endpoints Warm and Bold). The fixture asserts every one against a
 * recomputation from the derived table.
 */
export const LOOK_STATED_RATIOS = new Map([
  ['quiet', { inkBg: 17.77, mutedBg: 6.43, accentBg: 8.39, onAccentAccent: 8.39, strongBg: 3.18, mutedSurface: 5.95 }],
  ['editorial', { inkBg: 16.41, mutedBg: 6.76, accentBg: 7.10, onAccentAccent: 7.53, strongBg: 3.59, mutedSurface: 6.26 }],
  ['technical', { inkBg: 17.26, mutedBg: 6.79, accentBg: 7.26, onAccentAccent: 7.60, strongBg: 3.31, mutedSurface: 6.36 }],
  ['corporate', { inkBg: 16.70, mutedBg: 7.23, accentBg: 9.43, onAccentAccent: 10.02, strongBg: 3.45, mutedSurface: 6.74 }],
  ['bold', { inkBg: 19.16, mutedBg: 7.29, accentBg: 6.82, onAccentAccent: 6.82, strongBg: 3.33, mutedSurface: 6.75 }],
  ['warm', { inkBg: 16.31, mutedBg: 6.24, accentBg: 6.39, onAccentAccent: 6.72, strongBg: 3.52, mutedSurface: 5.81 }],
])

/** The stated extents, asserted by the same fixture. */
export const STATED_RANGES = {
  inkBg: { min: 16.31, max: 19.16 },
  mutedBg: { min: 6.24, max: 7.29 },
  accentBg: { min: 6.39, max: 9.43 },
  onAccentAccent: { min: 6.72, max: 10.02 },
  strongBg: { min: 3.18, max: 3.59 },
  mutedSurface: { min: 5.81, max: 6.75 },
  lineBg: { min: 1.25, max: 1.39 },
  accentSurface: { min: 5.95, max: 8.78 },
  bgSurface: { min: 1.07, max: 1.08 },
  strongSurface: { min: 2.94, max: 3.32 },
}
