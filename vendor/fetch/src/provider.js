/**
 * The product's fetch provider: the platform's own public HTTP fetch under the product's id.
 *
 * The platform owns every rule that matters — the URL validation, the public-address check and the pinned
 * resolution on the direct route, the same-origin redirects, the content-type classification, the timeout
 * and the abort word — and this provider adds only the limits and the browser identity the product needs.
 * Nothing is caught or restated: a `WebError` leaves as the platform threw it, so a caller routes on the
 * same codes it would meet with the platform's own provider.
 *
 * @module @coreness/fetch/src/provider
 */

import { HttpFetchProvider } from '@deepseek-ai/dsh-web-fetch-http'

/** The id the provider registers under and the shared web row names. */
export const PROVIDER_ID = 'coreness-fetch'

/** The platform's own fetch timeout: a provider's deadline is required, and this is the allowance the platform's own fetch row gives a page. */
export const FETCH_TIMEOUT_MS = 30_000

/** The browser identity a page that admits browsers and not a bare client requires. */
export const FETCH_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/**
 * The transport limits handed to the platform's provider.
 *
 * The body cap is counted in characters and stands at 2 MiB: the platform's own default cuts a page at
 * 100 000 characters, while the tool that renders the result cuts at 200 000 — a provider cap above the
 * tool's own is what leaves the tool's ceiling the only one a page meets. The byte cap is the platform's
 * own 5 MB and no lower: a smaller one refuses pages the platform itself serves, and the text a page yields
 * is already bounded by the tool's own output cap. The redirect cap and the timeout are the platform's own
 * defaults, restated because a provider's limits are one object.
 */
export const FETCH_LIMITS = Object.freeze({
  userAgent: FETCH_USER_AGENT,
  maxBodyChars: 2 * 1024 * 1024,
  maxResponseBytes: 5_000_000,
  maxRedirects: 5,
  timeoutMs: FETCH_TIMEOUT_MS,
})

/**
 * The provider the platform's web seam registers.
 *
 * `available()` is always true: an anonymous public fetch carries no credential and no switch, so the
 * shared row's selection alone decides whether it runs. A handed-in platform provider is the fixture's
 * seam, where delegation and passthrough are read; the product builds the platform's own over
 * {@link FETCH_LIMITS}.
 * @param {object} [platform] the platform's HTTP fetch provider
 * @returns {object} the provider the web seam registers
 */
export function createFetchProvider(platform = new HttpFetchProvider(FETCH_LIMITS)) {
  return {
    id: PROVIDER_ID,
    available() {
      return true
    },
    fetch(request, signal) {
      return platform.fetch(request, signal)
    },
  }
}
