/**
 * The two web providers this route registers: a search through Qoder Center and a local HTTP fetch.
 *
 * Both carry the id `qoder`. The search is the transport's own signed call, mapped to the platform's
 * source shape; the fetch delegates to the platform's own `HttpFetchProvider` with the browser identity
 * this product needs, because the platform's contract asks for a body and the vendor's own WebFetch adds
 * a utility-model summary this product does not use. The private-address and redirect policy therefore
 * has one owner: the platform's provider. The flag in the row is the switch: the providers stay registered
 * and are unavailable while it is off, so a profile that never turned them on keeps its standard DeepSeek
 * search and no `web` ambiguity.
 *
 * @module @coreness/qoder/src/web
 */

import { WebError } from '@deepseek-ai/dsh-web'
import { HttpFetchProvider } from '@deepseek-ai/dsh-web-fetch-http'
import { QoderError } from './in.js'
import { causesOf, liveValue } from './adapter.js'

/** The provider id both providers carry. */
export const PROVIDER_ID = 'qoder'

/** How long one fetch may take; the platform's own fetch provider uses a comparable ceiling. */
export const FETCH_TIMEOUT_MS = 15_000

/** The response byte and char cap handed to the platform: a declared length over it is refused, a stream that grows past it is cut and marked truncated. */
export const FETCH_MAX_BYTES = 2 * 1024 * 1024

/** The browser identity the local GET presents: a page that admits browsers and not a bare client needs it. */
export const FETCH_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/** The transport limits the Qoder fetch hands to the platform's HTTP provider. */
export const FETCH_LIMITS = Object.freeze({
  maxResponseBytes: FETCH_MAX_BYTES,
  maxBodyChars: FETCH_MAX_BYTES,
  timeoutMs: FETCH_TIMEOUT_MS,
  maxRedirects: 5,
  userAgent: FETCH_USER_AGENT,
})

/** The row's own flag, read live so the checkbox applies without a re-mount. */
function enabledOf(config) {
  return liveValue(liveValue(config.webAccess)?.enabled) === true
}

/** The credential reference, or nothing when the row names none. */
function referenceOf(config) {
  const field = liveValue(config.apiKeyEnv)
  return typeof field === 'string' && field !== '' ? field : null
}

/** The address as it may be shown: embedded credentials never travel into an error or a log. */
function displayUrl(url) {
  const clean = new URL(url.href)
  clean.username = ''
  clean.password = ''
  return clean.href
}

/** The request address for an error message; an unparseable one is shown as given and never fetched. */
function displayRequestUrl(input) {
  try {
    return displayUrl(new URL(input))
  } catch {
    return String(input)
  }
}

/** The reason a thrown fetch failure carries: the outer word and the first code in its cause chain. */
function reasonOf(error) {
  const cause = causesOf(error)
  const code = cause.code ?? cause.first
  const words = typeof error?.message === 'string' && error.message !== '' ? error.message : undefined
  if (code !== undefined && words !== undefined && words !== code) return `${words} (${code})`
  if (code !== undefined) return code
  if (words !== undefined) return words
  return String(error)
}

/**
 * The search provider: one signed Qoder call per request, no fallback and no cache.
 * @param {object} joint the transport, the row and the live flag
 * @returns {object} the platform's search provider
 */
export function createSearchProvider({ transport, config }) {
  return {
    id: PROVIDER_ID,
    /** Unavailable while the switch is off or the row names no credential. */
    available() {
      return enabledOf(config) && referenceOf(config) !== null
    },
    /**
     * One search. A vendor error is thrown, not turned into an empty answer; maxResults is applied here
     * because the transport speaks the vendor's request and the platform's cap is the provider's.
     * @param {{query: string, maxResults?: number}} request the platform's request
     * @param {AbortSignal} [signal] the caller's cancellation
     * @returns {Promise<{sources: object[], truncated: boolean}>} the mapped result
     */
    async search(request, signal) {
      const answer = await transport.search({ query: request.query }, signal)
      const cap = Number.isInteger(request.maxResults) && request.maxResults > 0
        ? request.maxResults
        : answer.pageItems.length
      const sources = answer.pageItems
        .slice(0, cap)
        .map((item) => ({
          url: typeof item.link === 'string' ? item.link : '',
          title: typeof item.title === 'string' ? item.title : undefined,
          snippet: typeof item.snippet === 'string' ? item.snippet : undefined,
          publishedAt: typeof item.publishedTime === 'string' ? item.publishedTime : undefined,
        }))
        .filter((source) => source.url !== '')
      return { sources, truncated: answer.pageItems.length > sources.length }
    },
  }
}

/**
 * The fetch provider: the platform's public HTTP fetch with the browser identity, the timeout and the
 * byte cap this product needs. The platform owns the private-address check, the pinned resolution and the
 * redirect policy; a network, timeout or caller abort is restated with the address and the cause, while a
 * blocked or invalid URL keeps the platform's own code and message.
 * @param {object} joint the row's flag and the platform fetch seam
 * @param {object} [joint.standard] the platform's fetch provider; the product builds the default
 * @param {number} [joint.timeoutMs] the fetch ceiling; the product uses {@link FETCH_TIMEOUT_MS}
 * @returns {object} the Qoder wrapper registered under the platform's web service
 */
export function createFetchProvider({ config, standard, timeoutMs = FETCH_TIMEOUT_MS }) {
  const provider = standard ?? new HttpFetchProvider({ ...FETCH_LIMITS, timeoutMs })
  return {
    id: PROVIDER_ID,
    /** The switch and the credential reference together; a stored token that is missing surfaces at the call. */
    available() {
      return enabledOf(config) && referenceOf(config) !== null
    },
    /**
     * One GET through the platform's public fetch.
     * @param {{url: string}} request the platform's request
     * @param {AbortSignal} [signal] the caller's cancellation
     * @returns {Promise<object>} the platform's fetch result
     */
    async fetch(request, signal) {
      try {
        return await provider.fetch(request, signal)
      } catch (error) {
        if (error instanceof QoderError) throw error
        if (error instanceof WebError) {
          if (error.code === 'WEB_PROVIDER_ERROR') {
            throw new QoderError(`the web fetch failed for ${displayRequestUrl(request.url)}: ${reasonOf(error.cause ?? error)}`, 'UPSTREAM', { cause: error })
          }
          if (error.code === 'WEB_FETCH_TIMEOUT') {
            throw new QoderError(`the web fetch timed out after ${timeoutMs} ms: ${displayRequestUrl(request.url)}`, 'TIMEOUT', { cause: error })
          }
          if (error.code === 'WEB_ABORTED') {
            throw new QoderError(`the web fetch was cancelled by the caller: ${displayRequestUrl(request.url)}`, 'ABORTED', { cause: error })
          }
        }
        throw error
      }
    },
  }
}

/**
 * Register both providers under the platform's own web service, and hand back the disposal.
 * @param {object} web the platform's web service
 * @param {object} joint the transport, the row and the fetch implementation
 * @returns {() => void} the disposal
 */
export function registerWebProviders(web, joint) {
  const disposers = [
    web.registerSearchProvider(createSearchProvider(joint)),
    web.registerFetchProvider(createFetchProvider(joint)),
  ]
  return () => {
    for (const dispose of disposers) {
      if (typeof dispose === 'function') dispose()
    }
  }
}
