/**
 * The MCP section of the product's page: the servers of the profile as cards, an editor in place, a
 * confirmation before a removal and a switch on each card — read and written through the plugin's own
 * route alone.
 *
 * The chunk is pulled by the entry, not by the shell: a package-local file beside the entry is served on
 * demand and the entry asks for it with the owner's own `require.async`, which
 * the module system answers by loading the sibling script and expecting it to register under the
 * package's id and the file's own name.
 *
 * What it draws is the host's own management list, copied rule for rule with the class names
 * renamed, because a block that invents its own numbers stops looking like the window it lives in:
 * the card, the fields, the buttons, the confirmation and the modal chrome are the host's own sheets, and they
 * carry `--dsw-alias-*` tokens as their only shared styling.
 *
 * A save's outcome is the route's answer, which is the servers file read back — never the absence of
 * an error. The platform's own remove path resolves a row by its path from the root and then hands
 * that path to the group that holds it, which knows the row by its short id: the lookup misses, the
 * group returns in silence, and the file is written with the row still in it. A form that believed
 * "the request went through" would show the user "removed" and the row would be back at the next
 * read, so every save here shows what the file now holds, and a disagreement is said in words.
 */
window.__ModuleLoader__.load({
  id: '@coreness/dsh/client.mcp.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The plugin's own door: the picture on a GET, one save on a POST. */
    const ROUTE = '/api/coreness.mcp';
    /** The seat the page declares for the sections of the plugins that come later. */
    const SEAT = 'coreness.section';
    /** The rail row's own id inside that seat. */
    const ID = 'mcp';
    /** The locale namespace of the section's words. */
    const NS = 'coreness.mcp';
    const STYLE_ID = 'coreness-mcp-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/dsh/client.mcp.js';
    const PACKAGE = '@coreness/dsh';

    /**
     * The transports the form offers, and the words for them.
     *
     * The value is the platform's own spelling — it is what the row carries and what the route reads —
     * while the label is the page's: `streamable-http` and `stdio` are wire words, and the corporate
     * kind is not the platform's at all, it is the internal platform's own CLI started as a local
     * process, declared in the host's own row reader under `KINDS`.
     */
    const TRANSPORTS = ['streamable-http', 'stdio', 'corporate'];
    const TRANSPORT_LABELS = {
      'streamable-http': 'kind.http',
      'stdio': 'kind.stdio',
      'corporate': 'kind.corporate',
    };

    /**
     * The page's own picker, drawn where a value is chosen from a settled list: the kind of an MCP row,
     * which is three values the platform names. It lives in a chunk of its own
     * because three of the page's sections draw it, and this chunk pulls it the way the entry pulls this
     * one: a sibling file beside the entry, materialised once for the whole package.
     *
     * The pull starts at materialisation, and the section is seated only once the control is in hand, so
     * nothing is drawn before the thing that draws it exists. A pull that failed is named on the console
     * and seats nothing — the rule the entry applies to a chunk that did not arrive.
     */
    const picker = require.async('./client.picker.js');
    let IdPicker = null;
    let chevronMark = null;
    /* The page's one lifetime for a temporary answer, pulled beside the picker and in hand before the section
       stands: a note whose hold was unknown would never go, and a fallback number written here would be the
       second copy this page deliberately does not have. */
    const hold = require.async('./client.hold.js');
    let holdOf = null;
    /* The page's one door to the console, pulled for the same reason and in hand before the section stands:
       a refusal's reason leaves the face and stands where a reader who needs it looks, and the page keeps one
       door for that rather than one per section. */
    const status = require.async('./client.status.js');
    let statusDetail = null;

    /**
     * The refusals of the plugin's route. The host's own row reader names the same set, and a
     * check holds the two lists together: a code one half knows and the other does not is a save
     * whose failure nobody can read.
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

    /* The section's own words. One namespace, one dictionary: the rail row's label is a thunk so it
       follows the language without a re-registration, and every failure the route can answer with
       has words here rather than a bare code. */
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
      'tools.label': 'Tools:',
      'tools.count': 'Tools ({count})',
      'actions': 'Row actions',
      'open': 'Show the details',
      'close': 'Hide the details',
      'trouble.label': 'The host says',
      'trouble.hint': 'the platform\'s own MCP client on this row',
      'editor.kept': 'This form writes the fields it shows; a field of the row it does not show stands as your own file has it',
      'refs': 'The file holds an expression in {names}; this form does not write over it',
      'tag.foreign': 'not an MCP row',
      'field.name': 'Name',
      'field.nameFixed': 'Name — the row id, and a rename is a new row plus a removal',
      'field.transport': 'Transport',
      'kind.http': 'Streamable HTTP',
      'kind.stdio': 'Standard input/output',
      'kind.corporate': 'Corporate bridge',
      'help.corporate': 'The connection is made by the internal platform\'s own CLI on this machine; the access token is not typed here and is not held by this page.',
      'field.url': 'Address',
      'field.command': 'Command',
      'field.args': 'Arguments, one per line',
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
      'done.created': 'Saved',
      'done.updated': 'Saved',
      'done.nothing': 'Nothing changed',
      'done.removed': 'Saved',
                              'fault.bad-action': 'The page asked for a save the plugin does not take',
      'fault.bad-name': 'A server name is 1 to 32 letters, digits, underscores or hyphens',
      'fault.name-taken': 'Another row of this file already takes that name',
      'fault.no-file': 'This composition declares no servers file',
      'fault.no-row': 'The servers file holds no such row',
      'fault.not-an-mcp-row': 'This row is not an MCP client row, so this form does not shape it',
      'fault.bad-transport': 'A row is either streamable-http or stdio, and the two branches do not mix',
      'fault.bad-url': 'The address must be an http or https URL',
      'fault.bad-command': 'A stdio row needs the command it starts',
      'fault.bad-timeout': 'The call timeout is a whole number of milliseconds',
      'fault.bad-header': 'A header carries a name and a value',
      'fault.bad-env': 'An environment variable carries a name and a value',
      'fault.bad-value': 'A value with a line break — or one of spaces alone — is not a value this file can hold',
      'fault.config-ref': 'A setting of this row stands as an expression in the file: the form does not write over it',
      'fault.disabled-ref': 'The enablement of this row stands as an expression in the file: the toggle does not write over it',
      /* The word a press's refusal is said with, the same on every page; the sentence beside it is the reason and
         stands in the strip's `title`, so the reader keeps what went wrong without reading it on every save. */
      'state.refused': 'Not saved',
      'fault.not-saved': 'The save did not stand: the file does not hold what was written',
      'fault.write-failed': 'The Loader refused the write',
      'fault.unreadable': 'The servers file could not be read',
    };

    /* The host's own sheets, copied rule for rule and renamed, carried by its tokens alone: the
       management card (`.section`, `.rowCard`,
       `.rowHead`, `.rowTag`, `.rowActions`, `.editor`, `.field`, `.input`, the buttons), the
       confirmation and its modal chrome, the
       credential dot, and the nested map of the donor's own form — a four-column grid, each entity
       a card with a `.5px` border. Two departures, both named: a pair
       row of that map carries no box of its own — the page's grid stands on the editor's axis, where the
       donor gives every entity a bordered card (the rule below carries the measurement) — and the modal
       in this page sits under the section instead of the app root, which changes nothing of what it
       covers. */
    const CSS = `
/* The section's own heading, worn from the page's own head rather than declared again here: the head, its title
   and its count are the page's own classes, and the arrangement and the type stand once, in the page's own sheet. */
.coreness-mcp-intro{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:14px;line-height:22px}
/* The section's state sentence and its rows' dim line: the page's small role, 12/18 in label-tertiary, which
   stands once in the page's own sheet as coreness-dim and is worn below beside each of these two names. The
   names stay: this section's own checks and the hint sample select the lines by them. */
/* The word that names the list, in the weight that names rather than explains: the page's own rule for a small line
   (naming is 500, explaining is 400), and the reason the label is set apart from the names it introduces. */
.coreness-mcp-toolsLabel{font-weight:500}
.coreness-mcp-failed p{margin:0;font-size:14px;line-height:22px}
.coreness-mcp-warn{color:var(--dsw-alias-state-warn-label);margin:0;font-size:12px;line-height:18px}
/* The tone of a room, read off the attribute the instruments read rather than off a class only the drawing
   knew: the colour and the reading are one fact, and the page keeps one description of each fact. */
[data-note][data-tone='fault']{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}
[data-note][data-tone='done']{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px;line-height:18px}
/* The tones this line carries stand once in the entry's sheet — coreness-tone-done and coreness-tone-fault,
   worn beside this class — because the state's sentence is painted there. What stays here is the line's own
   shape: the amber a trouble line carries until its level says error. */
.coreness-mcp-trouble{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-state-warn-label);overflow-wrap:anywhere}
.coreness-mcp-trouble code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
/* The right side of the head: the row's own controls, held to the right of the head and parted by the 8 the
   page's card action lines stand on; the free room in front of them, and not this number, is what holds them
   there. */
.coreness-mcp-actions{align-items:center;gap:8px;margin-left:auto;display:inline-flex}
/* The strip an answer to a press lives in: the free place in the head, on the right, reserved before the
   answer arrives so that nothing else in the head moves when it comes or goes. It takes the room that is
   left over (flex:1 1 auto, below) and cuts a long sentence with an ellipsis rather than pushing the
   actions or the marker — the whole sentence stands in the title, and a refusal's reason also stands in
   the row's or the section's own state. */
/* The answer stands at the card's right edge and on the **name's own line**, not in the middle of the head:
   the head centres its children (align-items:center), and the strip — 18 px tall in a 60 px head — was
   therefore sitting on the buttons' line. align-self:flex-start lifts it to the head's top, which is the line
   the name stands on, and it changes nothing else: the box is still reserved (flex:0 0 160px), the head still
   does not wrap, the chip stays where it stands, and the head's 60 px come from the room under the name, not
   from the strip. The user's own reading: "справа — да; «вверху» — по центру шапки". */
/* The strip is a constant 160 px box that never shrinks and never grows, in this card as in the
   others: the head is a row, the strip stands in its middle and the controls keep the card's right edge, so a word
   that comes and goes changes no box — the row's height comes from the name and the buttons, not from the answer.
   The colours of its three tones stand with the strip itself, in the page's own sheet beside the reservation rule:
   this section brought the strip, and a section painting it is how the same word came to wear another
   colour in the section beside this one. */
/* This section's own tones, and the button rules it keeps: the base, the hover, the two primary rules, the
   disabled look and the ring stand once in the page's own sheet, in the shared button
   class every button here wears beside this one. */
.coreness-mcp-button[data-tone='danger']:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}
/* The small control's role, named as the platform names its own: .sm{height:28px;font-size:12px;line-height:18px}.
   It is written as a height and not as a padding because the page's
   own scale of distances has no 5 — 18 + 5 + 5 is the platform's arithmetic, and the platform states its result, not
   the sum. Any control of this page that is small takes this role. */
.coreness-mcp-actions .coreness-mcp-button{border-radius:var(--dsw-radius-sm);height:28px;padding:0 10px;font-size:12px;line-height:18px}
/* The row's state drawn as a switch, property by property from the host's own General settings. Its track is 36 by 20
   with the pill radius and 2 px of padding; its thumb is 16 by 16, a circle, resting 2 px in from each end; and it
   slides by 16 px, so 2 + 16 + 16 leaves 2 px of air at the round end — a thumb sitting flush against that end reads
   as a less round pill, which is the whole of the difference this copies. The host places its thumb with that padding
   and a static child; ours stands absolutely at the same 2 px, since a track's padding does not place an absolute
   child and the drawing is identical either way — the mechanism is named here rather than copied blind. The off
   position is the page's own: no switch of the host's stands off in its settings, so the thumb rests at the same 2 px
   of air, mirrored, and nothing is invented for a state the host does not show. The three colours are the host's own
   readings — near-black on, translucent black off, white thumb — and stand as values rather than token names because
   its token table could not be read from here: no published name is claimed for them. The page's own half is the pill
   radius and the ring; the host declares that box with a transparent colour and draws no visible ring this page has
   read, so the ring wears the page's own published focus colour and what its settings show on focus stands unread.
   The transition reads as none in the window this page is walked in, whose roots wear the still class and whose rule
   stops every transition inside them: the declaration below is the host's own .12s transform, and that reading
   belongs to the window, not to the drawing. */
.coreness-mcp-switch{position:relative;box-sizing:border-box;width:36px;height:20px;flex:none;padding:2px;border:none;border-radius:var(--coreness-pill-radius);background:rgba(0, 0, 0, 0.12);cursor:pointer}
.coreness-mcp-switch[aria-checked='true']{background:rgb(15, 17, 21)}
.coreness-mcp-switch:disabled{opacity:.4;cursor:default}
.coreness-mcp-switch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.coreness-mcp-switchThumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:rgb(255, 255, 255);transition:transform .12s ease}
.coreness-mcp-switch[aria-checked='true'] .coreness-mcp-switchThumb{transform:translateX(16px)}
/* The editor stands where the cards of the list stand, so it keeps the page's card-to-card distance from whatever is
   above it — a card, an empty state, or nothing at all. The first attempt hung that distance on what precedes the
   editor (a sibling of the list), and that missed the state the user meets on a fresh machine: with no server declared
   the list is not drawn, an empty state stands in its place, and the form touched it — 0 px against the 8 px the same
   pair reads when a card is above. The distance belongs to the editor, not to its neighbour, so it is written there and
   holds for every neighbour: card and form, empty state and form, form and form. What follows the editor keeps the same
   value by the sibling rule. */
.coreness-mcp-rows + *,.coreness-mcp-editor + *{margin-top:8px}
.coreness-mcp-editor{border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-module-platform);flex-direction:column;gap:12px;padding:12px 14px;margin-top:8px;display:flex}
.coreness-mcp-editorHead{align-items:center;justify-content:space-between;display:flex}
.coreness-mcp-editorTitle{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}
.coreness-mcp-fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}
.coreness-mcp-editorNote{flex:none;text-align:right;font-size:12px;line-height:18px}
textarea.coreness-mcp-input{height:auto;min-height:64px;resize:vertical}
/* A form row's controls stand six apart in a grid of three fixed columns: the columns are the form's own, so the
   row never wraps and the distance is a grid's, not a line's — the Qoder's row, which may break, carries its own. */
.coreness-mcp-grid{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:6px;display:grid}
/* A pair row carries no box of its own. The donor's own per-row editing gives every entity of a nested map
   a bordered card, and this page copied that rule
   until the reader named the frame under the map's label as the redundant one: the row's own controls
   already stand in a grid of their own. Measured on one editor, the header map of a row: with the box, the
   row's first control stood at x 554 and its Remove ended at 1165, while every field of the editor stands
   at x 547 and ends at 1172 — seven pixels off each side, the frame's own border and the room it needed.
   Without it the rows stand on the fields' axis, and the block is read by the label above it and by the
   pitch of the pairs list (coreness-mcp-pairs). The class stays on the row as its own name; no rule carries
   it. */
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
/* The card's head is its disclosure: the name and the subtitle in a button, the actions and the toggle
   beside it, the marker at the side, and the body only while it is open — the donor's own Card. */
.coreness-mcp-card{flex-direction:column;gap:12px;display:flex}
.coreness-mcp-headButton{box-sizing:border-box;border:none;background:0 0;color:inherit;font:inherit;text-align:left;padding:0;cursor:pointer;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto;display:flex}
.coreness-mcp-headButton:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary);outline:none;border-radius:var(--dsw-radius-md)}
.coreness-mcp-name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}
/* The subtitle carries the row's target and its state, so it is the one line of this card a long
   sentence could grow — and the card with it. Two lines are the reserved room, the same reservation the
   Qoder section's state area keeps; the rest of the sentence scrolls inside it and the words stay whole
   in the DOM. The room is reserved both ways: a maximum alone leaves a short subtitle a 43 px head where
   a long one takes 98, so the floor is the reservation and the ceiling its limit. Measured before that
   ceiling existed, in the Qoder section: 200 characters over 379x54 px took the card from 1290 to 1308
   and its head from 36 to 54. Measured in the gate's walk before the floor existed: the same room read
   36 px in one state and 18 px in the next, and the cards under it moved eighteen pixels. */
/* The room under the name is reserved (36 px, the head's own two lines) and a value longer than it scrolls — but
   the engine draws a scrollbar for that, and a bar at the room's right edge reads as a rule nobody drew: in the
   walk's own picture each MCP row carried a ~15 px bar at x 878 with a thumb the height of one line. The bar is
   hidden here (the wheel and the keyboard still scroll the room); the reserved height, the user's own decision,
   stays where it was. */
.coreness-mcp-subtitle{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.coreness-mcp-subtitle::-webkit-scrollbar{width:0;height:0}
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
   no text-align moves a flex container's content, so a left alignment written that way draws nothing. It used to
   state the shared rule's own values beside them — the box, the radius, the transparent ground, the ink, the font,
   the pointer — and those hold a shared value still while the shared rule moves. */
/* An item is a line the pointer takes whole: its own padding is the room between its word and the list's edge,
   and two items touch, because a menu is read by moving from one row to the next and not by the air between them. */
.coreness-mcp-menuItem{border:none;padding:6px 10px;justify-content:flex-start}
/* The item's own focus fill, kept with the item and not carried by the shared hover: the shared selector takes
   hover and the picker's active state, and widening it to focus would fill every button of the page on a keyboard
   walk — a page-wide change this member's own state does not make. The body matches the shared hover's on purpose,
   and the census counts the pair as a group it did not have before. */
.coreness-mcp-menuItem:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}
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

    /** A refusal of the route, as the page carries it: the code is the vocabulary, the words are the detail. */
    class Refused extends Error {
      constructor(code, message) {
        super(message ?? code);
        this.code = code;
      }
    }

    /** The message of a thrown value. */
    const reasonOf = (error) => (error instanceof Error ? error.message : String(error));

    /** The plugin's own context and the section's words, filled in `apply`. */
    let ctx;
    let t = (key) => key;

    /**
     * What this section last read, and the moment it read it.
     *
     * The browser half is materialised once per application session, so a section that is left and entered
     * again has this beside it. A mount paints it at once and the read corrects it behind; the session's
     * *first* mount has nothing and keeps the honest skeleton, because a skeleton is the truth when nothing
     * is known. It holds a read picture and never the visit's own state — the open card, the editor, the news
     * of a press — which is not knowledge of the route and would be a lie told twice.
     */
    let lastRead = null;

    /**
     * One request to the plugin's route. The route answers 200 with its own refusals in words
     * (`{ok:false, error:{code, message}}`), so a refusal is read, not guessed from a status.
     */
    async function ask(method, body) {
      const answer = await fetch(ROUTE, {
        method,
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!answer.ok) throw new Refused('unreadable', `${ROUTE} answered ${answer.status} ${answer.statusText}`);
      let payload;
      try {
        payload = await answer.json();
      } catch (error) {
        throw new Refused('unreadable', `${ROUTE} answered something that is not JSON: ${reasonOf(error)}`);
      }
      if (payload?.ok !== true) throw new Refused(payload?.error?.code ?? 'write-failed', payload?.error?.message);
      return payload.value;
    }

    /** The words of a refusal: the page's own for a code it knows, the host's message beside it. */
    function faultLines(code, message) {
      const known = REFUSALS.includes(code);
      const words = known ? t(`fault.${code}`) : null;
      const detail = typeof message === 'string' && message !== '' && message !== words ? message : null;
      return [words ?? detail ?? String(code), ...words !== null && detail !== null ? [detail] : []];
    }

    /** The target of a row in words: what a reader is told where the drawing is not the thing being read — the
        accessible name of the row's own switch, for one — so the words and the node cannot drift apart. */
    function targetWords(row) {
      if (row.url !== null && row.url !== '') return row.url;
      if (row.command !== null && row.command !== '') {
        return t('target.stdio', { command: row.command, args: row.args.join(' ') });
      }
      return t('target.none');
    }

    /** The target of a row, as the user reads it: an address, or the command with its arguments. */
    function targetOf(row) {
      const words = targetWords(row);
      if (row.url !== null && row.url !== '') return h('code', null, words);
      if (row.command !== null && row.command !== '') return h('code', null, words);
      return h('span', { className: 'coreness-mcp-dim coreness-dim' }, words);
    }

    /** The tools a server brings now: the platform's prefix rule decides, not this page. */
    /** The time of a line, as the user reads a clock; a time the host did not give stands as it came. */
    function timeOf(at) {
      const moment = new Date(at);
      return Number.isNaN(moment.getTime()) ? String(at) : moment.toLocaleTimeString();
    }

    /**
     * What the host itself said about this row, quoted.
     *
     * The sentence is the platform's own — `mcp-client(<name>): connection failed; retrying in 4000ms
     * (attempt 5/10)` — and it is drawn as it stands: this page does not translate it into a reason of
     * its own, because a paraphrase standing where the host's own words exist is a guess drawn as a
     * fact. Only the label, the time and the severity around it are the page's.
     */
    function troubleLine(row) {
      return h('p', { key: 'trouble', className: 'coreness-mcp-trouble' + (TONE_CLASS[row.trouble.level] ?? ''), role: 'note', 'data-level': row.trouble.level }, [
        h('span', { key: 'label', className: 'coreness-mcp-dim coreness-dim' }, `${t('trouble.label')} `),
        h('code', { key: 'words', 'data-at': row.trouble.at ?? '', title: t('trouble.hint') }, row.trouble.text),
        h('span', { key: 'when', className: 'coreness-mcp-dim coreness-dim' }, ` · ${row.trouble.level} · ${timeOf(row.trouble.at)}`),
      ]);
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

    /** The root of one row menu: a press outside it closes its list, a press inside it does not. */
    const MENU = '.coreness-mcp-menu';
    /**
     * A row's actions in a menu, the donor's own place for them.
     *
     * The donor's control is a portal into `document.body`,
     * and a page here writes inside its own component and appends nothing to the document
     * — so the list stands beside its trigger, under the row's own root. Which menu
     * is open is the section's own state, and so is which row is open, because this half draws its rows
     * with one set of hooks: a row is a function here, not a component. The behaviour is the picker's:
     * a press outside closes the list, Escape closes it and puts the focus back on the trigger, and the
     * arrows walk the items by moving the focus itself.
     */
    function rowMenu(items, open, act, entryId) {
      const walk = (event, step) => {
        const list = [...(event.currentTarget.parentElement?.querySelectorAll('[role="menuitem"]') ?? [])];
        if (list.length === 0) return;
        list[(step + list.length) % list.length].focus();
      };
      const back = (event) => event.currentTarget.closest(MENU)?.querySelector('.coreness-mcp-menuTrigger')?.focus();

      return h('span', { key: 'menu', className: 'coreness-mcp-menu' }, [
        h('button', {
          key: 'trigger',
          type: 'button',
          className: 'coreness-mcp-button coreness-mcp-menuTrigger coreness-button',
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
              event.preventDefault();
              act.menu(entryId);
            }
          },
        }, '…'),
        open ? h('div', { key: 'list', className: 'coreness-mcp-menuList', role: 'menu' },
          items.map((item) => h('button', {
            key: item.key,
            type: 'button',
            role: 'menuitem',
            className: 'coreness-mcp-menuItem coreness-button' + (TONE_CLASS[item.tone] ?? ''),
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
     * One card of the roster: the donor's own card.
     *
     * Its head is the disclosure — the name and a subtitle in a button, the actions and the toggle
     * beside it, the marker at the side — and the body stands only while it is open, so a server with
     * twenty-three tools costs one line until the user asks for them. The subtitle carries the row's
     * target and its state, which is the room the header reserves; everything else waits in the body,
     * including the reasons that used to live in a `title=` nobody could see without hovering.
     */
    function cardOf({ row, view, act, open, menu }) {
      const busy = view.busy === row.entryId;

      /* The subtitle is the row's target and its state in one line — the room the head reserves. It stands as
         parts and not as a joined string: `targetOf` answers a node (a command in its own `code`), and a join
         would draw `[object Object]` where the address belongs.

         The state is said here and nowhere else: it used to stand a second time as a chip beside the protocol,
         and a chip that comes and goes takes the protocol with it when a row is switched. The authorization is
         **not** a word here any more: the header stands in the card's own list with its name and its value, and
         a word in this line said the same thing twice. The platform's fiber phase is not drawn: `active` was
         withdrawn as a word the reader cannot act on, and `unloading` is withdrawn for the same reason — the row
         itself shows what it is doing, and a phase that flickers in a line of text is noise, not news. */
      const subtitle = [
        targetOf(row),
        ' · ',
        row.transport ?? '—',
      ].filter((part) => part !== null);

      const items = row.shape
        ? [
          { key: 'edit', label: t('edit'), disabled: busy || row.refs.length > 0, onSelect: () => act.open(draftOf(row)) },
          { key: 'remove', label: t('remove'), tone: 'danger', disabled: busy, onSelect: () => act.ask(row) },
        ]
        : [];

      const body = [
        row.disabledRef === true ? h('p', { key: 'disabledRef', className: 'coreness-mcp-warn' }, t('fault.disabled-ref')) : null,
        (row.trouble ?? null) === null ? null : troubleLine(row),
        h('p', { key: 'tools', className: 'coreness-mcp-dim coreness-dim' }, row.tools.length === 0
          ? t('tools.none')
          : [
            /* The label is bold and the names beside it keep the plain weight, so the eye separates what the list is
               from the list itself: the user's own ask ("Тулс давай хотя бы жирным выделим… чтобы отделяло хотя бы от
               перечисленных тулов"). */
            h('span', { key: 'label', className: 'coreness-mcp-toolsLabel' }, t('row.tools', { count: String(row.tools.length) })),
            ' ',
            row.tools.map((tool) => tool.label).join(', '),
          ]),
        /* The fields the host's own reader keeps as they stand used to be listed
           here by their identifiers — `kept as it stands: failOnStartupError` — and the reader could do
           nothing with the name: the field lives in his own servers file, this form does not write it, and
           its meaning is the host's. The fact is worth one sentence where the reader is looking at the row's
           fields, which is the editor; the roster line is gone. */
        row.refs.length > 0 ? h('p', { key: 'refs', className: 'coreness-mcp-warn' }, t('refs', { names: row.refs.join(', ') })) : null,
      ].filter((node) => node !== null);

      /* The head carries two different things and says which is which by where it stands: the row's own state
         — its target, `enabled`, its authorization — in the room under the name, where it always stood, and
         the answer to a press in the strip on the right, which is the free place there. They used to share
         one room: the answer took the state's place, so a reader who had just pressed something could no
         longer see what the row was. The strip is reserved (`.coreness-answer`,
         `flex:0 0 var(--coreness-news-strip)`, drawn empty when there is no answer) so a word that comes and
         goes moves nothing: the title, the tags, the actions and the marker keep their places, and the answer is
         cut with an ellipsis rather than pushing them. The reservation has to stand in the markup as well as in
         the rule: while the span existed only with a word in it, the width the head gave away changed with the
         answer, and a long word took a line of its own — the head 60 px → 98 px, the room 404 px → 437 px. */
      const editing = view.editor !== null && view.editor.draft.entryId === row.entryId;
      /* The answer of a press made in this row's editor belongs to this row's head too: the editor stands
         inside the card, and the reader's eye is on the card he pressed in. */
      const editorNote = editing && noteNames(view.note ?? null, draftRow(view.editor.draft)) ? view.note : null;
      const mine = noteOf(row, view) ?? editorNote;
      const subtitleNode = h('span', { key: 'subtitle', className: 'coreness-mcp-subtitle' }, subtitle);
      /* The strip is drawn **always**, empty when there is no answer: the reservation the rule makes
         (`flex:0 0 160px`) is a promise about the layout, and a span that appears and disappears keeps that
         promise only while its box does not depend on its words. It used to be drawn only with a word in it,
         and the head wraps (`flex-wrap:wrap`), so a word wider than the free place took a line of its own: the
         head went 60 px → 98 px and the room under the name went 404 px → 437 px — the answer moved the card it
         stands in. The reserved width is measured, not chosen: the answer itself read 108 px wide and the free
         place was 167 px, so 160 reserves more than the word needed and less than the place it stood in. An
         empty live region is also what a live region should be — it stands before the word arrives, not
         after it. */
      const answerNode = h('span', {
        key: 'answer',
        className: 'coreness-answer',
        /* The tone, in the attribute the instruments read: the colour was painted by a class and no reading
           ever saw it, so the word could stand with a tone nothing could name. An empty room carries none —
           it stands before its word arrives, and a room with nothing in it states nothing. */
        'data-tone': mine === null ? undefined : noteToneOf(mine),
        'data-note': 'head',
        role: 'status',
        'aria-live': 'polite',
      }, mine === null ? '' : noteTextOf(mine));

      return h('li', { key: row.entryId, className: 'coreness-mcp-row coreness-card-box' }, [
        h('div', { key: 'card', className: 'coreness-mcp-card', 'data-open': String(open) }, [
          h('div', { key: 'head', className: 'coreness-mcp-head coreness-card-head' }, [
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
              items.length === 0 ? null : rowMenu(items, menu === row.entryId, act, row.entryId),
              /* The state is the switch's own: aria-checked carries it, the label names the row it belongs to,
                 and the word a press would do stands in the title rather than in the row's line, so nothing in the
                 cluster changes width when the state flips. */
              h('button', {
                key: 'toggle',
                type: 'button',
                className: 'coreness-mcp-switch',
                role: 'switch',
                'aria-checked': row.enabled === true,
                'aria-label': `${targetWords(row)} — ${row.enabled ? t('toggle.off') : t('toggle.on')}`,
                title: row.enabled ? t('toggle.off') : t('toggle.on'),
                disabled: busy || row.disabledRef,
                onClick: () => act.toggle(row, row.enabled !== true),
              }, h('span', { key: 'thumb', className: 'coreness-mcp-switchThumb' })),
            ]),
            h('button', {
              key: 'marker',
              type: 'button',
              className: 'coreness-mcp-marker',
              'aria-expanded': open,
              'aria-label': open ? t('close') : t('open'),
              'data-open': String(open),
              onClick: () => act.row(row.entryId, !open),
            }, chevronMark()),
          ]),
          open ? h('div', { key: 'body', className: 'coreness-mcp-body coreness-card-body' }, body) : null,
        ]),
        editing ? editorOf(view.editor.draft, view, act) : null,
      ]);
    }

    /** One row of a pair editor: the name, the value, and what happens to each. There is no secret logic here, by
        the user's own word — "Пускай будут видны" — the value is the text from the file, written as it is written,
        and the page invents none: a pair the file leaves empty is drawn empty. */
    function pairRow(kind, pair, index, view, act) {
      const busy = view.busy !== null;
      const name = h('input', {
        key: 'name',
        className: 'coreness-mcp-input coreness-field coreness-field-box',
        value: pair.name,
        disabled: busy,
        'aria-label': t('field.name'),
        placeholder: t('field.name'),
        onChange: (event) => act.patchPair(kind, index, { name: event.target.value }),
      });
      const value = h('input', {
        key: 'value',
        className: 'coreness-mcp-input coreness-field coreness-field-box',
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
      return h('li', { key: pair.key, className: 'coreness-mcp-pairRow' },
        h('div', { className: 'coreness-mcp-grid' }, [name, value, remove]));
    }

    function editorOf(draft, view, act) {
      const busy = view.busy !== null;
      const http = draft.transport === 'streamable-http';
      /* The corporate kind points at an address like an http row and carries no command of its own:
         the bridge's command and arguments are written by the host, out of the address. */
      const corporate = draft.transport === 'corporate';
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
          /* The kind is chosen in the page's own control, from the platform's three values: the words are
             the page's (`kind.http` and the like) and the value that travels is the platform's own
             spelling, exactly as the native select this replaced handed it over. */
          h(IdPicker, {
            key: 'picker',
            name: 'mcp-transport',
            value: draft.transport,
            disabled: busy,
            'aria-label': t('field.transport'),
            options: TRANSPORTS.map((name) => ({ value: name, words: t(TRANSPORT_LABELS[name]) })),
            onChoose: (next) => act.patch({ transport: next }),
          }),
        ]),
        http || corporate
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
          ]),
        http || corporate ? null : h('div', { key: 'args', className: 'coreness-field coreness-mcp-field' }, [
          h('label', { key: 'label', className: 'coreness-fieldLabel coreness-mcp-fieldLabel' }, t('field.args')),
          h('textarea', {
            key: 'area',
            className: 'coreness-mcp-input coreness-field coreness-field-box',
            value: draft.args,
            disabled: busy,
            'aria-label': t('field.args'),
            onChange: (event) => act.patch({ args: event.target.value }),
          }),
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
        /* Both maps a row carries stand in the form: the headers a request goes out with, and the environment a
           child process gets. The headers block was taken off the page on a misreading of the user's word (he
           asked that the **row's meta line** stop printing `authorization`, not that the setting go) and he asked
           for it back: "Их теперь не заполнять, не удалять нельзя… Надо вернуть, как было в настройках в MCP". */
        http ? pairsField('headers', t('field.headers'), draft, view, act) : null,
        http || corporate ? null : pairsField('env', t('field.env'), draft, view, act),
        corporate ? h('p', { key: 'corporateHelp', className: 'coreness-mcp-dim coreness-dim' }, t('help.corporate')) : null,
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
      const note = draft.entryId === null && noteNames(view.note ?? null, draftRow(draft)) ? view.note : null;

      return h('div', { key: 'editor', className: 'coreness-mcp-editor' }, [
        h('div', { key: 'titleRow', className: 'coreness-mcp-editorHead' }, [
          h('span', { key: 'title', className: 'coreness-mcp-editorTitle' },
            draft.entryId === null ? t('add.title') : t('edit.title', { server: draft.server })),
          /* The editor is a head of its own, and its answer stands where Qoder's stands: the top right. The
             row's own head keeps its answer in the middle — two heads, two places, both by the user's word. */
          note === null ? null : h('span', {
            key: 'note',
            className: 'coreness-mcp-editorNote',
            'data-tone': noteToneOf(note),
            'data-note': 'editor',
            role: 'status',
            'aria-live': 'polite',
          }, noteTextOf(note)),
        ]),
        /* The one sentence about the fields this form does not carry — the host's own kept fields among them
           and every field a newer host may add. It stood in the roster as a list of
           identifiers, where a reader could do nothing with it; here it is said once, in words, beside the
           fields it is about, and it names no identifier of a plugin's business. */
        h('p', { key: 'kept', className: 'coreness-mcp-dim coreness-dim' }, t('editor.kept')),
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
        pairs.length === 0 ? null : h('ul', { key: 'rows', className: 'coreness-list coreness-mcp-pairs' }, pairs.map((pair, index) => pairRow(kind, pair, index, view, act))),
        h('div', { key: 'add', className: 'coreness-mcp-editorActions' }, h('button', {
          key: 'add',
          type: 'button',
          className: 'coreness-mcp-button coreness-button',
          disabled: busy,
          onClick: () => act.addPair(kind),
        }, t('pair.add'))),
      ]);
    }

    /** The confirmation of a removal: the host's own dialog over its own mask. */
    function dialogOf(row, view, act) {
      const busy = act.isBusy(row.entryId);
      /* The press that asks for a removal is made here, so a refusal of it is said here too: behind the
         mask the reader cannot see the card's own room, and the answer belongs where the hand is. */
      const note = noteNames(view.note ?? null, row) ? view.note : null;
      return h('div', { key: 'confirm', className: 'coreness-mcp-mask', role: 'dialog', 'aria-modal': 'true' }, [
        h('div', { key: 'dialog', className: 'coreness-mcp-dialog' }, [
          h('h4', { key: 'title', className: 'coreness-mcp-dialogTitle' }, t('confirm.title', { server: row.server ?? row.id })),
          h('p', { key: 'body', className: 'coreness-mcp-dialogBody' }, t('confirm.body')),
          note === null ? null : h('p', {
            key: 'note',
            'data-tone': noteToneOf(note),
            'data-note': 'dialog',
            role: 'status',
            'aria-live': 'polite',
          }, noteTextOf(note)),
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

    /** The section: the head, the state, the roster and whatever stands open. */
    function draw(view, act) {
      const picture = view.picture;
      const rows = picture?.rows ?? [];

      /* Before the first answer nothing is drawn — not even a count line. A count over a roster
         nobody has read says the profile declares no server, and that is a claim this section has
         not earned; the words appear when the read that earns them has come back. The room is named
         `reading` while that read runs, so a reader is not left to tell this silence from the other
         silences the section draws: it is a state, and it is the only one that makes no claim. */
      if (view.status === 'loading') return h('div', { className: 'coreness-still coreness-mcp coreness-sectionBody', 'data-state': 'reading' }, []);

      const head = h('div', { key: 'head', className: 'coreness-sectionHead' }, [
        h('h4', { key: 'title', className: 'coreness-sectionTitle' }, t('title')),
        h('span', { key: 'count', className: 'coreness-sectionCount' }, countLine(rows)),
      ]);

      const parts = [head, h('p', { key: 'intro', className: 'coreness-mcp-intro' }, t('intro'))];

      if (view.status === 'failed') {
        parts.push(h('div', { key: 'failed', className: 'coreness-mcp-failed coreness-failed' }, [
          h('p', { key: 'word', role: 'alert' }, view.fault === null ? t('state.failed') : faultLines(view.fault.code, view.fault.message).join(' — ')),
        ]));
        /* The picture that stands is drawn under the reason: a read that failed is not a reason to empty the
           section, and the reader keeps the rows this session already read. Only when there is nothing to
           keep does the section stand as the fault alone. */
        if (picture === null || picture.state !== 'ready') return h('div', { className: 'coreness-still coreness-mcp coreness-sectionBody' }, parts);
      }

      if (picture.state === 'no-file') {
        parts.push(h('p', { key: 'nofile', className: 'coreness-mcp-status coreness-dim', role: 'status' }, t('state.nofile')));
        parts.push(h('p', { key: 'hint', className: 'coreness-mcp-dim coreness-dim' }, t('state.nofile.hint')));
        return h('div', { className: 'coreness-still coreness-mcp coreness-sectionBody' }, parts);
      }

      if (picture.state === 'failed') {
        parts.push(h('div', { key: 'failed', className: 'coreness-mcp-failed coreness-failed' }, [
          h('p', { key: 'word', role: 'alert' }, t('state.failed')),
          h('p', { key: 'reason' }, String(picture.reason)),
        ]));
        return h('div', { className: 'coreness-still coreness-mcp coreness-sectionBody' }, parts);
      }

      if (picture.file.enabled === false) {
        parts.push(h('p', { key: 'off', className: 'coreness-mcp-warn', role: 'status' }, t('state.offFile')));
      }

      if (rows.length === 0) {
        parts.push(h('p', { key: 'empty', className: 'coreness-mcp-status coreness-dim', role: 'status' }, t('empty')));
      } else {
        const cards = rows.map((row) => cardOf({
          key: row.entryId,
          row,
          view,
          act,
          open: (view.open ?? new Set()).has(row.entryId),
          menu: view.menu ?? null,
        }));
        parts.push(h('ul', { key: 'rows', className: 'coreness-list coreness-mcp-rows coreness-card-list' }, cards));
      }

      if (view.editor !== null && view.editor.draft.entryId === null) {
        parts.push(editorOf(view.editor.draft, view, act));
      } else if (view.editor === null) {
        parts.push(h('div', { key: 'add', className: 'coreness-addRow' },
          h('button', {
            key: 'add',
            type: 'button',
            className: 'coreness-add coreness-button',
            disabled: view.busy !== null,
            onClick: () => act.open(draftNew()),
          }, t('add'))));
      }

      if (view.confirm !== null) parts.push(dialogOf(view.confirm, view, act));

      /* The settled room is named by the picture's own state, so the name and the words drawn in the room
         are one fact: nothing here is inferred from the length of the roster. */
      return h('div', { className: 'coreness-still coreness-mcp coreness-sectionBody', 'data-state': picture.state }, parts);
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
      };
    }

    /**
     * The form as the route reads it: the fields the chosen transport uses, and nothing else.
     *
     * What the row keeps beyond this is the host's own decision, the one its own config builder takes:
     * the branch a transport does not use is deleted there, a pair list merges with what
     * the row already holds, and `failOnStartupError`/`toolCallTimeoutMs` are the host's fields — the
     * corporate kind needs the first of them set, which is exactly why this form never sends it.
     */
    function formOf(draft) {
      const common = { serverName: draft.server, transport: draft.transport, timeout: draft.timeout };
      if (draft.transport === 'corporate') {
        /* The bridge is the host's to write: `command: 'dp'` and its arguments are not the page's to
           send, and a save carrying either is refused in words (`bad-transport`). */
        return { ...common, url: draft.url };
      }
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

    /** The word of one outcome, as the plugin's own answer names it. */
    function outcomeWord(result) {
      const words = {
        created: 'done.created',
        updated: 'done.updated',
        nothing: 'done.nothing',
        removed: 'done.removed',
        /* The two names a toggle answers with read as a save reads: the file was written, and that is the
           outcome. The row's own control already says Enabled or Disabled — the row carries the state and the
           answer carries what the press did — so no word is invented for the switch. */
        enabled: 'done.updated',
        disabled: 'done.updated',
      };
      return words[result] ?? null;
    }

    /**
     * The words of one note, and whether it carries a refusal: the sentence a card draws and the sentence
     * its hold is measured over are the same one, so it is written once.
     */
    function noteTextOf(note) {
      return note.fault === undefined
        ? t(note.word, note.params ?? {})
        : t('state.refused');
    }


    /**
     * The tone of one note: a refusal is a fault, a press that **changed nothing** is plain — the user's own
     * decision, and the gate's no-op answers the same way — and every other answer is done. The decision is
     * read off the dictionary's own key and never off the drawn sentence, so a rewritten sentence cannot
     * move a tone; it is made here, once, rather than four times in the drawing.
     */
    /* The tone words this section's notes and rows use, and the page's own tone class each one wears:
       the word stays this section's — the instruments read it in `data-tone` and
       `data-level` — and the colour stands once in the page's sheet. A word with no entry here paints what it
       painted before. */
    const TONE_CLASS = { done: ' coreness-tone-done', fault: ' coreness-tone-fault', danger: ' coreness-tone-fault', error: ' coreness-tone-fault' };

    function noteToneOf(note) {
      if (note.fault !== undefined) return 'fault';
      return note.word === 'done.nothing' ? 'plain' : 'done';
    }

    /** The reason a refusal carries: the code's own sentence, which stands as the strip's tooltip and not as its word. */
    function noteReason(note) {
      if (note === null || note.fault === undefined) return undefined;
      return faultLines(note.fault.code, note.fault.message).join(' — ');
    }

    /** Whether a note names this row. The server is the note's own field, not an argument of its sentence. */
    const noteNames = (note, row) => note !== null && row !== null && note.server === (row.server ?? row.id ?? null);

    /** The row an editor is about: its entry, or — for a row that does not exist yet — the name being typed. */
    const draftRow = (draft) => ({ server: draft.server, id: draft.entryId });

    /**
     * The note a card carries: the last press that named this row, and nothing else.
     *
     * One word stands in one place, and that place is where the press was made: a confirmation still open
     * draws it (a removal is asked for there), an editor still open draws it (a refusal left it standing
     * beside the draft), and a row at rest draws it in the room its own state keeps.
     */
    function noteOf(row, view) {
      const note = view.note ?? null;
      if (!noteNames(note, row)) return null;
      if (noteNames(note, view.editor === null ? null : draftRow(view.editor.draft))) return null;
      if (noteNames(note, view.confirm)) return null;
      return note;
    }

    /** The section: the route read once when it mounts, and the four saves the user can make. */
    /**
     * How long the section follows a row by itself.
     *
     * the user watching a row they have just written needs the first second: the platform's entry mounts
     * in tens of milliseconds and the client's first word about a server that will not come up arrives
     * within a second. After that the client's own retries are tens of seconds apart — 0.5, 1, 2, 4, 8,
     * 16, then 30 seconds each — and its last word, the giving-up error, comes about two and a half
     * minutes in. So the pace falls off and the wait has a ceiling: fifteen reads a second apart, then
     * five seconds apart, and never more than sixty reads (about four minutes). Nothing here polls
     * forever, and the user who leaves the section takes the timer with them.
     */
    const SETTLE = {
      first: { everyMs: 1000, reads: 15 },
      then: { everyMs: 5000 },
      ceiling: 60,
    };

    /**
     * Whether the picture still holds something the user would see change on its own.
     *
     * Three shapes are worth watching: a row standing in a transient phase; an enabled row at rest with
     * neither a tool nor a word yet — the shape a row has for the second before the client says what is
     * wrong with it; and a row whose newest word is the client still trying (`warn`), because the word
     * after it is the one that matters most — that it has given up, with what to do about it. A row
     * whose newest word is an `error` is finished, and a row carrying a tool is working; a row that is
     * switched off is not watched at all, and carries no word.
     */
    function unsettled(picture) {
      const rows = picture?.rows ?? [];
      const trying = (row) => {
        const word = row.trouble ?? null;
        return word !== null && word.level !== 'error';
      };
      return rows.some((row) => row.phase === 'loading' || row.phase === 'unloading')
        || rows.some((row) => row.enabled === true && row.phase === 'active' && (row.tools ?? []).length === 0 && (row.trouble ?? null) === null)
        || rows.some((row) => row.enabled === true && (row.tools ?? []).length === 0 && trying(row));
    }

    function McpSection() {
      const [state, setState] = React.useState(lastRead === null ? { status: 'loading', picture: null, fault: null } : lastRead.state);
      useStyles();
      const [editor, setEditor] = React.useState(null);
      const [confirm, setConfirm] = React.useState(null);
      const [busy, setBusy] = React.useState(null);
      const [note, setNote] = React.useState(null);
      /** Reads spent by the present wait, or `null` when nothing is being followed. */
      const [spent, setSpent] = React.useState(null);
      /* Which rows stand open, and which row's menu does: this half draws its rows with one set of hooks,
         so a row's disclosure and its menu are the section's own state, held by the entryId. */
      const [openRows, setOpenRows] = React.useState(() => new Set());
      const [openMenu, setOpenMenu] = React.useState(null);

      /* An open menu is closed by a press outside it or by Escape, wherever the press lands: the listener
         stands on the document while one menu is open and leaves with it. */
      React.useEffect(() => {
        if (openMenu === null) return undefined;
        const away = (event) => {
          if (event.target instanceof Element && event.target.closest(MENU) !== null) return;
          setOpenMenu(null);
        };
        const key = (event) => {
          if (event.key === 'Escape') setOpenMenu(null);
        };
        document.addEventListener('mousedown', away);
        document.addEventListener('keydown', key);
        return () => {
          document.removeEventListener('mousedown', away);
          document.removeEventListener('keydown', key);
        };
      }, [openMenu]);

      /** A picture the user asked for: drawn, and followed while something in it is still moving. */
      const take = (picture) => {
        setState({ status: 'ready', picture, fault: null });
        setSpent(unsettled(picture) ? 0 : null);
      };

      /* A note stands for its own hold and then goes, and the card's own state word takes the room back. A
         press made after it drops it at once (`save`, `act.open`, `act.ask`) and nothing renews it: the
         section does not read while the roster is quiet, so a hold that had to wait for a read would never
         end. Leaving the section unmounts it, and the note with it. */
      React.useEffect(() => {
        if (note === null) return undefined;
        const timer = setTimeout(() => setNote(null), holdOf(note));
        return () => clearTimeout(timer);
      }, [note]);

      React.useEffect(() => {
        if (state.status === 'ready') lastRead = { state, at: Date.now() };
      }, [state]);

      React.useEffect(() => {
        let live = true;
        ask('GET').then(
          (picture) => {
            if (live) take(picture);
          },
          (error) => {
            /* A read that failed names the reason and keeps the picture that stands — the one this session
               already read, or the one the mount painted from its memory. It never empties the section. */
            if (live) setState((now) => ({ status: 'failed', picture: now.picture, fault: { code: error instanceof Refused ? error.code : 'unreadable', message: reasonOf(error) } }));
          },
        );
        return () => {
          live = false;
        };
      }, []);

      /**
       * The wait: the picture is read again at the pace above while a row is still moving, and it ends as soon
       * as nothing is left to watch or the ceiling is reached. A read that brings the same picture as the one
       * on screen is not drawn again, so the DOM is not rebuilt and nothing flickers for nothing.
       */
      React.useEffect(() => {
        if (spent === null || spent >= SETTLE.ceiling) return undefined;
        if (!unsettled(state.picture)) {
          setSpent(null);
          return undefined;
        }
        const everyMs = spent < SETTLE.first.reads ? SETTLE.first.everyMs : SETTLE.then.everyMs;
        const timer = setTimeout(async () => {
          let next;
          try {
            next = await ask('GET');
          } catch {
            /* A read that failed is not a state to keep watching: the wait stops, the picture stands. */
            setSpent(null);
            return;
          }
          setState((current) => (current.picture !== null && JSON.stringify(current.picture) === JSON.stringify(next)
            ? current
            : { status: 'ready', picture: next, fault: null }));
          setSpent(unsettled(next) ? spent + 1 : null);
        }, everyMs);
        return () => clearTimeout(timer);
      }, [spent, state.picture]);

      /**
       * One save: the answer replaces the picture, and its outcome is said in the card it belongs to.
       *
       * The word comes from the answer's own `result` and not from the action that was asked for:
       * the plugin answers `nothing` when the file already stood as it is, and a page that called that
       * "saved" would claim a change nobody made.
       *
       * A refusal's reason is said where the answer arrives rather than where the room is drawn: the face
       * carries the word and the console carries the code's sentence, by the page's one door, so a press that
       * learned nothing is said every time it was made.
       */
      const save = async (body, server) => {
        setBusy(body.entryId ?? 'add');
        setNote(null);
        try {
          const picture = await ask('POST', body);
          setEditor(null);
          setConfirm(null);
          const word = outcomeWord(picture.result);
          if (word !== null) {
            const note = { word, params: { server }, server };
            setNote(note);
            statusDetail(server, noteReason(note));
          }
          take(picture);
        } catch (error) {
          const note = { fault: { code: error instanceof Refused ? error.code : 'write-failed', message: reasonOf(error) }, params: { server }, server };
          setNote(note);
          statusDetail(server, noteReason(note));
        } finally {
          setBusy(null);
        }
      };

      const act = {
        open: (draft) => {
          setNote(null);
          setEditor({ draft });
        },
        close: () => setEditor(null),
        patch: (patch) => setEditor((current) => (current === null ? current : { draft: { ...current.draft, ...patch } })),
        patchPair: (kind, index, patch) => setEditor((current) => {
          if (current === null) return current;
          const pairs = current.draft[kind].map((pair, at) => (at === index ? { ...pair, ...patch } : pair));
          return { draft: { ...current.draft, [kind]: pairs } };
        }),
        addPair: (kind) => setEditor((current) => {
          if (current === null) return current;
          const pairs = current.draft[kind];
          return { draft: { ...current.draft, [kind]: [...pairs, { key: `${kind}.${pairs.length}.${Date.now()}`, name: '', value: '' }] } };
        }),
        dropPair: (kind, index) => setEditor((current) => {
          if (current === null) return current;
          return { draft: { ...current.draft, [kind]: current.draft[kind].filter((pair, at) => at !== index) } };
        }),
        save: (draft) => save(
          draft.entryId === null
            ? { action: 'add', form: formOf(draft) }
            : { action: 'edit', entryId: draft.entryId, form: formOf(draft) },
          draft.server,
        ),
        ask: (row) => {
          setNote(null);
          setConfirm(row);
        },
        cancelRemove: () => setConfirm(null),
        remove: (row) => save({ action: 'remove', entryId: row.entryId }, row.server ?? row.id),
        toggle: (row, enabled) => save({ action: 'toggle', entryId: row.entryId, enabled }, row.server ?? row.id),
        isBusy: (entryId) => busy === entryId,
        /* The row's disclosure and its menu: the drawing reports the press, the section holds the state. */
        row: (entryId, open) => setOpenRows((current) => {
          const next = new Set(current);
          if (open === true) next.add(entryId);
          else next.delete(entryId);
          return next;
        }),
        menu: (entryId) => setOpenMenu(entryId),
      };

      return draw({
        status: state.status,
        picture: state.picture,
        fault: state.fault,
        editor,
        confirm,
        busy,
        note,
        open: openRows,
        menu: openMenu,
      }, act);
    }

    return {
      /** The refusals this half knows, for the check that holds the two halves' vocabularies together. */
      refusals: REFUSALS,
      /** The wait, for the check that holds its rule, its pace and its ceiling against the states it must follow. */
      settle: { first: { ...SETTLE.first }, then: { ...SETTLE.then }, ceiling: SETTLE.ceiling, unsettled },
      /* The hold of a note is not exposed here: the page's one number lives in the page's own hold chunk, and the
         check that used to compare this copy with the one beside it now holds that no chunk carries a copy. */
      /** The section as it draws, for the check that reads its states without a browser. */
      draw: (view, act) => draw(view, act ?? {}),
      /** Register the section into the seat the page declares. */
      apply(pluginCtx) {
        ctx = pluginCtx;
        t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, 'en', EN), `${PACKAGE}: the MCP dictionary`);
        /* The seat is filled when the picker the editor draws, the page's own lifetime of an answer and the
           page's one door to the console are in hand: all three pulls began when this chunk was materialised,
           and nothing stands in the rail before there is a section to draw — nor before a note has a life, nor
           before a reason that leaves the face has somewhere to go. */
        ctx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([picker, hold, status]).then(
            ([pickerModule, holdModule, statusModule]) => {
              if (!live) return;
              IdPicker = pickerModule.IdPicker;
              chevronMark = pickerModule.chevronMark;
              holdOf = holdModule.holdOf;
              statusDetail = statusModule.statusDetail;
              armed = ctx.slots.inject(SEAT, () => ctx.slots.register({
                name: SEAT,
                id: ID,
                order: 10,
                label: () => t('section'),
                locale: NS,
              }, McpSection));
            },
            (error) => {
              console.error(`${PACKAGE}: the picker or the hold chunk did not arrive: ${error?.message ?? error}`);
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
