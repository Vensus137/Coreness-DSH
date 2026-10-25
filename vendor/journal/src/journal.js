/**
 * The journal: open the domain, write an observation, answer with a summary.
 *
 * The journal lives as one joint for the whole environment: the environment hands it observations — the
 * composition, the settings, its own lifecycle, rotation — and a participant hands it what cannot be observed:
 * a task, a step, a refusal, a handover. Records go through a queue, because the comparison against the
 * baseline reads the journal's state and a second write must not slip between that read and its write.
 *
 * A refusal to open does not become an empty journal: the query refuses in words, and the refusal itself stays
 * in the list of faults the summary carries. A silent journal without records would read as "nothing changed".
 *
 * Money is the record's own when someone knows it: a note may carry the `cost` block — dollars, the unit the
 * figure was taken in, the rate between them, and whether the run was billed — and the summary counts it. The
 * platform prices nothing, so the figure is reported rather than derived; a record without one counts as no
 * money rather than as a free run.
 *
 * The stored journal is read tolerantly and written strictly: a record of an older era carries fields this
 * journal does not know, and those fields ride through untouched — the history of the environment is not
 * rewritten under a newer vocabulary — while what the journal writes itself is closed, a note carrying the
 * fields of its kind and nothing else.
 *
 * Every record names the profile that wrote it, stamped at the one door every record passes: the storage root
 * is one per home, so the records of every profile lie in the same file, and a record read back tomorrow is
 * attributed by that field. The records written before it existed carry none and keep reading.
 *
 * One thing the journal hears rather than reads: a compaction the platform could not make is caught, the turn
 * continues, and one warning is all the world gets. The journal takes that warning off the logger — the channel
 * the platform offers for exactly this — and writes the failure as a record of its own, so that a silence which
 * would otherwise read as health leaves a line.
 *
 * @module @coreness/journal/src/journal
 */

import { DEFAULT_RECORD_ID, addressOf, answerSchema, refusalOf, strictRecordSchema } from './domain.js'
import { freeAddressOf } from './address.js'
import { PROFILE_FILES, compositionDiff, compositionOf, compositionPrint, kindOfChange, packComposition, profilePrint } from './fingerprint.js'
import { breakdownOf, planRotation } from './rotation.js'
import { buildSummary, selectRecords, takeLast } from './summary.js'

/** The plugin's name: it signs the records about the lifecycle and about rotation. */
export const PLUGIN_NAME = 'coreness-journal'
/** The fields a note may carry: the address, the author and the profile are the journal's own. */
const NOTE_FIELDS = ['kind', 'area', 'id', 'task', 'session', 'text', 'reason', 'stepMs', 'reread', 'cost']
/** The fields a query may name: everything else is a refusal rather than a silent omission. */
const QUERY_FIELDS = ['since', 'until', 'kind', 'area', 'id', 'limit']
/** How many observation faults are remembered for the summary: a list is an observation, not a history. */
const FAULTS_KEPT = 20
/**
 * The platform's own words when a step's compaction was refused and the turn went on — this is a
 * contract with another package's sentence, and a rewording of it would quiet this journal, which is
 * why it is one of two witnesses rather than the only one.
 */
const SWALLOWED_COMPACTION = 'step compaction failed:'
/**
 * The unit that compacts, as the platform names it in its own messages: the `name` of the plugin
 * the row loads — the class its module exports — hyphenated by the logger, and read off live messages
 * of other rows in this machine's own diagnostics (`name: 'web-server'`, `name: 'workspace-registry'`).
 */
const COMPACTION_LOGGER = 'basic-compaction-engine'
/** The name the failure carries inside its kind: which of the environment's own works failed. */
const COMPACTION_ID = 'уплотнение'

/**
 * Create the journal.
 *
 * The dependencies come from outside rather than out of the context: the domain, the
 * reading of the profile, the live composition and the clock are joints that the checks
 * replace and that the environment hands over.
 * @param {object} deps the dependencies: `config`, `logger`, `openDomain`, `readFile`, `liveComposition`, `profileName`, `now`
 * @returns {object} the journal: `start`, `stop`, `observe`, `note`, `swallowed`, `query`, `faults`
 */
