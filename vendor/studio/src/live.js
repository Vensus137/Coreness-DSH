/**
 * A volatile field's live value: the box a write reaches, or the plain value.
 *
 * The host reads the switch at every sync and the routing section at every assembly, and a value
 * captured at the mount would describe a row that has since changed.
 * @param {unknown} field the config field
 * @returns {unknown} the value it holds now
 */
export function live(field) {
  return typeof field?.get === 'function' ? field.get() : field
}
