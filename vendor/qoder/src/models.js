/**
 * The model table and the model/effort helpers: the windows, the output budget, the platform's effort
 * vocabulary, and the per-model metadata the adapter's declaration answers with.
 *
 * @module @coreness/qoder/src/models
 */

/**
 * The output budget this route declares for a model whose row names none.
 *
 * The vendor's own fallback, which is also what the body uses for a call that names nothing: this node
 * publishes no per-model output ceiling — the discovery answer carries none for any of the fifteen
 * models, and nor did the four rows read through the page (`dfmodel`, `efficient`, `qmodel_38max`,
 * `qfmodel`) — and neither number in play is a ceiling of the model. 256 000, which the platform's own road declares, is a quarter of *that* road's
 * 1 000 000-token window (`dsh-llm-deepseek`), and the platform charges the declaration to the same
 * window the prompt is spent from: a 400 000-token row that reserves 256 000 leaves 78 464 tokens of
 * prompt before the harness condenses, and a 200 000-token row leaves none and is refused outright
 * (`dsh-compaction-basic`, `TargetPressureConfigError`). 32 768 leaves the 400 000 rows 301 696 and the
 * 200 000 row 101 696 — the numbers this route's windows were chosen against — while staying 65% above
 * the longest answer the measured runs have produced (19 863 tokens). A row that knows its model's real
 * ceiling still names its own
 * in `models[]`, and a node that publishes one still wins through discovery; what this constant is, is a
 * declaration that fits the windows it is spent from.
 */
export const DEFAULT_MODEL_MAX_TOKENS = 32_768

/**
 * The window given to a model the row does not declare. The smallest tier the vendor's own catalogue
 * declares for these models — `200 000`, the tier it marks as the recommended one (every menu-bearing
 * model leads with `200 000`, and the two menu-less ones carry it as their only figure). A declared
 * window that is too small makes the harness compact earlier than it must, one that is too large lets
 * a request overflow — the cheap error is the first.
 */
export const DEFAULT_CONTEXT_WINDOW = 200_000

/**
 * The size at which a swallowed retelling is a compaction request in disguise rather than an empty
 * turn (the summariser's own `SUMMARY_ARTIFACT_CHARS`). Under it the turn is
 * an empty response; at or above it the harness compacts and re-runs the step, which is the treatment
 * the user decided for a retelling.
 */
export const SUMMARY_ARTIFACT_CHARS = 2_000

/**
 * The platform's own three names, and the base of the vocabulary this route declares.
 *
 * `off` is why they stay: no vendor menu publishes it (their client expresses a switch-off as a budget
 * of zero), and the other two are the platform's words for the request this route sends — what travels
 * is the effort the row names, exactly as it stands there.
 *
 * They are the declaration's base and not the whole of it: a model whose row names a level the vendor
 * publishes declares that level beside them ({@link declaredEfforts}), because the platform validates
 * every effort it resolves against this list and refuses one it does not find, before any provider call.
 */
export const REASONING_EFFORTS = Object.freeze([
  Object.freeze({ id: 'off', name: 'Off', description: 'No reasoning: the answer only.' }),
  Object.freeze({ id: 'high', name: 'High', description: 'Reasoning for ordinary work.' }),
  Object.freeze({ id: 'max', name: 'Max', description: 'Reasoning for the hardest work.' }),
])

/**
 * What this route declares one model supports: the platform's three, and the level the row names when
 * it is not one of them.
 *
 * The row carries the **vendor's own** name — the page draws every model's menu from the vendor's live
 * catalogue and writes the chosen name into the row — so the declaration must admit it, or the
 * platform would refuse the very value this route is going to ask for: `defaultEffort` has to be a
 * member of `efforts`, and any effort a call resolves to has to be one too, with no clamping and no
 * aliasing.
 *
 * The platform's three stay in every case, not only where no vendor name stands: a session that chose
 * `high` at the platform's own picker would otherwise meet `UNSUPPORTED_REASONING_EFFORT` in the middle
 * of a conversation the moment a row moved. The order is the platform's, and the row's level is
 * appended once, the vendor's spelling serving as both its id and its label.
 *
 * The model's **live menu** is deliberately not part of this: it is what the product's own page offers
 * a reader, read over the page's route, while this list is the platform's vocabulary of what may be
 * asked of the route. Reading the catalogue here would make the platform's own model catalogue wait on
 * the vendor — against the decision that the model list is never waited on — or, if it were read
 * lazily, would let a session's admissible vocabulary move with the vendor's listing and refuse a
 * level already chosen.
 * @param {string} effort the effort the row names, or the route's answer where the row names none
 * @returns {readonly object[]} the efforts the platform may ask this model for
 */
export function declaredEfforts(effort) {
  if (effort === '' || REASONING_EFFORTS.some((one) => one.id === effort)) return REASONING_EFFORTS
  return Object.freeze([...REASONING_EFFORTS, Object.freeze({ id: effort, name: effort })])
}

