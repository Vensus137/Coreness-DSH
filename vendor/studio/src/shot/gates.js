/**
 * The Edge (computed) catalogue: the eight gate codes, the viewport arithmetic and the assembly that
 * turns raw measurements into `pass | fail | unchecked`. A gate whose subject could not be read
 * answers `unchecked` with its reason; a failure is a finding, never a reason to stop the run.
 */
export const EDGE_GATES = Object.freeze([
  'render.contrast',
  'focus.ring',
  'render.target',
  'render.overflow',
  'type.body',
  'deck.fit',
  'deck.lines',
  'render.shot',
])

export const DEFAULT_VIEWPORTS = Object.freeze([320, 390, 768, 1440])
export const VIEWPORT_HEIGHTS = Object.freeze({ 320: 844, 390: 844, 768: 1024, 1440: 900 })
export const SHOT_VIEWPORTS = Object.freeze([1440, 390])
export const DECK_VIEWPORT = 1440

export const PAGE_BODY_PX = 17
export const DECK_BODY_PX = 24
export const BODY_TOLERANCE_PX = 0.5
export const SLIDE_MAX_LINES = 6
export const HEADING_MAX_LINES = 2
export const QUOTE_MAX_LINES = 3
export const DATA_NOTE_MAX_LINES = 2
export const DECK_CANVAS_WIDTH = 1280
export const DECK_CANVAS_HEIGHT = 720
export const DECK_SLIDE_PADDING_PX = 64
export const DECK_COUNTER_POSITION = Object.freeze({ right: 64, bottom: 20 })
export const DECK_CONTROLS_POSITION = Object.freeze({ left: 64, bottom: 20 })
export const DECK_SCALE_TOLERANCE = 0.002
export const DECK_RATIO_TOLERANCE = 0.01

/** A viewport's height: the two the capture fixes (1440×900, 390×844), and the ones this pass chose for the rest. */
export function heightOf(width) {
  if (VIEWPORT_HEIGHTS[width]) return VIEWPORT_HEIGHTS[width]
  if (width <= 480) return 844
  if (width < 1000) return 1024
  return 900
}

/**
 * The computed-check viewports: the requested widths (or the four defaults), always plus 1440 and
 * 390 — the deck geometry and the two screenshots are fixed there.
 * @param {unknown} viewports
 * @returns {number[]}
 */
export function computeViewports(viewports) {
  const requested = Array.isArray(viewports) && viewports.length > 0 ? viewports : DEFAULT_VIEWPORTS
  const widths = new Set()
  for (const value of requested) {
    const width = Number(value)
    if (Number.isFinite(width) && width >= 1) widths.add(Math.round(width))
  }
  widths.add(DECK_VIEWPORT)
  widths.add(SHOT_VIEWPORTS[1])
  return [...widths].sort((a, b) => a - b)
}

/* --------------------------------------------------------------------------------------------- */
/* Assembly: raw measurements -> gates                                                            */
/* --------------------------------------------------------------------------------------------- */

const gate = (code, state, detail) => ({ code, state, detail })

const oneLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

