# The journal

The environment's memory: what changed in the profile and what a participant did, kept as records in a storage domain, written by agents through two tools and answered through one exact route. A record carries its kind, its area, its name, its author — `среда` for what the environment observes itself, `участник` for what the user or an agent writes — the profile that wrote it, and the fields of its kind. The environment observes its own life, the composition of the profile against the previous print and the rotation of its own records, whose baseline print is never dropped, and it hears what the platform keeps to itself — a compaction a step could not make is caught, the turn continues, and the one warning it leaves becomes a record of the environment's own failure; a participant writes the four other kinds, a refusal among them carrying its reason. The two tools are `journal`, a query — a summary without a kind, the records themselves with one — and `journal_note` for what cannot be observed: a closed task, a step with its duration, a refusal with its reason, a handover. The plugin is host-only: its row names a subpath of the package.

## Dependencies

- **The platform's storage stack**: `storageDomain` over `@deepseek-ai/dsh-storage-json`, whose root the base bundle sets to `dshHomePath('storages')`, with `backend: json` — plus `zod`, whose schema the domain facility applies to every stored record on open. The domain `coreness_journal` (version 1) keeps one table, `records`, keyed by the address `time|kind|area|id`, in the domain's default layout: one file, `$DSH_HOME/storages/coreness_journal.json`. Rotation is by age and by size, counted from the records on every write, and the last record carrying a composition print is never dropped: it is the baseline of the next comparison, and losing it would read as a false "composition changed" at the next start — the baseline stays even when it is the only record (`rotation.js`). The domain's name keeps an underscore while the row's id keeps its hyphen, because the two are different places: one is a storage domain, the other an entry of the patch.
- **One storage root for the whole home, not for one profile.** The base bundle points the storages at `dshHomePath('storages')`, so every profile of a home meets the same file and a run of one writes the memory the other reads. The dev profile of this repository therefore carries a redirect in its own patch — `root: !!js dshHomePath('profiles/coreness-dev/storages')` — and a run of it writes nothing the live profile reads. Any other run keeps a store to itself the same way — the recipe is in `## Check`. Every record the journal writes carries the name of the profile that wrote it — the one field `profile`, stamped at the single door every record passes (`journal.js`, `write`) — so the shared file can still be read per profile; the records written before the field existed carry none and are read as they were stored.
- **`tools`**: `defineTool` from `@deepseek-ai/dsh-tools` compiles the argument schema of the two tools and validates what a model sends, so a refusal of a wrong argument is the platform's own.
- **The logger, as a channel and not only a pen.** A failure the platform keeps to itself is caught and continued with one warning — `step compaction failed: …; continuing the turn`, with two overflow variants of the same failure — and no event and no session record carries it. An exporter on `ctx.logger` (`LoggerService.exporter`) is the channel the platform offers for exactly this: one logger service for the whole tree, inherited by every child context, so a plugin hears what another plugin logged. The exporter is registered in an effect of its own, so the watch is disposed with the plugin.
- **`connection`**: `ctx.connection.fetch.register` — the door the plugin opens outward. It is the route rather than the platform's Remote (Typert) door, and the reason is measured rather than preferred: a Remote needs a generated descriptor on each face and nothing in the installed application regenerates one — the archive ships the Loader, the registry and the protocol, while the generator the registry's own documentation points at is not there — so a capability of ours would need an edit of a platform package. The route needs nothing generated, which is why the platform's own packages read their page's data through it.
- **What the browser side of that door is.** The path is absolute under `/api` on the host and document-relative in the browser; the connection service owns the `/api` route, the fetch bridge and the browser's authentication as a whole, and a path nobody claimed answers 404. Authentication is the page's own cookie: the launch token is exchanged at `GET /` for an authority-bound signed cookie, and a request without it is refused before dispatch — there is no method-specific loopback tier and no authorization header, and the body handling of a route is declared before a byte of it is read.
- **No push of our own, and what follows from it.** The legal key set of `ctx.remote.$on` is the application assembly's forwarded-event list, so a new key means editing a platform package, and ordinary one-way notifications are best-effort deliveries that are not replayed. A journal that must survive a re-connect is therefore read rather than pushed: a reader asks again on its own demand, and the page's remote service emits `connection/reset` when it re-connects.
- **`pluginManager`** for the bundles and the rows of the composition print and for `plugin-manager/changed`, and **`profileContext`** for the profile's directory, its name and its files. The print covers the profile's own `package.json`, `cordis.patch.yml` and `compatibility.json` together with the live composition as the manager sees it, and it compares a row by its module and its enablement rather than by the Loader's address — that address is random where a row was declared without a name, so a comparison by address would record an edit that never happened (`fingerprint.js`). The baseline of a comparison is the last record carrying a print rather than the previous start, because an edit of a profile file by hand is announced by nobody.
- **`@deepseek-ai/schemastery`** for the row's config.
- **Declared as peers.** The manifest names `@deepseek-ai/cordis` and five packages in `peerDependencies`, the way the platform's own packages do: the four providing these services and `dsh-timeout`, which the Qoder route of the same package imports and the journal itself does not. `profileContext` is not among them: the launcher provides it itself.
- **A missing neighbour is an expectation, not a stage error.** Without the storage stack the domain does not open: the plugin says so in its faults and answers the route with its refusal, rather than failing silently or pretending the journal is empty. Without the manager or the profile's directory the composition print is incomplete and names the part it does not know.
- **No browser half of its own.** The row of this plugin names a subpath of the package, and a subpath row carries no browser half at all: the package's one browser half belongs to the page's row.

