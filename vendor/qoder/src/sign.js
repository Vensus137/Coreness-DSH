/**
 * The COSY signature of a Qoder contour.
 *
 * The ten steps of the signature, in this package's code. The gateway
 * checks the constants against its own client, so they are wire facts and not settings:
 * the RSA key, the client type, the versions, the machine strings.
 *
 * The signature covers the body **as it goes on the wire** — for the chat call that is
 * the encoded body the transport sends, not the plaintext — so the caller must sign what it
 * sends, byte for byte.
 *
 * @module @coreness/qoder/src/sign
 */

import crypto from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** The key the gateway publishes to its clients; every request wraps its AES key with it. */
export const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDA8iMH5c02LilrsERw9t6Pv5Nc
4k6Pz1EaDicBMpdpxKduSZu5OANqUq8er4GM95omAGIOPOh+Nx0spthYA2BqGz+l
6HRkPJ7S236FZz73In/KVuLnwI8JJ2CbuJap8kvheCCZpmAWpb/cPx/3Vr/J6I17
XcW+ML9FoCI6AOvOzwIDAQAB
-----END PUBLIC KEY-----`

/** Client type the contour is used to; sent as `Cosy-Clienttype` and in the token calls. */
export const CLIENT_TYPE = '5'
/** Schema version of the payload envelope. */
export const COSY_VERSION = '1.0.0'
/**
 * The COSY version the vendor's web-search client names: the encoded shape with `1.1.44` is
 * what the live centre accepted. The chat contour uses the older `1.0.0`; the two are
 * different wire facts, not a setting.
 */
export const WEB_COSY_VERSION = '1.1.44'
/**
 * The machine OS string the vendor's request wrapper adds to its web-search call, in the
 * runtime's own spelling (`x86_64_win32`, not `x86_64_windows`): the value is derived from
 * the running client, exactly as the vendor derives it.
 */
export const WEB_MACHINE_OS = `${process.arch === 'arm64' ? 'aarch64' : process.arch === 'x64' ? 'x86_64' : process.arch}_${process.platform}`
/** Login-version header; its value is the contour's, not a choice. */
export const LOGIN_VERSION = 'v2'
/** Machine type field. */
export const MACHINE_TYPE = '5'
/** Machine OS field. */
export const MACHINE_OS = 'x86_64_windows'
/** Data-policy field. */
export const DATA_POLICY = 'disagree'
/** Client address field: the contour expects the client to name itself, not the socket. */
export const CLIENT_IP = '127.0.0.1'
/** The token calls carry this version rather than the signed one. */
export const TOKEN_COSY_VERSION = '1.0.1'

/** The file the provider keeps its own machine id in, under the harness home. */
export const MACHINE_ID_FILE = 'qoder-machine-id'

/**
 * The path the signature is computed over: the request path with a leading `/algo`
 * stripped. The query string is dropped with it — the URL on the wire keeps it.
 * @param {string} requestUrl absolute request address
 * @returns {string} the signature path
 */
export function signaturePath(requestUrl) {
  const { pathname } = new URL(requestUrl)
  return pathname.startsWith('/algo') ? pathname.slice('/algo'.length) : pathname
}

/**
 * The per-request AES key: a fresh UUID with its hyphens dropped, cut to sixteen
 * characters. The same sixteen bytes serve as the key and as the IV.
 * @param {string} uuid a fresh UUID
 * @returns {string} the key
 */
export function aesKeyOf(uuid) {
  return uuid.replace(/-/gu, '').slice(0, 16)
}

/**
 * The user envelope: the identity, encrypted so the gateway can read it and a relay cannot.
 */
export function userEnvelope(credentials, aesKey) {
  const plaintext = JSON.stringify({
    uid: credentials.userID,
    security_oauth_token: credentials.jobToken,
    name: credentials.name ?? '',
    aid: '',
    email: credentials.email ?? '',
  })
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(aesKey), Buffer.from(aesKey))
  return Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]).toString('base64')
}

/**
 * The AES key, wrapped with the contour's RSA public key (PKCS#1 v1.5).
 * @param {string} aesKey the per-request key
 * @returns {string} base64 ciphertext; the value of `Cosy-Key`
 */
export function wrappedKey(aesKey) {
  return crypto
    .publicEncrypt({ key: RSA_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(aesKey))
    .toString('base64')
}

/**
 * The payload envelope that carries the user envelope.
 * @param {{requestId: string, info: string, cosyVersion?: string}} input the fresh request id, the
 *   base64 user envelope and the COSY version the client names
 * @returns {string} base64 payload; the middle part of `Authorization`
 */
export function signaturePayload({ requestId, info, cosyVersion = COSY_VERSION }) {
  const payload = {
    version: 'v1',
    requestId,
    info,
    cosyVersion,
    ideVersion: '',
  }
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
}

/**
 * The string the signature is the digest of: five parts, single newlines, in this order.
 * Kept separate from its digest so a test can read the assembly rather than only its
 * result — this is the one place where an error is invisible until it is fatal.
 * @param {{payload: string, cosyKey: string, date: string, body: string, path: string}} parts
 *   the base64 payload, the base64 wrapped key, the timestamp, the body as text, the signature path
 * @returns {string} the signed string
 */
export function signatureText({ payload, cosyKey, date, body, path }) {
  return [payload, cosyKey, date, body, path].join('\n')
}

/**
 * The signature: MD5 of {@link signatureText}, hex.
 * @param {object} parts the same parts
 * @returns {string} hex digest
 */
export function signatureOf(parts) {
  return crypto.createHash('md5').update(signatureText(parts), 'utf8').digest('hex')
}

/**
 * MD5 of the raw body bytes, hex. An absent body hashes the empty input.
 * @param {Buffer | string | null | undefined} body the body as it goes on the wire
 * @returns {string} hex digest
 */
export function bodyHashOf(body) {
  return crypto.createHash('md5').update(body ?? Buffer.alloc(0)).digest('hex')
}

/**
 * The byte length of the body as a decimal string; `0` when there is none.
 * @param {Buffer | string | null | undefined} body the body as it goes on the wire
 * @returns {string} the length
 */
export function bodyLengthOf(body) {
  if (body === null || body === undefined) return '0'
  return String(Buffer.isBuffer(body) ? body.byteLength : Buffer.byteLength(body, 'utf8'))
}

/**
 * The machine id: the plugin's own, stable across runs, never random per request.
 *
 * It is a local fingerprint the signed calls carry, not a credential and not a value the vendor issues:
 * the plugin keeps it under the harness home and generates one on first use. The vendor client's own
 * home is never read — the plugin is its own client, and a fingerprint that changed between runs would
 * be the anomaly.
 * @param {{storeDir: string, fs?: object}} options where to look and to store
 * @returns {string} the machine id
 */
export function machineIdOf(options) {
  const { storeDir } = options
  const io = options.fs ?? { existsSync, mkdirSync, readFileSync, writeFileSync }
  const path = join(storeDir, MACHINE_ID_FILE)
  if (io.existsSync(path)) {
    const value = io.readFileSync(path, 'utf8').trim()
    if (value !== '') return value
  }
  const generated = crypto.randomUUID()
  io.mkdirSync(storeDir, { recursive: true, mode: 0o700 })
  io.writeFileSync(path, generated, { encoding: 'utf8', mode: 0o600 })
  return generated
}

/**
 * The headers one signed request carries.
 *
 * Everything is fresh per call except the machine id and the contour's constants: the
 * key, the payload and the signature are built from a new UUID and a new timestamp every
 * time, which is what makes two calls to the same address different by construction.
 *
 * The COSY version, the client type, the client address, the machine OS and the optional
 * business triplet are the caller's, with the contour's chat values as defaults: the web
 * search enters through the same signature but names the client that made it, while the
 * chat keeps its older shape.
 * @param {{body: Buffer | string | null, url: string, credentials: object, machineId: string,
 *   now?: () => number, uuid?: () => string, cosyVersion?: string, clientType?: string,
 *   clientIp?: string, machineOs?: string, businessProduct?: string, businessType?: string,
 *   scene?: string, extras?: boolean}} input the body as it goes on the wire, the absolute
 *   address, the profile identity plus the current job token, and the machine id
 * @returns {Record<string, string>} headers to merge into the request
 */
export function cosyHeaders({
  body,
  url,
  credentials,
  machineId,
  now = () => Date.now(),
  uuid = () => crypto.randomUUID(),
  cosyVersion = COSY_VERSION,
  clientType = CLIENT_TYPE,
  clientIp = CLIENT_IP,
  machineOs = MACHINE_OS,
  businessProduct,
  businessType,
  scene,
  extras = true,
}) {
  if (typeof credentials?.userID !== 'string' || credentials.userID === '') {
    throw new Error('cosy: the user id is empty — the profile call answers it, and no signature can be built without it')
  }
  if (typeof credentials.jobToken !== 'string' || credentials.jobToken === '') {
    throw new Error('cosy: the job token is empty — the token exchange answers it, and no signature can be built without it')
  }
  const requestId = uuid()
  const aesKey = aesKeyOf(uuid())
  const info = userEnvelope(credentials, aesKey)
  const cosyKey = wrappedKey(aesKey)
  const date = String(Math.floor(now() / 1000))
  const payload = signaturePayload({ requestId, info, cosyVersion })
  const path = signaturePath(url)
  const bodyText = body === null || body === undefined ? '' : Buffer.isBuffer(body) ? body.toString('utf8') : body
  const signature = signatureOf({ payload, cosyKey, date, body: bodyText, path })
  return {
    Authorization: `Bearer COSY.${payload}.${signature}`,
    'Cosy-Key': cosyKey,
    'Cosy-User': credentials.userID,
    'Cosy-Date': date,
    'Cosy-Version': cosyVersion,
    'Cosy-Machineid': machineId,
    'Cosy-Machinetoken': machineId,
    'Cosy-Machinetype': MACHINE_TYPE,
    'Cosy-Machineos': machineOs,
    'Cosy-Clienttype': clientType,
    'Cosy-Clientip': clientIp,
    ...businessProduct === undefined ? {} : { 'Cosy-Business-Product': businessProduct },
    ...businessType === undefined ? {} : { 'Cosy-Business-Type': businessType },
    ...scene === undefined ? {} : { 'Cosy-Scene': scene },
    'Cosy-Data-Policy': DATA_POLICY,
    'Login-Version': LOGIN_VERSION,
    ...extras === false ? {} : {
      'Cosy-Bodyhash': bodyHashOf(body),
      'Cosy-Bodylength': bodyLengthOf(body),
      'Cosy-Sigpath': path,
      'Cosy-Organization-Id': '',
      'Cosy-Organization-Tags': '',
      'X-Request-Id': requestId,
    },
  }
}

/**
 * The static header set the token calls carry instead of a signature.
 * @param {{json?: boolean}} options whether a JSON body is being sent
 * @returns {Record<string, string>} headers
 */
export function tokenHeaders({ json = true } = {}) {
  return {
    ...json ? { 'Content-Type': 'application/json' } : {},
    Accept: 'application/json',
    'Cosy-Version': TOKEN_COSY_VERSION,
    'Cosy-ClientType': CLIENT_TYPE,
  }
}
