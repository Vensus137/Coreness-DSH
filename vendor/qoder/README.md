# @coreness/qoder

The Qoder provider host: the vendor's wire, the adapter the platform's model service calls, the credential reference, the account's credits, and the two HTTP doors the page reads. Host only: no browser half.

## What the host owns

`apply` creates the transport (`createTransport`, published as `qoderTransport`) and registers the adapter under the route id `qoder`: the display name `Qoder`, the row's models, the retry policy, the credential reference and the image inputs. It registers the configurable provider under the row's own namespace, registers the model discovery (`ctx.llm.registerModelDiscovery`), hands the adapter the image reader (`imageData`) and starts the credits sweep.

The transport is one closure over the vendor's facts: the token's contour, the node map, the token exchange and refresh, the profile, the signed catalogue, the signed web search, the signed chat turn, the frames, and the machine id. The account's credits, the data policy and the search are read through it with the same job token. No token is captured: the row names a credential reference and the value is resolved per call. The vendor's effort menus are kept the same way: every catalogue read of the account's own node adds what it publishes to `coreness/qoder/model-menus.json`, one read at start does so again, and no read removes a level — so the declaration the platform's model picker reads carries the vendor's levels without waiting on the network, and a level the cache once published is never taken back from it. Where the vendor publishes a menu, the picker offers that menu and `Off`, and the platform's own `high`/`max` stand only for a model the catalogue publishes none for; the effort the row names is always declared, even where the menu lacks it, because the platform refuses a default that is not a member. The price of the short list: a session holding `high`/`max` on a model whose menu does not publish it is refused until a level from the menu is picked, since a stored choice is not visible to the declaration.

The token calls of one contour live in `src/contour.js`; the transport keeps the caches and the calls that resolve through them. A token is exchanged on both contours together and kept on the one that answers — the choice is cached by the token's fingerprint, and `region` may pin it. The model defaults are `auto` 200,000, `dfmodel` 400,000, `qmodel_38max` 400,000 and `qfmodel` 400,000; `efficient` is not a default (the Chinese node refuses it) but the live catalogue still offers it on the international node. `DEFAULT_CONTEXT_WINDOW` (200,000) is the fallback for an undeclared model, never the declaration's window.

## Routes and actions

