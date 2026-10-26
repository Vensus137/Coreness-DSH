/**
 * The in-page measurement sources. Each function is serialised by source and evaluated inside the
 * page, so it must stay self-contained: no import, no closure, nothing but its argument and the DOM.
 */

function inPageMeasure(options) {
  const deck = Boolean(options && options.deck)
  const describe = (element) => {
    if (!element) return 'null'
    let text = element.tagName.toLowerCase()
    if (element.id) text += '#' + element.id
    const classes = (element.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3)
    if (classes.length > 0) text += '.' + classes.join('.')
    return text
  }
  const snippet = (value) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 60)
  const textOf = (element) => snippet(element ? element.textContent : '')
  const parseColor = (value) => {
    const match = /^rgba?\(([^)]+)\)$/i.exec(String(value || '').trim())
    if (!match) return null
    const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    if (parts.length < 3 || parts.slice(0, 3).some((number) => !Number.isFinite(number))) return null
    const alpha = parts.length > 3 && Number.isFinite(parts[3]) ? parts[3] : 1
    return { r: parts[0], g: parts[1], b: parts[2], a: alpha }
  }
  const round = (number) => Math.round(number * 100) / 100
  const formatColor = (color) => (color ? `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})` : 'unknown')
  const linear = (channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  }
  const luminance = (color) => 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b)
  const contrast = (first, second) => {
    const a = luminance(first)
    const b = luminance(second)
    const high = Math.max(a, b)
    const low = Math.min(a, b)
    return (high + 0.05) / (low + 0.05)
  }
  const blend = (source, destination) => ({
    r: source.a * source.r + (1 - source.a) * destination.r,
    g: source.a * source.g + (1 - source.a) * destination.g,
    b: source.a * source.b + (1 - source.a) * destination.b,
    a: 1,
  })
  const parsePx = (value) => {
    const number = parseFloat(value)
    return Number.isFinite(number) ? number : null
  }
  const rendered = (element) => {
    try {
      if (typeof element.checkVisibility === 'function') {
        return element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      }
      return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    } catch {
      return true
    }
  }
  const pageCanvas = (() => {
    const body = document.body ? parseColor(getComputedStyle(document.body).backgroundColor) : null
    if (body && body.a > 0) return body
    const root = parseColor(getComputedStyle(document.documentElement).backgroundColor)
    return root && root.a > 0 ? root : { r: 255, g: 255, b: 255, a: 1 }
  })()
  const hitStack = (element) => {
    if (typeof document.elementsFromPoint !== 'function') return null
    const rect = element.getBoundingClientRect()
    if (!(rect.width > 0 && rect.height > 0)) return null
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return null
    const x = Math.min(Math.max(rect.left + Math.min(rect.width / 2, 40), 0), window.innerWidth - 1)
    const y = Math.min(Math.max(rect.top + rect.height / 2, 0), window.innerHeight - 1)
    try {
      const stack = document.elementsFromPoint(x, y)
      return Array.isArray(stack) && stack.length > 0 ? stack : null
    } catch {
      return null
    }
  }
  // An element's background is what is painted beneath it, not only what its ancestors declare: the
  // deck's chrome sits over an overlapping slide, and that slide is the surface the eye reads.
  const ancestorBackground = (element) => {
    const layers = []
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        return { image: style.backgroundImage, selector: describe(node), color: null }
      }
      const color = parseColor(style.backgroundColor)
      if (color && color.a > 0) {
        layers.push(color)
        if (color.a >= 1) break
      }
    }
    let background = { r: 255, g: 255, b: 255, a: 1 }
    for (let index = layers.length - 1; index >= 0; index -= 1) background = blend(layers[index], background)
    return { color: background, image: null }
  }
  const effectiveBackground = (element) => {
    const stack = hitStack(element)
    if (!stack) return ancestorBackground(element)
    const layers = []
    let image = null
    let imageIndex = -1
    let opaqueIndex = -1
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      const style = getComputedStyle(stack[index])
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        image = { selector: describe(stack[index]), value: style.backgroundImage }
        imageIndex = layers.length
      }
      const color = parseColor(style.backgroundColor)
      if (color && color.a > 0) {
        layers.push(color)
        if (color.a >= 1) opaqueIndex = layers.length - 1
      }
    }
    if (image && imageIndex > opaqueIndex) return { color: null, image: image.value, selector: image.selector }
    let background = { r: 255, g: 255, b: 255, a: 1 }
    for (let index = layers.length - 1; index >= 0; index -= 1) background = blend(layers[index], background)
    return { color: background, image: null }
  }
  const sameColor = (first, second) =>
    Boolean(first && second) &&
    Math.abs(first.r - second.r) <= 1 &&
    Math.abs(first.g - second.g) <= 1 &&
    Math.abs(first.b - second.b) <= 1
  // The ring belongs to the surface under the control: the field's own text colour on a filled field,
  // the ink colour on paper and on a surface band.
  const ringSurface = (element) => {
    const stack = hitStack(element)
    if (stack) {
      for (const node of stack) {
        const style = getComputedStyle(node)
        const color = parseColor(style.backgroundColor)
        if (!color || color.a < 1) continue
        if (node === document.body || node === document.documentElement || sameColor(color, pageCanvas)) {
          return { expected: ink, surface: null }
        }
        const surface = getComputedStyle(node)
        return { expected: parseColor(surface.color), surface: describe(node) }
      }
      return { expected: ink, surface: null }
    }
    const field = element.closest('.field')
    if (field) return { expected: parseColor(getComputedStyle(field).color), surface: describe(field) }
    return { expected: ink, surface: null }
  }

  // The document's own facts, so a walk that measured nothing can be told apart from a page that
  // genuinely carries no text or no target: the answer comes from the document, not from the walker.
  const bodyText = document.body ? String(document.body.innerText || '').trim() : ''
  const targetSelector = 'a[href], button, [role="button"], input, select, textarea'
  const documentCandidates = document.querySelectorAll(targetSelector).length
  const documentRead = {
    bodyTextLength: bodyText.length,
    bodyElementCount: document.body ? document.body.querySelectorAll('*').length : 0,
  }

  // Contrast: every visible text node against its effective background.
  const contrastResult = { checked: 0, violations: [], unmeasured: [], worst: null, document: { textLength: bodyText.length } }
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT)
  let textNode = walker.nextNode()
  while (textNode) {
    const text = snippet(textNode.nodeValue)
    const parent = textNode.parentElement
    textNode = walker.nextNode()
    if (!text || !parent) continue
    const tag = parent.tagName
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE' || tag === 'TITLE') continue
    if (!rendered(parent)) continue
    const style = getComputedStyle(parent)
    const foreground = parseColor(style.color)
    if (!foreground) {
      contrastResult.unmeasured.push({ selector: describe(parent), reason: 'unparseable colour ' + style.color })
      continue
    }
    const background = effectiveBackground(parent)
    if (!background.color) {
      contrastResult.unmeasured.push({ selector: describe(parent), reason: 'a background image intervenes: ' + background.image })
      continue
    }
    const composed = foreground.a < 1 ? blend(foreground, background.color) : foreground
    const size = parsePx(style.fontSize) || 0
    const weight = Number(style.fontWeight) || (style.fontWeight === 'bold' ? 700 : 400)
    const large = size >= 24 || (size >= 18.66 && weight >= 700)
    const threshold = large ? 3 : 4.5
    const ratio = contrast(composed, background.color)
    contrastResult.checked += 1
    const pair = {
      ratio: round(ratio),
      threshold,
      foreground: formatColor(composed),
      background: formatColor(background.color),
      fontSize: round(size),
      fontWeight: weight,
      selector: describe(parent),
      text,
    }
    if (contrastResult.worst === null || pair.ratio < contrastResult.worst.ratio) contrastResult.worst = pair
    if (ratio + 1e-9 < threshold) contrastResult.violations.push(pair)
  }
  contrastResult.violations.sort((a, b) => a.ratio - b.ratio)

  // Target size: layout border box in CSS px (transforms do not shrink the target).
  const targetResult = { controls: [], links: [], exemptInline: 0, failures: [], document: { candidates: documentCandidates, ...documentRead } }
  const inlineInSentence = (element) => {
    const display = getComputedStyle(element).display
    if (!/^inline($|-)/.test(display)) return false
    const parent = element.parentElement
    if (!parent) return false
    for (const child of parent.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && snippet(child.nodeValue)) return true
    }
    return false
  }
  const targetCandidates = Array.prototype.slice
    .call(document.querySelectorAll(targetSelector))
    .filter((element) => element.tagName !== 'INPUT' || element.type !== 'hidden')
    .filter(rendered)
  for (const element of targetCandidates) {
    const box = { selector: describe(element), width: element.offsetWidth, height: element.offsetHeight }
    if (element.tagName === 'A') {
      if (inlineInSentence(element)) {
        targetResult.exemptInline += 1
        continue
      }
      targetResult.links.push(box)
      if (box.height < 44 - 0.5) targetResult.failures.push({ ...box, group: 'link', required: 'height >= 44 CSS px (a page link outside a sentence)' })
    } else {
      targetResult.controls.push(box)
      if (box.width < 44 - 0.5 || box.height < 44 - 0.5) {
        targetResult.failures.push({ ...box, group: 'control', required: '44 x 44 CSS px (a button or a control)' })
      }
    }
  }

  const insideScrollRegion = (element) => {
    for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node)
      const overflowX = style.overflowX || style.overflow
      if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden' || overflowX === 'clip') return true
    }
    return false
  }
  // Horizontal overflow: the document's own scroll extent, and every rect beyond the viewport that is
  // not inside a horizontal scroll region — content scrolling in its own labelled region is the design's
  // deliberate pattern, not the page overflowing.
  const documentElement = document.documentElement
  const overflowResult = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: documentElement.scrollWidth,
    clientWidth: documentElement.clientWidth,
    scrollOverflow: documentElement.scrollWidth > documentElement.clientWidth,
    scrollRegions: 0,
    offenders: [],
  }
  const all = document.querySelectorAll('*')
  for (const element of all) {
    if (!rendered(element)) continue
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.right > window.innerWidth + 1) {
      if (insideScrollRegion(element)) {
        overflowResult.scrollRegions += 1
        continue
      }
      overflowResult.offenders.push({ selector: describe(element), right: round(rect.right), width: round(rect.width) })
    }
  }
  overflowResult.offenders.sort((a, b) => b.right - a.right)
  overflowResult.offenders = overflowResult.offenders.slice(0, 8)
  overflowResult.ok = !overflowResult.scrollOverflow && overflowResult.offenders.length === 0

  // Focus ring: focus every focusable element and read its computed outline.
  const focusResult = { checked: 0, failures: [], unmeasured: [], samples: [] }
  const inkProbe = document.createElement('span')
  inkProbe.style.color = 'var(--c-ink)'
  inkProbe.style.position = 'absolute'
  inkProbe.style.visibility = 'hidden'
  inkProbe.style.pointerEvents = 'none'
  document.documentElement.appendChild(inkProbe)
  const ink = parseColor(getComputedStyle(inkProbe).color)
  inkProbe.remove()
  const focusCandidates = Array.prototype.slice
    .call(document.querySelectorAll('a[href], button, [role="button"], input, select, textarea, [tabindex]'))
    .filter((element) => element.tagName !== 'INPUT' || element.type !== 'hidden')
    .filter((element) => !element.disabled)
    .filter((element) => {
      const tabindex = element.getAttribute('tabindex')
      return tabindex === null || Number(tabindex) >= 0
    })
    .filter(rendered)
  for (const element of focusCandidates) {
    element.focus({ preventScroll: true })
    const focused = document.activeElement === element
    if (!focused) {
      focusResult.failures.push({ selector: describe(element), problems: ['the element could not take focus'] })
      continue
    }
    const style = getComputedStyle(element)
    const ring = ringSurface(element)
    const expected = ring.expected || ink
    const width = parsePx(style.outlineWidth)
    const offset = parsePx(style.outlineOffset)
    const color = parseColor(style.outlineColor)
    const problems = []
    if (style.outlineStyle === 'none') problems.push('outline-style is none (no ring path)')
    if (width === null || Math.abs(width - 3) > 0.01) problems.push(`outline-width ${style.outlineWidth} (expected 3px)`)
    if (offset === null || Math.abs(offset - 2) > 0.01) problems.push(`outline-offset ${style.outlineOffset} (expected 2px)`)
    if (!color) problems.push(`outline-color ${style.outlineColor} is unreadable`)
    else if (expected && !sameColor(color, expected)) {
      problems.push(`outline-color ${style.outlineColor} (expected ${ring.surface ? `the text colour of ${ring.surface}` : 'the ink colour'} ${formatColor(expected)})`)
    }
    const adjacent = effectiveBackground(element)
    let ringContrast = null
    if (color && adjacent.color) {
      ringContrast = round(contrast(color, adjacent.color))
      if (ringContrast < 3) problems.push(`ring against its background is ${ringContrast}:1 (needs 3:1)`)
    } else if (!adjacent.color) {
      focusResult.unmeasured.push({ selector: describe(element), reason: 'a background image intervenes: ' + adjacent.image })
    }
    focusResult.checked += 1
    const sample = {
      selector: describe(element),
      outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      offset: style.outlineOffset,
      field: Boolean(ring.surface),
      ringContrast,
    }
    if (problems.length > 0) focusResult.failures.push({ ...sample, problems })
    else focusResult.samples.push(sample)
    element.blur()
  }
  focusResult.samples.sort((a, b) => (a.ringContrast ?? 99) - (b.ringContrast ?? 99))

  // Computed body type: the page's body, or the visible slide on a deck.
  let typeElement = document.body
  let typeSelector = 'body'
  if (deck) {
    typeElement = document.querySelector('.stage .slide:not([hidden])') || document.querySelector('.stage .slide') || document.querySelector('.slide')
    typeSelector = '.slide'
  }
  const typeBody = typeElement
    ? { selector: typeSelector, fontSize: parsePx(getComputedStyle(typeElement).fontSize), expected: deck ? 24 : 17 }
    : { selector: typeSelector, fontSize: null, expected: deck ? 24 : 17 }

  // Settle: no transition may still carry a duration under prefers-reduced-motion: reduce.
  const transitions = { elements: 0, nonZero: [], animations: null }
  try {
    transitions.animations = document.getAnimations().length
  } catch {
    transitions.animations = null
  }
  for (const element of all) {
    const style = getComputedStyle(element)
    transitions.elements += 1
    const durations = String(style.transitionDuration || '').split(',').map((part) => part.trim()).filter(Boolean)
    for (const duration of durations) {
      if (duration !== '0s' && duration !== '0ms') {
        transitions.nonZero.push({ selector: describe(element), duration })
        break
      }
    }
  }

  return {
    contrast: contrastResult,
    targets: targetResult,
    overflow: overflowResult,
    focus: focusResult,
    typeBody,
    transitions,
  }
}

