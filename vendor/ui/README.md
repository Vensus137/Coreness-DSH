# @coreness/ui

The product's page: one client package, one entry, and package-local chunks served beside it.

The files sit at the package root, not under `src/`, because the platform's client loader fetches `client*.js` from the package root; the host half stands beside the chunks it serves.

## What is here

| File | What it carries |
| --- | --- |
| `index.js` | The host half. It mounts nothing; the row exists so the bundle's patch has a package to insert. |
| `client.js` | The entry: the `main` panel, the `sidebar.panellist` row, the section seat, the rail's title with the bundle's version, the page's shared sheet, and the chunk pulls. |
| `client.mcp.js` | The MCP section's entry: its constants, words, sheet, vocabularies, the seat and `apply`. |
| `client.mcp.section.js` | `McpSection`: the section's own lifetime — the read, the wait, the note, the poll. |
| `client.mcp.draw.js` | `draw`, the target/count lines, and the note and tone helpers. |
| `client.mcp.card.js` | `cardOf`, `pairRow`, `rowMenu`: the card's markup and words. |
| `client.mcp.form.js` | The editor, the pair fields, the lost-field check, the dialog and the drafts. |
| `client.mcp.signin.js` | The sign-in strip: the row's state, the question, the answer, the reason line. |
| `client.provider.js` | The Qoder section's entry: constants, words, sheet, reads, the seat and `apply`. |
| `client.provider.section.js` | `QoderSection`: the section's lifetime — the read, the catalogue, the editor. |
| `client.provider.draw.js` | `draw`, `statusOf`, `firstPaint`, the answer strip. |
| `client.provider.models.js` | The models card, the live catalogue, the model-list editor. |
| `client.provider.credential.js` | The credential card: the reference's state and the missing-token words. |
| `client.provider.node.js` | The node card: the probe/verify actions, their outcomes, and the data-sharing press beside `Check node` (drawn only while the account shares; its title carries the state). |
| `client.provider.web.js` | The web switch: the live `web` row, the Qoder flag, the checkbox and the footnote. |
| `client.credits.js` | The sidebar foot action `qoder-credits`: the balance line, the popover, the credits route, and the usage link the account's own `detailUrl` names. Nothing is drawn before the first answer or while no credential is stored; an unread balance is retried every minute where a reading is free, and when the popover opens. |
| `client.credits.rewards.js` | The rewards panel the popover draws. |
| `client.gate.js` | The rate-gate section's entry: constants, words, sheet, the route read, the settings write, the seat. |
| `client.gate.section.js` | `GateSection`: the mount read, the 2 s beat, the loading state, the quietly empty picture, the refused rows in words, the draw. |
| `client.gate.limits.js` | The limits editor: the scalars, the rows, the number fields, the ops a write sends. |
| `client.gate.windows.js` | The live windows and the recent decisions. |
| `client.general.js` | The General section: the Agent team card — the ceiling in force and the control that writes it, the two prompt switches (the product's text, and the review paragraph that rides in it), and the states both stand in. |
| `client.kit.js` | The shared status surface: `statusNode`, `statusMark`, `useStatusStyles`, the word map. |
| `client.picker.js` | The shared picker control. |
| `client.hold.js` | The shared lifetime of a temporary answer. |
| `locale/en.json`, `icon.svg` | The display resources the plugin manager reads. |

The entry's `inject` names the platform namespaces the page reads. A chunk borrows the entry's context; a
chunk's own file is its own module, so nothing but the factory's arguments crosses a file boundary. Each
section's parts are factories — `create({ t, kit, picker, hold, ctx, shared })` — the MCP six and the
provider's seven alike; the section entry calls each once in its `apply`, in the order its `shared`
promises (models, credential, node, web, draw, section), and a part reaches a sibling only through
`shared` at call time. No module-level `ctx` or `t` is shared across files.

## The set

**A new element stands only with the user's word.** The page is a constructor: a section is assembled from
what the set already has. An element that is not in the set — a control, a status surface, a strip, a class
that draws something new, an arrangement of existing classes that draws a second place for the same thing —
is proposed to the user: what it is, which existing element cannot carry the task, and where it would
stand. It is built after the answer. **No answer, no element: the element waits, and the work says what it
waits for; silence is not an answer.** A set grows by proposal; a proposal is not a way around the set.

**The look before a new element.** The set's list comes first; then a neighbouring section, a card already
built, a live example. The element may be there under another name, and a live example that already solves
the same problem is the default. The proposal names the existing element it cannot use and why.

- **Types.** Three pairs only: 12/18 for hints, labels, statuses and tags; 14/22 for names, lines,
  buttons and fields; 16/24 for section and card titles. A pair outside the list is a defect.
- **Controls.** Shared controls live in the entry's sheet (`client.js`): `coreness-check` (a box and
  its word), `coreness-field`, `coreness-fieldLabel`, `coreness-field-box` (a labelled field),
  `coreness-button` (a button), `coreness-dim` (a hint line). The kit (`client.kit.js`) owns the status
  surface (`STATUS_WORDS`, `statusNode`, `statusMark`, `useStatusStyles`), not a control. The picker and
  hold are the other shared chunks.
