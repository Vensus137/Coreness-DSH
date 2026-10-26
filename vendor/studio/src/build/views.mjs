/**
 * The views the package fragments render against: the normalized manifest fields of a section or
 * slide, plus the computed keys a fragment cannot derive inside the dialect — the element id, the
 * heading id, the section ordinal, the surface-band flag, and per-kind sub-views for tagged objects
 * (the dialect has no conditions, so a tagged union is split before rendering).
 */
import { BAND_PREFERENCE, CHROME, DEFAULT_LANG, LOOK_BAND, NUMBERED_LOOKS } from '../lib/library.mjs'

/** The band fallback when the look's preferred types are absent, ending with the hero. */
const BAND_FALLBACK = ['prose', 'quote', 'split', 'timeline', 'gallery', 'cards', 'stats', 'table', 'faq', 'cta', 'hero']

/**
 * The generated chrome's words for one document language. A tag the product does not translate falls
 * back to English: the language of the document is the model's choice, not a manifest error, and a
 * page with no skip link is worse than a page with an English one.
 * @param {string} [lang] the manifest's `lang`
 * @returns {{skip: string, primary: string, footer: string, table: string, prev: string, next: string}}
 */
export function chromeOf(lang) {
  return CHROME[lang] ?? CHROME[DEFAULT_LANG]
}

/** `{kind: 'number', …}` is passed once as `kind` plus one sub-view named by the kind. */
function splitTagged(view, value, field) {
  if (value === null || typeof value !== 'object') return
  const kind = value.kind
  if (typeof kind !== 'string') return
  view[`${field}Kind`] = kind
  view[`${field}${kind[0].toUpperCase()}${kind.slice(1)}`] = value
}

/** The one section that carries the page's surface band, or -1 for quiet and bold. */
function bandIndex(mainTypes, look) {
  if (!LOOK_BAND[look]) return -1
  const preference = [...(BAND_PREFERENCE[look] ?? []), ...BAND_FALLBACK]
  for (const type of preference) {
    const at = mainTypes.indexOf(type)
    if (at >= 0) return at
  }
  return -1
}

/** The `table` fragment receives cells that know whether they are numeric and their column's name. */
function tableView(view) {
  const numeric = new Set(Array.isArray(view.numeric) ? view.numeric : [])
  const columns = Array.isArray(view.columns) ? view.columns : []
  const rows = Array.isArray(view.rows) ? view.rows : []
  view.rows = rows.map((row) => ({
    cells: row.map((text, column) => ({ text, num: numeric.has(column), label: columns[column] })),
  }))
  view.caption = typeof view.caption === 'string' ? view.caption : view.heading
}

/**
 * The chrome a section view carries: the header's and footer's landmark labels, and the table scroll
 * region's label. The region's label is chrome only — the table's accessible name is its own caption,
 * taken from the heading, and the section is already labelled by that heading.
 */
function chromeView(view, chrome) {
  if (view.type === 'header') view.primaryLabel = chrome.primary
  if (view.type === 'footer') view.footerLabel = chrome.footer
  if (view.type === 'table') view.tableLabel = chrome.table
}

/** The `cards` fragment marks the leading card; `stats` marks the dominant number; `gallery` counts its tiles. */
function itemsView(view) {
  if (Array.isArray(view.items)) {
    if (view.type === 'cards') {
      view.items = view.items.map((item, index) => (index === view.lead ? { ...item, isLead: true } : { ...item }))
    } else if (view.type === 'stats') {
      const dominant = Number.isInteger(view.dominant) ? view.dominant : 0
      view.items = view.items.map((item, index) => (index === dominant ? { ...item, isDominant: true } : { ...item }))
    } else if (view.type === 'gallery') {
      view.count = view.items.length
    }
  }
}

/** One page view: the ids, the band flag, the editorial/technical ordinal and the per-type augmentations. */
function pageSectionView(entry, id, headingId, chrome) {
  const view = { ...entry, id, headingId }
  if (entry.type === 'hero') splitTagged(view, view.object, 'object')
  if (entry.type === 'split') splitTagged(view, view.evidence, 'evidence')
  if (entry.type === 'table') tableView(view)
  if (entry.type === 'cards' || entry.type === 'stats' || entry.type === 'gallery') itemsView(view)
  chromeView(view, chrome)
  return view
}

/**
 * The page's three shell slots: the header and footer section views, and the sections rendered inside
 * `<main>` in manifest order. A section's `id` is `s-<type>` once and `s-<type>-<n>` from the second;
 * its `number` is the 1-based main-section ordinal, present only for the editorial and technical looks.
 * @param {object} manifest the normalized page manifest
 * @param {string} look one of the six look ids
 * @returns {{ header?: object, footer?: object, main: object[] }}
 */
export function pageViews(manifest, look) {
  const sections = manifest.sections
  const chrome = chromeOf(manifest.lang ?? DEFAULT_LANG)
  const counts = new Map()
  const ids = sections.map((entry) => {
    const count = (counts.get(entry.type) ?? 0) + 1
    counts.set(entry.type, count)
    return count === 1 ? `s-${entry.type}` : `s-${entry.type}-${count}`
  })
  const mainIndexes = sections.map((entry, index) => (entry.type === 'header' || entry.type === 'footer' ? -1 : index)).filter((index) => index >= 0)
  const band = bandIndex(mainIndexes.map((index) => sections[index].type), look)
  const numbered = NUMBERED_LOOKS.includes(look)
  const views = { main: [] }
  mainIndexes.forEach((index, ordinal) => {
    const view = pageSectionView(sections[index], ids[index], `${ids[index]}-h`, chrome)
    if (band === ordinal) view.band = true
    if (numbered) view.number = String(ordinal + 1).padStart(2, '0')
    views.main.push(view)
  })
  const headerAt = sections.findIndex((entry) => entry.type === 'header')
  if (headerAt >= 0) views.header = pageSectionView(sections[headerAt], ids[headerAt], `${ids[headerAt]}-h`, chrome)
  const footerAt = sections.findIndex((entry) => entry.type === 'footer')
  if (footerAt >= 0) views.footer = pageSectionView(sections[footerAt], ids[footerAt], `${ids[footerAt]}-h`, chrome)
  return views
}

/**
 * The deck's slide views: normalized slide fields, the layout id, the 1-based slide number, the
 * heading id, `hidden` for every slide but the first, and the split evidence sub-views.
 * @param {object} manifest the normalized deck manifest
 * @returns {object[]}
 */
export function slideViews(manifest) {
  return manifest.slides.map((entry, index) => {
    const view = { ...entry, layout: entry.layout, n: index + 1, headingId: `slide-${index + 1}-h` }
    if (index > 0) view.hidden = true
    if (entry.layout === 'split') splitTagged(view, view.evidence, 'evidence')
    return view
  })
}
