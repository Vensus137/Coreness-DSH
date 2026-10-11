/**
 * The plugin's checks in one command: `node plugins/rate-gate/check.mjs`.
 *
 * The files are imported rather than spawned, so every check runs in this process: a runner that
 * starts children with piped stdio is refused where this plugin is worked on, which is why the
 * precedent it is ported from checks itself this way ("`node --test` is unavailable in the sandbox").
 */
await import('./test/gate.test.mjs')
await import('./test/mount.test.mjs')
await import('./test/cordis.test.mjs')
