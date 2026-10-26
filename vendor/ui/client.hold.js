/**
 * The page's own numbers: how long a temporary answer stands, and the beat the sections ask on.
 *
 * A temporary answer — a status, a confirmation, a refusal — is news of a press, and news goes: the reader
 * asked for it, read it, and the room it took is needed again. Every such answer on the page lives
 * NOTE_HOLD_MS, and this file is the only place the number is written down. It lives in a chunk of its own
 * because every section that draws such an answer is a chunk of its own and none of them can reach another's
 * module: the MCP roster, the Qoder card and the Rate limiter's cards pull this file the way any sibling
 * chunk beside the entry is pulled, materialised once for the whole package.
 *
 * The hold is 3000 ms: short enough that an answer read in the corner of the eye goes by itself, long enough
 * that a reader who looks at it has finished. A refusal's reason stands in the row's or the section's own
 * state as well, so a refusal that goes sooner costs nothing.
 *
 * A state is not this: `enabled`, `Connected: … · 15 models`, a verdict about a value that stands as long as
 * the value stands — those are drawn as states and never expire.
 *
 * The beat is the page's other shared number: a value no announcement follows is asked again on it, and the
 * sections that ask read it here rather than declaring their own.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.hold.js',
  factory: () => {
    /** How long every temporary answer on this page stands, in milliseconds: one number for a success and a refusal alike. */
    const NOTE_HOLD_MS = 3000;

    /** How often a section asks the page for a value no announcement follows, in milliseconds. */
    const BEAT_MS = 2000;

    return { BEAT_MS, NOTE_HOLD_MS };
  },
});
