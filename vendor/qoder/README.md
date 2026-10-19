# @coreness/qoder

The Qoder provider host: the vendor's wire, the adapter the platform's model service calls, the
credential reference, the account's credits, and the two HTTP doors the page reads.
Host only: no browser half.

## What the host owns

`apply` creates the transport (`createTransport`, published as `qoderTransport`) and registers the
adapter under the route id `qoder`: the display name `Qoder`, the row's models, the retry policy, the
credential reference and the image inputs. It registers the configurable provider under the row's own
namespace, registers the model discovery (`ctx.llm.registerModelDiscovery`), hands the adapter the
image reader (`imageData`) and the spend journal (`journal`), and starts the credits sweep.

The transport is one closure over the vendor's facts: the node map, the token exchange and refresh,
the profile, the signed catalogue, the signed chat turn, the frames, and the machine id. The account's
credits are read through it with the same job token. No token is captured: the row names a credential
reference and the value is resolved per call.

The model list and the effort vocabulary are the donor's: `auto` 400,000, `efficient` 200,000,
`dfmodel` 400,000, `qmodel_38max` 400,000, `qfmodel` 400,000; `DEFAULT_CONTEXT_WINDOW` (200,000) is
the fallback for an undeclared model, never the declaration's window.

## Routes and actions

Both routes are registered in the scoped `connection` area with `requestBody: 'buffered'`; `connection`
is not declared, so a composition without a web surface logs the no-web line and keeps the transport,
the adapter and the sweep. Answers are `{ ok: true, value: … }` or `{ ok: false, error: { code, message } }`
(the probe route also carries the vendor's detail where its body had one), status 200 in both cases;
the bodies are JSON objects.

- `GET /api/coreness.credits` — the held picture: the balance, the campaigns and the cadence.
- `POST /api/coreness.credits` `{ action: 'read' }` — one reading, then the picture.
- `POST /api/coreness.credits` `{ action: 'claim', campaignId? }` — take one reward (or every claimable
  one), then the picture.
- `POST /api/coreness.qoder` `{ action: 'probe' }` — the node sweep: one result per node and the node to
  pin.
- `POST /api/coreness.qoder` `{ action: 'catalogue' }` — the vendor's live listing, menus included.
- `POST /api/coreness.qoder` `{ action: 'verify' }` — the closed verdict on the stored value
  (`accepted`/`refused`/`unsettled`).

The credits sweep starts with the plugin: one reading at the mount, then every `credits.sweepMs`. It
holds the account's picture in memory and writes no file and no patch. `verify` is one exchange per
press, never on a tick.

## The config

The row's schema is `Config`, declared in `src/config.js` and re-exported by `src/index.js` (the Loader reads the
module's `Config` export). Defaults:

- `apiKeyEnv` — `QODER_PERSONAL_ACCESS_TOKEN` (a credential reference, never a value).
- `models` — the five default models above, each with its window, `vision` and effort.
- `defaultContextWindow` — 200,000.
- `retryPolicy` — `normal`, 5 retries, the six retryable codes (`EMPTY_RESPONSE`, `RATE_LIMIT`, `SERVER`,
  `TIMEOUT`, `TRANSPORT`, `MALFORMED_RESPONSE`), backoff 500 ms → 10 s with jitter.
- `centerOrigin` — `https://center.qoder.sh`; `openapiOrigin` — `https://openapi.qoder.sh`.
- `controlCeilingMs` 10,000; `firstByteCeilingMs` 15,000; `idleCeilingMs` 300,000 (the bundle row pins
  `firstByteCeilingMs` to 60,000).
- `inferBase` — empty: the node map is asked; a pinned node is read per call.
- `machineIdStoreDir` — empty: the harness home's `qoder/` is used.
- `reasoningEffort` — empty: a model's own row names the level.
- `credits` — `sweepMs` 600,000 (clamped to 60,000 … 86,400,000 with a warning), `autoClaim` true.

`apiKeyEnv`, `models`, `defaultContextWindow` and `inferBase` are volatile, so the platform's settings
service can write them without re-mounting the row; readers resolve them through `liveValue`.

## The credential

The token is the platform credential stored under the reference the row names. `ctx.credentials.resolve`
is called per request; a missing or empty value throws `MISSING_CREDENTIAL` in words. The platform's
Settings → Models is the other door to the same reference. No token value stands in a config, a patch, a
log or a message.

## Files under the home

- `$DSH_HOME/qoder-requests.ndjson` — the spend journal: one append-only line per request that carried
  usage (time, model, the session and the ending, duration, counters, the vendor's credits and the dollars at
  the rate written with them); rotated at 64 MiB, two generations. `inputTokens` excludes the cache,
  `totalTokens` includes it; the ending is the platform's own object (`{kind: 'stop' | 'tool-calls' |
  'max-tokens' | 'aborted' | 'error'}`).
- `$DSH_HOME/qoder/qoder-machine-id` — the machine id, written only when neither this file nor the
  vendor CLI's own `~/.qoder/.auth/machine_id` exists (the CLI's id is read first and never written).

No other host file. The sweep and the routes write neither the profile's patch nor a log file.

## The spend tool

`spend` answers what the ledger holds for a window: dollars, credits, requests and tokens, and the same
figures by day (UTC dates), by model or by the ending. The money splits by the vendor's `billable` flag —
`usd` is everything, `billed` and `unbilled` its parts — and `failures` says how many rows the plugin failed
to write since it started. Every row is one request; a row whose wire counted no credits adds no money, and
the answer says how many lines of the ledger were not rows and how many generations it read. A ledger that
stands nowhere is a refusal in words, never an empty answer. The reader sums the row's own figure: `usd`
where it stands, else the credits at the row's own rate, else at the fixed rate.

## The checks

`node --check` on every file; the caps (host files ≤600, none over 800; this README ≤150 lines); the
scratch install's row and the dump; the route smoke (`credits` `read` with no token answers
`MISSING_CREDENTIAL` in words; `qoder` `catalogue` answers the models or a refusal in words); the
owner's live token, provider call and page.

The one fixture is `scripts/check-parser.mjs` (not in `files`: it is a hand-run check, not a shipped
file). It imports the four wire modules and asserts 29 cases — `markup`, `frames`, `body`, `sign` —
against values captured from the donor's own functions before the port, at
`tmp/qoder-vectors.json` + `tmp/qoder-vectors.mjs`; it exits non-zero on a mismatch or a case with no
value. One captured case was dropped: `sign.cosyHeaders` is not deterministic (RSA PKCS#1 v1.5
padding), so two runs of the same call differ and no byte-for-byte oracle exists. No test suite, no
coverage, no per-bug guards.
