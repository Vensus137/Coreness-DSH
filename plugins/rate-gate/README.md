# The rate gate: a ceiling in tokens per minute, attached to a model

A limit on how fast a model may be spent, held where every model call passes: the platform's own `llm/stream` waterfall. The gate stands there as one listener in the chain outside the adapter, so an agent's step, a subagent's step, the compaction call and the session title all meet it — and so does this product's own road to Qoder, for the same reason the platform's providers do: that road is a registered adapter of the platform's one model service, not a transport beside it.

**A limit is attached to a model, named as the platform's own pair: `provider` and `model`.** That is the pair a request is routed by, the pair the model catalogue is grouped by, and the pair the platform's own default-model row carries — so a limit on `qoder/dfmodel` and a limit on `deepseek-official/deepseek-flash` are the same kind of thing, and two routes serving one model id are two budgets rather than one. A pair no row names is not wrapped at all: the listener returns `next()` as it stands, and the neighbour's own stream object reaches the caller unchanged.

**At the ceiling the gate holds, it does not refuse.** A refusal costs twice: the platform's retry policy sends the same step again, history and all, and the whole context is paid for a second time — while a hold spends nothing, because nothing is sent while it lasts. The hold is bounded by `maxWaitMs`, and a request whose bound is spent goes anyway, marked `forced` — a named overspend instead of a hung turn. The session title pays for the window and never waits for it: it carries a deadline of its own, and a held title would be a failed title rather than a delay.

**The surface that shows it is a section of the product's page, and it is not in this folder.** The product carries exactly one browser half — the page's — and a row addressed by a subpath carries none (`PROJECT.md`, §How the platform is built (settled), the conclusion on a plugin addressed by a subpath), so the section's chunk lives beside the page's entry and reads the route described below. This plugin is host-only: it enforces, it counts, and it answers.

## Dependencies

- **`llm`**, declared in `inject`: the waterfall the gate stands on, and the registry that says which pairs this profile really routes (`listProviders()`, `listModels(provider)`). A composition without a model service leaves the plugin pending rather than mounted over nothing.
- **`connection`**, deliberately *not* declared: it carries the one route, and the plugin must mount where there is no web surface. The route is registered in a scoped area (`ctx.inject(['connection'], …)`) and says so when the area never runs.
- **`@deepseek-ai/schemastery`** for the row's `Config` — the platform's own schema library, the one the settings service projects a form from.
- **`@deepseek-ai/cordis`** for the tests, as a devDependency of the repository: one of the three test files mounts the plugin through the installed library, with a road and a transport written there, because a stand-in context can imitate the shape of a dispatch and cannot decide it.
- **No browser half of its own.** The row names a subpath of the package, and a subpath row carries no browser half at all. Nothing of this plugin draws; the page's chunk draws what the route answers.

## The limit in force

### Where the gate stands

`stream(options)` reaches `ctx.waterfall(this, "llm/stream", options, () => this.adapterStream(options, prepared))`, whose own contract is "waterfall around every streaming model call (retry, replay, routing)" with the full request as its argument. The gate registers one listener there, `{ global: true }` and deliberately **without** `prepend`:

- **`global`** is the platform's own flag on this seam and the one the handover's proven plugin carries.
- **No `prepend`** puts the gate in the chain outside the adapter rather than outside everything: what it holds and counts is then exactly what would otherwise be dispatched, and a listener that answers without dispatching — a replay — is a call the vendor never sees and must not be charged to a window.

A request built by the agent loop arrives deep-frozen and is only read; the gate reshapes nothing. `purpose` distinguishes the two service calls the build has — `compaction` and `session-title` — and the gate treats the title differently for the reason above. No watchdog of the platform's bounds the waterfall: `deadline` and `idleWatchdog` live inside the adapters, the tools and the title policy, so a hold before `next()` is cut by no ceiling but the gate's own.

### What is counted

