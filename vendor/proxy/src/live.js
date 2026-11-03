/**
 * A volatile field's live value: the box a write reaches, or the plain value.
 *
 * A volatile field arrives as a live reference, defaults included, so a reader that captured it at the
 * mount would read a box rather than the value the page wrote. The plugin's own checks pass plain values.
 * @param {unknown} field the config field
 * @returns {unknown} the value it holds now
 */
export function live(field) {
  return typeof field?.get === 'function' ? field.get() : field
}
