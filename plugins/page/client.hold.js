/**
 * How long a press's answer stands: one number, one copy, for the whole page.
 *
 * A temporary answer — a status, a confirmation, a refusal — is news of a press, and news goes: the reader
 * asked for it, read it, and the room it took is needed again. Every such answer on the page lives this many
 * milliseconds, and this file is the only place the number is written down. It lives in a chunk of its own
 * because every section that draws such an answer is a chunk of its own and none of them can reach another's
 * module: the MCP roster, the Qoder card and the Rate limiter's cards pull this file the way any sibling chunk
 * beside the entry is pulled, materialised once for the whole package. The list is not kept by hand: the batch
 * derives the chunks that draw an answer room and names any that does not pull this file, so a section that
 * arms nothing is red by name rather than silent.
 *
 * The number is a choice and it is written here rather than implied: the platform's own manager holds a
 * success for 4000 ms and a refusal for `min(8000, max(3000, 80 × characters))`, long enough to read a failure
 * that names what broke; the user's rule is that it is the same everywhere, and 3–5 s is the range he allows;
 * **3000 ms is taken, named by the user in words** — the bottom of the range, because an answer is read in
 * the corner of the eye and not studied. The price is named with it: a refusal carrying the vendor's whole
 * phrase (`400 {"errorCode":"BadRequest",…,"requestId":"…"}`) goes sooner than a slow reader finishes it, and
 * that is accepted deliberately, because a refusal's reason stands in the row's or the section's own state as
 * well and not only in this strip.
 *
 * A state is not this: `enabled`, `Connected: … · 15 models`, a verdict about a value that stands as long as
 * the value stands — those are drawn as states and never expire.
 */
window.__ModuleLoader__.load({
  id: '@coreness/dsh/client.hold.js',
  factory: () => {
    /**
     * How long every temporary answer on this page stands, in milliseconds.
     *
     * One number for a success and for a refusal alike: two numbers were two formulas, and the page said the
     * same kind of thing for different lengths of time in different sections.
     */
    const NOTE_HOLD_MS = 3000;

    /** How long this answer stands: the one number, asked once. */
    const holdOf = () => NOTE_HOLD_MS;

    return { NOTE_HOLD_MS, holdOf };
  },
});
