/**
 * The composition pipeline: read the package's templates, render them through the fragment renderer,
 * assemble the shell and the page set, and return every emitted file as text.
 * Pure: no ctx, no target, no clock; a composition fault throws and is never a user refusal.
 */
import { DEFAULT_LANG, GENERATOR, SCHEMA } from '../lib/library.mjs'
import { renderFragment } from '../lib/fragment.mjs'
import { validateManifest } from './manifest.mjs'
import { loadRecipes } from './recipes.mjs'
import { chromeOf, pageViews, slideViews } from './views.mjs'
import {
  PATHS,
  PACKAGE_SRC,
  composeSiteCss,
  finalizeText,
  readPackageFile,
} from './package.mjs'

/** The emitted set of each kind, in the order the builder writes it; `page.json` is always last. */
export const EMITTED = {
  landing: ['assets/site.css', 'index.html', 'page.json'],
  portfolio: ['assets/site.css', 'index.html', 'page.json'],
  article: ['assets/site.css', 'index.html', 'page.json'],
  presentation: ['assets/site.css', 'assets/deck.css', 'assets/present.js', 'index.html', 'page.json'],
}

/** Refuse to let a placeholder survive a rendered fragment as written (a package fault). */
function assertNoPlaceholder(relativePath, rendered) {
  const at = rendered.indexOf('{{')
  if (at < 0) return rendered
  const end = rendered.indexOf('}}', at)
  const token = end < 0 ? rendered.slice(at) : rendered.slice(at, end + 2)
  throw new Error(`fragment ${relativePath} left the placeholder ${JSON.stringify(token)} as written: no view value answers it`)
}

/** Render one fragment and refuse a surviving placeholder, naming the fragment that carried it. */
function renderFile(packageRoot, relativePath, view) {
  return assertNoPlaceholder(relativePath, renderFragment(readPackageFile(packageRoot, relativePath), view))
}

/** The `counter` the deck shell prints and `present.js` updates: `NN / NN`. */
const counter = (current, total) => `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

/** The `page.json` record, keys in the table's order. */
function pageRecord(checked, files) {
  const record = { _generator: GENERATOR, _schema: SCHEMA, kind: checked.kind, recipe: checked.recipe, look: checked.look }
  if (checked.variant !== undefined) record.variant = checked.variant
  record.manifest = checked.manifest
  record.files = files
  return finalizeText(JSON.stringify(record, null, 2))
}

/** The page set: the shell's header/main/footer slots, the look's CSS, and the record. */
function assemblePage(checked, packageRoot) {
  const views = pageViews(checked.manifest, checked.look)
  const cached = new Map()
  const renderSection = (type, view) => {
    if (!cached.has(type)) cached.set(type, readPackageFile(packageRoot, PATHS.section(type)))
    return assertNoPlaceholder(PATHS.section(type), renderFragment(cached.get(type), view))
  }
  const header = views.header === undefined ? '' : renderSection('header', views.header)
  const sections = views.main.map((view) => renderSection(view.type, view)).join('\n')
  const footer = views.footer === undefined ? '' : renderSection('footer', views.footer)
  const shellView = {
    lang: checked.manifest.lang ?? DEFAULT_LANG,
    skip: chromeOf(checked.manifest.lang ?? DEFAULT_LANG).skip,
    title: checked.manifest.title,
    description: checked.manifest.description,
    look: checked.look,
    header,
    sections,
    footer,
  }
  const shell = readPackageFile(packageRoot, PATHS.pageShell)
  const shellRendered = assertNoPlaceholder(PATHS.pageShell, renderFragment(shell, shellView))
  const files = [...EMITTED[checked.kind]].sort()
  const contents = {
    'assets/site.css': composeSiteCss(readPackageFile(packageRoot, PATHS.siteCss), checked.look),
    'index.html': finalizeText(shellRendered),
    'page.json': pageRecord(checked, files),
  }
  return { files, contents }
}

/** The deck set: the rendered slides joined, the counter, the two deck assets and the record. */
function assembleDeck(checked, packageRoot) {
  const views = slideViews(checked.manifest)
  const shell = readPackageFile(packageRoot, PATHS.deckShell)
  const chrome = chromeOf(checked.manifest.lang ?? DEFAULT_LANG)
  const cache = new Map()
  const slides = views.map((view) => {
    if (!cache.has(view.layout)) cache.set(view.layout, readPackageFile(packageRoot, PATHS.layout(view.layout)))
    return assertNoPlaceholder(PATHS.layout(view.layout), renderFragment(cache.get(view.layout), view))
  }).join('\n')
  const total = views.length
  const shellView = {
    lang: checked.manifest.lang ?? DEFAULT_LANG,
    title: checked.manifest.title,
    look: checked.look,
    slides,
    counter: counter(1, total),
    counterCurrent: String(1).padStart(2, '0'),
    counterTotal: String(total).padStart(2, '0'),
    prev: chrome.prev,
    next: chrome.next,
  }
  if (checked.manifest.description !== undefined) shellView.description = checked.manifest.description
  const shellRendered = assertNoPlaceholder(PATHS.deckShell, renderFragment(shell, shellView))
  const files = [...EMITTED[checked.kind]].sort()
  const contents = {
    'assets/site.css': composeSiteCss(readPackageFile(packageRoot, PATHS.siteCss), checked.look),
    'assets/deck.css': finalizeText(readPackageFile(packageRoot, PATHS.deckCss)),
    'assets/present.js': finalizeText(readPackageFile(packageRoot, PATHS.presentJs)),
    'index.html': finalizeText(shellRendered),
    'page.json': pageRecord(checked, files),
  }
  return { files, contents }
}

/**
 * Compose a validated manifest into the emitted set. The caller has already run `validateManifest`;
 * the package's recipe front matter is checked here (its prose is what the model reads, and drift is
 * a package fault).
 * @param {object} checked the success value of `validateManifest`
 * @param {string} [packageRoot] the package's `src/`; the package's own path by default
 * @returns {{ files: string[], contents: Record<string, string> }}
 */
export function assemble(checked, packageRoot = PACKAGE_SRC) {
  loadRecipes()
  return checked.kind === 'presentation' ? assembleDeck(checked, packageRoot) : assemblePage(checked, packageRoot)
}

/**
 * The emitted set as data, with no platform: validate, then compose. This is the part a fixture can
 * prove in a bare `node`.
 * @param {{ kind: string, look?: string, manifest: object|string, packageRoot?: string }} input
 * @returns {object} the `studio_build` result's success shape plus `contents`, or a refusal
 */
export function compose({ kind, look, manifest, packageRoot = PACKAGE_SRC } = {}) {
  const checked = validateManifest({ kind, look, manifest })
  if (!checked.ok) return checked
  const { files, contents } = assemble(checked, packageRoot)
  return {
    ok: true,
    kind: checked.kind,
    look: checked.look,
    recipe: checked.recipe,
    ...checked.variant === undefined ? {} : { variant: checked.variant },
    structure: checked.structure,
    manifest: checked.manifest,
    files,
    contents,
  }
}
