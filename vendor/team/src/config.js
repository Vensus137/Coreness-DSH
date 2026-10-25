/**
 * The product's own settings for the team.
 *
 * `prompt` is the switch the card writes: volatile, which is both the platform's word for "a write
 * applies to the running plugin without re-mounting the row" and the condition a write goes through at
 * all. `review` is the second switch: it appends the review paragraph to the text `prompt` supplies, so it
 * reads as a switch of its own while changing nothing when `prompt` is off. Both values are read at every
 * assembly, never captured at the mount.
 *
 * @module @coreness/team/config
 */

import z from '@deepseek-ai/schemastery'

export const Config = z.object({
  /** Whether the product's own text replaces the platform's last sentence of the team policy. */
  prompt: z.boolean().default(false).volatile(),
  /** Whether the review paragraph follows that text, inside the same substitution. */
  review: z.boolean().default(false).volatile(),
})
