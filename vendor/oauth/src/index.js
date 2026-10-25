/**
 * The OAuth host: the flow, the person's step, and the one door the page's sign-in strip reads.
 *
 * This plugin owns the flow and the door to it — not the connection, not a row, not a field of the form.
 * It asks for the credential service because every store of the flow stands on that seam, and it
 * publishes what the steps after it need: the two calls of one server's authorization, the removal of
 * what they kept, the discovery, the PKCE and the vocabulary of refusals.
 *
 * The person's step is published only where the platform's own two seams stand: the authorization
 * registry and the browser carrier. A composition without them still gets the flow, and the desk below
 * still exists: a press that finds no registry is refused in words (`signin-failed`), not by the absence
 * of a route. The desk and the flow are one package, so `no-flow` is not a state this product can be in,
 * and the code does not exist.
 *
 * The door is registered in a **scoped area**: `connection` is the web transport, and a plugin that
 * declares it never applies where no page is served, which would take this plugin's route away with the
 * surface it was written for. The area runs where the service stands, and the plugin stands without it.
 *
 * @module @coreness/oauth
 */

import { begin, finish } from './authorize.js'
import { authorizationUrlFor, exchangeCode, refreshTokens, registerClient } from './flow.js'
import { discover, pointerOf, resourceMetadata, serverMetadata } from './discovery.js'
import { challengeOf, isVerifier, verifier } from './pkce.js'
import { NO_TOKEN, bearerExpression, referenceFor, tokenKeyOf } from './reference.js'
import { CALLBACK_PATH, PersonStep, callbackPathOf, redirectUrlFor } from './step.js'
import { RecordStores, idOf, keyOf, slugOf } from './stores.js'
import { CODES, Refusal, WORDS } from './refusals.js'
import { ACTIONS as SIGNIN_ACTIONS, Refused, SignInDesk } from './signin.js'

/** The name this plugin's row carries in the composition, and the name this plugin logs under. */
export const name = 'coreness-oauth'

/** The one service this plugin cannot stand without: the platform's credential records. */
export const inject = ['credentials']

/** The name the flow is published under, for the step that joins it to a row. */
export const FLOW = 'oauthFlow'

/** Every action this route takes, in the order they are named to a request that asks for none of them. */
const ROUTE_ACTIONS = SIGNIN_ACTIONS

/** The exact route the page's sign-in strip reads this door through: one act per request. */
export const ROUTE = '/api/coreness.signin'

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * Publish the flow and mount the two doors.
 *
 * The plugin holds no state of its own: every call carries the credential service it acts through, so a
 * reload of this row costs no authorization and two callers never share a store by accident. The person's
 * step is added when the platform's own seams arrive, and withdrawn with them; the desk stands with the
 * route, and is disposed with the plugin.
 * @param {object} ctx the cordis context
 * @returns {void}
 */
