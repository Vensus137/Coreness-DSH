/**
 * The vocabulary of one MCP row: its id in the servers file, the fields the form owns, and the
 * config that a save writes back.
 *
 * The rules here are the platform's own, read from `@deepseek-ai/dsh-mcp-client`'s config schema:
 * `serverName` matches `/^[A-Za-z0-9_-]{1,32}$/` and names the tools of that server; `transport` is
 * `stdio` or `streamable-http` and decides which branch of the config is meaningful; the two
 * branches do not mix. What the form knows is exactly what the user manages; everything else a row
 * carries is kept as it stands and never rewritten by a value the form does not understand.
 *
 * One kind stands above the platform's two: a **corporate** server is reached through the internal
 * platform's own CLI, which the harness starts as a local process and speaks MCP with over stdio.
 * The form asks for it by name and the file holds the platform's own `stdio` branch — the bridge's
 * command, its subcommand and the address — so the platform's schema is never extended and nothing
 * of the credential passes through here (`KINDS`, `isCorporate`, `kindOf`).
 *
 * @module @coreness/dsh/plugins/mcp/row
 */

/** The module a row of the servers file names: one row — one connection. */
export const MCP_MODULE = '@deepseek-ai/dsh-mcp-client'

/** The row id of a server, derived from its name so the id has one owner. */
export const ROW_PREFIX = 'mcp-'

/** The platform's own rule for `serverName`, and for the row id derived from it. */
export const NAME = /^[A-Za-z0-9_-]{1,32}$/

/** The transports the platform accepts, in the order the form offers them. */
export const TRANSPORTS = ['streamable-http', 'stdio']

/**
 * What a save may ask for: the platform's two transports and the corporate kind.
 *
 * `corporate` never reaches the file. A corporate server is reached through the internal platform's
 * own CLI, which the harness starts as a local process and speaks MCP with over stdio, so the row
 * that stands in the file is the platform's own `stdio` branch: `TRANSPORTS` is what a row may hold
 * and the kinds are what the form may ask for. The translation is total and lives here.
 */
export const KINDS = [...TRANSPORTS, 'corporate']

/** The bridge of the corporate kind: the internal platform's own CLI. */
export const BRIDGE = 'dp'

/**
 * The bridge's own subcommand: a remote MCP server proxied over stdio, with the platform's access
 * added by the bridge itself. The harness passes the address and holds nothing of the credential.
 */
export const BRIDGE_ARGS = ['ai', 'mcp', 'remote', '--url']

/**
 * The name of a header: the HTTP token charset, so a legal header of an unusual spelling is not
 * refused by a rule narrower than the wire's own.
 */
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,64}$/

/** The name of an environment variable. */
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

/** The config fields the form does not edit: they are carried, and their names are reported. */
const KEPT = ['cwd', 'reconnect', 'maxInstructionBytes', 'failOnStartupError']

/**
 * The config fields the form owns. A field of this list standing as a `!!js` expression is not the
 * form's to overwrite: the file owns such a value, and a save that replaced it with a plain one
 * would delete a decision nobody on the page can see.
 */
const OWNED = ['serverName', 'transport', 'url', 'command', 'args', 'toolCallTimeoutMs']

/**
 * The refusals of a save: the codes the route answers with and the browser half words. The two
 * halves name the same set, and a check holds them together.
 */
export const REFUSALS = [
  'bad-action',
  'bad-name',
  'name-taken',
  'no-file',
  'no-row',
  'not-an-mcp-row',
  'bad-transport',
  'bad-url',
  'bad-command',
  'bad-timeout',
  'bad-header',
  'bad-env',
  'bad-value',
  'header-ref',
  'env-ref',
  'config-ref',
  'disabled-ref',
  'not-saved',
  'write-failed',
  'unreadable',
]

/**
 * The row id of a server.
 * @param {string} serverName the server's name
 * @returns {string} the row id
 */
