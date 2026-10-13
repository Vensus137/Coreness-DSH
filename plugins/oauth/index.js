/**
 * The plugin: the flow's own pieces, published on the context under one name.
 *
 * This plugin owns the flow and nothing else — not the connection, not a row, not a field of the form.
 * It asks for the credential service because every store of the flow stands on that seam, and it
 * publishes what the steps after it need: the three calls of one server's authorization, the removal of
 * what they kept, the provider the SDK asks for, the discovery, the PKCE and the vocabulary of refusals.
 *
 * The person's step is published too, but only where the platform's own two seams stand: the
 * authorization registry and the browser carrier. A composition without them still gets the flow — it
 * simply has no surface to offer and no callback to answer, which is a fact about the composition
 * rather than a fault of this plugin.
 *
 * @module @coreness/dsh/plugins/oauth
 */

import { begin, finish, refresh } from './authorize.js'
import { authorizationUrlFor, exchangeCode, refreshTokens, registerClient } from './flow.js'
import { discover, pointerOf, resourceMetadata, serverMetadata } from './discovery.js'
import { challengeOf, isVerifier, verifier } from './pkce.js'
import { FlowProvider } from './provider.js'
import { NO_TOKEN, bearerExpression, referenceFor, tokenKeyOf } from './reference.js'
import { CALLBACK_PATH, PersonStep, callbackPathOf, redirectUrlFor } from './step.js'
import { RecordStores, idOf, keyOf, slugOf } from './stores.js'
import { CODES, Refusal, WORDS } from './refusals.js'

/** The name this plugin's row carries in the composition. */
export const name = 'coreness-oauth'

/** The one service this plugin cannot stand without: the platform's credential records. */
export const inject = ['credentials']

/** The name the flow is published under, for the step that joins it to a row. */
export const FLOW = 'oauthFlow'

/**
 * Publish the flow on the context.
 *
 * The plugin holds no state of its own: every call carries the credential service it acts through, so a
 * reload of this row costs no authorization and two callers never share a store by accident. The
 * person's step is added when the platform's own seams arrive, and withdrawn with them.
 * @param {object} ctx the cordis context
 * @returns {void}
 */
export function apply(ctx) {
  /* The service is resolved at every call and never held: a composition may reload the credential
     provider underneath this plugin, and a captured reference then answers "disposed" for every store of
     every server — measured by a boot that reloaded the tree while a grant was being planted. */
  const credentialsNow = () => ctx.get('credentials')
  const flow = {
    /** Start an authorization: discovery, registration where allowed, a verifier, a state, an address. */
    begin: (options) => begin({ credentials: credentialsNow(), ...options }),
    /** Finish a browser step: the code back into stored tokens. */
    finish: (options) => finish({ credentials: credentialsNow(), ...options }),
    /** Rotate a stored grant. */
    refresh: (options) => refresh({ credentials: credentialsNow(), ...options }),
    /** The provider the SDK asks for, over the same stores. */
    provider: (options) => new FlowProvider({ credentials: credentialsNow(), ...options }),
    /** The stores of one server, for a caller that wants them without a provider. */
    stores: (server) => new RecordStores(credentialsNow(), server),
    /** Drop every record this flow committed for one server, and answer what stood and went. */
    forget: (server) => new RecordStores(credentialsNow(), server).forget(),
    /** The credential id one server's store stands under, and the folded name a callback's path carries. */
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
    /* The step reads the store per call for the same reason the flow resolves it per call: the provider
       may be replaced underneath, and a held reference would answer for nobody. */
    const step = new PersonStep({
      flow,
      credentials: { readRecord: (key) => credentialsNow().readRecord(key) },
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
}
