/**
 * The four stores of one server, kept as the platform's own credential records.
 *
 * One record per server per store — the tokens, the client registration, the code verifier and the
 * state — under the credential scope this plugin owns. Nothing of the value lives here: no file of
 * ours, no map of ours, no process environment. Every write goes through the seam's own serialized
 * read-modify-write, which is what makes a token refresh safe where two processes could otherwise
 * lose each other's rotation, and every read re-reads, so a record another hand changed reaches the
 * next operation without a restart.
 *
 * The removal of one server's records stands here too, and it is the same function that names them: a
 * server's four keys are derived from the exact name and never discovered, because a scan of the scope
 * takes every server of this plugin and a read by prefix takes a neighbour whose id begins the same way.
 *
 * @module @coreness/oauth/src/stores
 */

import { createHash } from 'node:crypto'
import { isVerifier } from './pkce.js'
import { refuse } from './refusals.js'

/** The credential scope this plugin's records stand under; the id half names the server and the store. */
export const SCOPE = 'oauth'

/** The stores this plugin keeps, one record each. */
export const PARTS = ['tokens', 'client', 'verifier', 'state']

/**
 * The grammar of one half of a credential key, and so of every id this plugin derives.
 *
 * The seam addresses a record as `<scope>/<id>` and refuses a segment outside this, and it is the store's
 * parser that refuses it: a key outside the grammar is written into the file and then takes the whole
 * document with it at the next read.
 */
export const ID_PATTERN = /^[a-z][a-z0-9-]*$/

/** The shortest letter in front of a folded name that would lead with a digit, so every id stays addressable. */
const LEAD = 's-'

/** How much of the name's digest an id keeps: enough that two names cannot share an id by any reach. */
const HASH_LENGTH = 16

/**
 * The folded name of a server, without a store's own part.
 *
 * A server name is a person's own word and may carry characters a credential id does not take, so it
 * is folded to the alphabet an id takes — lower-cased, everything outside it a hyphen, the hyphens at
 * both ends dropped. The fold is not unique (two names can fold together), so it is never the id on
 * its own: the digest below finishes what the fold loses.
 * @param {string} server the server's name
 * @returns {string} the folded name
 */
export function slugOf(server) {
  const folded = String(server ?? '').toLowerCase().replace(/[^a-z0-9-]+/gu, '-').replace(/^-+|-+$/gu, '')
  return folded === '' ? 'server' : folded
}

/** The digest an id keeps of the exact name, so two names that fold together never share one. */
function digestOf(server) {
  return createHash('sha256').update(server, 'utf8').digest('hex').slice(0, HASH_LENGTH)
}

/**
 * The half of every credential key that names one server.
 *
 * A name kept exactly in the alphabet an id takes — lower case, no leading digit, no character the
 * fold would change — keeps the id it always had, so no grant of anybody's moves. Every other name
 * carries a digest of its exact spelling: that is what separates `my_server` from `my-server`, `Foo`
 * from `foo`, and a name leading with a digit from the same name with `s-` in front, all of which
 * fold to one string. The digest is taken over the name as written, so the fold's loss cannot make
 * two names meet again.
 * @param {string} server the server's name
 * @returns {string} the id half of the credential key, without a store's own part
 */
export function idHalfOf(server) {
  const name = String(server ?? '')
  const folded = slugOf(name)
  const plain = ID_PATTERN.test(folded) ? folded : `${LEAD}${folded}`
  return name === folded && /^[a-z]/u.test(folded) ? folded : `${plain}-${digestOf(name)}`
}

/**
 * The credential id of one store of one server.
 * @param {string} server the server's name
 * @param {string} part the store, one of `PARTS`
 * @returns {string} the id half of the credential key
 */
export function idOf(server, part) {
  return `${idHalfOf(server)}-${part}`
}

/** The credential key of one store of one server, in the seam's own joined form. */
export const keyOf = (server, part) => `${SCOPE}/${idOf(server, part)}`

/**
 * The platform record shape this plugin writes: a grant with one store under its own name.
 *
 * The shape stands here because the stores own it — the step commits a record the flow produced and
 * never spells the payload itself.
 * @param {string} part the store, one of `PARTS`
 * @param {unknown} value what the record holds under that store
 * @returns {{kind: string, payload: object}} the record
 */
export function recordOf(part, value) {
  return { kind: 'grant', payload: { [part]: value } }
}

