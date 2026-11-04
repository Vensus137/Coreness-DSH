/**
 * The proxy module's own settings: the two switches and the credential reference.
 *
 * All three are volatile because all three are the page's to move while the plugin stands: a write applies
 * to the running row without re-mounting it, and the settings service refuses every path that is not
 * volatile. The reference is a name, never a value — the URL itself lives in the platform's credential
 * store and is resolved per call.
 *
 * @module @coreness/proxy/config
 */

import z from '@deepseek-ai/schemastery'

export const Config = z.object({
  /** Whether a page fetch is sent through the stored proxy first, with a direct repeat when that fails. */
  enabled: z.boolean().default(false).volatile(),
  /** Whether one standing policy sends every request the harness makes through the stored proxy. */
  allTraffic: z.boolean().default(false).volatile(),
  /** The credential reference the stored proxy URL lives under; a name, never a value. */
  proxyRef: z.string().role('credential-ref').default('CORENESS_FETCH_PROXY').volatile(),
})

/**
 * The row this plugin's fiber answers for, as the settings service addresses it.
 *
 * The settings service keys its rows by the profile entry id, and the entry id is what the fiber's
 * entry carries: this is the one place the address is derived, for the picture and for the switch read.
 * @param {object} ctx the cordis context
 * @returns {string|null} the row id, or null outside a loader entry
 */
export function rowIdOf(ctx) {
  return ctx.fiber?.entry?.options?.id ?? null
}