## In the surface

The plugin draws nothing and takes no seat: it stands in the composition as one row of `bundles/coreness.patch.yml`, and what it opens is one exact route.

- **Nothing of the journal is shown in the interface — a decision, not a gap.** The journal is the agents' instrument: the environment's memory and the ground of reflection. The page carries what the user needs, so the journal has no section, no row and no counters there, and a surface added for its own sake would be an interface invented for an interface. The user's door to the profile's settings is the MCP face, and those settings are what a surface would show if one is ever wanted — a plugin of its own, on the mechanisms that already exist.
- **The row.** The id `coreness-journal`, the module `@coreness/dsh/plugins/journal`, and three settings: the two limits of rotation and the limit of a selection.
- **One exact route.** `GET /api/coreness.journal` on the platform's connection service, same origin, under the browser's own trust — the launch token exchanged for a cookie. It is the plugin's door outward: the one point through which a reader asks for the memory, and the door chosen because it needs nothing generated on either side, unlike the platform's Remote (Typert) mechanism. The records themselves are answered by the tool, not by the route.
- **How a reader reads it.** With a plain `fetch` on the document-relative path, no token in a header — the page's cookie rides along — and the answer decoded by the reader, which owns the shape of its own answer. A state is painted from what the session already read, and the read corrects it behind. A refusal is drawn as a state rather than as an empty page.
- **The shape of the answer.**

  ```json
  {"ok": true, "value": {"summary": {
    "window": {"since": null, "until": …},
    "total": …, "bytes": …,
    "byKind": [{"kind": "задача", "count": …, "first": "…", "last": "…", "bytes": …}],
    "last": [{"time": "…", "kind": "состав", "area": "профиль", "id": "база", "author": "среда",
              "profile": "coreness-dev", "line": "changed: first print"}],
    "refusals": [], "steps": {"count": …, "ms": …, "rereads": …}}, "faults": []}}
  ```

  A journal that is not open answers with its refusal in words rather than with an empty page:

  ```json
  {"ok": false, "error": {"code": "journal-unavailable", "message": "the journal is not open — …"}}
  ```

  The answer leaves by the same guard as an answer of a tool — a value that does not survive the transfer is refused in words instead of losing its fields on the way.

## Changing this

Each row is one change, the file it lands in, and what proves it whole. The suite is `node --test "plugins/journal/test/*.test.mjs"`; two rows below stand on a run rather than on a test, and say so.

| the change | where it lands | what measures it |
| --- | --- | --- |
| the vocabulary: the kinds, the record schema, the address that keys a record | `domain.js` | `test/domain.test.mjs` |
| what is written down about the composition, and how one print differs from another | `fingerprint.js` | `test/fingerprint.test.mjs` |
| what is dropped by age and by size | `rotation.js`, and the two limits in the row | `test/rotation.test.mjs` |
| the answer to "what happened and why it came to this" | `summary.js` | `test/summary.test.mjs` |
| what a participant may write, and which argument is refused | `tools.js` | `test/tools.test.mjs` |
| the store, the mount, the stop, the observation the environment writes about itself, and the failure it hears | `journal.js` | `test/journal.test.mjs` |
| the row, its three settings, the exporter the watch stands on, and the route outward | `index.js`, and the row in `bundles/coreness.patch.yml` | no test of its own: the route is read in a run — §Check, and the overlay that keeps a run out of the home's store |
| another kind of record | `domain.js` — the vocabulary is closed on purpose, and the reader is told which unit was refused | `test/domain.test.mjs` |
| the door itself: which transport the route stands on, and what the browser side of it is | `index.js` — `ROUTE` and the `ctx.inject(['connection'])` area | the archive reads in §Check; the route is read in a run |

## Check

The plugin's own check drives the record schema, the rotation, the summary, the composition print, the stop, the failure the platform swallowed and the tools through a stubbed domain and a stubbed table — the refusals in words, the baseline that survives rotation, and the answer that carries no price:

```
node --test "plugins/journal/test/*.test.mjs"
node scripts/accept.mjs                           # the repository's acceptance — all green
```