export function rowId(serverName) {
  return `${ROW_PREFIX}${serverName}`
}

/**
 * The server name a row id spells, or an empty string when the id is not one of ours.
 * @param {string} id the row id
 * @returns {string} the server name
 */
export function serverNameOf(id) {
  const text = String(id ?? '')
  return text.startsWith(ROW_PREFIX) ? text.slice(ROW_PREFIX.length) : ''
}

/**
 * An address this form accepts: one http or https URL, trimmed — or null.
 *
 * One predicate for both directions of the corporate kind: what a save writes is what the picture
 * must read back as corporate, and two rules would drift apart into a row that saves and then reads
 * as a plain stdio row.
 * @param {unknown} value the address as typed
 * @returns {string | null} the address, when it parses
 */
export function parseAddress(value) {
  const text = String(value ?? '').trim()
  if (text === '') return null
  let parsed
  try {
    parsed = new URL(text)
  } catch {
    return null
  }
  return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? text : null
}

/**
 * Whether a command is the bridge's own: `dp`, or a path to it.
 *
 * `dp` is looked up in the child's `PATH` — the platform scrubs the environment it hands a row but
 * keeps `PATH` — and the machine where the CLI is not on it pins the executable, which is the same
 * program under its own name: `dp`, or `dp.exe`. A script of one's own under another name is not the
 * bridge and never reads as one; neither is a shell shim, and that is measured rather than assumed —
 * the platform's own client spawns a row without a shell, and Node refuses a `.cmd`/`.bat` there with
 * `EINVAL`, so such a row could never be raised at all.
 * @param {unknown} command the row's command
 * @returns {boolean} whether it is the bridge
 */
export function isBridge(command) {
  const text = String(command ?? '').trim()
  if (text === '') return false
  const file = text.split(/[\\/]/).pop() ?? ''
  return /^dp(\.exe)?$/i.test(file)
}

/**
 * The address a corporate row carries, or null when the row's arguments are not the bridge's own.
 * @param {object} config the row's config
 * @returns {string | null} the address
 */
export function addressOf(config) {
  const args = config?.args
  if (!Array.isArray(args) || args.length !== BRIDGE_ARGS.length + 1) return null
  for (const [at, word] of BRIDGE_ARGS.entries()) {
    if (String(args[at]) !== word) return null
  }
  return parseAddress(args[BRIDGE_ARGS.length])
}

/** Whether a config map carries anything at all. */
function carries(map) {
  return map !== null && typeof map === 'object' && !Array.isArray(map) && Object.keys(map).length > 0
}

/**
 * Whether a row is corporate — exactly the bridge's own expansion and nothing of another branch.
 *
 * The reading is total and has no mercy by design: a row that differs in any way — another command,
 * an extra `--header`, a missing loud startup, an environment, a working directory — is a plain stdio
 * row, drawn and edited as one. A near-miss claimed as corporate would hide the very field the user
 * put there, and the form would then rewrite it away on the next save.
 * @param {object} config the row's config
 * @returns {boolean} whether the row is corporate
 */
export function isCorporate(config) {
  if (config?.transport !== 'stdio') return false
  if (config?.failOnStartupError !== true) return false
  if (!isBridge(config?.command)) return false
  if (addressOf(config) === null) return false
  if (carries(config?.env) || carries(config?.headers)) return false
  return config?.cwd === undefined
}

/**
 * The kind a row connects by, as the form and the picture read it.
 * @param {object} config the row's config
 * @returns {string | null} the platform's own transport, `corporate`, or null when the row names none
 */
export function kindOf(config) {
  const transport = config?.transport
  if (typeof transport !== 'string') return null
  return transport === 'stdio' && isCorporate(config) ? 'corporate' : transport
}

/**
 * Whether a value is a serialized Loader expression (`!!js`) rather than a plain value.
 * @param {unknown} value the value as it stands in the config
 * @returns {boolean} whether it is an expression node
 */
