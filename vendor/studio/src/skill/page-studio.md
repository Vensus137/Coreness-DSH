# Page Studio

A static page or a 5–9 screen HTML presentation from one prompt, composed into a folder that opens from disk — no server, no framework, no external asset, no PDF.

The page is only as good as its content: the user's own words and facts are the source, and a number with no source is removed rather than invented. Every rule below serves that.

## Procedure

1. **Brief.** From the request alone: the subject, the reader, what the reader does next, the facts and where each comes from, the action and its address. Do not ask what the request already answers.
2. **Direction.** One formal idea in one line (see *Design law*), the look from `studio_looks`, and the recipe that fits the kind.
3. **Structure.** Take the recipe's default stack and adjust it to the content — never the reverse. Write the manifest (page in *Page manifest*, deck in *Deck manifest*).
4. **Build.** Call `studio_build` once with kind, look, targetDir and the manifest. Fix only what it reports as invalid, then call again.
5. **Check.** Call `studio_check` on the returned folder. Fix every `fail` in the manifest or the copy, never in the generated HTML; re-run until no `fail` stands.
6. **Shot.** Call `studio_shot` when a browser may be there. Read the PNGs when images can be seen; when they cannot, the handoff says "not seen".
7. **Self-check.** Judge the 1440 still against the law the build was composed by — one formal idea, one scale jump, one accent job, one object in the view, the bookend — and when one is visibly broken, fix it in the manifest, rebuild once and re-check. Anything broken that the gates cannot see goes in `Noticed:`.
8. **Handoff.** Report in the shape of *Handoff*.

Do not stop mid-build for a design decision: decide, then state the decision in the handoff. One look swap after the first build, on request — never three designs.

## Intake: at most three questions

Ask only what the brief cannot answer, never more than three, in one batch, each carrying the default that applies when it is skipped:

1. **What it is, and what the reader does next** — default: infer both from the request.
2. **The facts and their source** — default: none claimed. A number with no source is removed, not invented.
3. **Where the folder goes** — default: none. `studio_build` takes an explicit `targetDir`, from the user's words or the project's conventions; ask only when neither names one.

Never ask for colours, fonts, "style", "modern", "clean", a mood board or a reference site. The look is the one name that fits the brief (`studio_looks` describes each), Quiet when none fits better; the other looks are not offered as a menu. "Choose for me" is an answer: decide and state it.

## Choosing the look

`studio_looks` returns each look's id — `quiet` (the default), `editorial`, `technical`, `corporate`, `bold`, `warm` — with its name, signature and description. Match the brief to the look's `description` and choose the one that fits, taking the one whose signature the content can carry where two fit; Quiet is the default when none fits better. The choice is the model's. "On request" governs only how it is talked about: never offer the user a menu of looks.

## Design law

One formal idea, named in one line and used in every view: one object / negative space / scale contrast / editorial grid / type as image / flat field / annotation layer / data proof / sequence / crop and bleed / wide and detail. Do not stack two devices.

