/**
 * The chunk that carries the page's status surface: a card's sentence, a connection's dot, and the door a
 * reason the face may not carry leaves by.
 *
 * A package-local chunk beside the entry, pulled on demand, one arrival per file however many sections ask
 * for it. It registers no section, so it is not one of the entry's `CHUNKS` — those are applied — and it
 * carries the shape of the other library chunk beside the entry.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.kit.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/ui';
    const STYLE_TAG = '@coreness/ui/client.kit.js';
    const STYLE_ID = 'coreness-ui-status-style';

    /**
     * The one map: a value is a word and a tone, and this is the only place either of them is written.
     *
     * `{subject}` is the card's own one word for what its status is about — `Token`, `Node`, `Server`,
     * `Limit`, `Usage`, `Page`. It is never the credential reference and never a path: a fact about
     * this configuration is not a fact about the reader's token. One sentence at most, short enough to
     * stand on one line, and no value names an act: what is true after a clear is that nothing is
     * stored, which is `unset`, and the act itself is a line in the console rather than a word here.
     */
    const STATUS_WORDS = {
      loading: { words: '{subject} is loading', tone: 'plain' },
      unset: { words: '{subject} is not set', tone: 'plain' },
      set: { words: '{subject} is set', tone: 'plain' },
      /* The outcome family says the page's own words and **carries no subject**: `Saved` and `Not saved` are the
         same words on every card, because an outcome is about the press and not about the card it was made in —
         the user's own ruling, and the words the chunks already say. Every other entry is a **state** the corner
         says, not an outcome and not a verdict: it keeps the card's subject, and a verdict's short word belongs
         to the strip as the section's own, its tone to the mark's table rather than a sentence here. */
      saved: { words: 'Saved', tone: 'done' },
      unsaved: { words: 'Not saved', tone: 'fault' },
      unwritable: { words: '{subject} cannot be changed here', tone: 'fault' },
      unread: { words: '{subject} was not read', tone: 'fault' },
    };

    /* The two tones of the map above, and the page's own tone class each one wears:
       the word stays this component's — the instruments read it in `data-tone` — and the colour of a state's
       sentence stands once in the page's sheet. `plain` has no entry: it paints what it painted before. */
    const TONE_CLASS = { done: ' coreness-tone-done', fault: ' coreness-tone-fault' };

    /**
     * The mark's own tone: **a connection's states**, and the one place the dot's colour is written.
     *
     * None stored — grey, the map's own `plain`; something stored — green, the divergence named here (`set`'s
     * sentence stays plain in the map); something wrong — red, and a store's fault already red. The two
     * verdicts name their tone here too: their word is the strip's, out of the section's dictionary, so the
     * map keeps no sentence of theirs and the dot says the verdict by colour alone. A value this table does
     * not name keeps the tone of the entry its word is drawn from, so `unread` stays red beside the address
     * it belongs to.
     */
    const MARK_TONES = { set: 'done', accepted: 'done', refused: 'fault' };

    /** The sentence of one value, with the card's own subject in it, or null for a value nobody holds. */
    function statusWord(subject, value) {
      const entry = STATUS_WORDS[value];
      if (entry === undefined) return null;
      return entry.words.replace('{subject}', subject);
    }

    /**
     * The one door to the console: where a reason goes when the face may not carry it.
     *
     * The panel's law is that nothing is muted — what the reader cannot act on stays visible where a
     * reader who needs it looks, and the browser's own console is that place for this half of the
     * plugin. It is called where the answer arrives and not where the status is drawn, so a press that
     * learned nothing is said every time it was made, never only on the first.
     */
    function statusDetail(subject, reason) {
      if (reason === undefined || reason === null || reason === '') return;
      console.warn(`${PACKAGE} · ${subject} · ${reason}`);
    }

    /**
     * The one drawing: the sentence alone, out of one entry of `STATUS_WORDS`.
     *
     * It is a plain function and not a component, because that is how this page draws: the chunks call
     * their drawing functions and hand the elements to React, and the page's own checks materialise a
     * chunk and read the element tree it returns — a component element is a node nobody renders there,
     * which is how a status that *is* drawn gets read as a status that is missing.
     *
     * **The corner carries a word and draws no mark.** A dot in the corner said nothing a reader could
     * act on — it was the same colour as the word beside it — and it stood on every card, including the
     * ones whose subject is not a connection at all. The mark belongs beside the name of the thing it is
     * about, which is what `statusMark` below draws.
     *
     * `data-status` names the value and `data-tone` is the entry's own tone; there is no other way to
     * give this element a colour. `title` carries nothing: a tooltip is the face as well, and every
     * reason this page keeps is in the console through `statusDetail`.
     *
     * A value the map does not hold is nothing to state: the guard is one place (an own key, so a name the
     * object inherits is not a state either), and after it the entry is a fact of the map and needs no
     * second test anywhere below.
     */
    function statusNode({ subject, value, data }) {
      const entry = Object.hasOwn(STATUS_WORDS, value) ? STATUS_WORDS[value] : undefined;
      /* Nothing to state is nothing drawn: an element with a place and no words is a reserved box, and the
         page keeps no reserved boxes. A card that states nothing carries no status at all. */
      if (entry === undefined) return null;
      return h('span', {
        className: 'coreness-status' + (TONE_CLASS[entry.tone] ?? ''),
        'data-status': value,
        'data-tone': entry.tone,
        role: 'status',
        'aria-live': 'polite',
        ...data ?? {},
      }, statusWord(subject, value));
    }

    /**
     * The connection's mark: **one dot, beside the name of the thing it is about** — a connection, a provider,
     * a node — and never in the corner, never on a save, never on a node's answer.
     *
     * Its tone is the mark's own (`MARK_TONES`): none stored — grey, something stored — green, something
     * wrong — red. Every other value keeps the tone of the entry its word comes from, so the dot beside a
     * refusal stays red and the dot beside the node's own answer green.
     *
     * **A dot a reader cannot see is a state a reader cannot read.** Where no word of the same entry stands
     * beside it — the two states that draw no word at all — the mark carries that entry's own word as its
     * accessible name (`role="img"`), so the head reads «Connection, Token is set»: one owner and no new word.
     * Where the corner already says that same state — a fault keeps its word, an outcome its own — the mark is
     * `aria-hidden`, because a dot read out beside the word that answers for it is the same fact twice.
     * `spoken` is that fact, handed over by the caller, which is the only one that knows what stands beside.
     *
     * A value only the mark's table names — a verdict — has no word here at all: the dot draws and says
     * nothing, because the strip beside it carries the word.
     */
    function statusMark(value, data) {
      const entry = Object.hasOwn(STATUS_WORDS, value) ? STATUS_WORDS[value] : undefined;
      const ownTone = Object.hasOwn(MARK_TONES, value);
      /* A mark for a value neither table holds draws nothing: the dot's tone is the mark's, and a dot with
         no state behind it is a claim nobody made. */
      if (entry === undefined && !ownTone) return null;
      const { subject, spoken, ...rest } = data ?? {};
      const word = entry === undefined ? null : statusWord(subject, value);
      const tone = ownTone ? MARK_TONES[value] : entry.tone;
      /* A mark whose state the corner already says in words — or that has no word at all — is not said. */
      const speaks = spoken !== true && subject !== undefined && word !== null;
      return h('span', {
        className: 'coreness-status-mark',
        'data-tone': tone,
        ...(speaks ? { role: 'img', 'aria-label': word } : { 'aria-hidden': 'true' }),
        ...rest,
      });
    }

    /** The sheet's hold, called once where a section that draws this stands — the page's own rule. */
    function useStyles() {
      React.useEffect(() => {
        let stands = true;
        const put = () => {
          if (stands) ensureStyles();
        };
        put();
        const watcher = new MutationObserver(put);
        watcher.observe(document.head, { childList: true });
        return () => {
          stands = false;
          watcher.disconnect();
        };
      }, []);
    }

    /** The one sheet of this surface as a tag: put in once, and never removed by this code. */
    function ensureStyles() {
      if (document.getElementById(STYLE_ID) !== null) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.setAttribute('data-plugin', PACKAGE);
      style.setAttribute('data-plugin-css', STYLE_TAG);
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    /**
     * The sheet. The place rule (`margin-left:auto` together with the row's own last place, `order:1`), the
     * reservation the page's own law asks for (no fixed height, the sentence wraps inside its own room, the
     * text whole in the DOM) and the three tones live here and nowhere else: a status is right-aligned on
     * every card because this rule says so, not because five sections each say so.
     *
     * The last place is declared here rather than left to the order a head happens to be drawn in: an auto
     * margin takes the free space **before the next sibling**, so a head that draws anything after the state
     * — the page's own answer strip, whose room is reserved at a fixed width — leaves the state short of the
     * card's right edge by exactly that room and the row's gap, at every width and whichever chunk drew the
     * head.
     */
    const CSS = `
.coreness-status{box-sizing:border-box;order:1;margin-left:auto;flex:0 1 auto;display:inline-flex;align-items:center;min-width:0;max-width:60%;text-align:right;font-size:12px;line-height:18px;overflow-wrap:anywhere;color:var(--dsw-alias-label-tertiary)}
.coreness-status-mark{box-sizing:border-box;corner-shape:round;border-radius:50%;flex:none;width:8px;height:8px;display:inline-block;background:var(--dsw-alias-label-tertiary)}
/* The status word's two tones stand once in the entry's sheet — coreness-tone-done and coreness-tone-fault,
   worn beside this class — because the word is one of the state's sentences the page paints. The mark's own two
   are this element's: a background is another subject, and a dot's colour is not a sentence's. */
.coreness-status-mark[data-tone='done']{background:var(--dsw-alias-state-success-primary)}
.coreness-status-mark[data-tone='fault']{background:var(--dsw-alias-state-error-primary)}
`;

    return { statusNode, statusMark, useStatusStyles: useStyles, STATUS_WORDS, statusDetail };
  },
});
