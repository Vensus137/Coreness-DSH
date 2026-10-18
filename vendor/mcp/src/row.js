/**
 * The vocabulary of one MCP row: its id in the servers file, the fields the form draws, and the
 * config that a save writes back.
 *
 * The rules here are the platform's own, read from the config schema of the module a row names:
 * `serverName` matches `/^[A-Za-z0-9_-]{1,32}$/` and names the tools of that server; `transport` is
 * `stdio` or `streamable-http` and decides which branch of the config is meaningful; the two
 * branches do not mix.
 *
 * What the form draws is what a person needs to connect a server and to read its state; every other
 * key a row carries is the file's, written back exactly as it stands and only named by the picture
 * (`keptOf`, `buildConfig`).
 *
 * @module @coreness/mcp/src/row
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
 * The name of a header: the HTTP token charset, so a legal header of an unusual spelling is not
 * refused by a rule narrower than the wire's own.
 */
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,64}$/

/** The name of an environment variable. */
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

/**
 * The config fields the form draws, by the branch the row connects by.
 *
 * The list is what a person needs to connect a server and to read its state — the command and its
 * arguments or the address and its headers, the variables it starts with, the directory it runs in,
 * how long a call may take, and one plain sentence for a server that fails to come up. A key of the
 * row outside this list is the file's: it is carried untouched and only named (`keptOf`).
 */
const DRAWN = {
  'streamable-http': ['serverName', 'transport', 'url', 'headers', 'toolCallTimeoutMs', 'failOnStartupError'],
  stdio: ['serverName', 'transport', 'command', 'args', 'env', 'toolCallTimeoutMs', 'failOnStartupError'],
}

/** Every field the form draws on either branch: a value here standing as an expression is the file's. */
const OWNED = [...new Set(Object.values(DRAWN).flat())]

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
 * Whether a value is a serialized Loader expression (`!!js`) rather than a plain value.
 * @param {unknown} value the value as it stands in the config
 * @returns {boolean} whether it is an expression node
 */
export function isRef(value) {
  return value instanceof Object && '__jsExpr' in value
}

/** The row option a row needs when its header reads the platform's store: the service, in the row's own context. */
export const REFERENCE_OPTION = ['credentials']

/** The header a row's own reference is written into. */
export const REFERENCE_HEADER = 'Authorization'

/**
 * The expression a row's header carries, or null while the header stands as a plain value.
 * @param {object} config the row's config
 * @returns {string | null} the expression's text
 */
export function referenceOf(config) {
  const held = config?.headers?.[REFERENCE_HEADER]
  return isRef(held) ? String(held.__jsExpr) : null
}

/**
 * The transport a row connects by, as the picture reads it.
 * @param {object} config the row's config
 * @returns {string | null} the platform's own transport, or null when the row names none
 */
export function kindOf(config) {
  const transport = config?.transport
  return typeof transport === 'string' ? transport : null
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
 * The names of the keys of a row that the form does not draw for that row's branch.
 *
 * The names travel so a reader is told the row holds more than the form shows — the value stays in
 * the file. A key of the branch a save would leave is in this list too, which is how the editor can
 * name what a save will drop before it drops it.
 * @param {object} config the row's config
 * @returns {string[]} the names, in the order the file holds them
 */
export function keptOf(config) {
  const drawn = new Set(DRAWN[kindOf(config)] ?? OWNED)
  return Object.keys(config ?? {}).filter((name) => !drawn.has(name))
}

/**
 * The fields of the row the form draws that stand as expressions instead of values.
 *
 * The page draws this list: a row whose drawn field stands as a `!!js` expression is not a row the
 * form may shape, and saying so before a save is cheaper than a refused save. The reading is taken
 * over both branches rather than over the row's own, because a save may switch the branch and draw
 * a key the row carries today.
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
  /* The form carries a list of rows: a body that hands a map instead is not a form this path may
     read, and it is refused in words rather than walked into a crash. */
  if (rows !== undefined && rows !== null && !Array.isArray(rows)) return { error: 'bad-value' }
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
 * The row as it stands is the source of everything the form does not draw: a key outside the fields
 * the form shows is carried exactly as the file holds it, so a save made here never costs a value
 * somebody put there by hand. A field the form draws follows the form, in three states: **absent**
 * from the request it keeps what the row holds — a page that does not draw a field yet must not wipe
 * it — **empty** it takes the key off the row, and **filled** it is the person's word.
 * @param {object} form the form's fields
 * @param {object} current the row's config as it stands
 * @returns {{ config?: object, error?: string, detail?: string }} the config to store, or the refusal
 *          with the words that name what it refused
 */
export function buildConfig(form, current = {}) {
  const server = String(form?.serverName ?? '').trim()
  if (!NAME.test(server)) return { error: 'bad-name' }

  const transport = String(form?.transport ?? '')
  if (!TRANSPORTS.includes(transport)) return { error: 'bad-transport' }

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

    if (sent(form, 'headers')) {
      const built = mergePairs(form.headers, current?.headers, 'headers')
      if (built.error !== undefined) return { error: built.error }
      if (Object.keys(built.map).length > 0) config.headers = built.map
      else delete config.headers
    }
  } else {
    delete config.url
    delete config.headers

    const command = String(form?.command ?? '').trim()
    if (command === '') return { error: 'bad-command' }
    config.command = command

    const args = parseArgs(form?.args)
    if (args.length > 0) config.args = args
    else delete config.args

    if (sent(form, 'env')) {
      const built = mergePairs(form.env, current?.env, 'env')
      if (built.error !== undefined) return { error: built.error }
      if (Object.keys(built.map).length > 0) config.env = built.map
      else delete config.env
    }

  }

  /* One plain sentence on the form for `failOnStartupError`: without it a row that failed to come up
     is indistinguishable from a server that has no tools. Unticking the box takes the key off, and
     the platform's own default — a quiet failure — applies again. */
  if (sent(form, 'loud')) {
    if (typeof form.loud !== 'boolean') {
      return { error: 'bad-value', detail: 'the loud-startup field is a yes or a no, and this save carries neither' }
    }
    if (form.loud) config.failOnStartupError = true
    else delete config.failOnStartupError
  }

  return withTimeout(config, form)
}

/**
 * Whether the form carries a field at all.
 *
 * A page that does not draw a field sends nothing for it, and nothing means the row keeps what the
 * file holds — which is what keeps a hand-written value safe from a form that never showed it.
 * @param {object} form the form's fields
 * @param {string} key the field's own name
 * @returns {boolean} whether the request carries the field
 */
function sent(form, key) {
  return form !== null && typeof form === 'object' && key in form
}

/**
 * The call timeout a form carries: written onto the config, taken off it, or left as it stands.
 * @param {object} config the config a save built
 * @param {object} form the form's fields
 * @returns {{ config?: object, error?: string }} the config, or the refusal
 */
function withTimeout(config, form) {
  if (!sent(form, 'timeout')) return { config }
  const timeout = String(form.timeout ?? '').trim()
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
