/**
 * The product's Qoder section: the token pasted once, the node the requests go to, and the state and the
 * models read from the platform's own doors.
 *
 * A package-local chunk beside the entry, pulled with the owner's own `require.async`, registering into the
 * seat the page declares under an id and a locale namespace of its own: the page never registers into its own
 * seat, so this rail row exists only because the chunk filled it.
 *
 * One value, two doors. Nothing here names the credential: the reference is read from the row the platform
 * already carries — the declared provider directory joined with the settings mirror's own value at that
 * row's settings path, which is where the profile records it — exactly the way the platform's own Models page
 * reads it. The state is the store's own answer, and never a second notion of "configured". The write goes
 * through the store's own door, the one the platform's own page writes through, and it is **confirmed by
 * reading the state back**: a call that returned without an error is not a change anybody made, and the words
 * of the outcome say which of the two happened. The clear is held to the same rule.
 *
 * The row's own settings are the second surface and the second door onto the same values: the model list, its
 * fallback window and the node are declared volatile in the plugin's schema — the platform's own claim that a
 * write reaches the running route without re-mounting it — and the settings mirror hands a page the volatile
 * fields alone. The section writes them with the revision it read, so a write that raced somebody else's is
 * refused as a conflict instead of overwriting it, and a write is confirmed the same way the token is: the
 * section is read again. A path this section writes and does not find in that answer is named rather than
 * attempted — the volatile form is the door, and a plain field would re-mount the row instead.
 *
 * One press asks for a node sweep over the route the host half registers for it: the plugin asks every node of
 * the map through its own signed transport, so a node counts as up only when it answers this account's
 * catalogue, and the answer names the node in use if it answered, else the first that did. The page then pins
 * that node — the sweep decides nothing by itself, and no half of this product writes the profile's patch.
 * The same route answers the catalogue, and that is where the models and their reasoning menus come from: the
 * vendor's own listing, with the menu each entry publishes.
 *
 * **Two vocabularies stand in one row, and they are not interchangeable.** The row's effort carries the
 * **vendor's** level — whatever the model's menu names — because that is what the wire is asked for; the page
 * offers exactly the menu the model publishes, plus our own `Off`. What the platform is told is a vocabulary
 * of its own: the route's own adapter declares its three names plus the level this row holds, because the
 * platform validates every effort it resolves against that declaration before any request leaves. The
 * platform's own model picker reads that declaration, which is why the level a row holds is declared there
 * and not translated away.
 */
