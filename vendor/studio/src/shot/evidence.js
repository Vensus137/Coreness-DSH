/**
 * The evidence pass's own place: the run label, the sibling directory outside the target, the
 * sandbox-policy check and the one binary write the file service cannot carry. The platform fences
 * `ctx.fs` mutations only; `node:fs` is unfenced, so this module is the fence for the PNGs.
 */
import { existsSync, mkdirSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'

/** The evidence directory's one name: a sibling of the target, never inside the deliverable. */
export const EVIDENCE_DIR_NAME = '.page-studio-evidence'

/** The three deficiency simulations CDP can emulate one at a time; each capture is evidence, not a gate. */
export const CVD_SIMULATIONS = Object.freeze(['protanopia', 'deuteranopia', 'tritanopia'])

/** The fixed PNG names under the run directory. */
export const SHOT_NAMES = Object.freeze({
  desktop: 'desktop-1440.png',
  mobile: 'mobile-390.png',
  cvd: (simulation) => `cvd-1440-${simulation}.png`,
})

/** The PNG set a complete pass must leave behind, in the order it is written. */
export function expectedShotNames() {
  return [SHOT_NAMES.desktop, SHOT_NAMES.mobile, ...CVD_SIMULATIONS.map((simulation) => SHOT_NAMES.cvd(simulation))]
}

const pad = (value, width = 2) => String(value).padStart(width, '0')

/**
 * The run label: a sortable local timestamp plus six random hex digits. It labels evidence and never
 * enters the deliverable, so it may carry a clock; two runs in the same second stay apart by the hex.
 * @param {Date} [date]
 * @param {() => number} [random]
 * @returns {string} `YYYYMMDD-HHmmss-<6 hex>`
 */
export function runLabel(date = new Date(), random = Math.random) {
  const hex = Math.floor(random() * 0x1000000).toString(16).padStart(6, '0')
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `${stamp}-${hex}`
}

/**
 * The evidence directory as a sibling of the target: `<target>/../<EVIDENCE_DIR_NAME>/<run>`.
 * @param {string} dirDisplayPath the target's absolute display path
 * @param {string} run
 * @returns {string}
 */
export function planEvidencePath(dirDisplayPath, run) {
  return join(dirname(dirDisplayPath), EVIDENCE_DIR_NAME, run)
}

/**
 * Resolve a path whose last segments may not exist yet: realpath the deepest existing ancestor and
 * append the missing suffix, so the policy comparison sees the identity the write will hit.
 * @param {string} path
 * @returns {string}
 */
export function canonicalForWrite(path) {
  const absolute = resolve(path)
  const missing = []
  let current = absolute
  for (;;) {
    try {
      return join(realpathSync.native(current), ...[...missing].reverse())
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
      const parent = dirname(current)
      if (parent === current) return join(current, ...[...missing].reverse())
      missing.push(basename(current))
      current = parent
    }
  }
}

function isUnder(candidate, root, caseSensitive = process.platform !== 'win32') {
  if (typeof candidate !== 'string' || typeof root !== 'string' || !candidate || !root) return false
  const normalize = (value) => {
    const absolute = resolve(value)
    return caseSensitive ? absolute : absolute.toLowerCase()
  }
  const inner = normalize(candidate)
  const outer = normalize(root)
  return inner === outer || inner.startsWith(outer.endsWith(sep) ? outer : outer + sep)
}

/**
 * The platform's `workspace-write` writable set: the session workspace root, the host `/tmp` and the
 * per-user platform temp directory, canonicalized. `read-only` allows nothing.
 * @param {{ mode?: string, workspaceRoot?: string }} policy
 * @returns {string[]}
 */
export function writableRoots(policy) {
  if (!policy || policy.mode !== 'workspace-write') return []
  const roots = []
  if (typeof policy.workspaceRoot === 'string' && policy.workspaceRoot.trim().length > 0) roots.push(policy.workspaceRoot)
  roots.push('/tmp', tmpdir())
  return [...new Set(roots.map((root) => canonicalForWrite(root)))]
}

/**
 * The honest fence for the binary write: a missing policy, a read-only mode, an unknown mode or a
 * path outside every writable root refuses with its reason; nothing is written and no Edge is started.
 * @param {{ mode?: string, workspaceRoot?: string } | undefined} policy
 * @param {string} evidencePath
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkEvidencePolicy(policy, evidencePath) {
  if (!policy || typeof policy.mode !== 'string') {
    return { allowed: false, reason: 'the sandbox policy is unavailable; the evidence write cannot be fenced' }
  }
  if (isAbsolute(evidencePath) !== true) {
    return { allowed: false, reason: `the evidence path is not absolute: ${evidencePath}` }
  }
  if (policy.mode === 'danger-full-access') return { allowed: true }
  if (policy.mode === 'read-only') {
    return { allowed: false, reason: 'the evidence write is refused under read-only mode (the screenshots are the pass\'s only binary write)' }
  }
  if (policy.mode === 'workspace-write') {
    let canonical
    try {
      canonical = canonicalForWrite(evidencePath)
    } catch (error) {
      return { allowed: false, reason: `the evidence path cannot be canonicalized: ${error?.message ?? String(error)}` }
    }
    const roots = writableRoots(policy)
    if (roots.some((root) => isUnder(canonical, root))) return { allowed: true }
    return {
      allowed: false,
      reason: `the evidence path lies outside every writable root of workspace-write mode (workspace ${policy.workspaceRoot ?? 'unset'}, /tmp, ${tmpdir()}): ${canonical}`,
    }
  }
  return { allowed: false, reason: `the sandbox mode ${JSON.stringify(policy.mode)} is not one this pass knows; refusing the binary write` }
}

/**
 * Create the evidence run directory. `node:fs` is the named exception for this path only.
 * @param {string} evidencePath
 */
export function createEvidenceDir(evidencePath) {
  mkdirSync(evidencePath, { recursive: true })
}

/**
 * Write one PNG and report what landed.
 * @param {string} evidencePath
 * @param {string} name
 * @param {Buffer} buffer
 * @returns {{ name: string, path: string, bytes: number }}
 */
export function writeEvidenceFile(evidencePath, name, buffer) {
  const filePath = join(evidencePath, name)
  writeFileSync(filePath, buffer)
  return { name, path: filePath, bytes: statSync(filePath).size }
}

/** Whether an evidence path already exists (a second pass must not silently reuse a run label). */
export function evidencePathExists(evidencePath) {
  return existsSync(evidencePath)
}
