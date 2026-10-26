/**
 * The bounded-motion layer: `motion.duration`, `motion.property`, `motion.reduced`, `motion.autoplay`.
 *
 * The layer is feedback, never entrance: at most 240 ms, one of the three tokens, five colour/underline
 * properties on a page (the deck's slide change may also translate ≤ 8 px), a reduced-motion block that zeroes
 * everything, and no keyframes, autoplay, scroll behaviour or timed script. What the static half cannot prove
 * is named where it stands: it reads declarations, not rendering, and the settle check is `studio_shot`'s.
 */
import { isImportant, selectorParts, valueOf } from '../../../lib/css.mjs'
import { byTag } from '../../../lib/html.mjs'
import { MOTION_DURATIONS, MOTION_PAGE_PROPERTIES } from '../design.mjs'
import { scriptProblems, treeOf } from '../folder.mjs'
import { fail, list, pass, unchecked } from '../result.mjs'

const TIME = /(-?\d*\.?\d+)(ms|s)\b/g
const EASING = new Set(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 'normal', 'none', 'allow-discrete'])

function toMs(number, unit) {
  return unit === 's' ? Number(number) * 1000 : Number(number)
}

/** Split a comma list on top-level commas. */
function commaParts(value) {
  const parts = []
  let depth = 0
  let current = ''
  for (const ch of value) {
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue }
    current += ch
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

function spaceTokens(value) {
  const parts = []
  let depth = 0
  let current = ''
  for (const ch of value) {
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (/\s/.test(ch) && depth === 0) { if (current !== '') parts.push(current); current = ''; continue }
    current += ch
  }
  if (current !== '') parts.push(current)
  return parts
}

/** Every transition declaration in the emitted sheets, with the rule it stands in.
 *  The reduced-motion block's own `transition: none` is read by `motion.reduced`, not as a live transition. */
function transitions(facts) {
  const found = []
  for (const [path, scan] of facts.css) {
    if (scan.ok !== true) return { problem: `${path} could not be read: ${scan.detail}` }
    for (const rule of scan.rules) {
      if (rule.context !== null && /prefers-reduced-motion\s*:\s*reduce/i.test(rule.context)) continue
      const shorthand = rule.declarations.get('transition')
      if (shorthand !== undefined) found.push({ path, rule, kind: 'transition', value: shorthand.trim() })
      const duration = rule.declarations.get('transition-duration')
      if (duration !== undefined) found.push({ path, rule, kind: 'duration', value: duration.trim() })
      const property = rule.declarations.get('transition-property')
      if (property !== undefined) found.push({ path, rule, kind: 'property', value: property.trim() })
    }
  }
  return { found }
}

function declaredToken(facts, name) {
  const raw = facts.rootTokens?.get(name)
  if (raw === undefined) return undefined
  const match = /^(-?\d*\.?\d+)(ms|s)$/.exec(raw.trim())
  return match === null ? undefined : toMs(match[1], match[2])
}

export const motionDuration = {
  code: 'motion.duration',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const read = transitions(facts)
    if (read.problem !== undefined) return unchecked(read.problem)
    if (read.found.length === 0) return pass('the emitted sheets declare no transition')
    const problems = []
    for (const entry of read.found) {
      if (entry.kind === 'property') continue
      const where = `${entry.path}: ${entry.rule.selector} { ${entry.kind}: ${entry.value} }`
      if (entry.kind === 'duration') {
        const parts = commaParts(entry.value)
        for (const part of parts) {
          const times = [...part.matchAll(TIME)]
          const variables = [...part.matchAll(/var\(\s*(--motion-[a-z-]+)\s*\)/g)]
          if (times.length === 0 && variables.length === 0) problems.push(`${where} carries neither a time nor a motion token`)
          for (const time of times) {
            const ms = toMs(time[1], time[2])
            if (!MOTION_DURATIONS.has(ms)) problems.push(`${where} uses ${ms}ms; the tokens are 120, 180 and 240 ms`)
          }
          for (const variable of variables) {
            const declared = declaredToken(facts, variable[1])
            if (declared === undefined) problems.push(`${where} uses var(${variable[1]}) but the emitted :root declares no such duration`)
            else if (!MOTION_DURATIONS.has(declared)) problems.push(`${where} resolves ${variable[1]} to ${declared}ms; the tokens are 120, 180 and 240 ms`)
          }
        }
        continue
      }
      if (entry.value.toLowerCase() === 'none') continue
      for (const part of commaParts(entry.value)) {
        const times = [...part.matchAll(TIME)]
        if (times.length === 0) continue
        /* In the shorthand the first time is the duration and a second one would be a delay. */
        const ms = toMs(times[0][1], times[0][2])
        if (!MOTION_DURATIONS.has(ms)) problems.push(`${where} uses ${ms}ms; the tokens are 120, 180 and 240 ms`)
        const variables = [...part.matchAll(/var\(\s*(--motion-[a-z-]+)\s*\)/g)]
        for (const variable of variables) {
          const declared = declaredToken(facts, variable[1])
          if (declared === undefined) {
            problems.push(`${where} uses var(${variable[1]}) but the emitted :root declares no such duration`)
          } else if (!MOTION_DURATIONS.has(declared)) {
            problems.push(`${where} resolves ${variable[1]} to ${declared}ms; the tokens are 120, 180 and 240 ms`)
          }
        }
      }
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`${read.found.length} transition declaration(s), every duration one of the three tokens and at most the 240 ms cap`)
  },
}

