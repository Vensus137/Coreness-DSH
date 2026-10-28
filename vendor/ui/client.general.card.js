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

    /** The section as it draws: one picture, one set of acts, and the card the page carries. */
    function draw(state, act) {
      const head = h('div', { key: 'head', className: 'coreness-sectionHead' }, [
        h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('section')),
      ]);
      const { value, draft, note, busy, prompt, promptBusy, promptFault, beatFault, readFault } = state;
      const loading = state.status === 'loading';
      /* A background read disables nothing: it corrects the picture that already stands behind the card. */
      const editable = !loading && value?.editable === true && readFault !== true;
      const writing = busy || promptBusy;
      /* A fault is the strip's word, never a line of its own: the strip stands in the card head with its room
         kept, so a read that failed says "Not read" without moving the page; the reason is said in the console,
         where a reader who has to act on it looks. The card's own conditions take the same room — one phrase,
         no line that appears at the read — so the card keeps its shape either way. The team's condition names
         the act that ends it rather than the platform's state: a profile without the team service has nothing
         to write here, and a reader learns what to do where the word stands. The profile's editor being unable
         to address the row is a different condition and keeps its own word. */
      const condition = value?.mounted === false
        ? words('team.off')
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
        ])]),
      ]);
    }

      return { draw };
    }

    return { create };
  },
});
