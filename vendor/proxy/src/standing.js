/**
 * The standing policy: one install the whole-traffic switch holds, and the reconciliation that keeps it.
 *
 * The switch is a volatile field, so a write does not restart the plugin: the loader announces changed
 * volatile values on `loader/volatile-update`, and this controller reconciles against the live config on
 * that announcement — install when the switch is on and no policy stands, remove when it is off. The
 * plugin's effect owns the lifetime: its disposer removes the policy, so the platform's previous
 * dispatcher and environment come back on a reload, a config change that restarts the plugin, or exit.
 *
 * The switch is read from the config alone: the settings service projects its row from the same volatile
 * references, so a row can never carry a value the config does not. The credential store, in contrast, may
 * still be arriving at mount: the install waits for it in the seam where it stands, and the absence is
 * said only when the loader has settled and the composition really carries no store.
 *
 * One failure is said once, not once per reconciliation: the switch keeps its stored state (the product
 * never writes it back), and the reason goes to the host log. Every sentence names the proxy as
 * `host:port`; the stored URL, credentials included, never enters one.
 *
 * @module @coreness/proxy/src/standing
 */

import { installProxyFromEnvironment } from '@deepseek-ai/dsh-http-proxy'

import { live } from './live.js'
import { parseProxyUrl, proxyEnvironmentOf, redact, resolveStored } from './proxy.js'

/** The event the loader emits when a volatile-only config change lands on a running plugin. */
export const VOLATILE_UPDATE = 'loader/volatile-update'

/** A thrown value's words, before redaction. */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * Create the standing policy's controller.
 *
 * `ctx` must carry `credentials` through a `ctx.get` read; `config` is the plugin's live config, whose
 * volatile fields are read through {@link live} at every reconciliation.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @param {(level: 'info'|'warn', message: string) => void} say where a line goes
 * @returns {{start: () => Promise<void>, stop: () => Promise<void>, reconcile: () => Promise<void>, holds: () => boolean}} the controller
 */
export function createStanding(ctx, config, say) {
  let standing = null
  let queue = Promise.resolve()
  let said = new Set()
  /* Set once by `stop()` and never cleared: a reconciliation that a check queued before the plugin went
     away would otherwise run after the removal and install a policy no disposer owns. */
  let stopped = false

  /** True the first time a failure key is said while the switch stands; false after. */
  const once = (key) => {
    if (said.has(key)) return false
    said.add(key)
    return true
  }

  /**
   * Whether the switch stands on, read live at every reconciliation.
   *
   * The volatile reference is the one the settings service's row projects, so the config is the whole
   * answer; a captured read would not be.
   * @returns {boolean} true when the whole-traffic policy is wanted
   */
  const switchOn = () => live(config.allTraffic) === true

  /**
   * Take the held policy down, restoring the platform's previous dispatcher and environment.
   * @param {boolean} quiet true when the caller explains the removal itself
   * @returns {Promise<void>} settled when the platform's own disposer finished
   */
  async function remove(quiet = false) {
    const current = standing
    standing = null
    said = new Set()
    if (current === null) return
    try {
      await current.dispose()
    } catch {
      say('warn', `the standing proxy policy at ${current.hostPort} could not be put back`)
      return
    }
    if (!quiet) say('info', 'the standing proxy policy was removed; the previous policy stands')
  }

  /**
   * Install the policy from the stored URL, unless one already stands for that same value.
   * @returns {Promise<void>} settled when the install finished or refused
   */
  async function install() {
    const credentials = ctx.get('credentials')
    if (credentials === undefined) {
      /* A store whose fiber is registered but not active is still arriving: the installing seam
         reconciles once it stands. Only a composition that carries none reads as a failure. */
      if (ctx.get('credentials', false) === undefined && once('no-store')) {
        say('warn', 'the standing proxy policy was not installed: this composition carries no credential store')
      }
      return
    }
    const proxyRef = String(live(config.proxyRef) ?? '')
    let stored
    try {
      stored = await resolveStored(credentials, proxyRef)
    } catch {
      if (once('unreadable')) say('warn', 'the standing proxy policy was not installed: the stored proxy URL could not be read')
      return
    }
    if (stored === null) {
      if (once('empty')) say('warn', 'the standing proxy policy was not installed: no proxy URL is stored')
      return
    }
    if (standing !== null && standing.raw === stored) return
    let parsed
    try {
      parsed = parseProxyUrl(stored)
    } catch (error) {
      if (once('shape')) say('warn', `the standing proxy policy was not installed: ${redact(messageOf(error))}`)
      return
    }
    if (standing !== null) await remove(true)
    let dispose
    try {
      dispose = await installProxyFromEnvironment(proxyEnvironmentOf(parsed))
    } catch {
      /* The platform's own words may quote the URL; the sentence names the proxy as `host:port` only. */
      if (once('install')) say('warn', `the standing proxy policy could not be installed at ${parsed.hostPort}`)
      return
    }
    standing = { dispose, raw: stored, hostPort: parsed.hostPort }
    said = new Set()
    say('info', `the standing proxy policy stands at ${parsed.hostPort}`)
  }

  /**
   * Bring the standing policy in line with the live switch: install while it is on, remove when it is off
   * or the plugin is going away. Reconciliations are serialized so two announcements, or an announcement
   * and the mount, cannot interleave an install with a removal.
   * @param {boolean} [quiet] true when the caller explains the removal itself
   * @returns {Promise<void>} settled when this reconciliation finished
   */
  function reconcile(quiet = false) {
    const task = queue.then(async () => {
      if (stopped) return
      if (!switchOn()) {
        await remove(quiet)
        return
      }
      await install()
    })
    queue = task.catch(() => {})
    return task
  }

  return {
    /**
     * Reconcile at mount: install the policy when the switch already stands on.
     *
     * The credential store may still be arriving at this point, and a store that is absent is not yet a
     * missing one; installation waits for the seam where the store stands.
     */
    start: () => {
      const task = queue.then(async () => {
        if (ctx.get('credentials') === undefined) return
        if (!switchOn()) return
        await install()
      })
      queue = task.catch(() => {})
      return task
    },
    /** Remove the policy as the plugin goes away; the loader's own restore is silent. */
    stop: () => {
      stopped = true
      const task = queue.then(() => remove(true))
      queue = task.catch(() => {})
      return task
    },
    /** Re-read the live switch and the stored URL after a volatile update or a completed check. */
    reconcile: () => reconcile(),
    /** Whether a policy this controller installed stands right now. */
    holds: () => standing !== null,
  }
}
