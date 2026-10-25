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
        'data-note': 'head',
        'data-tone': note === null ? undefined : note.tone,
        role: 'status',
        'aria-live': 'polite',
      }, note === null ? '' : note.text);
    }

    /** The section as it draws: one picture, one set of acts. */
    function draw(state, act, kit) {
      const head = h('div', { key: 'head', className: 'coreness-sectionHead' }, [
        h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('section')),
      ]);
      if (state.status === 'failed') {
        return h('div', { className: 'coreness-still coreness-sectionBody', 'data-state': 'failed' }, [
          head,
          h('div', { key: 'fault', className: 'coreness-failed' }, [
            h('p', { key: 'word', className: 'coreness-dim' }, words('state.error')),
          ]),
        ]);
      }
      const { value, draft, note, busy, prompt, promptBusy, promptFault, beatFault, readFault } = state;
      const loading = state.status === 'loading';
      const editable = !loading && value?.editable === true && state.refreshing !== true && readFault !== true;
      const writing = busy || promptBusy || state.refreshing === true;
      /* A fault is the strip's word, never a line of its own: the strip stands in the card head with its room
         kept, so a read that failed says "Not read" without moving the page; the reason is said in the console,
         where a reader who has to act on it looks. */
      const stripNote = note ?? (promptFault || beatFault || readFault ? { tone: 'fault', text: words('state.unread') } : null);
      /* The switch's row stands while the card is read and after a row was found: a composition that addresses
         no row hides it, but the card does not grow a control it drew no place for. */
      const switchStands = loading || prompt !== null;
      return h('div', { className: 'coreness-still coreness-sectionBody', 'data-state': loading ? 'reading' : 'ready' }, [
        head,
        h('div', { key: 'card', className: 'coreness-card-box coreness-general-card' }, [
          h('div', { key: 'cardhead', className: 'coreness-card-head coreness-general-head' }, [
            h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('team.title')),
            answerStrip(stripNote),
          ]),
          h('div', { key: 'body', className: 'coreness-card-body' }, [
            /* A card that is still reading says so: the disabled controls below are places, not claims. */
            loading ? h('p', { key: 'reading', className: 'coreness-dim' }, words('team.reading')) : null,
            h('div', { key: 'field', className: 'coreness-field' }, [
              h('div', { key: 'label', className: 'coreness-fieldLabel coreness-general-label' }, [
                h('label', { key: 'word', htmlFor: 'general-ceiling' }, words('team.field')),
              ]),
              h('div', { key: 'row', className: 'coreness-general-field' }, [
                h('input', {
                  key: 'input',
                  id: 'general-ceiling',
                  className: 'coreness-general-input',
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
            switchStands ? h('label', { key: 'check', className: 'coreness-check coreness-general-check' }, [
              h('input', {
                key: 'box',
                type: 'checkbox',
                checked: prompt?.on === true,
                disabled: !editable || writing,
                onChange: (event) => act.prompt(event.target.checked),
              }),
              h('span', { key: 'word' }, words('team.prompt')),
              prompt?.on === true ? kit.statusMark('set', { key: 'mark', subject: words('team.prompt') }) : null,
            ]) : null,
            switchStands ? h('p', { key: 'promptHint', className: 'coreness-dim' }, words('team.promptHint')) : null,
            switchStands ? h('label', { key: 'reviewCheck', className: 'coreness-check coreness-general-check' }, [
              h('input', {
                key: 'box',
                type: 'checkbox',
                checked: prompt?.review === true,
                disabled: !editable || writing,
                onChange: (event) => act.review(event.target.checked),
              }),
              h('span', { key: 'word' }, words('team.review')),
              prompt?.review === true ? kit.statusMark('set', { key: 'mark', subject: words('team.review') }) : null,
            ]) : null,
            switchStands ? h('p', { key: 'reviewHint', className: 'coreness-dim' }, words('team.reviewHint')) : null,
            value?.mounted === false ? h('p', { key: 'unmounted', className: 'coreness-dim' }, words('team.missing')) : null,
            loading || editable ? null : h('p', { key: 'unavailable', className: 'coreness-dim' }, words('team.unavailable')),
          ]),
        ]),
      ]);
    }

      return { draw };
    }

    return { create };
  },
});