- **Before the send: a reservation.** The build carries no tokenizer; the harness's own meter prices text as "four characters per token plus block and role overhead" and calls that figure approximate. The gate prices `system`, `messages`, `tools` and `toolHistory` the same way — the platform's own vocabulary (`type`, `role`) is priced by the block overhead rather than by the length of the words — adds a flat reserve for a picture (its price is not derivable from the request, and a picture travels as a reference), multiplies by a factor calibrated from the pairs already settled, and adds an output reserve taken from the request's own `maxTokens`, held under the plugin's ceiling.
- **After the send: the fact.** The provider's `usage` replaces the reservation, charged as `max(input + output + cacheRead + cacheWrite, totalTokens)` — the four buckets are the harness's own accounting and `totalTokens` is the route's, so the larger of the two is the one number that cannot undercharge a window. `reasoningTokens` is not counted: it is reported inside the output on every route this gate was read against.
- **A stream that carries no `usage`, and one that dies before it, leaves the reservation standing** until the window ages it out. The entry stays *provisional*, and the route's answer reads it as a charge without a fact. The input of a request that reached the vendor is spent whether or not an answer came back.
- **The window is a rolling one**, `windowMs` long, per pair, in process memory: entries carry their own moment and charge and leave the window as they age. Sessions, subagents, compaction and titles share it, because what a ceiling belongs to is the key or the account and not a session.
- **Not counted: the route's own control calls.** The node sweep, the catalogue read, the token exchange and the credits read go to the vendor through the Qoder plugin's transport (`plugins/provider/qoder/in.js`) and never pass the model service, as no adapter's discovery call does. No request-per-minute ceiling of a vendor's is covered by this gate on any road.
- **Where the window lives.** A private field of the gate instance — one map keyed by the pair, `keyOf(provider, model)`, rather than a counter for the plugin — and an entry appears in it only where `GateLedger` admitted a request of its own: a pair no row names, and a request cancelled while it waited, leave the window as they found it. An entry carries its own moment and charge and leaves as it ages (`#prune`, `#timeUntilFree`), which is what the rolling window above is made of. Nothing of it reaches the disk — the row's numbers are the profile patch's, written through the platform's own settings service, while the spend is the instance's alone — so a restart re-reads the file and begins with an empty window, and the host half outliving the page is what keeps the count across a reload. The vendor's own counting is read nowhere here, so spend under the same key, from another machine or another user, is invisible to this window.

### At the ceiling

- **A request the window has room for is admitted at once.** The ceiling is a budget, so a request that fits spends it rather than queueing behind one that does not; what waits is what the window cannot hold.
- **A queue is served from its head.** Within its pair's queue nobody overtakes another, and a wake is armed for the exact moment the oldest entries leave the window rather than for a poll interval.
- **`oversize`** marks a request larger than the whole window: it waits only until the window is empty and then goes.
- **`forced`** marks a request whose bound on the wait is spent: it goes over the window, and the decision carries the wait it would have needed. Both marks are in the route's answer and in the log, so an overspend is named rather than inferred.
- **A cancellation frees the place at once.** A request aborted while it waits is never sent, its ticket leaves the queue and the wake it owned is dropped; the stream then closes with the terminal the runtime itself produces for a caller's cancellation, `{type:'finish', reason:{kind:'aborted', …}}`, carrying the caller's own reason when it left one. A request cancelled after the place was granted releases the place whole.
- **A limit edited while the route runs is obeyed at the next decision**, and a limit taken away lets the requests already waiting for it go — they proceed untouched rather than failing, because a wall nobody is asking for any more must not hold them. So does the plugin's own disposal (a reload, the row switched off, the application closing).

## The numbers and where they live

Every number is a field of the row and is read at each decision, never captured at the mount (`PROJECT.md`, §What is decided and is not revisited, the item "A number in the product is chosen, not inherited"). The shipped row names **no model**: the gate then mounts, says in its log that nothing is limited, and wraps nothing — a limit shipped by default would silently throttle turns nobody asked to throttle.

Every value stands once in the plugin's own `DEFAULTS` and `BOUNDS` (`gate.js`), and each field's schema declares the same default (`index.js`); the four scalars — the window, the wait, the watching mode and the caution — are also carried in the route's answer. The table carries what each value is **for**, and what a reader must not mistake it for:

