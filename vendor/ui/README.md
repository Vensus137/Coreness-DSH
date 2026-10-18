# @coreness/ui

The product's page: one client package, one entry, and package-local chunks served beside it.

## What is here

| File | What it carries |
| --- | --- |
| `index.js` | The host half. It mounts nothing; the row exists so the bundle's patch has a package to insert. |
| `client.js` | The entry: the `main` panel, the `sidebar.panellist` row, the section seat, the page's shared sheet, and the chunk pulls. |
| `client.product.js` | The product's own section: the bundle the composition installed, read through the platform's remotes. |
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
| `client.credits.js` | The sidebar foot action `qoder-credits`: the balance line, the popover, the credits route. |
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
provider's six alike; the section entry calls each once in its `apply`, in the order its `shared` promises
(models, credential, node, draw, section), and a part reaches a sibling only through `shared` at call
time. No module-level `ctx` or `t` is shared across files.

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

`node --check` on every file, the caps (entry ≤400, kit ≤400, a section chunk and its parts ≤600, no counted
file >800), the scratch install's read-back, and the probe's boot graph and served ids (the entry, the kit,
the picker, the hold, the six MCP files, the six Qoder files, the credits pair and the four gate files). No test suite.
