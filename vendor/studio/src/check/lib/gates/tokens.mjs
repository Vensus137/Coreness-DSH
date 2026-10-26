/**
 * The colour, type and space gates: `tokens.only`, `look.tokens`, `contrast.text`,
 * `contrast.ui`, `type.set`, `space.set`.
 */
import { ratio } from '../contrast.mjs'
import { selectorParts } from '../../../lib/css.mjs'
import { COLOUR_TOKENS } from '../../../lib/library.mjs'
import { DECK_SIZES, SITE_SIZES, SPACE_SCALE } from '../design.mjs'
import { LOOK_COLOURS, LOOK_TABLE_PROBLEM } from '../looks.mjs'
import { fail, list, pass, unchecked } from '../result.mjs'

const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\blab\(/
const SPACING_PROPERTY = /^(margin|padding|gap|row-gap|column-gap)(-|$)/

/** The CSS named colours: a colour written as a word is still a literal, and the list is closed. */
const NAMED_COLOURS = new Set((
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
  'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray ' +
  'darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
  'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue ' +
  'firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew ' +
  'hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
  'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray ' +
  'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue ' +
  'mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred ' +
  'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
  'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple ' +
  'rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue ' +
  'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white ' +
  'whitesmoke yellow yellowgreen'
).split(' '))

/** The properties a colour can stand in; a named colour elsewhere is a font family or a keyword. */
const COLOUR_PROPERTY = /^(color|background|background-color|border|border-(top|right|bottom|left)|border-(top|right|bottom|left)-color|border-color|outline|outline-color|text-decoration|text-decoration-color|text-emphasis-color|caret-color|accent-color|column-rule|column-rule-color|fill|stroke)$/

/** The named colours a declaration carries, if the property is one where a colour may stand. */
function namedColoursIn(name, value) {
  if (!COLOUR_PROPERTY.test(name)) return []
  const words = value.toLowerCase().match(/[a-z]+/g) ?? []
  return [...new Set(words.filter((word) => NAMED_COLOURS.has(word)))]
}

/** Split a CSS value on top-level whitespace, keeping `clamp(…)` and `var(…)` whole. */
function tokensOf(value) {
  const parts = []
  let current = ''
  let depth = 0
  for (const ch of value) {
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (/\s/.test(ch) && depth === 0) {
      if (current !== '') parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current !== '') parts.push(current)
  return parts
}

/** A px length of the value, or `undefined` when it is not a plain px/rem length. */
function pxOf(value) {
  const px = /^(-?\d+(?:\.\d+)?)px$/.exec(value)
  if (px !== null) return Number(px[1])
  const rem = /^(-?\d+(?:\.\d+)?)rem$/.exec(value)
  if (rem !== null) return Number(rem[1]) * 16
  return undefined
}

function clampBounds(value) {
  const match = /^clamp\((.*)\)$/i.exec(value.trim())
  if (match === null) return undefined
  const args = []
  let depth = 0
  let current = ''
  for (const ch of match[1]) {
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) { args.push(current.trim()); current = ''; continue }
    current += ch
  }
  if (current.trim() !== '') args.push(current.trim())
  if (args.length !== 3) return undefined
  return { min: pxOf(args[0]), max: pxOf(args[2]), middle: args[1] }
}

/** The declared colour literals in one declaration value (excluding a `var()` reference). */
function literalsIn(value) {
  return COLOUR_LITERAL.test(value) ? [value] : []
}

export const tokensOnly = {
  code: 'tokens.only',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const site = facts.css.get('assets/site.css')
    if (site === undefined) return unchecked('the folder carries no assets/site.css')
    if (site.ok !== true) return unchecked(`assets/site.css could not be read: ${site.detail}`)

    const problems = []
    const sheets = [...facts.css.entries()]
    for (const [path, scan] of sheets) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
    }

    /* Exactly one `:root` rule carrying colour declarations, across the emitted sheets. */
    const colourRoots = []
    for (const [path, scan] of sheets) {
      for (const rule of scan.rules) {
        if (rule.context !== null) continue
        const carries = [...rule.declarations.keys()].some((name) => name.startsWith('--c-'))
        if (!carries) continue
        if (selectorParts(rule.selector).includes(':root')) colourRoots.push({ path, rule })
      }
    }
    if (colourRoots.length !== 1) {
      return fail(`expected exactly one :root rule carrying colour declarations; found ${colourRoots.length}${colourRoots.length > 0 ? ` (${colourRoots.map((entry) => `${entry.path}: ${entry.rule.selector}`).join('; ')})` : ''}`)
    }

    for (const [path, scan] of sheets) {
      for (const rule of scan.rules) {
        const isColourRoot = path === colourRoots[0].path && rule === colourRoots[0].rule
        for (const [name, value] of rule.declarations) {
          const where = `${path}: ${rule.selector} { ${name}: ${value} }`
          if (!isColourRoot) {
            for (const literal of literalsIn(value)) problems.push(`${where} carries a colour literal ${literal}`)
            for (const named of namedColoursIn(name, value)) problems.push(`${where} carries the named colour ${named}`)
          }
          if (name === 'filter' || name === 'backdrop-filter') problems.push(`${where} uses a banned ${name}`)
          if (name === 'box-shadow' && value.trim().toLowerCase() !== 'none') problems.push(`${where} uses a box-shadow`)
          if (name === 'text-shadow') problems.push(`${where} uses a text-shadow`)
          if (name === 'opacity') problems.push(`${where} uses opacity`)
          if (/linear-gradient\(|radial-gradient\(/i.test(value)) problems.push(`${where} uses a gradient`)
        }
      }
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`one :root colour block (${colourRoots[0].path}); no colour literal, no named colour, no filter, shadow, gradient or opacity outside it`)
  },
}

export const lookTokens = {
  code: 'look.tokens',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const look = facts.record?.look
    /* The expected set is the package's own sheet, derived at load: a derivation that could not be made
       leaves the comparison without its instrument, which is `unchecked`, not a pass. */
    if (LOOK_TABLE_PROBLEM !== undefined) return unchecked(LOOK_TABLE_PROBLEM)
    const expected = LOOK_COLOURS.get(look)
    if (expected === undefined) return unchecked(`the record names no look this reader knows: ${JSON.stringify(look)}`)
    if (facts.colourProblem !== undefined) return unchecked(facts.colourProblem)

    const problems = []
    /* No `--c-*` name outside the twelve, anywhere in the emitted sheets. A sheet that could not be scanned
       was not read for this rule, so the half answers `unchecked` rather than claiming no unknown role. */
    const known = new Set(COLOUR_TOKENS)
    for (const [path, scan] of facts.css) {
      if (scan.ok !== true) return unchecked(`${path} could not be read: ${scan.detail}`)
      for (const rule of scan.rules) {
        for (const name of rule.declarations.keys()) {
          if (name.startsWith('--c-') && !known.has(name)) problems.push(`${path}: ${rule.selector} declares an unknown colour role ${name}`)
        }
      }
    }
    /* Each of the twelve present once in the colour block. */
    const raw = `${facts.colourRoot?.raw ?? ''}`
    const declared = facts.colours
    for (const name of COLOUR_TOKENS) {
      if (!declared.has(name)) {
        problems.push(`the :root colour block does not declare ${name}`)
        continue
      }
      const occurrences = (raw.match(new RegExp(`${name}\\s*:`, 'g')) ?? []).length
      if (occurrences > 1) problems.push(`the :root colour block declares ${name} ${occurrences} times`)
      const value = declared.get(name).trim()
      const wanted = expected[name]
      if (value.toLowerCase() !== wanted.toLowerCase()) {
        problems.push(`${name} is ${value} but the ${look} look is ${wanted}`)
      }
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`the ${look} look's twelve colour roles match the package's set`)
  },
}

