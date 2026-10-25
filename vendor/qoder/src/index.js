/**
 * The Qoder route: the package's own transport, the adapter the platform's model service calls, and the door
 * the product's own widget reads the account's credits through.
 *
 * This plugin owns the wire (getting in, the signature, the body and the frames) and the route built on
 * it: one adapter under the id the live profile already names (`qoder`), whose declaration gives the
 * platform its models, its retry policy and its credential door. The mapping is the platform's own
 * vocabulary; the facts of the wire are the vendor's own.
 *
 * The pictures of a request are this plugin's subject too: the image reader fills in their bytes through
 * the platform's attachment store, the body writes them as the vendor's own content part, and the
 * adapter's declaration is what lets a picture through the platform's gates at all.
 *
 * The token is a reference, never a value: the row names a credential and the platform's own store
 * answers it (`ctx.credentials`), so nothing secret lies in a config, a patch, a log or an error
 * message. The same reference is what the platform's own Settings → Models page reads and writes —
 * one value, two doors.
 *
 * The account's credits are the second thing this plugin serves, and they come through a route of the
 * product's own (`CREDITS_ROUTE`, the door the MCP plugin already uses) rather than through the row's
 * settings section: that section *is* the profile's Cordis patch, and a sweep that wrote its answer
 * there would rewrite a file the user owns on every tick — what the port left behind.
 *
 * @module @coreness/qoder
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import { QoderError } from './in.js'
import { createTransport } from './transport.js'
import { DISPLAY_NAME, ROUTE, createAdapter, liveValue } from './adapter.js'
import { sweepMsOf } from './config.js'
import { CATALOGUE_ACTION, VERIFY_ACTION, WEB_SEARCH_ACTION, answerOf, answerOfRoute } from './routes.js'
import { createImageReader } from './images.js'
import { createCredits } from './credits.js'
import { createAccount } from './account.js'
import { createSpendJournal } from './spend.js'
import { spendTools } from './spendTool.js'
import { PROBE_ACTION } from './probe.js'
import { PROVIDER_ID, registerWebProviders } from './web.js'

export { Config, DEFAULT_MODELS, DEFAULT_SWEEP_MS, MAX_SWEEP_MS, MIN_SWEEP_MS, sweepMsOf } from './config.js'
export { CATALOGUE_ACTION, VALUE_REFUSED_CODES, VERIFY_ACTION, verifyToken } from './routes.js'

export const name = 'coreness-qoder'

/**
 * The credential store is the only door to the token and `llm` is the route's registry: the road
 * cannot run without either, so both are declared. `connection` is **not** declared, because it
 * carries only the two HTTP routes and the road must mount where there is no web surface.
 *
 * A declared name is an activation gate in Cordis — the declaration has no optional form, and a
 * plugin whose service never arrives stays pending and never applies — so `connection` declared here
 * kept the whole road out of every headless composition. It is not "a connection" but the web
 * transport: exactly one shipped patch list mounts it, with `inject: [webRuntime]`, and the platform's
 * own `requiredStartupEntryIds` names it, so a composition that mounts the web application and shuts
 * its startup cannot boot at all. The routes are registered in the scoped area in `apply` instead — the
 * platform's own idiom for a service that may be absent, `ctx.inject(["connection"], …)`.
 */
export const inject = ['credentials', 'llm', 'tools']

/** The service this plugin provides: the transport the adapter of this route consumes. */
export const SERVICE = 'qoderTransport'

/** The exact route the product's own widget reads the account's credits through. */
export const CREDITS_ROUTE = '/api/coreness.credits'

/**
 * The exact route the product's own page reads this route's live facts through.
 *
 * The platform's own row carried the same request as a pair of fields in the settings section — `probeRequest` and
 * `probeResult` — because its browser half had no route of its own. This route
 * has one, and the section *is* the profile's Cordis patch: a sweep's answer written back there would
 * rewrite a file the user owns on every press, which is what the port left behind for the credits.
 * The page presses; the host answers; the profile's patch is
 * written only by the platform's settings service, and only with the values the user chose.
 *
 * Three actions stand on the one address because all three are one fact — what this vendor answers this
 * account right now, read over the route's own signed transport: `probe` sweeps the node map
 * (`PROBE_ACTION`), `catalogue` hands back the live listing **with the reasoning menu every entry
 * publishes** (`CATALOGUE_ACTION`), and `verify` puts the value the store holds to the vendor and says
 * whether it is accepted (`VERIFY_ACTION`). The page's model picker reads the second one because the
 * platform's own discovery door projects each entry onto five fields and drops the menu, so a row could
 * not otherwise offer the levels its model really admits.
 */
export const PROBE_ROUTE = '/api/coreness.qoder'

