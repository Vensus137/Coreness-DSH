/**
 * The static check catalogue of Page Studio — the reader half of the feature.
 *
 * `checkDir({ dir })` reads a folder the builder wrote and answers with one gate per code:
 * `{ ok, dir, kind, gates, summary }`. Every gate is `{ code, state, detail? }` and `state` is exactly
 * `pass`, `fail` or `unchecked`. The honesty rules are binding:
 *
 * - a gate whose subject the reader could not read is `unchecked` with the reason, never `pass`;
 * - a malformed document makes `html.parse` `fail` and every tree gate `unchecked`;
 * - a gate with no instrument on this machine is `unchecked` — the eight computed gates are read by
 *   `studio_shot` only, so this pass names them and says it has no browser;
 * - a gate that does not apply to the folder's kind is `unchecked` with `not applicable: <kind>`.
 *
 * `GATES` is the code catalogue: the 42 static codes (with the four motion codes replacing the removed
 * `motion.none`) plus the eight Edge codes, each `{ code, appliesTo,
 * instrument }`. A folder the studio did not write is refused with `target.missing`, `target.isFile` or
 * `target.notOwned` — this pass never half-checks foreign HTML.
 */
import { statSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

import { readFolder, ownershipOf } from './lib/folder.mjs'
import { notApplicable, unchecked } from './lib/result.mjs'
import { htmlParse, htmlLang, htmlTitle, htmlMain, htmlH1, htmlHeadingOrder, htmlAlt, htmlId, htmlSkip, landmarksHeader, landmarksFooter, landmarksDeck, anchorScheme } from './lib/gates/document.mjs'
import { tokensOnly, lookTokens, contrastText, contrastUi, typeSet, spaceSet } from './lib/gates/tokens.mjs'
import { layoutNoCenter, colourOnly, linkCue, annotationBans, surfaceBand } from './lib/gates/page.mjs'
import { externalAsset, externalScript, scriptClassic, assetImage, contentPlaceholder, bytesTotal, evidenceOutside } from './lib/gates/assets.mjs'
import { deckSlides, deckHeading, deckCounter, deckKeys, deckFullscreen } from './lib/gates/deck.mjs'
import { recipeComposition, recipeRhythm } from './lib/gates/composition.mjs'
import { motionDuration, motionProperty, motionReduced, motionAutoplay } from './lib/gates/motion.mjs'

/**
 * The eight computed codes. `studio_shot` owns their instrument and exports the same list as
 * `EDGE_GATES`; this catalogue carries them so the static and computed halves meet in one place.
 */
export const EDGE_GATES = [
  { code: 'render.contrast', appliesTo: 'both', instrument: 'edge' },
  { code: 'focus.ring', appliesTo: 'both', instrument: 'edge' },
  { code: 'render.target', appliesTo: 'both', instrument: 'edge' },
  { code: 'render.overflow', appliesTo: 'both', instrument: 'edge' },
  { code: 'type.body', appliesTo: 'both', instrument: 'edge' },
  { code: 'deck.fit', appliesTo: 'deck', instrument: 'edge' },
  { code: 'deck.lines', appliesTo: 'deck', instrument: 'edge' },
  { code: 'render.shot', appliesTo: 'both', instrument: 'edge' },
]

/** The static catalogue, with the four motion codes in the removed row's place. */
export const STATIC_GATES = [
  tokensOnly,
  lookTokens,
  contrastText,
  contrastUi,
  typeSet,
  spaceSet,
  layoutNoCenter,
  colourOnly,
  linkCue,
  annotationBans,
  surfaceBand,
  htmlParse,
  htmlLang,
  htmlTitle,
  htmlMain,
  htmlH1,
  htmlHeadingOrder,
  htmlAlt,
  htmlId,
  htmlSkip,
  landmarksHeader,
  landmarksFooter,
  landmarksDeck,
  anchorScheme,
  externalAsset,
  externalScript,
  scriptClassic,
  assetImage,
  contentPlaceholder,
  bytesTotal,
  evidenceOutside,
  deckSlides,
  deckHeading,
  deckCounter,
  deckKeys,
  deckFullscreen,
  recipeComposition,
  recipeRhythm,
  motionDuration,
  motionProperty,
  motionReduced,
  motionAutoplay,
]

/**
 * The code catalogue: every static and computed code with its instrument and the kind it belongs to.
 * `check-composition.mjs` asserts both directions — every code has a case, and no case names a code here.
 */
export const GATES = [...STATIC_GATES, ...EDGE_GATES].map((gate) => ({
  code: gate.code,
  appliesTo: gate.appliesTo,
  instrument: gate.instrument,
}))

/**
 * A refusal is a refusal, not an empty check: exactly `{ ok: false, code, message }` (the `studio_check`
 * schema's root `oneOf`, so a refusal carries no gates and no summary — inventing an
 * empty green one would teach the model that a refusal looks like a clean pass).
 */
function refuse(code, message) {
  return { ok: false, code, message }
}

/**
 * The folder a `dir` names. An absolute path stands as given; a relative one is resolved against the
 * session's own working directory — read, without filesystem I/O, through the platform service that
 * owns it, which is the same base `studio_build` and `studio_shot` resolve against — and against the
 * host process's cwd only when the composition carries no working directory service or no session
 * (a bare fixture, a caller without a session). A session directory that cannot be read is a refusal,
 * never a silent fallback to another base.
 * @param {string} dir
 * @param {{ exec?: object, ctx?: object }} doors
 * @returns {{ path: string } | { refusal: string }}
 */
function folderOf(dir, { exec, ctx }) {
  if (isAbsolute(dir)) return { path: resolve(dir) }
  const session = exec?.agent?.session
  const workingDirectory = typeof ctx?.get === 'function' ? ctx.get('workingDirectory') : undefined
  if (workingDirectory === undefined || session === undefined) return { path: resolve(dir) }
  let cwd
  try {
    cwd = workingDirectory.get(session)
  } catch (error) {
    return {
      refusal: `dir is relative and the session working directory could not be read: ${error?.message ?? String(error)}; pass an absolute path`,
    }
  }
  if (typeof cwd !== 'string' || !isAbsolute(cwd)) {
    return {
      refusal: `dir is relative and the session working directory is ${JSON.stringify(cwd)}; pass an absolute path`,
    }
  }
  return { path: resolve(cwd, dir) }
}

/**
 * Check a folder the builder wrote. The folder is resolved from the session the tool call belongs to —
 * never from whatever directory the host process was started in.
 * @param {{ dir?: string, exec?: object, ctx?: object }} args
 * @returns {{ ok: true, dir: string, kind: string, gates: object[], summary: object }
 *          | { ok: false, code: string, message: string }}
 */
export function checkDir({ dir, exec, ctx } = {}) {
  if (typeof dir !== 'string' || dir.trim() === '') {
    return refuse('target.missing', 'the dir argument is absent or empty; studio_check reads a folder studio_build wrote')
  }
  const folder = folderOf(dir, { exec, ctx })
  if (folder.refusal !== undefined) return refuse('target.missing', folder.refusal)
  const target = folder.path
  let info
  try {
    info = statSync(target)
  } catch (error) {
    return refuse('target.missing', `the folder cannot be read: ${error.message}`)
  }
  if (!info.isDirectory()) return refuse('target.isFile', 'the path is a file, not a folder')

  const facts = readFolder(target)
  const ownership = ownershipOf(facts)
  if (ownership.ok !== true) {
    return refuse('target.notOwned', `the folder carries no usable studio marker: ${ownership.detail}. A user's own page is checked by reading, not by pretending to a gate`)
  }

  const kind = facts.record.kind === 'presentation' ? 'deck' : 'page'
  facts.kind = kind
  const context = { kind }

  const gates = []
  for (const gate of STATIC_GATES) {
    let result
    if (facts.walkError !== undefined) {
      /* The folder could not be enumerated: no gate's subject — the document, a sheet, a script, the file list
         or the byte sum — was fully read, so every gate answers the reader's own reason. A gate must never
         speak about a folder it could not list, and a missing index.html here would be a lie of omission. */
      result = unchecked(facts.walkError)
    } else if (gate.appliesTo !== 'both' && gate.appliesTo !== kind) {
      result = notApplicable(kind, `the ${gate.code} gate belongs to the ${gate.appliesTo} document`)
    } else {
      try {
        result = gate.run(facts, context)
      } catch (error) {
        /* A gate that cannot run has no result to report: unchecked with the reason, never a silent pass. */
        result = unchecked(`the gate could not run: ${error?.message ?? String(error)}`)
      }
    }
    gates.push({
      code: gate.code,
      state: result.state,
      ...(result.detail === undefined ? {} : { detail: result.detail }),
    })
  }
  for (const gate of EDGE_GATES) {
    const result = gate.appliesTo !== 'both' && gate.appliesTo !== kind
      ? notApplicable(kind, `the ${gate.code} gate belongs to the ${gate.appliesTo} document`)
      : unchecked(`studio_shot computes ${gate.code} on the rendered page; studio_check has no browser`)
    gates.push({ code: gate.code, state: result.state, detail: result.detail })
  }

  const summary = { pass: 0, fail: 0, unchecked: 0, total: gates.length }
  for (const gate of gates) summary[gate.state] += 1
  return { ok: true, dir: target, kind: facts.record.kind, gates, summary }
}
