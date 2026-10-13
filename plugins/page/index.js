/**
 * The host half of the page plugin: the door a browser cannot open for itself.
 *
 * The component that draws the page lives in the browser half; this row exists so the package is an entry of
 * the composition — which is what gives the client half a record in the web shell's module graph — and so that
 * the things a browser cannot reach have a door where they live.
 *
 * The first is a sign-in: a browser cannot start one, because the platform carries the interaction with the
 * attempt, so whoever starts it must be able to reach the person. That is this route's `POST`, which hands one
 * request at a time to the desk beside this file — whether a row's server asks for OAuth at all, the attempt a
 * press starts, the answer to the flow's own question, the withdrawal of an attempt, and the removal of the
 * records the flow committed for one server.
 *
 * The second is the reason a row did not start. The platform keeps it — the error that ended the row's plugin
 * stands on the fiber the Loader holds — and publishes it nowhere: the inventory carries the phase alone, and
 * a browser reaches neither the Loader nor a fiber. So the same route answers what a failed row's own record
 * says, read where it stands.
 *
 * **The composition's own read is not here.** It used to be: a `GET` answering the rows the Loader's tree
 * holds and the live graph does not carry, which the page drew as a count and a line of names. What a profile
 * mounts is the platform's own component list to show — every row, its phase and its enablement — so that read
 * went with the roster it fed, and this route carries the sign-in door and the reason of a failed row alone.
 */

import { reasonsOf } from './reason.js'
import { ACTIONS as SIGNIN_ACTIONS, Refused, SignInDesk } from './signin.js'

/** The name the row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-page'

/** The service a sign-in is run through; the desk is built where it stands and withdrawn with it. */
const FLOW = 'oauthFlow'

/**
 * The action that reads the reason of a row that did not start.
 *
 * It is named here rather than in the desk's own list, because it is not the desk's: the sign-in's actions are
 * acts a press starts, and this one is a reading of the platform's own record. The route takes both, and this
 * is the one place the whole list is composed.
 */
export const REASONS = 'reasons'

/** Every action this route takes, in the order they are named to a request that asks for none of them. */
const ROUTE_ACTIONS = [...SIGNIN_ACTIONS, REASONS]

/**
 * The route is registered in a scoped area rather than declared as an injection: `connection` is the web
 * transport, and a plugin that declares it never applies where no page is served, which would take this
 * plugin's own route away with the surface it was written for. The area runs where the service stands, and the
 * plugin stands without it.
 */

/** The exact route the browser half reads this door through: one act per request, and one shape. */
export const ROUTE = '/api/coreness.page'

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * Mount the sign-in door.
 *
 * One thing and no more: the route, and the line that says where it stands when this composition carries no
 * web surface. Nothing is read until a request arrives.
 *
 * The desk's own life is the flow's: where the OAuth flow stands, a sign-in can be settled and the desk
 * exists; where it does not, the route answers that in words and no control is ever drawn. An attempt is
 * therefore lost with the flow that runs it, which is the honest reading of a process that has restarted — a
 * wait nothing can end is the one thing a surface must never draw.
 * @param {object} ctx the cordis context
 * @returns {void}
 */
export function apply(ctx) {
  let desk = null
  ctx.inject([FLOW], (flowCtx) => {
    flowCtx.effect(() => {
      desk = new SignInDesk({ flow: () => ctx.get(FLOW), registry: () => ctx.get('authorization') })
      return () => {
        desk?.dispose()
        desk = null
      }
    }, `${name}: the sign-in desk`)
  })

  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['POST'],
        /* The bridge reads no byte before the route declares how its body is handled, and a route that declares
           nothing is answered 400 rather than served. This one reads one JSON body: the act a press starts, the
           answer a person types into a question the flow asked, and the server whose records a removal drops. */
        requestBody: 'buffered',
        fetch: (request) => signInAnswer(ctx, request, desk),
      })
      return () => {
        void dispose()
      }
    }, `${name}: the sign-in door`)
  })
  if (ctx.get('connection') === undefined) {
    ctx.logger?.info?.(`${name}: this composition carries no web surface, so nothing serves ${ROUTE}`)
  }
}

/**
 * The door's one answer: what stands, or the refusal in words — 200 whatever happened.
 *
 * Every action it takes is answered here, the sign-in's and the reading's alike, and each is refused in its own
 * vocabulary's words. The refusals here are the door's own; a sign-in that the flow itself refuses is not an
 * answer to this request at all — the attempt outlives it, and its code and sentence stand in the state the
 * page reads.
 * @param {object} ctx the cordis context
 * @param {Request} request the request
 * @param {object | null} desk the sign-in desk, when the flow stands
 * @returns {Promise<Response>} the answer
 */
async function signInAnswer(ctx, request, desk) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    const body = await bodyOf(request)
    const action = typeof body?.action === 'string' ? body.action : ''
    if (!ROUTE_ACTIONS.includes(action)) {
      throw new Refused('signin-action', `this route takes ${ROUTE_ACTIONS.join(', ')}, and this request asks for ${action === '' ? 'no action' : `"${action}"`}`)
    }
    /* The reason of a row that did not start is read off the Loader itself, so it stands without the flow: a
       composition that carries no sign-in can still say why a row never came up. */
    if (action === REASONS) return json({ ok: true, value: { reasons: await reasonsOf(ctx, body.rows) } })
    if (desk === null) throw new Refused('no-flow', `this composition carries no ${FLOW}, so the page has no door to a sign-in`)
    if (action === 'sign-ins') return json({ ok: true, value: { signins: await desk.states(body.rows) } })
    if (action === 'sign-in') {
      return json({ ok: true, value: { signin: await desk.start({ server: body.server, resource: body.resource, entryId: body.entryId ?? null }) } })
    }
    if (action === 'answer') return json({ ok: true, value: { signin: await desk.answer({ server: body.server, value: body.value }) } })
    if (action === 'forget') return json({ ok: true, value: { forgotten: await desk.forget({ server: body.server }) } })
    return json({ ok: true, value: { signin: await desk.cancel({ server: body.server }) } })
  } catch (error) {
    /* One shape of refusal for the whole route, whichever vocabulary it came from: the desk's codes and the
       reading's are named apart, and a failure of neither is the door's own. */
    const code = error instanceof Refused ? error.code : 'signin-failed'
    const message = reasonOf(error)
    ctx.logger?.warn?.(`${name}: the page's door refused a request: ${code} — ${message}`)
    return json({ ok: false, error: { code, message } })
  }
}

/**
 * The body of one request of the sign-in door. A body that is not a JSON object is a refusal in words.
 * @param {Request} request the request
 * @returns {Promise<object>} the body
 * @throws {Refused} `signin-body` when the body cannot be read or is not an object
 */
async function bodyOf(request) {
  let text
  try {
    text = await request.text()
  } catch (error) {
    throw new Refused('signin-body', `the request body could not be read: ${reasonOf(error)}`)
  }
  try {
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('the body is not an object')
    return parsed
  } catch (error) {
    throw new Refused('signin-body', `the request body is not a JSON object: ${reasonOf(error)}`)
  }
}
