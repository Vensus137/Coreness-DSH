/**
 * The Qoder route: our own transport, the adapter the platform's model service calls, and the door
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
 * there would rewrite a file the user owns on every tick — which is what the donor did, 847 times in
 * four days, and what the port left behind.
 *
 * @module @coreness/dsh/plugins/provider/qoder
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import z from '@deepseek-ai/schemastery'
import { QoderError, createTransport, requestIdOf, vendorWordsOf } from './in.js'
import { DEFAULT_CENTER_ORIGIN, DEFAULT_CONTROL_CEILING_MS, DEFAULT_FIRST_BYTE_CEILING_MS, DEFAULT_IDLE_CEILING_MS, DEFAULT_OPENAPI_ORIGIN } from './in.js'
import { DEFAULT_CONTEXT_WINDOW, DEFAULT_MODEL_MAX_TOKENS, DEFAULT_RETRYABLE_CODES, DISPLAY_NAME, RETRY_DEFAULTS, ROUTE, createAdapter, liveValue } from './adapter.js'
import { createImageReader } from './images.js'
import { createCredits } from './credits.js'
import { createAccount } from './account.js'
import { createSpendJournal } from './spend.js'
import { PROBE_ACTION, sweepNodes } from './probe.js'

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
export const inject = ['credentials', 'llm']

/** The service this plugin provides: the transport the adapter of this route consumes. */
export const SERVICE = 'qoderTransport'

/** The exact route the product's own widget reads the account's credits through. */
export const CREDITS_ROUTE = '/api/coreness.credits'

/**
 * The exact route the product's own page reads this route's live facts through.
 *
 * The donor carried the same request as a pair of fields in the settings section — `probeRequest` and
 * `probeResult` — because its browser half had no route of its own. Ours
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
 * The action whose answer is the vendor's own catalogue, verbatim: the ids and the per-model reasoning
 * menu the vendor publishes, as the transport reads them.
 *
 * Verbatim and not projected: the page's row offers the menu it is handed, and a second shape here
 * would be a second opinion about the vendor's listing that could drift from the one the wire already
 * travels on (`modelsOf`).
 */
export const CATALOGUE_ACTION = 'catalogue'

/**
 * The action that asks the vendor whether it accepts the value the store holds: one exchange, and an
 * answer in a closed vocabulary of three (`verifyToken`).
 *
 * The credential store can only say that a value is *there*: a token that expired, was revoked, or
 * belongs to a deleted account reads as configured, and the first sign of trouble is a failed turn — the
 * owner replaced a token that was never at fault for exactly this reason. The answer is asked
 * of the vendor through the door every turn enters by, and it is asked when the value is handed over or
 * when the reader asks again, never on a tick: one exchange per press, and the exchange harms nobody
 * (two live job tokens of one personal token coexist).
 */
export const VERIFY_ACTION = 'verify'

/**
 * The vendor's own codes that are a statement **about the value**, and the whole list of them.
 *
 * Measured, each one: `105` and `TOKEN_EXPIRE` are the contour's two spellings of a value that is not
 * active (`sessionExpired` — the chat door writes the first, the REST door the second), and `BadRequest`
 * is what this call answers for a value it cannot accept at all — a wrong paste, measured live. A code
 * outside this list is not a judgement of the value however the
 * envelope is shaped: the contour answers `403` for an exhausted allowance as well (`{"code":"110"}`),
 * and our own `AUTH` says only that a status was 401 or 403.
 */
export const VALUE_REFUSED_CODES = Object.freeze(['105', 'TOKEN_EXPIRE', 'BadRequest'])

/**
 * How often the sweep reads the account, unless the row says otherwise: ten minutes.
 *
 * The reason in words: the vendor's reward window opens once a day and the balance moves with use, so a
 * figure at most ten minutes old is as useful as one at most five — at half the requests the donor's
 * number cost.
 */
