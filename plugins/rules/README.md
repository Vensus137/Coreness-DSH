# coreness-rules: the project's rules that must hold in force, as one prompt section

One row, one prompt section. The rules of this project that must hold **without a reader acting** are registered through the platform's own prompt registry, so they arrive in every request of every session — a delegated child's included, because a section registered without a scope reaches every agent. The section's text is one file of this plugin, `plugins/rules/section.md`; no copy of it stands in this module or anywhere else.

A rule that must hold in force cannot be kept in a document: a document is read when someone opens it, and a compaction takes the span it stood in out of the model's sight. The assembled prompt is the surface rebuilt for every request, so that is where these rules stand — and each of them **moved** there: the home it left keeps what a reader does about it, and the rule itself stands here.

## Dependencies

- **`systemPrompt`**, declared in `inject`: the platform's own prompt registry (`@deepseek-ai/dsh-system-prompt`), whose `section({ name, order, text, interpolate })` this plugin calls once. A declared name is an activation gate in Cordis: a composition without the registry leaves this row **pending** — named among the entries that did not activate — rather than mounting over nothing. That is the loud half of the promise, and it is the only half this plugin can make, having no surface of its own.
- **`@deepseek-ai/schemastery`** for the row's `Config` — the platform's own schema library, the one the settings service projects a form from.
- **The text file itself** — `section.md` beside this module, read at the mount. A file that cannot be read throws and the row does not activate: there is no built-in copy of the rules to fall back on, and a second copy would be the drift this plugin exists to end.
- **For the tests:** `@deepseek-ai/cordis` and `@deepseek-ai/dsh-system-prompt` — the installed library and the installed service, not stand-ins, because "the section arrives in the assembled prompt" is a promise only the platform's own assembly can decide.
- **No browser half, no route, no other plugin's code.** The row names a subpath of the package and a subpath row carries no browser half at all; nothing here draws.

## In the surface

- **The seat:** `ctx.systemPrompt.section({ name: 'coreness:rules', order: 700, text, interpolate: false })` — one registration, in the row's own scope, so the section lives and dies with the plugin's fiber. Disposal is the platform's own: the service hands back the exact Cordis effect disposer, and a fiber that goes takes its section out of the next assembly.
- **Where it stands:** `700` is the slot the platform's own scale leaves free between the plan and team policies (`500`, `600`) and the first tool guide (`800`) — after what the harness is, before what its tools are for. The registry concatenates sections in ascending order and falls back to code-unit name order on a tie. `getSectionOrder` resolves only the placements the platform owns centrally, so a section of this project carries an explicit finite order — the contract's own allowance for an outside contributor.
- **What it draws:** nothing. No route is opened and no browser half exists; the section's arrival is read in the assembled prompt and in one line at the mount, which is the whole of what this plugin has to show.
- **`interpolate: false`** is the platform's own door for literal text: a brace standing inside a rule can never fail an assembly, and no variable is ever substituted into a rule. The rules are served as the file spells them.
- **`order` is the row's one setting.** A profile that wants the rules elsewhere moves the number, and the seat moves with it; nothing else about this plugin is configurable, because the rules are not a knob.

## The rules it carries

Every rule below stands in the section; every home below keeps what a reader **does** about it — the procedure, the commands, the reasons it was paid for. The rule's own head is the joint between the two: the same words open the rule in the section and open the line in its home, which is what the acceptance's own check reads, and it is why rewording a rule's body moves nothing while renaming a rule is a deliberate act in two places at once.

| the rule in force | the home it left | what that home keeps |
| --- | --- | --- |
| **The commit is the lead's.** | `picture/PROJECT-tasks.md` — §How a task is set and accepted | the landing: who holds the briefs, what the executor does instead, and the staging of a file more than one writer touches — the hunks, the patch, the message handed over rather than quoted into a shell |
| **The shared credential store is left alone by a session.** | `picture/PROJECT-environment.md` — §Environment | the store's one file, the shared home it belongs to, the driver's own `DSH_HOME` under `tmp/`, and the reading of a stored value only where a call spends it |
| **The live profile has one hand.** | `picture/PROJECT-environment.md` — §Environment | the profiles and what each is for, what the application mounts, the link that is the working tree, and the rollback |
| **A number carries its command.** | `picture/PROJECT-tasks.md` — §How a task is set and accepted | what a report is: what was done, what confirms it, what the check did not show, where the work stopped — and the words that mark a number no command can produce |
| **The platform switches; the product reports.** | `PROJECT.md` — §Boundaries | what the platform's own pages do to a profile's rows, and what this product's page reads instead of doing |

