/**
 * The Qoder section's node: the address a request goes to, the row that carries it, and the two questions
 * the host's own route answers — one node sweep and one vendor verdict.
 *
 * A package-local part of `client.provider.js`, pulled by it with `require.async` and created before the
 * section is seated. The words of a verdict and the account a sweep leaves stand here because they are the
 * node's own: the section presses, this part asks, and the drawing reads the record this part keeps.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.provider.node.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The credits door the account's policy is read and changed through: the product's own route. */
    const CREDITS_ROUTE = '/api/coreness.credits';

    /** How often the row asks the route again while the held picture carries no policy yet. */
    const PRIVACY_RECHECK_MS = 2000;

    /** The node's own functions, made once over the section's words and the parts beside them. */
    function create({ t, kit, picker, hold, ctx, shared }) {
      /**
       * One node sweep, asked of the route the host half registers beside the credit one.
       *
       * The sweep signs and times every node itself, so the page asks once and draws the whole answer:
       * the state of each node of the map, and the node the sweep would pin — the one in use if it
       * answered, else the first that did. A refusal of the route is read, not guessed from a status,
       * the same way the credit card reads its own.
       */
      async function askSweep() {
        const answer = await fetch(shared.PROBE_ROUTE, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: shared.PROBE_ACTION }),
        });
        if (!answer.ok) throw new Error(t('route.answered', { status: answer.status }));
        const payload = await answer.json();
        if (payload?.ok !== true) throw new Error(payload?.error?.message ?? t('route.refusedSweep'));
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
          const answer = await fetch(shared.PROBE_ROUTE, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: shared.VERIFY_ACTION }),
          });
          /* The route's own path is neither drawn nor kept: it is this page's own door, and the sentence a
             reader is given is the state's word with the route's own answer — the console line this reason
             reaches names the section the answer came from. */
          if (!answer.ok) return { outcome: 'unsettled', code: null, reason: t('route.answered', { status: answer.status }) };
          const payload = await answer.json();
          if (payload?.ok !== true) return { outcome: 'unsettled', code: null, reason: payload?.error?.message ?? t('route.refusedCheck') };
          const verdict = payload.value;
          if (verdict === null || typeof verdict?.outcome !== 'string') return { outcome: 'unsettled', code: null, reason: t('route.noVerdict') };
          return verdict;
        } catch (error) {
          return { outcome: 'unsettled', code: null, reason: shared.reasonOf(error) };
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
        kit.statusDetail(t('status.subject.token'), said);
        if (verdict.outcome === 'accepted') return { where: 'credential', value: 'accepted', detail: said, stamp };
        return verdict.outcome === 'refused'
          ? { where: 'credential', value: 'refused', detail: said, stamp }
          : { where: 'credential', value: 'set', detail: said, stamp };
      }

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

      /**
       * The account's data-sharing policy, read through the credits door's held picture: the state the last
       * sweep left, asked here because the one press stands beside the node rather than in the wallet.
       *
       * The route's GET answers the picture its last read holds; this row starts no sweep of its own, so the
       * button and the wallet's own state read the same answer and a press does not race a fresh read.
       */
      async function readPrivacy() {
        const answer = await fetch(CREDITS_ROUTE, { headers: { accept: 'application/json' } });
        if (!answer.ok) throw new Error(t('route.answered', { status: answer.status }));
        const payload = await answer.json();
        if (payload?.ok !== true) throw new Error(payload?.error?.message ?? t('route.refusedSweep'));
        return payload.value?.last?.privacy ?? null;
      }

      /** The one press: ask the vendor to stop sharing, then read the picture back through the same door. */
      async function pressPrivacy() {
        const answer = await fetch(CREDITS_ROUTE, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'privacySet' }),
        });
        if (!answer.ok) throw new Error(t('route.answered', { status: answer.status }));
        const payload = await answer.json();
        if (payload?.ok !== true) throw new Error(payload?.error?.message ?? t('route.refusedCheck'));
        return payload.value?.last?.privacy ?? null;
      }

      /** What the policy is, in the words the button's title uses; the enums stay identifiers in it. */
      function privacyTitle(privacy) {
        const state = privacy.can_update === false
          ? 'Data sharing: on — the plan locks it'
          : privacy.attempted === true ? 'Data sharing: on — the vendor did not change it' : 'Data sharing: on';
        const plan = privacy.plan_tier === undefined ? '' : ` · plan: ${privacy.plan_tier}`;
        return `${state} · source: ${privacy.source}${plan}`;
      }

      /**
       * The one press, drawn beside the node's own: a button while the account shares and nothing at all
       * while it does not, so the row keeps its height either way. The button's title carries the state,
       * the plan's lock included; the credits popover draws no data-sharing at all. The row asks the
       * route again while the held picture carries no policy — a token saved in this visit fills it
       * later — and a failed read goes to the section's status with its reason, never dropped.
       * @param {{enabled: boolean}} props whether a value stands in the store
       * @returns {object | null} the button, or nothing while there is nothing to turn off
       */
      function PrivacyButton({ enabled }) {
        const [privacy, setPrivacy] = React.useState(null);
        const [busy, setBusy] = React.useState(false);
        const [error, setError] = React.useState(null);
        React.useEffect(() => {
          if (!enabled) {
            setPrivacy(null);
            return undefined;
          }
          let live = true;
          let beat = null;
          const read = () => {
            void readPrivacy()
              .then((next) => {
                if (!live) return;
                setPrivacy(next);
                if (next === null) beat = setTimeout(read, PRIVACY_RECHECK_MS);
              })
              .catch((reason) => {
                if (!live) return;
                const said = shared.reasonOf(reason);
                kit.statusDetail(t('status.subject.token'), t('detail.unsettled', { reason: said }));
                setPrivacy({ kind: 'failed', reason: said });
              });
          };
          read();
          return () => {
            live = false;
            if (beat !== null) clearTimeout(beat);
          };
        }, [enabled]);
        if (privacy === null || privacy.kind === 'failed' || privacy.share_enabled !== true) return null;
        return h('button', {
          type: 'button',
          className: 'coreness-qoder-button coreness-button',
          disabled: busy,
          title: error === null ? privacyTitle(privacy) : `the change failed: ${error}`,
          onClick: async () => {
            setBusy(true);
            setError(null);
            try {
              const next = await pressPrivacy();
              if (next !== null) setPrivacy(next);
            } catch (reason) {
              setError(shared.reasonOf(reason));
            } finally {
              setBusy(false);
            }
          },
        }, busy ? 'Stopping…' : 'Stop sharing');
      }

      /** The node the requests go to, or the map that answers for it. */
      function nodeLine(view) {
        return h('span', { key: 'where', className: 'coreness-qoder-line', 'data-node': view.node ?? '' }, view.node ?? t('node.map'));
      }

      /* The node's own row, inside the connection card: the address and the one action that pins a node. The
         answer of the sweep is not drawn here — a word beside the address pushes the press that asked for it to
         the right, and the reserved room of the card's header takes it — and **no mark stands here either**: a
         node is assumed to answer, so a dot saying "it works" states what nobody needs told (the user's word:
         «у ноды не нужно ставить круг зеленый… это лишнее»), while a red dot beside an address would say "a
         connection" in the colour that means a fault. What a node answered stands in the corner's word and in
         the reasons list under the card, and with nothing standing between the address and the press nothing
         arriving can move it. The action stays a hand and never a tick — pinning writes the profile's patch, and
         a pin made by a timer is the donor's own failure. Its
         class is kept for the live walk, which presses it and reads the answer in the card's own room. */
      function nodeRow(view, act) {
        const state = view.view;
        return h('div', { key: 'node', className: 'coreness-qoder-node' }, [
          nodeLine(state),
          h('button', {
            key: 'check',
            type: 'button',
            className: 'coreness-qoder-button coreness-button',
            disabled: view.busy !== null,
            onClick: () => act.check(),
          }, view.busy === 'check' ? t('node.checking') : t('node.check')),
          h(PrivacyButton, { key: 'privacy', enabled: state?.credential?.configured === true }),
        ]);
      }

      return { askSweep, askVerify, credentialWord, verdictNote, sweepAccount, nodeLine, nodeRow };
    }

    return { create };
  },
});