export const DEFAULT_SWEEP_MS = 10 * 60 * 1000

/** The fastest sweep a row may ask for: the vendor's account API is not ours to hammer. */
export const MIN_SWEEP_MS = 60 * 1000

/** The slowest: past a day the sweep is slower than the window it exists to catch. */
export const MAX_SWEEP_MS = 24 * 60 * 60 * 1000

/**
 * The models the route advertises: the five a fresh profile gets, with the windows the **vendor's own
 * catalogue** declares for them and each row asking for the **highest level its own menu names**.
 *
 * Naming the effort here rather than leaving it empty is the point of the row: an empty effort means
 * "whatever the route's own setting says". The two models that publish **no** menu name the highest level
 * on the scale instead, deliberately — the scale is ours but it describes the vendor's own levels, and the
 * wire takes a name a menu does not publish (measured twice: `max` to a model whose menu is
 * `xhigh|low|medium`, and `xhigh` to a model that publishes no menu at all) — because an empty row would
 * let those two reason less than they do.
 *
 * The list is the row's and not the vendor's, deliberately: the model picker and the platform's own
 * settings page ask for it while a surface is being built, and a list that waited for a token, a node map
 * and a catalogue call would show an empty picker instead of a route that declares what it serves. The
 * vendor's live catalogue stays a read of its own, and its live menus never enter this declaration.
 *
 * The windows, though, are the vendor's numbers: the three tiered models publish `200000 / 400000 /
 * 1000000` with `200000` marked *recommended*, and the two others publish none. **Nothing on this route
 * names a tier** — the body carries the model key, the reasoning flag and the output budget, and no context
 * field at all — so the declared window is a budget for the platform's own condensing, and it stands above
 * the tier the vendor recommends because this node is measured to serve deeper prompts than that: the
 * condensing trigger (`floor(min(W × 0.8, W − output − 65 536))`) must not fire below what the node serves,
 * and the reading behind the measurement stands in the shipped journal.
 */
export const DEFAULT_MODELS = Object.freeze([
  Object.freeze({ id: 'auto', name: 'Auto', contextWindow: 400_000, vision: true, effort: 'max' }),
  Object.freeze({ id: 'efficient', name: 'Efficient', contextWindow: 200_000, vision: true, effort: 'max' }),
  Object.freeze({ id: 'dfmodel', name: 'DeepSeek-Flash', contextWindow: 400_000, vision: true, effort: 'max' }),
  Object.freeze({ id: 'qmodel_38max', name: 'Qwen3.8-Max', contextWindow: 400_000, vision: true, effort: 'xhigh' }),
  Object.freeze({ id: 'qfmodel', name: 'Qwen3.8-Flash', contextWindow: 400_000, vision: true, effort: 'xhigh' }),
])

/**
 * The row's settings: where the vendor is reached, which credential names the token, the models the route
 * advertises, the retry policy it declares, and the cadence of the account's sweep.
 *
 * `retryPolicy` is the platform's own shape and its own defaults, with one addition:
 * **`MALFORMED_RESPONSE` joins the retryable codes**. The reason is measured — a tool call whose arguments
 * do not parse has ended whole agent sessions here, while such an attempt carries nothing durable to repeat
 * and a re-ask is a fresh sample. The list is declared in the row, so it can be narrowed from there without
 * a code change.
 *
 * **Which fields are volatile, and why.** `volatile` is the platform's own word for "a write to this field
 * applies to the running plugin without re-mounting the row", and it is also the condition a write goes
 * through: the settings service refuses every path that is not volatile. Exactly the fields the product's
 * page moves are volatile and no others — the credential reference, the model list and its fallback window,
 * and the node the page pins after its own sweep. Everything else stays ordinary: a write there would
 * re-mount the route, and the page draws no control for it.
 *
 * The price, paid where the fields are read: a volatile field arrives as a **live reference**, not as a
 * value — every case, defaults included — so every reader goes through {@link liveValue}. A reader that
 * forgot would hold a box instead of a list, which is the silent breakage this list exists to prevent.
 * Plain strings and arrays stay accepted, because that is the shape the config takes outside the Loader.
 */
