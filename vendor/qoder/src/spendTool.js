/**
 * The ledger's tool: the money one window holds, as an agent asks for it.
 *
 * The tool is the thin door over the reader — the arguments are checked here and the reading is the
 * reader's, so a fixture holds the sums without the platform's package in hand.
 *
 * @module @coreness/qoder/src/spendTool
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import { SPEND_BY, spendOf } from './spendRead.js'

/**
 * An instant out of an argument: what is not an instant is a refusal rather than a substitution.
 * @param {string | undefined} value the argument
 * @param {string} name the argument's name for the refusal
 * @returns {string | undefined} the canonical instant
 */
function instantOf(value, name) {
  if (value === undefined) return undefined
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) throw new Error(`argument ${name} is not an instant: ${String(value)}`)
  return new Date(parsed).toISOString()
}

/** The tool's name. */
export const SPEND_TOOL = 'spend'

/** An instant in the canonical shape, for the tool's own words. */
const INSTANT = '2026-10-05T18:00:00.000Z'

/**
 * The tool over one ledger.
 * @param {string} path the ledger's path, resolved by the plugin once
 * @returns {object[]} the tool definitions
 */
export function spendTools(path) {
  return [
    defineTool({
      name: SPEND_TOOL,
      description: 'The money the spend journal holds for a window: dollars, the vendor\'s credits, the requests '
        + 'and the tokens, optionally broken down by day or by model. Every row is one request; a row whose wire '
        + 'counted no credits adds no money, and the answer says how many lines of the ledger were not rows.',
      parameters: {
        since: { type: 'string', description: `Window start, an instant like ${INSTANT}. By default there is no lower bound.` },
        until: { type: 'string', description: `Window end, an instant like ${INSTANT}. By default — now.` },
        by: { type: 'string', enum: SPEND_BY, description: 'Breakdown: none, day (the UTC date) or model.' },
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      async execute(args) {
        return await spendOf(path, {
          since: instantOf(args.since, 'since'),
          until: instantOf(args.until, 'until'),
          by: args.by ?? 'none',
        })
      },
    }),
  ]
}
