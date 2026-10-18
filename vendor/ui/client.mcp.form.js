/**
 * The MCP section's form: the editor of a row, the pair fields it holds, the fields a branch change
 * drops, the confirmation of a removal, and the draft the form hands the route.
 *
 * A package-local part of `client.mcp.js`, pulled by it with `require.async` and created before the
 * section is seated; a form looks up the parts it draws when it draws them.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.mcp.form.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The form's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      function editorOf(draft, view, act) {
        const busy = view.busy !== null;
        const http = draft.transport === 'streamable-http';
        const fields = [
          h('div', { key: 'name', className: 'coreness-field coreness-mcp-field' }, [
            h('label', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, draft.entryId === null ? t('field.name') : t('field.nameFixed')),
            h('input', {
              key: 'input',
              className: 'coreness-mcp-input coreness-field coreness-field-box',
              value: draft.server,
              disabled: busy || draft.entryId !== null,
              'aria-label': t('field.name'),
              placeholder: t('field.name'),
              onChange: (event) => act.patch({ server: event.target.value }),
            }),
          ]),
          h('div', { key: 'transport', className: 'coreness-field coreness-mcp-field' }, [
            h('span', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, t('field.transport')),
            /* The kind is chosen in the page's own control, from the platform's two values: the words are
               the page's (`kind.http` and the like) and the value that travels is the platform's own
               spelling, exactly as the native select this replaced handed it over. */
            h(picker.IdPicker, {
              key: 'picker',
              name: 'mcp-transport',
              value: draft.transport,
              disabled: busy,
              'aria-label': t('field.transport'),
              options: shared.KINDS.map((name) => ({ value: name, words: t(shared.KIND_LABELS[name]) })),
              onChoose: (next) => act.patch({ transport: next }),
            }),
          ]),
          http
            ? h('div', { key: 'url', className: 'coreness-field coreness-mcp-field' }, [
              h('label', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, t('field.url')),
              h('input', {
                key: 'input',
                className: 'coreness-mcp-input coreness-field coreness-field-box',
                value: draft.url,
                disabled: busy,
                'aria-label': t('field.url'),
                placeholder: 'https://',
                onChange: (event) => act.patch({ url: event.target.value }),
              }),
            ])
            : h('div', { key: 'command', className: 'coreness-field coreness-mcp-field' }, [
              h('label', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, t('field.command')),
              h('input', {
                key: 'input',
                className: 'coreness-mcp-input coreness-field coreness-field-box',
                value: draft.command,
                disabled: busy,
                'aria-label': t('field.command'),
                onChange: (event) => act.patch({ command: event.target.value }),
              }),
                h('p', { key: 'help', className: 'coreness-mcp-dim coreness-dim' }, t('help.command')),
            ]),
          http ? null : h('div', { key: 'args', className: 'coreness-field coreness-mcp-field' }, [
            h('label', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, t('field.args')),
            h('textarea', {
              key: 'area',
              className: 'coreness-mcp-input coreness-field coreness-field-box',
              value: draft.args,
              disabled: busy,
              'aria-label': t('field.args'),
              onChange: (event) => act.patch({ args: event.target.value }),
            }),
                h('p', { key: 'help', className: 'coreness-mcp-dim coreness-dim' }, t('help.args')),
          ]),
          h('div', { key: 'timeout', className: 'coreness-field coreness-mcp-field' }, [
            h('label', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, t('field.timeout')),
            h('input', {
              key: 'input',
              className: 'coreness-mcp-input coreness-field coreness-field-box',
              value: draft.timeout,
              disabled: busy,
              inputMode: 'numeric',
              'aria-label': t('field.timeout'),
              placeholder: '60000',
              onChange: (event) => act.patch({ timeout: event.target.value }),
            }),
          ]),
            /* A pair field grows by the rows a person adds to it, so it stands after the fields that are one line
               each, where the growing does not push a one-line field down the form. */
          http ? null : pairsField('env', t('field.env'), draft, view, act),
          /* Both maps a row carries stand in the form: the headers a request goes out with, and the environment a
             child process gets. The headers block was taken off the page on a misreading of the user's word (he
             asked that the **row's meta line** stop printing `authorization`, not that the setting go) and he asked
             for it back: "Их теперь не заполнять, не удалять нельзя… Надо вернуть, как было в настройках в MCP". */
          http ? pairsField('headers', t('field.headers'), draft, view, act) : null,
        ].filter((field) => field !== null);

        /* The form's own pair, in the one order every card of this page keeps and the harness itself keeps: `Cancel`
           on the left, `Apply` on the right. This editor stood the other way round and called the right one `Save`,
           which the user read as two different conventions on one page ("где-то написано save cancel, где-то cancel
           apply"). `Save` is not the form's word here: the press sends the draft, and the **answer** is what says
           `Saved`. The actions that do not send a form keep their own words (`Save token`, `Check token`, `Reset`,
           `Remove`, `Enable`/`Disable`) — renaming them `Apply` would say they submit a draft they do not submit. */
        const actions = [
          h('button', {
            key: 'cancel',
            type: 'button',
            className: 'coreness-mcp-button coreness-button',
            disabled: busy,
            onClick: () => act.close(),
          }, t('cancel')),
          h('button', {
            key: 'apply',
            type: 'button',
            className: 'coreness-mcp-button coreness-button',
            'data-tone': 'primary',
            disabled: busy,
            onClick: () => act.save(draft),
          }, busy ? t('saving') : t('apply')),
        ];

        /* A refusal of a **new** row is said here, in the editor: there is no card yet, so there is no head to
           put it in — the one answer the page cannot place in a card's own strip. Every other answer stands in
           the head of the card the press was made in (`cardOf`), the editor of a row included. The draft is the
           fact that stands when the news goes. */
        const note = draft.entryId === null && shared.noteNames(view.note ?? null, shared.draftRow(draft)) ? view.note : null;
        /* What this save will drop, when the draft leaves the branch: the row as the file holds it, read against
           the branch the draft now carries. The line stands before the press — the loss is named while the reader
           can still change his mind — and nothing is said when the branch stays. */
        const row = (view.picture?.rows ?? []).find((one) => one.entryId === draft.entryId) ?? null;
        const lost = lostFields(row, draft);

        /* The same press as the strip's, where the strip does not carry it: the flow stands to run the attempt at
           this row and the standard's signals announced no door, so the row's own settings are the only way a
           person can ask (requirement 6). A draft that is not saved yet has no row to sign in, and no control is
           drawn for one. */
        const signin = row === null ? null : (view.signins ?? {})[row.entryId] ?? null;
        const signHere = row !== null && shared.signinPlace(row, signin) === 'settings';

        return h('div', { key: 'editor', className: 'coreness-mcp-editor' }, [
          h('div', { key: 'titleRow', className: 'coreness-mcp-editorHead' }, [
            h('span', { key: 'title', className: 'coreness-mcp-editorTitle' },
              draft.entryId === null ? t('add.title') : t('edit.title', { server: draft.server })),
            h('span', { key: 'beside', className: 'coreness-mcp-editorBeside' }, [
              signHere
                ? h('button', {
                  key: 'signin',
                  type: 'button',
                  className: 'coreness-mcp-button coreness-button',
                  disabled: busy,
                  onClick: () => act.signin(row),
                }, t('signin'))
                : null,
              /* The editor is a head of its own, and its answer stands where Qoder's stands: the top right. The
                 row's own head keeps its answer in the middle — two heads, two places, both by the user's word. */
              note === null ? null : h('span', {
                key: 'note',
                className: 'coreness-mcp-editorNote',
                'data-tone': shared.noteToneOf(note),
                'data-note': 'editor',
                role: 'status',
                'aria-live': 'polite',
              }, shared.noteTextOf(note)),
            ].filter((one) => one !== null)),
          ]),
          /* The one sentence about the fields this form does not carry — the host's own kept fields among them
             and every field a newer host may add. It stood in the roster as a list of
             identifiers, where a reader could do nothing with it; here it is said once, in words, beside the
             fields it is about, and it names no identifier of a plugin's business. */
          h('p', { key: 'kept', className: 'coreness-mcp-dim coreness-dim' }, t('editor.kept')),
          lost === null ? null : h('p', {
            key: 'drop',
            className: 'coreness-mcp-warn',
            'data-note': 'drop',
          }, t('editor.drop', {
            kind: shared.KIND_LABELS[row.transport] === undefined ? row.transport : t(shared.KIND_LABELS[row.transport]),
            fields: lost.join(', '),
          })),
          ...fields,
          h('div', { key: 'actions', className: 'coreness-mcp-editorActions' }, actions),
        ]);
      }

      /** The map a transport actually uses: headers for http, the environment for stdio. */
      function pairsField(kind, label, draft, view, act) {
        const pairs = kind === 'headers' ? draft.headers : draft.env;
        const busy = view.busy !== null;
        return h('div', { key: kind, className: 'coreness-field coreness-mcp-field' }, [
          h('label', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, label),
          pairs.length === 0 ? null : h('ul', { key: 'rows', className: 'coreness-list coreness-mcp-pairs' }, pairs.map((pair, index) => shared.pairRow(kind, pair, index, view, act))),
          h('div', { key: 'add', className: 'coreness-mcp-editorActions' }, h('button', {
            key: 'add',
            type: 'button',
            className: 'coreness-mcp-button coreness-button',
            disabled: busy,
            onClick: () => act.addPair(kind),
          }, t('pair.add'))),
        ]);
      }


      /**
       * The fields the file holds on the branch an edit is leaving, in the page's own words.
       *
       * An edit that changes the branch writes the platform's own branch and nothing else, so the fields of the
       * branch being left go with it. They are named before the press — and only the ones the file really holds:
       * a key the file never carried is not a loss, and a key neither branch draws is not dropped at all.
       */
      function lostFields(row, draft) {
        if (row === null || draft.entryId === null) return null;
        if (row.transport === null || row.transport === undefined) return null;
        if (draft.transport === row.transport) return null;
        const full = (value) => value !== null && value !== undefined && value !== '';
        /* The fields of the branch being left that the file holds: the host writes the branch the form sends and
           deletes the other one, so these go with the save. */
        const held = row.transport === 'stdio'
          ? [full(row.command) && 'field.command', (row.args ?? []).length > 0 && 'field.args', full(row.cwd) && 'field.cwd', (row.env ?? []).length > 0 && 'field.env']
          : [full(row.url) && 'field.url', (row.headers ?? []).length > 0 && 'field.headers'];
        /* And the keys of the branch being entered that the file holds: the form sends that branch's boxes, and a
           box the file never filled arrives empty and takes its key off the row. The picture carries them among
           the keys the form does not draw — beside the carried keys, which are written back exactly as the file
           holds them and are therefore named by no line here. */
        const drawn = draft.transport === 'stdio' ? ['command', 'args', 'env', 'cwd'] : ['url', 'headers'];
        const words = { command: 'field.command', args: 'field.args', env: 'field.env', cwd: 'field.cwd', url: 'field.url', headers: 'field.headers' };
        const entered = (row.kept ?? []).filter((key) => drawn.includes(key)).map((key) => words[key]);
        const names = [...new Set([...held, ...entered].filter((one) => typeof one === 'string'))].map((word) => t(word));
        return names.length === 0 ? null : names;
      }


      /** The confirmation of a removal: the host's own dialog over its own mask. */
      function dialogOf(row, view, act) {
        const busy = act.isBusy(row.entryId);
        /* The press that asks for a removal is made here, so a refusal of it is said here too: behind the
           mask the reader cannot see the card's own room, and the answer belongs where the hand is. */
        const note = shared.noteNames(view.note ?? null, row) ? view.note : null;
        return h('div', { key: 'confirm', className: 'coreness-mcp-mask', role: 'dialog', 'aria-modal': 'true' }, [
          h('div', { key: 'dialog', className: 'coreness-mcp-dialog' }, [
            h('h4', { key: 'title', className: 'coreness-mcp-dialogTitle' }, t('confirm.title', { server: row.server ?? row.id })),
            h('p', { key: 'body', className: 'coreness-mcp-dialogBody' }, t('confirm.body')),
            note === null ? null : h('p', {
              key: 'note',
              'data-tone': shared.noteToneOf(note),
              'data-note': 'dialog',
              role: 'status',
              'aria-live': 'polite',
            }, shared.noteTextOf(note)),
            h('div', { key: 'actions', className: 'coreness-mcp-editorActions' }, [
              h('button', {
                key: 'no',
                type: 'button',
                className: 'coreness-mcp-button coreness-button',
                disabled: busy,
                onClick: () => act.cancelRemove(),
              }, t('confirm.no')),
              h('button', {
                key: 'yes',
                type: 'button',
                className: 'coreness-mcp-button coreness-button coreness-tone-danger',
                'data-tone': 'danger',
                disabled: busy,
                onClick: () => act.remove(row),
              }, t('confirm.yes')),
            ]),
          ]),
        ]);
      }

      /** The draft of a row that stands: every value the picture carries, and nothing it does not. */
      function draftOf(row) {
        return {
          entryId: row.entryId,
          server: row.server ?? '',
          transport: row.transport ?? (row.command === null ? 'streamable-http' : 'stdio'),
          url: row.url ?? '',
          command: row.command ?? '',
          args: (row.args ?? []).join('\n'),
          timeout: row.timeout === null ? '' : String(row.timeout),
          /* The value the file holds, as the reader hands it over: the page prints it and decides nothing — no
             marking, no hiding, no word instead of a value. An expression stands here as it is written. */
          headers: (row.headers ?? []).map((pair, index) => ({ key: `header.${index}`, name: pair.name, value: String(pair.value ?? '') })),
          env: (row.env ?? []).map((pair, index) => ({ key: `env.${index}`, name: pair.name, value: String(pair.value ?? '') })),
          values: {},
          ticks: {},
        };
      }

      /** The draft of a server that does not stand yet. */
      function draftNew() {
        return {
          entryId: null,
          server: '',
          transport: 'streamable-http',
          url: '',
          command: '',
          args: '',
          timeout: '',
          headers: [],
          env: [],
          values: {},
          ticks: {},
        };
      }

      /**
       * The form as the route reads it: the fields the chosen transport uses, and nothing else.
       *
       * What the row keeps beyond this is the host's own decision, the one its own config builder takes: the
       * branch a transport does not use is deleted there, a pair list merges with what the row already holds,
       * and an empty box takes its key off the row. The call timeout belongs to both
       * branches, so both save with them.
       */
      function formOf(draft) {
        const common = {
          /* A row this form creates or saves comes up loud: the product offers no way to be silent about a server
             that never started, and the control that used to offer it is gone. */
          loud: true,
          serverName: draft.server,
          transport: draft.transport,
          timeout: draft.timeout,
        };
        if (draft.transport === 'streamable-http') {
          return {
            ...common,
            url: draft.url,
            headers: draft.headers.map((pair) => ({ name: pair.name, value: pair.value })),
          };
        }
        return {
          ...common,
          command: draft.command,
          args: draft.args,
          env: draft.env.map((pair) => ({ name: pair.name, value: pair.value })),
        };
      }

      return { editorOf, pairsField, lostFields, dialogOf, draftOf, draftNew, formOf };
    }

    return { create };
  },
});
