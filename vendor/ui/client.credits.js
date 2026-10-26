/**
 * The account's credits in the sidebar's foot: the line and its popover.
 *
 * The seat is the sidebar shell's own — `sidebar.footer.action`, declared in the foot — and the same seat the
 * platform's Cordis panel takes. The shell hands the seat's registrants one prop, `wide`, which says whether
 * the sidebar is open: the shape of the line follows it.
 *
 * The rewards panel it draws inside the popover is the one part beside it (`client.credits.rewards.js`),
 * created over the same `shared` before the widget is seated.
 *
 * **What is not done here, and why.** A rule aimed at the sidebar's own generated class names would keep a
 * full-width card from standing in a row beside the Cordis badge, and the platform's instruction to a plugin author
 * forbids exactly that — do not read another plugin's DOM, stylesheet or component source to estimate placement;
 * choose a slot that already allocates space. This chunk registers into the seat as it is, draws its own element at
 * the width its sheet asks for, and lets the runtime say who else stands in that row.
 *
 * The figures are the product's own route (`/api/coreness.credits`), not the row's settings section: that section is
 * the profile's Cordis patch. This half asks and draws:
 * on the mount when no reading stands, on the refresh button, on the cadence the host names in its own
 * answer, and — while no balance has been read and a reading costs no vendor call — on a one-minute beat, so
 * a token written a moment ago is found without a press.
 *
 * A failed reading is a state, not a blank: the reason replaces the numbers on the line, and the popover
 * prints it in full under the head. Nothing here is muted. The two absences are the first moment, before any
 * answer stands, and a missing credential: with no account behind the widget there is nothing to show, so
 * the foot draws nothing and the Qoder section is where the token is written; the widget returns on the next
 * beat.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.credits.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/ui';
    /** The plugin's own door: the held picture on a GET, one reading or one claim on a POST. */
    const ROUTE = '/api/coreness.credits';
    /** The seat the sidebar shell declares in its foot, above the Settings control. */
    const SEAT = 'sidebar.footer.action';
    /** This widget's own id inside that seat. */
    const ID = 'qoder-credits';
    /** The locale namespace of the widget's words. */
    const NS = 'coreness.credits';
    const STYLE_ID = 'coreness-ui-credits-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/ui/client.credits.js';
    const USAGE_URL = 'https://qoder.com/account/usage';
    /** What this chunk's own elements answer to when a press lands outside them: the trigger in both shapes stands inside its own surface. */
    const MINE = '.coreness-credits-seat, .coreness-credits-rail, .coreness-credits-card';
    /** How often the widget asks again when the host's answer names no cadence of its own. */
    const FALLBACK_EVERY_MS = 10 * 60 * 1000;
    /** How often the widget asks while no balance has been read at all: a token written a moment ago is
        found on the next beat instead of waiting out the sweep's ten minutes. */
    const UNREAD_EVERY_MS = 60 * 1000;

    /* The rewards panel, pulled at materialisation and in hand before the widget is seated. A pull
       that failed is named and seats nothing. */
    const REWARDS = require.async('./client.credits.rewards.js');

    /* The widget's words. They are English, kept whole — including the sentence that tells a hidden campaign list
       apart from an empty one. The vendor's backend is called "the contour", in the same sense as everywhere else
       in this repository. */
    const EN = {
      seat: 'Qoder',
      usage: 'My usage',
      usageLink: 'Account usage',
      refresh: 'Refresh',
      left: 'left',
      used: 'used',
      plan: 'Plan',
      bonus: 'Bonus',
      renews: 'Renews on',
      notRead: 'the balance has not been read yet',
      exhausted: 'the quota is exhausted',
      rewards: 'Rewards',
      hidden: 'the contour did not recognise the desktop client: the campaign list is hidden (this is not "no campaigns")',
      noCampaigns: 'no campaigns in the answer',
      rewardCredits: 'Credits reward',
      rewardOffer: 'Special offer',
      rewardPlain: 'Reward',
      days: 'days',
      available: 'available',
      nothingToTake: 'Nothing to take right now',
      claimed: 'claimed',
      notCollected: 'nothing was collected',
      already: 'already collected',
      refused: 'refused',
    };

    /* The sheet, under this widget's prefix. The class names are this widget's; every colour is either a
       `--dsw-alias-*` token or a literal kept where the host's token has no counterpart. */
    const CSS = `
.coreness-credits-seat{box-sizing:border-box;flex:0 0 auto;width:100%;min-width:0;font:inherit;color:var(--dsw-alias-label-secondary);text-align:left;cursor:pointer;background:0 0;border:1px solid transparent;border-radius:var(--dsw-radius-md);align-items:center;gap:8px;margin:0 0 4px;padding:8px;display:flex}
.coreness-credits-seat:hover{border-color:var(--dsw-alias-border-l2,#0000001f)}
/* The seat's name takes no shrinking and no second line; its pair and ink are the page's name line, worn
   beside this class. */
.coreness-credits-seatName{flex:none;white-space:nowrap}
.coreness-credits-seatNote{flex:0 1 auto;margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis}
/* The lines a seat stacks stand four apart: a seat is read as one statement, so its own lines stay tighter than
   the rewards below it. */
.coreness-credits-seatRow{flex-direction:column;gap:4px;min-width:0;display:flex}
.coreness-credits-rowHead{align-items:baseline;gap:8px;min-width:0;display:flex}
.coreness-credits-rowLabel{flex:1;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.coreness-credits-rowAmount{flex:none;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;white-space:nowrap}
.coreness-credits-rowNote{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;white-space:nowrap}
.coreness-credits-bar{display:block;background:var(--dsw-alias-bg-layer-2,#00000014);border-radius:var(--coreness-pill-radius);height:5px;overflow:hidden}
.coreness-credits-barFill{display:block;background:var(--dsw-alias-brand-primary,#0f1115);border-radius:var(--coreness-pill-radius);height:100%}
.coreness-credits-glyph{flex:none;justify-content:center;align-items:center;display:inline-flex;color:var(--dsw-alias-brand-primary,#0f1115)}
.coreness-credits-rail{box-sizing:border-box;width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:1px solid transparent;border-radius:var(--dsw-radius-sm);flex:none;justify-content:center;align-items:center;margin:0 0 4px;padding:0;display:inline-flex}
.coreness-credits-card{background:var(--dsw-alias-bg-layer-3,#fff);border:.5px solid var(--dsw-alias-border-l2,#0000001f);border-radius:var(--dsw-radius-md);box-shadow:var(--coreness-elevation);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;font-size:12px;gap:10px;line-height:18px;max-width:320px;min-width:260px;padding:12px;position:fixed;z-index:1000}
.coreness-credits-card .coreness-credits-bar{height:8px}
.coreness-credits-cardHead{align-items:center;gap:8px;display:flex}
.coreness-credits-cardTitle{flex:1;font-size:14px;font-weight:600;line-height:22px}
.coreness-credits-blockTitle{margin:0;color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600;line-height:18px}
.coreness-credits-cardLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600;line-height:18px}
.coreness-credits-icon{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;line-height:0;font:inherit;color:var(--dsw-alias-label-tertiary);background:0 0;border:0;border-radius:var(--dsw-radius-sm);cursor:pointer;text-decoration:none}
/* The treatment the widget's three controls share, declared once with its state in the selector: the seat and the rail are one node under two names and the icon is the popover's own control, so the ring a keyboard visit draws and the ink and fill a pointer visit draws stand here, after the members' rules, where no member's own rule can take them back. */
.coreness-credits-ring:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#0f1115);outline-offset:1px}
.coreness-credits-ring:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover,#0000000f)}
.coreness-credits-iconWrap{display:inline-flex;line-height:0}
/* The turn is not switched off under prefers-reduced-motion: it is the only sign that a reading is
   running, and a system with animations off would take that sign away in silence. */
.coreness-credits-spin{animation:coreness-credits-turn .9s linear infinite}
@keyframes coreness-credits-turn{to{transform:rotate(1turn)}}
.coreness-credits-dim{margin:0;color:var(--dsw-alias-label-tertiary)}
.coreness-credits-bad{margin:0;color:var(--dsw-alias-state-error-primary,#c0392b);word-break:break-word}
/* The rewards stand six apart: each is a line with a mark of its own, so this list parts them with a list's room
   and not with the tighter one a seat's own lines take. */
.coreness-credits-rewards{display:flex;flex-direction:column;gap:6px}
.coreness-credits-reward{align-items:baseline;display:flex;gap:8px;min-width:0}
.coreness-credits-rewardText{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.coreness-credits-rewardMark{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.coreness-credits-rewardMarkOn{flex:none;color:var(--dsw-alias-brand-primary,#0f1115);font-size:12px;line-height:18px}
`;

    /** The widget's words, filled in `apply`. */
    let t = (key) => key;

    /**
     * The widget's sheet, held for as long as the widget stands: put in here, put back if it is taken.
     *
     * The platform replaces a plugin in place over the module table it already holds — `import` answers from
     * the module cache, so a factory does not run twice — and
     * it takes the package's own style tags away in the same act (`removeOwnedStyles`). The one thing
     * it re-runs is the mount, which covers a section that is left and entered again; it does not cover a
     * component that stays mounted while the tags go, so the frame's rules can vanish while the markup stays
     * drawn. The head is watched while this component stands.
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

    /** The widget's stylesheet as a tag: put in once, and never removed by this code. */
    function ensureStyles() {
      if (document.getElementById(STYLE_ID) !== null) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.setAttribute('data-plugin', PACKAGE);
      style.setAttribute('data-plugin-css', STYLE_TAG);
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    /** The reason of a thrown value, in words. */
    const reasonOf = (error) => (error instanceof Error ? error.message : String(error));

    /** The one object the part reaches the entry's half through; the entry fills it before the part is made. */
    const shared = { ROUTE, SEAT, ID, NS, USAGE_URL, MINE, FALLBACK_EVERY_MS, reasonOf };

    /** A refusal of the widget's own request: the route's code and its words. */
    class Refused extends Error {
      constructor(code, message) {
        super(message ?? code);
        this.name = 'Refused';
        this.code = code;
      }
    }

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
      if (payload?.ok !== true) throw new Refused(payload?.error?.code ?? 'unreadable', payload?.error?.message);
      return payload.value;
    }

    /**
     * The picture the widget draws, built from the host's answer alone.
     *
     * The remainders and the share are sums over the accounts that answered: the line shows what is left of
     * everything, and how much of everything was spent. A picture is built only from a finished reading — a
     * failure carries no numbers, and drawing the previous ones beside a fresh failure would read as a figure.
     */
    function pictureOf(answer) {
      const last = answer?.last;
      if (last?.kind !== 'done') return undefined;
      const quota = last.quota;
      const bars = [shared.barOf(t('plan'), quota.plan), shared.barOf(t('bonus'), quota.bonus)].filter((bar) => bar !== undefined);
      const remain = bars.reduce((sum, bar) => sum + bar.remain, 0);
      const spent = bars.reduce((sum, bar) => sum + bar.used, 0);
      const size = bars.reduce((sum, bar) => sum + bar.total, 0);
      const share = size === 0 ? undefined : Math.min(100, Math.max(0, Math.round((spent / size) * 100)));
      return {
        bars,
        remain,
        share,
        exceeded: quota.exceeded === true,
        expiresAt: typeof quota.expiresAt === 'number' ? quota.expiresAt : undefined,
        shown: last.campaigns.shown,
        rewards: Array.isArray(last.campaigns.list) ? last.campaigns.list : [],
        collection: last.collection,
        usageUrl: typeof quota.usageUrl === 'string' ? quota.usageUrl : undefined,
      };
    }

    /**
     * The line in the sidebar's foot: the seat's name and what is known.
     *
     * Three forms, and the third is the point of the pair: with a share the line says both numbers,
     * without one it says only what is left, and before any reading it says so in words rather than
     * showing a zero — a zero left is a fact, and nothing has been read.
     *
     * A reading that failed keeps that third form: the line draws the **state**, and the host's own
     * sentence — the reason, which is content — stands in the popover a user opens. A face carries a
     * state and a bounded word; the sentence that names why the read failed is read where it is asked for,
     * and the row the popover draws for a failure is where it stands.
     */
    function summaryOf(picture) {
      if (picture === undefined) return `${t('seat')}: ${t('notRead')}`;
      if (picture.share === undefined) return `${t('seat')}: ${picture.remain.toLocaleString()} ${t('left')}`;
      return `${t('seat')}: ${picture.remain.toLocaleString()} ${t('left')} · ${picture.share}% ${t('used')}`;
    }

    /** The link glyph: an arrow out of a square, the sign the vendor's own page uses. */
    function LinkIcon(size) {
      return h('svg', { viewBox: '0 0 24 24', width: size, height: size, focusable: 'false', 'aria-hidden': 'true' },
        h('path', {
          d: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
          fill: 'currentColor',
        }));
    }

    /** The refresh glyph: a circular arrow. A reading is visible by its turning. */
    function RefreshIcon(size) {
      return h('svg', { viewBox: '0 0 24 24', width: size, height: size, focusable: 'false', 'aria-hidden': 'true' },
        h('path', {
          d: 'M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z',
          fill: 'currentColor',
        }));
    }

    /**
     * The widget as it draws, from a view and the acts it may take: the line in its three forms, the narrow
     * cell, and the popover with its parts.
     */
    function draw(view, act) {
      const wide = view.wide === true;
      const picture = view.picture;
      const failed = view.failed;
      /* The vendor's own body of a failed reading: content, drawn beside the reason in the failed row. */
      const vendor = view.vendor;
      const running = view.busy === true;
      const summary = summaryOf(picture);

      const seat = h('button', {
        key: 'seat',
        type: 'button',
        // In the narrow sidebar only the ring fits: the numbers move into the tooltip and the label
        // rather than disappearing.
        className: wide ? 'coreness-credits-seat coreness-credits-ring' : 'coreness-credits-rail coreness-credits-ring',
        title: wide ? undefined : summary,
        'aria-label': summary,
        'aria-expanded': view.open === true,
        onClick: (event) => act.toggle?.(event),
      }, wide ? [
        h(shared.Ring, { key: 'ring', percent: picture?.share, size: 16 }),
        h('span', { key: 'name', className: 'coreness-credits-seatName coreness-name' }, t('seat')),
        /* The note draws the state; its tone is what tells a failed reading from one not yet made — a face
           carries a bounded state, and the host's sentence stands in the popover. */
        h('span', {
          key: 'note',
          className: failed === undefined ? 'coreness-credits-seatNote' : 'coreness-credits-seatNote coreness-credits-bad',
        }, picture === undefined
          ? t('notRead')
          : picture.share === undefined
            ? `${picture.remain.toLocaleString()} ${t('left')}`
            : `${picture.remain.toLocaleString()} ${t('left')} · ${picture.share}% ${t('used')}`),
      ] : [h(shared.Ring, { key: 'ring', percent: picture?.share, size: 18 })]);

      if (view.open !== true) return seat;

      const rows = [];
      /* The vendor's body is content the page shows whole, and a route may hand a whole body of it. The line
         wears the page's own cut line so the block cannot grow the card it stands in, and the whole sentence —
         the reason and the body — stands in the title for the reader who asks for it. */
      if (failed !== undefined) {
        const body = vendor === undefined || vendor === null || vendor === '' ? '' : ` — ${vendor}`;
        rows.push(h('p', {
          key: 'failed',
          className: body === '' ? 'coreness-credits-bad' : 'coreness-credits-bad coreness-cutLine',
          title: body === '' ? undefined : `${failed}${body}`,
        }, `${t('refused')}: ${failed}${body}`));
      }
      if (picture === undefined) {
        if (failed === undefined) rows.push(h('p', { key: 'none', className: 'coreness-credits-dim' }, t('notRead')));
      } else {
        const note = picture.expiresAt === undefined ? undefined : `${t('renews')} ${shared.renewalText(picture.expiresAt)}`;
        picture.bars.forEach((bar, index) => {
          rows.push(shared.cardBlock(bar, `card-bar-${index}`, index === 0 ? note : undefined));
        });
        if (picture.exceeded) rows.push(h('p', { key: 'exceeded', className: 'coreness-credits-dim' }, t('exhausted')));
        rows.push(...shared.rewardRows(picture));
      }

      /* The automatic collection says nothing when it went through: the marks above already carry which rewards
         were taken, and announcing it is one line too many. A failure and a replay keep their lines — silence about
         a reward that was not taken reads as a reward that did not exist. */
      const collection = picture?.collection;
      if (collection !== undefined) {
        if (typeof collection.failure === 'string' && collection.failure !== '') {
          rows.push(h('p', { key: 'collect', className: 'coreness-credits-bad' }, `${t('notCollected')}: ${collection.failure}`));
        } else if (collection.replayed === true) {
          rows.push(h('p', { key: 'collect', className: 'coreness-credits-dim' }, t('already')));
        }
      }
      return [seat, h('div', {
        key: 'card',
        className: 'coreness-credits-card',
        role: 'dialog',
        'aria-label': t('usage'),
        // Until the cell's own rectangle is known the card is not shown: otherwise it would flash in the
        // window's corner for a frame.
        style: view.anchor === undefined
          ? { left: 0, bottom: 0, visibility: 'hidden' }
          : { left: view.anchor.left, bottom: view.anchor.bottom },
      }, [
        h('div', { key: 'head', className: 'coreness-credits-cardHead' }, [
          h('span', { key: 'title', className: 'coreness-credits-cardTitle' }, t('usage')),
          h('a', {
            key: 'usage',
            className: 'coreness-credits-icon coreness-credits-ring',
            href: picture?.usageUrl ?? shared.USAGE_URL,
            target: '_blank',
            rel: 'noreferrer',
            title: t('usageLink'),
            'aria-label': t('usageLink'),
          }, LinkIcon(15)),
          h('button', {
            key: 'refresh',
            type: 'button',
            className: 'coreness-credits-icon coreness-credits-ring',
            title: t('refresh'),
            'aria-label': t('refresh'),
            // The button is neither locked nor greyed while a reading runs: a frozen button reads as a
            // break, and a press of its own loses nothing — the host answers one reading at a time.
            onClick: () => act.refresh?.(),
          }, h('span', {
            key: 'icon',
            // One wrapper in both states: an inline box and an inline-flex one lay out differently, and
            // the glyph would jump on the press.
            className: running ? 'coreness-credits-iconWrap coreness-credits-spin' : 'coreness-credits-iconWrap',
          }, RefreshIcon(15))),
        ]),
        ...rows,
      ])];
    }

    /** The seat: the line, the popover, and the reading behind both. */
    function CreditsSeat(props) {
      const wide = props.wide === true;
      /* The widget's sheet, ensured where the widget is drawn: the platform's own replace re-mounts a plugin
         over the module table it already has and takes the package's style tags with it, so the mount is the
         one place a sheet can be put back. */
      useStyles();
      const [held, setHeld] = React.useState({ kind: 'waiting' });
      const [busy, setBusy] = React.useState(false);
      const [open, setOpen] = React.useState(false);
      const [anchor, setAnchor] = React.useState(undefined);
      /** Why the widget's own asking failed, when the route itself could not be reached or refused. */
      const [fault, setFault] = React.useState(undefined);
      const [everyMs, setEveryMs] = React.useState(FALLBACK_EVERY_MS);
      const picture = pictureOf(held);
      const pictureKnown = picture !== undefined;
      /* No credential stored: there is no account behind the widget, so it draws nothing. */
      const missingCredential = held?.last?.kind === 'failed' && held.last.code === 'MISSING_CREDENTIAL';
      /* The short beat belongs to the states where a reading costs no vendor call: nothing answered yet, or
         no credential stored. A refused token (AUTH, RATE_LIMIT, TRANSPORT) keeps the host's own cadence — a
         page that POSTed a read every minute would be a vendor poller. */
      const retryFree = !pictureKnown && (held?.last?.kind !== 'failed' || missingCredential);

      /** One answer from the route, kept the way the widget draws it. */
      const take = (value) => {
        setHeld(value);
        setFault(undefined);
        if (typeof value?.sweep?.everyMs === 'number' && value.sweep.everyMs > 0) setEveryMs(value.sweep.everyMs);
      };

      /**
       * One reading, asked for without a press: the mount and the cadence.
       *
       * A route that cannot be reached is a state of the widget, not a lost line: the reason replaces
       * the numbers, exactly as a reading the host could not finish does.
       */
      const listen = async () => {
        try {
          const value = await ask('GET');
          take(value);
          return value;
        } catch (error) {
          setHeld({ kind: 'waiting' });
          setFault(`${error?.code ?? 'unreadable'}: ${reasonOf(error)}`);
          return undefined;
        }
      };

      /* The mount asks for the held picture, and asks for a reading when none stands: the host sweeps on its
         own mount, and this closes the race in the widget's favour — a page opened after a token was written
         is not left saying "not read yet" until the next beat. */
      React.useEffect(() => {
        void listen().then((value) => {
          if (value?.last?.kind !== 'done') void refresh();
        });
      }, []);

      /* The line follows the host's own cadence: the answer names how often the sweep reads, so the
         widget asks again at that pace instead of keeping a second schedule to stay in step with. This
         applies to a standing picture and to a refused token alike — the short beat below is the only
         exception. */
      React.useEffect(() => {
        if (retryFree) return () => {};
        const timer = setTimeout(() => {
          void listen();
        }, everyMs);
        return () => {
          clearTimeout(timer);
        };
      }, [everyMs, held, retryFree]);

      /* Nothing answered yet, or nothing to answer with: ask on a short beat instead of waiting out the
         cadence, so a token written into the platform's Settings is found within a minute. Only the free
         states take the beat: the host refuses a missing credential before the vendor is called. */
      React.useEffect(() => {
        if (!retryFree || busy) return () => {};
        const timer = setTimeout(() => {
          void refresh();
        }, UNREAD_EVERY_MS);
        return () => {
          clearTimeout(timer);
        };
      }, [retryFree, busy, held]);

      /* Opening the popover is a reader asking now: a picture that does not stand yet is read in that press
         rather than after the next beat. */
      React.useEffect(() => {
        if (open && !pictureKnown) void refresh();
      }, [open]);

      /* Hiding the widget closes its popover, so a token that answers later does not re-open a card anchored
         to a press from another minute. A fault of this half's own asking keeps the widget drawn, so a press
         there still opens the card and its reason is readable. */
      React.useEffect(() => {
        if (open && fault === undefined && (missingCredential || held?.kind === 'waiting')) setOpen(false);
      }, [open, missingCredential, fault, held]);

      /** A human press: one reading, and the icon turns while it runs. */
      const refresh = async () => {
        setBusy(true);
        try {
          take(await ask('POST', { action: 'read' }));
        } catch (error) {
          /* A failed reading replaces the standing picture the way `listen` does: a figure beside a fresh
             failure reads as a figure, and the reason is one press away in the popover. */
          setHeld({ kind: 'waiting' });
          setFault(`${error?.code ?? 'unreadable'}: ${reasonOf(error)}`);
        } finally {
          setBusy(false);
        }
      };

      /* The popover closes on a press outside it and on Escape. The cell's own rectangle comes from the press
         itself — nothing is measured after the fact — and until it is known the card stays hidden. */
      React.useEffect(() => {
        if (!open) return () => {};
        const onPress = (event) => {
          const inside = typeof event?.target?.closest === 'function' && event.target.closest(MINE) !== null;
          if (!inside) setOpen(false);
        };
        const onKey = (event) => {
          if (event?.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPress, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
          document.removeEventListener('pointerdown', onPress, true);
          document.removeEventListener('keydown', onKey, true);
        };
      }, [open]);

      const toggle = (event) => {
        if (open) {
          setOpen(false);
          return;
        }
        const rect = event?.currentTarget?.getBoundingClientRect?.();
        if (rect !== undefined) setAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
        setOpen(true);
      };

      /* Two readings can fail: the host's own (it answers with the reason `last` carries) and this
         half's asking for it. Both are the same fact to the line — there is no figure to show, and
         here is why — so both take the same place.
         The vendor's own body is content rather than state: the line keeps the reason, and the body
         travels beside it so the popover can show what the contour said without a face carrying it. */
      const vendor = fault === undefined && held?.last?.kind === 'failed' ? held.last.vendor : undefined;
      /* The newer fact wins: a fault of this half's own asking is newer than the held answer it stands on. */
      const failed = fault ?? (held?.last?.kind === 'failed' ? held.last.message : undefined);
      /* Before the first answer, and with no credential stored, the foot draws nothing: the first moment is
         not yet a state, and a missing credential has no account behind it. A fault of this half's own asking
         is still drawn, so a dead route never disappears into the silence. */
      if (held?.kind === 'waiting' && fault === undefined) return null;
      if (missingCredential && fault === undefined) return null;
      return draw({ wide, open, picture, vendor, failed, busy, anchor }, { toggle, refresh });
    }

    return {
      /** Register the widget into the sidebar's own foot. */
      apply(pluginCtx) {
        t = pluginCtx.locale.bind(NS);
        pluginCtx.effect(() => pluginCtx.locale.register(NS, 'en', EN), `${PACKAGE}: the credits dictionary`);
        /* The seat is filled when the rewards panel the popover draws is in hand: the pull began when
           this chunk was materialised, and nothing stands in the foot before there is a widget to draw. */
        pluginCtx.effect(() => {
          let live = true;
          let armed = null;
          REWARDS.then(
            (rewardsModule) => {
              if (!live) return;
              const parts = { t, kit: null, picker: null, hold: null, ctx: pluginCtx, shared };
              Object.assign(shared, rewardsModule.create(parts));
              armed = pluginCtx.slots.inject(SEAT, () => pluginCtx.slots.register({
                name: SEAT,
                id: ID,
                order: 20,
                locale: NS,
              }, CreditsSeat));
            },
            (error) => {
              console.error(`${PACKAGE}: a part of the credits widget did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof armed === 'function') armed();
          };
        }, `${PACKAGE}: the rewards and the credits seat`);
      },
    };
  },
});
