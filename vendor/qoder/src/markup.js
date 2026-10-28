/**
 * The way in: the tags this contour sometimes writes into the visible channel instead of using the
 * channels it has, the families they come in, and the one treatment each family gets.
 *
 * The rule the module exists for is the user's own caution: **nothing that arrives from the wire is
 * handled silently.** Every tag token meets exactly one of four treatments — assembled into a call,
 * routed to the reasoning channel, dropped with its body, or refused — and every one of them is
 * counted under a stable name, so that a move is legible afterwards instead of surfacing as
 * the model behaving strangely weeks later.
 *
 * Measured ground, not a preference: no markup of ours stands in the body that goes out, no tag of the
 * vendor's is returned into the visible text; and a retelling arrives in the summary family in the
 * visible channel, where the decided treatment is to drop it whole and count it. The families and their
 * spellings are the wire's own, plus the spellings this contour was watched to use, including the
 * striped gateway form captured live.
 *
 * @module @coreness/qoder/src/markup
 */

/** The reasoning family: thoughts written as tags where the contour has `reasoning_content`. */
export const REASONING_TAGS = Object.freeze(['thinking', 'think', 'thought', 'reasoning', 'analysis'])

/** The note family: the model's own narration about the work it is doing. */
export const NOTE_TAGS = Object.freeze(['additional_context', 'failures', 'assessment'])

/** The summary family: the retelling a model sometimes writes back in place of an answer. */
export const SUMMARY_TAGS = Object.freeze(['summary', 'compacted-summary'])

/** The call family's containers: a tool call written as markup instead of as `tool_calls`. */
export const CALL_CONTAINERS = Object.freeze(['calls', 'invoke', 'function_calls', 'tool_call'])

/** The call family's parameter tag: one named value of a call. */
export const PARAMETER_TAG = 'parameter'

/** The turn family: the model wrapping its own turn. */
export const TURN_TAGS = Object.freeze(['assistant'])

/** The echo family: the model echoing a tool frame back into its turn. */
export const ECHO_TAGS = Object.freeze(['tool_result'])

/** How much of a dropped retelling's head is kept, in characters — the summariser's own `SUMMARY_HEAD_CHARS`. */
export const SUMMARY_HEAD_CHARS = 160

/**
 * The treatment of each family: what happens to the body between the tags.
 *
 * | family | treatment | why |
 * | --- | --- | --- |
 * | `summary` | **drop** — not answer text, not reasoning, never sent back up | the user's decision: the retelling is the model's own retelling of the dialogue, and the harness is the one trusted to compact; a retelling travelling back up would return to the model doubled |
 * | `call` | **assemble** — a call where the block names a function, the reasoning channel otherwise | a call written as markup is a call; losing it is a known defect |
 * | `reasoning`, `note` | **reason** — the reasoning channel | the model's own thinking is not the answer |
 * | `turn`, `echo` | **reason** | a wrapper's body cannot honestly be claimed as the answer; doubtful goes to reasoning, and it is counted |
 * | `unknown` | **reason**, counted under the name the model wrote | the same treatment, extended to the names no rule claims |
 */
export const TREATMENTS = Object.freeze({
  summary: 'drop',
  call: 'assemble',
  reasoning: 'reason',
  note: 'reason',
  turn: 'reason',
  echo: 'reason',
  unknown: 'reason',
})

/**
 * The mark the gateway puts inside its own tags: fullwidth bars, and `DSML` between them, with a
 * space after it (`<|DSML| calls>`, written live with fullwidth bars). The mark is part of the shape
 * of a token and a plain space after `<` is not: `1 < b > 2` is an answer, not a tag.
 */
const MARK = '[\\uFF5C]+(?:DSML[\\uFF5C]*)?\\s*'

/** The name of a tag: a letter first, then letters, digits, `_`, `.`, `:` and `-`. */
const NAME = '[A-Za-z][A-Za-z0-9_.:-]*'

/**
 * One tag token: the mark, the name, the attributes. A `>` inside a quoted attribute does not end it.
 * The groups are: the slash of a closing tag, the gateway's mark, the name, the attributes.
 */
