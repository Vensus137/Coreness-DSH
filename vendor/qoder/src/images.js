/**
 * The pictures of a request: the bytes behind the durable references the harness hands over, and the
 * one pass that fills them in before the body is built.
 *
 * The harness never gives an adapter bytes: an `image` content block carries a durable, normalized
 * reference and the adapter resolves it through the attachment store itself. The bytes are read here —
 * one pass, before the body, which is synchronous and pure by design — and they travel beside the
 * reference as base64, the shape the platform's own attachment answer uses (`{attachment, data:
 * base64}`).
 *
 * Two things are refused in words rather than resolved: a reference whose bytes the store will not
 * give (its own error code and sentence travel, so the reader sees what the store said), and a media
 * type the vendor's own reader does not accept ({@link IMAGE_MEDIA_TYPES}) — an unsupported type is
 * answered by the vendor with a note instead of an image, which is a picture the model would never see.
 *
 * @module @coreness/qoder/src/images
 */

import { IMAGE_MEDIA_TYPES } from './body.js'

/** A picture this route cannot carry, in words, with the platform's own code for it. */
function unsupported(message) {
  return Object.assign(new Error(message), { code: 'UNSUPPORTED_CONTENT' })
}

/**
 * The reader of one attachment's bytes, as base64.
 *
 * The store is asked per call rather than captured at mount: a profile may mount it later, and the
 * reference is the only thing that has to be durable. A store that is not mounted at all is a refusal
 * in words, not an empty answer — a route that declares pictures and cannot read them must say so.
 * @param {object} ctx the cordis context
 * @returns {(ref: object, signal?: AbortSignal) => Promise<string>} base64 of the normalized picture
 */
export function createImageReader(ctx) {
  return async (ref, signal) => {
    const store = ctx?.get?.('attachments')
    if (store === undefined || store === null) {
      throw unsupported('no attachment store is mounted, and this route reads a picture through it: the shipped base mounts one as @deepseek-ai/dsh-attachment-local (dsh-base/cordis.patch.yml, row attachment-local)')
    }
    const mediaType = typeof ref?.mediaType === 'string' ? ref.mediaType : ''
    if (!IMAGE_MEDIA_TYPES.includes(mediaType)) {
      throw unsupported(`this route carries ${IMAGE_MEDIA_TYPES.join(', ')} — the types the Qoder reader accepts — and the attachment is ${mediaType === '' ? 'of no named type' : mediaType}`)
    }
    const stored = await store.readImage(ref, signal)
    return Buffer.from(stored.data).toString('base64')
  }
}

/**
 * The messages of one attempt, with the bytes of every picture filled in beside its reference.
 *
 * A message without a picture comes back as it arrived — the same object, so a text-only turn is
 * untouched. A picture the platform marked **offloaded** is left alone on purpose: it is not sent at
 * all, and the body writes the platform's placeholder where it stood (`offloadedText`).
 * One attachment occurring several times in one request is read once.
 * @param {readonly object[]} messages harness-shaped messages
 * @param {(ref: object, signal?: AbortSignal) => Promise<string>} [load] the reader of one attachment's bytes
 * @param {AbortSignal} [signal] the caller's cancellation
 * @returns {Promise<readonly object[]>} the messages, with `data` beside the reference of every picture
 */
export async function resolveImages(messages, load, signal) {
  if (!Array.isArray(messages)) return messages
  const carries = (message) => Array.isArray(message?.content) && message.content.some((block) => block?.type === 'image' && block.offloaded !== true)
  if (!messages.some(carries)) return messages
  if (typeof load !== 'function') {
    throw unsupported('this route carries pictures and no reader of attachment bytes was wired to it: the adapter needs the attachment store')
  }
  const pending = new Map()
  const dataOf = (ref) => {
    const key = typeof ref?.attachmentId === 'string' && ref.attachmentId !== '' ? ref.attachmentId : `unidentified:${String(ref?.mediaType ?? '')}`
    let flight = pending.get(key)
    if (flight === undefined) {
      flight = Promise.resolve().then(() => load(ref, signal))
      pending.set(key, flight)
    }
    return flight
  }
  const resolved = []
  for (const message of messages) {
    if (!carries(message)) {
      resolved.push(message)
      continue
    }
    const blocks = []
    for (const block of message.content) {
      if (block?.type === 'image' && block.offloaded !== true) {
        blocks.push({ ...block, data: await dataOf(block.attachment) })
        continue
      }
      blocks.push(block)
    }
    resolved.push({ ...message, content: blocks })
  }
  return resolved
}
