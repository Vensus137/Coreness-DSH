/**
 * The page's own picker: the control a value is chosen with where the value is one of a settled list — the
 * wire id of a model and its reasoning level, the pair of a rate gate's row, the transport of an MCP server's
 * editor.
 *
 * It is a chunk of its own because three of the page's sections draw it, and a component carried by a chunk is
 * reached the way the platform reaches one: every factory, the entry and its chunks alike, is materialised with
 * the owner's `require`, whose `.async` answers a `./` spec by loading the sibling script. The pull is memoised
 * under the owner's own id joined to the file name, so the three sections that ask for this file get one script
 * and one materialisation, and no second copy of the control can drift from this one. The file lies beside the
 * entry, which is the only place the loader reads a chunk from.
 *
 * The host draws no `select`, and a page may not load the platform's control packages — the instruction to a
 * plugin author is to write its own control and match the host, keeping its tokens and its behaviour — so the
 * control is written here: a button carrying the current value and a chevron, and a list over the fields with
 * the chosen row marked. The behaviour is the part a reader relies on: the arrows and Home/End walk the list,
 * Escape closes it and puts the focus back on the trigger, a press outside closes it, the chosen row carries
 * its mark, and a list longer than its pane scrolls inside it. The list is drawn where the control stands, and
 * the trigger keeps the focus while it is open, so the row the walk stands on is named to a reader by
 * `aria-activedescendant`.
 *
 * `name` names the instance and nothing else: the list's id, and the two markers a check or a live walk finds
 * the control by. Two pickers may stand in one row — a model row draws its id beside its level — so a marker
 * fixed in the component would name the first of them to every reader that asks for it by name, and a driver
 * pressing the level control would press the id's.
 *
 * The stylesheet goes in when this chunk is materialised, which is the platform's own place for a chunk's side
 * effects, and the loader claims the tag for this package and takes it away with the package's other sheets.
 * The section that draws the control needs no style of its own for it.
 */
