/**
 * The `web_fetch` gate: one `tools/execute` listener that sends the call through the stored proxy first
 * and repeats it directly when the network refuses the proxied attempt.
 *
 * The seam is the platform's own documented wrapper point for a call's timeout or retry. It hands the
 * listener the one execution view that may replace the call's signal, which is how an attempt gets a
 * deadline of its own without touching the caller's cancellation: the replacement is fused with the
 * caller's signal by the registry before the body runs, and put back when the listener is done.
 *
 * The gate acts only on `web_fetch`; every other call passes straight through. It also passes straight
 * through when the switch is off, when nothing is stored, when the stored value is not a proxy address,
 * when the shared web row selects a fetch that does not run on this machine, when the policy would not
 * route this URL, and when the platform refuses to install the policy — in each case the call runs
 * exactly once, directly, and the log says what the gate could not do. What the gate must never do is
 * leave a policy installed: every window closes in `finally`, an install that failed after publishing
 * the proxy environment has that environment put back by hand, and the module's one install chain
 * guarantees no second window overlaps the first.
 *
 * @module @coreness/proxy/src/gate
 */

import { deadline, timeoutOf } from '@deepseek-ai/dsh-timeout'

import { live } from './live.js'
import {
  PROXY_ATTEMPT,
  ProxyInstallRefusal,
  hostPortOf,
  parseProxyUrl,
  proxiedFor,
  redact,
  resolveStored,
  withProxy,
} from './proxy.js'

/** The one tool this module wraps. */
export const TOOL = 'web_fetch'

/** The platform's shared web row: the fetch and search selections both doors write. */
const WEB_ROW = 'web'

/** The platform's server-side fetch: a selection that never runs on the machine the gate protects. */
const REMOTE_FETCH = 'deepseek-fetch-api'

/** How much of the declared call budget the proxied attempt may spend. */
const ATTEMPT_SHARE = 2 / 3

/** The least budget a direct repeat is worth spending: below it the first answer stands. */
const RETRY_FLOOR_MS = 5_000

/** How deep the cause walk goes before it stops: an AggregateError plus a cause chain fits well below. */
const CAUSE_DEPTH = 5

/**
 * The transport codes and TLS name mismatch read as network-class when a provider surfaces one.
 *
 * The platform's own fetch provider does not: it collapses every one of them into a single code (see
 * {@link COLLAPSED_NETWORK_CODES}), which is why the set below rarely sees a real result at this seam.
 */
const NETWORK_CODES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'EPIPE', 'ETIMEDOUT',
  'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH', 'ENETUNREACH', 'ENETDOWN',
  'UND_ERR_SOCKET', 'UND_ERR_CLOSED', 'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_PRX_TLS',
  'ERR_TLS_CERT_ALTNAME_INVALID',
])

/**
 * The platform's own fetch provider reports every transport failure as this one code: its
 * `translateAbortOrNetwork` deliberately collapses a reset, a refused connection and a dead DNS into
 * `WEB_PROVIDER_ERROR` before the result crosses `tools/execute`, so the cause codes never reach this
 * seam. For a refusal that is not the caller's abort and not one of the provider's own decision codes,
 * this code therefore *is* the network classification. The price is one bounded direct attempt on a
 * failure the provider files here for its own reasons; without it the direct fallback could never run
 * against the platform's provider.
 */
const COLLAPSED_NETWORK_CODES = new Set(['WEB_PROVIDER_ERROR'])

/**
 * A refusal that says the call itself is wrong or decided; a repeat would spend the budget for nothing.
 * `WEB_BLOCKED_URL` is not here but needs no entry: it is simply not a network signal, so it stands.
 */
const FINAL_CODES = new Set([
  'WEB_INVALID_URL',
  'WEB_REDIRECT_BLOCKED',
  'WEB_UNSUPPORTED_CONTENT_TYPE',
  'WEB_FETCH_TOO_LARGE',
  'WEB_ABORTED',
  'WEB_PROVIDER_CONFIGURED_MISSING',
  'WEB_PROVIDER_CONFIGURED_UNAVAILABLE',
])

