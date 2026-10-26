/**
 * The target safety and the write path. Every check runs before a single byte
 * is written; the write goes through `ctx.fs.writeText` with the session's resolved sandbox policy and
 * the `fs/write-intent` waterfall, `page.json` last, and a failed write names the files that stand.
 *
 * A non-empty folder is writable only when its own `page.json` carries the studio's marker: the file
 * names alone cannot tell our residue from a user's page (an ordinary static page is `index.html` plus
 * `assets/`), so the marker is the only ownership proof and a failed first build's folder is refused.
 *
 * The three steps are separate on purpose: `planTarget` is pipeline step 4 (the target's own safety),
 * `planOutputs` is step 7 (each emitted path checked against the target), `writeEmitted` is step 8.
 */
import { join, resolve, sep } from 'node:path'

import { GENERATOR, SCHEMA } from '../lib/library.mjs'
import { refusal } from './manifest.mjs'

function normalized(value) {
  const absolute = resolve(String(value))
  return process.platform === 'win32' ? absolute.toLowerCase() : absolute
}

const samePath = (left, right) => normalized(left) === normalized(right)

/** Whether `child` is `parent` or lies inside it, case-insensitively on Windows. */
function isUnder(child, parent) {
  const inner = normalized(child)
  const outer = normalized(parent)
  return inner === outer || inner.startsWith(outer.endsWith(sep) ? outer : outer + sep)
}

const pathOf = (target) => String(target.targetKey ?? target.displayPath ?? '')
const displayOf = (target) => String(target.displayPath ?? target.targetKey ?? '')

/** The target refusal table, one sentence each; the detail is what the model reads. */
const TARGET_MESSAGES = {
  'target.missing': 'targetDir must name the folder to write: the build has no default target',
  'target.isWorkdir': 'targetDir is the session working directory itself; choose a subfolder of it or another folder',
  'target.isAncestor': 'targetDir contains the session working directory; choose a folder inside the working directory, not above it',
  'target.readOnly': 'the session is read-only, so the build cannot write; switch the session policy to write and retry',
  'target.outsideWorkspace': 'targetDir is outside the session workspace; choose a folder inside the working directory',
  'target.isFile': 'targetDir names an existing file, not a folder',
  'target.notEmpty': 'the folder is not empty and carries no page.json with the Page Studio marker; a folder left by a build that failed has no marker, so remove it or choose a new or empty folder (there is no force option)',
  'target.escape': 'an emitted path would leave the target folder, so nothing is written',
}

/** A target refusal, path always `targetDir`. */
function targetRefusal(code, detail) {
  return refusal(code, 'targetDir', detail ?? TARGET_MESSAGES[code])
}

/**
 * Whether a non-empty folder is ours: its `page.json` parses, carries the generator marker and the
 * schema number this build knows. Anything else — absent, unreadable, foreign, a schema from another
 * version — is not ours, however its top level is shaped: a failed first build leaves no marker, and
 * a user's page looks the same.
 */
async function carriesMarker(ctx, target, workdir, signal) {
  try {
    const pageJson = await ctx.fs.resolve(join(displayOf(target), 'page.json'), { cwd: workdir, signal })
    const record = JSON.parse(await ctx.fs.readText(pageJson, signal))
    if (record === null || typeof record !== 'object') return false
    return record._generator === GENERATOR && record._schema === SCHEMA
  } catch {
    return false
  }
}

/**
 * Validate the target without writing anything (pipeline step 4).
 * @param {{ targetDir: string, ctx: object, exec: object }} input
 * @returns {Promise<object>} `{ ok: true, target, dir, policy, workdir }` or a target refusal
 */
