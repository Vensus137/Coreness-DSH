/**
 * Page Studio's one switch: a volatile field, read at every sync and at every assembly.
 *
 * Volatile is the platform's word for two things at once: a write lands in the running plugin
 * instead of re-mounting the row, and only volatile fields are projected into a settings form — so
 * this field is both what the page's card writes through the route and what the host reads back.
 * The default is part of what stands: a row that names no value is off.
 *
 * @module @coreness/studio/config
 */

import z from '@deepseek-ai/schemastery'

export const Config = z.object({
  /** Whether the four tools, the skill and the routing paragraph are offered to the model. */
  enabled: z.boolean().default(false).volatile(),
})
