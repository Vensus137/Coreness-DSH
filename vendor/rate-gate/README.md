# @coreness/rate-gate

The rate gate: a tokens-per-minute ceiling attached to a provider/model pair, held at the platform's
`llm/stream` waterfall. Host only: one row, one listener, one read-only route. No client half, no file, no
patch.

## What the gate owns

- `src/gate.js` — the arithmetic: `DEFAULTS`, `BOUNDS`, `keyOf`, `resolveSettings`, `resolveRows`,
  `estimateRequestTokens`, `outputReserve`, `chargedTokens`, `observedInputTokens`, `isAborted`,
  `abortReason`.
- `src/ledger.js` — `GateLedger`: one sliding window per configured pair, the queue that admits only its head,
  the decisions it records.
- `src/index.js` — the row, the listener, the settings read per decision, and the route.

A limit is a row of `limits`: provider, model, `tokensPerMinute`, and optionally its own `thresholdRatio`
and `dryRun`. The row's config names no model and carries no `limits`: the gate mounts, wraps nothing and
lets every request through. A pair no row names is not the gate's business — it reaches the adapter
untouched.

## The listener's position

`apply` registers `llm/stream` with `{ global: true }` and no `prepend`. The gate stands outside the
adapter, so what it holds and counts is exactly what would otherwise be dispatched; a listener that
answered without dispatching would be a call the vendor never sees. The downstream stream is passed
through chunk by chunk and a request is never reshaped.

The gate holds rather than refuses: a refusal would be retried and paid again, a hold spends nothing. The
one addition to the stream is a terminal `finish` of the aborted kind when a caller cancels while it
waits.

## The marks

- **holds** (the counter) — the request waits for room; only the head of a pair's queue is admitted, and the wake is armed
  for the moment its window frees (at least 20 ms).
- **forced** — the wait bound (`maxWaitMs`) is spent; the request goes anyway, marked, so a full window is
  a delay with a name rather than a hung turn.
- **oversize** — the request is larger than the ceiling itself; it waits only for the window to be empty,
  then goes, marked.
- **watching** — `dryRun` (on the row or the plugin) charges and counts the wait it would have taken, and
  holds nothing.
- **aborted / cancelled / released** — a caller's cancellation; a place released between grant and send;
  a row removed or the plugin disposed while requests waited.

A session title never waits: its own deadline is shorter than a window, so it is admitted at once and
counted, not held. A provider's `RATE_LIMIT` refusal closes the pair for one `windowMs`; the reservation is
settled by the stream's `usage` when it arrives, and stands as a charge without a fact when it does not.

## The route

`GET /api/coreness.rateGate` answers `{ ok: true, value }` or `{ ok: false, error }`, always 200. The
picture is `{ v, at, ns, settings, rows, refused, providers }`; `rows` carries each pair's ceiling, the
live window (`used`, `reserved`, `queued`, `waitingMs`, `holdUntilMs`, `closedUntilMs`), the counters and
the latest decisions.

The route is read-only and writes nothing; the settings are written through the platform's own settings
service. `connection` is not declared as an inject — the route is registered in a scoped
`ctx.inject(['connection'], …)`, and without a web surface the gate logs that nothing serves the route and
keeps holding and counting. The registration declares `methods: ['GET']` and `requestBody: 'buffered'`;
the bridge routes only a declared route.

## Settings

The row is read at every decision (the fields are volatile), and every number is held inside its bounds;
an out-of-bounds value is replaced, and the substituted number and the asked-for one are logged once per
distinct complaint.

| Field | Default | Bounds |
| --- | --- | --- |
| `windowMs` | 60000 | 1000 … 86400000 |
| `maxWaitMs` | 60000 | 0 … 86400000 |
| `thresholdRatio` | 0.9 | (0, 1] |
| `dryRun` | false | boolean |
| `charsPerToken` | 4 | 1 … 16 |
| `blockOverheadTokens` | 4 | 0 … 1000 |
| `imageTokens` | 1000 | 0 … 100000 |
| `outputReserveTokens` | 4096 | 0 … 1000000 |
| `maxOutputReserveTokens` | 8192 | 0 … 1000000 |
| `calibrationAlpha` | 0.25 | (0, 1] |
| `maxEstimateFactor` | 5 | 1 … 100 |

A limit row's ceiling is `max(1, floor(tokensPerMinute * thresholdRatio))`; a row without its own ratio or
mode follows the plugin-level field as it stands. An unusable row is refused by name in the log and in the
route's `refused`, and the other rows keep running.

## No file, no patch

A decision writes nothing: no settings file, no patch, no request rewrite. The request is read only, the
stream is passed through, and the ledger lives in memory for the process. The row's settings are the
profile's config; a limit is a profile's decision.

## Checks

- `node --check src/index.js src/gate.js src/ledger.js`.
- The caps: each host file ≤ 600 lines; the README ≤ 150.
- The math fixture: `node packages/rate-gate/scripts/check-gate.mjs` — 18 golden vectors captured from
  the donor (two answers are `undefined` and travel as an `@@undefined@@` sentinel); it is not in `files` and is not a suite. No window-aging or queue vector was captured — the donor's aging needs a
  timer-driven clock, so the case is dropped and the gap is named; that behavior was compared to the donor
  by hand (23 checks) and is code-verified, not fixture-verified.
- The route smoke: the picture, the namespace, and the no-limits state (empty `rows`, every request
  untouched); a broken settings read answers `{ ok: false, error }` in words — that door is code-only here,
  because the scratch home's settings read never breaks and no run exercised it.
- The live check is the owner's: one real model call under a limit, read at the route.
