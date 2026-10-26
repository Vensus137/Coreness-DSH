/**
 * Page Studio's host half: the switch, the model-facing set, and the door the General page's Page
 * Studio card reads.
 *
 * The row and the field belong to the platform's settings service; this plugin owns what the field
 * turns on. It stays applied while the switch is off — off means no tool, no skill and no routing
 * text, not no plugin — and it follows the field from the platform's own announcements, never from
 * a poll: a write reaches the running plugin, so the value is read again at every sync and every
 * assembly instead of being remembered from the mount.
 *
 * @module @coreness/studio
 */

import { Config } from './config.js'
import { live } from './live.js'
import { answerOf, ROUTE } from './route.js'
import { ROUTING, ROUTING_NAME, ROUTING_ORDER } from './routing.js'
import { skillOf } from './skill.js'
import { createSwitch } from './switch.js'
import { studioTools } from './tools/index.js'

export { Config }

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-studio'

/**
 * The three services the plugin cannot exist without: the two registries the set is made of and the
 * prompt registry the routing paragraph stands in. Everything else the feature reaches — the host
 * filesystem, the sandbox policy, the session directory, the subprocess door — is a scoped door
 * opened below, never a hard dependency: a hard one would hold this whole row — the settings
 * namespace, the General page's card and the switch itself — out of a composition that lacks it, and a
 * switch that cannot appear cannot turn anything off. A missing capability is said in words at the
 * mount and its tool stays unoffered while the rest of the feature stands.
 */
export const inject = ['tools', 'skills', 'systemPrompt']

/**
 * Mount the switch, the set and the door.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {void}
 */
