# @coreness/team

The Agent Team's product side: the team's ceiling, read and written through the platform's own config editor, and the one place in the team policy the product replaces. Host only: one row, one route, no client half.

## What the plugin owns

- `src/route.js` — the state as the page reads it, the namespace the switch writes, and the write that re-applies the row.
- `src/config.js` — the product's own switches: `prompt` and `review`, both volatile.
- `src/live.js` — a volatile field's live value: the box a write reaches, or the plain value.
- `src/policy.js` — the section's name, the platform's anchor sentence, the approved text, the patch and the outcome the last team assembly left.

The ceiling is `maxMembers` on the platform's `agent-team` row — an ordinary Config field, which the platform's settings service does not project into a form. The route reads the value in force from the row's resolved config and writes a new one through `ctx.configEditor.edit`: the same door a hand-edited Cordis file goes through — validated by the row's schema, persisted to the profile's patch and re-applied by the Loader. A row whose fiber has not resolved has no ceiling in force, and the answer says `null` rather than substituting the raw patch.

A write re-applies the row: running teammates are stopped, and the roster and the board recover from the Lead's session log.

## The prompt switch

The platform's team tools register a system-prompt section named `team:policy` for the Lead and every member. The product does not own the section's words: it replaces exactly the platform's last sentence — the one that tells the Lead to wait — with the owner-approved text `src/policy.js` carries, and leaves every other byte as the platform wrote it. The second switch appends the review paragraph to that text in the same substitution, and it stands only where the text it rides in stands. The paragraph is the Lead's: the section is installed for every team agent, and the platform's identity context is the only role-aware piece of an assembly — the platform writes `You are the Team Lead named …` for the Lead and `You are teammate …` for a member — so a member's assembly keeps the platform's text and the Lead's paragraph stays out of it. An assembly whose identity line is neither the Lead's nor a teammate's leaves the platform's text and reports `unknown`, said once, because the role is read from the platform's own words rather than guessed from the absence of one. The approved text's own content is the owner's; `src/policy.js` is its one home.

The section is found by name and the sentence by its exact text (the anchor), which must be the section's last sentence: an anchor anywhere else would put the product's paragraph in the middle of the platform's text, so a release that adds a sentence after it counts as a missing anchor. A section without it is left alone and said once in the log, on the team step that first meets it while the switch is on — not on every step after it, and not by an agent that carries no such section; the platform may reword the sentence in any release, and a patch that silently found nothing would be a claim the page could not check. The listener is untagged and copies the section before editing it: one listener serves the Lead and every member, the assembly the platform built is never mutated in place, and a member's assembly leaves the Lead's recorded outcome alone.

The platform's prompt service calls assembly listeners authoritative, and its one caveat is a complete section: a scope that declares one discards every other section at assembly, and this listener cannot see it — the card therefore reports what the patch did to the section, not what the model received. The platform's sources carry a practice against a listener that adds or removes text; this listener does that by the owner's decision, and a release that reworks the assembly leaves the platform's text with one warned line. An application update is met with the repository's finder `find-team`, which reads the installed package once and says whether the anchor is still the policy's last sentence and whether the identity line the role is read from still stands; the card and the log say the same thing while the product runs.

The prompt is assembled at every step, not once per session: a flip applies from that session's next step, and a change may invalidate the provider's cached prefix from the changed sentence on.

## The answer

`GET /api/coreness.team` answers `{ok:true, value:{mounted, editable, maxMembers, prompt, review, policy, ns}}` — whether the platform's team service is present, whether the profile's editor can address the row at all, the ceiling the row carries (the package default when the row names none), whether the product's text is switched on, whether the review paragraph follows it, what the last team assembly left (`off`, `active`, `missing` or `unknown`; an assembly without the section, and a teammate's assembly, leave that value alone), and the settings namespace the switches write (the row's id in the composition; `null` when the composition addresses no row). `POST` with `{maxMembers}` answers the same shape after the write plus a `notice`: the platform's editor persists a complete config, so the write pins the row's other fields (`maxTasks`, `maxMessageBytes`, `disposalTimeoutMs`) at their current values, and the console says the same.

A refusal answers `{ok:false, error:{code, message}}` with status 200 and the profile left as it stood. The platform's editor's own refusals arrive as `EDIT_REFUSED` in its own words; this door's own are `BAD_REQUEST` (not a whole number of at least 1, or a body that is not a JSON object), `NO_EDITOR` (a composition without the profile's editor) and `NO_ROW` (no `agent-team` row to write). The card answers the press with the word Not saved; the sentence itself stands in the console, because a line that appears under a press moves the card.

## What it does not do

- **It does not compose the team rows.** The platform's own Agent Team bundle declares `agent-team`, `tool-agent-team` and `ui-agent-team`; a row id has one owner, and two layers answering for it make the profile's editor refuse every write (the placement is the platform's, the row's config is nobody's). The product's bundle inserts only the ceiling door, and the card says the team is not mounted when the profile carries no Agent Team at all.
- It does not choose the ceiling: no value is shipped, and the profile's own value stands until the page writes another.
- **It does not raise the delegation depth.** Members carry the platform's `subagent` and `subagent_fork` tools and may call them, but the platform's default cap is one delegation level (`maxDepth: 1`): the Lead stands at depth zero and may delegate, a member is already a child at depth one, and its own child would be depth two and is refused. A composition that wants members to delegate raises `maxDepth` on the platform's `subagent` row.
- It does not touch the platform's team tools, their roster or their board.

## Checks

The fixture `node packages/team/scripts/check-policy.mjs` holds the switch's states, the role branch and the outcome the last assembly left.
