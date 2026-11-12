/**
 * The Agent Team's product side: the two switches the page draws and the one paragraph the product owns
 * in the team policy.
 *
 * The switches are this plugin's own volatile fields, written through the platform's settings service and
 * read at every assembly; the route only reports them beside the team's presence and the last outcome of
 * the patch. The platform's team row is not read or written: the release this product follows removed the
 * member ceiling from it, and a row that still carries the removed fields refuses to activate.
 *
 * The assembly listener is untagged — the scope filter admits it for every scoped dispatch, so one
 * listener serves the Lead and every teammate — and it treats the platform's assembly as read-only: it
 * copies the section it knows by name, replaces the one sentence the product owns wherever that sentence
 * stands, and leaves everything else as the platform wrote it. Two releases' wordings of the sentence and
 * of the identity line are known, and either is met as it comes.
 *
 * The plugin owns no state beyond the last outcome of the patch: every answer is read at the moment it
 * is asked, because the platform's own page writes the same settings row while the page stands open and a
 * snapshot taken at the mount would describe a row that has since changed.
 *
 * @module @coreness/team
 */

import { statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Config } from './config.js'
import { live } from './live.js'
import {
  LEAD_IDENTITY,
  MEMBER_IDENTITY,
  WAIT_SENTENCES,
  noteOutcome,
  patchFor,
  shouldWarn,
} from './policy.js'
import { answerOf } from './route.js'

export { Config }

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-team'

/** The one route a surface reads the team's picture through. */
export const ROUTE = '/api/coreness.team'

/**
 * The platform packages that carry the team, newer release first: the unprefixed names are the release
 * this product follows, the experimental ones the release before it. The version is read for the one
 * warning line a missing sentence or an undecidable role carries, so the line names the platform it met
 * rather than the one it was written against.
 */
const TEAM_PACKAGES = [
  '@deepseek-ai/dsh-tool-agent-team',
  '@deepseek-ai/dsh-agent-team',
  '@deepseek-ai/dsh-experimental-tool-agent-team',
  '@deepseek-ai/dsh-experimental-agent-team',
]

/**
 * Whether a path names a regular file. A directory carries an entry name too, and a require that starts
 * from one walks a resolution that is not the launcher's; a path read or statted between the launch and
 * this call may no longer stand. Both are not a door.
 * @param {string} path the candidate launcher entry
 * @returns {boolean} true when the path is a file
 */
function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

/**
 * The platform version the warning line names.
 *
 * The packages live beside the application or the launcher, not in the profile, so three doors are tried
 * in the order a process carries them: the desktop application's resources, the process's own launcher
 * entry (the CLI or headless build that started it — its node_modules carries the platform's packages, and
 * a profile's does not), and the plugin's own file. A launcher entry that is not a regular file — a
 * directory, a path that no longer stands — is not a door.
 * Within each door the newer release's names are tried before the older ones, and a name that does not
 * resolve belongs to the other release. A platform that answers to none of them is said as such, with the
 * names that were tried, rather than guessed.
 * @returns {string} the version and the package it was read from, or the names that could not be read
 */
export function platformVersion() {
  const froms = []
  if (typeof process.resourcesPath === 'string') {
    froms.push(pathToFileURL(join(process.resourcesPath, 'app.asar', 'dsh', 'package.json')).href)
  }
  const launcher = process.argv[1]
  if (typeof launcher === 'string' && isFile(launcher)) {
    froms.push(pathToFileURL(launcher).href)
  }
  froms.push(import.meta.url)
  for (const from of froms) {
    for (const packageName of TEAM_PACKAGES) {
      try {
        const { version } = createRequire(from)(`${packageName}/package.json`)
        return `${version} (${packageName})`
      } catch {
        /* The next name, then the next door. */
      }
    }
  }
  return `an unreadable version (tried ${TEAM_PACKAGES.join(', ')})`
}

/**
 * Mount the route and the patch.
 *
 * Two things and no more: the read route, registered in the scoped area Cordis gives a service that may
 * be absent; and the assembly listener, which changes nothing while the switch is off and says in words
 * when the platform's text moved away from both known wordings. A composition without a web surface still
 * mounts the plugin — the switches are the prompt's, and they apply whether or not a page reads them.
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
     line off, nor make the missing-sentence line repeat. A teammate's assembly carries the section too —
     the platform shares one policy text with every team agent — and it is left as the platform wrote it:
     the paragraph is the Lead's, and a member must not read the Lead's duties as their own. */
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const result = await next()
    try {
      const patched = patchFor(result, live(config.prompt) === true, live(config.review) === true)
      const previous = noteOutcome(patched.outcome)
      if (shouldWarn(previous, patched.outcome)) {
        warn(patched.outcome === 'unknown'
          ? `the team policy was not replaced: the assembly's identity is neither the Lead's nor a teammate's, so the role is undecidable ("${LEAD_IDENTITY[0]}" / "${LEAD_IDENTITY[1]}" / "${MEMBER_IDENTITY[0]}" / "${MEMBER_IDENTITY[1]}") (platform team ${version})`
          : `the team policy was not replaced: neither known wait sentence stands in the section: "${WAIT_SENTENCES[0]}" / "${WAIT_SENTENCES[1]}" (platform team ${version})`)
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
        methods: ['GET'],
        requestBody: 'buffered',
        fetch: () => answerOf(ctx, config, warn),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the team route`)
    log(`the team picture stands at ${ROUTE}`)
  })
  if (ctx.get('connection') === undefined) {
    log(`this composition carries no web surface, so nothing serves ${ROUTE}: the policy patch still applies to every team assembly`)
  }
}
