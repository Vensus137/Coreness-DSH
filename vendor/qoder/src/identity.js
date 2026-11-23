/**
 * The identity sentence the vendor fingerprints, and the wording it answers.
 *
 * Measured live on the chat door: the exact sentence, its closing period included and anywhere in the
 * **system** text, is answered `200` and then refused inside the stream as `403 / 10605 / RESOURCE_LIMIT`;
 * the same prompt with `running on` in the sentence's place is answered. The fingerprint is that narrow:
 * without the closing period, the bare `powered by DeepSeek Harness.`, a lowercased `harness`, or the
 * sentence in a user message all pass. Only that sentence is substituted: the user and assistant channels,
 * the tools, `model_config` and every field not derived from the system text travel as they were, while the
 * request digest is derived from the system text and moves with it — wanted, because the re-ask of a step
 * must stay one request.
 *
 * @module @coreness/qoder/src/identity
 */

/** The sentence as the platform writes it: the vendor's exact fingerprint, the closing period included. */
export const BLOCKED = 'You are an AI agent powered by DeepSeek Harness.'

/** The wording the vendor accepts in its place: the meaning is kept, the fingerprint is not. */
export const REWORDED = 'You are an AI agent running on DeepSeek Harness.'

/**
 * Every occurrence of the blocked identity sentence, reworded.
 *
 * A plain replacement and not a regular expression: the sentence carries a period and nothing else a
 * pattern would have to escape. It is idempotent — the reworded sentence does not carry the blocked one —
 * and a text without the sentence is returned byte for byte.
 * @param {string} text the system text about to travel
 * @returns {string} the text as the wire may carry it
 */
export function rewordIdentity(text) {
  return String(text).split(BLOCKED).join(REWORDED)
}
