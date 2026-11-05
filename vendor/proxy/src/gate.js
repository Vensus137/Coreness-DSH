/**
 * The `web_fetch` gate: one `tools/execute` listener that sends the call through the stored proxy when the
 * proxy answers a pre-flight, and lets the call go direct when it does not.
 *
 * The dispatch continuation belongs to the one dispatch this listener makes: the platform makes a
 * waterfall's `next()` single-use, so a second one is not a plan this module may hold. What a repeat would
 * buy — a proxy that is down must not cost the call its result — is bought before the call instead. The
 * stored proxy is probed with the same `CONNECT` the card's check makes; a probe that does not answer
 * `works` says why once and the call runs direct, in one dispatch and with no policy installed; a probe
 * that answers `works` has the policy installed and the call runs once through it. A call that then fails
 * on the network is returned as it is, with one line saying the proxy was reachable and the failure stands:
 * a proxy that dies mid-call is not covered, and no line claims a repeat, because none happens.
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
  CHECK_TIME_LIMIT_MS,
  PROXY_ATTEMPT,
  ProxyInstallRefusal,
  checkProxy,
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
  'UND_ERR_ABORTED', 'UND_ERR_SOCKET', 'UND_ERR_CLOSED', 'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_PRX_TLS',
  'ERR_TLS_CERT_ALTNAME_INVALID',
])

/**
 * The platform's own fetch provider reports every transport failure as this one code: its
 * `translateAbortOrNetwork` deliberately collapses a reset, a refused connection and a dead DNS into
 * `WEB_PROVIDER_ERROR` before the result crosses `tools/execute`, so the cause codes never reach this
 * seam. For a refusal that is not the caller's abort and not one of the provider's own decision codes,
 * this code therefore *is* the network classification. The price is one proxy line on a failure the
 * provider files here for its own reasons; without it, a fetch that failed through the proxy against the
 * platform's provider could not be told from one the page itself decided.
 */
const COLLAPSED_NETWORK_CODES = new Set(['WEB_PROVIDER_ERROR'])

/**
 * A refusal that says the call itself is wrong or decided: the page decided, so the proxy line is not for it.
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
 * Whether one settled attempt failed on the network — the class the gate reports as the proxy's failure.
 *
 * The attempt's own deadline is read first, from the state the attempt observed rather than from a code:
 * the deadline's abort arrives as the platform's cancellation code, and a code cannot tell the caller's
 * cancel from the gate's own cut. An HTTP result is never here: a non-2xx page is a result, not a
 * failure. Neither is a caller's abort, nor any of the provider's own decision codes.
 * @param {object} result the settled tool result
 * @param {{timedOut?: boolean, callerAborted?: boolean}} [state] what the attempt itself observed
 * @returns {boolean} true when the failure came from the transport, not from the page
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
 * The pre-flight's ceiling: the card's own bound, capped by what the declared budget still holds.
 *
 * The probe is spent from the call's budget like the install is, so it may not outlive it: a budget with
 * less than a millisecond left buys no probe at all (`null`), and that call then runs once under the
 * installed policy, with no gate deadline beyond the single millisecond a sub-millisecond remainder can
 * arm. A `null` budget is the tool's own word that it declares none: the card's ceiling stands alone.
 * @param {number|null} budget milliseconds the wrapped tool declared, or `null`
 * @param {number} started the call's start on the gate clock
 * @returns {number|null} milliseconds the probe may take, or `null` when the budget holds nothing to spend
 */
