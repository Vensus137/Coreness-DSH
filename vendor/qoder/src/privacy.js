/**
 * The account's data-sharing policy: the read the credits widget shows, and the one write the `Stop sharing`
 * press makes.
 *
 * The policy is account-level and server-side, not an app preference: `GET`/`PUT
 * `{openapi}/api/v1/me/data-policy` with the **job token** (the personal token alone answers `401`).
 * The answer is `{share_enabled, can_update, source, plan_tier?}`; `can_update` is the plan's own
 * statement about whether the account may change it, and a Chinese trial answers `false` while still
 * sharing — a `200` to the PUT changes nothing there, which is why the press reads the policy again
 * instead of trusting the status.
 *
 * The write carries the client version the vendor's client sends and
 * the app's own headers: the job token, `Cosy-ClientType: 5`, `User-Agent: Qoder`. The per-request
 * `Cosy-Data-Policy` header the chat route sends is a different thing and is not this setting.
 *
 * @module @coreness/qoder/src/privacy
 */

import { QoderError, jsonOf, refusalOf } from './in.js'

/** The account's data-policy path on the contour's OpenAPI host. */
export const DATA_POLICY_PATH = '/api/v1/me/data-policy'

/** The client version the update names: the vendor's own field, measured on the live route. */
export const LINGMA_VERSION = '0.4.9'

/**
 * The policy out of the vendor's answer, strict about the three fields the widget draws.
 * @param {unknown} payload the answer's body
 * @returns {{share_enabled: boolean, can_update: boolean, source: string, plan_tier: string | undefined}} the policy
 * @throws {QoderError} `MALFORMED_RESPONSE` when the body is not the shape the route reads
 */
export function parseDataPolicy(payload) {
  const policy = payload !== null && typeof payload === 'object' && !Array.isArray(payload) ? payload : undefined
  const valid = policy !== undefined
    && typeof policy.share_enabled === 'boolean'
    && typeof policy.can_update === 'boolean'
    && typeof policy.source === 'string'
    && policy.source !== ''
  if (!valid) {
    throw new QoderError('the Qoder data-policy answer did not carry share_enabled, can_update and source', 'MALFORMED_RESPONSE')
  }
  return {
    share_enabled: policy.share_enabled,
    can_update: policy.can_update,
    source: policy.source,
    plan_tier: typeof policy.plan_tier === 'string' && policy.plan_tier !== '' ? policy.plan_tier : undefined,
  }
}

/**
 * One data-policy call, under the transport's own control ceiling.
 * @param {object} call the call
 * @param {string} call.what the call's name for a refusal
 * @param {'GET' | 'PUT'} call.method the method
 * @param {string} call.jobToken the job token
 * @param {string} call.openapiOrigin the contour's OpenAPI host
 * @param {typeof fetch} call.fetchImpl the transport
 * @param {Function} call.ceiling the transport's control ceiling
 * @param {AbortSignal} [call.signal] the caller's cancellation
 * @param {(message: string) => void} [call.warn] where a refusal's body is reported
 * @param {object} [call.body] the JSON body of a write
 * @returns {Promise<object>} the policy
 */
async function callPolicy({ what, method, jobToken, openapiOrigin, fetchImpl, ceiling, signal, warn = () => {}, body }) {
  return ceiling(what, signal, async (inner) => {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${jobToken}`,
      'Cosy-ClientType': '5',
      'User-Agent': 'Qoder',
      ...body === undefined ? {} : { 'Content-Type': 'application/json' },
    }
    const response = await fetchImpl(`${openapiOrigin}${DATA_POLICY_PATH}`, {
      method,
      headers,
      ...body === undefined ? {} : { body: JSON.stringify(body) },
      signal: inner,
    })
    if (!response.ok) throw await refusalOf(response, what, warn)
    return jsonOf(response, what)
  })
}

/**
 * Read the account's data-sharing policy.
 * @param {object} options the call
 * @returns {Promise<object>} the policy
 */
export async function readDataPolicy(options) {
  return parseDataPolicy(await callPolicy({ what: 'the Qoder data-policy read', method: 'GET', ...options }))
}

/**
 * Ask the contour to stop sharing the account's data.
 * @param {object} options the call
 * @returns {Promise<object>} the vendor's answer
 */
export async function writeDataPolicy(options) {
  return callPolicy({
    what: 'the Qoder data-policy change',
    method: 'PUT',
    ...options,
    body: { share_enabled: false, lingma_version: LINGMA_VERSION },
  })
}
