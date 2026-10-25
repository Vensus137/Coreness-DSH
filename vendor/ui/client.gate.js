/**
 * The rate gate's section of the product's page: the limit as it stands, the models it is attached to, and
 * the window the gate is counting right now — read from the plugin's own route, written through the
 * platform's settings service.
 *
 * A package-local chunk beside the page's entry, pulled with the entry's `require.async`, registering into
 * the seat the page declares under an id and a locale namespace of its own. This file carries the section's
 * constants, its words and its sheet, the platform's read and its write, and its seat; the drawing and the
 * section's own lifetime are the three parts beside it (`client.gate.section.js`, `.limits.js`, `.windows.js`),
 * all created over one `shared` and seated only once the kit, the picker, the hold and the three parts are in
 * hand.
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
 * `--dsw-alias-*` tokens alone, and the section's own sentence in a room drawn in every state — a room that
 * reserves no height, so a sentence takes the lines it says and the cards under it keep the list's own line of
 * air. What is reserved on this page is the width of an answer strip, never its height.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.gate.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The plugin's own door: the picture, on a GET, and nothing else. */
    const LEDGER_ROUTE = '/api/coreness.rateGate';
    /** The seat the page declares for the sections of the plugins that come later. */
    const SEAT = 'coreness.section';
    /** The rail row's own id inside that seat. */
    const ID = 'gate';
    /** The locale namespace of the section's words. */
    const NS = 'coreness.gate';
    const STYLE_ID = 'coreness-ui-gate-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/ui/client.gate.js';
    const PACKAGE = '@coreness/ui';

    /** The live fields of the row that stand as one number each, in the order the card shows them. */
    const SCALARS = ['windowMs', 'maxWaitMs', 'thresholdRatio', 'dryRun'];

    /* The section's own words. One namespace, one dictionary: the rail row's label is a thunk so it
       follows the language without a re-registration, and every failure the two doors can answer with
       has words here rather than a bare code. */
    const EN = {
      /* One word for the rail's row and for the page's heading: the label and the heading are one key, because a
         word drawn from two places drifts and no check reads the picture. */
      section: 'Rate limiter',
      title: 'Rate limiter',
      caption: 'A ceiling in tokens per minute, attached to a model: the gate holds a request the window cannot take and lets it go marked forced when the wait bound is spent.',
      /* The whole sentence: the two facts that cost money and the one that saves a surprise, and no mechanics.
         "Of this run alone" says whose count it is without the word "process"; the window's being per provider and
         model, and its living in memory, are mechanics and stand outside this room. */
      'state.standing': 'Of this run alone: a reload keeps it, a restart wipes it, spend elsewhere is not counted.',
      'state.error': 'The gate could not be read',
      'state.unwritable': 'The row is not configurable from here: {fault}',
      /* The answer to a press is one of three words, the same on every page of this product: `Saved` for a change
         that landed, `Nothing changed` for a press that changed nothing, and the refusal in the error tone. What a
         longer sentence would carry stands in the console (the `statusDetail` door), never as a second sentence on
         the face. */
      'state.written': 'Saved',
      'state.refused': 'Not saved',
      'state.nothing': 'Nothing changed',
      'refused.title': 'Refused by the host — these rows are not applied:',
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
      'add.unread': 'Catalogue not read',
      'catalog.failed': 'The model catalogue could not be read',
      'add.none': 'This profile’s catalogue carries no model to name.',
    };

    /* The host's own sheets, copied rule for rule and renamed, carried by its tokens alone: the settings
       card, its head, the tag, the field and its input, the buttons and the foot are the host's own rules,
       and the sections beside this one draw them the same way.
       Nothing in this room reserves a height: a line here takes the height of what it says, and a reservation
       would move the cards under it. */
    const CSS = `
/* The set's head, and the section's own room under it; the head's flex direction is irrelevant with one child
   and stays for the live walk's marker. */
.coreness-gate-head{gap:6px;min-width:0}
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
.coreness-gate-refused{margin:8px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-warn-label);overflow-wrap:anywhere}
.coreness-gate-refusedTitle{margin:0}
.coreness-gate-refusedList{margin:2px 0 0;padding:0 0 0 18px}
.coreness-gate-refusedRow{margin:0}
.coreness-gate-fields{flex-direction:column;gap:8px;display:flex}
.coreness-gate-pair{flex-direction:column;gap:6px;display:flex}
/* The **row cards** — and only they — stand their three fields on one line; the section's own card (The limit) keeps
   its fields one to a line and is untouched. Both kinds carry coreness-gate-row, so the row cards carry a second class
   of their own and this rule names that one: a selector on the shared class alone would reach the section's card and
   narrow its fields.
   The line takes the card's whole inner width and the fields share it equally, so there is no empty space at either edge.
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
/* A hint line: the host's own rule for one is label-tertiary at 12px/18px, as its advanced hint rule and the
   plugin manager's guides are. This one carried --dsw-alias-label-dimmed, the host's own *placeholder* token and no
   hint's colour, so it read dimmer than the same kind of line in the sections beside it. */
.coreness-gate-hint{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
/* The row's actions: a line of their own under the four fields, hard against the right edge. flex-basis:100% is what
   makes the line its own: the body is a wrapping row of fields, and this child asks for the whole width and wraps onto
   the next line. */
.coreness-gate-rowFoot{flex-basis:100%;justify-content:flex-end;gap:8px;display:flex}
/* The three buttons of a row stand as tall as the boxes a value is typed into (a field's box is 32), where a button
   of this page is otherwise 36. Scoped to the row's own line so nothing else on the page moves with it; the
   platform's own button is 36 and is not touched. */
.coreness-gate-foot{justify-content:flex-end;align-items:center;flex-wrap:wrap;display:flex}
/* The rate limiter's own tone, and the one button rule this sheet keeps: the base, the hover, the two primary
   rules, the disabled look and the ring stand once in the page's own sheet, in the shared
   button class every button here wears beside this one. */
`;

    /**
     * The parts beside this entry, pulled at materialisation and in hand before the section is seated: the
     * page's kit, picker and hold, and the section's three parts — the limits editor, the live rows and the
     * section itself. A pull that failed is named on the console and seats nothing.
     */
    const KIT = require.async('./client.kit.js');
    const PICKER = require.async('./client.picker.js');
    const HOLD = require.async('./client.hold.js');
    const LIMITS = require.async('./client.gate.limits.js');
    const WINDOWS = require.async('./client.gate.windows.js');
    const SECTION = require.async('./client.gate.section.js');

    /** Filled in `apply`: the text of the section's namespace. */
    let t;

    /**
     * The section's sheet, held for as long as the section stands: put in here, put back if it is taken.
     *
     * The platform replaces a plugin in place over the module table it already holds — `import` answers from
     * the module cache, so a factory does not run twice — and
     * it takes the package's own style tags away in the same act (`removeOwnedStyles`). The one thing
     * it re-runs is the mount, which covers a section that is left and entered again; it does not cover a
     * component that stays mounted while the tags go, so the frame's rules can vanish while the markup stays
     * drawn. The head is watched while this component stands.
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
      const answer = await fetch(LEDGER_ROUTE, { method: 'GET' });
      if (!answer.ok) throw new Error(`${LEDGER_ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${LEDGER_ROUTE} refused the read`);
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

    /** The one object the parts reach this half through; the entry fills it before any part is made. */
    const shared = {
      SEAT, ID, NS, LEDGER_ROUTE, SCALARS,
      useStyles, readPicture, readSettings, writeSettings,
    };

    return {
      /** Register the section into the seat the page declares. */
      apply(pluginCtx) {
        t = pluginCtx.locale.bind(NS);
        pluginCtx.effect(() => pluginCtx.locale.register(NS, 'en', EN), `${PACKAGE}: the rate gate dictionary`);
        /* The seat is filled when the kit's status door, the picker the rows draw, the page's own lifetime of
           an answer and the three parts are all in hand: every pull began when this chunk was materialised,
           and nothing stands in the rail before there is a section to draw — nor before a reason that leaves
           the face has somewhere to go. A pull that failed is named on the console and seats nothing. */
        pluginCtx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([KIT, PICKER, HOLD, LIMITS, WINDOWS, SECTION]).then(
            ([kitModule, pickerModule, holdModule, limitsModule, windowsModule, sectionModule]) => {
              if (!live) return;
              /* The page has one beat, in the hold: the picture is read again on it while the section stands. */
              shared.BEAT_MS = holdModule.BEAT_MS;
              const parts = { t, kit: kitModule, picker: pickerModule, hold: holdModule, ctx: pluginCtx, shared };
              Object.assign(shared, limitsModule.create(parts));
              Object.assign(shared, windowsModule.create(parts));
              Object.assign(shared, sectionModule.create(parts));
              armed = pluginCtx.slots.inject(SEAT, () => pluginCtx.slots.register({
                name: SEAT,
                id: ID,
                order: 30,
                label: () => t('section'),
                locale: NS,
              }, shared.GateSection));
            },
            (error) => {
              console.error(`${PACKAGE}: a chunk of the rate gate section did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof armed === 'function') armed();
          };
        }, `${PACKAGE}: the kit, the picker, the hold and the rate gate section`);
      },
    };
  },
});