Both routes are registered in the scoped `connection` area with `requestBody: 'buffered'`; `connection` is not declared, so a composition without a web surface logs the no-web line and keeps the transport, the adapter and the sweep. Answers are `{ ok: true, value: … }` or `{ ok: false, error: { code, message } }` (the probe route also carries the vendor's detail where its body had one), status 200 in both cases; the bodies are JSON objects.

- `GET /api/coreness.credits` — the held picture: the balance, the campaigns, the data policy and the cadence.
- `POST /api/coreness.credits` `{ action: 'read' }` — one reading, then the picture.
- `POST /api/coreness.credits` `{ action: 'claim', campaignId? }` — take one reward (or every claimable one), then the picture.
- `POST /api/coreness.credits` `{ action: 'privacySet' }` — read the data policy fresh, turn sharing off while the account shares, read again; the after state.
- `POST /api/coreness.qoder` `{ action: 'probe' }` — the node sweep: one result per node and the node to pin.
- `POST /api/coreness.qoder` `{ action: 'catalogue' }` — the vendor's live listing, menus included.
- `POST /api/coreness.qoder` `{ action: 'verify' }` — the closed verdict on the stored value (`accepted`/`refused`/`unsettled`).
- `POST /api/coreness.qoder` `{ action: 'webSearch', query }` — one live Qoder web search through the route's own credential: HTTP status, latency, page items and the account quota either side. It is the host-side live check; no token is read or copied by the caller.

The web search is the one call with its own COSY shape: `POST {the token contour's centre}/algo/api/v1/webSearch/oneSearch?Encode=1`, the JSON envelope encoded by the body encoder, COSY `1.1.44` (the version the vendor's web-search client names; the chat keeps `1.0.0`), client type `5`, business `cli`/`agent`/`assistant`, and the body-hash headers left out. The bare `/api` path and the plain body answer `401`/`400`; the shape is measured live, not inferred. The centre is the contour's own: the Chinese one serves the Chinese index — a global-market query returns Chinese-market pages — and the international one the international index; the route names no region.

The credits sweep starts with the plugin: one reading at the mount, then every `credits.sweepMs`. It holds the account's picture in memory and writes no file and no patch. `verify` is one exchange per press, never on a tick.

## The config

The row's schema is `Config`, declared in `src/config.js` and re-exported by `src/index.js` (the Loader reads the module's `Config` export). Defaults:

- `apiKeyEnv` — `QODER_PERSONAL_ACCESS_TOKEN` (a credential reference, never a value).
- `models` — the four default models above, each with its window, `vision` and effort.
- `defaultContextWindow` — 200,000.
- `retryPolicy` — `normal`, 5 retries, the six retryable codes (`EMPTY_RESPONSE`, `RATE_LIMIT`, `SERVER`, `TIMEOUT`, `TRANSPORT`, `MALFORMED_RESPONSE`), backoff 500 ms → 10 s with jitter. A turn the contour cuts at its output ceiling with no text left is reported as `EMPTY_RESPONSE`, so the policy re-asks the step.
- `centerOrigin` — `https://center.qoder.sh`; `openapiOrigin` — `https://openapi.qoder.sh`; a value other than these two makes a custom contour and skips the detection.
- `region` — `auto`: the token's two exchanges decide; `global` or `cn` pins one and skips the detection. Not volatile.
- `controlCeilingMs` 10,000; `firstByteCeilingMs` 15,000; `idleCeilingMs` 300,000 (the bundle row pins `firstByteCeilingMs` to 60,000).
- `inferBase` — empty: the node map is asked; a pinned node is read per call.
- `machineIdStoreDir` — empty: `coreness/qoder/` under the harness home is used.
- `reasoningEffort` — empty: a model's own row names the level.
- `credits` — `sweepMs` 600,000 (clamped to 60,000 … 86,400,000 with a warning), `autoClaim` true.
- `webAccess` — `{ enabled: false }`: the one switch for the two web providers. Off by default; the providers stay registered but unavailable while it is off.

`apiKeyEnv`, `models`, `defaultContextWindow`, `inferBase` and `webAccess` are volatile, so the platform's settings service can write them without re-mounting the row; readers resolve them through `liveValue`.

## The web switch

The Qoder section's one checkbox writes the Qoder row and the platform's `web` row in the documented order: on — `webAccess.enabled`, then `web.searchProvider`/`web.fetchProvider` = `qoder`; off — the two provider values = `null`, then the flag. The web row is re-read after the flag on the way on, because the first write moves the revision the second one carries. While the flag is off or the credential reference is unset, the providers answer `available() === false`; a stored token that is missing still selects Qoder and surfaces at the call as a missing-credential error (the local fetch works without it); a failed write is shown and the box reads the live row again. The box reads the flag as well as the shared row: a row that names Qoder while the flag is explicitly off is drawn off, and the section's read unsets it. A flag that could not be read is unknown: the box stays off with the unread word and the row is not touched. A missing token shows the box off and disabled; the section's read then unsets a stale Qoder half in the shared row, so the standard DeepSeek search stands; a DeepSeek half in a mixed row is left alone. The cleanup is a write on that read, not a host watcher. The platform's standard DeepSeek search returns when the row is unset; its URL, key and result count stay stored but unused. The platform's Web search page is the DeepSeek page; the latest save of the shared `web` row wins.

The fetch provider runs the platform's own `HttpFetchProvider` with the browser `User-Agent`, the platform's content negotiation and the limits this product needs: the platform's own 30 s timeout, a 2 MiB byte cap, same-origin redirects up to five, and `html`/`text` by content type (XHTML as `html`); a non-2xx answer is a result, not a thrown error. On the direct route the platform checks a public destination before the connection and pins the checked address on it; a configured proxy is the platform's own route. The private-address and redirect policy has one owner; the Qoder provider restates a network failure, a timeout and a caller abort with the URL and the cause, while a blocked, invalid or redirected address keeps the platform's own code. The search is the transport's signed `oneSearch` call; a vendor refusal and a malformed answer are thrown, never turned into an empty answer.

## The credential

The token is the platform credential stored under the reference the row names. `ctx.credentials.resolve` is called per request; a missing or empty value throws `MISSING_CREDENTIAL` in words. A token from either Qoder contour is entered the same way: when every attempt is a value refusal it answers `AUTH` with both contours named and the token never echoed, and otherwise it carries the first non-value code it met and says the token could not be checked on either contour. The platform's Settings → Models is the other door to the same reference. No token value stands in a config, a patch, a log or a message.

## The data policy

The account's data-sharing policy is server-side and account-level: `GET`/`PUT {openapi}/api/v1/me/data-policy` with the **job token** (the personal token alone is `401`), answering `{share_enabled, can_update, source, plan_tier?}`. The `Cosy-Data-Policy` header the chat sends is a different thing and is not read as the policy. The credits popover draws no data-sharing; the one `Stop sharing` press stands in the Qoder section's node row beside `Check node`, drawn only while the account shares, so the row keeps its height when it goes (the button's title carries the state and the plan lock; the row reads the held picture the popover's own read leaves). The host reads the policy fresh, writes `{share_enabled:false, lingma_version}` only while the account shares, reads again, and reports what stands — a plan that locks it answers `can_update:false`, and a `200` to the write changes nothing there. Nothing writes in the background; a turn and a search see the cached read, a sweep and a press read afresh.

## Files under the home

- `$DSH_HOME/coreness/qoder/qoder-machine-id` — the machine id: the plugin's own, generated here on first use and reused across runs; the vendor client's home is never read.
- `$DSH_HOME/coreness/qoder/model-menus.json` — the vendor's effort menus, one growing list per model: a level every read of the account's own node has published, never removed by a later read; the model declaration answers from it, and clearing the file (with a restart — a running process keeps its levels) is how a level the vendor stopped publishing stops being offered.

The machine id and the effort menus now live under `$DSH_HOME/coreness/qoder/`; the copies a previous version left under `$DSH_HOME/qoder/` are not read, moved or deleted.

No other host file. The sweep and the routes write neither the profile's patch nor a log file.

## The checks

The fixtures — the wire checks among them, not in the package's `files` — hold the wire mapping, the signed calls, and the chat door's renewal and first-byte ceiling.