- **Compose the still.** Every page view and every slide reads as a finished composition on its own; nothing needs motion for hierarchy.
- **One accent job per view.** Accent does one job per view — links, one action, a rule, a number or a field — never two, never a second accent.
- **One scale jump.** One element stands at least two steps above body — the display line, the statement, the dominant number — and everything else stays quiet; use the scale, not ad-hoc sizes.
- **One object per view.** `hero`, `statement`, `quote` and `closing` carry one object; `stats` has one dominant number (`dominant`); `cards` only for genuinely parallel items, one of which may lead (`lead`). No icon grid, no equal placeholder cards.
- **Choose the object by priority.** A number only if the brief carries one with a source; an exact quotation only if it is verbatim; else a wordmark; else none. `none` is a finished composition — never invent a number, a quotation or a metric to fill the space.
- **A real annotation layer, or none.** A section number, a rule, a unit, a source, one caption or a tabular numeral is allowed when it exposes real structure or data; at most two kinds per section. A tagged object's value, unit and source count as one kind, and an action is not an annotation. No folio, no gauge, no fake HUD, no decorative counter: ordinals number a real sequence (`points`, `steps`, `timeline`), and a counter on anything that is not a sequence is refused. Annotations are plain text and real numbers — a figure label like `FIG. 1`, a `SYS.`/`REF`/`LIVE` tag, a `0x…` value or an emoji is refused; a figure is named in words ("Figure 1").
- **Bookend and motif.** Carry one motif — a word, a number, a rule, an accent detail — through adjacent sections; the closing echoes the opening, a deck's last slide its first.
- **No texture, no camera.** Material comes from surface, rules and type, never grain, halation, vignette or overlay. Pair one wide view with one detail view; use scale and crop, not a zoom.
- **Motion is feedback, never entrance.** The page and the deck ship one bounded CSS-only interaction layer: `:hover`, `:focus-visible` and `:active` feedback on links, actions and the `cta`, and the deck's slide change on Arrow/Page/Home/End. Durations use the motion tokens (`fast` 120 ms, `base` 180 ms, hard cap 240 ms) and one easing, `cubic-bezier(.2,0,.2,1)`. Page hover/focus may transition only `color`, `background-color`, `border-color`, `text-decoration-color` and `text-decoration-thickness`; the deck's slide change may additionally transition `transform` (translate ≤8 px). No `@keyframes`, no `animation`, no autoplay, no loop, no scroll-linked or entrance motion: nothing moves at load, the focus ring appears instantly and is never faded, and text is never dimmed below its resting contrast. No `transform`, `opacity` or `box-shadow` on page hover/focus, and no layout-property transitions (`width`, `height`, `gap`, `margin`, `padding`, `font-size`, `line-height`, `letter-spacing`). Under `@media (prefers-reduced-motion: reduce)` every transition is `none` and the deck switches instantly. Both ends of every hover/focus colour pair meet the WCAG floor, and with transitions disabled the page and deck read exactly as before.

## Page manifest

One section of the document, as written (the rest of the array is the same shape):

```json
{ "type": "hero", "thesis": "Old fruit trees, brought back to bearing",
  "lead": "A three-person workshop in Tver.",
  "object": { "kind": "number", "value": "1 240", "unit": "trees", "source": "Source: 2025 workshop log" },
  "action": { "label": "Book a survey", "href": "#s-cta" },
  "caption": "Tver and the surrounding district" }
```

The document: `{ "title", "description", "lang"?, "variant"?, "sections" }` — `title` (≤80) and `description` (≤200) are required; `lang` defaults to `en`; `variant: "event"` is accepted on a landing; `sections` holds the recipe's range (below). `kind` and `look` are `studio_build` arguments, never manifest fields. The page's chrome — the skip link and the navigation, footer and table labels — follows the document's `lang`: `ru` and `en` are rendered today, an untranslated language falls back to English, and the model supplies none of those words. Every string is one line of plain text, trimmed — not HTML, not markdown; a paragraph list is an array of strings, never one string with breaks; an optional field is omitted, never empty. An `href` is `http(s):`, `mailto:` (a real address) or `#s-<type>` for a section the document carries (`s-<type>` once, `s-<type>-<n>` from the second); `tel:`, `javascript:`, `data:`, `file:`, a relative path and a bare `#` are refused. An unknown field or key is refused by name (`manifest.unknownField`).

Field conventions: `(≤n)` is a character ceiling; the builder enforces every character ceiling and array count and names the field when one is over, so a long line is a fix, not a dead end. The sentence and word budgets are targets, not checks: the builder counts neither, and `studio_check` cannot see a wrapped line without a browser, so keep a paragraph to three sentences and a body line to twelve words by hand. Every array count in these tables is a budget — a count outside it refuses with `manifest.budget`, as does a page outside its recipe's section count or a deck outside 5–9; an index (`lead`, `dominant`, `numeric`) that names no item or column refuses with `manifest.field`. A tagged object carries `kind`; item objects are inline. A recipe's stack is the allow-list for that recipe, not a menu: `table` appears only in `article`, `timeline` only in the event landing, `gallery` only in `portfolio`, and a section outside the recipe's stack refuses with `recipe.composition`.