function slimText(value, limit = 60) {
  const text = oneLine(value)
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

function allSamples(raw) {
  if (!raw || !Array.isArray(raw.viewports)) return []
  return raw.viewports.flatMap((viewport) => (Array.isArray(viewport.samples) ? viewport.samples : []))
}

function assembleContrast(raw, noData) {
  const samples = allSamples(raw)
  if (samples.length === 0) return gate('render.contrast', 'unchecked', noData)
  const violations = samples.flatMap((sample) => sample.contrast?.violations ?? [])
  const unmeasured = samples.flatMap((sample) => sample.contrast?.unmeasured ?? [])
  const checked = samples.reduce((sum, sample) => sum + (sample.contrast?.checked ?? 0), 0)
  const worst = samples.reduce((current, sample) => {
    const candidate = sample.contrast?.worst
    if (!candidate) return current
    return current === null || candidate.ratio < current.ratio ? candidate : current
  }, null)
  if (violations.length > 0) {
    violations.sort((a, b) => a.ratio - b.ratio)
    const worstViolation = violations[0]
    const lines = violations.slice(0, 5).map(
      (item) => `${item.ratio}:1 < ${item.threshold}:1 — ${item.foreground} on ${item.background} at ${item.fontSize}px (${item.selector}) "${slimText(item.text)}"`,
    )
    return gate('render.contrast', 'fail', `${violations.length} text pair(s) below the floor; worst ${lines[0]}${lines.length > 1 ? `; also ${lines.slice(1).join('; ')}` : ''}`)
  }
  if (unmeasured.length > 0) {
    return gate('render.contrast', 'unchecked', `the rendered contrast could not be read for ${unmeasured.length} text node(s): ${oneLine(unmeasured[0].reason)} (${unmeasured[0].selector})`)
  }
  if (checked === 0) {
    const textLength = samples.reduce((longest, sample) => Math.max(longest, sample.contrast?.document?.textLength ?? 0), 0)
    return gate(
      'render.contrast',
      'unchecked',
      textLength > 0
        ? `the document renders ${textLength} character(s) of text but no text node could be measured`
        : 'the document renders no text to measure',
    )
  }
  const worstText = worst
    ? `worst pair ${worst.ratio}:1 (${worst.foreground} on ${worst.background}, ${worst.fontSize}px, ${worst.selector}, floor ${worst.threshold}:1)`
    : 'no worst pair recorded'
  return gate('render.contrast', 'pass', `${checked} text pair(s) over ${samples.length} sample(s); ${worstText}`)
}

function assembleFocus(raw, noData) {
  const samples = allSamples(raw)
  if (samples.length === 0) return gate('focus.ring', 'unchecked', noData)
  const checked = samples.reduce((sum, sample) => sum + (sample.focus?.checked ?? 0), 0)
  const failures = samples.flatMap((sample) => sample.focus?.failures ?? [])
  const unmeasured = samples.flatMap((sample) => sample.focus?.unmeasured ?? [])
  const samplesOk = samples.flatMap((sample) => sample.focus?.samples ?? [])
  if (checked === 0 && failures.length === 0) return gate('focus.ring', 'unchecked', 'no focusable element was found to focus')
  if (failures.length > 0) {
    const shown = failures.slice(0, 5).map((failure) => `${failure.selector}: ${failure.problems.join(', ')}`)
    return gate('focus.ring', 'fail', `${failures.length} focusable element(s) without the ring: ${shown.join('; ')}`)
  }
  if (unmeasured.length > 0) return gate('focus.ring', 'unchecked', `the ring's background could not be read: ${oneLine(unmeasured[0].reason)} (${unmeasured[0].selector})`)
  const worst = samplesOk.find((sample) => typeof sample.ringContrast === 'number')
  const fields = samplesOk.filter((sample) => sample.field).length
  return gate(
    'focus.ring',
    'pass',
    `${checked} focused element(s) over ${samples.length} sample(s): outline 3px offset 2px, the ink colour on paper${fields > 0 ? " and the surface's own text colour on a filled surface" : ''}; worst ring/background ${worst ? `${worst.ringContrast}:1` : 'not sampled'}`,
  )
}

function assembleTargets(raw, noData) {
  const samples = allSamples(raw)
  if (samples.length === 0) return gate('render.target', 'unchecked', noData)
  const failures = samples.flatMap((sample) => sample.targets?.failures ?? [])
  const controls = samples.flatMap((sample) => sample.targets?.controls ?? [])
  const links = samples.flatMap((sample) => sample.targets?.links ?? [])
  const exempt = samples.reduce((sum, sample) => sum + (sample.targets?.exemptInline ?? 0), 0)
  // What the document itself carries, so "measured nothing" is not answered with a green.
  const document = samples.reduce(
    (facts, sample) => {
      const entry = sample.targets?.document
      if (!entry) return facts
      return {
        candidates: Math.max(facts.candidates, entry.candidates ?? 0),
        bodyTextLength: Math.max(facts.bodyTextLength, entry.bodyTextLength ?? 0),
        bodyElementCount: Math.max(facts.bodyElementCount, entry.bodyElementCount ?? 0),
      }
    },
    { candidates: 0, bodyTextLength: 0, bodyElementCount: 0 },
  )
  if (failures.length > 0) {
    const shown = failures.slice(0, 6).map((item) => `${item.selector} ${item.width}x${item.height} (${item.required})`)
    return gate('render.target', 'fail', `${failures.length} target(s) under the floor: ${shown.join('; ')}`)
  }
  const measured = controls.length + links.length + exempt
  if (measured === 0) {
    if (document.candidates > 0) {
      return gate('render.target', 'unchecked', `the document carries ${document.candidates} link/control element(s) but none could be measured`)
    }
    if (document.bodyTextLength > 0 || document.bodyElementCount > 0) {
      return gate(
        'render.target',
        'pass',
        `the document renders no link and no control (${document.bodyTextLength} character(s) of text, ${document.bodyElementCount} element(s)); nothing to measure`,
      )
    }
    return gate('render.target', 'unchecked', 'the document rendered nothing to read: no link, no control and no text')
  }
  return gate(
    'render.target',
    'pass',
    `${controls.length} button/control sample(s) at 44x44 and ${links.length} link sample(s) at height >= 44; ${exempt} inline prose link(s) exempt by WCAG 2.5.8`,
  )
}

function assembleOverflow(raw, noData) {
  const samples = allSamples(raw)
  if (samples.length === 0) return gate('render.overflow', 'unchecked', noData)
  const failures = []
  const unmeasured = []
  for (const viewport of raw.viewports ?? []) {
    for (const sample of viewport.samples ?? []) {
      const overflow = sample.overflow
      if (!overflow) {
        unmeasured.push(`${viewport.width}x${viewport.height}`)
        continue
      }
      if (overflow.ok !== false) continue
      const offenders = (overflow.offenders ?? []).slice(0, 4).map((item) => `${item.selector} right ${item.right}px`)
      failures.push(
        `${viewport.width}x${viewport.height}: scrollWidth ${overflow.scrollWidth} vs clientWidth ${overflow.clientWidth}${offenders.length > 0 ? `; ${offenders.join(', ')}` : ''}`,
      )
    }
  }
  if (failures.length > 0) return gate('render.overflow', 'fail', `horizontal overflow at ${failures.length} sample(s): ${failures.join(' | ')}`)
  if (unmeasured.length > 0) {
    return gate(
      'render.overflow',
      'unchecked',
      `the horizontal overflow could not be read at ${[...new Set(unmeasured)].join(', ')}: ${unmeasured.length} sample(s) carried no overflow measurement; an absent measurement is not a clean page`,
    )
  }
  const measured = raw.viewports.map((viewport) => `${viewport.width}x${viewport.height}`).join(', ')
  const regions = (raw.viewports ?? []).reduce(
    (sum, viewport) => sum + (viewport.samples ?? []).reduce((count, sample) => count + (sample.overflow?.scrollRegions ?? 0), 0),
    0,
  )
  return gate(
    'render.overflow',
    'pass',
    `no horizontal overflow at ${measured}${regions > 0 ? ` (${regions} element(s) inside a horizontal scroll region are not page overflow)` : ''}`,
  )
}

function assembleTypeBody(raw, deck, noData) {
  const samples = allSamples(raw)
  if (samples.length === 0) return gate('type.body', 'unchecked', noData)
  const expected = deck ? DECK_BODY_PX : PAGE_BODY_PX
  const observed = samples.map((sample) => sample.typeBody).filter((value) => value !== undefined)
  if (observed.length === 0 || observed.some((value) => value === null || value.fontSize === null)) {
    return gate('type.body', 'unchecked', `the computed font-size of ${deck ? '.slide' : 'body'} could not be read`)
  }
  const facets = [...new Set(observed.map((value) => value.fontSize))]
  const out = facets.filter((value) => Math.abs(value - expected) > BODY_TOLERANCE_PX)
  if (out.length > 0) return gate('type.body', 'fail', `computed ${deck ? '.slide' : 'body'} font-size ${out.join(', ')}px (expected ${expected} ±${BODY_TOLERANCE_PX}px)`)
  return gate('type.body', 'pass', `computed ${deck ? '.slide' : 'body'} font-size ${facets.join(', ')}px (expected ${expected} ±${BODY_TOLERANCE_PX}px) over ${samples.length} sample(s)`)
}

const near = (value, expected, tolerance) => typeof value === 'number' && Math.abs(value - expected) <= tolerance

function assembleDeckFit(raw, deck, noData) {
  const measured = (raw?.viewports ?? []).length > 0
  if (!deck) {
    return gate('deck.fit', 'unchecked', measured ? 'not applicable: the build is a page (kind is not presentation)' : noData)
  }
  const fit = raw?.deckFit
  if (!fit) return gate('deck.fit', 'unchecked', noData)
  if (fit.ok === false) return gate('deck.fit', 'fail', `the deck stage could not be measured: ${fit.reason}`)
  const problems = []
  if (fit.stage.offsetWidth !== DECK_CANVAS_WIDTH || fit.stage.offsetHeight !== DECK_CANVAS_HEIGHT) {
    problems.push(`.stage offset ${fit.stage.offsetWidth}x${fit.stage.offsetHeight} (expected 1280x720)`)
  }
  if (!near(fit.stage.ratio, 16 / 9, DECK_RATIO_TOLERANCE)) problems.push(`rendered ratio ${fit.stage.ratio} (expected 16/9 ±${DECK_RATIO_TOLERANCE})`)
  if (!fit.padding) problems.push('no visible .slide to read the padding from')
  else if ([fit.padding.top, fit.padding.right, fit.padding.bottom, fit.padding.left].some((value) => !near(value, DECK_SLIDE_PADDING_PX, 0.01))) {
    problems.push(`.slide computed padding ${fit.padding.top}/${fit.padding.right}/${fit.padding.bottom}/${fit.padding.left} (expected 64 on every side)`)
  }
  if (!fit.counter) problems.push('no .deck-counter')
  else if (!near(fit.counter.right, DECK_COUNTER_POSITION.right, 0.01) || !near(fit.counter.bottom, DECK_COUNTER_POSITION.bottom, 0.01)) {
    problems.push(`.deck-counter right/bottom ${fit.counter.right}/${fit.counter.bottom} (expected 64/20)`)
  }
  if (!fit.controls) problems.push('no .deck-controls')
  else if (!near(fit.controls.left, DECK_CONTROLS_POSITION.left, 0.01) || !near(fit.controls.bottom, DECK_CONTROLS_POSITION.bottom, 0.01)) {
    problems.push(`.deck-controls left/bottom ${fit.controls.left}/${fit.controls.bottom} (expected 64/20)`)
  }
  if (fit.scale === null) problems.push(`the .stage carries no readable scale transform (${fit.transform})`)
  else {
    if (!near(fit.scale, fit.expectedScale, DECK_SCALE_TOLERANCE)) problems.push(`scale ${fit.scale} (expected min(vw/1280, vh/720) = ${fit.expectedScale} ±${DECK_SCALE_TOLERANCE})`)
    if (!near(fit.scaleY, fit.scale, DECK_SCALE_TOLERANCE)) problems.push(`non-uniform scale ${fit.scale}/${fit.scaleY}`)
    if (!near(fit.skew, 0, DECK_SCALE_TOLERANCE)) problems.push(`skewed transform ${fit.transform}`)
  }
  if (problems.length > 0) return gate('deck.fit', 'fail', problems.join('; '))
  return gate(
    'deck.fit',
    'pass',
    `.stage offset 1280x720, rendered ${fit.stage.width}x${fit.stage.height} (ratio ${fit.stage.ratio}); .slide padding ${fit.padding.top}/${fit.padding.right}/${fit.padding.bottom}/${fit.padding.left}; scale ${fit.scale} (expected ${fit.expectedScale}) at ${fit.innerWidth}x${fit.innerHeight}; counter right/bottom ${fit.counter.right}/${fit.counter.bottom}; controls left/bottom ${fit.controls.left}/${fit.controls.bottom}; ${fit.slides} slide(s)`,
  )
}

function assembleDeckLines(raw, deck, noData) {
  const measured = (raw?.viewports ?? []).length > 0
  if (!deck) {
    return gate('deck.lines', 'unchecked', measured ? 'not applicable: the build is a page (kind is not presentation)' : noData)
  }
  if (typeof raw?.deckLinesFailure === 'string' && raw.deckLinesFailure.length > 0) {
    return gate('deck.lines', 'unchecked', raw.deckLinesFailure)
  }
  const slides = raw?.deckSlides
  if (!Array.isArray(slides) || slides.length === 0) return gate('deck.lines', 'unchecked', noData)
  const problems = []
  const totals = []
  for (const slide of slides) {
    if (!slide || slide.ok === false) {
      problems.push(`slide ${(slide?.index ?? 0) + 1}: ${slide?.reason ?? 'not measured'}`)
      continue
    }
    totals.push(slide.total)
    const label = `slide ${slide.index + 1} (${slide.layout ?? 'no data-layout'})`
    if ((slide.unmeasurable ?? []).length > 0) {
      problems.push(`${label}: no numeric line-height on ${slide.unmeasurable.join(', ')}; the line formula cannot be applied`)
    }
    if (!slide.heading) problems.push(`${label}: no heading`)
    if (slide.total > SLIDE_MAX_LINES) problems.push(`${label}: ${slide.total} rendered lines (max ${SLIDE_MAX_LINES})`)
    const headingCap = slide.layout === 'quote' ? QUOTE_MAX_LINES : HEADING_MAX_LINES
    if (slide.heading && slide.heading.lines !== null && slide.heading.lines > headingCap) {
      problems.push(`${label}: heading ${slide.heading.lines} lines (max ${headingCap}${slide.layout === 'quote' ? ' for a quotation' : ''})`)
    }
    for (const item of slide.listItems ?? []) {
      if (item.lines !== 1) problems.push(`${label}: item "${slimText(item.text, 30)}" renders ${item.lines} lines (exactly 1 required)`)
    }
    if (slide.note && slide.note.lines !== null && slide.note.lines > DATA_NOTE_MAX_LINES) {
      problems.push(`${label}: data note renders ${slide.note.lines} lines (max ${DATA_NOTE_MAX_LINES})`)
    }
  }
  if (problems.length > 0) return gate('deck.lines', 'fail', problems.join('; '))
  const keyDrive = raw?.keyDrive
  const drive =
    keyDrive && keyDrive.completed
      ? `; key drive ${keyDrive.presses} ArrowRight press(es) advanced through ${slides.length}/${slides.length} slides, last counter ${keyDrive.lastCounter}, Home -> slide ${(keyDrive.home?.index ?? -1) + 1}, End -> slide ${(keyDrive.end?.index ?? -1) + 1}`
      : ''
  const notes = slides.filter((slide) => slide?.note).map((slide) => `slide ${slide.index + 1} note ${slide.note.lines ?? 'unmeasured'} line(s) (max ${DATA_NOTE_MAX_LINES})`)
  const quotations = slides.filter((slide) => slide?.layout === 'quote' && slide.heading).map((slide) => `quotation ${slide.heading.lines} line(s) (max ${QUOTE_MAX_LINES})`)
  return gate(
    'deck.lines',
    'pass',
    `${slides.length} slide(s): rendered lines ${totals.join('/')} (max ${Math.max(...totals)} <= ${SLIDE_MAX_LINES}); headings within ${HEADING_MAX_LINES}; points/steps items 1 line each${quotations.length > 0 ? `; ${quotations.join(', ')}` : ''}${notes.length > 0 ? `; ${notes.join(', ')}` : ''}${drive}`,
  )
}

function assembleShot(expectedNames, writtenShots, settleReason, fatalReason, noData) {
  if (settleReason) return gate('render.shot', 'unchecked', settleReason)
  if (fatalReason) return gate('render.shot', 'unchecked', fatalReason)
  if (!Array.isArray(writtenShots) || writtenShots.length === 0) return gate('render.shot', 'unchecked', noData)
  const byName = new Map(writtenShots.map((shot) => [shot.name, shot]))
  const missing = expectedNames.filter((name) => !byName.has(name))
  const empty = expectedNames.filter((name) => byName.has(name) && byName.get(name).bytes === 0)
  if (empty.length > 0) return gate('render.shot', 'fail', `the capture wrote 0 bytes: ${empty.join(', ')}`)
  if (missing.length > 0) return gate('render.shot', 'unchecked', `the expected PNG set is incomplete; missing ${missing.join(', ')}`)
  const listing = expectedNames.map((name) => {
    const shot = byName.get(name)
    return `${shot.name} ${shot.bytes.toLocaleString('en-US')} B`
  })
  return gate('render.shot', 'pass', `the expected PNG set exists and is non-empty: ${listing.join('; ')}`)
}

/**
 * Assemble the eight gates from the raw measurements and the written evidence.
 * @param {object} input
 * @param {boolean} input.deck
 * @param {object} input.raw
 * @param {string[]} input.expectedNames
 * @param {Array<{ name: string, bytes: number, path: string }>} input.writtenShots
 * @param {string|undefined} input.settleReason
 * @param {string|undefined} input.fatalReason
 * @returns {Array<{ code: string, state: 'pass'|'fail'|'unchecked', detail: string }>}
 */
export function buildGates({ deck, raw, expectedNames, writtenShots, settleReason, fatalReason }) {
  const noData = fatalReason ?? 'no Edge measurement was made'
  const gates = {
    'render.contrast': assembleContrast(raw, noData),
    'focus.ring': assembleFocus(raw, noData),
    'render.target': assembleTargets(raw, noData),
    'render.overflow': assembleOverflow(raw, noData),
    'type.body': assembleTypeBody(raw, deck, noData),
    'deck.fit': assembleDeckFit(raw, deck, noData),
    'deck.lines': assembleDeckLines(raw, deck, noData),
    'render.shot': assembleShot(expectedNames, writtenShots, settleReason, fatalReason, noData),
  }
  return EDGE_GATES.map((code) => gates[code])
}
