/**
 * `studio_shot`: the Edge evidence pass over one Page Studio folder. One headless Edge per call, one
 * capture per viewport, the computed gates of the Edge catalogue, the PNG evidence outside the target,
 * and a kill whose exit is awaited on every path. Any failure — no Edge, a failed launch, a denied
 * write, a killed capture, an unsettled still — answers `unchecked` with its reason, never a pass.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative } from 'node:path'

import { GENERATOR, SCHEMA } from '../lib/library.mjs'

import { connectCdp } from './cdp.js'
import { launchEdge, newProfileDir, removeProfileDir, resolveEdge, stopEdge } from './edge.js'
import {
  buildGates,
  computeViewports,
  heightOf,
  DECK_VIEWPORT,
  SHOT_VIEWPORTS,
} from './gates.js'
import { deckFitExpression, deckSlideExpression, deckVisibleExpression, measureExpression } from './measure.js'
import {
  checkEvidencePolicy,
  createEvidenceDir,
  CVD_SIMULATIONS,
  EVIDENCE_DIR_NAME,
  evidencePathExists,
  expectedShotNames,
  planEvidencePath,
  runLabel,
  SHOT_NAMES,
  writeEvidenceFile,
} from './evidence.js'

export { EDGE_GATES } from './gates.js'
export { EVIDENCE_DIR_NAME, SHOT_NAMES } from './evidence.js'
export { EDGE_KNOWN_PATH, resolveEdge } from './edge.js'

const KINDS = ['landing', 'portfolio', 'article', 'presentation']
const DEFAULT_LAUNCH_TIMEOUT_MS = 20000
const DEFAULT_CAPTURE_TIMEOUT_MS = 30000
const CONNECT_TIMEOUT_MS = 15000
const STILL_INTERVAL_MS = 100

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const errorMessage = (error) => (error instanceof Error ? error.message : String(error))

/** The path a resolved FsTarget stands for; the display path first, the realpath identity second. */
function pathOf(target) {
  if (!target || typeof target !== 'object') return null
  if (typeof target.displayPath === 'string' && target.displayPath.length > 0) return target.displayPath
  if (target.targetKey !== undefined && target.targetKey !== null) return String(target.targetKey)
  return null
}

/** The injected resolver may answer a path, an object with `executable`, or nothing at all. */
function normalizeEdge(result) {
  if (result === null || result === undefined) {
    return { executable: null, via: null, reason: 'no Edge executable was found (the resolver answered nothing)' }
  }
  if (typeof result === 'string') {
    return result.trim().length > 0
      ? { executable: result, via: 'injected' }
      : { executable: null, via: null, reason: 'no Edge executable was found (the resolver answered an empty path)' }
  }
  if (typeof result === 'object') {
    const executable = typeof result.executable === 'string' && result.executable.trim().length > 0 ? result.executable : null
    return {
      executable,
      via: result.via ?? (executable ? 'injected' : null),
      reason: executable ? undefined : result.reason ?? 'no Edge executable was found (the resolver answered no path)',
      attempts: result.attempts,
    }
  }
  return { executable: null, via: null, reason: 'the Edge resolver answered an unusable value' }
}

function positiveNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

/**
 * The settle rule over every sample taken so far: no running animation at load, and no element still
 * computing a transition duration under the emulated reduced-motion preference.
 * @param {object[]} samples
 * @returns {string|null} the reason the still is not settled, or null
 */
function settleProblem(samples) {
  for (const sample of samples) {
    const transitions = sample?.transitions
    if (!transitions) continue
    if (transitions.animations === null) return 'document.getAnimations() is unavailable in this page; the settle rule cannot be proved'
    if (transitions.animations !== 0) {
      return `document.getAnimations() is ${transitions.animations} at load (must be 0 under prefers-reduced-motion: reduce)`
    }
    if (transitions.nonZero.length > 0) {
      const shown = transitions.nonZero.slice(0, 3).map((item) => `${item.selector} ${item.duration}`)
      return `a sampled element computes a non-zero transition-duration under prefers-reduced-motion: reduce: ${shown.join(', ')} (${transitions.elements} element(s) sampled)`
    }
  }
  return null
}

