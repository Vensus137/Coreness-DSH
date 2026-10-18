# @coreness/dsh

The bundle for one DeepSeek Harness profile: it inserts the product's page and the host packages behind its
sections. It carries the page, the journal, the rules, MCP (with its servers file), OAuth, the Qoder route and
the rate gate: `@coreness/dsh` 0.5.1, the local install.

## What the patch inserts

```yaml
- insert:
    - id: coreness-ui
      name: '@coreness/ui'
    - id: coreness-journal
      name: '@coreness/journal'
      config:
        rotationDays: 30
        rotationBytes: 2097152
        recordsLimit: 20
    - id: coreness-rules
      name: '@coreness/rules'
    - id: coreness-mcp
      name: '@coreness/mcp'
    - id: mcp-servers
      name: cordis:include
      config:
        path: ./mcp-servers.yml
        initial: []
    - id: coreness-oauth
      name: '@coreness/oauth'
    - id: coreness-qoder
      name: '@coreness/qoder'
      config:
        apiKeyEnv: QODER_PERSONAL_ACCESS_TOKEN
        firstByteCeilingMs: 60000
        retryPolicy:
          mode: normal
          maxRetries: 5
          retryableCodes: [EMPTY_RESPONSE, RATE_LIMIT, SERVER, TIMEOUT, TRANSPORT, MALFORMED_RESPONSE]
          backoff: { initialDelayMs: 500, maxDelayMs: 10000, jitterRatio: 0.1 }
        credits:
          sweepMs: 600000
          autoClaim: true
    - id: coreness-rate-gate
      name: '@coreness/rate-gate'
      config:
        windowMs: 60000
        maxWaitMs: 60000
        thresholdRatio: 0.9
        dryRun: false
```

The rows' packages are `file:` dependencies inside this repository (`"@coreness/ui": "file:../ui"`,
`"@coreness/journal": "file:../journal"`, `"@coreness/rules": "file:../rules"`, `"@coreness/mcp":
"file:../mcp"`, `"@coreness/oauth": "file:../oauth"`, `"@coreness/qoder": "file:../qoder"`, `"@coreness/rate-gate": "file:../rate-gate"`), so the install
resolves them from the local tree; a tarball of this package alone would not carry its siblings. The rules row
carries no config: the order is the module's own default. The `mcp-servers` row is the platform's own
`cordis:include`, the one writer of the profile's `mcp-servers.yml`. The Qoder row's models are the schema
default and are not restated here; its token is the platform credential under `QODER_PERSONAL_ACCESS_TOKEN`,
never a value in this file.

## Install

Into a scratch home under `tmp/` with the `web` template:

```powershell
$env:DSH_HOME = 'E:\Projects\Coreness-DSH-dev\tmp\install\<stamp>\home'
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile web add file:E:/Projects/Coreness-DSH-dev/packages/bundle
```

A profile takes this bundle by a `file:` dependency. The earlier 0.4.4 install used a `link:` to the
donor tree; its warning — peers do not resolve from the target's `node_modules` — applies to that
form. The 0.4.4 code is not part of this tree.

The `file:` spec uses forward slashes: pnpm records `file:E:/...` in the profile's manifest, and backslashes in
that URL are not the measured form. The platform's `plugin add` creates the profile from the `web` template
itself. The repository's `scripts/install-scratch.mjs` does this in one command and reads the manifest back;
`scripts/probe-client.mjs` boots the profile, reads the launch token and the boot graph, and checks the served
entry and chunks.

## What it does not do

No npm registry resolution of the `file:` siblings: the public repository receives the assembled tree
(the bundle at the root, the seven packages under `vendor/`), released by tag. No live profile. The display
resources (`locale/en.json`, `icon.svg`) are for the plugin manager's list.