const TEXT_PAIRS = [
  ['--c-ink', '--c-bg', 4.5],
  ['--c-muted', '--c-bg', 4.5],
  ['--c-muted', '--c-surface', 4.5],
  ['--c-accent', '--c-bg', 4.5],
  ['--c-accent', '--c-surface', 4.5],
  ['--c-on-accent', '--c-accent', 4.5],
  ['--c-success', '--c-bg', 4.5],
  ['--c-success', '--c-surface', 4.5],
  ['--c-warning', '--c-bg', 4.5],
  ['--c-warning', '--c-surface', 4.5],
  ['--c-danger', '--c-bg', 4.5],
  ['--c-danger', '--c-surface', 4.5],
  ['--c-info', '--c-bg', 4.5],
  ['--c-info', '--c-surface', 4.5],
]

function measured(facts, pairs) {
  const rows = []
  for (const [fg, bg, threshold] of pairs) {
    const fgValue = facts.colours.get(fg)
    const bgValue = facts.colours.get(bg)
    if (fgValue === undefined || bgValue === undefined) {
      return { problem: `the colour block does not declare ${fgValue === undefined ? fg : bg}` }
    }
    const value = ratio(fgValue, bgValue)
    if (value === undefined) {
      return { problem: `${fg} (${fgValue}) or ${bg} (${bgValue}) is not a colour this reader can measure` }
    }
    rows.push({ name: `${fg.slice(4)}/${bg.slice(4)}`, value, threshold })
  }
  return { rows }
}