export function apply(ctx) {
  /* The service is resolved at every call and never held: a composition may reload the credential
     service underneath this plugin, and a captured reference then answers "disposed" for every store of
     every server — measured by a boot that reloaded the tree while a grant was being planted. */
  const credentialsNow = () => ctx.get('credentials')
  const flow = {
    /** Start an authorization: discovery, registration where allowed, a verifier, a state, an address. */
    begin: (options) => begin({ credentials: credentialsNow(), ...options }),
    /** Finish a browser step: the code back into the tokens the step commits. */
    finish: (options) => finish({ credentials: credentialsNow(), ...options }),
    /** The stores of one server, for the step that commits a grant or takes one back. */
    stores: (server) => new RecordStores(credentialsNow(), server),
    /** Drop every record this flow committed for one server, and answer what stood and went. */
    forget: (server) => new RecordStores(credentialsNow(), server).forget(),
    /** The credential id one server's store stands under, and the name a callback's path carries. */
    idOf,
    slugOf,
    keyOf,
    /** Where one server's token stands, and the expression a row's header reads it through. */
    tokenKeyOf,
    bearerExpression,
    reference: referenceFor,
    noTokenCode: NO_TOKEN,
    /** The path one server's callback stands at. */
    callbackPathOf,
    /** The route prefix every callback of this plugin stands under. */
    callbackPath: CALLBACK_PATH,
    /** The flow's own pieces, so a caller needs no second import path. */
    discover,
    resourceMetadata,
    serverMetadata,
    /* The pointer a `401` carries, by the rule the discovery itself reads it with: a caller settling
       whether a row's server asks for OAuth must not spell that reading a second time. */
    pointerOf,
    registerClient,
    authorizationUrlFor,
    exchangeCode,
    refreshTokens,
    pkce: { verifier, challengeOf, isVerifier },
    /** The vocabulary: every code with its sentence. */
    words: WORDS,
    codes: CODES,
    Refusal,
  }
  ctx.provide(FLOW, flow)

  ctx.inject(['authorization', 'webServer'], (personCtx) => {
    /* The step reads the store per call for the same reason the flow resolves it per call: the credential
       service may be replaced underneath, and a held reference would answer for nobody. */
    const step = new PersonStep({
      flow,
      webServer: personCtx.webServer,
      registry: personCtx.authorization,
      logger: personCtx.logger ?? null,
    })
    flow.person = step
    /** Offer one server's sign-in to the platform's own surface, and answer its callback's address. */
    flow.signIn = (request) => step.signIn(request)
    /** The address one server's callback stands at, computed from the carrier's own port. */
    flow.redirectUrlFor = (server) => redirectUrlFor(personCtx.webServer, server)
    personCtx.effect(() => () => {
      step.dispose()
      delete flow.person
      delete flow.signIn
      delete flow.redirectUrlFor
    })
  })

  /* The desk exists with the route: the flow and the route are one package, so a page that can reach the
     route can always ask for a sign-in, and a press that finds no registry is refused in words. Where the
     registry does not stand, `start` answers `signin-failed` — never a missing door. */
  const desk = new SignInDesk({ flow: () => ctx.get(FLOW), registry: () => ctx.get('authorization') })
  ctx.effect(() => () => {
    desk.dispose()
  }, `${name}: the sign-in desk`)

  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const dispose = connectionCtx.connection.fetch.register({
        path: ROUTE,
        methods: ['POST'],
        /* The bridge reads no byte before the route declares how its body is handled, and a route that
           declares nothing is answered 400 rather than served. This one reads one JSON body: the act a
           press starts, the answer a person types into a question the flow asked, and the server whose
           records a removal drops. */
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
 * Every action it takes is answered here, and each is refused in its own vocabulary's words. The refusals here are the door's own; a sign-in that the flow itself refuses is not an
 * answer to this request at all — the attempt outlives it, and its code and sentence stand in the state the
 * page reads.
 * @param {object} ctx the cordis context
 * @param {Request} request the request
 * @param {object} desk the sign-in desk; the flow and the route are one package, so it always stands
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
    if (action === 'sign-ins') return json({ ok: true, value: { signins: await desk.states(body.rows) } })
    if (action === 'sign-in') {
      return json({ ok: true, value: { signin: await desk.start({ server: body.server, resource: body.resource, entryId: body.entryId ?? null }) } })
    }
    if (action === 'answer') return json({ ok: true, value: { signin: await desk.answer({ server: body.server, value: body.value }) } })
    if (action === 'forget') return json({ ok: true, value: { forgotten: await desk.forget({ server: body.server }) } })
    return json({ ok: true, value: { signin: await desk.cancel({ server: body.server }) } })
  } catch (error) {
    /* One shape of refusal for the whole route: the desk's codes are named apart, and a failure of them is the
       door's own. */
    const code = error instanceof Refused ? error.code : 'signin-failed'
    const message = reasonOf(error)
    ctx.logger?.warn?.(`${name}: the sign-in door refused a request: ${code} — ${message}`)
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