async function captureStill({ session, viewport, captureTimeoutMs }) {
  const metrics = await session.layoutMetrics()
  const content = metrics?.cssContentSize ?? metrics?.contentSize
  if (!content || !(content.width > 0) || !(content.height > 0)) {
    throw new Error('Page.getLayoutMetrics answered no usable content size; a full-page still cannot be cut')
  }
  const clip = { x: 0, y: 0, width: Math.max(1, Math.ceil(content.width)), height: Math.max(1, Math.ceil(content.height)), scale: 1 }
  const first = await session.capture({ clip, timeoutMs: captureTimeoutMs })
  await delay(STILL_INTERVAL_MS)
  const second = await session.capture({ clip, timeoutMs: captureTimeoutMs })
  if (first.length === 0 || second.length === 0) {
    return { settleReason: `the capture at ${viewport.width}x${viewport.height} returned no bytes` }
  }
  if (!first.equals(second)) {
    return {
      settleReason: `two captures ${STILL_INTERVAL_MS} ms apart differ at ${viewport.width}x${viewport.height} (${first.length} vs ${second.length} bytes): the still frame is not proven under prefers-reduced-motion: reduce`,
    }
  }
  return { buffer: first, clip }
}

/**
 * The deck drive: measure each slide's rendered lines by advancing with the deck's own key map, then
 * prove Home/End reach the first and last slide and return to the first for the still. A drive that
 * cannot move the deck does not abort the run; it leaves `deck.lines` unchecked with the reason.
 */
async function walkDeck({ session }) {
  const count = await session.evaluate('document.querySelectorAll(".stage .slide").length')
  if (!Number.isInteger(count) || count < 1) throw new Error('the deck carries no .stage .slide element')
  const slides = []
  const samples = []
  const keyDrive = { presses: 0, completed: true, lastCounter: null, home: null, end: null, reset: null }
  const fail = async (reason) => {
    keyDrive.completed = false
    if (samples.length === 0) samples.push(await session.evaluate(measureExpression({ deck: true })))
    return { slides: null, samples, keyDrive, failure: reason }
  }
  for (let index = 0; index < count; index += 1) {
    const visible = await session.evaluate(deckVisibleExpression())
    if (!visible || visible.index !== index) {
      return fail(
        `the deck did not show slide ${index + 1} after the key drive (visible index ${visible?.index ?? 'none'}, counter ${visible?.counter ?? 'none'}); the per-slide line count cannot be read`,
      )
    }
    slides.push(await session.evaluate(deckSlideExpression()))
    samples.push(await session.evaluate(measureExpression({ deck: true })))
    if (index < count - 1) {
      await session.pressKey('ArrowRight')
      keyDrive.presses += 1
      await session.frames()
    }
  }
  const last = await session.evaluate(deckVisibleExpression())
  keyDrive.lastCounter = last?.counter ?? null
  await session.pressKey('Home')
  await session.frames()
  keyDrive.home = await session.evaluate(deckVisibleExpression())
  await session.pressKey('End')
  await session.frames()
  keyDrive.end = await session.evaluate(deckVisibleExpression())
  await session.pressKey('Home')
  await session.frames()
  keyDrive.reset = await session.evaluate(deckVisibleExpression())
  const moved = keyDrive.home?.index === 0 && keyDrive.end?.index === count - 1 && keyDrive.reset?.index === 0
  if (!moved) {
    return fail(
      `the deck key drive did not move the visible slide (Home -> ${keyDrive.home?.index ?? 'none'}, End -> ${keyDrive.end?.index ?? 'none'}, back -> ${keyDrive.reset?.index ?? 'none'}; counter ${keyDrive.lastCounter ?? 'none'})`,
    )
  }
  return { slides, samples, keyDrive, failure: null }
}

/**
 * The pass.
 * @param {object} options
 * @param {string} options.dir the built folder
 * @param {number[]} [options.viewports] computed widths; 1440 and 390 are always included
 * @param {object} [options.exec] the platform's tool-execution context
 * @param {object} options.ctx the plugin context (`fs`, `sandboxPolicy`, `subprocess`)
 * @param {Function} [options.resolveEdge] injected resolver (default: PATH, then the known path)
 * @param {Function} [options.spawn] injected spawn (default: `ctx.subprocess.spawn`)
 * @param {Function} [options.cdp] injected CDP connector (default: a real WebSocket session)
 * @param {number} [options.launchTimeoutMs]
 * @param {number} [options.captureTimeoutMs]
 * @returns {Promise<{ status: 'done'|'unchecked', dir?: string, evidenceDir?: string, shots: Array<{ name: string, path: string, viewport: number, cvd?: string }>, gates: object[], reason?: string }>}
 */
