/**
 * The journal's domain: the vocabulary of kinds, one record schema, the address that keys a record, and the
 * domain declaration the storage form opens.
 *
 * A record answers the question "what changed the world". The fields and the kinds are checked by the schema
 * and not by convention — an unknown kind is refused at write time rather than stored as "other", and a
 * participant's refusal without a reason is refused too. **The vocabulary is closed on purpose**: the kind is
 * part of the record's address and of the measure the summary counts by, so a new kind is an edit of this file.
 *
 * One history is read tolerantly and written strictly: a stored record may carry a field this vocabulary does
 * not know, and that field rides through untouched — the history of the environment is not rewritten under a
 * newer schema — while a field the journal writes and does not know is refused by name. The profile a record
 * carries follows the same rule: the records written before the field existed carry none and keep reading,
 * while every record written now names the profile that wrote it.
 *
 * The kinds stay in the environment's own words — Russian — while everything around them is English: an
 * agent's habit and the records already written are not split by a rename. This is a decision, not an
 * oversight.
 *
 * The composition fingerprint is carried only by the records that observed the composition: it is the baseline
 * of the next comparison, and that is why rotation drops it last.
 *
 * @module @coreness/journal/src/domain
 */

import { z } from 'zod'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'

/** Kinds the environment records by itself: what happens without being told. */
export const ENVIRONMENT_KINDS = ['состав', 'настройки', 'жизненный цикл', 'оборот', 'сбой']
/** Kinds a participant reports: what cannot be observed from the outside. */
export const PARTICIPANT_KINDS = ['задача', 'шаг', 'отказ', 'сдача']
/** The whole vocabulary: closed, because the kind is part of a record's address. */
export const KINDS = [...ENVIRONMENT_KINDS, ...PARTICIPANT_KINDS]

/** The name a participant's record carries when none was given. */
export const DEFAULT_RECORD_ID = {
  'задача': 'задача',
  'шаг': 'шаг',
  'отказ': 'отказ',
  'сдача': 'сдача',
}

/** An instant: canonical UTC with milliseconds — the shape windows are compared in. */
const instant = z.iso.datetime({ precision: 3 })

/** One file's print: a digest and a length, which is what makes an edit visible. */
const filePrint = z.object({
  digest: z.string().min(1),
  bytes: z.number().int().nonnegative(),
})

/** The print of the composition: the profile's files, its live rows and one digest. */
export const compositionSchema = z.object({
  profile: z.object({
    bundles: z.array(z.string()),
    dependencies: z.array(z.string()),
  }),
  files: z.object({
    'package.json': filePrint,
    'cordis.patch.yml': filePrint.nullable(),
    'compatibility.json': filePrint.nullable(),
  }),
  live: z.object({
    bundles: z.array(z.object({ name: z.string(), enabled: z.boolean() })),
    rows: z.array(z.object({ id: z.string(), module: z.string(), enabled: z.boolean() })),
  }),
  digest: z.string().min(1),
})

/**
 * The profile that wrote a record. The storage root is one per home, so the records of every
 * profile lie in the same file and a record read back cannot be attributed to the profile that
 * wrote it without this field. A write must name it; the records written before the field
 * existed carry none and are published with none rather than given one on the way out.
 */
const profileField = z.string().min(1)
/** The same field where the history is read: an absent profile is the record's own state, not a gap to fill. */
const profileMaybe = profileField.optional()

/** The shell of a record: the address, the task it belongs to and the profile that wrote it. */
const shellOf = profile => ({
  time: instant,
  area: z.string().min(1),
  id: z.string().min(1),
  task: z.string().min(1).optional(),
  profile,
})

/**
 * The record's variants, built three ways out of one vocabulary: what the medium stores
 * and reads (`loose` — a field the journal does not know rides by, not interpreted and not
 * lost), what a write must be (`strict` — a field the journal does not know is refused by
 * name), and what a record's body is without the fields of the address (`plain`, which is
 * how a foreign record's own fields are picked out for an answer).
 * @param {(shape: object) => object} objectOf the wrapper: `z.looseObject` | `z.strictObject` | `z.object`
 * @param {object} profile how this door takes the profile that wrote the record: required of a write, optional where the older era is read
 * @returns {object} the record schema
 */
