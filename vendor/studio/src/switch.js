/**
 * The switch: the one place the model-facing set follows the live field.
 *
 * The sync is synchronous and idempotent. Every call reads the field again, and only a change of
 * the state touches the registrations: the mount, a settings announcement and a config reload all
 * call it, and a second registration of the same skill is first-wins with a warning — a set that is
 * half old and half new is a failure the model cannot see.
 *
 * A registration that throws leaves the state as it was and is said in the log; the caller's `off`
 * undoes whatever the half-finished `on` had registered, because its disposer list is one list.
 *
 * @module @coreness/studio/switch
 */

/**
 * @param {object} doors the four ways the switch touches the world
 * @param {() => boolean} doors.read the live field
 * @param {() => void} doors.on register the whole set
 * @param {() => void} doors.off dispose what the set registered (idempotent)
 * @param {(message: string) => void} doors.say where a failure is said
 * @returns {{active: () => boolean, sync: () => boolean}} the switch; `sync` answers whether the state
 *   changed, and a fault answers that it did not — a caller that logs its success logs only a real one.
 */
export function createSwitch({ read, on, off, say }) {
  let active = false
  return {
    active: () => active,
    sync() {
      /* A read that throws is a fault of the field's own box, not a change of the state: it is said
         and the set is left exactly as it stood, so one broken read cannot empty a working set. */
      let next
      try {
        next = read() === true
      } catch (error) {
        say(`the model-facing set could not be read: ${error instanceof Error ? error.message : String(error)}`)
        return false
      }
      if (next === active) return false
      try {
        if (next) on()
        else off()
      } catch (error) {
        say(`the model-facing set could not be ${next ? 'registered' : 'disposed'}: ${error instanceof Error ? error.message : String(error)}`)
        try {
          off()
        } catch (undoing) {
          say(`the half-registered set could not be undone: ${undoing instanceof Error ? undoing.message : String(undoing)}`)
        }
        return false
      }
      active = next
      return true
    },
  }
}
