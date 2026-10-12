/**
 * The rate gate's section of the product's page: the limit as it stands, the models it is attached to, and
 * the window the gate is counting right now — read from the plugin's own route, written through the
 * platform's settings service.
 *
 * The chunk is pulled by the entry, not by the shell: a package-local file beside the entry is served on
 * demand and the entry asks for it with the owner's own `require.async`, which the module system answers by
 * loading the sibling script and expecting it to register under the package's id and the file's own name.
 *
 * Two doors, and they are not interchangeable. **The picture is the gate's own route**, read-only, a plain
 * fetch of a document-relative path like the product's other routes: everything drawn about the live state
 * comes from there, the settings namespace included (`value.ns`), because the namespace is the row's id and
 * a copy of it here would drift from the assembly. **A write goes through the platform's settings service**
 * — the door the platform's own Models page writes through — and the revision the section read travels with
 * the write, so a write that raced a hand's edit of the profile's patch is refused as a conflict instead of
 * overwriting it, and the section then re-reads: the call's own word about what it wrote is never the
 * section's state. The gate's route is never asked to write — it answers a picture.
 *
 * What the section draws follows the two sections beside it: cards in the host's own sheets, carried by
 * `--dsw-alias-*` tokens alone, and every sentence that can appear with the arrival of a state stands in a
 * **reserved room** — two lines of 18px, the rest scrolling inside them, the words whole in the DOM — so a
 * state never moves what stands under it.
 */
