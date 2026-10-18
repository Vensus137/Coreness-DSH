/**
 * The two HTTP doors the product's page reads: the account's credits, and the route's live facts —
 * the node sweep, the vendor's catalogue and the value check. The answers are values, not refusals.
 *
 * @module @coreness/qoder/src/routes
 */

import { QoderError, requestIdOf, vendorWordsOf } from './in.js'
import { PROBE_ACTION, sweepNodes } from './probe.js'

/**
 * The action whose answer is the vendor's own catalogue, verbatim: the ids and the per-model reasoning
 * menu the vendor publishes, as the transport reads them.
 *
 * Verbatim and not projected: the page's row offers the menu it is handed, and a second shape here
 * would be a second opinion about the vendor's listing that could drift from the one the wire already
 * travels on (`modelsOf`).
 */
export const CATALOGUE_ACTION = 'catalogue'

/**
 * The action that asks the vendor whether it accepts the value the store holds: one exchange, and an
 * answer in a closed vocabulary of three (`verifyToken`).
 *
 * The credential store can only say that a value is *there*: a token that expired, was revoked, or
 * belongs to a deleted account reads as configured, and the first sign of trouble is a failed turn — the
 * owner replaced a token that was never at fault for exactly this reason. The answer is asked
 * of the vendor through the door every turn enters by, and it is asked when the value is handed over or
 * when the reader asks again, never on a tick: one exchange per press, and the exchange harms nobody
 * (two live job tokens of one personal token coexist).
 */
export const VERIFY_ACTION = 'verify'

/**
 * The vendor's own codes that are a statement **about the value**, and the whole list of them.
 *
 * Measured, each one: `105` and `TOKEN_EXPIRE` are the contour's two spellings of a value that is not
 * active (`sessionExpired` — the chat door writes the first, the REST door the second), and `BadRequest`
 * is what this call answers for a value it cannot accept at all — a wrong paste, measured live. A code
 * outside this list is not a judgement of the value however the
 * envelope is shaped: the contour answers `403` for an exhausted allowance as well (`{"code":"110"}`),
 * and our own `AUTH` says only that a status was 401 or 403.
 */
export const VALUE_REFUSED_CODES = Object.freeze(['105', 'TOKEN_EXPIRE', 'BadRequest'])

/**
 * The answer of one request on the widget's route.
 *
 * The status is 200 in both cases — `{ok:true, value}` or `{ok:false, error}`. A reading that failed is
 * **not** a refusal: it is a state of the widget (`last.kind`), and it travels as a value so the line can
 * say what the account answered instead of going blank.
 * @param {object} account the account, its picture and its sweeps
 * @param {Request} request the request
 * @param {(message: string) => void} warn where a refusal is said
 * @returns {Promise<Response>} the answer
 */
export async function answerOf(account, request, warn) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    if (request.method === 'GET') return json({ ok: true, value: account.picture() })
    const body = await bodyOf(request)
    if (body.action === 'read') {
      await account.sweep('a press')
      return json({ ok: true, value: account.picture() })
    }
    if (body.action === 'claim') {
      await account.claim(typeof body.campaignId === 'string' && body.campaignId !== '' ? body.campaignId : undefined)
      return json({ ok: true, value: account.picture() })
    }
    throw new QoderError(`the credits route knows no action "${String(body.action)}": it answers "read" and "claim"`, 'BAD_REQUEST')
  } catch (error) {
    warn(`the credits route refused a ${request.method}: ${codeOf(error)} — ${messageOf(error)}`)
    return json({ ok: false, error: { code: codeOf(error), message: messageOf(error) } })
  }
}

/** The code of a thrown value, when it carries one. */
const codeOf = (error) => (typeof error?.code === 'string' && error.code !== '' ? error.code : 'UNKNOWN')

/** The reason of a thrown value, in words. */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/**
 * The answer of one request on the page's route.
 *
 * The status is 200 in both cases — `{ok:true, value}` or `{ok:false, error}`. A sweep that could not
 * start at all — no token, a node map that does not answer — is a refusal: an empty list would read as
 * "no node answered", which is a different fact. One node's own failure is not: that is a result.
 *
 * `catalogue` answers the vendor's listing as the transport reads it, menus included, and knows no
 * argument: the credential it needs is the row's reference, which the transport resolves for itself
 * (`discoveredModels` — the same joint, and the platform's discovery door carries no field that would
 * say "the live one" either).
 *
 * `verify` puts the value behind the row's reference to the vendor and answers in a closed vocabulary
 * of three (`verifyToken`). Its outcome travels as a **result**, not as this route's refusal: "the
 * vendor does not accept this value" is an answer to the question that was asked, the way a node that
 * did not answer is a result of the sweep. A route-level refusal is kept for what went wrong with the
 * request itself.
 * @param {object} transport the route's transport, the one owner of a signed call to a node
 * @param {Request} request the request
 * @param {(message: string) => void} warn where a refusal is said
 * @param {() => Promise<string>} credential the value the row's reference resolves to, read per call
 * @returns {Promise<Response>} the answer
 */
