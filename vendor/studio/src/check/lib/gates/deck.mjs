/**
 * The deck's static gates: `deck.slides`, `deck.heading`, `deck.counter`, `deck.keys` and `deck.fullscreen`.
 *
 * The static half proves the declaration; the computed half (`deck.fit`, `deck.lines`, `type.body`) is
 * `studio_shot`'s, and neither may answer `pass` for the other.
 */
import { attr, byClass, byId, byTag, classesOf, isDescendantOf } from '../../../lib/html.mjs'
import { scriptOf } from '../folder.mjs'
import { fail, list, pass, unchecked } from '../result.mjs'
import { levelOf, withTree } from './shared.mjs'

const KEY_LITERALS = [
  ['ArrowRight', /ArrowRight/],
  ['ArrowDown', /ArrowDown/],
  ['PageDown', /PageDown/],
  ['Space', /(['"`] ['"`])|\bSpace\b|event\.key === ' '/],
  ['ArrowLeft', /ArrowLeft/],
  ['ArrowUp', /ArrowUp/],
  ['PageUp', /PageUp/],
  ['Home', /Home/],
  ['End', /End/],
  ['f/F', /(['"`][fF]['"`])|\btoLowerCase\(\)\s*===\s*['"`]f['"`]/],
]

function slidesIn(tree) {
  const stage = byClass(tree.root, 'stage')[0]
  if (stage === undefined) return { stage: undefined, slides: [] }
  const slides = byClass(tree.root, 'slide').filter((slide) => isDescendantOf(slide, stage))
  return { stage, slides }
}

export const deckSlides = {
  code: 'deck.slides',
  appliesTo: 'deck',
  instrument: 'static',
  run(facts, context) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const { stage, slides } = slidesIn(tree.value)
    if (stage === undefined) return fail('the deck carries no .stage')
    const problems = []
    if (slides.length < 5 || slides.length > 9) problems.push(`${slides.length} .slide elements; a deck carries 5–9`)
    for (const slide of slides) {
      const labelled = attr(slide, 'aria-labelledby')
      if (labelled === undefined || labelled.trim() === '') {
        problems.push(`the slide at offset ${slide.start} carries no aria-labelledby`)
        continue
      }
      const target = byId(tree.value.root, labelled.trim())
      if (target === undefined) problems.push(`the slide at offset ${slide.start} is labelled by ${JSON.stringify(labelled)}, which names no id`)
      else if (levelOf(target) === undefined) problems.push(`the slide at offset ${slide.start} is labelled by ${JSON.stringify(labelled)}, which is not a heading`)
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`${slides.length} slides in .stage, each labelled by its heading`)
  },
}

export const deckHeading = {
  code: 'deck.heading',
  appliesTo: 'deck',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const { slides } = slidesIn(tree.value)
    if (slides.length === 0) return fail('the deck carries no .slide')
    const problems = []
    slides.forEach((slide, index) => {
      const headings = descendantsOf(slide).filter((element) => levelOf(element) !== undefined)
      if (headings.length !== 1) {
        problems.push(`slide ${index + 1} carries ${headings.length} headings; exactly one is required`)
        return
      }
      const level = levelOf(headings[0])
      if (index === 0 && level !== 1) problems.push(`slide 1's heading is <h${level}>; the deck's only h1 must stand there`)
      if (index > 0 && level !== 2) problems.push(`slide ${index + 1}'s heading is <h${level}>; every slide after the first is h2`)
    })
    const h1s = descendantsOf(tree.value.root).filter((element) => element.tag === 'h1')
    if (h1s.length !== 1) problems.push(`${h1s.length} <h1> elements in the deck; exactly one is required`)
    if (problems.length > 0) return fail(list(problems))
    return pass(`${slides.length} slides, one heading each, one h1 on slide 1`)
  },
}

function descendantsOf(element) {
  const found = []
  const walk = (node) => {
    for (const child of node.children ?? []) {
      if (child.text !== undefined) continue
      found.push(child)
      walk(child)
    }
  }
  walk(element)
  return found
}

export const deckCounter = {
  code: 'deck.counter',
  appliesTo: 'deck',
  instrument: 'static',
  run(facts) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const { slides } = slidesIn(tree.value)
    const counters = byClass(tree.value.root, 'deck-counter')
    if (counters.length !== 1) return fail(`${counters.length} .deck-counter elements; exactly one is required`)
    const counter = counters[0]
    const text = textOfElement(counter)
    const problems = []
    if (!/^\d{2} \/ \d{2}$/.test(text)) {
      problems.push(`the counter reads ${JSON.stringify(text)}; the format is two zero-padded numbers around " / " (e.g. 03 / 07)`)
    } else {
      const total = Number(text.split(' / ')[1])
      if (total !== slides.length) problems.push(`the counter's second number is ${total} but the deck carries ${slides.length} slides`)
    }
    if (!classesOf(counter).has('t-label')) problems.push('the counter does not carry the label role class t-label')
    for (const ancestor of ancestorsOf(counter)) {
      if (attr(ancestor, 'aria-live') !== undefined) problems.push('the counter or an ancestor carries aria-live; the deck has no live region')
    }
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      for (const rule of scan.rules) {
        if (!rule.selector.includes('.deck-counter')) continue
        for (const name of rule.declarations.keys()) {
          if (name === 'animation' || name.startsWith('animation-')) problems.push(`${path}: ${rule.selector} animates the counter`)
        }
      }
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`the counter reads ${text}, carries t-label, has no live region and no animation`)
  },
}

