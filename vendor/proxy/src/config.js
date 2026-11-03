/**
 * The proxy module's own settings: the switch and the credential reference.
 *
 * Both are volatile because both are the page's to move while the plugin stands: a write applies to
 * the running row without re-mounting it, and the settings service refuses every path that is not
 * volatile. The reference is a name, never a value — the URL itself lives in the platform's credential
 * store and is resolved per call.
 *
 * @module @coreness/proxy/config
 */

import z from '@deepseek-ai/schemastery'

export const Config = z.object({
  /** Whether a page fetch is sent through the stored proxy first, with a direct repeat when that fails. */
  enabled: z.boolean().default(false).volatile(),
  /** The credential reference the stored proxy URL lives under; a name, never a value. */
  proxyRef: z.string().role('credential-ref').default('CORENESS_FETCH_PROXY').volatile(),
})