/**
 * The spend journal's own path under one home.
 *
 * The file is the donor provider's own, so its **name** is a fact about the ledger rather than about this
 * module: it is resolved here alone, and whoever needs the path — the route's own wiring, the live smoke
 * tool — asks for it instead of joining the two halves again. Two copies would drift the first time the
 * file ever moves, and the one that was forgotten would keep writing to a ledger nobody reads.
 * @param {string} home the harness home (`$DSH_HOME`)
 * @returns {string} the journal's path
 */
export function spendJournalPath(home) {
  return join(home, 'qoder-requests.ndjson')
}

/**
 * Mount the route: the transport, the adapter over it, the declaration that gives the user a door, and
 * the product's own door to the account's credits.
 *
 * Three registrations, each in the platform's own place: the service this plugin provides
 * (`qoderTransport`), the adapter under the route id (`ctx.llm.registerAdapter`), and the route in
 * the configurable-provider directory (`registerConfigurableProviders`) — the last one is what makes
 * the platform's own Settings → Models carry the row, its credential dot and its key field, because
 * the profile the directory is given names an `apiKeyEnv`. All of them live and die with this fiber;
 * the adapter registered here is the one that goes away.
 *
 * The fourth is the widget's: `CREDITS_ROUTE` and the page's sweep route on the connection, and the
 * sweep behind the first. The sweep starts with the plugin rather than with the first glance at the
 * widget — the vendor's reward window is the reason, and a sweep that waited for a browser would miss
 * it on a machine whose window is never open. The timer is an effect of this fiber; the two routes are
 * effects of the scoped area that owns them, so a reload of the profile leaves exactly one of each and
 * a composition without a connection carries none of them — with a line in the log saying which.
 *
 * The journal is mounted with them and handed to the adapter, so a turn writes its row wherever the route
 * is used — the harness's own sessions included — rather than only where a tool builds an adapter itself.
 * @param {object} ctx the cordis context
 * @param {object} config the row's config, resolved by the Loader against {@link Config}
 * @returns {void}
 */