function inPageDeckFit() {
  const describe = (element) => {
    if (!element) return 'null'
    let text = element.tagName.toLowerCase()
    if (element.id) text += '#' + element.id
    const classes = (element.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3)
    if (classes.length > 0) text += '.' + classes.join('.')
    return text
  }
  const px = (value) => {
    const number = parseFloat(value)
    return Number.isFinite(number) ? number : null
  }
  const round = (number) => Math.round(number * 10000) / 10000
  const stage = document.querySelector('.stage')
  if (!stage) return { ok: false, reason: 'no .stage element' }
  const stageStyle = getComputedStyle(stage)
  const rect = stage.getBoundingClientRect()
  const matrix = /^matrix\(([^)]+)\)$/.exec(stageStyle.transform)
  const parts = matrix ? matrix[1].split(',').map(Number) : null
  const slide = stage.querySelector('.slide:not([hidden])') || stage.querySelector('.slide')
  const slideStyle = slide ? getComputedStyle(slide) : null
  const counter = stage.querySelector('.deck-counter')
  const controls = stage.querySelector('.deck-controls')
  const counterStyle = counter ? getComputedStyle(counter) : null
  const controlsStyle = controls ? getComputedStyle(controls) : null
  return {
    ok: true,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    stage: {
      offsetWidth: stage.offsetWidth,
      offsetHeight: stage.offsetHeight,
      width: round(rect.width),
      height: round(rect.height),
      ratio: round(rect.width / rect.height),
    },
    transform: stageStyle.transform,
    scale: parts ? round(parts[0]) : null,
    scaleY: parts ? round(parts[3]) : null,
    skew: parts ? round(parts[1]) : null,
    expectedScale: round(Math.min(window.innerWidth / 1280, window.innerHeight / 720)),
    padding: slideStyle
      ? {
          top: px(slideStyle.paddingTop),
          right: px(slideStyle.paddingRight),
          bottom: px(slideStyle.paddingBottom),
          left: px(slideStyle.paddingLeft),
        }
      : null,
    counter: counterStyle
      ? { right: px(counterStyle.right), bottom: px(counterStyle.bottom), text: counter.textContent.trim(), selector: describe(counter) }
      : null,
    controls: controlsStyle
      ? {
          left: px(controlsStyle.left),
          bottom: px(controlsStyle.bottom),
          selector: describe(controls),
          buttons: Array.prototype.map.call(controls.querySelectorAll('button'), (button) => ({
            text: button.textContent.trim(),
            width: button.offsetWidth,
            height: button.offsetHeight,
          })),
        }
      : null,
    slides: stage.querySelectorAll('.slide').length,
  }
}

