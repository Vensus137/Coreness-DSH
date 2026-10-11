/**
 * The summary: the answer to "what happened and why it came to this" without reading
 * the journal whole.
 *
 * The summary is read in kilobytes and counted from the records: the counters by kind,
 * the extremes of time, refusals by reason, and short lines of the latest records. The
 * records themselves are answered by a query — within a named limit and with its
 * truncation said out loud, so that nobody receives the whole journal without noticing.
 *
 * What is counted is what the measure of reflection is made of: steps and rereads from
 * the records of participants, refusals by reason. There is no price: the product does not
 * count the price of a task, so no summary carries a line about one.
 *
 * @module @coreness/dsh/plugins/journal/summary
 */

import { recordBytes } from './rotation.js'

/**
 * The records of one selection: window, kind, area, name — returned in **ascending time**, which the
 * signature does not carry and the counters and the printed lines both stand on.
 */
export function selectRecords(records, filter = {}) {
  const { since, until, kind, area, id } = filter
  return records
    .filter(record => since === undefined || record.time >= since)
    .filter(record => until === undefined || record.time <= until)
    .filter(record => kind === undefined || record.kind === kind)
    .filter(record => area === undefined || record.area === area)
    .filter(record => id === undefined || record.id === id)
    .sort((left, right) => left.time.localeCompare(right.time))
}

/**
 * The short line of one record: what it is remembered by.
 * @param {object} record a record
 * @returns {string} the line
 */
export function lineOf(record) {
  switch (record.kind) {
    case 'состав':
    case 'настройки':
      return `changed: ${record.changed.join(', ')}`
    case 'жизненный цикл':
      return record.reason === undefined ? record.text : `${record.text}: ${record.reason}`
    case 'оборот':
      return `dropped ${record.dropped} records (${record.reason})`
    case 'сбой':
      return record.text
    case 'задача':
      return record.text
    case 'шаг':
      return [record.text, `step ${record.stepMs} ms`, record.reread === undefined ? '' : `reread ${record.reread}`]
        .filter(part => part !== undefined && part !== '')
        .join(', ')
    case 'отказ':
      return record.text === undefined ? record.reason : `${record.reason}: ${record.text}`
    case 'сдача':
      return record.text
    default:
      return ''
  }
}

/**
 * The summary over the records.
 * @param {object[]} records the journal's records
 * @param {object} [options] the selection and the line limit: `since`, `until`, `limit`
 * @returns {object} the summary
 */
export function buildSummary(records, options = {}) {
  const limit = options.limit ?? 20
  // A window bound without a value is named `null`: `undefined` does not survive the
  // transfer, and "there is no bound" would leave the answer in silence.
  const window = { since: options.since ?? null, until: options.until ?? null }
  const inside = selectRecords(records, { since: options.since, until: options.until })
  const byKind = kindsOf(inside)
  const last = inside.slice(-limit).reverse().map(record => ({
    time: record.time,
    kind: record.kind,
    area: record.area,
    id: record.id,
    author: record.author,
    // The profile is left out where a record of the older era carries none: an absent field is
    // not invented here, and `undefined` would not survive the transfer to a reader.
    ...(record.profile === undefined ? {} : { profile: record.profile }),
    line: lineOf(record),
  }))
  return {
    window,
    total: inside.length,
    bytes: inside.reduce((sum, record) => sum + recordBytes(record), 0),
    byKind,
    last,
    refusals: refusalsOf(inside),
    steps: stepsOf(inside),
  }
}

/** The counters by kind: how many, when they started and ended, how much they occupy. */
function kindsOf(records) {
  const by = new Map()
  for (const record of records) {
    const item = by.get(record.kind) ?? { kind: record.kind, count: 0, first: record.time, last: record.time, bytes: 0 }
    item.count += 1
    item.last = record.time
    item.bytes += recordBytes(record)
    by.set(record.kind, item)
  }
  // The order of the counters: more records first, ties by the name of the kind. Without
  // the second key the order would depend on which record happened to lie first, and two
  // identical sets would read differently.
  return [...by.values()].sort((left, right) => right.count - left.count || left.kind.localeCompare(right.kind))
}

/** Refusals by reason: the third refusal for one reason is an event of reflection. */
function refusalsOf(records) {
  const by = new Map()
  for (const record of records.filter(item => item.kind === 'отказ')) {
    by.set(record.reason, (by.get(record.reason) ?? 0) + 1)
  }
  return [...by.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((left, right) => right.count - left.count)
}

/** Steps and rereads: by them the number of approaches a task took is counted. */
function stepsOf(records) {
  const steps = records.filter(record => record.kind === 'шаг')
  return {
    count: steps.length,
    ms: steps.reduce((sum, record) => sum + record.stepMs, 0),
    rereads: steps.filter(record => record.reread !== undefined).length,
  }
}
