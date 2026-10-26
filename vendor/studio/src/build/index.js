/**
 * The builder's public entry points: `buildPage` is what `studio_build` calls — validate,
 * compose, check the target, write; `compose` is the same pipeline without a platform, returning the
 * emitted set as data; `validateManifest` is the pure refusal path the checker re-validates through.
 *
 * Validation happens before any write: an invalid manifest writes nothing. Every refusal the model can
 * act on is a value (`ok: false` with `code`, `message` and `problems`); only a package or composition
 * fault throws. The tool result carries only the properties the `studio_build` output schema allows.
 */
import { EMITTED, assemble, compose } from './compose.mjs'
import { validateManifest } from './manifest.mjs'
import { planOutputs, planTarget, writeEmitted } from './target.mjs'

export { compose, validateManifest }

/** The success result of `studio_build`, keys only as its output schema allows; `variant` only when it exists. */
function built({ checked, dir, files }) {
  return {
    ok: true,
    dir,
    files,
    kind: checked.kind,
    look: checked.look,
    recipe: checked.recipe,
    ...checked.variant === undefined ? {} : { variant: checked.variant },
    structure: checked.structure,
  }
}

/**
 * Build one page or deck into one folder.
 * @param {{ kind: string, targetDir: string, look?: string, manifest: object|string, exec?: object, ctx?: object }} input
 * @returns {Promise<object>} `studio_build`'s result: `ok: true` with `dir` and `files`, or `ok: false`
 *   with `code`, `message` and `problems`; a failed write adds `written` and leaves no `page.json`
 */
export async function buildPage({ kind, targetDir, look, manifest, exec = {}, ctx } = {}) {
  const checked = validateManifest({ kind, look, manifest })
  if (!checked.ok) return checked
  const plan = await planTarget({ targetDir, ctx, exec })
  if (!plan.ok) return plan
  const composed = assemble(checked)
  const planned = await planOutputs({ plan, emitted: EMITTED[checked.kind], ctx, exec })
  if (!planned.ok) return planned
  const write = await writeEmitted({ plan, outputs: planned.outputs, contents: composed.contents, ctx, exec })
  if (!write.ok) {
    return {
      ok: false,
      dir: plan.dir,
      files: composed.files,
      written: write.written,
      kind: checked.kind,
      look: checked.look,
      recipe: checked.recipe,
      ...checked.variant === undefined ? {} : { variant: checked.variant },
      structure: checked.structure,
      code: 'write.failed',
      message: write.message,
      problems: [{ code: 'write.failed', path: write.failed, detail: write.message }],
    }
  }
  return built({ checked, dir: plan.dir, files: composed.files })
}
