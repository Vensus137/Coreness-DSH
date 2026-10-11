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

**One exact route.** `POST` and `GET /api/coreness.mcp` on the platform's connection service, same origin, under the browser's own trust. Every answer is a `200` carrying its own statement, because a refusal here is a sentence the user must read rather than a transport error.

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
    "command": null, "args": [], "timeout": null,
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

`POST` — one save. The body names the action: `add` carries a `form` (the name, the kind, the address, the call timeout, the headers, the environment), `edit` an `entryId` and a `form`, `toggle` an `entryId` and `enabled`, `remove` an `entryId` alone. The answer is the picture read back beside what was done:

```json
{"ok": true, "value": {…the picture…, "result": "updated", "entryId": "include:mcp-servers:mcp-supabase", "server": "supabase"}}
```

`result` is `created`, `updated`, `nothing` (the file already held exactly this row, and a repeated save writes nothing so that a connection is not restarted for no reason), `removed`, `disabled` or `enabled`.

```json
{"ok": false, "error": {"code": "name-taken", "message": "the file already declares a server named \"supabase\""}}
```

The codes are one vocabulary, named in `row.js` and held against the browser half's by a check — `name-taken`, `not-saved` and the rest — and the message beside a code is the sentence the user reads.

**The corporate kind.** A third value of `transport` stands in the form and in the picture beside the platform's two: `corporate`. It is the internal platform's own way to reach a server — the platform's CLI is started as a local process and speaks MCP over stdio, carrying the corporate hop and the access itself, so the harness never resolves the address and never holds a value of the credential. The kind is ours and the row is the platform's: a corporate save writes the platform's own `stdio` branch.

```yaml
- id: mcp-dd
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: dd
    transport: stdio
    command: dp
    args: ['ai', 'mcp', 'remote', '--url', 'https://<internal endpoint>/mcp']
    failOnStartupError: true
```

The form sends `{"serverName": "dd", "transport": "corporate", "url": "https://…/mcp", "timeout": ""}`, and the picture answers with `transport: "corporate"` and the address lifted out of the bridge's own arguments — the file holds it there and nowhere else — so the form redraws the row it wrote with no second copy of the address anywhere. `failOnStartupError` is written explicitly and reported among `kept`: a bridge that cannot come up must say so, and without that field a failed row is indistinguishable, in the platform's own data, from a server that has no tools.

The row's command is the bridge as the machine spells it: `dp`, looked up in the child's `PATH` (the platform scrubs the environment it hands a row but keeps `PATH`), or a path to it carrying the CLI's own file name — `dp` or `dp.exe`. A machine where the CLI is not on `PATH` pins it by adding the row through the `stdio` branch with the absolute path and the bridge's own arguments: the picture reads that row as the corporate kind, because the recognition is the row's shape and not the way it was typed. A shell shim named `dp.cmd` or `dp.bat` is not a spelling of the bridge but a row that cannot start at all: the platform's client spawns a row without a shell, and Node refuses a `.cmd` there with `EINVAL` — measured, not assumed.

**The recognition is exact, and a near-miss stays a plain stdio row.** A row reads as corporate only when its transport is `stdio`, its command is the bridge, its arguments are exactly `['ai', 'mcp', 'remote', '--url', <one http(s) address>]`, `failOnStartupError` is `true`, and it carries no `env`, no `headers` and no `cwd`. Anything else — one extra `--header` of the bridge's own, the loud startup dropped, another command, an environment, a working directory — is a plain `stdio` row, drawn with its own fields and edited as one. A near-miss claimed as corporate would hide the very field the user put there, and the next save would rewrite it away.

**What the kind refuses.** A corporate save carrying `headers`, an environment, a command or arguments is refused in words that name the field and the reason (`bad-transport`): the access belongs to the bridge and the command is ours, so neither is typed on this form — and a refusal, not a silent drop, is what keeps a half-typed secret out of a row. An address that is not one http or https URL is refused (`bad-url`). The address never becomes a field of the row: it travels inside the bridge's arguments, so nothing on this side is handed an endpoint to reach itself.

## The host's own words

