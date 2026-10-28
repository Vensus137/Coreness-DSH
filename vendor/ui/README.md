# @coreness/ui

The product's page: one client package, one entry, and package-local chunks served beside it.

The files sit at the package root, not under `src/`, because the platform's client loader fetches `client*.js` from the package root; the host half stands beside the chunks it serves.

## What is here


The entry's `inject` names the platform namespaces the page reads; it registers `main` and the `sidebar.panellist` row under `coreness`, declares the seat `coreness.section` in the main registration's `children`, carries the rail's title with the bundle's version, and pulls five chunks with `require.async`: `client.general.js`, `client.mcp.js`, `client.provider.js`, `client.credits.js` and `client.gate.js`. The host half (`index.js`) mounts nothing: the row exists so the bundle's patch has a package to insert, and `locale/en.json` and `icon.svg` are the display resources the plugin manager reads.

A section is an entry and its parts. Its entry registers into the seat under its own id, locale namespace and order, holds the section's sheet, and calls each part once in its `apply`; the parts are factories over what they draw with — the platform's client context, the locale's `t`, the shared `kit`, `picker` and `hold`, and a `shared` object the entry fills. A part reaches a sibling only through `shared` at call time; no module-level `ctx` or `t` crosses a file boundary.

The entry's sheet holds the shared controls and the page frame, and the entry holds it for as long as the package stands — put back if the platform's replace takes it — so a chunk that draws outside the page's mount, like the sidebar's credits foot, still finds the page's tokens; the kit owns the status surface, the picker and the hold are their own chunks, and every section holds the sheet it draws with, put back if a re-mount takes it.

The host routes a section reads: General reads `/api/coreness.team`; MCP reads `/api/coreness.mcp` and the sign-in door `/api/coreness.signin`; the Qoder section reads `/api/coreness.qoder` and `/api/coreness.credits` plus the platform's settings, credentials and model remotes; the credits foot reads `/api/coreness.credits`; the rate gate reads `/api/coreness.rateGate` and writes through the platform's settings service.

The set of elements, the type pairs and the class homes stand in `## The set` below; that section is their one owner.

## The set

**A new element stands only with the user's word.** The page is a constructor: a section is assembled from what the set already has. An element that is not in the set — a control, a status surface, a strip, a class that draws something new, an arrangement of existing classes that draws a second place for the same thing — is proposed to the user: what it is, which existing element cannot carry the task, and where it would stand. It is built after the answer. **No answer, no element: the element waits, and the work says what it waits for; silence is not an answer.** A set grows by proposal; a proposal is not a way around the set.

**The look before a new element.** The set's list comes first; then a neighbouring section, a card already built, a live example. The element may be there under another name, and a live example that already solves the same problem is the default. The proposal names the existing element it cannot use and why.

