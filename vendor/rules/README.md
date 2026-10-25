# @coreness/rules

The rules of this product's tree, in the one place a compaction cannot take them out of the model's sight: the platform's assembled prompt.

## Why a prompt section

A rule that must hold without a reader acting cannot live in a document: the document is read when someone opens it, and a compaction takes the span it stood in away. The platform's `systemPrompt` registry is rebuilt for every request, so the rules are registered there as one section, `coreness:rules`, at order 700 with interpolation off — the slot between the platform's policies (500–600) and its tool guides (from 800).

The text is `src/section.md` beside this module, read at the mount: a change to a rule is a reload of the row. There is no copy in the module; the file is the one home. The trailing newline is layout and is trimmed. An empty or whitespace-only file is refused at the mount in words — the registry would drop an empty section in silence, and the rules would be absent without a line saying so.

## The text

The five rules stand in `src/section.md` and nowhere else — this README does not carry them, not even in summary, because a second copy is the drift the section exists to end.

## The row

`src/index.js` exports the row (`name = 'coreness-rules'`, `inject = ['systemPrompt']`), the section (`SECTION = 'coreness:rules'`), the order (`ORDER = 700`), the text path (`TEXT`), the config (one knob, `order`, default 700), `textOf` and `apply`. The mount registers the section and logs its name, order, character count and line count. A composition without `systemPrompt` leaves the row pending rather than mounted over nothing.

The bundle inserts the row with no config: the order is the module's own default, and one number has one owner. A profile that wants the section elsewhere writes `order`.

## Checks

The scratch install's dump row is the fixture for the row's text, order and interpolation.
