/**
 * The document, landmark, heading and link gates: `html.parse` through `anchor.scheme`.
 *
 * Every tree gate runs through `withTree`: when `html.parse` could not read the document, the gate answers
 * `unchecked` with that reason — never `pass`. Gates that do not apply to this document's kind answer
 * `unchecked` with `not applicable: <kind>` (N/A is unchecked, never pass).
 */
import { byClass, byId, byTag, classesOf, isDescendantOf, attr, allElements, textOf } from '../../../lib/html.mjs'
import { LANG_PATTERN } from '../../../lib/library.mjs'
import { fail, list, notApplicable, pass, unchecked } from '../result.mjs'
import { headings, levelOf, withTree } from './shared.mjs'

export const htmlParse = {
  code: 'html.parse',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    if (facts.htmlProblem !== undefined) return unchecked(facts.htmlProblem)
    if (facts.html === undefined) return unchecked('the document was not read')
    if (facts.html.ok === true) return pass(`the document parses: ${facts.html.elements.length} element(s)`)
    if (facts.html.malformed === true) return fail(`malformed at offset ${facts.html.at}: ${facts.html.detail}`)
    return unchecked(`could not read the document at offset ${facts.html.at}: ${facts.html.detail}`)
  },
}

const treeRun = (code, appliesTo, run) => ({ code, appliesTo, instrument: 'static', run })
const treeGate = (code, appliesTo, run) => treeRun(code, appliesTo, (facts, context) => {
  const tree = withTree(facts, (value) => value)
  if (tree.ok === false) return unchecked(tree.detail)
  return run(tree.value, facts, context ?? {})
})

export const htmlLang = treeGate('html.lang', 'both', (tree) => {
  const html = byTag(tree.root, 'html')[0]
  if (html === undefined) return fail('the document carries no <html> element')
  const lang = attr(html, 'lang')
  if (lang === undefined || lang.trim() === '') return fail('<html> carries no lang')
  const value = lang.trim()
  if (!LANG_PATTERN.test(value)) return fail(`lang ${JSON.stringify(value)} is not a language tag`)
  return pass(`lang=${value}`)
})

export const htmlTitle = treeGate('html.title', 'both', (tree) => {
  const titles = byTag(tree.root, 'title')
  if (titles.length !== 1) return fail(`${titles.length} <title> elements; exactly one is required`)
  const text = titles[0].children.filter((child) => child.text !== undefined).map((child) => child.text).join(' ').replace(/\s+/g, ' ').trim()
  if (text === '') return fail('the title is empty')
  if (text.length > 120) return fail(`the title is ${text.length} characters; at most 120`)
  return pass(`title ${JSON.stringify(text.slice(0, 60))}${text.length > 60 ? '…' : ''}`)
})

export const htmlMain = treeGate('html.main', 'both', (tree, facts, context) => {
  const mains = byTag(tree.root, 'main')
  if (mains.length !== 1) return fail(`${mains.length} <main> elements; exactly one is required`)
  const main = mains[0]
  if (context.kind === 'deck') {
    const stage = byClass(tree.root, 'stage')[0]
    if (stage === undefined) return fail('the deck carries no .stage')
    if (!isDescendantOf(stage, main)) return fail('the .stage is not inside <main>')
    return pass('one <main> holding the stage')
  }
  const problems = []
  if (attr(main, 'id') !== 'main') problems.push(`<main> carries id ${JSON.stringify(attr(main, 'id'))}; "main" is required`)
  if (attr(main, 'tabindex') !== '-1') problems.push(`<main> carries tabindex ${JSON.stringify(attr(main, 'tabindex'))}; "-1" is required so the skip link's target can take focus`)
  for (const element of allElements(tree.root)) {
    if (!classesOf(element).has('s')) continue
    const type = (attr(element, 'class') ?? '').split(/\s+/).find((token) => /^s-[a-z]+$/.test(token))
    if (type === 's-header' || type === 's-footer') continue
    if (!isDescendantOf(element, main)) problems.push(`the section ${type ?? '(no s-<type> class)'} stands outside <main>`)
  }
  if (problems.length > 0) return fail(list(problems))
  return pass('one <main id="main" tabindex="-1"> holding every content section')
})

export const htmlH1 = treeGate('html.h1', 'both', (tree, facts, context) => {
  if (context.kind === 'deck') return notApplicable('deck', 'deck headings are per slide; see deck.heading')
  const h1s = byTag(tree.root, 'h1')
  if (h1s.length !== 1) return fail(`${h1s.length} <h1> elements; exactly one is required`)
  let cursor = h1s[0].parent
  while (cursor !== undefined && cursor !== null) {
    if (classesOf(cursor).has('s-hero')) return pass('one <h1>, inside the hero')
    cursor = cursor.parent
  }
  return fail('the <h1> is not inside the hero section; one headline belongs there')
})

