/**
 * The General page: the product's small settings, one card at a time.
 *
 * The page exists for a setting that deserves a control but not a page of its own. Its first card is the
 * Agent Team's: the ceiling the team row carries, and the two switches that let the product's own text —
 * and the review paragraph that rides inside it — stand in place of the platform's last sentence of the
 * team policy. The ceiling is read from the host's route and written back through it; the switches are
 * volatile fields of the team row, written through the platform's settings service, as the product's other
 * switches are.
 *
 * The namespace the switches write is the host's own answer (`ns`): the row's id in the composition lives
 * in the composition, and a copy of it here would drift. A write is followed by a read of the route and
 * of the settings row — the card draws what the platform holds, never the word the press asked for — and
 * the platform's own announcement that the settings document moved re-reads the same two.
 *
 * A section chunk of the product's page, pulled by the entry with `require.async` and registered into the
 * seat the page declares. It draws with the page's own set — the card frame, the section title, the
 * answer strip, the field label, the check, the status dot, the button and the hint lines — adding only
 * the classes its own card owns.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.general.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/ui';
    /** The seat the page declares for its sections. */
    const SEAT = 'coreness.section';
    /** The rail row's own id inside that seat. */
    const ID = 'general';
    /** The locale namespace of the page's words. */
    const NS = 'coreness.general';
    /** The host route that reads and writes the team's ceiling, and reports the policy's outcome. */
    const ROUTE = '/api/coreness.team';
    const STYLE_ID = 'coreness-ui-general-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/ui/client.general.js';
    /** The platform's announcements that invalidate what the card read. */
    const WATCHED = ['settings/document-updated'];

    /** The page's own words. One namespace, one dictionary; the rail's label is a thunk so it follows the language. */
    const EN = {
      section: 'General',
      'team.title': 'Agent team',
      'team.field': 'Teammates',
      'team.save': 'Save',
      'team.remark': 'A change re-applies the team row: running teammates stop, and the roster and the board recover from the Lead\'s session log.',
      'team.prompt': 'Team prompt',
      'team.promptHint': 'On, the product\'s paragraph stands in the Lead\'s prompt in place of the policy\'s last sentence: the Lead leads and sets the plan, hands the work out as shared tasks, takes none of the members\' work over, and answers for the result — it closes the task while the user judges the surface they see, and it never holds a turn open: no wait_agent, no sleep or poll inside a command; when time must pass it sets a reminder and ends the turn. Every other line of the policy stays as the platform wrote it, and a teammate\'s prompt keeps the platform\'s text. Off, the text is the platform\'s, untouched. When the policy\'s last sentence is not the one the switch replaces, it changes nothing until it is. Applies from the session\'s next step; a change may invalidate the provider\'s cached prefix.',
      'team.review': 'Review pass',
      'team.reviewHint': 'On, the paragraph about reviews follows the team text in the Lead\'s prompt: a reviewer is a fresh agent with a clean eye, called on every circle of work and not on small tasks; it holds the work against the spec and the traces, asks where it is weak, where it is extra and what is missing, and every finding carries a path and a quote; it does not edit and does not accept, and the review does not replace the acceptance that closes the task. The paragraph stands inside the text the Team prompt switch supplies, so it changes nothing while that switch is off.',
      'team.reading': 'Reading the team picture…',
      'team.unavailable': 'This composition cannot write the team row; its value stands in the Cordis configuration.',
      'team.missing': 'The team service is not mounted; the ceiling applies when it is.',
      'state.error': 'The team could not be read',
      'state.unread': 'Not read',
      'state.saved': 'Saved',
      'state.refused': 'Not saved',
      'reason.invalid': 'The ceiling is a whole number of at least 1.',
      'reason.unreachable': 'The team route could not be reached.',
      'reason.unreadable': 'The value in force could not be re-read',
    };

    /* The card's own look: the frame, the strip's room, the field's box and the check are the page's; a
       section keeps only what is its own. */
    const CSS = `
.coreness-general-card{margin:12px 0 0}
.coreness-general-head{display:flex;align-items:center;gap:10px}
.coreness-general-head .coreness-sectionTitle{flex:1 1 auto}
.coreness-general-field{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.coreness-general-label{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}
.coreness-general-input{box-sizing:border-box;flex:1 1 0;min-width:0;padding:6px 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px}
.coreness-general-input:disabled{opacity:.5}
.coreness-general-check{display:flex;align-items:center;gap:8px;font-size:14px;line-height:22px}
`;

    /** Put the page's sheet back where a re-mount of the plugin may have taken it. */
    function ensureStyles() {
      if (document.getElementById(STYLE_ID) !== null) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.setAttribute('data-plugin', PACKAGE);
      style.setAttribute('data-plugin-css', STYLE_TAG);
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    /**
     * The section's sheet, held for as long as the section stands: put in here, put back if it is taken.
     * The platform replaces a plugin in place and takes the package's style tags with it, and the mount is
     * the one place a sheet can be put back; the hold ends with the effect, because a sheet that outlived
     * its plugin would be a trace.
     */
    function useStyles() {
      React.useEffect(() => {
        let stands = true;
        const put = () => {
          if (stands) ensureStyles();
        };
        put();
        const watcher = new MutationObserver(put);
        watcher.observe(document.head, { childList: true });
        return () => {
          stands = false;
          watcher.disconnect();
        };
      }, []);
    }

    /** The message of a thrown value. */
    const reasonOf = (error) => (error instanceof Error ? error.message : String(error));

    /** The box's text for a picture: empty when no ceiling is in force. */
    const draftOf = (value) => (value?.maxMembers === null || value?.maxMembers === undefined ? '' : String(value.maxMembers));

    let t = (key) => key;

    /**
     * The team as the host answers it: `{mounted, editable, maxMembers, prompt, review, policy, ns}`.
     *
     * A refusal is read from the payload, never guessed from a status: the route answers `{ok:false}` with
     * status 200 for a state it could not build, and a card that drew "no ceiling" there would be showing
     * a failure as an empty row.
     */
    /**
     * One request to the host's route. A transport failure — the route gone, the page's own connection down —
     * is the card's sentence, not the browser's: "Failed to fetch" is what a raw throw reads like, and the
     * card is no place for a message nothing on the page can act on. The cause goes to the console.
     */
    async function reach(init) {
      try {
        return await fetch(ROUTE, init);
      } catch (error) {
        console.error(`${PACKAGE}: ${ROUTE} could not be reached: ${reasonOf(error)}`);
        throw new Error(t('reason.unreachable'));
      }
    }

    /**
     * The team picture. A failure is a sentence the page owns; the route's own words stand when it answered.
     */
    async function read() {
      const answer = await reach({ method: 'GET' });
      if (!answer.ok) throw new Error(`${ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${ROUTE} refused the read`);
      return payload.value;
    }

    /**
     * One write of the ceiling. The refusal travels with the platform's own words when the editor refused
     * it, and with the route's own when the value was not a whole number of at least 1.
     */
    async function write(value) {
      const answer = await reach({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ maxMembers: value }),
      });
      if (!answer.ok) throw new Error(`${ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${ROUTE} refused the write`);
      return payload.value;
    }

    /**
     * The switches' row from the platform's settings mirror: its revision and its two values, or `null`
     * when the composition addresses no row or the row carries no namespace — a page that drew a switch
     * there would offer a write that cannot land. `on` is the first switch, whose text the second one's
     * paragraph rides in.
     */
    async function readSwitch(remote, ns) {
      if (typeof ns !== 'string' || ns === '') return null;
      const described = await remote.settings.describe();
      if (!described.ok) throw new Error(described.error?.message ?? 'the settings service refused the read');
      const row = described.value.namespaces.find((one) => one.ns === ns);
      if (row === undefined) return null;
      return { ns, revision: row.revision, on: row.value?.prompt === true, review: row.value?.review === true };
    }

    /**
     * One write of one switch, with the revision the read answered. What answers is the platform's view of
     * the row after the write — the card stands on that, not on the word the press asked for; the route is
     * re-read after it for the patch's outcome, which only the next assembly can change.
     */
    async function writeSwitch(remote, row, field, on) {
      const written = await remote.settings.mutate(row.ns, [{ op: 'set', path: [field], value: on }], row.revision);
      if (!written.ok) throw new Error(written.error?.message ?? 'the settings service refused the write');
      const view = written.value;
      return {
        ns: row.ns,
        revision: view?.revision ?? row.revision,
        on: view?.value?.prompt === true,
        review: view?.value?.review === true,
      };
    }

    /**
     * The answer to a press, in the card head's own strip: the page's room for exactly this word, drawn
     * always and empty while nothing is said, so a word that comes and goes moves nothing. Its tone is the
     * page's (`done` / `fault`).
     */
    /**
     * What the last settled read answered: the browser half is materialised once per application session, so a
     * section left and entered again has this beside it, and the mount paints it at once while the read
     * corrects it behind. It holds the route's picture and the switch — never the visit's own state, the draft,
     * a note, a press in flight or a read that failed — and the session's first mount has nothing, which is the
     * honest skeleton.
     */
    let lastRead = null;

    /** The state a mount starts from: the last picture when one stands, and the skeleton when none does. */
    const startState = () => (lastRead === null
      ? {
          status: 'loading', refreshing: true, value: null, draft: '', note: null, busy: false,
          prompt: null, promptBusy: false, promptFault: false, beatFault: false, readFault: false,
        }
      : {
          status: 'ready', refreshing: true, value: lastRead.value, draft: draftOf(lastRead.value), note: null, busy: false,
          prompt: lastRead.prompt, promptBusy: false, promptFault: false, beatFault: false, readFault: false,
        });

    /** The page as it stands: both reads settle before the card is drawn once, and a press is read back. */
    function GeneralSection({ kit, ctx, hold, card }) {
      useStyles();
      kit.useStatusStyles();
      const [state, setState] = React.useState(startState);

      /** The console's door is the kit's: one subject, one place, said where the answer arrived. */
      const say = React.useCallback((reason) => kit.statusDetail(t('team.title'), reason), [kit]);

      /** Which read is the newest: an answer that is no longer the newest does not publish. */
      const newestRead = React.useRef(0);
      const nextRead = React.useCallback(() => {
        newestRead.current += 1;
        return newestRead.current;
      }, []);

      /** The answer's lifetime is the page's hold, not the next render: every note — a save and a refusal —
       * goes by itself, and a second note replaces the first without leaving a timer behind. It is armed
       * after the state was set and never inside an updater. */
      const noteTimer = React.useRef(null);
      const armHold = React.useCallback(() => {
        if (noteTimer.current !== null) clearTimeout(noteTimer.current);
        noteTimer.current = setTimeout(() => setState((now) => ({ ...now, note: null })), hold.holdOf());
      }, [hold]);
      React.useEffect(() => () => {
        if (noteTimer.current !== null) clearTimeout(noteTimer.current);
      }, []);

      /** The picture a later mount paints: a settled read, a save and a flip alike leave it standing, and a
       * failure leaves the last picture alone rather than replacing knowledge with a sentence about a moment. */
      React.useEffect(() => {
        if (state.status !== 'ready') return;
        lastRead = { value: state.value, prompt: state.prompt };
      }, [state.status, state.value, state.prompt]);

      /** Both reads of one moment: the route's picture, and the switch's row in the namespace it names. The
       * settings row failing is said on the console and costs only the switch: the ceiling was read, and a card
       * that failed whole there would hide a value the route carries. */
      const readAll = React.useCallback(async () => {
        const value = await read();
        let prompt = null;
        let promptFault = false;
        try {
          prompt = await readSwitch(ctx.remote, value?.ns ?? null);
        } catch (error) {
          promptFault = true;
          say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
        }
        return { value, prompt, promptFault };
      }, [ctx, say]);

      React.useEffect(() => {
        let live = true;
        const ticket = nextRead();
        readAll().then(
          ({ value, prompt, promptFault }) => {
            if (!live || newestRead.current !== ticket) return;
            setState((now) => ({ ...now, status: 'ready', refreshing: false, readFault: false, value, draft: draftOf(value), prompt, promptFault }));
          },
          (error) => {
            if (!live || newestRead.current !== ticket) return;
            const reason = reasonOf(error);
            setState((now) => (now.status === 'ready'
              ? { ...now, refreshing: false, readFault: true }
              : { ...now, status: 'failed', refreshing: false, readFault: true }));
            say(reason);
          },
        );
        return () => {
          live = false;
        };
      }, [nextRead, readAll, say]);

      /* The platform's announcement that the settings document moved — a hand's edit of the profile's
         patch, or another page's write — is the same event for the switch: both reads are taken again, so
         the face follows the rows rather than the moment the section mounted. */
      React.useEffect(() => {
        let live = true;
        const reread = () => {
          const ticket = nextRead();
          readAll().then(
            ({ value, prompt, promptFault }) => {
              if (!live || newestRead.current !== ticket) return;
              setState((now) => ({
                ...now,
                /* A first read that failed is not the card's sentence forever: a later answer takes the card
                   back to standing. */
                status: 'ready',
                readFault: false,
                promptFault,
                value,
                /* A settings half that could not be read keeps the view the card already holds. */
                prompt: prompt ?? now.prompt,
                /* A draft the reader has changed is theirs; an unedited one follows the read. */
                draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(value),
              }));
            },
            (error) => {
              if (!live || newestRead.current !== ticket) return;
              say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
              setState((now) => ({ ...now, readFault: true }));
            },
          );
        };
        const disposers = WATCHED.map((name) => ctx.remote.$on(name, reread));
        const offReset = ctx.on('connection/reset', reread);
        return () => {
          live = false;
          for (const dispose of disposers) dispose();
          offReset();
        };
      }, [ctx, nextRead, readAll, say]);

      /* The patch's outcome changes at the next team assembly, and no client announcement follows it: while
         the switch is on, the route is asked on the page's own beat, so "the patch is inactive" appears with
         the step that left it rather than on the next unrelated event. The same beat asks while a failed read
         stands over a remembered picture: a card left on what it last read must not keep a failure silent.
         A hidden tab is not asked, and a failed ask says so on the card instead of freezing the picture. */
      const promptOn = state.prompt?.on === true;
      const beatOn = promptOn || state.readFault === true;
      React.useEffect(() => {
        if (!beatOn) return undefined;
        let live = true;
        const timer = setInterval(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          read().then(
            (value) => {
              if (!live) return;
              setState((now) => ({
                ...now,
                value,
                beatFault: false,
                readFault: false,
                draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(value),
              }));
            },
            (error) => {
              if (!live) return;
              say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
              setState((now) => ({ ...now, beatFault: true, readFault: true }));
            },
          );
        }, hold.BEAT_MS);
        return () => {
          live = false;
          clearInterval(timer);
        };
      }, [beatOn, hold, say]);

      /* One write of one switch: both switches live in the same row, and what answers is the platform's view
         of it after the write. The route is read after it for the patch's outcome, which the write does not
         change; a route that cannot be read is said on the console and costs nothing — the row did move, and
         the strip says so. */
      const flip = (field, on) => {
        const row = state.prompt;
        if (row === null) return;
        setState((now) => ({ ...now, promptBusy: true, note: null }));
        writeSwitch(ctx.remote, row, field, on).then(
          (view) => {
            setState((now) => ({
              ...now,
              promptBusy: false,
              prompt: view,
              note: { tone: 'done', text: t('state.saved'), subject: field },
            }));
            armHold();
            const ticket = nextRead();
            void readAll().then(
              ({ value, prompt, promptFault }) => {
                if (newestRead.current !== ticket) return;
                setState((now) => ({
                  ...now,
                  value,
                  readFault: false,
                  prompt: prompt ?? now.prompt,
                  promptFault,
                  draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(value),
                }));
              },
              (error) => {
                if (newestRead.current !== ticket) return;
                say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
                setState((now) => ({ ...now, readFault: true }));
              },
            );
          },
          (error) => {
            const reason = reasonOf(error);
            say(reason);
            setState((now) => ({
              ...now,
              promptBusy: false,
              note: { tone: 'fault', text: t('state.refused'), subject: field, detail: reason },
            }));
            armHold();
            void readSwitch(ctx.remote, row.ns).then(
              (next) => setState((now) => ({ ...now, prompt: next, promptFault: false })),
              (error) => {
                say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
                setState((now) => ({ ...now, promptFault: true }));
              },
            );
          },
        );
      };

      const act = {
        draft: (text) => setState((now) => ({ ...now, draft: text, note: null, })),
        save: () => {
          /* The card refuses a value the row's schema would refuse, before anything is sent: the acceptance
             is the card's own, and the route's refusal stays for a hand that writes the route directly. */
          const value = Number(state.draft);
          if (!Number.isSafeInteger(value) || value < 1) {
            say(t('reason.invalid'));
            setState((now) => ({
              ...now,
              note: { tone: 'fault', text: t('state.refused'), subject: 'ceiling', detail: t('reason.invalid') },
            }));
            armHold();
            return;
          }
          setState((now) => ({ ...now, busy: true, note: null }));
          write(value).then(
            (picture) => {
              setState((now) => ({
                ...now,
                busy: false,
                value: picture,
                draft: draftOf(picture),
                note: { tone: 'done', text: t('state.saved'), subject: 'ceiling' },
              }));
              armHold();
            },
            (error) => {
              /* The platform's words stand on the card and in the console: the word alone would leave the
                 reader without the cause, as an overridden row proved. */
              const reason = reasonOf(error);
              say(reason);
              setState((now) => ({
                ...now,
                busy: false,
                note: { tone: 'fault', text: t('state.refused'), subject: 'ceiling', detail: reason },
              }));
              armHold();
              const ticket = nextRead();
              void readAll().then(
                ({ value: picture, prompt, promptFault }) => {
                  if (newestRead.current !== ticket) return;
                  setState((now) => ({
                    ...now,
                    value: picture,
                    readFault: false,
                    prompt: prompt ?? now.prompt,
                    promptFault,
                    draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(picture),
                  }));
                },
                (error) => {
                  if (newestRead.current !== ticket) return;
                  say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
                  setState((now) => ({ ...now, readFault: true }));
                },
              );
            },
          );
        },
        prompt: (on) => flip('prompt', on),
        review: (on) => flip('review', on),
      };
      return card.draw(state, act, kit);
    }

    /** The kit's status dot and its sheet, pulled before the section stands: the switch's state stands with it. */
    const KIT = require.async('./client.kit.js');
    /** The page's shared lifetime of a temporary answer. */
    const HOLD = require.async('./client.hold.js');
    /** The card's own drawing. */
    const CARD = require.async('./client.general.card.js');

    return {
      /** Register the page into the seat the entry declares. */
      apply(pluginCtx) {
        t = pluginCtx.locale.bind(NS);
        pluginCtx.effect(() => pluginCtx.locale.register(NS, 'en', EN), `${PACKAGE}: the General dictionary`);
        /* The rail row stands before any read: the page is a place, and what it shows is the read's answer.
           It stands first — settings before facts — so the panel lands on General and the facts follow it.
           The kit and the hold are pulled first: the switch's dot is the kit's, and a section that stood
           without it would have to invent one — its sheet included, held by the section that draws it. A
           pull that failed is named on the console and seats nothing. */
        pluginCtx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([KIT, HOLD, CARD]).then(
            ([kit, hold, card]) => {
              if (!live) return;
              armed = pluginCtx.slots.inject(SEAT, () => pluginCtx.slots.register({
                name: SEAT,
                id: ID,
                order: 0,
                label: () => t('section'),
                locale: NS,
              }, () => h(GeneralSection, { kit, hold, card, ctx: pluginCtx })));
            },
            (error) => {
              console.error(`${PACKAGE}: a chunk for the General section did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof armed === 'function') armed();
          };
        }, `${PACKAGE}: the kit, the hold and the General section`);
      },
    };
  },
});