function preflightLimit(budget, started) {
  if (budget === null) return CHECK_TIME_LIMIT_MS
  const remaining = Math.floor(budget - (now() - started))
  return remaining >= 1 ? Math.min(CHECK_TIME_LIMIT_MS, remaining) : null
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
 * proxying it would spend the call for nothing.
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
 * The attempt's share is taken from what the pre-flight and the install left of the declared budget, not
 * from the budget the call began with: both cost time of their own, and that time is the caller's.
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
 * Build the gate.
 *
 * The log a caller passes receives one line per subject, not one per page fetch: a condition that stands
 * across calls — a missing credential store, an unreadable record, a URL the policy keeps direct, a proxy
 * that answered the pre-flight and then failed — is said once and then left to stand, because a line
 * repeated per fetch tells a reader nothing new.
 *
 * `ctx` must be a context that declares `tools` — the injected scope the listener is registered under.
 * Cordis throws on a service property read from a context that did not declare it, so the plugin's outer
 * context would turn the budget read into a tool error before any install happens.
 * @param {object} ctx the cordis context of the injected `tools` scope
 * @param {object} config the plugin's resolved config
 * @param {(level: 'info'|'warn', message: string) => void} [sink] where a line goes
 * @param {object} [seams] the gate's two collaborators
 * @param {{holds?: () => boolean}} [seams.standing] the standing policy's controller: the gate stands down
 *   only while a policy it installed actually stands, not merely while the switch's word is on
 * @param {Function} [seams.probe] the reachability probe the pre-flight asks, `(raw, {timeLimitMs})`; a
 *   caller that must not open a socket passes its own, and a mount passes nothing
 * @returns {(exec: object, next: Function) => Promise<object>} the `tools/execute` listener
 */
export function createGate(ctx, config, sink = () => {}, seams = {}) {
  const { standing = {}, probe = checkProxy } = seams
  const said = new Set()
  const say = (level, key, message) => {
    if (said.has(key)) return
    said.add(key)
    sink(level, message)
  }
  return async function gate(exec, next) {
    if (exec?.name !== TOOL) return next()
    /* The whole harness traffic runs under one standing policy: a window installed here would nest above
       it, and the call's one dispatch would run through that standing policy anyway. The controller's
       state decides, not the switch's word alone: an install that failed or a URL that could not be read
       leaves the page-fetch behavior to its own switch, and the failure stays warned. */
    if (live(config.allTraffic) === true && standing.holds?.() === true) return next()
    /* The budget is the call's, so its clock starts at the gate's door: the credential resolve, the
       pre-flight and the install are spent from the same budget the caller's timeout bounds. */
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
    } catch {
      say('warn', 'unreadable', 'the stored proxy URL could not be read; page fetches go direct.')
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
    /* A call the caller has already cancelled is not worth a probe, an install or a queue wait. */
    if (exec.signal?.aborted === true) return next()

    const budget = declaredBudget(ctx, exec)

    /* The pre-flight is the only place a dead proxy can be met before the call: the dispatch continuation
       belongs to the one dispatch, so a proxy discovered dead by it would leave nothing to dispatch again.
       A probe that cannot answer `works` therefore sends the call direct before any policy is installed. A
       budget with nothing left buys no probe, and that call runs once under the installed policy. */
    const limit = preflightLimit(budget, started)
    if (limit !== null) {
      let verdict
      try {
        verdict = await probe(stored, { timeLimitMs: limit })
      } catch (error) {
        verdict = { verdict: 'unavailable', hostPort: parsed.hostPort, reason: redact(messageOf(error)) }
      }
      if (verdict?.verdict !== 'works') {
        /* The probe's own reason already names the proxy as `host:port` and ends its sentence; a thrown
           probe's message does not, so the line closes it before the clause that follows. */
        const words = typeof verdict?.reason === 'string' && verdict.reason.trim() !== ''
          ? redact(verdict.reason).trim()
          : `The proxy at ${parsed.hostPort} did not answer the pre-flight check.`
        say('warn', `before:${parsed.hostPort}`, `${/[.!?]$/u.test(words) ? words : `${words}.`} The page fetch went direct without it.`)
        return next()
      }
    }

    let first
    try {
      first = await underPolicy(exec, next, parsed, target, { budget, started, say })
    } catch (error) {
      if (error instanceof ProxyInstallRefusal) {
        /* The platform's own words may quote the URL; the sentence names the proxy as `host:port` only. */
        say('warn', 'install', error.restored
          ? `the proxy policy could not be installed at ${parsed.hostPort}; the proxy environment stands as it was and the page fetch went direct.`
          : `the proxy policy could not be installed at ${parsed.hostPort}; the proxy environment could not be put back, so later page fetches and child processes may still see it.`)
        return next()
      }
      throw error
    }
    if (!first.routed) return first.result

    /* The one dispatch has happened; there is no second one to plan. A failure on the network is the
       call's answer, and the line says what stood before it — a proxy that answered the pre-flight, or a
       budget that bought none — and never that the fetch was repeated. */
    const callerAborted = exec.signal.aborted === true
    if (!callerAborted && isNetworkFailure(first.result, { timedOut: first.timedOut, callerAborted })) {
      say('warn', `through:${parsed.hostPort}`, limit === null
        ? 'the budget declared for the call was already spent, so the proxy was not probed; the page fetch then failed on the network through it, and the failure stands as the result of the call and was not repeated.'
        : `the proxy ${parsed.hostPort} answered the pre-flight, but the page fetch failed on the network through it; the failure stands as the result of the call and was not repeated.`)
    }
    return first.result
  }
}
