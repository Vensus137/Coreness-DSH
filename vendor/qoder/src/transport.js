/**
 * The transport of one route, whole: the contour, the token cache, the node map, the signature, the chat
 * turn and its frames, as one closure — the seam the platform's model service offers and the split keeps.
 *
 * The token decides the contour, once per token fingerprint: a Chinese token is exchanged on the Chinese
 * contour and an international one on the international contour, and every later call — the node map,
 * the catalogue, the chat, the search, the credits, the data policy — reads through the same contour.
 * The token calls live beside the transport, where the line budget has room for them.
 *
 * @module @coreness/qoder/src/transport
 */

import crypto from 'node:crypto'
import { MAX_TIMER_DELAY_MS, clampTimeout, deadline } from '@deepseek-ai/dsh-timeout'
import { buildChatBody, encodeBody, toWireMessages, toWireTools } from './body.js'
import { CHAT_PATH, DEFAULT_CONTROL_CEILING_MS, DEFAULT_FIRST_BYTE_CEILING_MS, DEFAULT_IDLE_CEILING_MS, FIRST_BYTE_CODE, MODEL_LIST_PATH, QoderError, WEB_SEARCH_PATH, bounded, jsonOf, modelsOf, refusalInText, refusalOf, sessionExpired } from './in.js'
import { CONTOURS, chosenContour, createTokenCalls, detectContour } from './contour.js'
import { readDataPolicy, writeDataPolicy } from './privacy.js'
import { abortOf, bodyFrom, firstByteRefusal, normalizeNode, readEndpointMap, readFrames } from './read.js'
import { mergeMenus, readMenus, writeMenus } from './menus.js'
import { CLIENT_TYPE, WEB_COSY_VERSION, WEB_MACHINE_OS, cosyHeaders, machineIdOf } from './sign.js'

/**
 * The transport of one route: the facts it needs, the caches it keeps, and the calls.
 *
 * The personal token is a value, not a setting: the caller resolves it (in the product,
 * from the platform's own credentials store) and passes it in. Nothing here writes it
 * anywhere.
 * @param {object} options the transport's facts
 * @param {() => Promise<string> | string} options.apiKey the personal token, resolved per call
 * @param {typeof fetch} [options.fetchImpl] the transport
 * @param {string} [options.region] `auto` (the token decides), `global` or `cn`
 * @param {string} [options.centerOrigin] the centre host; a value other than the international default makes a custom contour
 * @param {string} [options.openapiOrigin] the OpenAPI host; the same custom rule
 * @param {string | (() => string)} [options.inferBase] a configured inference node, instead of the map's
 *   first; a function is read per call, because the row's field is live (`resolvedEndpoints`)
 * @param {string} [options.machineIdStoreDir] where the plugin keeps its own machine id
 * @param {string} [options.menusPath] where the vendor's effort menus are kept between launches; without it
 *   the read is remembered for this process only
 * @param {number} [options.controlCeilingMs] how long a control call may take
 * @param {number} [options.firstByteCeilingMs] how long the answer may take to start speaking
 * @param {number} [options.idleCeilingMs] how long a started answer may stay silent
 * @param {(strike: object) => void} [options.onStrike] where a ceiling's firing is reported
 * @param {() => number} [options.now] the clock, for tests
 * @param {(message: string) => void} [options.warn] where a re-exchange and a refusal's own body are reported
 * @returns {object} the transport
 */