A row that cannot connect looks exactly like a row that has no tools: the platform publishes `phase: "active"` for both and an empty tool list for both, and says nothing about why. It does *write* it — the client logs `mcp-client(<serverName>): connection failed; retrying in 4000ms (attempt 5/10)`, `… giving up after 10 consecutive failed reconnect attempts …`, `… reconnected and re-synced tools (attempt 2/10)` through `ctx.logger` — but this build mounts no console sink for that service, and the one sink it has, the service's own in-memory ring, names no severity of its own and is therefore handed errors and info only: the client's **warnings** are dropped before any sink sees them. Neither the page, nor the launcher's stdout, nor `~/.dsh/logs` shows any of it. The plugin registers a receiver, asks for the severities the client speaks with, and carries the lines into the picture as `trouble`.

**From the model's side there is no fault at all** — the projection the request builder reads carries no name for a row that did not come up, `ctx.tools.get()` finds it nowhere, and the launcher's own log says nothing about such a row either, so the operator's only notice of it is the sentence carried into `trouble` (a row whose command cannot be raised leaves the tool list with nothing named for it and the log with no line about it at all).

**What is taken.** The text is the platform's own — `Logger.format({ colors: false }, message)`, the line the host would print — quoted as it stands (`trouble.js`). The page labels it, dates it and names its severity; it never paraphrases it into a reason of its own, because a paraphrase standing where the host's own words exist is a guess drawn as a fact.

**A receiver asks for the severities it wants.** The service hands a message to a receiver only when the message's own level is not above the receiver's threshold, and a receiver that names none is handed `INFO` (1) — so it never sees a **warning** (2), which is the client's ordinary way of saying that it cannot connect. The plugin therefore declares `levels: { default: 2 }`, the same pair the platform's own startup collector asks for; error, info and warn arrive, and only `debug` is left out. A run without that line showed exactly this: rows failing for a second, and a picture carrying nothing.

**How a line finds its row.** By the label the client itself builds, `mcp-client(<serverName>): `, composed for each row rather than guessed out of the text. The labels of the declared rows are compared with the longest first, because the platform builds its label by interpolation: a name carrying `): ` inside it (only a hand-edited file can hold one) would make a single line start with two rows' labels, and the longest is the one the client actually wrote — the shorter row then carries nothing rather than a sentence about somebody else. A line no declared label matches belongs to nobody here and is dropped rather than attributed: a row carrying no `trouble` is honest, a row carrying the wrong one is not.

**What the picture carries.** `trouble` is the newest kept line *when that line is a warning or an error*, with the moment it was written (`at`, ISO) and its own severity (`level`); it is `null` otherwise. The newest word decides: a server that came back has the client's own `reconnected and re-synced tools` line newest, so a recovered row is not drawn as one in trouble — and a row that is switched off carries no word at all, because its client is unmounted and the line would be about a connection nobody is attempting any more. The store keeps the last `RING = 200` lines the host wrote about any server of this profile — a ring over the service rather than a list per row, since a line is attributed when it is read and nothing has to be guessed at write time.

**How long the receiver lives.** `ctx.logger.exporter()` registers its effect on the *root*: the service is built with the root context, so a receiver left to the service's own bookkeeping outlives whatever asked for it, and a reload of the profile would pile one on another. The plugin therefore registers it inside an effect of its own fiber (`index.js`), and the receiver dies with the plugin. A consequence, named rather than hidden: lines written before the plugin mounted are not seen. A broken row says so on its next attempt — a warning at every retry, an error when it gives up — so the line appears within a second of the first failure, while a row that had already given up before the plugin was there carries nothing until it is reloaded.

## The card follows a row that is still moving

The section reads the picture again by itself while a row is unsettled, so the user sees `loading → active`, or the host's own words arriving, without touching anything. A row is unsettled when it stands in a transient phase (`loading`, `unloading`); or when it is enabled, at rest and has neither a tool nor a word from the host — the shape of a row in the second before the platform's client says what is wrong with it; or when it is enabled, brings no tool, and its newest word is the client **still trying** (a `warn`). The wait ends when nothing is left like that: a tool arrived, or the newest word is an `error` — the client's giving up — or the ceiling is reached, or the section is left (the timer goes with the effect), or a read failed. A row that is switched off is not watched and carries no word (§ "The host's own words").

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
| the corporate kind: the row a save writes, the fields it refuses, the near-miss that stays stdio | `row.js` — `KINDS`, `isCorporate`, `corporateConfig`, `foreignFields` | `test/corporate.test.mjs` |
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

