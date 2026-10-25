/**
 * The row's three numbers, held inside their floors.
 *
 * The journal cannot refuse its own schema over a number: a plugin whose schema fails is not mounted, and a
 * row that names a destructive value would take the journal's tools and route down with it instead of running
 * at a floor. So the shape is declared and the values are held here, the way the rate gate holds its own — a
 * value below the floor runs at the floor, a value that is not a number falls back to the default, and the
 * substitution is said in the log rather than left to be inferred from a wiped history.
 *
 * The floors are not the defaults: `rotationBytes` may be small on purpose (a test profile), but zero or a
 * negative number is a typo that would sweep every droppable record on the next write, and `rotationDays: 0`
 * would do the same by age.
 *
 * @module @coreness/journal/src/bounds
 */

/** The floors of the row's numbers, and the default each falls back to. */
export const BOUNDS = Object.freeze({
  rotationDays: { min: 1, fallback: 30 },
  rotationBytes: { min: 64 * 1024, fallback: 2 * 1024 * 1024 },
  recordsLimit: { min: 1, fallback: 20 },
})

/**
 * The numbers the journal runs at.
 * @param {object} config the row's config, resolved by the Loader against the plugin's schema
 * @param {(message: string) => void} [warn] where a substituted number is said
 * @returns {{rotationDays: number, rotationBytes: number, recordsLimit: number}} the numbers in force
 */
export function boundConfig(config = {}, warn = () => {}) {
  const numbers = {}
  for (const [name, { min, fallback }] of Object.entries(BOUNDS)) {
    const asked = config?.[name]
    if (typeof asked !== 'number' || Number.isFinite(asked) === false) {
      if (asked !== undefined) warn(`${name} is not a number (${JSON.stringify(asked)}): running at ${fallback}`)
      numbers[name] = fallback
      continue
    }
    if (asked < min) {
      warn(`${name} is ${asked}, under the floor of ${min}: running at ${min}`)
      numbers[name] = min
      continue
    }
    numbers[name] = name === 'recordsLimit' ? Math.floor(asked) : asked
  }
  return numbers
}