window.__ModuleLoader__.load({
  id: '@coreness/dsh/client.picker.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/dsh';
    const STYLE_ID = 'coreness-picker-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/dsh/client.picker.js';

    /** The root of one picker: a press outside it closes its list, a press inside it does not. */
    const PICKER = '.coreness-picker';
    /** The host's own chevron, on its own 16-grid artwork. */
    const chevronMark = () => h('svg', {
      key: 'mark', width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
    }, h('path', {
      key: 'path', d: 'M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6',
      stroke: 'currentColor', strokeWidth: 1,
    }));
    /** The host's own check, the same artwork family: the mark of the row the value stands on. */
    const checkMark = () => h('svg', {
      key: 'mark', width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
    }, h('path', {
      key: 'path', d: 'M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4',
      stroke: 'currentColor', strokeWidth: 1,
    }));

    function IdPicker({ name, value, options, 'aria-label': label, placeholder, disabled, title, 'aria-invalid': invalid, onChoose }) {
      const [open, setOpen] = React.useState(false);
      const [active, setActive] = React.useState(-1);
      /* The picker's sheet, ensured where a picker is drawn: the platform's own replace re-mounts a plugin
         over the module table it already has and takes the package's style tags with it, so the mount is the
         one place a sheet can be put back — and two pickers standing at once may mount in either order. */
      useStyles();
      const listId = `${name}-list`;
      const chosen = options.findIndex((one) => one.value === value);
      const choose = (next) => {
        setOpen(false);
        setActive(-1);
        onChoose(next);
      };
      /* A press anywhere else on the page, and Escape: without them the list would stay over the fields
         while the reader moved on. Escape hands the focus back to the trigger, so a reader who came by
         the keyboard is not dropped at the top of the page. */
      React.useEffect(() => {
        if (open === false) return () => {};
        const onPress = (event) => {
          const inside = typeof event?.target?.closest === 'function' && event.target.closest(PICKER) !== null;
          if (inside === false) { setOpen(false); setActive(-1); }
        };
        const onKey = (event) => {
          if (event?.key !== 'Escape') return;
          setOpen(false);
          setActive(-1);
          event.target?.closest?.(PICKER)?.querySelector?.('[data-picker]')?.focus?.();
        };
        document.addEventListener('pointerdown', onPress, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
          document.removeEventListener('pointerdown', onPress, true);
          document.removeEventListener('keydown', onKey, true);
        };
      }, [open]);
      /* The walk. The first press of ↓ or ↑ opens the list and stands on the row the value is on, so the
         choice a reader already made is where the walk begins; after that the walk moves and a list
         longer than its pane is scrolled to keep the row it stands on in sight. */
      const walk = (event) => {
        const key = event?.key;
        if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') {
          if (open === true && key === 'Enter' && active >= 0) {
            event.preventDefault?.();
            choose(options[active].value);
          }
          return;
        }
        event.preventDefault?.();
        if (open === false) {
          setOpen(true);
          setActive(chosen < 0 ? 0 : chosen);
          return;
        }
        const next = key === 'Home' ? 0 : key === 'End' ? options.length - 1
          : active < 0 ? (key === 'ArrowUp' ? options.length - 1 : 0)
            : (active + (key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
        setActive(next);
        document.getElementById?.(`${listId}-${next}`)?.scrollIntoView?.({ block: 'nearest' });
      };
      return h('span', { className: 'coreness-picker', onKeyDown: walk }, [
        h('button', {
          key: 'trigger',
          type: 'button',
          className: 'coreness-pickerTrigger coreness-field',
          'data-picker': name,
          'data-value': value,
          disabled,
          title,
          'aria-haspopup': 'menu',
          'aria-expanded': open === true,
          'aria-controls': listId,
          'aria-activedescendant': open === true && active >= 0 ? `${listId}-${active}` : undefined,
          'aria-label': label,
          'aria-invalid': invalid === true ? true : undefined,
          onClick: () => { setOpen(open === false); setActive(-1); },
        }, [
          h('span', { key: 'value', className: 'coreness-pickerLine coreness-pickerValue' },
            chosen < 0 ? (value === '' ? placeholder : value) : options[chosen].words),
          h('span', { key: 'arrow', className: 'coreness-pickerArrow' }, chevronMark()),
        ]),
        open === false ? null : h('span', {
          key: 'list',
          id: listId,
          className: 'coreness-pickerList',
          'data-picker-list': name,
          role: 'menu',
          'aria-label': label,
        }, options.map((one, at) => h('button', {
          /* The place stands in the key beside the value: two rows may offer one id — an empty value is
             an option of its own, and the same catalogue is offered for every row. */
          key: `${at}:${one.value}`,
          id: `${listId}-${at}`,
          type: 'button',
          role: 'menuitemradio',
          'aria-checked': one.value === value,
          'data-choice': one.value,
          'data-chosen': one.value === value ? 'true' : 'false',
          'data-active': at === active ? 'true' : 'false',
          tabIndex: -1,
          className: 'coreness-pickerItem coreness-button',
          onClick: () => choose(one.value),
        }, [
          h('span', { key: 'words', className: 'coreness-pickerLine coreness-pickerWords' }, one.words),
          one.value === value
            ? h('span', { key: 'check', className: 'coreness-pickerCheck' }, checkMark())
            : null,
        ]))),
      ]);
    }

    /* The control's own sheet, the host's own field geometry carried by its tokens alone: the trigger
       takes the place the platform's `select` would have taken in the field it stands in. */
    const CSS = `
.coreness-picker{position:relative;display:block}
/* The trigger's own axis, against the field column it wears beside this class: a field column stacks a label
   over its control, while the trigger parts its value from the fixed mark that names the list — one line, the
   value at the left and the mark beside it. The row values below are written for that line; on the column's
   axis they centre the value and drop the mark under it as a second level. The eight between the value and the
   arrow is this control's own: the two are parts of one line, and the arrow keeps its distance while the value
   is cut. */
.coreness-pickerTrigger{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);width:100%;font:inherit;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:6px 8px 6px 10px;font-size:14px;line-height:22px;cursor:pointer;flex-direction:row;justify-content:space-between;align-items:center;gap:8px;text-align:left}
.coreness-pickerTrigger:focus-visible{border-color:var(--dsw-alias-state-business-primary);outline:none}
.coreness-pickerTrigger[aria-invalid='true']{border-color:var(--dsw-alias-state-error-primary)}
/* A room that parts its text from a fixed mark: one line, never wrapped, cut with an ellipsis. The overflow is
   load-bearing twice — it hides the cut text and it lets the flex item shrink below its content, which is what
   lets the cut reach. The page writes no ground for the single line itself, and none is invented here. */
.coreness-pickerLine{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.coreness-pickerArrow{color:var(--dsw-alias-label-secondary);flex:none;display:inline-flex}
.coreness-pickerList{position:absolute;z-index:30;top:calc(100% + 4px);left:0;right:0;max-height:240px;overflow-y:auto;background:var(--dsw-alias-bg-layer-3,#fff);border:.5px solid var(--dsw-alias-border-l2,#0000001f);border-radius:var(--dsw-radius-md);box-shadow:var(--coreness-elevation);padding:4px;flex-direction:column;display:flex}
/* The row is the page's shared button beside its own differences: a borderless row that parts its words from its
   check, the list's own padding and gap, and the row's left alignment. It used to state the shared rule's own
   values beside them — the box, the radius, the transparent ground, the ink, the font, the pointer — and a
   declaration repeating a shared value holds that value still while the shared rule moves: the base changed,
   the row did not. The eight between the row's words and its check belongs to the row: the words take the room
   and the mark stands at its far side, so the two are parts of one line and not a pair of blocks. */
.coreness-pickerItem{border:none;padding:6px 8px;justify-content:space-between;gap:8px;display:flex;text-align:left}
.coreness-pickerCheck{color:var(--dsw-alias-state-business-primary);flex:none;display:inline-flex}
`;

    /**
     * The picker's sheet, held for as long as the picker stands: put in here, put back if it is taken.
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

    /** The picker's stylesheet as a tag: put in once, and never removed by this code. */
    function ensureStyles() {
      if (document.getElementById(STYLE_ID) !== null) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.setAttribute('data-plugin', PACKAGE);
      style.setAttribute('data-plugin-css', STYLE_TAG);
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    return { IdPicker, chevronMark };
  },
});
