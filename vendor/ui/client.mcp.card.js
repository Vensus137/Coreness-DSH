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
       * A row's actions in a menu.
       *
       * A page writes inside its own component and appends nothing to the document, so the list stands beside
       * its trigger, under the row's own root. Which menu is open is the section's own state, and so is which row
       * is open, because this half draws its rows with one set of hooks: a row is a function here, not a component.
       * The behaviour is the picker's: a press outside closes the list, Escape closes it and puts the focus back on
       * the trigger, and the arrows walk the items by moving the focus itself.
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
            'data-entry': entryId,
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
                /* The list is drawn after this press: the first item takes the focus once it stands, so the
                   key the trigger advertises enters the list instead of opening it only. */
                event.preventDefault();
                const menu = event.currentTarget.closest(shared.MENU);
                act.menu(entryId);
                setTimeout(() => {
                  menu?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
                }, 0);
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
       * One card of the roster.
       *
       * Its head is the disclosure — the name and a subtitle in a button, the actions and the toggle beside it,
       * the marker at the side — and the body stands only while it is open, so a server with many tools
       * costs one line until the user asks for them. The subtitle carries the row's target and its state, which is
       * the room the header reserves; everything else waits in the body, reasons included rather than behind a
       * `title=` nobody can see without hovering.
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

           The state is said here and nowhere else: a chip beside the protocol would come and go with it when a row
           is switched. The authorization is **not** a word here: the header stands in the card's own list with its
           name and its value, and a word in this line would say the same thing twice. The platform's fiber phase is
           not drawn: `active` and `unloading` are words the reader cannot act on, and the row itself shows what it
           is doing — a phase that flickers in a line of text is noise, not news. */
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
          row.disabledRef === true ? h('p', { key: 'disabledRef', className: 'coreness-dim coreness-tone-fault', 'data-tone': 'fault' }, t('fault.disabled-ref')) : null,
          shared.signinBlock(row, signin, view, act),
          h('p', { key: 'tools', className: 'coreness-dim' }, row.tools.length === 0
            ? t('tools.none')
            : [
              /* The label is bold and the names beside it keep the plain weight, so the eye separates what the list is
                 from the list itself. */
              h('span', { key: 'label', className: 'coreness-mcp-toolsLabel' }, t('row.tools', { count: String(row.tools.length) })),
              ' ',
              row.tools.map((tool) => tool.label).join(', '),
            ]),
          /* The fields the host's own reader keeps as they stand are named in the editor, not here: the field lives
             in the reader's own servers file, this form does not write it, and its meaning is the host's — an
             identifier on the roster line says nothing a reader can act on. */
          row.refs.length > 0 ? h('p', { key: 'refs', className: 'coreness-dim coreness-tone-fault', 'data-tone': 'fault' }, t('refs', { names: row.refs.join(', ') })) : null,
        ].filter((node) => node !== null);

        /* The head carries two different things and says which is which by where it stands: the row's own state
           — its target, `enabled`, its authorization — in the room under the name, and the answer to a press in the
           strip on the right, which is the free place there. They must not share one room: an answer that took the
           state's place would leave a reader who had just pressed something unable to see what the row was. The
           strip is reserved (`.coreness-answer`, `flex:0 0 var(--coreness-news-strip)`, drawn empty when there is
           no answer) so a word that comes and goes moves nothing: the title, the tags, the actions and the marker keep
           their places, and the answer is cut with an ellipsis rather than pushing them. The reservation stands in
           the markup as well as in the rule: a span that exists only with a word in it gives back the width with the
           word, and a long word takes a line of its own. */
        const editing = view.editor !== null && view.editor.draft.entryId === row.entryId;
        /* The strip carries the answer to a press made in this row's editor as it carries any other: the card's
           strip is the page's one answer room, and the editor draws no note of its own. */
        const mine = shared.noteOf(row, view);
        /* What stands in the answer strip when no press has just answered: the row's own condition in one word,
           and nothing else. **The flow's own state never stands here**: this room is the row's, the sign-in is
           the flow's, and a wait said in both places said the same thing twice while taking the row's own
           condition off the face for as long as it lasted. What the flow is doing is said in the card's body,
           in the sentence the person reads. */
        const state = mine === null ? shared.rowState(row) : null;
        const answerText = mine !== null ? shared.noteTextOf(mine) : (state === null ? '' : t(state.word));
        const answerTone = mine !== null ? shared.noteToneOf(mine) : (state === null ? undefined : state.tone);
        const subtitleNode = h('span', { key: 'subtitle', className: 'coreness-mcp-subtitle coreness-cutLine' }, subtitle);
        /* The strip is drawn **always**, empty when there is no answer: the reservation the rule makes
           (`flex:0 0 160px`) is a promise about the layout, and a span that appears and disappears keeps that promise
           only while its box does not depend on its words. Drawn only with a word in it, in a head that wraps
           (`flex-wrap:wrap`), a word wider than the free place takes a line of its own and moves the card it stands
           in; 160 reserves more than the longest word needs and less than the place the strip stands in. An empty
           live region is also what a live region should be — it stands before the word arrives, not after it. */
        const answerNode = h('span', {
          key: 'answer',
          className: 'coreness-answer',
          /* The tone, in the attribute the instruments read: the colour was painted by a class and no reading
             ever saw it, so the word could stand with a tone nothing could name. An empty room carries none —
             it stands before its word arrives, and a room with nothing in it states nothing. */
          'data-tone': answerTone,
          /* The row's own condition, named as the reading that chose it: the words on the face are the
             section's dictionary's, and this attribute is what tells them apart for anyone reading the tree. */
          'data-state': state === null ? undefined : state.state,
          role: 'status',
          'aria-live': 'polite',
        }, answerText);

        return h('li', { key: row.entryId, className: 'coreness-card-box' }, [
          h('div', { key: 'head', className: 'coreness-card-head' }, [
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
              /* The switch is the set's control, worn untouched: its state is its own (aria-checked), the label
                 names the row it belongs to, and the word a press would do stands in the title rather than in
                 the row's line, so nothing in the cluster changes width when the state flips. */
              h('button', {
                key: 'toggle',
                type: 'button',
                className: 'coreness-switch',
                role: 'switch',
                'aria-checked': row.enabled === true,
                'aria-label': `${shared.targetWords(row)} — ${row.enabled ? t('toggle.off') : t('toggle.on')}`,
                title: row.enabled ? t('toggle.off') : t('toggle.on'),
                disabled: busy || row.disabledRef,
                onClick: () => act.toggle(row, row.enabled !== true),
              }, h('span', { key: 'thumb', className: 'coreness-switchThumb' })),
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
          open ? h('div', { key: 'body', className: 'coreness-card-body' }, body) : null,
          editing ? shared.editorOf(view.editor.draft, view, act) : null,
        ]);
      }

      /** One row of a pair editor: the name, the value, and what happens to each. There is no secret logic here: the
          value is the text from the file, written as it is written, and the page invents none — a pair the file leaves
          empty is drawn empty. */
      function pairRow(kind, pair, index, view, act) {
        const busy = view.busy !== null;
        const name = h('input', {
          key: 'name',
          className: 'coreness-field coreness-field-box',
          value: pair.name,
          disabled: busy,
          'aria-label': t('field.name'),
          placeholder: t('field.name'),
          onChange: (event) => act.patchPair(kind, index, { name: event.target.value }),
        });
        const value = h('input', {
          key: 'value',
          className: 'coreness-field coreness-field-box',
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
        return h('li', { key: pair.key },
          h('div', { className: 'coreness-mcp-grid' }, [name, value, remove]));
      }

      return { cardOf, pairRow, rowMenu };
    }

    return { create };
  },
});