export const Config = z.object({
  /**
   * The credential reference the platform's store resolves; never the value itself.
   *
   * `volatile` is what makes this row's namespace an editable one: the platform's settings service
   * describes a namespace only when its schema declares a field whose writes apply without
   * remounting the plugin (`volatileForm`), and the platform's own Models page keeps a provider row
   * whose namespace it cannot read a profile from — measured: the route was registered
   * and carried by the directory, and the page showed no row for it while this field was not volatile.
   */
  apiKeyEnv: z.string().role('credential-ref').default('QODER_PERSONAL_ACCESS_TOKEN').volatile(),
  /**
   * The models the route advertises: the id the wire takes, the display name, the window, whether the model
   * reads pictures, and the effort this model is asked for.
   *
   * `vision` is what the platform reads to decide whether a picture may reach this route at all — the session
   * controller refuses a prompt carrying an attachment for a model that does not declare image input, and the
   * runtime replaces every picture with a text-only placeholder before dispatch — so it is the row's answer
   * and not a live read: the picker and the settings page ask while a surface is built, and a picture may be
   * attached before any turn exists. It defaults to **true**, which is what the vendor's catalogue said for
   * every model the live node carried; a row naming a model that does not read pictures sets it false.
   *
   * `effort` is this model's own reasoning effort, in the vocabulary of the model itself: the page draws each
   * row's choices from the vendor's live catalogue and writes the chosen name here. Two dictionaries live
   * beside each other by design: **this field is the vendor's** (`VENDOR_EFFORTS`), and the declaration the
   * platform reads is its own — the three names plus whatever this row holds (`declaredEfforts`) — because the
   * platform refuses a value its declaration does not carry before any request leaves.
   *
   * A model's setting wins over the row's {@link reasoningEffort}, which stays as the answer for a model that
   * names none, and an empty string means exactly that. What the wire carries is this value itself: a name a
   * model's menu does not publish travels as asked, because the wire takes it.
   */
  models: z.array(z.object({
    id: z.string(),
    name: z.string().default(''),
    contextWindow: z.number().default(DEFAULT_CONTEXT_WINDOW),
    maxTokens: z.number().default(DEFAULT_MODEL_MAX_TOKENS),
    vision: z.boolean().default(true),
    effort: z.string().default(''),
  })).default([...DEFAULT_MODELS]).volatile(),
  /** The window given to a model id the row does not declare. */
  defaultContextWindow: z.number().default(DEFAULT_CONTEXT_WINDOW).volatile(),
  /** The route's own retry policy; the platform's defaults plus the code this route explains. */
  retryPolicy: z.object({
    mode: z.const('normal').default('normal'),
    maxRetries: z.number().default(RETRY_DEFAULTS.maxRetries),
    retryableCodes: z.array(z.string()).default([...DEFAULT_RETRYABLE_CODES]),
    backoff: z.object({
      initialDelayMs: z.number().default(RETRY_DEFAULTS.initialDelayMs),
      maxDelayMs: z.number().default(RETRY_DEFAULTS.maxDelayMs),
      jitterRatio: z.number().default(RETRY_DEFAULTS.jitterRatio),
    }).default({}),
  }).default({}),
  /** The centre host, overridable for a test; the contour's own value by default. */
  centerOrigin: z.string().default(DEFAULT_CENTER_ORIGIN),
  /** The OpenAPI host, overridable for a test. */
  openapiOrigin: z.string().default(DEFAULT_OPENAPI_ORIGIN),
  /** A pinned inference node; empty means the node map is asked. Read per call: the page pins it live. */
  inferBase: z.string().default('').volatile(),
  /** Where the machine id is kept; empty means the harness home. */
  machineIdStoreDir: z.string().default(''),
  /**
   * The effort the route asks for; an empty string is "nothing is named", and `off` leaves the field out
   * of the body. The default is empty on the user's decision: every shipped model row names its
   * own level, the page's control writes the chosen name into the row, and where neither names one the
   * vendor's own default stands — measured, a model reasons either way, with or without the field. A
   * value here is the user's own choice and reaches every model whose row names none.
   */
  reasoningEffort: z.string().default(''),
  /**
   * How long a **control call** may take before it is a `TIMEOUT`: the node map, the exchange, the
   * refresh, the profile and the catalogue. Measured here: 0.9–1.3 s, so this is tenfold headroom.
   */
  controlCeilingMs: z.number().default(DEFAULT_CONTROL_CEILING_MS),
  /**
   * How long the answer may take to **start speaking** before it is a `TIMEOUT` — the time to its
   * first byte. Ours, not the harness's: a stream that opened and never spoke is not a model
   * thinking, and it is what a corrupted signature looks like here (measured: 200 at once, then
   * silence; a normal turn speaks in ~1.1 s).
   */
  firstByteCeilingMs: z.number().default(DEFAULT_FIRST_BYTE_CEILING_MS),
  /**
   * How long an answer that has **started** may stay silent before it is a `TIMEOUT`. The harness's
   * own number (`DEFAULT_STREAM_IDLE_TIMEOUT_MS`, 300 s), kept for its own reason: while a model
   * reasons, only the transport owes frames, and a legitimate gap is not known to be short.
   */
  idleCeilingMs: z.number().default(DEFAULT_IDLE_CEILING_MS),
  /**
   * The account's credits, as the product's own widget reads them: how often the sweep reads the
   * vendor's account, and whether that sweep takes what is claimable.
   *
   * Both are ours, not the donor's, and they live in the row because they are a choice a user may want
   * to move — a slower sweep costs fewer requests, and a user who would rather take every reward by
   * their own hand turns the collection off without a code change.
   */
  credits: z.object({
    sweepMs: z.number().default(DEFAULT_SWEEP_MS),
    autoClaim: z.boolean().default(true),
  }).default({}),
})