| Field | Why this number |
|---|---|
| `windowMs` | A tokens-per-minute ceiling is a rolling minute; a fixed calendar minute would let a burst straddle a boundary and spend twice the ceiling. Held at the schema's own lowest bound: below it a ceiling is a burst allowance and not a rate. |
| `maxWaitMs` | The reason is arithmetic: waiting a whole window always empties the window, so a longer wait cannot make room for anything but a request larger than the ceiling itself. It bounds the queueing and the waiting alike, or it would only be noticed once the window freed and would not work at all. |
| `dryRun` | The watching mode: every request is charged and the wait it would have taken is counted, and nothing is held. It exists so a limit can be calibrated without stopping work. |
| `thresholdRatio` | The gate's own caution under a ceiling the vendor owns: the estimate is an estimate, and a key may be shared with other machines. Two numbers rather than one, because on a divergence it must be visible which of them to move — the row's ceiling, or the caution over it. |
| `limits[].tokensPerMinute` | The row's own ceiling. A row without a positive one is refused **by name** in the log and in the route's answer; it is never replaced by a guess. |
| `limits[].thresholdRatio`, `limits[].dryRun` | Left absent in a row that does not choose them, so a change of the plugin-level number still reaches that row. |
| `charsPerToken`, `blockOverheadTokens`, `imageTokens` | The harness's own heuristic and its shape. |
| `outputReserveTokens`, `maxOutputReserveTokens` | The answer's shape when the request declares no budget; a declared budget is a figure to argue with, not a promise — a request declaring a budget of a few tens of output tokens was answered with thousands of them (`PROJECT.md`, §What is decided and is not revisited, the item on `max_tokens`). |
| `calibrationAlpha`, `maxEstimateFactor` | How fast the factor follows the facts that settle, and how far one wild fact may take it. The factor is shown on the page so the user can watch it settle. |

A plugin-level number outside its bounds is not obeyed and not hidden: the number that is used instead, and the number the row asked for, both go to the log — and never to a schema refusal, because a plugin that fails its schema is not mounted, which would take its settings namespace away with it and leave no form to repair the number from.

### The namespace, the schema and the write

The namespace is the row's own id — `coreness-rate-gate` — and every field a page moves is `volatile`, which is both the platform's word for a write that applies to the running plugin without re-mounting the row and the condition a write goes through at all; it is also what puts the field into the form a surface is offered. The values are written **through the platform's own settings service**, never through a route of this plugin's: the route is read-only on purpose, and the page's controls are drawn over the same namespace the config file writes.

The row's own fields of `limits` are declared untyped in the schema (`z.any()`), and that is a decision with a reason: a limit row is data a page writes and a hand edits, and a schema that refuses a row takes the whole plugin down with it — no mount, no namespace, no form to repair the value from, which is the trap the port already paid for once. The shape of the list is declared; the values are resolved by `gate.js`, which refuses an unusable row by name.

The document a form write lands in is the active profile's own patch — the service answers it as `documentPath` — so the values of this row and the file the user edits are one document and not two: a write through `update` and `mutate` moves the limit, and the file under `- id: coreness-rate-gate` then carries what was written.

That the write reached the running plugin is read from the plugin's own arithmetic rather than from the file: a request issued after the write is charged against the number that was written, with no re-mount line in between. The request that cannot be held within the bound says so in its own line, with the wait it would have needed.

A write carries the revision it read. `describe()` recomputes a per-entry counter over the entry's fiber, its schema and its config on every call, so an edit of the file by hand or a change of the schema at a plugin update moves it too — the revision is a fingerprint of the row as it stands, not a serial of writes, and a write that leaves the values as they were does not move it. A stale one is refused by name: `settings namespace "coreness-rate-gate" changed since it was read (expected revision 0, now 2)`, `code: SETTINGS_CONFLICT`. The same call emits `settings/document-updated` for the namespace, which the platform forwards to the browser half, so a page's mirror and a hand's edit are told apart by nothing.

The values outlive the process that wrote them: a boot on the document as the write left it mounts with the limit already in force, and its own `describe` answers the written `value` against the plugin's defaults as `base`. Nothing has to be re-entered, and no other store holds a copy.

## Two traps the composition paid for

Two rules of the composition this row stands in were paid for live, and both are about the id rather than the values.

- **The row must be mounted by a layer applied before the profile's own patch** — in this product, the bundle (`bundles/coreness.patch.yml`). The editor rewrites an id-targeted row of that document and verifies the result against its own composition of it; a document carrying nothing but an `insert` row makes it append an id row whose target the composition resolves to the older inserted row, and every write is refused.
- **One id, one row.** `applyEntryPatches` keeps the last row per id in its map and appends what an `insert` row carries, while the editor verifies against the **first** row carrying that id. A composition that mounts the entry twice therefore writes into one row and checks against the other: the values land, the file changes, and every write is still refused with `Configuration for "coreness-rate-gate" is overridden by a home patch or command-line overlay` — including a write of the values that already stand there. `dsh --profile <name> --patch <layer> --dump-config` prints both rows, and it is the command that found this.

## In the surface

