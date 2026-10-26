/**
 * The composition gates: `recipe.composition` and `recipe.rhythm`.
 *
 * The field tables and the recipe order lists are **not** transcribed here: they are read from the shared
 * library the builder validates against. This module re-validates the folder's record through
 * that library, so the builder and the checker cannot hold two vocabularies.
 */
import { allElements, attr, byTag, classesOf } from '../../../lib/html.mjs'
import { GENERATOR, KINDS, LAYOUTS, LOOKS, RECIPES, SCHEMA, SECTIONS } from '../../../lib/library.mjs'
import { actualFiles } from '../folder.mjs'
import { fail, list, pass, unchecked } from '../result.mjs'
import { pageSections, withTree } from './shared.mjs'

function recipeOf(record) {
  const recipeId = record?.recipe
  const variant = record?.variant
  if (recipeId === 'landing' && variant === 'event') return RECIPES['landing-event']
  return RECIPES[recipeId]
}

/** The record's own shape: marker, schema, kind, recipe, look, variant, manifest, files. */
function recordProblems(facts) {
  const record = facts.record
  if (record === undefined) return [facts.recordError ?? 'the folder carries no page.json']
  const problems = []
  if (record._generator !== GENERATOR) problems.push(`_generator is ${JSON.stringify(record._generator)}; ${JSON.stringify(GENERATOR)} is the marker`)
  if (record._schema !== SCHEMA) problems.push(`_schema is ${JSON.stringify(record._schema)}; this reader knows ${SCHEMA}`)
  const kind = record.kind
  if (KINDS[kind] === undefined) problems.push(`kind ${JSON.stringify(kind)} is not one of the four studio_build kinds`)
  if (record.recipe !== KINDS[kind]?.recipe) problems.push(`recipe ${JSON.stringify(record.recipe)} does not answer kind ${JSON.stringify(kind)}`)
  if (!LOOKS.includes(record.look)) problems.push(`look ${JSON.stringify(record.look)} is not one of the six looks`)
  if (record.variant !== undefined && record.variant !== 'event') problems.push(`variant ${JSON.stringify(record.variant)} is not "event"`)
  if (record.variant !== undefined && kind !== 'landing') problems.push('a variant is only allowed on kind landing')
  if (record.manifest === null || typeof record.manifest !== 'object' || Array.isArray(record.manifest)) problems.push('manifest is not an object')
  if (!Array.isArray(record.files)) problems.push('files is not an array')
  return problems
}

function filesProblems(facts) {
  const files = facts.record?.files
  if (!Array.isArray(files)) return []
  const problems = []
  const recorded = new Set(files.filter((entry) => typeof entry === 'string'))
  const actual = actualFiles(facts)
  /* One direction only: the deliverable the record names must be there. A file the studio did not write is not
     this gate's subject — the builder never deletes a file and never touches what is not in the emitted set, so
     punishing a user's own file here would be a dead end the model cannot leave except by deleting it. */
  for (const path of recorded) {
    if (!actual.has(path)) problems.push(`the record names ${path}, which the folder does not carry`)
  }
  const sorted = [...recorded]
  if (JSON.stringify(sorted) !== JSON.stringify([...sorted].sort())) problems.push('the record\'s file list is not sorted')
  return problems
}

/** The ids the builder writes: `s-<type>` for the first of its type, `s-<type>-<n>` from the second. */
function expectedIds(types) {
  const seen = new Map()
  return types.map((type) => {
    const count = (seen.get(type) ?? 0) + 1
    seen.set(type, count)
    return count === 1 ? `s-${type}` : `s-${type}-${count}`
  })
}

function orderProblems(types, recipe) {
  const problems = []
  for (const type of types) {
    if (!recipe.allowed.includes(type)) problems.push(`the section ${type} is outside the ${recipe.id} recipe's allowed set`)
  }
  for (const required of recipe.required) {
    if (!types.includes(required)) problems.push(`the ${recipe.id} recipe requires a ${required} section`)
  }
  /* The order list is a subsequence on first occurrences (the builder's reading):
     a type that already appeared may repeat without consuming the list; repetition itself is bounded by the
     recipe's min/max, not by the list. */
  const seen = new Set()
  let cursor = 0
  for (const type of types) {
    if (seen.has(type)) continue
    const found = recipe.order.indexOf(type, cursor)
    if (found === -1) {
      problems.push(`the section ${type} is out of the ${recipe.id} order`)
      continue
    }
    seen.add(type)
    cursor = found + 1
  }
  return problems
}

