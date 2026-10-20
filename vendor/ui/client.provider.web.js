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
           The box shows off and disabled, the note says the default search stands, and the section's
           read clears a stale Qoder selection in the shared row. */
        const tokenMissing = state?.ref === null || state?.ref === undefined
          || state?.credential?.configured !== true;
        const checked = selected && state?.webEnabled === true && !tokenMissing;
        const readFailure = view.status === 'failed' && view.view !== null ? view.reason : null;
        const disabled = view.webBusy === true || readFailure !== null || web?.ok !== true || web?.writable !== true || tokenMissing;
        /* Every reason that stands is said, not only the first: a missing token keeps its sentence even
           where the row cannot be read or written, as the token rule promises. */
        const unread = web?.ok !== true ? (web?.fault ?? t('web.unread')) : null;
        const readonly = web?.ok === true && web?.writable !== true ? t('state.readonly') : null;
        const notes = [
          view.webNote,
          readFailure,
          unread,
          readonly,
          state?.webEnabled === 'unknown' && web?.ok === true ? t('web.unread') : null,
          tokenMissing ? t('web.noToken') : null,
        ].filter((one) => one !== null && one !== undefined && one !== '');
        const note = notes.length === 0 ? null : notes.join(' ');
        return h('div', { key: 'web', className: 'coreness-qoder-card' }, [
          headOf('web', t('web.title')),
          h('label', { key: 'row', className: 'coreness-check coreness-qoder-check' }, [
            h('input', {
              key: 'box',
              type: 'checkbox',
              checked,
              disabled,
              onChange: (event) => act.toggleWeb(event.target.checked),
            }),
            h('span', { key: 'label' }, t('web.label')),
          ]),
          h('p', { key: 'foot', className: 'coreness-qoder-dim coreness-dim' }, t('web.footnote')),
          note === null ? null : h('p', { key: 'note', className: 'coreness-qoder-line' }, note),
        ]);
      }

      return { readWeb, webRowOf: rowOf, checkedOf, webCard };
    }

    return { create };
  },
});
