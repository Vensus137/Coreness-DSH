# @coreness/fetch

The product's page fetch: the platform's public HTTP fetch provider registered under the product's id, and the mount repair of a shared web row's stale fetch selection. Host only: one provider, one row, no route, no client half.

## What the plugin owns

- `src/provider.js` — the provider: the platform's `HttpFetchProvider` under the product's id, with the browser identity and the limits the product needs.
- `src/index.js` — the registration into the platform's web seam and the one mount-time repair of the shared `web` row.

## The provider

One selection, not a replacement: the provider registers into the platform's own web seam under the id `coreness-fetch` and runs only while the shared `web` row names that id. The row belongs to the platform; the product's page and the platform's own Web search page are both doors to it, and the latest save wins.

Every rule that matters stays the platform's: the URL validation, the public-address check and the pinned resolution on the direct route, the same-origin redirects, the content-type classification and decoding, the timeout, the abort word and the byte cap. The provider adds the limits and the browser identity a page that admits browsers but not a bare client asks for, and restates nothing: a `WebError` leaves with the platform's own code and message, so a caller routes on the same codes it would meet with the platform's provider.

| Limit | Value |
| --- | --- |
| `userAgent` | the Chrome 131 browser identity |
| `maxBodyChars` | 2 097 152 characters, wide enough that the platform tool's own 200 000-character output cap is the one a page meets |
| `maxResponseBytes` | the platform's own 5 000 000 |
| `maxRedirects` | 5 |
| `timeoutMs` | the platform's own 30 000 |

`available()` is always true: the fetch carries no credential and no switch, so the selection alone decides whether it runs.

## What the model meets

The `web_fetch` tool is the platform's and its shape does not change: one URL in, one page out, the platform's own error codes. While the row selects this provider, a page yields up to the tool's own 200 000 characters instead of the platform provider's 100 000, and the page sees the browser identity. A network, timeout or abort failure reaches the model in the platform's words, not in a product paraphrase.

## The mount repair

A profile saved while the Qoder package still registered a fetch may name `qoder` for `fetchProvider` — a provider that no longer exists — or carry the `null` the old switch could leave on its way off; an empty value names no registered provider either and is treated alike. Each of those selects nothing, and a nullish selection resolves through the platform's fallback rules, where more than one usable provider registered makes the fetch ambiguous. On mount — once the Loader has settled every row, since the settings service describes a row only while its fiber is active — the plugin reads the shared `web` row through the platform's settings service and, when the selection is one of those three — the removed `qoder` name, `null`, or `''` — writes `http` — the platform's own fetch, the explicit off value — with the revision the read returned, so a row saved through the other door in between is refused as a conflict rather than overwritten. The Qoder package's repair writes the same row at the same mount, so a refusal is not final: the row is read once more and the selection judged again — one that now selects a provider is left as it stands, a still-stale one is written with the revision just read, and a second refusal is said and left. A name that selects a provider is another door's choice, and a row whose key is absent never chose: neither is touched, and neither is any other name, because this repair heals the values the move left stale rather than every selection the platform would refuse. One warned line names the repair; a repair that cannot be written says its fault. Every other case is said in words rather than skipped: a composition without the settings service names the row it did not read, one without a Loader says the row was read without waiting, and one whose settings answer carries no shared row says that too.

## What it does not do

- It does not choose the page fetch: no value is shipped, and the shared row stands as the profile saved it. Off is the explicit string `http`, never a missing value, because a row left empty resolves through the platform's fallback rules and this profile registers several usable providers.
- It knows nothing of a proxy: whatever route the platform's own fetch takes is the platform's.
- It owns the fetch selection only: the write's one op targets `fetchProvider`, and the search value is neither read as a subject nor written.
- It does not watch the row and has no second door onto it: the one write is the repair of a value the move itself made stale.

## Checks

The fixture `node packages/fetch/scripts/check-fetch.mjs` holds the limits handed to the platform provider, delegation without a restatement over the provider's hand-in seam, the always-true availability, register/dispose, and the mount repair over fakes — the stale `qoder`, `null` and empty selections, an absent key and a name that picks a provider left as they stand, an absent row said once, a conflict, the wait for the Loader's settle, a composition without a Loader, the unwritable row's warned line, and the words a composition without the settings service leaves.
