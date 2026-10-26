---
id: deck
kind: presentation
allowed: [title, statement, points, split, data, quote, steps, closing]
required: [title, closing]
order: [title, statement, points, quote, split, data, steps, closing]
stack: [title, statement, points, quote, data, steps, closing]
---

A presentation of five to nine screens, one claim per screen, that opens from a folder by double-click.

The first slide is always `title` and the last always `closing`. `data` appears at most once, `quote` at most twice; `title` and `closing` appear once each. No two dense layouts are adjacent, and a dense slide (`points`, `split`, `data`) is followed by a sparse one or by `steps`.

Canonical orders:

- five slides: `title`, `statement`, `data`, `steps`, `closing`;
- seven slides: `title`, `statement`, `points`, `quote`, `data`, `steps`, `closing`;
- nine slides: `title`, `statement`, `points`, `quote`, `split`, `quote`, `data`, `steps`, `closing`.

Other counts must satisfy the rules above rather than a fixed list. The content arc is the reader's problem, what changes, how it works in three steps, one proof, and who acts and how — as content, never as a new layout.

Content requirements:

- One claim per screen, readable without audio. A line that does not fit is cut, never shrunk: the type scale is fixed at the design canvas.
- Every number carries its source; there is no count-up, timer, axis or invented metric. `data` is exactly one number with one source.
- A quotation is verbatim with a real attribution; `points` and `steps` labels are real ordinals only when the content is a sequence, and a label marks every item or none.
- `title.lead` carries a real support line (a place, a date); `closing.line` is the next action or the name. No "Thank you", no agenda, no second title.
