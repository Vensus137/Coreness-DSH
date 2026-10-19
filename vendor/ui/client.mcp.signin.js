/**
 * The sign-in half of the MCP section: where a row's press stands, the row's condition in one word,
 * the words a refused attempt is said with, and the block a card's body carries for it.
 *
 * A package-local part of `client.mcp.js`, pulled by it with `require.async` and created before the
 * section is seated. `create` receives the section's words, the kit, the picker, the page's hold and the
 * one object the parts reach each other through; a function that belongs to another part is looked up
 * there when it is called, because the parts depend on each other in a cycle.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.mcp.signin.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The sign-in's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /** What the door answered, by the row it answered about. */
      const byEntry = (signins) => Object.fromEntries((signins ?? []).map((one) => [one.entryId, one]));

      /** The value the row's own Authorization header carries, or null when the file holds none. */
      function authorizationOf(row) {
        const pair = (row.headers ?? []).find((one) => String(one.name ?? '').toLowerCase() === 'authorization');
        const value = pair === undefined ? '' : String(pair.value ?? '');
        return value === '' ? null : value;
      }

      /**
       * Whether a row owes the write that joins it to a grant the store already holds.
       *
       * The write goes into a row whose own authorization header stands empty and never over one a person
       * wrote: a header the file carries is the file's own text, and this page does not shape expressions. A
       * grant that stands and a row that already reads it owes nothing; a row that reads something else is
       * left as its file has it.
       * @param {object} row the row of the picture
       * @param {object | null} signin what the page's own door answered about this row
       * @returns {boolean} whether the row should be joined to its grant
       */
      function needsJoin(row, signin) {
        if (signin === null || signin.reference === null || signin.reference === undefined) return false;
        const held = authorizationOf(row);
        if (held === signin.reference.expression) return false;
        if (held !== null) return false;
        return signin.state === 'authorized' || (signin.state === null && signin.grant === true);
      }

      /**
       * Where the row's sign-in press stands — the answer strip, the row's own settings, or nowhere.
       *
       * Three conditions, each read from what the picture and the flow's own door publish and none from a
       * guess: the flow must stand to run the attempt at all (`available`, the desk's own reading of the
       * composition) and no attempt of that row may be waiting, because the platform's registry refuses a
       * second attempt for one key and a control there would be a button that cannot work.
       *
       * **A row that serves is left alone, whatever a probe met** (requirement 5): a client whose tools stand
       * answers, so a sign-in offered beside them is a press that changes nothing. The condition is read from
       * the row's own picture — the tools the platform registered — and not from a second probe.
       *
       * **And the press stands in one place at a time** (requirement 6): the strip carries it where the
       * standard's own signals announced a door at the row's address and the row is switched on; the row's own
       * settings carry it everywhere else the flow can run. That is the only way a server whose door the
       * standard's signals do not announce can be signed in at all — its address answers no pointer and no
       * metadata, and the person still knows it asks for OAuth.
       * @param {object} row the row of the picture
       * @param {object | null} signin what the page's own door answered about this row
       * @returns {'strip' | 'settings' | null} where the press stands
       */
      function signinPlace(row, signin) {
        if (signin === null || signin.available !== true || signin.state === 'waiting') return null;
        if ((row.tools ?? []).length > 0) return null;
        if (signin.possible === true && row.enabled === true) return 'strip';
        return 'settings';
      }

      /**
       * The row's own condition, in one short word for the answer strip.
       *
       * This is what the row's face says about the host's report. That report is a log line —
       * `mcp-client(linear): connection failed; retrying in 4000ms (attempt 5/10)` — and it stood in the
       * card's body exactly as it came, a paragraph of the platform's internals where the person was
       * looking. One word is what belongs on the face, and the host's own words stand one door away, in the
       * console, where every reason this page may not draw already stands.
       *
       * Three conditions are read and each has a word of its own: a fiber standing **failed** never started,
       * so the row serves nothing whatever its switch says; a client that has **given up** (`error`) is not
       * connected and its tools are unregistered; and a client between attempts (`warn`) is connecting. A
       * row switched off carries no word — the switch is that state, and no client is mounted for it — and a
       * row with no report and no failed fiber carries none either: silence there is a row that serves, and
       * a word invented for it would be a claim this page never read.
       * @param {object} row the row of the picture
       * @returns {{word: string, tone: string, state: string} | null} the word, or nothing where nothing stands
       */
      function rowState(row) {
        if (row.enabled !== true || row.shape !== true) return null;
        if (row.phase === 'failed') return { word: 'row.failed', tone: 'fault', state: 'failed' };
        const told = row.trouble ?? null;
        if (told === null) return null;
        if (told.level === 'error') return { word: 'row.lost', tone: 'fault', state: 'lost' };
        return { word: 'row.connecting', tone: 'plain', state: 'connecting' };
      }

      /**
       * The row's reason, as the platform's own record answered it: the server's own message when its answer
       * carried one, and this page's own sentence for the family otherwise.
       *
       * The family is the platform's reading and never this page's guess: it comes from the status the responder
       * gave, or from the SDK's own code where no status stands — a probe that timed out, a process that closed,
       * an address that answered something that is not an MCP server. A family this page has no words for is
       * drawn as the `unknown` state rather than as a silence, and a row whose reason was not answered keeps its
       * own word and nothing else.
       * @param {object} reason the record the picture carries for this row, or nothing
       * @returns {string | null} the one sentence
       */
      function reasonWords(reason) {
        if (reason === null || reason === undefined) return null;
        const told = typeof reason.server === 'string' && reason.server !== '' ? reason.server : null;
        if (told !== null) return told;
        const family = typeof reason.family === 'string' ? reason.family : 'unknown';
        return t(shared.reasonKey(family));
      }

      /**
       * The reason of a row that did not start, first in the card's body.
       *
       * The strip keeps the row's own condition in one word and the console keeps the platform's record; this is
       * the third room of that split — the content in the card's body — and it is the answer to the question a
       * person opens the card with: why the row is standing as it is. It stands above everything else the body
       * carries, because the tools line under it reads as a consequence of it.
       *
       * Two facts, in the order they are stronger: a row whose fiber failed carries the platform's record of
       * that failure in the picture, and a row that is still being reached has no such record at all — only the
       * client's own last line, kept there too. Both are read off the row the picture already published.
       * @param {object} row the row of the picture
       * @returns {object | null} the node, or nothing
       */
      function reasonLine(row) {
        const words = reasonWords(row.failure ?? null);
        if (words !== null) return h('p', { key: 'reason', className: 'coreness-mcp-warn' }, words);
        const told = row.trouble ?? null;
        if (told === null || typeof told.text !== 'string' || told.text === '') return null;
        return h('p', { key: 'reason', className: 'coreness-mcp-warn' }, told.text);
      }

      /** The name of the input the flow's own question is answered in. */
      const answerField = (server) => `coreness-signin-${server.replace(/[^A-Za-z0-9_-]+/gu, '-')}`;

      /** The words of a flow's own sentence the address is carried on: the owner's own ask, named once. */
      const SIGNIN_LINK_WORDS = 'sign in';

      /**
       * The sentence a person reads, with the flow's address carried by the words `sign in` inside it.
       *
       * The words are the flow's own and are drawn as they came; what this page settles is which of them carry
       * the address, and the answer for a flow whose sentence carries no such words: the page's own `signin`
       * word stands linked after the sentence, because an address handed out with no way to press it is a link
       * nobody can follow. A flow that handed out no address yet draws the sentence alone.
       * @param {string} sentence the words on the face
       * @param {string | null} url the address the flow handed out, when it handed one
       * @returns {Array} the parts of the line, in the order they read
       */
      function sentenceWithLink(sentence, url) {
        if (url === null) return [sentence];
        const link = (words) => h('a', {
          key: 'link',
          className: 'coreness-mcp-signinLink',
          href: url,
          target: '_blank',
          rel: 'noreferrer',
        }, words);
        const at = sentence.toLowerCase().indexOf(SIGNIN_LINK_WORDS);
        if (at === -1) return [sentence, ' ', link(t('signin'))];
        return [
          sentence.slice(0, at),
          link(sentence.slice(at, at + SIGNIN_LINK_WORDS.length)),
          sentence.slice(at + SIGNIN_LINK_WORDS.length),
        ].filter((part) => part !== '');
      }

      /**
       * The row's sign-in, as the card's body carries it.
       *
       * Three things and no more: the sentence — the flow's own words about the wait, or the page's own where
       * the flow said nothing, or the page's one sentence for a refused code — with the flow's address carried
       * by the words `sign in` **inside** it and no bordered control beside it; the question the flow cannot
       * answer for itself, drawn where the person is already looking, on one line: the page's own box with the
       * page's own control at its right and the question under the field; and the reset, which takes back what
       * is pending — an attempt waiting, or a refusal the flow still holds — and stands nowhere else, so a
       * block with nothing to take back carries no control of its own. A sign-in that finished draws nothing
       * here: the row's own header and its tools are what changed.
       * @param {object} row the row of the picture
       * @param {object | null} signin what the page's own door answered about this row
       * @param {object} view the section's state
       * @param {object} act the section's acts
       * @returns {object | null} the block, or nothing where the row's sign-in has nothing to say
       */
      function signinBlock(row, signin, view, act) {
        if (signin === null || signin.state === null || signin.state === 'authorized') return null;
        const server = row.server ?? row.id;
        const url = typeof signin.url === 'string' && signin.url !== '' ? signin.url : null;
        const parts = [];
        if (signin.state === 'waiting') {
          const sentence = typeof signin.message === 'string' && signin.message !== '' ? signin.message : t('signin.waiting');
          parts.push(h('span', { key: 'words', className: 'coreness-mcp-signinWords' }, sentenceWithLink(sentence, url)));
        }
        if (signin.prompt !== null) {
          const question = signin.prompt.message === '' ? t('signin.answerLabel') : signin.prompt.message;
          /* The flow's own question, in the page's own field: the page's boxed input and the page's own control
             on one line — the border, the radius, the focus ring, the placeholder and the disabled look stand
             once in the page's own sheet (`coreness-field`, `coreness-field-box`) and are worn here as every
             other value this page draws wears them, so a secret the flow asks for is not a second design
             language inside one card — and the question **under** the field, where the person reads it as the
             hint to the box he is typing in. The input keeps the question as its own accessible name, so the
             field is named for a reader who cannot see the hint. */
          parts.push(h('div', { key: 'field', className: 'coreness-field coreness-mcp-signinField' }, [
            h('div', { key: 'line', className: 'coreness-mcp-signinLine' }, [
              h('input', {
                key: 'value',
                id: answerField(server),
                className: 'coreness-mcp-input coreness-field coreness-field-box',
                type: signin.prompt.kind === 'secret' ? 'password' : 'text',
                'aria-label': question,
                placeholder: signin.prompt.placeholder ?? '',
                value: (view.answers ?? {})[server] ?? '',
                onChange: (event) => act.type(server, event.target.value),
              }),
              h('button', {
                key: 'reply',
                type: 'button',
                className: 'coreness-mcp-button coreness-button',
                disabled: ((view.answers ?? {})[server] ?? '') === '',
                onClick: () => act.reply(row),
              }, t('signin.answer')),
            ]),
            h('p', { key: 'hint', className: 'coreness-mcp-dim coreness-dim' }, question),
          ]));
        }
        if (signin.state === 'refused' || signin.state === 'cancelled') {
          const code = typeof signin.code === 'string' && signin.code !== '' ? signin.code : 'signin-failed';
          /* One short sentence and the code, on the one line the person reads: the page's own words for that
             code — never a generic "the sign-in failed" — and the flow's own sentence after it, because the
             server's answer ("Required parameter: client_secret", "invalid_grant") is the one fact a person can
             act on, and it used to reach only the console. The server's words are the endpoint's message; they
             carry no secret. The code stands last, as the word a person repeats when asking about it. */
          const lines = shared.faultLines(code, signin.message);
          parts.push(h('span', { key: 'words', className: 'coreness-mcp-signinWords' }, [
            lines.join(' — '),
            ' ',
            h('code', { key: 'code', 'data-code': code }, code),
          ]));
        }
        /* The reset stands while an attempt waits for its code and nowhere else. A refusal is not something a
           person can take back by pressing it: the measurement on this face is that a press on a refused attempt
           draws the same refusal again and the log gains not one line, and the way on from a refusal is the
           link in the sentence above. */
        if (signin.state === 'waiting') {
          parts.push(h('button', {
            key: 'withdraw',
            type: 'button',
            className: 'coreness-mcp-button coreness-button coreness-mcp-signinWithdraw',
            onClick: () => act.withdraw(row),
          }, t('signin.withdraw')));
        }
        if (parts.length === 0) return null;
        return h('div', {
          key: 'signin',
          className: 'coreness-mcp-signin' + (signin.state === 'refused' ? ' coreness-mcp-warn' : ' coreness-mcp-dim coreness-dim'),
          'data-note': 'signin',
          'data-state': signin.state,
          'data-code': typeof signin.code === 'string' ? signin.code : undefined,
          'data-tone': signin.state === 'refused' ? 'fault' : 'plain',
        }, parts);
      }

      return {
        byEntry, authorizationOf, needsJoin, signinPlace, rowState,
        reasonWords, reasonLine, answerField, SIGNIN_LINK_WORDS, sentenceWithLink, signinBlock,
      };
    }

    return { create };
  },
});