export function apply(ctx, config) {
  const log = (message) => ctx.logger?.info?.(`${name}: ${message}`)
  const warn = (message) => ctx.logger?.warn?.(`${name}: ${message}`)
  /* The row's id in the composition is the settings namespace: one owner of the name, and a
     composition that mounts the package from another layer answers with that layer's id. */
  const ns = ctx.fiber?.entry?.options?.id ?? null
  const liveEnabled = () => live(config?.enabled) === true
  const skill = skillOf()

  /**
   * The two tools that reach no service of the composition: the look catalogue is a value and the
   * checker reads the folder straight from the disk. They answer in every composition, so withholding
   * them would repeat one level down the mistake the doors below exist to avoid.
   */
  const CORE_TOOLS = ['studio_looks', 'studio_check']

  /**
   * The two tools that do reach services, each door naming exactly what its tool touches: the build
   * writes through the host filesystem under the session's sandbox policy and working directory; the
   * capture adds the subprocess door that starts Edge.
   */
  const DOORS = [
    { services: ['fs', 'sandboxPolicy', 'workingDirectory'], tool: 'studio_build' },
    { services: ['fs', 'sandboxPolicy', 'workingDirectory', 'subprocess'], tool: 'studio_shot' },
  ]

  /* The doors that stand right now: the scoped context each one's tool is built with. */
  const openDoors = new Map()

  /* The definitions, built once per context they are offered in: the factory holds no state, so a
     second call for the same context would rebuild the same four values, and a name the module does
     not carry is a fault said here rather than a tool that silently does not arrive. */
  const built = new WeakMap()
  const toolOf = (inner, toolName) => {
    let tools = built.get(inner)
    if (tools === undefined) {
      tools = studioTools(inner)
      built.set(inner, tools)
    }
    const tool = tools.find((candidate) => candidate.name === toolName)
    if (tool === undefined) throw new Error(`the tools module carries no ${toolName}`)
    return tool
  }

  /* One set, one list: every registration is a record that names the door it came from, so a door
     that closes takes exactly its own tool and the rest of the set stands. */
  let disposers = []
  const register = (door, inner, toolName) => {
    disposers.push({ door, dispose: ctx.tools.register(toolOf(inner, toolName)) })
  }
  const on = () => {
    disposers.push({ door: 'core', dispose: ctx.skills.register(skill) })
    for (const toolName of CORE_TOOLS) register('core', ctx, toolName)
    for (const [index, inner] of openDoors) register(index, inner, DOORS[index].tool)
  }
  const off = () => {
    for (const record of disposers.splice(0).reverse()) record.dispose()
  }
  const modelFacing = createSwitch({ read: liveEnabled, on, off, say: warn })
  ctx.effect(() => () => off(), `${name}: the model-facing set`)
  /* The mount reports its own state in the line below; a change reports itself, because `apply` runs
     once and a log that stayed silent through a toggle would leave the set's arrival unseen. */
  const describeSet = () => {
    const tools = CORE_TOOLS.length + openDoors.size
    return `${tools === 4 ? 'four tools' : `${tools} tool(s)`}, the page-studio skill and the routing paragraph`
  }
  const sync = () => {
    if (!modelFacing.sync()) return
    log(modelFacing.active()
      ? `the set stands: ${describeSet()} are registered`
      : 'the set was disposed: no tool, no skill and no routing text')
  }
  modelFacing.sync()

  /* The platform's own announcement, for this row's namespace only: a write applies to the running
     plugin, and the event is what turns the write into a registration. A config reload is the same
     family — a hand edit of the profile's patch bypasses the form. */
  ctx.on('settings/document-updated', (changed) => {
    if (ns === null || changed === ns) sync()
  })
  /* The Loader's own seam, emitted to the owning fiber after a volatile commit. A direct
     `configEditor.edit` by another plugin never reaches the settings service, so it emits no
     document event; this listener is what keeps the set from standing stale behind such a write.
     The payload is deliberately not read: the sync reads the field again, so no path list can make
     it wrong, and a second event for the same value changes nothing. */
  ctx.on('loader/volatile-update', () => sync())
  ctx.on('app-boot/config-reload', () => sync())

  /* The doors. A composition that serves them mounts the tool with the set; one that does not keeps
     the switch, the routing text, the row and the route — the feature stays toggleable — and its
     missing capability is said in words below rather than as the absence of the whole feature. The
     registration follows the switch, not the door: a door that opens while the switch is off waits
     for the switch, and one that opens while it is on offers its tool at once. */
  for (const [index, door] of DOORS.entries()) {
    ctx.inject(door.services, (inner) => {
      openDoors.set(index, inner)
      if (modelFacing.active()) register(index, inner, door.tool)
      return () => {
        openDoors.delete(index)
        const closing = disposers.filter((record) => record.door === index)
        disposers = disposers.filter((record) => record.door !== index)
        for (const record of closing) record.dispose()
      }
    })
  }
  /* What this composition serves is answered by the service store itself, read through the door that
     declares nothing — not by the order two callbacks happened to run in. */
  for (const door of DOORS) {
    const absent = door.services.filter((service) => ctx.get(service) === undefined)
    if (absent.length === 0) continue
    log(`${door.tool} is not offered: this composition serves no ${absent.join(', ')}; the switch, the row and the rest of the set stand`)
  }

  /* Registered once, whatever the switch says: the text provider is read at every assembly and the
     platform drops an empty section. A section registered and removed per toggle would be a second
     owner of the same state. */
  ctx.systemPrompt.section({
    name: ROUTING_NAME,
    order: ROUTING_ORDER,
    text: () => (liveEnabled() ? ROUTING : ''),
    interpolate: false,
  })

  /* The route is registered in the scoped area Cordis gives a service that may be absent: without a
     web surface the switch still applies from the profile's config, and only the page's card is missing.
     GET answers the picture; POST is the write through the platform's own profile editor, so the page
     needs no settings plugin of its own. */
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: (request) => answerOf(ctx, request, warn, { config, modelFacing, ns }),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the switch's route`)
    log(`the switch's route stands at ${ROUTE}`)
  })
  if (ctx.get('connection') === undefined) {
    log(`this composition serves no page, so nothing reads ${ROUTE}: the switch still applies from the profile's config`)
  }

  log(`the switch is ${modelFacing.active() ? `on: ${describeSet()} stand` : 'off: no tool, no skill and no routing text'}; the settings namespace is ${ns ?? 'not addressed'}`)
}
