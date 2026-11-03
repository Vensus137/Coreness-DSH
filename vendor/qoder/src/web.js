/**
 * The web search provider this route registers: one signed call through Qoder Center, no fallback and no
 * cache.
 *
 * The provider carries the id `qoder`. The row's flag is the switch: the provider stays registered and is
 * unavailable while the flag is off, so a profile that never turned it on keeps its standard DeepSeek search
 * and no `web` ambiguity. The shared row's fetch selection is another surface's subject; only the search is
 * registered here.
 *
 * @module @coreness/qoder/src/web
 */

import { liveValue } from './adapter.js'

/** The provider id the search carries. */
export const PROVIDER_ID = 'qoder'

/** The row's own flag, read live so the checkbox applies without a re-mount. */
function enabledOf(config) {
  return liveValue(liveValue(config.webAccess)?.enabled) === true
}

/** The credential reference, or nothing when the row names none. */
function referenceOf(config) {
  const field = liveValue(config.apiKeyEnv)
  return typeof field === 'string' && field !== '' ? field : null
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
 * Register the search provider under the platform's own web service, and hand back the disposal.
 * @param {object} web the platform's web service
 * @param {object} joint the transport and the row
 * @returns {() => void} the disposal
 */
export function registerWebProvider(web, joint) {
  const dispose = web.registerSearchProvider(createSearchProvider(joint))
  return () => {
    if (typeof dispose === 'function') dispose()
  }
}