export async function shotDir(options = {}) {
  const input = options && typeof options === 'object' ? options : {}
  const ctx = input.ctx
  const exec = input.exec
  const expectedNames = expectedShotNames()
  const state = {
    dirPath: typeof input.dir === 'string' ? input.dir : null,
    deck: false,
    evidenceDir: null,
    shots: [],
    raw: { viewports: [], deckFit: null, deckSlides: null, keyDrive: null, deckLinesFailure: null },
    settleReason: null,
  }
  const assemble = (fatalReason) => {
    try {
      return buildGates({
        deck: state.deck,
        raw: state.raw,
        expectedNames,
        writtenShots: state.shots,
        settleReason: state.settleReason ?? undefined,
        fatalReason,
      })
    } catch (error) {
      return buildGates({
        deck: false,
        raw: { viewports: [] },
        expectedNames,
        writtenShots: [],
        settleReason: undefined,
        fatalReason: `the gate assembly failed: ${errorMessage(error)}`,
      })
    }
  }
  const shotList = () =>
    state.shots.map(({ name, path, viewport, cvd }) => ({
      name,
      path,
      viewport,
      ...(cvd ? { cvd } : {}),
    }))
  const fail = (reason) => ({
    status: 'unchecked',
    ...(typeof state.dirPath === 'string' ? { dir: state.dirPath } : {}),
    ...(state.evidenceDir ? { evidenceDir: state.evidenceDir } : {}),
    shots: shotList(),
    gates: assemble(reason),
    reason,
  })

  if (!ctx || typeof ctx !== 'object') return fail('no plugin context was passed; the file service, sandbox policy and subprocess are unreachable')
  if (typeof input.dir !== 'string' || input.dir.trim().length === 0) return fail('dir must be a non-empty folder path')
  const fs = ctx.fs
  if (!fs || typeof fs.resolve !== 'function' || typeof fs.fileUrl !== 'function' || typeof fs.contains !== 'function') {
    return fail('ctx.fs lacks resolve/fileUrl/contains; the page cannot be opened as a resolved FsTarget')
  }
  if (!ctx.sandboxPolicy || typeof ctx.sandboxPolicy.resolve !== 'function') {
    return fail('ctx.sandboxPolicy is unavailable; the evidence write cannot be fenced')
  }
  const signal = exec?.signal
  let cwd = null
  if (!isAbsolute(input.dir)) {
    if (!ctx.workingDirectory || typeof ctx.workingDirectory.ensure !== 'function') {
      return fail('dir is relative and ctx.workingDirectory is unavailable; the session cwd cannot be resolved')
    }
    try {
      cwd = await ctx.workingDirectory.ensure(exec?.agent, signal)
    } catch (error) {
      return fail(`the session cwd could not be read: ${errorMessage(error)}`)
    }
    if (typeof cwd !== 'string' || !isAbsolute(cwd)) return fail('the session cwd came back empty; a relative dir cannot be resolved')
  }
  const resolveOptions = { ...(cwd ? { cwd } : {}), ...(signal ? { signal } : {}) }

  let dirTarget
  try {
    dirTarget = await fs.resolve(input.dir, resolveOptions)
  } catch (error) {
    return fail(`the target folder could not be resolved: ${errorMessage(error)}`)
  }
  const dirPath = pathOf(dirTarget)
  if (!dirPath) return fail('the resolved target carries no path; the folder cannot be read')
  state.dirPath = dirPath
  if (typeof fs.stat === 'function') {
    let info
    try {
      info = await fs.stat(dirTarget, signal)
    } catch (error) {
      return fail(`the target folder could not be read: ${errorMessage(error)}`)
    }
    if (!info) return fail(`the target folder does not exist: ${dirPath}`)
    if (info.type !== 'directory') return fail(`the target is not a folder (${info.type}): ${dirPath}`)
  }

  let record
  try {
    record = JSON.parse(await readFile(join(dirPath, 'page.json'), 'utf8'))
  } catch (error) {
    return fail(`no readable page.json in ${dirPath}: ${errorMessage(error)}; studio_shot does not guess page vs deck`)
  }
  if (!record || record._generator !== GENERATOR || record._schema !== SCHEMA) {
    return fail(
      `the folder is not a Page Studio build: page.json _generator=${JSON.stringify(record?._generator)} _schema=${JSON.stringify(record?._schema)}; studio_shot does not guess page vs deck`,
    )
  }
  if (!KINDS.includes(record.kind)) return fail(`page.json records an unknown kind ${JSON.stringify(record.kind)}`)
  state.deck = record.kind === 'presentation'

  let indexTarget
  try {
    indexTarget = await fs.resolve(join(dirPath, 'index.html'), {})
  } catch (error) {
    return fail(`index.html could not be resolved inside ${dirPath}: ${errorMessage(error)}`)
  }
  let pageUrl
  try {
    pageUrl = fs.fileUrl(indexTarget)
  } catch (error) {
    return fail(`ctx.fs.fileUrl failed for the resolved index.html target: ${errorMessage(error)}`)
  }
  if (typeof pageUrl !== 'string' || !pageUrl.startsWith('file:')) {
    return fail(`ctx.fs.fileUrl did not answer a file: URL for the resolved index.html target (got ${JSON.stringify(pageUrl)}); the page cannot be opened`)
  }
  if (typeof fs.stat === 'function') {
    let info
    try {
      info = await fs.stat(indexTarget, signal)
    } catch (error) {
      return fail(`index.html could not be read: ${errorMessage(error)}`)
    }
    if (!info) return fail(`index.html does not exist in ${dirPath}`)
    if (info.type !== 'file') return fail(`index.html is not a file (${info.type}) in ${dirPath}`)
  }

  const run = runLabel()
  const evidencePath = planEvidencePath(dirPath, run)
  if (evidencePathExists(evidencePath)) return fail(`the evidence run directory already exists: ${evidencePath}; refusing to reuse a run label`)
  let evidenceTarget
  try {
    evidenceTarget = await fs.resolve(evidencePath, {})
  } catch (error) {
    return fail(`the evidence path could not be resolved: ${errorMessage(error)}`)
  }
  let insideTarget
  try {
    insideTarget = fs.contains(dirTarget, evidenceTarget)
  } catch (error) {
    return fail(`ctx.fs.contains failed for the evidence path: ${errorMessage(error)}`)
  }
  if (insideTarget) return fail(`the evidence directory resolves inside the target (${evidencePath}); it must be a sibling outside the deliverable`)
  const pathRelative = relative(dirPath, evidencePath)
  if (pathRelative === '' || (!pathRelative.startsWith('..') && !isAbsolute(pathRelative))) {
    return fail(`the evidence directory is not outside the target by path (${evidencePath})`)
  }
  if (dirname(evidencePath) !== join(dirPath, '..', EVIDENCE_DIR_NAME) || basename(evidencePath) !== run) {
    return fail(`the evidence path does not carry the planned sibling layout (${evidencePath})`)
  }

  let policy
  try {
    policy = ctx.sandboxPolicy.resolve(exec?.agent === undefined ? {} : { session: exec.agent.session })
  } catch (error) {
    return fail(`the sandbox policy could not be resolved: ${errorMessage(error)}`)
  }
  const policyCheck = checkEvidencePolicy(policy, evidencePath)
  if (!policyCheck.allowed) return fail(policyCheck.reason)

  const resolveEdgeFn = typeof input.resolveEdge === 'function' ? input.resolveEdge : resolveEdge
  let edge
  try {
    edge = normalizeEdge(await resolveEdgeFn({ ctx, exec }))
  } catch (error) {
    return fail(`the Edge resolution failed: ${errorMessage(error)}`)
  }
  if (!edge.executable) return fail(edge.reason ?? 'no Edge executable was found')

  const spawn =
    typeof input.spawn === 'function'
      ? input.spawn
      : (request) => {
          if (!ctx.subprocess || typeof ctx.subprocess.spawn !== 'function') {
            throw new Error('ctx.subprocess.spawn is unavailable; the Edge process cannot be started')
          }
          return ctx.subprocess.spawn(request)
        }
  const connect = typeof input.cdp === 'function' ? input.cdp : connectCdp
  const launchTimeoutMs = positiveNumber(input.launchTimeoutMs) ?? DEFAULT_LAUNCH_TIMEOUT_MS
  const captureTimeoutMs = positiveNumber(input.captureTimeoutMs) ?? DEFAULT_CAPTURE_TIMEOUT_MS
  let profileDir
  try {
    profileDir = newProfileDir()
  } catch (error) {
    return fail(`a fresh Edge profile could not be created under the OS temp directory: ${errorMessage(error)}`)
  }
  let launched
  try {
    launched = await launchEdge({ spawn, executable: edge.executable, profileDir, timeoutMs: launchTimeoutMs })
  } catch (error) {
    /* The launch saw Edge stopped itself; the profile it was given is this call's to remove, and a
       removal that fails is said beside the launch's own reason. */
    return fail([`the Edge launch failed: ${errorMessage(error)}`, ...removeProfileDir(profileDir)].join('; '))
  }

  const problems = []
  const writeShot = async (name, buffer, meta) => {
    if (!state.evidenceDir) {
      try {
        createEvidenceDir(evidencePath)
      } catch (error) {
        throw new Error(`the evidence directory could not be created: ${errorMessage(error)}`)
      }
      state.evidenceDir = evidencePath
    }
    try {
      const written = writeEvidenceFile(evidencePath, name, buffer)
      state.shots.push({ ...written, viewport: meta.viewport, ...(meta.cvd ? { cvd: meta.cvd } : {}) })
    } catch (error) {
      throw new Error(`the evidence file ${name} could not be written: ${errorMessage(error)}`)
    }
  }
  let session = null
  try {
    try {
      session = await connect({ port: launched.port, timeoutMs: CONNECT_TIMEOUT_MS })
    } catch (error) {
      problems.push(`the CDP endpoint announced on port ${launched.port} could not be driven: ${errorMessage(error)}`)
    }
    if (session) {
      await session.setReducedMotion('reduce')
      const widths = computeViewports(input.viewports)
      for (const width of widths) {
        const viewport = { width, height: heightOf(width) }
        await session.setViewport(viewport)
        await session.navigate(pageUrl)
        const samples = []
        if (state.deck && width === DECK_VIEWPORT) {
          const walk = await walkDeck({ session })
          state.raw.keyDrive = walk.keyDrive
          if (walk.slides) state.raw.deckSlides = walk.slides
          if (walk.failure) state.raw.deckLinesFailure = walk.failure
          samples.push(...walk.samples)
          state.raw.deckFit = await session.evaluate(deckFitExpression())
        } else {
          samples.push(await session.evaluate(measureExpression({ deck: state.deck })))
        }
        state.raw.viewports.push({ width, height: viewport.height, samples })
        const unsettled = settleProblem(samples)
        if (unsettled) {
          state.settleReason = unsettled
          break
        }
        if (SHOT_VIEWPORTS.includes(width)) {
          const still = await captureStill({ session, viewport, captureTimeoutMs })
          if (still.settleReason) {
            state.settleReason = still.settleReason
            break
          }
          const name = width === DECK_VIEWPORT ? SHOT_NAMES.desktop : SHOT_NAMES.mobile
          await writeShot(name, still.buffer, { viewport: width })
          if (width === DECK_VIEWPORT) {
            for (const simulation of CVD_SIMULATIONS) {
              await session.setVisionDeficiency(simulation)
              await session.frames()
              const buffer = await session.capture({ clip: still.clip, timeoutMs: captureTimeoutMs })
              await writeShot(SHOT_NAMES.cvd(simulation), buffer, { viewport: width, cvd: simulation })
            }
            await session.setVisionDeficiency('none')
          }
        }
      }
    }
  } catch (error) {
    problems.push(`the capture pass stopped: ${errorMessage(error)}`)
  } finally {
    if (session) {
      try {
        session.close()
      } catch {
        // the socket is already gone; nothing left to close
      }
    }
    const stopProblems = await stopEdge(launched.handle)
    problems.push(...stopProblems)
    /* The profile is removed only after the process range is proven stopped, and the removal's own
       failure is a problem of the run: a capture that leaves a profile behind is said, not hidden. */
    problems.push(...removeProfileDir(profileDir))
  }

  const fatalReason = problems.length > 0 ? problems.join('; ') : undefined
  const reason = [fatalReason, state.settleReason].filter(Boolean).join('; ') || undefined
  return {
    status: reason ? 'unchecked' : 'done',
    dir: dirPath,
    ...(state.evidenceDir ? { evidenceDir: state.evidenceDir } : {}),
    shots: shotList(),
    gates: assemble(fatalReason),
    ...(reason ? { reason } : {}),
  }
}