/**
 * The stores over one credential service.
 *
 * The service is handed in rather than reached for, so the same object answers a real service and a
 * double, and the tests of this plugin never touch a store of anybody's.
 */
export class RecordStores {
  /** @type {object} the platform's credential service, as the seam describes it */
  #credentials
  /** @type {string} the server these stores belong to */
  #server

  /**
   * @param {object} credentials the credential service (`readRecord`, `modifyRecord`)
   * @param {string} server the server's name
   */
  constructor(credentials, server) {
    this.#credentials = credentials
    this.#server = String(server)
  }

  /**
   * The payload of one store, or undefined while nothing is stored.
   * @param {string} part the store, one of `PARTS`
   * @returns {Promise<object | undefined>} what the record holds
   */
  async read(part) {
    const record = await this.#credentials.readRecord(keyOf(this.#server, part))
    if (record === undefined) return undefined
    if (record.kind !== 'grant') return undefined
    const payload = record.payload
    return payload !== null && typeof payload === 'object' ? payload : undefined
  }

  /**
   * Replace one store's payload, or remove the record when the payload is undefined.
   *
   * A replacement goes through the seam's serialized read-modify-write, whose read is the lock: the
   * value a write stands on is the one that holds at the moment the write is exclusive, so two flows of
   * one server cannot interleave. A removal goes through the seam's own delete, because a modify whose
   * mutate answers nothing leaves the record exactly as it stands — that is the seam's rule and not a
   * convenience of this file.
   * @param {string} part the store, one of `PARTS`
   * @param {object | undefined} payload what the store should hold
   * @returns {Promise<void>} when the write has committed
   */
  async write(part, payload) {
    const key = keyOf(this.#server, part)
    if (payload === undefined) {
      await this.#credentials.deleteRecord(key)
      return
    }
    await this.#credentials.modifyRecord(key, async () => recordOf(part, payload[part]))
  }

  /**
   * The platform record one store would be committed as, without writing it.
   *
   * The step hands this to the platform's commit door: the record's kind and payload grammar have one
   * owner — here — and a caller that commits a grant never spells either.
   * @param {string} part the store, one of `PARTS`
   * @param {unknown} value what the record holds under that store
   * @returns {{kind: string, payload: object}} the record
   */
  record(part, value) {
    return recordOf(part, value)
  }

  /** The tokens of this server, as the flow asks for them. */
  async tokens() {
    const held = await this.read('tokens')
    return held?.tokens ?? undefined
  }

  /** Store the tokens of this server. */
  async saveTokens(tokens) {
    await this.write('tokens', { tokens })
  }

  /** The client registration of this server, as the flow asks for it. */
  async clientInformation() {
    const held = await this.read('client')
    return held?.client ?? undefined
  }

  /** Store the client registration of this server. */
  async saveClientInformation(client) {
    await this.write('client', { client })
  }

  /** The code verifier of this server. */
  async codeVerifier() {
    const held = await this.read('verifier')
    const value = held?.verifier
    if (!isVerifier(value)) throw refuse('no-code-verifier', this.#server)
    return value
  }

  /** Store the code verifier of this server; a value outside the grammar never reaches the record. */
  async saveCodeVerifier(value) {
    if (!isVerifier(value)) throw new Error(`oauth: refusing to store a code verifier outside the standard's grammar for ${this.#server}`)
    await this.write('verifier', { verifier: value })
  }

  /** The state this server's browser step was started with. */
  async state() {
    const held = await this.read('state')
    return typeof held?.state === 'string' ? held.state : undefined
  }

  /** Store the state of this server's browser step. */
  async saveState(state) {
    await this.write('state', { state: String(state) })
  }

  /**
   * Drop every store of this server — the four records, and nothing else.
   *
   * The keys are derived from the exact name and never discovered: a scan of the scope or a read by
   * prefix would take a neighbour whose id begins the same way, or every server of this plugin, and a
   * key is what tells one server's record from another's. What stood is asked with the seam's own
   * description, which answers whether a record is set and never its value, so no token crosses this
   * call, and the removal itself is the seam's own delete.
   * @returns {Promise<{server: string, dropped: string[]}>} the server, and the keys that stood and went
   */
  async forget() {
    const dropped = []
    for (const part of PARTS) {
      const key = keyOf(this.#server, part)
      const stood = (await this.#credentials.describeRecord(key))?.configured === true
      await this.write(part, undefined)
      if (stood) dropped.push(key)
    }
    return { server: this.#server, dropped }
  }
}