export function createJournal(deps) {
  const { config, logger, openDomain, readFile, liveComposition, profileName } = deps
  const now = deps.now ?? (() => new Date().toISOString())
  const faults = []
  let table
  let domain
  let opening
  let baseline
  let chain = Promise.resolve()

  /** A fault of observation: visible in the log and in the summary — there is no silence here. */
  function fault(reason) {
    faults.push({ time: now(), reason })
    if (faults.length > FAULTS_KEPT) faults.shift()
    logger?.error?.(`${PLUGIN_NAME}: ${reason}`)
  }

  /** Opening the domain: one per plugin; a refusal stays the same while the plugin is mounted. */
  function open() {
    if (opening === undefined) {
      opening = (async () => {
        domain = await openDomain()
        table = domain.table('records')
        const records = recordList()
        baseline = compositionOf([...records].reverse().find(record => record.composition !== undefined))
        return table
      })()
    }
    return opening
  }

  /**
   * Close the domain the journal opened.
   *
   * The storage facility hands the handle to its caller and frees the domain's name only on close; the plugin
   * is disposed before a re-applied row would open a second domain, so the close must be the disposer's own
   * act. `close()` waits for the domain's write chain, so the stop record queued before it settles first.
   * @returns {Promise<void>} nothing
   */
  async function close() {
    const handle = domain
    if (handle === undefined) return
    try {
      await handle.close()
    } catch (error) {
      fault(`the journal's domain was not closed — ${reasonOf(error)}`)
      return
    }
    domain = undefined
    table = undefined
    opening = undefined
  }

  /** The journal's records as pairs of key and record: the key is the address, which rotation needs too. */
  function entryList() {
    return [...table.entries()].map(([key, record]) => ({ key, record }))
  }

  /** The journal's records: the storage order, which the selection sorts itself. */
  function recordList() {
    return entryList().map(item => item.record)
  }

  /** The queue of writes: an observation reads the baseline, and a second write must not slip into it. */
  function enqueue(task) {
    const next = chain.then(task, task)
    chain = next.then(noop, noop)
    return next
  }

  /**
   * A write into the domain: the door stamps the profile that wrote the record — one place, so
   * no construction site can leave it out — and the schema checks kind and fields before the
   * write, a refusal names its reason. The write is closed — a field the journal does not know
   * is refused here rather than carried into the store, while the reading of the store stays
   * tolerant. A profile that is not set is refused in words here rather than written into a
   * record nobody can attribute.
   */
  async function write(record) {
    if (typeof profileName !== 'string' || profileName === '') {
      throw new Error('the profile that writes is unknown: profileContext.name is not set')
    }
    const parsed = strictRecordSchema.safeParse({ ...record, profile: profileName })
    if (parsed.success === false) {
      throw new Error(`the record was refused by the schema — ${refusalOf(parsed.error)}`)
    }
    /* Two records of one millisecond would share an address, and the table's write is an upsert: the
       address steps by a millisecond until it is free, so a collision is named by the record's time rather
       than resolved by replacing the record already stored. */
    const { time, key } = freeAddressOf(candidate => table.get(candidate), parsed.data)
    const stored = time === parsed.data.time ? parsed.data : { ...parsed.data, time }
    await table.put(key, stored)
    return stored
  }

  /** The print of the composition now: the profile's files and the live composition. */
  async function readComposition() {
    const sources = {}
    for (const name of PROFILE_FILES) sources[name] = readFile(name)
    const { profile, files } = profilePrint(sources)
    return compositionPrint({ profile, files, live: await liveComposition() })
  }

  /**
   * Rotation: sweep by age and size and say so with a record of its own.
   *
   * The rollup is written before the deletes: it is the account of what the sweep takes, and an account
   * written after the deletes is lost when the deletes stand and the write fails. A sweep whose bound cannot
   * be met — the baseline print and the rollups are never dropped — says so in a `сбой` record naming the size
   * that stays over the limit, rather than leaving a bound that stopped holding to be inferred from a file
   * that keeps growing. The key the caller just wrote is protected: the sweep must not delete the record it
   * was told to keep.
   * @param {string[]} [protect] the keys the sweep must not drop
   * @returns {Promise<object | undefined>} the record of the rotation, when there was one
   */
  async function rotate(protect = []) {
    const entries = entryList()
    const plan = planRotation(entries, {
      now: now(),
      days: config.rotationDays,
      bytes: config.rotationBytes,
      protect,
    })
    if (plan.drop.length === 0 && plan.overBytes === undefined) return undefined
    let written
    if (plan.drop.length > 0) {
      const breakdown = breakdownOf(entries, plan.drop)
      written = await write({
        time: now(),
        kind: 'оборот',
        area: PLUGIN_NAME,
        id: 'вычищено',
        author: 'среда',
        dropped: plan.drop.length,
        kept: plan.kept,
        reason: plan.reason,
        droppedKinds: breakdown.kinds,
        droppedBytes: breakdown.bytes,
        droppedUsd: breakdown.usd,
      })
      for (const key of plan.drop) await table.delete(key)
    }
    if (plan.overBytes !== undefined) {
      written = await write({
        time: now(),
        kind: 'сбой',
        area: PLUGIN_NAME,
        id: 'размер',
        author: 'среда',
        text: `the journal is over its byte bound: ${plan.overBytes} bytes of records kept over a limit of ${config.rotationBytes}, after a sweep that kept ${plan.kept} record(s); the baseline print and the rollups are never dropped`,
      })
    }
    return written
  }

  /** Compare the composition against the baseline and write a record when it changed. */
  async function observe(cause) {
    return enqueue(async () => {
      try {
        const print = await readComposition()
        const changed = compositionDiff(baseline, print)
        if (changed.length === 0) return undefined
        // The baseline of the first print does not exist: this is the installation of the
        // basis rather than a change, and the record says so by its name, not by its kind.
        const first = baseline === undefined
        const record = await write({
          time: now(),
          kind: kindOfChange(changed),
          area: 'профиль',
          id: first ? 'база' : 'сравнение',
          author: 'среда',
          text: cause,
          changed,
          composition: packComposition(print),
        })
        baseline = print
        await rotate([addressOf(record)])
        return record
      } catch (error) {
        fault(`${cause}: the composition was not compared — ${reasonOf(error)}`)
        return undefined
      }
    })
  }

  /** A participant's record: what cannot be observed — a task, a step, a refusal, a handover. */
  async function note(input) {
    const unknown = Object.keys(input).filter(name => NOTE_FIELDS.includes(name) === false)
    if (unknown.length > 0) {
      throw new Error(`the note was refused — a note carries the fields of its kind, and the journal adds the address and the author itself: ${unknown.join(', ')}`)
    }
    await open()
    return enqueue(async () => {
      const record = {
        time: now(),
        kind: input.kind,
        area: input.area,
        id: input.id ?? DEFAULT_RECORD_ID[input.kind],
        author: 'участник',
        ...named('task', input.task),
        ...named('session', input.session),
        ...named('text', input.text),
        ...named('reason', input.reason),
        ...named('stepMs', input.stepMs),
        ...named('reread', input.reread),
        ...named('cost', input.cost),
      }
      const written = await write(record)
      /* The note is stored before the sweep runs: a sweep that fails is the journal's fault, not a refusal of
         the record, and the answer must say what happened to the record rather than what happened after it. */
      try {
        await rotate([addressOf(written)])
      } catch (error) {
        fault(`the sweep after a note failed — ${reasonOf(error)}`)
      }
      return written
    })
  }

  /**
   * A failure the platform logged and kept to itself: a step's compaction it could not make.
   *
   * Two witnesses, and either one is enough — the unit that compacts, or the platform's own
   * sentence. One witness alone would go quiet on a rename of the unit or on a rewording of the
   * sentence, and going quiet is indistinguishable from there being nothing to report, which is
   * the failure this record exists against.
   *
   * The record carries the platform's words as they were written, and the unit as the platform
   * named it in the same message; nothing is paraphrased and nothing is coalesced — one refused
   * compaction is one event, and the count is the reason the record exists at all.
   *
   * This runs inside the platform's own logging path, in the catch block that swallowed the
   * failure: nothing here may throw — a write that cannot be made becomes a fault of this journal,
   * which the summary and the route carry.
   * @param {object} message the platform's log record: `name`, `type`, `args`
   * @returns {Promise<object | undefined>} the record, when the message is one this journal keeps
   */
  async function swallowed(message) {
    try {
      if (message?.type !== 'warn') return undefined
      const words = wordsOf(message.args)
      if (words === undefined) return undefined
      const fromTheUnit = message.name === COMPACTION_LOGGER
      if (fromTheUnit === false && words.startsWith(SWALLOWED_COMPACTION) === false) return undefined
      await open()
      return await enqueue(async () => {
        const record = await write({
          time: now(),
          kind: 'сбой',
          area: message.name,
          id: COMPACTION_ID,
          author: 'среда',
          text: words,
        })
        await rotate([addressOf(record)])
        return record
      })
    } catch (error) {
      fault(`a refusal the platform kept to itself was not recorded — ${reasonOf(error)}`)
      return undefined
    }
  }

  /** One query: without a selection — a summary, with a named kind or area — the records themselves. */
  async function query(input = {}) {
    const unknown = Object.keys(input).filter(name => QUERY_FIELDS.includes(name) === false)
    if (unknown.length > 0) {
      throw new Error(`the query was refused — the journal knows the fields ${QUERY_FIELDS.join(', ')}: ${unknown.join(', ')}`)
    }
    try {
      await open()
    } catch (error) {
      throw new Error(`the journal is not open — ${reasonOf(error)}`)
    }
    const until = input.until ?? now()
    const filter = { since: input.since, until, kind: input.kind, area: input.area, id: input.id }
    const selected = selectRecords(recordList(), filter)
    const named = filter.kind !== undefined || filter.area !== undefined || filter.id !== undefined
    // A window bound without a value is `null` rather than `undefined`: the answer leaves
    // the process, and the host refuses a value that does not survive the transfer whole.
    const window = { since: filter.since ?? null, until }
    if (named) {
      const limit = input.limit ?? config.recordsLimit
      const records = takeLast(selected, limit).map(record => answerSchema.parse(withComposition(record)))
      return {
        window,
        total: selected.length,
        truncated: selected.length > records.length,
        // A record leaves as the fields of a record: what the journal does not know stays in
        // the store, where it was stored, and is not handed to a reader as if it were ours.
        records,
        faults: [...faults],
      }
    }
    return {
      window,
      total: selected.length,
      summary: buildSummary(recordList(), { since: filter.since, until, limit: input.limit ?? config.recordsLimit }),
      faults: [...faults],
    }
  }

  /** The beginning of work: open the domain, say about itself, compare the composition against the baseline. */
  async function start() {
    try {
      await open()
    } catch (error) {
      fault(`the journal's domain is not open — ${reasonOf(error)}`)
      return
    }
    try {
      await write({
        time: now(),
        kind: 'жизненный цикл',
        area: PLUGIN_NAME,
        id: 'запуск',
        author: 'среда',
        text: 'the plugin is mounted',
      })
    } catch (error) {
      fault(`the start of the plugin was not recorded — ${reasonOf(error)}`)
    }
    await observe('the comparison at start')
  }

  /** The end of work: a stop is an event of the world as much as a start. */
  async function stop() {
    if (table === undefined) return
    try {
      await write({
        time: now(),
        kind: 'жизненный цикл',
        area: PLUGIN_NAME,
        id: 'остановка',
        author: 'среда',
        text: 'the plugin is stopped',
      })
    } catch (error) {
      fault(`the stop of the plugin was not recorded — ${reasonOf(error)}`)
    }
  }

  return { start, stop, close, observe, note, swallowed, query, faults: () => [...faults] }
}

/**
 * What the platform said, as it said it: its own words, or the message of the error it handed over.
 * @param {unknown[] | undefined} args a message's arguments
 * @returns {string | undefined} the words, when the message carried any
 */
function wordsOf(args) {
  const said = args?.[0]
  if (typeof said === 'string') return said
  if (said instanceof Error) return said.message
  return undefined
}

/** A field of a record, when it was named: an optional field is not filled with an empty value. */
function named(name, value) {
  return value === undefined ? {} : { [name]: value }
}

/**
 * A record with its composition unpacked: a packed print is the record's storage, not the answer a reader
 * was handed, and the fields of a record leave as the shapes the schema names.
 * @param {object} record a stored record
 * @returns {object} the record as an answer
 */
function withComposition(record) {
  const composition = compositionOf(record)
  if (composition === undefined) return record
  return { ...record, composition }
}

/** The reason of a refusal in words. */
function reasonOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/** An empty task for the queue. */
function noop() {}
