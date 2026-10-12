/**
 * The MCP plugin: the picture of the profile's servers file, and the one door the page reads and writes it
 * through.
 *
 * **The platform owns everything here except the picture and the hand.** A server is a row of an entry list
 * the Loader reads, writes and watches, and one row is one client instance that connects by itself, registers
 * its tools on the tools service under `mcp__<serverName>__`, and contributes its resources and its instruction
 * text to the model. There is no UI for those rows anywhere in the harness, and the platform's own plugin
 * manager cannot switch them: a row inside an include file is reported `readOnlyReason: "unaddressable"`, so
 * its page lists such a row and cannot change it.
 *
 * So this plugin holds no MCP client, no connection state of its own and no registry: the rows come from the
 * servers file through the Loader's own tree, the phase and the platform's own `readOnlyReason` from the plugin
 * manager's inventory, and the tools from the tools service, where a tool is attributed to a server by the
 * prefix the platform's own client builds. **The reason a server is not up is published nowhere, but the
 * platform writes it** — the client logs its failure and its kind through the logger, whose only sink in this
 * build is an in-memory ring, so the words reach nobody. This plugin registers a receiver of its own and
 * carries the host's own line about a row into the picture, quoted, beside the phase and the tools.
 *
 * The door is one exact route on the connection, answering JSON with its own refusals in words: `GET` is the
 * picture, `POST` is one save, and every save is confirmed by reading the tree back.
 *
 * @module @coreness/dsh/plugins/mcp
 */

import { pictureOf } from './picture.js'
import { fileOf, includeOf, rowsOf } from './tree.js'
import { troubleStore } from './trouble.js'
import { Refusal, write } from './write.js'

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-mcp'

/**
 * The services the plugin stands on: the Loader's tree, the inventory and the tools.
 *
 * `connection` is **not** declared. It is the web transport, and the composition that mounts the web
 * application owns both of its ends — so a plugin that declares it never applies where no page is
 * served, which would take this plugin's own servers, its picture and its write path away together
 * with the route. The route is registered in a scoped area instead, and the plugin stands without it.
 */
export const inject = ['loader', 'pluginManager', 'tools']

/** The exact route of this plugin: a plain `fetch` from the page, behind the connection's own fence. */
export const ROUTE = '/api/coreness.mcp'

/**
 * The row of the servers file, as the product's bundle patch declares it:
 * `{ id: "mcp-servers", name: "cordis:include", config: { initial: [] } }`, with `path` naming the
 * servers file beside the profile's composition.
 *
 * The path is resolved against the profile's directory, so the servers live in a file of their own
 * beside the composition and not inside a patch — one file, one writer, and the rows stay a list a
 * user can read.
 */
export const INCLUDE_ID = 'mcp-servers'

/** The module an include row of the platform's own Loader is named by. */
const INCLUDE_MODULE = 'cordis:include'

/**
 * The servers file this composition declares: the include row, the path it mounts, and the rows as
 * the Loader's tree holds them.
 *
 * The row is found by the address the inventory publishes rather than by a hand-built path: the
 * composition may carry its own rows inside a group, and the address is the identity the Loader
 * resolves. A row that is declared and cannot be resolved is a state of the picture with the
 * Loader's own words — never a substituted empty picture.
 * @param {object} ctx the plugin's context
 * @returns {Promise<object>} the inventory, the address, the entry and why it cannot be read
 */
async function serverFile(ctx) {
  const inventory = await ctx.pluginManager.listPlugins()
  const found = inventory.find((row) => String(row?.moduleName ?? '') === INCLUDE_MODULE
    && (String(row?.entryId ?? '') === INCLUDE_ID || String(row?.entryId ?? '').endsWith(`:${INCLUDE_ID}`)))
  if (found === undefined) return { inventory, address: null, entry: null, unable: null, enabled: null, phase: null }

  const address = String(found.entryId)
  const { entry, unable } = includeOf(ctx, address)
  return { inventory, address, entry, unable, enabled: found.enabled === true, phase: found.fiberPhase ?? null }
}

/**
 * The picture as the page reads it.
 * @param {object} ctx the plugin's context
 * @param {object} trouble the host's own lines about the servers
 * @returns {Promise<object>} the picture
 */
