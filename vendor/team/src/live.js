/**
 * A volatile field's live value: the box a write reaches, or the plain value.
 *
 * One definition for the package: the listener reads the two switches and the route reads the same two,
 * and two copies of this reader would drift on the day the shape of a live reference changes.
 * @param {unknown} field the config field
 * @returns {unknown} the value it holds now
 */
export function live(field) {
  return typeof field?.get === 'function' ? field.get() : field
}