/**
 * The input modalities one model's row declares.
 *
 * The vendor serves pictures on every model its catalogue carried when the catalogue was read — the
 * flag it publishes is `is_vl`, and all fifteen entries of the live node's `chat` category carry it
 * true, `dfmodel`, `efficient`, `qmodel_38max` and `qfmodel` among them, which the transport already
 * reads as `vision` — and the vendor's catalogue declares `vision: true` for every one of them. So the row's
 * `vision` decides, and it defaults to what the catalogue says for this vendor: pictures are carried
 * unless the row marks the model text-only.
 * @param {boolean | undefined} vision the row's own flag for this model
 * @returns {string[]} the modalities the platform reads
 */
export function modalitiesOf(vision) {
  return vision === false ? ['text'] : ['text', 'image']
}

/**
 * The advisory list of one route: the models the row declares, in the row's order.
 * @param {readonly object[]} models the row's `models`
 * @param {string} provider the route
 * @returns {object[]} selector metadata per model
 */
export function declaredModels(models, provider) {
  return (models ?? []).map((model) => ({
    provider,
    id: model.id,
    name: model.name === undefined || model.name === '' ? model.id : model.name,
    contextWindow: model.contextWindow ?? DEFAULT_CONTEXT_WINDOW,
    maxTokens: model.maxTokens ?? DEFAULT_MODEL_MAX_TOKENS,
    inputModalities: modalitiesOf(model.vision),
  }))
}

/**
 * The exact model metadata of one call.
 *
 * The fields the declaration owes: the window — the row's, or the conservative default — the output budget
 * the platform materialises into a request that names none, the reasoning menu, and **`inputModalities`**,
 * the field that decides whether the platform lets a picture reach this route at all. Two platform guards
 * read it and were both refusing this route while it said `['text']`: the session controller refuses a
 * prompt carrying an attachment (the refusal the user met), and the runtime replaces every picture of a
 * message with the text-only placeholder before dispatch, which is why the pictures inside `read_image`
 * results never reached the model. The flag is per model and comes from the row.
 *
 * `systemPromptUpdate: 'in-history'` and `toolUpdate: 'addition-only'` are the platform's own route's
 * declarations, and both say what this route does. The first is what makes the loop treat a prompt change as
 * **an appended system message** rather than a rewrite of the leading one, which is why this project's own
 * sessions carry system messages after the first; the body answers it by flattening **every** system-role
 * message into the top-level prompt in their order, so the newest update is read as part of the prompt and
 * nothing is dropped. A route that declared nothing would be told to replace the leading prompt in place,
 * and the earlier text would be lost.
 */
export function modelInfo(settings, provider, model) {
  const declared = (settings.models ?? []).find((entry) => entry.id === model)
  const effort = effortOf(settings, model)
  return {
    provider,
    id: model,
    name: declared?.name === undefined || declared.name === '' ? model : declared.name,
    inputModalities: modalitiesOf(declared?.vision),
    context: { contextWindow: declared?.contextWindow ?? settings.defaultContextWindow ?? DEFAULT_CONTEXT_WINDOW },
    defaultMaxTokens: declared?.maxTokens ?? DEFAULT_MODEL_MAX_TOKENS,
    systemPromptUpdate: 'in-history',
    toolUpdate: 'addition-only',
    // `defaultEffort` is published only where a level is named: the platform refuses a default that is
    // not a member of `efforts`, and an empty string means "nothing is named" — left out, the platform
    // shows its own provider default and the request carries no effort.
    reasoning: effort === '' ? { efforts: declaredEfforts(effort) } : { efforts: declaredEfforts(effort), defaultEffort: effort },
  }
}

/**
 * The effort a model is asked for: its own setting where the row declares one, the route's otherwise.
 *
 * A model carries its own effort beside its window and its vision, in the row's own `models` schema, and
 * that setting is what the platform's picker applies as the default of a session — the picker reads
 * `reasoning.defaultEffort` here and does not remember a choice made in a chat. The route-level
 * `reasoningEffort` therefore stays as the answer for a model that names none, which is the case a row
 * written before this setting existed is in, and a model the catalogue never answered for keeps the same
 * answer. An empty string is "names none", not an effort.
 *
 * The name a row carries is the **vendor's own** level, chosen from the menu its model publishes on the
 * product's page: the platform's three words are this route's earlier vocabulary, and a row may still
 * carry one of them. The value is what the platform is told this route asks for ({@link modelInfo},
 * `defaultEffort`), so the declaration carries it too ({@link declaredEfforts}).
 *
 * What travels is exactly this value and nothing rewrites it on the way out: the wire takes a name a
 * model's menu does not publish (measured — a live turn carried `max` to a model whose menu is
 * `xhigh|low|medium` and was answered normally), so the row's level is the request itself.
 * @param {object} settings the generation's settings
 * @param {string} model the requested id
 * @returns {string} the effort to ask for
 */
export function effortOf(settings, model) {
  const declared = (settings.models ?? []).find((entry) => entry.id === model)
  const own = typeof declared?.effort === 'string' ? declared.effort : ''
  return own === '' ? settings.defaultReasoningEffort ?? '' : own
}