/**
 * The cadence the row asked for, inside the bounds this plugin is willing to run at.
 *
 * A row outside the bounds is not refused — a profile that cannot start over a number is a worse
 * failure than a number that is ignored — but it is not obeyed in silence either: the value that is
 * used instead is named in the log, with the number the row asked for.
 * @param {number | undefined} asked the row's own value
 * @param {(message: string) => void} warn where an out-of-bounds value is said
 * @returns {number} the cadence to run at
 */
export function sweepMsOf(asked, warn = () => {}) {
  if (typeof asked !== 'number' || !Number.isFinite(asked)) return DEFAULT_SWEEP_MS
  if (asked < MIN_SWEEP_MS) {
    warn(`credits.sweepMs is ${asked} ms, under the floor of ${MIN_SWEEP_MS} ms: sweeping every ${MIN_SWEEP_MS} ms instead`)
    return MIN_SWEEP_MS
  }
  if (asked > MAX_SWEEP_MS) {
    warn(`credits.sweepMs is ${asked} ms, over the ceiling of ${MAX_SWEEP_MS} ms: sweeping every ${MAX_SWEEP_MS} ms instead`)
    return MAX_SWEEP_MS
  }
  return asked
}

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

  const adapter = createAdapter({
    transport,
    settings: () => config,
    displayName: DISPLAY_NAME,
    log,
    imageData: createImageReader(ctx),
    /* The spend journal is the donor provider's own file, continued rather than started again: the
       account's history reads as one ledger, and the boundary between its rows and ours is the time they
       carry. */
    journal: createSpendJournal({ path: spendJournalPath(home), log: warn }),
  })
  ctx.llm.registerAdapter([ROUTE], adapter)
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
    log(`the page's route stands at ${PROBE_ROUTE} (actions "${PROBE_ACTION}", "${CATALOGUE_ACTION}" and "${VERIFY_ACTION}")`)
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
 * The answer of one request on the widget's route.
 *
 * The status is 200 in both cases — `{ok:true, value}` or `{ok:false, error}`. A reading that failed is
 * **not** a refusal: it is a state of the widget (`last.kind`), and it travels as a value so the line can
 * say what the account answered instead of going blank.
 * @param {object} account the account, its picture and its sweeps
 * @param {Request} request the request
 * @param {(message: string) => void} warn where a refusal is said
 * @returns {Promise<Response>} the answer
 */
