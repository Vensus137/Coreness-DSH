/**
 * The account's credits: the balance, the campaigns, and taking a reward.
 *
 * The three calls are not the chat wire and do not carry its headers: the contour refuses an account
 * call that arrives with the COSY signature, so these go out with a plain `Bearer` of the same job
 * token, the machine id twice (`X-Machine-ID`, `X-Session-ID`) and the site's origin. The campaigns
 * are shown only to a client that introduces itself as the desktop one (`cosy-clienttype: 10`,
 * `cosy-version`) — otherwise the server answers `showCampaign: false` and an empty list **without an
 * error**, which is why "hidden" and "no campaigns" are two states here and in the widget.
 *
 * The wire facts: the paths, the headers, the field names, and the rule that a repeated claim answers
 * `200` with a replay mark instead of an error.
 *
 * `claimable` is decided **here**, on the host side, and travels to the widget finished: a flag
 * computed in two places — the half that parses the list and the half that draws the mark — drifts
 * apart on the next field the vendor adds.
 *
 * The parsers are strict about the shape and soft about the fields: an answer that is not an object,
 * or that carries no list where a list belongs, is a refusal in words; a field the contour did not
 * send is left out rather than filled with a zero, because a zero would read as a fact.
 *
 * @module @coreness/qoder/src/credits
 */

import { DEFAULT_CONTROL_CEILING_MS, QoderError, bounded, codeFor, jsonOf } from './in.js'
import { CONTOURS } from './contour.js'

/** The balance of the account. */
export const QUOTA_PATH = '/api/v2/quota/usage'
/** The campaign list, and the base of a reward's own address. */
export const CAMPAIGNS_PATH = '/sash/api/v1/me/campaigns'
/** The client type the contour shows the campaign list to — the desktop one. */
export const DESKTOP_CLIENT_TYPE = '10'
/** The version that travels beside the client type; the contour's own value, not a choice. */
export const DESKTOP_VERSION = '1.32.2'

/**
 * The statuses that mean a reward is out of reach: already taken, closed to this account, or expired.
 * A campaign that carries another status is claimable when its action is the claiming one.
 */
export const UNCLAIMABLE_STATUS = Object.freeze(['CLAIMED', 'BLOCKED', 'EXPIRED'])

/**
 * Declared but absent: what the contour's own openapi answers around a campaign's reward.
 * @param {unknown} value the field
 * @returns {number | undefined} the number, or nothing when the field is absent or is not a number
 */
