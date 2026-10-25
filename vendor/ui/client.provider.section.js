/**
 * The Qoder section itself: the state read when it mounts, the token, the node, the models' own editor and
 * the one verdict that outlives a press.
 *
 * A package-local part of `client.provider.js`, pulled by it with `require.async` and created last, once the
 * kit, the picker, the hold and the sections' drawings are in hand. The read ticket and the picture kept
 * between mounts stand here, in this part's own closure, because this component is their only owner.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.provider.section.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The section's own life, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /** The section: the state read when it mounts, the token, the node, and the models' own editor. */
      /* Which settings read is the newest. The section has one instance on the page and the chunks carry
         no `useRef`, so the ticket lives beside the component. A read that comes back after a newer one
         has started is still handed to whoever asked for it — a caller that awaited it uses its view —
         but it no longer publishes: the section under the reader's eyes is always the newest read's, and
         a stale answer never drops the draft being typed in. */
      let readTicket = 0;

      /**
       * What this section last read, and the moment it read it.
       *
       * The browser half is materialised once per application session, so a section that is left and entered
       * again has this beside it — the same place the read ticket lives, and for the same reason: the page
       * carries no `useRef`, and the component is not the owner of the session. A mount paints it at once and
       * the read corrects it behind; the session's *first* mount has nothing and keeps the honest skeleton,
       * because a skeleton is the truth when nothing is known. It holds a read picture and never the visit's
       * own state — the draft, the open row, the news of a press — which is not knowledge of the route.
       */
      let lastRead = null;

      function QoderSection() {
        const [state, setState] = React.useState(lastRead === null ? { status: 'loading', view: null, reason: null } : lastRead.state);
        /* The section's sheet, ensured where the section is drawn: the platform's own replace re-mounts a
           plugin over the module table it already has and takes the package's style tags with it, so the mount
           is the one place a sheet can be put back. */
        shared.useStyles();
        kit.useStatusStyles();
        const [field, setField] = React.useState('');
        /* Which action is in flight, or null: the token buttons, the node press and the models write draw
           from it, and two writes never stand over one another. */
        const [busy, setBusy] = React.useState(null);
        const [note, setNote] = React.useState(null);
        /* The last sweep's answer, whole: the state of every node the route asked and the node it would
           pin. The pin itself is not taken from here — it is read back from the settings section. */
        const [sweep, setSweep] = React.useState(null);
        const [draft, setDraft] = React.useState(null);
        const [webBusy, setWebBusy] = React.useState(false);
        const [webNote, setWebNote] = React.useState(null);
        /* Which published read the cleanup below may act on: a mount paints `lastRead` first, and that
           picture can be older than the store. The cleanup waits for `take` to publish a fresh read. */
        const [readGeneration, setReadGeneration] = React.useState(0);

        /* A part draws inside this component and presses through it: a press made in a part — the data-sharing
           button — leaves its refusal where this section's other presses do. */
        React.useEffect(() => {
          shared.setNote = setNote;
          return () => {
            shared.setNote = null;
          };
        }, []);

        const take = (view, options = {}) => {
          /* The vendor's live catalogue is not part of this read and is kept across every re-read of the
             settings: a write of the list must not lock the picker it was written from, and the catalogue
             is the node's own answer, which no write of ours changes. A read about another row starts from
             that read's own placeholder. */
          setState((current) => ({
            status: 'ready',
            reason: null,
            view: current.view === null || current.view.ns !== view.ns
              ? view
              : { ...view, catalogue: current.view.catalogue },
          }));
          /* A read that follows this section's own write drops the draft: what the fields show after a write
             is the section, not what was typed before it. A read the platform announced is not that write and
             leaves the reader's list where it stands. */
          if (options.dropDraft !== false) setDraft(null);
          setReadGeneration((count) => count + 1);
        };

        /* One door for the settings read, so every reader is ticketed the same way: `readState` is asked
           here and nowhere else, and the publish is the ticket's to allow. */
        const read = async (options = {}) => {
          const ticket = ++readTicket;
          const view = await shared.readState(ctx.remote);
          if (ticket === readTicket) take(view, options);
          return view;
        };

        /* The picture goes into the session's memory as it is published, so the next mount of this section
           paints it at once. Only a read that answered is remembered: a skeleton is not knowledge, and a mount
           that failed to read keeps what stands and names the reason, as it always did. */
        React.useEffect(() => {
          if (state.status === 'ready') lastRead = { state, at: Date.now() };
        }, [state]);

        /* A note stands for its own hold and then goes, and the card's own state takes the place back: a new
           press drops it at once (every action clears it with `setNote(null)`, or carries the note its own press
           makes) and nothing else renews it. A note
           that carries a `stamp` is not news of a press but what the vendor said about the value that stands,
           and its life is that value rather than the hold (the effect below). */
        React.useEffect(() => {
          if (note === null || note.stamp !== undefined) return undefined;
          const timer = setTimeout(() => setNote(null), hold.holdOf());
          return () => clearTimeout(timer);
        }, [note]);

        /* A verdict is not news of a press: it is what the vendor said about the value that stands, and it
           stands while that value is the one it was said about. It goes when the store's own word changes,
           or on the reader's next act, and nothing else takes it away. */
        React.useEffect(() => {
          if (note === null || note.stamp === undefined) return;
          if (note.stamp !== shared.credentialWord(state.view?.credential)) setNote(null);
        }, [state.view?.credential]);

        /* The section draws on the platform's own doors alone, and the vendor's live catalogue follows in
           its own round trip: it is asked once per mount. A vendor that has added a model since the last
           mount is read on the next one — asking again on every announcement would put a request to the
           vendor behind every unrelated write in the product. */
        React.useEffect(() => {
          let live = true;
          /* The section first, the vendor's live catalogue second: the read above holds the platform's own
             doors, and this one is a round trip to the vendor that the cards do not wait for. The answer is
             patched into the read it belongs to, so a stale answer about another row never replaces a newer
             one — and the draft the user is typing in is left where it stands. */
          const start = async () => {
            const ticket = readTicket + 1;
            let view;
            try {
              view = await read();
            } catch (error) {
              /* A read that fails keeps the section the user is reading: the reason stands in the state
                 area beside the rows, and only a first read — which has nothing to keep — is replaced by
                 it. A failed read that emptied the section would take away what the reader had in front
                 of them because a later read went wrong. A failure that is no longer the newest read's is
                 not published. */
              if (live && ticket === readTicket) setState((current) => ({ status: 'failed', view: current.view, reason: shared.reasonOf(error) }));
              return;
            }
            if (!live) return;
            try {
              const answer = await shared.readCatalogue();
              if (!live) return;
              setState((current) => current.view === null || current.view.ns !== view.ns
                ? current
                : { status: current.status, reason: current.reason, view: { ...current.view, catalogue: answer } });
            } catch (error) {
              if (live) setState((current) => ({ status: 'failed', view: current.view, reason: shared.reasonOf(error) }));
            }
          };
          void start();
          return () => {
            live = false;
          };
        }, []);

        /* The value has two doors: a change made on the platform's own Settings → Models page is the
           host's own announcement, and this section reads again on it, as that page does. */
        React.useEffect(() => {
          const reread = async () => {
            const ticket = readTicket + 1;
            try {
              /* An announcement is not this section's write: a list being typed is not dropped by it. */
              await read({ dropDraft: false });
            } catch (error) {
              /* As the mount's own read: the reason stands beside the rows the reader already has, and a
                 failure that is no longer the newest read's is not published. */
              if (ticket === readTicket) setState((current) => ({ status: 'failed', view: current.view, reason: shared.reasonOf(error) }));
            }
          };
          const disposers = shared.WATCHED.map((name) => ctx.remote.$on(name, reread));
          const offReset = ctx.on('connection/reset', reread);
          return () => {
            for (const dispose of disposers) dispose();
            offReset();
          };
        }, []);

        /* The token's three presses stand in the connection card's part, with the words they say: the section
           hands in the picture they answer into and the setters their answers land in. */
        const verify = () => shared.verifyToken({ view: state.view, setBusy, setNote });
        const save = () => shared.saveToken({ view: state.view, field, setBusy, setField, setNote, read });
        const clear = () => shared.clearToken({ view: state.view, setBusy, setNote, read });

        /**
         * One press: the nodes are asked, and the one that answered is pinned — then the section is read
         * again, because the answer about a pin is the settings section's own value and nothing else.
         *
         * A home where nothing may be written says so before the attempt rather than after it: the
         * refusal is the platform's own, and it costs a round trip to learn otherwise.
         */
        const check = async () => {
          const view = state.view;
          if (view === null || view.status !== 'ready' || view.settings === null) return;
          if (view.settings.missing.length > 0) {
            /* The fields a row is missing are named the way the cards name them, and it is the **models**
               card that states it: `models` and `defaultContextWindow` are the list's own fields, and a note
               addressed to the node left that card silent about a write it would have refused. */
            setNote({ where: 'models', value: 'unsaved', detail: t('state.unwritable', { fields: shared.fieldWords(view.settings.missing) }) });
            return;
          }
          if (view.settings.writable !== true) {
            /* Not a failed write: the surface itself cannot be changed here, and the row says so while the
               reason stays the console's. The second of the two places that recorded a fact which is not a
               write as one — invisible until now because the word it produced was plausible. */
            setNote({ where: 'node', value: 'unwritable', detail: t('state.readonly') });
            return;
          }
          setBusy('check');
          setNote(null);
          setSweep(null);
          /* The answer is **news of this press**, so it is a note like the two refusals above and like every
             other press's word in this section: it stands for the page's own hold and goes with it (the
             effect above). The record set beside it — `setSweep` — keeps what the sweep found for the reasons
             list under the cards and for the row's own address, and states no word of its own. */
          const news = (answer) => {
            const said = shared.sweepAccount(answer);
            return said === null ? { where: 'node', value: 'unanswered' } : { where: 'node', value: 'answered', detail: said };
          };
          try {
            const answer = await shared.askSweep();
            setSweep(answer);
            /* The node in use answered: there is nothing to pin, and the sweep's own answer is the news this
               press made. Every other outcome — the first node that answered, or none — is the sweep's. */
            if (answer.pin === null || answer.pin === view.node) {
              setNote(news(answer));
              return;
            }
            const written = await shared.writeSettings(ctx.remote, view.settings, [
              { op: 'set', path: [...view.settings.path, 'inferBase'], value: answer.pin },
            ]);
            if (!written.wrote) {
              setNote({ where: 'node', value: 'unsaved', detail: written.fault });
              return;
            }
            /* A pin needs no word of its own: the node that answered is written into the row, and the row's
               own node line changes to it — the confirmation is the address the reader watches. The answer
               still stands beside it as this press's news, for its own hold. */
            setNote(news(answer));
            await read();
          } catch (error) {
            /* A sweep is not a write: the route's words are the console's, and what stands on the face is
               this press's news — the sweep found nobody, which is what the reasons list under the card says in full.
               A note naming a failed save here would make the row say "Node was not saved" about something nobody
               tried to save. */
            kit.statusDetail(t('status.subject.node'), shared.reasonOf(error));
            /* The refusal is a sweep that answered nobody, recorded as one: null keeps its single meaning —
               nobody has asked — and the record has something to say about a sweep that was tried. */
            setSweep({ pin: null, nodes: [] });
            setNote({ where: 'node', value: 'unanswered' });
          } finally {
            setBusy(null);
          }
        };

        /* One write pair, in the documented order: the flag first on the way on, the two provider values
           first on the way off. The web row is re-read after the flag on the way on, because the first
           write moves the revision the second one must carry. A failed write is shown and the section is
           read again, so the box reports the live value rather than the value the press hoped for. */
        const toggleWeb = async (checked) => {
          setWebBusy(true);
          setWebNote(null);
          try {
            const qoder = state.view?.settings;
            if (qoder === null || qoder === undefined) throw new Error(t('web.unread'));
            if (checked) {
              const flag = await shared.writeSettings(ctx.remote, qoder, [
                { op: 'set', path: [...qoder.path, 'webAccess', 'enabled'], value: true },
              ]);
              if (!flag.wrote) throw new Error(flag.fault);
              const webNow = await shared.readWeb(ctx.remote);
              if (!webNow.ok) throw new Error(webNow.fault);
              const selected = await shared.writeSettings(ctx.remote, webNow, [
                { op: 'set', path: ['searchProvider'], value: 'qoder' },
                { op: 'set', path: ['fetchProvider'], value: 'qoder' },
              ]);
              if (!selected.wrote) throw new Error(selected.fault);
            } else {
              const webNow = await shared.readWeb(ctx.remote);
              if (!webNow.ok) throw new Error(webNow.fault);
              const selected = await shared.writeSettings(ctx.remote, webNow, [
                { op: 'set', path: ['searchProvider'], value: null },
                { op: 'set', path: ['fetchProvider'], value: null },
              ]);
              if (!selected.wrote) throw new Error(selected.fault);
              const flag = await shared.writeSettings(ctx.remote, qoder, [
                { op: 'set', path: [...qoder.path, 'webAccess', 'enabled'], value: false },
              ]);
              if (!flag.wrote) throw new Error(flag.fault);
            }
            await read();
          } catch (error) {
            setWebNote(shared.reasonOf(error));
            try {
              await read();
            } catch (readError) {
              setWebNote(`${shared.reasonOf(error)} — ${shared.reasonOf(readError)}`);
            }
          } finally {
            setWebBusy(false);
          }
        };

        const namesQoder = (value) => value?.searchProvider === 'qoder' || value?.fetchProvider === 'qoder';

        /**
         * A selection outliving its switch or its token still stands in the row: the Qoder half is cleared
         * on the read, so the platform's search returns; a DeepSeek half stays. The box is drawn off while
         * the flag is off or the token is missing; the failure word is the switch's, one attempt per read.
         */
        const clearStaleWeb = async () => {
          setWebBusy(true);
          setWebNote(null);
          try {
            const webNow = await shared.readWeb(ctx.remote);
            if (!webNow.ok) throw new Error(webNow.fault);
            const stale = [];
            if (webNow.value?.searchProvider === 'qoder') stale.push({ op: 'set', path: ['searchProvider'], value: null });
            if (webNow.value?.fetchProvider === 'qoder') stale.push({ op: 'set', path: ['fetchProvider'], value: null });
            if (stale.length === 0) {
              await read();
              return;
            }
            const selected = await shared.writeSettings(ctx.remote, webNow, stale);
            if (!selected.wrote) throw new Error(selected.fault);
            const qoder = state.view?.settings;
            if (qoder !== null && qoder !== undefined) {
              const flag = await shared.writeSettings(ctx.remote, qoder, [
                { op: 'set', path: [...qoder.path, 'webAccess', 'enabled'], value: false },
              ]);
              if (!flag.wrote) throw new Error(flag.fault);
            }
            await read();
          } catch (error) {
            setWebNote(shared.reasonOf(error));
            try {
              await read();
            } catch (readError) {
              setWebNote(`${shared.reasonOf(error)} — ${shared.reasonOf(readError)}`);
            }
          } finally {
            setWebBusy(false);
          }
        };

        /* The switch or the token can leave by either door — this section's clear or the platform's own
           Settings → Models. The section already re-reads on the credential announcement; this effect is
           the read's consequence: with the flag off or no token and a stale selection, one cleanup write,
           then the section is read again. A failure stands in the card's note and is not retried on every
           read. */
        const tokenMissing = state.view?.ref === null || state.view?.ref === undefined
          || state.view?.credential?.configured !== true;
        const webSelected = state.view?.web?.ok === true && namesQoder(state.view.web.value);
        React.useEffect(() => {
          if (readGeneration === 0 || state.status !== 'ready') return;
          if (state.view?.webEnabled === 'unknown') return;
          if (webSelected !== true || (tokenMissing !== true && state.view?.webEnabled !== false)) return;
          if (webBusy || webNote !== null) return;
          void clearStaleWeb();
        }, [readGeneration, state.status, tokenMissing, webSelected, state.view?.webEnabled, webBusy, webNote]);

        /* The editor's own draft: built from the read rows the first time a field or a button is touched,
           and dropped by every read. */
        const editing = draft ?? (state.view?.status === 'ready' ? state.view.models.map(shared.draftRow) : []);

        const patchRow = (index, fields) => {
          setNote(null);
          setDraft(editing.map((row, at) => (at === index ? { ...row, ...fields } : row)));
        };

        /**
         * Choosing a model from the live catalogue: the name is filled from the same answer the id comes
         * from, because the vendor names a model differently in its menu than on the wire. An entry
         * without a name leaves the id standing — an empty name field would read as a forgotten one.
         */
        const chooseModel = (index, id) => {
          const entry = state.view?.status === 'ready' ? state.view.catalogue.models?.get(id) : undefined;
          patchRow(index, { id, name: typeof entry?.name === 'string' && entry.name !== '' ? entry.name : id });
        };

        const addRow = () => {
          /* The second add is not a defect and is not refused: the press appends a row, the draft keeps every row
             added until `Apply` writes the list, and a profile may hold the same model twice — so the two windows a
             second press leaves are legitimate, and what was missing was **the page saying what it did**. The
             sentence stands in the card's own strip for the page's hold (`answerStrip`), and it says `another` only
             where the draft already holds a row the file does not: that row is the earlier press's own, and it is
             what the second window is. The file is not touched by this press, so the corner keeps the map's own word
             for a draft that is not written (`unsaved`) — the act and the state are two facts and the page says
             both. */
          const again = editing.some((row) => row.stored === undefined);
          setNote({ where: 'models', value: 'unsaved', line: t(again ? 'models.addedAgain' : 'models.added') });
          /* A new row names no effort, and the route's own effort answers for it until one is chosen: the
             row carries no model yet, so there is no menu to choose from, and a row that names nothing
             sends that name, which travels as it stands. Naming a level here would be a claim about a model this row does not carry yet. */
          setDraft([...editing, shared.draftRow({ id: '' })]);
        };

        const removeRow = (index) => {
          setNote(null);
          setDraft(editing.filter((_row, at) => at !== index));
        };

        /** Drop the draft: the fields show the section as it was read. */
        const cancel = () => {
          setNote(null);
          setDraft(null);
        };

        /** The live read after a failed write: the note stands where it is while the read corrects the values. */
        const rereadAfterFailure = async () => {
          try {
            await read();
          } catch (error) {
            kit.statusDetail(t('status.subject.models'), shared.reasonOf(error));
          }
        };

        /**
         * Write the list: one `set` of the row's `models`, with the revision this section read. A row
         * carries its own window and its own effort (`storedRow`); the fallback window a model id the row
         * does not declare takes is not this write's business — `Reset to defaults` unsets it.
         */
        const apply = async () => {
          const view = state.view;
          if (view === null || view.status !== 'ready' || view.settings === null || draft === null) return;
          const problems = shared.checkRows(editing);
          if (problems.length > 0) {
            setNote({ where: 'models', value: 'unsaved', detail: problems[0].message });
            return;
          }
          setBusy('models');
          setNote(null);
          try {
            const written = await shared.writeSettings(ctx.remote, view.settings, [
              { op: 'set', path: [...view.settings.path, 'models'], value: editing.map(shared.storedRow) },
            ]);
            if (!written.wrote) {
              setNote({ where: 'models', value: 'unsaved', detail: written.fault });
              /* A failed write is followed by the live read: a conflict drops the draft because the section
                 moved, any other refusal is the platform's word about this write and is followed too. */
              if (written.conflict === true) await read();
              else await rereadAfterFailure();
              return;
            }
            setNote({ where: 'models', value: 'saved' });
            await read();
          } catch (error) {
            setNote({ where: 'models', value: 'unsaved', detail: shared.reasonOf(error) });
            await rereadAfterFailure();
          } finally {
            setBusy(null);
          }
        };

        /** Return the list and the fallback window to what the patch says. */
        const reset = async () => {
          const view = state.view;
          if (view === null || view.status !== 'ready' || view.settings === null) return;
          if (view.settings.missing.length > 0) {
            setNote({ where: 'models', value: 'unsaved', detail: t('state.unwritable', { fields: shared.fieldWords(view.settings.missing) }) });
            return;
          }
          if (view.settings.writable !== true) {
            setNote({ where: 'models', value: 'unsaved', detail: t('state.readonly') });
            return;
          }
          setBusy('models');
          setNote(null);
          try {
            const written = await shared.writeSettings(ctx.remote, view.settings, [
              { op: 'unset', path: [...view.settings.path, 'models'] },
              { op: 'unset', path: [...view.settings.path, 'defaultContextWindow'] },
            ]);
            if (!written.wrote) {
              setNote({ where: 'models', value: 'unsaved', detail: written.fault });
              await rereadAfterFailure();
              return;
            }
            setNote({ where: 'models', value: 'saved' });
            await read();
          } catch (error) {
            setNote({ where: 'models', value: 'unsaved', detail: shared.reasonOf(error) });
            await rereadAfterFailure();
          } finally {
            setBusy(null);
          }
        };

        /* One object, built once per render and read twice: the drawing and the account both ask `statusOf`
           of it, so a card cannot say one thing while the log is told another. */
        const picture = {
          status: state.status,
          view: state.view,
          reason: state.reason,
          field,
          busy,
          note,
          sweep,
          webBusy,
          webNote,
          draft: state.view?.status === 'ready' ? (draft === null ? null : editing) : null,
        };

        /* The account of a state that stands — a failed read, fields this row does not carry, a reference
           nobody named — goes to the console with the state it belongs to. It is
           a hook of the component and not of `draw`: `draw` returns early in four of the states it draws, so a
           hook inside it is called by the cards and not by the frames of the wait, and React counts the hooks
           of one mount and refuses a render that calls a different number (error #310) — which is how the live
           page lost this whole section while every check reading the drawn tree stayed green. A press's own
           answer is said where it is made (`verdictNote` and the actions), so an attempt is said every time it
           is made rather than once per state; the object is built fresh each render, so the account follows
           every render and a state learned by any door reaches the console. */
        React.useEffect(() => {
          for (const where of ['credential', 'node', 'models', 'web']) {
            const one = shared.statusOf(picture, where);
            if (one.detail !== undefined && one.detail !== null) kit.statusDetail(one.subject, one.detail);
          }
        }, [picture]);

        return shared.draw(picture, {
          patch: (value) => {
            setNote(null);
            setField(value);
          },
          save,
          clear,
          verify,
          check,
          toggleWeb,
          patchRow,
          chooseModel,
          addRow,
          removeRow,
          cancel,
          apply,
          reset,
        });
      }

      return { QoderSection };
    }

    return { create };
  },
});
