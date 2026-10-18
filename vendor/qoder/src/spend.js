/**
 * The spend journal: what one request cost, in the vendor's own counters.
 *
 * The file is the donor provider's own and appending continues that ledger rather than starting a second
 * one: a journal is append-only, and the donor's rows stand as they are. What this route's own rows carry
 * is the **spend alone** — the moment, the model, the ending, the duration, and the two counter objects the
 * wire reported — where the donor's rows carried the whole request and the whole answer beside them. The
 * text of a conversation is not a journal's business: a record that copies it is a second place those words
 * live. The donor's own turn fields are dropped rather than written empty.
 *
 * The shape is the donor's own, and its two counter objects are produced by the readers that already exist:
 * `usageOf` and `vendorUsageOf` write exactly the `usage` and `vendor` keys its rows hold, so an instrument
 * that reads this file reads both eras without a rename, and `finish` is the object the route already
 * classifies an attempt with. No figure here is arithmetic of ours: the vendor's credits and the platform's
 * counts travel as they arrived.
 *
 * The money is the row's own: `rate` is the dollars-per-credit the owner fixed, and `usd` is the credits
 * converted at that rate — written only where the wire counted credits, because a row of zeros in a ledger
 * of costs is worse than no row. A row keeps the rate it was written with, so a re-valued rate moves the
 * rows written after it and never the ones behind.
 *
 * **The bound, and why this number.** The donor rotated this file itself at the round number inside its own
 * two generations — 4 MiB was the only round number in that window — which left a row quoted by its **line
 * number** a shelf life of hours: after a rotation the index names nothing or another row, and a second
 * rotation leaves the row in no file at all. The bound is 64 MiB **on the user's own word**, because depth
 * is what a ledger is read for: two generations then hold hundreds of thousands of rows and weeks of this
 * route's own traffic. The reader globs every generation the file keeps, so all of them are the ledger.
 *
 * **The donor's generation is kept, not replaced.** It is quoted: the model menu is measured over this
 * journal with it included, so replacing it would destroy a measurement without a trace. A generation whose
 * rows are all older than the oldest row of the file being rotated — an era before this route's own —
 * therefore moves aside once and stays; every rotation after that replaces our own previous generation,
 * which is what the bound is for.
 *
 * A write never fails a turn and never throws: a path that cannot be written — no rights, a directory that
 * went away, a full disk — is said in the log with the path and the reason, and the turn goes on.
 *
 * @module @coreness/qoder/src/spend
 */

import { appendFileSync, closeSync, existsSync, fstatSync, openSync, readSync, renameSync, statSync } from 'node:fs'
import { usageOf, vendorUsageOf } from './frames.js'

/** The size a file is rotated at: 64 MiB, the user's own number, two generations on disk. */
export const ROTATE_AT = 64 * 1024 * 1024

/** US dollars per credit, fixed by the owner: a dollar buys a hundred credits. */
export const USD_PER_CREDIT = 0.01

/** How much of a file is read to date one of its ends. The longest donor row is 40 612 bytes, so this holds a whole one. */
const HEAD_BYTES = 128 * 1024
const TAIL_BYTES = 64 * 1024

/**
 * A slice of a file, from one of its ends, as text — a window rather than the whole file, because the
 * rows of the era this reads are tens of kilobytes each and only one line of each end is wanted.
 * @param {string} file the file
 * @param {'head' | 'tail'} end which end
 * @returns {string} the slice
 */
function sliceOf(file, end) {
  const handle = openSync(file, 'r')
  try {
    const wanted = end === 'head' ? HEAD_BYTES : TAIL_BYTES
    const size = fstatSync(handle).size
    const at = end === 'head' ? 0 : Math.max(size - wanted, 0)
    const buffer = Buffer.alloc(Math.min(wanted, size - at))
    const read = readSync(handle, buffer, 0, buffer.length, at)
    return buffer.subarray(0, read).toString('utf8')
  } finally {
    closeSync(handle)
  }
}

/** The time one line carries, or null where the line is not a row at all. */
function timeOf(line) {
  try {
    const time = JSON.parse(line)?.time
    return typeof time === 'string' ? time : null
  } catch {
    return null
  }
}

/**
 * The journal over one file.
 * @param {object} options the journal
 * @param {string} options.path the file's own path, absolute — resolved by the route, never here
 * @param {() => number} [options.now] the clock, for a test
 * @param {(message: string) => void} [options.log] where a write that could not be made is said
 * @param {number} [options.rotateAt] the bound, for a test
 * @returns {object} the journal
 */
export function createSpendJournal({ path, now = () => Date.now(), log = () => {}, rotateAt = ROTATE_AT }) {
  /**
   * The donor's own generation, kept before the first rotation of this route's own (see the header).
   * The test is the rows' own times: a generation that ended before the file began is an earlier era,
   * while our own previous generation ends where the file begins and is what a rotation replaces.
   * A generation that cannot be dated is kept — a stray file costs less than a lost measurement.
   */
  function keepTheDonorEra() {
    const older = `${path}.1`
    const kept = `${older}.donor`
    if (existsSync(older) === false || existsSync(kept)) return
    const ended = timeOf(sliceOf(older, 'tail').split('\n').filter((line) => line.trim() !== '').at(-1) ?? '')
    const began = timeOf(sliceOf(path, 'head').split('\n')[0] ?? '')
    if (ended !== null && began !== null && ended >= began) return
    if (ended === null || began === null) log(`the generation at ${older} could not be dated: it is kept beside the file as ${kept}`)
    renameSync(older, kept)
  }

  return {
    /**
     * One request, written down as one line.
     * @param {object} turn what the attempt measured
     * @param {string} turn.model the model the attempt asked for
     * @param {object} turn.finish the attempt's ending, as `reasonOf` classified it
     * @param {number} turn.durationMs the attempt's own wall time
     * @param {object} turn.usage the wire's usage object, as it arrived
     * @returns {void}
     */
    record({ model, finish, durationMs, usage }) {
      try {
        /* A file that is not there yet needs no rotation: the first row of a fresh home makes it, and
           `statSync` of nothing is the same answer as a file of nothing. */
        const size = statSync(path, { throwIfNoEntry: false })?.size
        if (size !== undefined && size >= rotateAt) {
          keepTheDonorEra()
          renameSync(path, `${path}.1`)
        }
        const vendor = vendorUsageOf(usage)
        const credits = vendor.credits
        const row = {
          time: new Date(now()).toISOString(),
          model,
          finish,
          durationMs,
          usage: usageOf(usage),
          vendor,
          ...Number.isFinite(credits)
            ? { rate: USD_PER_CREDIT, usd: Math.round(credits * USD_PER_CREDIT * 1e6) / 1e6 }
            : {},
        }
        appendFileSync(path, `${JSON.stringify(row)}\n`)
      } catch (error) {
        log(`the spend journal could not be written at ${path}: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
  }
}
