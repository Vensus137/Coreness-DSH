/**
 * The row's settings: the credential reference, the models, the retry policy, the endpoints and the
 * cadence of the account's sweep — the schema the Loader reads from this package's `Config` export.
 *
 * @module @coreness/qoder/src/config
 */

import z from '@deepseek-ai/schemastery'
import { DEFAULT_RETRYABLE_CODES, RETRY_DEFAULTS } from './adapter.js'
import { DEFAULT_CENTER_ORIGIN, DEFAULT_CONTROL_CEILING_MS, DEFAULT_FIRST_BYTE_CEILING_MS, DEFAULT_IDLE_CEILING_MS, DEFAULT_OPENAPI_ORIGIN } from './in.js'
import { DEFAULT_CONTEXT_WINDOW, DEFAULT_MODEL_MAX_TOKENS } from './models.js'

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
 * the node the page pins after its own sweep, and the web switch. Everything else stays ordinary: a write there would
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
  /**
   * The product's one switch for the two web providers. It is volatile because the checkbox writes it
   * while the route runs; the providers read it live and stay registered while it is off, so the
   * platform's own provider choice is untouched on a profile that never opted in.
   */
  webAccess: z.object({
    enabled: z.boolean().default(false),
  }).default({}).volatile(),
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
