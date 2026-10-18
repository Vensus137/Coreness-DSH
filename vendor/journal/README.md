# @coreness/journal

The environment's memory: what changed in a profile, why, and what step took how long. One host-only
package; no browser half, no page section.

## What it records

A record may carry money: the `cost` block holds the dollars a run came to, the unit the figure was taken
in, the rate between them and whether the run was billed. The platform prices nothing, so the figure is
reported by whoever knows it; a record without one counts as no money rather than as a free run. The
composition print a record observes is stored packed — the live composition is a few hundred rows, and the
packed print is a ninth of the bytes — and both the packed and the earlier inline shape read.

Records live in the platform's storage domain `coreness_journal` (version 1, table `records`) — the same
name, version and record schema the donor wrote, so the records already in a home read. The kinds are
closed: `состав`, `настройки`, `жизненный цикл`, `оборот`, `сбой`, `задача`, `шаг`, `отказ`, `сдача` (five
environment kinds and four participant ones). A record's address is `time|kind|area|id`; a write with an
unknown field is refused by name, a stored record with an unknown field is read through. The storage root is
the home: the records lie in `$DSH_HOME/storages/coreness_journal.json`, one file for every profile, and the
`profile` field says whose they are.

The journal opens on first use through the storage domain; rotation is planned from `rotationDays` (30) and
`rotationBytes` (2 MiB); the faults of observation are kept to 20, a fixed cap of the journal itself, not a
config value.

## The tools

- `journal` — a query. Without a kind it answers the summary (counts by kind, what changed, refusals,
  steps, and the money the notes reported); with a kind/area/id it answers the records within a limit. It is
  never read whole.
- `journal_note` — a write, participant kinds only. A refusal needs its reason; a step carries its measured
  duration (`stepMs`); a note may carry the money a run came to in `cost` — `usd`, `paid`, `unit` (`credits`
  or `cny`), `amount`, `rate`, `at`. An unknown field is refused in words.

Both names and parameter shapes are the donor's: an agent that called them before keeps working.

## The route

`GET /api/coreness.journal` answers `{ ok: true, value: { summary, faults } }` or, when the journal cannot
be read, `{ ok: false, error: { code: 'journal-unavailable', message } }` — status 200 in both cases, the
refusal in words rather than an empty journal. The route is registered in the scoped `connection` area (the
plugin never declares `connection`), declares `requestBody: 'buffered'` because the connection's bridge
routes only a declared route, and is absent where no web surface is served (the plugin logs that line).

No page reads the route today: its readers are agents calling the tools and a later surface that does not
exist yet.

## Install

The bundle inserts the row; the package is a `file:` dependency of `packages/bundle`:

```yaml
- id: coreness-journal
  name: '@coreness/journal'
  config:
    rotationDays: 30
    rotationBytes: 2097152
    recordsLimit: 20
```

## Checks

`node --check`, the caps (source ≤600 lines, README ≤150), the scratch install's read-back, the probe
(unchanged — this package has no client half), and the route smoke: a booted scratch profile answers the
route; a corrupted copy of the scratch store answers `journal-unavailable` and is then restored. The
fixture (`node packages/journal/scripts/check-journal.mjs`) holds the summary's money and the packed print's
round-trip and diff. The tools are checked by a scratch session when one is offered; otherwise the
registration and the route are the evidence and the tool call is marked unverified.
