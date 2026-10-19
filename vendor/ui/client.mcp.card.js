/**
 * The MCP section's card: one row of the roster, its head, its body, and the menu of its own acts.
 *
 * A package-local part of `client.mcp.js`, pulled by it with `require.async` and created before the
 * section is seated. The menu stands here because the card is the only thing that draws it; the row it
 * opens is the card's own, and the section keeps which one is open.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.mcp.card.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The card's own functions, made once over the section's words and the parts beside them. */
    /** How much of a target the roster line shows: enough for a host and a path, not for a query. */
    const TARGET_CHARS = 68;

    function create({ t, kit, picker, hold, ctx, shared }) {
      /**
       * A row's actions in a menu, the donor's own place for them.
       *
       * The donor's control is a portal into `document.body`,
       * and a page here writes inside its own component and appends nothing to the document
       * — so the list stands beside its trigger, under the row's own root. Which menu
       * is open is the section's own state, and so is which row is open, because this half draws its rows
       * with one set of hooks: a row is a function here, not a component. The behaviour is the picker's:
       * a press outside closes the list, Escape closes it and puts the focus back on the trigger, and the
       * arrows walk the items by moving the focus itself.
       */
      function rowMenu(items, open, act, entryId) {
        const walk = (event, step) => {
          const list = [...(event.currentTarget.parentElement?.querySelectorAll('[role="menuitem"]') ?? [])];
          if (list.length === 0) return;
          list[(step + list.length) % list.length].focus();
        };
        const back = (event) => event.currentTarget.closest(shared.MENU)?.querySelector('.coreness-mcp-menuTrigger')?.focus();

        return h('span', { key: 'menu', className: 'coreness-mcp-menu' }, [
          h('button', {
            key: 'trigger',
            type: 'button',
            className: 'coreness-mcp-button coreness-mcp-menuTrigger coreness-button',
            'aria-haspopup': 'menu',
            'aria-expanded': open,
            'aria-label': t('actions'),
            onClick: () => act.menu(open ? null : entryId),
            onKeyDown: (event) => {
              if (event.key === 'Escape') {
                act.menu(null);
                back(event);
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                act.menu(entryId);
              }
            },
          }, '…'),
          open ? h('div', { key: 'list', className: 'coreness-mcp-menuList', role: 'menu' },
            items.map((item) => h('button', {
              key: item.key,
              type: 'button',
              role: 'menuitem',
            className: 'coreness-mcp-menuItem coreness-button' + (shared.TONE_CLASS[item.tone] ?? ''),
              'data-tone': item.tone,
              disabled: item.disabled,
              onClick: () => {
                act.menu(null);
                item.onSelect();
              },
              onKeyDown: (event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  walk(event, 1);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  walk(event, -1);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  act.menu(null);
                  back(event);
                }
              },
            }, item.label))) : null,
        ]);
      }

      /**
       * One card of the roster: the donor's own card.
       *
       * Its head is the disclosure — the name and a subtitle in a button, the actions and the toggle
       * beside it, the marker at the side — and the body stands only while it is open, so a server with
       * twenty-three tools costs one line until the user asks for them. The subtitle carries the row's
       * target and its state, which is the room the header reserves; everything else waits in the body,
       * including the reasons that used to live in a `title=` nobody could see without hovering.
       */
      function cardOf({ row, view, act, open, menu }) {
        const busy = view.busy === row.entryId;
        /* The row's sign-in as the page's own door answered it, or nothing where the door was not asked or
           answered that no flow can run here. Nothing of the control is drawn from a guess, and where it stands
           is one judgement (`signinPlace`). */
        const signin = (view.signins ?? {})[row.entryId] ?? null;
        const signable = shared.signinPlace(row, signin) === 'strip';

        /* The subtitle is the row's target and its state in one line — the room the head reserves. It stands as
           parts and not as a joined string: `targetOf` answers a node (a command in its own `code`), and a join
           would draw `[object Object]` where the address belongs.

           The state is said here and nowhere else: it used to stand a second time as a chip beside the protocol,
           and a chip that comes and goes takes the protocol with it when a row is switched. The authorization is
           **not** a word here any more: the header stands in the card's own list with its name and its value, and
           a word in this line said the same thing twice. The platform's fiber phase is not drawn: `active` was
           withdrawn as a word the reader cannot act on, and `unloading` is withdrawn for the same reason — the row
           itself shows what it is doing, and a phase that flickers in a line of text is noise, not news. */
        /* The protocol first: it is the one stable part of the line — a fixed word where the address and the
           command change with every row — so a reader learns what a row is before the parameters it is opened
           with. The target follows, cut at a limit: a roster line is not the place for a URL with a query of
           twelve parameters, nor for a command whose arguments run for a screen. */
        const protocol = row.transport === null || row.transport === undefined
          ? '—'
          : (shared.KIND_LABELS[row.transport] === undefined ? row.transport : t(shared.KIND_LABELS[row.transport]));
        const subtitle = [protocol, ' · ', shared.targetOf(row, TARGET_CHARS)];

        const items = row.shape
          ? [
            { key: 'edit', label: t('edit'), disabled: busy || row.refs.length > 0, onSelect: () => act.open(shared.draftOf(row)) },
            { key: 'remove', label: t('remove'), tone: 'danger', disabled: busy, onSelect: () => act.ask(row) },
          ]
          : [];

        const body = [
          /* The reason the row did not start stands first: it is the answer to the question the card is opened
             with, and the tools line under it reads as its consequence. */
          shared.reasonLine(row),
          row.disabledRef === true ? h('p', { key: 'disabledRef', className: 'coreness-mcp-warn' }, t('fault.disabled-ref')) : null,
          shared.signinBlock(row, signin, view, act),
          h('p', { key: 'tools', className: 'coreness-mcp-dim coreness-dim' }, row.tools.length === 0
            ? t('tools.none')
            : [
              /* The label is bold and the names beside it keep the plain weight, so the eye separates what the list is
                 from the list itself: the user's own ask ("Тулс давай хотя бы жирным выделим… чтобы отделяло хотя бы от
                 перечисленных тулов"). */
              h('span', { key: 'label', className: 'coreness-mcp-toolsLabel' }, t('row.tools', { count: String(row.tools.length) })),
              ' ',
              row.tools.map((tool) => tool.label).join(', '),
            ]),
          /* The fields the host's own reader keeps as they stand used to be listed
             here by their identifiers — `kept as it stands: failOnStartupError` — and the reader could do
             nothing with the name: the field lives in his own servers file, this form does not write it, and
             its meaning is the host's. The fact is worth one sentence where the reader is looking at the row's
             fields, which is the editor; the roster line is gone. */
          row.refs.length > 0 ? h('p', { key: 'refs', className: 'coreness-mcp-warn' }, t('refs', { names: row.refs.join(', ') })) : null,
        ].filter((node) => node !== null);

        /* The head carries two different things and says which is which by where it stands: the row's own state
           — its target, `enabled`, its authorization — in the room under the name, where it always stood, and
           the answer to a press in the strip on the right, which is the free place there. They used to share
           one room: the answer took the state's place, so a reader who had just pressed something could no
           longer see what the row was. The strip is reserved (`.coreness-answer`,
           `flex:0 0 var(--coreness-news-strip)`, drawn empty when there is no answer) so a word that comes and
           goes moves nothing: the title, the tags, the actions and the marker keep their places, and the answer is
           cut with an ellipsis rather than pushing them. The reservation has to stand in the markup as well as in
           the rule: while the span existed only with a word in it, the width the head gave away changed with the
           answer, and a long word took a line of its own — the head 60 px → 98 px, the room 404 px → 437 px. */
        const editing = view.editor !== null && view.editor.draft.entryId === row.entryId;
        /* The answer of a press made in this row's editor belongs to this row's head too: the editor stands
           inside the card, and the reader's eye is on the card he pressed in. */
        const editorNote = editing && shared.noteNames(view.note ?? null, shared.draftRow(view.editor.draft)) ? view.note : null;
        const mine = shared.noteOf(row, view) ?? editorNote;
        /* What stands in the answer strip when no press has just answered: the row's own condition in one word,
           and nothing else. **The flow's own state never stands here**: this room is the row's, the sign-in is
           the flow's, and a wait said in both places said the same thing twice while taking the row's own
           condition off the face for as long as it lasted. What the flow is doing is said in the card's body,
           in the sentence the person reads. */
        const state = mine === null ? shared.rowState(row) : null;
        const answerText = mine !== null ? shared.noteTextOf(mine) : (state === null ? '' : t(state.word));
        const answerTone = mine !== null ? shared.noteToneOf(mine) : (state === null ? undefined : state.tone);
        const subtitleNode = h('span', { key: 'subtitle', className: 'coreness-mcp-subtitle' }, subtitle);
        /* The strip is drawn **always**, empty when there is no answer: the reservation the rule makes
           (`flex:0 0 160px`) is a promise about the layout, and a span that appears and disappears keeps that
           promise only while its box does not depend on its words. It used to be drawn only with a word in it,
           and the head wraps (`flex-wrap:wrap`), so a word wider than the free place took a line of its own: the
           head went 60 px → 98 px and the room under the name went 404 px → 437 px — the answer moved the card it
           stands in. The reserved width is measured, not chosen: the answer itself read 108 px wide and the free
           place was 167 px, so 160 reserves more than the word needed and less than the place it stood in. An
           empty live region is also what a live region should be — it stands before the word arrives, not
           after it. */
        const answerNode = h('span', {
          key: 'answer',
          className: 'coreness-answer',
          /* The tone, in the attribute the instruments read: the colour was painted by a class and no reading
             ever saw it, so the word could stand with a tone nothing could name. An empty room carries none —
             it stands before its word arrives, and a room with nothing in it states nothing. */
          'data-tone': answerTone,
          'data-note': 'head',
          /* The row's own condition, named as the reading that chose it: the words on the face are the
             section's dictionary's, and this attribute is what tells them apart for anyone reading the tree. */
          'data-state': state === null ? undefined : state.state,
          role: 'status',
          'aria-live': 'polite',
        }, answerText);

        return h('li', { key: row.entryId, className: 'coreness-mcp-row coreness-card-box' }, [
          h('div', { key: 'card', className: 'coreness-mcp-card', 'data-open': String(open) }, [
            h('div', { key: 'head', className: 'coreness-mcp-head coreness-card-head' }, [
              h('button', {
                key: 'title',
                type: 'button',
                className: 'coreness-mcp-headButton',
                'aria-expanded': open,
                onClick: () => act.row(row.entryId, !open),
              }, [
                h('span', { key: 'name', className: 'coreness-mcp-name' }, row.server ?? row.id),
                subtitleNode,
              ]),
              /* The answer stands on the name's own line, in the middle of the row, where the protocol chip
                 stood before it: the head is a row again (not a column on the right), so a word that comes
                 and goes changes no box. The strip is still a reserved 160 px and still drawn always, which
                 is what keeps the row's height and the controls' places independent of the answer. The
                 controls keep the card's right edge by the same rule as every other row of this page. */
              answerNode,
              h('span', { key: 'actions', className: 'coreness-mcp-actions' }, [
                /* The sign-in stands first in the strip: the row's own act, before the menu of edits and the
                   switch. It stands only where the flow can run — the door settles that at the row's address
                   before this line is ever reached — and it is withdrawn while an attempt waits, because a
                   second press of one key is refused by the platform's own registry. */
                signable
                  ? h('button', {
                    key: 'signin',
                    type: 'button',
                    className: 'coreness-mcp-button coreness-button',
                    disabled: busy,
                    onClick: () => act.signin(row),
                  }, t('signin'))
                  : null,
                items.length === 0 ? null : shared.rowMenu(items, menu === row.entryId, act, row.entryId),
                /* The state is the switch's own: aria-checked carries it, the label names the row it belongs to,
                   and the word a press would do stands in the title rather than in the row's line, so nothing in the
                   cluster changes width when the state flips. */
                h('button', {
                  key: 'toggle',
                  type: 'button',
                  className: 'coreness-mcp-switch',
                  role: 'switch',
                  'aria-checked': row.enabled === true,
                  'aria-label': `${shared.targetWords(row)} — ${row.enabled ? t('toggle.off') : t('toggle.on')}`,
                  title: row.enabled ? t('toggle.off') : t('toggle.on'),
                  disabled: busy || row.disabledRef,
                  onClick: () => act.toggle(row, row.enabled !== true),
                }, h('span', { key: 'thumb', className: 'coreness-mcp-switchThumb' })),
              ]),
              h('button', {
                key: 'marker',
                type: 'button',
                className: 'coreness-mcp-marker',
                'aria-expanded': open,
                'aria-label': open ? t('close') : t('open'),
                'data-open': String(open),
                onClick: () => act.row(row.entryId, !open),
              }, picker.chevronMark()),
            ]),
            open ? h('div', { key: 'body', className: 'coreness-mcp-body coreness-card-body' }, body) : null,
          ]),
          editing ? shared.editorOf(view.editor.draft, view, act) : null,
        ]);
      }

      /** One row of a pair editor: the name, the value, and what happens to each. There is no secret logic here, by
          the user's own word — "Пускай будут видны" — the value is the text from the file, written as it is written,
          and the page invents none: a pair the file leaves empty is drawn empty. */
      function pairRow(kind, pair, index, view, act) {
        const busy = view.busy !== null;
        const name = h('input', {
          key: 'name',
          className: 'coreness-mcp-input coreness-field coreness-field-box',
          value: pair.name,
          disabled: busy,
          'aria-label': t('field.name'),
          placeholder: t('field.name'),
          onChange: (event) => act.patchPair(kind, index, { name: event.target.value }),
        });
        const value = h('input', {
          key: 'value',
          className: 'coreness-mcp-input coreness-field coreness-field-box',
          value: pair.value,
          disabled: busy,
          'aria-label': t('field.value'),
          placeholder: t('field.value'),
          onChange: (event) => act.patchPair(kind, index, { value: event.target.value }),
        });
        const remove = h('button', {
          key: 'remove',
          type: 'button',
          className: 'coreness-mcp-button coreness-button',
          disabled: busy,
          onClick: () => act.dropPair(kind, index),
        }, t('pair.remove'));
        return h('li', { key: pair.key, className: 'coreness-mcp-pairRow' },
          h('div', { className: 'coreness-mcp-grid' }, [name, value, remove]));
      }

      return { cardOf, pairRow, rowMenu };
    }

    return { create };
  },
});