/** A thrown value's words, for a sentence that will be redacted. */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/** Milliseconds as the budget arithmetic reads them. */
const now = () => performance.now()

/**
 * Every code reachable from a failed result, breadth-first and bounded.
 *
 * A tool result carries `error.message` and, for a harness error, `error.info`; a cause chain survives
 * only when a provider put one where the walk can reach it. The walk therefore follows `cause`,
 * `errors` and `info` alike, and stops at a repeated node so an AggregateError with several addresses or
 * a self-referencing cause returns.
 * @param {unknown} result the settled tool result
 * @returns {Set<string>} the codes found
 */
function codesOf(result) {
  const codes = new Set()
  const seen = new Set()
  let level = [result?.error]
  for (let depth = 0; depth < CAUSE_DEPTH && level.length > 0; depth += 1) {
    const next = []
    for (const node of level) {
      if (node === null || typeof node !== 'object' || seen.has(node)) continue
      seen.add(node)
      if (typeof node.code === 'string' && node.code !== '') codes.add(node.code)
      for (const key of ['cause', 'errors', 'info']) {
        const value = node[key]
        if (Array.isArray(value)) next.push(...value)
        else if (value !== undefined) next.push(value)
      }
    }
    level = next
  }
  return codes
}

/**
 * Whether one settled attempt failed on the network — the only class the direct repeat is for.
 *
 * The attempt's own deadline is read first, from the state the attempt observed rather than from a code:
 * the deadline's abort arrives as the platform's cancellation code, and a code cannot tell the caller's
 * cancel from the gate's own cut. An HTTP result is never here: a non-2xx page is a result, not a
 * failure. Neither is a caller's abort, nor any of the provider's own decision codes.
 * @param {object} result the settled tool result
 * @param {{timedOut?: boolean, callerAborted?: boolean}} [state] what the attempt itself observed
 * @returns {boolean} true when the call may be repeated without the proxy
 */
export function isNetworkFailure(result, state = {}) {
  if (result?.isError !== true) return false
  if (state.callerAborted === true) return false
  if (state.timedOut === true) return true
  const codes = codesOf(result)
  for (const code of codes) if (FINAL_CODES.has(code)) return false
  for (const code of codes) {
    if (NETWORK_CODES.has(code) || COLLAPSED_NETWORK_CODES.has(code)) return true
  }
  return false
}

/**
 * How informative an error result is, for choosing between two failed attempts.
 *
 * Both attempts failed: the proxied one's own deadline and the direct one's cancellation both arrive as
 * `WEB_ABORTED`, which tells a reader nothing about the page; a provider's refusal names a cause. The
 * weight therefore ranks an abort below a named failure, and a tie goes to the second attempt — the one
 * the caller would have got without the proxy.
 * @param {object} result the settled tool result
 * @returns {number} the rank
 */
function weightOf(result) {
  if (result?.isError !== true) return 3
  const code = result.error?.info?.code
  if (code === 'WEB_ABORTED' || code === 'ABORTED_BEFORE_DISPATCH') return 1
  return 2
}

/**
 * The call budget the wrapped tool declared, or `null` when it declares none.
 * @param {object} ctx the cordis context
 * @param {object} exec the execution view
 * @returns {number|null} milliseconds
 */
function declaredBudget(ctx, exec) {
  const declared = ctx.tools?.get?.(TOOL, exec.agent)?.timeoutMs
  return Number.isFinite(declared) && declared > 0 ? declared : null
}

