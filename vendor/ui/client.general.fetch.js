/**
 * The general section's fetch cards: page fetch and its proxy — the heads, the strips, the checks,
 * the field and the presses, drawn from the section's picture alone.
 *
 * A package-local part beside the page's entry, pulled by `client.general.js` with `require.async` and
 * created before the section is seated. The acts it is handed are the section's; it owns only the drawing.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.general.fetch.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The two cards' drawing, made once over the section's words and the page's status surface. */
    function create({ t: words, kit }) {
      /** The card head's answer strip: the page's room, drawn always and empty while nothing is said. */
      function answerStrip(note) {
        return h('span', {
          key: 'answer',
          className: 'coreness-answer',
          'data-tone': note === null ? undefined : note.tone,
          role: 'status',
          'aria-live': 'polite',
        }, note === null ? '' : note.text);
      }

      /** One card of the page's frame: the box, its head and the body its rows stand in. */
      const cardOf = (key, head, body) => h('li', { key, className: 'coreness-card-box' }, [
        head,
        h('div', { key: 'body', className: 'coreness-card-body' }, body),
      ]);

      /**
       * The card head: its title, the mark of what it is about (inside the title, where the name is), the
       * corner's one condition and the strip at the right.
       */
      function headOf(title, mark, corner, stripNote) {
        return h('div', { key: 'head', className: 'coreness-card-head coreness-general-head' }, [
          h('h4', { key: 'title', className: 'coreness-sectionTitle' }, mark === null ? title : [title, mark]),
          corner,
          answerStrip(stripNote),
        ]);
      }

      /**
       * The page fetch card: one check over the platform's shared `web` row.
       *
       * The box is the answer itself — checked only when the live row names the product's provider — and a
       * row this profile does not let the page write is said in the corner, with the box disabled at the
       * value the platform holds. A selection saved on the platform's own page is the same row: the box
       * follows it on the settings announcement, never an optimistic copy.
       */
      function fetchCard(state, act) {
        const read = state.fetchRead;
        const row = state.fetch;
        /* The corner is the row's own condition and waits for a settled read; while the read is in flight or
           after it failed, the card's word is `Not read`. A condition asserted over an unfinished read would
           be a state nobody answered for. */
        const readOnly = read === 'ready' && (row === null || row.writable !== true);
        const editable = read === 'ready' && row !== null && row.writable === true;
        const stripNote = state.fetchNote
          ?? (read === 'failed'
            ? { tone: 'fault', text: words('state.unread') }
            : read === 'loading' ? { tone: 'plain', text: words('state.unread') } : null);
        const corner = readOnly
          ? kit.statusNode({ subject: words('fetch.title'), value: 'unwritable', data: { key: 'corner' } })
          : null;
        return cardOf('fetch', headOf(words('fetch.title'), null, corner, stripNote), [
          h('label', { key: 'check', className: 'coreness-check' }, [
            h('input', {
              key: 'box',
              type: 'checkbox',
              checked: row?.on === true,
              disabled: !editable || state.fetchBusy === true,
              onChange: (event) => act.fetch(event.target.checked),
            }),
            h('span', { key: 'word' }, words('fetch.label')),
          ]),
          h('p', { key: 'hint', className: 'coreness-dim' }, words('fetch.hint')),
        ]);
      }

      /**
       * The proxy card: the URL line on top, then the two switches with their hints.
       *
       * The order is the reader's: the URL is what both switches depend on, so its label, field and buttons
       * stand first, then "Proxy for page fetch" and the hint of its own repeat, then "Proxy all traffic"
       * and the hint of its scope. The two switches are stored independently and neither writes the other.
       *
       * The field's text is the picture's URL — the page's own field, showing the value as it stands and
       * letting the reader change it; a confirmed write leaves the re-read's value standing, a refusal keeps
       * what was typed. The dot beside the name is the URL's own state — a URL is configured or it is not —
       * and never the check's verdict: a configured proxy can answer nothing. The verdict is the press's word
       * and goes with the page's hold; the reason behind it is the console's, because it names the proxy as
       * `host:port` and the strip's room holds one word.
       */
      function proxyCard(state, act) {
        const loading = state.status === 'loading';
        const picture = state.proxy;
        const busy = state.proxyBusy;
        const writing = busy !== null;
        const fault = state.proxyFault === true;
        const missing = state.proxyMissing === true;
        const configured = picture?.configured === true;
        /* The picture is read defensively: a route that does not carry the second switch yet reads as off,
           which is the switch's default. */
        const allTraffic = typeof picture?.allTraffic === 'boolean' ? picture.allTraffic : false;
        /* Both write doors are the card's condition: the settings row the switch lives in and the store the
           save writes through. A surface this profile does not let the page write says so in the corner and
           every control waits, the check included — a read-only surface is not a proxy to try. */
        const readOnly = !loading && !fault && !missing && picture !== null
          && (picture.editable !== true || picture.writable !== true);
        const editable = !loading && !fault && !missing && picture !== null
          && picture.editable === true && picture.writable === true;
        const stripNote = state.proxyNote
          ?? (fault
            ? { tone: 'fault', text: words('state.unread') }
            : missing ? { tone: 'plain', text: words('proxy.notAvailable') } : null);
        /* A dot says what was read: with no picture there is no state to mark, and a picture a later read
           contradicted is no claim either — a mark from an unread card would be a state nobody holds. */
        const mark = picture === null || fault
          ? null
          : kit.statusMark(configured ? 'set' : 'unset', { key: 'mark', subject: words('proxy.title') });
        const corner = readOnly
          ? kit.statusNode({ subject: words('proxy.title'), value: 'unwritable', data: { key: 'corner' } })
          : null;
        const field = state.proxyField ?? '';
        return cardOf('proxy', headOf(words('proxy.title'), mark, corner, stripNote), [
          h('div', { key: 'field', className: 'coreness-field' }, [
            h('div', { key: 'label', className: 'coreness-fieldLabel' }, [
              h('label', { key: 'word', htmlFor: 'general-proxy-url' }, words('proxy.field')),
            ]),
            h('div', { key: 'row', className: 'coreness-general-field' }, [
              h('input', {
                key: 'input',
                id: 'general-proxy-url',
                className: 'coreness-field-box coreness-general-input',
                type: 'text',
                value: field,
                disabled: !editable || writing,
                placeholder: words('proxy.placeholder'),
                'aria-invalid': state.proxyInvalid === true ? 'true' : 'false',
                onChange: (event) => act.proxyField(event.target.value),
              }),
              h('button', {
                key: 'save',
                type: 'button',
                className: 'coreness-button',
                'data-tone': 'primary',
                disabled: !editable || writing || field.trim() === '',
                onClick: () => act.saveProxy(),
              }, busy === 'save' ? words('proxy.saving') : words('proxy.save')),
              h('button', {
                key: 'check',
                type: 'button',
                className: 'coreness-button',
                disabled: !editable || writing || !configured,
                onClick: () => act.checkProxy(),
              }, busy === 'check' ? words('proxy.checking') : words('proxy.check')),
            ]),
            h('p', { key: 'urlHint', className: 'coreness-dim' }, words('proxy.url.hint')),
          ]),
          h('label', { key: 'check', className: 'coreness-check' }, [
            h('input', {
              key: 'box',
              type: 'checkbox',
              checked: picture?.enabled === true,
              disabled: !editable || writing || !configured,
              onChange: (event) => act.proxy(event.target.checked),
            }),
            h('span', { key: 'word' }, words('proxy.label')),
          ]),
          h('p', { key: 'hint', className: 'coreness-dim' }, words('proxy.hint')),
          h('label', { key: 'all', className: 'coreness-check' }, [
            h('input', {
              key: 'box',
              type: 'checkbox',
              checked: allTraffic,
              /* The switch waits for the URL: it cannot be turned on while none is configured, and it can
                 always be turned off — a switch stuck on over a URL that went away is a route nobody can
                 leave. */
              disabled: !editable || writing || (!configured && !allTraffic),
              onChange: (event) => act.proxyAll(event.target.checked),
            }),
            h('span', { key: 'word' }, words('proxy.all.label')),
          ]),
          h('p', { key: 'allHint', className: 'coreness-dim' }, words('proxy.all.hint')),
        ]);
      }

      return {
        /** The two cards the fetch feature adds to the section's list, in the page's order. */
        cards: (state, act) => [fetchCard(state, act), proxyCard(state, act)],
      };
    }

    return { create };
  },
});
