/**
 * The request body of the chat call: the wire shape of a conversation, the envelope of
 * node constants around it, and the encoder the `Encode=1` parameter turns on.
 *
 * The envelope's constants are the contour's, not settings: the gateway checks them against its own CLI.
 *
 * @module @coreness/dsh/plugins/provider/qoder/body
 */

import crypto from 'node:crypto'

export const QODER_ALPHABET = '_doRTgHZBKcGVjlvpC,@aFSx#DPuNJme&i*MzLOEn)sUrthbf%Y^w.(kIQyXqWA!'

/** The standard alphabet the substitution table is built from. */
export const STANDARD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** The default output budget when neither the call nor the model declares one. */
export const DEFAULT_MAX_TOKENS = 32_768

/**
 * The vendor's own effort vocabulary, ascending: their budget-to-name map reads
 * `<=0 none, <=1024 low, <=8192 medium, <=24576 high, <=49152 xhigh, else max`. It is the only order
 * these names have — a catalogue entry publishes its menu as an object, and this route's own menu
 * declares three of the names — and it is the order the shipped rows were read against and the one the
 * product's page ranks a model's menu with (`rankOf`). Nothing on the wire is substituted by it: the
 * effort a row names travels as it stands.
 */
export const VENDOR_EFFORTS = Object.freeze(['none', 'low', 'medium', 'high', 'xhigh', 'max'])

/**
 * The substitution table: base64 character to contour character, `=` to `$`, everything
 * else unchanged. Built once — the body is encoded on every request and grows with the
 * conversation.
 */
const SUBSTITUTION = (() => {
  const table = new Uint8Array(256)
  for (let code = 0; code < 256; code += 1) table[code] = code
  table[0x3d] = 0x24
  for (let index = 0; index < STANDARD_ALPHABET.length; index += 1) {
    table[STANDARD_ALPHABET.charCodeAt(index)] = QODER_ALPHABET.charCodeAt(index)
  }
  return table
})()

/**
 * Encode a body for the wire: base64, the third rearrangement, the alphabet substitution.
 * @param {string | Buffer} plaintext the JSON body
 * @returns {string} the encoded body (ASCII)
 */
export function encodeBody(plaintext) {
  const standard = Buffer.isBuffer(plaintext)
    ? plaintext.toString('base64')
    : Buffer.from(plaintext, 'utf8').toString('base64')
  const n = standard.length
  const a = Math.floor(n / 3)
  const rearranged = standard.slice(n - a) + standard.slice(a, n - a) + standard.slice(0, a)
  const source = Buffer.from(rearranged, 'latin1')
  const out = Buffer.allocUnsafe(n)
  for (let index = 0; index < n; index += 1) out[index] = SUBSTITUTION[source[index]]
  return out.toString('latin1')
}

/**
 * The blank line the wire's own joined strings are set apart by.
 *
 * Two places join with it: the top-level `system` string, where every system-role message is flattened
 * into one prompt (the shape the donor's serializer used — `serializeMessages` returns
 * `systemParts.join('\n\n')` and `buildRequestBody` prefixes the caller's own prompt with the same
 * blank line) and one assistant turn's `reasoning_content`, where the field is a single string and the
 * pieces of a thought that arrived as several blocks are set apart rather than run together.
 */
export const BLANK_LINE = '\n\n'

/**
 * The four media types the vendor's own reader accepts — `image/png`, `image/jpeg`, `image/gif`,
 * `image/webp` — which are also the four the harness's attachment store admits. A picture outside the
 * four is one the vendor answers with a note of its own instead of an image, so the route refuses it
 * where its bytes are read rather than sending it.
 */
export const IMAGE_MEDIA_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

/** A message this route cannot put on the wire, in words, with the platform's own code for it. */
function wireRefusal(message) {
  return Object.assign(new Error(message), { code: 'UNSUPPORTED_CONTENT' })
}

/** The kind of one block, for a refusal that names what it met. */
function kindOf(block) {
  return block === null || typeof block !== 'object' ? typeof block : String(block.type)
}