const report = (rows) => rows.map((row) => `${row.name} ${Math.round(row.value * 100) / 100}`).join(', ')

export const contrastText = {
  code: 'contrast.text',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    if (facts.colourProblem !== undefined) return unchecked(facts.colourProblem)
    const read = measured(facts, TEXT_PAIRS)
    if (read.problem !== undefined) return unchecked(read.problem)
    const below = read.rows.filter((row) => row.value < row.threshold)
    if (below.length > 0) {
      return fail(`${below.map((row) => `${row.name} ${Math.round(row.value * 100) / 100} < ${row.threshold}`).join('; ')}; every pair: ${report(read.rows)}`)
    }
    return pass(report(read.rows))
  },
}

export const contrastUi = {
  code: 'contrast.ui',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    if (facts.colourProblem !== undefined) return unchecked(facts.colourProblem)
    const strong = facts.colours.get('--c-strong')
    const bg = facts.colours.get('--c-bg')
    const surface = facts.colours.get('--c-surface')
    if (strong === undefined || bg === undefined || surface === undefined) {
      return unchecked('the colour block does not declare --c-strong, --c-bg and --c-surface')
    }
    const onBg = ratio(strong, bg)
    const onSurface = ratio(strong, surface)
    if (onBg === undefined || onSurface === undefined) {
      return unchecked('the control-border colours are not colour values this reader can measure')
    }
    const round = (value) => Math.round(value * 100) / 100
    const look = facts.record?.look
    const design = LOOK_COLOURS.get(look)
    if (design === undefined) return unchecked(`the record names no look this reader knows: ${JSON.stringify(look)}`)
    const designOnSurface = ratio(design['--c-strong'], design['--c-surface'])
    if (designOnSurface === undefined) return unchecked(`the ${look} look's own strong/surface pair is not a colour this reader can measure`)
    /* The floor is 3:1; a look whose own palette states a lower value is the design's named exception, and the
       note names the measured pair rather than a number written here. A look whose palette states 3:1 or more
       and whose emitted pair falls below it has drifted from its own set. */
    const exceptionNote = onSurface < 3 && designOnSurface < 3
      ? `; strong/surface ${round(onSurface)} is the ${look} look's own exception (its palette states ${round(designOnSurface)}): the structural answer — no control border on a band — is not machine-checked`
      : ''
    const detail = `strong/bg ${round(onBg)}; line is decorative and not gated; strong/surface ${round(onSurface)}${exceptionNote}`
    if (onBg < 3) return fail(`strong/bg ${round(onBg)} < 3; ${detail}`)
    if (onSurface < 3 && designOnSurface >= 3) {
      return fail(`strong/surface ${round(onSurface)} < 3 while the ${look} look's palette states ${round(designOnSurface)}; ${detail}`)
    }
    return pass(detail)
  },
}

function siteSheets(facts) {
  const sheets = []
  for (const [path, scan] of facts.css) {
    if (scan.ok !== true) return { problem: `${path} could not be read: ${scan.detail}` }
    sheets.push({ path, scan })
  }
  if (sheets.length === 0) return { problem: 'the folder carries no CSS to read' }
  return { sheets }
}