/**
 * The fetch provider the shared web row selects, or the platform's own launch override standing in.
 *
 * The row is the platform's, and both the product's page and the platform's Web search page write it; a
 * call whose fetch is served by the platform's server-side API never reaches a local transport, so
 * proxying it would spend the budget and, on the fallback, a second paid request for nothing.
 *
 * The selection is what the platform itself resolves: the row's value when it is not nullish, otherwise
 * `DSH_WEB_FETCH_PROVIDER` from the launch environment. The read goes through the settings service, which
 * re-reads the profile's rows and patch layers on every enabled page fetch; that is the price of the
 * selection always being live, and it is paid only while the switch is on.
 * @param {object} ctx the cordis context
 * @returns {{selection: string|null, fault: unknown}} the selected id, or the reason it could not be read
 */
function fetchSelectionOf(ctx) {
  const settings = ctx.get('settings')
  if (settings === undefined) return { selection: null, fault: null }
  try {
    const rows = settings.describe()
    const row = Array.isArray(rows) ? rows.find((one) => one !== null && typeof one === 'object' && one.ns === WEB_ROW) : undefined
    const rowValue = row?.value?.fetchProvider
    const selected = rowValue === null || rowValue === undefined ? process.env.DSH_WEB_FETCH_PROVIDER : rowValue
    return { selection: typeof selected === 'string' && selected !== '' ? selected : null, fault: null }
  } catch (error) {
    return { selection: null, fault: error }
  }
}

/** The URL one `web_fetch` call names, when it is a URL at all. */
function targetOf(exec) {
  const url = exec?.arguments?.url
  if (typeof url !== 'string' || url.trim() === '') return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null
  } catch {
    return null
  }
}

/**
 * Run one call under a freshly installed policy, with its own deadline when a budget is known.
 *
 * The verification is the whole point of the window: the policy that stands must be the one the fetch
 * provider consults. A policy that does not route this URL — loopback, or a URL the platform keeps
 * direct — leaves the call direct; it is not a failure, and the window closes as usual.
 *
 * The attempt's share is taken from what the install left of the declared budget, not from the budget
 * the call began with: installing the policy costs time of its own, and that time is the caller's.
 * @param {object} exec the execution view
 * @param {Function} next the rest of the dispatch
 * @param {ReturnType<typeof parseProxyUrl>} parsed the stored proxy
 * @param {URL} target the URL the call names
 * @param {{budget: number|null, started: number, say: Function}} options the declared budget, the call's start, and the log
 * @returns {Promise<{result: object, timedOut: boolean, routed: boolean}>} the settled attempt
 */
async function underPolicy(exec, next, parsed, target, options) {
  const { budget, started, say } = options
  return await withProxy(parsed, async () => {
    if (!proxiedFor(target)) {
      say('warn', `route:${hostPortOf(target)}`, `the proxy policy does not route ${hostPortOf(target)} through the proxy; the page fetch went direct.`)
      return { result: await next(), timedOut: false, routed: false }
    }
    const remaining = budget === null ? null : budget - (now() - started)
    if (remaining === null) return { result: await next(), timedOut: false, routed: true }
    if (remaining <= 0) return { result: await next(), timedOut: false, routed: true }
    const timer = deadline(exec.signal, Math.max(1, Math.floor(remaining * ATTEMPT_SHARE)), PROXY_ATTEMPT)
    const upstream = exec.signal
    exec.signal = timer.signal
    try {
      const result = await next()
      return { result, timedOut: timeoutOf(timer.signal, PROXY_ATTEMPT) !== undefined, routed: true }
    } finally {
      exec.signal = upstream
      timer[Symbol.dispose]()
    }
  })
}

/**
 * Run one direct call under a deadline for what the declared budget has left.
 * @param {object} exec the execution view
 * @param {Function} next the rest of the dispatch
 * @param {number} ms the remaining budget
 * @returns {Promise<object>} the settled result
 */
async function directAttempt(exec, next, ms) {
  const timer = deadline(exec.signal, ms, PROXY_ATTEMPT)
  const upstream = exec.signal
  exec.signal = timer.signal
  try {
    return await next()
  } finally {
    exec.signal = upstream
    timer[Symbol.dispose]()
  }
}