export async function answerOfRoute(transport, request, warn, credential) {
  const json = (payload) => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  try {
    const body = await bodyOf(request)
    if (body.action === PROBE_ACTION) return json({ ok: true, value: await sweepNodes(transport) })
    if (body.action === CATALOGUE_ACTION) return json({ ok: true, value: { models: await transport.catalogue({ signal: request.signal }) } })
    if (body.action === VERIFY_ACTION) return json({ ok: true, value: await verifyToken(transport, credential, request.signal) })
    throw new QoderError(`this route knows no action "${String(body.action)}": it answers "${PROBE_ACTION}", "${CATALOGUE_ACTION}" and "${VERIFY_ACTION}"`, 'BAD_REQUEST')
  } catch (error) {
    warn(`the page's route refused a ${request.method}: ${codeOf(error)} — ${messageOf(error)}`)
    return json({ ok: false, error: { code: codeOf(error), message: messageOf(error), vendor: vendorDetailOf(error) } })
  }
}

/**
 * The vendor's own detail out of a refusal, as content rather than as a state: the sentence the vendor
 * sent and the request id it asked to be traced by, each where the body carried one, read by the two
 * readers of the body's fields. A surface draws the reason beside this; the body itself stays on the
 * error, and this is what a reader who wants the why reads where the project keeps content.
 *
 * This place renders a **sentence**, because the content line here is read in the flow: a user meets
 * it beside the state and acts on the words, with the id the vendor traces by standing marked at the
 * end. Where a row is opened on purpose to ask what the contour said, the body itself is the answer and
 * is handed over verbatim instead — one fact, two readers, and the shape follows the act of reading.
 * @param {unknown} error what the vendor refused with
 * @returns {string | null} the detail, or nothing when the body carried neither
 */
function vendorDetailOf(error) {
  const body = typeof error?.vendor === 'string' ? error.vendor : ''
  if (body === '') return null
  const words = vendorWordsOf(body)
  const requestId = requestIdOf(body)
  if (words === null && requestId === null) return null
  return `${words === null ? '' : `the vendor says: ${words}`}${requestId === null ? '' : `${words === null ? '' : ' · '}request id ${requestId}`}`
}

/**
 * The verdict: what the vendor said about the value the store holds.
 *
 * One exchange and no more, through the door every turn enters by — the same personal token to the same
 * address the transport itself would use — so an accepted value is proven by the door a turn uses and a
 * refusal carries the vendor's own words. Nothing is cached and nothing is kept: the job token this mints
 * has no reader of its own, and a second live job token of one personal token harms nobody.
 *
 * The answer is three-valued and closed, and the line between `refused` and `unsettled` is a **code the
 * vendor itself sent**, never a status of the envelope and never our own reading of it. The contour answers
 * `403` both for a value that is not active and for an account whose counted allowance is spent, and a status
 * cannot tell those apart: a reader told "the vendor refused this token" for the second would go and replace
 * a token that was never at fault — the very defect this action exists to prevent, read from the other side.
 * Only the codes measured to be about the value convict it, and everything else is `unsettled`: a queue, a
 * counted allowance, an answer that is not JSON, an empty body, a `404`, a `5xx`, no answer within the
 * control ceiling, a transport fault, a profile that holds no value, or a `200` that carried no job token —
 * a broken answer is not a judgement of the value either.
 */
export async function verifyToken(transport, credential, signal) {
  let token
  try {
    token = await credential()
  } catch (error) {
    return { outcome: 'unsettled', code: codeOf(error), vendorCode: null, vendor: vendorDetailOf(error), reason: messageOf(error) }
  }
  try {
    await transport.exchange(token, signal)
    return { outcome: 'accepted', code: null, vendorCode: null, vendor: null, reason: null }
  } catch (error) {
    const code = codeOf(error)
    const vendorCode = typeof error?.vendorCode === 'string' && error.vendorCode !== '' ? error.vendorCode : null
    const judged = vendorCode !== null && VALUE_REFUSED_CODES.includes(vendorCode)
    return judged
      ? { outcome: 'refused', code, vendorCode, vendor: vendorDetailOf(error), reason: messageOf(error) }
      : { outcome: 'unsettled', code, vendorCode, vendor: vendorDetailOf(error), reason: messageOf(error) }
  }
}

/**
 * The body of a request. A body that is not a JSON object is a refusal in words, not a crash.
 * @param {Request} request the request
 * @returns {Promise<object>} the body
 * @throws {QoderError} `BAD_REQUEST` when the body is not a JSON object
 */
async function bodyOf(request) {
  const text = await request.text().catch(() => '')
  try {
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('the body is not an object')
    return parsed
  } catch (error) {
    throw new QoderError(`the credits route's body is not a JSON object: ${messageOf(error)}`, 'BAD_REQUEST')
  }
}
