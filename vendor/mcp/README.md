# @coreness/mcp

The picture of the profile's MCP servers and the one door that changes them. Host only: no MCP client, no connection state, no browser half.

## What the platform owns and what this package does

A server is a row of the platform's `cordis:include` entry list: the Loader reads, writes and watches the file, one row is one client instance, and the platform's own client owns the connection, the phase, the tools (under `mcp__<serverName>__`), the resources and the instruction text. Such a row is reported `readOnlyReason: "unaddressable"` by the plugin manager, so the platform's own page lists it and cannot change it.

This package owns only the picture and the hand:

- `src/tree.js` — the include row, the rows, and the Loader calls (`create`, `update`, `remove`).
- `src/picture.js` — the picture: the include state, the rows, the phase, the tools by prefix, the resources, the instruction text, the host's line about a row while it still speaks, and the record of a row whose fiber failed.
- `src/write.js` — the save actions, the read-back and the refusals.
- `src/trouble.js` — the receiver of the host's own lines about a server; the platform's client logs the reason a server is not up to an in-memory ring nobody reads, so this package keeps the lines and carries the elected one into the picture.
- `src/ring.js` — the ring's rules, with no platform import: which kept line speaks for a row, the row's sentence with the client's label cut off, and the deadline the retry it names puts on it — the promised delay plus one round trip, the SDK's own 60 s default. The deadline travels with the word, which is how the page knows when to read again. A line that promises nothing keeps standing: it states what happened, and the client's label carries no instance, so a sentence a replaced client left cannot be told from the row's own.
- `src/failure.js` — the reason a row did not start: the Loader's own failed-fiber record, read once here and carried by the picture, so no reader reaches for the Loader's fiber itself.

## The route

`GET /api/coreness.mcp` answers the picture; `POST /api/coreness.mcp` takes one save: `{ action, ... }` with `add`, `edit`, `remove`, `toggle`, `reference`, `reload`. Every save is confirmed by reading the tree back, and the answer carries the outcome beside the picture with `confirmed: 'tree'` — never "the request went through": the include writes the file on a timer of its own and reports a failed write only to the log, so a save on a read-only file still answers through the tree and the door does not claim the file. A disagreement is `not-saved`. The removal is the one save that awaits the include's own file write where the tree exposes one, because a removal whose write is lost is the one save that comes back at the next boot.

The reload's confirmation reads two facts: the tree's switch after the row is switched off and on, and the Loader's phase for it. A row the file already holds switched off is refused before any write — switching it on to reload it would leave a row the person never asked to connect connected — and a row that comes back `failed` is refused — the strip says Not saved and the note's detail names the phase the Loader gave, because `reloaded` over a row that serves nothing is a claim the door cannot stand behind — and so is a row the Loader cannot name; a row still coming up is answered with the phase it is in. The reload's own line goes through the route's `ctx.logger`; the door's answer is the evidence a reload leaves behind, and a profile whose logger has a sink writes that line to it.

The reference save writes the row option and the header in one update, and it writes them while the row is stopped. The Loader evaluates a row's configuration as the write lands, against the inject the row was activated under — the inject from before the save — so an expression that reads the credential store is refused when the option is written first, in a write of its own, and it is refused just the same when both are carried by one write to a live row. A row the file already holds switched off is not evaluated at all: it takes the one update and stays off. A live row is switched off and on around the write, which is also what makes a header written now reach the connection the row holds; the include's own file write coalesces the three changes. A live row whose enablement stands as an expression is refused, because the save cannot stop such a row without writing over the text the file owns, and it will not. A switch that cannot be made, or that does not read back as the save promised, is a refusal: the answer names the Loader's words and the state the tree holds. The answer is the tree's — the option, the expression and the switch — and a write the Loader answers with an error is not the save's answer: the tree decides what landed.

Refusal codes: `bad-action`, `bad-name`, `name-taken`, `bad-transport`, `bad-url`, `bad-command`, `bad-timeout`, `bad-header`, `bad-env`, `bad-value`, `header-ref`, `env-ref`, `config-ref`, `disabled-ref`, `no-file`, `no-row`, `not-an-mcp-row`, `not-saved`, `write-failed`, `unreadable`.

The remove goes through the parent group by short id; the Loader's `EntryTree.remove(qualifiedId)` path is the known silent miss and is not used. The tree is then asked to persist by the call it carries — `write()` on a tree that writes its file whole, `commit({ id, group, legacy })` on one that reports the change to an include which owns the file, which is the change the platform's own remove reports — and a tree that exposes `flush()` is awaited before the answer, so a file the include could not write is refused rather than answered as done.

## The include row

The bundle inserts it:

```yaml
- id: mcp-servers
  name: cordis:include
  config:
    path: ./mcp-servers.yml
    initial: []
```

The path resolves against the profile's directory, so the servers live in one file beside the composition with one writer, the Loader. The row's id is the donor's, so the live file reads after the switch.

## The route's scoping

`connection` is not declared as an inject: it is the web transport, and a plugin that declares it never applies where no page is served. The route is registered inside `ctx.inject(['connection'], …)`; without a web surface the plugin logs that the route is not served, and the picture, the saves and the tools observation stand.

## Checks

The fixtures — `node packages/mcp/scripts/check-ring.mjs` among them — hold the ring's election, the picture's word, the reload's refusals, the failure's family, the save's confirmation, the two tree shapes a removal persists through, the reference save's order, and the codes' vocabulary.
