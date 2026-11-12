/**
 * The general section's card: the head, the two switches and their hints — drawn from the section's
 * picture alone, with the section's words in hand.
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

    /** The section as it draws: one picture, one set of acts, the team's card and the cards the section's
     * other parts hand in — one list, so every card stands on the page's own rhythm. */
    function draw(state, act, more = []) {
      const head = h('div', { key: 'head', className: 'coreness-sectionHead' }, [
        h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('section')),
      ]);
      const { value, note, prompt, promptBusy, promptFault, beatFault, readFault } = state;
      const loading = state.status === 'loading';
      /* The team's condition names the act that ends it rather than the platform's state: a composition
         without the team service has nothing to switch here, and a session whose Team mode is off has no
         policy to patch — with the switch on and the last patch outcome `off`, the card says what to enable.
         The two switches are the product's own fields, so the card draws them whenever the composition
         addresses their row — a failed read of the route keeps the row it drew and says so in the strip. */
      const teamOff = value?.mounted === false || (value?.policy === 'off' && prompt?.on === true);
      const condition = teamOff ? words('team.off') : null;
      const stripNote = note ?? (promptFault || beatFault || readFault
        ? { tone: 'fault', text: words('state.unread') }
        : condition === null ? null : { tone: 'plain', text: condition });
      /* The switches stand while the card is read, after a row was found, and after a read failed — a
         failed read is said in the strip and keeps the rows it drew; only a composition that addresses no
         row hides them, and the card does not grow a control it drew no place for. */
      const switchStands = loading || prompt !== null || promptFault === true || readFault === true;
      /* A background read disables nothing: it corrects the picture that already stands behind the card. */
      const switchReady = !loading && readFault !== true && prompt !== null && promptFault !== true;
      const writing = promptBusy === true;
      return h('div', { className: 'coreness-still coreness-sectionBody', 'data-state': loading ? 'reading' : state.status === 'failed' ? 'failed' : 'ready' }, [
        head,
        h('ul', { key: 'cards', className: 'coreness-list coreness-card-list' }, [h('li', { key: 'card', className: 'coreness-card-box' }, [
          h('div', { key: 'cardhead', className: 'coreness-card-head coreness-general-head' }, [
            h('h4', { key: 'title', className: 'coreness-sectionTitle' }, words('team.title')),
            answerStrip(stripNote),
          ]),
          h('div', { key: 'body', className: 'coreness-card-body' }, [
            switchStands ? h('label', { key: 'check', className: 'coreness-check' }, [
              h('input', {
                key: 'box',
                type: 'checkbox',
                checked: prompt?.on === true,
                disabled: !switchReady || writing,
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
                disabled: !switchReady || writing,
                onChange: (event) => act.review(event.target.checked),
              }),
              h('span', { key: 'word' }, words('team.review')),
            ]) : null,
            switchStands ? h('p', { key: 'reviewHint', className: 'coreness-dim' }, words('team.reviewHint')) : null,
          ]),
        ]), ...more]),
      ]);
    }

      return { draw };
    }

    return { create };
  },
});