async function answerOf(account, request, warn) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    if (request.method === 'GET') return json({ ok: true, value: account.picture() })
    const body = await bodyOf(request)
    if (body.action === 'read') {
      await account.sweep('a press')
      return json({ ok: true, value: account.picture() })
    }
    if (body.action === 'claim') {
      await account.claim(typeof body.campaignId === 'string' && body.campaignId !== '' ? body.campaignId : undefined)
      return json({ ok: true, value: account.picture() })
    }
    throw new QoderError(`the credits route knows no action "${String(body.action)}": it answers "read" and "claim"`, 'BAD_REQUEST')
  } catch (error) {
    warn(`the credits route refused a ${request.method}: ${codeOf(error)} — ${messageOf(error)}`)
    return json({ ok: false, error: { code: codeOf(error), message: messageOf(error) } })
  }
}

/** The code of a thrown value, when it carries one. */
const codeOf = (error) => (typeof error?.code === 'string' && error.code !== '' ? error.code : 'UNKNOWN')

/** The reason of a thrown value, in words. */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * The answer of one request on the page's route.
 *
 * The status is 200 in both cases — `{ok:true, value}` or `{ok:false, error}`. A sweep that could not
 * start at all — no token, a node map that does not answer — is a refusal: an empty list would read as
 * "no node answered", which is a different fact. One node's own failure is not: that is a result.
 *
 * `catalogue` answers the vendor's listing as the transport reads it, menus included, and knows no
 * argument: the credential it needs is the row's reference, which the transport resolves for itself
 * (`discoveredModels` — the same joint, and the platform's discovery door carries no field that would
 * say "the live one" either).
 *
 * `verify` puts the value behind the row's reference to the vendor and answers in a closed vocabulary
 * of three (`verifyToken`). Its outcome travels as a **result**, not as this route's refusal: "the
 * vendor does not accept this value" is an answer to the question that was asked, the way a node that
 * did not answer is a result of the sweep. A route-level refusal is kept for what went wrong with the
 * request itself.
 * @param {object} transport the route's transport, the one owner of a signed call to a node
 * @param {Request} request the request
 * @param {(message: string) => void} warn where a refusal is said
 * @param {() => Promise<string>} credential the value the row's reference resolves to, read per call
 * @returns {Promise<Response>} the answer
 */
async function answerOfRoute(transport, request, warn, credential) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    const body = await bodyOf(request)
    if (body.action === PROBE_ACTION) return json({ ok: true, value: await sweepNodes(transport) })
    if (body.action === CATALOGUE_ACTION) return json({ ok: true, value: { models: await transport.catalogue({ signal: request.signal }) } })
    if (body.action === VERIFY_ACTION) return json({ ok: true, value: await verifyToken(transport, credential, request.signal) })
    throw new QoderError(`this route knows no action "${String(body.action)}": it answers "${PROBE_ACTION}", "${CATALOGUE_ACTION}" and "${VERIFY_ACTION}"`, 'BAD_REQUEST')
  } catch (error) {
    warn(`the page's route refused a ${request.method}: ${codeOf(error)} — ${messageOf(error)}`)
    return json({ ok: false, error: { code: codeOf(error), message: messageOf(error), vendor: vendorDetailOf(error) } })
  }
}

