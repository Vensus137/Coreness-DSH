/**
 * The transport of one route, whole: the token cache, the node map, the signature, the chat turn and
 * its frames, as one closure — the seam the donor wrote and the split keeps.
 *
 * @module @coreness/qoder/src/transport
 */

import crypto from 'node:crypto'
import { MAX_TIMER_DELAY_MS, clampTimeout, deadline } from '@deepseek-ai/dsh-timeout'
import { buildChatBody, encodeBody, toWireMessages, toWireTools, DEFAULT_MAX_TOKENS } from './body.js'
import { CHAT_PATH, DEFAULT_CENTER_ORIGIN, DEFAULT_CONTROL_CEILING_MS, DEFAULT_FIRST_BYTE_CEILING_MS, DEFAULT_IDLE_CEILING_MS, DEFAULT_OPENAPI_ORIGIN, EXCHANGE_PATH, FIRST_BYTE_CODE, MODEL_LIST_PATH, QoderError, REFRESH_PATH, USERINFO_PATH, WEB_SEARCH_PATH, bounded, expiryOf, jsonOf, modelsOf, refusalInText, refusalOf, sessionExpired } from './in.js'
import { abortOf, bodyFrom, firstByteRefusal, normalizeNode, readEndpointMap, readFrames } from './read.js'
import { CLIENT_TYPE, WEB_COSY_VERSION, WEB_MACHINE_OS, cosyHeaders, machineIdOf, tokenHeaders } from './sign.js'

/**
 * The transport of one route: the facts it needs, the caches it keeps, and the calls.
 *
 * The personal token is a value, not a setting: the caller resolves it (in the product,
 * from the platform's own credentials store) and passes it in. Nothing here writes it
 * anywhere.
 * @param {object} options the transport's facts
 * @param {() => Promise<string> | string} options.apiKey the personal token, resolved per call
 * @param {typeof fetch} [options.fetchImpl] the transport
 * @param {string} [options.centerOrigin] the centre host
 * @param {string} [options.openapiOrigin] the OpenAPI host
 * @param {string | (() => string)} [options.inferBase] a configured inference node, instead of the map's
 *   first; a function is read per call, because the row's field is live (`resolvedEndpoints`)
 * @param {string} [options.machineIdStoreDir] where the machine id is kept
 * @param {number} [options.controlCeilingMs] how long a control call may take
 * @param {number} [options.firstByteCeilingMs] how long the answer may take to start speaking
 * @param {number} [options.idleCeilingMs] how long a started answer may stay silent
 * @param {(strike: object) => void} [options.onStrike] where a ceiling's firing is reported
 * @param {() => number} [options.now] the clock, for tests
 * @param {(message: string) => void} [options.warn] where a re-exchange and a refusal's own body are
 *   reported
 * @returns {object} the transport
 */
