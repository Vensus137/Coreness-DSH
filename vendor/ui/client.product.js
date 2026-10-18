/**
 * The product's own section: what the composition holds of this product's bundle.
 *
 * A package-local chunk beside the entry, pulled by it with `require.async`, applied from the entry's
 * `apply`. It pulls the kit with `require.async` and registers into the page's section seat only once the
 * kit is in hand — one section, one card, and no second copy of the status surface.
 *
 * The card is read-only: the fields come from the composition's own bundle behind the management gate, and
 * the switches that enable and disable a plugin stay on the platform's own Plugins page. A failed read shows
 * the failure; nothing stands in for it.
 */
window.__ModuleLoader__.load({
  id: '@coreness/ui/client.product.js',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE = '@coreness/ui';
    /** The composition's name for this product's bundle: the final name, `@coreness/dsh`. */
    const BUNDLE = '@coreness/dsh';
    const NS = 'coreness';
    const SECTION = 'coreness.section';
    const SECTION_ID = 'product';
    const ORDER = 0;

    /** Filled by the chunk's `apply`: the entry's own context and the locale's text. */
    let ctx = null;
    let t = (key) => key;
    /** The kit, in hand before the section seats; a failed pull seats nothing. */
    let kit = null;

    /**
     * What the composition says about this product's own bundle, as the host answers.
     *
     * The inventory is asked first and its answer decides whether the bundle list may be asked at all: the
     * management gate is the platform's, not this card's. A bundle that is not in the list is `absent`, and
     * the card says so in one short phrase rather than drawing an empty card.
     */
    async function readComposition() {
      const failed = (reason) => ({ status: 'error', reason });

      const inventory = await ctx.remote.pluginInventory.list();
      if (!inventory.ok) return failed(`${inventory.error.code}: ${inventory.error.message}`);
      if (inventory.value.managementAvailable !== true) return { status: 'unavailable' };

      const bundles = await ctx.remote.pluginManager.listBundles();
      if (!bundles.ok) return failed(`${bundles.error.code}: ${bundles.error.message}`);

      const bundle = bundles.value.find((item) => item.name === BUNDLE);
      if (bundle === undefined) return { status: 'absent' };

      return {
        status: 'ready',
        name: bundle.name,
        version: bundle.version,
        description: bundle.description,
        enabled: bundle.enabled,
      };
    }

    /** The four states this card draws, in the kit's own words: `error` reads as `unread` and `absent` as
        `unset`; `unavailable` reads as `unwritable`, which names the cause rather than its symptom. */
    const STATUS_OF = { loading: 'loading', error: 'unread', absent: 'unset', unavailable: 'unwritable' };

    /** The last read picture, held across a section that is left and entered again in one session. */
    let lastRead = null;

    /** The product's own first section: the bundle the composition installed, and its one-liner. */
    function ProductSection() {
      /* The kit's sheet is a hook and must be called in render, at the top of the component: the donor calls
         `useStyles(); useStatusStyles();` the same way, and React's dispatcher outside render is ContextOnly. */
      kit.useStatusStyles();
      const [state, setState] = React.useState(lastRead === null ? { status: 'loading' } : lastRead.state);
      const [revision, setRevision] = React.useState(0);

      /* The composition goes into the session's memory as it is published, so the next mount paints the card
         at once. Only a read that answered is remembered: a skeleton is not knowledge. */
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
         announcement of it; a reset connection invalidates whatever was read before it. */
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

      /** One value of the closed map, drawn by the kit and by nothing else. */
      const statusLine = (value) => kit.statusNode({ subject: 'Profile', value });

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

      return h('div', { className: 'coreness-overview coreness-sectionBody' },
        h('div', { key: 'card', className: 'coreness-card coreness-card-body' }, [
          h('div', { key: 'title', className: 'coreness-titleRow' }, titleRow),
          h('p', { key: 'name', className: 'coreness-name' }, h('code', null, state.name)),
          state.description === undefined
            ? null
            : h('p', { key: 'desc', className: 'coreness-desc' }, state.description),
        ]));
    }

    return {
      /**
       * Seats the section after the kit arrives. The entry calls this once; the returned disposer unsets the
       * slot registration and stops the pull. The card draws with the entry's shared card classes, so this
       * chunk owns no sheet of its own — the donor has no `.coreness-overview` rule either.
       */
      apply(pluginCtx) {
        ctx = pluginCtx;
        t = ctx.locale.bind(NS);
        let live = true;
        let offSeat = null;

        const off = ctx.effect(() => {
          require.async('./client.kit.js').then(
            (loaded) => {
              if (!live) return;
              kit = loaded;
              offSeat = ctx.slots.inject(SECTION, () => ctx.slots.register({
                name: SECTION,
                id: SECTION_ID,
                order: ORDER,
                label: () => t('section.product'),
                locale: NS,
              }, ProductSection));
            },
            (error) => {
              console.error(`${PACKAGE}: the kit did not arrive: ${error?.message ?? error}`);
            },
          );
          return () => {
            live = false;
            if (typeof offSeat === 'function') offSeat();
          };
        }, `${PACKAGE}: section ${SECTION_ID}`);

        return off;
      },
    };
  },
});