export const htmlHeadingOrder = treeGate('html.headingOrder', 'both', (tree, facts, context) => {
  if (context.kind === 'deck') return notApplicable('deck', 'deck headings are per slide; see deck.heading')
  const all = headings(tree)
  if (all.length === 0) return fail('the document carries no heading')
  const problems = []
  let previous = 0
  for (const heading of all) {
    const level = levelOf(heading)
    if (level >= 4) problems.push(`<h${level}> at offset ${heading.start}; h4–h6 are not used — the page's heading scale stops at h3`)
    if (previous === 0 && level !== 1) problems.push(`the first heading is <h${level}>; the document starts at h1`)
    if (previous > 0 && level > previous + 1) problems.push(`<h${previous}> is followed by <h${level}>; no increase by more than one level`)
    previous = level
  }
  if (problems.length > 0) return fail(list(problems))
  return pass(`${all.length} headings start at h1 and increase by one level at a time`)
})

export const htmlAlt = treeGate('html.alt', 'both', (tree) => {
  const problems = []
  for (const image of byTag(tree.root, 'img')) {
    const alt = attr(image, 'alt')
    if (alt === undefined) { problems.push(`<img> at offset ${image.start} carries no alt`); continue }
    if (alt === '' && !hasAriaHidden(image)) problems.push(`<img> at offset ${image.start} carries alt="" outside aria-hidden="true"`)
  }
  for (const element of allElements(tree.root)) {
    if ((attr(element, 'role') ?? '') !== 'img') continue
    const label = attr(element, 'aria-label')
    if (label === undefined || label.trim() === '') problems.push(`role="img" at offset ${element.start} carries no aria-label`)
  }
  if (problems.length > 0) return fail(list(problems))
  return pass('every image carries its alt text; inert on a clean MVP build because no image is emitted')
})

function hasAriaHidden(element) {
  let cursor = element
  while (cursor !== undefined && cursor !== null) {
    if ((attr(cursor, 'aria-hidden') ?? '').trim().toLowerCase() === 'true') return true
    cursor = cursor.parent
  }
  return false
}

export const htmlId = treeGate('html.id', 'both', (tree) => {
  const problems = []
  const seen = new Map()
  for (const element of allElements(tree.root)) {
    const id = attr(element, 'id')
    if (id === undefined) continue
    if (id.trim() === '') { problems.push(`an element at offset ${element.start} carries an empty id`); continue }
    if (seen.has(id)) problems.push(`the id ${JSON.stringify(id)} appears twice (offset ${seen.get(id)} and ${element.start})`)
    else seen.set(id, element.start)
  }
  for (const element of allElements(tree.root)) {
    if (!classesOf(element).has('s')) continue
    const id = attr(element, 'id')
    if (id === undefined) continue
    if (!/^s-[a-z]+(-\d+)?$/.test(id)) problems.push(`the section id ${JSON.stringify(id)} does not match s-<type> or s-<type>-<n>`)
  }
  if (problems.length > 0) return fail(list(problems))
  return pass(`${seen.size} unique id(s), every section id in s-<type> form`)
})

function focusablesIn(body) {
  const found = []
  for (const element of allElements(body)) {
    const tag = element.tag
    if (tag === 'a' && attr(element, 'href') !== undefined) { found.push(element); continue }
    if (tag === 'button' || tag === 'select' || tag === 'textarea') { found.push(element); continue }
    if (tag === 'input' && (attr(element, 'type') ?? '').toLowerCase() !== 'hidden') { found.push(element); continue }
    const tabindex = attr(element, 'tabindex')
    if (tabindex !== undefined && Number.isFinite(Number(tabindex)) && Number(tabindex) >= 0) found.push(element)
  }
  return found
}

export const htmlSkip = treeGate('html.skip', 'both', (tree, facts, context) => {
  const skips = allElements(tree.root).filter((element) => classesOf(element).has('skip') || (element.tag === 'a' && attr(element, 'href') === '#main'))
  if (context.kind === 'deck') {
    if (skips.length > 0) return fail(`the deck carries ${skips.length} skip link(s); a deck has none — its slides are one stage, not a document with landmarks`)
    return pass('the deck carries no skip link')
  }
  const body = byTag(tree.root, 'body')[0]
  if (body === undefined) return fail('the document carries no <body>')
  const focusables = focusablesIn(body)
  if (focusables.length === 0) return fail('the body carries no focusable element')
  const first = focusables[0]
  const problems = []
  if (!classesOf(first).has('skip')) problems.push(`the first focusable element is <${first.tag}>, not the skip link`)
  if (attr(first, 'href') !== '#main') problems.push(`the skip link points at ${JSON.stringify(attr(first, 'href'))}, not #main`)
  if (textOf(first) === '') problems.push('the skip link carries no text')
  const main = byTag(tree.root, 'main')[0]
  if (main !== undefined && isDescendantOf(first, main)) problems.push('the skip link stands inside <main>')
  if (problems.length > 0) return fail(list(problems))
  return pass('the first focusable element is a.skip[href="#main"] with text, before <main>')
})

