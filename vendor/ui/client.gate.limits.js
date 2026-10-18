/**
 * The rate gate's limits editor: the card of the four numbers a user may write, the card of every model under
 * a ceiling with its two pickers and its own press, the number field both cards are built from, and the ops a
 * draft travels as.
 *
 * A package-local part of `client.gate.js`, pulled by it with `require.async` and created first, before the
 * live rows and the section. The rows' cards read this part's ceiling rule lazily (`shared.ceilingProblem`),
 * and the section reads the ops here (`shared.valuesOf`, `shared.opsOf`, `shared.rowsOps`) — the one place the
 * row's shape is turned into a write.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.gate.limits.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The limits editor's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /**
       * A scalar field of the row: one `set` of its own path — or one **`unset`** where the box was emptied.
       *
       * An empty box is not a value this row's schema takes: `windowMs`, `maxWaitMs` and `thresholdRatio` are
       * numbers with a default, and a `set` of a null was refused by the schema, so the press could only fail,
       * with a fault no sentence on this face explained. Empty therefore travels as an `unset` — the op the
       * platform's own settings pages write for a field their draft dropped — and the service resolves it to the value the
       * profile's patch or the schema's default carries. That is what returns the row to the gate's own default,
       * the road this card itself records as otherwise closed: no `Reset to defaults` stands on it, and the way
       * back is a fresh read of the file, not a press. `dryRun` never reaches this — it is a switch, and it
       * carries true or false.
       */
      const scalarOp = (name, value) => (value === null ? { op: 'unset', path: [name] } : { op: 'set', path: [name], value });

      /**
       * The whole list in one op, and the only write this section has for `limits`: a volatile field
       * *inside* a row is refused by the schema itself, so the array travels whole.
       */
      /* The rows as the file takes them: a row a user added carries a marker a draft needs and the schema does not
         know (the page writes the fields it shows, and a marker is not one of them), so it is taken off here — the one
         road out of this section. */
      const rowsOp = (rows) => ({
        op: 'set',
        path: ['limits'],
        value: rows.map(({ fresh, ...row }) => row),
      });

      /** The values the card reads: the scalars a user may write, and the rows as the row holds them. */
      function valuesOf(settings) {
        const value = settings?.value ?? {};
        const rows = Array.isArray(value.limits) ? value.limits : [];
        return {
          windowMs: value.windowMs ?? null,
          maxWaitMs: value.maxWaitMs ?? null,
          thresholdRatio: value.thresholdRatio ?? null,
          dryRun: value.dryRun === true,
          rows: rows.map((one) => ({
            provider: typeof one?.provider === 'string' ? one.provider : '',
            model: typeof one?.model === 'string' ? one.model : '',
            tokensPerMinute: one?.tokensPerMinute ?? null,
            thresholdRatio: one?.thresholdRatio ?? null,
            dryRun: one?.dryRun ?? null,
          })),
        };
      }

      /**
       * The ops a draft needs, split by what a press is about.
       *
       * The split is the user's own model for this section: `Apply` in a row is about **that row** and `Apply` in the
       * section is about the whole draft. Nothing about the wire changes with it — a `set` carries `limits` whole, so
       * even a write about one row travels as the whole list, and no per-row operation exists to look for. The split is
       * about the intent of a press, and about which card the answer stands in.
       */
      function scalarOps(draft, read) {
        return shared.SCALARS.filter((name) => draft[name] !== read[name]).map((name) => scalarOp(name, draft[name]));
      }

      /** The one op the list of rows needs, or none where nothing about the rows changed. */
      function rowsOps(draft, read) {
        /* The rows are compared field by field and not as two JSON strings: the same row built twice can
           carry its keys in another order, and a press that changed nothing must not write the list again. */
        /* A row is compared by what a row may now name: the pair, the ceiling, the dry-run flag. The caution is the
           section's own value and no longer a row's, so it takes no part in deciding whether a write is needed. */
        const flat = (rows) => rows.map((one) => [one.provider, one.model, one.tokensPerMinute, one.dryRun ?? null]);
        return JSON.stringify(flat(draft.rows)) === JSON.stringify(flat(read.rows))
          ? []
          : [rowsOp(draft.rows.map((one) => {
            /* A row travels as it stands, with nothing filled in on the way: a ceiling nobody typed is the
               gate's own refusal to name, not a zero this section quietly put there. The two optional
               numbers are left out when they are not chosen, so a change of the section's own number still
               reaches the row — the schema declares them optional for exactly that reason. */
            const row = { provider: one.provider, model: one.model, tokensPerMinute: one.tokensPerMinute };
            if (one.dryRun !== null && one.dryRun !== undefined) row.dryRun = one.dryRun === true;
            return row;
          }))];
      }

      /**
       * What a row's ceiling says when it cannot be one: the page's own word, or `null` where the row has a ceiling.
       *
       * The rule is the gate's own, mirrored rather than guessed: every value handed in from a row is read through
       * `finite` and a row whose ceiling is not a positive number is **refused** — the row is dropped and limits
       * nothing. So a `null`, an empty box, a `NaN`, a zero and a value that is not a
       * number at all are one and the same thing to the runtime, and none of them is what a user who typed into a
       * limit's box meant. The section's three numbers keep their own road and are not this: they have defaults the
       * schema declares, and an empty box there unsets them.
       */
      function ceilingProblem(value) {
        return typeof value === 'number' && Number.isFinite(value) && value > 0 ? null : t('field.ceiling.problem');
      }

      /** What the section's own `Apply` writes: both families, in one write. */
      function opsOf(draft, read) {
        return [...scalarOps(draft, read), ...rowsOps(draft, read)];
      }

      /**
       * The label row of a number field, and **only** the field's own name: no mark of where the number comes
       * from, and no press that returns it to the schema's default (the user's own word took both off the page). The
       * schema's default is untouched by that: a field the page does not show is written as the user's file has it.
       */
      function labelRow(word, id) {
        return h('div', { key: 'label', className: 'coreness-fieldLabel coreness-gate-fieldLabel' }, [
          h('label', { key: 'word', htmlFor: id }, word),
        ]);
      }

      /**
       * One number field of the card.
       *
       * The `id` and the accessible name are the caller's, because a card is drawn once per model: a field
       * that kept the key alone would put the same `id` on the page once per row, and the label of the second
       * row would focus the first row's input. The label row carries the field's own word and nothing else.
       */
      function numberField({ id, key, word, name, value, disabled, onPatch, unit, hint, problem = null }) {
        return h('div', { key, className: 'coreness-field coreness-gate-field' }, [
          labelRow(word, id),
          /* The unit stands **inside the box with the value**, which is the user's own reading of it ("в моём
             понимании MS должно быть как раз так и в этом квадратике. Пояснение: это измеряемая величина"): the
             box is the wrapper's border, the input inside carries no border of its own, and the unit is a suffix
             at the box's right edge. The border moved from the input to the wrapper for this, and the focus ring
             moved with it (`:focus-within`), so the field still says where the keyboard stands. */
          h('span', { key: 'box', className: 'coreness-gate-unitBox' }, [
            h('input', {
              key: 'input',
              id,
              className: 'coreness-gate-input coreness-field',
              type: 'number',
              value: value === null || value === undefined ? '' : String(value),
              disabled,
              'aria-label': name ?? word,
              /* A field with a problem says so to a reader who cannot see the card's strip: the mark travels with the
                 value and the word itself stands in the row's own status, top-right as every other card's — a sentence
                 under the box left the page by the user's own reading of it ("если ввести цифру все скачет, разметка"),
                 and it moved everything below it by its own box every time a digit was typed. The three section
                 numbers pass no problem and draw exactly as they did. */
              ...(problem === null ? {} : { 'aria-invalid': true }),
              onChange: (event) => onPatch(event.target.value === '' ? null : Number(event.target.value)),
            }),
            unit === null ? null : h('span', { key: 'unit', className: 'coreness-gate-unit' }, unit),
          ]),
          hint === null ? null : h('p', { key: 'hint', className: 'coreness-gate-hint' }, hint),
        ]);
      }

      /**
       * The card of the limit itself: the four numbers a user may write, one draft, and the two controls
       * that end it. Nothing here writes on a keystroke — a number typed digit by digit would be four writes,
       * and three of them are values nobody asked for.
       */
      function limitCard(view, act) {
        const read = view.read;
        const draft = view.draft ?? read;
        const busy = view.busy === true;
        /* Whether the draft carries a row without a ceiling: this card's own press writes the rows as well as the
           numbers (`opsOf`), so its bar answers for them exactly as each row's own press does. Computed here and not
           in `draw`, because this card is a function of its own and reads the view it is handed. */
        const ceilingMissing = (view.draft?.rows ?? []).some((one) => ceilingProblem(one.tokensPerMinute) !== null);
        /* What the gate runs with, which is not always what the row says: a row that is silent about a
           number takes the gate's own default, and the live run showed the gate going on reading the values
           it mounted with while the written ceiling charged later requests. Both stand here, so a field left
           empty is not read as zero. */
        const effective = view.picture?.settings ?? null;
        const fields = [
          numberField({ id: 'coreness-gate-windowMs', key: 'windowMs', word: t('field.window'), value: draft.windowMs, disabled: busy, unit: t('field.window.unit'), hint: `${t('field.window.hint')} ${t('field.empty')}`, onPatch: (value) => act.patch({ windowMs: value }),  }),
          numberField({ id: 'coreness-gate-maxWaitMs', key: 'maxWaitMs', word: t('field.maxWait'), value: draft.maxWaitMs, disabled: busy, unit: t('field.maxWait.unit'), hint: `${t('field.maxWait.hint')} ${t('field.empty')}`, onPatch: (value) => act.patch({ maxWaitMs: value }),  }),
          numberField({ id: 'coreness-gate-thresholdRatio', key: 'thresholdRatio', word: t('field.ratio'), value: draft.thresholdRatio, disabled: busy, unit: null, hint: `${t('field.ratio.hint')} ${t('field.empty')}`, onPatch: (value) => act.patch({ thresholdRatio: value }),  }),
        ];
        /* The press's own word, which the strip carries: `view.note` is set by a write and by a return, and the
           section's room no longer draws it — the room keeps the section's sentences, the strip keeps the press's.
           The place of the press is read with it: a word of a row's foot stands in that row's card, so this strip
           draws only a note whose place is the section's own (no `at` at all). */
        const here = view.note === null || view.note === undefined || view.note.at === null || view.note.at === undefined ? view.note ?? null : null;
        const answerNote = {
          tone: here?.tone ?? null,
          text: here === null ? '' : String(here.text ?? ''),
        };
        return h('li', { key: 'limit', className: 'coreness-gate-row' }, [
          h('div', { key: 'card', className: 'coreness-gate-card coreness-card-box' }, [
            h('div', { key: 'head', className: 'coreness-gate-cardHead coreness-card-head' }, [
              h('div', { key: 'title', className: 'coreness-gate-headButton' }, [
                h('span', { key: 'name', className: 'coreness-gate-name' }, t('card.limit')),
              ]),
              /* The answer stands in the card's own strip, reserved and drawn always, at the card's right edge on
                 the name's line — the one place an answer stands in every card of this page. It used to stand in
                 the section's room, where a state also stands: one place, two genres, and on a save the reader did
                 not see it at all. The room keeps the section's own sentences, the strip keeps the press's. */
              h('span', {
                key: 'answer',
                /* The page's own answer class and nothing else: the colour of each tone stands once for every
                   strip on the page, beside the reservation rule the strips share, and this section
                   writes no colour of its own. The three classes that stood here — done, error, warn — were a
                   vocabulary of this section's making (`error` where the page says `fault`), and the user read the
                   result off the screen: the same word in another colour in the section beside this one. */
                className: 'coreness-answer coreness-gate-answer',
                'data-note': 'head',
                'data-tone': answerNote.tone ?? 'plain',
                role: 'status',
                'aria-live': 'polite',
              }, answerNote.text),
            ]),
            h('div', { key: 'body', className: 'coreness-gate-body coreness-card-body' }, [
              h('div', { key: 'fields', className: 'coreness-gate-fields' }, fields),
            ]),
            h('div', { key: 'foot', className: 'coreness-gate-foot' }, [
              h('span', { key: 'actions', className: 'coreness-fieldLabel' }, [
                /* The section card carries `Apply` alone, by the user's own word ("Cancel убираем"): the price of a
                   removal is not high enough to need a cancelling press beside it, and he said the same about the row.
                   What it costs is a real loss: this card carries no
                   `Reset to defaults`, so a draft of this section can only be applied — the way back is a fresh read
                   of the file (reloading the section), not a press. A user who typed a wrong number and has not
                   pressed `Apply` yet still has the field to fix it in; once pressed, the file holds it. */
                h('button', {
                  key: 'apply',
                  type: 'button',
                  className: 'coreness-gate-button coreness-button',
                  'data-tone': 'primary',
                  disabled: busy || view.draft === null || view.settings?.ok !== true || ceilingMissing,
                  onClick: () => act.apply(),
                }, t('control.apply')),
              ]),
            ]),
          ]),
        ]);
      }

      return {
        valuesOf, rowsOps, ceilingProblem, opsOf, numberField, limitCard,
      };
    }

    return { create };
  },
});
