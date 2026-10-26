/**
 * A minimal CDP client over the platform's local debugging endpoint: the page target, evaluation,
 * navigation, viewport and media emulation, key presses, full-page captures. No dependency and no
 * server of its own; the only network call is 127.0.0.1 on the port the fresh profile announced.
 */

const DEFAULT_TIMEOUT_MS = 15000
const KEY_MAP = Object.freeze({
  ArrowRight: { code: 'ArrowRight', keyCode: 39 },
  ArrowLeft: { code: 'ArrowLeft', keyCode: 37 },
  Home: { code: 'Home', keyCode: 36 },
  End: { code: 'End', keyCode: 35 },
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function getJson(url, { method = 'GET', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const response = await fetch(url, { method, signal: AbortSignal.timeout(timeoutMs) })
  if (!response.ok) throw new Error(`${method} ${url} answered ${response.status} ${response.statusText}`)
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`${method} ${url} answered no JSON: ${text.slice(0, 120)}`)
  }
}

async function waitForJson(url, timeoutMs) {
  const started = Date.now()
  let lastError
  for (;;) {
    try {
      return await getJson(url, { timeoutMs: Math.max(500, timeoutMs) })
    } catch (error) {
      lastError = error
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`the CDP endpoint did not answer ${url} within ${timeoutMs} ms: ${lastError?.message ?? 'no answer'}`)
    }
    await delay(50)
  }
}

function waitForOpen(ws, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`the CDP WebSocket did not open within ${timeoutMs} ms`)), timeoutMs)
    const done = (error) => {
      clearTimeout(timer)
      if (error) reject(error)
      else resolve()
    }
    ws.addEventListener('open', () => done(), { once: true })
    ws.addEventListener('error', () => done(new Error('the CDP WebSocket reported an error before it opened')), { once: true })
  })
}