## Changing this

Each row is one change, the file and the names in it that carry it, and what measures it. A change to a rule is a change to the text and to the home that keeps its acts — both in the same pass, because a rule standing in two places is the defect this plugin's check exists to name.

| the change | where it lands | what measures it |
| --- | --- | --- |
| the text of a rule, or a rule's arrival | `plugins/rules/section.md` — one line per rule, one bold head per line, the opener's count moved with the list | `node scripts/accept.mjs --only rules` — the count, the homes, the runs standing in both, the names, and the section's size |
| the section's name, its placement, or the row's schema | `index.js` — `name`, `SECTION`, `ORDER`, `Config` | `node --test plugins/rules/test/mount.test.mjs` |
| what arrives, and how the file is read | `index.js` — `apply`, `textOf`, `TEXT` | `node --test plugins/rules/test/prompt.test.mjs` (the installed platform's own assembly) and `test/mount.test.mjs` |
| the row the plugin is mounted by | `bundles/coreness.patch.yml` — `coreness-rules` | `node scripts/accept.mjs` — the bundle leg holds the row against this plugin's schema |
| the rules' homes: the head each keeps and the acts beside it | the picture parts named above and `PROJECT.md` | `node scripts/accept.mjs --only rules` |
| this plugin's batch, its wall and its declared count | `scripts/batch.mjs` — the `rules` row | `node scripts/batch.mjs rules`; `node scripts/batch.mjs --audit` |
| the checks themselves, in one command | this table's own rows | `node scripts/accept.mjs` — the per-plugin check `the plugin rules carries tests` |

## Check

```
node --test "plugins/rules/test/*.test.mjs"   # the plugin's own suite: the mount, the refusal, the arrival
node scripts/batch.mjs rules                  # the same suite under the batch tool's wall
node scripts/accept.mjs --only rules          # the section read against the tree, with its size printed
node scripts/accept.mjs                       # the whole tree's checks, this plugin's own among them
```

What must be shown: `prompt.test.mjs` mounts the installed `@deepseek-ai/cordis` with the installed `@deepseek-ai/dsh-system-prompt` and reads the assembly the platform itself produces — the section is in it, at the seat the row gives it, carrying the file's text with `interpolate: false`, gone when the fiber is disposed, and pending where the registry is absent. `accept.mjs --only rules` reads the section against the tree: the opener's count against the number of rules, each rule's head against its home, any run of ten words or more standing in both, every backticked name against the picture — and prints the section's size in lines, bytes, characters and the tokens the platform's own accounting gives it.

What the checks do not show: the token figure is the platform's own rule — `Math.ceil(characters / 4)`, read in the installed assembly — applied to a measured character count; the platform ships no importable tokenizer, so the ground truth is a provider's own `usage.inputTokens` on a first request, which needs a live call and is not taken here. And a name check reads that a name **occurs**, never that what it names is what the rule meant.

## Boundaries

- **It carries rules, not acts.** What a reader must do about a rule stays in the picture; a line of the section standing in a home document is the double ownership the check names, and the text is edited rather than the check.
- **One section, one file.** A second section, or a section per rule, is a decision this plugin does not take; the whole of what is in force is one text, and it is read as one.
- **Not the kit's law.** `AGENTS.md` is a snapshot of the kit and is not edited in this tree: a rule that is right in every project is argued into the kit, and this section carries the rules of **this** project.
- **No surface of its own.** No route, no browser half, no page section: the platform's own pages keep what switches, and a door here would be a second one to acts the platform already owns.
- **Paid for by every request.** A line that would not change a decision a session makes does not enter the file; the section's size is printed by the check so that its growth is a reading and not a habit.
- **No second copy.** The plugin holds no text of its own and never falls back to one: a missing or empty file refuses the mount rather than serving rules that are not the file's.
