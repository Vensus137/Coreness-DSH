/**
 * The Agent Team's product side: the ceiling door on the platform's team row, and the one paragraph the
 * product owns in the team policy.
 *
 * The platform's team row (`agent-team`) carries `maxMembers` as an ordinary Config field. The
 * platform's settings service projects only volatile fields, so no platform form carries the ceiling
 * and a Cordis file is its only door; this plugin opens that door on the product's own page. The write
 * goes through the platform's config editor — validated by the row's schema, persisted to the active
 * profile's patch and re-applied by the Loader — and never through a file this plugin edits itself.
 *
 * The policy switch is this plugin's own volatile field, written through the platform's settings
 * service. The assembly listener is untagged — the scope filter admits it for every scoped dispatch, so
 * one listener serves the Lead and every teammate — and it treats the platform's assembly as read-only:
 * it copies the section it knows by name, replaces the one sentence the product owns, and leaves
 * everything else as the platform wrote it.
 *
 * The plugin owns no state beyond the last outcome of the patch: every answer is read at the moment it
 * is asked, because the editor re-applies the row while the page stands open and a snapshot taken at the
 * mount would describe a row that has since changed.
 *
 * @module @coreness/team
 */

import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Config } from './config.js'
import { live } from './live.js'
import { ANCHOR, IDENTITY, noteOutcome, patchFor, shouldWarn } from './policy.js'
import { answerOf } from './route.js'

export { Config }

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-team'

/** The one route a surface reads the team's ceiling through and writes it back. */
export const ROUTE = '/api/coreness.team'

/**
 * The platform package that registers the section the patch addresses, read for the one line a missing
 * anchor says. The tools own `team:policy`; the roster package owns the team's domain. The package lives
 * beside the application, not in the profile, so the plain resolution is tried first and the application's
 * own resources second; a package that neither finds is said as such rather than guessed.
 */
function platformVersion() {
  const froms = [import.meta.url]
  if (typeof process.resourcesPath === 'string') {
    froms.push(pathToFileURL(join(process.resourcesPath, 'app.asar', 'dsh', 'package.json')).href)
  }
  for (const from of froms) {
    try {
      return createRequire(from)('@deepseek-ai/dsh-experimental-tool-agent-team/package.json').version
    } catch {
      /* The next door. */
    }
  }
  return 'an unreadable version'
}

/**
 * Mount the door and the patch.
 *
 * Three things and no more: the route, registered in the scoped area Cordis gives a service that may be
 * absent; the assembly listener, which changes nothing while the switch is off; and the line that says
 * where they stand. A composition without a web surface still mounts the plugin — the ceiling is the
 * row's own field and the policy is the prompt's, and both apply whether or not a page reads them.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {void}
 */
export function apply(ctx, config) {
  const log = (message) => ctx.logger?.info?.(`${name}: ${message}`)
  const warn = (message) => ctx.logger?.warn?.(`${name}: ${message}`)
  const version = platformVersion()

  /* One listener, every scope: the section is registered per agent, and the filter admits an untagged
     listener everywhere. The patch is off until the switch says otherwise, and a fault of ours must not
     cost the session its prompt — it is said in words and the platform's assembly goes through as it is.
     An assembly without the section belongs to an agent that is not on the team: it leaves the outcome
     the last team assembly recorded, so a subagent's step cannot turn the page's "patch is inactive"
     line off, nor make the missing-anchor line repeat. A teammate's assembly carries the section too —
     the platform shares one policy text with every team agent — and it is left as the platform wrote it:
     the paragraph is the Lead's, and a member must not read the Lead's duties as their own. */
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const result = await next()
    try {
      const patched = patchFor(result, live(config.prompt) === true, live(config.review) === true)
      const previous = noteOutcome(patched.outcome)
      if (shouldWarn(previous, patched.outcome)) {
        warn(patched.outcome === 'unknown'
          ? `the team policy was not replaced: the assembly's identity is neither the Lead's nor a teammate's, so the role is undecidable: "${IDENTITY}" (platform tool-agent-team ${version})`
          : `the team policy was not replaced: the anchor is not the section's last sentence: "${ANCHOR}" (platform tool-agent-team ${version})`)
      }
      return patched.assembly
    } catch (error) {
      warn(`the team policy patch faulted and the platform's text goes through: ${error instanceof Error ? error.message : String(error)}`)
      return result
    }
  })

  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: (request) => answerOf(ctx, request, warn, config),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the ceiling route`)
    log(`the ceiling route stands at ${ROUTE}`)
  })
  if (ctx.get('connection') === undefined) {
    log(`this composition carries no web surface, so nothing serves ${ROUTE}: the row's ceiling still applies`)
  }
}
