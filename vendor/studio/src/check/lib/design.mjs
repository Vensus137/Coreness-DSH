/**
 * The design constants the checker's detection rules read — and only those.
 *
 * The manifest's library (section and layout field tables, budgets, density classes, recipe order lists) is
 * **not** here: it lives once in `src/lib/library.mjs`, the builder validates against it and the checker
 * re-validates through it. What stands here is the design's measured floor, which no
 * manifest reader owns: the type sets, the space scale, the bounded-motion tokens and allowlist, the evidence
 * directory names and the file extensions the MVP never ships. The colour roles and the numbered looks are
 * manifest data and live in src/lib/library.mjs.
 *
 * The design's stated values are recorded here as measured; where the sheet's paste-ready value differs,
 * the sheet wins and the gate is corrected.
 */

/** The site and deck type sets in px. 12 is deliberately in neither. */
export const SITE_SIZES = new Set([14, 17, 20, 24, 32, 40, 48, 72])
export const DECK_SIZES = new Set([24, 32, 40, 48, 64, 96])

/** The only non-fluid spacing values. */
export const SPACE_SCALE = new Set([0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128])

/** The only durations. */
export const MOTION_DURATIONS = new Set([120, 180, 240])

/** Page properties the feedback layer may transition; `transform` is the deck's one extra. */
export const MOTION_PAGE_PROPERTIES = new Set([
  'color', 'background-color', 'border-color', 'text-decoration-color', 'text-decoration-thickness',
])

/** The evidence directories a deliverable may never carry: both spellings, one defect. */
export const EVIDENCE_DIR_NAMES = ['.page-studio-evidence', '.coreness-studio-evidence']

/** The image and font files the MVP never ships. */
export const FORBIDDEN_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico', '.woff', '.woff2', '.ttf']

/** The byte budget of `bytes.total`: 300 KiB over index.html and the assets. */
export const BYTE_LIMIT = 307200

