/**
 * The general section's card: the head, the ceiling's field and the press, the switch and its two hints —
 * drawn from the section's picture alone, with the section's words in hand.
 *
 * A package-local part beside the page's entry: the entry pulls it with its own require.async and creates it
 * before the section is seated. The acts it is handed are the section's; it owns nothing but the drawing.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.general.card.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The card's drawing, made once over the section's words. */
    function create({ t: words }) {
    function answerStrip(note) {
      return h('span', {
        key: 'answer',
        className: 'coreness-answer',
        'data-tone': note === null ? undefined : note.tone,
        role: 'status',
        'aria-live': 'polite',
      }, note === null ? '' : note.text);
    }

    /**
     * The Page Studio card: this product's own switch, drawn in this page's frame beside the team's card.
     *
     * The section's picture carries it, and a composition that mounts no studio Host half answers no route:
     * the card then stands with its missing sentence and the box disabled rather than offering a write that
     * cannot land. Its state words are the frame's: the strip says a save, a refusal or the unread word, the
     * check is the answer, and the check row carries the page's reading line while the first read is in
     * flight, so the card stands from the first paint and the answer moves nothing.
     */
    function drawStudio(state, act) {
      const picture = state.studio;
      const ready = picture !== null && picture !== undefined;
      const fault = state.studioFault === true;
      const missing = state.studioMissing === true;
      const busy = state.studioBusy === true;
      /* A read that answers no namespace or no editor leaves the card standing and the box disabled: this
         profile cannot write the switch from the page, and its value stands in the Cordis configuration. */
      const unwritable = ready && (picture.ns === null || picture.editable !== true);
      const writable = ready && !unwritable && !fault && !missing && !busy;
      /* A failed read is the strip's word, said once; the reason is the console's. A Host half that is not
         mounted is the card's own sentence in the body and takes no strip: the switch did not fail, it is not
         here. */
      const note = state.studioNote ?? (fault && missing === false ? { tone: 'fault', text: words('state.unread') } : null);
      /* The check's word: its own name once a read answered, and the page's reading line while the first read
         is in flight — a disabled box that says what it waits for, the page's shape for a control whose read
         has not landed. A read that failed with no picture says the name, never "Reading" forever. */
      const word = ready || fault || missing ? words('studio.check') : words('studio.reading');
      return h('li', { key: 'studio', className: 'coreness-card-box' }, [
        h('div', { key: 'cardhead', className: 'coreness-card-head coreness-general-head' }, [
          h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('studio.title')),
          answerStrip(note),
        ]),
        h('div', { key: 'body', className: 'coreness-card-body' }, [
          h('label', { key: 'check', className: 'coreness-check' }, [
            h('input', {
              key: 'box',
              type: 'checkbox',
              checked: ready && picture.enabled === true,
              disabled: !writable,
              onChange: (event) => act.studio(event.target.checked),
            }),
            h('span', { key: 'word' }, word),
          ]),
          h('p', { key: 'hint', className: 'coreness-dim' }, [words('studio.description'), ' ', words('studio.cache')]),
          unwritable ? h('p', { key: 'unavailable', className: 'coreness-dim' }, words('studio.unavailable')) : null,
          missing ? h('p', { key: 'missing', className: 'coreness-dim' }, words('studio.missing')) : null,
        ]),
      ]);
    }

    /** The section as it draws: one picture, one set of acts, and the two cards the page carries. */
    function draw(state, act) {
      const head = h('div', { key: 'head', className: 'coreness-sectionHead' }, [
        h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('section')),
      ]);
      const studio = drawStudio(state, act);
      const { value, draft, note, busy, prompt, promptBusy, promptFault, beatFault, readFault } = state;
      const loading = state.status === 'loading';
      const editable = !loading && value?.editable === true && state.refreshing !== true && readFault !== true;
      const writing = busy || promptBusy || state.refreshing === true;
      /* A fault is the strip's word, never a line of its own: the strip stands in the card head with its room
         kept, so a read that failed says "Not read" without moving the page; the reason is said in the console,
         where a reader who has to act on it looks. The card's own conditions take the same room — one word, no
         line that appears at the read — so the card keeps its shape whether the team service is mounted or the
         profile's editor can address the row. */
      const condition = value?.mounted === false
        ? words('team.missing')
        : value !== null && value?.editable !== true ? words('team.unwritable') : null;
      const stripNote = note ?? (promptFault || beatFault || readFault
        ? { tone: 'fault', text: words('state.unread') }
        : condition === null ? null : { tone: 'plain', text: condition });
      /* The switch's row stands while the card is read, after a row was found, and after its read failed — a
         failed read is said in the strip and keeps the rows it drew; only a composition that addresses no row
         hides them, and the card does not grow a control it drew no place for. */
      const switchStands = loading || prompt !== null || promptFault === true || readFault === true;
      return h('div', { className: 'coreness-still coreness-sectionBody', 'data-state': loading ? 'reading' : state.status === 'failed' ? 'failed' : 'ready' }, [
        head,
        h('ul', { key: 'cards', className: 'coreness-list coreness-card-list' }, [h('li', { key: 'card', className: 'coreness-card-box' }, [
          h('div', { key: 'cardhead', className: 'coreness-card-head coreness-general-head' }, [
            h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('team.title')),
            answerStrip(stripNote),
          ]),
          h('div', { key: 'body', className: 'coreness-card-body' }, [
            h('div', { key: 'field', className: 'coreness-field' }, [
              h('div', { key: 'label', className: 'coreness-fieldLabel' }, [
                h('label', { key: 'word', htmlFor: 'general-ceiling' }, words('team.field')),
              ]),
              h('div', { key: 'row', className: 'coreness-general-field' }, [
                h('input', {
                  key: 'input',
                  id: 'general-ceiling',
                  className: 'coreness-field-box coreness-general-input',
                  type: 'number',
                  min: 1,
                  step: 1,
                  value: draft,
                  disabled: !editable || writing,
                  'aria-invalid': note !== null && note.tone === 'fault' && note.subject === 'ceiling' ? 'true' : 'false',
                  onChange: (event) => act.draft(event.target.value),
                }),
                h('button', {
                  key: 'save',
                  type: 'button',
                  className: 'coreness-button',
                  'data-tone': 'primary',
                  disabled: !editable || writing || draft.trim() === '',
                  onClick: () => act.save(),
                }, words('team.save')),
              ]),
            ]),
            /* A refusal is the strip's word ("Not saved"); the platform's sentence — an overridden row, a stale
               revision, a body the editor would not take — stands in the console, where a reader who has to act
               on it looks, and never as a line that moves the card. */
            h('p', { key: 'remark', className: 'coreness-dim' }, words('team.remark')),
            switchStands ? h('label', { key: 'check', className: 'coreness-check' }, [
              h('input', {
                key: 'box',
                type: 'checkbox',
                checked: prompt?.on === true,
                disabled: !editable || writing || promptFault === true,
                onChange: (event) => act.prompt(event.target.checked),
              }),
              h('span', { key: 'word' }, words('team.prompt')),
            ]) : null,
            switchStands ? h('p', { key: 'promptHint', className: 'coreness-dim' }, words('team.promptHint')) : null,
            switchStands ? h('label', { key: 'reviewCheck', className: 'coreness-check' }, [
              h('input', {
                key: 'box',
                type: 'checkbox',
                checked: prompt?.review === true,
                disabled: !editable || writing || promptFault === true,
                onChange: (event) => act.review(event.target.checked),
              }),
              h('span', { key: 'word' }, words('team.review')),
            ]) : null,
            switchStands ? h('p', { key: 'reviewHint', className: 'coreness-dim' }, words('team.reviewHint')) : null,
          ]),
        ]), studio].filter(Boolean)),
      ]);
    }

      return { draw };
    }

    return { create };
  },
});
