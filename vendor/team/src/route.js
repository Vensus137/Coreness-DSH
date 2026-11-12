/**
 * The team picture: what a surface reads, and what the patch last left.
 *
 * The answer is assembled at the moment the page asks, never held: the platform's team service may be
 * absent from a composition, the two switches move through the platform's settings service while the
 * page stands open, and the policy outcome changes at the next team assembly. Nothing of the platform's
 * own team row is read: the release this product follows removed the member ceiling from the row and
 * refuses to activate with it, so the page has no field left to show, only the team's presence and the
 * product's own switches.
 */

import { outcomeOf } from './policy.js'
import { live } from './live.js'

/** The code a thrown value carries, or the one this door gives a value that carries none. */
const codeOf = (error) => (typeof error?.code === 'string' && error.code !== '' ? error.code : 'UNKNOWN')

/** The reason of a thrown value, in words. */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * The team as a surface reads it.
 *
 * `mounted` is the platform's team service — the roster, the mailbox and the board — and not this plugin:
 * a composition may carry the plugin while the service is absent. `prompt` and `review` are the two
 * switches as the page draws them; the review one stands inside the text the prompt one supplies. `policy`
 * is the outcome of the last team assembly the patch met, or `null` until the first team assembly meets
 * it. `ns` is the settings namespace the switches are written through: the row's own id in the composition,
 * so the page reads one owner rather than carrying a second copy of the name. A composition that addresses
 * no row answers `null`, and the page then draws no switch.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @returns {{mounted: boolean, prompt: boolean, review: boolean, policy: string|null, ns: string|null}} the picture
 */
export function stateOf(ctx, config) {
  return {
    mounted: ctx.get('agentTeams') !== undefined,
    prompt: live(config?.prompt) === true,
    review: live(config?.review) === true,
    policy: outcomeOf(),
    ns: ctx.fiber?.entry?.options?.id ?? null,
  }
}

/**
 * The answer of the route's one request: the picture, or a fault said in words.
 *
 * The status is 200 in both cases — `{ok:true, value}` or `{ok:false, error}` — as the product's other
 * routes answer: a refusal is a state of the page, and its words are what the page shows. The route serves
 * a read alone; the two switches are written through the platform's settings service, and a request with
 * another method never reaches this handler.
 * @param {object} ctx the cordis context
 * @param {object} config the plugin's resolved config
 * @param {(message: string) => void} [warn] where a fault of this door is said
 * @returns {Promise<Response>} the answer
 */
export async function answerOf(ctx, config, warn = () => {}) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    return json({ ok: true, value: stateOf(ctx, config) })
  } catch (error) {
    warn(`the team route could not build its picture: ${codeOf(error)} — ${messageOf(error)}`)
    return json({ ok: false, error: { code: codeOf(error), message: messageOf(error) } })
  }
}
