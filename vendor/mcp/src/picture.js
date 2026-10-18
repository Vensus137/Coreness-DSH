/**
 * The picture of the servers file: the rows as they stand, what each one is, and which tools the
 * tools service currently carries under its prefix.
 *
 * The picture is assembled from sources that are each owned elsewhere: the rows come from the
 * servers file through the Loader's own tree, the fiber phase and the platform's `readOnlyReason`
 * come from the plugin manager's inventory, the tools come from the tools service — whose
 * schemas carry no owner, so a tool is attributed to a server by the `mcp__<serverName>__` prefix
 * the platform's own client builds — and the words about a server that cannot connect come
 * from the host's own logger, taken where the platform writes them. A tool of a server
 * this file does not declare — an ACP session's server, for instance — is therefore invisible here,
 * which is the truth: that server lives in its session and not in this profile's file.
 *
 * @module @coreness/mcp/src/picture
 */

import { MCP_MODULE, keptOf, kindOf, pairsOf, publicPrefix, rawToolName, refsOf, serverNameOf } from './row.js'
import { isTrouble, named } from './trouble.js'

/**
 * The server name of a row: the config's own, or the one the row's id spells.
 * @param {object} row the row as the tree holds it
 * @returns {string | null} the name, when the row carries one
 */
function serverOf(row) {
  const config = row.config ?? {}
  return typeof config.serverName === 'string' ? config.serverName : serverNameOf(row.id) || null
}

/**
 * Build the picture.
 * @param {object} input what the host half gathered
 * @param {object | null} input.include the include row (`entryId`, the path it mounts, its enablement)
 * @param {object[]} input.rows the rows of the file, as the tree holds them
 * @param {object[]} input.inventory the plugin manager's rows, joined by address
 * @param {object[]} input.schemas the tools service's schemas
 * @param {string | null} input.unable why the file could not be read at all, when it could not
 * @param {object | null} input.trouble the host's own lines about the servers, as they were kept
 * @returns {object} the picture
 */
export function pictureOf({ include = null, rows = [], inventory = [], schemas = [], unable = null, trouble = null } = {}) {
  const file = {
    entryId: include?.entryId ?? null,
    path: include?.path ?? null,
    enabled: include?.enabled ?? null,
    phase: include?.phase ?? null,
  }

  if (unable !== null) {
    return { file, state: 'failed', reason: unable, rows: [] }
  }
  if (include === null) {
    return {
      file,
      state: 'no-file',
      reason: 'this composition declares no row for the servers file, so there is nothing to manage here',
      rows: [],
    }
  }
  /* The row that mounts the file is declared and did not mount. The tree then holds no row of it, and
     an empty roster would read as "this profile declares no server" — a claim nobody can make here:
     the harness reports the entry itself as failed. */
  if (file.phase === 'failed') {
    return {
      file,
      state: 'failed',
      reason: `the row that mounts ${file.path ?? 'the servers file'} (${file.entryId}) stands in the failed phase: the harness could not read the file it mounts`,
      rows: [],
    }
  }

  const byAddress = new Map(inventory.map((row) => [String(row?.entryId ?? ''), row]))
  /* The host's own lines are attributed once for the whole roster: with every declared name at hand, a
     line that starts with two of their labels goes to the longest — the one the client actually wrote. */
  const servers = rows.map((row) => serverOf(row))
  const words = trouble === null ? new Map() : named(trouble.lines(), servers)
  return {
    file,
    state: 'ready',
    reason: null,
    rows: rows.map((row, at) => rowOf(row, byAddress.get(row.entryId) ?? null, schemas, servers[at], words.get(servers[at]) ?? null)),
  }
}

/**
 * One row of the file as the section reads it.
 *
 * A row the form does not understand is still a row of this file: it is shown with its module, and
 * the form refuses to shape it rather than substituting fields it does not have.
 * @param {object} row the row as the tree holds it
 * @param {object | null} live the same row as the plugin manager reports it
 * @param {object[]} schemas the tools service's schemas
 * @param {string | null} server the server name of this row
 * @param {object | null} word the newest line of the host that names this server
 * @returns {object} the row
 */
function rowOf(row, live, schemas, server, word) {
  const config = row.config ?? {}
  const shape = row.module === MCP_MODULE
  /* What the row connects by: the platform's own transport, read from the row and never stored. */
  const transport = kindOf(config)

  return {
    entryId: row.entryId,
    id: row.id,
    module: row.module,
    shape,
    server,
    transport,
    url: typeof config.url === 'string' ? config.url : null,
    command: typeof config.command === 'string' ? config.command : null,
    args: Array.isArray(config.args) ? config.args.map((item) => String(item)) : [],
    timeout: typeof config.toolCallTimeoutMs === 'number' ? config.toolCallTimeoutMs : null,
    cwd: typeof config.cwd === 'string' ? config.cwd : null,
    /* The one sentence the form draws for `failOnStartupError`: a row that failed to come up is
       otherwise indistinguishable from a server that has no tools. */
    loud: config.failOnStartupError === true,
    env: pairsOf(config, 'env'),
    headers: pairsOf(config, 'headers'),
    /* What the form carries without drawing: the names travel, so the user is told the row holds more
       than the form shows; the values stay in the file. A key of the branch a save would leave stands
       here too, which is how the editor names what a save will drop before it drops it. */
    kept: keptOf(config),
    /* The fields of the row that stand as expressions: the form draws then and does not shape them. */
    refs: refsOf(config),
    enabled: row.disabled !== true,
    disabledRef: row.disabledRef === true,
    phase: live?.fiberPhase ?? null,
    readOnlyReason: live?.readOnlyReason ?? null,
    tools: shape && server !== null
      ? schemas
        .filter((schema) => String(schema?.name ?? '').startsWith(publicPrefix(server)))
        .map((schema) => ({ name: String(schema.name), label: rawToolName(schema.name, server) }))
      : [],
    /* The host's own last word about this server, when it was a warning or an error — the reason a row
       looks like a row with no tools, in the platform's own words rather than a guess of ours. The
       newest word decides: a server that came back has the client's own "reconnected" line newest, and
       a row that is switched off carries no word at all — its client is unmounted, so the line would be
       about a connection that no longer exists, and the row's own state says it is off. */
    trouble: shape && server !== null && row.disabled !== true && isTrouble(word) ? word : null,
  }
}
