/**
 * The page-level gates: `layout.noCenter`, `colour.only`, `link.cue`, `annotation.bans`, `surface.band`.
 */
import { lastCompound, selectorParts, targetsAnchor } from '../../../lib/css.mjs'
import { allElements, attr, classesOf, closestClass, insideTag, sectionType, sectionsOf, textOf } from '../../../lib/html.mjs'
import { LOOK_BAND, NUMBERED_LOOKS } from '../../../lib/library.mjs'
import { fail, list, pass, unchecked } from '../result.mjs'
import { withTree } from './shared.mjs'

/** The section types the document renders, in order. */
function pageSectionTypes(tree) {
  return sectionsOf(tree.root).map((element) => sectionType(element))
}

/** True when a compound selector carries the `num` class (the one `.num` right-aligned role). */
function carriesNum(compound) {
  return /\.num(?![-\w])/.test(compound)
}

export const layoutNoCenter = {
  code: 'layout.noCenter',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const problems = []
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      for (const rule of scan.rules) {
        const align = rule.declarations.get('text-align')
        if (align === undefined) continue
        const value = align.trim().toLowerCase()
        if (value === 'center' || value === '-webkit-center') {
          problems.push(`${path}: ${rule.selector} { text-align: ${value} }`)
        } else if (value === 'right') {
          const parts = selectorParts(rule.selector)
          if (!parts.every((part) => carriesNum(lastCompound(part)))) {
            problems.push(`${path}: ${rule.selector} { text-align: right } outside .num`)
          }
        }
      }
    }
    const tree = withTree(facts, (value) => {
      const found = []
      const brs = allElements(value.root).filter((element) => element.tag === 'br')
      if (brs.length > 0) found.push(`${brs.length} <br> element(s)`)
      const centers = allElements(value.root).filter((element) => element.tag === 'center')
      if (centers.length > 0) found.push(`${centers.length} <center> element(s)`)
      return found
    })
    if (tree.ok === false) return unchecked(tree.detail)
    problems.push(...tree.value)
    if (problems.length > 0) return fail(list(problems))
    return pass('no centred text, no <br>, no <center>; text-align: right only on .num')
  },
}

export const colourOnly = {
  code: 'colour.only',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => {
      const problems = []
      for (const element of allElements(value.root)) {
        if (!classesOf(element).has('status')) continue
        const word = textOf(element)
        const label = attr(element, 'aria-label')
        const title = attr(element, 'title')
        const carries = word !== '' || (label !== undefined && label.trim() !== '') || (title !== undefined && title.trim() !== '')
        if (!carries) problems.push(`a .status element at offset ${element.start} carries no word (text, aria-label or title)`)
      }
      return problems
    })
    if (tree.ok === false) return unchecked(tree.detail)
    if (tree.value.length > 0) return fail(list(tree.value))
    return pass('every .status element carries a word')
  },
}

export const linkCue = {
  code: 'link.cue',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    let scanned = 0
    const problems = []
    let restingUnderline = false
    const stateLimited = /:(hover|focus|focus-visible|active|visited)\b/
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      scanned += 1
      for (const rule of scan.rules) {
        const parts = selectorParts(rule.selector).filter(targetsAnchor)
        if (parts.length === 0) continue
        const decoration = rule.declarations.get('text-decoration') ?? rule.declarations.get('text-decoration-line')
        if (decoration === undefined) continue
        const value = decoration.trim().toLowerCase()
        if (/\bnone\b/.test(value)) problems.push(`${path}: ${rule.selector} removes the anchor underline`)
        if (/\bunderline\b/.test(value) && parts.some((part) => !stateLimited.test(part))) restingUnderline = true
      }
    }
    if (scanned === 0) return unchecked('the folder carries no CSS to read')
    if (!restingUnderline) problems.push('no anchor rule declares text-decoration: underline')
    if (problems.length > 0) return fail(list(problems))
    return pass('an anchor rule declares the underline and none removes it')
  },
}

const HUD_TOKENS = [
  ['FIG', /\bFIG\b/],
  ['SYS.', /\bSYS\./],
  ['REF', /\bREF\b/],
  ['0x', /\b0x[0-9a-fA-F]+\b/],
  ['LIVE', /\bLIVE\b/],
]

/** Data contexts where a two-digit number is a value, not a decorative ordinal. */
const DATA_CONTEXT_TAGS = new Set(['td', 'th', 'dd', 'dt'])

