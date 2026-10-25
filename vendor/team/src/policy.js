/**
 * The team policy's one paragraph, and the product's replacement.
 *
 * The platform's team tools register a system-prompt section named `team:policy` for the Lead and every
 * teammate. Its text is one paragraph shared by the whole team, and its last sentence asks the Lead to
 * wait — `wait_agent` blocks the step until its timeout, a human's message lands only at a step boundary,
 * and the Lead cannot be interrupted, so that sentence stalls a team. The runtime does not require the
 * wait: on settlement the manager delivers the report to an idle parent as a queued message, which starts
 * its next turn.
 *
 * The product owns exactly that sentence and nothing else: with the switch on, the anchor is replaced by
 * the approved text and every other byte of the section stays as the platform wrote it. The review
 * paragraph is the second switch's: it follows the approved text in the same substitution, so it stands
 * only while the first switch supplies the paragraph it belongs to. With the switch off the section is
 * untouched. A section without the anchor is left as it is, said once in words — the platform may reword
 * the sentence in any release, and a patch that silently found nothing would be a claim the page could
 * not check.
 *
 * @module @coreness/team/policy
 */

/** The section the platform's team tools register, shared by the Lead and every teammate. */
export const SECTION = 'team:policy'

/** The platform's last sentence: the one sentence this product replaces. The version it was taken from ages
 * faster than the sentence does, so the check and the finder name the version they meet at run time. */
export const ANCHOR = 'The Lead must wait for required teammates before giving the final answer.'

/**
 * The platform's identity line for a teammate: the one role-aware piece of an assembly, and the seam this
 * patch depends on. The platform writes it into a teammate's prompt as `You are teammate "<name>".`; the
 * Lead gets a different line, and an assembly that carries neither is a role this product cannot decide —
 * the platform's text is then left alone and the outcome says so, because guessing "Lead" is how every
 * teammate would read the Lead's duties as its own.
 */
export const IDENTITY = 'You are teammate'

/** The platform's identity line for the Lead: the other half of the role decision. */
export const LEAD_IDENTITY = 'You are the Team Lead named'

/**
 * The approved text: the owner's own wording, shipped only after his word. The Lead's work is to lead —
 * the plan, the shared tasks and the answer to the user are its own, a task a member can carry is a shared
 * task — and it takes none of the members' work over, though a one-file repair confirmed by one run of its
 * check is not taking it over; a takeover ends with the stuck step. It closes a task when it accepts the
 * work and reopens one it does not, and the user is the customer who judges the surface they see. It never
 * holds a turn open: no `wait_agent`, no sleep or poll inside a command — when time must pass it sets a
 * reminder and ends the turn, because a held turn holds the user's messages. A settlement without a
 * closing message does not close the task.
 */
export const TEXT =
  'The Lead\'s work is to lead: it sets the plan, breaks the work into shared tasks, hands them to members, and answers for the result — closing the user\'s task when the work is done, while the user, the customer, judges the surface they see. A task a member can carry is a shared task, however small it looks; a replacement member starts with its task on the board. The Lead takes none of the members\' work over: it writes none of their code and redoes none of their steps. It steps in where the work is stuck or the result would be wrong — a one-file repair that needs no tree read and whose check confirms it in one run is not a takeover. A takeover ends with the stuck step: the work goes back to a member, or the member is replaced. It keeps the tasks current — a shared task closes once the acceptance it carries is met; its owner closes it, or the Lead when the owner has gone; the Lead reopens one whose acceptance failed, edits a blocked task once its blockers are done, reassigns one no member is working — managing the tasks it set, not the hands that carry them. It answers when the required results are in hand, or at once when the answer needs none; until then it says what is outstanding and ends its turn — a settlement notice starts the next turn by itself. The Lead never waits — no wait_agent, no sleep or poll inside a command: it ends its turn, or wakes an inactive member with send_message; when time must pass it sets a reminder and ends the turn, because a held turn holds the user\'s messages. It spawns a member only when no existing member can carry the task now, or when the work needs a judgement no existing member can give; a slow task alone is not a reason. A delegated task carries the work; the test that accepts it, or the user\'s word where only the user can accept; the ground it stands on — files and facts, not the Lead\'s reading, a path and the command that reproduces a number, not the number; the write scopes it may touch; and what to report. A settlement with no closing message does not close the task: the Lead asks for the missing report, or re-delegates when no member can report, before the task closes.'

/**
 * What a review is, and what it is not — the second switch's paragraph, appended to the approved text in
 * the same substitution so it stands only where the text does. Two independent drafts and a fresh review
 * settled it: the review is the normal step of a circle, not a purchase the Lead weighs; the small task is
 * the exception; the reviewer's task, the address every finding carries, and the authorship bar are named,
 * because the night showed a lead accepting its own work as done.
 */
export const REVIEW =
  'A reviewer is a fresh agent with a clean eye — it did not build the work and has no stake in how it looks — and the Lead spawns it wherever it sees fit: the review finds the weak spot, catches a bug early, names the pitfall the author has stopped seeing, and keeps the quality of the work from drifting. A review is the normal step of every circle of work; a small task does not need it. The reviewer holds the work against the spec and the traces it is given and asks where it is weak, where it is extra, and what is missing; every finding carries a path and a quote, and a finding without an address is not taken. It does not edit the work and does not accept it: the findings return to whoever did the work, and the review does not replace the acceptance that closes the task — a word that belongs to the criterion or to the user, never to the author.'

