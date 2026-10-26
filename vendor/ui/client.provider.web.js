/**
 * The Qoder section's web switch: one card, one checkbox, one footnote, no fields and no test controls.
 *
 * The card reports the live `web` row and the Qoder row's `webAccess.enabled` rather than a second
 * selection kept in the Qoder row: both providers must name `qoder` and the flag must be on, because
 * the flag is what makes the registered providers usable. The writes follow the documented order: the flag first when turning on, the two
 * provider values first when turning off. The row is read as part of the section's own settings read
 * (`readState`), so the platform's `settings/document-updated` refreshes the box with no second watcher;
 * `readWeb` exists for the one thing a write needs that a render does not: a fresh revision.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.provider.web.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    function create({ t, shared }) {
      const WEB_NS = 'web';

      /**
       * The web row out of a settings answer, in the one shape the card and a write both read.
       * @param {object} value the `settings/describe` value
       * @returns {object} the row, or the fault that stands in its place
       */
      function rowOf(value) {
        const row = (value?.namespaces ?? []).find((one) => one.ns === WEB_NS);
        if (row === undefined) return { ok: false, fault: t('web.unread') };
        return {
          ok: true,
          ns: row.ns,
          revision: row.revision,
          writable: value?.writable === true,
          value: row.value ?? {},
        };
      }

      /**
       * A fresh web row for a write: the revision a render holds may have moved under a platform save.
       * @param {object} remote the page's remote
       * @returns {Promise<object>} the row, or the fault
       */
      async function readWeb(remote) {
        const described = await remote.settings.describe();
        if (!described.ok) return { ok: false, fault: described.error?.message ?? t('web.unread') };
        return rowOf(described.value);
      }

      /** Whether both provider values name Qoder. */
      function checkedOf(value) {
        return value !== null && value !== undefined
          && value.searchProvider === 'qoder' && value.fetchProvider === 'qoder';
      }

      /**
       * The web card: one head, one status, one checkbox and the footnote the spec asks for.
       *
       * The switch is the answer itself: a checked box says on, an unchecked one off, and a failed write
       * leaves the box on the value the platform holds. The card's corner states a condition the box cannot
       * — a row that could not be read, a read-only row — and the press's word stands in the card's strip,
       * its reason in the console. A token nobody wrote is not this card's sentence: the box stands off and
       * disabled, and the connection card's empty field and its dot say why.
       * @param {object} view the section's picture
       * @param {object} act the section's acts
       * @param {Function} headOf the section's own head maker
       * @returns {object} the card element
       */
      function webCard(view, act, headOf) {
        const state = view.view;
        const web = state?.web;
        const selected = web?.ok === true && checkedOf(web.value);
        /* A token nobody wrote is the one reason the switch cannot be used even when the row is
           writable: selecting Qoder without it would leave the platform with an unavailable provider.
           The box shows off and disabled, and the section's read clears a stale Qoder selection in the
           shared row. */
        const tokenMissing = state?.ref === null || state?.ref === undefined
          || state?.credential?.configured !== true;
        const checked = selected && state?.webEnabled === true && !tokenMissing;
        const readFailure = view.status === 'failed' && view.view !== null ? view.reason : null;
        const disabled = view.webBusy === true || readFailure !== null || web?.ok !== true || web?.writable !== true || tokenMissing;
        return h('li', { key: 'web', className: 'coreness-card-box' }, [
          headOf('web', t('web.title')),
          h('div', { key: 'body', className: 'coreness-card-body' }, [
            h('label', { key: 'row', className: 'coreness-check' }, [
              h('input', {
                key: 'box',
                type: 'checkbox',
                checked,
                disabled,
                onChange: (event) => act.toggleWeb(event.target.checked),
              }),
              h('span', { key: 'label' }, t('web.label')),
            ]),
            h('p', { key: 'foot', className: 'coreness-dim' }, t('web.footnote')),
          ]),
        ]);
      }

      return { readWeb, webRowOf: rowOf, checkedOf, webCard };
    }

    return { create };
  },
});
