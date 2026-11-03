# @coreness/proxy

The product's fetch proxy: one stored proxy URL, one reachability check, and the `web_fetch` call wrapped at the platform's `tools/execute` seam while the local fetch serves it, so a page fetch goes through the proxy first and is repeated directly when the network refuses that attempt. Host only: one row, one route, no client half.

## What the plugin owns

- `src/config.js` — the switch `enabled` and the credential reference `proxyRef`, both volatile.
- `src/proxy.js` — the stored URL's shape and redaction, the serialized install window, and the `CONNECT` check.
- `src/gate.js` — the `tools/execute` listener for a page fetch served locally: the proxied attempt, its budget, the classification, the direct repeat.
- `src/route.js` — the card's picture and the check of the stored value.
- `src/live.js` — a volatile field's live value: the box a write reaches, or the plain value.

The URL lives in the platform credential store, never in this plugin's config: the row carries the reference, and the value is resolved per call. The card shows the stored value back in a masked, editable field so a configured proxy is not retyped; that authenticated picture is the only place the value leaves the host. The switch and the reference are volatile, so the page moves them on the running row without a re-mount, and every reader takes the live value.

## The seam and the window

The platform's proxy policy is process-wide and read only from the launch environment; there is no per-request proxy seam. Routing one call through the proxy therefore means installing the policy around that call: `installProxyFromEnvironment` replaces the process-wide dispatcher, publishes the URL in the proxy environment, and hands back the disposer that puts both back. The window is process-wide too, so every install this module opens goes through one promise chain — a second window starts only after the previous one has closed — and it closes in `finally`, whether the call answered, threw, aborted or ran out of its own deadline.

The install is not atomic: it publishes the proxy environment before the dispatcher exists, so a failure in between would leave a proxy standing with nothing to restore it. The window therefore snapshots those names first and puts them back itself when the install throws; the log says whether that worked, and no sentence claims the call went direct while a proxy environment stands.

A listener on `tools/execute` is the platform's documented place to wrap a call for a timeout or a retry; it is also the only execution view that may replace the call's signal. The gate replaces that signal for one attempt with a deadline of its own — fused with the caller's cancellation by the registry before the body runs — and puts the caller's signal back when the attempt settles.

## The switch

Off is a passthrough: the next handler is called once and nothing is installed — no policy, no delay, no read of the stored value. On, the gate reads the stored URL before every call; one resolve per call is what decides whether a URL stands, so a switched-on proxy with nothing stored still pays exactly one read. A value that is not an `http`/`https` proxy address, an unreadable record, or a composition without the credential store each leaves the call direct and says so once, not on every page fetch.

The gate wraps the local fetch only. It reads the shared `web` row through the settings service before every switched-on page fetch — a read that re-reads the profile's rows and patch layers each time, the price of the selection always being live — and stands down when that selection names the platform's server-side DeepSeek fetch: that provider fetches on the platform's side, so a local proxy cannot reach it, and the fallback would spend a second paid request for nothing. The selection is the one the platform resolves: a missing row, a nullish value or a composition without the settings service fall to the same default, where the platform's own `DSH_WEB_FETCH_PROVIDER` launch override stands in for a nullish row — the gate reads that variable too, and acts unless it names the server-side fetch. A row that could not be read leaves the call direct and is said once.

A proxied attempt is accepted only when `proxyRouteFor(url).proxied` answers true — the platform's own routing answer, the one the fetch provider itself consults. A URL the policy keeps direct (loopback, a bypassed host) runs once, directly, and is said once for that host.

## The attempt, the budget and the repeat

The wrapped tool declares a `timeoutMs` (today 30 s), and the budget's clock starts when the gate is entered: the credential resolve and the install are spent from the same budget the caller's timeout bounds. The proxied attempt gets two thirds of what remains when the install returns; when it fails on the network and the caller's signal is alive and at least 5 s of the declared budget is left, the policy is restored and the same call runs once more without it, under a fresh deadline of its own and the rest of the budget. Neither attempt outlives the caller's signal, and every timer is cleared when its attempt settles.

