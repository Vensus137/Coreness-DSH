/**
 * The product's fetch proxy: one stored proxy URL, one check, and the `web_fetch` call wrapped at the
 * platform's `tools/execute` seam.
 *
 * The card's URL is a secret in the platform credential store: this plugin's config carries only the
 * credential reference, resolved per call. The switch and the reference are volatile, so the page moves
 * them on the running row without a re-mount; both are read at every call, never captured at the mount.
 *
 * The gate is registered while the tools service stands and disposed with it; the route is registered
 * inside the connection's scoped area and disposed with it. Every optional service missing here is said
 * in words — a composition without the tools service, the web surface, the credential store or the
 * settings service leaves a named part of the module out rather than a silent half that cannot act.
 *
 * @module @coreness/proxy
 */

import { Config } from './config.js'
import { ROUTE, answerOf } from './route.js'
import { createGate } from './gate.js'

export { Config, ROUTE }

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-proxy'

/**
 * Mount the gate and the route.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {void}
 */
export function apply(ctx, config) {
  const log = (message) => ctx.logger?.info?.(`${name}: ${message}`)
  const warn = (message) => ctx.logger?.warn?.(`${name}: ${message}`)
  /* The gate keeps its own once-per-subject memory; this is only the level split. */
  const say = (level, message) => {
    if (level === 'warn') warn(message)
    else log(message)
  }

  ctx.inject(['tools'], (toolsCtx) => {
    /* Registered on the injected context and disposed with it: a tools reload replaces the gate instead
       of stacking a second listener beside it. The gate takes that same context because a service property
       on a context that did not declare it throws in Cordis, not `undefined`. */
    toolsCtx.effect(() => {
      const dispose = toolsCtx.on('tools/execute', createGate(toolsCtx, config, say))
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
        fetch: (request) => answerOf(ctx, request, warn, config),
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
}
