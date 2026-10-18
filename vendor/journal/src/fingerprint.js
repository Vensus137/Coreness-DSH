/**
 * The composition print: what is written down about the composition, and how one
 * print differs from another.
 *
 * The print carries what makes an edit visible: the order of the profile's bundles
 * (which is also the order of its layers), the pairs of package and range its
 * dependencies declare, the digests of three profile files, and the live composition
 * as the plugin manager sees it. A file is taken whole, by digest rather than by
 * parsing: parsing YAML would start a second opinion about someone else's file and
 * would stay silent about an edit in a place it does not parse, while a digest sees
 * every edit.
 *
 * The live composition enters the comparison by the meaning of its rows — module and
 * enablement — and not by their address: the address is handed out by the Loader and
 * is random where a row was declared without a name, so a comparison by address would
 * record an edit that never happened.
 *
 * The baseline of a comparison is the last record carrying a print rather than the
 * previous start, so an edit made by hand — which the plugin manager never announces —
 * reaches the journal at the next start instead of being lost.
 *
 * @module @coreness/journal/src/fingerprint
 */

import { createHash } from 'node:crypto'

/** The profile files an edit of the composition or of the settings is visible in. */
export const PROFILE_FILES = ['package.json', 'cordis.patch.yml', 'compatibility.json']

/**
 * The digest of a text: a short hash — it is read by eye in a record, and it is
 * enough to tell two edits apart.
 * @param {string} text the text
 * @returns {string} the digest
 */
export function digestOf(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16)
}

/**
 * The print of one file: a digest and a length. An absent file is `null` rather than
 * an empty digest: "there is no file" and "the file is empty" are different states of
 * a profile, and telling them apart is the point.
 * @param {string | undefined} text the text of the file
 * @returns {object | null} the print, or null
 */
export function filePrint(text) {
  if (text === undefined) return null
  return { digest: digestOf(text), bytes: Buffer.byteLength(text, 'utf8') }
}

/**
 * The print of the declared composition and of the profile's files.
 * @param {object} sources the profile files by name
 * @returns {object} `profile` and `files` — the declared part of the print
 * @throws {Error} the profile's own manifest could not be read — the composition is unknown, and that is visible
 */
export function profilePrint(sources) {
  const manifestText = sources['package.json']
  if (manifestText === undefined) throw new Error('the profile could not be read: package.json is missing')
  const manifest = JSON.parse(manifestText)
  const declared = manifest?.dsh?.profile
  const bundles = Array.isArray(declared?.bundles) ? declared.bundles.map(String) : []
  const dependencies = Object.entries(manifest?.dependencies ?? {})
    .map(([name, range]) => `${name}@${String(range)}`)
    .sort()
  return {
    profile: { bundles, dependencies },
    files: {
      'package.json': filePrint(manifestText),
      'cordis.patch.yml': filePrint(sources['cordis.patch.yml']),
      'compatibility.json': filePrint(sources['compatibility.json']),
    },
  }
}

/**
 * The meaning of the live composition: what stands in it and what is enabled, without
 * the Loader's address.
 *
 * The address of a row is handed out by the Loader, and a row declared without a name
 * gets a fresh one at every start; the profile's files carry no such address at all.
 * Nothing was edited in that, so the comparison and the digest go by the meaning of a
 * row — module and enablement — while the address itself stays in the record as it is.
 *
 * The order of the parts carries the meaning rather than the source: rows arrive
 * ordered by address, and a random address would move a row in the list.
 * @param {object} live the live composition: bundles and rows
 * @returns {object} the meaningful part: bundles by name, rows by module and enablement
 */
function liveMeaning(live) {
  return {
    bundles: live.bundles
      .map(item => ({ name: item.name, enabled: item.enabled }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    rows: live.rows
      .map(item => ({ module: item.module, enabled: item.enabled }))
      .sort((left, right) => left.module.localeCompare(right.module)
        || (left.enabled === right.enabled ? 0 : left.enabled ? 1 : -1)),
  }
}

/**
 * The whole composition print: what is declared, the files and the live composition.
 *
 * The digest is counted over the meaningful part of the live composition: the address
 * the Loader hands out itself is not in it — otherwise the digest would tremble at
 * every start, while it is read as the mark of where the composition stands.
 * @param {object} parts the parts: `profile` and `files` from {@link profilePrint}, plus `live`
 * @returns {object} the print with its digest
 */
export function compositionPrint(parts) {
  const body = { profile: parts.profile, files: parts.files, live: parts.live }
  return { ...body, digest: digestOf(JSON.stringify({ ...body, live: liveMeaning(parts.live) })) }
}

/**
 * What changed between two prints — in words and part by part.
 *
 * The parts are named the way a reader reads them: "bundles", "dependencies", "patch
 * file", "version relaxations", "live composition". Comparing the parts rather than
 * the whole digest is needed for the kind of the record: an edit of the settings and a
 * change of the composition are different records.
 * @param {object | undefined} before the previous print
 * @param {object} after the current print
 * @returns {string[]} what changed; empty — nothing did
 */
export function compositionDiff(before, after) {
  if (before === undefined) return ['first print']
  const changed = []
  if (same(before.profile.bundles, after.profile.bundles) === false) changed.push('bundles')
  if (same(before.profile.dependencies, after.profile.dependencies) === false) changed.push('dependencies')
  if (before.files['cordis.patch.yml']?.digest !== after.files['cordis.patch.yml']?.digest) changed.push('patch file')
  if (before.files['compatibility.json']?.digest !== after.files['compatibility.json']?.digest) changed.push('version relaxations')
  if (same(liveMeaning(before.live), liveMeaning(after.live)) === false) changed.push('live composition')
  return changed
}

/**
 * The kind of the record, by what changed: the composition changes by a bundle or a
 * row, the settings by an edit of the patch file.
 *
 * A row of the manager changes both the patch file and the live composition; an edit
 * of a value in the patch made by hand changes only the file. Hence the kind: only the
 * patch file changed — a record of the settings, anything else — a record of the
 * composition.
 * @param {string[]} changed what changed
 * @returns {'состав' | 'настройки'} the kind of the record
 */
export function kindOfChange(changed) {
  return changed.every(item => item === 'patch file') ? 'настройки' : 'состав'
}

/** Whether two parts of a print are equal: order matters — it is the order of the layers. */
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}