function propertyOf(part) {
  for (const token of spaceTokens(part)) {
    if (token.startsWith('!')) continue
    if (/^var\(/i.test(token)) continue
    if (/^(-?\d*\.?\d+)(ms|s)$/.test(token)) continue
    if (/^(cubic-bezier|steps|linear)\(/i.test(token)) continue
    const word = token.toLowerCase()
    if (EASING.has(word)) continue
    return word
  }
  return undefined
}

export const motionProperty = {
  code: 'motion.property',
  appliesTo: 'both',
  instrument: 'static',
  run(facts, context) {
    const read = transitions(facts)
    if (read.problem !== undefined) return unchecked(read.problem)
    const problems = []
    const allowTransform = context.kind === 'deck'
    for (const entry of read.found) {
      if (entry.kind === 'duration') continue
      const parts = commaParts(entry.value)
      for (const part of parts) {
        const property = entry.kind === 'property' ? part.trim().toLowerCase() : propertyOf(part)
        if (property === undefined || property === 'none') continue
        if (property === 'transform') {
          if (!allowTransform) { problems.push(`${entry.path}: ${entry.rule.selector} transitions transform on a page; the page allowlist is colours and the underline`); continue }
          if (!selectorIncludes(entry.rule.selector, '.slide')) {
            problems.push(`${entry.path}: ${entry.rule.selector} transitions transform outside .slide; the deck's slide change is the only place`)
          }
          continue
        }
        if (MOTION_PAGE_PROPERTIES.has(property)) continue
        problems.push(`${entry.path}: ${entry.rule.selector} transitions ${property}; the allowlist is colour, background-color, border-color, text-decoration-color and text-decoration-thickness${allowTransform ? ' (and transform under .slide)' : ''}`)
      }
    }
    /* A transform declaration itself: the stage's fit is allowed, the slide's change is bounded, the page has none. */
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      for (const rule of scan.rules) {
        const transform = rule.declarations.get('transform')
        if (transform === undefined) continue
        const where = `${path}: ${rule.selector} { transform: ${transform} }`
        if (selectorIncludes(rule.selector, '.stage')) continue
        if (selectorIncludes(rule.selector, '.slide') && context.kind === 'deck') {
          for (const match of transform.matchAll(/translate(?:X|Y|Z|3d)?\(\s*(-?\d*\.?\d+)px/gi)) {
            if (Math.abs(Number(match[1])) > 8) problems.push(`${where} translates ${match[1]}px; at most 8 px`)
          }
          continue
        }
        problems.push(`${where} is a transform outside .slide/.stage; the page carries no transform`)
      }
    }
    if (problems.length > 0) return fail(list(problems))
    return pass('transitions stay on the colour/underline allowlist; transform only on .slide with its translate ≤ 8 px')
  },
}

function selectorIncludes(selector, needle) {
  return selector.includes(needle)
}

export const motionReduced = {
  code: 'motion.reduced',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    if (facts.css.size === 0) return unchecked('the folder carries no CSS to read')
    const problems = []
    let blockSeen = false
    let zeroingRule
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      for (const rule of scan.rules) {
        if (rule.context === null || !/prefers-reduced-motion\s*:\s*reduce/i.test(rule.context)) continue
        blockSeen = true
        const value = rule.declarations.get('transition')
        if (value === undefined) continue
        const universal = selectorParts(rule.selector).some((part) => part.trim().startsWith('*'))
        if (!universal) continue
        if (value.trim().toLowerCase().startsWith('none')) {
          zeroingRule = { path, rule, important: isImportant(rule.declarations, 'transition') }
        }
      }
    }
    if (!blockSeen) return fail('no @media (prefers-reduced-motion: reduce) block stands in the emitted sheets')
    if (zeroingRule === undefined) {
      return fail('the reduced-motion block does not zero every transition: no universal rule declares transition: none')
    }
    if (!zeroingRule.important) {
      problems.push(`${zeroingRule.path}: ${zeroingRule.rule.selector} declares transition: none without !important; a later rule can override it`)
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`@media (prefers-reduced-motion: reduce) zeroes every transition on ${zeroingRule.rule.selector} with !important; the deck switches instantly under the same rule`)
  },
}

