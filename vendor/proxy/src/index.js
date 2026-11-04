/**
 * The product's fetch proxy: one stored proxy URL, one check, a `web_fetch` call wrapped at the
 * platform's `tools/execute` seam, and a standing policy for the whole harness traffic.
 *
 * The card's URL lives in the platform credential store: this plugin's config carries only the
 * credential reference, resolved per call. The switches and the reference are volatile, so the page moves
 * them on the running row without a re-mount; all are read live, never captured at the mount. A volatile
 * write does not restart the plugin — the loader announces it on `loader/volatile-update`, and the
 * standing policy reconciles against that announcement — while a config change that does restart the
 * plugin disposes the policy with the plugin's effect. The credential store may still be arriving at
 * mount, so the install waits for it in the seam where it stands; the absence is a failure only once the
 * loader has settled.
 *
 * The gate is registered while the tools service stands and disposed with it; the route is registered
 * inside the connection's scoped area and disposed with it; the standing policy lives in its own effect.
 * Every optional service missing here is said in words — a composition without the tools service, the web
 * surface, the credential store or the settings service leaves a named part of the module out rather than
 * a silent half that cannot act.
 *
 * @module @coreness/proxy
 */

import { Config } from './config.js'
import { ROUTE, answerOf } from './route.js'
import { createGate } from './gate.js'
import { VOLATILE_UPDATE, createStanding } from './standing.js'

export { Config, ROUTE }

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-proxy'

/**
 * Mount the gate, the route and the standing policy.
 *
 * Async so the mount can do its own work in order; it does not wait for the credential store, which the
 * composition provides later. The standing policy is installed while the app boots, as soon as that store
 * stands, and before the web surface serves, so the first request after a restart with the switch on
 * already takes the proxy. An install failure is said and swallowed — the switch keeps its stored state,
 * and a rejected mount would take the whole card down with it.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {Promise<void>} settled when the mount finished
 */
export async function apply(ctx, config) {
  const log = (message) => ctx.logger?.info?.(`${name}: ${message}`)
  const warn = (message) => ctx.logger?.warn?.(`${name}: ${message}`)
  /* The gate and the standing policy keep their own once-per-subject memory; this is only the level split. */
  const say = (level, message) => {
    if (level === 'warn') warn(message)
    else log(message)
  }

  const standing = createStanding(ctx, config, say)
  ctx.effect(() => {
    const off = ctx.on(VOLATILE_UPDATE, () => standing.reconcile())
    return async () => {
      off()
      await standing.stop()
    }
  }, `${name}: the standing proxy policy`)

  ctx.inject(['credentials'], (readyCtx) => {
    /* The mount config carries the switch, but the credential store may still be arriving: the stored URL
       cannot be read without it. This reconcile then runs where the store stands — already at mount, or
       later when it arrives — so a restart with the switch on still installs before the first request. A
       reconcile against the same stored URL installs nothing twice. */
    readyCtx.effect(async () => {
      await standing.reconcile()
      return () => {}
    }, `${name}: the standing proxy policy’s credential seam`)
  })

  ctx.inject(['loader'], (loaderCtx) => {
    /* Once the loader has settled, a credential store that is absent is a fact of the composition rather
       than a service still arriving: this is where the genuine no-store line is said. Disposal disposes
       effects concurrently and awaits them instead of cancelling them, so the wait can wake after the
       policy was stopped; the flag keeps that wake from installing a policy no disposer owns. */
    loaderCtx.effect(() => {
      let disposed = false
      const settle = async () => {
        try {
          await loaderCtx.get('loader')?.await?.()
        } catch {
          return
        }
        if (disposed) return
        await standing.reconcile()
      }
      void settle()
      return () => {
        disposed = true
      }
    }, `${name}: the standing proxy policy’s settled view`)
  })

  ctx.inject(['tools'], (toolsCtx) => {
    /* Registered on the injected context and disposed with it: a tools reload replaces the gate instead
       of stacking a second listener beside it. The gate takes that same context because a service property
       on a context that did not declare it throws in Cordis, not `undefined`. The controller comes along so
       the gate stands down only while a policy it installed actually stands. */
    toolsCtx.effect(() => {
      const dispose = toolsCtx.on('tools/execute', createGate(toolsCtx, config, say, standing))
      return () => {
        void dispose()
      }
    }, `${name}: the web_fetch gate`)
    log(`the "web_fetch" gate stands at tools/execute`)
  })
  if (ctx.get('tools') === undefined) {
    log('this composition carries no tools service, so page fetches are never routed through the proxy')
  }

  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: (request) => answerOf(ctx, request, warn, config, () => standing.reconcile()),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the proxy route`)
    log(`the proxy route stands at ${ROUTE}`)
  })
  if (ctx.get('connection') === undefined) {
    log(`this composition carries no web surface, so nothing serves ${ROUTE}`)
  }

  if (ctx.get('credentials') === undefined) {
    log('this composition carries no credentials service, so the stored proxy URL cannot be read and page fetches go direct')
  }
  if (ctx.get('settings') === undefined) {
    log('this composition carries no settings service, so the proxy switch is read-only')
  }

  await standing.start()
}