One exact route on the connection, `GET /api/coreness.rateGate`, read by a plain fetch of a document-relative path like the product's other routes. It is the only door to the gate's state, and it is read-only. The route declares `requestBody: 'buffered'` at its registration, which is not decoration: the platform's HTTP bridge builds the request from the route's own declaration and hands a route that declares nothing a streamed body, so the failure surfaces as `400 Bad Request` before any handler of the route's runs. The page's own walk found it — the first live press of the section read `400` where every fixture read the picture — and the mechanism behind it is read in the installed assembly: `requestBodyMode` in `@deepseek-ai/dsh-client-connection` returns the route's declaration, `undefined` where there is none, and the request is then built with a body its method cannot carry.

```json
{"ok": true, "value": {
  "v": 1, "at": 1791362731214, "ns": "coreness-rate-gate",
  "settings": {"windowMs": 60000, "maxWaitMs": 60000, "dryRun": false, "thresholdRatio": 0.9},
  "rows": [{
    "provider": "qoder", "model": "dfmodel", "name": "DeepSeek-Flash",
    "listed": true, "unlisted": null,
    "tokensPerMinute": 400000, "thresholdRatio": 0.9, "dryRun": false, "ceiling": 360000,
    "windowMs": 60000, "maxWaitMs": 60000,
    "used": 91831, "reserved": 0, "queued": 1, "waitingMs": 4120, "holdUntilMs": 1791362780000,
    "sends": 12, "holds": 3, "forced": 1, "oversize": 0, "wouldWait": 0, "aborted": 0, "cancelled": 1, "released": 0,
    "maxUsed": 380000, "maxWouldWaitMs": 0, "factor": 1.184,
    "recent": [{"at": 1791362736299, "purpose": "agent-loop", "charge": 54508, "charged": 54508,
                "outcome": "sent", "waitedMs": 0, "wouldWaitMs": 0}]
  }],
  "refused": [{"provider": "qoder", "model": "", "reason": "limits[2] qoder/?: the row names no model"}],
  "providers": [{"provider": "qoder", "name": "Qoder", "registered": true, "ceilingSum": 360000, "rows": 1}]
}}
```

- **`ns`** is answered rather than assumed: the page must not carry the settings namespace as a constant of its own, because the namespace is the row's id and a second copy drifts.
- **`listed` / `unlisted`** is the registry's own word about the pair, asked at each read (`listProviders()`, `listModels(provider)`). A pair the registry does not carry is *named, not refused*: the platform still routes an unlisted id, so such a row is not dead — what is missing is the advertisement, and a mistyped id must be visible rather than being a limiter that does nothing. A route whose catalogue fails answers the failure in words, never an empty list.
- **`used` / `reserved` / `ceiling`** are the window as it stands, `reserved` being the part of it that no provider fact has settled yet. `queued`, `waitingMs` and `holdUntilMs` are what waits. The counters are cumulative for the life of the process, `maxUsed` the fullest the window has been.
- **`recent`** is the ring of the latest six decisions with their outcome and, where one was spent, the wait they would have needed: the page explains a held or forced request by them.
- **`providers`** groups the rows and carries the **sum of their ceilings**: the gate limits models, and that sum is what the key really faces. It is shown so the user can compare it with what the key allows — the gate does not pretend to be a provider limit.
- **`refused`** carries the rows the gate would not use, with the reason the log also names.
- A payload that cannot be built — a registry that throws in a way not caught per route — answers `{"ok": false, "error": {"code": "state-failed", "message": "…"}}` with status 200.

The picker a form needs is **not** this route's business: the models to choose from come from the platform's own catalogue (`session.modelCatalog()`), the same door the Qoder section already reads (`plugins/page/client.provider.js`).

## Changing this

Each row is one change, the file and the names in it that carry it, and what measures it. The command is the plugin's own ritual and each row names the half of it; the whole set is `node plugins/rate-gate/check.mjs`, the three files in their order.