/** One attachment named as its own reference names it: the display name when there is one, the id always. */
function attachmentRef(ref) {
  const id = typeof ref?.attachmentId === 'string' && ref.attachmentId !== '' ? ref.attachmentId : 'unknown attachment'
  return typeof ref?.name === 'string' && ref.name !== '' ? `"${ref.name}" (${id})` : id
}

/**
 * The visible text of one message's blocks: the text blocks joined as they always were, a picture
 * passed over by *this* reader alone, and anything else refused.
 *
 * The refusal is the point. A block the transport cannot read used to be skipped in silence, which is
 * how a picture inside a tool result left the model talking about an image it had never seen.
 * @param {readonly object[]} blocks the message's content blocks
 * @param {string} where what the refusal names as the carrier
 * @returns {string} the joined visible text
 */
function textOfBlocks(blocks, where) {
  let text = ''
  for (const block of blocks) {
    if (block?.type === 'text') {
      if (typeof block.text === 'string') text += block.text
      continue
    }
    if (block?.type === 'image') continue
    throw wireRefusal(`${where} carries a content block of a kind this route cannot represent: "${kindOf(block)}"`)
  }
  return text
}

/**
 * The text of one message's content, blocks or a plain string, with the same refusal.
 * @param {readonly object[] | string | undefined} content blocks or a plain string
 * @param {string} where what the refusal names as the carrier
 * @returns {string} the joined visible text
 */
function textOfContent(content, where) {
  if (typeof content === 'string') return content
  return Array.isArray(content) ? textOfBlocks(content, where) : ''
}

/**
 * The data URL of one picture whose bytes the adapter has resolved.
 *
 * The form is the vendor's own: its converter builds exactly this for one image source, and a user
 * message carries it the same way.
 * @param {object} block the message's picture block, with its bytes
 * @returns {string | undefined} the data URL, or undefined when the block carries no bytes or no type
 */
function imageUrlOf(block) {
  const mediaType = block?.attachment?.mediaType
  if (typeof mediaType !== 'string' || mediaType === '') return undefined
  const data = block?.data
  if (typeof data !== 'string' || data === '') return undefined
  return `data:${mediaType};base64,${data}`
}

/**
 * The placeholder one **offloaded** picture stands for, in this route's own words.
 *
 * The mark is the platform's (`ImageBlock.offloaded`, set by the compaction's image-offload step once a
 * route has refused a request with `IMAGE_OFFLOAD_REQUIRED`), and every route is expected to send
 * placeholder text where such an occurrence stands. The host's own sentence for it is
 * `offloadedImageText` in `@deepseek-ai/dsh-llm`, a package this product declares no dependency on —
 * the platform's own providers carry it as a peer; quoting it *whole* would cost a second joint as
 * well, because its full form also names the read-only copy the model can open, which comes from the
 * attachment store mapped through the filesystem service. So the sentence is written here: it names the
 * attachment that stood there and the recovery the host's own text names too, and claims nothing else.
 *
 * What this cannot cost today: this route never answers `IMAGE_OFFLOAD_REQUIRED` — it declares no image
 * budget — so the mark cannot be written on its behalf, and the placeholder is a reading of a state
 * reached only by a session that another route offloaded. The divergence is named here rather than
 * carried silently, and it is the lead's to weigh against a declared dependency.
 * @param {object} ref the durable reference the occurrence stood for
 * @returns {string} the placeholder
 */
export function offloadedText(ref) {
  const id = typeof ref?.attachmentId === 'string' ? ref.attachmentId : ''
  const digest = id.startsWith('sha256:') ? id.slice('sha256:'.length, 'sha256:'.length + 8) : id
  const named = typeof ref?.name === 'string' && ref.name !== '' ? `"${ref.name}" ` : ''
  return `[image omitted to fit a request image limit; ${named}sha256:${digest}. The attachment is still stored — attach it again if it must be seen.]`
}

/** Whether one block is a picture occurrence. */
function isPicture(block) {
  return block?.type === 'image'
}

/**
 * The content of one message that carries a picture, as the vendor's own content parts.
 *
 * A picture travels as `{"type":"image_url","image_url":{"url":"data:<mime>;base64,<data>"}}` beside
 * the text parts around it, which is what the vendor's own converter builds for one image source, as a
 * user message carries it. Two shapes
 * are refused rather than passed on: a picture whose bytes the adapter did not resolve, and a block of
 * any other kind — the transport is the last place a part could otherwise leave in silence.
 * @param {readonly object[]} blocks the message's content blocks
 * @param {string} where what the refusal names as the carrier
 * @returns {object[]} the parts
 */
