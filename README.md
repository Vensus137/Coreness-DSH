# @coreness/dsh

The bundle for one DeepSeek Harness profile: it inserts the product's page and the host packages behind its
sections. It carries the page, the journal, the rules, MCP (with its servers file), OAuth, the Qoder route and
the rate gate: `@coreness/dsh` 0.5.3, the local install.

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

The rows' packages are `file:` dependencies of this bundle. The public tree keeps them under `vendor/`
and rewrites the dependencies to the vendored copies, so the install resolves inside the clone; the
development tree binds them to the sibling packages. The rules row carries no config: the order is the
module's own default. The `mcp-servers` row is the platform's own `cordis:include`, the one writer of
the profile's `mcp-servers.yml`. The Qoder row's models are the schema default and are not restated
here; its token is the platform credential under `QODER_PERSONAL_ACCESS_TOKEN`, never a value in this
file.

## Install

Install the latest release into a profile:

```powershell
dsh plugin --profile <profile> add github:Vensus137/Coreness-DSH
```

The public repository carries the assembled tree: the bundle at the root, the seven packages under
`vendor/`, and their `file:` dependencies rewritten to the vendored copies, so the install resolves
inside the clone. The platform's `plugin add` creates the profile from the `web` template itself.

## What it does not do

No npm registry resolution of the `file:` siblings: the public repository receives the assembled tree
(the bundle at the root, the seven packages under `vendor/`), released by tag. No live profile. The display
resources (`locale/en.json`, `icon.svg`) are for the plugin manager's list.
