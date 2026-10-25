/**
 * The browser half of the product's page: one keyed entry in the `main` seat and one row in
 * `sidebar.panellist`, joined by the id `coreness`. The frame renders the keyed `main` cell of the active
 * panel id and the sidebar selects that id on a click, so the two registrations meet through the id alone.
 *
 * The page is two panes: a rail of sections beside the body of the chosen one. The rail's rows are the
 * sections other chunks register into the seat this page declares; none of them is drawn here, and the
 * rail's title carries the bundle's version once the composition answers. While the entry's chunk pulls
 * are pending the pane draws nothing: the seat is not yet known to be empty. Once they settle, an empty
 * seat draws the explicit empty state below; no section is special-cased.
 *
 * The facts are read, never written. The sections read their own routes and remotes; the switches that
 * enable and disable a plugin stay on the platform's own Plugins page. The look is the product's own markup
 * and CSS, carrying `--dsw-alias-*` tokens as the only shared styling; the platform's control library is
 * deliberately not required as a module. Package-local chunks beside this file are served on demand and
 * asked for with `require.async`: a chunk that never arrives leaves its section out of the rail and is said
 * on the console, because a swallowed failure would look like a page that simply has nothing there.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/ui';
    /** The id shared by the sidebar row and the panel it opens. */
    const PANEL_ID = 'coreness';
    /** The place this page declares for the sections of the chunks beside it. */
    const SECTION_SEAT = 'coreness.section';
    /** The bundle whose version the rail's title carries; the composition names it. */
    const BUNDLE = '@coreness/dsh';
    /** The package-local chunks beside the entry, applied once each. */
    const CHUNKS = ['./client.general.js', './client.mcp.js', './client.provider.js', './client.credits.js', './client.gate.js'];
    /** The locale namespace the visible text is taken from. */
    const NS = 'coreness';
    /* The sheet's own id, in this package's namespace: another package's id would name a second owner of
       these rules. */
    const STYLE_ID = 'coreness-ui-page-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/ui/client';

    /* Registered per locale: the chain of any other language ends at `en`, so one dictionary answers for
       all. */
    const EN = {
      panel: 'Coreness',
      'version.tag': 'v{version}',
      'seat.empty': 'No sections loaded; see the console',
    };

    /* What this slice draws, and nothing ahead of it: the frame, the card's furniture and the two state
       tones. A later section's shared rule is added here when that section first draws it — the kit owns
       the status surface's own sheet, a section chunk owns what only it draws. */
    const CSS = `
:root{--coreness-elevation:0 12px 32px #0000002e;--coreness-news-strip:160px;--coreness-pill-radius:999px}
.coreness-page{display:flex;height:100%;box-sizing:border-box;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.coreness-nav{box-sizing:border-box;flex-direction:column;flex:none;gap:18px;width:188px;padding:22px 12px 0;display:flex}
.coreness-navTitle{color:var(--dsw-alias-label-primary);align-items:baseline;gap:8px;flex-wrap:wrap;padding:0 12px;font-size:16px;font-weight:500;line-height:24px;display:flex}
.coreness-navList{flex-direction:column;gap:4px;display:flex;overflow-y:auto}
.coreness-navCell{box-sizing:border-box;border-radius:var(--dsw-radius-md);cursor:pointer;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:none;align-items:center;padding:9px 16px 9px 12px;font-family:inherit;font-size:14px;font-weight:400;line-height:22px;display:flex}
.coreness-navCell:hover{background:var(--dsw-specific-sidebar-nav-item-hover)}
.coreness-navCell[aria-current='true']{background:var(--dsw-specific-sidebar-nav-item-active)}
.coreness-navCell:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.coreness-pane{box-sizing:border-box;flex-direction:column;flex:1;align-items:center;min-width:0;padding:0 clamp(24px,4vw,48px) 48px;display:flex;overflow:auto;scrollbar-gutter:stable}
/* The pane is what scrolls, so its gutter is reserved: a tall section must not shift the column when the
   platform's scrollbar appears. */
.coreness-pane>*{width:100%;max-width:960px}
/* One element deeper: the platform wraps every seat entry in a div carrying display:contents, so written for
   the pane's children alone the column rule stops on that anchor and the section inside takes its own width. */
.coreness-pane>[data-slot='coreness.section']>*{width:100%;max-width:960px}
/* The empty seat, drawn only after the entry's chunk pulls have settled with no row. */
.coreness-empty{color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px;margin:0}
.coreness-sectionBody{flex-direction:column;min-width:0;padding-top:28px;display:flex}
.coreness-card-body{flex-direction:column;gap:8px;min-width:0;display:flex}
.coreness-card-box{border:.5px solid var(--dsw-alias-settings-card-stroke);background:var(--dsw-alias-settings-card-fill);border-radius:var(--dsw-radius-xl);flex-direction:column;gap:12px;padding:12px 14px;display:flex}
.coreness-card-head{align-items:center;gap:10px;flex-wrap:nowrap;display:flex}
.coreness-list{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}
/* A list of cards takes one line of air under the section's head. Both classes are named because the base list
   resets its own margin: as a lone class this rule has equal specificity, and a later base rule's margin:0 would win
   and stand the card on its caption. */
.coreness-list.coreness-card-list{margin:12px 0 0}
.coreness-tag{display:inline-flex;align-items:center;border-radius:var(--dsw-radius-xs);corner-shape:round;padding:1px 6px;font-size:12px;line-height:18px;font-weight:400;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
/* A tone names the chip's own background; the colour of its words belongs to the class beside it. */
.coreness-tag[data-tone='neutral']{background:var(--dsw-alias-bg-module-platform)}
.coreness-version{font-variant-numeric:tabular-nums;flex:none}
/* The page's hint line: one pair for every section's small line, 12/18 in label-tertiary. */
.coreness-dim{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}
/* A room where a line is cut: one line, cut with an ellipsis, its height from the line-height. */
.coreness-cutLine{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* A section's heading: its parts on one baseline, and the article's own line inside it. */
.coreness-sectionHead{align-items:baseline;gap:10px;display:flex}
.coreness-sectionTitle{margin:0;font-size:16px;font-weight:500;line-height:24px}
.coreness-sectionCount{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.coreness-failed{color:var(--dsw-alias-state-error-primary);flex-direction:column;gap:4px;display:flex}
/* The page's button, declared once and worn by every section that draws one, beside that section's own
   class; a section keeps only what is its own. Later rules at equal specificity win within this sheet, so
   the danger look and the add box stand after the button they vary. */
.coreness-button{box-sizing:border-box;border-radius:var(--dsw-radius-md);font:inherit;cursor:pointer;border:.5px solid var(--dsw-alias-border-l3);background:0 0;color:var(--dsw-alias-label-primary);justify-content:center;align-items:center;padding:6px 14px;font-size:14px;line-height:22px;display:inline-flex}
.coreness-button:hover:not(:disabled),.coreness-button[data-active='true']{background:var(--dsw-alias-interactive-bg-hover)}
.coreness-button[data-tone='primary']{border:none;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.coreness-button[data-tone='primary']:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.coreness-button:disabled{opacity:.4;cursor:default}
.coreness-button:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary);outline:none}
.coreness-tone-danger{border:none;color:var(--dsw-alias-state-error-primary)}
.coreness-addRow{margin-top:12px;display:flex}
.coreness-add{border:1px dashed var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-lg);flex:1 1 0;min-width:180px}
/* The answer strip: the page's reserved width and the three tones it can carry. */
.coreness-answer{flex:0 0 var(--coreness-news-strip);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;font-size:12px;line-height:18px}
.coreness-answer[data-tone='plain']{color:var(--dsw-alias-label-tertiary)}
.coreness-answer[data-tone='done']{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-label-secondary))}
.coreness-answer[data-tone='fault']{color:var(--dsw-alias-state-error-primary,var(--dsw-alias-label-primary))}
/* The field's column and its label's arrangement: what every control this page labels is built as. */
.coreness-field{flex-direction:column;gap:6px;display:flex}
.coreness-field:disabled{opacity:.6;cursor:default}
.coreness-fieldLabel{align-items:center;display:inline-flex}
.coreness-field-box{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);width:100%;font:inherit;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:6px 10px;font-size:14px;line-height:22px}
.coreness-field-box:focus{border-color:var(--dsw-alias-state-business-primary);outline:none}
.coreness-field-box::placeholder{color:var(--dsw-alias-label-dimmed)}
/* What the page's own check controls are built as: a box and its word on one line. The box keeps the margin
   the browser gives it — a reset here would be a rule of ours about a control that is the platform's, and
   every box on the page would need it kept in step. */
.coreness-check{display:inline-flex;align-items:center}
/* The two tones the kit's status map wears beside its own classes. */
.coreness-tone-done[data-tone]{color:var(--dsw-alias-state-success-primary)}
.coreness-tone-fault[data-tone],.coreness-tone-fault[data-level]{color:var(--dsw-alias-state-error-primary)}
@media (prefers-reduced-motion:reduce){.coreness-still *{transition:none!important}}
`;

    /** The page's sheet, held for as long as the page stands: put in here, put back if it is taken. */
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
    /** How many chunk pulls are still outstanding; the pane stays blank until this is zero. */
    let pendingPulls = CHUNKS.length;
    /** Set by the mounted page: re-render when the last pull settles (a failure touches no seat). */
    let settle = () => {};

    /** The rail's rows: the sections the chunks registered, by order. The seat decides; this page does not. */
    function sectionRows() {
      return ctx.slots.entries(SECTION_SEAT).map((entry) => ({
        id: entry.options.id,
        order: entry.options.order ?? 0,
        label: resolveLabel(entry.options.label) ?? entry.options.id,
      })).sort((a, b) => a.order - b.order);
    }

    /** The page: a rail of sections beside the body of the chosen one. */
    function CorenessPage(props) {
      const { renderSlot } = props;
      const [chosen, setChosen] = React.useState(null);
      const [, setRevision] = React.useState(0);
      /* The bundle's version, read from the composition rather than held in this file, so the title and the
         installed bundle cannot drift apart. A read that fails leaves the title without it: the version is
         not a status surface, and a made-up one would be worse than none. */
      const [version, setVersion] = React.useState(undefined);
      /* The grace before an empty seat is said in words; a section is normally seated in a few frames, and a
         section chunk that was pulled still assembles its own parts behind its apply. */
      const [gracePassed, setGracePassed] = React.useState(false);

      /* The page's sheet, ensured where the page is drawn: the platform's own replace re-mounts a plugin over
         the module table it already has and takes the package's style tags with it, so the mount is the one
         place a sheet can be put back. */
      useStyles();

      React.useEffect(() => {
        const reread = () => setRevision((revision) => revision + 1);
        settle = reread;
        const timer = setTimeout(() => setGracePassed(true), 1200);
        const offSeat = ctx.slots.subscribe(SECTION_SEAT, reread);
        const offLocale = ctx.locale.subscribe(reread);
        return () => {
          settle = () => {};
          clearTimeout(timer);
          offSeat();
          offLocale();
        };
      }, []);

      React.useEffect(() => {
        let live = true;
        const read = async () => {
          try {
            const inventory = await ctx.remote.pluginInventory.list();
            if (!inventory.ok) {
              console.error(`${PACKAGE}: the version was not read: ${inventory.error.code}: ${inventory.error.message}`);
              return;
            }
            if (inventory.value.managementAvailable !== true) {
              console.info(`${PACKAGE}: the version is not shown: the management gate is closed`);
              return;
            }
            const bundles = await ctx.remote.pluginManager.listBundles();
            if (!bundles.ok) {
              console.error(`${PACKAGE}: the version was not read: ${bundles.error.code}: ${bundles.error.message}`);
              return;
            }
            const bundle = bundles.value.find((item) => item.name === BUNDLE);
            if (live && bundle?.version !== undefined) setVersion(bundle.version);
          } catch (error) {
            console.error(`${PACKAGE}: the version was not read: ${error?.message ?? error}`);
          }
        };
        void read();
        const disposers = [
          ctx.remote.$on('plugin-manager/changed', read),
          ctx.on('connection/reset', read),
        ];
        return () => {
          live = false;
          for (const dispose of disposers) dispose();
        };
      }, []);

      const rows = sectionRows();
      /* The chosen row survives a chunk that left; when it is gone the page falls back to the first row. */
      const active = rows.some((row) => row.id === chosen) ? chosen : (rows[0]?.id ?? null);
      /* A pane with no row is not yet known to be empty: a chunk may have applied and still be assembling its
         own parts, and a sentence that stops being true a moment later is worse than a blank frame. The pane
         draws nothing until the pulls settle and a grace has passed; only then does an empty seat say so. */
      const body = active !== null
        ? renderSlot(SECTION_SEAT, { id: active }, { only: active })
        : (gracePassed && pendingPulls === 0
          ? h('p', { key: 'empty', className: 'coreness-empty' }, t('seat.empty'))
          : null);

      return h('div', { className: 'coreness-page' }, [
        h('nav', { key: 'rail', className: 'coreness-nav', 'aria-label': t('panel') }, [
          h('div', { key: 'title', className: 'coreness-navTitle' }, [
            h('span', { key: 'name' }, t('panel')),
            version === undefined
              ? null
              : h('span', {
                key: 'version',
                className: 'coreness-tag coreness-version',
                'data-tone': 'neutral',
              }, t('version.tag', { version })),
          ]),
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
      /* What this entry reads: the slots and the locale for the frame and the seat, the two remotes the
         rail's version tag asks about the composition's own bundle, and the four the Qoder section and the
         credits action read — the platform's llm/session/settings/credentials namespaces. A chunk borrows the
         entry's context, so this list is what waits for a namespace; a remote named here is not read by the
         frame, and a chunk that reads one before the entry names it reads `undefined`. */
      inject: [
        'slots',
        'locale',
        'remote',
        'remote.pluginManager',
        'remote.pluginInventory',
        'remote.llm',
        'remote.session',
        'remote.settings',
        'remote.credentials',
      ],
      apply(pluginCtx) {
        ctx = pluginCtx;
        t = ctx.locale.bind(NS);
        pendingPulls = CHUNKS.length;
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

        /* The chunks beside this entry carry the product's own sections. Each registers itself into the seat
           this page declared, so the chunk needs nothing from here but the context: one id per chunk, and no
           shared state to keep in step. A pull that never arrives is said on the console; the rail simply has
           one row fewer. */
        for (const chunk of CHUNKS) {
          ctx.effect(() => {
            let live = true;
            let dispose = null;
            require.async(chunk).then(
              (loaded) => {
                if (!live) return;
                pendingPulls -= 1;
                /* A chunk whose apply throws is named like a pull that never arrived: the section's half is
                   missing, and a page standing without it and no line anywhere is the failure this entry
                   exists to say. The other settles still run. */
                try {
                  dispose = loaded.apply(ctx) ?? null;
                } catch (error) {
                  console.error(`${PACKAGE}: the chunk ${chunk} did not apply: ${error?.message ?? error}`);
                } finally {
                  settle();
                }
              },
              (error) => {
                pendingPulls -= 1;
                console.error(`${PACKAGE}: the chunk ${chunk} did not arrive: ${error?.message ?? error}`);
                settle();
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
