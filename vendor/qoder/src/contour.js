/**
 * The two Qoder contours: where each one answers, which site it belongs to — and the token calls every
 * one of them needs.
 *
 * The contours are one wire spoken at two addresses. A personal token is minted by one of them and is
 * refused by the other (`400 BadRequest`, measured), so the token itself decides which contour the route
 * reads; nothing about the account's plan or the customer is inferred from it and no token is ever
 * written down. A row that names its own `centerOrigin`/`openapiOrigin` — the shape the fixtures use — is
 * a custom contour and is never detected.
 *
 * The token calls live here rather than in the transport for one concrete reason: the transport is at
 * its line cap, and the exchange, the refresh and the profile are exactly the calls whose only
 * contour-dependent fact is the OpenAPI host. The ceilings, headers and errors are unchanged.
 *
 * @module @coreness/qoder/src/contour
 */

import { DEFAULT_CENTER_ORIGIN, DEFAULT_OPENAPI_ORIGIN, EXCHANGE_PATH, QoderError, REFRESH_PATH, USERINFO_PATH, VALUE_REFUSED_CODES, expiryOf, jsonOf, refusalOf } from './in.js'
import { normalizeNode } from './read.js'
import { tokenHeaders } from './sign.js'

/**
 * The two contours. `global` is the international one the route has always spoken; `cn` is the Chinese
 * one. The site origin is the page an account's own usage link belongs to, and the two addresses are
 * where the contour answers — facts of the contour, not settings.
 */
export const CONTOURS = Object.freeze({
  global: Object.freeze({
    id: 'global',
    centerOrigin: DEFAULT_CENTER_ORIGIN,
    openapiOrigin: DEFAULT_OPENAPI_ORIGIN,
    siteOrigin: 'https://qoder.com',
  }),
  cn: Object.freeze({
    id: 'cn',
    centerOrigin: 'https://gateway.qoder.com.cn',
    openapiOrigin: 'https://openapi.qoder.com.cn',
    siteOrigin: 'https://qoder.com.cn',
  }),
})

/** The values `region` admits: the automatic detection and the two contours by name. */
export const REGIONS = Object.freeze(['auto', 'global', 'cn'])

/**
 * The contour a row's own settings name, or `undefined` when the token has to decide.
 *
 * A `centerOrigin`/`openapiOrigin` that differs from the international defaults is a custom contour —
 * the shape a fixture passes — and no detection is attempted against it. An explicit `region` picks one
 * of the two known contours; `auto` leaves the choice to {@link detectContour}.
 * @param {{region?: string, centerOrigin?: string, openapiOrigin?: string}} [settings] the row
 * @returns {object | undefined} the pinned contour, or nothing when the token decides
 */
export function chosenContour({ region = 'auto', centerOrigin, openapiOrigin } = {}) {
  const center = centerOrigin === undefined || centerOrigin === '' ? DEFAULT_CENTER_ORIGIN : normalizeNode(centerOrigin, 'the Qoder centre')
  const openapi = openapiOrigin === undefined || openapiOrigin === '' ? DEFAULT_OPENAPI_ORIGIN : normalizeNode(openapiOrigin, 'the Qoder OpenAPI host')
  if (center !== CONTOURS.global.centerOrigin || openapi !== CONTOURS.global.openapiOrigin) {
    return Object.freeze({
      id: 'custom',
      centerOrigin: center,
      openapiOrigin: openapi,
      siteOrigin: CONTOURS.global.siteOrigin,
    })
  }
  if (region === 'global') return CONTOURS.global
  if (region === 'cn') return CONTOURS.cn
  return undefined
}

/**
 * The token calls of one contour: the exchange, the refresh and the profile.
 *
 * They are the same calls the transport made while it knew one contour; only the OpenAPI host travels
 * from the contour. `ceiling` is the transport's own control ceiling, passed in rather than declared
 * again: a second idea of how long this vendor may take is a second calibration nobody asked for.
 * @param {object} options the calls' facts
 * @param {typeof fetch} [options.fetchImpl] the transport
 * @param {(what: string, signal: AbortSignal | undefined, run: (signal: AbortSignal) => Promise<unknown>) => Promise<unknown>} options.ceiling the transport's control ceiling
 * @param {(message: string) => void} [options.warn] where a refusal's body is reported
 * @param {() => number} [options.now] the clock, for tests
 * @param {string} [options.userAgent] the harness's own attribution
 * @returns {{exchange: Function, refresh: Function, profile: Function}} the calls
 */
