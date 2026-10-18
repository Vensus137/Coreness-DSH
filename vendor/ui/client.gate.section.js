/**
 * The rate gate's section as it stands: the read on mount and on its own beat, the picture a return paints
 * before the read answers, the room of the section's own sentence, and the drawing of the cards.
 *
 * A package-local part of `client.gate.js`, pulled by it with `require.async` and created last, once the kit,
 * the picker, the hold and the two parts beside it are in hand. It reads the entry's two doors through
 * `shared` (`readPicture`, `readSettings`, `writeSettings`, `useStyles`, the beat and the scalars) and the
 * parts beside it (`valuesOf`, `opsOf`, `rowsOps`, `ceilingProblem`, `limitCard`, `pairOf`, `rowsStanding`,
 * `cardOfPair`, `pairsOf`, `rowCard`), so no chunk reaches across another's module.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.gate.section.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The section's own life, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /**
       * What this section last read, and the moment it read it.
       *
       * The browser half is materialised once per application session, so a section that is left and entered
       * again has this beside it. A mount paints it at once and the read corrects it behind — this section also
       * keeps its own beat, so the correction arrives by itself; the session's *first* mount has nothing and
       * keeps the honest skeleton, because a skeleton is the truth when nothing is known. It holds a read
       * picture and never the visit's own state — the draft, the news of a press.
       */
      /* The holder's name is the section's own; nothing else on the page writes under it. */
      const HELD = '__corenessGateLastRead';
      const lastRead = {
        get: () => (typeof window === 'undefined' ? null : window[HELD] ?? null),
        set: (picture) => { if (typeof window !== 'undefined') window[HELD] = picture; },
      };

      /**
       * The one sentence of the section's room, and its tone.
       *
       * The empty case says **nothing**: "No model is limited: every request passes untouched" left by the user's
       * own word ("непонятно, зачем это. То есть он там же будет видно: если установлено, если не установлено, то
       * тоже видно. То есть как будто бы это бесполезно") — the same fact he had already removed from the card.
       * The room is drawn in every state and reserves no height: nothing on this page is reserved, so an empty
       * room is a quiet room of no lines, the cards under it keep the list's own line of air, and a sentence that
       * arrives takes its line and moves them by it.
       */
      /* The two words this section's notes use for a state's tone, and the page's own tone class each one wears:
         the word stays the section's — the walk and the batch read it in `data-tone` —
         and the colour stands once in the page's sheet. A word with no entry here paints what it painted before. */
      const TONE_CLASS = { done: ' coreness-tone-done', error: ' coreness-tone-fault' };

      function noteOf(view) {
        /* A read in flight says nothing: the load is background here, as on the other pages of this page, and a word
           that only reports it would either reserve a line forever or move the cards once for no news. */
        if (view.status === 'loading') return { tone: null, text: '' };
        if (view.status === 'failed') return { tone: 'error', text: `${t('state.error')} — ${view.fault}` };
        if (view.settings !== null && view.settings.ok === false) return { tone: 'warn', text: t('state.unwritable', { fault: view.settings.fault }) };
        /* The sentence about the window is no longer this room's: it left for the caption, which is drawn in every
           state. The room keeps the read's own words — a read in flight, a failed read, a row nobody may write. */
        return { tone: null, text: '' };
      }

      /**
       * The section as it draws, over one picture and one acting set. Pure, so a check can read every state
       * of it without a browser — the shape the two sections beside it export for their own checks.
       */
      function draw(view, act = {}) {
        const note = noteOf(view);
        const listed = view.picture?.rows ?? [];
        /* A draft stands for the rows as well as for the numbers: a row added or dropped is drawn at once,
           with the counters of a pair the picture knows read from it. Without this the row a user adds
           would stand nowhere until it is written, and the press would look like it did nothing. */
        /* Which rows stand is the record's answer, and the picture's is what is known about a pair. The picture is
           the route's view of the gate's runtime rows and arrives later: drawn as the list it would drop the row a
           write just saved — the very state the comment below exists to prevent, "the press would look like it did
           nothing". The picture keeps its own job, a lookup for the counters, exactly as the draft branch below
           already uses it. With no record to read, the picture is the only list there is. */
        const known = shared.rowsStanding(view);
        const rows = view.draft === null
          ? known.map((row) => {
            const live = listed.find((one) => one.provider === row.provider && one.model === row.model);
            return { row: live === undefined ? { ...row } : { ...live, ...row } };
          })
          : view.draft.rows.map((one) => {
            const live = one.fresh === true ? undefined : listed.find((row) => row.provider === one.provider && row.model === one.model);
            return { row: live === undefined ? { ...one } : { ...live, ...one } };
          });
        const busy = view.busy === true;
        const patch = act.patch ?? (() => {});
        const acting = {
          patch,
          patchRow: act.patchRow ?? (() => {}),
          removeRow: act.removeRow ?? (() => {}),
          addRow: act.addRow ?? (() => {}),
          apply: act.apply ?? (() => {}),
        };
        const refused = view.picture?.refused ?? [];
        return h('div', { className: 'coreness-still coreness-gate coreness-sectionBody' }, [
          h('div', { key: 'head', className: 'coreness-gate-head' }, [
            h('h1', { key: 'title', className: 'coreness-gate-title' }, t('title')),
            /* The caption carries the surface's own sentence as well: a property of the section stands in every state, so
           it is drawn always — and a line that is always drawn moves nothing when a press answers. */
        h('p', { key: 'caption', className: 'coreness-gate-caption' }, [t('caption'), ' ', t('state.standing')]),
          ]),
          /* The one room the section's own sentence stands in, in every state: the room keeps no height of
             its own, so the cards move by the line an arriving sentence takes. */
          h('p', { key: 'state', className: 'coreness-gate-state' + (TONE_CLASS[note.tone] ?? ''), 'data-tone': note.tone ?? 'plain' }, note.text),
          h('ul', { key: 'cards', className: 'coreness-list coreness-gate-cards coreness-card-list' }, [
            shared.limitCard({ ...view, busy }, acting),
            ...rows.map(({ row }, index) => shared.rowCard({
              row,
              index,
              view: { ...view, busy },
              act: acting,
              catalog: view.catalog,
            })),
          ]),
          /* A row the host refused is named, not dropped: the file keeps it, the gate does not run it, and a page
             that hid it would let the user believe a ceiling stands that does not. The host's own sentence is the
             line — the route already wrote it in words, with the index and the pair in it. Nothing is added to the
             tree when the picture refuses none, so the frames without refused rows stay the donor's own. */
          ...(refused.length === 0 ? [] : [h('div', { key: 'refused', className: 'coreness-gate-refused' }, [
            h('p', { key: 'title', className: 'coreness-gate-refusedTitle' }, t('refused.title')),
            h('ul', { key: 'list', className: 'coreness-gate-refusedList' }, refused.map((one, index) => h('li', {
              key: `r${index}`,
              className: 'coreness-gate-refusedRow',
            }, one.reason))),
          ])]),
          /* The control stands in **every** state, the loading one included: it waits for the catalogue by being
             disabled and saying so, not by being absent. The first frame therefore holds the same tile the ready frame
             holds, which is what keeps the card and the section from moving when the read lands — measured on the
             section: the frame without the tile read 514 tall with the first card's top at 154, the frame with it 540
             and 136, on the first visit and on a return alike. */
          h('div', { key: 'add', className: 'coreness-addRow' }, [
            h('button', {
              key: 'add',
              type: 'button',
              className: 'coreness-add coreness-button',
              disabled: busy || view.catalog === null,
              onClick: () => acting.addRow(),
            }, view.catalog === null ? t('add.reading') : t('control.add')),
            view.catalog !== null && shared.pairsOf(view.catalog).length === 0 ? h('span', { key: 'none', className: 'coreness-gate-dim' }, t('add.none')) : null,
          ]),
        ]);
      }

      /** The section as it stands: the picture from the route, the row from the settings mirror. */
      function GateSection() {
        /* The section's sheet, ensured where the section is drawn: the platform's own replace re-mounts a
           plugin over the module table it already has and takes the package's style tags with it, so the mount
           is the one place a sheet can be put back. */
        shared.useStyles();
        /* What was read in this session, if anything: the frame the mount paints before its own read answers. */
        const held = lastRead.get();
        const [state, setState] = React.useState(() => ({
          view: {
            status: 'loading',
            picture: null,
            settings: null,
            read: shared.valuesOf(null),
            draft: null,
            note: null,
            catalog: null,
            busy: false,
            fault: null,
            /* The picture and nothing else: what the file said, not what this visit did with it. It belongs **inside**
               the view, which is the only thing the section reads — the first version of this memory spread it beside
               `view`, on the top level of the state object, where no line ever read it: `view.read` stayed
               `valuesOf(null)`, so a return visit painted an empty first frame exactly like a first one. One owner: what
               the section reads lives where it reads it. */
            ...(held === null ? {} : {
              status: held.picture.status,
              picture: held.picture.picture,
              settings: held.picture.settings,
              read: held.picture.read,
              catalog: held.picture.catalog,
              fault: held.picture.fault,
            }),
          },
        }));
        const view = state.view;

        /* The picture goes into the session's memory as it is published, so the next mount of this section
           paints it at once: this section is left and entered again more than any other, and its whole card is
           what the reader comes back for. Only a read that answered is remembered — a skeleton is not
           knowledge, and a read that failed keeps what stands and names the reason with its own branch. */
        React.useEffect(() => {
          if (state.view.status === 'ready') lastRead.set({ picture: state.view, at: Date.now() });
        }, [state]);

        /* A note stands for its own hold and then goes, and the drawing that carried it keeps the room: one
           number for the whole page, in hand before this section stands, armed the way the MCP
           section and the Qoder card arm it. A press made after it drops it at once, and leaving the section
           unmounts it — but neither of those is the page's number, and a word that waits for the next press is
           the word the user sat and watched until he wrote that it "как будто не пропадает, я долго ждал". */
        React.useEffect(() => {
          const note = state.view.note;
          if (note === null || note === undefined) return undefined;
          const timer = setTimeout(() => setState((now) => ({ view: { ...now.view, note: null } })), hold.holdOf());
          return () => clearTimeout(timer);
        }, [state.view.note]);

        /**
         * The read: the picture, then the row's own namespace and revision.
         *
         * It merges into whatever the section holds by then — the state updater is the only reader of the
         * current view, so a beat that lands while a user is typing never overwrites the draft.
         */
        async function read() {
          try {
            const picture = await shared.readPicture();
            const settings = await shared.readSettings(ctx.remote, picture.ns);
            setState((now) => ({
              view: {
                ...now.view,
                status: 'ready',
                picture,
                settings,
                read: shared.valuesOf(settings.ok === true ? settings : null),
                fault: null,
              },
            }));
          } catch (error) {
            setState((now) => ({ view: { ...now.view, status: 'failed', fault: String(error?.message ?? error) } }));
          }
        }

        React.useEffect(() => {
          let live = true;
          const tick = () => {
            if (!live) return;
            /* A hidden document is not a reason to ask the host for a picture nobody is looking at. */
            if (document.visibilityState !== undefined && document.visibilityState !== 'visible') return;
            void read();
          };
          tick();
          const beat = setInterval(tick, shared.BEAT_MS);
          return () => {
            live = false;
            clearInterval(beat);
          };
        }, []);

        /* The catalogue of pairs the picker offers: the platform's own answer, read once per mount like the
           section beside this one reads the vendor's. A model the catalogue gains appears on the next mount. */
        React.useEffect(() => {
          let live = true;
          ctx.remote.session.modelCatalog().then(
            (answer) => {
              if (!live) return;
              setState((now) => ({ view: { ...now.view, catalog: answer?.ok === true ? answer.value : { groups: [], failures: [] } } }));
            },
            () => {
              if (live) setState((now) => ({ view: { ...now.view, catalog: { groups: [], failures: [] } } }));
            },
          );
          return () => {
            live = false;
          };
        }, []);

        const act = {
          patch: (fields) => setState((now) => ({
            view: { ...now.view, draft: { ...(now.view.draft ?? now.view.read), ...fields }, note: null },
          })),
          patchRow: (index, fields) => {
            /* The guard's reason leaves the face where the value is typed: the strip keeps the word alone, so the
               sentence a user would have read under the box goes out through this page's one door for reasons
               (`statusDetail`), read off the row as it will stand rather than as it stands. Only a patch that carries
               the ceiling is answered here: a pair chosen while the box is empty leaves the status as it already is. */
            const draft = view.draft ?? view.read;
            const held = draft.rows[index];
            if (fields.tokensPerMinute !== undefined && held !== undefined && shared.ceilingProblem(fields.tokensPerMinute) !== null) kit.statusDetail(shared.pairOf({ ...held, ...fields }), t('field.ceiling.problem'));
            setState((now) => {
              const nowDraft = now.view.draft ?? now.view.read;
              const rows = nowDraft.rows.map((row, at) => (at === index ? { ...row, ...fields } : row));
              return { view: { ...now.view, draft: { ...nowDraft, rows }, note: null } };
            });
          },
          addRow: () => {
            /* A row arrives without a ceiling, so it arrives refused: the strip carries the word from the first
               frame, and the reason leaves the face here, where the row arrives. */
            const first = shared.pairsOf(view.catalog)[0] ?? { provider: '', model: '' };
            kit.statusDetail(shared.pairOf({ provider: first.provider, model: first.model }), t('field.ceiling.problem'));
            setState((now) => {
              const draft = now.view.draft ?? now.view.read;
              return {
                view: {
                  ...now.view,
                  draft: { ...draft, rows: [...draft.rows, { provider: first.provider, model: first.model, tokensPerMinute: null, thresholdRatio: null, dryRun: null, fresh: true }] },
                  note: null,
                },
              };
            });
          },
          removeRow: async (index) => {
            const settings = view.settings;
            if (view.read === null || settings?.ok !== true || view.busy === true) return;
            /* A press on a row nobody has touched yet still works: the draft starts from the file's own list. */
            const draft = view.draft ?? view.read;
            const left = { ...draft, rows: draft.rows.filter((row, at) => at !== index) };
            /* The ops decide, not a flag: a row nobody wrote leaves the list as the file carries it, so there is
               nothing to write, and a row the file carries is taken out of the record itself. The word stands in the
               section's card in both cases — `at` stays null — because the row's own card is gone with the row, and
               the sentence carries the row's pair so the answer still names the row it was about. */
            const pair = shared.pairOf(draft.rows[index] ?? {});
            const ops = shared.rowsOps(left, view.read);
            if (ops.length === 0) {
              /* The press removed the only card that could carry this word, and the section's card is not its place:
                 it answers presses made in it — so the row leaves in silence, and the leaving is the answer. */
              setState((now) => ({ view: { ...now.view, draft: left, note: null } }));
              return;
            }
            setState((now) => ({ view: { ...now.view, draft: left, busy: true, note: null } }));
            const written = await shared.writeSettings(ctx.remote, settings, ops);
            if (!written.wrote) {
              /* The file still carries the row, so the section is read again and stands as it is; the refusal keeps
                 its own word and its reason, and it stands in the row's own card — the file still draws that row —
                 found by the pair the press removed (`cardOfPair`), because the index the press carried is an index
                 into the draft it built, not into the list the page draws after the refusal. */
              setState((now) => ({ view: { ...now.view, busy: false, draft: null, note: null } }));
              await read();
              setState((now) => ({ view: { ...now.view, note: { tone: 'fault', text: t('state.refused'), at: shared.cardOfPair(now.view, pair) } } }));
              /* The refusal's sentence leaves the face here, where the answer arrived: the strip keeps the word,
                 and the code's own sentence goes to the console, said once for this attempt. */
              kit.statusDetail(pair, written.reason ?? written.fault);
              return;
            }
            await read();
            /* The row is gone from the record and from the page: the word has no card to stand in, so it stands
               nowhere. What wrote is the row's own leaving, which the reader sees. */
            setState((now) => ({ view: { ...now.view, busy: false, draft: null, note: null } }));
          },
          apply: async (place) => {
            const settings = view.settings;
            if (view.draft === null || settings?.ok !== true || view.busy === true) return;
            /* A press in a row's foot is about that row: the rows go, the section's own numbers do not. A press in
               the section's foot is about the whole draft. */
            const ops = place?.at === null || place?.at === undefined ? shared.opsOf(view.draft, view.read) : shared.rowsOps(view.draft, view.read);
            /* The pairs the draft carries, taken **before** the write: what this press asked the record to hold.
               After the write the re-read picture is the only witness of what it does hold, and the draft is gone
               by then — so the two are read here and held against each other below. */
            const carried = view.draft.rows.map(shared.pairOf);
            /* The row this press is about, as its **pair**: the draft's own index means nothing once the draft is
               dropped, which this very press does — so the word's place is read from the pair the pressed row
               carried, against the rows the page still draws (`cardOfPair`), at every branch below. */
            const about = place?.at === null || place?.at === undefined ? null : carried[place.at] ?? null;
            /* A row's ceiling is the row's own point, and a row without one is a row the gate's resolver refuses and
               writes nothing for — so the press is refused **before** the write rather than refused after it: the
               draft stays, because the box a user emptied is still there to be filled, and the reason travels where
               this page keeps reasons (`statusDetail`) while the face keeps the word. The whole list travels even for
               a press made in one row's foot (`rowsOps`), so any row's missing ceiling is every press's problem, and
               the section's own press carries it as well as the row's. */
            const missing = view.draft.rows.findIndex((one) => shared.ceilingProblem(one.tokensPerMinute) !== null);
            if (missing !== -1) {
              setState((now) => ({ view: { ...now.view, note: { tone: 'fault', text: t('state.refused'), at: missing } } }));
              kit.statusDetail(shared.pairOf(view.draft.rows[missing]), t('field.ceiling.problem'));
              return;
            }
            if (ops.length === 0) {
              /* A press with nothing to write is **answered rather than met with silence**: the draft closes, and
                 the section's own strip — the surface that outlives the press — says the third word the dictionary
                 above promises for a press that changed nothing. Its tone is the page's own word for it, `plain`,
                 written here rather than left to the drawing's fallback (`answerNote.tone ?? 'plain'`): the tone of
                 an answer is a decision, and the MCP section decides the same one for the same word off the
                 dictionary's key (`noteToneOf`) — a word that reads the same and carries no tone
                 is a colour nobody chose. No reason travels with it: nothing failed and nothing was asked, so
                 there is nothing to say beside the word. */
              setState((now) => ({ view: { ...now.view, draft: null, note: { tone: 'plain', text: t('state.nothing'), at: null } } }));
              return;
            }
            setState((now) => ({ view: { ...now.view, busy: true, note: null } }));
            const written = await shared.writeSettings(ctx.remote, settings, ops);
            if (!written.wrote) {
              if (written.conflict === true) {
                /* The row moved under the draft: the draft is dropped and the row is read again, because the
                   sentence promises the fields show the section as it stands and only the read can say that. The
                   answer is set **twice**: once from the refusal itself, because the re-read is a remote call and a
                   refusal that takes half a minute to say so is a refusal nobody hears, and again after the read —
                   the read builds a fresh view and would drop the first word with it. The place is read from the
                   pair both times (`cardOfPair`): the index the press carried is an index into a draft this branch
                   has just dropped, and it pointed at another row's card or at no card at all. */
                setState((now) => ({ view: { ...now.view, busy: false, draft: null, note: { tone: 'fault', text: t('state.refused'), at: shared.cardOfPair(now.view, about) } } }));
                /* The reason is said once, where the refusal arrived, and not again after the re-read: the second
                   `setState` below only puts the same word back on the view the read has just replaced. A press
                   made in the section's own foot names the section's subject where no row's pair does. */
                kit.statusDetail(about ?? t('card.limit'), written.reason ?? written.fault);
                await read();
                setState((now) => ({ view: { ...now.view, note: { tone: 'fault', text: t('state.refused'), at: shared.cardOfPair(now.view, about) } } }));
                return;
              }
              /* Any other refusal is the platform's word about this write and not about the row: the draft
                 stays, so the value a user typed is still there to be fixed — and the word stands in the card
                 that draws the pair the press was about, or in the section's strip where no card draws it. */
              setState((now) => ({ view: { ...now.view, busy: false, note: { tone: 'fault', text: t('state.refused'), at: shared.cardOfPair(now.view, about) } } }));
              kit.statusDetail(about ?? t('card.limit'), written.reason ?? written.fault);
              return;
            }
            await read();
            /* The word about the write is set **after** the read: the read builds a fresh view and would drop it, and a saved row whose answer is never seen is the same as no answer at all.
               **And the word is decided by what the record holds, not by what the write reported.** The pairs the
               draft carried are held against the rows the re-read picture carries: a row that did not arrive is
               **not saved**, whatever the door answered — a press that saved one family and lost a row cannot say
               `Saved` over the row it lost. A press whose row left the page with the write cannot carry its word in
               that row's own strip, because the card is gone; the word then stands in the section's strip, which
               survives the press — the same rule the removal above follows when it leaves `at` null — and it is the
               gate's own `state.refused`, not a sentence of this section's making.
               **The place of the word is the card that draws the pair this press was about, or the section's
               strip where no card draws it** (`cardOfPair`, read against the rows the page draws now). The index
               the press carried is never the ground: the draft it belonged to is dropped by this very write, and a
               record that moved under the draft — reordered, or short of a pair — would answer with another row's
               card. The pair survives both, so a record that reorders its rows keeps the word on the row it is
               about instead of dropping it to the section's strip. */
            setState((now) => {
              const held = new Set((now.view.read?.rows ?? []).map(shared.pairOf));
              const lost = carried.filter((pair) => !held.has(pair));
              const at = shared.cardOfPair(now.view, about);
              return {
                view: {
                  ...now.view,
                  busy: false,
                  draft: null,
                  note: lost.length > 0
                    ? { tone: 'fault', text: t('state.refused'), at }
                    : { tone: 'done', text: t('state.written'), at },
                },
              };
            });
          },
        };

        return draw(view, act);
      }

      return { GateSection, draw };
    }

    return { create };
  },
});