function landmarkGate({ code, tag, sectionClass, role, label }) {
  return treeGate(code, 'page', (tree, facts, context) => {
    const landmarks = byTag(tree.root, tag)
    const problems = []
    if (landmarks.length !== 1) {
      problems.push(`${landmarks.length} <${tag}> elements; exactly one ${label} landmark is required`)
    } else {
      const landmark = landmarks[0]
      if (landmark.parent?.tag !== 'body') problems.push(`the <${tag}> is not a direct child of <body>`)
      const main = byTag(tree.root, 'main')[0]
      if (main !== undefined && isDescendantOf(landmark, main)) problems.push(`the <${tag}> stands inside <main>`)
      if (byClass(landmark, sectionClass).length === 0) problems.push(`the <${tag}> does not contain .${sectionClass}`)
    }
    const roleHolders = allElements(tree.root).filter((element) => (attr(element, 'role') ?? '') === role)
    if (roleHolders.length > 1 || (roleHolders.length === 1 && roleHolders[0] !== landmarks[0])) {
      problems.push(`${roleHolders.length} element(s) carry role="${role}"; only the one <${tag}> may`)
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`one <${tag}> landmark holding .${sectionClass}, no second role="${role}"`)
  })
}

export const landmarksHeader = landmarkGate({ code: 'landmarks.header', tag: 'header', sectionClass: 's-header', role: 'banner', label: 'header' })
export const landmarksFooter = landmarkGate({ code: 'landmarks.footer', tag: 'footer', sectionClass: 's-footer', role: 'contentinfo', label: 'footer' })

export const landmarksDeck = treeGate('landmarks.deck', 'deck', (tree, facts, context) => {
  const problems = []
  const tags = [...byTag(tree.root, 'header'), ...byTag(tree.root, 'footer')]
  if (tags.length > 0) problems.push(`${tags.length} <header>/<footer> element(s) in the deck; a deck carries none`)
  const skips = allElements(tree.root).filter((element) => classesOf(element).has('skip') || (element.tag === 'a' && attr(element, 'href') === '#main'))
  if (skips.length > 0) problems.push(`${skips.length} skip link(s) in the deck`)
  const roles = allElements(tree.root).filter((element) => ['banner', 'contentinfo'].includes((attr(element, 'role') ?? '').trim()))
  if (roles.length > 0) problems.push(`${roles.length} banner/contentinfo role(s) in the deck`)
  if (problems.length > 0) return fail(list(problems))
  return pass('no page header, footer, skip link or banner/contentinfo role in the deck')
})

const HREF_HTTP = /^https?:\/\/[^\s]+$/i

export const anchorScheme = treeGate('anchor.scheme', 'both', (tree) => {
  const problems = []
  const anchors = byTag(tree.root, 'a')
  for (const anchor of anchors) {
    const href = attr(anchor, 'href')
    const text = (anchor.children ?? []).filter((child) => child.text !== undefined).map((child) => child.text).join(' ').replace(/\s+/g, ' ').trim()
    if (text === '') problems.push(`the anchor at offset ${anchor.start} carries no text`)
    if (href === undefined) { problems.push(`the anchor at offset ${anchor.start} carries no href`); continue }
    const value = href.trim()
    if (value === '') { problems.push(`the anchor at offset ${anchor.start} carries an empty href`); continue }
    /* The shell's own skip anchor is contract-fixed markup (`a.skip[href="#main"]`). */
    if (classesOf(anchor).has('skip') && value === '#main') continue
    if (HREF_HTTP.test(value)) continue
    if (/^mailto:\S+$/i.test(value)) continue
    if (value.startsWith('#')) {
      const id = value.slice(1)
      if (!/^s-[a-z]+(-\d+)?$/.test(id)) { problems.push(`the anchor href ${JSON.stringify(value)} is not a #s-<type> section reference`); continue }
      if (byId(tree.root, id) === undefined) { problems.push(`the anchor href ${JSON.stringify(value)} names no emitted id`); continue }
      continue
    }
    problems.push(`the anchor href ${JSON.stringify(value)} is neither http(s), mailto: nor #s-<type>`)
  }
  for (const element of allElements(tree.root)) {
    const classes = classesOf(element)
    if (!classes.has('s-header__brand') && !classes.has('s-footer__brand')) continue
    let cursor = element
    let wrapped = false
    while (cursor !== undefined && cursor !== null) {
      if (cursor.tag === 'a') { wrapped = true; break }
      cursor = cursor.parent
    }
    if (wrapped) problems.push('the wordmark is inside an <a>; the brand is a mark, not a link')
  }
  if (problems.length > 0) return fail(list(problems))
  return pass(`${anchors.length} anchor(s) resolve: http(s), mailto: or an emitted #s-<type>`)
})
