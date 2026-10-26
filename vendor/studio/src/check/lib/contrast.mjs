/**
 * The contrast arithmetic every colour gate stands on: WCAG 2.x relative luminance (linearised sRGB, the
 * 0.04045 threshold), ratio `(L1 + 0.05) / (L2 + 0.05)`, no rounding before comparison.
 *
 * A value this file cannot read is `undefined`: the gates answer `unchecked` with the reason rather than
 * guess a colour. The palette is not here: this module holds the arithmetic only, and the six looks' values
 * are derived from the package's own sheet where the comparison that needs them lives.
 */

/** Parse a hex, rgb() or rgba() colour into `{ r, g, b }` in 0…255, or `undefined`. */
export function parseColor(value) {
  if (typeof value !== 'string') return undefined
  const text = value.trim().toLowerCase()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text)
  if (hex !== null) {
    let digits = hex[1]
    if (digits.length === 3) digits = digits.split('').map((ch) => ch + ch).join('')
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
    }
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,[^)]*)?\)$/.exec(text)
  if (rgb !== null) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) }
  }
  return undefined
}

function channel(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** The WCAG relative luminance of a parsed colour. */
export function luminance(color) {
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
}

/** The contrast ratio between two parsed colours. */
export function ratioBetween(foreground, background) {
  const a = luminance(foreground)
  const b = luminance(background)
  const light = Math.max(a, b)
  const dark = Math.min(a, b)
  return (light + 0.05) / (dark + 0.05)
}

/** The ratio of two colour values, or `undefined` when either cannot be read. */
export function ratio(fgValue, bgValue) {
  const fg = parseColor(fgValue)
  const bg = parseColor(bgValue)
  if (fg === undefined || bg === undefined) return undefined
  return ratioBetween(fg, bg)
}

/** Two decimals, for a report — never for a comparison. */
export function round2(value) {
  return Math.round(value * 100) / 100
}