export const typeSet = {
  code: 'type.set',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const read = siteSheets(facts)
    if (read.problem !== undefined) return unchecked(read.problem)
    const problems = []
    for (const { path, scan } of read.sheets) {
      const set = path.endsWith('deck.css') ? DECK_SIZES : SITE_SIZES
      const label = path.endsWith('deck.css') ? 'deck' : 'site'
      for (const rule of scan.rules) {
        for (const [name, value] of rule.declarations) {
          if (name !== 'font-size') continue
          const text = value.trim()
          const where = `${path}: ${rule.selector} { font-size: ${text} }`
          const variable = /^var\(\s*--t-[a-z0-9-]+\s*\)$/i.exec(text)
          if (variable !== null) continue
          const clamp = clampBounds(text)
          if (clamp !== undefined) {
            if (clamp.min === undefined || clamp.max === undefined) {
              problems.push(`${where} is a clamp whose bounds are not px/rem and cannot be placed in the ${label} size set`)
              continue
            }
            if (!set.has(clamp.min) || !set.has(clamp.max)) {
              problems.push(`${where} has clamp bounds ${clamp.min}/${clamp.max} outside the ${label} size set {${[...set].join(', ')}}`)
            }
            continue
          }
          const px = pxOf(text)
          if (px === undefined) {
            problems.push(`${where} is neither a var(--t-*), a clamp nor a px/rem literal`)
            continue
          }
          if (!set.has(px)) problems.push(`${where} is outside the ${label} size set {${[...set].join(', ')}}`)
        }
      }
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`every declared font-size is a role token, a clamp inside the set, or a literal in it`)
  },
}

export const spaceSet = {
  code: 'space.set',
  appliesTo: 'both',
  instrument: 'static',
  run(facts) {
    const read = siteSheets(facts)
    if (read.problem !== undefined) return unchecked(read.problem)
    const problems = []
    const exemptions = []
    for (const { path, scan } of read.sheets) {
      for (const rule of scan.rules) {
        const srOnly = selectorParts(rule.selector).some((part) => part.trim() === '.sr-only')
        /* The masthead's 20 px is the design's own paste-ready value, off the space scale; the gate allows it by name. */
        const masthead = selectorParts(rule.selector).some((part) => part.trim() === '.s-header')
        for (const [name, value] of rule.declarations) {
          if (!SPACING_PROPERTY.test(name)) continue
          const where = `${path}: ${rule.selector} { ${name}: ${value} }`
          for (const token of tokensOf(value)) {
            if (token === '0' || token === '0px' || token === '0rem') continue
            if (token === 'auto') continue
            if (/^var\(\s*--(sp|pad)-[a-z0-9-]+\s*\)$/i.test(token)) continue
            /* Any other var() is allowed only when the emitted :root resolves it to a scale entry: the grid's
               own --gutter and --row-gap are 24 and 32, and a token whose value is off the scale is still a fail. */
            const reference = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(token)
            if (reference !== null) {
              const resolved = facts.rootTokens?.get(reference[1])
              const resolvedPx = resolved === undefined ? undefined : pxOf(resolved.trim())
              if (resolvedPx === undefined) {
                problems.push(`${where} carries ${token}, and the emitted :root declares no scale length for ${reference[1]}`)
                continue
              }
              if (resolvedPx < 0 || !SPACE_SCALE.has(resolvedPx)) {
                problems.push(`${where} resolves ${reference[1]} to ${resolvedPx}px, outside the space scale`)
              }
              continue
            }
            const px = pxOf(token)
            if (px === undefined) {
              problems.push(`${where} carries ${token}, which is none of 0, auto, var(--sp-*), var(--pad-*) or a scale length`)
              continue
            }
            if (px < 0) {
              /* The visually-hidden utility is the design's own paste; its -1px is named, not hidden. */
              if (srOnly) { exemptions.push(`${where} (the sr-only utility's negative margin, allowed by design)`); continue }
              problems.push(`${where} is negative`)
              continue
            }
            /* The two allowances are anchored by check-page.mjs: a mutation proves each is still needed. */
            if (masthead && name === 'padding-block' && px === 20) {
              exemptions.push(`${where} (the masthead's stated 20 px, the design's own value and not a scale step)`)
              continue
            }
            if (!SPACE_SCALE.has(px)) problems.push(`${where} uses ${px}px, outside the space scale {${[...SPACE_SCALE].join(', ')}}`)
          }
        }
      }
    }
    if (problems.length > 0) return fail(list(problems))
    const exempt = exemptions.length > 0 ? `; allowed: ${list(exemptions)}` : ''
    return pass(`every margin, padding and gap is a scale entry, a pad/sp token or 0${exempt}`)
  },
}
