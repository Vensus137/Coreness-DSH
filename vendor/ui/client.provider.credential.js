/**
 * The Qoder section's connection card: the token written once, the clear, the vendor's check, and the node
 * row that rides in the same card.
 *
 * A package-local part of `client.provider.js`, pulled by it with `require.async` and created before the
 * section is seated. The card is drawn from the section's picture alone: the head, the field and the three
 * presses are the card's, and the acts that answer them are the section's, handed in.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.provider.credential.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The card's own drawing, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /**
       * The connection card: the card's head from the section's one head maker, the token field and its
       * three presses, and the node row the node's own part draws.
       * @param {object} view the section's picture
       * @param {object} act the section's acts
       * @param {Function} headOf the section's own head maker, closed over the picture
       * @param {object|null} headFact the newer fact of the two subjects this card carries
       * @param {boolean} writable whether this profile may write through the row it read
       */
      function credentialCard(view, act, headOf, headFact, writable) {
        const state = view.view;
        const nodeRow = shared.nodeRow(view, act);
        return h('div', { key: 'credential', className: 'coreness-qoder-card' }, [
          /* The card's one status carries the word alone: a sweep's answer stands in the
             corner while it is the newer fact, and the dot beside the card's name is the connection's own. */
          headOf('credential', t('credential.label'), [], headFact),
          state.ref === null ? null : h('div', { key: 'field', className: 'coreness-field coreness-qoder-field' }, [
            h('label', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('field.token')),
            h('input', {
              key: 'input',
              className: 'coreness-qoder-input coreness-field coreness-field-box',
              type: 'password',
              value: view.field ?? '',
              disabled: view.busy !== null || !writable,
              'aria-label': t('field.token'),
              placeholder: t('field.placeholder'),
              autoComplete: 'off',
              onChange: (event) => act.patch(event.target.value),
            }),
          ]),
          state.ref === null ? null : h('div', { key: 'actions', className: 'coreness-qoder-actions' }, [
            /* An empty field is not a write, so the button is off rather than ready to say so. */
            h('button', {
              key: 'save',
              type: 'button',
              className: 'coreness-qoder-button coreness-button',
              'data-tone': 'primary',
              disabled: view.busy !== null || !writable || (view.field ?? '') === '',
              onClick: () => act.save(),
            }, view.busy === 'token' ? t('savingToken') : t('saveToken')),
            h('button', {
              key: 'clear',
              type: 'button',
              className: 'coreness-qoder-button coreness-button',
              disabled: view.busy !== null || !writable || state.credential?.configured !== true,
              onClick: () => act.clear(),
            }, view.busy === 'token' ? t('clearingToken') : t('clearToken')),
            /* The value that stands can be asked about again: a token goes bad after it was written, and
               without this press the only way to ask would be to write the same value over itself. It asks
               the vendor and writes nothing, and it is off while the section is busy — and off where the row
               names no reference at all, because then there is nobody to ask about (`credential.noplace`). */
            h('button', {
              key: 'verify',
              type: 'button',
              className: 'coreness-qoder-button coreness-button',
              disabled: view.busy !== null || state.ref === null,
              onClick: () => act.verify(),
            }, view.busy === 'verify' ? t('token.checking') : t('token.check')),
          ]),
          nodeRow,
          /* One card carries the connection and the node its requests go to: the corner states the newer of the
             two facts, and the row carries the address, the dot that says whether it answers, and the press. */
        ]);
      }

      return { credentialCard };
    }

    return { create };
  },
});