window.__ModuleLoader__.load({
  id: '@coreness/dsh/client.provider.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/dsh';
    /** The seat the page declares for the sections of the plugins that come later. */
    const SEAT = 'coreness.section';
    /** This section's own id inside that seat, and the rail row the user clicks. */
    const ID = 'qoder';
    /** The locale namespace of this section's words: a namespace of its own, because a second
        registration of one namespace under one language throws. */
    const NS = 'coreness.qoder';
    /** The row's own id inside the seat, and the label the rail reads. */
    const ROUTE = 'qoder';
    /** The route the page reads this route's live facts through, and the three actions it answers. */
    const PROBE_ROUTE = '/api/coreness.qoder';
    const PROBE_ACTION = 'probe';
    /** The catalogue's own read: the vendor's listing with the reasoning menu every entry publishes. */
    const CATALOGUE_ACTION = 'catalogue';
    /**
     * The vendor's verdict on the value the store holds: one exchange, asked of the route and never of
     * the vendor from here. The page carries no token — the host half reads it through the row's own
     * reference — and the answer is a closed vocabulary of three, the one the route's own token check
     * answers by.
     */
    const VERIFY_ACTION = 'verify';
    /**
     * The row's own fields this section writes, by name: the model list, the fallback window and the
     * node. All three are volatile in the plugin's schema, which is what makes a write here apply to
     * the running route; a name missing from the settings mirror is named instead of attempted.
     */
    const WRITTEN_PATHS = ['models', 'defaultContextWindow', 'inferBase'];
    /**
     * The one level that is ours: no vendor menu publishes it — their own client expresses a switch-off
     * as a budget of zero — and this route carries it by leaving
     * the effort out of the body with the flag down. It stands in a
     * model's menu beside the levels that model publishes, marked as ours and not as the vendor's,
     * because a user who could not turn reasoning off would lose a capability the route has.
     */
    const OFF = { id: 'off', name: 'Off' };
    /**
     * The vendor's own scale, ascending, and the page's only rule about the menu it draws.
     *
     * It is a copy, and it is named as one: the scale is the route's own body half's (`VENDOR_EFFORTS`, read out of the
     * vendor's own budget map at byte 19043717). It orders this page's drawing and nothing else — the
     * effort a row names travels as it stands, and no level is substituted on the wire.
     * Here it answers a narrower question the catalogue cannot: the page has to *draw* a menu in a
     * settled order, and the vendor publishes it as an object whose keys carry no order at all —
     * the route's own `effortsOf` sorts only the default first.
     */
    const VENDOR_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'];
    /** Where the section's own reads start: the route, its credential and its models. */
    const ORDER = 20;
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/dsh/client.provider.js';
    const STYLE_ID = 'coreness-qoder-style';

    /** The host's announcements that invalidate what this section read. */
    const WATCHED = [
      'credentials/record-updated',
      'credentials/reference-updated',
      'settings/document-updated',
      'llm/adapters-updated',
    ];

    const EN = {
      section: 'Qoder',
      title: 'The Qoder route',
      intro: 'The provider this product ships: the state of its credential, the node its requests go to and the models it offers. The token is written to the platform\'s credential store under the reference the profile names, the route\'s own settings are written through the platform\'s settings section, and the platform\'s own Settings → Models is the other door to the same values.',
      'state.failed': 'The route could not be read',
      'state.undeclared': 'This profile declares no Qoder route, so there is nowhere here to keep a token',
      'state.undeclared.hint': 'Without the plugin that provides the route there is nothing to write a token to, and a place invented here would be one the route never reads.',
      'state.readonly': 'settings are read-only here',
      /* The route's own state word in the connection card: the tag that said "registered" left by the user's word,
         and the **opposite** state is news a reader cannot get anywhere else — a declared route that is not
         registered fails every request through it. One of the two words goes; this one stays. */
      'state.unregistered': 'The Qoder route is declared in this profile but not registered, so a request through it would fail',
      'state.unmounted': 'This profile does not carry the route\'s own settings section, so this page has nothing to read or write',
      'state.unwritable': 'This profile runs a route whose settings do not carry {fields}, so this page cannot write them: restart the application',
      /* The subject of a card's status: one word, ours, for what the sentence is about. It is never the
         credential reference and never a path — a fact about this configuration is not a fact about the
         reader's token (`STATUS_WORDS`). */
      'status.subject.token': 'Token',
      'status.subject.node': 'Node',
      'status.subject.models': 'Models',
      /* The accounts a status may not carry: they are said in the console, where a reader who needs them
         looks. Nothing is muted — what the face may not hold, the log holds. */
      'detail.accepted': 'The vendor accepted the value that is stored',
      'detail.refused': 'The vendor refused the stored value: {reason}',
      'detail.unsettled': 'The check settled nothing about the stored value: {reason}',
      'detail.noplace': 'This profile names no credential reference, so this section read no store',
      'detail.external': 'The value is supplied from outside this profile and cannot be changed here',
      'detail.node': 'The sweep pinned {node}, which offers {count} models',
      'credential.label': 'Connection',
      'field.token': 'Personal access token',
      'field.placeholder': 'Paste a Qoder PAT',
      'saveToken': 'Save token',
      'savingToken': 'Saving…',
      'clearToken': 'Clear token',
      'clearingToken': 'Clearing…',
      /* The three answers the vendor can give about the value the store holds, and the press that asks
         again. `refused` is the only one that is a statement about the token: an unreachable vendor, a
         queue, an exhausted allowance and a profile holding nothing are all `unsettled`, because a reader
         who read "refused" for a vendor that was merely down would go and replace a value nobody judged
         — the same rule the route's own token check answers by. */
      'token.check': 'Check token',
      'token.checking': 'Asking the vendor…',
      'fault.set': 'The credential store refused the value',
      'fault.clear': 'The credential store refused to clear the value',
      'fault.notsaved': 'The store took the call but the value is not there: reading it back says nothing is stored, so the save did not stand',
      'fault.notcleared': 'The store took the call but the value is still there: reading it back says a value is stored, so the clear did not stand',
      'node.map': 'from the node map',
      'node.check': 'Check node',
      'node.checking': 'Checking…',
      'node.failedNode': '{node} — {reason}',
      'refused.title': 'Nodes that did not answer',
      'models.label': 'Models',
      'models.none': 'The route offers no model in this profile yet',
            'models.effortLabel': 'Reasoning effort',
      /* The control offers the levels a model's own vendor publishes, and one level of ours. The words
         below are the states a menu can be in — nobody could read it, the model is not in the listing,
         the model publishes none, and the vendor has stopped publishing the level the row holds — and
         each one says what stands instead of leaving an empty list or inventing a level. */
      'models.effortOff': 'Off (ours)',
      'models.effortOurs': 'the vendor publishes no such level: Off is this route\'s own',
      'models.effortRow': 'the route\'s effort stands for this model: {effort}',
      'models.effortNoCatalogue': 'the vendor\'s levels could not be read: this model\'s own menu is unknown',
      'models.effortUnknownModel': 'this model is not in the vendor\'s live catalog: its levels are unknown',
      'models.effortNoMenu': 'this model publishes no reasoning levels: the effort travels as this row sets it',
          'models.note': 'Which of these the agent uses, and with what effort, is chosen on the platform\'s own Models page.',
      'models.failed': 'The catalogue could not be listed for this route',
      'models.model': 'Model',
      'models.window': 'Context window',
      'models.inputs': 'Inputs',
      'models.text': 'Text',
      'models.image': 'Image',
      'models.remove': 'Remove',
      /* The same word the limiter's own add control carries (`control.add`): both add a model, and a
         reader who meets the two sections one after the other must not be told they are different actions. The MCP
         section's `Add a row` is a different act — it adds a row of headings — and it keeps its own key and its own
         word. */
      'models.addRow': 'Add a model',
      'models.pick': 'Choose a model',
      'models.unknown': 'not in the live catalog',
      'models.catalogDown': 'live catalog unavailable',
      /* The one word the donor did not need: its section waited for the catalogue inside the read, so a
         picker that was locked was locked for as long as the whole section was absent. Here the section
         stands and the picker waits, and a wait that says nothing is a control that looks broken. */
      'models.readingCatalog': 'Reading the live catalog…',
      'models.windowInvalid': 'context window must be a number, optionally with a K or M suffix',
      'models.windowRequired': 'Context window is required',
      'models.idRequired': 'Model id is required',
      'models.idDuplicate': 'Model id repeats an earlier row',
      'models.conflict': 'the section changed elsewhere: the draft was not written, the fields show the section as it is now',
      'models.applying': 'Applying…',
      'models.windowNote': 'The fallback window is not edited here: a model id the row does not declare takes it, and Reset to defaults returns it to the patch.',
      'reset': 'Reset to defaults',
      'cancel': 'Cancel',
      'apply': 'Apply',
    };

    /* The host's own settings sheet, copied rule for rule and renamed, carried by its tokens alone —
       the same sheet the MCP section copies (the
       card, the field, the input, the buttons; the credential dot). One
       departure, named: the section's own block is a card with one field, so its actions stand under
       the field rather than in a row of the editor. */
    /**
     * The page's own picker, drawn where a value is chosen from a settled list. It lives in a chunk of
     * its own because three of the page's sections draw it, and this chunk pulls it
     * the way the entry pulls this one: a sibling file beside the entry, answered by the module system
     * and materialised once for the whole package.
     *
     * The pull starts at materialisation, so it is in flight while the section is still reading, and the
     * section is seated only once the control is in hand — `IdPicker` stands filled by the time anything
     * draws. A pull that failed is named on the console and seats nothing, which is the rule the entry
     * applies to a chunk that did not arrive: a section drawn without the control
     * it is made of would be a section half drawn, and silence about it would read as a section that
     * simply has no such field.
     */
    const picker = require.async('./client.picker.js');
    let IdPicker = null;
    /* The page's one lifetime for a temporary answer, pulled beside the picker and in hand before the section
       stands: a note whose hold was unknown would never go, and a fallback number written here would be the
       second copy this page deliberately does not have. */
    const hold = require.async('./client.hold.js');
    let holdOf = null;
    /* The page's one status surface, pulled beside them and in hand before the section stands: every card
       draws its status through `Status`, and the account a status may not carry leaves the face through
       `statusDetail`. The no-op is what stands if this chunk ever fails to arrive: the
       section registers only with all three in hand, so nothing is drawn through it before it is real. */
    const status = require.async('./client.status.js');
    /* Nothing is drawn through these before the three chunks are in hand: the section registers inside the
       `Promise.all` below, so its first render happens only once they are real. They are left unset rather
       than standing in for the component — a stand-in is either a silent substitute, which this page's law
       forbids, or, for a hook, a changed hook count, which is React's error #310 and a section the platform
       tears down. A call before the pull is a crash that names itself. */
    let statusNode;
    let statusMark;
    let useStatusStyles;
    let statusDetail;

    const CSS = `
.coreness-qoder-title{margin:0;font-size:16px;font-weight:500;line-height:24px;color:var(--dsw-alias-label-primary)}
.coreness-qoder-intro{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:14px;line-height:22px}
/* A hint line: the page's small role, one pair for it everywhere — 12/18 in label-tertiary. */
.coreness-qoder-dim{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}
.coreness-qoder-failed p{margin:0;font-size:14px;line-height:22px}
.coreness-qoder-card{border:.5px solid var(--dsw-alias-settings-card-stroke);background:var(--dsw-alias-settings-card-fill);border-radius:var(--dsw-radius-xl);flex-direction:column;gap:12px;margin-top:12px;padding:12px 14px;display:flex}
.coreness-qoder-card+.coreness-qoder-card{margin-top:8px}
.coreness-qoder-name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;flex:none}
/* The state area of a card: one sentence, to the right of the title, in room the header reserves whether
   or not anything stands in it. A state written under the controls makes the card grow and moves every
   block below it. A head never wraps: it is a title line, and the moment a state needs a second line a
   wrapped head would take one too, leaving the rows of a list at uneven heights and pushing what stands
   beside the title onto a line of its own — in a card, its own tag. The title, the mark and the tag keep
   their room; the state takes what is left and wraps inside it.
   The header reserves nothing and caps nothing: its height is the tallest line standing in it — a name's
   line is 22 px, a tag's 20, a line of state 18 — so a state of two lines stands 36 px by its own size
   rather than by a declaration, and a longer sentence wraps where it stands and grows the header, and
   with it the card. Measured before the ceiling existed: a 200-character catalogue refusal stood over 379×54 px
   and took its card from 1290 to 1308 and its head from 36 to 54, while the same slot at 25 and 71
   characters stood over 379×18 and 379×36 px with the card and the head unmoved, and the answer of a
   sweep stood over 419×18 px inside the node row without moving the card at all. The walk that prints
   every reading's boxes, run with the store seeded and without it, is what those numbers were read from. */
/* The header's own words keep their room: a title, a tag, the line that names a node. The status beside
   them is the one component's and brings its place rule and its own room with it,
   which is why this sheet has no status rule left: the two rules that stood here — the reserved height
   the user took off the page, and the wrap that replaced it — are properties of the component now. */
.coreness-qoder-head > .coreness-qoder-dim{flex:none}
/* A card's status is the one component's: its words, its tones and its place rule
   live there, and this sheet carries none of them. What stands here is the header's own furniture — a
   title, a tag, the line that names a node — while the mark and the sentence that answer for the state
   are drawn by the one component, on every card of this page alike. */
.coreness-qoder-tag{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-tertiary);flex:none;padding:1px 6px;font-size:12px;line-height:18px}
.coreness-qoder-line{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
/* In a card's header the line that names the node keeps its own room and no more: a state beside it may
   not squeeze it into a second line, which would grow the header — and the card — by that line. */
.coreness-qoder-card > .coreness-qoder-head > .coreness-qoder-line{flex:0 0 auto;max-width:42%}
.coreness-qoder-fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}
/* The exception the fold left standing, and the one rule this section keeps for the shared button: the Qoder's
   controls carry no ring of the page's. The shared ring would give every button here one, where today a keyboard
   reader meets the browser's own — a visible change of behaviour, so it is written down and left to the owner's
   word rather than made silently. The section's own scope is what makes this stand: it outranks the shared rule
   whatever order the two sheets happen to be read in. */
.coreness-qoder .coreness-qoder-button:focus-visible,.coreness-qoder .coreness-qoder-add:focus-visible{box-shadow:none;outline:revert}
.coreness-qoder-actions{justify-content:flex-start;gap:8px;display:flex}
.coreness-qoder-node{align-items:center;gap:8px;flex-wrap:wrap;display:flex}
/* The press stands right after the address it belongs to: nothing in this row is pushed to its right end and
   nothing stands between the two, so no answer arriving can move the press. A place rule here is what carries
   the press away from the address it belongs to — with margin-left:auto on the button the walk read it at
   1085,327, the row's own far right. */
.coreness-qoder-node > .coreness-qoder-line{flex:0 0 auto}
.coreness-qoder-model{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-lg);flex-direction:column;gap:10px;padding:12px 14px;display:flex}
/* The form's fields find their own columns and break where the room runs out — the columns are drawn by the grid
   and not fixed as the MCP's are — so the ten between them is a grid's distance, taken while the fields wrap. */
.coreness-qoder-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
/* The row of inputs below a field may break onto lines, and its distance is a line's own: the twelve is wider than
   a grid's six because a wrapping row is read as it goes, and the room it takes belongs to this chunk. */
.coreness-qoder-inputs{flex-wrap:wrap;align-items:center;gap:12px;display:flex}
/* The box and its word stand on one line, and the room between them is the page's own sibling number — the
   eight a row's parts keep — and not the six a label keeps above the control it names: a check is a part of
   the row it stands in, beside another part, and not a field's own column. */
.coreness-qoder-check{gap:8px;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary)}
.coreness-qoder-check input{margin:0}
/* The add control, a variant of the page's own add box: its hairline is .5px dashed where that box's is 1px, and that
   is the one property where the two differ. The radius, the stretch, the distance and the floor come from that box's
   class, which this control wears beside this one. Its hover, its disabled look, its ring and every other property come
   from the shared button class, which it wears too, so a change to either class reaches this control. */
.coreness-qoder-add{border:.5px dashed var(--dsw-alias-border-l3)}
.coreness-qoder-foot{justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;display:flex}
.coreness-qoder-button[data-align='start']{margin-right:auto}
/* The reasons a sweep's nodes gave stand in a block of their own, under every card: the list is as long
   as the node map, and a list of unknown length inside a card grows the card and moves every block under
   it. The gate keeps its own refusals the same way, in a block below its cards. */
.coreness-qoder-refused{flex-direction:column;gap:10px;margin-top:12px;min-width:0;display:flex}
/* What the refusals list adds to the page's own list: its rows are one-line reasons rather than rows of controls,
   so its rhythm is tighter — the 2 against the shared 8. */
.coreness-qoder-refusedList{gap:2px}
/* The first paint: the read is a round trip, and the section stands in the shape the answer will take
   before it lands — the two card frames, the sentences the section owns (they read the same before and
   after the read) and a bar where the read's own content will land: a value, an address, a control, a row.
   A bar wears the class of the part it stands for, so its box is that part's own rule and not a second
   number here: that part's padding, its hairline and one line of the type it carries. The two widths below
   stand for the parts that are as wide as their own words, and nothing depends on them — a bar is never
   flex:none, so it cannot push the card it waits in. The bars do not pulse: the wait they stand in is the
   platform's own round trip, and an animation would owe this sheet a stilling rule that the
   page's own reduced-motion rule does not give it. */
.coreness-qoder-skeleton{background:var(--dsw-alias-bg-skeleton,var(--dsw-alias-interactive-bg-hover));border-color:transparent;border-radius:var(--dsw-radius-xs);color:transparent}
/* The line a bar stands in for, which is what makes its box the part's box: a box with no content is its
   padding and its hairline alone, and the walk read that frame at 14 px where the control it wears stands
   at 36 (the Connection card's actions row and its field: 14 against 36, 38 against 60). So the bar carries
   one line of its own type and takes the part's box with it, the way the control's own height is derived
   from its padding and its line — the fixed declarations left this family at 468f7d2, and no number stands
   for either of them here. The line bar carries a height of its own below and this rule does not move it. */
.coreness-qoder-skeleton::before{content:'\\00a0'}
/* The height of the line this stands in for, and nothing else: .coreness-qoder-line is 14/22, so the swap from the
   skeleton to the words moves nothing. A width is its own business — it says how much text is coming. */
.coreness-qoder-skeleton.coreness-qoder-line{height:22px;width:220px}
.coreness-qoder-skeleton.coreness-qoder-button{width:120px}
`;

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

    /** The words of a refused remote call: the host's own code and message, never a paraphrase. */
    const refused = (answer) => `${answer.error.code}: ${answer.error.message}`;
    /** The message of a thrown value. */
    const reasonOf = (error) => (error instanceof Error ? error.message : String(error));

    /** A capacity as it is typed: a number, optionally in thousands or millions. */
    const CAPACITY = /^(\d+(?:\.\d+)?)([km])?$/i;

    /**
     * A capacity the user typed, or the reason it is not one.
     *
     * `undefined` is an empty field — the row then says nothing about the window, and the schema's own
     * default stands; `NaN` is a refusal the field is marked with. The donor's rule, kept whole: the
     * value is not weighed against the catalogue, because a window may be raised by hand and the
     * catalogue's own number is this row's declaration read back.
     */
    function parseCapacity(text) {
      const trimmed = String(text ?? '').trim();
      if (trimmed === '') return undefined;
      const match = CAPACITY.exec(trimmed);
      if (match === null) return Number.NaN;
      const scale = match[2] === undefined ? 1 : match[2].toLowerCase() === 'k' ? 1e3 : 1e6;
      const value = Number(match[1]) * scale;
      return Number.isInteger(value) ? value : Math.round(value);
    }

    /** A capacity as the donor wrote it: whole thousands and millions read as K and M. */
    function formatCapacity(value) {
      if (!Number.isInteger(value) || value <= 0) return '';
      if (value % 1e6 === 0) return `${value / 1e6}M`;
      if (value % 1e3 === 0) return `${value / 1e3}K`;
      return String(value);
    }

    /**
     * One row of the draft: the fields the section draws, with the window as the user types it.
     *
     * What this is handed is the section's own projection — the route's row joined with the live
     * catalogue and the current model (`state.models`, built in the read) — and not the row the settings
     * carry. The stored row travels on that projection as `stored`, the way the donor's draft keeps the
     * record it is handed: the page draws four of a row's
     * fields and a row may carry others — `maxTokens` today, and whatever the route adds next — and a
     * draft that kept only the drawn ones
     * would delete the rest on the first Apply.
     */
    function draftRow(entry) {
      return {
        stored: entry?.stored,
        id: typeof entry?.id === 'string' ? entry.id : '',
        name: typeof entry?.name === 'string' ? entry.name : '',
        window: formatCapacity(entry?.contextWindow),
        vision: entry?.vision !== false,
        /* The model's own effort, empty where the row names none: the control then shows what stands in
           force instead — the route's effort — and an untouched row keeps saying nothing about it. */
        effort: typeof entry?.effort === 'string' ? entry.effort : '',
      };
    }

    /**
     * The row a draft writes back.
     *
     * It starts from the stored row, as the donor's own builder does:
     * the page draws four of a row's fields and a row may carry others, so one rebuilt from the drawn
     * fields alone would delete what it never showed — `maxTokens` today, and whatever the route adds next.
     *
     * `vision` is written either way, unlike the donor's: its model schema left the field optional, so
     * an omitted key read back as "no claim", while ours defaults it to true — an omitted key would come
     * back checked, and a box that cannot be cleared is a lie. A name and a window the user emptied are
     * removed: the schema's own defaults stand for them, and the row says nothing it does not mean. With
     * the stored row underneath, "removed" has to be a deletion rather than a silence — hence the two
     * `delete`s. The effort is written as it stands, empty string included: that is the field's own word
     * for "this model names none", and the route's own schema stays what answers for it.
     */
    function storedRow(row) {
      const next = { ...row.stored, id: row.id.trim() };
      const name = row.name.trim();
      if (name === '') delete next.name;
      else next.name = name;
      const window = parseCapacity(row.window);
      if (window === undefined) delete next.contextWindow;
      else next.contextWindow = window;
      next.vision = row.vision === true;
      next.effort = row.effort === undefined ? '' : row.effort;
      return next;
    }

    /** The refusals of a draft, each naming the row it stands in. */
    function checkRows(rows) {
      const seen = new Set();
      const problems = [];
      rows.forEach((row, index) => {
        const id = row.id.trim();
        if (id === '') problems.push({ index, field: 'id', message: t('models.idRequired') });
        else if (seen.has(id)) problems.push({ index, field: 'id', message: t('models.idDuplicate') });
        else seen.add(id);
        /* An empty window is not a wrong number: it is no window at all, and the schema's own default would answer for a row that states none — while the row is a declaration to the platform's compaction trigger and a model must state the window it declares. The refusal stands here, where the value appears, so the bar goes off and the press is refused by name before a write can carry a row whose window was dropped. */
        if (String(row.window ?? '').trim() === '') problems.push({ index, field: 'window', message: t('models.windowRequired') });
        else if (Number.isNaN(parseCapacity(row.window))) problems.push({ index, field: 'window', message: t('models.windowInvalid') });
        /* The effort is deliberately not checked here any more. The levels a row may name are the ones
           its own model publishes, and the vendor may narrow that menu after the row was written: a
           refusal would leave the user with a row they cannot apply and a value nothing on this page can
           put back: the name travels as it stands whatever the menu names, so the wire is not the reason
           to refuse it either. The control says what
           stands instead, in its own value, and says nothing more about it: the user read that sentence as
           noise ("Раньше её не было. Зачем её добавили? Надо убрать"), and a level the vendor never
           published cannot enter the row at all — it is chosen from the model's own menu. */
      });
      return problems;
    }

    /**
     * The live catalogue of the vendor's own models, from the product's own route.
     *
     * The read is one action on the route the node sweep already stands on (`CATALOGUE_ACTION`), and it
     * answers the vendor's listing **with the reasoning menu every entry publishes** — which is what a
     * model row's control offers. The platform's own discovery door cannot carry that: its answer is
     * projected onto five fields twice over, in the service and again in the remote schema the browser is
     * handed, so the menu died between the route and the page.
     * The door stays registered for the platform's own model picker, which is the surface that adopts a
     * model; this page reads its own route, so one generation of the listing answers both the ids and
     * the menus and two roads cannot drift apart.
     *
     * A refusal is a message, never an empty picker that would read as "this vendor serves nothing".
     *
     * The answer carries the moment it was read (`at`), because the vendor's price multiplier travels with
     * the same listing and is a rate **in force when it was read**: the section draws it beside the model
     * and says when, rather than letting a remembered number read as today's. A read that answered nothing
     * carries no moment — no rate was read, and the state room names the refusal instead.
     */
    async function readCatalogue() {
      try {
        const answer = await fetch(PROBE_ROUTE, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: CATALOGUE_ACTION }),
        });
        if (!answer.ok) return { models: null, message: `${t('models.catalogDown')} (${PROBE_ROUTE} answered ${answer.status} ${answer.statusText})`, at: null };
        const payload = await answer.json();
        if (payload?.ok !== true) {
          const code = payload?.error?.code ?? 'UNKNOWN';
          /* The vendor's own detail stands in the card's body beside the state: what the face draws is the
             state, and the why is content. A route that published none draws exactly what it drew before. */
          const detail = payload?.error?.vendor;
          return { models: null, message: `${t('models.catalogDown')} (${code}: ${payload?.error?.message ?? 'refused'}${detail === undefined || detail === null ? '' : ` — ${detail}`})`, at: null };
        }
        const models = new Map();
        for (const entry of payload.value?.models ?? []) {
          if (typeof entry?.id === 'string' && entry.id !== '') models.set(entry.id, entry);
        }
        return { models, message: null, at: Date.now() };
      } catch (error) {
        return { models: null, message: `${t('models.catalogDown')} (${reasonOf(error)})`, at: null };
      }
    }

    /** The value inside a namespace at the row's own path, as the platform's page reads it. */
    function atPath(value, path) {
      let node = value;
      for (const step of path) {
        if (typeof node !== 'object' || node === null) return undefined;
        node = node[step];
      }
      return node;
    }

    /** Filled in `apply`: the plugin's own context, and the text of its namespace. */
    let ctx;
    let t = (key, params) => {
      const template = EN[key] ?? key;
      if (params === undefined) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
    };

    /**
     * Everything this section knows, read from the platform's own doors in the platform's own order:
     * the registered routes, the declared directory, the settings mirror (where the row's `apiKeyEnv`
     * stands), the store's answer about that reference, and the model catalogue.
     *
     * The reference is **read, never assumed**: a row that names none yields `ref: null` and no
     * `credentials/describe` call at all — a name invented here would be a name the route does not
     * read, which is a key stored where nothing looks for it.
     */
    async function readState(remote) {
      const failed = (answer) => ({ status: 'failed', reason: refused(answer) });

      const providers = await remote.llm.listProviders();
      if (!providers.ok) return failed(providers);
      const directory = await remote.llm.listConfigurableProviders();
      if (!directory.ok) return failed(directory);

      const declared = directory.value.find((one) => one.provider === ROUTE);
      const live = providers.value.some((one) => one.id === ROUTE);
      /* Neither registered nor declared: this profile does not carry the route at all, and there is
         no reference anywhere for this section to write to. */
      if (declared === undefined && !live) return { status: 'undeclared' };

      const settings = await remote.settings.describe();
      if (!settings.ok) return failed(settings);
      /* The reference stands where the platform's own Models page reads it: the declared row's own
         settings namespace, at its own path. A route that is registered but declares no namespace
         carries no reference a page may read, and the section says so rather than inventing the
         derived name the platform would fall back to — a key stored there is a key the route does
         not read. */
      const view = declared === undefined
        ? undefined
        : settings.value.namespaces.find((one) => one.ns === declared.settingsNs);
      const profile = view === undefined ? undefined : atPath(view.value, declared.settingsPath ?? []);
      const named = profile?.apiKeyEnv;
      const ref = typeof named === 'string' && named !== '' ? named : null;

      let credential = null;
      if (ref !== null) {
        const described = await remote.credentials.describe([ref]);
        if (!described.ok) return failed(described);
        credential = described.value[ref] ?? null;
      }

      const catalog = await remote.session.modelCatalog();
      const group = catalog.ok ? catalog.value.groups.find((one) => one.id === ROUTE) ?? null : null;
      const failure = catalog.ok ? catalog.value.failures.find((one) => one.id === ROUTE) ?? null : null;

      /* The row's own settings, from the same read: the platform's settings mirror carries a writer a
         form at all only for the fields whose writes apply to the running row without re-mounting it,
         which is why a path this section writes and does not
         find in that answer is named rather than attempted — a write to a plain field would rebuild
         the route, and one to a path the schema does not declare would be refused after the press. */
      /* The live catalogue is read in its own round trip and never inside this one: it is the vendor's
       own door, and a section that waited for it would hold the credential and the node behind a node
       that may be slow — or, with the reference unset, behind a credential that does not exist. What
       stands here is "not read yet", which the card names while it draws the picker locked. */
    const catalogue = { models: null, message: null, at: null };
      const declaredRows = Array.isArray(profile?.models) ? profile.models : [];
      /* The effort the row itself asks for, from the same read: the control shows it for a model that names none of
         its own. Nothing is defaulted here — the user took the schema's own default off the wire, so a row that
         names nothing answers `null` and is drawn as naming nothing. */
      const rowEffort = typeof profile?.reasoningEffort === 'string' && profile.reasoningEffort !== '' ? profile.reasoningEffort : null;
      const known = new Map((group?.models ?? []).map((model) => [model.id, model]));
      const models = declaredRows.map((row) => {
        const model = known.get(row.id);
        return {
          /* The row the settings hold, carried whole beside the drawn fields: the form draws four of
             them, and what it did not draw is put back as it was by the write (`draftRow`/`storedRow`). */
          stored: row,
          id: row.id,
          /* What the row itself declares: an empty name stays empty, and the field shows a placeholder
             instead of a value nobody typed — a filled field would be written back as a declaration. */
          name: typeof row.name === 'string' ? row.name : '',
          contextWindow: Number.isInteger(row.contextWindow) ? row.contextWindow : undefined,
          vision: row.vision !== false,
          description: model?.description ?? null,
          listed: model !== undefined,
          /* The model's own setting, read from the row the platform mirrors — and **not** the effort in
             force, which is a different fact: this field is what the section writes, so a draft built
             from it says what the row says and nothing else. An empty string means the row names none. */
          effort: typeof row.effort === 'string' ? row.effort : '',
        };
      });

      return {
        status: 'ready',
        live,
        ref,
        credential,
        /* A row that is declared and whose namespace the mirror does not carry is a fact of its own:
           there is no form to read and nothing to write. A route that is registered with no row at all
           is not that case — it is named by the reference line, where a row would have named one. */
        unmounted: declared !== undefined && view === undefined,
        settings: view === undefined
          ? null
          : {
            ns: declared.settingsNs,
            path: declared.settingsPath ?? [],
            revision: view.revision,
            writable: settings.value.writable === true,
            missing: WRITTEN_PATHS.filter((name) => !Object.hasOwn(profile ?? {}, name)),
          },
        ns: declared?.settingsNs ?? null,
        /* What stands in force for a model that names no effort of its own: the row's own answer. */
        rowEffort,
        node: typeof profile?.inferBase === 'string' && profile.inferBase !== '' ? profile.inferBase : null,
        models,
        catalogue,
        failure: catalog.ok ? failure : { id: ROUTE, name: ROUTE, message: refused(catalog) },
      };
    }

    /**
     * The write through the store's own door, and nothing else: what stands after it is the section's
     * own read (`read`), and that **one** answer is what both the strip and the line beside the field
     * are drawn from. A second read here would be a second answer about one value — the store's silence
     * about a value it does not hold is how a save that never stood looks, and two reads of the same
     * door can say that and its opposite at the same time, which is what the reader saw.
     */
    async function saveCredential(remote, ref, value) {
      const written = await remote.credentials.set(ref, value);
      if (!written.ok) return { fault: `${t('fault.set')} — ${refused(written)}` };
      return { fault: null };
    }

    /**
     * The clear through the store's own door. `credentials/unset` is the door that takes a value away,
     * the one the platform's own Models page writes through, and the section's own read is
     * what says the value is gone — one read, the same one the strip is drawn from. A store that
     * answered without an error and still holds the value is exactly how a clear that never stood looks.
     */
    async function clearCredential(remote, ref) {
      const cleared = await remote.credentials.unset(ref);
      if (!cleared.ok) return { fault: `${t('fault.clear')} — ${refused(cleared)}` };
      return { fault: null };
    }

    /**
     * The other write: a value of the row's own settings, through the platform's settings service.
     *
     * The revision the section read travels with the call, so a write that raced somebody else's is
     * refused as a conflict instead of overwriting it, and the caller reads the section again — the
     * call's own word about what it wrote is never the section's state.
     */
    async function writeSettings(remote, settings, ops) {
      const written = await remote.settings.mutate(settings.ns, ops, settings.revision);
      if (!written.ok) {
        const conflict = written.error.code === 'settings/conflict';
        return { wrote: false, conflict, fault: conflict ? t('models.conflict') : refused(written) };
      }
      return { wrote: true, conflict: false, fault: null, revision: written.value?.revision ?? null };
    }

    /**
     * One node sweep, asked of the route the host half registers beside the credit one.
     *
     * The sweep signs and times every node itself, so the page asks once and draws the whole answer:
     * the state of each node of the map, and the node the sweep would pin — the one in use if it
     * answered, else the first that did. A refusal of the route is read, not guessed from a status,
     * the same way the credit card reads its own.
     */
    async function askSweep() {
      const answer = await fetch(PROBE_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: PROBE_ACTION }),
      });
      if (!answer.ok) throw new Error(`${PROBE_ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${PROBE_ROUTE} refused the sweep`);
      return payload.value;
    }

    /**
     * One question to the vendor about the value the store holds: does it accept it.
     *
     * The store can only say that a value is *there*, and a token that expired or was revoked reads as
     * configured until a turn fails — which is what sent the owner to replace a token that was never at
     * fault. So the value is put to the vendor, through the route the host half registers: one exchange,
     * asked when a value is handed over or when the reader presses again, and never on a tick.
     *
     * The page asks and does not judge: the answer is the route's own closed vocabulary, and anything
     * that is not the vendor's statement about this value — a route that cannot be reached, an answer
     * that is not a verdict — is the third state with its reason, because "the vendor refused it" sends a
     * reader to replace a value nobody judged.
     * @returns {Promise<{outcome: string, code: string|null, reason: string|null}>} the verdict
     */
    async function askVerify() {
      try {
        const answer = await fetch(PROBE_ROUTE, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: VERIFY_ACTION }),
        });
        if (!answer.ok) return { outcome: 'unsettled', code: null, reason: `${PROBE_ROUTE} answered ${answer.status} ${answer.statusText}` };
        const payload = await answer.json();
        if (payload?.ok !== true) return { outcome: 'unsettled', code: null, reason: payload?.error?.message ?? `${PROBE_ROUTE} refused the check` };
        const verdict = payload.value;
        if (verdict === null || typeof verdict?.outcome !== 'string') return { outcome: 'unsettled', code: null, reason: `${PROBE_ROUTE} answered no verdict` };
        return verdict;
      } catch (error) {
        return { outcome: 'unsettled', code: null, reason: reasonOf(error) };
      }
    }

    /**
     * The word the stored value itself carries: whether the store holds one, and where it came from.
     *
     * A verdict is a fact about a value, not news of a press, and it stands while that value is the one it
     * was said about. The store never shows the value — `credentials/describe` answers `CredentialInfo
     * {configured, source, …}` — so this is the finest word there is: two values the store
     * holds alike read alike, and only the reader's own next act can tell them apart.
     */
    const credentialWord = (credential) => `${credential?.configured === true ? 'set' : 'unset'}/${credential?.source ?? 'none'}`;

    /**
     * The verdict as the card's status: `accepted` in green, `refused` in red, and — where the check settled
     * nothing — `set`, the durable truth about the value.
     *
     * The account is said here, where the answer arrives, and not where the status is drawn: a check that
     * learned nothing is said every time it is made, never only on the first. Its sentence is the console's
     * alone: `set` is a state a reader is simply in, and the card keeps no word for it on the user's word —
     * the dot beside the name says that state, out loud, and a check that settled nothing leaves it as it
     * was. The stamp is the word the stored value carries while this verdict stands, which is what ends
     * its life when the store's own word changes.
     * @param {{outcome: string, reason?: string|null}} verdict the route's answer
     * @param {string} stamp the word the stored value carries while this verdict stands
     * @returns {object} the note
     */
    function verdictNote(verdict, stamp) {
      /* The vendor's own detail joins the reason here and nowhere a face draws: this string is the note's
         detail, which is never drawn, and the console line the reason door writes. */
      const reason = [verdict.reason ?? '', verdict.vendor ?? ''].filter((one) => one !== '').join(' — ');
      const said = verdict.outcome === 'accepted'
        ? t('detail.accepted')
        : verdict.outcome === 'refused' ? t('detail.refused', { reason }) : t('detail.unsettled', { reason });
      statusDetail(t('status.subject.token'), said);
      if (verdict.outcome === 'accepted') return { where: 'credential', value: 'accepted', detail: said, stamp };
      return verdict.outcome === 'refused'
        ? { where: 'credential', value: 'refused', detail: said, stamp }
        : { where: 'credential', value: 'set', detail: said, stamp };
    }

    /** The node the requests go to, or the map that answers for it. */
    function nodeLine(view) {
      return h('span', { key: 'where', className: 'coreness-qoder-line', 'data-node': view.node ?? '' }, view.node ?? t('node.map'));
    }

    /** The moment a read answered, as a clock: the price line names when the vendor's rates were read. */

    /**
     * The vendor's multiplier as the reader reads it: a plain ASCII `x`, one decimal always (`0.1x`, `1.0x`,
     * `2.0x`, `0.0x`) — the vendor's own number and never a word for it, so its zero reads as a zero and not
     * as "free". A number the vendor ever publishes with more decimals travels as it arrived: rounding a rate
     * would be a number of ours standing where the vendor's own belongs.
     */
    const rateWords = (factor) => Number.isFinite(factor) ? `${Number.isInteger(factor) ? factor.toFixed(1) : String(factor)}x` : null;

    /**
     * The words one option of the model picker carries: the vendor's own name for the model, the host's own
     * separator, and the price multiplier the same answer published — the number as it arrived, never derived
     * here (the route's own `priceFactor`; an entry the vendor priced nothing carries no field, and then the name
     * stands alone).
     *
     * The wire id comes back **only where two entries of one listing share a name**: the row's key and the
     * value that goes to the vendor stay the id, and a list whose two lines read the same would be a choice
     * nobody can make. A model the listing does not carry is drawn by its id, which is the only name it has.
     */
    const optionWords = (entry, clashing) => {
      const name = typeof entry.name === 'string' && entry.name !== '' ? entry.name : entry.id;
      const rate = rateWords(entry.priceFactor);
      const label = rate === null ? name : `${name} · ${rate}`;
      return clashing ? `${label} (${entry.id})` : label;
    }

    /** The names two entries of one listing share, so the id can come back for exactly those. */
    const clashingNames = (catalogue) => {
      const seen = new Set();
      const clashing = new Set();
      for (const one of catalogue?.values() ?? []) {
        const name = typeof one.name === 'string' && one.name !== '' ? one.name : one.id;
        if (seen.has(name)) clashing.add(name);
        seen.add(name);
      }
      return clashing;
    }

    /**
     * The names this page writes, in the words the cards use for them: a refusal that names the row's
     * own config paths would put the plumbing on the surface, and a reader cannot act on a key name.
     */
    const FIELD_WORDS = {
      models: 'Models',
      inferBase: 'Node',
      defaultContextWindow: 'the fallback window',
    }
    const fieldWords = (names) => names.map((name) => FIELD_WORDS[name] ?? name).join(', ')

    /** The section: the state read when it mounts, the token, the node, and the models' own editor. */
    /* Which settings read is the newest. The section has one instance on the page and the chunks carry
       no `useRef`, so the ticket lives beside the component. A read that comes back after a newer one
       has started is still handed to whoever asked for it — a caller that awaited it uses its view —
       but it no longer publishes: the section under the reader's eyes is always the newest read's, and
       a stale answer never drops the draft being typed in. */
    let readTicket = 0;

    /**
     * What this section last read, and the moment it read it.
     *
     * The browser half is materialised once per application session, so a section that is left and entered
     * again has this beside it — the same place the read ticket lives, and for the same reason: the page
     * carries no `useRef`, and the component is not the owner of the session. A mount paints it at once and
     * the read corrects it behind; the session's *first* mount has nothing and keeps the honest skeleton,
     * because a skeleton is the truth when nothing is known. It holds a read picture and never the visit's
     * own state — the draft, the open row, the news of a press — which is not knowledge of the route.
     */
    let lastRead = null;

    function QoderSection() {
      const [state, setState] = React.useState(lastRead === null ? { status: 'loading', view: null, reason: null } : lastRead.state);
      /* The section's sheet, ensured where the section is drawn: the platform's own replace re-mounts a
         plugin over the module table it already has and takes the package's style tags with it, so the mount
         is the one place a sheet can be put back. */
      useStyles();
      useStatusStyles();
      const [field, setField] = React.useState('');
      /* Which action is in flight, or null: the token buttons, the node press and the models write draw
         from it, and two writes never stand over one another. */
      const [busy, setBusy] = React.useState(null);
      const [note, setNote] = React.useState(null);
      /* The last sweep's answer, whole: the state of every node the route asked and the node it would
         pin. The pin itself is not taken from here — it is read back from the settings section. */
      const [sweep, setSweep] = React.useState(null);
      const [draft, setDraft] = React.useState(null);

      const take = (view) => {
        /* The vendor's live catalogue is not part of this read and is kept across every re-read of the
           settings: a write of the list must not lock the picker it was written from, and the catalogue
           is the node's own answer, which no write of ours changes. A read about another row starts from
           that read's own placeholder. */
        setState((current) => ({
          status: 'ready',
          reason: null,
          view: current.view === null || current.view.ns !== view.ns
            ? view
            : { ...view, catalogue: current.view.catalogue },
        }));
        /* Every read drops the draft: what the fields show after a write is the section, not what was
           typed before it. */
        setDraft(null);
      };

      /* One door for the settings read, so every reader is ticketed the same way: `readState` is asked
         here and nowhere else, and the publish is the ticket's to allow. */
      const read = async () => {
        const ticket = ++readTicket;
        const view = await readState(ctx.remote);
        if (ticket === readTicket) take(view);
        return view;
      };

      /* The picture goes into the session's memory as it is published, so the next mount of this section
         paints it at once. Only a read that answered is remembered: a skeleton is not knowledge, and a mount
         that failed to read keeps what stands and names the reason, as it always did. */
      React.useEffect(() => {
        if (state.status === 'ready') lastRead = { state, at: Date.now() };
      }, [state]);

      /* A note stands for its own hold and then goes, and the card's own state takes the place back: a new
         press drops it at once (every action starts with `setNote(null)`) and nothing else renews it. A note
         that carries a `stamp` is not news of a press but what the vendor said about the value that stands,
         and its life is that value rather than the hold (the effect below). */
      React.useEffect(() => {
        if (note === null || note.stamp !== undefined) return undefined;
        const timer = setTimeout(() => setNote(null), holdOf());
        return () => clearTimeout(timer);
      }, [note]);

      /* A verdict is not news of a press: it is what the vendor said about the value that stands, and it
         stands while that value is the one it was said about. It goes when the store's own word changes,
         or on the reader's next act, and nothing else takes it away. */
      React.useEffect(() => {
        if (note === null || note.stamp === undefined) return;
        if (note.stamp !== credentialWord(state.view?.credential)) setNote(null);
      }, [state.view?.credential]);

      /* The section draws on the platform's own doors alone, and the vendor's live catalogue follows in
         its own round trip: it is asked once per mount. A vendor that has added a model since the last
         mount is read on the next one — asking again on every announcement would put a request to the
         vendor behind every unrelated write in the product. */
      React.useEffect(() => {
        let live = true;
        /* The section first, the vendor's live catalogue second: the read above holds the platform's own
           doors, and this one is a round trip to the vendor that the cards do not wait for. The answer is
           patched into the read it belongs to, so a stale answer about another row never replaces a newer
           one — and the draft the user is typing in is left where it stands. */
        const start = async () => {
          try {
            const view = await read();
            if (!live) return;
            const answer = await readCatalogue();
            if (!live) return;
            setState((current) => current.view === null || current.view.ns !== view.ns
              ? current
              : { status: current.status, reason: current.reason, view: { ...current.view, catalogue: answer } });
          } catch (error) {
            /* A read that fails keeps the section the user is reading: the reason stands in the state
               area beside the rows, and only a first read — which has nothing to keep — is replaced by
               it. A failed read that emptied the section would take away what the reader had in front
               of them because a later read went wrong. */
            if (live) setState((current) => ({ status: 'failed', view: current.view, reason: reasonOf(error) }));
          }
        };
        void start();
        return () => {
          live = false;
        };
      }, []);

      /* The value has two doors: a change made on the platform's own Settings → Models page is the
         host's own announcement, and this section reads again on it, as that page does. */
      React.useEffect(() => {
        const reread = async () => {
          try {
            await read();
          } catch (error) {
            /* As the mount's own read: the reason stands beside the rows the reader already has. */
            setState((current) => ({ status: 'failed', view: current.view, reason: reasonOf(error) }));
          }
        };
        const disposers = WATCHED.map((name) => ctx.remote.$on(name, reread));
        const offReset = ctx.on('connection/reset', reread);
        return () => {
          for (const dispose of disposers) dispose();
          offReset();
        };
      }, []);

      /**
       * The press that asks the vendor about the value that stands.
       *
       * Nothing is written: the answer is news and nothing else. It is the second moment this check runs —
       * the first is a write — and it exists because a value goes bad *after* it was stored: without it
       * the only way to ask would be to write the same value again.
       */
      const verify = async () => {
        setBusy('verify');
        setNote(null);
        try {
          setNote(verdictNote(await askVerify(), credentialWord(state.view?.credential)));
        } finally {
          setBusy(null);
        }
      };

      /**
       * The token: written through the store, then read back through the store, and then put to the vendor.
       * @returns {Promise<void>}
       */
      const save = async () => {
        const view = state.view;
        if (view === null || view.ref === null) return;
        /* An empty field is not a write: the button stands disabled while the field is empty, so this
           guard is the second door of the same rule — a stray keypress writes nothing. */
        if (field === '') return;
        setBusy('token');
        setNote(null);
        try {
          const outcome = await saveCredential(ctx.remote, view.ref, field);
          setField('');
          /* One read answers both questions. The strip's word and the word beside the field are drawn
             from the same answer about the same reference, so the card cannot say two things at once —
             and it is read *after* the write, because the verdict is stamped with the word this answer
             gives: stamped with the older one it would be dropped by its own effect the moment it was
             drawn. */
          const after = await read();
          /* What the store did and what the vendor says are two facts, and the reader handed the value
             over to learn the second: the store's own word stands first, and the verdict replaces it. No
             check runs where the store did not take the value — there is nothing to put to anyone. */
          if (outcome.fault !== null) {
            setNote({ where: 'credential', value: 'unsaved', detail: outcome.fault });
          } else {
            const took = after.credential?.configured === true;
            /* A note about a value lives while that value stands: the stamp is the word this write read
               back, the same word the effect below compares against, so the note dies exactly when a later
               read contradicts it and not before. A write's note had no stamp — a save outlived the read
               that said the store was empty, which is the other half of the same design. */
            setNote(took
              ? { where: 'credential', value: 'saved', stamp: credentialWord(after.credential) }
              : { where: 'credential', value: 'unsaved', detail: t('fault.notsaved') });
            /* The write is over and the check begins: the press that says "saving" is not the press that is
               asking the vendor, and the control a reader watches while the exchange is on the wire is the
               check's own — one busy, and its word stands on the control that answers for it. */
            if (took) {
              setBusy('verify');
              setNote(verdictNote(await askVerify(), credentialWord(after.credential)));
            }
          }
        } catch (error) {
          setNote({ where: 'credential', value: 'unsaved', detail: `${t('fault.set')} — ${reasonOf(error)}` });
        } finally {
          setBusy(null);
        }
      };

      /** The clear: the store's own door, and the same confirmation — the state read back. */
      const clear = async () => {
        const view = state.view;
        if (view === null || view.ref === null) return;
        setBusy('token');
        setNote(null);
        try {
          const outcome = await clearCredential(ctx.remote, view.ref);
          /* The same one read: the clear is confirmed by the state the section reads back, and the strip
             says what that answer says — never the call's own word about itself. */
          const after = await read();
          if (outcome.fault !== null) setNote({ where: 'credential', value: 'unsaved', detail: outcome.fault });
          else if (after.credential?.configured === true) setNote({ where: 'credential', value: 'unsaved', detail: t('fault.notcleared') });
          else setNote({ where: 'credential', value: 'unset', stamp: credentialWord(after.credential) });
        } catch (error) {
          setNote({ where: 'credential', value: 'unsaved', detail: `${t('fault.clear')} — ${reasonOf(error)}` });
        } finally {
          setBusy(null);
        }
      };

      /**
       * One press: the nodes are asked, and the one that answered is pinned — then the section is read
       * again, because the answer about a pin is the settings section's own value and nothing else.
       *
       * A home where nothing may be written says so before the attempt rather than after it: the
       * refusal is the platform's own, and it costs a round trip to learn otherwise.
       */
      const check = async () => {
        const view = state.view;
        if (view === null || view.status !== 'ready' || view.settings === null) return;
        if (view.settings.missing.length > 0) {
          /* The fields a row is missing are named the way the cards name them, and it is the **models**
             card that states it: `models` and `defaultContextWindow` are the list's own fields, and a note
             addressed to the node left that card silent about a write it would have refused. */
          setNote({ where: 'models', value: 'unsaved', detail: t('state.unwritable', { fields: fieldWords(view.settings.missing) }) });
          return;
        }
        if (view.settings.writable !== true) {
          /* Not a failed write: the surface itself cannot be changed here, and the row says so while the
             reason stays the console's. The second of the two places that recorded a fact which is not a
             write as one — invisible until now because the word it produced was plausible. */
          setNote({ where: 'node', value: 'unwritable', detail: t('state.readonly') });
          return;
        }
        setBusy('check');
        setNote(null);
        setSweep(null);
        /* The answer is **news of this press**, so it is a note like the two refusals above and like every
           other press's word in this section: it stands for the page's own hold and goes with it (the
           effect above). The record set beside it — `setSweep` — keeps what the sweep found for the reasons
           list under the cards and for the row's own address, and states no word of its own. */
        const news = (answer) => {
          const said = sweepAccount(answer);
          return said === null ? { where: 'node', value: 'unanswered' } : { where: 'node', value: 'answered', detail: said };
        };
        try {
          const answer = await askSweep();
          setSweep(answer);
          /* The node in use answered: there is nothing to pin, and the sweep's own answer is the news this
             press made. Every other outcome — the first node that answered, or none — is the sweep's. */
          if (answer.pin === null || answer.pin === view.node) {
            setNote(news(answer));
            return;
          }
          const written = await writeSettings(ctx.remote, view.settings, [
            { op: 'set', path: [...view.settings.path, 'inferBase'], value: answer.pin },
          ]);
          if (!written.wrote) {
            setNote({ where: 'node', value: 'unsaved', detail: written.fault });
            return;
          }
          /* A pin needs no word of its own: the node that answered is written into the row, and the row's
             own node line changes to it — the confirmation is the address the reader watches. The answer
             still stands beside it as this press's news, for its own hold. */
          setNote(news(answer));
          await read();
        } catch (error) {
          /* A sweep is not a write: the route's words are the console's, and what stands on the face is
             this press's news — the sweep found nobody, which is what the reasons list under the card says
             in full. This site used to set a note naming a failed save, which made the row say "Node was
             not saved" about something nobody tried to save — a source defect the migration found. */
          statusDetail(t('status.subject.node'), reasonOf(error));
          /* The refusal is a sweep that answered nobody, recorded as one: null keeps its single meaning —
             nobody has asked — and the record has something to say about a sweep that was tried. */
          setSweep({ pin: null, nodes: [] });
          setNote({ where: 'node', value: 'unanswered' });
        } finally {
          setBusy(null);
        }
      };

      /* The editor's own draft: built from the read rows the first time a field or a button is touched,
         and dropped by every read. */
      const editing = draft ?? (state.view?.status === 'ready' ? state.view.models.map(draftRow) : []);

      const patchRow = (index, fields) => {
        setNote(null);
        setDraft(editing.map((row, at) => (at === index ? { ...row, ...fields } : row)));
      };

      /**
       * Choosing a model from the live catalogue: the name is filled from the same answer the id comes
       * from, because the vendor names a model differently in its menu than on the wire. An entry
       * without a name leaves the id standing — an empty name field would read as a forgotten one.
       */
      const chooseModel = (index, id) => {
        const entry = state.view?.status === 'ready' ? state.view.catalogue.models?.get(id) : undefined;
        patchRow(index, { id, name: typeof entry?.name === 'string' && entry.name !== '' ? entry.name : id });
      };

      const addRow = () => {
        setNote(null);
        /* A new row names no effort, and the route's own effort answers for it until one is chosen: the
           row carries no model yet, so there is no menu to choose from, and a row that names nothing
           sends that name, which travels as it stands. Naming a level here would be a claim about a model this row does not carry yet. */
        setDraft([...editing, draftRow({ id: '' })]);
      };

      const removeRow = (index) => {
        setNote(null);
        setDraft(editing.filter((_row, at) => at !== index));
      };

      /** Drop the draft: the fields show the section as it was read. */
      const cancel = () => {
        setNote(null);
        setDraft(null);
      };

      /**
       * Write the list: one `set` of the row's `models`, with the revision this section read. A row
       * carries its own window and its own effort (`storedRow`); the fallback window a model id the row
       * does not declare takes is not this write's business — `Reset to defaults` unsets it.
       */
      const apply = async () => {
        const view = state.view;
        if (view === null || view.status !== 'ready' || view.settings === null || draft === null) return;
        const problems = checkRows(editing);
        if (problems.length > 0) {
          setNote({ where: 'models', value: 'unsaved', detail: problems[0].message });
          return;
        }
        setBusy('models');
        setNote(null);
        try {
          const written = await writeSettings(ctx.remote, view.settings, [
            { op: 'set', path: [...view.settings.path, 'models'], value: editing.map(storedRow) },
          ]);
          if (!written.wrote) {
            setNote({ where: 'models', value: 'unsaved', detail: written.fault });
            /* A conflict is the platform's own refusal and the section moved under the draft: the
               fields are shown the section as it stands now, as that sentence promises. */
            if (written.conflict === true) await read();
            return;
          }
          setNote({ where: 'models', value: 'saved' });
          await read();
        } catch (error) {
          setNote({ where: 'models', value: 'unsaved', detail: reasonOf(error) });
        } finally {
          setBusy(null);
        }
      };

      /** Return the list and the fallback window to what the patch says. */
      const reset = async () => {
        const view = state.view;
        if (view === null || view.status !== 'ready' || view.settings === null) return;
        if (view.settings.missing.length > 0) {
          setNote({ where: 'models', value: 'unsaved', detail: t('state.unwritable', { fields: fieldWords(view.settings.missing) }) });
          return;
        }
        if (view.settings.writable !== true) {
          setNote({ where: 'models', value: 'unsaved', detail: t('state.readonly') });
          return;
        }
        setBusy('models');
        setNote(null);
        try {
          const written = await writeSettings(ctx.remote, view.settings, [
            { op: 'unset', path: [...view.settings.path, 'models'] },
            { op: 'unset', path: [...view.settings.path, 'defaultContextWindow'] },
          ]);
          if (!written.wrote) {
            setNote({ where: 'models', value: 'unsaved', detail: written.fault });
            return;
          }
          setNote({ where: 'models', value: 'saved' });
          await read();
        } catch (error) {
          setNote({ where: 'models', value: 'unsaved', detail: reasonOf(error) });
        } finally {
          setBusy(null);
        }
      };

      /* One object, built once per render and read twice: the drawing and the account both ask `statusOf`
         of it, so a card cannot say one thing while the log is told another. */
      const picture = {
        status: state.status,
        view: state.view,
        reason: state.reason,
        field,
        busy,
        note,
        sweep,
        draft: state.view?.status === 'ready' ? (draft === null ? null : editing) : null,
      };
      /* The account of a state that stands — a failed read, fields this row does not carry, a reference
         nobody named, a node that did not answer — goes to the console with the state it belongs to. It is
         a hook of the component and not of `draw`: `draw` returns early in four of the states it draws, so a
         hook inside it is called by the cards and not by the frames of the wait, and React counts the hooks
         of one mount and refuses a render that calls a different number (error #310) — which is how the live
         page lost this whole section while every check reading the drawn tree stayed green. A press's own
         answer is said where it is made (`verdictNote` and the actions), so an attempt is said every time it
         is made rather than once per state; the object is built fresh each render, so the account follows
         every render and a state learned by any door reaches the console. */
      React.useEffect(() => {
        for (const where of ['credential', 'node', 'models']) {
          const one = statusOf(picture, where);
          if (one.detail !== undefined && one.detail !== null) statusDetail(one.subject, one.detail);
        }
      }, [picture]);

      return draw(picture, {
        patch: (value) => {
          setNote(null);
          setField(value);
        },
        save,
        clear,
        verify,
        check,
        patchRow,
        chooseModel,
        addRow,
        removeRow,
        cancel,
        apply,
        reset,
      });
    }

    /**
     * The levels one model's row offers, and what the menu itself has to say.
     *
     * The list is that model's own menu, in the vendor's ascending order: the catalogue publishes it as an
     * object whose keys carry no order at all, and a menu drawn in whatever order two reads happened to give
     * would move under the reader's hand. Beside the menu stand exactly two things — the level that stands for
     * this row when the menu does not name it, and our own `Off` — and nothing else: a level the vendor does
     * not publish is not invented here, and the platform's own three are not offered as if they were this
     * model's own levels.
     *
     * The level that stands is an option even where it is not published, because the control draws what it
     * shows and offers what it draws: an untouched row stands on the route's own effort, and two of the
     * vendor's models publish no `max` at all — a trigger reading `max` with a list that cannot name it would
     * be a value the reader could not put back after moving away from it. Nothing is asked for in silence
     * either: the note says which of the two reasons stands.
     *
     * The note names the state of the menu, never its absence: a listing nobody could read, a model the
     * listing does not carry, and a model that publishes no menu. A level the row itself names and the menu
     * does not carry drew a fourth note, and it went the way of the route's own default: where neither side
     * names a level there is nothing to explain. The row keeps standing in every one of the four.
     */
    function effortChoices(entry, phase, held, standing) {
      const menu = Array.isArray(entry?.efforts) ? entry.efforts.filter((one) => typeof one === 'string' && one !== '') : [];
      /* Where neither side names a level there is nothing drawn, and `''` is how this page says "nothing named":
         a `null` reaching the options would put a nameless entry in the menu. */
      const drawn = held === '' ? (standing ?? '') : held;
      const options = [...menu]
        .sort((left, right) => rankOf(left) - rankOf(right))
        .map((level) => ({ value: level, words: level }));
      if (drawn !== '' && options.some((one) => one.value === drawn) === false) options.push({ value: drawn, words: drawn });
      options.push({ value: OFF.id, words: t('models.effortOff') });
      const note = phase === 'refused' ? t('models.effortNoCatalogue')
        : phase === 'reading' ? null
          : entry === undefined ? t('models.effortUnknownModel')
            : menu.length === 0 ? t('models.effortNoMenu')
              : null;
      return { options, note };
    }

    /** Where a vendor level stands on the vendor's own scale; a level outside it is drawn last. */
    const rankOf = (level) => {
      const at = VENDOR_EFFORTS.indexOf(level);
      return at < 0 ? VENDOR_EFFORTS.length : at;
    };

    /**
     * One model row of the models card: the read-out that stood there before the editor, and the fields
     * the row is edited through. The marks stay in the head of the row they belong to, so one card
     * carries both the reading and the writing and no second list is drawn beside it.
     *
     * The marks are joined by id, not by position: a row the user has just added or renamed has no
     * reading of its own, and the facts about a model — which one the agent uses, the efforts it
     * declares — belong to the id, wherever the row stands.
     */
    function modelRow(draft, index, view, problems, act, clashing) {
      const state = view.view;
      const id = draft.id.trim();
      const marks = state.models.find((one) => one.id === id) ?? null;
      const catalogue = state.catalogue.models;
      const entry = catalogue?.get(id);
      const idProblem = problems.find((problem) => problem.index === index && problem.field === 'id');
      const windowProblem = problems.find((problem) => problem.index === index && problem.field === 'window');
      /* The effort in force for a row that names none: the route's own where the read names one, and nothing at all
         where it names none. */
      const rowEffort = state.rowEffort ?? null;
      const known = catalogue === null ? null : catalogue?.has(id) === true;
      /* Which of the three states the catalogue is in: still on the wire, answered, or refused with a
         reason. The effort menu is drawn differently in each, and "not read yet" is not "not there". */
      const phase = catalogue !== null ? 'read' : state.catalogue.message === null ? 'reading' : 'refused';
      const choices = effortChoices(entry, phase, draft.effort, rowEffort);
      return h('li', {
        key: `${id}:${index}`,
        className: 'coreness-qoder-model',
                'data-model': id,
        'data-index': String(index),
        /* What the node itself published as this model's output ceiling, as the catalogue answered it —
           empty where the node published none. It stands on the row because it is a fact about the row's
           model, and because two roads can be compared only by their numbers. */
        'data-max-tokens': entry?.maxTokens === undefined ? '' : String(entry.maxTokens),
      }, [
        h('div', { key: 'head', className: 'coreness-qoder-head coreness-card-head' }, [
          /* The row reads as the option does: the name the vendor published, the host's separator and the
             multiplier that came with the same answer (`optionWords` carries the list's own reading). A row
             the listing does not carry has no rate to show and is named without one. */
          h('span', { key: 'name', className: 'coreness-qoder-name' },
            `${draft.name.trim() !== ''
              ? draft.name
              : typeof entry?.name === 'string' && entry.name !== '' ? entry.name : id === '' ? t('models.pick') : id}${rateWords(entry?.priceFactor) === null ? '' : ` · ${rateWords(entry.priceFactor)}`}`),
                    /* The mark of an id the live catalogue does not carry: a typo stays visible, and the row is not
             dropped for it. It is a tag of the row's own header — a line under the picker would move the
             list under the reader's hand as the catalogue answers. */
          ...known === false ? [h('span', { key: 'unknown', className: 'coreness-qoder-tag' }, t('models.unknown'))] : [],
        ]),
        ...marks?.description === null || marks?.description === undefined
          ? []
          : [h('p', { key: 'desc', className: 'coreness-qoder-dim' }, marks.description)],
        h('div', { key: 'fields', className: 'coreness-qoder-grid' }, [
          h('div', { key: 'id', className: 'coreness-field coreness-qoder-field' }, [
            h('span', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('models.model')),
            /* The model is chosen from the live catalogue: the vendor names a model differently in its own
               menu than on the wire, so an id typed from memory is a guess. What the list draws is the
               vendor's own name and the rate it published — the wire id stands only where two names would
               read the same (`optionWords`). An entry the catalogue does not carry stays an option of its
               own — the choice never replaces a value silently — and a catalogue that could not be read
               leaves the picker locked rather than empty. */
            h(IdPicker, {
              key: 'input',
              name: `qoder-model-${index}`,
              value: id,
              disabled: view.busy !== null || catalogue === null,
              'aria-invalid': idProblem !== undefined,
              'aria-label': t('models.model'),
              placeholder: t('models.pick'),
              options: [
                ...id === '' ? [{ value: '', words: t('models.pick') }] : [],
                ...id === '' || known === true ? [] : [{ value: id, words: id }],
                ...[...(catalogue?.values() ?? [])].map((one) => ({
                  value: one.id,
                  words: optionWords(one, clashing.has(typeof one.name === 'string' && one.name !== '' ? one.name : one.id)),
                })),
              ],
              onChoose: (next) => act.chooseModel(index, next),
            }),
          ]),
          h('div', { key: 'effort', className: 'coreness-field coreness-qoder-field' }, [
            h('label', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('models.effortLabel')),
            /* The control offers the levels this model's own vendor publishes, read from the live
               catalogue's entry for the row's id, plus the level that stands and our own `Off` — and it is
               the page's own picker, the same control the wire id is chosen with, not a native `select`.
               The value it shows is the level that stands **in force**: the row's own where the row names
               one, the route's answer where the route names one — and **nothing** where neither does, which
               is the state the user asked for when he took the schema's own default off the wire. An
               untouched row keeps naming nothing (`storedRow` writes it as it is, empty string included), so
               the control stands empty and no sentence claims an effort nobody named. */
            h(IdPicker, {
              key: 'input',
              name: `qoder-effort-${index}`,
              value: draft.effort === '' ? (rowEffort ?? '') : draft.effort,
              disabled: view.busy !== null || phase === 'reading',
              'aria-label': t('models.effortLabel'),
              title: draft.effort === 'off' ? t('models.effortOurs')
                : draft.effort === '' && rowEffort !== null ? t('models.effortRow', { effort: rowEffort }) : undefined,
              options: choices.options,
              onChoose: (next) => act.patchRow(index, { effort: next }),
            }),
            /* What the menu itself has to say — nobody could read it, the listing does not carry this
               model, the model publishes none, or the level that stands has gone from it (the row's own,
               or the route's where the row names none). An empty control with no word beside it would
               read as a model that has no levels, and a level drawn without a word would read as one the
               model publishes. */
            choices.note === null ? null : h('p', { key: 'menu', className: 'coreness-qoder-dim' }, choices.note),
          ]),
          h('div', { key: 'window', className: 'coreness-field coreness-qoder-field' }, [
            h('label', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('models.window')),
            h('input', {
              key: 'input',
              className: 'coreness-qoder-input coreness-field coreness-field-box',
              type: 'text',
              value: draft.window,
              disabled: view.busy !== null,
              'aria-label': t('models.window'),
              'aria-invalid': windowProblem !== undefined,
              /* No placeholder: an empty window is not the fallback window and not the catalogue's
                 number — it is the schema's own default, which this page cannot name. A grey number
                 standing in for it would be read as the value that will be used. */
              onChange: (event) => act.patchRow(index, { window: event.target.value }),
            }),
          ]),
        ]),
        h('div', { key: 'inputs', className: 'coreness-qoder-inputs' }, [
          h('span', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('models.inputs')),
          h('label', { key: 'text', className: 'coreness-check coreness-qoder-check' }, [
            h('input', { key: 'box', type: 'checkbox', checked: true, disabled: true, readOnly: true }),
            t('models.text'),
          ]),
          h('label', { key: 'image', className: 'coreness-check coreness-qoder-check' }, [
            h('input', {
              key: 'box',
              type: 'checkbox',
              checked: draft.vision,
              disabled: view.busy !== null,
              'aria-label': `${t('models.image')} ${id}`,
              onChange: (event) => act.patchRow(index, { vision: event.target.checked }),
            }),
            t('models.image'),
          ]),
          h('button', {
            key: 'remove',
            type: 'button',
            className: 'coreness-qoder-button coreness-button',
            disabled: view.busy !== null,
            onClick: () => act.removeRow(index),
          }, t('models.remove')),
        ]),
      ]);
    }

    /**
     * The section as it stands before the read answers: the frames of what is coming.
     *
     * The read is a round trip — the platform's own doors, then the vendor's catalogue — and a section
     * drawn from it alone is one line until the answer lands, when it becomes two cards and every block
     * under it moves. So the frames stand first: the same two cards, the same heads with the room a state
     * keeps, and the sentences the section owns — a title, a hint, a phrase read the same before and after
     * the read, so drawing them is not a claim about the answer. Where the read's own content will land —
     * the value, the address, a control, a row — a bar stands instead, wearing the class of the part it
     * stands for so its box is that part's own rule and not a second number in the stylesheet. The bars are
     * marked `data-skeleton` with the part they stand for: the live walk reads the frames by that mark.
     *
     * What it refuses: the list of models stands, and its rows do not — the count is the read's own news,
     * and a skeleton that drew four rows would be inventing it. No control is drawn either: nothing on this
     * surface can be pressed before it has been read. And no sentence is measured by hand here: a sentence
     * wraps where the browser wraps it, and the one that wraps in two lines is the browser's number and not
     * this function's. A profile that declares no route, or whose settings are unmounted, is a case only the
     * read can answer; until it lands, two frames are what is coming for every profile that carries the
     * route.
     */
    function firstPaint() {
      const bar = (key, part, className) => h('div', {
        key,
        className: `${className} coreness-qoder-skeleton`,
        'data-skeleton': part,
      });
      const frame = (label, subject) => h('div', { key: 'head', className: 'coreness-qoder-head coreness-card-head' }, [
        h('span', { key: 'name', className: 'coreness-qoder-name' }, label),
        subject === null || subject === undefined ? null : statusNode({ subject, value: 'loading' }),
      ]);
      return [
        h('div', { key: 'credential', className: 'coreness-qoder-card' }, [
          /* The section's own read stands on the first card, which is the section's own — the same place
             its failure stands once there is a read to fail. */
          frame(t('credential.label'), t('status.subject.token')),
          h('div', { key: 'field', className: 'coreness-field coreness-qoder-field' }, [
            h('label', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('field.token')),
            bar('input', 'input', 'coreness-qoder-input coreness-field coreness-field-box'),
          ]),
          h('div', { key: 'actions', className: 'coreness-qoder-actions' }, [bar('save', 'button', 'coreness-qoder-button coreness-button')]),
          h('div', { key: 'node', className: 'coreness-qoder-node' }, [
            bar('where', 'line', 'coreness-qoder-line'),
            bar('check', 'button', 'coreness-qoder-button coreness-button'),
          ]),
                  ]),
        h('div', { key: 'models', className: 'coreness-qoder-card' }, [
          frame(t('models.label'), null),
            /* The line that names whose the x is stands in the loading frame **as itself**, not as a bone: the
             rule is true before any answer, and a bone carries no text to hold the height the answered line
             takes — a bar of a part without height measures 0 px against the 18 px the line takes once the
             read lands, and the walk's own frame check reads exactly that. What the read adds to it is the moment. */
          h('ul', { key: 'list', className: 'coreness-list coreness-qoder-models' }, []),
          h('div', { key: 'add', className: 'coreness-qoder-actions' }, [bar('addRow', 'add', 'coreness-add coreness-qoder-add coreness-button')]),
          h('p', { key: 'windowNote', className: 'coreness-qoder-dim' }, t('models.windowNote')),
          h('p', { key: 'note', className: 'coreness-qoder-dim' }, t('models.note')),
          h('div', { key: 'actions', className: 'coreness-qoder-foot' }, [
            bar('reset', 'button', 'coreness-qoder-button coreness-button'),
            h('div', { key: 'right', className: 'coreness-qoder-actions' }, [
              bar('cancel', 'button', 'coreness-qoder-button coreness-button'),
              bar('apply', 'button', 'coreness-qoder-button coreness-button'),
            ]),
          ]),
        ]),
      ];
    }

    /**
     * The status of a card: one sentence, standing in the card's own header row to the right of its
     * title, and the tone it stands in — both out of the one map every card of this page draws from.
     *
     * A state written under the controls makes the card grow the moment it appears and moves every
     * block below it under the reader's hand — the user's own reading of this surface, and the fix is
     * the header row, which hands the room to the one component, so a save, a clear, an apply, a
     * refusal and a wait all stand in the same place and none of them moves the layout.
     *
     * One sentence per card, because a header holds one: the card's own news first — the word of the
     * action just taken, or its refusal — then the reading that has nowhere else to stand. What needs
     * more than a sentence is a list, and a list does not belong in a header: the nodes a failed sweep
     * could not raise keep their own lines in a block under every card, where a list of any length
     * moves nothing above it.
     *
     * It is a plain function, and it stands outside `draw` on purpose: `draw` returns early in four of
     * the states it draws, so a hook inside it would be called by the cards and not by the frames of the
     * wait — and React counts the hooks of one mount, refusing a render that calls a different number
     * (error #310, wrapped by the platform as a slot entry that crashed: the section is torn down and the
     * page loses it). The drawing and the console account both ask this one function, so a card cannot
     * say one thing while the log is told another.
     */
    /* The section's own read, failed while the section still stands. It stands on the first card,
       which is the section's own, and yields to a refusal of an action — fresher news about what the
       user just pressed — while outranking a success whose confirmation that read was. */
    const readFailureOf = (view) => (view.status === 'failed' && view.view !== null ? view.reason : null);
    /** Whether this profile may write through the row it read: the one reading of that question. */
    const writableOf = (state) => state !== null && state.ref !== null && state.credential?.writable === true;
    /**
     * The card's one status: a value out of the shared map, and the subject its sentence is about.
     *
     * One value per card, and it is the newest answer about that card's subject — a press's outcome while
     * its hold lasts, the vendor's verdict while the value it judged stands, and the read's own answer
     * when there is no press. A node's answer is one of those outcomes: the press that asked for it
     * writes a note (`check`), so it stands for the page's own hold and goes with it, and a sweep that is
     * no longer news states nothing — the record it leaves behind is the reasons list under the cards and
     * the address the row now names, never a word of its own.
     *
     * What only this profile can know — a reference nobody named, a store this home does not own, the
     * fields a row is missing, the reason a read failed — is a fact about our configuration and not about
     * the reader's token, so it travels beside the value as `detail` and is said in the console rather
     * than on the face, which carries the state alone.
     */
    const SUBJECTS = { credential: 'status.subject.token', node: 'status.subject.node', models: 'status.subject.models' };
    const statusOf = (view, where) => {
      const subject = t(SUBJECTS[where]);
      const state = view.view;
      const problems = view.draft === null || view.draft === undefined ? [] : checkRows(view.draft);
      const readFailure = readFailureOf(view);
      const writable = writableOf(state);
      /* The newer fact wins: a note is what a press has just learned, and the picture's own facts — the
         fields a row is missing, a home that cannot be written — are what stands while nothing is pressed.
         Read the other way round the press's word was unreachable, and a card answered a press with a fact
         that was already true before it. */
      const mine = view.note !== null && view.note !== undefined && view.note.where === where ? view.note : null;
      /* The mark is derived from the value, for the node's row alone: a note carries no marks of its own,
         and the row the driver's walk reads must carry `data-answer` whatever word stands on it. */
      if (mine !== null) return { subject, value: mine.value, data: where === 'node' ? { 'data-answer': mine.value === 'answered' ? 'connected' : 'none' } : undefined };
      if (state !== null && state.status === 'ready' && state.settings != null && (where === 'credential' || where === 'models')) {
        if ((state.settings.missing ?? []).length > 0) {
          return { subject, value: 'unwritable', detail: t('state.unwritable', { fields: fieldWords(state.settings.missing) }) };
        }
        if (state.settings.writable !== true) {
          return { subject, value: 'unwritable', detail: t('state.readonly') };
        }
      }
      if (readFailure !== null && where === 'credential') return { subject, value: 'unread', detail: readFailure };
      /* Nothing is read yet: the frames of the wait draw their own word, and a card that does not exist yet
         states nothing. The account asks this function on every render, and the first render of a section
         holds no picture at all — the guard stood here as a dereference of what the ready path always had. */
      if (state === null) return { subject, value: null };
      /* The node's own subject states nothing by itself: what a sweep answered is its press's news, and it
         stands as that press's note above — while the note lives. A record with no note is a sweep whose
         word has gone, and the card says its own state again rather than an answer nobody is waiting for. */
      if (where === 'node') return { subject, value: null };
      if (where === 'credential') {
        /* The reference this profile names is what the store is asked about, and a profile that names none
           has nothing set in this card's own terms; the reference itself is our configuration, so it is
           said in the console and never on the face. */
        /* A picture that carries no reference and no model list at all is not a settings read — the route
           is declared without its namespace, or the read failed: nothing is stated, because nothing was
           read. The account asks this function on every render, so the reading is total over every picture
           the section can hold and does not lean on the drawing's own early returns to keep it in range. */
        if (state.ref === undefined) return { subject, value: null };
        /* A profile that names no reference: nobody was asked, so the face says nothing about a store
           and the account is the console's. A word here would be this page claiming what it never read. */
        if (state.ref === null) return { subject, value: null, detail: t('detail.noplace') };
        if (!writable) return { subject, value: 'unwritable', detail: t('detail.external') };
        return { subject, value: state.credential?.configured === true ? 'set' : 'unset' };
      }
      /* Models: the draft's own first refusal outranks the reading, and the reading outranks the
         route's own list, which is the oldest news of the three. */
      if (state.catalogue === undefined || state.catalogue === null) return { subject, value: null };
      if (problems.length > 0) return { subject, value: 'unsaved', detail: `Row ${problems[0].index + 1}: ${problems[0].message}` };
      /* A draft that stands says the same word the refused one does, and outranks the reading for the same
         reason: what the reader has in front of them is not in the profile until `Apply` writes it, and the
         two windows two presses leave are explained by that and by nothing the catalogue says. The catalogue's
         own word is not lost with it — the list's own line says what it is doing — and the corner keeps the
         map's one word for a value that is not written. */
      if (view.draft !== null && view.draft !== undefined) return { subject, value: 'unsaved' };
      if (state.catalogue.models === null && state.catalogue.message === null) return { subject, value: 'loading' };
      if (state.catalogue.message !== null) return { subject, value: 'unread', detail: state.catalogue.message };
      if (state.failure === null || state.failure === undefined) return { subject, value: null };
      return { subject, value: 'unread', detail: `${t('models.failed')}: ${state.failure.message}` };
    };
    /**
     * What a sweep's own record says about the node: which node answered and how much it offers, as the
     * account the console keeps — never a word for the face. The word is the press's note (`check`), and
     * the live walk reads the answer by the `data-answer` the note carries (`statusOf`), so a record that
     * outlives its press states nothing anywhere.
     */
    const sweepAccount = (sweep) => {
      if (sweep === null) return null;
      const answered = (sweep.nodes ?? []).find((one) => one.node === sweep.pin && one.ok === true);
      if (sweep.pin === null || answered === undefined) return null;
      return t('detail.node', { node: sweep.pin, count: String(answered.models ?? 0) });
    };

    /** The section as it stands, from the read alone: the states, the token, the node, the models. */
    function draw(view, act) {
      const head = [
        h('h4', { key: 'title', className: 'coreness-qoder-title' }, t('title')),
        h('p', { key: 'intro', className: 'coreness-qoder-intro' }, t('intro')),
      ];
      const failed = (reason) => h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'failed' }, [...head,
        h('div', { key: 'failed', className: 'coreness-qoder-failed coreness-failed' }, [
          h('p', { key: 'word', role: 'alert' }, t('state.failed')),
          h('p', { key: 'reason' }, reason ?? ''),
        ]),
      ]);

      /* A failed read that still holds a view draws that view: its reason stands in the state area, and
         the failure view is for the case where there is nothing left to keep. */
      if (view.status === 'failed' && view.view === null) return failed(view.reason);
      /* The read has not answered: the section stands in the frames of `firstPaint` — the shape the answer
         will take — rather than as one line the answer turns into a form. The word of the wait stands where
         the read's own failure will stand, in the first card's own state room. */
      if (view.status !== 'ready') {
        return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'loading' }, [...head, ...firstPaint()]);
      }

      const state = view.view;
      if (state.status === 'failed') return failed(state.reason);
      if (state.status === 'undeclared') {
        return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'undeclared' }, [...head,
          h('div', { key: 'undeclared', className: 'coreness-qoder-card' }, [
            h('p', { key: 'word', className: 'coreness-qoder-line' }, t('state.undeclared')),
            h('p', { key: 'hint', className: 'coreness-qoder-dim' }, t('state.undeclared.hint')),
          ]),
        ]);
      }
      /* A row that is declared but whose settings namespace is not mounted carries nothing this section
         may read or write; the honest answer is the fact, not an empty form. */
      if (state.unmounted === true) {
        return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'unmounted' }, [...head,
          h('div', { key: 'unmounted', className: 'coreness-qoder-card' }, [
            h('p', { key: 'word', className: 'coreness-qoder-line' }, t('state.unmounted')),
          ]),
        ]);
      }

      const writable = writableOf(state);
      /* The rows the card draws: the draft the user is editing, or the section as it was read. The
         refusals are the draft's — a row nobody has touched cannot be wrong. */
      const rows = view.draft ?? state.models.map(draftRow);
      const problems = view.draft === null ? [] : checkRows(view.draft);

      /** A card's header row: its title, its own tags, and the one status this page draws — at its right. */
      /* The Connection card carries two subjects a reader would otherwise look for in two cards — the token and
         the node its requests go to — and its corner states the newer of the two: a sweep's own answer while
         that press's news stands, and the connection's own state when nothing has been asked. That answer is a
         note of its press (`check`) and goes with the page's own hold; the record the sweep leaves states
         nothing, so a `Check token` verdict is never shadowed by a sweep that is no longer news. The
         connection's dot beside the name says the connection either way, because a dot says one thing and says
         it next to the thing it is about. */
      const headFact = () => {
        const node = statusOf(view, 'node');
        return node.value === null || node.value === undefined ? null : node;
      };

      const headOf = (key, label, extras = [], shown = null) => {
        /* A card states one thing, and a press is the newer fact: the head may be handed the status standing for
           the card's newest news (`shown`), and reads its own subject's status otherwise. */
        const one = shown ?? statusOf(view, key);
        /* The connection's own state, which its dot is about: the corner may be saying the node's newer news
           instead, and the dot keeps saying the token's state — beside the name of the thing it is about. */
        const own = key === 'credential' ? statusOf(view, 'credential') : null;
        /* The two states a reader is simply *in* keep no word in this card's corner: the dot beside the name
           says them, and `Token is set` / `Token is not set` left the face on the user's word — the
           state is not news and the sentence said nothing a reader could act on. Every other value keeps its
           sentence: a fault, a verdict, a press's own outcome, and the node's answer standing here as the
           newer fact. What the head drops, the dot carries out loud (`statusMark`). */
        const silent = key === 'credential' && (one.value === 'set' || one.value === 'unset');
        const word = silent ? null : statusNode({ subject: one.subject, value: one.value, data: one.data });
        return h('div', { key: 'head', className: 'coreness-qoder-head coreness-card-head', 'data-state': key }, [
          h('span', { key: 'name', className: 'coreness-qoder-name' }, label),
          /* The connection's mark stands **beside the name of the thing it is about** — this card is the
             Connection — and only where a state is known: a card that read nothing draws no dot rather than
             claiming a connection nobody asked about. Its tone is the mark's own: nothing
             stored — grey, something stored — green, something wrong — red; and it says that state out loud
             exactly where the corner draws no word of it, because `Token is set` and `Token is not set` left
             the face and a dot a reader cannot see is a state a reader cannot read. Where the corner says that
             same state in words — a fault, an outcome — the dot is silent: one fact, said once. The head's own
             gap places it, so this chunk's sheet needs no rule for it. */
          own === null || own.value === null || own.value === undefined
            ? null
            : statusMark(own.value, { key: 'mark', subject: own.subject, spoken: word !== null && one.value === own.value }),
          ...extras,
          /* One component, one place, one value: the words, the tones and the place rule are
             the status component's, and the account this section learned travels beside the value. */
          word,
        ]);
      };

      /**
       * What the picker is doing, in the card's body: the wait while the catalogue is on the wire, the
       * vendor's own refusal when its route answers nothing, and this section's sentence when the listing
       * could not be read at all. It is a sub-control's own content and not the card's state — the head says
       * what stands, this says what the list is waiting for — and it stands whether or not a row is drawn, so
       * the list does not move under the reader's hand when the answer arrives.
       */
      const catalogueNote = (state) => {
        const catalogue = state.catalogue ?? { models: null, message: null };
        /* The listing's own failure is read first: the platform's catalogue and the vendor's listing are two
           answers, and a listing that failed while a catalogue stands is still a list nobody can join. */
        if (state.failure !== null && state.failure !== undefined) return `${t('models.failed')}: ${state.failure.message}`;
        if (catalogue.models !== null) return null;
        if (catalogue.message !== null) return catalogue.message;
        return t('models.readingCatalog');
      };

      /* The sweep's own lines: the answer itself is that press's news (`check`), and the reasons the nodes gave
         stand in a block of their own, under every card. They are a list whose
         length is the node map's, and a list of unknown length inside a card would grow that card and move
         every block under it — the reason a reason is never truncated here and never drawn in a header. */
      const refusals = view.sweep === null || view.sweep.pin !== null
        ? []
        : (view.sweep.nodes ?? []).filter((one) => one.ok !== true).map((one, index) => h('li', {
          key: `refused-${index}`,
          className: 'coreness-qoder-dim',
          'data-node': one.node,
        }, t('node.failedNode', { node: one.node, reason: one.error ?? '' })));

      /* The node's own row, inside the connection card: the address and the one action that pins a node. The
         answer of the sweep is not drawn here — a word beside the address pushes the press that asked for it to
         the right, and the reserved room of the card's header takes it — and **no mark stands here either**: a
         node is assumed to answer, so a dot saying "it works" states what nobody needs told (the user's word:
         «у ноды не нужно ставить круг зеленый… это лишнее»), while a red dot beside an address would say "a
         connection" in the colour that means a fault. What a node answered stands in the corner's word and in
         the reasons list under the card, and with nothing standing between the address and the press nothing
         arriving can move it. The action stays a hand and never a tick — pinning writes the profile's patch, and
         a pin made by a timer is the donor's own failure. Its
         class is kept for the live walk, which presses it and reads the answer by its mark. */
      const nodeRow = h('div', { key: 'node', className: 'coreness-qoder-node' }, [
        nodeLine(state),
        h('button', {
          key: 'check',
          type: 'button',
          className: 'coreness-qoder-button coreness-button',
          disabled: view.busy !== null,
          onClick: () => act.check(),
        }, view.busy === 'check' ? t('node.checking') : t('node.check')),
      ]);

      const credential = h('div', { key: 'credential', className: 'coreness-qoder-card' }, [
        /* The card's one status carries the word alone: a sweep's answer stands in the
           corner while it is the newer fact, and the dot beside the card's name is the connection's own. */
        headOf('credential', t('credential.label'), [], headFact()),
        state.ref === null ? null : h('div', { key: 'field', className: 'coreness-field coreness-qoder-field' }, [
          h('label', { key: 'label', className: 'coreness-fieldLabel coreness-qoder-fieldLabel' }, t('field.token')),
          h('input', {
            key: 'input',
            className: 'coreness-qoder-input coreness-field coreness-field-box',
            type: 'password',
            value: view.field ?? '',
            disabled: view.busy !== null || !writable,
            'aria-label': t('field.token'),
            placeholder: t('field.placeholder'),
            autoComplete: 'off',
            onChange: (event) => act.patch(event.target.value),
          }),
        ]),
        state.ref === null ? null : h('div', { key: 'actions', className: 'coreness-qoder-actions' }, [
          /* An empty field is not a write, so the button is off rather than ready to say so. */
          h('button', {
            key: 'save',
            type: 'button',
            className: 'coreness-qoder-button coreness-button',
            'data-tone': 'primary',
            disabled: view.busy !== null || !writable || (view.field ?? '') === '',
            onClick: () => act.save(),
          }, view.busy === 'token' ? t('savingToken') : t('saveToken')),
          h('button', {
            key: 'clear',
            type: 'button',
            className: 'coreness-qoder-button coreness-button',
            disabled: view.busy !== null || !writable || state.credential?.configured !== true,
            onClick: () => act.clear(),
          }, view.busy === 'token' ? t('clearingToken') : t('clearToken')),
          /* The value that stands can be asked about again: a token goes bad after it was written, and
             without this press the only way to ask would be to write the same value over itself. It asks
             the vendor and writes nothing, and it is off while the section is busy — and off where the row
             names no reference at all, because then there is nobody to ask about (`credential.noplace`). */
          h('button', {
            key: 'verify',
            type: 'button',
            className: 'coreness-qoder-button coreness-button',
            disabled: view.busy !== null || state.ref === null,
            onClick: () => act.verify(),
          }, view.busy === 'verify' ? t('token.checking') : t('token.check')),
        ]),
        nodeRow,
        /* One card carries the connection and the node its requests go to: the corner states the newer of the
           two facts, and the row carries the address, the dot that says whether it answers, and the press. */
              ]);

      /* Names two entries of the vendor's listing share, computed once for the whole list: the picker's
         options carry the vendor's own names, and only a clash brings the wire id back (`optionWords`). */
      const clashing = clashingNames(state.catalogue.models);
      const models = h('div', { key: 'models', className: 'coreness-qoder-card' }, [
        headOf('models', `${t('models.label')} (${rows.length})`, [
          /* The tag says the one thing a reader cannot get anywhere else: a route that is declared and **not**
             registered fails every request through it. The word about the ordinary state — "registered in this
             profile" — left by the user's word ("есть ли в них какой-то смысл"): the ordinary state is not news,
             and the head says it by being there. */
          state.live ? null : h('span', { key: 'live', className: 'coreness-qoder-tag' }, t('state.unregistered')),
        ]),
        /* The list's own room, with the list's own news inside it: what the catalogue is doing or what it
           answered, the sentence a route with no model gets, and the rows — one block whatever the state.
           A line standing beside the list would be a block the card grew and dropped as the answer landed,
           and everything under it would move by that line's height every time: the shape the page's own
           check holds (no card changes what stands under its head in any state). */
        h('ul', { key: 'list', className: 'coreness-list coreness-qoder-models' }, [
          catalogueNote(state) === null
            ? null
            : h('li', { key: 'catalogue', className: 'coreness-qoder-line' }, catalogueNote(state)),
          ...(rows.length === 0
            ? [h('li', { key: 'none', className: 'coreness-qoder-dim' }, t('models.none'))]
            : rows.map((row, index) => modelRow(row, index, view, problems, act, clashing))),
        ]),
        h('div', { key: 'add', className: 'coreness-qoder-actions' }, h('button', {
          key: 'addRow',
          type: 'button',
          className: 'coreness-add coreness-qoder-add coreness-button',
          /* A row is chosen from the live catalogue: without it, adding a row would offer an empty
             picker whose only value is a guess. */
          disabled: view.busy !== null || state.catalogue.models === null,
          onClick: () => act.addRow(),
        }, t('models.addRow'))),
        /* The one refusal left in this card: the fallback window has no control here, and an empty place
           would read as a control that was forgotten. The effort's own footnote went with the control
           that now moves it. */
        h('p', { key: 'windowNote', className: 'coreness-qoder-dim' }, t('models.windowNote')),
        h('p', { key: 'note', className: 'coreness-qoder-dim' }, t('models.note')),
        h('div', { key: 'actions', className: 'coreness-qoder-foot' }, [
          h('button', {
            key: 'reset',
            type: 'button',
            className: 'coreness-qoder-button coreness-button',
            'data-align': 'start',
            disabled: view.busy !== null,
            onClick: () => act.reset(),
          }, t('reset')),
          h('div', { key: 'right', className: 'coreness-qoder-actions' }, [
            /* Apply stands only over a draft: the section as it was read has nothing to write, and a
               press that wrote the same list back would be an edit nobody made. */
            h('button', {
              key: 'cancel',
              type: 'button',
              className: 'coreness-qoder-button coreness-button',
              disabled: view.busy !== null || view.draft === null,
              onClick: () => act.cancel(),
            }, t('cancel')),
            h('button', {
              key: 'apply',
              type: 'button',
              className: 'coreness-qoder-button coreness-button',
              'data-tone': 'primary',
              disabled: view.busy !== null || problems.length > 0 || view.draft === null,
              onClick: () => act.apply(),
            }, view.busy === 'models' ? t('models.applying') : t('apply')),
          ]),
        ]),
      ]);

      return h('div', { className: 'coreness-still coreness-qoder coreness-sectionBody', 'data-status': 'ready' }, [...head, credential, models,
        /* The reasons the sweep's nodes gave: a block of its own, under every card, so the list grows
           downward and moves nothing the reader is looking at. */
        refusals.length === 0 ? null : h('div', { key: 'refused', className: 'coreness-qoder-refused' }, [
          h('p', { key: 'title', className: 'coreness-qoder-dim' }, t('refused.title')),
          h('ul', { key: 'list', className: 'coreness-list coreness-qoder-refusedList' }, refusals),
        ])]);
    }

    return {
      /* The hold of a note is not exposed here: the page's one number lives in the page's own hold chunk, and the
         check that used to compare this copy with the one beside it now holds that no chunk carries a copy. */
      /** The reader, for the check that holds the reference to the row it is read from. */
      readState: (remote) => readState(remote),
      /** The write and its confirmation, for the check that holds the two apart. */
      saveCredential: (remote, ref, value) => saveCredential(remote, ref, value),
      /** The clear, held to the same rule: the store read back says whether the value is gone. */
      clearCredential: (remote, ref) => clearCredential(remote, ref),
      /** The settings write, for the check that a conflict is not read as a write. */
      writeSettings: (remote, settings, ops) => writeSettings(remote, settings, ops),
      /** The section as it draws, for the check that reads its states without a browser. */
      draw: (view, act) => draw(view, act ?? {
        field: '',
        busy: null,
        note: null,
        sweep: null,
        draft: null,
        patch: () => {},
        save: () => {},
        clear: () => {},
        verify: () => {},
        check: () => {},
        patchRow: () => {},
        chooseModel: () => {},
        addRow: () => {},
        removeRow: () => {},
        cancel: () => {},
        apply: () => {},
        reset: () => {},
      }),
      /** Register the section into the seat the page declares. */
      apply(pluginCtx) {
        ctx = pluginCtx;
        t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, 'en', EN), `${PACKAGE}: the Qoder dictionary`);
        /* The seat is filled when the picker the section draws is in hand: the pull began when this
           chunk was materialised, and nothing stands in the rail before there is a section to draw. */
        ctx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([picker, hold, status]).then(
            ([pickerModule, holdModule, statusModule]) => {
              if (!live) return;
              IdPicker = pickerModule.IdPicker;
              holdOf = holdModule.holdOf;
              statusNode = statusModule.statusNode;
              statusMark = statusModule.statusMark;
              useStatusStyles = statusModule.useStatusStyles;
              statusDetail = statusModule.statusDetail;
              armed = ctx.slots.inject(SEAT, () => ctx.slots.register({
                name: SEAT,
                id: ID,
                order: ORDER,
                label: () => t('section'),
                locale: NS,
              }, QoderSection));
            },
            (error) => {
              console.error(`${PACKAGE}: the picker, the hold or the status chunk did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof armed === 'function') armed();
          };
        }, `${PACKAGE}: the picker, the hold, the status and the Qoder section`);
      },
    };
  },
});