export function createTokenCalls({ fetchImpl = globalThis.fetch, ceiling, warn = () => {}, now = () => Date.now(), userAgent = 'coreness-dsh' } = {}) {
  const attribution = () => ({ 'user-agent': userAgent })

  /**
   * The exchange: the personal token goes in, a short-lived job token comes out.
   * @param {object} contour the contour whose OpenAPI host answers
   * @param {string} pat the personal token
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<object>} the session
   */
  async function exchange(contour, pat, signal) {
    return ceiling('the Qoder token exchange', signal, async (inner) => {
      const response = await fetchImpl(`${contour.openapiOrigin}${EXCHANGE_PATH}`, {
        method: 'POST',
        headers: { ...tokenHeaders(), ...attribution() },
        body: JSON.stringify({ personal_token: pat }),
        signal: inner,
      })
      if (!response.ok) throw await refusalOf(response, 'the Qoder token exchange', warn)
      const answer = await jsonOf(response, 'the Qoder token exchange')
      if (typeof answer.token !== 'string' || answer.token === '') {
        throw new QoderError('the Qoder token exchange returned no job token', 'AUTH')
      }
      return {
        jobToken: answer.token,
        jobRefreshToken: typeof answer.refresh_token === 'string' ? answer.refresh_token : '',
        expiresAt: expiryOf(answer, now()),
      }
    })
  }

  /**
   * The refresh: the refresh token goes in, a new job token comes out.
   * @param {object} contour the contour
   * @param {object} session the session to refresh
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<object>} the new session
   */
  async function refresh(contour, session, signal) {
    if (session.jobRefreshToken === '') throw new QoderError('the job token expired and no refresh token was issued', 'AUTH')
    return ceiling('the Qoder job token refresh', signal, async (inner) => {
      const response = await fetchImpl(`${contour.openapiOrigin}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { ...tokenHeaders(), ...attribution() },
        body: JSON.stringify({ refresh_token: session.jobRefreshToken }),
        signal: inner,
      })
      if (!response.ok) throw await refusalOf(response, 'the Qoder job token refresh', warn)
      const answer = await jsonOf(response, 'the Qoder job token refresh')
      if (typeof answer.token !== 'string' || answer.token === '') {
        throw new QoderError('the Qoder job token refresh returned no job token', 'AUTH')
      }
      return {
        jobToken: answer.token,
        jobRefreshToken: typeof answer.refresh_token === 'string' && answer.refresh_token !== '' ? answer.refresh_token : session.jobRefreshToken,
        expiresAt: expiryOf(answer, now()),
      }
    })
  }

  /**
   * The profile: the user id the signature cannot be built without.
   * @param {object} contour the contour
   * @param {string} jobToken the job token
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<object>} the identity
   */
  async function profile(contour, jobToken, signal) {
    return ceiling('the Qoder profile call', signal, async (inner) => {
      const response = await fetchImpl(`${contour.openapiOrigin}${USERINFO_PATH}`, {
        headers: { ...tokenHeaders({ json: false }), Authorization: `Bearer ${jobToken}`, ...attribution() },
        signal: inner,
      })
      if (!response.ok) throw await refusalOf(response, 'the Qoder profile call', warn)
      const answer = await jsonOf(response, 'the Qoder profile call')
      if (typeof answer.id !== 'string' || answer.id === '') {
        throw new QoderError('the Qoder profile call returned no user id', 'AUTH')
      }
      return {
        userID: answer.id,
        email: typeof answer.email === 'string' ? answer.email : '',
        name: typeof answer.name === 'string' && answer.name !== ''
          ? answer.name
          : typeof answer.username === 'string' ? answer.username : '',
      }
    })
  }

  return { exchange, refresh, profile }
}

/**
 * The automatic choice: exchange the token on both contours at once, keep the one that answers.
 *
 * The two exchanges run together because a contour that is blocked or slow must not delay the other;
 * the loser is aborted the moment a winner is known, so a first call costs one exchange, not two
 * finished ones. Two live job tokens of one personal token coexist by the vendor's own behaviour, so an
 * aborted loser leaves nothing behind.
 *
 * When both refuse, the error names both contours and never the token. It is `AUTH` only when **every**
 * attempt was a statement about the value (`BadRequest`, `105`, `TOKEN_EXPIRE`); otherwise the first
 * non-value code travels, so a timeout or a transport fault stays retryable rather than being reported
 * as a bad credential. The last attempt's own body stays on the error for the log, and its vendor code
 * is what the page's verify reads to decide `refused` from `unsettled`.
 * @param {{pat: string, calls: object, signal?: AbortSignal}} input the personal token and the calls
 * @returns {Promise<{contour: object, session: object}>} the winner
 * @throws {QoderError} the refusal of both
 */
export async function detectContour({ pat, calls, signal }) {
  const attempts = [CONTOURS.global, CONTOURS.cn].map((contour) => {
    const control = new AbortController()
    const fused = signal === undefined ? control.signal : AbortSignal.any([signal, control.signal])
    return { contour, control, session: calls.exchange(contour, pat, fused) }
  })
  try {
    const winner = await Promise.any(attempts.map((attempt) => attempt.session.then((session) => ({ contour: attempt.contour, session }))))
    for (const attempt of attempts) {
      if (attempt.contour.id !== winner.contour.id) attempt.control.abort()
    }
    return winner
  } catch (aggregate) {
    const errors = Array.isArray(aggregate?.errors) ? aggregate.errors : []
    const judged = (error) => VALUE_REFUSED_CODES.includes(error?.vendorCode)
    const allValue = errors.length > 0 && errors.every(judged)
    const first = errors.find((error) => !judged(error)) ?? errors.at(-1)
    const last = errors.at(-1)
    throw new QoderError(
      'the Qoder token was refused on both contours (qoder.sh and qoder.com.cn)',
      allValue ? 'AUTH' : (first?.code ?? 'AUTH'),
      {
        status: allValue ? undefined : first?.status,
        vendor: last?.vendor,
        vendorCode: allValue ? (first?.vendorCode ?? null) : null,
      },
    )
  }
}
