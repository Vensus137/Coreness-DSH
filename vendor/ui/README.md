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
| `client.provider.node.js` | The node card: the probe/verify actions and their outcomes. |
| `client.provider.web.js` | The web switch: the live `web` row, the Qoder flag, the checkbox and the footnote. |
| `client.credits.js` | The sidebar foot action `qoder-credits`: the balance line, the popover, the credits route. Nothing is drawn before the first answer or while no credential is stored; an unread balance is retried every minute where a reading is free, and when the popover opens. |
| `client.credits.rewards.js` | The rewards panel the popover draws. |
| `client.gate.js` | The rate-gate section's entry: constants, words, sheet, the route read, the settings write, the seat. |
| `client.gate.section.js` | `GateSection`: the mount read, the 2 s beat, the loading state, the quietly empty picture, the refused rows in words, the draw. |
| `client.gate.limits.js` | The limits editor: the scalars, the rows, the number fields, the ops a write sends. |
| `client.gate.windows.js` | The live windows and the recent decisions. |
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

The page is a constructor, not a collection of one-off controls. A new element wears the set; it does
not add a look.

- **Types.** Three pairs only: 12/18 for hints, labels, statuses and tags; 14/22 for names, lines,
  buttons and fields; 16/24 for section and card titles. A pair outside the list is a defect.
- **Controls.** Shared controls live in the entry's sheet (`client.js`): `coreness-check` (a box and
  its word), `coreness-field`, `coreness-fieldLabel`, `coreness-field-box` (a labelled field),
  `coreness-button` (a button), `coreness-dim` (a hint line). The kit (`client.kit.js`) owns the status
  surface (`STATUS_WORDS`, `statusNode`, `statusMark`, `useStatusStyles`), not a control. The picker and
  hold are the other shared chunks.
- **Cards.** One card has one head and one status, and the status is about that card's subject. A second
  subject is a second card.
- **First paint.** A card that arrives after the read stands in `firstPaint` in the same shape, so the
  answer moves no box.
- **Live value.** A switch reports the row the platform holds, not a copy; a write is followed by a
  read, and a failed write is said in words and followed by the live read again.
- **On/off.** A switch that reports a choice carries a dot beside its name — green when on, absent when
  off — not a `set`/`not set` sentence. A switch is on only when its own flag and the shared selection
  agree; a selection left behind by an explicitly off flag is stale, while an unread flag is unknown and
  writes nothing. A missing credential is said in words, the control is disabled, and a stale shared
  selection is cleared on the section's read so the default stands.
- **A new class** is a deliberate act: it has a sheet and a place in this section. A class used without
  a sheet is a defect, and `scripts/check-ui-set.mjs` fails on one.
- **Before editing:** which existing pair and class does this wear? Is it the same card or a new
  subject? Does it stand in `firstPaint`? Is it disabled or failed in words? Does it read the live value?

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

`node --check` on every file, the caps (the entry and the kit ≤400 lines, every other `.js` or `.mjs` ≤600, `PROJECT.md` ≤250, every other text ≤150), the scratch install's read-back, the probe's boot graph and served ids (the entry, the kit, the picker, the hold, the six MCP files, the seven Qoder files, the credits pair and the four gate files), and `node scripts/check-ui-set.mjs` for the type pairs and class homes. No test suite.