- **Types.** Three pairs only: 12/18 for hints, labels, statuses and tags; 14/22 for names, lines, buttons and fields; 16/24 for section and card titles. A pair outside the list is a defect. Two weights only: 400 for text and hints, 500 for names, titles, labels and truths. A weight outside the list is a defect.
- **Controls.** Shared controls live in the entry's sheet (`client.js`): `coreness-check` (a box and its word), `coreness-switch` and its thumb `coreness-switchThumb` (an immediate on/off choice, drawn as the platform's own settings draw one: the state stands in the control — a thumb at one end or the other — and it carries no word of its own, because the row it sits in already names what it switches, where a check stands as its own box and word), `coreness-field`, `coreness-fieldLabel`, `coreness-field-box` (a labelled field), `coreness-button` (a button), `coreness-dim` (a hint line). The kit (`client.kit.js`) owns the status surface (`STATUS_WORDS`, `statusNode`, `statusMark`, `useStatusStyles`), not a control. The picker and hold are the other shared chunks.
- **The rest of the set.** The card frame (`coreness-card-box`, `coreness-card-head`, `coreness-card-body`); the answer strip (`coreness-answer` — the card head's room, drawn always and empty while nothing is said, `data-tone` `plain`/`done`/`fault`, width `--coreness-news-strip`, at the head's right edge); the status mark (`coreness-status-mark` — the connection's dot beside the name of the thing it is about, its three tones grey, green and red, drawn by `statusMark`; no on/off control carries one, because the control is its own state); the tag (`coreness-tag` — a small chip whose `data-tone` names its background, the ink of its words coming from the class beside it); the tones (`coreness-tone-done`, `coreness-tone-fault`; `coreness-tone-danger` is the destructive action's colour, worn by a button, not a status tone); the section frame (`coreness-sectionHead`, `coreness-sectionTitle`, `coreness-sectionBody`, `coreness-sectionCount`, `coreness-still`); the name line for a thing that is not a card (`coreness-name` — a panel's or a popup's name; a card's title wears `coreness-sectionTitle`); the section's intro (`coreness-sectionIntro` — the sentence under a section's head, one size, one ink and 8px of air for every section that carries one); a list of cards and its 12 px rhythm (`coreness-list`, `coreness-card-list`); one line cut with an ellipsis (`coreness-cutLine`); a failure block in words (`coreness-failed`); the row and button that add a thing (`coreness-addRow`, `coreness-add`).
- **Size.** A control's box is the same in every state: an empty field stands at its type pair's line like a filled one, so a value arriving or leaving moves nothing under it.
- **Cards.** One card has one head and one status, and the status is about that card's subject. A second subject is a second card.
- **Rhythm.** The first card stands 12px under its section's head: a list of cards takes it from `coreness-card-list`, a single card carries the same 12px itself. A card that begins on the head's baseline is a defect found by looking — no check reads a gap.
- **The answer's place.** The strip is the one place a press's word stands — `Saved`, `Not saved` — and every card of every page carries it, drawn always and empty while nothing is said. A card's corner states the card's own state, never a press's answer — the kit's map is its vocabulary — and a card whose condition has no corner says it in the strip's one word (`Not read` while the card's read fails). The room keeps the section's own conditions — an unwritable row, a team service that is not mounted. Every sentence a fault needs beyond that word stands in the console: a card whose lines come and go with a press changes its height, and its own room is fixed. The two do not swap places, and a second place for the answer is a new element. The strip stands at the head's right edge: the title takes the growing space, or the section pushes the strip with its own declaration.
- **Loading.** A card that arrives after the read stands in the same shape while it loads, so the answer moves no box.
- **Live value.** A control reports the row the platform holds, not a copy; a write is followed by a read, and a failed write is said in words and followed by the live read again.
- **On/off.** A control that reports a choice is the answer itself: a checked box says on, an unchecked one off, and a toggle's thumb stands at the end its state names — so no mark stands beside the control and no `set`/`not set` sentence is drawn. The control reports the row the platform holds, never an optimistic copy: a press waits for the write, and a failed write leaves the control at the platform's value, with `Not saved` in the card's strip and its reason in the console. A check is on only when its own flag and the shared selection agree; a selection left behind by an explicitly off flag is stale, while an unread flag is unknown and writes nothing. A control that cannot be read is disabled and says its condition in words; a missing credential is said where the credential stands — the connection's dot and the empty field it fills — not by a sentence beside a control that cannot use it, and a stale shared selection is cleared on the section's read so the default stands. A page keeps the control it draws: a check is not redrawn as a toggle, or the reverse, without the user's word.
- **The set is the list.** Every shared element stands in this section with its class and its role — a sheet, a control, the status surface, the answer strip, the tones, the card frame, the section head. A class a section wears and its own sheet does not define is shared: it stands in the entry's sheet or the kit, and it joins this list in the same change that adds it; the approval is named where the work is recorded — the step, the spec, the commit message — so a reader sees an approved element and an invented one apart. A class only its own section's sheet defines and wears is the section's own: it stands in that sheet and not here. The entry's page frame is the entry's own.
- **A new class.** A shared class is a new element: it is proposed with the element, and once approved it stands in the entry's sheet or the kit and in this list. A class only its own section's sheet defines and wears is that section's own and is not proposed. A class used without a sheet is a defect; the check fails on one, except the marker classes it reports.
- **Before editing:** which element of the set draws this? Is it the same card or a new subject? Does its loading state keep the card's shape? Is it disabled or failed in words? Does it read the live value? Which element draws the answer to its press? Is anything here an element the set does not name?

## The section seat

The entry registers `main` with one child: `coreness.section`, a root list. A chunk registers into it:

```js
ctx.slots.inject('coreness.section', () => ctx.slots.register({
  name: 'coreness.section', id: 'mcp', order: 10,
  label: () => t('section'), locale: 'coreness.mcp',
}, McpSection))
```

The rail is the seat's rows by order. An empty seat draws the page's own empty state; no fake section stands in for one that did not arrive.

## Install

The package is installed through the bundle, not by itself: `packages/bundle` depends on it by `"@coreness/ui": "file:../ui"`. The scratch install and the probe live in the repository's `scripts/`.

## Checks

The set's machine-checked part is `node scripts/check-ui-set.mjs`: the type pairs, the class homes and each section's dictionary; the served ids are the check's own input.