export async function planTarget({ targetDir, ctx, exec = {} }) {
  if (typeof targetDir !== 'string' || targetDir.trim() === '') return targetRefusal('target.missing')
  if (ctx === undefined || ctx.fs === undefined) throw new Error('studio_build needs ctx.fs: the build writes through the host filesystem')
  if (ctx.sandboxPolicy === undefined) throw new Error('studio_build needs ctx.sandboxPolicy: the write path carries the session policy')
  const signal = exec.signal
  const session = exec.agent?.session
  const policy = ctx.sandboxPolicy.resolve(session === undefined ? {} : { session })
  const workdir = exec.agent === undefined ? undefined : await ctx.workingDirectory.ensure(exec.agent, signal)
  let target
  try {
    target = await ctx.fs.resolve(targetDir.trim(), { cwd: workdir, signal })
  } catch (error) {
    return targetRefusal('target.missing', `${TARGET_MESSAGES['target.missing']} (${error.message})`)
  }
  const targetPath = pathOf(target)
  if (workdir !== undefined) {
    if (samePath(targetPath, workdir)) return targetRefusal('target.isWorkdir')
    if (isUnder(workdir, targetPath)) return targetRefusal('target.isAncestor')
  }
  if (policy.mode === 'read-only') return targetRefusal('target.readOnly')
  if (policy.mode !== 'danger-full-access') {
    const boundary = workdir ?? policy.workspaceRoot
    if (boundary === undefined || !isUnder(targetPath, boundary)) return targetRefusal('target.outsideWorkspace')
  }
  const info = await ctx.fs.stat(target, signal)
  if (info !== undefined && info.type !== 'directory') return targetRefusal('target.isFile')
  if (info?.type === 'directory') {
    const entries = await ctx.fs.listDir(target, signal)
    if (entries.length > 0 && !(await carriesMarker(ctx, target, workdir, signal))) {
      const names = entries.map((entry) => entry.name).slice(0, 5)
      return targetRefusal('target.notEmpty', `${TARGET_MESSAGES['target.notEmpty']} (it carries ${names.join(', ')})`)
    }
  }
  return { ok: true, target, dir: displayOf(target), policy, workdir }
}

/**
 * Plan every write: each emitted path joined to the resolved target and checked with
 * `ctx.fs.contains` (pipeline step 7). No byte is written here.
 * @param {{ plan: object, emitted: string[], ctx: object, exec: object }} input
 * @returns {Promise<{ ok: true, outputs: object[] } | object>} a `target.escape` refusal or the planned outputs
 */
export async function planOutputs({ plan, emitted, ctx, exec = {} }) {
  const outputs = []
  for (const relativePath of emitted) {
    let output
    try {
      output = await ctx.fs.resolve(join(plan.dir, relativePath), { cwd: plan.workdir, signal: exec.signal })
    } catch (error) {
      return targetRefusal('target.escape', `${relativePath} cannot be resolved inside the target (${error.message})`)
    }
    if (!ctx.fs.contains(plan.target, output)) return targetRefusal('target.escape', `${relativePath} resolves outside the target folder`)
    outputs.push({ relativePath, target: output })
  }
  return { ok: true, outputs }
}

/**
 * Publish one authoritative observation to the platform's `fs-observation-policy` (the event its README
 * defines for exactly this). Without it a write guard would be derived from the *caller's* last read of
 * our own generated file, so a rebuild would refuse with `FS_STALE_VERSION` after the model inspected
 * the page — the build would depend on the caller's observation history.
 */
function publishObservation(ctx, target, observation, exec) {
  if (typeof ctx.emit !== 'function') return
  ctx.emit('fs/observed', target, observation, exec)
}

/**
 * Observe the target immediately before its write, then write with the guard that observation yields.
 * A plugin's `fs/write-intent` then names the version the file has now, not the one the caller read;
 * a file that disappears between the observation and the write still refuses (the guard is a real CAS).
 */
async function writeObserved(ctx, output, content, plan, exec) {
  const { target } = output
  if (typeof ctx.fs.stat === 'function') {
    const current = await ctx.fs.stat(target, exec.signal)
    if (current === undefined) publishObservation(ctx, target, { kind: 'absent' }, exec)
    else if (current.version !== undefined) publishObservation(ctx, target, { kind: 'present', version: current.version }, exec)
  }
  const intent = typeof ctx.waterfall === 'function'
    ? await ctx.waterfall('fs/write-intent', target, exec, () => undefined)
    : undefined
  const outcome = await ctx.fs.writeText(target, content, intent, exec.signal, plan.policy)
  if (outcome !== null && typeof outcome === 'object' && outcome.version !== undefined) {
    publishObservation(ctx, target, { kind: 'present', version: outcome.version }, exec)
  }
}

/**
 * Write the planned set in order, `page.json` last. A failure names the files that stand and leaves
 * no `page.json`; nothing is rolled back (the platform has no multi-file transaction).
 * @param {{ plan: object, outputs: object[], contents: Record<string, string>, ctx: object, exec: object }} input
 * @returns {Promise<{ ok: true, written: string[] } | { ok: false, written: string[], failed: string, message: string }>}
 */
export async function writeEmitted({ plan, outputs, contents, ctx, exec = {} }) {
  const written = []
  for (const output of outputs) {
    const { relativePath } = output
    try {
      await writeObserved(ctx, output, contents[relativePath], plan, exec)
    } catch (error) {
      return { ok: false, written, failed: relativePath, message: `writing ${relativePath} failed: ${error.message}` }
    }
    written.push(relativePath)
  }
  return { ok: true, written }
}
