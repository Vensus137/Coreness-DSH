/**
 * Gate results. Every gate answers exactly `pass`, `fail` or `unchecked`, and `unchecked` always
 * carries a reason: a gate whose subject the reader could not read is never a pass.
 */

export const pass = (detail) => ({ state: 'pass', ...(detail === undefined ? {} : { detail }) })
export const fail = (detail) => ({ state: 'fail', detail })
export const unchecked = (detail) => ({ state: 'unchecked', detail })

/** The contract's own word for a gate that does not apply to this document's kind. */
export function notApplicable(kind, why) {
  return unchecked(`not applicable: ${kind} — ${why}`)
}

/** Format a few offenders for a detail line without printing a whole document. */
export function list(offenders, limit = 6) {
  const shown = offenders.slice(0, limit).map((item) => String(item))
  const more = offenders.length > limit ? `, … ${offenders.length - limit} more` : ''
  return shown.join('; ') + more
}
