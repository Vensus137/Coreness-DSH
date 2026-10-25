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


      /**
       * The press that asks the vendor about the value that stands.
       *
       * Nothing is written: the answer is news and nothing else. It is the second moment this check runs — the
       * first is a write — and it exists because a value goes bad *after* it was stored: without it the only way
       * to ask would be to write the same value again.
       */
      async function verifyToken({ view, setBusy, setNote }) {
        setBusy('verify');
        setNote(null);
        try {
          setNote(shared.verdictNote(await shared.askVerify(), shared.credentialWord(view?.credential)));
        } catch (error) {
          /* The press that exists to ask the vendor is the one that must not fail silently: the section's own
             note carries the word and the console carries the reason. */
          const said = shared.reasonOf(error);
          kit.statusDetail(t('status.subject.token'), t('detail.unsettled', { reason: said }));
          setNote({ where: 'credential', value: 'unanswered', detail: said });
        } finally {
          setBusy(null);
        }
      }

      /**
       * The token: written through the store, then read back through the store, and then put to the vendor.
       */
      async function saveToken({ view, field, setBusy, setField, setNote, read }) {
        if (view === null || view.ref === null) return;
        /* An empty field is not a write: the button stands disabled while the field is empty, so this guard is
           the second door of the same rule — a stray keypress writes nothing. */
        if (field === '') return;
        setBusy('token');
        setNote(null);
        try {
          let outcome;
          try {
            outcome = await shared.saveCredential(ctx.remote, view.ref, field);
          } catch (error) {
            setNote({ where: 'credential', value: 'unsaved', detail: `${t('fault.set')} — ${shared.reasonOf(error)}` });
            return;
          }
          setField('');
          /* One read answers both questions. The strip's word and the word beside the field are drawn from the
             same answer about the same reference, so the card cannot say two things at once — and it is read
             *after* the write, because the verdict is stamped with the word this answer gives: stamped with the
             older one it would be dropped by its own effect the moment it was drawn. A read that fails here is
             the read's failure, not a store refusal. */
          let after;
          try {
            after = await read();
          } catch (error) {
            const said = shared.reasonOf(error);
            kit.statusDetail(t('status.subject.token'), `${t('state.failed')}: ${said}`);
            setNote({ where: 'credential', value: 'unread', detail: said });
            return;
          }
          /* What the store did and what the vendor says are two facts, and the reader handed the value over to
             learn the second: the store's own word stands first, and the verdict replaces it. No check runs where
             the store did not take the value — there is nothing to put to anyone. */
          if (outcome.fault !== null) {
            setNote({ where: 'credential', value: 'unsaved', detail: outcome.fault });
            return;
          }
          const took = after.credential?.configured === true;
          /* A note about a value lives while that value stands: the stamp is the word this write read back, the
             same word the effect below compares against, so the note dies exactly when a later read contradicts it
             and not before. */
          setNote(took
            ? { where: 'credential', value: 'saved', stamp: shared.credentialWord(after.credential) }
            : { where: 'credential', value: 'unsaved', detail: t('fault.notsaved') });
          /* The write is over and the check begins: the press that says "saving" is not the press that is asking
             the vendor, and the control a reader watches while the exchange is on the wire is the check's own —
             one busy, and its word stands on the control that answers for it. */
          if (took) {
            setBusy('verify');
            try {
              setNote(shared.verdictNote(await shared.askVerify(), shared.credentialWord(after.credential)));
            } catch (error) {
              const said = shared.reasonOf(error);
              kit.statusDetail(t('status.subject.token'), t('detail.unsettled', { reason: said }));
              setNote({ where: 'credential', value: 'unanswered', detail: said });
            }
          }
        } finally {
          setBusy(null);
        }
      }

      /** The clear: the store's own door, and the same confirmation — the state read back. */
      async function clearToken({ view, setBusy, setNote, read }) {
        if (view === null || view.ref === null) return;
        setBusy('token');
        setNote(null);
        try {
          let outcome;
          try {
            outcome = await shared.clearCredential(ctx.remote, view.ref);
          } catch (error) {
            setNote({ where: 'credential', value: 'unsaved', detail: `${t('fault.clear')} — ${shared.reasonOf(error)}` });
            return;
          }
          /* The same one read: the clear is confirmed by the state the section reads back, and the strip says
             what that answer says — never the call's own word about itself. A read that fails here is the read's
             failure, not a store refusal. */
          let after;
          try {
            after = await read();
          } catch (error) {
            const said = shared.reasonOf(error);
            kit.statusDetail(t('status.subject.token'), `${t('state.failed')}: ${said}`);
            setNote({ where: 'credential', value: 'unread', detail: said });
            return;
          }
          if (outcome.fault !== null) setNote({ where: 'credential', value: 'unsaved', detail: outcome.fault });
          else if (after.credential?.configured === true) setNote({ where: 'credential', value: 'unsaved', detail: t('fault.notcleared') });
          else setNote({ where: 'credential', value: 'unset', stamp: shared.credentialWord(after.credential) });
        } finally {
          setBusy(null);
        }
      }

      return { credentialCard, verifyToken, saveToken, clearToken };

    }

    return { create };
  },
});