The repeat happens only for a network-class failure, read from the attempt and its result: an attempt cut by its own deadline — read before any code, because the cancel that ends it arrives as the platform's cancellation code; the transport causes, when a provider surfaces one (`ECONNRESET`, the `UND_ERR_*` family and their neighbours); and a TLS name mismatch. `WEB_BLOCKED_URL` is not retried: under a proxy-first call it names a private or literal address, which the direct attempt refuses the same way. An HTTP result is never retried, and neither is a policy refusal (`WEB_INVALID_URL`, `WEB_REDIRECT_BLOCKED`, the content-type and size refusals, a provider-selection error) or anything that happens after the caller's abort.

One code needs naming: the platform's own fetch provider collapses every transport failure into `WEB_PROVIDER_ERROR` before the result crosses the seam — its cause chain and its transport code do not survive. At this seam that collapsed code therefore is the network signal, at the price of one extra direct attempt on a failure the provider files there for its own reasons; without it the direct fallback could never run against the platform's provider. A provider that surfaces a transport code itself is classified by the code, and the bounded cause walk still reads a chain when one is present.

When both attempts fail, the direct result is returned unless it says less than the proxied one: an abort carries no information about the page, so a named refusal outranks it.

## The route

`GET /api/coreness.proxy` answers `{ok:true, value:{enabled, configured, proxyRef, url, writable, editable, ns}}` — the switch as the row holds it, whether the reference resolves to a value, the reference itself, the resolved stored URL (or `null` when nothing is stored or the store cannot answer), whether the credential store can write it, whether this profile can write the row at all (the settings service stands and the profile's editor addresses the row), and the row's id in the composition. The card draws `url` in a masked, editable field; this authenticated picture is the only place the value leaves the host.

`POST /api/coreness.proxy` with `{"action":"check"}` reads the stored value and runs one reachability probe: a connection to the proxy, then one `CONNECT example.com:443` carrying `Proxy-Authorization: Basic …` when the URL has userinfo. For an `https://` proxy URL that connection is TLS first and the tunnel is opened inside it, because the proxy's own transport is TLS and its certificate is the one the URL names — a plain TCP connect would prove a port, not that proxy. `200` answers `works`; `407` answers `refused` with the credentials sentence, and so does any other status that refuses the tunnel (`403`, `405`, `400` and their neighbours); `429` and `5xx` answer `unavailable` — the proxy answered, but not with a tunnel, and a transient failure of its own may pass, so the card says "No answer" rather than sending the reader to retype it. A refused connection, a dead DNS or no answer within the probe's 8 s ceiling answers `unavailable` — the credential resolve before the probe is not part of that bound. No page body is fetched, no process-wide policy is installed and the check changes no state. A body naming a URL — or any field but the action — is refused: the check is of what is stored.

A refusal answers `{ok:false, error:{code, message}}` with status 200: `READ_REFUSED` (the store would not describe or resolve the reference), `NO_PROXY` (nothing stored to check) and `BAD_REQUEST` (a body that is not exactly the one action). Apart from the picture's `url`, every sentence leaving the host names the proxy as `host:port` and nothing else; the stored value is redacted from any foreign message before it is said.

## What it does not do

- It does not own the proxy policy, the fetch provider or the `web_fetch` tool. It wraps one call; the platform's own policy, validation, address pinning and timeout do the work.
- It does not proxy anything but `web_fetch`. Search, model traffic and the other tools are not this module's calls; the window is still process-wide while it stands, which is the platform's own price.
- It does not install a policy for the check, and it does not keep a circuit breaker for a proxy already known to be dead: every page fetch served locally pays the proxied attempt while the switch is on.
- It does not write the credential. The page writes it through the platform's credential remote; the host only reads it, per operation.

## Checks

The fixture `node packages/proxy/scripts/check-proxy.mjs` holds the gate over a stand-in tool call and a stand-in installer — passthrough when off or unconfigured, the stand-down when the shared row selects the server-side fetch, proxy-first with the install, the verification and the restore in order, the direct repeat and the budget split measured from the gate's door, the 5 s floor, the classification and the fresh signal of the repeat, the informative-result choice, the serialized window, an install that refuses before and after publishing the proxy environment, a volatile read, an `https` proxy URL, and a URL the policy keeps direct — and the route over a local fake proxy: the picture with its stored URL (a null one when nothing is stored or the store cannot answer, an unaddressable row, an unwritable credential), the check's `works`/`refused`/`unavailable` verdicts and its default ceiling, the `CONNECT` request, the credential header, the redaction, a refused resolve and a refused body, and the plugin mounted at all: the gate on `tools/execute` and the route answering its path.
