/**
 * The in-memory skill: the model's only source of the manifest field tables and the composition law.
 *
 * The body is a file beside this module and not a string here. It is the largest piece of text the
 * feature pays for and it is paid for per load, so it is edited, diffed and measured as the text it
 * is; the file is read when the module loads, which is the mount. An empty body is refused rather
 * than registered as nothing: a skill with no body reads as a skill the model should use and cannot.
 *
 * The catalogue line the model sees is `name` and `description` only — `whenToUse` is not rendered,
 * and the description is whitespace-normalized and capped by the platform — so the routing sentence
 * lives in the description. `source` is required by the load path even though registration does not
 * demand it; without it every load of the skill fails. `resourceBase` is the one place the model is
 * told that no file needs to be read, so a session has no reason to look for the installed package.
 *
 * @module @coreness/studio/skill
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BODY = fileURLToPath(new URL('./skill/page-studio.md', import.meta.url))

/** The skill's identity and its routing words, as the catalog and the tool render them. */
const CATALOGUE = {
  name: 'page-studio',
  description:
    'Use when the deliverable is a web page (landing, product or service page, portfolio, personal page, article, '
    + 'event page, one-pager) or an HTML presentation (deck, slides): composes a static, offline page or a 5–9 screen '
    + 'deck from one prompt and builds it with the studio_* tools, with no design interview.',
  whenToUse:
    'The user asks for a landing page, a portfolio, an article page, an event page, a one-pager, a presentation or a '
    + 'deck — anything that ends as a static folder opened in a browser — and gives a subject and content rather than '
    + 'a design brief. Not for a multi-page site, a dashboard, a PDF, or a React/framework project.',
}

/** The in-memory skill: the model's only source of the field tables and the composition law. */
export function skillOf() {
  const content = readFileSync(BODY, 'utf8').trim()
  if (content === '') throw new Error('coreness-studio: the skill body is empty — an empty skill would be registered as nothing')
  return {
    ...CATALOGUE,
    /* Required by the load path; the registry fills `provider` and `invocation` itself. */
    source: 'runtime',
    resourceBase: {
      kind: 'opaque',
      description: 'Nothing needs to be read: this body carries the manifest shape and every field table, and studio_build composes the page from it.',
    },
    content,
  }
}