const recordVariants = (objectOf, profile) => z.discriminatedUnion('kind', [
  objectOf({ ...shellOf(profile), kind: z.literal('состав'), author: z.literal('среда'), changed: z.array(z.string().min(1)).min(1), composition: compositionSchema }),
  objectOf({ ...shellOf(profile), kind: z.literal('настройки'), author: z.literal('среда'), changed: z.array(z.string().min(1)).min(1), composition: compositionSchema }),
  objectOf({ ...shellOf(profile), kind: z.literal('жизненный цикл'), author: z.literal('среда'), text: z.string().min(1), reason: z.string().min(1).optional() }),
  objectOf({ ...shellOf(profile), kind: z.literal('оборот'), author: z.literal('среда'), dropped: z.number().int().nonnegative(), kept: z.number().int().nonnegative(), reason: z.string().min(1) }),
  objectOf({ ...shellOf(profile), kind: z.literal('сбой'), author: z.literal('среда'), text: z.string().min(1) }),
  objectOf({ ...shellOf(profile), kind: z.literal('задача'), author: z.literal('участник'), task: z.string().min(1), text: z.string().min(1) }),
  objectOf({ ...shellOf(profile), kind: z.literal('шаг'), author: z.literal('участник'), task: z.string().min(1), stepMs: z.number().int().nonnegative(), text: z.string().optional(), reread: z.string().optional() }),
  objectOf({ ...shellOf(profile), kind: z.literal('отказ'), author: z.literal('участник'), task: z.string().min(1), reason: z.string().min(1), text: z.string().optional() }),
  objectOf({ ...shellOf(profile), kind: z.literal('сдача'), author: z.literal('участник'), text: z.string().min(1) }),
])

/**
 * The record schema the medium reads a stored journal with: one variant per kind, the
 * fields of a kind checked, everything else riding through untouched.
 *
 * The reading is tolerant because the journal has one history and it was not written under
 * this schema: a record stored earlier carries fields this schema does not know, and those
 * fields are neither interpreted nor dropped — they are the record's own, and a rewrite of
 * the journal must not lose them. The kind and the fields of a kind are still checked, so a
 * record that cannot be read as one of the vocabulary is refused by name rather than
 * silently counted. A write is the other door: it is strict (see {@link strictRecordSchema}).
 */
export const recordSchema = recordVariants(z.looseObject, profileMaybe)

/**
 * The record schema a write must satisfy: the same vocabulary, closed. A field the journal
 * does not know — the price of a task, for one — is refused by name at write time. The
 * price appears neither here nor anywhere else: the product does not count the price of a task
 * (the user's decision), and the donor's price part left with it.
 *
 * The profile is required here and only here: every record this journal writes says which
 * profile wrote it, and a record without one is refused rather than stored unattributed.
 */
export const strictRecordSchema = recordVariants(z.strictObject, profileField)

/**
 * The record schema of an answer: the declared fields only. What the journal does not know
 * stays in the store and does not leave through a tool or the route — an answer carries what
 * the journal counts, and a reader who is handed a record is handed the fields of a record.
 */
export const answerSchema = recordVariants(z.object, profileMaybe)

/**
 * The journal's domain: one table of records, keyed by a record's address.
 *
 * The domain's name carries an underscore while the plugin's row id keeps its
 * hyphen: the medium refuses a hyphen in a unit name (`UNIT_NAME_RE`), and the two
 * are different places anyway — the domain is a file in the storage root, the row
 * is an entry of the composition.
 */
export const journalDomain = defineDomain({
  name: 'coreness_journal',
  version: 1,
  tables: { records: domainTable(recordSchema) },
})

/**
 * The address of a record: time, kind, area and name — it is also the table key.
 * @param {object} record a record
 * @returns {string} the address
 */
export function addressOf(record) {
  return [record.time, record.kind, record.area, record.id].join('|')
}

/**
 * The reason of a refusal in words: the schema has its own message per violation.
 * @param {object | Error} error a parse refusal
 * @returns {string} the reason
 */
export function refusalOf(error) {
  const issues = error?.issues ?? []
  if (issues.length === 0) return String(error?.message ?? error)
  return issues
    .map(issue => `${issue.path.join('.') || 'record'}: ${issue.message}`)
    .join('; ')
}
