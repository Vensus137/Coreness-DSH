/**
 * The MCP section's drawing: the section's own frame, the target and count lines, and the words of a
 * press's answer.
 *
 * A package-local part of `client.mcp.js`, pulled by it with `require.async` and created before the
 * section is seated. The outcome word stands here rather than with the form: it names a note, and the
 * note family (`noteTextOf`, `noteToneOf`, `noteReason`) is this file's.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.mcp.draw.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The drawing's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /** The target of a row in words: what a reader is told where the drawing is not the thing being read — the
          accessible name of the row's own switch, for one — so the words and the node cannot drift apart. */
      function targetWords(row) {
        if (row.url !== null && row.url !== '') return row.url;
        if (row.command !== null && row.command !== '') {
          return t('target.stdio', { command: row.command, args: row.args.join(' ') });
        }
        return t('target.none');
      }

      /** The target of a row, as the user reads it: an address, or the command with its arguments. A limit
          cuts the words and keeps the whole behind a hover: a roster line is not the place to read a URL with
          a query of twelve parameters, and a cut says so instead of taking the line for it. */
      function targetOf(row, limit = 0) {
        const words = targetWords(row);
        const trimmed = limit > 0 && words.length > limit;
        const shown = trimmed ? `${words.slice(0, limit).trimEnd()}…` : words;
        const attribute = trimmed ? { title: words } : null;
        if (row.url !== null && row.url !== '') return h('code', attribute, shown);
        if (row.command !== null && row.command !== '') return h('code', attribute, shown);
        return h('span', { className: 'coreness-dim', ...attribute }, shown);
      }

      /** The count line over the section: the total, then only the states that occur. */
      function countLine(rows) {
        const on = rows.filter((row) => row.enabled).length;
        const tools = rows.reduce((sum, row) => sum + (row.tools ?? []).length, 0);
        return [
          t('count.total', { count: String(rows.length) }),
          ...on > 0 ? [t('count.on', { count: String(on) })] : [],
          ...rows.length - on > 0 ? [t('count.off', { count: String(rows.length - on) })] : [],
          ...tools > 0 ? [t('count.tools', { count: String(tools) })] : [],
        ].join(' · ');
      }

      /** The section: the head, the state, the roster and whatever stands open. */
      function draw(view, act) {
        const picture = view.picture;
        const rows = picture?.rows ?? [];

        /* Before the first answer the section's frame stands — its head and its intro — so the answer lands in a
           section that was already there and moves nothing. The count and the roster do not: both are the read's
           news, and a count over a roster nobody has read would state that the profile declares no server. The
           room is named `reading` while that read runs. A card of the roster cannot stand before its row is read
           — a frame with no name would be a row inventing itself — so what stands is the section, not a card. */
        if (view.status === 'loading') {
          return h('div', { className: 'coreness-still coreness-sectionBody', 'data-state': 'reading' }, [
            h('div', { key: 'head', className: 'coreness-sectionHead' }, [
              h('h4', { key: 'title', className: 'coreness-sectionTitle' }, t('title')),
            ]),
            h('p', { key: 'intro', className: 'coreness-sectionIntro' }, t('intro')),
          ]);
        }

        const head = h('div', { key: 'head', className: 'coreness-sectionHead' }, [
          h('h4', { key: 'title', className: 'coreness-sectionTitle' }, t('title')),
          h('span', { key: 'count', className: 'coreness-sectionCount' }, countLine(rows)),
        ]);

        const parts = [head, h('p', { key: 'intro', className: 'coreness-sectionIntro' }, t('intro'))];

        if (view.status === 'failed') {
          parts.push(h('div', { key: 'failed', className: 'coreness-failed' }, [
            h('p', { key: 'word', role: 'alert' }, view.fault === null ? t('state.failed') : shared.faultLines(view.fault.code, view.fault.message).join(' — ')),
          ]));
          /* The picture that stands is drawn under the reason: a read that failed is not a reason to empty the
             section, and the reader keeps the rows this session already read. Only when there is nothing to
             keep does the section stand as the fault alone. */
          if (picture === null || picture.state !== 'ready') return h('div', { className: 'coreness-still coreness-sectionBody' }, parts);
        }

        if (picture.state === 'no-file') {
          parts.push(h('p', { key: 'nofile', className: 'coreness-dim', role: 'status' }, t('state.nofile')));
          parts.push(h('p', { key: 'hint', className: 'coreness-dim' }, t('state.nofile.hint')));
          return h('div', { className: 'coreness-still coreness-sectionBody' }, parts);
        }

        if (picture.state === 'failed') {
          parts.push(h('div', { key: 'failed', className: 'coreness-failed' }, [
            h('p', { key: 'word', role: 'alert' }, t('state.failed')),
            h('p', { key: 'reason' }, String(picture.reason)),
          ]));
          return h('div', { className: 'coreness-still coreness-sectionBody' }, parts);
        }

        if (picture.file.enabled === false) {
          parts.push(h('p', { key: 'off', className: 'coreness-dim coreness-tone-fault', 'data-tone': 'fault', role: 'status' }, t('state.offFile')));
        }

        if (rows.length === 0) {
          parts.push(h('p', { key: 'empty', className: 'coreness-dim', role: 'status' }, t('empty')));
        } else {
          const cards = rows.map((row) => shared.cardOf({
            key: row.entryId,
            row,
            view,
            act,
            open: (view.open ?? new Set()).has(row.entryId),
            menu: view.menu ?? null,
          }));
          parts.push(h('ul', { key: 'rows', className: 'coreness-list coreness-card-list' }, cards));
        }

        if (view.editor !== null && view.editor.draft.entryId === null) {
          parts.push(shared.editorOf(view.editor.draft, view, act));
        } else if (view.editor === null) {
          parts.push(h('div', { key: 'add', className: 'coreness-addRow' },
            h('button', {
              key: 'add',
              type: 'button',
              className: 'coreness-add coreness-button',
              disabled: view.busy !== null,
              onClick: () => act.open(shared.draftNew()),
            }, t('add'))));
        }

        if (view.confirm !== null) parts.push(shared.dialogOf(view.confirm, act));

        /* The settled room is named by the picture's own state, so the name and the words drawn in the room
           are one fact: nothing here is inferred from the length of the roster. */
        return h('div', { className: 'coreness-still coreness-sectionBody', 'data-state': picture.state }, parts);
      }

      /** The word of one outcome, as the plugin's own answer names it: the page's one word for a change that landed. */
      function outcomeWord(result) {
        const words = {
          created: 'state.written',
          updated: 'state.written',
          nothing: 'state.nothing',
          removed: 'state.written',
          /* The two names a toggle answers with read as a save reads: the tree was written, and that is the
             outcome. The row's own control already says Enabled or Disabled — the row carries the state and the
             answer carries what the press did — so no word is invented for the switch. */
          enabled: 'state.written',
          disabled: 'state.written',
        };
        return words[result] ?? null;
      }

      /**
       * The words of one note, and whether it carries a refusal: the sentence a card draws and the sentence its
       * hold is kept for are the same one, so it is written once.
       */
      function noteTextOf(note) {
        /* A refusal's word is the page's own ('Not saved') unless the press that was refused carries a word of
           its own — a refused sign-in reads as a refused sign-in and not as a failed save. */
        const word = note.fault === undefined ? note.word : (note.word ?? 'state.refused');
        return t(word, note.params ?? {});
      }


      /* The tone words this section's notes and rows use, and the set's own class each one wears: the word stays
         this section's — the instruments read it in `data-tone` — and the colour stands once in the page's sheet.
         The vocabulary is the set's: `done` and `fault` for a state, and `danger` for the destructive press's own
         colour. A word with no entry here paints what it painted before. */
      const TONE_CLASS = { done: ' coreness-tone-done', fault: ' coreness-tone-fault', danger: ' coreness-tone-danger' };

      /**
       * The tone of one note: a refusal is a fault, a press that **changed nothing** is plain — the user's own
       * decision, and the gate's no-op answers the same way — and every other answer is done. The decision is
       * read off the dictionary's own key and never off the drawn sentence, so a rewritten sentence cannot
       * move a tone; it is made here, once, rather than four times in the drawing.
       */
      function noteToneOf(note) {
        if (note.fault !== undefined) return 'fault';
        return note.word === 'state.nothing' ? 'plain' : 'done';
      }

      /** The reason a refusal carries: the code's own sentence, which stands as the strip's tooltip and not as its word. */
      function noteReason(note) {
        if (note === null || note.fault === undefined) return undefined;
        return shared.faultLines(note.fault.code, note.fault.message).join(' — ');
      }

      /** Whether a note names this row. The server is the note's own field, not an argument of its sentence. */
      const noteNames = (note, row) => note !== null && row !== null && note.server === (row.server ?? row.id ?? null);

      /** The row an editor is about: its entry, or — for a row that does not exist yet — the name being typed. */
      const draftRow = (draft) => ({ server: draft.server, id: draft.entryId });

      /**
       * The note a card carries: the last press that named this row, and nothing else.
       *
       * The card's strip is the page's answer room, so a press's word stands there whatever room the press was
       * made in: the confirmation draws no answer of its own, and the editor of a row that stands leaves its word
       * to that row's card. A draft that is not a row yet has no card, so the editor says that press's word itself
       * — and the card whose name that draft happens to carry is not that press's room, even when the refusal is
       * the file already holding the name.
       */
      function noteOf(row, view) {
        const note = view.note ?? null;
        if (!noteNames(note, row)) return null;
        if (view.editor !== null && view.editor.draft.entryId === null && noteNames(note, draftRow(view.editor.draft))) return null;
        return note;
      }

      return {
        draw, targetWords, targetOf, countLine, outcomeWord,
        noteTextOf, TONE_CLASS, noteToneOf, noteReason, noteNames, draftRow, noteOf,
      };
    }

    return { create };
  },
});