function textOfElement(element) {
  const parts = []
  const walk = (node) => {
    if (node.text !== undefined) { parts.push(node.text); return }
    for (const child of node.children ?? []) walk(child)
  }
  for (const child of element.children ?? []) walk(child)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function ancestorsOf(element) {
  const found = []
  let cursor = element.parent
  while (cursor !== undefined && cursor !== null) { found.push(cursor); cursor = cursor.parent }
  return found
}

export const deckKeys = {
  code: 'deck.keys',
  appliesTo: 'deck',
  instrument: 'static',
  run(facts) {
    const script = scriptOf(facts, 'assets/present.js')
    if (!script.ok) return unchecked(script.detail)
    const problems = []
    if (!/\bkeydown\b/.test(script.text)) problems.push('present.js registers no keydown listener')
    for (const [name, pattern] of KEY_LITERALS) {
      if (!pattern.test(script.text)) problems.push(`present.js handles no ${name}`)
    }
    if (!/\bpreventDefault\s*\(/.test(script.text)) problems.push('present.js never calls preventDefault')
    if (problems.length > 0) return fail(list(problems))
    return pass('a keydown listener, the ten key literals and preventDefault stand in present.js')
  },
}

export const deckFullscreen = {
  code: 'deck.fullscreen',
  appliesTo: 'deck',
  instrument: 'static',
  run(facts) {
    const script = scriptOf(facts, 'assets/present.js')
    if (!script.ok) return unchecked(script.detail)
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const problems = []
    if (!/\brequestFullscreen\s*\(/.test(script.text)) problems.push('present.js never calls requestFullscreen')
    for (const button of byTag(tree.value.root, 'button')) {
      const label = textOfElement(button)
      if (/full\s*screen/i.test(label)) problems.push(`a fullscreen button stands in the document (${JSON.stringify(label)}); F is the only fullscreen door`)
    }
    for (const element of byClass(tree.value.root, 'deck-controls')[0] === undefined ? [] : descendantsOf(byClass(tree.value.root, 'deck-controls')[0])) {
      if (/fullscreen/i.test(attr(element, 'class') ?? '')) problems.push('a fullscreen control stands inside .deck-controls')
    }
    if (problems.length > 0) return fail(list(problems))
    return pass('present.js calls requestFullscreen and the document carries no fullscreen button')
  },
}
