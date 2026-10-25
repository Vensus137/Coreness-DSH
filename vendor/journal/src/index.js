/**
 * The journal: the environment's memory as a host-only plugin of the product.
 *
 * The plugin provides the service and the door: the journal itself (records in a storage
 * domain, its rotation and the composition print), the tools `journal` and `journal_note`
 * for agents, and one exact route on the connection that answers the summary and the
 * faults of observation. The package is host-only: no browser half, no client entry; its
 * readers are agents calling the tools.
 *
 * The route is the door because the Remote (Typert) door would need generated twins and
 * nothing in the installed application regenerates them; the platform's own packages read
 * their page's data the same way this does. The answer
 * is JSON and carries its own refusals in words: a journal that is not open answers with a
 * failure and a reason rather than with an empty page.
 *
 * The route is registered in a **scoped area** rather than declared: `connection` is the web
 * transport — the composition that mounts the web application owns both of its ends — and a plugin
 * that declares it never applies where no page is served, which would take the journal's own tools
 * away together with the route. The area runs where the connection is, and its effect lives and
 * dies with it; where it never runs, a line names the route that is not served.
 *
 * @module @coreness/journal
 */

import z from '@deepseek-ai/schemastery'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { journalDomain } from './domain.js'
import { boundConfig } from './bounds.js'
import { createJournal } from './journal.js'
import { journalTools, lossless } from './tools.js'

export const name = 'coreness-journal'
export const inject = ['storageDomain', 'tools', 'pluginManager', 'profileContext']

/** The exact route the page reads. */
export const ROUTE = '/api/coreness.journal'

/** The row's settings: the limits of rotation and the limit of a selection. The floors are held at the mount:
 * the schema cannot refuse a value without unmounting the journal and taking its tools and route with it, so a
 * value under the floor runs at the floor and the substitution is said in the log. */
export const Config = z.object({
  rotationDays: z.number().default(30),
  rotationBytes: z.number().default(2 * 1024 * 1024),
  recordsLimit: z.number().default(20),
})

/**
 * Register the plugin: the journal, its observations, its tools and its route.
 * @param {object} ctx the cordis context
 * @param {object} rawConfig the row's config as the profile's own bundle declares it
 * @returns {void}
 */
export function apply(ctx, rawConfig) {
  const config = boundConfig(Config(rawConfig ?? {}), message => ctx.logger?.warn?.(`${name}: ${message}`))
  const profileDir = ctx.profileContext?.dir
  const profileName = ctx.profileContext?.name
  const journal = createJournal({
    config,
    logger: ctx.logger,
    openDomain: () => ctx.storageDomain.open(journalDomain),
    readFile: fileName => readProfileText(profileDir, fileName),
    liveComposition: () => readLiveComposition(ctx),
    profileName,
  })

  /* The journal's own effect owns the domain handle: the storage facility reserves the domain's name until
     the handle is closed and does not tie it to a consumer fiber, so a re-applied row would open a second
     domain that cannot succeed while the first one stands. The close comes after the stop record, and the
     domain's `close()` waits for the write chain the stop enqueued. */
  ctx.effect(() => {
    void journal.start()
    return async () => {
      await journal.stop()
      await journal.close()
    }
  })

  /* What the platform keeps to itself. A compaction a step could not make is caught, the turn
     continues, and one warning is all the world gets: no event, no session record. An exporter on the
     logger is the channel the platform offers for it — its own boot reads the tree's warnings the same
     way — and it lives and dies with this plugin. The journal never throws out of it: a record it
     cannot write is a fault of its own, and the platform's turn is not disturbed by this watch. */
  ctx.effect(() => ctx.logger.exporter({
    levels: { default: 2 },
    export: message => {
      void journal.swallowed(message)
    },
  }))

  // The composition and the settings are announced by the plugin manager: it is the one
  // joint where the environment learns about an edit by itself. An edit of a file by hand
  // is not announced — the comparison at start catches it.
  ctx.effect(() => ctx.on('plugin-manager/changed', change => {
    void journal.observe(`manager: ${change?.reason ?? 'an operation'}`)
  }))

  for (const tool of journalTools(journal)) {
    ctx.effect(() => ctx.tools.register(tool))
  }

  /* The route, in the scoped area Cordis gives a service that may be absent: the area runs where
     `connection` is — at the mount, or in a composition that gains the web surface later — and its
     effect lives and dies with it. Where the area never runs, the line below says so. */
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['GET'],
        requestBody: 'buffered',
        fetch: async () => new Response(JSON.stringify(await answer(journal)), {
          status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        }),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the journal route`)
  })
  if (ctx.get('connection') === undefined) {
    ctx.logger?.info?.(`${name}: this composition carries no web surface, so nothing serves ${ROUTE} — the journal, its tools and its observation stand without it`)
  }
}

/**
 * The answer of the route: the summary and the faults of observation. A refusal to read
 * is an answer with words too, not an empty page: a journal that is not there would read
 * as "nothing changed".
 *
 * The answer leaves by the same path as an answer of a tool, so it passes the same guard:
 * a value that does not survive the transfer is refused here in words instead of losing
 * its fields silently on the way.
 * @param {object} journal the journal
 * @returns {Promise<object>} the answer
 */
async function answer(journal) {
  try {
    const { summary, faults } = await journal.query({})
    return lossless({ ok: true, value: { summary, faults } })
  } catch (error) {
    return { ok: false, error: { code: 'journal-unavailable', message: reasonOf(error) } }
  }
}

/**
 * The text of a profile file. An absent file is `undefined`: an empty file and an absent one are different
 * states, and the print remembers that.
 */
function readProfileText(dir, fileName) {
  if (typeof dir !== 'string' || dir === '') {
    throw new Error('the profile directory is unknown: profileContext.dir is not set')
  }
  try {
    return readFileSync(join(dir, fileName), 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }
}

/**
 * The live composition: the bundles the profile selects or installs, and the rows as the plugin manager
 * sees them. The manager's list also carries the application's whole official catalogue — entries the
 * profile does not carry — and printing those would make an application update read as a change of the
 * profile.
 * @param {object} ctx the plugin's context
 * @returns {Promise<object>} bundles and rows
 */
async function readLiveComposition(ctx) {
  const [bundles, rows] = await Promise.all([ctx.pluginManager.listBundles(), ctx.pluginManager.listPlugins()])
  return {
    bundles: bundles
      .filter(item => item.enabled === true || item.installed === true)
      .map(item => ({ name: String(item.name), enabled: item.enabled === true }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    rows: rows
      .map(item => ({
        id: String(item.entryId ?? item.moduleName ?? ''),
        module: String(item.moduleName ?? ''),
        enabled: item.enabled === true,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  }
}

/** The reason of a refusal in words. */
function reasonOf(error) {
  return error instanceof Error ? error.message : String(error)
}
