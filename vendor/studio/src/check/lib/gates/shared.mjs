/**
 * Helpers shared by the gate modules: the tree guard, the emitted set, and the document sequences.
 */
import { allElements, classesOf, sectionType, sectionsOf } from '../../../lib/html.mjs'
import { actualFiles, recordedFiles, treeOf } from '../folder.mjs'

/** Run a gate body on the parsed document, or answer `unchecked` with the reader's reason. */
export function withTree(facts, run) {
  const tree = treeOf(facts)
  if (tree.ok !== true) return { ok: false, detail: tree.detail }
  return { ok: true, value: run(tree) }
}

/** The emitted set a reference is compared against: the record's list, else the folder's files. */
export function emittedSet(facts) {
  const record = recordedFiles(facts)
  return record !== undefined ? record : actualFiles(facts)
}

/** The page's section elements in document order, with their types. */
export function pageSections(tree) {
  return sectionsOf(tree.root).map((element) => ({ element, type: sectionType(element) }))
}

/** The deck's slides in document order. */
export function deckSlides(tree) {
  return allElements(tree.root).filter((element) => classesOf(element).has('slide'))
}

/** The heading level of a tag, or `undefined`. */
export function levelOf(element) {
  const match = /^h([1-6])$/.exec(element.tag)
  return match === null ? undefined : Number(match[1])
}

/** Every heading element in document order. */
export function headings(tree) {
  return allElements(tree.root).filter((element) => levelOf(element) !== undefined)
}
