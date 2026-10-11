/**
 * The browser half of the product's page: the pair the platform's own Plugins page is built of — one
 * keyed entry in the `main` seat and one row in `sidebar.panellist`, joined by the id `coreness`. The frame
 * renders the keyed `main` cell of the active panel id and the sidebar selects that id on a click, so the
 * two registrations meet through the id alone.
 *
 * The id is the package name, and it has to be: the host half of the web shell composes one boot-graph row
 * per *package* and the browser creates an entry per row, so a factory registered under any other id — a
 * subpath included — is loaded and never materialised.
 *
 * The page is two panes: a rail of sections beside the body of the chosen one. The rail is the host's own
 * settings nav, geometry and tokens copied from the host's own settings sheet, and its rows are the sections
 * other plugins register into the seat this page declares plus the product's own first section, which is not
 * a seat: the page draws it itself. A seat nobody fills draws nothing, so the rail carries no row for it and
 * no code stands for the empty case.
 *
 * That first section is the product's overview, drawn in the host's own package-page shape, with one
 * departure: a row the bundle declares without a live entry is counted under the host's own word for a
 * component that is not running instead of the host's silent `enabled: false`, which would call an unknown
 * off.
 *
 * The facts are read, never written. The bundles are joined with the plugins by entry id, behind the
 * management gate the page applies before either call, and the switches that enable and disable a plugin
 * stay on the platform's own Plugins page: a second set here would be a second owner of one profile file.
 * The read follows the composition while the page stands — a change of the plugin manager and a reset
 * connection re-read it — and the host half of this package stays empty for the same reason: the profile's
 * facts live in host-only services a browser half cannot see, and the remotes are the platform's own door
 * to them.
 *
 * The look is the product's own markup and CSS, carrying `--dsw-alias-*` tokens as the only shared styling;
 * the platform's control library is deliberately not required as a module, as its own instruction to a page
 * author demands. The heavier surfaces are package-local chunks beside this file, which the platform serves
 * on demand and the entry asks for with the owner's own `require.async`: a chunk that never arrives leaves
 * its section out of the rail and is said on the console, because a swallowed failure would look like a page
 * that simply has nothing there.
 */
