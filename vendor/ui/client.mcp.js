/**
 * The MCP section of the product's page: the servers of the profile as cards, an editor in place, a
 * confirmation before a removal and a switch on each card — read and written through the plugin's own
 * route alone.
 *
 * A package-local chunk beside the entry: this file carries the section's words, its sheet, its
 * vocabularies and its seat, while the drawing and the section's own lifetime are five parts beside it
 * (`client.mcp.signin.js`, `.card.js`, `.form.js`, `.draw.js`, `.section.js`), all created over one
 * `shared` object and seated only once the picker, the hold and the kit are in hand.
 *
 * A save's outcome is the route's answer: every save here shows what the tree now holds, and a disagreement
 * is said in words (the servers file's own write is the include's and is not observed here).
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.mcp.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The plugin's own door: the picture on a GET, one save on a POST. */
    const ROUTE = '/api/coreness.mcp';
    /** The sign-in door: the precondition of a row, the press, the answer and the withdrawal. */
    const PAGE_ROUTE = '/api/coreness.signin';
    /** The seat the page declares for the sections of the plugins that come later. */
    const SEAT = 'coreness.section';
    /** The rail row's own id inside that seat. */
    const ID = 'mcp';
    /** The locale namespace of the section's words. */
    const NS = 'coreness.mcp';
    const STYLE_ID = 'coreness-ui-mcp-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/ui/client.mcp.js';
    const PACKAGE = '@coreness/ui';

    /**
     * The kinds the form offers, and the words for them — the same two the host's own row reader names
     * under `TRANSPORTS`: the value is the platform's spelling, the label the page's own.
     */
    const KINDS = ['streamable-http', 'stdio'];
    const KIND_LABELS = {
      'streamable-http': 'kind.http',
      'stdio': 'kind.stdio',
    };

    /**
     * The parts beside this entry, pulled at materialisation and in hand before the section is seated: the
     * page's picker and hold, the kit's door to the console, and the five drawings. A pull that failed is
     * named on the console and seats nothing.
     */
    const PICKER = require.async('./client.picker.js');
    const HOLD = require.async('./client.hold.js');
    const KIT = require.async('./client.kit.js');
    const SIGNIN = require.async('./client.mcp.signin.js');
    const CARD = require.async('./client.mcp.card.js');
    const FORM = require.async('./client.mcp.form.js');
    const DRAW = require.async('./client.mcp.draw.js');
    const SECTION = require.async('./client.mcp.section.js');

    /**
     * The refusals of the plugin's route, as the host names them: the page carries its own words by code, and
     * a code one half knows and the other does not is a save nobody can read.
     */
    const REFUSALS = [
      'bad-action',
      'bad-name',
      'name-taken',
      'no-file',
      'no-row',
      'not-an-mcp-row',
      'bad-transport',
      'bad-url',
      'bad-command',
      'bad-timeout',
      'bad-header',
      'bad-env',
      'bad-value',
      'header-ref',
      'env-ref',
      'config-ref',
      'disabled-ref',
      'not-saved',
      'write-failed',
      'unreadable',
    ];

    /**
     * The refusals of the flow's own vocabulary, as the flow publishes them: every code the flow can answer
     * with must have a sentence here, and a check holds this list against the flow's own vocabulary.
     */
    const OAUTH_FAULTS = [
      'no-resource-metadata',
      'no-server-metadata',
      'bad-metadata',
      'registration-refused',
      'registration-invalid',
      'exchange-refused',
      'exchange-invalid',
      'refresh-refused',
      'refresh-invalid',
      'no-code-verifier',
      'no-redirect',
      'no-authorization-url',
      'no-token-endpoint',
      'state-mismatch',
      'no-code',
      'provider-refused',
      'no-attempt',
      'no-callback',
      'no-web-server',
      'cancelled',
    ];

    /**
     * The refusals of the page's own sign-in door, which the flow never sees, spelled apart from the
     * servers route's own codes on purpose: one code carried by two vocabularies would leave one of them
     * drawing the other's sentence.
     */
    const DOOR_FAULTS = ['signin-action', 'signin-body', 'signin-lost', 'signin-failed'];

    /* The section's own words. One namespace, one dictionary: the rail row's label is a thunk so it
       follows the language without a re-registration, and every failure the route can answer with
       has words here rather than a bare code. */
    /**
     * The dictionary key of a failure's family.
     *
     * The host decides the family; the page owns the words, and the dictionary is the only list of them: a
     * family this half has no sentence for is drawn as `unknown` rather than as a key a reader cannot read.
     * @param {string} family the family the host read off the failure
     * @returns {string} the key to draw
     */
    const reasonKey = (family) => {
      const key = `reason.${family}`;
      return Object.prototype.hasOwnProperty.call(EN, key) ? key : 'reason.unknown';
    };

    const EN = {
      section: 'MCP',
      title: 'MCP servers',
      intro: 'The servers this profile declares in its servers file. The harness owns the connections; this page shows the picture and writes the rows.',
      'count.total': '{count} total',
      'count.on': '{count} on',
      'count.off': '{count} off',
      'count.tools': '{count} with tools',
      'state.nofile': 'This composition declares no servers file, so there is nothing to manage here',
      'state.nofile.hint': 'The row that mounts it is a cordis:include in the profile\'s composition; the product\'s own bundle declares it as mcp-servers.',
      'state.failed': 'The servers file could not be read',
      'state.offFile': 'The servers file is switched off in this composition, so nothing it declares is mounted',
      'empty': 'No MCP server is declared in this profile yet',
      'target.none': 'no address yet',
      'target.stdio': '{command} {args}',
      'tools.none': 'no tools yet',
      'row.failed': 'Did not start',
      'row.lost': 'Not connected',
      'row.connecting': 'Connecting',
      'actions': 'Row actions',
      'open': 'Show the details',
      'close': 'Hide the details',
      'editor.kept': 'This form writes the fields it shows; a field of the row it does not show stands as your own file has it',
      'editor.drop': 'Leaving the {kind} branch: this save drops {fields} — the file holds them today',
      'field.cwd': 'Working directory',
      'refs': 'The file holds an expression in {names}; this form does not write over it',
      'field.name': 'Name',
      'field.nameFixed': 'Name — the row id, and a rename is a new row plus a removal',
      'field.transport': 'Transport',
      'kind.http': 'Streamable HTTP',
      'kind.stdio': 'Standard input/output',
      'field.url': 'Address',
      'field.command': 'Command',
      'field.args': 'Arguments, one per line',
      'help.command': 'Any command or a full path to a script.',
      'help.args': 'One line is one argument, taken whole — a space inside it does not split it.',
      'help.headers': 'A Bearer or Basic value typed here is a secret written into the servers file at rest; where the row can sign in, use Sign in and let the reference read the stored grant, or write an expression such as !!js process.env.NAME.',
      'field.timeout': 'Call timeout, ms',
      'field.headers': 'Headers',
      'row.tools': 'Tools ({count}):',
      'field.env': 'Environment',
      'field.value': 'Value',
      'pair.add': 'Add a row',
      'pair.remove': 'Remove',
      'add': 'Add a server',
      'add.title': 'A new server',
      'edit.title': 'The server «{server}»',
      'apply': 'Apply',
      'saving': 'Saving…',
      'cancel': 'Cancel',
      'edit': 'Edit',
      'remove': 'Remove',
      'toggle.on': 'Enable',
      'toggle.off': 'Disable',
      'confirm.title': 'Remove «{server}»?',
      'confirm.body': 'The row leaves the servers file and the harness drops the tools of that server. Nothing else about the profile changes.',
      'confirm.yes': 'Remove',
      'confirm.no': 'Cancel',
      'fault.bad-action': 'The page asked for a save the plugin does not take',
      'fault.bad-name': 'A server name is 1 to 32 letters, digits, underscores or hyphens',
      'fault.name-taken': 'Another row of this file already takes that name',
      'fault.no-file': 'This composition declares no servers file',
      'fault.no-row': 'The servers file holds no such row',
      'fault.not-an-mcp-row': 'This row is not an MCP client row, so this form does not shape it',
      'fault.bad-transport': 'A row carries one kind — streamable-http or stdio — and the fields of another branch do not travel with it',
      'fault.bad-url': 'The address must be an http or https URL',
      'fault.bad-command': 'A stdio row needs the command it starts',
      'fault.bad-timeout': 'The call timeout is a whole number of milliseconds',
      'fault.bad-header': 'A header carries a name and a value',
      'fault.bad-env': 'An environment variable carries a name and a value',
      'fault.bad-value': 'A value with a line break — or one of spaces alone — is not a value this file can hold',
      'fault.header-ref': 'A header of this row stands as an expression in the file: the form does not write over it',
      'fault.env-ref': 'An environment variable of this row stands as an expression in the file: the form does not write over it',
      'fault.config-ref': 'A setting of this row stands as an expression in the file: the form does not write over it',
      'fault.disabled-ref': 'The enablement of this row stands as an expression in the file: the toggle does not write over it',
      'state.written': 'Saved',
      'state.nothing': 'Nothing changed',
      'state.refused': 'Not saved',
      'fault.not-saved': 'The save did not stand: the tree does not hold what was written; the servers file\'s own write is not observed here',
      'fault.write-failed': 'The Loader refused the write',
      'fault.unreadable': 'The servers file could not be read',
      'signin': 'Sign in',
      'signin.waiting': 'Waiting for you to sign in',
      'signin.answer': 'Send',
      'signin.withdraw': 'Withdraw',
      'signin.answerLabel': 'What the sign-in page showed you',
      'signin.done': 'Signed in',
      'signin.refused': 'Sign-in refused',
      'signin.cancelled': 'The sign-in was withdrawn',
      'fault.no-resource-metadata': 'The server asks for a sign-in and publishes no OAuth document to sign in through',
      'fault.no-server-metadata': 'The document names an authorization server that answers no metadata',
      'fault.bad-metadata': 'The metadata that answered is not the document the standard describes',
      'fault.registration-refused': 'The authorization server refused to register this page as a client',
      'fault.registration-invalid': 'The registration answered, and not with a client id',
      'fault.exchange-refused': 'The token endpoint refused the exchange — a scope it will not grant is refused here too',
      'fault.exchange-invalid': 'The token endpoint answered without the fields an exchange returns',
      'fault.refresh-refused': 'The refresh was refused; an expired grant means signing in again',
      'fault.refresh-invalid': 'The refresh answered without the fields a refresh returns',
      'fault.no-code-verifier': 'No verifier stands for this server, so the exchange cannot be finished',
      'fault.no-redirect': 'No address stands for the browser step to come back to',
      'fault.no-authorization-url': 'The authorization server published no sign-in address',
      'fault.no-token-endpoint': 'The authorization server published no token address',
      'fault.state-mismatch': 'The answer carries a state this page never stored for that server',
      'fault.no-code': 'The answer came back without a code to exchange',
      'fault.provider-refused': 'The authorization server sent its own refusal back',
      'fault.no-attempt': 'An answer came back for a sign-in that is not waiting for one',
      'fault.no-callback': 'The browser did not come back with an answer in time',
      'fault.no-web-server': 'This composition has no web server, so a sign-in has nowhere to come back to',
      'fault.cancelled': 'The sign-in was withdrawn before an answer came back',
      'fault.signin-action': 'The page asked the sign-in door for something it does not take',
      'fault.signin-body': 'The sign-in door could not read what the page sent',
      'fault.signin-lost': 'The plugin that was running this sign-in is gone; press Sign in again',
      'fault.signin-failed': 'The sign-in could not be started',
      'reason.forbidden': 'The server understood the request and refused it — this address is out of reach from here (a region, a plan or a policy)',
      'reason.unauthorized': 'The server wants a sign-in before it answers, and no attempt was made for it',
      'reason.missing': 'No MCP endpoint answers at this address',
      'reason.broken': 'The server is broken behind this address: its own error came back',
      'reason.unexpected': 'The address answered, but not as an MCP server',
      'reason.closed': 'The server closed the connection before it answered — for a command, the process it starts ends at once',
      'reason.silent': 'The server did not answer at all',
      'reason.unknown': 'The row did not start, and the record the platform kept names no reason this page can read',
    };

    /* The host's own sheets, copied rule for rule and renamed, carried by its tokens alone: the management card
       (`.section`, `.rowCard`, `.rowHead`, `.rowTag`, `.rowActions`, `.editor`, `.field`, `.input`, the buttons), the
       confirmation and its modal chrome, the credential dot, and the nested map's form — a four-column grid, each
       entity a card with a `.5px` border. Two departures, both named: a pair row of that map carries no box of its
       own — the page's grid stands on the editor's axis — and the modal in this page sits under the section instead
       of the app root, which changes nothing of what it covers. */
    const CSS = `
/* The section's own heading, worn from the page's own head rather than declared again here: the head, its title
   and its count are the page's own classes, and the arrangement and the type stand once, in the page's own sheet. */
/* The word that names the list, in the weight that names rather than explains: the page's own rule for a small line
   (naming is 500, explaining is 400), and the reason the label is set apart from the names it introduces. */
.coreness-mcp-toolsLabel{font-weight:500}
.coreness-mcp-signin code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
/* The row's own sign-in block in a card's body: a column of lines — the sentence, the field with its hint, and
   the reset — stood apart by the 8 the page's action strips stand on. The tone is the set's own class beside this
   one — coreness-tone-fault for a refusal, the page's dim role for a wait — because a colour is a fact of the
   state and not of this box. */
.coreness-mcp-signin{display:flex;flex-direction:column;gap:8px;margin:0;font-size:12px;line-height:18px}
/* The flow's address is carried by the words "sign in" **inside** the sentence the person reads, so the link is
   words and not a bordered control of its own: it keeps the sentence's own ink and is marked by the one sign a
   link carries everywhere. The page's sheet publishes no link role, and this is the whole of what the block
   declares for one. */
.coreness-mcp-signinLink{color:inherit;text-decoration:underline;cursor:pointer}
/* The field reads as one line: the page's own box and the page's own control on a grid whose distances are the
   page's own 6, the field taking the room and the control its own width after it. */
.coreness-mcp-signinLine{grid-template-columns:minmax(0,1fr) auto;gap:6px;display:grid}
/* The reset is the block's own last line, hard against the **left** edge, where every other line of the block
   begins: the owner moved it there by his own word after seeing it drawn at the right. It is the block's only
   button besides the field's own Send. */
.coreness-mcp-signinWithdraw{align-self:flex-start}
/* The right side of the head: the row's own controls, held to the right of the head and parted by the 8 the
   page's card action lines stand on; the free room in front of them, and not this number, is what holds them
   there. */
.coreness-mcp-actions{align-items:center;gap:8px;margin-left:auto;display:inline-flex;flex:none}
/* The strip an answer to a press lives in is the page's own element: its width is reserved by the page's rule,
   so the empty room a card draws before any word arrives is the room the word stands in, and a word that comes
   and goes moves no box of this head. The colours of its three tones stand with the strip itself, in the page's
   own sheet. */
/* The button rules this section keeps: the destructive hover and the small control's own height. The base, the
   hover, the primary rules, the disabled look and the ring stand once in the page's own sheet, in the shared
   button class every button here wears beside this one. */
.coreness-mcp-button[data-tone='danger']:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}
/* The small control's role, named as the platform names its own: .sm{height:28px;font-size:12px;line-height:18px}.
   It is written as a height and not as a padding because the page's
   own scale of distances has no 5 — 18 + 5 + 5 is the platform's arithmetic, and the platform states its result, not
   the sum. Any control of this page that is small takes this role. */
.coreness-mcp-actions .coreness-mcp-button{border-radius:var(--dsw-radius-sm);height:28px;padding:0 10px;font-size:12px;line-height:18px;white-space:nowrap}
/* The row's switch is the set's control: coreness-switch and its thumb stand once in the page's own sheet, and
   this card wears them untouched. */
/* The editor keeps the page's card-to-card distance from whatever stands above it — a card, an empty state, or
   nothing at all — and the add row under the list takes the set's own distance. */
.coreness-mcp-editor{border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-module-platform);flex-direction:column;gap:12px;padding:12px 14px;margin-top:8px;display:flex}
.coreness-mcp-editorHead{align-items:center;justify-content:space-between;display:flex}
/* The right side of the editor's head: the row's own acts and the editor's own answer, on the line a person reads
   the row's name on and not among the form's own acts — a press that never touches the draft must not read as one
   that saves it. */
.coreness-mcp-editorBeside{align-items:center;gap:8px;display:inline-flex}
/* The answer a press makes before its row exists: a draft has no card, so the editor is the one room that press's
   word can stand in. Its colour is the set's tone class beside this one; this rule carries only the line's own size
   and place. */
.coreness-mcp-editorNote{flex:none;text-align:right;font-size:12px;line-height:18px}
textarea.coreness-mcp-input{height:auto;min-height:64px;resize:vertical}
/* A form row's controls stand six apart in a grid of three fixed columns: the columns are the form's own, so the
   row never wraps and the distance is a grid's, not a line's — the Qoder's row, which may break, carries its own. */
.coreness-mcp-grid{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:6px;display:grid}
/* A pair row carries no box of its own: the rows stand on the fields' axis, and the map is read by the label
   above it. */
.coreness-mcp-editorActions{justify-content:flex-end;gap:8px;display:flex}
/* The mask keeps the platform's own distance from the frame's top — the host's token, floored at 24 — and 24 at
   the sides: the page declares no number of its own for a room the platform already owns. */
.coreness-mcp-mask{pointer-events:auto;position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:max(24px,var(--dsh-frame-overlay-top,24px)) 24px}
.coreness-mcp-mask::after{content:'';position:absolute;inset:0;background:var(--dsw-alias-bg-mask-1)}
/* The panel's own column: the title, the question and the actions stand twenty apart, so a dialog asks in three
   blocks rather than reading as a form — no field of the form below stands that far from another. */
.coreness-mcp-dialog{box-sizing:border-box;position:relative;z-index:1;display:flex;flex-direction:column;gap:20px;width:min(440px,100%);padding:22px 24px 24px;border:0;border-radius:var(--dsw-radius-panel);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-prominent)}
.coreness-mcp-dialogTitle{margin:0;font-size:16px;line-height:24px;font-weight:500;color:var(--dsw-alias-label-primary)}
.coreness-mcp-dialogBody{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-secondary)}
/* The card's head is its disclosure: the name and the subtitle in a button, the actions and the toggle beside it,
   the marker at the side, and the body only while it is open. */
.coreness-mcp-headButton{box-sizing:border-box;border:none;background:0 0;color:inherit;font:inherit;text-align:left;padding:0;cursor:pointer;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto;display:flex}
.coreness-mcp-headButton:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary);outline:none;border-radius:var(--dsw-radius-md)}
/* The subtitle carries the row's target and its state, in the section's own ink and pair; the one line and its
   cut are the page's cut line, worn beside this class. */
.coreness-mcp-subtitle{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;min-width:0}
.coreness-mcp-marker{box-sizing:border-box;border:none;background:0 0;color:var(--dsw-alias-label-secondary);flex:none;width:24px;height:24px;cursor:pointer;justify-content:center;align-items:center;display:inline-flex}
.coreness-mcp-marker svg{transition:transform .15s ease}
.coreness-mcp-marker[data-open='true'] svg{transform:rotate(180deg)}
.coreness-mcp-menu{position:relative;display:inline-flex}
/* The list hangs four under the control that opens it and pads four inside: near enough that the pointer crosses
   from the trigger onto the first row without leaving anything behind, and the rows below part by their own boxes. */
/* The list is as wide as the whole label of its widest item: max-content is the content's own size and owes nothing
   to the trigger's box the popup hangs from, where a shrink-to-fit reads that box and lands on the longest word —
   fit-content is that same shape spelled out. No floor and no cap stand beside it: the width is the words', and the
   next label is not this one. The 140 px floor that stood here held the air around two words. */
.coreness-mcp-menuList{position:absolute;z-index:30;top:calc(100% + 4px);right:0;width:max-content;background:var(--dsw-alias-bg-layer-3,#fff);border:.5px solid var(--dsw-alias-border-l2,#0000001f);border-radius:var(--dsw-radius-md);box-shadow:var(--coreness-elevation);padding:4px;flex-direction:column;display:flex}
/* The item is the page's shared button beside its own differences: no hairline of its own, the list's own padding
   and the row's own axis. The axis is justify-content and not text-align: the shared body centres its content, and
   no text-align moves a flex container's content, so a left alignment written that way draws nothing. Repeating the
   shared rule's own values here would hold them still while the shared rule moves. */
/* An item is a line the pointer takes whole: its own padding is the room between its word and the list's edge,
   and two items touch, because a menu is read by moving from one row to the next and not by the air between them. */
.coreness-mcp-menuList .coreness-mcp-menuItem{border:none;box-shadow:none;background:0 0;border-radius:var(--dsw-radius-sm);padding:6px 10px;justify-content:flex-start;width:100%;text-align:left}
/* The item's own focus fill, kept with the item and not carried by the shared hover: the shared selector takes
   hover and the picker's active state, and widening it to focus would fill every button of the page on a keyboard
   walk — a page-wide change this member's own state does not make. The body matches the shared hover's on purpose,
   and the census counts the pair as a group it did not have before. */
.coreness-mcp-menuItem:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}
`;

    /**
     * The section's sheet, held for as long as the section stands: put in here, put back if it is taken.
     * The platform replaces a plugin in place and takes the package's style tags with it, and the mount is
     * the one place a sheet can be put back; the hold ends with the effect, because a sheet that outlived
     * its plugin would be a trace.
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

    /** The message of a thrown value. */
    const reasonOf = (error) => (error instanceof Error ? error.message : String(error));

    let ctx;
    let t = (key) => key;
    let kit = null;

    /** What the console has already been told, row by row: the last sentence sent for that row. */
    const toldTrouble = new Map();

    /**
     * The host's own sentence about every row that carries one, told to the console — once per new sentence.
     * It is called from every path a picture arrives by, because a sentence that changed while the wait ran
     * is the news that matters most.
     * @param {object | null} picture the picture that just arrived
     */
    function tellTroubles(picture) {
      for (const row of picture?.rows ?? []) {
        const told = row.trouble ?? null;
        if (told === null) continue;
        const server = row.server ?? row.id;
        const said = `${told.level}\u0000${told.text}`;
        if (toldTrouble.get(server) === said) continue;
        toldTrouble.set(server, said);
        kit.statusDetail(server, told.text);
      }
    }

    /** Every code this section can draw a sentence for: the plugin's own, the flow's, and the sign-in door's. */
    const KNOWN_FAULTS = [...REFUSALS, ...OAUTH_FAULTS, ...DOOR_FAULTS];

    /** The words of a refusal: the page's own for a code it knows, the host's message beside it. */
    function faultLines(code, message) {
      const known = KNOWN_FAULTS.includes(code);
      const words = known ? t(`fault.${code}`) : null;
      const detail = typeof message === 'string' && message !== '' && message !== words ? message : null;
      return [words ?? detail ?? String(code), ...words !== null && detail !== null ? [detail] : []];
    }

    /** The root of one row menu: a press outside it closes its list, a press inside it does not. */
    const MENU = '.coreness-mcp-menu';

    /**
     * How long the section follows a row by itself: fifteen reads a second apart, then five seconds apart,
     * and never more than sixty reads — the client's own retries are tens of seconds apart.
     */
    const SETTLE = {
      first: { everyMs: 1000, reads: 15 },
      then: { everyMs: 5000 },
      ceiling: 60,
    };

    /**
     * Whether the picture still holds something the user would see change on its own: a row in a transient
     * phase; an enabled row at rest with neither a tool nor a word yet; and a row whose word still waits on
     * the retry it names — the deadline the host puts beside the sentence is the one moment a read can end
     * it, and a read is the only way the page learns that it has.
     */
    function unsettled(picture) {
      const rows = picture?.rows ?? [];
      const trying = (row) => {
        const word = row.trouble ?? null;
        return word !== null && typeof word.due === 'number' && word.due > Date.now();
      };
      return rows.some((row) => row.phase === 'loading' || row.phase === 'unloading')
        || rows.some((row) => row.enabled === true && row.phase === 'active' && (row.tools ?? []).length === 0 && (row.trouble ?? null) === null)
        || rows.some((row) => row.enabled === true && trying(row));
    }

    /** The one object the parts reach each other through; the entry puts its own half in before any is made. */
    const shared = {
      ROUTE, PAGE_ROUTE, SEAT, ID, NS, KINDS, KIND_LABELS, reasonKey, MENU,
      SETTLE, unsettled, reasonOf, faultLines, tellTroubles, useStyles,
    };

    return {
      /** Register the section into the seat the page declares. */
      apply(pluginCtx) {
        ctx = pluginCtx;
        t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, 'en', EN), `${PACKAGE}: the MCP dictionary`);
        /* The seat is filled when the picker the editor draws, the page's own lifetime of an answer, the
           kit's door to the console and the five parts are in hand: every pull began when this chunk was
           materialised, and nothing stands in the rail before there is a section to draw. */
        ctx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([PICKER, HOLD, KIT, SIGNIN, CARD, FORM, DRAW, SECTION]).then(
            ([pickerModule, holdModule, kitModule, signinModule, cardModule, formModule, drawModule, sectionModule]) => {
              if (!live) return;
              kit = kitModule;
              /* The page has one beat, in the hold: the sign-in wait reads it there. */
              shared.SIGNIN_POLL_MS = holdModule.BEAT_MS;
              const parts = { t, kit, picker: pickerModule, hold: holdModule, ctx, shared };
              Object.assign(shared, signinModule.create(parts));
              Object.assign(shared, cardModule.create(parts));
              Object.assign(shared, formModule.create(parts));
              Object.assign(shared, drawModule.create(parts));
              const { McpSection } = sectionModule.create(parts);
              armed = ctx.slots.inject(SEAT, () => ctx.slots.register({
                name: SEAT,
                id: ID,
                order: 10,
                label: () => t('section'),
                locale: NS,
              }, McpSection));
            },
            (error) => {
              console.error(`${PACKAGE}: a chunk of the MCP section did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof armed === 'function') armed();
          };
        }, `${PACKAGE}: the picker, the hold and the MCP section`);
      },
    };
  },
});