const TOKEN = new RegExp(`<(\\/)?(${MARK})?(${NAME})((?:"[^"]*"|'[^']*'|[^<>'"])*)>`, 'gu')

/** A trailing fragment that could still grow into a tag: held until the rest of it arrives. */
const PARTIAL = new RegExp(`^<(\\/)?(?:${MARK})?(?:${NAME})?(?:"[^"]*|'[^']*'|[^<>'"])*$`, 'u')

/** One attribute of a token, its value unquoted. */
const ATTRIBUTE = /([A-Za-z][A-Za-z0-9_-]*)\s*=\s*("[^"]*"|'[^']*')/gu

/** The length of a tag fragment at the end of the text that is not a token yet. */
function heldLength(text) {
  const at = text.lastIndexOf('<')
  if (at === -1) return 0
  const tail = text.slice(at)
  if (tail.includes('>')) return 0
  return PARTIAL.test(tail) ? tail.length : 0
}

/** The attributes of a token's raw text, by name. */
function attributesOf(raw) {
  const out = {}
  for (const match of raw.matchAll(ATTRIBUTE)) {
    const value = match[2].slice(1, -1)
    out[match[1].toLowerCase()] = value
  }
  return out
}

/**
 * A parameter's value as the call carries it.
 *
 * The gateway's own form marks a string parameter (`string="true"`, captured live), and such a value
 * is handed over as it stands; every other value is taken as JSON when it is JSON and as the string
 * the model wrote when it is not — a markup call is **built**, and building it is where its values
 * are read, unlike a `tool_calls` delta whose argument string travels untouched.
 * @param {string} text the value as written
 * @param {boolean} isString whether the gateway marked it a string
 * @returns {unknown} the value
 */
