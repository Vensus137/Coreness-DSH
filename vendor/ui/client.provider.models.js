/**
 * The Qoder section's models card: the list of declared rows, the row editor, the picker's options and the
 * catalogue's own line.
 *
 * A package-local part of `client.provider.js`, pulled by it with `require.async` and created before the
 * section is seated. The draft's arithmetic (`draftRow`, `storedRow`, `checkRows`) and the capacities the
 * fields speak stand here because this card is where a value becomes a row; the live catalogue is read by
 * the entry, and this file only reads what that answer carries.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.provider.models.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The models card's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /** A capacity as it is typed: a number, optionally in thousands or millions. */
      const CAPACITY = /^(\d+(?:\.\d+)?)([km])?$/i;

      /**
       * A capacity the user typed, or the reason it is not one.
       *
       * `undefined` is an empty field — the row then says nothing about the window, and the schema's own
       * default stands; `NaN` is a refusal the field is marked with. The value is not weighed against the
       * catalogue, because a window may be raised by hand and the catalogue's own number is this row's
       * declaration read back.
       */
      function parseCapacity(text) {
        const trimmed = String(text ?? '').trim();
        if (trimmed === '') return undefined;
        const match = CAPACITY.exec(trimmed);
        if (match === null) return Number.NaN;
        const scale = match[2] === undefined ? 1 : match[2].toLowerCase() === 'k' ? 1e3 : 1e6;
        const value = Number(match[1]) * scale;
        return Number.isInteger(value) ? value : Math.round(value);
      }

      /** A capacity in the page's own short form: whole thousands and millions read as K and M. */
      function formatCapacity(value) {
        if (!Number.isInteger(value) || value <= 0) return '';
        if (value % 1e6 === 0) return `${value / 1e6}M`;
        if (value % 1e3 === 0) return `${value / 1e3}K`;
        return String(value);
      }

      /**
       * One row of the draft: the fields the section draws, with the window as the user types it.
       *
       * What this is handed is the section's own projection — the route's row joined with the live catalogue
       * and the current model (`state.models`, built in the read) — and not the row the settings carry. The
       * stored row travels on that projection as `stored`: the page draws four of a row's fields and a row may
       * carry others — `maxTokens` in the platform's own row, and whatever the route adds next — and a draft that kept only the
       * drawn ones would delete the rest on the first Apply.
       */
      function draftRow(entry) {
        return {
          stored: entry?.stored,
          id: typeof entry?.id === 'string' ? entry.id : '',
          name: typeof entry?.name === 'string' ? entry.name : '',
          window: formatCapacity(entry?.contextWindow),
          vision: entry?.vision !== false,
          /* The model's own effort, empty where the row names none: the control then shows what stands in
             force instead — the route's effort — and an untouched row keeps saying nothing about it. */
          effort: typeof entry?.effort === 'string' ? entry.effort : '',
        };
      }

      /**
       * The row a draft writes back.
       *
       * It starts from the stored row: the page draws four of a row's fields and a row may carry others, so one
       * rebuilt from the drawn fields alone would delete what it never showed — `maxTokens` in the platform's own row, and whatever the
       * route adds next.
       *
       * `vision` is written either way: the model schema leaves the field optional, so an omitted key would read
       * back as "no claim", while ours defaults it to true — an omitted key would come back checked, and a box that
       * cannot be cleared is a lie. A name and a window the user emptied are removed: the schema's own defaults
       * stand for them, and the row says nothing it does not mean. With the stored row underneath, "removed" has to
       * be a deletion rather than a silence — hence the two `delete`s. The effort is written as it stands, empty
       * string included: that is the field's own word for "this model names none", and the route's own schema stays
       * what answers for it.
       */
      function storedRow(row) {
        const next = { ...row.stored, id: row.id.trim() };
        const name = row.name.trim();
        if (name === '') delete next.name;
        else next.name = name;
        const window = parseCapacity(row.window);
        if (window === undefined) delete next.contextWindow;
        else next.contextWindow = window;
        next.vision = row.vision === true;
        next.effort = row.effort === undefined ? '' : row.effort;
        return next;
      }

      /** The refusals of a draft, each naming the row it stands in. */
      function checkRows(rows) {
        const seen = new Set();
        const problems = [];
        rows.forEach((row, index) => {
          const id = row.id.trim();
          if (id === '') problems.push({ index, field: 'id', message: t('models.idRequired') });
          else if (seen.has(id)) problems.push({ index, field: 'id', message: t('models.idDuplicate') });
          else seen.add(id);
          /* An empty window is not a wrong number: it is no window at all, and the schema's own default would answer for a row that states none — while the row is a declaration to the platform's compaction trigger and a model must state the window it declares. The refusal stands here, where the value appears, so the bar goes off and the press is refused by name before a write can carry a row whose window was dropped. */
          if (String(row.window ?? '').trim() === '') problems.push({ index, field: 'window', message: t('models.windowRequired') });
          else if (Number.isNaN(parseCapacity(row.window))) problems.push({ index, field: 'window', message: t('models.windowInvalid') });
          /* The effort is deliberately not checked here. The levels a row may name are the ones its own model
             publishes, and the vendor may narrow that menu after the row was written: a refusal would leave the
             user with a row they cannot apply and a value nothing on this page can put back. The name travels as
             it stands whatever the menu names, so the wire is not a reason to refuse it either. The control says
             what stands instead, in its own value, and says nothing more about it; a level the vendor never
             published cannot enter the row at all — it is chosen from the model's own menu. */
        });
        return problems;
      }

      /**
       * The vendor's multiplier as the reader reads it: a plain ASCII `x`, one decimal always (`0.1x`, `1.0x`,
       * `2.0x`, `0.0x`) — the vendor's own number and never a word for it, so its zero reads as a zero and not
       * as "free". A number the vendor ever publishes with more decimals travels as it arrived: rounding a rate
       * would be a number of ours standing where the vendor's own belongs.
       */
      const rateWords = (factor) => Number.isFinite(factor) ? `${Number.isInteger(factor) ? factor.toFixed(1) : String(factor)}x` : null;

      /**
       * The words one option of the model picker carries: the vendor's own name for the model, the host's own
       * separator, and the price multiplier the same answer published — the number as it arrived, never derived
       * here (the route's own `priceFactor`; an entry the vendor priced nothing carries no field, and then the name
       * stands alone).
       *
       * The wire id comes back **only where two entries of one listing share a name**: the row's key and the
       * value that goes to the vendor stay the id, and a list whose two lines read the same would be a choice
       * nobody can make. A model the listing does not carry is drawn by its id, which is the only name it has.
       */
      const optionWords = (entry, clashing) => {
        const name = typeof entry.name === 'string' && entry.name !== '' ? entry.name : entry.id;
        const rate = rateWords(entry.priceFactor);
        const label = rate === null ? name : `${name} · ${rate}`;
        return clashing ? `${label} (${entry.id})` : label;
      };

      /** The names two entries of one listing share, so the id can come back for exactly those. */
      const clashingNames = (catalogue) => {
        const seen = new Set();
        const clashing = new Set();
        for (const one of catalogue?.values() ?? []) {
          const name = typeof one.name === 'string' && one.name !== '' ? one.name : one.id;
          if (seen.has(name)) clashing.add(name);
          seen.add(name);
        }
        return clashing;
      };

      /**
       * The names this page writes, in the words the cards use for them: a refusal that names the row's
       * own config paths would put the plumbing on the surface, and a reader cannot act on a key name.
       */
      const FIELD_KEYS = {
        models: 'status.subject.models',
        inferBase: 'status.subject.node',
        defaultContextWindow: 'models.fallbackWindow',
      }
      const fieldWords = (names) => names.map((name) => (FIELD_KEYS[name] === undefined ? name : t(FIELD_KEYS[name]))).join(', ')

      /**
       * The levels one model's row offers: that model's own menu, the level that stands for the row, and this
        * package's own `Off`, and nothing else.
       *
       * The list is that model's own menu, in the vendor's ascending order: the catalogue publishes it as an
       * object whose keys carry no order at all, and a menu drawn in whatever order two reads happened to give
       * would move under the reader's hand. Beside the menu stand exactly two things — the level that stands for
       * this row when the menu does not name it, and this package's own `Off` — and nothing else: a level the vendor does
       * not publish is not invented here, and the platform's own three are not offered as if they were this
       * model's own levels.
       *
       * The level that stands is an option even where it is not published, because the control draws what it
       * shows and offers what it draws: an untouched row stands on the route's own effort, and two of the
       * vendor's models publish no `max` at all — a trigger reading `max` with a list that cannot name it would
       * be a value the reader could not put back after moving away from it.
       *
       * The menu is where the answers stand, and no sentence stands beside it: what a model publishes is what
       * its own menu holds, a model that publishes none leaves the standing level and `Off` alone in it, and a
       * model the listing does not carry has no level of its own to draw at all — the row names the id it
       * declares with no rate beside it, the id stays an option of the picker so no value is replaced in
       * silence, and the control carries the route's level in its own title. Three sentences said those states
       * once and drew a line under the control; they left by the user's word because the line made a row's
       * height depend on which state its model was in, and the size of the field may not change between
       * choosing and chosen. The tag that named the first of the three in the row's head left with them, and
       * its ground is the same shape: the head's place was chosen to keep a line out of the field — which is
       * exactly where the line struck down here stood, so the two are one defect seen from the head and from
       * the field.
       */
      function effortOptions(entry, held, standing) {
        const menu = Array.isArray(entry?.efforts) ? entry.efforts.filter((one) => typeof one === 'string' && one !== '') : [];
        /* Where neither side names a level there is nothing drawn, and `''` is how this page says "nothing named":
           a `null` reaching the options would put a nameless entry in the menu. */
        const drawn = held === '' ? (standing ?? '') : held;
        const options = [...menu]
          .sort((left, right) => rankOf(left) - rankOf(right))
          .map((level) => ({ value: level, words: level }));
        if (drawn !== '' && options.some((one) => one.value === drawn) === false) options.push({ value: drawn, words: drawn });
        options.push({ value: shared.OFF.id, words: t('models.effortOff') });
        return options;
      }

      /** Where a vendor level stands on the vendor's own scale; a level outside it is drawn last. */
      const rankOf = (level) => {
        const at = shared.VENDOR_EFFORTS.indexOf(level);
        return at < 0 ? shared.VENDOR_EFFORTS.length : at;
      };

      /**
       * One model row of the models card: the read-out that stood there before the editor, and the fields
       * the row is edited through. The marks stay in the head of the row they belong to, so one card
       * carries both the reading and the writing and no second list is drawn beside it.
       *
       * The marks are joined by id, not by position: a row the user has just added or renamed has no
       * reading of its own, and the facts about a model — which one the agent uses, the efforts it
       * declares — belong to the id, wherever the row stands.
       */
      function modelRow(draft, index, view, problems, act, clashing) {
        const state = view.view;
        const id = draft.id.trim();
        const marks = state.models.find((one) => one.id === id) ?? null;
        const catalogue = state.catalogue.models;
        const entry = catalogue?.get(id);
        const idProblem = problems.find((problem) => problem.index === index && problem.field === 'id');
        const windowProblem = problems.find((problem) => problem.index === index && problem.field === 'window');
        /* The effort in force for a row that names none: the route's own where the read names one, and nothing at all
           where it names none. */
        const rowEffort = state.rowEffort ?? null;
        const known = catalogue === null ? null : catalogue?.has(id) === true;
        /* Which of the three states the catalogue is in: still on the wire, answered, or refused with a
           reason. The effort menu is drawn differently in each, and "not read yet" is not "not there". */
        const phase = catalogue !== null ? 'read' : state.catalogue.message === null ? 'reading' : 'refused';
        const options = effortOptions(entry, draft.effort, rowEffort);
        return h('li', {
          key: `${id}:${index}`,
          className: 'coreness-qoder-model',
                  'data-model': id,
          'data-index': String(index),
          /* What the node itself published as this model's output ceiling, as the catalogue answered it —
             empty where the node published none. It stands on the row because it is a fact about the row's
             model, and because two roads can be compared only by their numbers. */
          'data-max-tokens': entry?.maxTokens === undefined ? '' : String(entry.maxTokens),
        }, [
          h('div', { key: 'head', className: 'coreness-card-head' }, [
            /* The row reads as the option does: the name the vendor published, the host's separator and the
               multiplier that came with the same answer (`optionWords` carries the list's own reading). A row
               the listing does not carry has no rate to show and is named without one. */
            h('span', { key: 'name', className: 'coreness-qoder-name coreness-sectionTitle' },
              `${draft.name.trim() !== ''
                ? draft.name
                : typeof entry?.name === 'string' && entry.name !== '' ? entry.name : id === '' ? t('models.pick') : id}${rateWords(entry?.priceFactor) === null ? '' : ` · ${rateWords(entry.priceFactor)}`}`),
          ]),
          ...marks?.description === null || marks?.description === undefined
            ? []
            : [h('p', { key: 'desc', className: 'coreness-dim' }, marks.description)],
          h('div', { key: 'fields', className: 'coreness-qoder-grid' }, [
            h('div', { key: 'id', className: 'coreness-field' }, [
              h('span', { key: 'label', className: 'coreness-fieldLabel' }, t('models.model')),
              /* The model is chosen from the live catalogue: the vendor names a model differently in its own
                 menu than on the wire, so an id typed from memory is a guess. What the list draws is the
                 vendor's own name and the rate it published — the wire id stands only where two names would
                 read the same (`optionWords`). An entry the catalogue does not carry stays an option of its
                 own — the choice never replaces a value silently — and a catalogue that could not be read
                 leaves the picker locked rather than empty. */
              h(picker.IdPicker, {
                key: 'input',
                name: `qoder-model-${index}`,
                value: id,
                disabled: view.busy !== null || catalogue === null,
                'aria-invalid': idProblem !== undefined,
                'aria-label': t('models.model'),
                placeholder: t('models.pick'),
                options: [
                  ...id === '' ? [{ value: '', words: t('models.pick') }] : [],
                  ...id === '' || known === true ? [] : [{ value: id, words: id }],
                  ...[...(catalogue?.values() ?? [])].map((one) => ({
                    value: one.id,
                    words: optionWords(one, clashing.has(typeof one.name === 'string' && one.name !== '' ? one.name : one.id)),
                  })),
                ],
                onChoose: (next) => act.chooseModel(index, next),
              }),
            ]),
            h('div', { key: 'effort', className: 'coreness-field' }, [
              h('label', { key: 'label', className: 'coreness-fieldLabel' }, t('models.effortLabel')),
              /* The control offers the levels this model's own vendor publishes, read from the live
                 catalogue's entry for the row's id, plus the level that stands and our own `Off` — and it is
                 the page's own picker, the same control the wire id is chosen with, not a native `select`.
                 The value it shows is the level that stands **in force**: the row's own where the row names
                 one, the route's answer where the route names one — and **nothing** where neither does, which
                 is the state the user asked for when he took the schema's own default off the wire. An
                 untouched row keeps naming nothing (`storedRow` writes it as it is, empty string included), so
                 the control stands empty and no sentence claims an effort nobody named. */
              h(picker.IdPicker, {
                key: 'input',
                name: `qoder-effort-${index}`,
                value: draft.effort === '' ? (rowEffort ?? '') : draft.effort,
                disabled: view.busy !== null || phase === 'reading',
                'aria-label': t('models.effortLabel'),
                title: draft.effort === 'off' ? t('models.effortOurs')
                  : draft.effort === '' && rowEffort !== null ? t('models.effortRow', { effort: rowEffort }) : undefined,
                options,
                onChoose: (next) => act.patchRow(index, { effort: next }),
              }),
            ]),
            h('div', { key: 'window', className: 'coreness-field' }, [
              h('label', { key: 'label', className: 'coreness-fieldLabel' }, t('models.window')),
              h('input', {
                key: 'input',
                className: 'coreness-field coreness-field-box',
                type: 'text',
                value: draft.window,
                disabled: view.busy !== null,
                'aria-label': t('models.window'),
                'aria-invalid': windowProblem !== undefined,
                /* No placeholder: an empty window is not the fallback window and not the catalogue's
                   number — it is the schema's own default, which this page cannot name. A grey number
                   standing in for it would be read as the value that will be used. */
                onChange: (event) => act.patchRow(index, { window: event.target.value }),
              }),
            ]),
          ]),
          h('div', { key: 'inputs', className: 'coreness-qoder-inputs' }, [
            h('span', { key: 'label', className: 'coreness-fieldLabel' }, t('models.inputs')),
            h('label', { key: 'text', className: 'coreness-check' }, [
              h('input', { key: 'box', type: 'checkbox', checked: true, disabled: true, readOnly: true }),
              t('models.text'),
            ]),
            h('label', { key: 'image', className: 'coreness-check' }, [
              h('input', {
                key: 'box',
                type: 'checkbox',
                checked: draft.vision,
                disabled: view.busy !== null,
                'aria-label': `${t('models.image')} ${id}`,
                onChange: (event) => act.patchRow(index, { vision: event.target.checked }),
              }),
              t('models.image'),
            ]),
            h('button', {
              key: 'remove',
              type: 'button',
              className: 'coreness-button',
              disabled: view.busy !== null,
              onClick: () => act.removeRow(index),
            }, t('models.remove')),
          ]),
        ]);
      }

      /**
       * The live catalogue of the vendor's own models, from the product's own route.
       *
       * The read is one action on the route the node sweep already stands on (`CATALOGUE_ACTION`), and it
       * answers the vendor's listing **with the reasoning menu every entry publishes** — which is what a
       * model row's control offers. The platform's own discovery door cannot carry that: its answer is
       * projected onto five fields twice over, in the service and again in the remote schema the browser is
       * handed, so the menu died between the route and the page.
       * The door stays registered for the platform's own model picker, which is the surface that adopts a
       * model; this page reads its own route, so one generation of the listing answers both the ids and
       * the menus and two roads cannot drift apart.
       *
       * A refusal is a message, never an empty picker that would read as "this vendor serves nothing".
       *
       * The answer carries the moment it was read (`at`), because the vendor's price multiplier travels with
       * the same listing and is a rate **in force when it was read**: the section draws it beside the model
       * and says when, rather than letting a remembered number read as a fresh one. A read that answered nothing
       * carries no moment — no rate was read, and the state room names the refusal instead.
       */
      async function readCatalogue() {
        try {
          const answer = await fetch(shared.PROBE_ROUTE, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: shared.CATALOGUE_ACTION }),
          });
          if (!answer.ok) return { models: null, message: `${t('models.catalogDown')} (${t('route.answered', { status: answer.status })})`, at: null };
          const payload = await answer.json();
          if (payload?.ok !== true) {
            /* The face draws the state and the reason, and nothing of the route's own vocabulary: a code is what a
               caller routes on, and the vendor's fresh detail — its sentence, the id it traces by — differs between
               two runs of a page that did not move, so it is not drawn here the way this chunk keeps it off the
               verdict's own line. What a user needs stands in the card's own state word and in this reason. */
            return { models: null, message: `${t('models.catalogDown')} (${payload?.error?.message ?? 'refused'})`, at: null };
          }
          const models = new Map();
          for (const entry of payload.value?.models ?? []) {
            if (typeof entry?.id === 'string' && entry.id !== '') models.set(entry.id, entry);
          }
          return { models, message: null, at: Date.now() };
        } catch (error) {
          return { models: null, message: `${t('models.catalogDown')} (${shared.reasonOf(error)})`, at: null };
        }
      }

      /**
       * What the picker is doing, in the card's body: the wait while the catalogue is on the wire, the
       * vendor's own refusal when its route answers nothing, and this section's sentence when the listing
       * could not be read at all. It is a sub-control's own content and not the card's state — the head says
       * what stands, this says what the list is waiting for — and it stands whether or not a row is drawn, so
       * the list does not move under the reader's hand when the answer arrives.
       */
      function catalogueNote(state) {
        const catalogue = state.catalogue ?? { models: null, message: null };
        /* The listing's own failure is read first: the platform's catalogue and the vendor's listing are two
           answers, and a listing that failed while a catalogue stands is still a list nobody can join. */
        if (state.failure !== null && state.failure !== undefined) return `${t('models.failed')}: ${state.failure.message}`;
        if (catalogue.models !== null) return null;
        if (catalogue.message !== null) return catalogue.message;
        return t('models.readingCatalog');
      }

      /**
       * The models card: its head with the count and the route's own tag, the list with the catalogue's line
       * and the rows, the add press, the two notes, and the foot with the reset, the cancel and the apply.
       * The head is the section's own head maker, handed in; the rest is this card's.
       */
      function modelsCard(view, act, headOf, rows, problems, clashing) {
        const state = view.view;
        return h('li', { key: 'models', className: 'coreness-card-box' }, [
          headOf('models', `${t('models.label')} (${rows.length})`, [
            /* The tag says the one thing a reader cannot get anywhere else: a route that is declared and **not**
               registered fails every request through it. A word about the ordinary state is not news, and the head
               says the ordinary state by being there. */
            state.live ? null : h('span', { key: 'live', className: 'coreness-tag coreness-qoder-tag' }, t('state.unregistered')),
          ]),
          h('div', { key: 'body', className: 'coreness-card-body' }, [
            /* The list's own room, with the list's own news inside it: what the catalogue is doing or what it
               answered, the sentence a route with no model gets, and the rows — one block whatever the state.
               A line standing beside the list would be a block the card grew and dropped as the answer landed,
               and everything under it would move by that line's height every time: the shape the page's own
               check holds (no card changes what stands under its head in any state). */
            /* The rows and the control that adds one are one block, outside the body's gap: the add row keeps
               the set's own 12 under the last row — the card body's gap is between blocks, not between a list
               and the press that grows it. */
            h('div', { key: 'rows' }, [
              h('ul', { key: 'list', className: 'coreness-list' }, [
                catalogueNote(state) === null
                  ? null
                  : h('li', { key: 'catalogue', className: 'coreness-qoder-line' }, catalogueNote(state)),
                ...(rows.length === 0
                  ? [h('li', { key: 'none', className: 'coreness-dim' }, t('models.none'))]
                  : rows.map((row, index) => modelRow(row, index, view, problems, act, clashing))),
              ]),
              h('div', { key: 'add', className: 'coreness-addRow' }, h('button', {
                key: 'addRow',
                type: 'button',
                className: 'coreness-add coreness-button',
                /* A row is chosen from the live catalogue: without it, adding a row would offer an empty
                   picker whose only value is a guess. */
                disabled: view.busy !== null || state.catalogue.models === null,
                onClick: () => act.addRow(),
              }, t('models.addRow'))),
            ]),
            /* The one refusal left in this card: the fallback window has no control here, and an empty place
               would read as a control that was forgotten. The effort's own footnote went with the control
               that now moves it. */
            h('p', { key: 'windowNote', className: 'coreness-dim' }, t('models.windowNote')),
            h('p', { key: 'note', className: 'coreness-dim' }, t('models.note')),
            h('div', { key: 'actions', className: 'coreness-qoder-foot' }, [
              h('button', {
                key: 'reset',
                type: 'button',
                className: 'coreness-button',
                disabled: view.busy !== null,
                onClick: () => act.reset(),
              }, t('reset')),
              h('div', { key: 'right', className: 'coreness-qoder-actions' }, [
                /* Apply stands only over a draft: the section as it was read has nothing to write, and a
                   press that wrote the same list back would be an edit nobody made. */
                h('button', {
                  key: 'cancel',
                  type: 'button',
                  className: 'coreness-button',
                  disabled: view.busy !== null || view.draft === null,
                  onClick: () => act.cancel(),
                }, t('cancel')),
                h('button', {
                  key: 'apply',
                  type: 'button',
                  className: 'coreness-button',
                  'data-tone': 'primary',
                  disabled: view.busy !== null || problems.length > 0 || view.draft === null,
                  onClick: () => act.apply(),
                }, view.busy === 'models' ? t('models.applying') : t('apply')),
              ]),
            ]),
          ]),
        ]);
      }

      return {
        CAPACITY, parseCapacity, formatCapacity, draftRow, storedRow, checkRows, rateWords, optionWords,
        clashingNames, FIELD_KEYS, fieldWords, effortOptions, rankOf, modelRow, readCatalogue, catalogueNote,
        modelsCard,
      };
    }

    return { create };
  },
});