window.__ModuleLoader__.load({
  id: '@coreness/dsh',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/dsh';
    /** The id shared by the sidebar row and the panel it opens. */
    const PANEL_ID = 'coreness';
    /** The place this page declares for the sections of the plugins that come later. */
    const SECTION_SEAT = 'coreness.section';
    /** The package-local chunks beside the entry: their sections stand in that place too. */
    const CHUNKS = ['./client.mcp.js', './client.provider.js', './client.credits.js', './client.gate.js'];
    /** The locale namespace the visible text is taken from. */
    const NS = 'coreness';
    /* Two names the page used are not resolved by the running product, measured live: `--dsw-focus-ring-color` and
   `--dsw-font-mono`. The platform's own CSS writes both the same way, with the same fallbacks, so this is not a
   copy error — but the fallback is what draws, so the dead wrapper is gone and only the real value is named. */
const STYLE_ID = 'coreness-page-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/dsh/client';
    /** The product's own section, drawn here instead of registered into the page's own seat. */
    const OUR_SECTION = 'product';

    /* Registered per locale: the chain of any other language ends at `en`, so one dictionary answers
       for all. The count templates, the tag template and the tag words are the host's own; the word of
       the last count is the host's `rowStateIdle` ("Not running"), the one the host gives a component
       that is declared and not running. */
    const EN = {
      panel: 'Coreness',
      'section.product': 'The product',
      'product.off': 'Off',
      'version.tag': 'v{version}',
      'parts.label': 'Components',
      'count.total': '{count} total',
      'count.running': '{count} running',
      'count.off': '{count} off',
      'count.failed': '{count} failed',
      'count.notRunning': '{count} not running',
    };

    /* The host's own sheets, copied rule for rule and carried by its tokens alone: the settings nav, the
       package page, the detail card, the section head, the status and failure lines and the tag
       capsule. Three rules depart from the sheets they
       are taken from: `.coreness-page` lays the two panes out, `.coreness-failure` stacks its lines
       where the host's own failure row holds an action button this page has none of, and the count
       line carries the tabular figures the host puts on the version tag and on its other count line
       but not on this one. */
    const CSS = `
/* The page's own elevation, named once. The platform's --dsw-elevation-prominent is three layers with a hairline
   ring; this page's surfaces were one soft shadow, and that is a different look, chosen on purpose — so the page names
   its own instead of borrowing the platform's. The MCP dialog keeps the platform's token: it stood on it before. */
:root{--coreness-elevation:0 12px 32px #0000002e;--coreness-news-strip:160px;--coreness-pill-radius:999px}
/* The frame: the rail and the pane stand side by side and neither parts them — each brings its own measure, the
   rail a width and the pane a gutter, which a room declared between the two would not carry. */
.coreness-page{display:flex;height:100%;box-sizing:border-box;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
/* The rail carries the frame's own measures and not a section's rhythm: its width, its insets, and the distance
   between the title, the list below it and the widget under both. */
.coreness-nav{box-sizing:border-box;flex-direction:column;flex:none;gap:18px;width:188px;padding:22px 12px 0;display:flex}
.coreness-navTitle{color:var(--dsw-alias-label-primary);padding:0 12px;font-size:16px;font-weight:500;line-height:24px}
/* The nav's cells stand four apart: a cell is a line of the rail rather than a surface of its own, so the rail
   reads tighter than any list of cards. */
.coreness-navList{flex-direction:column;gap:4px;display:flex;overflow-y:auto}
.coreness-navCell{box-sizing:border-box;border-radius:var(--dsw-radius-md);cursor:pointer;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:none;align-items:center;padding:9px 16px 9px 12px;font-family:inherit;font-size:14px;font-weight:400;line-height:22px;display:flex}
.coreness-navCell:hover{background:var(--dsw-specific-sidebar-nav-item-hover)}
.coreness-navCell[aria-current='true']{background:var(--dsw-specific-sidebar-nav-item-active)}
.coreness-navCell:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
/* The pane's gutter is a clamp rather than a number: the content keeps a reading width on a wide screen and a
   margin on a narrow one, and the block under it closes the page. */
.coreness-pane{box-sizing:border-box;flex-direction:column;flex:1;align-items:center;min-width:0;padding:0 clamp(24px,4vw,48px) 48px;display:flex;overflow:auto;scrollbar-gutter:stable}
/* One named departure from the host's own page frame, which is this rule taken over whole: its .page
   rule and its .page>* rule reserve no gutter, and the bar takes its slice of the column whether or not
   it stands. The pane is what scrolls, so without the reservation a section tall enough to make it
   scroll hands the platform's own 5 px bar — the token --dsh-scrollbar-width, which is what that width
   is — a slice of its column and shifts what is left by 2.5 px — measured in one walk,
   in one window: the four sections of this page drew 692, 692, 687 and 692 px, and the host's own page
   moves the same 5 px (875 with its bar standing against 880 without it). One column, in every state, is
   what the reader asked for: a page that changes width under his hand as he switches rows is a page he
   cannot trust to be the same page. */
.coreness-pane>*{width:100%;max-width:960px}
/* The column rule again, one element deeper, because the sections the page does not draw itself arrive
   inside the renderer's own outlet anchor: the platform wraps every seat entry in a div carrying
   display:contents, so that a flex parent sees the slot's own children. Written for the pane's children
   alone the rule stops on that anchor, which has no box of
   its own, and the section inside takes its own width instead of the column. Measured in one walk at a
   viewport of 1600 px, where the pane's room is wider than the cap: The product, drawn by the page as a
   direct child, held 960, while MCP gave 953, Rate 992 and Qoder 1031; at 1920 Qoder took the whole room
   (1351) and the four left edges stood 199 px apart. The host's own page in the same seat holds one column
   of 960 at both widths and centres it (measured: 460 and 620 in rooms of 1320 and 1640). The product's own
   section needs no such rule: the page draws it into the pane itself, and the rule above already reaches it. */
.coreness-pane>[data-slot='coreness.section']>*{width:100%;max-width:960px}
/* The column every section's content stands in, under the section's own head: one declaration, worn beside its
   own class by all four sections — the overview, the gate, the MCP and the Qoder. The 28 is this column's own:
   it is the block under a section's head, and the head does not carry it. What parts the children themselves is
   a margin each one brings, which a room declared here would not carry. */
.coreness-sectionBody{flex-direction:column;min-width:0;padding-top:28px;display:flex}
/* The page's section root draws this body — the wrapper the page's own section stands in — so it stands here once,
   beside the section furniture above: the shape .coreness-sectionBody already has. */
.coreness-sectionRoot{flex-direction:column;display:flex}
/* The field family: the boxed field's body and its two states stand once here, worn beside its own class by the
   MCP's and the Qoder's fields; the disabled look is the whole family's, and its selector carries the state so
   it outranks a member's own base — the picker's trigger carries cursor:pointer, and a bare class of the same
   weight would lose to it, because the page's sheet is read before the sections' own. */
.coreness-field-box{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);width:100%;font:inherit;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:6px 10px;font-size:14px;line-height:22px}
.coreness-field-box:focus{border-color:var(--dsw-alias-state-business-primary);outline:none}
.coreness-field-box::placeholder{color:var(--dsw-alias-label-dimmed)}
.coreness-field:disabled{opacity:.6;cursor:default}
/* The page's own list: a ul stripped of the browser's own furniture and stacked as a column. Four rules carried
   this body — the two card lists and the MCP's pairs and the Qoder's models — so it stands once here and each
   sheet wears this class beside its own, keeping only its difference. The order is load-bearing: the card's own
   list states its margin below, and within one sheet, at equal specificity, the later rule is the one that stands.
   The 8 is the pitch of a list of cards — the gate's rows, the MCP's rows, the Qoder's models; a genre whose lines
   must stand tighter carries its own room beside its own class, as the refusal lines do with their 2. */
.coreness-list{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}
/* The card and its furniture, each body declared once: the card's column, its list, its box and its head row. A
   member's own qualified rule — the gate's row-cards — still wins over these, which is intent rather than conflict.
   The card's list stands under the head and takes the room there; the list's own body is the page's own, worn
   beside this class. */
.coreness-card-body{flex-direction:column;gap:8px;min-width:0;display:flex}
.coreness-card-list{margin:12px 0 0}
.coreness-card-box{border:.5px solid var(--dsw-alias-settings-card-stroke);background:var(--dsw-alias-settings-card-fill);border-radius:var(--dsw-radius-xl);flex-direction:column;gap:12px;padding:12px 14px;display:flex}
/* A card's head row: its parts stand ten apart, centred, on one line — one fact for every card the page draws,
   so the gate's, the MCP's and the Qoder's cards wear this class beside their own name for the head and keep
   only what their own head adds. A section's heading is not this row: it stands on a baseline and may carry
   its line inside itself, so that room stays beside the heading's own class. */
.coreness-card-head{align-items:center;gap:10px;flex-wrap:nowrap;display:flex}
.coreness-titleRow{flex-wrap:wrap;align-items:center;gap:8px;min-width:0;display:flex}
.coreness-title{margin:0;font-size:20px;font-weight:500;line-height:28px}
.coreness-tag{display:inline-flex;align-items:center;border-radius:var(--dsw-radius-xs);corner-shape:round;padding:1px 6px;font-size:12px;line-height:18px;font-weight:400;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
/* A tone names the chip's own background. The colour of its words belongs to the chip's own class beside it,
   and this rule used to set it too — with an attribute selector (0,2,0) it won over the class (0,1,0), so the
   product's chip read in the secondary grey while the three chips in the other sections read in the tertiary
   one. The user asked for one grey on all four; the winner was this rule, and the rule gave its colour up. */
.coreness-tag[data-tone='neutral']{background:var(--dsw-alias-bg-module-platform)}
.coreness-version{font-variant-numeric:tabular-nums;flex:none}
.coreness-name{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;margin:0;font-size:14px;line-height:22px}
.coreness-name code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.coreness-desc{color:var(--dsw-alias-label-secondary);margin:0;font-size:14px;line-height:22px}
/* A hint line: the page's small role, one pair for it everywhere — 12/18 in label-tertiary. Three rules carried
   this body in two sheets — the MCP's state sentence and its rows' dim line, and the Qoder's notes, hints and
   refusals — so it stands once here and each of them wears this class beside its own name for the line, keeping
   only what is that line's own: the Qoder's room in a card head. The three names stay in the markup, because
   the page's own readings select these lines by them — the hint sample among them — and a fold that dropped a
   name would empty a reading rather than move a pixel. */
.coreness-dim{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}
/* A room where a line is cut: one line, never wrapped, cut with an ellipsis, its height **derived** from the
   line-height and never from a bound — the page reserves nothing on a line, so nothing here declares one. One
   body, one sheet: the picker's value beside its arrow and the Qoder's own note in a model row wear this class
   rather than carrying the same three declarations in two places. The overflow is load-bearing twice — it hides
   the cut text and it lets a flex item shrink below its content, which is what lets the cut reach. Read on the
   drawn page at 1280×900, five rows each saying the vendor's levels could not be read: a row is 188 px and the
   models card 687×1258; with this class dropped in the run's own copy the same sentence takes a second line — the
   row 206, the card 687×1348 — and the ninety pixels are the five rows' one line each, which is what a longer
   sentence costs the card where this shape does not stand. */
.coreness-cutLine{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* The block under the product's own card stands at the same distance as a card inside a section: 12, the number
   the whole page names for "a card to what follows it"; the user read the larger pass that stood there before it
   as "the card is made by size, not by intervals… there is a big pass there too". The product card itself carries
   no height at all: its box is its parts (the title row, the name, the description) and one 8 between them, the
   sibling number. The panel's own absent padding and radius is a decision of its own and is not touched here. */
.coreness-sections{flex-direction:column;margin-top:12px;display:flex}
/* A section's heading is a row of its own kind: its parts stand on a shared baseline, and a heading may carry
   its line inside itself as a column, so it wears no card head and this room is the heading's own. The two
   rows read the same number and are two facts. */
.coreness-sectionHead{align-items:baseline;gap:10px;display:flex}
.coreness-sectionTitle{margin:0;font-size:16px;font-weight:500;line-height:24px}
.coreness-sectionCount{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.coreness-failure p{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}
/* The block a section's failed state stands in — the body the census counted in three sheets. It is declared
   once here and worn beside its own class by the three sections that draw it (the overview's failure block, the
   MCP's and the Qoder's), so the block is one element; the paragraph inside it is each section's own. */
.coreness-failed{color:var(--dsw-alias-state-error-primary);flex-direction:column;gap:4px;display:flex}
/* The button, declared once and worn by every section that draws one, beside that section's own class: the
   base, the hover, the primary fill and its hover, the disabled look and the ring stood byte for byte in
   three sections' sheets — the gate's, the MCP's, the Qoder's — so a design change to the button was three
   edits and the third was the one forgotten. What stays in a section is what is that section's own: the
   MCP's danger hover and its small role, the gate's danger tone, and the Qoder's controls carrying no ring
   of the page's. The order below is load-bearing: the add box wears this class
   and states in its own rule the properties where it differs, and within one sheet, at equal specificity, the
   later rule is the one that stands. */
.coreness-button{box-sizing:border-box;border-radius:var(--dsw-radius-md);font:inherit;cursor:pointer;border:.5px solid var(--dsw-alias-border-l3);background:0 0;color:var(--dsw-alias-label-primary);justify-content:center;align-items:center;padding:6px 14px;font-size:14px;line-height:22px;display:inline-flex}
.coreness-button:hover:not(:disabled),.coreness-button[data-active='true']{background:var(--dsw-alias-interactive-bg-hover)}
.coreness-button[data-tone='primary']{border:none;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.coreness-button[data-tone='primary']:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.coreness-button:disabled{opacity:.4;cursor:default}
/* The field's own column: what every control this page labels is built as — a label with its control beneath it,
   one short gap between. A sheet that draws a field wears this class beside its own and keeps only what its own
   field adds. */
.coreness-field{flex-direction:column;gap:6px;display:flex}
/* The field's own label: the arrangement the page's labels are the same by intent in — one inline row, its own item
   centred. The voice of a label — its colour, its size, its weight, its line — is a value the user chose and stands
   in the chunk that draws the label, beside that chunk's own geometry; a sheet that draws a field label wears this
   class beside its own and keeps only what its own label adds. */
.coreness-fieldLabel{align-items:center;display:inline-flex}
/* The ring is for the controls that carry no border of their own — a button, the dashed "add" box. A text field
   is not one of them: it has a border, and a focused field is marked by colouring that border, which is what the
   platform does and what the Qoder's field does. With the field in this list it wore **both** — a 2 px shadow ring
   over a coloured border — and the user read it as "too thick a blue band, twice the platform's, while Qoder's
   looks right" (measured: ours a 2 px box-shadow plus a .5 px border; Qoder's the .5 px border alone). */
.coreness-button:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary);outline:none}
/* The danger look of a button — the pair the census counted byte for byte in the gate's sheet and the
   MCP's — is declared once here, after the button it varies, and the one control that draws it wears it
   beside the shared button class, which already carries the resting background: what stands here is what the
   danger look changes away from that class. */
.coreness-tone-danger{border:none;color:var(--dsw-alias-state-error-primary)}
/* Three of the page's elements stand here once and are worn by the sections that draw them: the button, the
   add row with its own control, and the answer strip, whose reserved width is the named value on the root
   above. Each was byte-identical private rules before this, and the strips' tones followed the same road
   afterwards: they stood in the chunk of the section that brought the strip, while the strip itself is worn
   by every section that draws an answer — so the rate limiter painted its own colours beside them, and the
   user read the result off his screen: the same word, another colour in the section next to it. One rule per
   tone, beside the strip that wears them. */
.coreness-addRow{margin-top:12px;display:flex}
/* The add box: the shared button class above, plus the properties where this element differs from it — a
   dashed hairline, the larger radius, the stretch and its own 180px floor. Everything else it draws is the
   shared rule's, so a change to the button reaches this box too; a declaration here repeating a shared value
   would take that reach away in silence, and that is the second spelling this fold exists against. */
.coreness-add{border:1px dashed var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-lg);flex:1 1 0;min-width:180px}
.coreness-answer{flex:0 0 var(--coreness-news-strip);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;font-size:12px;line-height:18px}
/* The three tones an answer can carry, and the only place their colours are written: the words are the page's
   own — plain, done, fault: the same three the status map uses and the same three every section writes into
   data-tone — and a section that paints a strip itself is the defect this stands against. Plain is the colour
   the page's own status word carries for a value that states nothing either way. */
.coreness-answer[data-tone='plain']{color:var(--dsw-alias-label-tertiary)}
.coreness-answer[data-tone='done']{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-label-secondary))}
.coreness-answer[data-tone='fault']{color:var(--dsw-alias-state-error-primary,var(--dsw-alias-label-primary))}
/* The tone of a state's sentence — the body the census counted ten times over four sheets. It stands once here
   and is worn beside its own class by every element that draws it, so a tone moves in one place and not in ten.
   The element's own tone attribute is what scopes the rule: this sheet is injected before the sections' own, and
   an unscoped class of the same weight would lose to the neutral colour each section paints on the same element
   (the gone line's grey, the trouble line's amber) — the fold would then be a rule that changes nothing. The
   words stay the sections' own: the gate says error, the MCP's menu says danger, the status map says fault, and
   each section maps its word to this class where it draws. The strip's own three rules above are not this: their
   bodies carry a fallback these do not, and one spelling of a colour is a decision, not a copy. */
.coreness-tone-done[data-tone]{color:var(--dsw-alias-state-success-primary)}
.coreness-tone-fault[data-tone],.coreness-tone-fault[data-level]{color:var(--dsw-alias-state-error-primary)}
/* What the page's own check controls are built as: a box and its word held on one line. The arrangement stands
   once here; the words' type and the distance between the two are drawn by the section that draws the control,
   and stay in that sheet. */
.coreness-check{display:inline-flex;align-items:center}
/* Under the reader's own request for less motion nothing inside a section animates, and the fact stands once for
   the whole page: the gate, the MCP and the Qoder wear this class on their own roots, and a section that answers
   the request wears it beside them. What it switches off here is the MCP marker's own turn; the credits widget
   declines it on purpose, its turn being the one sign that a reading runs. The declaration is made heavy because
   the sections' own sheets are injected after this one and a section's selector is heavier than the star standing
   here: a plain transition: none loses the cascade to the very rule it means to switch off, and the marker turns
   for the reader who asked it not to. */
@media (prefers-reduced-motion:reduce){.coreness-still *{transition:none!important}}
`;

    /**
     * The page's sheet, held for as long as the page stands: put in here, put back if it is taken.
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

    /** The page's stylesheet as a tag: put in once, and never removed by this code. */
    function ensureStyles() {
      if (document.getElementById(STYLE_ID) !== null) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.setAttribute('data-plugin', PACKAGE);
      style.setAttribute('data-plugin-css', STYLE_TAG);
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    /** A slot label is a thunk so a row follows the language without a re-registration. */
    const resolveLabel = (label) => (typeof label === 'function' ? label() : label);

    /** Filled in `apply`: the plugin's own context, and the text of its namespace. */
    let ctx;
    let t = (key) => key;

    /**
     * What the product's own section last read, and the moment it read it.
     *
     * The browser half is materialised once per application session, so a section that is left and entered
     * again has this beside it. A mount paints it at once and the read corrects it behind; the session's
     * *first* mount has nothing and keeps the honest skeleton. It holds a read picture and never the visit's
     * own state.
     */
    let lastRead = null;

    /** The count line over the components: the total, then only the states that occur. */
    function countLine(rows) {
      const running = rows.filter((row) => row.live && row.enabled && row.phase === 'active').length;
      const off = rows.filter((row) => row.live && !row.enabled).length;
      const failed = rows.filter((row) => row.phase === 'failed').length;
      /* A row the bundle declares and the live graph does not carry has no enablement to read, so it
         is not counted as off: it is counted under the host's own word for a component that is
         declared and not running. The host's own line calls such a row off, because its join writes
         `enabled: live?.enabled ?? false` — a substitution this page refuses. */
      const notRunning = rows.filter((row) => !row.live).length;
      /* The rule of the line is the host's: the total always, a state only when it
         occurs, so a departure stands out by being there at all. */
      return [
        t('count.total', { count: String(rows.length) }),
        ...running > 0 ? [t('count.running', { count: String(running) })] : [],
        ...off > 0 ? [t('count.off', { count: String(off) })] : [],
        ...failed > 0 ? [t('count.failed', { count: String(failed) })] : [],
        ...notRunning > 0 ? [t('count.notRunning', { count: String(notRunning) })] : [],
      ].join(' · ');
    }

    /** What the overview says about the product's own plugin, as the host answers. */
    async function readComposition() {
      const failed = (reason) => ({ status: 'error', reason });

      const inventory = await ctx.remote.pluginInventory.list();
      if (!inventory.ok) return failed(`${inventory.error.code}: ${inventory.error.message}`);
      if (inventory.value.managementAvailable !== true) return { status: 'unavailable' };

      const [bundles, plugins] = await Promise.all([
        ctx.remote.pluginManager.listBundles(),
        ctx.remote.pluginManager.listPlugins(),
      ]);
      const refused = [bundles, plugins].find((answer) => !answer.ok);
      if (refused !== undefined) return failed(`${refused.error.code}: ${refused.error.message}`);

      const bundle = bundles.value.find((item) => item.name === PACKAGE);
      if (bundle === undefined) return { status: 'absent' };
      return {
        status: 'ready',
        name: bundle.name,
        version: bundle.version,
        description: bundle.description,
        enabled: bundle.enabled,
        rows: bundle.rows.map((row) => {
          const live = row.entryId === undefined
            ? undefined
            : plugins.value.find((plugin) => plugin.entryId === row.entryId);
          return live === undefined
            ? { live: false, enabled: false, phase: null }
            : { live: true, enabled: live.enabled === true, phase: live.fiberPhase ?? null };
        }),
      };
    }

    /** The four states this page draws, in the one component's own words: `error` reads as `unread` and
        `absent` as `unset`, where the entry's own sentences said the same thing at length and the user asked
        for the short phrase instead; `unavailable` reads as `unwritable`, which names the cause the sentence
        carried (no manageable profile) rather than its symptom (nothing could be read here). */
    const STATUS_OF = { loading: 'loading', error: 'unread', absent: 'unset', unavailable: 'unwritable' };

    /** The product's own first section: what the composition holds of this package, and its count. */
    function ProductSection() {
      const [state, setState] = React.useState(lastRead === null ? { status: 'loading' } : lastRead.state);
      const [revision, setRevision] = React.useState(0);

      /* The one component is pulled the way every section pulls a sibling: once, on mount, and the status is
         drawn when it arrives. Nothing is reserved until then — this page keeps no reserved boxes. */
      const [status, setStatus] = React.useState(null);
      React.useEffect(() => {
        let live = true;
        require.async('./client.status.js').then(
          (element) => { if (live) setStatus(element); },
          (error) => { if (live) console.error(`${PACKAGE} · status · ${error?.message ?? error}`); },
        );
        return () => {
          live = false;
        };
      }, []);

      /** The page's own status: one value of the closed map, drawn by the one component and by nothing else. */
      const statusLine = (value) => (status === null ? null : status.statusNode({ subject: 'Profile', value }));

      /* The composition goes into the session's memory as it is published, so the next mount paints the card
         at once. Only a read that answered is remembered: a skeleton is not knowledge, and a failed read
         keeps what stands with its own branch. */
      React.useEffect(() => {
        if (state.status === 'ready') lastRead = { state, at: Date.now() };
      }, [state]);

      React.useEffect(() => {
        let live = true;
        readComposition().then(
          (next) => {
            if (live) setState(next);
          },
          (error) => {
            if (live) setState({ status: 'error', reason: String(error?.message ?? error) });
          },
        );
        return () => {
          live = false;
        };
      }, [revision]);

      /* The composition is alive while the page stands. `plugin-manager/changed` is the host's own
         announcement of it — forwarded to the browser like the platform's own page reads it — and a
         reset connection invalidates whatever was read before it; the same pair of listeners the
         platform's own page keeps. */
      React.useEffect(() => {
        const reread = () => setRevision((current) => current + 1);
        const disposers = [
          ctx.remote.$on('plugin-manager/changed', reread),
          ctx.on('connection/reset', reread),
        ];
        return () => {
          for (const dispose of disposers) dispose();
        };
      }, []);

      if (state.status === 'error') {
        return h('div', { className: 'coreness-overview coreness-sectionBody' },
          h('div', { className: 'coreness-failure coreness-failed' }, [
            statusLine(STATUS_OF.error),
            h('p', { key: 'reason' }, state.reason),
          ]));
      }

      if (state.status !== 'ready') {
        return h('div', { className: 'coreness-overview coreness-sectionBody' }, statusLine(STATUS_OF[state.status]));
      }

      const titleRow = [
        h('h3', { key: 'title', className: 'coreness-title' }, t('panel')),
        state.version === undefined
          ? null
          : h('span', {
            key: 'version',
            className: 'coreness-tag coreness-version',
            'data-tone': 'neutral',
          }, t('version.tag', { version: state.version })),
        state.enabled
          ? null
          : h('span', {
            key: 'off',
            className: 'coreness-tag',
            'data-tone': 'neutral',
          }, t('product.off')),
      ];

      return h('div', { className: 'coreness-overview coreness-sectionBody' }, [
        h('div', { key: 'card', className: 'coreness-card coreness-card-body' }, [
          h('div', { key: 'title', className: 'coreness-titleRow' }, titleRow),
          h('p', { key: 'name', className: 'coreness-name' }, h('code', null, state.name)),
          state.description === undefined
            ? null
            : h('p', { key: 'desc', className: 'coreness-desc' }, state.description),
        ]),
        h('div', { key: 'parts', className: 'coreness-sections' },
          h('div', { className: 'coreness-sectionRoot' },
            h('div', { className: 'coreness-sectionHead' }, [
              h('h4', { key: 'label', className: 'coreness-sectionTitle' }, t('parts.label')),
              h('span', { key: 'count', className: 'coreness-sectionCount' }, countLine(state.rows)),
            ]))),
      ]);
    }

    /** The rail's rows: the product's own section first, then whatever other plugins declared. */
    function sectionRows() {
      return [
        { id: OUR_SECTION, order: 0, label: t('section.product') },
        ...ctx.slots.entries(SECTION_SEAT).map((entry) => ({
          id: entry.options.id,
          order: entry.options.order ?? 0,
          label: resolveLabel(entry.options.label) ?? entry.options.id,
        })),
      ].sort((a, b) => a.order - b.order);
    }

    /** The page: a rail of sections beside the body of the chosen one. */
    function CorenessPage(props) {
      const { renderSlot } = props;
      const [chosen, setChosen] = React.useState(OUR_SECTION);
      const [, setSeatRevision] = React.useState(0);

      /* The page's sheet, ensured where the page is drawn: the platform's own replace re-mounts a plugin
         over the module table it already has and takes the package's style tags with it, so the mount is the
         one place a sheet can be put back. */
      useStyles();

      React.useEffect(() => {
        const reread = () => setSeatRevision((revision) => revision + 1);
        const offSeat = ctx.slots.subscribe(SECTION_SEAT, reread);
        const offLocale = ctx.locale.subscribe(reread);
        return () => {
          offSeat();
          offLocale();
        };
      }, []);

      const rows = sectionRows();
      /* A chosen row whose plugin has gone draws nothing, so the page falls back to its own section. */
      const active = rows.some((row) => row.id === chosen) ? chosen : OUR_SECTION;
      const body = active === OUR_SECTION
        ? h(ProductSection, { key: active })
        : renderSlot(SECTION_SEAT, { id: active }, { only: active });

      return h('div', { className: 'coreness-page' }, [
        h('nav', { key: 'rail', className: 'coreness-nav', 'aria-label': t('panel') }, [
          h('div', { key: 'title', className: 'coreness-navTitle' }, t('panel')),
          h('div', { key: 'list', className: 'coreness-navList' },
            rows.map((row) => h('button', {
              key: row.id,
              type: 'button',
              className: 'coreness-navCell',
              'aria-current': row.id === active ? 'true' : undefined,
              onClick: () => setChosen(row.id),
            }, row.label))),
        ]),
        h('div', { key: 'pane', className: 'coreness-pane' }, body),
      ]);
    }

    /** The sidebar row's glyph; the shell hands it the size its column currently draws. */
    function CorenessGlyph({ size = 18 }) {
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        'aria-hidden': true,
      }, [
        h('circle', { key: 'outer', cx: 12, cy: 12, r: 9, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('circle', { key: 'inner', cx: 12, cy: 12, r: 3.25, fill: 'currentColor' }),
      ]);
    }

    return {
      /* The remotes the page and its chunks read through: the composition of this profile, the
         provider directory, the credential store the token is written to, the settings mirror the
         reference is read from, and the model catalogue. A chunk borrows the context of the entry
         that pulled it, so the namespaces it uses are declared here, in one place — the platform's own
         models page declares the same four. */
      inject: [
        'slots',
        'locale',
        'remote',
        'remote.pluginManager',
        'remote.pluginInventory',
        'remote.llm',
        'remote.credentials',
        'remote.settings',
        'remote.session',
      ],
      apply(pluginCtx) {
        ctx = pluginCtx;
        t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, 'en', EN), `${PACKAGE}: dictionary`);

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
          children: { [SECTION_SEAT]: { kind: 'list', scope: 'root' } },
        }, CorenessPage));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 10,
          label: () => t('panel'),
          locale: NS,
        }, CorenessGlyph));

        /* The chunks beside this entry carry the product's own sections. Each one registers itself
           into the seat this page declared, so the chunk needs nothing from here but the context:
           one id per chunk, and no shared state to keep in step. */
        for (const chunk of CHUNKS) {
          ctx.effect(() => {
            let live = true;
            let dispose = null;
            require.async(chunk).then(
              (loaded) => {
                if (!live) return;
                dispose = loaded.apply(ctx) ?? null;
              },
              (error) => {
                /* Nothing on the page can say this: the section is simply absent from the rail, so
                   the failure goes where the user looking at the page can find it. */
                console.error(`${PACKAGE}: the chunk ${chunk} did not arrive: ${error?.message ?? error}`);
              },
            );
            return () => {
              live = false;
              if (typeof dispose === 'function') dispose();
            };
          }, `${PACKAGE}: ${chunk}`);
        }
      },
    };
  },
});