function contentParts(blocks, where) {
  const parts = []
  for (const block of blocks) {
    if (block?.type === 'text') {
      parts.push({ type: 'text', text: typeof block.text === 'string' ? block.text : '' })
      continue
    }
    if (block?.type === 'image') {
      if (block.offloaded === true) {
        parts.push({ type: 'text', text: offloadedText(block.attachment) })
        continue
      }
      const url = imageUrlOf(block)
      if (url !== undefined) {
        parts.push({ type: 'image_url', image_url: { url } })
        continue
      }
      throw wireRefusal(`${where} carries a picture this route did not resolve into bytes: ${attachmentRef(block.attachment)}`)
    }
    throw wireRefusal(`${where} carries a content block of a kind this route cannot represent: "${kindOf(block)}"`)
  }
  return parts
}

/**
 * The text of one system-role message, which is a prompt and nothing else.
 *
 * The platform writes a system message as text blocks alone (`createSystemMessage`), so a picture or
 * any other kind of block here is a shape this route has never met and is refused in words rather than
 * folded into the prompt.
 * @param {object} message the harness system message
 * @returns {string} the prompt text of that message
 */
function systemTextOf(message) {
  const blocks = Array.isArray(message.content) ? message.content : []
  let text = ''
  for (const block of blocks) {
    if (block?.type === 'text') {
      if (typeof block.text === 'string') text += block.text
      continue
    }
    throw wireRefusal(`a system message carries a content block of a kind this route cannot represent: "${kindOf(block)}"`)
  }
  return text
}

/**
 * One conversation as the wire wants it.
 *
 * The shape is the contour's: one top-level `system` string, built here from **every system-role
 * message** in their order — the platform hands the prompt that way and asserts that no separate field
 * exists, a loop-built request carrying `options.system === undefined`, while both of the platform's
 * own providers read the prompt out of the messages — and a caller that does provide `options.system`
 * has it as the prefix, the shape the donor's own `buildRequestBody` used. That flattened string is
 * also the **leading message** of `messages` when it is not empty, which is the shape the vendor's own
 * client builds: the gateway does not read the top-level field, so the message is the half that carries
 * the prompt. A tool result is a `tool` message
 * naming the call it answers; an assistant message with no text is an **empty string and never
 * `null`** — the contour drops a null-content assistant message together with its calls, and the
 * following result is then refused for having no call before it. A message carrying a picture travels
 * as the vendor's content parts instead of a string ({@link contentParts}), a past turn's thinking
 * travels in the message's own `reasoning_content` field, and a block this route cannot represent is
 * refused rather than dropped. The `developer` channel — the tool-set changes — is the one message
 * that is deliberately not sent; a role outside the platform's own vocabulary is refused in words.
 * @param {readonly object[]} messages harness-shaped messages (role, content blocks, toolCallId)
 * @param {{system?: string}} [options] the prompt a caller of its own provides, ahead of the messages'
 * @returns {{system: string, messages: object[], originalContent: string}} the wire parts
 */
