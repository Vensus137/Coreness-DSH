/**
 * The fetch proxy's transport half: the stored URL's shape, its redaction, the process-wide install
 * window, and the reachability check.
 *
 * The platform owns the policy and reads it only from a launch environment, so routing one tool call
 * through a proxy means installing the policy around that call: `installProxyFromEnvironment` replaces
 * the process-wide dispatcher, publishes the URL in the proxy environment, and hands back the disposer
 * that puts both back. Its window is process-wide, so every window this module opens — the gate's
 * attempt today, anything added later — goes through the one chain here: two windows never overlap, and
 * a waiter starts only after the previous window has closed.
 *
 * Nothing in this file writes the URL anywhere a reader of the product can see it. A sentence that
 * leaves the host names the proxy as `host:port`; a sentence built from a foreign message goes through
 * {@link redact} first, because a URL carries its credentials in the one place a reader must never meet
 * them.
 *
 * @module @coreness/proxy/src/proxy
 */

import { connect as tcpConnect, isIP } from 'node:net'
import { connect as tlsConnect } from 'node:tls'

import { installProxyFromEnvironment, proxyRouteFor } from '@deepseek-ai/dsh-http-proxy'

/** The deadline code the gate stamps on one attempt, so its own timeout is not mistaken for a cancel. */
export const PROXY_ATTEMPT = 'CORENESS_PROXY_ATTEMPT'

/**
 * The probe's ceiling, as the card's law states it. The credential resolve that precedes the probe is
 * not part of this bound.
 */
export const CHECK_TIME_LIMIT_MS = 8_000

/** The destination the check's CONNECT names: a public host, never resolved by the check itself. */
export const CHECK_TARGET = 'example.com:443'

/** The shape every refusal repeats, so a reader learns what a stored value must look like. */
const SHAPE = 'The proxy URL must be an http or https address: http(s)://[user:pass@]host:port.'

/** A stored proxy value's refusal, in words that never carry the value. */
export class ProxyUrlRefusal extends Error {
  /**
   * @param {string} message the refusal in words, already free of credentials
   */
  constructor(message) {
    super(message)
    this.name = 'ProxyUrlRefusal'
  }
}

/**
 * A policy that could not be installed at all; the call is still the caller's to run directly.
 *
 * The install publishes the proxy environment before the dispatcher exists, so a failure between the two
 * leaves the environment standing. This module snapshots the environment before the install and puts the
 * snapshot back itself; `restored` says whether that worked, and a sentence about the call's fate must
 * carry it — "went direct" is not true while a proxy environment stands.
 */
