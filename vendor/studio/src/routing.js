/**
 * The routing paragraph: the few lines the model reads while the switch is on, and where they stand.
 *
 * The text is a file beside this module, read once when the module loads — the mount — and never a
 * string here: it is paid for by every request while the switch is on, so it is edited, diffed and
 * measured as the text it is. An empty file is refused instead of registered as nothing, because the
 * platform drops an empty prompt section in silence and the routing text would then be absent with
 * no line anywhere saying so.
 *
 * @module @coreness/studio/routing
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** The prompt section's name, in the platform's `namespace:name` idiom. */
export const ROUTING_NAME = 'coreness:studio'

/** Where the routing paragraph stands: after the product's rules (700), before the platform's tool guides (800+). */
export const ROUTING_ORDER = 780

const FILE = fileURLToPath(new URL('./skill/routing.md', import.meta.url))

/** The routing paragraph, read at the mount; an empty file is refused rather than registered as nothing. */
export function routingTextOf() {
  const text = readFileSync(FILE, 'utf8').trimEnd()
  if (text.trim() === '') throw new Error('coreness-studio: the routing paragraph is empty — the section would be dropped in silence')
  return text
}

/** The paragraph as the section serves it: one read, at the mount, so a change to it is a reload of the row. */
export const ROUTING = routingTextOf()