- **The rest of the set.** The card frame (`coreness-card-box`, `coreness-card-head`, `coreness-card-body`);
  the answer strip (`coreness-answer` — the card head's room, drawn always and empty while nothing is said,
  `data-tone` `plain`/`done`/`fault`, width `--coreness-news-strip`, at the head's right edge); the status
  mark (`coreness-status-mark` — the dot beside the name of the thing it is about, drawn by `statusMark`);
  the tones (`coreness-tone-done`, `coreness-tone-fault`; `coreness-tone-danger` is the destructive
  action's colour, worn by a button, not a status tone); the section frame (`coreness-sectionHead`,
  `coreness-sectionTitle`, `coreness-sectionBody`, `coreness-sectionCount`, `coreness-still`); a list of
  cards and its 12 px rhythm (`coreness-list`, `coreness-card-list`); one line cut with an ellipsis
  (`coreness-cutLine`); a failure block in words (`coreness-failed`); the row and button that add a thing
  (`coreness-addRow`, `coreness-add`).
- **Size.** A control's box is the same in every state: an empty field stands at its type pair's line like
  a filled one, so a value arriving or leaving moves nothing under it.
- **Cards.** One card has one head and one status, and the status is about that card's subject. A second
  subject is a second card.
- **Rhythm.** The first card stands 12px under its section's head: a list of cards takes it from
  `coreness-card-list`, a single card carries the same 12px itself. A card that begins on the head's
  baseline is a defect found by looking — no check reads a gap.
- **The answer's place.** The room keeps the section's own conditions — an unwritable row, a team service
  that is not mounted. The strip carries the card's answer: a press's word — `Saved`, `Not saved` — or,
  when no press has just answered, the card's own condition in one word (`Not read` while the card's read
  fails). Every sentence a fault needs beyond that word stands in the console: a card whose lines come and
  go with a press changes its height, and its own room is fixed. The two do not swap places, and a second
  place for the answer is a new element. The strip stands at the head's right edge: the title takes the
  growing space, or the section pushes the strip with its own declaration.
- **First paint.** A card that arrives after the read stands in `firstPaint` in the same shape, so the
  answer moves no box.
- **Live value.** A control reports the row the platform holds, not a copy; a write is followed by a
  read, and a failed write is said in words and followed by the live read again.
- **On/off.** A check that reports a choice carries a dot beside the name of the thing it is about — green
  when on, absent when off — not a `set`/`not set` sentence. A check is on only when its own flag and the
  shared selection agree; a selection left behind by an explicitly off flag is stale, while an unread flag
  is unknown and writes nothing. A missing credential is said in words, the control is disabled, and a
  stale shared selection is cleared on the section's read so the default stands.
- **The set is the list.** Every shared element stands in this section with its class and its role — a
  sheet, a control, the status surface, the answer strip, the tones, the card frame, the section head. A
  class a section wears and its own sheet does not define is shared: it stands in the entry's sheet or the
  kit, and it joins this list in the same change that adds it; the approval is named where the work is
  recorded — the step, the spec, the commit message — so a reader sees an approved element and an invented
  one apart. A class only its own section's sheet defines and wears is the section's own: it stands in
  that sheet and not here. The entry's page frame is the entry's own.
- **A new class.** A shared class is a new element: it is proposed with the element, and once approved it
  stands in the entry's sheet or the kit and in this list. A class only its own section's sheet defines and
  wears is that section's own and is not proposed. A class used without a sheet is a defect; the check
  fails on one, except the marker classes it reports.
- **Before editing:** which element of the set draws this? Is it the same card or a new subject? Does it
  stand in `firstPaint`? Is it disabled or failed in words? Does it read the live value? Which element
  draws the answer to its press? Is anything here an element the set does not name?

## The section seat

The entry registers `main` with one child: `coreness.section`, a root list. A chunk registers into it:

```js
ctx.slots.inject('coreness.section', () => ctx.slots.register({
  name: 'coreness.section', id: 'mcp', order: 10,
  label: () => t('section'), locale: 'coreness.mcp',
}, McpSection))
```

The rail is the seat's rows by order. An empty seat draws the page's own empty state; no fake section stands
in for one that did not arrive.

## Install

The package is installed through the bundle, not by itself: `packages/bundle` depends on it by
`"@coreness/ui": "file:../ui"`. The scratch install and the probe live in the repository's `scripts/`.

## Checks

`node --check` on every file, the caps (the entry and the kit ≤400 lines, every other `.js` or `.mjs` ≤600, `PROJECT.md` ≤250, every other text ≤150), the scratch install's read-back, the probe's boot graph and served ids (the entry, the kit, the picker, the hold, the six MCP files, the seven Qoder files, the credits pair, the four gate files and the General chunk), and `node scripts/check-ui-set.mjs` for the type pairs and class homes. No test suite.
