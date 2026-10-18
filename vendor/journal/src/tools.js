/**
 * The journal's tools: one query and one note.
 *
 * The vocabulary is the schema's: the kind comes from the closed list, and an unknown
 * kind is refused by the tool's own definition rather than by a record named "other".
 * A selection without a kind answers with a summary: the journal is not read whole, it
 * is asked.
 *
 * An answer is checked at the boundary ({@link lossless}): the value leaves the process,
 * and not every value survives the transfer. A refusal at the exit is cheaper than a
 * refused answer: it names the field, while the receiver would otherwise be left without
 * an answer and without a reason.
 *
 * @module @coreness/journal/src/tools
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import { KINDS, PARTICIPANT_KINDS } from './domain.js'

/** The query tool: one call — one step. */
export const QUERY_TOOL = 'journal'
/** The note tool: what cannot be observed, reported by a participant. */
export const NOTE_TOOL = 'journal_note'

/** An instant in the canonical shape: the record schema knows only that shape. */
const INSTANT = '2026-10-05T18:00:00.000Z'

/**
 * The journal's tools for the host half.
 * @param {object} journal the journal
 * @returns {object[]} the tool definitions
 */
export function journalTools(journal) {
  return [
    defineTool({
      name: QUERY_TOOL,
      description: 'One query over the environment\'s journal: without a kind it answers with a short summary '
        + '(how many records, what changed, refusals, steps), with a kind or an area — with the records themselves '
        + 'within the named limit. The journal is never read whole.',
      parameters: {
        since: { type: 'string', description: `Window start, an instant like ${INSTANT}. By default there is no lower bound.` },
        until: { type: 'string', description: `Window end, an instant like ${INSTANT}. By default — now.` },
        kind: { type: 'string', enum: KINDS, description: 'Record kind; named, the query answers with records rather than with a summary.' },
        area: { type: 'string', description: 'Area: profile, plugin, bundle, task, file.' },
        id: { type: 'string', description: 'The name of a record inside its kind and area.' },
        limit: { type: 'integer', description: 'How many records to answer with and how many short lines the summary carries; at least 1.' },
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      async execute(args) {
        return lossless(await journal.query({
          since: instantOf(args.since, 'since'),
          until: instantOf(args.until, 'until'),
          kind: args.kind,
          area: args.area,
          id: args.id,
          limit: limitOf(args.limit),
        }))
      },
    }),
    defineTool({
      name: NOTE_TOOL,
      description: 'Write into the environment\'s journal what changes the world and cannot be observed: a closed '
        + 'task, a step, a refusal with its reason, a mark "the plugin is handed over". A refusal without a reason is '
        + 'refused; a step carries its measured duration.',
      parameters: {
        kind: {
          type: 'string',
          enum: PARTICIPANT_KINDS,
          required: true,
          description: 'задача — the work is closed; шаг — one approach with its duration; отказ — with a reason; сдача — what exactly is handed over.',
        },
        area: { type: 'string', required: true, description: 'What exactly: a plugin, a task, a file, a domain.' },
        id: { type: 'string', description: 'The name of the record; by default — the word of its kind.' },
        task: { type: 'string', description: 'The task or session the record belongs to.' },
        text: { type: 'string', description: 'The short essence of the record.' },
        reason: { type: 'string', description: 'The reason of a refusal; the kind "отказ" is refused without it.' },
        stepMs: { type: 'integer', description: 'The duration of a step in milliseconds.' },
        reread: { type: 'string', description: 'A file read again within the task.' },
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      async execute(args) {
        // The arguments are handed over as they came. The platform's schema checks the fields
        // it declares and says nothing about the rest, so a tool that picked out the fields it
        // knows would drop an undeclared one in silence; the journal's own guard refuses it.
        return lossless(await journal.note(args))
      },
    }),
  ]
}

/**
 * An instant out of an argument: what is not an instant is a refusal rather than a
 * substitution.
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

/**
 * A limit out of an argument: the schema carries no lower bound for an integer, so the
 * bound is held here — a limit below one would answer with nothing and say nothing.
 * @param {number | undefined} value the argument
 * @returns {number | undefined} the limit
 */
function limitOf(value) {
  if (value === undefined) return undefined
  if (Number.isInteger(value) === false || value < 1) {
    throw new Error(`argument limit must be an integer of at least 1: ${String(value)}`)
  }
  return value
}

/**
 * An answer that survives the transfer.
 *
 * The value leaves the process, and not every value survives: `undefined` disappears
 * from a field, `NaN` and the infinities become `null`, dates and class instances turn
 * into someone else's structures, and a reference in a circle breaks the transfer
 * altogether. The host refuses such an answer whole — and it is the receiver who sees
 * it, not the author. The check stands at the very boundary where the answer becomes
 * the tool's answer: a refusal names the path to the value.
 * @param {unknown} value the answer's value
 * @returns {unknown} the same value, when it survives the transfer
 * @throws {Error} the value does not survive the transfer
 */
export function lossless(value) {
  const walked = new Set()
  const walk = (node, path) => {
    if (node === null) return
    const kind = typeof node
    if (kind === 'string' || kind === 'boolean') return
    if (kind === 'number') {
      if (Number.isFinite(node) === false) throw new Error(`the answer does not survive the transfer: ${path} — ${String(node)}`)
      return
    }
    if (kind !== 'object') throw new Error(`the answer does not survive the transfer: ${path} — a value of kind ${kind}`)
    if (walked.has(node)) throw new Error(`the answer does not survive the transfer: ${path} — a reference in a circle`)
    walked.add(node)
    if (Array.isArray(node)) {
      node.forEach((item, index) => { walk(item, `${path}[${index}]`) })
      walked.delete(node)
      return
    }
    const proto = Object.getPrototypeOf(node)
    if (proto !== Object.prototype && proto !== null) {
      const name = proto?.constructor?.name ?? 'without a prototype'
      throw new Error(`the answer does not survive the transfer: ${path} — not a plain value (${name})`)
    }
    for (const [key, item] of Object.entries(node)) walk(item, `${path}.${key}`)
    walked.delete(node)
  }
  walk(value, 'answer')
  return value
}