**One owner per subject, and here is where each stands.** The arithmetic and every number: `gate.js` — `DEFAULTS` and `BOUNDS` are the only copy, and the browser half carries none of them (it reads the schema's own `base` out of `describe()`, `plugins/page/client.gate.js` — `readSettings`). The namespace: the row's own id, `coreness-rate-gate`, answered by the route (`index.js` — `name`, `pictureOf`) and never assumed by the page. The document a write lands in: the active profile's own patch, owned by the platform's settings service — this plugin writes nothing and its route is read-only. The drawing: `plugins/page/client.gate.js` alone, because this plugin is host-only. The identity of a pair: the platform's registry, asked at each read (`index.js` — `listingOf`), never a list kept here.

| the change | where it lands | what measures it |
| --- | --- | --- |
| the window, the reservation and the fact that replaces it, the queue, the estimate, the calibration | `gate.js` — `GateLedger` (`reconcile`, `holds`, `stateOf`, `plannedTokens`, `usedOf`, `snapshot`, `dispose`), `DEFAULTS`, `BOUNDS`, `bounded`, `resolveSettings`, `resolveRows`, `estimateRequestTokens`, `outputReserve`, `chargedTokens`, `observedInputTokens`, `isAborted`, `abortReason` | `test/gate.test.mjs`, on a clock of the test's own |
| the row's schema, its bounds, the settings namespace, the mount and its lines | `index.js` — `name`, `Config`, `live`, `apply` | `test/mount.test.mjs` |
| the listener on the platform's model waterfall, the pair no row names, and the scope flag | `index.js` — `inject`, `apply`; `gate.js` — `keyOf`, `GateLedger.holds`, `GateLedger.stateOf` | `test/cordis.test.mjs`, through the installed Cordis |
| the gate's own account in the log: a hold, a fact, a cancellation, a forced send | `index.js` — `apply` (its `log` and `warn`), `noteOf` | `test/mount.test.mjs` |
| the route a surface reads, and the picture it answers | `index.js` — `ROUTE`, `answerOf`, `pictureOf`, `listingOf`, `nameUnlisted`, and the scoped registration inside `apply` | `test/mount.test.mjs`; live, `node scripts/page-form.mjs gate` |
| the write: who may move a number, and with which ops | the platform's settings service owns the document (the profile's own patch) and the namespace is the row id (`index.js` — `name`); the page sends the ops — `plugins/page/client.gate.js` — `writeSettings`, `opsOf`, `scalarOp`, `rowsOp` | `plugins/page/test/client.test.mjs`; live, `node scripts/page-form.mjs gate-write` and `gate-conflict` |
| the section on the page: the numbers, one card per model, the draft and the write | `plugins/page/client.gate.js` — `GateSection`, `draw`, `SCALARS`, `EN`, `CSS`, `numberField`, `limitCard`, `rowCard`, `readPicture`, `readSettings`, `pairsOf`; the chunk is named by `plugins/page/client.js` — `CHUNKS` | `node --test "plugins/page/test/*.test.mjs"`; live, `node scripts/page-form.mjs gate` |
| the driver's steps that read the section in a live browser | `scripts/page-form.mjs` — the steps `gate`, `gate-write`, `gate-answer`, `gate-refuse`, `gate-conflict`, with the helpers `ensureGateRow` and `gateReading` | the steps themselves: `node scripts/page-form.mjs gate-write` |
| the row the gate is mounted by | `bundles/coreness.patch.yml` — `coreness-rate-gate`; one id, one row (a second row of the same id is written into and verified against different rows, see §Two traps the composition paid for) | `node scripts/accept.mjs`; `dsh --profile <name> --patch <layer> --dump-config` when an id stands twice |
| the checks themselves, in one command | `plugins/rate-gate/check.mjs` — it imports the three files in their order | `node plugins/rate-gate/check.mjs`; the tree's own: `scripts/accept.mjs` — the per-plugin check `the plugin <name> carries tests` |

## Check

```
node plugins/rate-gate/check.mjs
node scripts/accept.mjs                            # the whole tree's checks, this plugin's own among them
```

The first command is the ritual: one command runs the three halves in their order and carries the exit code, so the suite is not re-typed from memory. The second is the whole tree's: it drives the neighbouring plugins' suites too, so its verdict is not this plugin's alone — what it says about this one is the line `the plugin rate-gate carries tests`.