function createSession(ws, defaultTimeoutMs) {
  let nextId = 1
  let closed = null
  const pending = new Map()
  const listeners = new Map()
  const armed = new Set()

  const rejectPending = (error) => {
    for (const entry of pending.values()) entry.reject(error)
    pending.clear()
  }

  ws.addEventListener('message', (event) => {
    let message
    try {
      message = JSON.parse(typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8'))
    } catch {
      return
    }
    if (message.id !== undefined) {
      const entry = pending.get(message.id)
      if (!entry) return
      pending.delete(message.id)
      if (message.error) entry.reject(new Error(`${entry.method}: ${message.error.message ?? JSON.stringify(message.error)}`))
      else entry.resolve(message.result ?? {})
      return
    }
    if (typeof message.method === 'string') {
      for (const handler of listeners.get(message.method) ?? []) handler(message.params ?? {})
    }
  })
  ws.addEventListener('close', () => {
    closed = new Error('the CDP connection was closed')
    rejectPending(closed)
  })

  const send = (method, params = {}, timeoutMs = defaultTimeoutMs) =>
    new Promise((resolve, reject) => {
      if (closed) {
        reject(closed)
        return
      }
      const id = nextId++
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`CDP ${method} timed out after ${timeoutMs} ms`))
      }, timeoutMs)
      pending.set(id, {
        method,
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
      })
      ws.send(JSON.stringify({ id, method, params }))
    })

  const once = (method, timeoutMs = defaultTimeoutMs) => {
    // The wait is armed before a command can answer, so every early exit must be able to cancel it:
    // a rejected wait with no handler is an unhandled rejection whose timer outlives the call.
    let cancelWait = () => {}
    const promise = new Promise((resolve, reject) => {
      const set = listeners.get(method) ?? new Set()
      let settled = false
      let timer
      const settle = (error, params) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        set.delete(handler)
        armed.delete(cancelWait)
        if (error) reject(error)
        else resolve(params)
      }
      const handler = (params) => settle(null, params)
      timer = setTimeout(() => settle(new Error(`CDP event ${method} did not arrive within ${timeoutMs} ms`)), timeoutMs)
      cancelWait = () => settle(new Error('the CDP connection was closed'))
      armed.add(cancelWait)
      set.add(handler)
      listeners.set(method, set)
    })
    return Object.assign(promise, { cancel: () => cancelWait() })
  }

  const session = {
    send,
    once,
    async evaluate(expression, { awaitPromise = false, timeoutMs } = {}) {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise, userGesture: false }, timeoutMs)
      if (result.exceptionDetails) {
        const text = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'unknown exception'
        throw new Error(`the page evaluation failed: ${text}`)
      }
      return result.result?.value
    },
    async navigate(url, { timeoutMs = 30000 } = {}) {
      const loaded = once('Page.loadEventFired', timeoutMs)
      let navigation
      try {
        navigation = await send('Page.navigate', { url }, timeoutMs)
        if (navigation.errorText) throw new Error(`the page did not open: ${navigation.errorText}`)
      } catch (error) {
        // The load wait is armed before navigate can answer; cancel it and keep its rejection from
        // escaping so a failed navigation leaves neither a pending timer nor an unhandled rejection.
        loaded.catch(() => {})
        loaded.cancel()
        throw error
      }
      await loaded
      await session.frames()
      await session.fontsReady()
      return navigation
    },
    async setViewport({ width, height, deviceScaleFactor = 1, mobile = false }) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor,
        mobile,
        screenWidth: width,
        screenHeight: height,
      })
    },
    async setReducedMotion(value = 'reduce') {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value }] })
    },
    async setVisionDeficiency(type) {
      await send('Emulation.setEmulatedVisionDeficiency', { type })
    },
    async frames() {
      await session.evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))', {
        awaitPromise: true,
      })
    },
    async fontsReady() {
      await session.evaluate('document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true', {
        awaitPromise: true,
      })
    },
    async pressKey(key) {
      const info = KEY_MAP[key]
      if (!info) throw new Error(`the key ${JSON.stringify(key)} is not part of the deck drive`)
      for (const type of ['rawKeyDown', 'keyUp']) {
        await send('Input.dispatchKeyEvent', {
          type,
          key,
          code: info.code,
          windowsVirtualKeyCode: info.keyCode,
          nativeVirtualKeyCode: info.keyCode,
        })
      }
    },
    async layoutMetrics() {
      return send('Page.getLayoutMetrics')
    },
    async capture({ clip, format = 'png', timeoutMs = 30000 } = {}) {
      const result = await send(
        'Page.captureScreenshot',
        { format, fromSurface: true, captureBeyondViewport: Boolean(clip), ...(clip ? { clip } : {}) },
        timeoutMs,
      )
      if (typeof result?.data !== 'string' || result.data.length === 0) throw new Error('Page.captureScreenshot returned no image data')
      return Buffer.from(result.data, 'base64')
    },
    close() {
      try {
        ws.close()
      } catch {
        // the socket is already gone; nothing left to close
      }
      for (const cancel of [...armed]) cancel()
      armed.clear()
      rejectPending(new Error('the CDP session was closed'))
      listeners.clear()
    },
  }
  return session
}

/**
 * Connect to the Edge instance that announced `port`: the page target, a WebSocket session, the
 * page domain enabled and the target brought to the front so key presses reach it.
 * @param {{ port: number, timeoutMs?: number }} options
 * @returns {Promise<object>} the CDP session
 */
export async function connectCdp({ port, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!Number.isInteger(port) || port <= 0) throw new Error(`no CDP port to connect to (got ${JSON.stringify(port)})`)
  const base = `http://127.0.0.1:${port}`
  await waitForJson(`${base}/json/version`, timeoutMs)
  let pageTarget = null
  try {
    const targets = await getJson(`${base}/json/list`, { timeoutMs })
    if (Array.isArray(targets)) pageTarget = targets.find((target) => target?.type === 'page' && target.webSocketDebuggerUrl) ?? null
  } catch {
    pageTarget = null
  }
  if (!pageTarget) {
    pageTarget = await getJson(`${base}/json/new?about:blank`, { method: 'PUT', timeoutMs })
    if (!pageTarget?.webSocketDebuggerUrl) throw new Error('the CDP endpoint created no page target to drive')
  }
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await waitForOpen(ws, timeoutMs)
  const session = createSession(ws, timeoutMs)
  await session.send('Page.enable')
  await session.send('Page.bringToFront')
  return session
}
