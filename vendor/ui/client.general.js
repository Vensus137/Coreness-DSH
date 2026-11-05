/**
 * The General page: the product's small settings, one subject per card.
 *
 * The page exists for a setting that deserves a control but not a page of its own, and it carries three
 * subjects. The Agent Team's card is the ceiling the team row carries and the two switches that let the
 * product's own text — and the review paragraph that rides inside it — stand in place of the platform's last
 * sentence of the team policy. The Page fetch card is one check over the platform's shared `web` row: on,
 * page fetches are served by the product's own provider; off, the platform's own fetch stands untouched. The
 * proxy card writes the product row's two switches and its URL, shows the URL back in its field and asks
 * the proxy's own route to check it.
 *
 * The namespace each switch writes is the host's own answer (`ns`): the row's id in the composition lives in
 * the composition, and a copy of it here would drift. Every write is followed by a read of what it wrote —
 * the route's picture, the settings row or the proxy's own route — the cards draw what the platform holds,
 * never the word the press asked for — and the platform's own announcements re-read them.
 *
 * A section chunk of the product's page, pulled by the entry with `require.async` and registered into the
 * seat the page declares. It draws with the page's own set — the card frame, the section title, the
 * answer strip, the field label, the field box, the check, the button and the hint lines — adding only
 * the classes its own cards own.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.general.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/ui';
    /** The seat the page declares for its sections. */
    const SEAT = 'coreness.section';
    /** The rail row's own id inside that seat. */
    const ID = 'general';
    /** The locale namespace of the page's words. */
    const NS = 'coreness.general';
    /** The host route that reads and writes the team's ceiling, and reports the policy's outcome. */
    const ROUTE = '/api/coreness.team';
    /** The host route that answers the proxy's picture and runs its check. */
    const PROXY_ROUTE = '/api/coreness.proxy';
    /** The platform's shared row the page fetch check writes: its id is the platform's own, not this page's. */
    const WEB_NS = 'web';
    /** The product's fetch provider in the shared row, and the platform's own provider the off state names. */
    const FETCH_ON = 'coreness-fetch';
    const FETCH_OFF = 'http';
    const STYLE_ID = 'coreness-ui-general-style';
    /** The module id the sheet is marked with, as the host marks its own (`data-plugin-css`). */
    const STYLE_TAG = '@coreness/ui/client.general.js';
    /** The platform's announcements that invalidate what the cards read. */
    const WATCHED = ['settings/document-updated'];
    /** The credential store's announcement that a reference moved: the proxy URL is a reference, and a
        record's own edit is a disjoint space that cannot change whether one is configured. */
    const WATCHED_CREDENTIALS = ['credentials/reference-updated'];

    /** The page's own words. One namespace, one dictionary; the rail's label is a thunk so it follows the language. */
    const EN = {
      section: 'General',
      'team.title': 'Agent team',
      'team.field': 'Teammates',
      'team.save': 'Save',
      'team.remark': 'A change re-applies the team row: running teammates stop, and the roster and the board recover from the Lead\'s session log.',
      'team.prompt': 'Team prompt',
      'team.promptHint': 'On, the product\'s paragraph stands in the Lead\'s prompt in place of the policy\'s last sentence: the Lead leads and sets the plan, hands the work out as shared tasks, takes none of the members\' work over, and answers for the result — it closes the task while the user judges the surface they see, and it never holds a turn open: no wait_agent, no sleep or poll inside a command; when time must pass it sets a reminder and ends the turn. Every other line of the policy stays as the platform wrote it, and a teammate\'s prompt keeps the platform\'s text. Off, the text is the platform\'s, untouched. When the policy\'s last sentence is not the one the switch replaces, it changes nothing until it is. Applies from the session\'s next step; a change may invalidate the provider\'s cached prefix.',
      'team.review': 'Review pass',
      'team.reviewHint': 'On, the paragraph about reviews follows the team text in the Lead\'s prompt: a reviewer is a fresh agent with a clean eye, called on every circle of work and not on small tasks; it holds the work against the spec and the traces, asks where it is weak, where it is extra and what is missing, and every finding carries a path and a quote; it does not edit and does not accept, and the review does not replace the acceptance that closes the task. The paragraph stands inside the text the Team prompt switch supplies, so it changes nothing while that switch is off.',
      'team.off': 'Enable Agent Teams',
      'team.unwritable': 'Not writable',
      /* The fetch feature's two cards. A hint is one paragraph; a verdict is one word, because the reason
         behind it names the proxy's address and belongs to the console. */
      'fetch.title': 'Page fetch',
      'fetch.label': 'Use the improved page fetch',
      'fetch.hint': 'On, page fetches go through the product\'s own fetch: the platform\'s HTTP fetch with a browser identity and a wider body.',
      'proxy.title': 'Proxy',
      'proxy.label': 'Proxy for page fetch',
      'proxy.hint': 'On, a fetch goes through the proxy once the proxy answers a quick reachability check; a proxy that fails the check leaves the fetch direct, and one that fails during the fetch is reported as the error, not retried. A call left with no time for the check runs through the proxy unchecked. Unless the whole traffic is on.',
      'proxy.all.label': 'Proxy all traffic',
      'proxy.all.hint': 'On, every request the harness itself makes goes through the proxy: the model, search, page fetch, MCP connections and the market — at once. The app\'s own pages, its built-in browser included, are not proxied.',
      'proxy.field': 'Proxy URL',
      'proxy.placeholder': 'http://user:pass@host:port',
      /* The URL's own facts: the schemes the proxy takes and the wait both switches share. They stand under the
         field, not under either switch, because neither switch owns them. */
      'proxy.url.hint': 'Only HTTP and HTTPS proxies are available. Both switches wait for this URL.',
      'proxy.save': 'Save proxy',
      'proxy.saving': 'Saving…',
      'proxy.check': 'Check proxy',
      'proxy.checking': 'Checking…',
      'proxy.notAvailable': 'Not available',
      /* The one sentence a refused URL repeats — the same shape the host's check parses from the value in
         force. */
      'proxy.reason': 'The proxy URL must be an http or https address: http(s)://[user:pass@]host:port.',
      /* What only the console carries: a route that is gone, the store's refusal after it took the call, and
         a check that answered no word of its three. */
      'proxy.unreachable': 'The proxy route could not be reached.',
      'proxy.notConfigured': 'The credential store took the call but no URL is configured: reading the picture back says nothing is there, so the save did not stand.',
      'proxy.noVerdict': 'The check answered no verdict of its three.',
      'verdict.works': 'Works',
      'verdict.refused': 'Refused',
      'verdict.unanswered': 'No answer',
      'state.unread': 'Not read',
      'state.saved': 'Saved',
      'state.refused': 'Not saved',
      'reason.invalid': 'The ceiling is a whole number of at least 1.',
      'reason.unreachable': 'The team route could not be reached.',
      'reason.unreadable': 'The value in force could not be re-read',
    };

    /* The card's own look: the frame, its head, the strip's room, the field's box, its label and the check
       are the page's; a section keeps only what is its own — the title that takes the growing space and
       carries the mark of what the card is about, the row the field shares with its buttons, and the field's
       share of that row. The strip takes the head's last place after the corner's word: the word carries the
       one auto margin the row needs, and a strip drawn before it would stand away from the card's edge. */
    const CSS = `
.coreness-general-head .coreness-sectionTitle{flex:1 1 auto;display:flex;align-items:center;gap:10px;min-width:0}
.coreness-general-head>.coreness-answer{order:2}
.coreness-general-field{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.coreness-general-input{flex:1 1 0;min-width:0}
.coreness-general-input:disabled{opacity:.5}
`;

    /** Put the page's sheet back where a re-mount of the plugin may have taken it. */
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
     * The section's sheet, held for as long as the section stands: put in here, put back if it is taken.
     * The platform replaces a plugin in place and takes the package's style tags with it, and the mount is
     * the one place a sheet can be put back; the hold ends with the effect, because a sheet that outlived
     * its plugin would be a trace.
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

    /** The message of a thrown value. */
    const reasonOf = (error) => (error instanceof Error ? error.message : String(error));

    /** The box's text for a picture: empty when no ceiling is in force. */
    const draftOf = (value) => (value?.maxMembers === null || value?.maxMembers === undefined ? '' : String(value.maxMembers));

    let t = (key) => key;

    /**
     * The team as the host answers it: `{mounted, editable, maxMembers, prompt, review, policy, ns}`.
     *
     * A refusal is read from the payload, never guessed from a status: the route answers `{ok:false}` with
     * status 200 for a state it could not build, and a card that drew "no ceiling" there would be showing
     * a failure as an empty row.
     */
    /**
     * One request to one of the host's routes. A transport failure — the route gone, the page's own
     * connection down — is the card's sentence, not the browser's: "Failed to fetch" is what a raw throw
     * reads like, and the card is no place for a message nothing on the page can act on. The cause goes to
     * the console; the sentence is the route owner's, because one route's outage is not another's.
     */
    async function reach(init, path = ROUTE, unreachable = t('reason.unreachable')) {
      try {
        return await fetch(path, init);
      } catch (error) {
        console.error(`${PACKAGE}: ${path} could not be reached: ${reasonOf(error)}`);
        throw new Error(unreachable);
      }
    }

    /**
     * The team picture. A failure is a sentence the page owns; the route's own words stand when it answered.
     */
    async function read() {
      const answer = await reach({ method: 'GET' });
      if (!answer.ok) throw new Error(`${ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${ROUTE} refused the read`);
      return payload.value;
    }

    /**
     * One write of the ceiling. The refusal travels with the platform's own words when the editor refused
     * it, and with the route's own when the value was not a whole number of at least 1.
     */
    async function write(value) {
      const answer = await reach({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ maxMembers: value }),
      });
      if (!answer.ok) throw new Error(`${ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${ROUTE} refused the write`);
      return payload.value;
    }

    /**
     * The platform's settings mirror: every row the page may write, and whether the profile lets this page
     * write the document at all. One door carries all three cards' rows; each card asks it for its own.
     */
    async function readDocument(remote) {
      const described = await remote.settings.describe();
      if (!described.ok) throw new Error(described.error?.message ?? 'the settings service refused the read');
      return { rows: described.value.namespaces, writable: described.value.writable === true };
    }

    /** The row a namespace names, or `undefined` when the composition addresses none. */
    const rowOf = (document, ns) => (typeof ns === 'string' && ns !== ''
      ? document.rows.find((one) => one.ns === ns)
      : undefined);

    /**
     * The team switch's row: its revision and its two values, or `null` when the composition addresses no
     * row — a page that drew a switch there would offer a write that cannot land. `on` is the first switch,
     * whose text the second one's paragraph rides in.
     */
    function teamRowOf(document, ns) {
      const row = rowOf(document, ns);
      return row === undefined
        ? null
        : { ns: row.ns, revision: row.revision, on: row.value?.prompt === true, review: row.value?.review === true };
    }

    /**
     * The page fetch card's row: the shared `web` row's fetch selection. `on` is the product's own provider
     * by name, the same string the write uses; a composition that mounts no such row answers `null`, and the
     * card says it cannot be changed here rather than drawing a control with nowhere to write.
     */
    function fetchRowOf(document) {
      const row = rowOf(document, WEB_NS);
      return row === undefined
        ? null
        : { ns: row.ns, revision: row.revision, on: row.value?.fetchProvider === FETCH_ON, writable: document.writable === true };
    }

    /** The shared `web` row's live selection, or `null` when the composition addresses no such row. */
    async function readFetchRow(remote) {
      return fetchRowOf(await readDocument(remote));
    }

    /**
     * One write of one switch, with the revision the read answered. What answers is the platform's view of
     * the row after the write — the card stands on that, not on the word the press asked for; the route is
     * re-read after it for the patch's outcome, which only the next assembly can change.
     */
    async function writeSwitch(remote, row, field, on) {
      const written = await remote.settings.mutate(row.ns, [{ op: 'set', path: [field], value: on }], row.revision);
      if (!written.ok) throw new Error(written.error?.message ?? 'the settings service refused the write');
      const view = written.value;
      return {
        ns: row.ns,
        revision: view?.revision ?? row.revision,
        on: view?.value?.prompt === true,
        review: view?.value?.review === true,
      };
    }

    /**
     * One write of the shared `web` row's fetch selection. The value is explicit on both ways: a nullish one
     * resolves through the platform's fallback rules, and this profile carries more than one usable provider.
     */
    async function writeFetch(remote, row, on) {
      const written = await remote.settings.mutate(row.ns, [
        { op: 'set', path: ['fetchProvider'], value: on ? FETCH_ON : FETCH_OFF },
      ], row.revision);
      if (!written.ok) throw new Error(written.error?.message ?? 'the settings service refused the write');
      return written.value;
    }

    /**
     * The proxy's picture from its own route: the page-fetch switch, the all-traffic switch, the URL the
     * picture carries, whether a URL is configured, the reference that names it and whether this profile may
     * write the row at all. The URL is the card's field text, shown as it stands. A route that is not served
     * is a composition without the host half, and the card says so in its strip; any other refusal is a read
     * that failed.
     */
    async function readProxy() {
      const answer = await reach({ method: 'GET' }, PROXY_ROUTE, t('proxy.unreachable'));
      if (answer.status === 404) return { missing: true, value: null };
      if (!answer.ok) throw new Error(`${PROXY_ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${PROXY_ROUTE} refused the read`);
      return { missing: false, value: payload.value };
    }

    /** The URL a picture carries into the field: the stored value, or nothing while none is configured. */
    const urlOf = (picture) => (typeof picture?.url === 'string' ? picture.url : '');

    /** The one reachability check of the configured proxy: the body names the action and nothing else. */
    async function checkProxy() {
      const answer = await reach({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      }, PROXY_ROUTE, t('proxy.unreachable'));
      if (!answer.ok) throw new Error(`${PROXY_ROUTE} answered ${answer.status} ${answer.statusText}`);
      const payload = await answer.json();
      if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `${PROXY_ROUTE} refused the check`);
      return payload.value;
    }

    /**
     * One write of one proxy switch. The revision is read at the press, not carried from the card's
     * picture: the row's volatile fields are reachable from the platform's own settings too, and the picture
     * the card holds may be older than the press. The field is the caller's — one switch writes its own and
     * never the other's.
     */
    async function writeProxySwitch(remote, ns, field, on) {
      const document = await readDocument(remote);
      const row = rowOf(document, ns);
      if (row === undefined) throw new Error(`${String(ns)} is not a settings row this profile carries`);
      const written = await remote.settings.mutate(ns, [{ op: 'set', path: [field], value: on }], row.revision);
      if (!written.ok) throw new Error(written.error?.message ?? 'the settings service refused the write');
      return written.value;
    }

    /**
     * One write of the proxy URL, through the credential store's own door: the value travels one way, and
     * the picture the card reads back is what says it landed.
     */
    async function writeProxyUrl(remote, ref, value) {
      const written = await remote.credentials.set(ref, value);
      if (!written.ok) throw new Error(written.error?.message ?? 'the credential store refused the value');
    }

    /**
     * The shape a proxy URL must have, refused before the value is handed to the store.
     *
     * The card cannot import the host's own reader, and a value the check would refuse is better refused
     * here, where it never leaves the browser: the same shape — an `http` or `https` URL, a host, an explicit
     * port, no path, no query and no fragment. A value of any other scheme is refused with the same sentence,
     * because the sentence names the rule the reader has to meet.
     */
    function shapeProblemOf(text) {
      const value = String(text).trim();
      if (value === '') return t('proxy.reason');
      let url;
      try {
        url = new URL(value);
      } catch {
        return t('proxy.reason');
      }
      const protocol = url.protocol.toLowerCase();
      if (protocol !== 'http:' && protocol !== 'https:') return t('proxy.reason');
      if (url.hostname === '') return t('proxy.reason');
      /* WHATWG's `URL` drops a port equal to the scheme's default, so the raw text answers whether the
         reader named one: the shape names a port, and `https://proxy:443` names it. */
      const authority = /^[a-z][a-z0-9+.-]*:\/\/(?:[^/@]*@)?(?:\[[^\]]+\]|[^:/?#]+)(?::(\d+))?/iu.exec(value);
      const port = authority === null ? NaN : Number(authority[1]);
      if (!Number.isInteger(port) || port < 1 || port > 65_535) return t('proxy.reason');
      if (url.pathname !== '/' && url.pathname !== '') return t('proxy.reason');
      if (url.search !== '' || url.hash !== '') return t('proxy.reason');
      return null;
    }

    /**
     * The host's three verdicts as the strip's one word each. The tone is the page's, the word is the
     * section's, and the host's reason — the proxy named as `host:port` — is the console's alone.
     */
    const VERDICT_NOTES = {
      works: () => ({ tone: 'done', text: t('verdict.works') }),
      refused: () => ({ tone: 'fault', text: t('verdict.refused') }),
      unavailable: () => ({ tone: 'fault', text: t('verdict.unanswered') }),
    };

    /**
     * The answer to a press, in the card head's own strip: the page's room for exactly this word, drawn
     * always and empty while nothing is said, so a word that comes and goes moves nothing. Its tone is the
     * page's (`done` / `fault`).
     */
    /**
     * What the last settled read answered: the browser half is materialised once per application session, so a
     * section left and entered again has this beside it, and the mount paints it at once while the read
     * corrects it behind. It holds the cards' pictures — the route's, the two switches' rows and the proxy's —
     * never the visit's own state, the draft, a note, a press in flight or a read that failed — and the
     * session's first mount has nothing, which is the honest skeleton.
     */
    let lastRead = null;

    /** The state a mount starts from: the last picture when one stands, and the skeleton when none does. */
    const startState = () => (lastRead === null
      ? {
          status: 'loading', value: null, draft: '', note: null, busy: false,
          prompt: null, promptBusy: false, promptFault: false, beatFault: false, readFault: false,
          fetch: null, fetchBusy: false, fetchRead: 'loading', fetchNote: null,
          proxy: null, proxyMissing: false, proxyFault: false, proxyBusy: null, proxyNote: null,
          proxyField: '', proxyInvalid: false,
        }
      : {
          status: 'ready', value: lastRead.value, draft: draftOf(lastRead.value), note: null, busy: false,
          prompt: lastRead.prompt, promptBusy: false, promptFault: false, beatFault: false, readFault: false,
          fetch: lastRead.fetch, fetchBusy: false, fetchRead: 'loading', fetchNote: null,
          proxy: lastRead.proxy, proxyMissing: lastRead.proxyMissing, proxyFault: false, proxyBusy: null,
          proxyNote: null, proxyField: urlOf(lastRead.proxy), proxyInvalid: false,
        });

    /** The page as it stands: every card reads on its own path, and every press is read back. */
    function GeneralSection({ kit, ctx, hold, card, more }) {
      useStyles();
      /* The dot and the corner word the fetch cards draw are the kit's status surface, and its sheet is
         inserted only by the hold: a section that drew them without it would paint an unstyled span. */
      kit.useStatusStyles();
      /** The cards are modules with factories: the drawing they hand back closes over the section's words. */
      const draw = React.useMemo(() => {
        const team = card.create({ t });
        const fetchCards = more.create({ t, kit });
        return (state, act) => team.draw(state, act, fetchCards.cards(state, act));
      }, [card, more, kit]);
      const [state, setState] = React.useState(startState);

      /** The console's door is the kit's: one subject, one place, said where the answer arrived. */
      const say = React.useCallback((reason) => kit.statusDetail(t('team.title'), reason), [kit]);
      const sayFetch = React.useCallback((reason) => kit.statusDetail(t('fetch.title'), reason), [kit]);
      const sayProxy = React.useCallback((reason) => kit.statusDetail(t('proxy.title'), reason), [kit]);

      /** Which read of a card is the newest: an answer that is no longer the newest does not publish. */
      const newestRead = React.useRef({ team: 0, fetch: 0, proxy: 0 });
      const nextRead = React.useCallback((card) => {
        newestRead.current[card] += 1;
        return newestRead.current[card];
      }, []);

      /** The answer's lifetime is the page's hold, not the next render: every note — a save, a refusal and a
       * verdict — goes by itself, and a second note in the same card replaces the first without leaving a
       * timer behind. Each card owns its timer, so one card's word never takes another's. It is armed after
       * the state was set and never inside an updater. */
      const noteTimers = React.useRef({ team: null, fetch: null, proxy: null });
      const armHold = React.useCallback((which = 'team') => {
        const timer = noteTimers.current[which];
        if (timer !== null) clearTimeout(timer);
        noteTimers.current[which] = setTimeout(() => {
          noteTimers.current[which] = null;
          setState((now) => (which === 'team'
            ? { ...now, note: null }
            : which === 'fetch' ? { ...now, fetchNote: null } : { ...now, proxyNote: null }));
        }, hold.NOTE_HOLD_MS);
      }, [hold]);
      React.useEffect(() => () => {
        for (const timer of Object.values(noteTimers.current)) {
          if (timer !== null) clearTimeout(timer);
        }
      }, []);

      /** The pictures a later mount paints: a settled read, a save and a flip alike leave them standing, and
       * a failure leaves the last picture alone rather than replacing knowledge with a sentence about a
       * moment. */
      React.useEffect(() => {
        if (state.status !== 'ready') return;
        lastRead = {
          value: state.value,
          prompt: state.prompt,
          fetch: state.fetch,
          proxy: state.proxy,
          proxyMissing: state.proxyMissing,
        };
      }, [state.status, state.value, state.prompt, state.fetch, state.proxy, state.proxyMissing]);

      /** The team card's read: the route's picture, and the switch's row in the namespace it names. The
       * settings row failing is said on the console and costs only the switch: the ceiling was read, and a card
       * that failed whole there would hide a value the route carries. A route that names no namespace has no
       * row to ask for: a read there would put a fault on the card for a row the composition never carried. */
      const readTeam = React.useCallback(async () => {
        const value = await read();
        let prompt = null;
        let promptFault = false;
        const ns = value?.ns ?? null;
        if (typeof ns === 'string' && ns !== '') {
          try {
            prompt = teamRowOf(await readDocument(ctx.remote), ns);
          } catch (error) {
            promptFault = true;
            say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
          }
        }
        return { value, prompt, promptFault };
      }, [ctx, say]);

      /**
       * The page fetch card's read: the shared `web` row's live selection. It is a read of its own — a team
       * route that is down leaves this card's value standing — and its failure is this card's word. The
       * card's own status travels with the read, so the corner is never asserted over an unfinished one: an
       * unfinished or failed read is `Not read`, and the row's condition waits for a settled answer.
       */
      const readFetchNow = React.useCallback(async () => {
        const ticket = nextRead('fetch');
        try {
          const row = await readFetchRow(ctx.remote);
          if (newestRead.current.fetch === ticket) {
            setState((now) => ({ ...now, fetch: row, fetchRead: 'ready' }));
          }
          return row;
        } catch (error) {
          if (newestRead.current.fetch === ticket) {
            sayFetch(`${t('reason.unreadable')}: ${reasonOf(error)}`);
            setState((now) => ({ ...now, fetchRead: 'failed' }));
          }
          throw error;
        }
      }, [ctx, nextRead, sayFetch]);

      /**
       * The proxy card's read: its own route's picture. A route that is not served is a composition without
       * the host half — the card says `Not available` — not a read that failed. The picture's URL is the
       * field's text: a reader's edit is theirs, and an untouched field follows what the read answers.
       */
      const readProxyNow = React.useCallback(async () => {
        const ticket = nextRead('proxy');
        try {
          const answer = await readProxy();
          if (newestRead.current.proxy === ticket) {
            setState((now) => (answer.missing
              ? { ...now, proxy: null, proxyMissing: true, proxyFault: false }
              : {
                  ...now,
                  proxy: answer.value,
                  proxyMissing: false,
                  proxyFault: false,
                  proxyField: now.proxyField !== urlOf(now.proxy) ? now.proxyField : urlOf(answer.value),
                }));
          }
          return answer;
        } catch (error) {
          if (newestRead.current.proxy === ticket) {
            sayProxy(reasonOf(error));
            setState((now) => ({ ...now, proxyFault: true }));
          }
          throw error;
        }
      }, [nextRead, sayProxy]);

      React.useEffect(() => {
        let live = true;
        const teamTicket = nextRead('team');
        readTeam().then(
          (answer) => {
            if (!live || newestRead.current.team !== teamTicket) return;
            setState((now) => ({
              ...now,
              status: 'ready',
              readFault: false,
              value: answer.value,
              /* The mount's read keeps the guard the reread and the beat keep: a draft the reader has changed
                 is theirs; an unedited one follows the read. The controls stand live while this read runs, so
                 a value typed into the field before the answer lands must not be replaced by it. */
              draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(answer.value),
              prompt: answer.prompt,
              promptFault: answer.promptFault,
            }));
          },
          (error) => {
            if (!live || newestRead.current.team !== teamTicket) return;
            /* The team card's failure is its own strip's word: the card stands with the rows it drew. */
            say(reasonOf(error));
            setState((now) => ({
              ...now,
              status: now.status === 'ready' ? 'ready' : 'failed',
              readFault: true,
            }));
          },
        );
        return () => {
          live = false;
        };
      }, [nextRead, readTeam, say]);

      /* The platform's announcement that the settings document moved — a hand's edit of the profile's
         patch, or another page's write — is the same event for the switch: the route and the switch are read
         again, so the face follows the rows rather than the moment the section mounted. */
      React.useEffect(() => {
        let live = true;
        const reread = () => {
          const teamTicket = nextRead('team');
          readTeam().then(
            (answer) => {
              if (!live || newestRead.current.team !== teamTicket) return;
              setState((now) => ({
                ...now,
                /* A first read that failed is not the card's sentence forever: a later answer takes the card
                   back to standing. */
                status: 'ready',
                readFault: false,
                promptFault: answer.promptFault,
                value: answer.value,
                /* A settings half that could not be read keeps the view the card already holds. */
                prompt: answer.prompt ?? now.prompt,
                /* A draft the reader has changed is theirs; an unedited one follows the read. */
                draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(answer.value),
              }));
            },
            (error) => {
              if (!live || newestRead.current.team !== teamTicket) return;
              say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
              setState((now) => ({ ...now, readFault: true }));
            },
          );
        };
        const disposers = WATCHED.map((name) => ctx.remote.$on(name, reread));
        const offReset = ctx.on('connection/reset', reread);
        return () => {
          live = false;
          for (const dispose of disposers) dispose();
          offReset();
        };
      }, [ctx, nextRead, readTeam, say]);

      /* The two fetch cards ask their own doors when the section mounts: a failure lands on its own card,
         and the console keeps the reason the strip's word cannot carry. */
      React.useEffect(() => {
        void readFetchNow().catch(() => {});
        void readProxyNow().catch(() => {});
      }, [readFetchNow, readProxyNow]);

      /* The settings document's move is both fetch cards' news — the platform's own page writes the shared
         selection, and the proxy's switch is a settings row too — while the credential store's announcements
         change only whether a URL is configured. A route that is not served answers the same as a picture
         every time, so the read is repeated with the rest. */
      React.useEffect(() => {
        const reread = () => {
          void readFetchNow().catch(() => {});
          void readProxyNow().catch(() => {});
        };
        const rereadProxy = () => {
          void readProxyNow().catch(() => {});
        };
        const disposers = [
          ctx.remote.$on('settings/document-updated', reread),
          ...WATCHED_CREDENTIALS.map((name) => ctx.remote.$on(name, rereadProxy)),
        ];
        const offReset = ctx.on('connection/reset', reread);
        return () => {
          for (const dispose of disposers) dispose();
          offReset();
        };
      }, [ctx, readFetchNow, readProxyNow]);

      /* The patch's outcome changes at the next team assembly, and no client announcement follows it: while
         the switch is on, the route is asked on the page's own beat, so "the patch is inactive" appears with
         the step that left it rather than on the next unrelated event. The same beat asks while a failed read
         stands: a card left on what it last read must not keep a failure silent, and a card whose switch row
         was never read is asked whole — the route and the switch together — so it recovers with the rows it
         drew instead of standing half-read. A hidden tab is not asked, and a failed ask says so on the card
         instead of freezing the picture. */
      const promptOn = state.prompt?.on === true;
      const beatOn = promptOn || state.readFault === true;
      /** The switch's row was never read: the beat then re-asks the team card whole. */
      const wholeCard = state.prompt === null;
      React.useEffect(() => {
        if (!beatOn) return undefined;
        let live = true;
        const timer = setInterval(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          const ask = wholeCard ? readTeam() : read();
          ask.then(
            (answer) => {
              if (!live) return;
              setState((now) => (wholeCard
                ? {
                    ...now,
                    status: 'ready',
                    value: answer.value,
                    prompt: answer.prompt,
                    promptFault: answer.promptFault,
                    beatFault: false,
                    readFault: false,
                    draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(answer.value),
                  }
                : {
                    ...now,
                    value: answer,
                    beatFault: false,
                    readFault: false,
                    status: 'ready',
                    draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(answer),
                  }));
            },
            (error) => {
              if (!live) return;
              say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
              setState((now) => ({ ...now, beatFault: true, readFault: true }));
            },
          );
        }, hold.BEAT_MS);
        return () => {
          live = false;
          clearInterval(timer);
        };
      }, [beatOn, wholeCard, hold, say, readTeam]);

      /* One write of one switch: both switches live in the same row, and what answers is the platform's view
         of it after the write. The route is read after it for the patch's outcome, which the write does not
         change; a route that cannot be read is said on the console and costs nothing — the row did move, and
         the strip says so. */
      const flip = (field, on) => {
        const row = state.prompt;
        if (row === null) return;
        setState((now) => ({ ...now, promptBusy: true, note: null }));
        writeSwitch(ctx.remote, row, field, on).then(
          (view) => {
            setState((now) => ({
              ...now,
              promptBusy: false,
              prompt: view,
              note: { tone: 'done', text: t('state.saved'), subject: field },
            }));
            armHold();
            const ticket = nextRead('team');
            void readTeam().then(
              ({ value, prompt, promptFault }) => {
                if (newestRead.current.team !== ticket) return;
                setState((now) => ({
                  ...now,
                  value,
                  readFault: false,
                  prompt: prompt ?? now.prompt,
                  promptFault,
                  draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(value),
                }));
              },
              (error) => {
                if (newestRead.current.team !== ticket) return;
                say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
                setState((now) => ({ ...now, readFault: true }));
              },
            );
          },
          (error) => {
            const reason = reasonOf(error);
            say(reason);
            setState((now) => ({
              ...now,
              promptBusy: false,
              note: { tone: 'fault', text: t('state.refused'), subject: field },
            }));
            armHold();
            void readDocument(ctx.remote).then(
              (document) => setState((now) => ({ ...now, prompt: teamRowOf(document, row.ns), promptFault: false })),
              (error) => {
                say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
                setState((now) => ({ ...now, promptFault: true }));
              },
            );
          },
        );
      };

      /**
       * The page fetch switch: the shared row's selection, written explicitly on both ways and read back
       * after the write. The box reports the row, never the press; a failed write leaves the box at the
       * platform's value and says `Not saved`, and the reason is the console's.
       */
      const setFetch = async (on) => {
        const row = state.fetch;
        if (row === null) return;
        setState((now) => ({ ...now, fetchBusy: true, fetchNote: null }));
        let wrote = false;
        try {
          await writeFetch(ctx.remote, row, on);
          wrote = true;
        } catch (error) {
          sayFetch(reasonOf(error));
        }
        setState((now) => ({
          ...now,
          fetchNote: wrote
            ? { tone: 'done', text: t('state.saved') }
            : { tone: 'fault', text: t('state.refused') },
        }));
        armHold('fetch');
        try {
          await readFetchNow();
        } catch (error) {
          /* The read's own failure is the card's `Not read`; the write's word keeps its hold. */
        }
        setState((now) => ({ ...now, fetchBusy: false }));
      };

      /**
       * One proxy switch's press: only its own row field is written, so the two switches are stored
       * independently and neither can rewrite, disable or reset the other. A failed write leaves the switch
       * at the platform's value; the word is `Not saved` and the reason is the console's.
       *
       * The name is its own, deliberately: the module-level `writeSwitch` is the team path's write, and a
       * shadowing name here made a team press run the proxy write with the remote as its field.
       */
      const pressProxySwitch = async (field, on) => {
        const picture = state.proxy;
        if (picture === null || picture.editable !== true) return;
        setState((now) => ({ ...now, proxyBusy: 'switch', proxyNote: null }));
        let wrote = false;
        try {
          await writeProxySwitch(ctx.remote, picture.ns, field, on);
          wrote = true;
        } catch (error) {
          sayProxy(reasonOf(error));
        }
        setState((now) => ({
          ...now,
          proxyNote: wrote
            ? { tone: 'done', text: t('state.saved') }
            : { tone: 'fault', text: t('state.refused') },
        }));
        armHold('proxy');
        try {
          await readProxyNow();
        } catch (error) {
          /* The card says `Not read`; the write's word keeps its hold. */
        }
        setState((now) => ({ ...now, proxyBusy: null }));
      };

      /**
       * One check of the configured URL: the verdict stands in the card's strip for the page's hold, and the
       * host's reason goes to the console. The check writes nothing, so the dot and the switches keep the
       * values they were read with.
       */
      const runCheck = async () => {
        setState((now) => ({ ...now, proxyBusy: 'check', proxyNote: null }));
        try {
          const verdict = await checkProxy();
          const known = typeof verdict?.verdict === 'string' && Object.hasOwn(VERDICT_NOTES, verdict.verdict)
            ? verdict.verdict
            : null;
          if (known === null) {
            sayProxy(t('proxy.noVerdict'));
            setState((now) => ({ ...now, proxyNote: { tone: 'fault', text: t('verdict.unanswered') } }));
          } else {
            if (typeof verdict.reason === 'string' && verdict.reason !== '') sayProxy(verdict.reason);
            setState((now) => ({ ...now, proxyNote: VERDICT_NOTES[known]() }));
          }
        } catch (error) {
          /* The check settled nothing: the card's third word stands, and the route's own sentence is the
             console's. */
          sayProxy(reasonOf(error));
          setState((now) => ({ ...now, proxyNote: { tone: 'fault', text: t('verdict.unanswered') } }));
        }
        armHold('proxy');
        setState((now) => ({ ...now, proxyBusy: null }));
      };

      /**
       * Save proxy: the shape is refused before anything leaves the browser, the value is written through
       * the store, and the picture read back is what confirms it — a confirmed write leaves the field on the
       * value just stored. The write that landed runs the check in the same press, and the strip reports the
       * check's verdict rather than the store's word: a configured URL and a working proxy are two facts.
       */
      const saveProxyUrl = async () => {
        const picture = state.proxy;
        const value = state.proxyField.trim();
        if (picture === null || value === '') return;
        const problem = shapeProblemOf(value);
        if (problem !== null) {
          sayProxy(problem);
          setState((now) => ({ ...now, proxyInvalid: true, proxyNote: { tone: 'fault', text: t('state.refused') } }));
          armHold('proxy');
          return;
        }
        setState((now) => ({ ...now, proxyBusy: 'save', proxyNote: null, proxyInvalid: false }));
        try {
          await writeProxyUrl(ctx.remote, picture.proxyRef, value);
        } catch (error) {
          sayProxy(reasonOf(error));
          setState((now) => ({ ...now, proxyBusy: null, proxyNote: { tone: 'fault', text: t('state.refused') } }));
          armHold('proxy');
          return;
        }
        /* The store's call is not the value's confirmation: the picture read back says whether a URL is
           configured and which one, so the field takes its text from the re-read and never from the call's
           own word. */
        let after;
        try {
          after = await readProxyNow();
        } catch (error) {
          setState((now) => ({ ...now, proxyBusy: null }));
          return;
        }
        if (after.missing || after.value?.configured !== true) {
          sayProxy(t('proxy.notConfigured'));
          setState((now) => ({ ...now, proxyBusy: null, proxyNote: { tone: 'fault', text: t('state.refused') } }));
          armHold('proxy');
          return;
        }
        setState((now) => ({ ...now, proxyField: urlOf(after.value), proxyInvalid: false }));
        await runCheck();
      };

      const act = {
        draft: (text) => setState((now) => ({ ...now, draft: text, note: null, })),
        save: () => {
          /* The card refuses a value the row's schema would refuse, before anything is sent: the acceptance
             is the card's own, and the route's refusal stays for a hand that writes the route directly. */
          const value = Number(state.draft);
          if (!Number.isSafeInteger(value) || value < 1) {
            say(t('reason.invalid'));
            setState((now) => ({
              ...now,
              note: { tone: 'fault', text: t('state.refused'), subject: 'ceiling' },
            }));
            armHold();
            return;
          }
          setState((now) => ({ ...now, busy: true, note: null }));
          write(value).then(
            (picture) => {
              setState((now) => ({
                ...now,
                busy: false,
                value: picture,
                draft: draftOf(picture),
                note: { tone: 'done', text: t('state.saved'), subject: 'ceiling' },
              }));
              armHold();
            },
            (error) => {
              /* The platform's words stand in the console: the word alone would leave the reader without the
                 cause, as an overridden row proved. */
              const reason = reasonOf(error);
              say(reason);
              setState((now) => ({
                ...now,
                busy: false,
                note: { tone: 'fault', text: t('state.refused'), subject: 'ceiling' },
              }));
              armHold();
              const ticket = nextRead('team');
              void readTeam().then(
                ({ value: picture, prompt, promptFault }) => {
                  if (newestRead.current.team !== ticket) return;
                  setState((now) => ({
                    ...now,
                    value: picture,
                    readFault: false,
                    prompt: prompt ?? now.prompt,
                    promptFault,
                    draft: now.draft !== draftOf(now.value) ? now.draft : draftOf(picture),
                  }));
                },
                (error) => {
                  if (newestRead.current.team !== ticket) return;
                  say(`${t('reason.unreadable')}: ${reasonOf(error)}`);
                  setState((now) => ({ ...now, readFault: true }));
                },
              );
            },
          );
        },
        prompt: (on) => flip('prompt', on),
        review: (on) => flip('review', on),
        fetch: (on) => void setFetch(on),
        proxy: (on) => void pressProxySwitch('enabled', on),
        proxyAll: (on) => {
          /* The switch waits for the URL: no write to on while none is configured, as the Check press
             already waits for its own door. Turning it off is always allowed. */
          if (on === true && state.proxy?.configured !== true) return;
          void pressProxySwitch('allTraffic', on);
        },
        /* A draft is the reader's: typing drops the press's word and the field's invalid mark, and nothing
           in the card writes the value until the save is pressed. */
        proxyField: (text) => setState((now) => ({ ...now, proxyField: text, proxyInvalid: false, proxyNote: null })),
        saveProxy: () => void saveProxyUrl(),
        checkProxy: () => {
          if (state.proxy?.configured !== true) return;
          void runCheck();
        },
      };
      return draw(state, act);
    }

    /** The kit's console door, pulled before the section stands: a reason the face may not carry leaves by it. */
    const KIT = require.async('./client.kit.js');
    /** The page's shared lifetime of a temporary answer. */
    const HOLD = require.async('./client.hold.js');
    /** The team card's own drawing. */
    const CARD = require.async('./client.general.card.js');
    /** The two fetch cards' own drawing. */
    const CARDS = require.async('./client.general.fetch.js');

    return {
      /** Register the page into the seat the entry declares. */
      apply(pluginCtx) {
        t = pluginCtx.locale.bind(NS);
        pluginCtx.effect(() => pluginCtx.locale.register(NS, 'en', EN), `${PACKAGE}: the General dictionary`);
        /* The rail row stands before any read: the page is a place, and what it shows is the read's answer.
           It stands first — settings before facts — so the panel lands on General and the facts follow it.
           The kit and the hold are pulled first: the console door and the answer's lifetime are theirs, and a
           section that stood without them would have to invent both. A pull that failed is named on the
           console and seats nothing. */
        pluginCtx.effect(() => {
          let live = true;
          let armed = null;
          Promise.all([KIT, HOLD, CARD, CARDS]).then(
            ([kit, hold, card, more]) => {
              if (!live) return;
              armed = pluginCtx.slots.inject(SEAT, () => pluginCtx.slots.register({
                name: SEAT,
                id: ID,
                order: 0,
                label: () => t('section'),
                locale: NS,
              }, () => h(GeneralSection, { kit, hold, card, more, ctx: pluginCtx })));
            },
            (error) => {
              console.error(`${PACKAGE}: a chunk for the General section did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof armed === 'function') armed();
          };
        }, `${PACKAGE}: the kit, the hold and the General section`);
      },
    };
  },
});
