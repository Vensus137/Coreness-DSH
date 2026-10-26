/**
 * The one transcription of the manifest's field tables: section and layout ids, every field with its
 * type and character ceiling, the array budgets, the singleton flags, the density classes and the
 * recipe selection/order. The builder validates against this file; the checker reads it;
 * nothing here is derived and nothing here may be a second copy of another file.
 *
 * Node shapes a reader of `fields` meets:
 *   { type: 'string', max }            a one-line string of at most `max` characters
 *   { type: 'string', role: 'href' }   an href; the href step owns it, not the text rules
 *   { type: 'string', role: 'lang' }   a language tag with its own pattern
 *   { type: 'string', role: 'variant' } the landing's `variant`
 *   { type: 'integer' }                a 0-based index into the owning array
 *   { type: 'object', fields, required }
 *   { type: 'array', of, min, max }    `min`/`max` are budgets, not field errors
 *   { type: 'tagged', tag, tags }      `tags[value]` is the object shape for that tag value
 */

/** A plain string field with its character ceiling. */
const text = (max) => ({ type: 'string', max })
/** An href; the grammar and its refusal are the href step's. */
const href = () => ({ type: 'string', role: 'href' })
/** One 0-based index into the owning array. */
const index = () => ({ type: 'integer' })
/** An object with fixed keys. */
const obj = (fields, required) => ({ type: 'object', fields, required })
/** An array with a budget and an item shape. */
const list = (of, min, max) => ({ type: 'array', of, min, max })
/** The language tag pattern. */
const lang = () => ({ type: 'string', role: 'lang' })
/** A tagged object: `kind` selects the shape. */
const tagged = (tag, tags) => ({ type: 'tagged', tag, tags })

/** `header.nav`, `footer.links` */
const link = obj({ label: text(24), href: href() }, ['label', 'href'])
/** `hero.action`, `cta.action`, deck `closing.action` */
const action = obj({ label: text(32), href: href() }, ['label', 'href'])
/** `prose.pull` */
const pull = obj({ text: text(140), attribution: text(60) }, ['text', 'attribution'])

/** `hero.object`; a number must carry its source. */
const heroObject = tagged('kind', {
  number: obj({ value: text(24), unit: text(24), source: text(80) }, ['value', 'source']),
  quote: obj({ text: text(140), attribution: text(60) }, ['text', 'attribution']),
  wordmark: obj({ text: text(32) }, ['text']),
  none: obj({}, []),
})

/** `split.evidence`. */
const evidence = tagged('kind', {
  list: obj({ items: list(obj({ label: text(24), text: text(120) }, ['text']), 2, 4) }, ['items']),
  number: obj({ value: text(24), unit: text(24), source: text(80) }, ['value', 'source']),
  labels: obj({ items: list(obj({ label: text(40), value: text(40) }, ['label', 'value']), 2, 4) }, ['items']),
})

/** Deck `split.evidence`; the number's ceiling is 12. */
const deckEvidence = tagged('kind', {
  labels: obj({ items: list(obj({ label: text(40), value: text(40) }, ['label', 'value']), 2, 4) }, ['items']),
  number: obj({ value: text(12), unit: text(24), source: text(80) }, ['value', 'source']),
})

/** `cards.items`. */
const cardItem = obj({ title: text(40), body: text(200), note: text(40) }, ['title', 'body'])
/** `stats.items`. Its source is `source` or the section's (checked in step 4). */
const statItem = obj({ value: text(24), unit: text(24), caption: text(60), source: text(80) }, ['value'])
/** `timeline.items`. */
const timelineItem = obj({ label: text(24), title: text(60), body: text(140), source: text(80) }, ['label', 'title'])
/**
 * Deck `points.items` and `steps.steps`. The pair is one budget: the label column is as wide as its
 * label (measured 98.6–120.7 px for real 8-character labels), so the text column is about 616 px
 * (760 px body less the 24 px gutter). At 24 px `ui-sans-serif` the wider supported Cyrillic measures
 * 609–617 px for 50 characters — over that column — and 583–584 px for 48, which fits; Latin at 50
 * measures about 505 px, so the pair is feasible for the measured script range. The 16-character label
 * was the old fixed-74-px column's assumption, not this sheet's. No character ceiling guarantees a
 * rendered width for pathological casing: the validator refuses at the composition door what the
 * measured ground covers, and `deck.lines` stays the final proof for the rest.
 */
