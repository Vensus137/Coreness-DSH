/**
 * The product's page fetch: the platform's HTTP fetch registered under the product's id, and the repair of
 * a shared web row's fetch selection the move left stale.
 *
 * The provider is a selection, not a replacement: it registers into the platform's web seam under an id of
 * its own and runs only while the shared `web` row names that id. The row belongs to the platform, and both
 * the product's page and the platform's own Web search page are doors to it; the latest save wins.
 *
 * The repair is the mount's one read of that row: the Qoder package registered its fetch under `qoder`, and
 * a profile may still name that id, or carry the null or empty value the old switch could leave — none
 * selects a provider, so the value is rewritten to the platform's own fetch once and a profile that never
 * opens the page again is not left with a dead or ambiguous selection.
 *
 * @module @coreness/fetch
 */

import { PROVIDER_ID, createFetchProvider } from './provider.js'

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-fetch'

/** The platform's shared web row: the fetch and search selections both doors write. */
const WEB_ROW = 'web'

/** The platform's own fetch id: the explicit off value of the product's provider. */
const PLATFORM_FETCH = 'http'

/** The id the Qoder package's fetch was registered under; a profile may still name it. */
const REMOVED_FETCH = 'qoder'

/**
 * The selections that pick no provider: the removed `qoder` id, and the null the old switch could leave. An
 * empty value is treated alike, since it names no registered provider; a nullish one is no configured id at
 * all — it resolves through the platform's fallback rules, which with several usable providers registered
 * makes the fetch ambiguous. A name this repair does not know is left as it stands, because the repair heals
 * the values the move left stale rather than every selection the platform would refuse.
 */
const SELECTS_NOTHING = new Set([REMOVED_FETCH, null, ''])

/**
 * Register the provider into the platform's web seam, and hand back the disposal.
 *
 * The seam rejects a duplicate id, and the disposer it returns is the one this plugin's effect carries: the
 * provider lives exactly as long as the fiber that registered it.
 * @param {object} web the platform's web service
 * @returns {() => void} the disposal
 */
export function registerFetchProvider(web) {
  const dispose = web.registerFetchProvider(createFetchProvider())
  return () => {
    if (typeof dispose === 'function') dispose()
  }
}

/**
 * The machine code the settings service answers a write whose expected revision the row has moved past.
 * The Qoder package's repair writes the same row at the same mount, so the first write here may meet it.
 */
const SETTINGS_CONFLICT = 'SETTINGS_CONFLICT'

/**
 * Rewrite a fetch selection the move left stale.
 *
 * The write carries the revision the read returned: a row saved through the other door between the two is
 * refused as a conflict rather than overwritten. The other package's repair writes the same row at the same
 * mount, so that refusal is not final — the row is read once more and the decision made again: a selection
 * another door has just chosen is fresh and is not overwritten, and a still-stale one is written with the
 * revision just read. A second refusal is said by the mount and left. A key that is absent is a row that
 * never chose, a name that selects a provider is another door's choice, and a name this repair does not
 * know is not judged here: none is touched. The row's other fields are left as they stand — the search
 * selection is another package's subject, and this repair owns the fetch value alone.
 * @param {object} settings the platform's settings service
 * @param {(message: string) => void} [warn] where the repair is said
 * @returns {Promise<'repaired'|'fresh'|'absent'>} the stale value written away, a selection left as it
 *   stands, or no shared row among the rows the service describes
 */
export async function repairFetchSelection(settings, warn = () => {}) {
  try {
    return await repairFetchSelectionOnce(settings, warn)
  } catch (error) {
    if (error?.code !== SETTINGS_CONFLICT) throw error
  }
  return repairFetchSelectionOnce(settings, warn)
}

/**
 * One read, one decision, one write: the attempt whose conflict the repair re-reads once.
 * @param {object} settings the platform's settings service
 * @param {(message: string) => void} warn where the repair is said
 * @returns {Promise<'repaired'|'fresh'|'absent'>} the attempt's outcome
 */
async function repairFetchSelectionOnce(settings, warn) {
  const row = settings.describe().find((one) => one.ns === WEB_ROW)
  if (row === undefined) return 'absent'
  if (!SELECTS_NOTHING.has(row.value?.fetchProvider)) return 'fresh'
  await settings.mutate(WEB_ROW, [{ op: 'set', path: ['fetchProvider'], value: PLATFORM_FETCH }], row.revision)
  warn(`the shared "${WEB_ROW}" row picked no fetch provider; its fetch selection was written to "${PLATFORM_FETCH}"`)
  return 'repaired'
}

/**
 * Run the repair once the Loader has settled every row.
 *
 * The settings service describes a row only while that row's own fiber is active, and a plugin may apply
 * before a row it reads does; the platform's own boot-time migration waits for the same settle. A
 * composition without a Loader cannot wait, and one without the shared row has nothing to repair: both are
 * said in words rather than passed over, so a skipped repair is never mistaken for one that found nothing.
 * @param {object} ctx the cordis context
 * @param {object} settings the platform's settings service
 * @param {(message: string) => void} log where the conditions of the place are said
 * @param {(message: string) => void} warn where the repair and its fault are said
 * @returns {Promise<void>} the repair, its outcome said in the log
 */
async function repairWhenSettled(ctx, settings, log, warn) {
  try {
    const settled = ctx.root?.loader?.await?.()
    if (typeof settled?.then !== 'function') {
      log(`this composition carries no Loader to wait for, so the shared "${WEB_ROW}" row is read without waiting for every row to settle`)
    } else {
      await settled
    }
    const outcome = await repairFetchSelection(settings, warn)
    if (outcome === 'absent') {
      log(`the shared "${WEB_ROW}" row is not in this composition, so no fetch selection was read`)
    }
  } catch (error) {
    warn(`the shared "${WEB_ROW}" row could not be repaired: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Mount the provider and the repair.
 *
 * Both surfaces are optional and each says in words what a composition without them leaves behind: a
 * composition without the web service registers nothing, and one without the settings service cannot read
 * the shared row, so a stale fetch selection is named rather than silently kept.
 * @param {object} ctx the cordis context
 * @returns {void}
 */
export function apply(ctx) {
  const log = (message) => ctx.logger?.info?.(`${name}: ${message}`)
  const warn = (message) => ctx.logger?.warn?.(`${name}: ${message}`)

  ctx.inject(['web'], (webCtx) => {
    webCtx.effect(() => {
      const dispose = registerFetchProvider(webCtx.web)
      log(`the product fetch provider is registered under "${PROVIDER_ID}"`)
      return dispose
    }, `${name}: the product fetch provider`)
  })
  if (ctx.get('web') === undefined) {
    log('this composition carries no web service, so the product fetch provider is not registered')
  }

  ctx.inject(['settings'], (settingsCtx) => {
    void repairWhenSettled(ctx, settingsCtx.settings, log, warn)
  })
  if (ctx.get('settings') === undefined) {
    log(`this composition carries no settings service, so the shared "${WEB_ROW}" row is not read: a fetch selection still naming "${REMOVED_FETCH}" is left as it stands`)
  }
}