export function createTransport(options) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const now = options.now ?? (() => Date.now())
  const warn = options.warn ?? (() => {})
  // Every number goes through the harness's own clamp: a hint of ours is filled from the default,
  // capped at the largest delay a timer can carry, and refused outright when it could not be a
  // duration at all — before any work starts.
  const controlCeilingMs = clampTimeout(options.controlCeilingMs, DEFAULT_CONTROL_CEILING_MS, MAX_TIMER_DELAY_MS, 'controlCeilingMs')
  const firstByteCeilingMs = clampTimeout(options.firstByteCeilingMs, DEFAULT_FIRST_BYTE_CEILING_MS, MAX_TIMER_DELAY_MS, 'firstByteCeilingMs')
  const idleCeilingMs = clampTimeout(options.idleCeilingMs, DEFAULT_IDLE_CEILING_MS, MAX_TIMER_DELAY_MS, 'idleCeilingMs')
  /** What the ceilings have done so far: a ceiling nobody can count is a ceiling nobody can calibrate. */
  const strikes = []
  const strike = (fired) => {
    const record = { ...fired, at: new Date(now()).toISOString() }
    strikes.push(record)
    options.onStrike?.(record)
  }
  const centerOrigin = normalizeNode(options.centerOrigin ?? DEFAULT_CENTER_ORIGIN, 'the Qoder centre')
  const openapiOrigin = normalizeNode(options.openapiOrigin ?? DEFAULT_OPENAPI_ORIGIN, 'the Qoder OpenAPI host')
  /** The ceiling of one control call, as the calls themselves name it. */
  const ceiling = (what, signal, run) => bounded({ what, ms: controlCeilingMs, signal, run, strike })
  /** Per-token state: the job token, what refreshes it, and when it dies. */
  const sessions = new Map()
  /** The identity of a token, read once: the profile is a cache keyed by the personal token. */
  const identities = new Map()
  /** In-flight exchanges and map reads, so two callers cannot race the same token. */
  const flights = new Map()
  let machineId
  let endpoints

  const fingerprint = (pat) => crypto.createHash('sha256').update(pat).digest('hex').slice(0, 16)

  /** One flight per key: the second caller waits for the first instead of repeating it. */
  const singleFlight = (map, key, load) => {
    const running = map.get(key)
    if (running !== undefined) return running
    const started = Promise.resolve().then(load).finally(() => map.delete(key))
    map.set(key, started)
    return started
  }

  const machineIdValue = () => {
    machineId ??= machineIdOf({ storeDir: options.machineIdStoreDir ?? process.cwd() })
    return machineId
  }

  /**
   * The node the row asks for, read at every call.
   *
   * The row's `inferBase` is a volatile field: the platform hands it over as a live reference so that a
   * change applies without re-mounting the route, and an address captured once at
   * construction would keep sending every request to the node the user has just replaced. A plain
   * string is read as it stands — the shape this option takes outside the Loader, as this module's own
   * checks pass it.
   * @returns {string | undefined} the node the row names, if it names one
   */
  const askedNode = () => (typeof options.inferBase === 'function' ? options.inferBase() : options.inferBase)

  /**
   * The node map: the addresses the centre lists, read once per transport and shared with every caller
   * that resolves an address through it.
   *
   * One read, one cache, because this is the list the route itself resolves against: a sweep that read
   * its own fresh copy would be checking a list the running route is not using. `endpointMap` below is
   * the reader for a caller that wants the map as it stands now and is not resolving through it.
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<object>} the map as the centre sent it, `inferNodes` being the nodes it names
   */
  async function nodeMap(signal) {
    endpoints ??= await singleFlight(flights, 'endpoints', () => readEndpointMap({ fetchImpl, centerOrigin, signal, ceilingMs: controlCeilingMs, strike, warn }))
    return endpoints
  }

  /** The node the row asks for, if it asks for one: the address the route is sending to now. */
  async function resolvedEndpoints(signal) {
    const asked = askedNode()
    if (asked !== undefined && asked !== '') {
      return { inferBase: normalizeNode(asked, 'the configured inference node'), source: 'configured' }
    }
    const map = await nodeMap(signal)
    return { inferBase: normalizeNode(map.inferNodes[0], 'the node map inference node'), source: 'map' }
  }

  /** The token exchange: the personal token goes in, a short-lived job token comes out. */
  async function exchange(pat, signal) {
    return ceiling('the Qoder token exchange', signal, async (inner) => {
      const response = await fetchImpl(`${openapiOrigin}${EXCHANGE_PATH}`, {
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

  /** The refresh: the refresh token goes in, a new job token comes out. */
  async function refresh(session, signal) {
    if (session.jobRefreshToken === '') throw new QoderError('the job token expired and no refresh token was issued', 'AUTH')
    return ceiling('the Qoder job token refresh', signal, async (inner) => {
      const response = await fetchImpl(`${openapiOrigin}${REFRESH_PATH}`, {
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

  /** The profile: the user id the signature cannot be built without. */
  async function profile(jobToken, signal) {
    return ceiling('the Qoder profile call', signal, async (inner) => {
      const response = await fetchImpl(`${openapiOrigin}${USERINFO_PATH}`, {
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

  /**
   * The identity of one personal token: the profile, read once, plus the live session.
   *
   * The profile is cached because it is the same for the life of a token; the session is
   * read fresh every time, because the exchange replaces it and the signature must carry
   * the token that is alive at the moment of the call.
   */
  async function identityOf(signal) {
    const pat = await resolvedPat()
    const key = fingerprint(pat)
    let identity = identities.get(key)
    if (identity === undefined) {
      identity = await singleFlight(flights, `identity:${key}`, async () => {
        const value = await profile((await tokenFor(key, signal)).jobToken, signal)
        identities.set(key, value)
        return value
      })
    }
    return { session: await tokenFor(key, signal), identity, pat, key }
  }

  /** The job token for one fingerprint, cached until it dies. */
  async function tokenFor(key, signal) {
    const held = sessions.get(key)
    if (held !== undefined && held.expiresAt - now() > 30_000) return held
    return singleFlight(flights, `token:${key}`, async () => {
      const pat = await resolvedPat()
      const fresh = held !== undefined && held.jobRefreshToken !== ''
        ? await refresh(held, signal).catch(() => exchange(pat, signal))
        : await exchange(pat, signal)
      sessions.set(key, fresh)
      return fresh
    })
  }

  /** The personal token, resolved through the caller's own door every time. */
  async function resolvedPat() {
    const pat = await options.apiKey()
    if (typeof pat !== 'string' || pat.trim() === '') {
      throw new QoderError('no Qoder credential is stored for this route', 'MISSING_CREDENTIAL')
    }
    return pat.trim()
  }

  /** The harness's own attribution: a provider request names the application it comes from. */
  function attribution() {
    return { 'user-agent': options.userAgent ?? 'coreness-dsh' }
  }

  /**
   * The headers of one signed call, with the machine id and the identity already resolved.
   *
   * `cosy` is the call's own COSY shape when it is not the chat's: the web search names a newer
   * COSY version, its client and its business, and leaves out the body-hash headers the chat
   * carries. The defaults stay the chat's, so the chat call is unchanged.
   */
  async function signedHeaders({ url, body, signal, cosy }) {
    const { session, identity } = await identityOf(signal)
    return cosyHeaders({ body, url, credentials: { ...identity, jobToken: session.jobToken }, machineId: machineIdValue(), ...cosy })
  }

  /**
   * The catalogue: what the account's node offers.
   *
   * `node` asks one named node instead of the row's own — the node sweep needs the same signing and the
   * same ceiling against an address the row has not chosen, and a second writer of a signed call would
   * be a second owner of how this vendor is spoken to. The named node is not cached either: an answer
   * about another node kept under the transport's key would be read later as an answer about this one.
   * @param {{signal?: AbortSignal, node?: string}} [call] the caller's cancellation, and the node to ask
   * @returns {Promise<object[]>} the enabled models, in the node's order
   */
  async function catalogue({ signal, node } = {}) {
    const { inferBase } = node === undefined || node === ''
      ? await resolvedEndpoints(signal)
      : { inferBase: normalizeNode(node, 'the node under check') }
    const url = `${inferBase}${MODEL_LIST_PATH}`
    return ceiling('the Qoder model listing', signal, async (inner) => {
      const headers = { Accept: 'application/json', ...await signedHeaders({ url, body: null, signal: inner }) }
      const response = await fetchImpl(url, { headers, signal: inner })
      if (!response.ok) throw await refusalOf(response, 'the Qoder model listing', warn)
      const payload = await jsonOf(response, 'the Qoder model listing')
      return modelsOf(payload)
    })
  }

  /**
   * One web search through the Qoder centre.
   *
   * The body is the vendor client's own envelope, encoded and signed the way its web-search client
   * does: the endpoint demands `Encode=1` and answers `400` without it; the COSY payload names
   * `1.1.44` and the client's business, and the path carries the `/algo` prefix the signature
   * strips. A backend error and a malformed answer are thrown, not read as no results — an empty
   * page list is the only shape that means "nothing found".
   * @param {{query: string}} request the search
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<{pageItems: object[], status: number}>} the centre's page items and their HTTP status
   */
  async function search(request, signal) {
    const query = request?.query
    if (typeof query !== 'string' || query.trim() === '') {
      throw new QoderError('the Qoder web search was asked without a query', 'REQUEST')
    }
    const payload = {
      query,
      timeRange: 'NoLimit',
      contents: { mainText: false, markdownText: false, summary: false },
    }
    const plain = JSON.stringify({ payload: JSON.stringify(payload), encodeVersion: '1' })
    const body = encodeBody(plain)
    const url = `${centerOrigin}${WEB_SEARCH_PATH}?Encode=1`
    return ceiling('the Qoder web search', signal, async (inner) => {
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        'X-Session-ID': crypto.randomUUID(),
        ...await signedHeaders({
          url,
          body,
          signal: inner,
          cosy: {
            cosyVersion: WEB_COSY_VERSION,
            clientType: CLIENT_TYPE,
            clientIp: machineIdValue(),
            machineOs: WEB_MACHINE_OS,
            businessProduct: 'cli',
            businessType: 'agent',
            scene: 'assistant',
            extras: false,
          },
        }),
      }
      const response = await fetchImpl(url, { method: 'POST', headers, body, signal: inner })
      if (!response.ok) throw await refusalOf(response, 'the Qoder web search', warn)
      const answer = await jsonOf(response, 'the Qoder web search')
      if (answer.errorCode !== undefined && answer.errorCode !== null && answer.errorCode !== 0) {
        const words = typeof answer.errorMsg === 'string' && answer.errorMsg !== '' ? `: ${answer.errorMsg}` : ''
        throw new QoderError(`the Qoder web search was refused (${answer.errorCode})${words}`, 'UPSTREAM', {
          status: response.status,
          vendor: JSON.stringify(answer),
        })
      }
      if (!Array.isArray(answer.pageItems)) {
        throw new QoderError('the Qoder web search returned no page list', 'MALFORMED_RESPONSE', { status: response.status })
      }
      return { pageItems: answer.pageItems, status: response.status }
    })
  }

  /** The catalogue's models, read at most once for the transport's life, and the failure that stopped it. */
  let catalogueModels
  let catalogueRefusal

  /**
   * What the catalogue reads for one model, or `undefined` when the catalogue has not answered.
   *
   * It is read **once per transport**, on the first turn that needs it, and a failure is remembered: the
   * catalogue is a control call under this transport's own ceiling, and a node that is down must not
   * turn every turn into another control call — while no turn waits on it for its model key, which the
   * row declares. The failure is reported once through `warn`, because the fallback
   * is a decision and not a mask: without a catalogue the flag travels derived from the effort, as it
   * did before this joint existed. A caller's own cancellation is not the catalogue's answer and is
   * neither remembered nor reported — it is the turn ending, which the caller already knows.
   * @param {string} model the wire model key
   * @param {AbortSignal} [signal] the caller's cancellation
   * @returns {Promise<{isReasoning: boolean, efforts: string[]} | undefined>} the record's read
   */
  async function modelRecordOf(model, signal) {
    if (catalogueModels === undefined && catalogueRefusal === undefined) {
      try {
        catalogueModels = await singleFlight(flights, 'catalogue', () => catalogue({ signal }))
      } catch (error) {
        if (signal?.aborted === true) throw error
        catalogueRefusal = error
        warn(`the Qoder catalogue did not answer (${error?.message ?? String(error)}); the reasoning flag travels as the effort asks`)
      }
    }
    if (catalogueModels === undefined) return undefined
    // The catalogue answered, so its own flag is the claim that travels — and for a model it does not
    // carry, the claim is `true` with the effort as asked. That is a deliberate divergence from their
    // builder, which reads the record it does not have as `false`: their client cannot reach that
    // branch, because the model it asks for comes from the catalogue, while this route's list is the
    // row's own. On doubt the user's rule
    // is to err toward more reasoning, so a model the catalogue does not name is not read as one that
    // cannot reason, and the effort the user asked for travels.
    const entry = catalogueModels.find((candidate) => candidate.id === model)
    return entry === undefined ? { isReasoning: true, efforts: [] } : { isReasoning: entry.reasoning, efforts: entry.efforts }
  }

  /**
   * One request of a chat turn: the body is built, encoded, signed, sent, and read to its first chunk.
   *
   * The identity is read **here**, per request, which is what makes a retry a retry with another token:
   * `identityOf` answers the session this transport has cached until `renew` drops it.
   *
   * The ceiling here covers the wait for the answer's *headers* and no more: once the contour has
   * started talking, a long answer is legitimate, and what bounds it is the silence between its
   * bytes — `readFrames` — together with the caller's signal.
   *
   * The body carries the model as the catalogue reads it (`modelRecordOf`): the vendor's own flag, and
   * the effort exactly as the row names it — a name a model's menu does not publish travels as asked,
   * because the wire takes it (a live turn carried `max` to a model whose menu is `xhigh|low|medium` and
   * was answered normally). A catalogue that has not answered changes neither — the flag is derived from
   * the effort, and the effort travels as the user asked.
   * @param {object} call the turn
   * @param {string} call.model the wire model key
   * @param {string} [call.system] the system prompt
   * @param {object[]} [call.messages] harness-shaped messages
   * @param {object[]} [call.tools] harness-shaped tool definitions
   * @param {number} [call.maxTokens] the output budget
   * @param {string} [call.reasoningEffort] the effort; `off` means the field is left out
   * @param {AbortSignal} [call.signal] the caller's cancellation
   * @returns {Promise<{url: string, body: string, response: Response}>} what was sent and the answer
   */
  async function chatOnce(call) {
    const { signal } = call
    const { inferBase } = await resolvedEndpoints(signal)
    const url = `${inferBase}${CHAT_PATH}`
    const { session, identity } = await identityOf(signal)
    const wire = toWireMessages(call.messages ?? [], { system: call.system ?? '' })
    const modelRecord = await modelRecordOf(call.model, signal)
    const fresh = { requestId: crypto.randomUUID(), startedAt: now() }
    const plain = JSON.stringify(buildChatBody({
      model: call.model,
      userID: identity.userID,
      system: wire.system,
      messages: wire.messages,
      originalContent: wire.originalContent,
      tools: toWireTools(call.tools),
      maxTokens: Number.isFinite(call.maxTokens) && call.maxTokens > 0 ? call.maxTokens : DEFAULT_MAX_TOKENS,
      reasoningEffort: call.reasoningEffort,
      modelRecord,
      requestId: fresh.requestId,
      startedAt: fresh.startedAt,
    }))
    const body = encodeBody(plain)
    const headers = {
      ...call.headers,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Accept-Encoding': 'identity',
      'X-Model-Key': call.model,
      'X-Model-Source': 'system',
      ...cosyHeaders({ body, url, credentials: { ...identity, jobToken: session.jobToken }, machineId: machineIdValue() }),
    }
    // The first byte is bounded from the moment the request goes out, and *inside this call*: the
    // answer is not handed over until it has started speaking. A contour that answers `200` and then
    // never says a word is exactly the case this ceiling exists for, and a caller cannot bypass it by
    // reading the raw stream — by the time there is a raw stream to read, the answer has begun.
    const consumer = new AbortController()
    const fused = signal === undefined ? consumer.signal : AbortSignal.any([signal, consumer.signal])
    const firstByte = deadline(fused, firstByteCeilingMs, FIRST_BYTE_CODE)
    const startedAt = now()
    let response
    try {
      response = await fetchImpl(url, { method: 'POST', headers, body, signal: firstByte.signal })
    } catch (error) {
      throw firstByteRefusal({ error, firstByte, ms: firstByteCeilingMs, elapsedMs: now() - startedAt, what: 'the Qoder chat turn', where: 'the Qoder chat turn (its headers)', signal, strike })
    }
    const reader = response.body?.getReader()
    if (reader === undefined) throw new QoderError('the Qoder chat turn carried no stream to read', 'TRANSPORT')
    let first
    try {
      first = await Promise.race([reader.read(), abortOf(firstByte.signal)])
    } catch (error) {
      throw firstByteRefusal({ error, firstByte, ms: firstByteCeilingMs, elapsedMs: now() - startedAt, what: 'the Qoder chat answer', where: 'the Qoder chat answer (its first byte)', signal, strike })
    } finally {
      // The answer has started (or the ceiling fired): the timer must not stay armed, or it would
      // abort a turn that is legitimately still running.
      firstByte[Symbol.dispose]()
    }
    if (first.done === true) throw new QoderError('the Qoder chat answer was empty', 'EMPTY', { status: response.status })
    // The first chunk is already in hand: if it carries the contour's refusal, that refusal is the
    // answer, and saying so here is what keeps a wrong signature from looking like a silent turn.
    // Every complete line of the chunk is looked at, because where a chunk ends is the network's
    // business and not a property of the wire.
    const refused = refusalInText(new TextDecoder().decode(first.value), 'the Qoder chat turn')
    if (refused !== undefined) throw refused
    return { url, body, response: bodyFrom(response, first.value, reader), watch: { consumer } }
  }

  /**
   * One chat turn, with the one renewal a refusal of the job token is worth.
   *
   * A token the contour calls not active (`sessionExpired`) is worth exactly one fresh exchange, and the
   * exchange harms nobody: two live job tokens of one personal token coexist, measured three repetitions
   * over, so this is not a race against another session. Measured on the
   * live route: the contour answered `403 {"code":"105","message":"Login expired"}` while the account's own
   * personal token still exchanged, and the profile stayed dead — every turn of it, subagents included —
   * until the application was restarted, which is what this heal exists for. It is bounded (one renewal,
   * never a loop) and it is not a mask: `renew` reports itself through `warn`, and a second refusal is
   * thrown exactly as it came. A refusal over an allowance, or over a signature, is not renewed: a fresh
   * token buys back neither a count the vendor keeps nor a signature the gateway would not read.
   * @param {object} call the turn
   * @returns {Promise<{url: string, body: string, response: Response}>} what was sent and the answer
   */
  async function chat(call) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await chatOnce(call)
      } catch (error) {
        if (attempt > 0 || !sessionExpired(error?.vendor ?? '')) throw error
        await renew()
      }
    }
  }

  /**
   * The lines of one answer, under the first-byte and idle ceilings.
   * @param {Response} response the answer `chat` returned
   * @param {object} [options] the read
   * @param {object} [options.watch] the request's own watch, passed on from `chat`
   * @param {number} [options.firstByteCeilingMs] overrides the transport's own ceiling
   * @param {number} [options.idleCeilingMs] overrides the transport's own ceiling
   * @param {AbortSignal} [options.signal] the caller's cancellation
   * @yields {string} one line of the stream-encoded answer
   */
  function frames(response, options = {}) {
    const lines = readFrames(response, {
      what: 'the Qoder chat answer',
      firstByteCeilingMs,
      idleCeilingMs,
      strike,
      ...options,
    })
    // A refusal that arrives **after** the first chunk is thrown here, at the reader, where `chat` has
    // already returned and cannot renew anything: the turn is refused either way, but the cached token
    // must not outlive it. Otherwise a token the contour calls not active stays cached for the rest of its
    // declared 24 hours and every following turn in this process is refused the same way — the profile is
    // then dead until the application is restarted, which is what the owner met and reported.
    return (async function* watched() {
      try {
        yield* lines
      } catch (error) {
        if (error instanceof QoderError && sessionExpired(error.vendor ?? '')) await forgetSession()
        throw error
      }
    })()
  }

  /**
   * Forget the cached job token of the current credential and its identity.
   *
   * Called when the contour says the token it was given is not active: from that moment the cached value is
   * worthless — it stays refused for the rest of its declared 24 hours — and with the token goes the
   * identity read, because that read is signed with the same token. Forgetting costs one exchange and
   * harms nobody: two live job tokens of one personal token coexist.
   *
   * The credential is read here exactly as the option is documented to answer (`options.apiKey`, above):
   * a promise or a plain value, since one caller of this transport hands a string. A read that fails is
   * not this call's business and does not replace the refusal that asked for the renewal: there is then no
   * cached session to drop, and the next attempt re-reads the credential and reports it in its own words.
   * @returns {Promise<boolean>} whether a cached session was dropped
   */
  async function forgetSession() {
    const pat = await Promise.resolve(options.apiKey()).catch(() => '')
    if (typeof pat !== 'string' || pat.trim() === '') return false
    const key = fingerprint(pat.trim())
    const dropped = sessions.delete(key)
    identities.delete(key)
    flights.delete(`identity:${key}`)
    return dropped
  }

  /** Forget the session and say so, in the log the platform keeps for whoever reads the failure. */
  async function renew() {
    await forgetSession()
    warn('the Qoder job token was renewed')
  }

  return {
    endpointMap: (options) => readEndpointMap({ fetchImpl, centerOrigin, warn, ...options }),
    nodeMap,
    resolvedEndpoints,
    exchange: (pat, signal) => exchange(pat, signal),
    profile,
    identity: identityOf,
    catalogue,
    search: (request, signal) => search(request, signal),
    chat,
    frames,
    renew,
    origins: () => ({ centerOrigin, openapiOrigin }),
    // The machine id belongs to the transport — it reads it from the harness home and generates it
    // once — so the account calls of the credits reader ask for it here instead of reading the same file
    // a second time under a second name of their own.
    machineId: () => machineIdValue(),
    ceilings: () => ({ controlCeilingMs, firstByteCeilingMs, idleCeilingMs }),
    strikes: () => strikes.slice(),
  }
}