export function createTransport(options) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const now = options.now ?? (() => Date.now())
  const warn = options.warn ?? (() => {})
  /* The vendor's effort menus between launches: the declaration must answer without the network, so the
     levels a catalogue last published are read here and refreshed by every read of the account's own node.
     A listing of some other node under check says nothing about what this route asks for and is not kept. */
  const menuCache = options.menusPath === undefined ? new Map() : readMenus(options.menusPath, warn)
  const controlCeilingMs = clampTimeout(options.controlCeilingMs, DEFAULT_CONTROL_CEILING_MS, MAX_TIMER_DELAY_MS, 'controlCeilingMs')
  const firstByteCeilingMs = clampTimeout(options.firstByteCeilingMs, DEFAULT_FIRST_BYTE_CEILING_MS, MAX_TIMER_DELAY_MS, 'firstByteCeilingMs')
  const idleCeilingMs = clampTimeout(options.idleCeilingMs, DEFAULT_IDLE_CEILING_MS, MAX_TIMER_DELAY_MS, 'idleCeilingMs')
  const strikes = []
  const strike = (fired) => {
    const record = { ...fired, at: new Date(now()).toISOString() }
    strikes.push(record)
    options.onStrike?.(record)
  }
  const ceiling = (what, signal, run) => bounded({ what, ms: controlCeilingMs, signal, run, strike })
  const tokenCalls = createTokenCalls({ fetchImpl, ceiling, warn, now, userAgent: options.userAgent })
  /** A row that names a contour, or custom origins, never detects; `undefined` leaves it to the token. */
  const chosen = chosenContour({ region: options.region, centerOrigin: options.centerOrigin, openapiOrigin: options.openapiOrigin })
  /** The contour of one token fingerprint, and the last one resolved. */
  const contours = new Map()
  let active = chosen ?? CONTOURS.global
  /** Per-token state: the job token, what refreshes it, and when it dies. */
  const sessions = new Map()
  /** The identity of a token, read once: the profile is a cache keyed by the personal token. */
  const identities = new Map()
  /** The data policy of a token, and its last write; read fresh by a press. */
  const policies = new Map()
  /** The node map of one contour, and the plugin's own machine id, read or generated once. */
  const endpointsByContour = new Map()
  let machineId
  /** In-flight exchanges and map reads, so two callers cannot race the same token. */
  const flights = new Map()
  let catalogueModels
  let catalogueRefusal

  const fingerprint = (pat) => crypto.createHash('sha256').update(pat).digest('hex').slice(0, 16)

  /** One flight per key: the second caller waits for the first instead of repeating it. */
  const singleFlight = (map, key, load) => {
    const running = map.get(key)
    if (running !== undefined) return running
    const started = Promise.resolve().then(load).finally(() => map.delete(key))
    map.set(key, started)
    return started
  }

  /** The machine id: the plugin's own file under the harness home, generated once when absent. */
  const machineIdValue = () => {
    machineId ??= machineIdOf({ storeDir: options.machineIdStoreDir ?? process.cwd() })
    return machineId
  }

  /** The node the row asks for, read at every call. */
  const askedNode = () => (typeof options.inferBase === 'function' ? options.inferBase() : options.inferBase)

  /** The contour a token belongs to, detected once and cached by the token's fingerprint. */
  async function contourOf(pat, signal) {
    const key = fingerprint(pat)
    const known = contours.get(key)
    if (known !== undefined) {
      active = known
      return { key, contour: known }
    }
    if (chosen !== undefined) {
      contours.set(key, chosen)
      active = chosen
      return { key, contour: chosen }
    }
    const winner = await singleFlight(flights, `contour:${key}`, () => detectContour({ pat, calls: tokenCalls, signal }))
    contours.set(key, winner.contour)
    sessions.set(key, winner.session)
    active = winner.contour
    return { key, contour: winner.contour, session: winner.session }
  }

  /**
   * The node map: the addresses the centre lists, read once per contour and shared with every caller
   * that resolves an address through it.
   */
  async function nodeMap(signal) {
    const pat = await resolvedPat()
    const { contour } = await contourOf(pat, signal)
    let held = endpointsByContour.get(contour.id)
    if (held === undefined) {
      held = await singleFlight(flights, `endpoints:${contour.id}`, () => readEndpointMap({ fetchImpl, centerOrigin: contour.centerOrigin, signal, ceilingMs: controlCeilingMs, strike, warn }))
      endpointsByContour.set(contour.id, held)
    }
    return held
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

  /**
   * The identity of one personal token: the profile, read once, plus the live session and its contour.
   */
  async function identityOf(signal) {
    const pat = await resolvedPat()
    const { key, contour } = await contourOf(pat, signal)
    const session = await tokenFor(key, contour, signal)
    let identity = identities.get(key)
    if (identity === undefined) {
      identity = await singleFlight(flights, `identity:${key}`, async () => {
        const value = await tokenCalls.profile(contour, session.jobToken, signal)
        identities.set(key, value)
        return value
      })
    }
    return { session, identity, pat, key, contour }
  }

  /** The job token for one fingerprint, cached until it dies. */
  async function tokenFor(key, contour, signal) {
    const held = sessions.get(key)
    if (held !== undefined && held.expiresAt - now() > 30_000) return held
    return singleFlight(flights, `token:${key}`, async () => {
      const pat = await resolvedPat()
      const fresh = held !== undefined && held.jobRefreshToken !== ''
        ? await tokenCalls.refresh(contour, held, signal).catch(() => tokenCalls.exchange(contour, pat, signal))
        : await tokenCalls.exchange(contour, pat, signal)
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

  /** The headers of one signed call, with the machine id and the identity already resolved. */
  async function signedHeaders({ url, body, signal, cosy }) {
    const { session, identity } = await identityOf(signal)
    return cosyHeaders({ body, url, credentials: { ...identity, jobToken: session.jobToken }, machineId: machineIdValue(), ...cosy })
  }

  /**
   * The catalogue: what the account's node offers.
   * @param {{signal?: AbortSignal, node?: string}} [call] the caller's cancellation, and the node to ask
   * @returns {Promise<object[]>} the enabled models, in the node's order
   */
  async function catalogue({ signal, node } = {}) {
    const { inferBase: ownBase } = await resolvedEndpoints(signal)
    const inferBase = node === undefined || node === '' ? ownBase : normalizeNode(node, 'the node under check')
    const url = `${inferBase}${MODEL_LIST_PATH}`
    return ceiling('the Qoder model listing', signal, async (inner) => {
      const headers = { Accept: 'application/json', ...await signedHeaders({ url, body: null, signal: inner }) }
      const response = await fetchImpl(url, { headers, signal: inner })
      if (!response.ok) throw await refusalOf(response, 'the Qoder model listing', warn)
      const payload = await jsonOf(response, 'the Qoder model listing')
      const models = modelsOf(payload)
      /* Only the account's own node refreshes the menus: another node under check may publish different
         levels for the same id, and the sweep asks every node by its address like any other reader. */
      if (inferBase === ownBase) rememberMenus(models)
      return models
    })
  }

  /** Whether the cache's file is stale from a write that failed; the next own-node listing retries it. */
  let menusPending = false

  /**
   * Merges one listing into the menus and writes the file when it changed.
   *
   * A failed write is said and retried by the next listing rather than waiting for a menu to change: the
   * memory keeps the levels either way, so the route is never poorer than the file, and a file that could
   * not be written once is not left stale for the life of the process.
   * @param {object[]} models the listing, as the wire read it
   * @returns {void}
   */
  function rememberMenus(models) {
    const changed = mergeMenus(menuCache, models)
    if (options.menusPath === undefined) return
    if (!changed && !menusPending) return
    menusPending = !writeMenus(options.menusPath, menuCache, warn)
  }

  /**
   * One web search through the token contour's centre.
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
    const { contour } = await identityOf(signal)
    const url = `${contour.centerOrigin}${WEB_SEARCH_PATH}?Encode=1`
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
    const { session, identity } = await identityOf(signal)
    const { inferBase } = await resolvedEndpoints(signal)
    const url = `${inferBase}${CHAT_PATH}`
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
      maxTokens: call.maxTokens,
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
    const firstByte = deadline(signal, firstByteCeilingMs, FIRST_BYTE_CODE)
    const startedAt = now()
    let response
    try {
      response = await fetchImpl(url, { method: 'POST', headers, body, signal: firstByte.signal })
    } catch (error) {
      throw firstByteRefusal({ error, firstByte, ms: firstByteCeilingMs, elapsedMs: now() - startedAt, what: 'the Qoder chat turn', where: 'the Qoder chat turn (its headers)', signal, strike })
    }
    // A refusal at HTTP level is the contour's answer, not a stream to decode: reading it as frames turns
    // a 401/403/429/5xx body into a silent `TRANSPORT` and loses both the status and the code that says
    // whether a renewal is worth it. The in-stream refusal path below stays for a `200` that declines.
    if (!response.ok) throw await refusalOf(response, 'the Qoder chat turn', warn)
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
    return { url, body, response: bodyFrom(response, first.value, reader) }
  }

  /**
   * One chat turn, with the one renewal a refusal of the job token is worth.
   *
   * A token the contour calls not active (`sessionExpired`) is worth exactly one fresh exchange, and the
   * exchange harms nobody: two live job tokens of one personal token coexist, so this is not a race against another session. The live route
   * answered `403 {"code":"105","message":"Login expired"}` while the account's own
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

  /**
   * The account's data policy, over the active contour and the job token, cached per token.
   * `fresh` bypasses the cache: a press reads what the account says now, not what a turn saw.
   * @param {{fresh?: boolean, signal?: AbortSignal}} [read] the read
   * @returns {Promise<object>} the policy
   */
  async function dataPolicy({ fresh = false, signal } = {}) {
    const { session, key, contour } = await identityOf(signal)
    if (!fresh) {
      const held = policies.get(key)
      if (held !== undefined) return held
    }
    const policy = await readDataPolicy({ jobToken: session.jobToken, openapiOrigin: contour.openapiOrigin, fetchImpl, ceiling, signal })
    policies.set(key, policy)
    return policy
  }

  /**
   * Ask the contour to turn sharing off. The response is the vendor's; the caller reads the policy
   * again, because a 200 is not proof that the account changed.
   * @param {{signal?: AbortSignal}} [write] the write
   * @returns {Promise<object>} the vendor's answer
   */
  async function updateDataPolicy({ signal } = {}) {
    const { session, key, contour } = await identityOf(signal)
    const answer = await writeDataPolicy({ jobToken: session.jobToken, openapiOrigin: contour.openapiOrigin, fetchImpl, ceiling, signal })
    policies.delete(key)
    return answer
  }

  return {
    nodeMap,
    resolvedEndpoints,
    exchange: async (pat, signal) => {
      const key = fingerprint(pat)
      const known = contours.get(key)
      if (known !== undefined) return tokenCalls.exchange(known, pat, signal)
      // A row that names its own contour never detects: the same rule `contourOf` applies to the turn.
      // Detecting here would send the row's token to the two vendor hosts and cache one of them, so every
      // later call of that row would leave the address the row named.
      if (chosen !== undefined) {
        const session = await tokenCalls.exchange(chosen, pat, signal)
        contours.set(key, chosen)
        sessions.set(key, session)
        active = chosen
        return session
      }
      const winner = await singleFlight(flights, `contour:${key}`, () => detectContour({ pat, calls: tokenCalls, signal }))
      contours.set(key, winner.contour)
      sessions.set(key, winner.session)
      active = winner.contour
      return winner.session
    },
    identity: identityOf,
    catalogue,
    menusOf: (model) => menuCache.get(model) ?? [],
    search: (request, signal) => search(request, signal),
    chat,
    frames,
    renew,
    dataPolicy,
    updateDataPolicy,
    origins: () => ({ centerOrigin: active.centerOrigin, openapiOrigin: active.openapiOrigin, siteOrigin: active.siteOrigin }),
    machineId: () => machineIdValue(),
    ceilings: () => ({ controlCeilingMs, firstByteCeilingMs, idleCeilingMs }),
    strikes: () => strikes.slice(),
  }
}
