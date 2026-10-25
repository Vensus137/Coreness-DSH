/**
 * The rate gate's live rows: one card per model under a ceiling — the pair, the ceiling and the row's own two
 * presses — over the record's own list, the picture's late view of the runtime, and the place a press's word
 * stands in.
 *
 * A package-local part of `client.gate.js`, pulled by it with `require.async` and created after the limits
 * editor: a row's card asks that part's ceiling rule lazily (`shared.ceilingProblem`), so the rule is written
 * once and no row can drift from the press that refuses it. The part also carries the pair that names a row,
 * which the section reads through `shared` when a press answers and when the drawing picks the card a word
 * stands in, and the outcome vocabulary its own cards wear.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.gate.windows.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The live rows' own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /** The pair of a row, as the word the row is grouped by. */
      const pairOf = (row) => `${row.provider}/${row.model}`;

      /**
       * The rows that stand, as the drawing reads them: the **record's** own list, and the picture's only where
       * there is no record to read.
       *
       * The record is the file a user writes and the picture is the route's own late view of the runtime, so
       * the list comes from the first and the counters from the second by pair. Read in one place because two
       * readers depend on the same answer: the drawing, and the place a press's word is put — a word addressed
       * to a card that is not drawn stands nowhere, which is the silence that sent the row a user saved out
       * of the page while the strip said it was saved.
       */
      const rowsStanding = (view) => view.read?.rows ?? view.picture?.rows ?? [];

      /**
       * The card a press's word can stand in: the row the drawing gives that pair, or `null` for the section's strip.
       *
       * A note carries an index into the list its press was made against, and the draft that list belonged to is
       * dropped by the press itself — so the place is read by **pair**, against the rows the page still draws: the
       * pair the press was about, wherever the record now puts it. A pair no card draws leaves no place, and the
       * section's strip carries the word — the surface that outlives the press.
       */
      const cardOfPair = (view, pair) => {
        if (pair === null || pair === undefined) return null;
        const at = rowsStanding(view).findIndex((row) => pairOf(row) === pair);
        return at === -1 ? null : at;
      };

      /** Everything the catalogue offers as a pair: the model rows this row may name. */
      function pairsOf(catalog) {
        const groups = Array.isArray(catalog?.groups) ? catalog.groups : [];
        return groups.flatMap((group) => (Array.isArray(group.models) ? group.models : []).map((model) => ({
          provider: group.id,
          model: model.id,
          name: model.name ?? model.id,
        })));
      }

      /** The picture's own words for the outcome of a decision, so the ring is drawn in the page's language. */
      /**
       * One card per model under a limit: its head carries the pair and the row's own answer, and its body the
       * pair's two pickers, the ceiling and the two controls, so the card is what the row is and nothing else.
       */
      function rowCard({ row, index, view, act, catalog }) {
        const draftRow = view.draft === null ? null : view.draft.rows[index];
        const held = draftRow ?? row;
        const busy = view.busy === true;
        /* This row's ceiling, held once where the row is drawn: the box's own mark, the strip's word and the row's
           press all read this one value, so none of them can drift from the others. */
        const problem = shared.ceilingProblem(held.tokensPerMinute);
        /* A row that states no ceiling has a status of its own, and the page keeps one strip per card: the guard's
           voice is this strip — the same surface, the same tone word, top-right as every other card's — and not a
           sentence under the box, which would move everything below it by its own height the moment a digit was typed.
           The derived status outranks a pressed answer, because the strip is about the row as it now stands; the
           strip's room is reserved either way, so the word arrives without moving a pixel. The reason keeps its road
           out through `statusDetail`, said where the value is patched. */
        const note = problem === null ? (view.note?.at === index ? view.note : null) : { tone: 'fault', text: t('state.refused') };

        const pairs = pairsOf(catalog);
        return h('li', { key: `row${index}`, className: 'coreness-gate-row coreness-gate-rowCard' }, [
          h('div', { key: 'card', className: 'coreness-gate-card coreness-card-box' }, [
            /* The card is small by decision — a head and one row of fields — and a fold in front of four fields
               costs a press and hides what the section is about. Its head says what the row is and presses nothing,
               and the fields stand under it always. */
            h('div', { key: 'head', className: 'coreness-gate-cardHead coreness-card-head' }, [
              h('span', { key: 'title', className: 'coreness-gate-headButton' }, [
                h('span', { key: 'name', className: 'coreness-gate-name' }, pairOf(held)),
                ]),
              /* The row's own answer, in the same reserved box as every other strip on the page: the word is this
                 row's or it is empty, but the room stands always — a strip the page reserves nowhere is a word
                 painted where nobody can read it. The reason a refusal came with does not stand beside the word as a
                 tooltip: it leaves the face through `statusDetail` where the answer arrives, and the face keeps the
                 word. */
              h('span', {
                key: 'rowAnswer',
                /* The same class, the same tone word and the same rules as the section's own strip: only the place
                   is this section's. The class that carried the tone here (rowAnswer-done, rowAnswer-error) was
                   the section painting a colour the page decides — the tone travels in `data-tone` now, and an
                   empty room states none, like every other strip on the page. */
                className: 'coreness-answer coreness-gate-rowAnswer',
                'data-note': 'row',
                'data-tone': note?.tone,
                role: 'status',
                'aria-live': 'polite',
              }, note === null ? '' : String(note.text ?? '')),
            ]),
            h('div', { key: 'body', className: 'coreness-gate-body coreness-card-body' }, [
                h('div', { key: 'pair', className: 'coreness-gate-pair' }, [
                  h('div', { key: 'provider', className: 'coreness-field coreness-gate-field' }, [
                    h('span', { key: 'label', className: 'coreness-fieldLabel coreness-gate-fieldLabel' }, t('field.provider')),
                    /* The pair is chosen in the page's own control, from what the route advertises. A value
                       the listing does not carry stays what the row holds and is drawn as it stands — the
                       way the models editor draws a model the catalogue does not know — where the native
                       select this replaced drew an empty box for it and let the reader believe the row names
                       nothing. */
                    h(picker.IdPicker, {
                      key: 'picker',
                      name: `gate-provider-${index}`,
                      value: held.provider,
                      disabled: busy,
                      'aria-label': `${t('field.provider')} (${pairOf(held)})`,
                      options: [...new Set(pairs.map((one) => one.provider))].map((provider) => ({ value: provider, words: provider })),
                      onChoose: (next) => act.patchRow(index, { provider: next }),
                    }),
                  ]),
                  h('div', { key: 'model', className: 'coreness-field coreness-gate-field' }, [
                    h('span', { key: 'label', className: 'coreness-fieldLabel coreness-gate-fieldLabel' }, t('field.model')),
                    h(picker.IdPicker, {
                      key: 'picker',
                      name: `gate-model-${index}`,
                      value: held.model,
                      disabled: busy,
                      'aria-label': `${t('field.model')} (${pairOf(held)})`,
                      options: pairs.filter((one) => one.provider === held.provider).map((one) => ({ value: one.model, words: one.name })),
                      onChoose: (next) => act.patchRow(index, { model: next }),
                    }),
                  ]),
                  shared.numberField({
                    id: `coreness-gate-row${index}-ceiling`,
                    key: 'ceiling',
                    word: t('field.ceiling'),
                    name: `${t('field.ceiling')} (${pairOf(held)})`,
                    value: held.tokensPerMinute,
                    disabled: busy,
                    unit: null,
                    hint: null,
                    problem,
                    onPatch: (value) => act.patchRow(index, { tokensPerMinute: value }),
                  }),
                ]),
                h('div', { key: 'foot', className: 'coreness-gate-rowFoot' }, [
                  h('button', {
                    key: 'remove',
                    type: 'button',
                    className: 'coreness-gate-button coreness-button',
                    disabled: busy,
                    onClick: () => act.removeRow(index),
                  }, t('control.remove')),
                  h('button', {
                    key: 'apply',
                    type: 'button',
                    className: 'coreness-gate-button coreness-button',
                    'data-tone': 'primary',
                    /* A press with no draft has nothing to write and would close nothing: the card's own rule,
                       the same condition the limit card's Apply carries. */
                    disabled: busy || problem !== null || view.draft === null,
                    /* The row's own press carries its place, so the word it earns stands in this row's card. */
                    onClick: () => act.apply({ at: index }),
                  }, t('control.apply')),
                ]),
              ]),
          ]),
        ]);
      }

      return { pairOf, rowsStanding, cardOfPair, pairsOf, rowCard };
    }

    return { create };
  },
});
