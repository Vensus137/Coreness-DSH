/**
 * The MCP section itself: one component with the route's picture, the wait that follows it, the note's
 * hold and the polling of a sign-in that waits for a person.
 *
 * A package-local part of `client.mcp.js`, pulled by it with `require.async` and created last, once
 * every part it draws is in hand. The route's one door (`ask`, `askPage`, `request`) stands here because
 * this component is its only caller; the note maps that keep the console from repeating itself live here
 * for the same reason, in the chunk's own closure.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.mcp.section.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The section's own life, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /** A refusal of the route, as the page carries it: the code is the vocabulary, the words are the detail. */
      class Refused extends Error {
        constructor(code, message) {
          super(message ?? code);
          this.code = code;
        }
      }

      /**
       * One request to the plugin's route. The route answers 200 with its own refusals in words
       * (`{ok:false, error:{code, message}}`), so a refusal is read, not guessed from a status.
       */
      async function ask(method, body) {
        return request(shared.ROUTE, method, body);
      }

      /**
       * One request to the page's own route, which carries the sign-in: the row's precondition, the attempt a
       * press starts, the answer to the flow's own question, and the withdrawal of an attempt. One shape for
       * every answer, `{ok, value}` or `{ok:false, error:{code, message}}`, read the same way.
       */
      async function askPage(body) {
        return request(shared.PAGE_ROUTE, 'POST', body);
      }

      /** One request of one route of this page, read the page's own way. */
      async function request(route, method, body) {
        const answer = await fetch(route, {
          method,
          headers: body === undefined ? undefined : { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (!answer.ok) throw new Refused('unreadable', `${route} answered ${answer.status} ${answer.statusText}`);
        let payload;
        try {
          payload = await answer.json();
        } catch (error) {
          throw new Refused('unreadable', `${route} answered something that is not JSON: ${shared.reasonOf(error)}`);
        }
        if (payload?.ok !== true) throw new Refused(payload?.error?.code ?? 'write-failed', payload?.error?.message);
        return payload.value;
      }

      /**
       * What this section last read, and the moment it read it.
       *
       * The browser half is materialised once per application session, so a section that is left and entered
       * again has this beside it. A mount paints it at once and the read corrects it behind; the session's
       * *first* mount has nothing and keeps the honest skeleton, because a skeleton is the truth when nothing
       * is known. It holds a read picture and never the visit's own state — the open card, the editor, the news
       * of a press — which is not knowledge of the route and would be a lie told twice.
       */
      let lastRead = null;

      /**
       * What the console has already been told about a row's sign-in and about a row's reason: the last
       * sentence sent for that row. The wait reads the same picture again and again, and a line repeated is
       * not news; a new sentence is said again, which keeps the door a record of what happened.
       */
      const toldSignin = new Map();
      const toldReason = new Map();
      /** The last sentence the wait’s failed read sent to the console: the wait stops on a failure, and a reason repeated is not news. */
      let toldWait = null;

      function McpSection() {
        const [state, setState] = React.useState(lastRead === null ? { status: 'loading', picture: null, fault: null } : lastRead.state);
        shared.useStyles();
        const [editor, setEditor] = React.useState(null);
        const [confirm, setConfirm] = React.useState(null);
        const [busy, setBusy] = React.useState(null);
        const [note, setNote] = React.useState(null);
        /** Reads spent by the present wait, or `null` when nothing is being followed. */
        const [spent, setSpent] = React.useState(null);
        /* Which rows stand open, and which row's menu does: this half draws its rows with one set of hooks,
           so a row's disclosure and its menu are the section's own state, held by the entryId. */
        const [openRows, setOpenRows] = React.useState(() => new Set());
        const [openMenu, setOpenMenu] = React.useState(null);
        /* What the page's own door answered about each row's sign-in, by entryId, and what a person has typed
           into a question the flow asked, by server. Both are the section's own: the door is asked and not
           remembered across a mount, and a half-typed answer is nobody's but the person's. `joined` names the
           rows this session has already written the reference into, so one grant is joined once. */
        const [signins, setSignins] = React.useState({});
        const [answers, setAnswers] = React.useState({});
        const [joined, setJoined] = React.useState({});

        /* An open menu is closed by a press outside it or by Escape, wherever the press lands: the listener
           stands on the document while one menu is open and leaves with it. */
        React.useEffect(() => {
          if (openMenu === null) return undefined;
          const away = (event) => {
            if (event.target instanceof Element && event.target.closest(shared.MENU) !== null) return;
            setOpenMenu(null);
          };
          const key = (event) => {
            if (event.key === 'Escape') setOpenMenu(null);
          };
          document.addEventListener('mousedown', away);
          document.addEventListener('keydown', key);
          return () => {
            document.removeEventListener('mousedown', away);
            document.removeEventListener('keydown', key);
          };
        }, [openMenu]);

        /**
         * A picture the user asked for: drawn, and followed while something in it is still moving.
         *
         * The host's own sentence about a row is taken **here**, where the reading arrives, and not where the
         * row's word is drawn: the face carries the one word (`rowState`) and the platform's sentence — with the
         * client's label and the retry promise cut off, because neither is news the row can keep — goes to the
         * console, which is this page's own door for a reason that may not stand on the face. It is said once per
         * new sentence: a wait reads the same picture every second, and a log line repeated sixty times says less
         * than one.
         */
        const take = (picture) => {
          shared.tellTroubles(picture);
          setState({ status: 'ready', picture, fault: null });
          setSpent(shared.unsettled(picture) ? 0 : null);
        };

        /* A note stands for its own hold and then goes, and the card's own state word takes the room back. A
           press made after it drops it at once (`save`, `act.open`, `act.ask`) and nothing renews it: the
           section does not read while the roster is quiet, so a hold that had to wait for a read would never
           end. Leaving the section unmounts it, and the note with it. */
        React.useEffect(() => {
          if (note === null) return undefined;
          const timer = setTimeout(() => setNote(null), hold.holdOf(note));
          return () => clearTimeout(timer);
        }, [note]);

        React.useEffect(() => {
          if (state.status === 'ready') lastRead = { state, at: Date.now() };
        }, [state]);

        React.useEffect(() => {
          let live = true;
          ask('GET').then(
            (picture) => {
              if (live) take(picture);
            },
            (error) => {
              /* A read that failed names the reason and keeps the picture that stands — the one this session
                 already read, or the one the mount painted from its memory. It never empties the section. The
                 face carries the page's word for the family; a thrown transport failure's own sentence — the
                 browser's — is nobody's news but the console's. */
              if (!live) return;
              const refused = error instanceof Refused;
              if (!refused) kit.statusDetail(t('section'), `${t('fault.unreadable')}: ${shared.reasonOf(error)}`);
              setState((now) => ({ status: 'failed', picture: now.picture, fault: { code: refused ? error.code : 'unreadable', message: refused ? (error.message ?? null) : null } }));
            },
          );
          return () => {
            live = false;
          };
        }, []);

        /**
         * The wait: the picture is read again at the pace above while a row is still moving, and it ends as soon
         * as nothing is left to watch or the ceiling is reached. A read that brings the same picture as the one
         * on screen is not drawn again, so the DOM is not rebuilt and nothing flickers for nothing.
         */
        React.useEffect(() => {
          if (spent === null || spent >= shared.SETTLE.ceiling) return undefined;
          if (!shared.unsettled(state.picture)) {
            setSpent(null);
            return undefined;
          }
          const everyMs = spent < shared.SETTLE.first.reads ? shared.SETTLE.first.everyMs : shared.SETTLE.then.everyMs;
          const timer = setTimeout(async () => {
            let next;
            try {
              next = await ask('GET');
            } catch (error) {
              /* A read that failed is not a state to keep watching: the wait stops, and the picture that stands
                 is marked with the failure rather than left claiming the row is still moving. The reason is said
                 once per new sentence — a wait reads the same picture every second, and a line repeated is not
                 news. The face carries the page's word; the browser's sentence goes to the console. */
              const refused = error instanceof Refused;
              const sentence = `${t('fault.unreadable')}: ${shared.reasonOf(error)}`;
              if (toldWait !== sentence) {
                toldWait = sentence;
                kit.statusDetail(t('section'), sentence);
              }
              setState((now) => ({ ...now, status: 'failed', fault: { code: refused ? error.code : 'unreadable', message: refused ? (error.message ?? null) : null } }));
              setSpent(null);
              return;
            }
            shared.tellTroubles(next);
            setState((current) => (current.picture !== null && JSON.stringify(current.picture) === JSON.stringify(next)
              ? current
              : { status: 'ready', picture: next, fault: null }));
            setSpent(shared.unsettled(next) ? spent + 1 : null);
          }, everyMs);
          return () => clearTimeout(timer);
        }, [spent, state.picture]);

        /* The rows a sign-in could be offered on: an MCP row, switched on, with an address. Whether the flow
           can actually run there is not this half's question — the page's own door settles it at the address
           itself, and a row it answered nothing about is offered nothing. */
        const candidates = (state.picture?.rows ?? [])
          .filter((row) => row.shape === true && row.enabled === true && typeof row.url === 'string' && row.url !== '')
          .map((row) => ({ entryId: row.entryId, server: row.server ?? row.id, resource: row.url }));
        const candidateKey = JSON.stringify(candidates);

        /**
         * The flow's own long words about a refused sign-in, told to the console wherever the answer arrives.
         *
         * The face carries one short sentence and the code (`signinBlock`), and the flow's own sentence names the
         * address, the endpoint and the parameter — words a person repeats when asking about it — so it goes to
         * the console through this page's one door. It is said **wherever the answer lands**: the door's own read
         * of the rows, and the answer a press made, which is the same door. And it is said once per new refusal:
         * the door is read again while a person waits, and the same refusal is not news the second time.
         * @param {object[]} list what the page's own door answered, one entry per row it was asked about
         */
        const tellSignins = (list) => {
          for (const one of list ?? []) {
            if (one === null || (one.state !== 'refused' && one.state !== 'cancelled')) continue;
            const code = typeof one.code === 'string' && one.code !== '' ? one.code : 'signin-failed';
            const said = `${one.state}\u0000${code}\u0000${one.message ?? ''}`;
            if (toldSignin.get(one.server) === said) continue;
            toldSignin.set(one.server, said);
            /* The flow's own sentence is the half the face may not carry. Where the flow said nothing beyond its
               code — a withdrawal — the face's short sentence is the whole answer, and the console is not told the
               page's own words twice. */
            if (typeof one.message === 'string' && one.message !== '') {
              kit.statusDetail(one.server, `${shared.faultLines(code, null)[0]} — ${one.message}`);
            }
          }
        };

        /* The rows are asked about when the rows themselves change, and not on every read: the door's own
           answer costs a request to somebody's server the first time it is asked, and a picture read once a
           second would knock on it once a second. */
        React.useEffect(() => {
          if (candidateKey === '[]') return undefined;
          let live = true;
          askPage({ action: 'sign-ins', rows: JSON.parse(candidateKey) }).then(
            (answer) => {
              if (live) {
                tellSignins(answer.signins);
                setSignins(shared.byEntry(answer.signins));
              }
            },
            (error) => {
              /* A read that failed claims nothing: the states go, so no row keeps a control or a wait the door
                 no longer answers for, and the reason stands where a reader who needs it looks. */
              if (!live) return;
              setSignins({});
              kit.statusDetail(t('section'), `the sign-in door could not be read: ${shared.reasonOf(error)}`);
            },
          );
          return () => {
            live = false;
          };
        }, [candidateKey]);

        /* A sign-in waits for a person, and a person is not on a clock: the state is read again while one waits,
           and the reading stops when none does. A read that failed stops it too — the states it could not
           refresh are dropped rather than kept as a wait nothing stands behind. */
        const waiting = Object.values(signins)
          .filter((one) => one?.state === 'waiting')
          .map((one) => one.server)
          .sort()
          .join(',');
        React.useEffect(() => {
          if (waiting === '') return undefined;
          const timer = setTimeout(async () => {
            try {
              const answer = await askPage({ action: 'sign-ins', rows: JSON.parse(candidateKey) });
              tellSignins(answer.signins);
                setSignins(shared.byEntry(answer.signins));
            } catch (error) {
              setSignins({});
              kit.statusDetail(t('section'), `the sign-in door could not be read: ${shared.reasonOf(error)}`);
            }
          }, shared.SIGNIN_POLL_MS);
          return () => clearTimeout(timer);
        }, [waiting, signins, candidateKey]);

        /**
         * The long words of a failure, told to the console wherever the reason is read.
         *
         * The face carries one sentence — the server's own when it wrote one, the page's own for the family
         * otherwise — and the picture carries the platform's own record beside it: the status, the SDK's
         * classification and the responder's body as it came, which is what a person repeats when asking about
         * it. So the detail goes to the console, once per new record: a wait reads the same picture every
         * second, and the same record is not news the second time.
         */
        React.useEffect(() => {
          for (const row of state.picture?.rows ?? []) {
            const reason = row.failure ?? null;
            if (reason === null || typeof reason.detail !== 'string' || reason.detail === '') continue;
            const said = `${reason.family}\u0000${reason.detail}`;
            if (toldReason.get(row.entryId) === said) continue;
            toldReason.set(row.entryId, said);
            kit.statusDetail(row.server ?? row.id, reason.detail);
          }
        }, [state.picture]);

        /* A grant that stands and a row that does not read it is the other half of one press: the record was
           committed and the row was never joined to it, by a page closed mid-way or by a restart of the
           application. The write is the same one the press makes, and it never stands over a header a person
           wrote. */
        React.useEffect(() => {
          for (const row of state.picture?.rows ?? []) {
            const signin = signins[row.entryId] ?? null;
            if (!shared.needsJoin(row, signin)) continue;
            if (joined[row.entryId] === true) continue;
            setJoined((now) => (now[row.entryId] === true ? now : { ...now, [row.entryId]: true }));
            void join(row, signin);
          }
        }, [signins, state.picture]);

        /**
         * One save: the answer replaces the picture, and its outcome is said in the card it belongs to.
         *
         * The word comes from the answer's own `result` and not from the action that was asked for:
         * the plugin answers `nothing` when the file already stood as it is, and a page that called that
         * "saved" would claim a change nobody made.
         *
         * A refusal's reason is said where the answer arrives rather than where the room is drawn: the face
         * carries the word and the console carries the code's sentence, by the page's one door, so a press that
         * learned nothing is said every time it was made.
         */
        const save = async (body, server) => {
          setBusy(body.entryId ?? 'add');
          setNote(null);
          try {
            const picture = await ask('POST', body);
            setEditor(null);
            setConfirm(null);
            const word = shared.outcomeWord(picture.result);
            if (word !== null) {
              const note = { word, params: { server }, server };
              setNote(note);
              kit.statusDetail(server, shared.noteReason(note));
            }
            take(picture);
          } catch (error) {
            const note = { fault: { code: error instanceof Refused ? error.code : 'write-failed', message: shared.reasonOf(error) }, params: { server }, server };
            setNote(note);
            kit.statusDetail(server, shared.noteReason(note));
          } finally {
            setBusy(null);
          }
        };

        /* The file's own word on coming up loud is carried, not overwritten: a row whose file already names the key
           is saved without it, so the host leaves the value exactly as the file has it — which is what the picture
           says beside the row — while every row this form creates or saves is written loud. */
        const formFor = (draft) => {
          const row = (state.picture?.rows ?? []).find((one) => one.entryId === draft.entryId) ?? null;
          const form = shared.formOf(draft);
          if ((row?.kept ?? []).includes('failOnStartupError')) delete form.loud;
          return form;
        };
        /**
         * A refusal of the sign-in door, said where the press was made and in the console's own door.
         *
         * The word is the section's own — a refused sign-in reads as a refused sign-in — and the code's
         * sentence goes to the console, which is where a reason that leaves the face stands for this page.
         */
        const refusePress = (server, error, word) => {
          const code = error instanceof Refused ? error.code : 'signin-failed';
          const note = { fault: { code, message: shared.reasonOf(error) }, word, params: { server }, server };
          setNote(note);
          kit.statusDetail(server, shared.noteReason(note));
        };

        /**
         * The write that joins a row to the grant its sign-in committed: the reference into the row's own
         * header, and the row activated afresh, because the transport holds the headers it was built with —
         * a token reaches a connection by the row being loaded again and by nothing else.
         */
        const join = async (row, signin) => {
          const server = row.server ?? row.id;
          setBusy(row.entryId);
          try {
            await ask('POST', {
              action: 'reference',
              entryId: row.entryId,
              reference: signin.reference.key,
              expression: signin.reference.expression,
            });
            const picture = await ask('POST', { action: 'reload', entryId: row.entryId });
            setNote({ word: 'signin.done', params: { server }, server });
            take(picture);
          } catch (error) {
            refusePress(server, error, 'signin.refused');
          } finally {
            setBusy(null);
          }
        };

        const act = {
          open: (draft) => {
            setNote(null);
            setEditor({ draft });
          },
          close: () => setEditor(null),
          patch: (patch) => setEditor((current) => (current === null ? current : { draft: { ...current.draft, ...patch } })),
          patchPair: (kind, index, patch) => setEditor((current) => {
            if (current === null) return current;
            const pairs = (current.draft[kind] ?? []).map((pair, at) => (at === index ? { ...pair, ...patch } : pair));
            return { draft: { ...current.draft, [kind]: pairs } };
          }),
          addPair: (kind) => setEditor((current) => {
            if (current === null) return current;
            const pairs = current.draft[kind] ?? [];
            return { draft: { ...current.draft, [kind]: [...pairs, { key: kind + "." + pairs.length + "." + Date.now(), name: "", value: "" }] } };
          }),
          dropPair: (kind, index) => setEditor((current) => {
            if (current === null) return current;
            return { draft: { ...current.draft, [kind]: (current.draft[kind] ?? []).filter((pair, at) => at !== index) } };
          }),
          save: (draft) => save(
            draft.entryId === null
              ? { action: 'add', form: formFor(draft) }
              : { action: 'edit', entryId: draft.entryId, form: formFor(draft) },
            draft.server,
          ),
          ask: (row) => {
            setNote(null);
            setConfirm(row);
          },
          cancelRemove: () => setConfirm(null),
          /**
           * The removal: the row's grant goes **before** the row does.
           *
           * The flow's own records for that server are dropped first, so a row added again is signed in again
           * rather than silently remembering a token (requirement 7). The drop is asked of the flow through this
           * page's own door — the page never reaches into the store itself — and a refusal of it is told where a
           * reason that may not stand on the face goes: the servers file is the person's own, so their press is
           * not held by a record that could not be dropped, and the trace stands in the console rather than
           * nowhere.
           */
          remove: async (row) => {
            const server = row.server ?? row.id;
            /* The busy state is taken before the grant is dropped: the dialog's buttons read it, and a second
               press in the window between the two writes would ask for the same removal twice. */
            setBusy(row.entryId);
            try {
              try {
                await askPage({ action: 'forget', server });
              } catch (error) {
                kit.statusDetail(server, `the grant was not dropped: ${shared.reasonOf(error)}`);
              }
              await save({ action: 'remove', entryId: row.entryId }, server);
            } finally {
              setBusy(null);
            }
          },
          toggle: (row, enabled) => save({ action: 'toggle', entryId: row.entryId, enabled }, row.server ?? row.id),
          /* The sign-in: the press starts the attempt through the page's own door, and the card that carries
             the row opens, because the link the flow hands out stands in its body — the person's next act is
             to follow it, and it must not stand behind a disclosure nobody opened. */
          signin: async (row) => {
            setNote(null);
            setBusy(row.entryId);
            try {
              const answer = await askPage({ action: 'sign-in', entryId: row.entryId, server: row.server ?? row.id, resource: row.url });
              tellSignins([answer.signin]);
              setSignins((now) => ({ ...now, [row.entryId]: answer.signin }));
              setOpenRows((now) => new Set(now).add(row.entryId));
            } catch (error) {
              refusePress(row.server ?? row.id, error, 'signin.refused');
            } finally {
              setBusy(null);
            }
          },
          /* The question the flow asked, answered; and the wait withdrawn through the platform's own door. */
          reply: async (row) => {
            const server = row.server ?? row.id;
            setBusy(row.entryId);
            try {
              const answer = await askPage({ action: 'answer', server, value: (answers ?? {})[server] ?? '' });
              setAnswers((now) => ({ ...now, [server]: '' }));
              tellSignins([answer.signin]);
              setSignins((now) => ({ ...now, [row.entryId]: answer.signin }));
            } catch (error) {
              refusePress(server, error, 'signin.refused');
            } finally {
              setBusy(null);
            }
          },
          type: (server, value) => setAnswers((now) => ({ ...now, [server]: value })),
          withdraw: async (row) => {
            setBusy(row.entryId);
            try {
              const answer = await askPage({ action: 'cancel', server: row.server ?? row.id });
              tellSignins([answer.signin]);
              setSignins((now) => ({ ...now, [row.entryId]: answer.signin }));
            } catch (error) {
              refusePress(row.server ?? row.id, error, 'signin.refused');
            } finally {
              setBusy(null);
            }
          },
          isBusy: (entryId) => busy === entryId,
          /* The row's disclosure and its menu: the drawing reports the press, the section holds the state. */
          row: (entryId, open) => setOpenRows((current) => {
            const next = new Set(current);
            if (open === true) next.add(entryId);
            else next.delete(entryId);
            return next;
          }),
          menu: (entryId) => setOpenMenu(entryId),
        };

        return shared.draw({
          status: state.status,
          picture: state.picture,
          fault: state.fault,
          editor,
          confirm,
          busy,
          note,
          open: openRows,
          menu: openMenu,
          signins,
          answers,
        }, act);
      }

      return { McpSection };
    }

    return { create };
  },
});