function numberOrUndefined(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** A string field that is present and not empty. */
const stringOrUndefined = (value) => (typeof value === 'string' && value !== '' ? value : undefined)

/** The object behind a field, when the field carries one. */
const objectOrUndefined = (value) => (typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined)

/**
 * One part of the balance — the plan's credits or the bonus account's.
 *
 * `total`, `used` and `remaining` are required: a part without them is a shape this module cannot read
 * and says so, instead of drawing a bar of zeros over a number nobody sent.
 * @param {unknown} value the part
 * @param {string} name the field's name, for the message
 * @returns {{total: number, used: number, remaining: number}} the part
 * @throws {QoderError} `MALFORMED_RESPONSE` when the part is not an object or carries no numbers
 */
export function parseQuotaPart(value, name) {
  const part = objectOrUndefined(value)
  if (part === undefined) {
    throw new QoderError(`the Qoder balance carries no ${name} account`, 'MALFORMED_RESPONSE')
  }
  const total = numberOrUndefined(part.total)
  const used = numberOrUndefined(part.used)
  const remaining = numberOrUndefined(part.remaining)
  if (total === undefined || used === undefined || remaining === undefined) {
    throw new QoderError(`the Qoder balance's ${name} account carries no total/used/remaining numbers`, 'MALFORMED_RESPONSE')
  }
  return { total, used, remaining }
}

/** An HTTPS address the account's own page may be opened at, or nothing. */
function httpsOrUndefined(value) {
  if (typeof value !== 'string' || value === '') return undefined
  try {
    return new URL(value).protocol === 'https:' ? value : undefined
  } catch {
    return undefined
  }
}

/**
 * The balance: the plan, the bonus account, and what the contour says about the account itself.
 * @param {unknown} payload the answer's body
 * @returns {{plan: object, bonus: object, exceeded: boolean, expiresAt: number | undefined, userType: string | undefined, usageUrl: string | undefined}} the balance
 * @throws {QoderError} `MALFORMED_RESPONSE` when the body is not an object
 */
export function parseQuota(payload) {
  const data = objectOrUndefined(payload)
  if (data === undefined) throw new QoderError('the Qoder balance is not an object', 'MALFORMED_RESPONSE')
  return {
    plan: parseQuotaPart(data.userQuota, 'userQuota'),
    bonus: parseQuotaPart(data.addOnQuota, 'addOnQuota'),
    exceeded: data.isQuotaExceeded === true,
    expiresAt: numberOrUndefined(data.expiresAt),
    userType: stringOrUndefined(data.userType),
    // The account's own usage page: the add-on's link first, the plan's when there is none. Only an
    // HTTPS address ever reaches the widget; anything else keeps its fallback.
    usageUrl: httpsOrUndefined(objectOrUndefined(data.addOnQuota)?.detailUrl) ?? httpsOrUndefined(objectOrUndefined(data.userQuota)?.detailUrl),
  }
}

/**
 * One campaign, as the widget draws it.
 *
 * The identifier arrives under more than one name (`campaignId`, `campaign_id`, `campaignKey`, seen
 * across the contour's own answers) and any of them is what a claim is sent to; a record that carries
 * none is dropped, because a claim addressed to nothing would be a request into the void.
 * @param {unknown} value one record of the list
 * @returns {object | undefined} the campaign, or nothing when the record carries no identifier
 */
export function parseCampaign(value) {
  const entry = objectOrUndefined(value)
  if (entry === undefined) return undefined
  const id = [entry.campaignId, entry.campaign_id, entry.campaignKey].find((candidate) => typeof candidate === 'string' && candidate !== '')
  if (id === undefined) return undefined
  const benefit = objectOrUndefined(entry.benefit)
  const validity = benefit === undefined ? undefined : objectOrUndefined(benefit.validity)
  const campaign = {
    id,
    title: stringOrUndefined(entry.title),
    status: stringOrUndefined(entry.claimStatus) ?? stringOrUndefined(entry.status),
    actionType: stringOrUndefined(entry.actionType),
    amount: benefit === undefined ? undefined : numberOrUndefined(benefit.amount),
    kind: benefit === undefined ? undefined : stringOrUndefined(benefit.kind),
    validityDays: validity === undefined ? undefined : numberOrUndefined(validity.days),
  }
  // The flag travels decided, and it is decided from the record as it stands: the fields above are
  // what the widget prints, this is what it may offer.
  return { ...campaign, claimable: isClaimable(campaign) }
}

/**
 * Whether a reward can be taken.
 *
 * The contour's list holds campaigns that are not taken by claiming at all — one whose `actionType`
 * says "look at the details" is read, not collected — so the flag is computed where the list is read
 * and never at the drawing site: a mark of "available" over a reward the contour does not hand out
 * would promise an action nobody performs.
 * @param {object} campaign the campaign
 * @returns {boolean} whether the reward can be taken
 */
export function isClaimable(campaign) {
  const status = String(campaign?.status ?? '').toUpperCase()
  if (UNCLAIMABLE_STATUS.includes(status)) return false
  const action = String(campaign?.actionType ?? '').toUpperCase()
  return action === '' || action === 'CLAIM_BENEFIT'
}

/**
 * The campaign list.
 * @param {unknown} payload the answer's body
 * @returns {{shown: boolean | undefined, list: object[]}} the list and whether the contour showed it at all
 * @throws {QoderError} `MALFORMED_RESPONSE` when the body carries no list
 */
export function parseCampaigns(payload) {
  const data = objectOrUndefined(payload)
  if (data === undefined) throw new QoderError('the Qoder campaign answer is not an object', 'MALFORMED_RESPONSE')
  const raw = Array.isArray(data.campaigns) ? data.campaigns : undefined
  if (raw === undefined) {
    throw new QoderError('the Qoder campaign answer carries no "campaigns" list', 'MALFORMED_RESPONSE')
  }
  return {
    shown: typeof data.showCampaign === 'boolean' ? data.showCampaign : undefined,
    list: raw.map(parseCampaign).filter((entry) => entry !== undefined),
  }
}

/**
 * What a claim answered.
 *
 * A repeat is an answer, not a failure: the contour replies `200` with `replayed: true` (or refuses
 * with `ALREADY_CLAIMED` in the body) for a reward that was already taken, and a reader that called
 * that an error would report a reward it holds as one it does not.
 * @param {unknown} payload the answer's body
 * @returns {{status: string | undefined, replayed: boolean, amount: number | undefined, failureCode: string | undefined}} the outcome
 * @throws {QoderError} `MALFORMED_RESPONSE` when the body is not an object
 */
export function parseClaim(payload) {
  const data = objectOrUndefined(payload)
  if (data === undefined) throw new QoderError('the Qoder claim answer is not an object', 'MALFORMED_RESPONSE')
  const benefit = objectOrUndefined(data.benefit)
  return {
    status: stringOrUndefined(data.status),
    replayed: data.replayed === true,
    amount: benefit === undefined ? numberOrUndefined(data.amount) : numberOrUndefined(benefit.amount),
    failureCode: stringOrUndefined(data.failureCode),
  }
}

/**
 * The headers of one account call.
 *
 * The signature is left out on purpose: with it the contour refuses these calls. The desktop markers
 * travel on the campaigns and the claim alone — they are what opens the list, and the balance is
 * answered without them.
 * @param {string} token the job token
 * @param {string} [machineId] the machine id, as the contour's own clients name themselves
 * @param {boolean} [desktop] whether to introduce the client as the desktop one
 * @param {string} [siteOrigin] the account's own site origin, for the `Origin` and `Referer` headers
 * @returns {Record<string, string>} the headers
 */
export function accountHeaders(token, machineId = '', desktop = false, siteOrigin = CONTOURS.global.siteOrigin) {
  return {
    Accept: 'application/json, text/plain, */*',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Qoder',
    'X-Machine-ID': machineId,
    'X-Session-ID': machineId,
    Origin: siteOrigin,
    Referer: `${siteOrigin}/`,
    ...desktop ? { 'cosy-clienttype': DESKTOP_CLIENT_TYPE, 'cosy-version': DESKTOP_VERSION } : {},
  }
}

/**
 * One account call under the transport's control ceiling: the read itself, then the body.
 *
 * The ceiling is the transport's own number, taken from it rather than declared again — a second
 * ceiling for these two calls would be a second idea of how long the contour may take.
 * @param {object} call the call
 * @param {string} call.what the call's name in a message
 * @param {string} call.url the address
 * @param {object} call.init the fetch arguments, without the signal
 * @param {typeof fetch} call.fetchImpl the transport
 * @param {number} call.ceilingMs the ceiling
 * @param {AbortSignal} [call.signal] the caller's cancellation
 * @returns {Promise<unknown>} the body
 * @throws {QoderError} the transport's or the contour's own refusal
 */
async function accountCall({ what, url, init, fetchImpl, ceilingMs, signal }) {
  const response = await bounded({
    what,
    ms: ceilingMs,
    signal,
    run: (inner) => fetchImpl(url, { ...init, signal: inner }),
  })
  if (!response.ok) {
    const text = await response.text().then((value) => value.slice(0, 300), () => '')
    const detail = text.replace(/\s+/gu, ' ').trim()
    /* The message is drawn as the account's own state — the section's note replaces the numbers with it —
       so it carries what failed and the status, and never the vendor's body: a body welded into a sentence
       a face draws is the whole of what a reader sees, and the sentence that matters is lost inside it.
       The body is not dropped with it: it stands verbatim on the error for a caller that publishes it. */
    throw new QoderError(`${what} failed: ${response.status}`, codeFor(response.status, detail), { status: response.status, vendor: detail })
  }
  return jsonOf(response, what)
}

/**
 * The balance of the account.
 * @param {object} call the call
 * @param {string} call.jobToken the job token
 * @param {string} call.openapiOrigin the OpenAPI host
 * @param {string} [call.siteOrigin] the account's own site origin
 * @param {string} [call.machineId] the machine id
 * @param {typeof fetch} [call.fetchImpl] the transport
 * @param {number} [call.ceilingMs] how long the call may take
 * @param {AbortSignal} [call.signal] the caller's cancellation
 * @returns {Promise<object>} the balance
 */
export async function readQuota({ jobToken, openapiOrigin, siteOrigin = CONTOURS.global.siteOrigin, machineId = '', fetchImpl = globalThis.fetch, ceilingMs = DEFAULT_CONTROL_CEILING_MS, signal }) {
  const payload = await accountCall({
    what: 'the Qoder balance read',
    url: `${openapiOrigin}${QUOTA_PATH}`,
    init: { method: 'GET', headers: accountHeaders(jobToken, machineId, false, siteOrigin) },
    fetchImpl,
    ceilingMs,
    signal,
  })
  return parseQuota(payload)
}

/**
 * The campaigns of the account.
 * @param {object} call the call, as {@link readQuota}'s
 * @returns {Promise<object>} the list and whether the contour showed it
 */
export async function readCampaigns({ jobToken, openapiOrigin, siteOrigin = CONTOURS.global.siteOrigin, machineId = '', fetchImpl = globalThis.fetch, ceilingMs = DEFAULT_CONTROL_CEILING_MS, signal }) {
  const payload = await accountCall({
    what: 'the Qoder campaign read',
    url: `${openapiOrigin}${CAMPAIGNS_PATH}`,
    init: { method: 'GET', headers: accountHeaders(jobToken, machineId, true, siteOrigin) },
    fetchImpl,
    ceilingMs,
    signal,
  })
  return parseCampaigns(payload)
}

/**
 * Take one reward.
 *
 * The contour's idempotence is respected rather than repaired: a reward that was already taken comes
 * back as a replay (`replayed: true`, or a refusal whose body names `ALREADY_CLAIMED`), and both are
 * reported as the campaign being held — a claim that a sweep repeats must not read as a failure, or
 * the widget would say "nothing was collected" about a reward sitting in the account.
 * @param {object} call the call
 * @param {string} call.jobToken the job token
 * @param {string} call.openapiOrigin the OpenAPI host
 * @param {string} [call.siteOrigin] the account's own site origin
 * @param {string} call.campaignId the campaign to take
 * @param {string} [call.machineId] the machine id
 * @param {typeof fetch} [call.fetchImpl] the transport
 * @param {number} [call.ceilingMs] how long the call may take
 * @param {AbortSignal} [call.signal] the caller's cancellation
 * @returns {Promise<object>} the outcome, with `alreadyHeld` saying whether the contour handed out
 *   nothing new — a repeat, a reward closed to this account, or one it already has
 * @throws {QoderError} `MALFORMED_RESPONSE` when no campaign was named
 */
export async function claimReward({ jobToken, openapiOrigin, siteOrigin = CONTOURS.global.siteOrigin, campaignId, machineId = '', fetchImpl = globalThis.fetch, ceilingMs = DEFAULT_CONTROL_CEILING_MS, signal }) {
  if (typeof campaignId !== 'string' || campaignId === '') {
    throw new QoderError('the Qoder claim names no campaign', 'MALFORMED_RESPONSE')
  }
  const url = `${openapiOrigin}${CAMPAIGNS_PATH}/${encodeURIComponent(campaignId)}/claim`
  let payload
  try {
    payload = await accountCall({
      what: 'the Qoder claim',
      url,
      init: { method: 'POST', headers: { ...accountHeaders(jobToken, machineId, true, siteOrigin), 'Content-Type': 'application/json' }, body: '{}' },
      fetchImpl,
      ceilingMs,
      signal,
    })
  } catch (error) {
    /* A repeat is the contour's own answer, and the body it sent is what says so: read off the sentence a
       face draws, the same fact would hang on a body that no longer stands in it, and the field this
       contour names it by is the body's own. */
    if (error instanceof QoderError && /ALREADY_CLAIMED|REPLAYED/u.test(String(error.vendor ?? ''))) {
      return { campaignId, status: 'CLAIMED', replayed: true, amount: undefined, alreadyHeld: true }
    }
    throw error
  }
  const parsed = parseClaim(payload)
  /* A refusal the contour names **inside a 200** — `failureCode`, or the status `BLOCKED` — is the
     same quiet outcome as a repeat: the reward is not this call's to take. Anything else that arrives
     with a non-2xx status never reaches here: it was thrown above, so a real refusal stays visible. */
  const blocked = parsed.failureCode !== undefined || parsed.status === 'BLOCKED'
  return { campaignId, ...parsed, alreadyHeld: blocked || parsed.replayed }
}

/**
 * The account's credits over the route's own transport.
 *
 * The job token, the OpenAPI host and the machine id come from the transport — one owner of each —
 * and the two reads of one glance run together, because the widget shows them as one picture.
 * @param {object} options the reader
 * @param {object} options.transport the route's transport, the one owner of a signed call
 * @param {typeof fetch} [options.fetchImpl] the transport, for a test
 * @param {() => number} [options.now] the clock, for a test
 * @returns {{read: Function, claim: Function}} the reader
 */
export function createCredits({ transport, fetchImpl = globalThis.fetch, now = () => Date.now() }) {
  const ceilingMs = transport.ceilings().controlCeilingMs
  const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

  /** What the widget draws, from one read of the account: the balances, the campaigns and the policy. */
  async function read(signal) {
    const { session } = await transport.identity(signal)
    const { openapiOrigin, siteOrigin } = transport.origins()
    const call = {
      jobToken: session.jobToken,
      machineId: transport.machineId(),
      openapiOrigin,
      siteOrigin,
      fetchImpl,
      ceilingMs,
      signal,
    }
    const [quota, campaigns, privacy] = await Promise.all([
      readQuota(call),
      readCampaigns(call),
      transport.dataPolicy({ fresh: true, signal })
        .then((policy) => ({ kind: 'read', ...policy }))
        .catch((error) => ({ kind: 'failed', reason: reasonOf(error) })),
    ])
    return { at: now(), quota, campaigns, privacy }
  }

  return {
    read,
    /**
     * Take one reward. The token is asked for on every claim rather than kept from a read: a claim is
     * rare and a token that rotated in between would answer `AUTH` on a reward the account holds.
     */
    async claim(campaignId, signal) {
      const { session } = await transport.identity(signal)
      const { openapiOrigin, siteOrigin } = transport.origins()
      return claimReward({
        campaignId,
        jobToken: session.jobToken,
        machineId: transport.machineId(),
        openapiOrigin,
        siteOrigin,
        fetchImpl,
        ceilingMs,
        signal,
      })
    },
    /**
     * The one press: read the policy fresh, ask for sharing off only while it shares, read again.
     *
     * A `200` is not proof — the Chinese trial answers `200` and stays on — so the answer the widget
     * draws is the second read, and `attempted` says a press was made even when the state did not move.
     * @param {AbortSignal} [signal] the caller's cancellation
     * @returns {Promise<object>} the after state
     */
    async privacySet(signal) {
      const fresh = await transport.dataPolicy({ fresh: true, signal })
      if (fresh.share_enabled) await transport.updateDataPolicy({ signal })
      const after = await transport.dataPolicy({ fresh: true, signal })
      return { kind: 'read', ...after, attempted: true }
    },
  }
}
