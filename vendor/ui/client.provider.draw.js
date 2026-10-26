/**
 * The Qoder section's drawing: the section's own frame, the frames of the first paint, the one condition a
 * card's corner states, the answer strip every press's word stands in, and the reasons a sweep's nodes gave.
 *
 * A package-local part of `client.provider.js`, pulled by it with `require.async` and created before the
 * section is seated. The cards themselves stand in the parts beside this one — the connection, the models
 * and the node — and this file composes them: it makes each card's head, in one place, out of the one map
 * the page keeps and the press note the section holds, so no card can say a thing another one does not.
 * The section's sheet is the entry's, and this file draws inside it.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.provider.draw.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The drawing's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, shared }) {
      /* The kit's map names two words without a subject — `Saved` and `Not saved` — and those are the
         strip's, out of the map's own entry. Every other value the map carries is a state or a verdict: a
         state is the card's own condition and stands in the corner, a verdict is a press's answer and
         stands in the strip beside the two. */
      const OUTCOMES = new Set(['saved', 'unsaved']);
      /* The words a strip takes for a press whose answer the map names as a sentence about the card's
         subject: the strip's room holds one word. `set` is the note a check leaves when the vendor settled
         nothing, and `unset` the note a clear leaves when the store read back empty — neither names a state
         a strip could carry, so each takes the press's own word. The reason behind every one is the
         console's. */
      const VERDICT_WORDS = new Map([
        ['accepted', { key: 'verdict.accepted', tone: 'done' }],
        ['refused', { key: 'verdict.refused', tone: 'fault' }],
        ['answered', { key: 'verdict.answered', tone: 'done' }],
        ['unanswered', { key: 'verdict.unanswered', tone: 'fault' }],
        ['set', { key: 'verdict.none', tone: 'plain' }],
        ['unset', { key: 'verdict.cleared', tone: 'done' }],
      ]);
      /* The values the connection's dot reads out of a press: the vendor's two verdicts on the value. A check
         that settled nothing — or one no vendor answered — gave no verdict, so the dot keeps the state the
         store answers with. */
      const VERDICTS = new Set(['accepted', 'refused']);
      /* The notes that carry a condition of the card rather than a press's answer: a read that failed after
         a write is the card's state, and the corner is where a card's state stands. */
      const CONDITION_NOTES = new Set(['unread', 'unwritable']);

      /** One entry of the kit's map, or null for a value nobody holds. */
      const statusEntry = (value) => {
        if (value === null || value === undefined) return null;
        return Object.hasOwn(kit.STATUS_WORDS, value) ? kit.STATUS_WORDS[value] : null;
      };

      /**
       * The page's answer strip: the card head's room, drawn always and empty while nothing is said, so a
       * word arriving moves no box of the head it arrives in. Its class, its reserved width and its three
       * tones are the page's sheet's; this chunk writes no width and no colour of its own.
       */
      function answerStrip(said) {
        return h('span', {
          key: 'answer',
          className: 'coreness-answer',
          'data-tone': said === null ? undefined : said.tone,
          role: 'status',
          'aria-live': 'polite',
          ...(said === null ? {} : said.data ?? {}),
        }, said === null ? '' : said.text);
      }

      /** A card of the page's frame: the box, its head, and the body the card's parts stand in. */
      const cardOf = (key, headNode, body) => h('li', { key, className: 'coreness-card-box' }, [
        headNode,
        h('div', { key: 'body', className: 'coreness-card-body' }, body),
      ]);

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
        const frame = (label, subject) => h('div', { key: 'head', className: 'coreness-card-head' }, [
          h('span', { key: 'name', className: 'coreness-qoder-name' }, label),
          subject === null || subject === undefined ? null : kit.statusNode({ subject, value: 'loading' }),
          answerStrip(null),
        ]);
        return h('ul', { key: 'cards', className: 'coreness-list coreness-card-list' }, [
          cardOf('credential', frame(t('credential.label'), t('status.subject.token')), [
            /* The section's own read stands on the first card, which is the section's own — the same place
               its failure stands once there is a read to fail. */
            h('div', { key: 'field', className: 'coreness-field' }, [
              h('label', { key: 'label', className: 'coreness-fieldLabel' }, t('field.token')),
              bar('input', 'input', 'coreness-field coreness-field-box'),
            ]),
            h('div', { key: 'actions', className: 'coreness-qoder-actions' }, [bar('save', 'button', 'coreness-button')]),
            h('div', { key: 'node', className: 'coreness-qoder-node' }, [
              bar('where', 'line', 'coreness-qoder-line'),
              bar('check', 'button', 'coreness-button'),
            ]),
          ]),
          cardOf('web', frame(t('web.title'), null), [
            h('div', { key: 'row', className: 'coreness-check' }, [
              h('div', { key: 'box', className: 'coreness-qoder-line coreness-qoder-skeleton', 'data-skeleton': 'check' }),
            ]),
            h('p', { key: 'foot', className: 'coreness-dim' }, t('web.footnote')),
          ]),
          cardOf('models', frame(t('models.label'), null), [
            /* The rows and the press that adds one are one block in the settled card; the frame keeps that
               shape, so the answer's landing moves no box of it. */
            h('div', { key: 'rows' }, [
              h('ul', { key: 'list', className: 'coreness-list' }, []),
              h('div', { key: 'add', className: 'coreness-addRow' }, [bar('addRow', 'add', 'coreness-add coreness-button')]),
            ]),
            h('p', { key: 'windowNote', className: 'coreness-dim' }, t('models.windowNote')),
            h('p', { key: 'note', className: 'coreness-dim' }, t('models.note')),
            h('div', { key: 'actions', className: 'coreness-qoder-foot' }, [
              bar('reset', 'button', 'coreness-button'),
              h('div', { key: 'right', className: 'coreness-qoder-actions' }, [
                bar('cancel', 'button', 'coreness-button'),
                bar('apply', 'button', 'coreness-button'),
              ]),
            ]),
          ]),
        ]);
      }

      /* The section's own read, failed while the section still stands: the card states that its subject was
         not read in its corner, its reason is the console's, and the failure view is for the case where there
         is nothing left to keep. */
      const readFailureOf = (view) => (view.status === 'failed' && view.view !== null ? view.reason : null);
      /** Whether this profile may write through the row it read: the one reading of that question. */
      const writableOf = (state) => state !== null && state.ref !== null && state.credential?.writable === true;

      /* The card's own one word for what its status is about — `Token`, `Node`, `Models` — and the web card's
         title, which is the subject its sentence names. It is never the credential reference and never a path:
         a fact about this configuration is not a fact about the reader's token (`STATUS_WORDS`). */
      const SUBJECTS = { credential: 'status.subject.token', node: 'status.subject.node', models: 'status.subject.models', web: 'web.title' };

      /**
       * The card's own state: what the card is, drawn from the read alone and never from a press.
       *
       * It is the value the corner carries — one value per card, with the subject its sentence is about. The
       * words the map names without a subject (`Saved`, `Not saved`) are outcomes, and a card's state is not
       * an outcome: a draft that is not written is `unsaved`, and that word stands in the strip where the
       * answer stands, one word on the card's own condition, not a sentence in the corner. A condition the
       * map has no value for travels as `word`, the strip's one word (the corner speaks the map alone). What
       * only this profile can know — a reference nobody named, a store this home does not own, the fields a
       * row is missing, the reason a read failed — is a fact about the product's configuration and not about
       * the reader's token, so it travels beside the value as `detail` and is said in the console rather than
       * on the face, which carries the state alone.
       */
      const conditionOf = (view, where) => {
        const subject = t(SUBJECTS[where]);
        const state = view.view;
        const problems = view.draft === null || view.draft === undefined ? [] : shared.checkRows(view.draft);
        const readFailure = readFailureOf(view);
        const writable = writableOf(state);
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
        /* The node's own subject states nothing by itself: what a sweep answered is its press's news, and the
           strip says it while that news lives — never as a condition of the card. */
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
          /* A profile that names no reference: nobody was asked, so the corner states nothing about a store
             and the account is the console's; the card is not silent — the strip says the one word and the
             card keeps its place. */
          if (state.ref === null) return { subject, value: null, detail: t('detail.noplace'), word: t('condition.noplace') };
          if (!writable) return { subject, value: 'unwritable', detail: t('detail.external') };
          return { subject, value: state.credential?.configured === true ? 'set' : 'unset' };
        }
        /* Web: the card states the switch's own value; a row that could not be read is a fault, not
           "off", and a read-only row cannot be pressed. A missing token or an off flag is off in effect
           even where a stale row still names Qoder: the card says the standard search stands in words, and
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
        if (problems.length > 0) return { subject, value: 'unsaved', detail: t('models.rowProblem', { index: String(problems[0].index + 1), message: problems[0].message }) };
        /* A draft that stands is `unsaved` in the card's own terms: what the reader has in front of them is
           not in the profile until `Apply` writes it, and the two windows two presses leave are explained by
           that and by nothing the catalogue says. The catalogue's own word is not lost with it — the list's
           own line says what it is doing. */
        if (view.draft !== null && view.draft !== undefined) return { subject, value: 'unsaved' };
        if (state.catalogue.models === null && state.catalogue.message === null) return { subject, value: 'loading' };
        if (state.catalogue.message !== null) return { subject, value: 'unread', detail: state.catalogue.message };
        if (state.failure === null || state.failure === undefined) return { subject, value: null };
        return { subject, value: 'unread', detail: `${t('models.failed')}: ${state.failure.message}` };
      };

      /**
       * The account of one card for the console: the press's own account while its hold lasts, the card's
       * own state otherwise. It is not the drawing's — the face draws the condition in the corner and the
       * press's word in the strip — and this reading is what the section says in the console when a fact
       * beyond either word needs a home.
       */
      const statusOf = (view, where) => {
        const mine = view.note !== null && view.note !== undefined && view.note.where === where ? view.note : null;
        if (mine !== null) return { subject: t(SUBJECTS[where]), value: mine.value, detail: mine.detail };
        return conditionOf(view, where);
      };

      /** The section as it stands, from the read alone: the states, the token, the node, the models. */
      function draw(view, act) {
        const head = h('div', { key: 'head', className: 'coreness-sectionHead' }, [
          h('h4', { key: 'title', className: 'coreness-sectionTitle' }, t('title')),
        ]);
        const intro = h('p', { key: 'intro', className: 'coreness-sectionIntro' }, t('intro'));
        const failed = (reason) => h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-state': 'failed' }, [head, intro,
          h('div', { key: 'failed', className: 'coreness-failed' }, [
            h('p', { key: 'word', role: 'alert' }, t('state.failed')),
            h('p', { key: 'reason' }, reason ?? ''),
          ]),
        ]);

        /* A failed read that still holds a view draws that view — each card states that its subject was not
           read and the console keeps the reason; a read that left nothing to keep states the failure, and a
           read that has not answered stands in the frames of the wait. */
        if (view.status === 'failed') {
          if (view.view === null) return failed(view.reason);
        } else if (view.status !== 'ready') {
          return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-state': 'reading' }, [head, intro, firstPaint()]);
        }

        const state = view.view;
        if (state.status === 'failed') return failed(state.reason);
        /* The section's own conditions stand in the page's card frame: one card of the page's list, its head
           with the card's name and the condition in the strip's one word — the corner speaks the kit's map,
           and these conditions have no value there — and the sentences in the card's body. */
        const conditionCard = (key, label, word, body) => h('ul', { key: 'cards', className: 'coreness-list coreness-card-list' }, [
          cardOf(key, h('div', { key: 'head', className: 'coreness-card-head', 'data-state': key }, [
            h('span', { key: 'name', className: 'coreness-qoder-name' }, label),
            answerStrip({ text: word, tone: 'plain' }),
          ]), body),
        ]);
        if (state.status === 'undeclared') {
          return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-state': 'undeclared' }, [head, intro,
            conditionCard('undeclared', t('section'), t('condition.undeclared'), [
              h('p', { key: 'word', className: 'coreness-qoder-line' }, t('state.undeclared')),
              h('p', { key: 'hint', className: 'coreness-dim' }, t('state.undeclared.hint')),
            ]),
          ]);
        }
        /* A row that is declared but whose settings namespace is not mounted carries nothing this section
           may read or write; the honest answer is the fact, not an empty form. */
        if (state.unmounted === true) {
          return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-state': 'unmounted' }, [head, intro,
            conditionCard('unmounted', t('section'), t('condition.unmounted'), [
              h('p', { key: 'word', className: 'coreness-qoder-line' }, t('state.unmounted')),
            ]),
          ]);
        }

        const writable = writableOf(state);
        /* The rows the card draws: the draft the user is editing, or the section as it was read. The
           refusals are the draft's — a row nobody has touched cannot be wrong. */
        const rows = view.draft ?? state.models.map(shared.draftRow);
        const problems = view.draft === null ? [] : shared.checkRows(view.draft);

        /* The press note a card's strip carries: a press made on this card's own subjects. The connection card
           carries the node row, so a press of the node answers in its strip too. */
        const noteOf = (key) => {
          const note = view.note;
          if (note === null || note === undefined) return null;
          if (key === 'credential') return note.where === 'credential' || note.where === 'node' ? note : null;
          return note.where === key ? note : null;
        };

        /* The condition a card's corner states: the read's own condition, and a condition a press learned —
           a read that failed after a write is the card's state, not an answer the press made. A press's
           answer never stands in the corner. */
        const standingOf = (key) => {
          const note = noteOf(key);
          if (note !== null && CONDITION_NOTES.has(note.value)) return { subject: t(SUBJECTS[key]), value: note.value };
          return conditionOf(view, key);
        };

        /**
         * The word a card's strip carries — the strip is the press's one place on this page. The sentence a
         * press made where it made one (the models card's add), the kit's own outcome words (`Saved`, `Not
         * saved`) for a write, and the section's one word for a verdict (`Accepted`, `Refused`, the node's
         * answer, a clear) and for the check that settled nothing. While no press has just answered, the card
         * says its own condition there when the condition has no corner word (`Not saved` over a draft that
         * is not written, `No reference` on a card whose profile names none).
         */
        const answerOf = (key) => {
          const note = noteOf(key);
          if (note !== null) {
            /* The hook the walk reads answers for the node's press: its word stands in the strip, so its
               `data-answer` stands there too. */
            const data = note.where === 'node' ? { 'data-answer': note.value === 'answered' ? 'connected' : 'none' } : undefined;
            if (note.line !== undefined && note.line !== null) return { text: note.line, tone: 'plain', data };
            const verdict = VERDICT_WORDS.get(note.value);
            if (verdict !== undefined) return { text: t(verdict.key), tone: verdict.tone, data };
            const entry = statusEntry(note.value);
            if (entry === null || !OUTCOMES.has(note.value)) return null;
            return { text: entry.words.replace('{subject}', t(SUBJECTS[note.where])), tone: entry.tone, data };
          }
          const condition = conditionOf(view, key);
          if (condition.word !== undefined && condition.word !== null) return { text: condition.word, tone: 'plain' };
          const entry = statusEntry(condition.value);
          if (entry === null || !OUTCOMES.has(condition.value)) return null;
          return { text: entry.words.replace('{subject}', condition.subject), tone: entry.tone };
        };

        /**
         * A card's head: its name, the connection's dot beside it, its own tags, the one condition the corner
         * states and the answer strip at the right.
         *
         * The corner speaks the kit's map and states the card's own condition alone — the state a control is
         * simply in, where no control says it, and a fault the read learned. Every press's answer stands in
         * the strip: the map's outcomes and the section's verdicts. The connection card carries the node row
         * beside the token, so a press there answers in its strip too, and its dot takes the last verdict —
         * grey nothing stored, green accepted, red refused — so the dot and the words on the card cannot
         * disagree.
         */
        const headOf = (key, label, extras = []) => {
          const one = standingOf(key);
          /* The on/off states a reader is simply *in* keep no word in the corner: the dot beside the name
             says the connection's, and the web card's box says its own. Every other value keeps its
             sentence: a fault, a read that failed, a condition. What the corner drops, the dot carries out
             loud (`statusMark`). */
          const silent = (key === 'credential' || key === 'web') && (one.value === 'set' || one.value === 'unset');
          const word = silent || one.value === undefined || one.value === null || OUTCOMES.has(one.value)
            ? null
            : kit.statusNode({ subject: one.subject, value: one.value });
          /* The connection's dot: the last verdict about the token while it stands, the card's own
             condition otherwise — grey nothing stored, green accepted or held, red a refusal or a fault. */
          const last = key === 'credential' ? noteOf(key) : null;
          const verdict = last === null || last.where !== 'credential' || !VERDICTS.has(last.value) ? null : last.value;
          const dotted = verdict ?? one.value;
          const mark = key !== 'credential' || dotted === null || dotted === undefined
            ? null
            : kit.statusMark(dotted, {
              key: 'mark',
              subject: t(SUBJECTS[key]),
              /* The strip says the verdict's word, and the corner its own; a dot that speaks a word already
                 on the card would say one fact twice. */
              spoken: verdict !== null || (word !== null && one.value === dotted),
            });
          /* The name owns the row's growing space, so the dot stands in the name's own room: drawn after the
             name inside it, it reads `Connection ●` at the card's left edge, where the mark stands beside the
             thing it is about — outside the name it would be pushed to the middle by the space the name
             takes. The strip keeps the head's last place at the right edge. */
          return h('div', { key: 'head', className: 'coreness-card-head', 'data-state': key }, [
            h('span', { key: 'name', className: 'coreness-qoder-name' }, mark === null ? label : [label, mark]),
            ...extras,
            word,
            answerStrip(answerOf(key)),
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
            className: 'coreness-dim',
            'data-node': one.node,
          }, t('node.failedNode', { node: one.node, reason: one.error ?? '' })));

        /* The connection card and the web card: each is its own subject, with its own head and status.
           The connection carries the token and the node; the web switch carries the shared web row. */
        const credential = shared.credentialCard(view, act, headOf, writable);
        const webCard = shared.webCard(view, act, headOf);

        /* Names two entries of the vendor's listing share, computed once for the whole list: the picker's
           options carry the vendor's own names, and only a clash brings the wire id back (`optionWords`). */
        const clashing = shared.clashingNames(state.catalogue.models);
        const models = shared.modelsCard(view, act, headOf, rows, problems, clashing);

        return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-state': 'ready' }, [head, intro,
          h('ul', { key: 'cards', className: 'coreness-list coreness-card-list' }, [credential, webCard, models]),
          /* The reasons the sweep's nodes gave: a block of its own, under every card, so the list grows
             downward and moves nothing the reader is looking at. */
          refusals.length === 0 ? null : h('div', { key: 'refused', className: 'coreness-qoder-refused' }, [
            h('p', { key: 'title', className: 'coreness-dim' }, t('refused.title')),
            h('ul', { key: 'list', className: 'coreness-list coreness-qoder-refusedList' }, refusals),
          ])]);
      }

      /* The section's drawing and the account the console takes from it: everything else this file makes is
         the drawing's own and reaches no other part. */
      return { draw, statusOf };
    }

    return { create };
  },
});