/**
 * The vendor's own detail out of a refusal, as content rather than as a state: the sentence the vendor
 * sent and the request id it asked to be traced by, each where the body carried one, read by the two
 * readers of the body's fields. A surface draws the reason beside this; the body itself stays on the
 * error, and this is what a reader who wants the why reads where the project keeps content.
 *
 * This place renders a **sentence**, because the content line here is read in the flow: a user meets
 * it beside the state and acts on the words, with the id the vendor traces by standing marked at the
 * end. Where a row is opened on purpose to ask what the contour said, the body itself is the answer and
 * is handed over verbatim instead — one fact, two readers, and the shape follows the act of reading.
 * @param {unknown} error what the vendor refused with
 * @returns {string | null} the detail, or nothing when the body carried neither
 */
function vendorDetailOf(error) {
  const body = typeof error?.vendor === 'string' ? error.vendor : ''
  if (body === '') return null
  const words = vendorWordsOf(body)
  const requestId = requestIdOf(body)
  if (words === null && requestId === null) return null
  return `${words === null ? '' : `the vendor says: ${words}`}${requestId === null ? '' : `${words === null ? '' : ' · '}request id ${requestId}`}`
}

/**
 * The verdict: what the vendor said about the value the store holds.
 *
 * One exchange and no more, through the door every turn enters by — the same personal token to the same
 * address the transport itself would use — so an accepted value is proven by the door a turn uses and a
 * refusal carries the vendor's own words. Nothing is cached and nothing is kept: the job token this mints
 * has no reader of its own, and a second live job token of one personal token harms nobody.
 *
 * The answer is three-valued and closed, and the line between `refused` and `unsettled` is a **code the
 * vendor itself sent**, never a status of the envelope and never our own reading of it. The contour answers
 * `403` both for a value that is not active and for an account whose counted allowance is spent, and a status
 * cannot tell those apart: a reader told "the vendor refused this token" for the second would go and replace
 * a token that was never at fault — the very defect this action exists to prevent, read from the other side.
 * Only the codes measured to be about the value convict it, and everything else is `unsettled`: a queue, a
 * counted allowance, an answer that is not JSON, an empty body, a `404`, a `5xx`, no answer within the
 * control ceiling, a transport fault, a profile that holds no value, or a `200` that carried no job token —
 * a broken answer is not a judgement of the value either.
 */
export async function verifyToken(transport, credential, signal) {
  let token
  try {
    token = await credential()
  } catch (error) {
    return { outcome: 'unsettled', code: codeOf(error), vendorCode: null, vendor: vendorDetailOf(error), reason: messageOf(error) }
  }
  try {
    await transport.exchange(token, signal)
    return { outcome: 'accepted', code: null, vendorCode: null, vendor: null, reason: null }
  } catch (error) {
    const code = codeOf(error)
    const vendorCode = typeof error?.vendorCode === 'string' && error.vendorCode !== '' ? error.vendorCode : null
    const judged = vendorCode !== null && VALUE_REFUSED_CODES.includes(vendorCode)
    return judged
      ? { outcome: 'refused', code, vendorCode, vendor: vendorDetailOf(error), reason: messageOf(error) }
      : { outcome: 'unsettled', code, vendorCode, vendor: vendorDetailOf(error), reason: messageOf(error) }
  }
}

/**
 * The body of a request. A body that is not a JSON object is a refusal in words, not a crash.
 * @param {Request} request the request
 * @returns {Promise<object>} the body
 * @throws {QoderError} `BAD_REQUEST` when the body is not a JSON object
 */
async function bodyOf(request) {
  const text = await request.text().catch(() => '')
  try {
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('the body is not an object')
    return parsed
  } catch (error) {
    throw new QoderError(`the credits route's body is not a JSON object: ${messageOf(error)}`, 'BAD_REQUEST')
  }
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