export function toWireMessages(messages, options = {}) {
  const system = []
  if (typeof options.system === 'string' && options.system !== '') system.push(options.system)
  const wire = []
  let originalContent = ''
  for (const message of messages ?? []) {
    if (message === null || typeof message !== 'object') continue
    const blocks = Array.isArray(message.content) ? message.content : []
    if (message.role === 'system') {
      const text = systemTextOf(message)
      if (text !== '') system.push(text)
      continue
    }
    // The `developer` channel carries the tool-set changes, and it is deliberately **not sent**: the
    // wire's own roles are `user`, `assistant` and `tool` — `system` travels as the top-level string —
    // and no role carries a tool-set change. Nothing is lost by it: the declarations of every activated
    // tool travel in `tools` (`projectToolUpdates`), so a message naming the addition adds nothing the
    // model does not already have. Most never reach here at all: under this route's `addition-only`
    // mode the projection strips a `tool-removal` block, and a message left with no content is dropped
    // before dispatch — exactly the shape of the two developer messages in this project's own sessions
    // (58 `tool-removal` blocks, no additions). This is the one message that is skipped on purpose, and
    // the reason is here so that the skip is read as a decision and not as an omission.
    if (message.role === 'developer') continue
    if (message.role === 'user') {
      const text = textOfContent(message.content, 'a user message')
      // A turn with no picture keeps the plain string it has always carried; a picture turns the
      // content into the vendor's parts, with the text of the message beside it.
      wire.push({ role: 'user', content: blocks.some(isPicture) ? contentParts(blocks, 'a user message') : text })
      originalContent = text
      continue
    }
    if (message.role === 'assistant') {
      // The visible answer and a past turn's thinking travel in **two fields of the message**, which is
      // the vendor's own shape: its client builds `{role:"assistant", content:<visible>}` and then sets
      // `reasoning_content` on it (the vendor's own bundle: `a&&(g.reasoning_content=a)`), and its
      // converters keep that field (`A.reasoning_content&&(e.reasoning_content=…)`). So
      // nothing of ours is folded into the visible text: `content` carries the answer alone, and
      // `reasoning_content` — the wire's own channel for a past turn's thought — carries the thinking,
      // set apart by a blank line where a turn produced several reasoning blocks, because the field is
      // one string. What is not kept is the order between a thought and the words it produced: the two
      // fields are separate in the vendor's own messages as well.
      const texts = []
      const thoughts = []
      const toolCalls = []
      for (const block of blocks) {
        if (block?.type === 'text') {
          if (typeof block.text === 'string') texts.push(block.text)
          continue
        }
        if (block?.type === 'reasoning') {
          if (typeof block.text === 'string' && block.text !== '') thoughts.push(block.text)
          continue
        }
        if (block?.type === 'tool-call') {
          toolCalls.push({
            id: block.id,
            type: 'function',
            function: { name: block.name, arguments: typeof block.arguments === 'string' ? block.arguments : JSON.stringify(block.arguments ?? {}) },
          })
          continue
        }
        // The same rule as elsewhere in this reader: a block the route cannot place is refused in
        // words. A picture here is the vendor's own refusal too — its converter rejects an image in an
        // assistant message on the wire families that cannot carry one.
        throw wireRefusal(`an assistant message carries a content block of a kind this route cannot represent: "${kindOf(block)}"`)
      }
      wire.push({
        role: 'assistant',
        content: texts.join(''),
        ...thoughts.length === 0 ? {} : { reasoning_content: thoughts.join(BLANK_LINE) },
        ...toolCalls.length === 0 ? {} : { tool_calls: toolCalls },
      })
      continue
    }
    if (message.role === 'tool') {
      wire.push({
        role: 'tool',
        tool_call_id: message.toolCallId,
        content: toolContent(message),
      })
      continue
    }
    // The roles above are the platform's own vocabulary for a message (`system`, `user`, `assistant`,
    // `tool`, `developer`), so a role outside it is a shape this route has never met: it is refused in
    // words, with the role named, rather than dropped whole. A silent skip here would lose an entire
    // message and look like the model misbehaving later — the very failure this reader exists to keep
    // out.
    throw wireRefusal(`a message carries a role this route cannot represent: "${String(message.role)}"`)
  }
  // The prompt travels in **two** places, and the vendor's own client is the ground for both: it joins
  // the system texts with a blank line and then puts that same string at the head of the wire's own
  // message list, beside the top-level field it also fills. The message is the one that arrives: a
  // 10 118-character prompt carried in the field alone moved the vendor's prompt count by **zero**
  // tokens and its cache by zero blocks, and a passphrase standing in it and asked for by name was
  // answered "none was provided in my context". An empty prompt emits nothing, which is their own
  // condition.
  const flat = system.join(BLANK_LINE)
  return {
    system: flat,
    messages: flat === '' ? wire : [{ role: 'system', content: flat }, ...wire],
    originalContent,
  }
}

/**
 * The body of a tool result: the output plus the flag that says whether the call failed.
 * The flag is the model's only signal that a call should be tried again.
 * @param {object} message the harness tool message
 * @returns {string} the wire body
 */
