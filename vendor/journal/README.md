# @coreness/journal

The environment's memory: what changed in a profile, why, and what step took how long. One host-only package; no browser half, no page section.

## What it records

A record may carry money: the `cost` block holds the dollars a run came to, the unit the figure was taken in, the rate between them and whether the run was billed. The platform prices nothing, so the figure is reported by whoever knows it; a record without one counts as no money rather than as a free run. The composition print a record observes is stored packed — the live composition is a few hundred rows, and the packed print is a ninth of the bytes — and both the packed and the earlier inline shape read. The live composition is the bundles the profile selects or installs and the rows the plugin manager lists; the application's whole official catalogue is not part of the print, so an application update does not read as a change of the profile.

Records live in the platform's storage domain `coreness_journal` (version 1, table `records`) — the same name, version and record schema the donor wrote, so the records already in a home read. The kinds are closed: `состав`, `настройки`, `жизненный цикл`, `оборот`, `сбой`, `задача`, `шаг`, `отказ`, `сдача` (five environment kinds and four participant ones). A record's address is `time|kind|area|id`; `id` is a name ('запуск', 'база', 'сравнение'), the cause is the sentence in `text`; a record written by a participant carries the session the platform stamped it with, so an act joins the run it belongs to. A write with an unknown field is refused by name, a stored record with an unknown field is read through. The storage root is the home: the records lie in `$DSH_HOME/storages/coreness_journal.json`, one file for every profile, and the `profile` field says whose they are.

The journal opens on first use through the storage domain; rotation is planned from `rotationDays` (30) and `rotationBytes` (2 MiB), the `journal` tool's selection answers at most `recordsLimit` (20) records unless the call names a limit, and the faults of observation are kept to 20, a fixed cap of the journal itself, not a config value. The row's numbers are held at floors — 1 day, 64 KiB, 1 record — and a value under a floor runs at the floor, the substitution said in the log; a number that is not a number falls back to the default. The plugin closes its domain when its row is disposed: the stop record is written first, and the domain's own close waits for the write chain behind it. A sweep writes its rollup before the deletes — the `оборот` record keeps the kinds it took and how many of each, the bytes, and the money the dropped notes reported, so the month's statistics outlive the rows — never drops the record it was just told to keep, and when its byte bound cannot be met — the baseline print and the rollups are never dropped — writes a `сбой` record naming the size that stays over rather than leaving the bound to be inferred.

## The tools

- `journal` — a query. Without a kind it answers the summary (counts by kind, what changed, refusals, steps, and the money the notes reported); with a kind/area/id it answers the records within a limit. It is never read whole.
- `journal_note` — a write, participant kinds only. A refusal needs its reason; a step carries its measured duration (`stepMs`); a note may carry the money a run came to in `cost` — `usd`, `paid`, `unit` (`credits` or `cny`), `amount`, `rate`, `at`. An unknown field is refused in words.

Both names and parameter shapes are the donor's: an agent that called them before keeps working.

## The route

`GET /api/coreness.journal` answers `{ ok: true, value: { summary, faults } }` or, when the journal cannot be read, `{ ok: false, error: { code: 'journal-unavailable', message } }` — status 200 in both cases, the refusal in words rather than an empty journal. The route is registered in the scoped `connection` area (the plugin never declares `connection`), declares `requestBody: 'buffered'` because the connection's bridge routes only a declared route, and is absent where no web surface is served (the plugin logs that line). A record the vocabulary cannot read is a limit of the medium: the domain asks the platform to back it up and skip it, and where the medium can move a document aside the journal opens with the rest; the profile's single-file JSON medium cannot move a record out of its one document, so there the journal stays unavailable and the route says so.

## Install

The bundle inserts the row; the package is a `file:` dependency of `packages/bundle`:

```yaml
- id: coreness-journal
  name: '@coreness/journal'
```

## Checks

The fixture `node packages/journal/scripts/check-journal.mjs` holds the money summary, the packed print and the sweep's plan.
