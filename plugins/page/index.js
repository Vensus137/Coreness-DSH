/**
 * The host half of the page plugin. The component that draws the page lives in the browser half; the
 * row exists so the package is an entry of the composition, which is what gives the client half a
 * record in the web shell's module graph. No service is provided and none is required.
 */
export function apply() {}
