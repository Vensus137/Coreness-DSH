/**
 * Edge: the executable resolution in this tool's own order (the platform's resolver, then the measured
 * install path), one fresh headless profile under the OS temp directory, the CDP port from that
 * profile's own DevToolsActivePort, and a kill whose exit is awaited on every path.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

/** The measured install path on this machine; a fallback after the platform's PATH lookup. */
export const EDGE_KNOWN_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

/** The headless flags the capture discipline fixes; the profile and the port are the caller's. */
export const EDGE_ARGUMENTS = Object.freeze([
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--remote-debugging-port=0',
])

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Resolve Edge: `ctx.subprocess.resolveExecutable('msedge')` first, then the known absolute path.
 * A bare name on this machine is not on PATH, so the resolver's miss throws and the known path is
 * the operative one; the function reports which route answered and every attempt it made.
 *
 * @param {object} [options]
 * @param {object} [options.ctx] the plugin context (only `ctx.subprocess` is read)
 * @param {object} [options.knownPath] the absolute candidate; `null` disables the fallback
 * @param {(path: string) => boolean} [options.exists]
 * @returns {Promise<{ executable: string|null, via: string|null, attempts: string[], reason?: string }>}
 */
export async function resolveEdge({ ctx, knownPath = EDGE_KNOWN_PATH, exists = existsSync } = {}) {
  const attempts = []
  let resolveError
  if (ctx?.subprocess && typeof ctx.subprocess.resolveExecutable === 'function') {
    try {
      const found = await ctx.subprocess.resolveExecutable('msedge')
      if (typeof found === 'string' && found.trim().length > 0) {
        return { executable: found, via: 'resolveExecutable', attempts }
      }
      attempts.push('resolveExecutable("msedge") answered without a path')
    } catch (error) {
      resolveError = error
      attempts.push(`resolveExecutable("msedge") failed: ${errorMessage(error)}`)
    }
  } else {
    attempts.push('ctx.subprocess is unavailable: the PATH lookup could not run')
  }
  if (typeof knownPath === 'string' && knownPath.length > 0) {
    if (exists(knownPath)) return { executable: knownPath, via: 'known-path', attempts }
    attempts.push(`the known absolute path is not there: ${knownPath}`)
  } else {
    attempts.push('no known absolute path is available for this platform')
  }
  return {
    executable: null,
    via: null,
    attempts,
    reason: `no Edge executable was found: ${attempts.join('; ')}`,
  }
}

/**
 * A fresh profile directory under the OS temp directory. The caller removes it once Edge has stopped;
 * an OS temp cleanup does not sweep these on this platform, so a directory left behind is a leak.
 * @returns {string}
 */
export function newProfileDir() {
  return mkdtempSync(join(tmpdir(), 'coreness-page-studio-edge-'))
}

/**
 * Remove a profile directory this module made. Best-effort: a removal that fails is answered as a
 * problem, never swallowed, so a profile that outlives its capture is said instead of left silently.
 * @param {string} profileDir
 * @returns {string[]} the problems, empty when the directory is gone
 */
export function removeProfileDir(profileDir) {
  if (typeof profileDir !== 'string' || profileDir.length === 0) {
    return ['no Edge profile directory was given to remove']
  }
  try {
    rmSync(profileDir, { recursive: true, force: true })
    return []
  } catch (error) {
    return [`the Edge profile directory ${profileDir} could not be removed: ${errorMessage(error)}`]
  }
}

function readActivePort(portFile) {
  try {
    const first = readFileSync(portFile, 'utf8').split(/\r?\n/)[0]
    const port = Number.parseInt(String(first).trim(), 10)
    return Number.isInteger(port) && port > 0 && port < 65536 ? port : null
  } catch {
    return null
  }
}

/**
 * Start one headless Edge and wait for the profile's DevToolsActivePort. A spawn failure, an early
 * exit or a missing port is thrown with the kill's own problems attached; the process is always
 * terminated and its exit awaited before the error leaves.
 *
 * @param {object} options
 * @param {(request: object) => object} options.spawn the platform's `ctx.subprocess.spawn`
 * @param {string} options.executable
 * @param {string} options.profileDir
 * @param {number} [options.graceMs]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{ handle: object, port: number, argv: string[], profileDir: string }>}
 */
export async function launchEdge({ spawn, executable, profileDir, graceMs = 5000, timeoutMs = 20000 }) {
  if (typeof spawn !== 'function') throw new Error('the subprocess seam is unavailable: no spawn function was given')
  if (typeof executable !== 'string' || executable.length === 0) throw new Error('no Edge executable path to spawn')
  if (typeof profileDir !== 'string' || profileDir.length === 0) throw new Error('no fresh Edge profile directory to spawn with')
  const portFile = join(profileDir, 'DevToolsActivePort')
  const argv = [executable, ...EDGE_ARGUMENTS, `--user-data-dir=${profileDir}`, 'about:blank']
  const handle = spawn({
    argv,
    cwd: profileDir,
    stdio: { stdin: 'ignore', stdout: 'ignore', stderr: 'inherit' },
    graceMs,
  })
  let exitFailure
  if (handle && handle.done && typeof handle.done.then === 'function') {
    handle.done.then(
      (outcome) => {
        exitFailure = `Edge exited before announcing a CDP port (exitCode ${outcome?.exitCode ?? 'unknown'}, signal ${outcome?.signal ?? 'none'})`
      },
      (error) => {
        exitFailure = `Edge failed to start: ${errorMessage(error)}`
      },
    )
  }
  const started = Date.now()
  try {
    for (;;) {
      if (exitFailure) throw new Error(exitFailure)
      if (existsSync(portFile)) {
        const port = readActivePort(portFile)
        if (port !== null) return { handle, port, argv, profileDir }
      }
      if (Date.now() - started > timeoutMs) {
        throw new Error(`Edge announced no CDP port within ${timeoutMs} ms (no usable DevToolsActivePort in the fresh profile)`)
      }
      await delay(50)
    }
  } catch (error) {
    const stopProblems = await stopEdge(handle)
    throw new Error([error.message, ...stopProblems].join('; '))
  }
}

function withTimeout(promise, timeoutMs, label) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} did not settle within ${timeoutMs} ms`)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Kill and await the exit of the spawned process range. The platform's handle owns the range's
 * quiescence; a rejection means the run cannot prove that no Edge survives, and is reported as such.
 *
 * @param {object | null} handle
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<string[]>} the problems, empty when terminate + exit were proven
 */
export async function stopEdge(handle, { timeoutMs = 15000 } = {}) {
  const problems = []
  if (!handle) return problems
  if (typeof handle.terminate === 'function') {
    try {
      await handle.terminate()
    } catch (error) {
      problems.push(`Edge terminate() failed: ${errorMessage(error)}`)
    }
  } else {
    problems.push('the spawned Edge handle has no terminate()')
  }
  if (typeof handle.waitForExit === 'function') {
    try {
      await withTimeout(Promise.resolve(handle.waitForExit()), timeoutMs, 'Edge waitForExit()')
    } catch (error) {
      problems.push(`the exit of Edge is unproven: ${errorMessage(error)}`)
    }
  } else {
    problems.push('the spawned Edge handle has no waitForExit(); the exit of Edge is unproven')
  }
  return problems
}
