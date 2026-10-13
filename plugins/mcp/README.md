# MCP: the servers of a profile, their picture and the hand

The platform already owns everything about an MCP server except the way the user manages it. A server is a row of an entry list the Loader reads, writes and watches; one row is one `@deepseek-ai/dsh-mcp-client` instance which connects by itself, registers its tools on the tools service under `mcp__<serverName>__<toolName>`, and contributes its resources and its instruction text to the model. The harness has no interface for those rows at all, and its own plugin manager cannot switch them: a row inside an include file is reported `readOnlyReason: unaddressable`, so its Plugins page lists an MCP row and cannot change it.

This plugin is the picture and the hand. It reads the rows of the profile's servers file through the Loader's own tree, joins each row with the tools the tools service currently carries under its prefix, and writes through the Loader: `create` for a new row, `update` for a change or a switch, and a removal asked of the row's own parent group by the id that group knows. Nothing of it is a client or a registry: the platform connects, reconnects and drops the tools of a server that will not come up. What the platform *says* about a row it cannot reach is taken as well — the client's own sentences go to `ctx.logger`, reach nobody in this build, and are carried into the picture as `trouble` (§ "The host's own words"). The browser half of the product draws the section; this plugin opens the one route it reads.

## Dependencies

- **`loader`**: `@deepseek-ai/cordis-plugin-loader` — the tree the servers file lives in. Its `resolve`/`create`/`update` are the writes, and the include that mounts the file (`cordis:include`) is the only writer of it, so the plugin never touches YAML.
- **`pluginManager`**: the inventory of the composition — the row's qualified `entryId`, its entry phase, its effective enablement, and the platform's own `readOnlyReason`.
- **`tools`**: `ctx.tools.schemas()` — one schema per visible tool, projected onto the model-facing fields, with no owner tag at all. A tool is attributed to a server by the prefix the platform's own client builds, and the arithmetic that makes that safe is pinned in one place (`row.js: publicPrefix`).
- **`connection`**: `ctx.connection.fetch.register` — the door outward, under the connection's own fence, read by the page with a plain `fetch` of the same origin.
- **`ctx.logger`**: `@deepseek-ai/cordis` — the service the platform's own client writes to. The plugin registers a receiver (`ctx.logger.exporter`) and formats what arrives with the platform's own `Logger.format`; it takes words, never a state.
- **The platform's own MCP client is not a dependency.** The rows name it (`@deepseek-ai/dsh-mcp-client`) and the platform mounts them; this plugin never imports it, never connects and never holds a state it cannot publish.

## In the surface

Two rows in `bundles/coreness.patch.yml`: this plugin, and the platform's own include that mounts the servers file.

```yaml
- id: coreness-mcp
  name: '@coreness/dsh/plugins/mcp'

- id: mcp-servers
  name: cordis:include
  config:
    path: ./mcp-servers.yml
    initial: []
```

The include's path is resolved against the profile's directory — every patch row is applied inside the composition the profile's own config file mounts — so the servers live in `$DSH_HOME/profiles/<name>/mcp-servers.yml`, beside the composition rather than inside a patch, and the file keeps one writer. `initial: []` gives a fresh profile an empty list instead of no file. The plugin looks for the row of that file by the id `mcp-servers` (`INCLUDE_ID` in `index.js`), at whatever depth the composition mounts it: the address it resolves is the one the inventory publishes, never one built by hand.

**One exact route.** `POST` and `GET /api/coreness.mcp` on the platform's connection service, same origin, under the browser's own trust.

`GET` — the picture:

```json
{"ok": true, "value": {
  "file": {"entryId": "include:mcp-servers", "path": "./mcp-servers.yml", "enabled": true},
  "state": "ready",
  "reason": null,
  "rows": [{
    "entryId": "include:mcp-servers:mcp-supabase",
    "id": "mcp-supabase",
    "module": "@deepseek-ai/dsh-mcp-client",
    "shape": true,
    "server": "supabase",
    "transport": "streamable-http",
    "url": "https://mcp.supabase.com/mcp",
    "command": null, "args": [], "timeout": null, "cwd": null, "loud": false,
    "env": [], "headers": [{"name": "Authorization", "value": "Bearer …"}],
    "kept": ["reconnect"], "refs": [],
    "enabled": true, "disabledRef": false,
    "phase": "active",
    "readOnlyReason": "unaddressable",
    "tools": [{"name": "mcp__supabase__list_tables", "label": "list_tables"}],
    "trouble": null
  }]}}
```