export const motionAutoplay = {
  code: 'motion.autoplay',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const problems = []
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      for (const atRule of scan.atRules) {
        if (/^@keyframes\b/i.test(atRule)) problems.push(`${path}: a @keyframes block stands in the sheet`)
      }
      for (const rule of scan.rules) {
        for (const name of rule.declarations.keys()) {
          if (name === 'animation' || name.startsWith('animation-')) problems.push(`${path}: ${rule.selector} declares ${name}`)
        }
        if ((valueOf(rule.declarations, 'scroll-behavior') ?? '').toLowerCase() === 'smooth') problems.push(`${path}: ${rule.selector} declares scroll-behavior: smooth`)
      }
    }
    /* The fourth file is a script: an unreadable one is not an empty one, and the inline scripts need the
       document. Both are reader facts, so a missing read answers `unchecked`, never a pass. */
    const unreadableScript = scriptProblems(facts)[0]
    if (unreadableScript !== undefined) return unchecked(unreadableScript)
    for (const [path, text] of facts.js) {
      if (/\b(setInterval|setTimeout|requestAnimationFrame)\b/.test(text)) problems.push(`${path} carries a timed script (setInterval/setTimeout/requestAnimationFrame)`)
    }
    const tree = treeOf(facts)
    if (tree.ok !== true) return unchecked(tree.detail)
    for (const script of byTag(tree.root, 'script')) {
      if (/\b(setInterval|setTimeout|requestAnimationFrame)\b/.test(script.raw ?? '')) problems.push('an inline script carries a timer')
    }
    for (const style of byTag(tree.root, 'style')) {
      if (/@keyframes\b|\banimation\b|scroll-behavior\s*:\s*smooth/i.test(style.raw ?? '')) problems.push('an inline <style> carries animation or smooth scrolling')
    }
    if (problems.length > 0) return fail(list(problems))
    return pass('no @keyframes, animation, smooth scrolling or timed script in the emitted files')
  },
}