The tests drive the plugin through a loader faithful where the addressing matters (the write counter, the short id a removal is asked by, and the platform's own silence), a plugin manager whose rows carry their `readOnlyReason`, and a tools service whose schemas carry no owner. They cover: the join of rows to tools by the prefix; the write path with its read-back; the silent removal; unknown fields kept and the unused branch pruned; an expression never overwritten; a value with a line break — or one of spaces alone — refused; a save that changes nothing writing nothing; every state of the route, including a body that is not JSON and a Loader failure whose words travel. The host's own words are held on their own: which line belongs to which server, what a line of nobody does, what the newest line decides, and how long the ring is (`test/trouble.test.mjs`), with the field's rule in the picture and the receiver's lifetime against the plugin's own effects (`test/picture.test.mjs`, `test/route.test.mjs`). The corporate kind is held on its own (`test/corporate.test.mjs`): the row a save writes and the picture reading it back as corporate with its address and its tools; the call timeout carried and a repeated save writing nothing; the near-misses — a plain stdio row with its command and arguments intact, and a row whose `transport` stands as an expression and reads as no kind at all; the bridge recognised under its own file names (`dp`, `dp.exe`) and every other program — a script of one's own, a shell shim, a near name — not claimed as it; the fields of another branch refused in words, with the file untouched; and an address that is not one http or https URL refused, with no `url` ever written into the row.

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
- **Unknown field shapes are carried, not edited.** `cwd`, `reconnect`, `maxInstructionBytes`, `failOnStartupError` and any field of a later version survive a save untouched; their names are drawn so the user knows the row holds more than the form shows, and their values stay in the file.
- **An expression is the file's, not the form's.** A header, a variable, an enablement or a setting the form owns that stands as `!!js` is reported as it stands — the file's own text travels — and any other text over it is refused (`header-ref`, `env-ref`, `config-ref`, `disabled-ref`): removing one means editing the file.
- **A header and a variable are the file's own text, and no name makes one a secret.** The page draws what it is given (§ "In the surface"); what remains of the form's own care is idempotence, not secrecy: a field left blank means "keep the stored one", whitespace alone is refused, and a value is removed by removing its pair.
- **The platform's own switches stay where they are.** The page writes its own file through this route and writes nothing else: the profile's patch and the enablement of rows we do not own are the platform's own manager's business.
- **The corporate hop is not provable in this repository.** The bridge is absent from this machine and no corporate network is reachable, so what stands here is the shape of the row handed to the platform's own client — the row the handover's evidence shows working live on the owner's machine — and the mechanism proven against a local stdio server. Nothing in this plugin, its tests or its picture claims the hop itself: a corporate row that comes up is the bridge's doing, and a row that does not says so through the platform's own words (`trouble`).
- **The bridge's other subcommands are not carried.** The bridge also serves named corporate servers of its own; this form writes the `remote --url` branch alone, and no list of corporate server names stands in the package.
- **No list of corporate hosts stands in the package.** The product cannot tell an internal address from an external one without a company-specific list, and that list is not carried here: it would publish internal names and rot. The guard is structural — the harness never resolves the address, the bridge does — and the field's own words say what belongs in it.
- **The form's own half of the corporate kind is the page's, and it stands there.** The route takes the kind and the picture reports it; the section's own option, its address field and its line of help are the browser half's — `TRANSPORTS` carries the third kind, the dictionary words it (`kind.corporate`, `help.corporate`), the editor draws the address in place of the command and the arguments, and `formOf` sends the kind's fields alone: the name, the kind, the address and the call timeout (`plugins/page/client.mcp.js`). So `Edit` on a corporate row opens the corporate layout, and the host writes what the page must not type — the bridge's own command, its arguments and `failOnStartupError` (`row.js`). A save that carried a header, an environment, a command or arguments is refused in words (`bad-transport`) rather than written over the row.
