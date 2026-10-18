/**
 * Rotation: what to drop by age and by size.
 *
 * The journal is not an archive: what is dropped is not kept aside, and that is a decision rather than an
 * omission. It grows at both ends — old records leave by age, volume is held by the length of the records
 * themselves.
 *
 * The last record carrying a composition print is never dropped: it is the baseline of the next comparison,
 * and losing it would produce a false "the composition changed" at the next start. The baseline stays even
 * when it is the only record.
 *
 * @module @coreness/journal/src/rotation
 */

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The length of one record: what its body occupies. The size limit is counted over
 * records rather than over the file — the file belongs to the harness's storage and
 * its format is not this plugin's business.
 * @param {object} record a record
 * @returns {number} bytes
 */
export function recordBytes(record) {
  return Buffer.byteLength(JSON.stringify(record), 'utf8')
}

/**
 * The plan of one rotation: what to drop and why.
 * @param {Array<{key: string, record: object}>} entries the journal's records
 * @param {object} limits the limits: `now` (the moment of the sweep), `days`, `bytes`
 * @returns {object} `drop` (keys), `kept` (how many stay) and `reason` (the cause)
 */
export function planRotation(entries, limits) {
  const { now, days, bytes } = limits
  const ordered = [...entries].sort((left, right) => left.record.time.localeCompare(right.record.time))
  const baseline = [...ordered].reverse().find(item => item.record.composition !== undefined)
  const droppable = ordered.filter(item => item.key !== baseline?.key)
  const cutoff = new Date(Date.parse(now) - days * DAY_MS).toISOString()
  const drop = []
  const aged = droppable.filter(item => item.record.time < cutoff)
  drop.push(...aged.map(item => item.key))
  let reason = aged.length === 0 ? undefined : 'age limit'
  let size = sizeOf(ordered, drop)
  if (size > bytes) {
    reason = 'size limit'
    for (const item of droppable) {
      if (size <= bytes) break
      if (drop.includes(item.key)) continue
      drop.push(item.key)
      size -= recordBytes(item.record)
    }
  }
  if (drop.length === 0) return { drop, kept: ordered.length, reason: undefined }
  return { drop, kept: ordered.length - drop.length, reason }
}

/** The volume of the records that stay. */
function sizeOf(ordered, drop) {
  return ordered
    .filter(item => drop.includes(item.key) === false)
    .reduce((sum, item) => sum + recordBytes(item.record), 0)
}
