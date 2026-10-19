/**
 * The spend journal's reader: what the money did over a window.
 *
 * The ledger is append-only and one row is one request. A reader sums the rows of every generation the
 * file keeps — the file itself, the one it rotated into, and the donor era kept aside — because the bound
 * is about the disk, not about the history: an answer that read one file would forget an era at every
 * rotation.
 *
 * The money is the row's own: `usd` where the row carries it, else the vendor's credits at the row's own
 * `rate`, else at the fixed rate — a row written before the dollar figure existed still counts. A row
 * whose wire counted no credits writes no money and adds none to the sum.
 *
 * A line that is not a row is counted and said in the answer rather than dropped in silence: a torn line
 * in a ledger of costs is a fact about the ledger, not a detail of the reader.
 *
 * @module @coreness/qoder/src/spendRead
 */

import { createReadStream, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { createInterface } from 'node:readline'
import { USD_PER_CREDIT } from './spend.js'

/** The breakdowns an answer carries. */
export const SPEND_BY = ['none', 'day', 'model', 'finish']

/**
 * The files the ledger is made of, oldest era first: the donor's generation kept aside, the previous
 * generation, and the file being written. A path with no file is no generation.
 * @param {string} path the ledger's own path
 * @returns {string[]} the files that stand
 */
export function generationsOf(path) {
  return [`${path}.1.donor`, `${path}.1`, path].filter((file) => existsSync(file))
}

/** A finite number, or nothing — the wire's own fields are not trusted to be numbers. */
function numberOrNull(value) {
  return Number.isFinite(value) ? value : null
}

/**
 * The money one row carries: its credits as the wire counted them, and its dollars at the row's own rate.
 * @param {object} row a ledger row
 * @returns {{ credits: number | null, usd: number, billed: boolean }} the money; `billed` is the vendor's own
 * flag, and a row without it counts as unbilled rather than as spend
 */
export function moneyOf(row) {
  const credits = numberOrNull(row?.vendor?.credits)
  const billed = row?.vendor?.billable === true
  if (Number.isFinite(row?.usd)) return { credits, usd: row.usd, billed }
  if (credits === null) return { credits, usd: 0, billed }
  return { credits, usd: credits * (numberOrNull(row?.rate) ?? USD_PER_CREDIT), billed }
}

/**
 * The counters one row carries: the platform's tokens and the vendor's reasoning count, as they arrived.
 * @param {object} row a ledger row
 * @returns {object} the counters
 */
export function countersOf(row) {
  const usage = row?.usage ?? {}
  const vendor = row?.vendor ?? {}
  return {
    input: numberOrNull(usage.inputTokens) ?? 0,
    output: numberOrNull(usage.outputTokens) ?? 0,
    cacheRead: numberOrNull(usage.cacheReadTokens) ?? 0,
    reasoning: numberOrNull(vendor.reasoningTokens) ?? 0,
    total: numberOrNull(usage.totalTokens) ?? 0,
  }
}

/**
 * The sums over one selection of rows, in the order the rows came.
 *
 * Rounded to six decimals: the ledger's own precision, and a sum of rounded rows would otherwise grow a
 * tail of binary fractions no reader can act on.
 * @param {object[]} rows the ledger's rows
 * @param {object} [filter] the selection and the breakdown: `since`, `until`, `by`
 * @returns {object} the answer without the ledger's own facts: by, requests, usd, billed, unbilled, credits,
 * tokens and groups
 */
export function sumOf(rows, filter = {}) {
  const { since, until, by = 'none' } = filter
  if (SPEND_BY.includes(by) === false) throw new Error(`the breakdown is one of ${SPEND_BY.join(', ')}: ${String(by)}`)
  const inside = rows.filter((row) => (since === undefined || String(row?.time ?? '') >= since)
    && (until === undefined || String(row?.time ?? '') <= until))
  const total = { requests: 0, usd: 0, billed: 0, unbilled: 0, credits: 0, input: 0, output: 0, cacheRead: 0, reasoning: 0, total: 0 }
  const groups = new Map()
  for (const row of inside) {
    const money = moneyOf(row)
    const counters = countersOf(row)
    total.requests += 1
    total.usd += money.usd
    if (money.billed) total.billed += money.usd
    else total.unbilled += money.usd
    total.credits += money.credits ?? 0
    total.input += counters.input
    total.output += counters.output
    total.cacheRead += counters.cacheRead
    total.reasoning += counters.reasoning
    total.total += counters.total
    if (by === 'none') continue
    const key = by === 'day' ? String(row.time ?? '').slice(0, 10)
      : by === 'finish' ? String(row.finish?.kind ?? row.finish ?? 'unknown')
        : String(row.model ?? '')
    const item = groups.get(key) ?? { key, usd: 0, credits: 0, requests: 0 }
    item.usd += money.usd
    item.credits += money.credits ?? 0
    item.requests += 1
    groups.set(key, item)
  }
  const round = (value) => Math.round(value * 1e6) / 1e6
  const ordered = [...groups.values()].map((item) => ({
    key: item.key,
    usd: round(item.usd),
    credits: round(item.credits),
    requests: item.requests,
  }))
  if (by === 'day') ordered.sort((left, right) => left.key.localeCompare(right.key))
  if (by === 'model') ordered.sort((left, right) => right.usd - left.usd || left.key.localeCompare(right.key))
  if (by === 'finish') ordered.sort((left, right) => right.requests - left.requests || left.key.localeCompare(right.key))
  return {
    by,
    requests: total.requests,
    usd: round(total.usd),
    billed: round(total.billed),
    unbilled: round(total.unbilled),
    credits: round(total.credits),
    tokens: {
      input: total.input,
      output: total.output,
      cacheRead: total.cacheRead,
      reasoning: total.reasoning,
      total: total.total,
    },
    groups: ordered,
  }
}

/**
 * The rows of one generation, line by line — a ledger of hundreds of megabytes is read as a stream, not
 * as a string.
 * @param {string} file the generation
 * @returns {AsyncGenerator<string>} its lines
 */
async function* linesOf(file) {
  const lines = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity })
  for await (const line of lines) yield line
}

/**
 * The answer over the ledger's generations: the sums of the selection, and the ledger's own facts beside
 * them — how many files were read and how many lines could not be one of its rows.
 * @param {string} path the ledger's own path
 * @param {object} [filter] the selection: `since`, `until`, `by`
 * @returns {Promise<object>} the answer
 */
export async function spendOf(path, filter = {}, failures) {
  if (typeof failures !== 'number') {
    throw new Error('the count of rows a failed write took is not optional: the writer holds it, and a reader that assumes zero reports a loss it never checked')
  }
  const files = generationsOf(path)
  if (files.length === 0) {
    throw new Error(`the spend ledger stands nowhere under ${path}: no request was counted here, and an empty answer would read as a free one`)
  }
  const rows = []
  let torn = 0
  for (const file of files) {
    for await (const line of linesOf(file)) {
      const text = line.trim()
      if (text === '') continue
      try {
        const row = JSON.parse(text)
        if (typeof row?.time !== 'string') throw new Error('a row without a time')
        rows.push(row)
      } catch {
        torn += 1
      }
    }
  }
  const sums = sumOf(rows, filter)
  return {
    window: { since: filter.since ?? null, until: filter.until ?? null },
    ...sums,
    torn,
    failures,
    ledger: { path, files: files.map((file) => basename(file)) },
  }
}