window.__ModuleLoader__.load({
  id: '@coreness/dsh/client.gate.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The plugin's own door: the picture, on a GET, and nothing else. */
    const ROUTE = '/api/coreness.rateGate';
    /** The seat the page declares for the sections of the plugins that come later. */
    const SEAT = 'coreness.section';
    /** The rail row's own id inside that seat. */
    const ID = 'gate';
    /** The locale namespace of the section's words. */
    const NS = 'coreness.gate';
    const STYLE_ID = 'coreness-gate-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/dsh/client.gate.js';
    const PACKAGE = '@coreness/dsh';

    /**
     * How often the picture is read again while the section stands.
     *
     * The window moves while no session event is written, so the gate's own line about a reading being
     * true only when it is read applies to this section too. The beat is skipped while the document is
     * hidden: a glance at another tab is not a reason to ask the host for a picture nobody sees.
     */
    const BEAT_MS = 2000;

    /** The live fields of the row that stand as one number each, in the order the card shows them. */
    const SCALARS = ['windowMs', 'maxWaitMs', 'thresholdRatio', 'dryRun'];

    /**
     * The page's own picker, drawn where a value is chosen from a settled list: the provider and the
     * model of a row under a ceiling. It lives in a chunk of its own because three
     * of the page's sections draw it, and this chunk pulls it the way the entry pulls this one: a
     * sibling file beside the entry, materialised once for the whole package.
     *
     * The pull starts at materialisation, and the section is seated only once the control is in hand, so
     * nothing is drawn before the thing that draws it exists. A pull that failed is named on the console
     * and seats nothing — the rule the entry applies to a chunk that did not arrive.
     */
    const picker = require.async('./client.picker.js');
    let IdPicker = null;
    /* The page's one door to the console, pulled beside the picker and in hand before the section stands: a
       refusal's reason leaves the face through `statusDetail`, and a door that is not in
       hand is not a place a reason can go. Left unset rather than standing in for the component — a stand-in is
       a silent substitute, which this page's law forbids — so a call before the pull is a crash that names
       itself, the rule the two sections beside this one follow. */
    const status = require.async('./client.status.js');
    let statusDetail;
    /* The page's one lifetime for a temporary answer, pulled beside the other two and in hand before the
       section stands: the word of a press is news, and news goes by the number the whole page holds —
       the same pull and the same number the MCP section and the Qoder card take. This
       section drew a strip and armed nothing, so its word stood until the next press came or the section was
       left, which is the defect the user reported of it in his own words ("как будто не пропадает, я долго
       ждал"). Left unset rather than standing in for the number, like the door above: a copy written here
       would be the second number this page deliberately does not have. */
    const hold = require.async('./client.hold.js');
    let holdOf;

    /* The section's own words. One namespace, one dictionary: the rail row's label is a thunk so it
       follows the language without a re-registration, and every failure the two doors can answer with
       has words here rather than a bare code. */
    const EN = {
      /* One word for the rail's row and for the page's own heading, by the user's own reading: "вкладка и
         заголовок — Rate limiter". The rail's label and the heading were two keys, and the picture of the
         section showed them reading differently ("Rate" against "Rate limiter") while every check stayed green:
         a word drawn from two places drifts, and only a look at the picture finds it. */
      section: 'Rate limiter',
      title: 'Rate limiter',
      caption: 'A ceiling in tokens per minute, attached to a model: the gate holds a request the window cannot take and lets it go marked forced when the wait bound is spent.',
      /* The whole sentence, in the user's own choice: the two facts that cost money and the one that saves a surprise,
         and no mechanics. "Of this run alone" says whose count it is without the word "process", which read as the
          page's. The window's being per provider and model, and its living in memory, are mechanics: they stand outside this room. */
      'state.standing': 'Of this run alone: a reload keeps it, a restart wipes it, spend elsewhere is not counted.',
      'state.error': 'The gate could not be read',
      'state.unwritable': 'The row is not configurable from here: {fault}',
      /* The answer to a press is one of three words, the same on every page of this product: `Saved` for a change
         that landed, `Nothing changed` for a press that changed nothing, and the refusal in the error tone. The
         sentence that used to stand here said the same thing at length ("Written: the values below…"), and the
         user's own rule took it off the page: "не писать подробное описание… краткое и универсальное, а не вот
         это всё подряд: каждый раз уникальный случай". What the long sentence carried is not lost — it is the
         reason a reader meets in the console (the `statusDetail` door), and not as a second sentence on the face. */
      'state.written': 'Saved',
      'state.refused': 'Not saved',
      'state.nothing': 'Nothing changed',
      'reason.conflict': 'The row changed elsewhere: the draft was not written, and the values below are the row as it now stands.',
      'fault.write': 'The write did not go through',
      'card.limit': 'The limit',
      'field.window': 'Window',
      'field.window.unit': 'ms',
      'field.window.hint': 'The stretch the ceiling is counted over: a sliding window, not a calendar minute.',
      'field.maxWait': 'Longest wait',
      'field.maxWait.unit': 'ms',
      'field.maxWait.hint': 'How long a request may be held for room before it goes over the window marked forced. Zero sends it at once.',
      'field.ratio': 'Caution',
      'field.ratio.hint': 'How full a window may look before the gate starts a reservation. One is the honest number.',
      /* One sentence for the three boxes a user may empty. An empty box is not a value the row's schema
         takes — the three are numbers with a default — so it travels as an `unset` and the row falls back to
         the gate's own default (the op is built in `scalarOp`). The words stand here once and the three hints
         point at this entry rather than repeating it, which is the page's own rule for every element it draws. */
      'field.empty': 'Empty follows the gate\'s own default.',
      'field.ceiling': 'Tokens per window',
      /* The word a row's own ceiling is refused by, and it is deliberately not `field.empty`: that sentence is the
         three section numbers' case, which have defaults the schema declares and fall back to them. A row's ceiling
         has no default to fall back to — the gate's resolver refuses the row and writes nothing for it — so an
         empty box here would leave a row
         that limits nothing while the page said it saved. The word names the field a user typed in. */
      'field.ceiling.problem': 'Tokens per window must be a positive number.',
      'field.provider': 'Provider',
      'field.model': 'Model',
      /* Who stands behind a number: the profile's own patch, or the schema's default. The words are short
         because they stand in a line beside the field's own word, in a mark of a fixed width — a mark whose
         box grew with its word would move the label row, and a label row that moves is a press moving the
         surface under the reader. */
      'control.apply': 'Apply',
      'control.add': 'Add a model',
      'control.remove': 'Remove',
      'add.reading': 'Reading the catalogue…',
      'add.none': 'This profile’s catalogue carries no model to name.',
    };

    /* The host's own sheets, copied rule for rule and renamed, carried by its tokens alone: the settings
       card, its head, the tag, the field and its input, the buttons and the foot are the host's own rules,
       taken by way of the two sections beside this one.
       Nothing in this room reserves a height: the user's own rule — nothing is reserved anywhere on this
       page — took the reservation off both lines of this head, and what the other way costs is measured:
       the section's room went from two lines to one and the cards under it moved eighteen pixels. A line
       here takes the height of what it says. */
    const CSS = `
.coreness-gate-head{flex-direction:column;gap:6px;min-width:0;display:flex}
.coreness-gate-title{margin:0;font-size:16px;font-weight:500;line-height:24px;color:var(--dsw-alias-label-primary)}
.coreness-gate-caption{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-tertiary)}
.coreness-gate-state{margin:0;font-size:12px;line-height:18px;overflow-wrap:anywhere;color:var(--dsw-alias-label-tertiary)}
/* The two tones this section shares with the page stand once in the entry's sheet — coreness-tone-done and
   coreness-tone-fault — and the state wears them beside this class. Warn is the gate's own: no other section
   warns, so it stays here. */
.coreness-gate-state[data-tone='warn']{color:var(--dsw-alias-state-warn-label)}
/* A row's answer: the same word, the same tone, and no box of its own — the box it stands in is the page's own
   answer rule's, which is why the page keeps exactly one reserved strip; what this section writes is where the
   word sits, at the right end of the head, and nothing else. */
.coreness-gate-rowAnswer{margin-left:auto}
.coreness-gate-answer{align-self:flex-start}
/* The tone's colour is not this section's to write: every strip on the page wears the page's own answer class
   and the tones are painted once, beside the reservation rule the strips share. This section kept
   four rules of its own — a base colour and three tone classes — in a vocabulary of its own, where the page
   says fault and this section said error, and the user caught the result with his own eye: the same word in
   another colour in the section beside it. What stands here is only what is this section's: where the strip
   sits in the head. */
.coreness-gate-headButton{box-sizing:border-box;border:none;background:0 0;color:inherit;font:inherit;text-align:left;padding:0;flex-direction:column;min-width:0;flex:1 1 auto;display:flex}
.coreness-gate-name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}
/* A hint line: the page's small role, one pair for it everywhere — 12/18 in label-tertiary. */
.coreness-gate-dim{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere}
.coreness-gate-fields{flex-direction:column;gap:8px;display:flex}
.coreness-gate-pair{flex-direction:column;gap:6px;display:flex}
/* The **row cards** — and only they — stand their three fields on one line; the section's own card (The limit) keeps
   its fields one to a line and is untouched. Both kinds carry coreness-gate-row, which is how the drawing names a card
   of this section's list, so the row cards carry a second class of their own and this rule names that one: a selector on
   the shared class alone reached the section's card as well and narrowed its fields from 627 px to 560 — measured by the
   driver's roundtrip step, which prints each field's width.
   By the user's own reading of how it stood before ("раньше выбор провайдера, модели и окна стоял в одной строке"): the
   line takes the card's whole inner width and the fields share it equally, so there is no empty space at either edge.
   The pairs dissolve with display:contents and their fields become the line's own items; the equal share is written as
   flex:1 1 0 on the field itself, which is what makes the three of them equal rather than sized by their content.
   A backtick must not stand in these comments: this stylesheet is a template literal and one closes it. */
.coreness-gate-rowCard .coreness-gate-body{flex-direction:row;flex-wrap:wrap;align-items:flex-start}
.coreness-gate-rowCard .coreness-gate-body>.coreness-gate-pair{display:contents}
/* What the gate's own field adds to the shared column: each of the pair's two fields takes an equal share of the
   row and never shrinks past the width its picker can still be read in. */
.coreness-gate-field{min-width:180px;flex:1 1 0}
/* The gate's own label: its voice stands here, as every chunk's does, and this one is the field's whole row — a div
   whose child is the name — so it stands as a block in the column, while the sections' labels are the name itself
   and stand inline. */
.coreness-gate-fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px;display:flex}
.coreness-gate-input{box-sizing:border-box;border:none;background:0 0;color:var(--dsw-alias-label-primary);flex:1 1 auto;min-width:0;font:inherit;padding:6px 10px;font-size:14px;line-height:22px}
/* The box is the wrapper now, so the ring belongs to the wrapper: the input inside it has no border to colour.
   The number and its unit touch by intent — the unit is the number's own name and stands against it — so this
   box declares no room between them. */
.coreness-gate-unitBox{box-sizing:border-box;display:inline-flex;align-items:center;width:100%;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.coreness-gate-unitBox:focus-within{border-color:var(--dsw-alias-state-business-primary)}
.coreness-gate-unitBox>.coreness-gate-input:focus{outline:none}
.coreness-gate-unit{flex:none;padding-right:10px;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px}
/* A hint line: the host's own rule for one is label-tertiary at 12px/18px, its advanced hint rule and the
   plugin manager's guide, registry and template hints. This one carried
   --dsw-alias-label-dimmed, which is the host's own *placeholder* token and no hint's colour:
   measured in one walk, the unit ms stood at rgb(225, 229, 238)
   where the same kind of line in the sections beside it stood at rgb(129, 133, 140) — the reader's own
   complaint, read off the DOM. */
.coreness-gate-hint{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
/* The row's actions: a line of their own under the four fields, hard against the right edge — the place the
   user named for them ("справа внизу… в отдельной строке"). flex-basis:100% is what makes the line its own:
   the body is a wrapping row of fields, and this child asks for the whole width and wraps onto the next line. */
.coreness-gate-rowFoot{flex-basis:100%;justify-content:flex-end;gap:8px;display:flex}
/* An experiment of the user's, and one line to revert: the three buttons of a row stand as tall as the boxes a
   value is typed into (the box of a field is 32), where a button of this page is otherwise 36 — the number
   the page chose for the part it stands for. His own words: "можем ли мы сделать высоту кнопок… такой же, как у
   полей, в которых вводятся значения… почему экспериментально? потому что непонятно, как будет это выглядеть".
   Scoped to the row's own line so that nothing else on the page moves with it; the platform's own button is 36 and
   is not touched, which is why this is an experiment rather than a uniform rule. */
.coreness-gate-foot{justify-content:flex-end;align-items:center;flex-wrap:wrap;display:flex}
/* The rate limiter's own tone, and the one button rule this sheet keeps: the base, the hover, the two primary
   rules, the disabled look and the ring stand once in the page's own sheet, in the shared
   button class every button here wears beside this one. */
`;

    let ctx;
    let t;

    /**
     * What this section last read, and the moment it read it.
     *
     * The browser half is materialised once per application session, so a section that is left and entered
     * again has this beside it. A mount paints it at once and the read corrects it behind — this section also
     * keeps its own beat, so the correction arrives by itself; the session's *first* mount has nothing and
     * keeps the honest skeleton, because a skeleton is the truth when nothing is known. It holds a read
     * picture and never the visit's own state — the draft, the open row, the news of a press.
     */
    /* The holder's name is the section's own; nothing else on the page writes under it. */
    const HELD = '__corenessGateLastRead';
    const lastRead = {
      get: () => (typeof window === 'undefined' ? null : window[HELD] ?? null),
      set: (picture) => { if (typeof window !== 'undefined') window[HELD] = picture; },
    };

    /**
     * The section's sheet, held for as long as the section stands: put in here, put back if it is taken.
     *
     * The platform replaces a plugin in place over the module table it already holds — `import` answers from
     * the module cache, so a factory does not run twice — and
     * it takes the package's own style tags away in the same act (`removeOwnedStyles`). The one thing
     * it re-runs is the mount, which covers a section that is left and entered again; it does not cover a
     * component that stays mounted while the tags go, and that is the case the user read as a broken page —
     * the frame's rules gone with the markup still drawn. So the head is watched while this component stands.
     *
     * The hold ends with the effect: when the component goes, nothing puts the sheet back, and the platform's
     * own removal of a package that goes — a deliberate act — is left as it is. A sheet that outlived its
     * plugin would be a trace, which this shape refuses.
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

    /** The section's stylesheet as a tag: put in once, and never removed by this code. */
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
     * The picture, from the gate's own route.
     *
     * A refusal is read, never guessed from a status: the route answers `{"ok": false, "error": …}` with
     * status 200 for a payload it could not build, and a section that drew an empty table there would be
     * showing "nothing is limited" for a failure.
     *
     * The route's own code for that failure is not drawn: the face's word for a read that failed is the
     * section's own (`state.error`), and the route's sentence stands beside it as the reason.
     */
    async function readPicture() {
      const answer = await fetch(ROUTE, { method: 'GET' });
      if (!answer.ok) throw new Error(`${ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${ROUTE} refused the read`);
      return payload.value;
    }

    /**
     * The row's own namespace, its revision and its values, from the platform's settings mirror.
     *
     * The namespace is the one the picture answered, never a constant of this half: the row's id is the
     * namespace, and a copy here would drift from the assembly that mounts it.
     */
    async function readSettings(remote, ns) {
      const described = await remote.settings.describe();
      if (!described.ok) return { ok: false, fault: described.error?.message ?? t('state.error') };
      const row = described.value.namespaces.find((one) => one.ns === ns);
      if (row === undefined) return { ok: false, fault: t('state.unwritable', { fault: ns }) };
      return { ok: true, ns: row.ns, revision: row.revision, value: row.value ?? {} };
    }

    /**
     * One write, with the revision the section read.
     *
     * The conflict is the platform's own refusal and it means the row moved under the draft — a hand's
     * edit of the profile's patch and another page's write are the same event to the service — so the
     * caller re-reads instead of writing again, and the draft is dropped rather than re-applied over a
     * value the user never saw.
     */
    async function writeSettings(remote, settings, ops) {
      const written = await remote.settings.mutate(settings.ns, ops, settings.revision);
      if (!written.ok) {
        const conflict = written.error?.code === 'settings/conflict';
        return {
          wrote: false,
          conflict,
          reason: conflict ? t('reason.conflict') : `${t('fault.write')} — ${written.error?.message ?? ''}`,
        };
      }
      return { wrote: true, conflict: false, fault: null, revision: written.value?.revision ?? null };
    }

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
      return SCALARS.filter((name) => draft[name] !== read[name]).map((name) => scalarOp(name, draft[name]));
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
    const OUTCOMES = ['sent', 'watching', 'forced', 'cancelled'];

    /**
     * The one sentence of the section's reserved room, and its tone.
     *
     * The empty case says **nothing**: "No model is limited: every request passes untouched" left by the user's
     * own word ("непонятно, зачем это. То есть он там же будет видно: если установлено, если не установлено, то
     * тоже видно. То есть как будто бы это бесполезно") — the same fact he had already removed from the card,
     * and the room keeps its place and its height so nothing under it moves. A room that is empty is a quiet
     * room, not a missing one.
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

    
    /**
     * One card per model under a limit: its head carries the pair and the row's own answer, and its body the
     * pair's two pickers, the ceiling and the two controls, so the card is what the row is and nothing else.
     */
    function rowCard({ row, index, view, act, open, catalog }) {
      const draftRow = view.draft === null ? null : view.draft.rows[index];
      const held = draftRow ?? row;
      const busy = view.busy === true;
      /* This row's ceiling, held once where the row is drawn: the box's own mark, the strip's word and the row's
         press all read this one value, so none of them can drift from the others. */
      const problem = ceilingProblem(held.tokensPerMinute);
      /* A row that states no ceiling has a status of its own, and the page keeps one strip per card: the guard's
         voice is this strip — the same surface, the same tone word, top-right as every other card's — and not a
         sentence under the box, which moved everything below it by its own height the moment a digit was typed (the
         user's own reading of it). The derived status outranks a pressed answer, because the strip is about the row
         as it now stands; and the strip's room is reserved either way, so the word arrives without moving a pixel.
         The reason keeps its road out through `statusDetail`, said where the value is patched. */
      const note = problem === null ? (view.note?.at === index ? view.note : null) : { tone: 'fault', text: t('state.refused') };

      const pairs = pairsOf(catalog);
      return h('li', { key: `row${index}`, className: 'coreness-gate-row coreness-gate-rowCard' }, [
        h('div', { key: 'card', className: 'coreness-gate-card coreness-card-box', 'data-open': String(open) }, [
          /* The card is fixed by the user's own word: it is small — a head and one row of fields — and a fold in
             front of four fields costs a press and hides what the section is about. Its head therefore says what
             the row is and presses nothing, and the fields stand under it always. */
          h('div', { key: 'head', className: 'coreness-gate-cardHead coreness-card-head' }, [
            h('span', { key: 'title', className: 'coreness-gate-headButton' }, [
              h('span', { key: 'name', className: 'coreness-gate-name' }, pairOf(held)),
              ]),
            /* The row's own answer, in the same reserved box as every other strip on the page: the word is this
               row's or it is empty, but the room stands always — a strip the page reserves nowhere is a word
               painted where nobody can read it, which the walk measured as a 0×0 box before this. The reason a
               refusal came with does not stand beside the word as a tooltip: it leaves the face through
               `statusDetail` where the answer arrives, and the face keeps the word. */
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
                  h(IdPicker, {
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
                  h(IdPicker, {
                    key: 'picker',
                    name: `gate-model-${index}`,
                    value: held.model,
                    disabled: busy,
                    'aria-label': `${t('field.model')} (${pairOf(held)})`,
                    options: pairs.filter((one) => one.provider === held.provider).map((one) => ({ value: one.model, words: one.name })),
                    onChoose: (next) => act.patchRow(index, { model: next }),
                  }),
                ]),
                numberField({
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
                  disabled: busy || problem !== null,
                  /* The row's own press carries its place, so the word it earns stands in this row's card. */
                  onClick: () => act.apply({ at: index }),
                }, t('control.apply')),
              ]),
            ]),
        ]),
      ]);
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
      const known = rowsStanding(view);
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
        openRow: act.openRow ?? (() => {}),
        removeRow: act.removeRow ?? (() => {}),
        addRow: act.addRow ?? (() => {}),
        apply: act.apply ?? (() => {}),
      };
      return h('div', { className: 'coreness-still coreness-gate coreness-sectionBody' }, [
        h('div', { key: 'head', className: 'coreness-gate-head' }, [
          h('h1', { key: 'title', className: 'coreness-gate-title' }, t('title')),
          /* The caption carries the surface's own sentence as well: a property of the section stands in every state, so
         it is drawn always — and a line that is always drawn moves nothing when a press answers. */
      h('p', { key: 'caption', className: 'coreness-gate-caption' }, [t('caption'), ' ', t('state.standing')]),
        ]),
        /* The one room the section's own sentence stands in, in every state, so a refusal or a conflict
           arriving never moves the cards under it. */
        h('p', { key: 'state', className: 'coreness-gate-state' + (TONE_CLASS[note.tone] ?? ''), 'data-tone': note.tone ?? 'plain' }, note.text),
        h('ul', { key: 'cards', className: 'coreness-list coreness-gate-cards coreness-card-list' }, [
          limitCard({ ...view, busy }, acting),
          ...rows.map(({ row }, index) => rowCard({
            row,
            index,
            view: { ...view, busy },
            act: acting,
            open: view.open === index,
            catalog: view.catalog,
          })),
        ]),
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
          view.catalog !== null && pairsOf(view.catalog).length === 0 ? h('span', { key: 'none', className: 'coreness-gate-dim' }, t('add.none')) : null,
        ]),
      ]);
    }


    /** The section as it stands: the picture from the route, the row from the settings mirror. */
    function GateSection() {
      /* The section's sheet, ensured where the section is drawn: the platform's own replace re-mounts a
         plugin over the module table it already has and takes the package's style tags with it, so the mount
         is the one place a sheet can be put back. */
      useStyles();
      /* What was read in this session, if anything: the frame the mount paints before its own read answers. */
      const held = lastRead.get();
      const [state, setState] = React.useState(() => ({
        view: {
          status: 'loading',
          picture: null,
          settings: null,
          read: valuesOf(null),
          draft: null,
          note: null,
          open: null,
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
        const timer = setTimeout(() => setState((now) => ({ view: { ...now.view, note: null } })), holdOf());
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
          const picture = await readPicture();
          const settings = await readSettings(ctx.remote, picture.ns);
          setState((now) => ({
            view: {
              ...now.view,
              status: 'ready',
              picture,
              settings,
              read: valuesOf(settings.ok === true ? settings : null),
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
        const beat = setInterval(tick, BEAT_MS);
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
          if (fields.tokensPerMinute !== undefined && held !== undefined && ceilingProblem(fields.tokensPerMinute) !== null) statusDetail(pairOf({ ...held, ...fields }), t('field.ceiling.problem'));
          setState((now) => {
            const nowDraft = now.view.draft ?? now.view.read;
            const rows = nowDraft.rows.map((row, at) => (at === index ? { ...row, ...fields } : row));
            return { view: { ...now.view, draft: { ...nowDraft, rows }, note: null } };
          });
        },
        openRow: (index) => setState((now) => ({ view: { ...now.view, open: index } })),
        addRow: () => {
          /* A row arrives without a ceiling, so it arrives refused: the strip carries the word from the first
             frame, and the reason leaves the face here, where the row arrives. */
          const first = pairsOf(view.catalog)[0] ?? { provider: '', model: '' };
          statusDetail(pairOf({ provider: first.provider, model: first.model }), t('field.ceiling.problem'));
          setState((now) => {
            const draft = now.view.draft ?? now.view.read;
            return {
              view: {
                ...now.view,
                draft: { ...draft, rows: [...draft.rows, { provider: first.provider, model: first.model, tokensPerMinute: null, thresholdRatio: null, dryRun: null, fresh: true }] },
                note: null,
                open: draft.rows.length,
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
          const pair = pairOf(draft.rows[index] ?? {});
          const ops = rowsOps(left, view.read);
          if (ops.length === 0) {
            /* The press removed the only card that could carry this word, and the section's card is not its place:
               it answers presses made in it — so the row leaves in silence, and the leaving is the answer. */
            setState((now) => ({ view: { ...now.view, draft: left, note: null } }));
            return;
          }
          setState((now) => ({ view: { ...now.view, draft: left, busy: true, note: null } }));
          const written = await writeSettings(ctx.remote, settings, ops);
          if (!written.wrote) {
            /* The file still carries the row, so the section is read again and stands as it is; the refusal keeps
               its own word and its reason, and it stands in the row's own card — the file still draws that row —
               found by the pair the press removed (`cardOfPair`), because the index the press carried is an index
               into the draft it built, not into the list the page draws after the refusal. */
            setState((now) => ({ view: { ...now.view, busy: false, draft: null, note: null } }));
            await read();
            setState((now) => ({ view: { ...now.view, note: { tone: 'fault', text: t('state.refused'), at: cardOfPair(now.view, pair) } } }));
            /* The refusal's sentence leaves the face here, where the answer arrived: the strip keeps the word,
               and the code's own sentence goes to the console, said once for this attempt. */
            statusDetail(pair, written.reason ?? written.fault);
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
          const ops = place?.at === null || place?.at === undefined ? opsOf(view.draft, view.read) : rowsOps(view.draft, view.read);
          /* The pairs the draft carries, taken **before** the write: what this press asked the record to hold.
             After the write the re-read picture is the only witness of what it does hold, and the draft is gone
             by then — so the two are read here and held against each other below. */
          const carried = view.draft.rows.map(pairOf);
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
          const missing = view.draft.rows.findIndex((one) => ceilingProblem(one.tokensPerMinute) !== null);
          if (missing !== -1) {
            setState((now) => ({ view: { ...now.view, note: { tone: 'fault', text: t('state.refused'), at: missing } } }));
            statusDetail(pairOf(view.draft.rows[missing]), t('field.ceiling.problem'));
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
          const written = await writeSettings(ctx.remote, settings, ops);
          if (!written.wrote) {
            if (written.conflict === true) {
              /* The row moved under the draft: the draft is dropped and the row is read again, because the
                 sentence promises the fields show the section as it stands and only the read can say that. The
                 answer is set **twice**: once from the refusal itself, because the re-read is a remote call and a
                 refusal that takes half a minute to say so is a refusal nobody hears, and again after the read —
                 the read builds a fresh view and would drop the first word with it. The place is read from the
                 pair both times (`cardOfPair`): the index the press carried is an index into a draft this branch
                 has just dropped, and it pointed at another row's card or at no card at all. */
              setState((now) => ({ view: { ...now.view, busy: false, draft: null, note: { tone: 'fault', text: t('state.refused'), at: cardOfPair(now.view, about) } } }));
              /* The reason is said once, where the refusal arrived, and not again after the re-read: the second
                 `setState` below only puts the same word back on the view the read has just replaced. A press
                 made in the section's own foot names the section's subject where no row's pair does. */
              statusDetail(about ?? t('card.limit'), written.reason ?? written.fault);
              await read();
              setState((now) => ({ view: { ...now.view, note: { tone: 'fault', text: t('state.refused'), at: cardOfPair(now.view, about) } } }));
              return;
            }
            /* Any other refusal is the platform's word about this write and not about the row: the draft
               stays, so the value a user typed is still there to be fixed — and the word stands in the card
               that draws the pair the press was about, or in the section's strip where no card draws it. */
            setState((now) => ({ view: { ...now.view, busy: false, note: { tone: 'fault', text: t('state.refused'), at: cardOfPair(now.view, about) } } }));
            statusDetail(about ?? t('card.limit'), written.reason ?? written.fault);
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
            const held = new Set((now.view.read?.rows ?? []).map(pairOf));
            const lost = carried.filter((pair) => !held.has(pair));
            const at = cardOfPair(now.view, about);
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

    return {
      /** The words, for the check that holds the dictionary against the keys the section asks for. */
      words: EN,
      /** The live fields of the row that stand as one number each, in the order the card shows them. */
      fields: [...SCALARS],
      /** The picture, for the check that reads the two doors apart. */
      readPicture: () => readPicture(),
      /** The settings read, for the check that holds the namespace to the one the picture answered. */
      readSettings: (remote, ns) => readSettings(remote, ns),
      /** The settings write, for the check that a conflict is not read as a write. */
      writeSettings: (remote, settings, ops) => writeSettings(remote, settings, ops),
      /** The section as it draws, for the check that reads its states without a browser. */
      draw,
      /** Register the section into the seat the page declares. */
      apply(pluginCtx) {
        ctx = pluginCtx;
        t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, 'en', EN), `${PACKAGE}: the rate gate dictionary`);
        /* The seat is filled when the picker the rows draw and the page's one door to the console are both in
           hand: both pulls began when this chunk was materialised, and nothing stands in the rail before there
           is a section to draw — nor before a reason that leaves the face has somewhere to go. Each arrival is
           named on its own, because one line for the pair cannot say which chunk is missing. */
        ctx.effect(() => {
          let live = true;
          let armed = null;
          let pickerIn = false;
          let statusIn = false;
          let holdIn = false;
          const seat = () => {
            if (!live || armed !== null || !pickerIn || !statusIn || !holdIn) return;
            armed = ctx.slots.inject(SEAT, () => ctx.slots.register({
              name: SEAT,
              id: ID,
              order: 30,
              label: () => t('section'),
              locale: NS,
            }, GateSection));
          };
          picker.then(
            (module) => {
              pickerIn = true;
              IdPicker = module.IdPicker;
              seat();
            },
            (error) => {
              console.error(`${PACKAGE}: the picker chunk did not arrive: ${error?.message ?? error}`);
            },
          );
          status.then(
            (module) => {
              statusIn = true;
              statusDetail = module.statusDetail;
              seat();
            },
            (error) => {
              console.error(`${PACKAGE}: the status chunk did not arrive: ${error?.message ?? error}`);
            },
          );
          /* The hold, the same way: the section is seated only with the number in hand, so no strip can be
             drawn by a section that would have to guess how long its word stands. */
          hold.then(
            (module) => {
              holdIn = true;
              holdOf = module.holdOf;
              seat();
            },
            (error) => {
              console.error(`${PACKAGE}: the hold chunk did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof armed === 'function') armed();
          };
        }, `${PACKAGE}: the picker, the status, the hold and the rate gate section`);
      },
    };
  },
});