const deckItem = obj({ label: text(8), text: text(48) }, ['text'])

/**
 * The thirteen page sections, in the library's own order. `fields` is the section's body
 * beside the discriminator `type`; `required` names the fields a manifest may not omit; `density` is
 * the section's class; `singleton` is at most one per page.
 */
export const SECTIONS = {
  header: {
    id: 'header',
    required: ['brand'],
    optional: ['nav', 'note'],
    fields: { brand: text(32), nav: list(link, 2, 3), note: text(40) },
    density: 'quiet',
    singleton: true,
  },
  hero: {
    id: 'hero',
    required: ['thesis', 'object'],
    optional: ['lead', 'action', 'caption'],
    fields: { thesis: text(72), lead: text(140), object: heroObject, action, caption: text(80) },
    density: 'quiet',
    singleton: true,
  },
  prose: {
    id: 'prose',
    required: ['paragraphs'],
    optional: ['heading', 'pull'],
    fields: { heading: text(60), paragraphs: list(text(420), 1, 6), pull },
    density: 'quiet',
    singleton: false,
  },
  split: {
    id: 'split',
    required: ['heading', 'paragraphs', 'evidence'],
    optional: [],
    fields: { heading: text(60), paragraphs: list(text(200), 1, 3), evidence },
    density: 'medium',
    singleton: false,
  },
  cards: {
    id: 'cards',
    required: ['items'],
    optional: ['heading', 'lead'],
    fields: { heading: text(60), items: list(cardItem, 2, 6), lead: index() },
    density: 'dense',
    singleton: false,
  },
  stats: {
    id: 'stats',
    required: ['items'],
    optional: ['heading', 'source', 'dominant'],
    fields: { heading: text(60), items: list(statItem, 2, 4), source: text(80), dominant: index() },
    density: 'dense',
    singleton: false,
  },
  timeline: {
    id: 'timeline',
    required: ['items'],
    optional: ['heading'],
    fields: { heading: text(60), items: list(timelineItem, 3, 5) },
    density: 'medium',
    singleton: false,
  },
  quote: {
    id: 'quote',
    required: ['text', 'attribution'],
    optional: ['role', 'source'],
    fields: { text: text(180), attribution: text(60), role: text(60), source: text(80) },
    density: 'quiet',
    singleton: true,
  },
  table: {
    id: 'table',
    required: ['heading', 'columns', 'rows'],
    optional: ['caption', 'numeric', 'source'],
    fields: {
      heading: text(60),
      caption: text(80),
      columns: list(text(24), 2, 5),
      rows: list({ type: 'array', of: text(60) }, 1, 8),
      numeric: { type: 'array', of: index() },
      source: text(80),
    },
    density: 'dense',
    singleton: false,
  },
  gallery: {
    id: 'gallery',
    required: ['items'],
    optional: ['heading'],
    fields: {
      heading: text(60),
      items: list(obj({ title: text(40), caption: text(120) }, ['title', 'caption']), 3, 9),
    },
    density: 'medium',
    singleton: false,
  },
  faq: {
    id: 'faq',
    required: ['items'],
    optional: ['heading'],
    fields: { heading: text(60), items: list(obj({ q: text(80), a: text(160) }, ['q', 'a']), 3, 6) },
    density: 'dense',
    singleton: false,
  },
  cta: {
    id: 'cta',
    required: ['heading', 'action'],
    optional: ['body', 'note'],
    fields: { heading: text(60), body: text(160), action, note: text(60) },
    density: 'quiet',
    singleton: true,
  },
  footer: {
    id: 'footer',
    required: ['brand'],
    optional: ['line', 'links', 'note'],
    fields: { brand: text(32), line: text(100), links: list(link, 1, 3), note: text(60) },
    density: 'quiet',
    singleton: true,
  },
}