| `type` | required | optional |
|---|---|---|
| `header` * | `brand` (≤32) | `nav` 2–3 × `{label ≤24, href}` pointing at a section or an `http(s)` address, `note` (≤40); brand is text, not a link |
| `hero` * | `thesis` (≤72), `object` (tagged, below) | `lead` (≤140), `action` `{label ≤32, href}`, `caption` (≤80) |
| `prose` | `paragraphs` 1–6 (each ≤420, ≤3 sentences) | `heading` (≤60), `pull` `{text ≤140, attribution ≤60}` |
| `split` | `heading` (≤60), `paragraphs` 1–3 (each ≤200), `evidence` (tagged, below) | — |
| `cards` | `items` 2–6 × `{title ≤40, body ≤200, note? ≤40}` | `heading` (≤60), `lead` (index of the leading card) |
| `stats` | `items` 2–4 × `{value, unit?, caption?, source?}` | `heading` (≤60), `source` (section source), `dominant` (index, default 0) |
| `timeline` | `items` 3–5 × `{label ≤24, title ≤60, body? ≤140, source? ≤80}` | `heading` (≤60); labels are real and in order |
| `quote` * | `text` (≤180, verbatim), `attribution` (≤60, a real person or document) | `role` (≤60), `source` (≤80) |
| `table` | `heading` (≤60), `columns` 2–5 (each ≤24), `rows` 1–8 (a row is as long as `columns`, cells ≤60) | `caption` (≤80), `numeric` (column indices, right-aligned; needs `source`), `source` (≤80) |
| `gallery` | `items` 3–9 × `{title ≤40, caption ≤120}` | `heading` (≤60); tiles are text, there is no image field |
| `faq` | `items` 3–6 × `{q ≤80, a ≤160}` | `heading` (≤60) |
| `cta` * | `heading` (≤60), `action` `{label ≤32, href}` | `body` (≤160), `note` (≤60) |
| `footer` * | `brand` (the header's) | `line` (≤100), `links` 1–3 × `{label ≤24, href}`, `note` (≤60) |

Tagged objects: `hero.object` is `{kind:"number", value, unit?, source}` (source required), `{kind:"quote", text ≤140, attribution ≤60}` (verbatim or none), `{kind:"wordmark", text ≤32}` or `{kind:"none"}`; `split.evidence` is `{kind:"list", items 2–4 × {label?, text ≤120}}`, `{kind:"number", value, unit?, source}` or `{kind:"labels", items 2–4 × {label, value}}` (each ≤40).

`header`, `hero`, `quote`, `cta` and `footer` stand once each. The page's only `h1` is the hero `thesis`; every other section has one `h2`; item titles are `h3`; no `h4`–`h6`. Order: `header` first, `hero` directly after it, `cta` before `footer`, `footer` last. A section's anchor is `#s-<type>` (`#s-cards-2` for a second cards).

## Deck manifest

One slide, as written:

```json
{ "layout": "data", "heading": "Trees brought back to bearing",
  "value": "1 240", "unit": "trees", "source": "Source: 2025 workshop log",
  "note": "Counted at the end of the 2025 season." }
```

The document: `{ "title", "description"?, "lang"?, "slides" }` with 5–9 slides; `title` is ≤80; the first is a `title`, the last a `closing`; the deck's single `h1` stands on the title slide and every other slide heading is an `h2`; each slide has exactly one heading. A 16:9 stage at 1280×720, 64 px margins, body 24 px. Targets the builder does not count: `≤6` rendered text lines per slide (heading ≤2, a quotation ≤3, a source or attribution 1), which only `studio_shot` can measure, and `≤12` words per body line, a `points` item `≤10`, a statement `≤20`, a `closing` line `≤8`; a line that does not fit is cut, never shrunk. The shell owns the stage fit, the `NN / NN` counter, the Previous/Next buttons, the keys (arrows, PageUp/PageDown, Home/End, Space) and `F` fullscreen; the manifest carries none of them.

| `layout` | required | optional |
|---|---|---|
| `title` | `title` (≤64) | `lead` (≤90), `label` (≤40) |
| `statement` | `statement` (≤120) | — |
| `points` | `heading` (≤60), `items` 3–5 × `{label? ≤8, text ≤48}` | `source` (≤80; at most 4 items); one line per item; a label on every item or on none |
| `split` | `heading` (≤60), `body` 1–3 strings (each ≤64), `evidence` (tagged: `{kind:"labels", items 2–4}` or `{kind:"number", value, unit?, source}`) | — |
| `data` | `heading` (≤60), `value` (≤12), `source` (≤80) | `unit` (≤24), `note` (≤140) |
| `quote` | `text` (≤160, verbatim), `attribution` (≤60) | `role` (≤60) |
| `steps` | `heading` (≤60), `steps` 3–5 × `{label ≤8, text ≤48}` | — |
| `closing` | `line` (≤64) | `action` `{label ≤32, href}`, `label` (≤40) |

A `points` slide may carry `source` (≤80), but the slide's six rendered lines bound it: the heading, one line per item and the source line must fit together, so 4 items plus a `source` is legal and 5 items plus a `source` is refused (`manifest.budget`). Counted characters are not rendered lines: a `points` item or a `split` body string that wraps is over the line budget even inside its limit, so keep one rendered line per item and prefer a shorter sentence when the budget is tight.

Order: `data` at most once, `quote` at most twice, `title` and `closing` once each; no two dense layouts adjacent (`points`, `split` and `data` are dense; `title`, `statement`, `quote` and `closing` are sparse; `steps` is medium). Canonical orders: 5 slides = title, statement, data, steps, closing; 7 = title, statement, points, quote, data, steps, closing; 9 = title, statement, points, quote, split, quote, data, steps, closing. The deck's content follows the 5-scene arc — the reader's problem, what changes, how it works in three steps, one proof, who acts and how — as content, never as a new layout.

## Recipes and default stacks

| kind | default stack | required | sections |
|---|---|---|---|
| `landing` | header, hero, prose, cards, quote, stats, split, faq, cta, footer | header, hero, cta, footer | 5–11 |
| `landing` + `variant: "event"` | header, hero, prose, stats, timeline, cards, quote, faq, cta, footer | header, hero, timeline, cta, footer | 5–11 |
| `portfolio` | header, hero, gallery, prose, quote, cards, cta, footer | header, hero, gallery, footer | 4–10 |
| `article` | header, hero, prose, prose, table, quote, faq, prose, footer | header, hero, prose, footer | 4–12 |
| `presentation` | title, statement, points, quote, data, steps, closing (or the 5- and 9-slide orders above) | title, closing | 5–9 slides |

A stack is a design order, not a template: any subset keeps the order and the recipe's required sections. An article has no `cta` — it does not sell; a portfolio's `cards` are optional; a landing omits `stats` when the brief carries no sourced numbers. Keep the rhythm: no two dense sections adjacent, never a dense one right after the hero, and the last section before the footer is quiet (dense: cards, stats, table, faq; medium: split, timeline, gallery; quiet: the rest). An event page that carries `stats` carries a quiet section between the hero and it — `prose` is that section; an event page without `stats` needs no `prose`. A section outside the order or a missing required one is `recipe.composition`; a broken density rule is `recipe.rhythm`.

## Content rules

- **The user's words are the source** — their text, names, numbers. Do not strengthen a claim, invent a testimonial or add a fact the brief does not carry.
- **Exact values, not adjectives.** "Deploys finish in 6 minutes" is a claim; "Ship faster" is filler. A number with no source in the brief does not appear.
- **Every number is sourced or removed.** A `stats` item carries its own `source` or the section does, and the deck's `data` layout carries one; each numeric claim is named in the handoff. A `source` is page copy in the document's language: where the number came from, in a reader's words. A year or a log name is the shape of an example, never required — a real document or a year is not invented to fill it. "User brief" is a source for a number the brief actually carries, never for one it does not.
- **No invented facts, quotes, people, logos, dates, metrics, ratings or "trusted by" strips.** A quotation is `quote.text` with a real `attribution`, verbatim; invented, it does not appear at all.
- **No fake data furniture:** no HUD, no gauge, no timeline axis, no count-up, no percentage without its base, no fake precision, no second dominant number.
- **One claim per screen, one message per page.** A heading states the claim, not the category — "Deploys finish in 6 minutes", not "Features".
- **Readable muted.** Muted text is the muted token, never an invented lighter grey; status carries a word, never colour alone; a prose link is always underlined.
- **Real copy only.** No lorem, no "Your text here", no TODO, no filler vocabulary: seamlessly, empower, unlock, elevate, revolutionize, next-generation, cutting-edge, supercharge, robust, holistic, leverage.
- **Actions say the verb and the object** ("Request a survey", "See the agenda"), a label is ≤32 characters, and one action keeps its name through the page.
- **Thin content is named, not padded.** When the brief carries little, build fewer, stronger sections and say so in the handoff.

## Target, files, and what the tools answer

- `targetDir` is explicit and never invented: the folder the user named, or the project's own convention for a site (an existing page folder, `docs/`, `public/`); the intake question decides it. Never a temporary folder of your own making.
- The build writes exactly `index.html`, `assets/site.css` and `page.json`, plus `assets/deck.css` and `assets/present.js` for a presentation, and nowhere else. Read the generated `index.html` to check the copy and the numbers — that is the page the user opens.
- A folder may be built into when it is absent, empty, or already carries a `page.json` the studio wrote; a folder left by a failed build carries no marker and is refused until it is cleared, so remove it or choose an empty folder before retrying. Anything else is `target.notEmpty`: use the folder the user meant, or ask. The builder never deletes a file and never touches a file outside the emitted set.
- An invalid manifest writes nothing: fix the paths the answer lists and call again. `write.failed` names the files written before the fault and leaves the folder without a marker; clear it before retrying.
- `studio_check` answers `pass`, `fail` or `unchecked` per gate; a `fail` names a code and its detail, `unchecked` is reported with its reason, and no gate is restated as a pass. It checks only a folder the studio wrote — anything else is `target.notOwned`.
- `studio_shot` answers `done` or `unchecked`; no Edge, a failed launch or a read-only session is `unchecked` with its `reason`, so say "not seen" instead of claiming a look.
- `target.readOnly`, `target.outsideWorkspace`, `target.isWorkdir` and `target.isAncestor` are refusals, not obstacles: report them and do not work around them.

### Revising a built page

A change is a rebuild into the same folder, not a second folder: read the `manifest` from the folder's `page.json` (it records `kind` and `look` too), edit it, and call `studio_build` again with the same `kind`, `look` and `targetDir`. The rebuild rewrites exactly the emitted set and leaves every other file alone; `index.html` is generated from the manifest, so a hand edit there is lost. A look swap is the same call with a different `look`, not a second design. Re-run `studio_check` after a rebuild (`studio_shot` when a browser is there) and name in the handoff what changed.

## Handoff

Report in this shape, short — a shape, not a fixed six, so add a line when the report needs one:

```
Built: <kind>, <look> — <one formal idea, one line>
Folder: <targetDir>
Structure: <section types or slide layouts, in order>
Checked: <n> pass, <n> fail — <codes> / unchecked: <codes and why>
Looked: <what the screenshots showed, or "not seen"; a deck at 390 is the stage scaled down and unreadable by design — report the limit, not a broken page>
Numbers: <each claim — the page's source string, and its real provenance — or "none claimed">
Decided: <every default taken in place of a question>
Noticed: <anything wrong with the built output — in the page, in the result, in what the tools could not verify — or "none">
```

Never claim a visual success that was not observed, never present an unchecked gate as a pass, and never hand over a page whose numbers came from nowhere. Anything you notice wrong with the built output — in the page, in your own result, in what the tools could not verify — goes in the report, whether or not you caused it and whether or not a gate saw it; a report that reads clean because it leaves that out is the failure this rule exists to prevent.
