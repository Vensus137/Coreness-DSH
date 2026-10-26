# @coreness/studio

Page Studio: one request builds a static web page — a landing, a portfolio, an article or an event page — or an HTML presentation of five to nine screens, from named looks, sections and recipes. Host; the switch that turns it on is a card on the product's own General page, in the product's one client package.

## What the plugin owns

- `src/index.js` — `apply()`: the switch, the model-facing set, the route and the prompt section.
- `src/config.js` — the one field the card writes through the route: `enabled`, a boolean, off by default, volatile.
- `src/live.js` — a volatile field's live value: the box a write reaches, or the plain value.
- `src/switch.js` — the switch's state machine, pure and without imports, so a bare fixture can run it.
- `src/route.js` — `GET` and `POST /api/coreness.studio`: the picture the page's card reads, and the one write that moves the field.
- `src/routing.js` and `src/skill/routing.md` — the prompt section `coreness:studio` at order 780 and the paragraph it serves.
- `src/skill.js` and `src/skill/page-studio.md` — the in-memory skill `page-studio` and the body the model reads.
- `src/tools/index.js` — the four tool definitions: `studio_looks`, `studio_build`, `studio_check`, `studio_shot`.
- `src/build/` — manifest validation and composition; `src/check/` — the static catalogue and its gates; `src/shot/` — the Edge capture and the computed gates.
- `src/lib/` — the HTML, CSS and fragment readers and the section and layout library: one owner for the field names the builder composes from and the checker re-reads.
- `src/assets/`, `src/shells/`, `src/sections/`, `src/layouts/`, `src/recipes/` — the page and deck system the builder composes from.
- `scripts/check-*.mjs` and `scripts/fixtures/` — the runner-safe fixtures the product's one check command runs; they stay in the repository and are not published with the package.

Everything runtime lives under `src/`, because the public assembly copies a vendored package's `package.json`, `README.md`, `src/` and its display resources, and nothing else. `icon.svg` and `locale/en.json` are the display metadata the plugin inventory reads.

## The switch

The field is `enabled` in the plugin's own Config: a boolean, default `false`, marked volatile. Volatile is the platform's word for a field a write reaches in the running plugin instead of re-mounting the row, and the page's card writes it through the profile's own config editor. So the feature is off on install, and turning it on costs no page reload, no reinstall and no visit to the platform's Plugins page.

The host half stays applied while the switch is off. Off means no `studio_*` tool, no `page-studio` skill and no Page Studio prompt text; it does not mean an unmounted plugin, because the card that switches the feature is drawn from the settings namespace this plugin carries. The value is the profile's settings document, read live at every sync and every prompt assembly — never a copy taken at the mount.

The set follows the field from three signals: the platform's `settings/document-updated` for this row's namespace, which a press in the card produces — the route writes through the platform's profile editor, the Loader's reconciliation emits `app-boot/config-reload`, and the settings service answers that event by projecting the rows, which is the document update every open page follows, so a second page takes the new value without a reload; the Loader's `loader/volatile-update`, the seam that same edit reaches on the host and which the plugin's own sync listens to; and `app-boot/config-reload` as an idempotent extra sync. A hand edit of the profile's patch emits none of them and takes effect at the next start. The sync is serialized and idempotent: one disposer list holds the whole set, the previous registration is disposed before the next stands, a half-registered set is undone and said in the log, and no poll runs anywhere.

**The change applies from the session's next request and rebuilds the prompt cache.** The routing paragraph is registered once with a text provider that returns its text while the switch is on and an empty string while it is off; the platform drops an empty section. Turning the feature on or off therefore changes the model-facing prefix for the next request.

## The model-facing set

Four tools: `studio_looks` (the six looks with their signatures), `studio_build` (compose a page or a deck into a folder the caller names, from a manifest), `studio_check` (the static catalogue over a generated folder) and `studio_shot` (Edge screenshots and the computed gates, as evidence outside the target). `studio_looks` takes no arguments, the other three take theirs. Each answers in one shape, and none substitutes a placeholder for a result.

One skill, `page-studio`, registered in memory: its body carries the manifest field tables, the section and layout catalogues, the recipes, the design law, the intake and the handoff. It is read from `src/skill/page-studio.md` at the mount, and the model never reads the installed package.

One prompt section, `coreness:studio`, at order 780 — after the product's rules at 700 and before the platform's tool guides. While the switch is on it says when to load the skill, what the default is and what the tools do not do; while off it is empty and the platform drops it.

## The answer

`GET /api/coreness.studio` answers `{ok:true, value:{ns, enabled, editable, mounted}}`: the settings namespace — the row's id in the composition, `null` when the composition addresses no row; the Host's own live read of the field; whether the profile's config editor can address the row; and whether the four tools and the skill stand right now. `POST /api/coreness.studio` with `{enabled: true|false}` writes the field through the platform's profile editor and answers the same shape from the state after the write; its refusals are `BAD_REQUEST`, `NO_NAMESPACE`, `NO_EDITOR`, `NO_ROW` and `EDIT_REFUSED`, and another method is `METHOD`. A refusal answers `{ok:false, error:{code, message}}` with status 200, as the product's other routes do.

The card that draws this door lives on the product's own General page (`@coreness/ui`, `client.general.js` and `client.general.card.js`): it asks this route for the picture, presses `POST` for the write, draws the Host's post-write value and never a press's word, and says **Not saved** when the editor refuses. The page therefore carries one surface for the switch, and a profile that switches off the platform's settings dialog still shows it.

## What it does not do

- It does not serve a page: the deliverable is a static folder that opens from `file://`, with local assets only. No server, no hosting, no PDF, no archive, no upload, no backend, no database.
- It does not ship a client package of its own, a bundle of its own, or a second entry in the plugin market: the product's bundle installs it, and its only browser surface is the chunk in `@coreness/ui`.
- It does not own the page: the switch's card is the product's own client package, drawn on the product's General page; this package serves the picture and the write, and nothing of the browser surface.
- It does not compose the status component: the shipped sheets carry its three shapes (`.status`), but no manifest field names one, so it is not a public field of a section or a slide.
- It does not restrict itself to one agent preset: while the switch is on, the four tools are registered in the process-wide tool layer, and a preset that must not see them restricts them itself.

## Checks

`node scripts/check-all.mjs` runs the package's fixtures with the product's other checks — among them the switch's state machine, manifest validation, the composition, the checker's gates and the Edge decision path. The fixtures need no platform, no network and no profile, and each runs as a bare `node <fixture>` from the repository root.