/**
 * What the last team assembly left: `off` (the switch is off), `active` (the text stands in place of the
 * anchor), `missing` (the section stands without the anchor) or `unknown` (the section stands and the
 * identity says neither the Lead nor a teammate, so the patch was not made). An assembly without the
 * section is not team's — a subagent carries none — and leaves this value alone, so `absent` is a patch
 * result the listener does not store. The page reads it; the value is written by the listener, so it
 * describes the last assembly that carried the team's section, never a guess.
 */
let outcome = 'off'

/** What the last assembly left. */
export function outcomeOf() {
  return outcome
}

/**
 * Write the outcome of one assembly and hand back the previous one, so the caller can say a change once
 * rather than once per step. An assembly without the section says nothing: it belongs to an agent that is
 * not on the team, and letting it through would wipe the team's outcome and turn the page's "patch is
 * inactive" line off.
 * @param {string} next the outcome just reached
 * @returns {string} the outcome it replaced
 */
export function noteOutcome(next) {
  if (next === 'absent' || next === 'member') return outcome
  const previous = outcome
  outcome = next
  return previous
}

/**
 * Whether a missing anchor or an undecidable role is news this assembly. A section that left as the platform
 * wrote it is news once, not once per step — and an assembly without the section says nothing at all,
 * because it is not about the team.
 * @param {string} previous the outcome the last assembly carried
 * @param {string} next the outcome this one carries
 * @returns {boolean} true when the line is owed
 */
export function shouldWarn(previous, next) {
  return (next === 'missing' || next === 'unknown') && previous !== next
}

/**
 * One assembly's patch.
 *
 * The section is looked up first, whatever the switch says: an assembly without it belongs to an agent
 * that is not on the team, and its outcome must not overwrite what the last team assembly left — the
 * page would then lose the "patch is inactive" line to a subagent's step. With the switch off, a
 * section that stands is reported as `off`; it is found and left untouched. The review flag is read only
 * after the anchor held and only while the first switch is on: the review paragraph lives inside the
 * text that switch supplies, so it can neither stand alone nor keep a missing anchor from being reported.
 *
 * The section is copied, never mutated: the assembly the platform built is shared with the rest of the
 * waterfall and with the caller, and an edit in place would leak into a later assembly of the same step.
 * @param {{sections: Array<{name: string, text: string}>}} assembly the presentation the platform assembled
 * @param {boolean} enabled whether the switch is on
 * @param {boolean} review whether the review paragraph is appended
 * @returns {{assembly: object, outcome: string}} the assembly to return, and what the patch left
 */
export function patchPolicy(assembly, enabled, review) {
  const index = assembly.sections.findIndex((section) => section.name === SECTION)
  if (index < 0) return { assembly, outcome: 'absent' }
  if (!enabled) return { assembly, outcome: 'off' }
  const section = assembly.sections[index]
  /* The sentence is the section's last one: an anchor anywhere else would put the product's paragraph in
     the middle of the platform's text, so a release that adds a sentence after it is a missing anchor. */
  if (!section.text.endsWith(ANCHOR)) return { assembly, outcome: 'missing' }
  const body = review === true ? `${TEXT}\n\n${REVIEW}` : TEXT
  const sections = assembly.sections.slice()
  sections[index] = { ...section, text: `${section.text.slice(0, -ANCHOR.length)}${body}` }
  return { assembly: { ...assembly, sections }, outcome: 'active' }
}

/**
 * The role one assembly belongs to: `member`, `lead`, or `unknown` when the identity line is neither.
 *
 * The platform installs one policy section per team agent, so a member reads the same section text as the
 * Lead — byte for byte, which the night logs confirmed. The identity context is the one role-aware piece of
 * an assembly: the platform writes "You are the Team Lead named …" for the Lead and "You are teammate …" for
 * everyone else. `unknown` is not a refusal but a fact about the platform: a release that rewords either
 * line makes the role undecidable, and the caller leaves the section as the platform wrote it rather than
 * deciding the role by the absence of the word "teammate".
 * @param {{contexts?: Array<{text?: unknown}>}} assembly the presentation the platform assembled
 * @returns {'member'|'lead'|'unknown'} the role the identity names
 */
export function roleOf(assembly) {
  for (const context of assembly.contexts ?? []) {
    if (typeof context.text !== 'string') continue
    const text = context.text.trimStart()
    if (text.startsWith(IDENTITY)) return 'member'
    if (text.startsWith(LEAD_IDENTITY)) return 'lead'
  }
  return 'unknown'
}

/**
 * What one assembly leaves, role included.
 *
 * The role is decided here rather than in the listener, so the branch the page depends on — a member's
 * assembly never carries the Lead's paragraph and never overwrites the Lead's outcome — is one function a
 * fixture can exercise; a listener that forgot it would otherwise keep every other check green. The section
 * is looked up first: an assembly without it is not the team's, whatever its identity says. With the switch
 * off the section is found and reported off; the role is read only when a patch would be made, because a
 * role this product cannot decide must not stop a switched-off patch from saying it is off.
 * @param {{sections: Array<{name: string, text: string}>, contexts?: Array<{text?: unknown}>}} assembly the presentation the platform assembled
 * @param {boolean} enabled whether the first switch is on
 * @param {boolean} review whether the review paragraph is appended
 * @returns {{assembly: object, outcome: string}} the assembly to return, and what the patch left
 */
export function patchFor(assembly, enabled, review) {
  const index = assembly.sections.findIndex((section) => section.name === SECTION)
  if (index < 0) return { assembly, outcome: 'absent' }
  if (!enabled) return { assembly, outcome: 'off' }
  const role = roleOf(assembly)
  if (role === 'member') return { assembly, outcome: 'member' }
  if (role === 'unknown') return { assembly, outcome: 'unknown' }
  return patchPolicy(assembly, enabled, review)
}
