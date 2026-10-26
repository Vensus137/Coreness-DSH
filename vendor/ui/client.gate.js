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
 * What the section draws follows the sections beside it: the page's own card, head, body, list, field and
 * answer classes, carried by `--dsw-alias-*` tokens alone, and the section's own sentence in a room drawn in
 * every state — a room that reserves no height, so a sentence takes the lines it says and the cards under it
 * keep the list's own line of air. What is reserved on this page is the width of an answer strip, never its height.
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
    const SCALARS = ['windowMs', 'maxWaitMs', 'thresholdRatio'];

    /* The section's own words. One namespace, one dictionary: the rail row's label is a thunk so it
       follows the language without a re-registration, and every failure the two doors can answer with
       has words here rather than a bare code. */
    const EN = {
      /* One word for the rail's row and for the page's heading: the label and the heading are one key, because a
         word drawn from two places drifts and no check reads the picture. */
      section: 'Rate limiter',
      caption: 'A ceiling in tokens per minute, attached to a model: the gate holds a request the window cannot take and lets it go marked forced when the wait bound is spent.',
      /* The whole sentence: the two facts that cost money and the one that saves a surprise, and no mechanics.
         "Of this run alone" says whose count it is without the word "process"; the window's being per provider and
         model, and its living in memory, are mechanics and stand outside this room. */
      'state.standing': 'Of this run alone: a reload keeps it, a restart wipes it, spend elsewhere is not counted.',
      'state.reading': 'Reading the gate…',
      'state.error': 'The gate could not be read',
      'state.unwritable': 'The row is not configurable from here: {fault}',
      /* The answer to a press is one of three words, the same on every page of this product: `Saved` for a change
         that landed, `Nothing changed` for a press that changed nothing, and the refusal in the fault tone. What a
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

    /* The section's own rules, and only what no other page draws: the head's shrinking floor, the row card's
       line, the equal share of its fields, the boxed unit of the number field and the two feet. The card, the
       head, the body, the list, the field, the label, the hint, the answer strip, the failure block and the
       buttons are the page's own classes, worn beside these. Nothing in this room reserves a height: a line
       here takes the height of what it says, and a reservation would move the cards under it. */
    const CSS = `
/* The head may shrink below its words, so the title wraps before the reserved strip is pushed out of the card. */
.coreness-gate-head{min-width:0}
/* The section's state sentence: the page's small role stands in coreness-dim, worn beside this class; this rule
   keeps only the wrap a fault's reason may need, which can be a word longer than the room. */
.coreness-gate-state{overflow-wrap:anywhere}
/* The card's name takes the growing room, so the answer strip stands at the head's right edge. */
.coreness-gate-headButton{flex-direction:column;min-width:0;flex:1 1 auto;display:flex}
/* The **row cards** — and only they — stand their three fields on one line, so these rules are scoped to the row
   card's own class; the limit card keeps its fields one to a line. The line takes the card's whole inner width
   and the fields share it equally, so there is no empty space at either edge. The pairs dissolve with
   display:contents and their fields become the line's own items; the equal share is written as flex:1 1 0 on the
   field itself, which is what makes the three of them equal rather than sized by their content. A backtick must
   not stand in these comments: this stylesheet is a template literal and one closes it. */
.coreness-gate-rowCard .coreness-gate-body{flex-direction:row;flex-wrap:wrap;align-items:flex-start}
.coreness-gate-rowCard .coreness-gate-body>.coreness-gate-pair{display:contents}
/* The row card's fields: the three share its line equally and never shrink past the width a picker can still
   be read in. */
.coreness-gate-rowCard .coreness-gate-field{min-width:180px;flex:1 1 0}
/* The number field's box: the page's own field box, with the unit standing inside it. The box is the shared
   class; these rules carry only what the shared class cannot — the row inside the box, the input stripped of
   the border and padding the box now carries, the focus ring on the box whose focusable child is the input,
   the dim a disabled field takes (the page's own rule is written for a control, and the box is a wrapper),
   and the suffix's own ink. No rule of the shared box is repeated here. */
.coreness-gate-unitBox{display:flex;align-items:center}
.coreness-gate-unitBox:focus-within{border-color:var(--dsw-alias-state-business-primary)}
.coreness-gate-unitBox:has(> input:disabled){opacity:.6}
.coreness-gate-input{border:none;background:0 0;color:inherit;font:inherit;flex:1 1 auto;min-width:0;padding:0}
.coreness-gate-input:focus{outline:none}
.coreness-gate-unit{flex:none;color:var(--dsw-alias-label-tertiary)}
/* The row's actions: a line of their own under the three fields, hard against the right edge. flex-basis:100%
   is what makes the line its own: the body is a wrapping row of fields, and this child asks for the whole width
   and wraps onto the next line. */
.coreness-gate-rowFoot{flex-basis:100%;justify-content:flex-end;gap:8px;display:flex}
/* The limit card's foot: its one press hard against the right edge. */
.coreness-gate-foot{justify-content:flex-end;align-items:center;flex-wrap:wrap;display:flex}
/* The rows the host refused, under the list: the page's failure block, placed with the section's own air and
   roomed for a reason longer than its line. */
.coreness-gate-refused{margin:8px 0 0;overflow-wrap:anywhere}
.coreness-gate-refusedTitle{margin:0}
.coreness-gate-refusedList{margin:2px 0 0;padding:0 0 0 18px}
.coreness-gate-refusedRow{margin:0}
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
