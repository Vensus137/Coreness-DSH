/**
 * The Qoder section's drawing: the section's own frame, the frames of the first paint, the one status a
 * card's corner carries, and the reasons a sweep's nodes gave.
 *
 * A package-local part of `client.provider.js`, pulled by it with `require.async` and created before the
 * section is seated. The cards themselves stand in the parts beside this one — the connection, the models
 * and the node — and this file composes them: it makes each card's head, in one place, out of the one
 * status map the page keeps, so no card can say a thing another one does not.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.provider.draw.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The drawing's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /**
       * The strip of a card of this section: one sentence about the press that was just made, in the room the answer
       * of a press stands in, and empty when that press's news has gone.
       *
       * It is the page's own answer room: the class, the reserved width, the ellipsis and the tone colours are the
       * page's sheet's (`--coreness-news-strip`, `.coreness-answer`), and this chunk writes no width and no colour of
       * its own. It stands **drawn always**, empty while nothing is said, because a strip that appears with its word
       * and goes with it moves the card it stands in — the MCP's own head paid for that lesson (its strip went
       * 60 px → 98 px and the room under the name 404 px → 437 px while it was drawn only with a word in it).
       *
       * What it carries is the section's own dictionary and never a status word: a status is the card's state at its
       * corner (`statusNode`, out of the one map), while news is a sentence the section owns — which is why the two
       * stand apart on the page, the strip carrying no `data-status` and the corner carrying no `data-note`.
       */
      const answerStrip = (said = null) => h('span', {
        key: 'answer',
        className: 'coreness-answer',
        'data-note': 'head',
        /* The tone, in the attribute the instruments read: a press that wrote nothing is `plain`, the same tone the
           sections' own no-op words carry, and an empty room carries none — a room with nothing in it states
           nothing. */
        'data-tone': said === null ? undefined : 'plain',
        role: 'status',
        'aria-live': 'polite',
      }, said ?? '');

      /**
       * The section as it stands before the read answers: the frames of what is coming.
       *
       * The read is a round trip — the platform's own doors, then the vendor's catalogue — and a section
       * drawn from it alone is one line until the answer lands, when it becomes three cards and every block
       * under it moves. So the frames stand first: the same three cards, the same heads with the room a state
       * keeps, and the sentences the section owns — a title, a hint, a phrase read the same before and after
       * the read, so drawing them is not a claim about the answer. Where the read's own content will land —
       * the value, the address, a control, a row — a bar stands instead, wearing the class of the part it
       * stands for so its box is that part's own rule and not a second number in the stylesheet. The bars are
       * marked `data-skeleton` with the part they stand for: the live walk reads the frames by that mark.
       *
       * What it refuses: the list of models stands, and its rows do not — the count is the read's own news,
       * and a skeleton that drew four rows would be inventing it. No control is drawn either: nothing on this
       * surface can be pressed before it has been read. And no sentence is measured by hand here: a sentence
       * wraps where the browser wraps it, and the one that wraps in two lines is the browser's number and not
       * this function's. Every frame carries the card's answer strip as the settled card carries it — drawn
       * and empty — so the room a press's sentence will stand in is the room the frame already gives it, and the
       * word arriving moves no box of the frame it arrives in. A profile that declares no route, or whose settings
       * are unmounted, is a case only the read can answer; until it lands, three frames are what is coming for every
       * profile that carries the route.
       */
      function firstPaint() {
        const bar = (key, part, className) => h('div', {
          key,
          className: `${className} coreness-qoder-skeleton`,
          'data-skeleton': part,
        });
        const frame = (label, subject) => h('div', { key: 'head', className: 'coreness-qoder-head coreness-card-head' }, [
          h('span', { key: 'name', className: 'coreness-qoder-name' }, label),
          subject === null || subject === undefined ? null : kit.statusNode({ subject, value: 'loading' }),
          answerStrip(),
        ]);
        return [
          h('div', { key: 'credential', className: 'coreness-qoder-card' }, [
            /* The section's own read stands on the first card, which is the section's own — the same place
               its failure stands once there is a read to fail. */
            frame(t('credential.label'), t('status.subject.token')),
            h('div', { key: 'field', className: 'coreness-field coreness-qoder-field' }, [
              h('label', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('field.token')),
              bar('input', 'input', 'coreness-qoder-input coreness-field coreness-field-box'),
            ]),
            h('div', { key: 'actions', className: 'coreness-qoder-actions' }, [bar('save', 'button', 'coreness-qoder-button coreness-button')]),
            h('div', { key: 'node', className: 'coreness-qoder-node' }, [
              bar('where', 'line', 'coreness-qoder-line'),
              bar('check', 'button', 'coreness-qoder-button coreness-button'),
            ]),
          ]),
          h('div', { key: 'web', className: 'coreness-qoder-card' }, [
            frame(t('web.title'), null),
            h('div', { key: 'row', className: 'coreness-qoder-check' }, [
              h('div', { key: 'box', className: 'coreness-qoder-line coreness-qoder-skeleton', 'data-skeleton': 'check' }),
            ]),
            h('p', { key: 'foot', className: 'coreness-qoder-dim coreness-dim' }, t('web.footnote')),
          ]),
          h('div', { key: 'models', className: 'coreness-qoder-card' }, [
            frame(t('models.label'), null),
            /* The line that names whose the x is stands in the loading frame **as itself**, not as a bone: the
               rule is true before any answer, and a bone carries no text to hold the height the answered line
               takes — a bar of a part without height measures 0 px against the 18 px the line takes once the
               read lands, and the walk's own frame check reads exactly that. What the read adds to it is the moment. */
            h('ul', { key: 'list', className: 'coreness-list coreness-qoder-models' }, []),
            h('div', { key: 'add', className: 'coreness-qoder-actions' }, [bar('addRow', 'add', 'coreness-add coreness-qoder-add coreness-button')]),
            h('p', { key: 'windowNote', className: 'coreness-qoder-dim coreness-dim' }, t('models.windowNote')),
            h('p', { key: 'note', className: 'coreness-qoder-dim coreness-dim' }, t('models.note')),
            h('div', { key: 'actions', className: 'coreness-qoder-foot' }, [
              bar('reset', 'button', 'coreness-qoder-button coreness-button'),
              h('div', { key: 'right', className: 'coreness-qoder-actions' }, [
                bar('cancel', 'button', 'coreness-qoder-button coreness-button'),
                bar('apply', 'button', 'coreness-qoder-button coreness-button'),
              ]),
            ]),
          ]),
        ];
      }

      /* The section's own read, failed while the section still stands. It stands on the first card,
         which is the section's own, and yields to a refusal of an action — fresher news about what the
         user just pressed — while outranking a success whose confirmation that read was. */
      const readFailureOf = (view) => (view.status === 'failed' && view.view !== null ? view.reason : null);
      /** Whether this profile may write through the row it read: the one reading of that question. */
      const writableOf = (state) => state !== null && state.ref !== null && state.credential?.writable === true;

      /**
       * The card's one status: a value out of the shared map, and the subject its sentence is about.
       *
       * One value per card, and it is the newest answer about that card's subject — a press's outcome while
       * its hold lasts, the vendor's verdict while the value it judged stands, and the read's own answer
       * when there is no press. A node's answer is one of those outcomes: the press that asked for it
       * writes a note (`check`), so it stands for the page's own hold and goes with it, and a sweep that is
       * no longer news states nothing — the record it leaves behind is the reasons list under the cards and
       * the address the row now names, never a word of its own.
       *
       * What only this profile can know — a reference nobody named, a store this home does not own, the
       * fields a row is missing, the reason a read failed — is a fact about our configuration and not about
       * the reader's token, so it travels beside the value as `detail` and is said in the console rather
       * than on the face, which carries the state alone. The one sentence a press of the models card draws
       * is not this value: it is the section's own words, and it stands in the card's answer room
       * (`answerStrip`) beside the state.
       */
      const SUBJECTS = { credential: 'status.subject.token', node: 'status.subject.node', models: 'status.subject.models', web: 'web.title' };
      const statusOf = (view, where) => {
        const subject = t(SUBJECTS[where]);
        const state = view.view;
        const problems = view.draft === null || view.draft === undefined ? [] : shared.checkRows(view.draft);
        const readFailure = readFailureOf(view);
        const writable = writableOf(state);
        /* The newer fact wins: a note is what a press has just learned, and the picture's own facts — the
           fields a row is missing, a home that cannot be written — are what stands while nothing is pressed.
           Read the other way round the press's word was unreachable, and a card answered a press with a fact
           that was already true before it. */
        const mine = view.note !== null && view.note !== undefined && view.note.where === where ? view.note : null;
        /* The mark is derived from the value, for the node's row alone: a note carries no marks of its own,
           and the row the driver's walk reads must carry `data-answer` whatever word stands on it. */
        if (mine !== null) return { subject, value: mine.value, data: where === 'node' ? { 'data-answer': mine.value === 'answered' ? 'connected' : 'none' } : undefined };
        if (state !== null && state.status === 'ready' && state.settings != null && (where === 'credential' || where === 'models')) {
          if ((state.settings.missing ?? []).length > 0) {
            return { subject, value: 'unwritable', detail: t('state.unwritable', { fields: shared.fieldWords(state.settings.missing) }) };
          }
          if (state.settings.writable !== true) {
            return { subject, value: 'unwritable', detail: t('state.readonly') };
          }
        }
        if (readFailure !== null && (where === 'credential' || where === 'web')) return { subject, value: 'unread', detail: readFailure };
        /* Nothing is read yet: the frames of the wait draw their own word, and a card that does not exist yet
           states nothing. The account asks this function on every render, and the first render of a section
           holds no picture at all — the guard stood here as a dereference of what the ready path always had. */
        if (state === null) return { subject, value: null };
        /* The node's own subject states nothing by itself: what a sweep answered is its press's news, and it
           stands as that press's note above — while the note lives. A record with no note is a sweep whose
           word has gone, and the card says its own state again rather than an answer nobody is waiting for. */
        if (where === 'node') return { subject, value: null };
        if (where === 'credential') {
          /* The reference this profile names is what the store is asked about, and a profile that names none
             has nothing set in this card's own terms; the reference itself is our configuration, so it is
             said in the console and never on the face. */
          /* A picture that carries no reference and no model list at all is not a settings read — the route
             is declared without its namespace, or the read failed: nothing is stated, because nothing was
             read. The account asks this function on every render, so the reading is total over every picture
             the section can hold and does not lean on the drawing's own early returns to keep it in range. */
          if (state.ref === undefined) return { subject, value: null };
          /* A profile that names no reference: nobody was asked, so the face says nothing about a store
             and the account is the console's. A word here would be this page claiming what it never read. */
          if (state.ref === null) return { subject, value: null, detail: t('detail.noplace') };
          if (!writable) return { subject, value: 'unwritable', detail: t('detail.external') };
          return { subject, value: state.credential?.configured === true ? 'set' : 'unset' };
        }
        /* Web: the card states the switch's own value; a row that could not be read is a fault, not
           "off", and a read-only row cannot be pressed. A missing token or an off flag is off in effect
           even where a stale row still names Qoder: the card's note says the default search stands, and
           the section's read clears that row. */
        if (where === 'web') {
          if (state.web === undefined || state.web === null) return { subject, value: null };
          if (state.web.ok !== true) return { subject, value: 'unread', detail: state.web.fault };
          if (state.web.writable !== true) return { subject, value: 'unwritable', detail: t('state.readonly') };
          const tokenMissing = state.ref === null || state.ref === undefined || state.credential?.configured !== true;
          if (tokenMissing || state.webEnabled !== true) return { subject, value: 'unset' };
          return { subject, value: shared.checkedOf(state.web.value) ? 'set' : 'unset' };
        }
        /* Models: the draft's own first refusal outranks the reading, and the reading outranks the
           route's own list, which is the oldest news of the three. */
        if (state.catalogue === undefined || state.catalogue === null) return { subject, value: null };
        if (problems.length > 0) return { subject, value: 'unsaved', detail: `Row ${problems[0].index + 1}: ${problems[0].message}` };
        /* A draft that stands says the same word the refused one does, and outranks the reading for the same
           reason: what the reader has in front of them is not in the profile until `Apply` writes it, and the
           two windows two presses leave are explained by that and by nothing the catalogue says. The catalogue's
           own word is not lost with it — the list's own line says what it is doing — and the corner keeps the
           map's one word for a value that is not written. */
        if (view.draft !== null && view.draft !== undefined) return { subject, value: 'unsaved' };
        if (state.catalogue.models === null && state.catalogue.message === null) return { subject, value: 'loading' };
        if (state.catalogue.message !== null) return { subject, value: 'unread', detail: state.catalogue.message };
        if (state.failure === null || state.failure === undefined) return { subject, value: null };
        return { subject, value: 'unread', detail: `${t('models.failed')}: ${state.failure.message}` };
      };

      /** The section as it stands, from the read alone: the states, the token, the node, the models. */
      function draw(view, act) {
        const head = [
          h('h4', { key: 'title', className: 'coreness-qoder-title' }, t('title')),
          h('p', { key: 'intro', className: 'coreness-qoder-intro' }, t('intro')),
        ];
        const failed = (reason) => h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'failed' }, [...head,
          h('div', { key: 'failed', className: 'coreness-qoder-failed coreness-failed' }, [
            h('p', { key: 'word', role: 'alert' }, t('state.failed')),
            h('p', { key: 'reason' }, reason ?? ''),
          ]),
        ]);

        /* A failed read that still holds a view draws that view: its reason stands in the state area, and
           the failure view is for the case where there is nothing left to keep. */
        if (view.status === 'failed' && view.view === null) return failed(view.reason);
        /* The read has not answered: the section stands in the frames of `firstPaint` — the shape the answer
           will take — rather than as one line the answer turns into a form. The word of the wait stands where
           the read's own failure will stand, in the first card's own state room. */
        if (view.status !== 'ready') {
          return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'loading' }, [...head, ...firstPaint()]);
        }

        const state = view.view;
        if (state.status === 'failed') return failed(state.reason);
        if (state.status === 'undeclared') {
          return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'undeclared' }, [...head,
            h('div', { key: 'undeclared', className: 'coreness-qoder-card' }, [
              h('p', { key: 'word', className: 'coreness-qoder-line' }, t('state.undeclared')),
              h('p', { key: 'hint', className: 'coreness-qoder-dim coreness-dim' }, t('state.undeclared.hint')),
            ]),
          ]);
        }
        /* A row that is declared but whose settings namespace is not mounted carries nothing this section
           may read or write; the honest answer is the fact, not an empty form. */
        if (state.unmounted === true) {
          return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'unmounted' }, [...head,
            h('div', { key: 'unmounted', className: 'coreness-qoder-card' }, [
              h('p', { key: 'word', className: 'coreness-qoder-line' }, t('state.unmounted')),
            ]),
          ]);
        }

        const writable = writableOf(state);
        /* The rows the card draws: the draft the user is editing, or the section as it was read. The
           refusals are the draft's — a row nobody has touched cannot be wrong. */
        const rows = view.draft ?? state.models.map(shared.draftRow);
        const problems = view.draft === null ? [] : shared.checkRows(view.draft);

        /** A card's header row: its title, its own tags, and the one status this page draws — at its right. */
        /* The Connection card carries two subjects a reader would otherwise look for in two cards — the token and
           the node its requests go to — and its corner states the newer of the two: a sweep's own answer while
           that press's news stands, and the connection's own state when nothing has been asked. That answer is a
           note of its press (`check`) and goes with the page's own hold; the record the sweep leaves states
           nothing, so a `Check token` verdict is never shadowed by a sweep that is no longer news. The
           connection's dot beside the name says the connection either way, because a dot says one thing and says
           it next to the thing it is about. */
        const headFact = () => {
          const node = statusOf(view, 'node');
          return node.value === null || node.value === undefined ? null : node;
        };

        const headOf = (key, label, extras = [], shown = null) => {
          /* A card states one thing, and a press is the newer fact: the head may be handed the status standing for
             the card's newest news (`shown`), and reads its own subject's status otherwise. */
          const one = shown ?? statusOf(view, key);
          /* The card's own state, which its dot is about: the connection's corner may say the node's newer
             news, and the web switch's may say a press's word — the dot keeps the state beside the name. */
          const own = key === 'credential' || key === 'web' ? statusOf(view, key) : null;
          /* The on/off states a reader is simply *in* keep no word in this card's corner: the dot beside the
             name says them, and `Token is set` and `Web access is set` left the face on the user's word — the
             state is not news and the sentence said nothing a reader could act on. Every other value keeps its
             sentence: a fault, a verdict, a press's own outcome, and the node's answer standing here as the
             newer fact. What the head drops, the dot carries out loud (`statusMark`). */
          const silent = (key === 'credential' || key === 'web') && (one.value === 'set' || one.value === 'unset');
          const word = silent ? null : kit.statusNode({ subject: one.subject, value: one.value, data: one.data });
          /* The card's own strip: the room a press's sentence stands in, drawn on every card of this section as it
             is on every card of the MCP's and the gate's — reserved and empty while that press's news is gone, so
             the word arriving moves no box and the section's heads stay one shape. It carries a word only where a
             press of this card made one (`line`, set by the press that made it — today the add of a model row). */
          const said = view.note !== null && view.note !== undefined && view.note.where === key
            ? view.note.line ?? null
            : null;
          return h('div', { key: 'head', className: 'coreness-qoder-head coreness-card-head', 'data-state': key }, [
            h('span', { key: 'name', className: 'coreness-qoder-name' }, label),
            /* The connection's and the web switch's marks stand **beside the name of the thing they are
               about** — the token's state and the switch's on/off — and only where a state is known: a card
               that read nothing draws no dot. The connection's dot keeps its three tones; the web dot is
               green while Qoder is on and is absent while it is off, because the checkbox itself says off.
               Where the corner says the state in words — a fault, an outcome — the dot is silent: one fact,
               said once. The head's own gap places it, so this chunk's sheet needs no rule for it. */
            own === null || own.value === null || own.value === undefined
              ? null
              : key === 'web'
                ? (own.value === 'set'
                  ? kit.statusMark('set', { key: 'mark', subject: own.subject })
                  : null)
                : kit.statusMark(own.value, { key: 'mark', subject: own.subject, spoken: word !== null && one.value === own.value }),
            ...extras,
            /* One component, one place, one value: the words, the tones and the place rule are
               the status component's, and the account this section learned travels beside the value. */
            word,
            /* The strip stands last, at the card's right end: the corner's word keeps its own place (the
               component's rule) and the strip is the page's own reserved room beside it. */
            answerStrip(said),
          ]);
        };

        /* The sweep's own lines: the answer itself is that press's news (`check`), and the reasons the nodes gave
           stand in a block of their own, under every card. They are a list whose
           length is the node map's, and a list of unknown length inside a card would grow that card and move
           every block under it — the reason a reason is never truncated here and never drawn in a header.
           The row's two halves are the page's own word and the route's own reason: the address is the fact a
           reader needs to see which node stood out — the node map is the user's own list — and the word the
           node answered with is the route's, drawn as it came rather than paraphrased here. */
        const refusals = view.sweep === null || view.sweep.pin !== null
          ? []
          : (view.sweep.nodes ?? []).filter((one) => one.ok !== true).map((one, index) => h('li', {
            key: `refused-${index}`,
            className: 'coreness-qoder-dim coreness-dim',
            'data-node': one.node,
          }, t('node.failedNode', { node: one.node, reason: one.error ?? '' })));

        /* The connection card and the web card: each is its own subject, with its own head and status.
           The connection carries the token and the node; the web switch carries the shared web row. */
        const credential = shared.credentialCard(view, act, headOf, headFact(), writable);
        const webCard = shared.webCard(view, act, headOf);

        /* Names two entries of the vendor's listing share, computed once for the whole list: the picker's
           options carry the vendor's own names, and only a clash brings the wire id back (`optionWords`). */
        const clashing = shared.clashingNames(state.catalogue.models);
        const models = shared.modelsCard(view, act, headOf, rows, problems, clashing);

        return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'ready' }, [...head, credential, webCard, models,
          /* The reasons the sweep's nodes gave: a block of its own, under every card, so the list grows
             downward and moves nothing the reader is looking at. */
          refusals.length === 0 ? null : h('div', { key: 'refused', className: 'coreness-qoder-refused' }, [
            h('p', { key: 'title', className: 'coreness-qoder-dim coreness-dim' }, t('refused.title')),
            h('ul', { key: 'list', className: 'coreness-list coreness-qoder-refusedList' }, refusals),
          ])]);
      }

      return { draw, statusOf, firstPaint, answerStrip, readFailureOf, writableOf, SUBJECTS };
    }

    return { create };
  },
});