export class ProxyInstallRefusal extends Error {
  /**
   * @param {unknown} cause the platform's own failure
   * @param {boolean} [restored] whether the pre-install environment was put back
   */
  constructor(cause, restored = true) {
    super(`the proxy policy could not be installed: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'ProxyInstallRefusal'
    this.cause = cause
    this.restored = restored
  }
}

/** What a `user:pass@` prefix looks like in any sentence that may have copied a URL. */
const USERINFO = /([a-z][a-z0-9+.-]*:\/\/)([^/@\s]+)@/gi

/** What an authorization header value looks like when a foreign message copied one. */
const AUTHORIZATION = /(proxy-authorization\s*:\s*)(basic|bearer)\s+\S+/gi

/**
 * Take the credentials out of a sentence before it leaves the host.
 *
 * The module never builds a sentence from the URL itself; this is the guard for messages that arrive
 * from elsewhere — a credential store's refusal, a TLS client's wording — and might quote it.
 * @param {unknown} text the sentence
 * @returns {string} the sentence without a userinfo prefix or an authorization value
 */
export function redact(text) {
  return String(text)
    .replace(USERINFO, '$1')
    .replace(AUTHORIZATION, '$1$2 …')
}

/** A URL's host and port as a sentence names the proxy — the only form that may leave the host. */
export function hostPortOf(url) {
  const port = url.port !== '' ? url.port : url.protocol === 'https:' ? '443' : '80'
  return `${url.hostname}:${port}`
}

/**
 * The port an address names with its own digits, when it names one.
 *
 * WHATWG's `URL` drops the port when it equals the scheme's default, so `url.port` cannot answer
 * "did the reader name a port". The card's shape requires one, and `https://proxy:443` names it.
 * @param {string} text the raw address
 * @returns {number|null} the explicit port, or `null` when the authority carries none
 */
function explicitPortOf(text) {
  const match = /^[a-z][a-z0-9+.-]*:\/\/(?:[^/@]*@)?(?:\[[^\]]+\]|[^:/?#]+)(?::(\d+))?/iu.exec(text)
  if (match === null || match[1] === undefined) return null
  const port = Number(match[1])
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : null
}

/** An address's host without the brackets WHATWG keeps around an IPv6 literal. */
function plainHost(url) {
  return url.hostname.replace(/^\[|\]$/g, '')
}

/**
 * Read and validate one stored proxy value.
 *
 * The shape is the card's: an `http` or `https` URL, a host and an explicit port, no path, no query and
 * no fragment. A SOCKS URL is refused in its own words rather than as a malformed address — a reader
 * who pasted one should be told the product does not speak SOCKS, not that the URL is broken. The
 * refusals never repeat the value: a `user:pass@` prefix is exactly what must not travel into a strip,
 * a title or a log.
 * @param {unknown} raw the stored value
 * @returns {{raw: string, url: URL, port: number, hostPort: string, authorization: string|null}} the parsed value
 * @throws {ProxyUrlRefusal} when the value is not a usable proxy address
 */
export function parseProxyUrl(raw) {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (text === '') throw new ProxyUrlRefusal('No proxy URL is stored.')
  let url
  try {
    url = new URL(text)
  } catch {
    throw new ProxyUrlRefusal(SHAPE)
  }
  const protocol = url.protocol.toLowerCase()
  if (protocol.startsWith('socks')) {
    throw new ProxyUrlRefusal(`SOCKS proxies are not supported: ${SHAPE}`)
  }
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new ProxyUrlRefusal(SHAPE)
  }
  if (url.hostname === '') throw new ProxyUrlRefusal(SHAPE)
  const port = explicitPortOf(text)
  if (port === null) {
    throw new ProxyUrlRefusal(`The proxy URL must name a port: http(s)://[user:pass@]host:port.`)
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new ProxyUrlRefusal(`The proxy URL must carry no path: http(s)://[user:pass@]host:port.`)
  }
  if (url.search !== '' || url.hash !== '') {
    throw new ProxyUrlRefusal(`The proxy URL must carry no query or fragment: http(s)://[user:pass@]host:port.`)
  }
  return {
    raw: text,
    url,
    port,
    hostPort: `${url.hostname}:${port}`,
    authorization: url.username === '' ? null : basicAuthorization(url),
  }
}

/** The `Proxy-Authorization` value for a URL that carries userinfo. */
function basicAuthorization(url) {
  const user = safeDecode(url.username)
  const password = safeDecode(url.password)
  return `Basic ${Buffer.from(`${user}:${password}`, 'utf8').toString('base64')}`
}

/** Percent-decode one userinfo half without turning a malformed escape into a crash. */
function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * The environment one install publishes: both schemes point at the one proxy.
 *
 * `no_proxy` is left out on purpose — the platform merges its loopback bypass into every policy, and a
 * launch environment's own bypass list is not this product's to hand to a window it opens.
 * @param {{raw: string}} parsed the stored proxy
 * @returns {Map<string, {value: string}>} the synthetic launch environment
 */
function environmentOf(parsed) {
  return new Map([
    ['http_proxy', { value: parsed.raw }],
    ['https_proxy', { value: parsed.raw }],
  ])
}

/**
 * The environment names the platform's install publishes, both casings plus the fallback names it reads
 * but never writes: restoring the snapshot means clearing or rewriting exactly these.
 */
const INSTALL_ENV_NAMES = [
  'http_proxy', 'HTTP_PROXY',
  'https_proxy', 'HTTPS_PROXY',
  'no_proxy', 'NO_PROXY',
  'all_proxy', 'ALL_PROXY',
]

/** Every name's value as the process holds it now; `undefined` marks an absent name. */
function snapshotEnvironment() {
  const snapshot = new Map()
  for (const name of INSTALL_ENV_NAMES) snapshot.set(name, process.env[name])
  return snapshot
}

/**
 * Put the proxy environment back to a snapshot, never throwing.
 * @param {Map<string, string|undefined>} snapshot the environment the install started from
 * @returns {boolean} true when every name holds what the snapshot recorded
 */
function restoreEnvironment(snapshot) {
  try {
    for (const [name, value] of snapshot) {
      if (value === undefined) Reflect.deleteProperty(process.env, name)
      else process.env[name] = value
    }
    return true
  } catch {
    return false
  }
}

/** The one install window this process has open at a time; every window is queued behind it. */
let windowOpen = Promise.resolve()

/**
 * Run one call under a policy installed from `parsed`, then restore the previous policy.
 *
 * The window is serialized: the platform's dispatcher and proxy environment are process-wide, so a
 * second install while one stands would record the first window's published values as the user's own
 * and restore the wrong ones. A waiter therefore installs after the previous window has been restored.
 *
 * The window is closed in `finally`: a call that throws, aborts or is cut by its deadline still puts the
 * previous policy back. The caller bounds the work through the signal it passes — the install itself
 * has no timer of its own.
 *
 * The install is not atomic: it publishes the proxy environment before it builds the dispatcher, so a
 * failure between the two would leave a proxy standing with nothing restoring it. The environment is
 * therefore snapshotted inside the window and put back by hand when the install throws.
 * @param {ReturnType<typeof parseProxyUrl>} parsed the stored proxy
 * @param {() => Promise<unknown>} run the work to perform inside the window
 * @returns {Promise<unknown>} whatever `run` answers
 * @throws {ProxyInstallRefusal} when the policy could not be installed
 */
export async function withProxy(parsed, run) {
  const previous = windowOpen
  let close
  windowOpen = new Promise((resolve) => {
    close = resolve
  })
  await previous
  let dispose
  const environment = snapshotEnvironment()
  try {
    try {
      /* The synthetic environment carries two values this module parsed itself, so the platform's
         rejected-candidate report has nothing to say about them. */
      dispose = await installProxyFromEnvironment(environmentOf(parsed))
    } catch (error) {
      throw new ProxyInstallRefusal(error, restoreEnvironment(environment))
    }
    return await run()
  } finally {
    try {
      if (dispose !== undefined) await dispose()
    } finally {
      close()
    }
  }
}

/**
 * Whether the policy standing now would send this URL through a proxy — the platform's own answer, the
 * same one the fetch provider consults, so an installed window that answers false is a window it will
 * not use.
 * @param {URL} url the URL a fetch will ask for
 * @returns {boolean} true when the active policy routes it through a proxy
 */
export function proxiedFor(url) {
  return proxyRouteFor(url).proxied === true
}

/**
 * A stored value's word only when the credential resolve returned one; empty means absent.
 * @param {unknown} hit the resolve's answer, `{value, source}`
 * @returns {string|null} the stored value's word, or `null` when none stands
 */
function storedUrlOf(hit) {
  const value = typeof hit?.value === 'string' ? hit.value.trim() : ''
  return value === '' ? null : value
}

/**
 * Resolve the stored proxy value through the platform's credential store, once per operation.
 *
 * The resolve is per call by design: the card writes the value and a rotated or removed URL must reach
 * the next page fetch without a plugin restart. `null` is the honest "nothing stored" — an empty value
 * is absent in the store's own law, and a non-string is not a URL.
 * @param {object} credentials the platform's credentials service
 * @param {string} ref the credential reference the row names
 * @returns {Promise<string|null>} the stored value, or `null` when none stands
 */
export async function resolveStored(credentials, ref) {
  return storedUrlOf(await credentials.resolve(ref))
}

/**
 * One reachability check of a stored proxy: a connection, then one `CONNECT example.com:443`.
 *
 * An `https://` proxy URL is connected over TLS before the tunnel request, because that proxy's own
 * transport is TLS and its certificate is the one the URL names; a plain TCP connect would prove a port
 * rather than that proxy. The check proves what it can prove without a fetch: the proxy is reachable,
 * speaks `CONNECT`, and — when the URL carries userinfo — accepts the credentials it was handed. It
 * never fetches a page, never installs a policy and changes no state: the socket is destroyed the moment
 * the status line is read.
 *
 * The verdicts are the card's three words: `works` (HTTP 200), `refused` (HTTP 407, whose reason is the
 * credentials sentence, and any other status that refuses the tunnel — 403, 405, 400 and their neighbours)
 * and `unavailable` (the connection could not be made, nothing answered in time, or the proxy answered
 * `429`/`5xx` instead of opening the tunnel: it is reachable, but a transient failure of its own may pass,
 * and calling that a refusal would tell the reader to retype a proxy that is merely unwell). A value that
 * is not a proxy address at all is `refused`. The reason names the proxy as `host:port` and never the URL.
 * @param {unknown} raw the stored value
 * @param {{timeLimitMs?: number}} [options] the probe's ceiling; the card's law is 8 s
 * @returns {Promise<{verdict: 'works'|'refused'|'unavailable', hostPort: string|null, reason?: string}>} the verdict
 */
export async function checkProxy(raw, options = {}) {
  const limit = Number.isFinite(options.timeLimitMs) && options.timeLimitMs > 0 ? options.timeLimitMs : CHECK_TIME_LIMIT_MS
  let parsed
  try {
    parsed = parseProxyUrl(raw)
  } catch (error) {
    return { verdict: 'refused', hostPort: null, reason: redact(error instanceof Error ? error.message : String(error)) }
  }
  return await new Promise((resolve) => {
    const { hostPort, url, port, authorization } = parsed
    let socket
    let settled = false
    let timer
    const finish = (verdict, reason) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        socket?.destroy()
      } catch {
        /* A socket that already closed has nothing left to release. */
      }
      resolve(reason === undefined ? { verdict, hostPort } : { verdict, hostPort, reason: redact(reason) })
    }
    timer = setTimeout(() => {
      finish('unavailable', `The proxy at ${hostPort} did not answer within ${limit} ms.`)
    }, limit)
    const host = plainHost(url)
    /* RFC 6066 forbids a server name that is an IP literal; Node ignores it with a warning, so it is not
       sent for an address the reader wrote as one. */
    socket = url.protocol === 'https:'
      ? tlsConnect({ host, port, ...(isIP(host) === 0 ? { servername: host } : {}) })
      : tcpConnect({ host, port })
    socket.setNoDelay?.(true)
    const connected = () => {
      if (settled) return
      const head = [`CONNECT ${CHECK_TARGET} HTTP/1.1`, `Host: ${CHECK_TARGET}`]
      if (authorization !== null) head.push(`Proxy-Authorization: ${authorization}`)
      socket.write(`${head.join('\r\n')}\r\n\r\n`)
    }
    socket.once(url.protocol === 'https:' ? 'secureConnect' : 'connect', connected)
    let received = ''
    socket.on('data', (chunk) => {
      received += chunk.toString('latin1')
      const end = received.indexOf('\r\n')
      if (end === -1) {
        if (received.length > 8_000) finish('refused', `The proxy at ${hostPort} did not answer with an HTTP status line.`)
        return
      }
      const status = /^HTTP\/\d(?:\.\d)?\s+(\d{3})\b/.exec(received.slice(0, end))
      if (status === null) {
        finish('refused', `The proxy at ${hostPort} did not answer with an HTTP status line.`)
        return
      }
      const code = Number(status[1])
      if (code === 200) finish('works')
      else if (code === 407) finish('refused', `The proxy at ${hostPort} refused the credentials (HTTP 407).`)
      else if (code === 429 || (code >= 500 && code <= 599)) finish('unavailable', `The proxy at ${hostPort} answered HTTP ${code} instead of opening the tunnel.`)
      else finish('refused', `The proxy at ${hostPort} refused the tunnel (HTTP ${code}).`)
    })
    socket.on('error', (error) => {
      const code = typeof error?.code === 'string' && error.code !== '' ? ` (${error.code})` : ''
      finish('unavailable', `The proxy at ${hostPort} could not be reached${code}.`)
    })
    socket.on('close', () => {
      finish('unavailable', `The proxy at ${hostPort} closed the connection without an answer.`)
    })
  })
}