function ordinalProblems(tree, look) {
  const problems = []
  let undecidable = undefined
  const candidates = []
  for (const element of allElements(tree.root)) {
    const text = textOf(element)
    if (!/^\d{2}$/.test(text)) continue
    /* Keep the innermost element carrying the whole ordinal: a wrapper around it is the same number. */
    const hasChildCarrying = (element.children ?? []).some((child) => child.text === undefined && /^\d{2}$/.test(textOf(child)))
    if (!hasChildCarrying) candidates.push({ element, text })
  }
  for (const { element, text } of candidates) {
    if (DATA_CONTEXT_TAGS.has(element.tag) || insideTag(element, 'table') || [...DATA_CONTEXT_TAGS].some((tag) => insideTag(element, tag))) continue
    const timeline = closestClass(element, 's-timeline')
    if (timeline !== undefined) continue
    const slide = closestClass(element, 'slide')
    /* A number on a genuinely sequenced item is not the banned decorative counter (timeline and
       steps; the deck's `points` items are the same kind of sequence and carry the same free-text label). */
    if (slide !== undefined && ['steps', 'points'].includes(attr(slide, 'data-layout'))) continue
    const annotation = closestAnn(element)
    if (annotation !== undefined) {
      if (look === undefined) {
        undecidable = `a section number ${text} stands in the document but the record names no look, so whether the look carries section numbers cannot be decided`
        continue
      }
      if (!NUMBERED_LOOKS.includes(look)) problems.push(`a section number ${text} stands in a ${look} page; section numbers belong to editorial and technical only`)
      continue
    }
    problems.push(`a bare two-digit ordinal ${text} outside timeline/steps at offset ${element.start}`)
  }
  return { problems, undecidable }
}

function closestAnn(element) {
  let cursor = element
  while (cursor !== undefined && cursor !== null) {
    for (const token of classesOf(cursor)) {
      if (token === 'ann' || token.startsWith('ann--')) return cursor
    }
    cursor = cursor.parent
  }
  return undefined
}

export const annotationBans = {
  code: 'annotation.bans',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const problems = []
    const text = tree.value.text
    for (const [name, pattern] of HUD_TOKENS) {
      const match = pattern.exec(text)
      if (match !== null) problems.push(`the fake-HUD token ${JSON.stringify(match[0])} (${name}) stands in the copy`)
    }
    const emoji = /\p{Extended_Pictographic}/u.exec(text)
    if (emoji !== null) problems.push(`an emoji ${JSON.stringify(emoji[0])} stands in the copy; the only non-text mark is the status mark`)
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      for (const rule of scan.rules) {
        if (/::first-letter\b/i.test(rule.selector)) problems.push(`${path}: ${rule.selector} draws a drop cap`)
        if (/\b(barcode|drop-?cap)\b/i.test(rule.selector)) problems.push(`${path}: ${rule.selector} names a banned ornament`)
      }
    }
    for (const element of allElements(tree.value.root)) {
      const className = attr(element, 'class') ?? ''
      if (/\b(barcode|drop-?cap)\b|\bqr\b/i.test(className)) problems.push(`the element at offset ${element.start} carries the banned ornament class ${JSON.stringify(className)}`)
    }
    const ordinals = ordinalProblems(tree.value, facts.record?.look)
    problems.push(...ordinals.problems)
    if (problems.length > 0) return fail(list(problems))
    if (ordinals.undecidable !== undefined) return unchecked(ordinals.undecidable)
    return pass('no fake-HUD token, emoji, drop cap, barcode or misplaced ordinal')
  },
}

export const surfaceBand = {
  code: 'surface.band',
  appliesTo: 'page',
  instrument: 'static',
  run(facts, context) {
    const look = facts.record?.look
    const wantsBand = LOOK_BAND[look]
    if (wantsBand === undefined) return unchecked(`the record names no look this reader knows: ${JSON.stringify(look)}`)
    const tree = withTree(facts, (value) => {
      const bands = allElements(value.root).filter((element) => attr(element, 'data-band') === 'surface')
      const fields = allElements(value.root).filter((element) => classesOf(element).has('field'))
      return { bands, fields, types: pageSectionTypes(value) }
    })
    if (tree.ok === false) return unchecked(tree.detail)
    const { bands, fields, types } = tree.value
    const problems = []
    const carriesCta = types.includes('cta')
    if (bands.length > 1) problems.push(`${bands.length} [data-band="surface"] elements; at most one is allowed`)
    if (wantsBand && bands.length !== 1) problems.push(`the ${look} look carries a band rule but the page has ${bands.length}`)
    if (!wantsBand && bands.length !== 0) problems.push(`the ${look} look carries no band but the page has ${bands.length}`)
    /* At most one filled field is allowed, and the field lives on the cta; the article recipe has no cta
       ("an article does not sell"), so zero fields is the article's clean state. */
    if (!carriesCta) {
      if (fields.length > 0) problems.push(`the page carries no cta section but ${fields.length} .field element(s)`)
    } else if (fields.length !== 1) {
      problems.push(`the .field class appears ${fields.length} times; exactly one, on the cta section`)
    } else {
      const field = fields[0]
      const own = sectionType(field)
      const ancestor = closestSection(field)
      const onCta = own === 'cta' || ancestor?.type === 'cta'
      if (!onCta) problems.push('the .field class is not on the cta section')
    }
    if (problems.length > 0) return fail(list(problems))
    const fieldNote = carriesCta ? 'one cta field' : 'no cta field (an article carries no cta)'
    return pass(wantsBand ? `one surface band, ${fieldNote} (${look})` : `no surface band in the ${look} look, ${fieldNote}`)
  },
}

function closestSection(element) {
  let cursor = element.parent
  while (cursor !== undefined && cursor !== null) {
    const type = sectionType(cursor)
    if (type !== undefined) return { element: cursor, type }
    cursor = cursor.parent
  }
  return undefined
}