export function apply(ctx, config) {
  /* The home, resolved once: the machine id's own folder and the spend journal hang off the same root,
     and a second resolution of `DSH_HOME` is a second place that can drift from it. */
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const storeDir = config.machineIdStoreDir !== ''
    ? config.machineIdStoreDir
    : join(home, 'qoder')
  const log = (message) => ctx.logger?.info?.(`coreness-qoder: ${message}`)
  const warn = (message) => ctx.logger?.warn?.(`coreness-qoder: ${message}`)
  /* The value the store holds, read per call and never captured — one thunk with two readers: the
     transport's own `apiKey` and the check the page presses (`VERIFY_ACTION`). A second reader would be a
     second place the reference is resolved, and the two would drift on the next field the row gains. */
  const credential = () => readCredential(ctx, referenceOf(config))
  const transport = createTransport({
    apiKey: credential,
    region: liveValue(config.region) ?? 'auto',
    centerOrigin: config.centerOrigin,
    openapiOrigin: config.openapiOrigin,
    /* Read per call and never captured: the row's node is a live field, and the page pins it while the
       route is running (the reason stands at the Config schema, and `resolvedEndpoints` reads it per
       call). */
    inferBase: () => liveValue(config.inferBase) ?? '',
    machineIdStoreDir: storeDir,
    controlCeilingMs: config.controlCeilingMs,
    firstByteCeilingMs: config.firstByteCeilingMs,
    idleCeilingMs: config.idleCeilingMs,
    onStrike: (fired) => warn(`ceiling ${fired.ceiling} fired after ${fired.elapsedMs} ms on the row ${name} (setting ${fired.ms} ms) — ${fired.where}`),
    warn,
  })
  ctx.provide(SERVICE, transport)

  /* The spend journal is the donor provider's own file, continued rather than started again: the account's
     history reads as one ledger, and the boundary between its rows and ours is the time they carry. One
     binding feeds both readers — the adapter that writes and the tool that answers. */
  const journal = createSpendJournal({ path: spendJournalPath(home), log: warn })
  const adapter = createAdapter({
    transport,
    settings: () => config,
    displayName: DISPLAY_NAME,
    log,
    imageData: createImageReader(ctx),
    journal,
  })
  ctx.llm.registerAdapter([ROUTE], adapter)
  /* The ledger's reader: the money one window holds, by day and model. It reads the file the adapter
     writes, through the one place the path is resolved — a second join of the two halves would drift the
     first time the ledger moves. */
  for (const tool of spendTools(spendJournalPath(home), journal.failures)) {
    ctx.effect(() => ctx.tools.register(tool))
  }
  /* The row's own id is the settings namespace the platform's page reads the profile from: the config
     below is that namespace's schema, and `settingsPath: []` means the row itself. One name for both
     doors — the directory entry and the discovery below — so a row and its live catalogue cannot drift
     apart. */
  const settingsNs = ctx.fiber?.entry?.options?.id ?? name
  ctx.llm.registerConfigurableProviders([{
    provider: ROUTE,
    displayName: DISPLAY_NAME,
    settingsNs,
    settingsPath: [],
  }])
  /* The vendor's live catalogue, offered to the platform's own door (`llm/discoverModels`): the page's
     model picker asks through it, and so does the
     platform's own Models page when it offers a model to adopt. The adapter's `listModels` stays the
     row's declaration — the two answers are different on purpose, and the joint is registered under
     the namespace the row is edited through. */
  ctx.llm.registerModelDiscovery(settingsNs, (request, signal) => adapter.discoveredModels(request, signal))

  const everyMs = sweepMsOf(config.credits?.sweepMs, warn)
  const account = createAccount({
    credits: createCredits({ transport }),
    everyMs,
    autoClaim: config.credits?.autoClaim !== false,
    log,
  })

  /* The two web providers are an optional surface: a composition without `web` still mounts the model
     route, and the providers remain registered but unavailable while the row's flag is off. */
  ctx.inject(['web'], (webCtx) => {
    webCtx.effect(() => {
      const dispose = registerWebProviders(webCtx.web, { transport, config })
      log(`the Qoder web providers are registered (search "${PROVIDER_ID}", fetch "${PROVIDER_ID}")`)
      return dispose
    }, `${name}: the Qoder web providers`)
  })
  if (ctx.get('web') === undefined) {
    log('this composition carries no web service, so the Qoder web providers are not registered')
  }

  /* The two HTTP routes the page reads, in the scoped area Cordis gives a service that may be absent.
     The area runs where `connection` is — at the mount, or in a composition that gains the web surface
     later — and its effects live and die with the area, so the routes stand exactly as long as the
     transport that serves them. Where the area never runs, the line below says so. */
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: CREDITS_ROUTE,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: (request) => answerOf(account, request, warn),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the credits route`)

    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: PROBE_ROUTE,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: (request) => answerOfRoute(transport, request, warn, credential),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the page's route`)

    log(`the credits route stands at ${CREDITS_ROUTE}, sweeping every ${everyMs} ms (collection ${config.credits?.autoClaim !== false ? 'on' : 'off'})`)
    log(`the page's route stands at ${PROBE_ROUTE} (actions "${PROBE_ACTION}", "${CATALOGUE_ACTION}", "${VERIFY_ACTION}" and "${WEB_SEARCH_ACTION}")`)
  })
  if (ctx.get('connection') === undefined) {
    log(`this composition carries no web surface, so nothing serves ${CREDITS_ROUTE} or ${PROBE_ROUTE}: the route's transport, its adapter and the credits sweep stand without them`)
  }

  ctx.effect(() => {
    /* One reading at the mount, then the cadence: the mount's reading is what makes the widget's first
       glance a figure rather than "the balance has not been read yet". */
    void account.sweep('the mount')
    const timer = setInterval(() => {
      void account.sweep('the sweep')
    }, everyMs)
    return () => {
      clearInterval(timer)
    }
  }, `${name}: the credits sweep every ${everyMs} ms`)
}

/**
 * The credential reference the row names.
 *
 * The platform resolves a `volatile` field into a live value rather than into a string — that flag is
 * what makes the field editable from the platform's own Settings → Models without re-mounting the row
 * (`volatileForm`) — so the reference is read through the field on every call, the way the platform's
 * own key plugins read theirs. A plain string is accepted as it stands: that is
 * the shape the field takes when the config is read outside the Loader, as the plugin's own tests do.
 * @param {object} config the row's resolved config
 * @returns {string} the reference name the store is asked for
 */
function referenceOf(config) {
  const field = liveValue(config.apiKeyEnv)
  if (typeof field !== 'string' || field === '') {
    throw new QoderError('the row names no credential reference: the apiKeyEnv field is empty', 'MISSING_CREDENTIAL')
  }
  return field
}

/**
 * The token behind one reference, asked of the platform's own store on every call.
 *
 * Reading per call rather than caching is what lets a rotated token apply to the next
 * request without a restart. An unset reference is not an error of the store: it is the
 * route telling the caller, in words, that it has no credential yet — and it leaves as the
 * platform's own code for exactly that state, so a reader routes on it instead of parsing a sentence.
 * @param {object} ctx the cordis context
 * @param {string} ref the credential reference the row names
 * @returns {Promise<string>} the token
 * @throws {QoderError} `MISSING_CREDENTIAL` when nothing is stored under that reference
 */
async function readCredential(ctx, ref) {
  const answer = await ctx.credentials.resolve(ref)
  const value = typeof answer === 'string' ? answer : answer?.value
  if (typeof value !== 'string' || value === '') {
    throw new QoderError(`no Qoder credential is stored under ${ref}: enter the token in Settings → Models, or store it through the platform's credentials`, 'MISSING_CREDENTIAL')
  }
  return value
}
