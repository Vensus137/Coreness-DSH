/**
 * The credits widget's rewards panel: the bar arithmetic, a campaign's own words, the ring, one
 * account's block and the list of offers.
 *
 * A package-local part of `client.credits.js`, pulled by it with `require.async` and created before the
 * widget is seated. The widget's line and popover are the entry's (`client.credits.js`); what is drawn
 * inside the popover about the accounts and the campaigns stands here, over the entry's words, and the
 * entry reaches all of it through the one `shared`.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.credits.rewards.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The panel's own functions, made once over the widget's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /**
       * One account as the widget draws it: the bar's fill is the spend, and the two numbers under it
       * are the contour's own — what was used of what there is.
       *
       * The share is computed here rather than taken from the answer: the amount is total ÷ used, and a
       * part without a total has no share at all instead of a zero, which would read as an empty account.
       */
      function barOf(label, part) {
        if (part === undefined) return undefined;
        const { total, used, remaining } = part;
        const share = total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : undefined;
        return { label, total, used, remain: remaining, share, width: share === undefined ? 0 : Math.max(2, share) };
      }

      /**
       * The name of a campaign.
       *
       * The contour gives no name at all — its list carries a machine's key like `act-20260930-232` — so
       * the words are ours, chosen by the kind of campaign the contour does name: a reward taken by
       * claiming, or an offer that only asks to be looked at. This is a label for a kind, not a claim
       * about the account.
       */
      function rewardName(entry) {
        if (typeof entry.title === 'string' && entry.title !== '') return entry.title;
        if (String(entry.actionType ?? '').toUpperCase() === 'VIEW_DETAILS') return t('rewardOffer');
        return entry.kind === 'CREDITS' ? t('rewardCredits') : t('rewardPlain');
      }

      /**
       * One reward's line: its name, its size and how long it lasts. A size the contour did not name is
       * left out — words where a number belongs would read as a fact about the reward.
       */
      function rewardText(entry) {
        const parts = [rewardName(entry)];
        if (typeof entry.amount === 'number') parts.push(`+${entry.amount}`);
        if (typeof entry.validityDays === 'number') parts.push(`${entry.validityDays} ${t('days')}`);
        return parts.join(' · ');
      }

      /**
       * The day a plan renews, written the way the vendor's own page writes it: the month as a word,
       * because a number reads differently from place to place and the order of day and month is guessed.
       */
      function renewalText(at) {
        const date = new Date(at);
        return Number.isNaN(date.getTime())
          ? ''
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      /** The ring: a track and an arc, drawn from the spend's share and clamped to the circle. */
      function Ring(props) {
        const value = Math.min(100, Math.max(0, typeof props.percent === 'number' ? props.percent : 0));
        // The circumference of r = 7.25, and the arc starts at twelve o'clock.
        const circumference = 45.55;
        return h('span', { className: 'coreness-credits-glyph', 'aria-hidden': 'true' }, h('svg', {
          viewBox: '0 0 20 20',
          width: props.size,
          height: props.size,
          focusable: 'false',
        }, [
          h('circle', { key: 'track', cx: 10, cy: 10, r: 7.25, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, opacity: 0.4 }),
          h('circle', {
            key: 'arc',
            cx: 10,
            cy: 10,
            r: 7.25,
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2.5,
            strokeLinecap: 'round',
            strokeDasharray: String(circumference),
            strokeDashoffset: String(Math.round(circumference * (1 - value / 100) * 1000) / 1000),
            transform: 'rotate(-90 10 10)',
          }),
        ]));
      }

      /** One account's bar: a track and a fill of the spend's share. */
      function barFill(bar) {
        return h('span', { className: 'coreness-credits-bar' }, h('span', {
          className: 'coreness-credits-barFill',
          style: { width: `${bar.width}%` },
        }));
      }

      /**
       * One account in the popover: its name, the plan's renewal beside it, the bar, and the two numbers
       * under it — the vendor's own order and its own arithmetic.
       */
      function cardBlock(bar, key, note) {
        return h('span', { key, className: 'coreness-credits-seatRow' }, [
          h('span', { key: 'head', className: 'coreness-credits-rowHead' }, [
            h('span', { key: 'label', className: 'coreness-credits-cardLabel' }, bar.label),
            note === undefined ? null : h('span', { key: 'note', className: 'coreness-credits-rowNote' }, note),
          ]),
          barFill(bar),
          h('span', { key: 'foot', className: 'coreness-credits-rowHead' }, [
            h('span', { key: 'used', className: 'coreness-credits-rowLabel' }, bar.share === undefined
              ? `${t('used')} ${bar.used.toLocaleString()}`
              : `${bar.used.toLocaleString()} / ${bar.total.toLocaleString()} (${bar.share}% ${t('used')})`),
            h('span', { key: 'remain', className: 'coreness-credits-rowAmount' }, `${bar.remain.toLocaleString()} ${t('left')}`),
          ]),
        ]);
      }

      /**
       * The rewards block of the popover: its title, the hidden list's own sentence, the empty one and the
       * offers themselves. It stood inside the popover's own `draw` in the donor; it is the panel this file
       * is, and the rows it returns are appended where they stood.
       */
      function rewardRows(picture) {
        /* A campaign whose action is "look at the details" is not a reward to take: the contour lists it
           for reading, and neither "available" nor "claimed" over it is true. The claiming kinds stay — an
           open one is offered, a taken one is marked. */
        const rewards = picture.rewards.filter((entry) => String(entry.actionType ?? '').toUpperCase() !== 'VIEW_DETAILS');
        // A list that held only view-only entries has nothing to show; it is not an empty answer.
        if (rewards.length === 0 && picture.rewards.length > 0) return [];
        const rows = [];
        rows.push(h('p', { key: 'rewards', className: 'coreness-credits-blockTitle' }, t('rewards')));
        // A hidden list and an empty one are different things: hidden means the contour did not
        // recognise the desktop client, not that there is nothing to take.
        if (picture.shown === false) rows.push(h('p', { key: 'hidden', className: 'coreness-credits-dim' }, t('hidden')));
        if (picture.shown !== false && picture.rewards.length === 0) rows.push(h('p', { key: 'empty', className: 'coreness-credits-dim' }, t('noCampaigns')));
        if (rewards.length > 0) {
          rows.push(h('div', { key: 'list', className: 'coreness-credits-rewards' }, rewards.map((entry) => h('div', {
            key: entry.id,
            className: 'coreness-credits-reward',
          }, [
            h('span', { key: 'text', className: 'coreness-credits-rewardText' }, rewardText(entry)),
            // What was taken is marked, never hidden: the list shows what the contour handed out.
            h('span', {
              key: 'mark',
              className: entry.claimable === true ? 'coreness-credits-rewardMarkOn' : 'coreness-credits-rewardMark',
            }, entry.claimable === true
              ? t('available')
              : entry.status === 'CLAIMED' ? t('claimed') : t('notOffered')),
          ]))));
        }
        return rows;
      }

      return { barOf, rewardName, rewardText, renewalText, Ring, barFill, cardBlock, rewardRows };
    }

    return { create };
  },
});