A row the platform's own client has complained about carries the client's sentence instead of `null`:

```json
"trouble": {"at": "2026-10-06T21:31:39.583Z", "level": "warn",
            "text": "mcp-client(dead): connection failed; retrying in 4000ms (attempt 5/10)"}
```

`state` is `ready`, `no-file` (this composition declares no row for the servers file) or `failed` (the row is declared and cannot be read — `reason` carries the Loader's own words). A header and an environment variable travel as the row's own file holds them: each pair is its name and the text under it — a literal as the literal, an expression as the file spells it (`!!js …`), `""` when the file carries none. No name makes a value unfit for the screen.

`kept` names the keys of the row the form does not draw for that row's branch: their values stay in the file and only their names travel, so a reader is told the row holds more than the form shows. A key of the branch a save would leave stands there as well — that is how the editor can name what a save will drop before it drops it. `transport` is the platform's own word and nothing else, and a row is named by it: nothing of the file is read back as a label.

`POST` — one save. The body names the action: `add` carries a `form`, `edit` an `entryId` and a `form`, `toggle` an `entryId` and `enabled`, `remove` an `entryId` alone, `reference` an `entryId` with the credential key and the expression a row's header is to carry, and `reload` an `entryId` alone. The form carries `serverName` and `transport`, the fields of that branch — `command` with `args` (one argument per line) and `env`, or `url` with `headers` — and the fields both branches draw: `cwd`, `timeout` and `loud` (the one plain sentence for a server that fails to come up). A pair travels as `{"name": "…", "value": "…"}`. The answer is the picture read back beside what was done:

```json
{"ok": true, "value": {…the picture…, "result": "updated", "entryId": "include:mcp-servers:mcp-supabase", "server": "supabase"}}
```

`result` is `created`, `updated`, `nothing` (the file already held exactly this row, and a repeated save writes nothing so that a connection is not restarted for no reason), `removed`, `disabled` or `enabled`.

A field the form draws follows the form in three states: **absent** from the request it keeps what the row holds — a page that does not draw a field yet wipes nothing — **empty** it takes the key off the row, and **filled** it is the person's word. `loud` is a yes or a no, and any other value is refused (`bad-value`).

```json
{"ok": false, "error": {"code": "name-taken", "message": "the file already declares a server named \"supabase\""}}
```

The codes are one vocabulary, named in `row.js` and held against the browser half's by a check — `name-taken`, `not-saved` and the rest — and the message beside a code is the sentence the user reads.

**Two saves carry a reference, and they are the only hand that writes a row's authorization header as an expression.** `reference` writes the credential key's own expression into the row's `Authorization` header and puts `inject: [credentials]` on the row, so the row's own context holds the credential service; `reload` writes neither and activates the row afresh. The option goes in a write of its own, before the header: the Loader evaluates a configuration as the write lands, and a write carrying both was refused in its own words — `cannot get property "credentials" without inject` — while the option stood in the file. What a person sees: a row that has signed in stops holding a token and holds a reference instead — nothing of the secret stands in the servers file — and the header it sends is read from the stored grant every time the row is activated, so a rotated token is carried by activating the row again rather than by editing the file. A reference pointing at a grant that is not there is not silence: the expression refuses the row's activation with a sentence carrying `oauth-no-token`, and the platform reports the row among the entries that did not activate, where before such a row activated happily and sent `Bearer undefined` to a server.

**A row's tools come back by activating it again.** A token that changed in the store is not a change to the file, so `reload` switches the row off and on through the Loader — `disabled: true` and then the key off the row — because a write that changes nothing restarts the entry and leaves the header standing as it activated; that was measured at a run's own wire, where the old token went on being sent after such a write and the new one arrived after a fresh activation. The file carries `disabled: true` for the one write in between, the tool list of that one server is unregistered and registered again, and a reload that leaves the row switched off is refused rather than reported as done.

**The display rule: the form draws what connects a server, and carries the rest.** The fields the form draws are `serverName` and `transport`, the branch's own fields — `command` with `args` and `env`, or `url` with `headers` — and, on both, `cwd`, `toolCallTimeoutMs` and `failOnStartupError`, the last one drawn as one plain sentence rather than as a field's name. Every other key a row carries belongs to the file: a save writes it back exactly as it stands, and `kept` names it so a reader knows the row holds more than the form shows. The two lists live in `row.js` as `DRAWN`, and the property they hold is one sentence: **nothing is lost on save**.

A row is added through the form's own fields, by hand: the two branches are the two ways a server connects, and the form is self-sufficient — it offers no prepared recipe, and none is asked of it.

## The host's own words

A row that cannot connect looks exactly like a row that has no tools: the platform publishes `phase: "active"` for both and an empty tool list for both, and says nothing about why — read in the installed client half through `node scripts/harness.mjs grep`. It does *write* it — the client logs `mcp-client(<serverName>): connection failed; retrying in 4000ms (attempt 5/10)`, `… giving up after 10 consecutive failed reconnect attempts …`, `… reconnected and re-synced tools (attempt 2/10)` through `ctx.logger` — and in this build those warnings are dropped before any sink sees them: the plugin registers a receiver, asks for the severities the client speaks with, and carries the lines into the picture as `trouble`.

**From the model's side there is no fault at all** — the projection the request builder reads carries no name for a row that did not come up, `ctx.tools.get()` finds it nowhere, and the launcher's own log says nothing about such a row either, so the operator's only notice of it is the sentence carried into `trouble` (a row whose command cannot be raised leaves the tool list with nothing named for it and the log with no line about it at all).

**What is taken.** The text is the platform's own — `Logger.format({ colors: false }, message)`, the line the host would print — quoted as it stands (`trouble.js`). The page labels it, dates it and names its severity; it never paraphrases it into a reason of its own, because a paraphrase standing where the host's own words exist is a guess drawn as a fact.

**A receiver asks for the severities it wants.** The service hands a message to a receiver only when the message's own level is not above the receiver's threshold, and a receiver that names none is handed `INFO` (1) — so it never sees a **warning** (2), which is the client's ordinary way of saying that it cannot connect. The plugin therefore declares `levels: { default: 2 }`, the same pair the platform's own startup collector asks for; error, info and warn arrive, and only `debug` is left out. A run without that line showed exactly this: rows failing for a second, and a picture carrying nothing.

**How a line finds its row.** By the label the client itself builds, `mcp-client(<serverName>): `, composed for each row rather than guessed out of the text. The labels of the declared rows are compared with the longest first, because the platform builds its label by interpolation: a name carrying `): ` inside it (only a hand-edited file can hold one) would make a single line start with two rows' labels, and the longest is the one the client actually wrote — the shorter row then carries nothing rather than a sentence about somebody else. A line no declared label matches belongs to nobody here and is dropped rather than attributed: a row carrying no `trouble` is honest, a row carrying the wrong one is not.

**What the picture carries.** `trouble` is the newest kept line *when that line is a warning or an error*, with the moment it was written (`at`, ISO) and its own severity (`level`); it is `null` otherwise. The newest word decides: a server that came back has the client's own `reconnected and re-synced tools` line newest, so a recovered row is not drawn as one in trouble — and a row that is switched off carries no word at all, because its client is unmounted and the line would be about a connection nobody is attempting any more. The store keeps the last `RING = 200` lines the host wrote about any server of this profile — a ring over the service rather than a list per row, since a line is attributed when it is read and nothing has to be guessed at write time.

**How long the receiver lives.** `ctx.logger.exporter()` registers its effect on the *root*: the service is built with the root context, so a receiver left to the service's own bookkeeping outlives whatever asked for it, and a reload of the profile would pile one on another. The plugin therefore registers it inside an effect of its own fiber (`index.js`), and the receiver dies with the plugin. A consequence, named rather than hidden: lines written before the plugin mounted are not seen. A broken row says so on its next attempt — a warning at every retry, an error when it gives up — so the line appears within a second of the first failure, while a row that had already given up before the plugin was there carries nothing until it is reloaded.

## The card follows a row that is still moving

The section reads the picture again by itself while a row is unsettled, so the user sees `loading → active`, or the host's own words arriving, without touching anything. A row is unsettled when it stands in a transient phase (`loading`, `unloading`); or when it is enabled, at rest and has neither a tool nor a word from the host — the shape of a row in the second before the platform's client says what is wrong with it; or when it is enabled, brings no tool, and its newest word is the client **still trying** (a `warn`). The wait ends when nothing is left like that: a tool arrived, or the newest word is an `error` — the client's giving up — or the ceiling is reached, or the section is left (the timer goes with the effect), or a read failed. A row that is switched off is not watched.

The pace and the ceiling live in `plugins/page/client.mcp.js`: a read a second for the first fifteen reads, then one every five seconds, never past sixty reads (about four minutes). The user watching a row they have just written needs that first second, and after it the client's own retries are tens of seconds apart — 0.5, 1, 2, 4, 8, 16, then 30 seconds each — which is what lets the card reach the host's own last word: the client gives up after about two and a half minutes on that ladder. Nothing polls forever: the ceiling, the stop rule and the section's own lifetime bound it. A read that brings the same picture as the one on screen is not drawn again, so nothing is rebuilt and no line flickers for nothing.

The ending is the host's, not ours: the giving-up line is quoted like every other, its severity drives the line's tone (`data-level="error"`), and its own words name what to do — *reload the plugin or restart the Host to reconnect*. No paraphrase, nothing softened.

## The rule the write path stands on

**A save is confirmed by reading the tree back, not by the absence of an error.** The platform's `EntryTree.remove(id)` resolves a row by its path from the root, then hands that same qualified id to the group that holds it, whose lookup is keyed by the row's own id: the lookup misses, the group returns without a word, the file is written with the row still in it, and the caller is told nothing. A save that trusted that silence would answer `removed` and the row would be back at the next read.

So every write ends by asking the tree again — the same tree the Loader writes the file from — and comparing it with what was written. A disagreement is a `not-saved` refusal whose words name both sides, and the silent case is covered by a test (`test/write.test.mjs`, "the platform's own removal is silent"). The same rule covers a switch: the enablement is read back after `update`, not assumed from its return.

**The file on disk is not the confirmation, and cannot be.** The include writes its file on its own tick — `writeFile` schedules `flushWrite` with a zero timeout — so a read of `mcp-servers.yml` taken the instant a save answers can still show the list from before it (the file holds `[]` right after the first save and the row a moment later). The tree is the thing the Loader writes *from*, so the read-back is taken there and the lag cannot fool it; a reader that wants the file itself has to wait for it.

## Changing this

Each row is one change, the file and the names in it that carry the change, and the test that fails when the two drift. The suite is `node --test "plugins/mcp/test/*.test.mjs"`.

| the change | where it lands | what measures it |
| --- | --- | --- |
| the vocabulary of a row: the name pattern, the row id, the transports, the refusals | `row.js` — `NAME`, `rowId`, `TRANSPORTS`, `REFUSALS`, `buildConfig` | `test/row.test.mjs` |
| the display rule: the fields the form draws per branch, and the keys it carries instead | `row.js` — `DRAWN`, `keptOf`, `refsOf`, `buildConfig` | `test/row.test.mjs`, `test/picture.test.mjs` |
| a tool attributed to its server | `row.js` — `publicPrefix`, `rawToolName`; `picture.js` | `test/picture.test.mjs`, `test/row.test.mjs` |
| the picture: the states of the file, a row's fields, the kept names, the expressions | `picture.js`; `tree.js` — `includeOf`, `rowsOf`, `entryOf` | `test/picture.test.mjs` |
| the write path — add, edit, toggle, remove — and the read-back that confirms each | `write.js`; `tree.js` — `createRow`, `updateRow`, `removeRow` | `test/write.test.mjs` |
| the host's own words about a row that will not come up | `trouble.js` — `RING`, `LEVELS`, `labelOf`, `named`, and the receiver `index.js` registers | `test/trouble.test.mjs` |
| the route: its two methods, its body, its answers | `index.js` — `ROUTE`, `INCLUDE_ID`, `answer`, `bodyOf` | `test/route.test.mjs` |
| the section on the page: its cards, its form, the wait it follows a row with | `plugins/page/client.mcp.js`, the chunk named by `plugins/page/client.js` | `test/contract.test.mjs`, `node --test "plugins/page/test/*.test.mjs"`, and the walk `node scripts/page-form.mjs` |
| the rows the plugin is mounted by, and the file the servers live in | `bundles/coreness.patch.yml` — `coreness-mcp` and the `mcp-servers` include | `node scripts/accept.mjs` |

## Check

```
node --test "plugins/mcp/test/*.test.mjs"
node scripts/accept.mjs                       # the checks of the repository, this plugin's among them
```

The tests drive the plugin through a loader faithful where the addressing matters (the write counter, the short id a removal is asked by, and the platform's own silence), a plugin manager whose rows carry their `readOnlyReason`, and a tools service whose schemas carry no owner. They cover: the join of rows to tools by the prefix; the write path with its read-back; the silent removal; unknown fields kept and the unused branch pruned; an expression never overwritten; a value with a line break — or one of spaces alone — refused; a save that changes nothing writing nothing; every state of the route, including a body that is not JSON and a Loader failure whose words travel.

The host's own words are held on their own: which line belongs to which server, what a line of nobody does, what the newest line decides, and how long the ring is (`test/trouble.test.mjs`), with the field's rule in the picture and the receiver's lifetime against the plugin's own effects (`test/picture.test.mjs`, `test/route.test.mjs`).

The display rule is held on its own: a drawn field follows the form while a key the form does not draw stays the file's own, the two transports do not mix and the branch a save leaves is pruned, and the carried keys are named exactly as the file holds them (`test/row.test.mjs`), with the picture's reading of the same rule beside it (`test/picture.test.mjs`).

The installed assembly is read from the launcher:

```
dsh --profile <name> --dump-config      # shows coreness-mcp and the mcp-servers include row
dsh --profile <name> --no-open          # the boot log names no skipped bundle
```

The route is checked by a run against the profile's own file — `curl`-style with the launch token, or through the page, which is what `node scripts/page-live.mjs --profile <name> --port <port> --rail "MCP"` does: it boots the profile, clicks the rail row with a real pointer, reads the form out of the DOM and leaves a screenshot.

## Boundaries

- **No MCP client of our own, and no connection state.** The platform connects, reconnects and removes the tools of a server that stays down; this plugin reads what the tools service carries and repeats what the platform's own client said about a row, quoted. It never decides for itself why a server is not up: with a `trouble` line the reason is the host's, and without one the row says only "no tools yet", which is also what an answered-but-toolless server looks like.
- **A second source of servers is invisible.** An ACP session may declare `mcpServers` of its own, mounted per session and never a Loader row: those servers are not in the picture and their tools appear under a name with no row. Named as a debt, not a fault.
- **A rename is a new row plus a removal.** The row id is derived from the server name (`mcp-<name>`), and the form does not offer the action; a save that carried another name is refused rather than performed as a side effect.
- **Keys the form does not draw are carried, not edited.** `reconnect`, `maxInstructionBytes` and any key of a later version survive a save untouched; their names are drawn so the user knows the row holds more than the form shows, and their values stay in the file. The two fields the form gained — the working directory and the loud startup — are drawn and therefore the form's own: an empty box takes the key off, and a page that does not draw a field yet changes nothing by staying silent.
- **An expression is the file's, not the form's.** A header, a variable, an enablement or a setting the form owns that stands as `!!js` is reported as it stands — the file's own text travels — and any other text over it is refused (`header-ref`, `env-ref`, `config-ref`, `disabled-ref`): removing one means editing the file.
- **A header and a variable are the file's own text, and no name makes one a secret.** The page draws what it is given (§ "In the surface"); what remains of the form's own care is idempotence, not secrecy: a field left blank means "keep the stored one", whitespace alone is refused, and a value is removed by removing its pair.
- **The platform's own switches stay where they are.** The page writes its own file through this route and writes nothing else: the profile's patch and the enablement of rows we do not own are the platform's own manager's business.
- **The package names no organization.** Nothing in this plugin, its README or its checks names an organization, its hosts or its command-line tool: which servers a profile keeps is that profile's own file, and a public package that carried such a name would publish what is not ours to publish.
- **A refused form costs a form, never a connection.** The route answers a save it cannot accept with words and writes nothing; the rows are the platform's own and connect either way.
- **The form's own half is the page's.** The route publishes the picture — the rows, the fields each branch draws, the keys a row carries, the host's own words about it — and the section's own boxes, its two branches and the way a filled form is sent are the browser half's; both halves read the same vocabulary, `row.js`, whose refusals are the ones the page draws.
