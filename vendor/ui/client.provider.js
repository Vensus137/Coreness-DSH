/**
 * The product's Qoder section: the token pasted once, the node the requests go to, and the state and the
 * models read from the platform's own doors.
 *
 * A package-local chunk beside the page's entry, pulled with the entry's `require.async`, registering into
 * the seat the page declares under an id and a locale namespace of its own. This file carries the section's
 * words and sheet, the platform's read and its writes (the row, the store, the settings), the catalogue's
 * action, and its seat; the drawing and the section's own lifetime are the five parts beside it
 * (`client.provider.section.js`, `.draw.js`, `.models.js`, `.credential.js`, `.node.js`), all created over
 * one `shared` and seated only once the kit, the picker and the hold are in hand.
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
  id: '@coreness/ui/client.provider.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/ui';
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
    const STYLE_TAG = '@coreness/ui/client.provider.js';
    const STYLE_ID = 'coreness-ui-qoder-style';

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
      /* The route's own answer in this page's words: the path the page asks through is a door of its own
         and no reader's fact, so a refusal is said with what the route answered and nothing of the calling
         convention. `route.answered` is the one sentence for every door of this section. */
      'route.answered': 'the route answered {status}',
      'route.refusedSweep': 'the route refused the sweep',
      'route.refusedCheck': 'the route refused the check',
      'route.noVerdict': 'the route answered no verdict',
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
      /* The words of the effort control: our own level as the menu names it, and the trigger's own title for
         each of the two levels it can stand on while the row names none. No sentence stands beside the menu —
         what a model publishes is what its own menu holds — so these three are the whole of what the control
         says of itself. */
      'models.effortOff': 'Off (ours)',
      'models.effortOurs': 'the vendor publishes no such level: Off is this route\'s own',
      'models.effortRow': 'the route\'s effort stands for this model: {effort}',
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
      /* The news of the add press: the press appends a row to the draft, the draft keeps every row added until
         `Apply` writes the list, and a profile may hold the same model twice — so a second press leaves the first
         row standing beside the new one, which is the two windows the user read as a bug. The page explains the
         press and does not forbid it; what was missing was the page saying what it did, and these are the words it
         says it in. The corner keeps the map's own word for a value that is not written (`unsaved`), so the sentence
         names the act alone — the ground for the two windows stands beside the press that makes them. */
      'models.added': 'A row was added',
      'models.addedAgain': 'Another row was added',
      'models.pick': 'Choose a model',
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
    const CSS = `
.coreness-qoder-title{margin:0;font-size:16px;font-weight:500;line-height:24px;color:var(--dsw-alias-label-primary)}
.coreness-qoder-intro{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:14px;line-height:22px}
/* A hint line — this section's notes, hints and refusals: the page's small role, one pair for it everywhere,
   12/18 in label-tertiary, which stands once in the page's own sheet as coreness-dim and is worn beside this
   name. The name stays: this section's own readings select the line by it, and the head's rule below keeps its
   own room. */
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
     * The parts beside this entry, pulled at materialisation and in hand before the section is seated: the
     * page's picker and hold, the kit's status surface, and the five drawings. A pull that failed is named
     * on the console and seats nothing.
     */
    const PICKER = require.async('./client.picker.js');
    const HOLD = require.async('./client.hold.js');
    const KIT = require.async('./client.kit.js');
    const SECTION = require.async('./client.provider.section.js');
    const DRAW = require.async('./client.provider.draw.js');
    const MODELS = require.async('./client.provider.models.js');
    const CREDENTIAL = require.async('./client.provider.credential.js');
    const NODE = require.async('./client.provider.node.js');

    /**
     * The section's sheet, held for as long as the section stands: put in here, put back if it is taken.
     * The platform replaces a plugin in place over the module table it already holds and takes the package's
     * style tags away in the same act (`removeOwnedStyles`); the one thing it re-runs is the mount, which
     * covers a section that is left and entered again but not a component that stays mounted while the tags
     * go. The hold ends with the effect: a sheet that outlived its plugin would be a trace.
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

    /** The route's own words for a refusal, drawn as they came and never paraphrased: the message alone,
        because the code beside it is what a caller routes on and not a sentence a reader is given. Where a
        caller needs the code it reads it at its own site, as the conflict check below does. */
    const refused = (answer) => String(answer.error.message);
    /** The message of a thrown value. */
    const reasonOf = (error) => (error instanceof Error ? error.message : String(error));

    /** The value inside a namespace at the row's own path, as the platform's page reads it. */
    function atPath(value, path) {
      let node = value;
      for (const step of path) {
        if (typeof node !== 'object' || node === null) return undefined;
        node = node[step];
      }
      return node;
    }

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

    /** Filled in `apply`: the text of the section's namespace. */
    let t = (key, params) => {
      const template = EN[key] ?? key;
      if (params === undefined) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
    };

    /** The one object the parts reach this half through; the entry fills it before any part is made. */
    const shared = {
      SEAT, ID, NS, ROUTE, PROBE_ROUTE, PROBE_ACTION, CATALOGUE_ACTION, VERIFY_ACTION, WRITTEN_PATHS,
      OFF, VENDOR_EFFORTS, ORDER, WATCHED,
      refused, reasonOf, atPath, readState, saveCredential, clearCredential, writeSettings, useStyles,
    };

    return {
      /** Register the section into the seat the page declares. */
      apply(pluginCtx) {
        t = pluginCtx.locale.bind(NS);
        pluginCtx.effect(() => pluginCtx.locale.register(NS, 'en', EN), `${PACKAGE}: the Qoder dictionary`);
        /* The seat is filled when the picker the section draws, the page's own lifetime of an answer, the
           kit's status surface and the five parts are in hand: every pull began when this chunk was
           materialised, and nothing stands in the rail before there is a section to draw. */
        pluginCtx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([PICKER, HOLD, KIT, SECTION, DRAW, MODELS, CREDENTIAL, NODE]).then(
            ([pickerModule, holdModule, kitModule, sectionModule, drawModule, modelsModule, credentialModule, nodeModule]) => {
              if (!live) return;
              const parts = { t, kit: kitModule, picker: pickerModule, hold: holdModule, ctx: pluginCtx, shared };
              Object.assign(shared, modelsModule.create(parts));
              Object.assign(shared, credentialModule.create(parts));
              Object.assign(shared, nodeModule.create(parts));
              Object.assign(shared, drawModule.create(parts));
              const { QoderSection } = sectionModule.create(parts);
              armed = pluginCtx.slots.inject(SEAT, () => pluginCtx.slots.register({
                name: SEAT,
                id: ID,
                order: ORDER,
                label: () => t('section'),
                locale: NS,
              }, QoderSection));
            },
            (error) => {
              console.error(`${PACKAGE}: a chunk of the Qoder section did not arrive: ${error?.message ?? error}`);
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