/** The eight deck layouts, in the library's own order. `fields` is the body beside `layout`. */
export const LAYOUTS = {
  title: {
    id: 'title',
    required: ['title'],
    optional: ['lead', 'label'],
    fields: { title: text(64), lead: text(90), label: text(40) },
    density: 'sparse',
  },
  statement: {
    id: 'statement',
    required: ['statement'],
    optional: [],
    fields: { statement: text(120) },
    density: 'sparse',
  },
  points: {
    id: 'points',
    required: ['heading', 'items'],
    optional: ['source'],
    fields: { heading: text(60), items: list(deckItem, 3, 5), source: text(80) },
    density: 'dense',
  },
  split: {
    id: 'split',
    required: ['heading', 'body', 'evidence'],
    optional: [],
    fields: { heading: text(60), body: list(text(64), 1, 3), evidence: deckEvidence },
    density: 'dense',
  },
  data: {
    id: 'data',
    required: ['heading', 'value', 'source'],
    optional: ['unit', 'note'],
    fields: { heading: text(60), value: text(12), unit: text(24), source: text(80), note: text(140) },
    density: 'dense',
  },
  quote: {
    id: 'quote',
    required: ['text', 'attribution'],
    optional: ['role'],
    fields: { text: text(160), attribution: text(60), role: text(60) },
    density: 'sparse',
  },
  steps: {
    id: 'steps',
    required: ['heading', 'steps'],
    optional: [],
    fields: { heading: text(60), steps: list(deckItem, 3, 5) },
    density: 'medium',
  },
  closing: {
    id: 'closing',
    required: ['line'],
    optional: ['action', 'label'],
    fields: { line: text(64), action, label: text(40) },
    density: 'sparse',
  },
}

/**
 * The recipe selection and order. `order` is the order list the manifest must respect on
 * first occurrences; `stack` is the documented default order the model copies. `min`/`max`
 * are the recipe's section or slide count. A variant is its own entry with the same `id`.
 */
export const RECIPES = {
  landing: {
    id: 'landing',
    kind: 'landing',
    allowed: ['header', 'hero', 'prose', 'cards', 'quote', 'stats', 'split', 'faq', 'cta', 'footer'],
    required: ['header', 'hero', 'cta', 'footer'],
    order: ['header', 'hero', 'prose', 'cards', 'quote', 'stats', 'split', 'faq', 'cta', 'footer'],
    stack: ['header', 'hero', 'prose', 'cards', 'quote', 'stats', 'split', 'faq', 'cta', 'footer'],
    min: 5,
    max: 11,
  },
  'landing-event': {
    id: 'landing',
    kind: 'landing',
    variant: 'event',
    allowed: ['header', 'hero', 'prose', 'stats', 'timeline', 'cards', 'quote', 'faq', 'cta', 'footer'],
    required: ['header', 'hero', 'timeline', 'cta', 'footer'],
    order: ['header', 'hero', 'prose', 'stats', 'timeline', 'cards', 'quote', 'faq', 'cta', 'footer'],
    stack: ['header', 'hero', 'prose', 'stats', 'timeline', 'cards', 'quote', 'faq', 'cta', 'footer'],
    min: 5,
    max: 11,
  },
  portfolio: {
    id: 'portfolio',
    kind: 'portfolio',
    allowed: ['header', 'hero', 'gallery', 'prose', 'quote', 'cards', 'cta', 'footer'],
    required: ['header', 'hero', 'gallery', 'footer'],
    order: ['header', 'hero', 'gallery', 'prose', 'quote', 'cards', 'cta', 'footer'],
    stack: ['header', 'hero', 'gallery', 'prose', 'quote', 'cards', 'cta', 'footer'],
    min: 4,
    max: 10,
  },
  article: {
    id: 'article',
    kind: 'article',
    allowed: ['header', 'hero', 'prose', 'table', 'quote', 'faq', 'footer'],
    required: ['header', 'hero', 'prose', 'footer'],
    order: ['header', 'hero', 'prose', 'prose', 'table', 'quote', 'faq', 'prose', 'footer'],
    stack: ['header', 'hero', 'prose', 'prose', 'table', 'quote', 'faq', 'prose', 'footer'],
    min: 4,
    max: 12,
  },
  deck: {
    id: 'deck',
    kind: 'presentation',
    allowed: ['title', 'statement', 'points', 'split', 'data', 'quote', 'steps', 'closing'],
    required: ['title', 'closing'],
    order: ['title', 'statement', 'points', 'quote', 'split', 'data', 'steps', 'closing'],
    stack: ['title', 'statement', 'points', 'quote', 'data', 'steps', 'closing'],
    min: 5,
    max: 9,
  },
}