export function toolResultBody(message) {
  const output = textOfContent(message.content, 'a tool result')
  return message.isError === true ? JSON.stringify({ output, isError: true }) : output
}

/**
 * The content of one tool result: the output alone, or the vendor's parts where the result carries a
 * picture.
 *
 * A picture inside a tool result is a shape this platform produces: `read_image` returns one ("A
 * successful `read_image` returns … the image itself as a native image block"), and the MCP bridge
 * projects an image result into the tool message once the route declares that it reads pictures. The
 * seventeen such occurrences already recorded in this project's own sessions were sent as text alone,
 * so the model spoke of pictures it had never seen; the vendor's own converter carries them as the same
 * parts it builds for a user message. A failed result carrying a picture has no single form on this wire — the
 * output is one JSON string and the picture is a part — and is refused rather than resolved silently.
 * @param {object} message the harness tool message
 * @returns {string | object[]} the wire body
 */
export function toolContent(message) {
  const blocks = Array.isArray(message.content) ? message.content : []
  if (!blocks.some(isPicture)) return toolResultBody(message)
  if (message.isError === true) throw wireRefusal('a failed tool result carries a picture, which this wire has no single form for: the output is one string and the picture is a part')
  return contentParts(blocks, 'a tool result')
}

/**
 * The tool declarations as the contour takes them: OpenAI form, `parameters` a schema.
 * @param {readonly object[] | undefined} tools harness tool definitions
 * @returns {object[]} the wire array (empty when there are none)
 */
export function toWireTools(tools) {
  return (tools ?? []).map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.parameters ?? { type: 'object', properties: {} },
    },
  }))
}

/**
 * The digest that identifies one request to the contour.
 *
 * It is what keeps the platform's re-ask of a step one request rather than two: the wire model, the
 * flattened system prompt and every message contribute, the tool calls included. **The output budget
 * does not**, and deliberately so. The platform's own retry re-asks the same step and may reach it with
 * the budget re-derived — a ceiling re-read, a model choice re-read — and a value that moved with the
 * budget would make the re-ask a *different request*, which is the one thing it exists to prevent. Because the messages are inside it,
 * the digest describes the request rather than some host-side record: two requests of one conversation
 * differ as soon as their messages do, and what the budget's exclusion protects is the re-ask.
 * Nothing is hidden by leaving the budget out: it still travels
 * in `parameters.max_tokens` and `model_config.max_output_tokens`, where the contour reads it as what
 * it is, and the per-call identity has a field of its own in `request_id`, fresh on every request.
 * @param {{model: string, system: string, messages: readonly object[]}} input the request's head
 * @returns {string} sixteen hex characters
 */
export function recordIdOf({ model, system, messages }) {
  const hash = crypto.createHash('sha256')
  hash.update('qoder-record\0')
  hash.update(String(model))
  hash.update('\0')
  hash.update(String(system))
  for (const message of messages) {
    hash.update('\0')
    hash.update(String(message.role ?? ''))
    hash.update('\0')
    hash.update(String(message.tool_call_id ?? ''))
    hash.update('\0')
    const content = message.content
    hash.update(typeof content === 'string' ? content : JSON.stringify(content ?? null))
    for (const call of message.tool_calls ?? []) {
      hash.update('\0')
      hash.update(`${String(call.id ?? '')}:${String(call.function?.name ?? '')}:${String(call.function?.arguments ?? '')}`)
    }
  }
  return hash.digest('hex').slice(0, 16)
}

/**
 * The session the account's requests belong to on this model.
 *
 * One value per account and model, stable across restarts — the contour's own notion, so
 * it is derived the same way on every call.
 * @param {{userID: string, model: string}} input the profile's user id and the wire model key
 * @returns {string} sixteen hex characters
 */
export function sessionIdOf({ userID, model }) {
  return crypto.createHash('sha256').update(`qoder-session\0${userID}\0${model}`).digest('hex').slice(0, 16)
}