export function callValue(text, isString) {
  const trimmed = text.trim()
  if (isString) return trimmed
  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

/**
 * The family one tag name belongs to.
 * @param {string} name the tag name, without its mark and without its slash
 * @returns {'reasoning' | 'note' | 'summary' | 'call' | 'turn' | 'echo' | 'unknown'} the family
 */
export function familyOf(name) {
  if (REASONING_TAGS.includes(name)) return 'reasoning'
  if (NOTE_TAGS.includes(name)) return 'note'
  if (SUMMARY_TAGS.includes(name)) return 'summary'
  if (name === PARAMETER_TAG || CALL_CONTAINERS.includes(name)) return 'call'
  if (TURN_TAGS.includes(name)) return 'turn'
  if (ECHO_TAGS.includes(name)) return 'echo'
  return 'unknown'
}

/**
 * Whether a tag token is markup or a word of the answer.
 *
 * A name no rule claims is judged **by place**, the way the parser's own instrument judged it
 * (`#isForeignTag`): in the wrapper position — nothing visible before it on its line — it is the
 * gateway's own wrapping that this plugin has not learned yet, while in prose it is an ordinary
 * angle-bracketed word
 * (`List<String>`, `Bearer <token>`), which is part of the answer and must not be taken from it. A
 * known family name is markup wherever it stands: its tag has no business in an answer at all.
 * @param {string} name the tag name
 * @param {boolean} marked whether the token carries the gateway's mark (the stripes)
 * @param {boolean} lineStart whether only whitespace stands before it on its visible line
 * @returns {boolean} true when the token is markup
 */
export function isMarkup(name, marked, lineStart) {
  if (marked) return true
  if (name === PARAMETER_TAG || REASONING_TAGS.includes(name) || NOTE_TAGS.includes(name)) return true
  if (SUMMARY_TAGS.includes(name) || CALL_CONTAINERS.includes(name)) return true
  if (TURN_TAGS.includes(name) || ECHO_TAGS.includes(name)) return true
  return lineStart
}

/**
 * One turn's shutter over the visible channel.
 *
 * It is fed every delta of the visible channel and decides, delta by delta, what of it may be
 * shown. A tag may be split across deltas — where a delta ends is the network's decision, not the
 * wire's — so a fragment that could still grow into a tag is held until the rest of it arrives, and
 * released by {@link Shutter#flush} when the turn ends inside one.
 * @param {object} [options] the shutter's facts
 * @param {number} [options.headChars] how much of a dropped body's head to keep
 * @param {'drop' | 'keep'} [options.summary] `keep` leaves a summary block's body visible — the one
 *   door where the harness itself asked for the body (the auxiliary compaction call); every ordinary
 *   turn drops it
 * @returns {object} the shutter
 */
export function createShutter(options = {}) {
  const headChars = Number.isFinite(options.headChars) && options.headChars > 0 ? options.headChars : SUMMARY_HEAD_CHARS
  const keepSummary = options.summary === 'keep'
  const counters = {
    markupSeen: {},
    tagsNeutral: {},
    tagsQuoted: {},
    summaryBlocks: 0,
    summaryChars: 0,
    summaryHead: '',
    markupCalls: 0,
    markupUnclosed: {},
  }
  let buffer = ''
  let lineStart = true
  let block = null
  let callsMade = 0

  const count = (map, name) => {
    map[name] = (map[name] ?? 0) + 1
  }

  /** The visible line state after text is shown: a newline resets it, spaces keep it. */
  function shown(text) {
    const at = text.lastIndexOf('\n')
    if (at !== -1) lineStart = /^[ \t]*$/u.test(text.slice(at + 1))
    else if (lineStart) lineStart = /^[ \t]*$/u.test(text)
  }

  function keepHead(text) {
    if (counters.summaryHead.length >= headChars) return
    counters.summaryHead += text.slice(0, headChars - counters.summaryHead.length)
  }

  /** Open a block on an opening tag, under the treatment its family's row states. */
  function open(name, family, attributes) {
    const opened = { name, family, treatment: TREATMENTS[family], attributes, raw: '', params: [], param: null, stack: [], callName: '' }
    if (family === 'call' && CALL_CONTAINERS.includes(name)) {
      opened.stack.push(name)
      opened.callName = attributes.name ?? ''
    }
    block = opened
  }

  /** The value of the current parameter ends: the token that followed it closed it. */
  function endParam(of) {
    if (of.param === null) return
    of.params.push(of.param)
    of.param = null
  }

  /** The call a completed block carries, or nothing when it names no function. */
  function assembled(of) {
    endParam(of)
    if (of.callName === '') return undefined
    const args = {}
    for (const param of of.params) args[param.name] = callValue(param.text, param.isString)
    callsMade += 1
    counters.markupCalls += 1
    return { id: `markup_call_${callsMade}`, type: 'function', function: { name: of.callName, arguments: JSON.stringify(args) } }
  }

  /**
   * Give the body of a block its treatment, and close it.
   * @param {object} piece the accumulator of this delta
   * @param {boolean} [whole] whether the block was closed by its own tag
   */
  function close(piece, whole = true) {
    const of = block
    block = null
    if (of.treatment === 'assemble') {
      // A call is assembled only from a block the model closed itself: half a call is not a call, and
      // executing one not claimed to have been read whole would be worse than refusing the turn.
      const call = whole ? assembled(of) : undefined
      if (call !== undefined) piece.calls.push(call)
      else piece.reasoning += of.raw
      return
    }
    if (of.treatment === 'drop') {
      // What a `keep` door held back is released now; a dropped body is already counted and stays
      // dropped, the closing tag or the end of the turn making no difference to that.
      if (keepSummary && whole) piece.text += of.raw
      return
    }
    // A routed family writes its body out as it arrives — there is nothing left to hand over here —
    // and a call that was not assembled has already been routed, so nothing follows.
  }

  /** One tag token: count it, and follow its family's treatment. */
  function token(piece, found) {
    const attributes = attributesOf(found.raw)
    const family = familyOf(found.name)
    count(counters.markupSeen, found.name)
    // A summary tag is counted the moment it is seen, opening or closing: one tag pair reads as
    // `{"summary": 2}` on the instruments, and a lone closing tag of the family is a mark on the turn
    // just as an opening one is.
    if (family === 'summary') counters.summaryBlocks += 1
    if (block === null) {
      if (!isMarkup(found.name, found.marked, lineStart)) {
        // A word of the answer that merely looks like a tag: it stays where it stands, counted, so
        // that the decision is legible in the session record rather than invisible in the text.
        count(counters.tagsQuoted, found.name)
        piece.text += found.raw
        shown(found.raw)
        return
      }
      count(counters.tagsNeutral, found.name)
      if (found.closing) return
      open(found.name, family, attributes)
      return
    }
    if (block.treatment !== 'assemble') {
      // Inside a routed or dropped block the tags are markup, not body: they are counted and gone.
      count(counters.tagsNeutral, found.name)
      if (!found.closing) return
      if (block.treatment === 'drop') {
        if (SUMMARY_TAGS.includes(found.name) || found.name === block.name) close(piece)
        return
      }
      if (found.name === block.name) close(piece)
      return
    }
    // A call block keeps what the model wrote, tags included: if the call is assembled the text is
    // spent on it, and if it is not the whole fragment goes to the reasoning channel as it stands —
    // a value without its parameter's name would be a worse record of what the model meant.
    count(counters.tagsNeutral, found.name)
    block.raw += found.raw
    if (found.name === PARAMETER_TAG) {
      // A parameter's value is not quoted in this markup: the next token is what ends it (the serializer's
      // own reading of the form).
      endParam(block)
      if (found.closing) return
      const name = attributes.name ?? ''
      if (name !== '') block.param = { name, isString: attributes.string === 'true', text: '' }
      return
    }
    endParam(block)
    if (!CALL_CONTAINERS.includes(found.name)) return
    if (found.closing) {
      if (block.stack.at(-1) === found.name) block.stack.pop()
      if (block.stack.length === 0) close(piece)
      return
    }
    block.callName ||= attributes.name ?? ''
    block.stack.push(found.name)
  }

  /** Take the text of the buffer that is not part of a tag, up to and including the last token. */
  function take(piece, text) {
    if (text === '') return
    if (block === null) {
      piece.text += text
      shown(text)
      return
    }
    if (block.treatment === 'drop') {
      block.raw += text
      if (keepSummary) return
      counters.summaryChars += text.length
      keepHead(text)
      return
    }
    if (block.treatment === 'assemble') {
      block.raw += text
      if (block.param !== null) block.param.text += text
      return
    }
    // A routed family is written out as it arrives: its body is the reasoning channel's, and the
    // block keeps nothing aside — there is nothing for its closing tag to hand over.
    piece.reasoning += text
  }

  /** Decide as much of the buffer as can be decided now. */
  function drain(piece) {
    for (;;) {
      TOKEN.lastIndex = 0
      const found = TOKEN.exec(buffer)
      if (found === null) {
        const held = heldLength(buffer)
        const safe = buffer.slice(0, buffer.length - held)
        buffer = buffer.slice(buffer.length - held)
        take(piece, safe)
        return
      }
      take(piece, buffer.slice(0, found.index))
      buffer = buffer.slice(found.index + found[0].length)
      token(piece, {
        raw: found[0],
        name: found[3],
        closing: found[1] === '/',
        marked: (found[2] ?? '') !== '',
      })
    }
  }

  return {
    /**
     * Feed one delta of the visible channel.
     * @param {string} text the delta
     * @returns {{text: string, reasoning: string, calls: object[]}} what of it is decided now
     */
    feed(text) {
      buffer += text
      const piece = { text: '', reasoning: '', calls: [] }
      drain(piece)
      return piece
    },
    /**
     * End the turn: release a held tag fragment and close a block the turn ended inside.
     * @returns {{text: string, reasoning: string, calls: object[]}} what was still held
     */
    flush() {
      const piece = { text: '', reasoning: '', calls: [] }
      const held = buffer
      buffer = ''
      take(piece, held)
      if (block !== null) {
        count(counters.markupUnclosed, block.family)
        close(piece, false)
      }
      return piece
    },
    /** What the shutter has done so far. */
    counters() {
      return {
        ...counters,
        markupSeen: { ...counters.markupSeen },
        tagsNeutral: { ...counters.tagsNeutral },
        tagsQuoted: { ...counters.tagsQuoted },
        markupUnclosed: { ...counters.markupUnclosed },
      }
    },
  }
}
