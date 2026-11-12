# @coreness/team

The Agent Team's product side: the two switches a page draws, and the one place in the team policy the product replaces. Host only: one row, one read route, no client half.

## What the plugin owns

- `src/index.js` — the route's registration, the assembly listener, the platform version its warning names, and the mount's one line.
- `src/route.js` — the picture a surface reads: the team's presence, the two switches, the last policy outcome and the settings namespace.
- `src/config.js` — the product's own switches: `prompt` and `review`, both volatile, so a write applies to the running plugin without re-mounting the row.
- `src/live.js` — a volatile field's live value: the box a write reaches, or the plain value.
- `src/policy.js` — the section's name, both known releases' wait sentences and identity lines, the approved text, the patch and the outcome the last team assembly left.

The plugin reads and writes no field of the platform's team row. The release this product follows removed the member ceiling and its two neighbours from the row, and a config that still carries them fails the row's own validation instead of activating, so there is no value left to show or write. The two switches are the product's own volatile fields, written through the platform's settings service from the platform's settings mirror; the page names their namespace from the route's `ns`, which is the row's own id in the composition — one owner, and no second copy of the name.

## The read route

`GET /api/coreness.team` answers `{ok:true, value}` with `{mounted, prompt, review, policy, ns}` in both platform releases; a fault of the door answers `{ok:false, error:{code, message}}` with status 200, as the product's other routes answer. `mounted` is the platform's team service — the roster, the mailbox and the board — and not this plugin. `prompt` and `review` are the two switches as the page draws them, read at the question rather than captured at the mount. `policy` is the outcome of the last team assembly the patch met, or `null` until the first team assembly meets it. `ns` is the settings namespace the switches are written through, or `null` when the composition addresses no such row.

The route serves a read alone; it accepts no write, and the two switches never travel through it. A request with another method never reaches the handler: the route is registered for `GET`.

## The prompt switch

The platform's team tools register a system-prompt section named `team:policy` for the Lead and every member. The product does not own the section's words: with the switch on, it replaces one sentence — the one that tells the Lead to wait — with the owner-approved text `src/policy.js` carries, wherever that sentence stands in the section, and leaves every other byte as the platform wrote it. The sentence is the first occurrence: a release that repeats it keeps the later copies, and a release that closes the section with its own paragraph keeps that paragraph after the product's text.

Two releases' wordings are known and either is replaced: the older one asks `The Lead` to wait, the newer one `The root agent`. The review paragraph is the second switch's: it is appended to the approved text in the same substitution, so it stands only while the first switch supplies the text it rides in.

The paragraph is the Lead's: the section is installed for every team agent, and the platform's identity context is the only role-aware piece of an assembly. Both releases' lines are understood — `You are the Team Lead named …` / `You are teammate …` and `You are the root agent …` / `You are a subagent delegated by agent …` — so a member's assembly keeps the platform's text and the Lead's paragraph stays out of it. An assembly whose identity line is neither the Lead's nor a member's leaves the platform's text and reports `unknown`, said once, because the role is read from the platform's own words rather than guessed from the absence of one.

An empty policy section is the platform's way of saying Team mode is off: the newer release registers the section for every agent and fills it only for an enabled session, and an empty section is dropped when the prompt is rendered. The patch reports `off` for it, not a missing sentence, and no warning is owed. The page draws the same picture: after the first team assembly, with the switch on and the outcome `off`, the card says what to enable rather than that the sentence moved; before that first assembly the outcome is `null` and the card says nothing about the team's mode. A non-empty section without either known sentence is left alone and said once in the log, on the team step that first meets it while the switch is on — not on every step after it, and not by an empty section, which already says the team is off; the platform may reword the sentence in any release, and a patch that silently found nothing would be a claim the page could not check.

The listener is untagged: one listener serves the Lead and every member, because the scope filter admits it for every scoped dispatch. It copies the section before editing it and treats the platform's assembly as read-only. A fault of the patch is said in words and the platform's assembly goes through as it is: a fault of this product must not cost a session its prompt.

## Cross-release packaging

The platform version in the warning line is read through the installed packages, newer release first: `@deepseek-ai/dsh-tool-agent-team` and `@deepseek-ai/dsh-agent-team` exist on the release this product follows, `@deepseek-ai/dsh-experimental-tool-agent-team` and `@deepseek-ai/dsh-experimental-agent-team` on the one before it, and a name that does not resolve belongs to the other release. The packages are looked up where the platform's runtime puts them: the desktop application's resources first, then the process's own launcher entry (the CLI or headless build that started it — a profile's own `node_modules` carries only the product's packages, not the platform's), then the plugin's own file. A platform that answers to none of them is said as such, with the names that were tried, rather than guessed.

The manifest names all four team packages as peers, and all four are optional. A peer that is not optional fails an install when it does not resolve, and no single release carries both pairs of names — so optional peers are what lets one package install on either release, while the version line still reads whichever pair the platform has.

## What it does not do

- It does not carry the team's ceiling. The newer platform removed the field; what the row carries is the platform's own business, and a removed field in it is refused rather than read.
- It does not choose the team's task or member limits, and it does not raise the delegation depth: members carry the platform's `subagent` and `subagent_fork` tools, and the platform's default cap is one delegation level (`maxDepth: 1`) — the Lead stands at depth zero and may delegate, a member is a child at depth one, and its own child would be depth two and refused. A composition that wants members to delegate raises `maxDepth` on the platform's `subagent` row.
- It does not touch the platform's team tools, their roster or their board.
- It does not draw a ceiling control on any page: the General page's card draws the two switches and says when the team service is absent or the team is off.

## Checks

The fixture `node packages/team/scripts/check-policy.mjs` holds the switch's states against both releases' policy texts: the sentence replaced wherever it stands, the bytes around it untouched, a second copy left in place, the review paragraph inside the substitution only, the outcome as `null` before the first team assembly and `off` only from an empty section, a missing sentence as `missing` said once, a member's assembly untouched, both identity pairs and the undecidable role, an assembly without the section leaving the last team outcome, and the route's picture — the two switches, the team's presence, the last outcome, the namespace, and the removed ceiling fields absent from it.