/**
 * Build the gate.
 *
 * The log a caller passes receives one line per subject, not one per page fetch: a condition that stands
 * across calls — a missing credential store, an unreadable record, a URL the policy keeps direct — is
 * said once and then left to stand, because a line repeated per fetch tells a reader nothing new.
 *
 * `ctx` must be a context that declares `tools` — the injected scope the listener is registered under.
 * Cordis throws on a service property read from a context that did not declare it, so the plugin's outer
 * context would turn the budget read into a tool error before any install happens.
 * @param {object} ctx the cordis context of the injected `tools` scope
 * @param {object} config the plugin's resolved config
 * @param {(level: 'info'|'warn', message: string) => void} [sink] where a line goes
 * @returns {(exec: object, next: Function) => Promise<object>} the `tools/execute` listener
 */
export function createGate(ctx, config, sink = () => {}) {
  const said = new Set()
  const say = (level, key, message) => {
    if (said.has(key)) return
    said.add(key)
    sink(level, message)
  }
  return async function gate(exec, next) {
    if (exec?.name !== TOOL) return next()
    /* The budget is the call's, so its clock starts at the gate's door: the credential resolve and the
       install are spent from the same budget the caller's timeout bounds. */
    const started = now()
    if (live(config.enabled) !== true) return next()

    const web = fetchSelectionOf(ctx)
    if (web.fault !== null) {
      say('warn', 'web-row', `the shared "${WEB_ROW}" row could not be read (${redact(messageOf(web.fault))}); page fetches are not routed through the proxy.`)
      return next()
    }
    if (web.selection === REMOTE_FETCH) {
      say('info', 'remote-fetch', `the shared "${WEB_ROW}" row selects the platform's server-side fetch, which does not run on this machine; page fetches are not routed through the proxy.`)
      return next()
    }

    const credentials = ctx.get('credentials')
    if (credentials === undefined) {
      say('warn', 'no-credentials', 'the proxy is switched on, but this composition carries no credentials service: page fetches go direct.')
      return next()
    }

    const ref = String(live(config.proxyRef) ?? '')
    let stored
    try {
      stored = await resolveStored(credentials, ref)
    } catch (error) {
      say('warn', 'unreadable', `the stored proxy URL could not be read (${redact(messageOf(error))}); page fetches go direct.`)
      return next()
    }
    if (stored === null) return next()

    let parsed
    try {
      parsed = parseProxyUrl(stored)
    } catch (error) {
      say('warn', 'shape', `${redact(messageOf(error))} Page fetches go direct until a proxy URL is stored again.`)
      return next()
    }

    const target = targetOf(exec)
    if (target === null) return next()
    /* A call the caller has already cancelled is not worth an install or a queue wait. */
    if (exec.signal?.aborted === true) return next()

    const budget = declaredBudget(ctx, exec)

    let first
    try {
      first = await underPolicy(exec, next, parsed, target, { budget, started, say })
    } catch (error) {
      if (error instanceof ProxyInstallRefusal) {
        say('warn', 'install', error.restored
          ? `${redact(messageOf(error))}; the proxy environment stands as it was and the page fetch went direct.`
          : `${redact(messageOf(error))}; the proxy environment could not be put back, so later page fetches and child processes may still see it.`)
        return next()
      }
      throw error
    }
    if (!first.routed) return first.result

    const callerAborted = exec.signal.aborted === true
    const remaining = budget === null ? null : budget - (now() - started)
    if (remaining === null || remaining < RETRY_FLOOR_MS) return first.result
    if (callerAborted || !isNetworkFailure(first.result, { timedOut: first.timedOut, callerAborted })) return first.result

    say('warn', `fallback:${parsed.hostPort}`, `the proxy ${parsed.hostPort} failed on the network; the page fetch was repeated directly, and later failures fall back the same way.`)
    const second = await directAttempt(exec, next, Math.max(1, Math.floor(remaining)))
    return weightOf(second) >= weightOf(first.result) ? second : first.result
  }
}
