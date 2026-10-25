/**
 * The address of a record, and the free address a colliding record takes.
 *
 * One owner for the shape of the key: the domain keys a record by it, the journal writes and rotates by it,
 * and the fixture exercises it without the storage package — the module imports nothing, so the address rule
 * is a run of its own rather than a sentence inside a module that needs the platform to load.
 *
 * @module @coreness/journal/src/address
 */

/**
 * The address of a record: time, kind, area and name — it is also the table key.
 * @param {object} record a record
 * @returns {string} the address
 */
export function addressOf(record) {
  return [record.time, record.kind, record.area, record.id].join('|')
}

/**
 * The address a record takes, stepping past one already stored.
 *
 * Two notes of the same kind, area and name written in the same millisecond would otherwise share a key, and
 * the table's write is an upsert: the second would replace the first in silence. The time is stepped by one
 * millisecond at a time until the address is free, so the address keeps its shape, an existing record keeps
 * its own, and the caller sees the time the record actually carries.
 * @param {(key: string) => object | undefined} taken reads the record stored under a key
 * @param {object} record the record as it would be written
 * @returns {{time: string, key: string}} the time the record takes and its address
 */
export function freeAddressOf(taken, record) {
  let time = Date.parse(record.time)
  if (Number.isNaN(time)) throw new Error(`the record's time is not an instant: ${String(record.time)}`)
  for (;;) {
    const at = new Date(time).toISOString()
    const key = addressOf({ ...record, time: at })
    if (taken(key) === undefined) return { time: at, key }
    time += 1
  }
}