export const recipeComposition = {
  code: 'recipe.composition',
  appliesTo: 'both',
  instrument: 'static',
  run(facts, context) {
    const problems = recordProblems(facts)
    if (problems.length > 0) return fail(list(problems))
    problems.push(...filesProblems(facts))
    const record = facts.record
    const recipe = recipeOf(record)
    if (recipe === undefined) return fail(`the record names recipe ${JSON.stringify(record.recipe)}, which the library does not carry`)
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const manifest = record.manifest

    if (context.kind === 'deck') {
      const slides = manifest.slides
      if (!Array.isArray(slides)) return fail('the recorded manifest carries no slides array')
      const layouts = slides.map((slide) => slide?.layout)
      const emitted = allElements(tree.value.root)
        .filter((element) => attr(element, 'data-layout') !== undefined)
        .map((element) => attr(element, 'data-layout'))
      if (JSON.stringify(layouts) !== JSON.stringify(emitted)) {
        problems.push(`the document's data-layout sequence ${JSON.stringify(emitted)} differs from the recorded ${JSON.stringify(layouts)}`)
      }
      if (layouts[0] !== 'title') problems.push(`the first slide is ${JSON.stringify(layouts[0])}; the first slide is title`)
      if (layouts[layouts.length - 1] !== 'closing') problems.push(`the last slide is ${JSON.stringify(layouts[layouts.length - 1])}; the last slide is closing`)
      for (const [layout, cap] of [['data', 1], ['quote', 2], ['title', 1], ['closing', 1]]) {
        const count = layouts.filter((entry) => entry === layout).length
        if (count > cap) problems.push(`the deck carries ${count} ${layout} slides; at most ${cap}`)
      }
      for (const layout of layouts) {
        if (LAYOUTS[layout] === undefined) problems.push(`the slide layout ${JSON.stringify(layout)} is outside the library`)
      }
      if (problems.length > 0) return fail(list(problems))
      return pass(`the deck's ${layouts.length} slides are ${layouts.join(', ')} — the record and the document agree`)
    }

    const sections = manifest.sections
    if (!Array.isArray(sections)) return fail('the recorded manifest carries no sections array')
    const types = sections.map((section) => section?.type)
    const rendered = pageSections(tree.value).map((entry) => entry.type)
    if (JSON.stringify(types) !== JSON.stringify(rendered)) {
      problems.push(`the document's s-<type> sequence ${JSON.stringify(rendered)} differs from the recorded ${JSON.stringify(types)}`)
    }
    const ids = expectedIds(types)
    rendered.forEach((type, index) => {
      const element = pageSections(tree.value)[index]?.element
      const id = element === undefined ? undefined : attr(element, 'id')
      if (id !== ids[index]) problems.push(`the section ${type} carries id ${JSON.stringify(id)}; ${JSON.stringify(ids[index])} is expected`)
    })
    /* The document's head and body agree with the record. */
    const html = byTag(tree.value.root, 'html')[0]
    const lang = html === undefined ? undefined : attr(html, 'lang')
    if (lang !== manifest.lang) problems.push(`<html lang> is ${JSON.stringify(lang)}; the record says ${JSON.stringify(manifest.lang)}`)
    const title = byTag(tree.value.root, 'title')[0]
    const titleText = title?.children?.filter((child) => child.text !== undefined).map((child) => child.text).join('').trim()
    if (titleText !== manifest.title) problems.push(`<title> is ${JSON.stringify(titleText)}; the record says ${JSON.stringify(manifest.title)}`)
    const description = allElements(tree.value.root).find((element) => element.tag === 'meta' && (attr(element, 'name') ?? '').toLowerCase() === 'description')
    const descriptionText = description === undefined ? undefined : attr(description, 'content')
    if (descriptionText !== manifest.description) problems.push(`the meta description is ${JSON.stringify(descriptionText)}; the record says ${JSON.stringify(manifest.description)}`)
    const body = byTag(tree.value.root, 'body')[0]
    if (body === undefined || !classesOf(body).has(`look-${record.look}`)) problems.push(`<body> does not carry look-${record.look}`)
    problems.push(...orderProblems(types, recipe))
    if (problems.length > 0) return fail(list(problems))
    return pass(`the page's ${types.length} sections agree with the record and the ${recipe.id} recipe`)
  },
}

export const recipeRhythm = {
  code: 'recipe.rhythm',
  appliesTo: 'both',
  instrument: 'static',
  run(facts, context) {
    const tree = withTree(facts, (value) => value)
    if (tree.ok === false) return unchecked(tree.detail)
    const problems = []
    if (context.kind === 'deck') {
      const layouts = allElements(tree.value.root)
        .filter((element) => attr(element, 'data-layout') !== undefined)
        .map((element) => attr(element, 'data-layout'))
      const density = layouts.map((layout) => LAYOUTS[layout]?.density)
      for (let index = 0; index < layouts.length; index += 1) {
        if (density[index] !== 'dense') continue
        const next = density[index + 1]
        if (next === 'dense') problems.push(`the dense ${layouts[index]} slide is followed by the dense ${layouts[index + 1]}`)
        else if (next !== undefined && next !== 'sparse' && layouts[index + 1] !== 'steps') {
          problems.push(`the dense ${layouts[index]} slide is followed by ${layouts[index + 1]}, which is neither sparse nor steps`)
        }
      }
      if (problems.length > 0) return fail(list(problems))
      return pass(`no two dense slides are adjacent; every dense slide settles into a sparse one or steps`)
    }
    const types = pageSections(tree.value).map((entry) => entry.type)
    const density = types.map((type) => SECTIONS[type]?.density)
    for (let index = 0; index < types.length; index += 1) {
      if (density[index] !== 'dense') continue
      if (density[index + 1] === 'dense') problems.push(`the dense ${types[index]} section is followed by the dense ${types[index + 1]}`)
      if (types[index - 1] === 'hero') problems.push(`the dense ${types[index]} section stands right after the hero`)
    }
    if (types.length >= 2) {
      const beforeFooter = types[types.length - 2]
      if (SECTIONS[beforeFooter]?.density !== 'quiet') problems.push(`the section before the footer is ${beforeFooter}; the last section before the footer is quiet`)
    }
    if (problems.length > 0) return fail(list(problems))
    return pass(`${types.length} sections: no two dense neighbours, none after the hero, a quiet section before the footer`)
  },
}