The suite is in three halves by the kind of question each can answer. `gate.test.mjs` drives the arithmetic with a clock of the test's own — the bounds and the named refusals, the estimate and the charge, a window that holds and ages out, a queue served from its head, a fact replacing a reservation, the calibration's interval, the watching mode's prediction, the bound that marks `forced`, `oversize`, a cancellation, a limit taken away and the plugin's disposal — because "this request waited exactly until the entry left the window" is a claim a simulated clock can make and a sleep cannot. `mount.test.mjs` drives the listener the plugin registers with the real clock and real timers, through a stand-in for the platform's context: **a limit enforced on one model of a provider while the other model of the same provider is untouched** (the same provider, one call held for the whole window and one handed the neighbour's own stream object), a provider and a pair no row names, the session title charged but not held, a cancellation that reaches no adapter, a reservation left standing with no `usage`, the route's whole answer, the log's lines, the fields a page may write being exactly the live ones (the page's permission to write at all), and a limit written into a live field while the route runs. `cordis.test.mjs` mounts the plugin through the **installed Cordis**, with a road whose `stream()` dispatches the seam the way the platform's own service does: the row mounts and the hold happens inside the real waterfall, the road's own stream object reaches a model no row names, an observer in another isolation scope is reached only with `{ global: true }`, a listener standing outside the gate that answers without dispatching is charged to no window (the reason the gate is not prepended, verified and not argued), the scoped area runs when a transport arrives after the mount and the route dies with it, and the plugin's disposal releases what waits.

What the check does not show: nothing here boots a profile, so no live connection, no page and no vendor is exercised by the suite. A live run on the product's own headless road is what closes that gap:

### The live hold

One real run of the product's own headless road — this package linked into a home and a profile of the step's own, the gate's row and a model arriving as a `--patch` layer — with one task that makes the agent read a file and answer: two steps of one session. Nothing of the product's assembly was touched and no live profile was read. The task ran at once while nothing limited it; with a row whose window the second step could not fit, the gate's own lines say what happened:

The **second step was held for the rest of the window and then sent** — the mark the record carries (`waitedMs`) is exactly the wait the arithmetic predicts from the first step's entry and the window's length, so a live run could not have sent it before that entry aged out. The session title paid for the window and never waited, and the provider's facts replaced the reservations as the stream went on. The run answered correctly.

Two divergences the run showed, both carried in the design and neither hidden: **the estimate over-charges the window**, and the larger half of that is the output reserve taken from the request's own declared `maxTokens`, which is what the platform's own road declares for a step; and **the estimate's factor stays at 1** on the low side on purpose, because a fact under-counts a cached input and a factor that followed `inputTokens` down would under-charge the window. What the reserve costs is a window that reaches its ceiling sooner than the tokens really spent would; what it buys is a ceiling that is not crossed. The two numbers that move it are `outputReserveTokens` and, on a route that declares its own budget, that budget.

What even this does not show: no page was opened, so the route's answer was read in tests and not from a live browser, and the ring the user sees there was not read from a live run (a headless composition carries no transport, and the gate says so in its first line). No `429` was met, so `providerRetryAfterMs` remains unspent and unmeasured.

## Boundaries

- **Not a provider limit.** A limit on one model of a provider is one budget; the ceilings of several models are several budgets, and the sum the route answers is a piece of reading, not a limit the gate enforces. No wildcard row for "every model of a provider" exists, and a row keyed on a bare model id is not a thing: an id is unique inside its route, and the platform's identity is the pair.
- **Not requests per minute.** No request-per-minute ceiling is measured or published on either road this gate was written for, the platform answers a `429` through its retry policy, and a second counting axis with no number behind it is a knob nobody can justify.
- **Not money, not credits, not adaptive.** The vendor's money and the account's credits are counted elsewhere in this product; the gate counts tokens of a model. It does not learn from refusals: an adaptive limit guessed out of `429`s is a limit nobody can predict, and the pattern it exists for — hold, then mark — is what the handover's own field record chose.
- **No reset, and no mark of a changed number.** The section writes the four scalars and the rows as they stand: no control returns a field to the plugin's own default — that is an `unset` in the settings document, or a hand's edit of the file — and nothing says that a value differs from `DEFAULTS` in `gate.js`. A row's own caution and watching mode may follow the section's number, which the row's field says in words; what a plugin-level number stands against is drawn nowhere — the platform's own `describe()` answers a `base` beside the `value`, and this half reads the `value` alone. By the user's own word no control returns a field to the schema's default and no mark says where a number came from.
- **Not durable, and not aware of other machines.** The window lives in memory: an application restart forgets the spend, and a burst right after a restart can pass the ceiling. The counter sees only this process, so a key shared with other machines or users is spent faster than the window believes. Both are named in the route's own reading of the world; closing either is a change of its own.
- **`providerRetryAfterMs` is not spent here.** The value exists only where an adapter produces it (the platform's DeepSeek adapter reads `retry-after` into it) and the retry policy already spends it as its own delay, so a second hold of the same length would double it. Owed, with a live `429` as its closing act.
- **Nothing is written anywhere.** The gate keeps no file, writes no patch, and adds one thing to a stream it passes: the terminal `finish` for a cancellation it stopped itself. A provider's error arrives as a chunk or as a throw and leaves the same way.
