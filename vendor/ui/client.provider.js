/**
 * The product's Qoder section: the token pasted once, the node the requests go to, and the state and the
 * models read from the platform's own doors.
 *
 * A package-local chunk beside the page's entry, pulled with the entry's `require.async`, registering into
 * the seat the page declares under an id and a locale namespace of its own. This file carries the section's
 * words and sheet, the platform's read and its writes (the row, the store, the settings), the catalogue's
 * action, and its seat; the drawing and the section's own lifetime are the six parts beside it
 * (`client.provider.section.js`, `.draw.js`, `.models.js`, `.credential.js`, `.node.js`, `.web.js`), all
 * created over one `shared` and seated only once the kit, the picker and the hold are in hand.
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
 * offers exactly the menu the model publishes, plus the product's own `Off`. What the platform is told is a vocabulary
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
    /** The section's sheet: its own id and the module id it is marked with, as the host marks its own. */
    const STYLE_ID = 'coreness-ui-qoder-style';
    const STYLE_TAG = '@coreness/ui/client.provider.js';
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
     * node. All four are volatile in the plugin's schema, which is what makes a write here apply to
     * the running route; a name missing from the settings mirror is named instead of attempted.
     */
    const WRITTEN_PATHS = ['models', 'defaultContextWindow', 'inferBase', 'webAccess'];
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
     * It is a copy, and it is named as one: the scale is the route's own body half's (`VENDOR_EFFORTS`). It
     * orders this page's drawing and nothing else — the effort a row names travels as it stands, and no level is
     * substituted on the wire. Here it answers a narrower question the catalogue cannot: the page has to *draw* a
     * menu in a settled order, and the vendor publishes it as an object whose keys carry no order at all — the
     * route's own `effortsOf` sorts only the default first.
     */
    const VENDOR_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'];
    /** Where the section's own reads start: the route, its credential and its models. */
    const ORDER = 20;
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
      intro: 'The provider this product ships: the state of its credential, the node its requests go to, the models it offers and its web switch. The token is written to the platform\'s credential store under the reference the profile names, the route\'s own settings are written through the platform\'s settings section, and the platform\'s own Settings → Models is the other door to the same values.',
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
      /* The press's one word in a card's strip: the vendor's verdict on the value, the node's answer, the
         clear that stood, and the check that settled nothing. The kit's map names a verdict as a sentence
         about the card's subject, and the strip's fixed room holds one word — so the section writes the
         short form here and the reason behind each stands in the console. */
      'verdict.accepted': 'Accepted',
      'verdict.refused': 'Refused',
      'verdict.answered': 'Answered',
      'verdict.unanswered': 'No answer',
      'verdict.none': 'No verdict',
      'verdict.cleared': 'Cleared',
      /* The conditions the kit's map has no value for — the property that a profile declares no route, that
         its settings section is not mounted, that it names no credential reference. The corner speaks the
         map's vocabulary alone, so a condition with no value there stands in the strip's one word. */
      'condition.undeclared': 'Not declared',
      'condition.unmounted': 'Not mounted',
      'condition.noplace': 'No reference',
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
      /* The row's one press about data sharing, and the states it can stand in: the plan's lock, a vendor
         that did not change the value, and a state that could not be read. */
      'privacy.on': 'Data sharing: on',
      'privacy.locked': 'Data sharing: on — the plan locks it',
      'privacy.attempted': 'Data sharing: on — the vendor did not change it',
      'privacy.source': 'source: {source}',
      'privacy.plan': 'plan: {plan}',
      'privacy.stop': 'Stop sharing',
      'privacy.stopping': 'Stopping…',
      'privacy.unread': 'Data sharing: the state has not been read',
      'privacy.failed': 'Data sharing: the press did not answer — {reason}',
      'node.map': 'from the node map',
      'node.check': 'Check node',
      'node.checking': 'Checking…',
      'node.failedNode': '{node} — {reason}',
      'refused.title': 'Nodes that did not answer',
      'models.label': 'Models',
      'models.none': 'The route offers no model in this profile yet',
      'models.fallbackWindow': 'the fallback window',
      'models.rowProblem': 'Row {index}: {message}',
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
         says it in. The sentence stands in the models card's strip while the press's hold lasts, and the corner
         states the card's own condition; the reason a save failed is the console's. */
      'models.added': 'A row was added',
      'models.addedAgain': 'Another row was added',
      'models.pick': 'Choose a model',
      'models.catalogDown': 'live catalog unavailable',
      /* The one word the earlier build did not need: its section waited for the catalogue inside the read, so a
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
      'web.title': 'Web access',
      'web.label': 'Use Qoder for web search and fetch',
      'web.unread': 'The web settings could not be read',
      'web.footnote': 'On replaces the DeepSeek web search and fetch with Qoder. The DeepSeek search URL, API key and result count stay stored but are not used. Off returns the standard DeepSeek search. The platform\'s Web search page is the DeepSeek page; the latest save of the shared web settings wins. Off by default.',
    };
    /* The section's own sheet: the rules this section draws with. The card frame, the card head, the section
       head, the field, the check, the button, the hint line, the tag and the answer strip are the page's and
       stand in the entry's sheet or the kit; what stands here is the section's own furniture — the card's
       name, its line, its tag's border, its grid and its foot, the node row, the refusal block, the first
       paint's bars and the place rule the page's strip takes in this section's heads. */
    const CSS = `
/* The card's name, and the room that keeps the strip at the head's right edge: the name takes the growing
   space, so the status word and the strip stand at the card's right whatever the head carries. The name is
   a row of its own, because the connection's dot stands inside it: grown on its own, the name would push a
   dot drawn after it to the middle of the head, and the mark belongs beside the name at the card's left.
   Its pair and ink are the set's card title, worn beside this class where the name is drawn. */
.coreness-qoder-name{flex:1 1 auto;display:flex;align-items:center;gap:10px}
/* The strip stands last in the head, after the page's status word: the word carries the one auto margin the
   row needs, and a second auto on the strip split the free space between the two — the word landed at the
   card's middle while the strip took the right edge. The strip keeps its own reserved room there, empty as
   it stands before the word arrives. */
.coreness-qoder .coreness-card-head > .coreness-answer{order:2}
/* The shared tag's radius, padding, pair and ink are the page's; the section adds its own border and keeps the
   tag from growing with the head. */
.coreness-qoder-tag{border:.5px solid var(--dsw-alias-border-l3);flex:none}
.coreness-qoder-line{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
.coreness-qoder-actions{justify-content:flex-start;gap:8px;display:flex}
.coreness-qoder-node{align-items:center;gap:8px;flex-wrap:wrap;display:flex}
/* The press stands right after the address it belongs to: nothing in this row is pushed to its right end and
   nothing stands between the two, so no answer arriving can move the press. A place rule here would carry the press
   away from the address it belongs to. */
.coreness-qoder-node > .coreness-qoder-line{flex:0 0 auto}
.coreness-qoder-model{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-lg);flex-direction:column;gap:10px;padding:12px 14px;display:flex}
/* The form's fields find their own columns and break where the room runs out — the columns are drawn by the grid
   and not fixed as the MCP's are — so the ten between them is a grid's distance, taken while the fields wrap. */
.coreness-qoder-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
/* The row of inputs below a field may break onto lines, and its distance is a line's own: the twelve is wider than
   a grid's six because a wrapping row is read as it goes, and the room it takes belongs to this chunk. */
.coreness-qoder-inputs{flex-wrap:wrap;align-items:center;gap:12px;display:flex}
.coreness-qoder-foot{justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;display:flex}
/* The reasons a sweep's nodes gave stand in a block of their own, under every card: the list is as long
   as the node map, and a list of unknown length inside a card grows the card and moves every block under
   it. The gate keeps its own refusals the same way, in a block below its cards. */
.coreness-qoder-refused{flex-direction:column;gap:10px;margin-top:12px;min-width:0;display:flex}
/* What the refusals list adds to the page's own list: its rows are one-line reasons rather than rows of controls,
   so its rhythm is tighter — the 2 against the shared 8. */
.coreness-qoder-refusedList{gap:2px}
/* The first paint: the read is a round trip, and the section stands in the shape the answer will take
   before it lands — the three card frames, the sentences the section owns and a bar where the read's
   own content will land: a value, an address, a control, a row. A bar wears the class of the part it
   stands for, so its box is that part's own rule and not a second number here; it is never flex:none,
   so it cannot push the card it waits in. The bars do not pulse. */
.coreness-qoder-skeleton{background:var(--dsw-alias-bg-skeleton,var(--dsw-alias-interactive-bg-hover));border-color:transparent;border-radius:var(--dsw-radius-xs);color:transparent}
/* The line a bar stands in for, which is what makes its box the part's box: a box with no content is its padding
   and its hairline alone, so the bar carries one line of its own type and takes the part's box with it, the way the
   control's own height is derived from its padding and its line. No number stands for either of them here; the line
   bar carries a height of its own below and this rule does not move it. */
.coreness-qoder-skeleton::before{content:'\\00a0'}
/* The height of the line this stands in for, and nothing else: .coreness-qoder-line is 14/22, so the swap from the
   skeleton to the words moves nothing. A width is its own business — it says how much text is coming. */
.coreness-qoder-skeleton.coreness-qoder-line{height:22px;width:220px}
.coreness-qoder-skeleton.coreness-button{width:120px}
`;

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

    /**
     * The parts beside this entry, pulled at materialisation and in hand before the section is seated: the
     * page's picker and hold, the kit's status surface, and the six parts. A pull that failed is named
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
    const WEB = require.async('./client.provider.web.js');

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
      const webEnabled = profile?.webAccess == null ? 'unknown' : profile.webAccess.enabled === true;
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
        /* The platform's web row, read in the same settings answer as the Qoder row: one read carries
           both subjects, and `settings/document-updated` refreshes them together. */
        web: shared.webRowOf(settings.value),
        webEnabled,
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
     * own read (`read`), and that **one** answer is what the card's state and the press's word in its strip
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
     * what says the value is gone — one read, the same one the card's state is drawn from. A store that
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

    /** The one object the parts reach this half through; the entry fills it before any part is made. The
        section's sheet is held here, in the entry, beside the words it draws with: a part wears it by calling
        `useStyles` where the section is drawn, the way every section of the page does. */
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
           kit's status surface and the six parts are in hand: every pull began when this chunk was
           materialised, and nothing stands in the rail before there is a section to draw. */
        pluginCtx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([PICKER, HOLD, KIT, SECTION, DRAW, MODELS, CREDENTIAL, NODE, WEB]).then(
            ([pickerModule, holdModule, kitModule, sectionModule, drawModule, modelsModule, credentialModule, nodeModule, webModule]) => {
              if (!live) return;
              const parts = { t, kit: kitModule, picker: pickerModule, hold: holdModule, ctx: pluginCtx, shared };
              Object.assign(shared, modelsModule.create(parts));
              Object.assign(shared, credentialModule.create(parts));
              Object.assign(shared, nodeModule.create(parts));
              Object.assign(shared, webModule.create(parts));
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