export function isRef(value) {
  return value instanceof Object && '__jsExpr' in value
}

/**
 * The arguments of a command: one per line, as the user writes them.
 * @param {string} text the textarea's text
 * @returns {string[]} the arguments
 */
export function parseArgs(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

/**
 * The text a stored value stands as in the row's own file.
 *
 * An expression keeps the file's own spelling of itself — `!!js <expr>`, the entry-list YAML dialect
 * `cordis-plugin-include` reads and writes — so what a reader hands on is what the file holds.
 * @param {unknown} value the value as it stands in the config
 * @returns {string} the file's own text; `''` when the file carries none
 */
function fileTextOf(value) {
  if (value === null || value === undefined) return ''
  if (isRef(value)) return `!!js ${String(value.__jsExpr)}`
  return String(value)
}

/**
 * The pairs of a config map (`headers`, `env`) as the browser half reads them: each name with the text
 * the row's own file holds under it.
 *
 * A literal travels as the literal and an expression as the file spells it: the value is what stands
 * in the file, and nothing here decides that a name makes a value unfit for a screen.
 * @param {object} config the row's config
 * @param {'headers' | 'env'} key which map
 * @returns {object[]} the pairs
 */
export function pairsOf(config, key) {
  const map = config?.[key]
  if (map === null || typeof map !== 'object' || Array.isArray(map)) return []
  return Object.entries(map).map(([name, value]) => ({ name, value: fileTextOf(value) }))
}

/**
 * The names of the config fields a row carries and the form does not edit.
 * @param {object} config the row's config
 * @returns {string[]} the names
 */
export function keptOf(config) {
  return KEPT.filter((name) => config?.[name] !== undefined)
}

/**
 * The fields of the row the form owns that stand as expressions instead of values.
 *
 * The page draws this list: a row whose transport is a `!!js` expression is not a row the form may
 * shape, and saying so before a save is cheaper than a refused save.
 * @param {object} config the row's config
 * @returns {string[]} the field names
 */
export function refsOf(config) {
  return OWNED.filter((name) => isRef(config?.[name]))
}

/**
 * Fetch a form's pair rows that carry something, refusing a name the wire would not accept.
 * @param {object[]} rows the form's rows
 * @param {'headers' | 'env'} key which map
 * @returns {{ pairs?: object[], error?: string }} the named rows, or the refusal
 */
function formPairs(rows, key) {
  const named = []
  for (const row of rows ?? []) {
    const name = String(row?.name ?? '').trim()
    const value = String(row?.value ?? '')
    /* A blank row is the editor's own empty space, not a header without a name. */
    if (name === '' && value === '') continue
    if (name === '') return { error: key === 'env' ? 'bad-env' : 'bad-header' }
    if (key === 'env' ? !ENV_NAME.test(name) : !HEADER_NAME.test(name)) return { error: key === 'env' ? 'bad-env' : 'bad-header' }
    /* The value travels in one request header or one environment variable: a line break would
       silently cut it in two. */
    if (/[\r\n]/.test(value)) return { error: 'bad-value' }
    /* Spaces alone are not an empty field: an empty field keeps the stored value, and a value that
       is only whitespace would be stored as such — where the wire reads it as one with a typo. */
    if (value !== '' && value.trim() === '') return { error: 'bad-value' }
    named.push({ name, value })
  }
  return { pairs: named }
}

/**
 * Build the config a save writes, from the form and from the row as it stands.
 *
 * The row as it stands is the source of everything the form does not own: a field the form never
 * shows is carried unchanged, and a value that is an expression is kept rather than replaced — a
 * value the form does not understand must not be overwritten by one it does.
 * @param {object} form the form's fields
 * @param {object} current the row's config as it stands
 * @returns {{ config?: object, error?: string, detail?: string }} the config to store, or the refusal
 *          with the words that name what it refused
 */
export function buildConfig(form, current = {}) {
  const server = String(form?.serverName ?? '').trim()
  if (!NAME.test(server)) return { error: 'bad-name' }

  const kind = String(form?.transport ?? '')
  if (!KINDS.includes(kind)) return { error: 'bad-transport' }
  if (kind === 'corporate') return corporateConfig(form, current, server)

  const transport = kind
  const config = { ...current, serverName: server, transport }

  if (transport === 'streamable-http') {
    delete config.command
    delete config.args
    delete config.cwd
    delete config.env

    const url = String(form?.url ?? '').trim()
    let parsed
    try {
      parsed = new URL(url)
    } catch {
      return { error: 'bad-url' }
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { error: 'bad-url' }
    config.url = url

    const built = mergePairs(form?.headers, current?.headers, 'headers')
    if (built.error !== undefined) return { error: built.error }
    if (Object.keys(built.map).length > 0) config.headers = built.map
    else delete config.headers
  } else {
    delete config.url
    delete config.headers

    const command = String(form?.command ?? '').trim()
    if (command === '') return { error: 'bad-command' }
    config.command = command

    const args = parseArgs(form?.args)
    if (args.length > 0) config.args = args
    else delete config.args

    const built = mergePairs(form?.env, current?.env, 'env')
    if (built.error !== undefined) return { error: built.error }
    if (Object.keys(built.map).length > 0) config.env = built.map
    else delete config.env
  }

  return withTimeout(config, form)
}

/**
 * The call timeout a form carries: written onto the config, or taken off it.
 * @param {object} config the config a save built
 * @param {object} form the form's fields
 * @returns {{ config?: object, error?: string }} the config, or the refusal
 */
function withTimeout(config, form) {
  const timeout = String(form?.timeout ?? '').trim()
  if (timeout === '') {
    delete config.toolCallTimeoutMs
    return { config }
  }
  const value = Number(timeout)
  if (!Number.isInteger(value) || value <= 0) return { error: 'bad-timeout' }
  config.toolCallTimeoutMs = value
  return { config }
}

/**
 * The row a corporate save writes: the platform's own stdio branch, filled with the bridge's own
 * command and subcommand and with the address the form carries.
 *
 * The fields of another branch are refused rather than dropped — the access belongs to the bridge and
 * the command is ours, so a save carrying either would be a silent substitution if it were ignored.
 * `failOnStartupError` is written explicitly: a bridge that cannot come up must say so, and in the
 * platform's own data a row that failed without it is indistinguishable from a server with no tools.
 * @param {object} form the form's fields
 * @param {object} current the row's config as it stands
 * @param {string} server the server name the form carries
 * @returns {{ config?: object, error?: string, detail?: string }} the config, or the refusal
 */
function corporateConfig(form, current, server) {
  const refused = foreignFields(form)
  if (refused !== null) return refused
  const address = parseAddress(form?.url)
  if (address === null) return { error: 'bad-url' }

  const config = {
    ...current,
    serverName: server,
    transport: 'stdio',
    command: BRIDGE,
    args: [...BRIDGE_ARGS, address],
    failOnStartupError: true,
  }
  for (const key of ['url', 'headers', 'env', 'cwd']) delete config[key]
  return withTimeout(config, form)
}

/**
 * The fields a corporate save may not carry, each with the words that name it and the reason.
 * @param {object} form the form's fields
 * @returns {{ error: string, detail: string } | null} the refusal, or null when there is none
 */
function foreignFields(form) {
  const carried = (rows) => (rows ?? []).some((row) => String(row?.name ?? '').trim() !== '' || String(row?.value ?? '') !== '')
  if (carried(form?.headers)) {
    return { error: 'bad-transport', detail: 'a corporate row carries no headers: the internal platform\'s own CLI makes the connection and carries the access, so nothing of it passes through this form' }
  }
  if (carried(form?.env)) {
    return { error: 'bad-transport', detail: 'a corporate row carries no environment: the access belongs to the internal platform\'s own CLI, and this form never holds a value of it' }
  }
  if (String(form?.command ?? '').trim() !== '' || parseArgs(form?.args).length > 0) {
    return { error: 'bad-transport', detail: `the corporate kind writes the bridge's own command and arguments (${BRIDGE} ${BRIDGE_ARGS.join(' ')}); neither is typed on this form` }
  }
  return null
}

/**
 * Merge the form's pair rows onto the stored map.
 *
 * An empty value on the form means "keep what is stored": a field left blank — a row the editor has
 * just opened, a pair the form owns no value for — never wipes what the file holds. A stored expression
 * is kept as it is when the form hands back the file's own text for it (`!!js …`), and any other text
 * over it is refused — the file owns that value.
 * @param {object[]} rows the form's rows
 * @param {object} stored the stored map
 * @param {'headers' | 'env'} key which map
 * @returns {{ map?: object, error?: string }} the merged map, or the refusal
 */
function mergePairs(rows, stored, key) {
  /* The expression's own spelling is kept: a save that lower-cased the name would rewrite a line of
     the file nobody asked it to touch. The match against the form's rows is case-insensitive,
     because header names are. */
  const expressions = new Map()
  for (const [name, value] of Object.entries(stored ?? {})) {
    if (isRef(value)) expressions.set(name.trim().toLowerCase(), { name, value })
  }

  const checked = formPairs(rows, key)
  if (checked.error !== undefined) return { error: checked.error }

  const map = {}
  for (const expression of expressions.values()) map[expression.name] = expression.value
  for (const row of checked.pairs) {
    const lower = row.name.toLowerCase()
    const expression = expressions.get(lower)
    if (expression !== undefined) {
      if (row.value !== '' && row.value !== fileTextOf(expression.value)) return { error: key === 'env' ? 'env-ref' : 'header-ref' }
      continue
    }
    /* The stored value wins over an empty field; otherwise the value is whatever was typed, an
       empty one included — `FOO=` is a legitimate environment variable. */
    const before = Object.entries(stored ?? {}).find(([name]) => name.trim().toLowerCase() === lower)
    map[row.name] = row.value === '' && before !== undefined ? String(before[1] ?? '') : row.value
  }
  return { map }
}

/**
 * Whether two configs hold the same values, so a repeated save writes nothing.
 * @param {unknown} left one value
 * @param {unknown} right the other
 * @returns {boolean} whether they are equal by value
 */
export function sameConfig(left, right) {
  if (left === right) return true
  if (typeof left !== typeof right || left === null || right === null) return false
  if (typeof left !== 'object') return false
  if (Array.isArray(left) !== Array.isArray(right)) return false
  /* Expression nodes are compared by their expression: two reads of one variable are one value. */
  if (isRef(left) || isRef(right)) return isRef(left) && isRef(right) && String(left.__jsExpr) === String(right.__jsExpr)
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (!sameConfig(left[key], right[key])) return false
  }
  return true
}

/**
 * The prefix the platform gives every tool of one server, as `dsh-mcp-client` builds it:
 * `mcp__<serverName>__`, with the characters a function name may not carry replaced.
 * @param {string} serverName the server's name
 * @returns {string} the prefix
 */
export function publicPrefix(serverName) {
  return `mcp__${String(serverName).replace(/[^A-Za-z0-9_-]/g, '_')}__`
}

/**
 * The tool's own name as it stands on the server: the public name without the prefix.
 * @param {string} publicName the model-facing name
 * @param {string} serverName the server's name
 * @returns {string} the tool's name on the server
 */
export function rawToolName(publicName, serverName) {
  const prefix = publicPrefix(serverName)
  const text = String(publicName ?? '')
  return text.startsWith(prefix) ? text.slice(prefix.length) : text
}