function inPageDeckSlide() {
  const describe = (element) => {
    if (!element) return 'null'
    let text = element.tagName.toLowerCase()
    if (element.id) text += '#' + element.id
    const classes = (element.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3)
    if (classes.length > 0) text += '.' + classes.join('.')
    return text
  }
  const snippet = (value) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 60)
  const lineHeightOf = (element) => {
    const raw = parseFloat(getComputedStyle(element).lineHeight)
    return Number.isFinite(raw) && raw > 0 ? raw : null
  }
  const linesOf = (element) => {
    const lineHeight = lineHeightOf(element)
    return lineHeight === null ? null : Math.round(element.offsetHeight / lineHeight)
  }
  const slides = Array.prototype.slice.call(document.querySelectorAll('.stage .slide'))
  const index = slides.findIndex((slide) => !slide.hasAttribute('hidden'))
  const counter = document.querySelector('.stage .deck-counter')
  if (index < 0) return { ok: false, reason: 'no visible .slide inside .stage', counter: counter ? counter.textContent.trim() : null }
  const slide = slides[index]
  const layout = slide.getAttribute('data-layout') || null
  const lineElements = Array.prototype.slice.call(slide.querySelectorAll('h1, h2, p, li, dd'))
  const items = lineElements.map((element) => ({
    tag: element.tagName.toLowerCase(),
    cls: element.getAttribute('class') || '',
    text: snippet(element.textContent),
    height: element.offsetHeight,
    lineHeight: lineHeightOf(element),
    lines: linesOf(element),
  }))
  const measurable = items.filter((item) => item.lines !== null)
  const total = measurable.reduce((sum, item) => sum + item.lines, 0)
  const heading = slide.querySelector('h1, h2')
  const listItems = layout === 'points' || layout === 'steps'
    ? Array.prototype.map.call(slide.querySelectorAll('li'), (element) => ({
        text: snippet(element.textContent),
        lines: linesOf(element),
        selector: describe(element),
      }))
    : null
  let note = null
  if (layout === 'data') {
    const noteElement =
      slide.querySelector('.slide__body p.t-body') ||
      slide.querySelector('.slide__body p:not(.t-numeral):not(.t-label):not(.t-lead)')
    if (noteElement) note = { text: snippet(noteElement.textContent), lines: linesOf(noteElement), selector: describe(noteElement) }
  }
  return {
    ok: true,
    index,
    count: slides.length,
    layout,
    total,
    items,
    unmeasurable: items.filter((item) => item.lines === null).map((item) => item.tag + '.' + item.cls),
    heading: heading ? { tag: heading.tagName.toLowerCase(), text: snippet(heading.textContent), lines: linesOf(heading) } : null,
    listItems,
    note,
    counterText: counter ? counter.textContent.trim() : null,
  }
}

function inPageDeckVisible() {
  const slides = Array.prototype.slice.call(document.querySelectorAll('.stage .slide'))
  const index = slides.findIndex((slide) => !slide.hasAttribute('hidden'))
  const counter = document.querySelector('.stage .deck-counter')
  const buttons = Array.prototype.map.call(document.querySelectorAll('.deck-controls button'), (button) => ({
    text: button.textContent.trim(),
    disabled: button.disabled,
  }))
  return {
    index,
    count: slides.length,
    counter: counter ? counter.textContent.trim() : null,
    buttons,
    activeElement: document.activeElement ? document.activeElement.tagName.toLowerCase() : null,
  }
}

const callable = (fn) => `(${fn})()`
const callableWith = (fn, argument) => `(${fn})(${JSON.stringify(argument)})`

export const measureExpression = (options) => callableWith(inPageMeasure, options)
export const deckFitExpression = () => callable(inPageDeckFit)
export const deckSlideExpression = () => callable(inPageDeckSlide)
export const deckVisibleExpression = () => callable(inPageDeckVisible)