/**
 * The request body of one chat call.
 *
 * `parameters` carries only what the contour executes: `max_tokens`, and `reasoning_effort` exactly as
 * the row names it — a name the model's menu does not publish travels as asked, because the wire takes
 * it (a live turn carried `max` to a model whose menu is `xhigh|low|medium` and was answered), and
 * asking for `off` means leaving the field out and saying so in `is_reasoning`. The flag is a claim about the
 * **model**, not about the user's wish: where the transport hands over what the catalogue reads for the
 * model, that read is what travels, and where the catalogue has not answered the flag is derived from the
 * effort as it always was — the row's model list is deliberately independent of a control call that may
 * be down, and the effort the user named, `max` included, must not be lost to it.
 * @param {object} input the call
 * @param {string} input.model wire model key
 * @param {string} input.userID the profile's user id
 * @param {string} input.system the system prompt as one string
 * @param {object[]} input.messages wire messages of {@link toWireMessages}
 * @param {string} input.originalContent the last user text
 * @param {object[]} input.tools wire tools
 * @param {number} [input.maxTokens] output budget
 * @param {string} [input.reasoningEffort] the effort, absent when reasoning is off
 * @param {{isReasoning: boolean, efforts: string[]}} [input.modelRecord] the catalogue's own read of
 *   the model — its flag, and the effort menu it publishes (`[]` when it publishes none); absent when
 *   the catalogue has not answered
 * @param {string} input.requestId a fresh request id
 * @param {number} input.startedAt epoch milliseconds
 * @returns {object} the body
 */
export function buildChatBody(input) {
  const maxTokens = Number.isFinite(input.maxTokens) && input.maxTokens > 0 ? input.maxTokens : DEFAULT_MAX_TOKENS
  // What the user asked for: a named effort other than `off` means reasoning on. `off` overrides the
  // catalogue too — their own guard forces the flag down wherever thinking is off, because a request
  // that turned thinking off must not claim to reason.
  const asked = typeof input.reasoningEffort === 'string' && input.reasoningEffort !== '' && input.reasoningEffort !== 'off'
  // The flag is the catalogue's read where the catalogue answered — their builder never derives it from
  // the effort — and the derivation stands where it did not answer.
  const record = input.modelRecord
  const reasoning = asked && (record === undefined || record.isReasoning === true)
  // The effort travels exactly as the row names it. Their own guard would send a listed name only, or
  // any name where the record publishes no menu, and their reader normalises an empty menu away. This
  // route does not substitute: the user's decision is that the control and the row carry what
  // the model's own menu names, and the wire takes a name a menu does not publish — measured twice (a
  // live turn carried `max` to a model whose menu is `xhigh|low|medium` and was answered normally, 79
  // reasoning tokens; and `xhigh` reached `auto`, which publishes no menu at all).
  const effort = asked ? input.reasoningEffort : undefined
  const originalContent = input.originalContent ?? ''
  const recordId = recordIdOf({
    model: input.model,
    system: input.system,
    messages: input.messages,
  })
  return {
    request_id: input.requestId,
    request_set_id: recordId,
    chat_record_id: recordId,
    session_id: sessionIdOf({ userID: input.userID, model: input.model }),
    stream: true,
    chat_task: 'FREE_INPUT',
    is_reply: true,
    is_retry: false,
    source: 1,
    version: '3',
    session_type: 'qodercli',
    agent_id: 'agent_common',
    task_id: 'common',
    code_language: '',
    chat_prompt: '',
    image_urls: null,
    aliyun_user_type: '',
    system: input.system,
    messages: input.messages,
    tools: input.tools ?? [],
    parameters: {
      max_tokens: maxTokens,
      ...effort === undefined ? {} : { reasoning_effort: effort },
    },
    chat_context: {
      chatPrompt: '',
      imageUrls: null,
      extra: {
        context: [],
        modelConfig: { key: input.model, is_reasoning: reasoning },
        originalContent,
      },
      features: [],
      text: originalContent,
    },
    model_config: {
      key: input.model,
      is_reasoning: reasoning,
      max_output_tokens: maxTokens,
      source: 'system',
    },
    business: {
      product: 'cli',
      version: '1.0.0',
      type: 'agent',
      stage: 'start',
      id: input.requestId,
      name: originalContent.slice(0, 30),
      begin_at: input.startedAt,
    },
  }
}