async function picture(ctx, trouble) {
  const file = await serverFile(ctx)
  const schemas = ctx.tools.schemas()
  return pictureOf({
    include: file.address === null
      ? null
      : { entryId: file.address, path: file.entry === null ? null : fileOf(file.entry), enabled: file.enabled, phase: file.phase },
    rows: file.entry === null ? [] : rowsOf(file.entry),
    inventory: file.inventory,
    schemas,
    unable: file.unable,
    trouble,
  })
}

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * The answer of one request: the picture, or the outcome of a save and the picture it left behind.
 *
 * `json` answers 200 whatever happened — `{ok:true, value}` or `{ok:false, error:{code, message}}` — and
 * the page draws the code's own words and the host's detail beside them.
 * @param {object} ctx the plugin's context
 * @param {object} trouble the host's own lines about the servers
 * @param {Request} request the request
 * @returns {Promise<Response>} the answer
 */
async function answer(ctx, trouble, request) {
  try {
    if (request.method === 'GET') return json({ ok: true, value: await picture(ctx, trouble) })

    const file = await serverFile(ctx)
    if (file.entry === null) {
      throw new Refusal('no-file', file.unable === null
        ? `this composition declares no "${INCLUDE_ID}" row, so the servers file has no writer here`
        : `the row "${file.address}" could not be read: ${file.unable}`)
    }
    const outcome = await write(ctx, file.entry, await bodyOf(request))
    return json({ ok: true, value: { ...await picture(ctx, trouble), ...outcome } })
  } catch (error) {
    const refusal = error instanceof Refusal ? error : new Refusal(request.method === 'POST' ? 'write-failed' : 'unreadable', reasonOf(error))
    ctx.logger?.warn?.('coreness-mcp: %C — %C', refusal.code, refusal.message)
    return json({ ok: false, error: { code: refusal.code, message: refusal.message } })
  }
}

/**
 * The body of a save. A body that is not a JSON object is a refusal in words, not a crash.
 * @param {Request} request the request
 * @returns {Promise<object>} the body
 * @throws {Refusal} `bad-value` when the body is not a JSON object
 */
async function bodyOf(request) {
  let text
  try {
    text = await request.text()
  } catch (error) {
    throw new Refusal('bad-value', `the request body could not be read: ${reasonOf(error)}`)
  }
  try {
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('the body is not an object')
    return parsed
  } catch (error) {
    throw new Refusal('bad-value', `the request body is not a JSON object: ${reasonOf(error)}`)
  }
}

/**
 * One JSON answer.
 * @param {object} payload the answer
 * @returns {Response} the response
 */
function json(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

/**
 * Register the plugin's door, and the receiver that keeps the host's own words about the servers.
 *
 * The receiver is registered inside an effect of this plugin's own fiber because the logger service
 * holds *its* effects on the root (the service is built with the root
 * context, and `exporter()` registers there), so a receiver left to the service's own bookkeeping
 * would outlive this plugin — a reload of the profile would leave one piled on another, each holding
 * the lines of servers nobody is showing any more. The effect makes the receiver live exactly as long
 * as the plugin, and its ring with it.
 *
 * A consequence worth knowing: lines written before this plugin mounted are not seen. The service's own
 * in-memory ring keeps them, but the service exposes no way to read it, so a broken row that spoke
 * before the plugin was there shows nothing until its next attempt — and a row that gave up before the
 * plugin mounted shows nothing at all.
 *
 * @param {object} ctx the cordis context
 * @returns {void}
 */
export function apply(ctx) {
  const trouble = troubleStore()
  ctx.effect(() => {
    const drop = ctx.logger.exporter(trouble.receiver)
    return () => {
      drop()
    }
  }, `${name}: the receiver of the host's own words about a server`)

  /* The route, in the scoped area Cordis gives a service that may be absent: the area runs where
     `connection` is — at the mount, or in a composition that gains the web surface later — and its
     effect lives and dies with it. Where the area never runs, the line below says so. */
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: (request) => answer(ctx, trouble, request),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the servers route`)
  })
  if (ctx.get('connection') === undefined) {
    ctx.logger?.info?.(`${name}: this composition carries no web surface, so nothing serves ${ROUTE} — the servers, their picture and the write path stand without it`)
  }
}