/** The four `studio_build` kinds and the recipe each one answers. */
export const KINDS = {
  landing: { recipe: 'landing' },
  portfolio: { recipe: 'portfolio' },
  article: { recipe: 'article' },
  presentation: { recipe: 'deck' },
}

/** The six looks, default first (the `look` argument defaults to quiet). */
export const LOOKS = ['quiet', 'editorial', 'technical', 'corporate', 'bold', 'warm']
export const DEFAULT_LOOK = 'quiet'

/** The default `lang`. */
export const DEFAULT_LANG = 'en'

/** The language-tag pattern. */
export const LANG_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

/** The looks whose annotation layer carries section numbers. */
export const NUMBERED_LOOKS = ['editorial', 'technical']

/**
 * Which looks carry a full-bleed surface band. quiet and bold carry none; the other four carry exactly
 * one (the `surface.band` gate reads this).
 */
export const LOOK_BAND = {
  quiet: false,
  editorial: true,
  technical: true,
  corporate: true,
  bold: false,
  warm: true,
}

/** The look's preferred band sections, in preference order. */
export const BAND_PREFERENCE = {
  editorial: ['prose', 'quote'],
  technical: ['table', 'stats'],
  corporate: ['cards', 'stats'],
  warm: ['prose', 'quote'],
}

/** The twelve colour roles — the tokens an emitted `:root` carries exactly once. */
export const COLOUR_TOKENS = [
  '--c-bg', '--c-surface', '--c-ink', '--c-muted', '--c-line', '--c-strong',
  '--c-accent', '--c-on-accent', '--c-success', '--c-warning', '--c-danger', '--c-info',
]

/** `page.json._generator` — the feature's stable marker, never the package name. */
export const GENERATOR = 'page-studio'
/** `page.json._schema` — the record's own schema version. */
export const SCHEMA = 1

/**
 * The generated chrome: the words the builder itself puts on a document — the page's skip link, header
 * and footer landmark labels and table region label, and the deck's Previous/Next controls — in every
 * language the product ships. `lang` is a document field, so an English control on a Russian document is
 * a mixed document; the views read these by the manifest's language. A language the product does not
 * translate falls back to English rather than refusing: an untranslated tag is not a manifest error, and
 * a document with no chrome is worse than one with English chrome. Plain data, no functions, so
 * `LIBRARY` stays JSON-shaped.
 */
export const CHROME = {
  en: { skip: 'Skip to content', primary: 'Primary', footer: 'Footer', table: 'Table', prev: 'Previous', next: 'Next' },
  ru: { skip: 'К содержанию', primary: 'Основная навигация', footer: 'Подвал', table: 'Таблица', prev: 'Назад', next: 'Вперёд' },
}

/**
 * The part of the library a fixture in a bare `node` reads as one value: the section/layout shapes, the
 * recipes and the named exports above need an import each, while `kinds` and `chrome` are read off the
 * aggregate. No function and no regex live here, so the value stays JSON-shaped.
 */
export const LIBRARY = {
  kinds: KINDS,
  chrome: CHROME,
}
