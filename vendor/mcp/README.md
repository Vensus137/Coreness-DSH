# @coreness/mcp

The picture of the profile's MCP servers and the one door that changes them. Host only: no MCP client, no
connection state, no browser half.

## What the platform owns and what this package does

A server is a row of the platform's `cordis:include` entry list: the Loader reads, writes and watches the
file, one row is one client instance, and the platform's own client owns the connection, the phase, the
tools (under `mcp__<serverName>__`), the resources and the instruction text. Such a row is reported
`readOnlyReason: "unaddressable"` by the plugin manager, so the platform's own page lists it and cannot
change it.

This package owns only the picture and the hand:

- `src/tree.js` — the include row, the rows, and the Loader calls (`create`, `update`, `remove`).
- `src/picture.js` — the picture: the include state, the rows, the phase, the tools by prefix, the resources, the
  instruction text, the host's line about a row, and the record of a row whose fiber failed.
- `src/write.js` — the save actions, the read-back and the refusals.
- `src/row.js` — the row shape, names, references and transports.
- `src/trouble.js` — the receiver of the host's own lines about a server; the platform's client logs the reason
  a server is not up to an in-memory ring nobody reads, so this package keeps the lines and carries the elected
  one into the picture.
- `src/ring.js` — the ring's rules, with no platform import: which kept line speaks for a row, and the row's
  sentence with the client's label and its retry promise cut off, so a promise the client no longer keeps never
  stands as news and the card draws the sentence alone.
- `src/failure.js` — the reason a row did not start: the Loader's own failed-fiber record, read once here and
  carried by the picture, so no reader reaches for the Loader's fiber itself.
- `src/index.js` — the row, the route, and the tools observation.

## The route

`GET /api/coreness.mcp` answers the picture; `POST /api/coreness.mcp` takes one save:
`{ action, ... }` with `add`, `edit`, `remove`, `toggle`, `reference`, `reload`. Every save is confirmed by
reading the tree back, and the answer is the picture as the file now stands — never "the request went
through". A disagreement is `not-saved`.

The reload carries a second fact beside the file: the row is switched off and on, and the door reads the
Loader's phase for it. A row that comes back `failed` is refused with the phase named — `reloaded` over a
row that serves nothing is a claim the door cannot stand behind — and so is a row the Loader cannot name;
a row still coming up is answered with the phase it is in. The reload's own line goes through the route's
`ctx.logger`, and in this build that line reaches neither the run's stdout nor the profile's log files: the
door's answer is the evidence a reload leaves behind, and the call stands for a profile whose logger has a
sink.

Refusal codes: `bad-action`, `bad-name`, `name-taken`, `bad-transport`, `bad-url`, `bad-command`,
`bad-timeout`, `bad-header`, `bad-env`, `bad-value`, `header-ref`, `env-ref`, `config-ref`, `disabled-ref`,
`no-file`, `no-row`, `not-an-mcp-row`, `not-saved`, `write-failed`, `unreadable`.

The remove goes through the parent group by short id; the Loader's `EntryTree.remove(qualifiedId)` path is
the known silent miss and is not used.

## The include row

The bundle inserts it:

```yaml
- id: mcp-servers
  name: cordis:include
  config:
    path: ./mcp-servers.yml
    initial: []
```

The path resolves against the profile's directory, so the servers live in one file beside the composition
with one writer, the Loader. The row's id is the donor's, so the live file reads after the switch.

## The route's scoping

`connection` is not declared as an inject: it is the web transport, and a plugin that declares it never
applies where no page is served. The route is registered inside `ctx.inject(['connection'], …)`; without a
web surface the plugin logs that the route is not served, and the picture, the saves and the tools
observation stand.

## Checks

`node --check`, the caps, the ring's fixture (`node packages/mcp/scripts/check-ring.mjs`: the election keeps
the reason and cuts the promise), the reload's fixture (`node packages/mcp/scripts/check-reload.mjs`: a failed
row is refused with its phase, every phase the Loader gives is named), the failure's fixture (`node
packages/mcp/scripts/check-failure.mjs`: the family from a status, an SDK code or an appended body, and the one
sentence a page draws), the scratch install's rows, the route smoke (`GET` picture; `POST`
add/edit/toggle/remove with the file read back), and the owner's visual of the section. No test suite, no
client half.
