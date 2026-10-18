/**
 * The rules of this project that must hold in force: exactly one prompt section, carrying the text of
 * one file beside this module.
 *
 * A rule that must hold without a reader acting cannot be kept in a document: a document is read when
 * someone opens it, and a compaction takes the span it stood in out of the model's sight. The
 * platform's assembled prompt is the surface rebuilt for every request, so these rules stand there —
 * registered through the platform's own prompt registry, which is the graded door for it: sections are
 * concatenated in ascending order, ties fall to code-unit name order, and an empty section is dropped
 * in silence.
 *
 * **The text is a file, and not a string in this module.** A prompt is paid for by every request, so
 * its text is edited, diffed and measured as the text it is; the file is read at the mount, so a change
 * to a rule is a reload of the row. What moved here from a document brought the rule alone: the acts a
 * reader performs stayed where the reader is.
 *
 * **Nothing is substituted.** The section is registered `interpolate: false` — the platform's own door
 * for literal text, and the reason a brace standing in a rule can never fail an assembly. A file that
 * cannot be read throws, and one that is empty is refused here rather than registered as a section
 * contributing nothing: a silent no-op is the one outcome this plugin does not offer.
 *
 * `systemPrompt` is declared and not merely read: a declared name is an activation gate in Cordis, so a
 * composition without the platform's prompt registry leaves this row pending — named among the entries
 * that did not activate — instead of mounting over nothing.
 *
 * @module @coreness/rules
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-rules'

/**
 * The one service this plugin cannot exist without: the registry a section is registered through. A
 * composition without it leaves the plugin pending rather than mounted over nothing, which is the
 * platform's own meaning of a declared name.
 */
export const inject = ['systemPrompt']

/** The section's own name in the registry, in the platform's `namespace:name` idiom. One section, one name. */
export const SECTION = 'coreness:rules'

/**
 * Where the section stands among the platform's own, read from the registry's own scale: the harness's
 * identity stands at −1000 and the deployment's persona at 0, the plan and team policies at 500 and
 * 600, the tool guides from 800 on. 700 is the slot that scale leaves free between a policy and a tool
 * guide, and it is where a project's own rules belong — after what the harness is and before what its
 * tools are for. The registry's `getSectionOrder` resolves only placements the platform owns centrally,
 * so a section of this project carries an explicit finite order, which is what the contract allows an
 * outside contributor.
 */
export const ORDER = 700

/**
 * The section's text: one file beside this module, read at the mount. There is no copy of the rules in
 * this module to fall back on — a second copy is the drift this plugin exists to end.
 */
export const TEXT = fileURLToPath(new URL('./section.md', import.meta.url))

/** The row's settings: the section's placement, and nothing else — the rules are not a knob. */
export const Config = z.object({
  order: z.number().default(ORDER),
})

/**
 * The section's text as it is served, or a refusal in this plugin's own words.
 *
 * The file's trailing newline is layout and not prompt: the section ends where its last rule ends. An
 * empty text — all whitespace included — is refused rather than registered, because the registry drops
 * an empty section and the rules would then be absent without a line anywhere saying so.
 * @param {string} source the file's own content
 * @returns {string} the text the section carries
 */
export function textOf(source) {
  const text = source.trimEnd()
  if (text.trim() === '') {
    throw new Error(`${name}: the section's text file is empty — the rules would be registered as nothing, and an empty section is dropped in silence`)
  }
  return text
}

/**
 * Mount the section.
 *
 * One registration and one line: what the section is, where it stands and what it weighs — the line a
 * reader of the platform's ring uses to see the rules arrive, since this plugin has no surface of its
 * own and needs none.
 * @param {object} ctx the cordis context
 * @param {object} config the row's config, resolved by the Loader against {@link Config}
 * @returns {void}
 */
export function apply(ctx, config) {
  const text = textOf(readFileSync(TEXT, 'utf8'))
  ctx.systemPrompt.section({ name: SECTION, order: config.order, text, interpolate: false })
  ctx.logger?.info?.(`${name}: the rules stand in force as the prompt section "${SECTION}" at order ${config.order}, ${text.length} character(s) of ${text.split('\n').length} line(s)`)
}