The door's facts below were read out of the installed application's archive by the repository's own reader, `node scripts/harness.mjs` (`probe`, `grep`, `grepfile`, `cat`, `json`), so a reader of this file does not have to trust them:

- the client assembly's fixed list of build-time imports, and what is not replayed;
- the browser session, the cookie, and there being no method-specific tier;
- 404 for a request no owner claimed;
- a route declared as an absolute constant under `/api`.

The installed assembly is read from the launcher, where a skipped bundle, a disabled row and a row that never mounts are visible:

```
dsh --profile <name> --dump-config      # - id: coreness-journal   name: '@coreness/dsh/plugins/journal'
dsh --profile <name> --no-open          # the boot log names no skipped bundle
```

The route is checked by a run, because a store only appears in a run: the plugin records its own mount and compares the composition at start — a print lands when the composition has changed since the previous one — and the route answers the summary of what the store holds. On the dev profile's own store — `<home>/profiles/coreness-dev/storages/coreness_journal.json`, kept apart from the memory the live profile reads — a read gave `GET /api/coreness.journal` → `200`, `ok: true`, with the lifecycle records and the boot's own mount newest, and `faults: 0`. The answer's own shape carries no `price` field, no `credits` and no price line, and nothing was written while the profile stood: the store's newest record stayed the boot's own mount, and its time is the file's last write.

What a word in the answer does *not* mean: a record's `line` is quoted as it was written, so a record whose own text mentions a price — the journal holds a few, both of the donor era and of ours — carries that word in the answer. That is history, not a price line of the port: the whole answer's schema carries none. The check counts the port's own words and names the record when a word comes from a record.

A run that must not touch the home's own store — the home is shared with every profile — points the storages at a scratch folder through a patch overlay of its own, which changes no file of the profile:

```
dsh --profile <name> --patch <overlay> --no-open --port <free port>
```

```yaml
# the overlay: the storages of this run, and of no other
- id: storage-json
  config:
    root: <a scratch folder>
```

## Boundaries

- **The price does not come over.** No `price.js`, no `price` field, no price line in a summary or a record, no price setting in the row: the product does not count the price of a task. The donor's whole reading of the provider's journal leaves with it — and it was the donor's only reading outside its own storage, so nothing here depends on another package's file format.
- **The watch hangs on another package's line, and the coupling is named as one.** What the journal hears is `@deepseek-ai/dsh-compaction-basic`'s own warning, and it matches on two witnesses: the unit that emits it — its logger name `basic-compaction-engine`, the plugin's `name` hyphenated — and the sentence `step compaction failed:`. A rewording of the sentence alone is still caught by the unit, and a rename of the unit alone by the sentence; both at once would quiet the watch, and so would the unit simply ceasing to warn, which is the one silence no record can stand for. A change of either half is visible in the record itself: its `area` is the unit as the platform named it in that very message, and its `text` is the platform's sentence as it was written — verbatim, because a retelling would drift. The record's kind is `сбой` and its own name inside the kind is `уплотнение`; the two overflow variants of the same failure arrive through the same watch, and nothing is coalesced — one refused compaction is one record, and the count is the reason the record exists.
- **The reading is tolerant, the writing is strict.** One vocabulary is read three ways: a stored record is read as it is, so a field this journal does not know rides by — not interpreted and not lost; a write through a tool is closed, and a field the journal does not know is refused by name; an answer carries the fields of the record's kind, so a foreign field stays in the store and does not come out through a tool or the route. Refusing the whole unit would have made the page read a refusal instead of one history; trimming the field would have rewritten the home's history. Neither is done. The profile the record carries stands on the same three ways round: required of a write, declared in an answer, and absent from a record of the era before it — the schema says so once, in `domain.js` (`recordVariants`).
- **Tolerance is about fields, not about kinds.** A record of a kind outside the vocabulary still refuses the unit by name: the vocabulary is closed on purpose, and a new kind is an edit of `domain.js`.
- **The kinds keep the donor's words.** `состав`, `настройки`, `жизненный цикл`, `оборот`, `сбой` for what the environment observes, `задача`, `шаг`, `отказ`, `сдача` for what a participant hands over — although the plugin's code is English: the words are read by the environment's reader, and a translation would split one history into two languages. This is a decision, not an oversight. The name a print gives its cause is the one part of a record written in the plugin's own words, and the words of a `сбой` are the platform's own, quoted.
- **The route reads, it does not write.** Nothing but the summary and the faults leaves by it; an edit of the journal goes through the tools, where an argument is validated before a record exists.
- **The tools are the only door for a participant.** No second route, no second writer, no search UI and no charts: the journal answers in lines and counts.
- **No surface of its own.** The plugin opens a route and shows nothing on the page; the surface a user needs is the settings that arrive with MCP, and the decision behind that stands in § "In the surface".
