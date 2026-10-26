/**
 * The four Page Studio tools: the model's door to the builder, the checker and the capture pass.
 *
 * The descriptions, schemas and renderers are the contract's model-facing text verbatim; a change of a
 * word here is a change of the product's behaviour. The bodies are thin on purpose: they hand the
 * arguments to the area that owns the work and answer with its value, so every refusal the model can
 * act on is a value it reads (named code, manifest path, detail), never a thrown error.
 *
 * The definitions need the plugin context — the builder writes through `ctx.fs`, the capture spawns
 * Edge through `ctx.subprocess`, and the checker takes the context its entry point declares — while a
 * tool's `execute(args, exec)` receives the caller's execution object only (`exec.agent`,
 * `exec.signal`), not the plugin. The context is therefore this factory's argument: the plugin calls
 * it where it registers, and a module-level array of definitions would have to reach the context
 * through a second owner of plugin state. The factory holds no state of its own, so calling it again
 * for a second registration builds the same four definitions.
 *
 * @module @coreness/studio/tools
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import { buildPage } from '../build/index.js'
import { checkDir } from '../check/index.js'
import { DEFAULT_LOOK, LOOKS as LOOK_IDS } from '../lib/library.mjs'
import { shotDir } from '../shot/index.js'

/**
 * The six looks in the words the model reads, keyed by library id: one name, one fit line and one
 * composition signature each. Keyed by id, so a reorder of the library moves the catalogue's order and
 * never the words; the ids and the default come from the library. This is text the implementation ships,
 * not a second design source: the tokens stay in the sheets.
 */
const LOOK_TEXT = {
  quiet: {
    name: 'Quiet',
    description: 'a report, a programme, a tool with one page to explain',
    signature: 'one page composition shared with corporate and warm; mostly white, one object and a hairline or two, the accent kept for the closing field',
  },
  editorial: {
    name: 'Editorial',
    description: 'a product or service with one claim to land; an essayistic page',
    signature: 'masthead and an oversized claim; a 7/5 or 8/4 grid, a standfirst and margin captions; serif display over sans body',
  },
  technical: {
    name: 'Technical',
    description: 'a tool, a specification, anything with numbers or units',
    signature: 'an annotated figure; a visible rule grid, mono labels, units and sources, a table or an ordered text diagram; dense but one idea per block',
  },
  corporate: {
    name: 'Corporate',
    description: 'an institution, a report, a programme with one proof',
    signature: 'one page composition shared with quiet and warm; a blue-grey palette, a top rule on every section, ink links, the accent kept for the closing field',
  },
  bold: {
    name: 'Bold',
    description: 'a consumer page, an event, a launch with one loud moment',
    signature: 'a flat field and giant type; one accent field (two per deck at most), one huge claim, hard edges, no gradient or glow; one loud moment',
  },
  warm: {
    name: 'Warm',
    description: 'a personal page, a studio, an event with a human voice',
    signature: 'one page composition shared with quiet and corporate; a paper ground, serif type, generous leading, a top rule on every section and a ruled quotation, the accent kept for the closing field',
  },
}

/**
 * The catalogue the tool answers: the library's ids and default beside the words above, in the library's
 * order. A look the library owns and this table does not describe is a fault said here, never a silent gap.
 */
const LOOKS = LOOK_IDS.map((id) => {
  const text = LOOK_TEXT[id]
  if (text === undefined) throw new Error(`the tools module carries no text for the look "${id}"`)
  return { id, ...text, default: id === DEFAULT_LOOK }
})

/**
 * The six looks as the tool answers them: pure values, no arguments and no writes.
 * @returns {{ default: string, looks: object[] }} the default id and one entry per look
 */
function looks() {
  return { default: DEFAULT_LOOK, looks: LOOKS.map((look) => ({ ...look })) }
}

/**
 * The four definitions, built against the plugin context that the bodies hand to their area.
 * @param {object} ctx the plugin context
 * @returns {object[]} the `defineTool` definitions, in registration order
 */
export function studioTools(ctx) {
  return [
    defineTool({
      name: 'studio_looks',
      description:
        'The six looks a page or deck can wear, with the composition signature each one uses and what it fits. '
        + 'Call it before choosing a look: the returned ids are the only accepted `look` values, and a look is chosen '
        + 'with its signature, not as a separate question.',
      parameters: {},
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            default: { type: 'string', required: true, description: 'The look used when none fits better.' },
            looks: {
              type: 'array',
              required: true,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: { type: 'string', required: true, description: 'The value to pass as `look`.' },
                  name: { type: 'string', required: true, description: 'The look\'s name.' },
                  signature: { type: 'string', required: true, description: 'The one composition device this look is built from.' },
                  description: { type: 'string', required: true, description: 'The briefs this look suits.' },
                  default: { type: 'boolean', required: true, description: 'True for the look `default` names.' },
                },
              },
            },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: [
            `default: ${value.default}`,
            ...value.looks.map((look) => `${look.id} — ${look.name}${look.default ? ' (default)' : ''}: ${look.description} Signature: ${look.signature}`),
          ].join('\n'),
        }],
      },
      // The six entries are the package's own data (one look, one signature, one description line); no arguments, no writes.
      execute: () => looks(),
    }),
    defineTool({
      name: 'studio_build',
      description:
        'Build a static page or an HTML presentation into a folder from a manifest of sections or slides. '
        + 'The manifest shape and every section/layout field are in the `page-studio` skill; write the manifest there, '
        + 'then call this once. It writes the page set and page.json into the target, and nothing outside it. '
        + 'A manifest it cannot validate writes nothing; a write that fails part-way names the files already written and '
        + 'leaves no page.json, and a folder without that marker is refused — remove it or choose an empty folder before '
        + 'retrying. It refuses a non-empty folder it did not generate.',
      parameters: {
        kind: {
          type: 'string',
          required: true,
          enum: ['landing', 'portfolio', 'article', 'presentation'],
          description: 'What to build: a page recipe, or `presentation` for a 5–9 screen deck.',
        },
        targetDir: {
          type: 'string',
          required: true,
          description: 'The folder to write into, from the user\'s request or the project\'s conventions — absolute, or relative to the working directory. There is no default.',
        },
        look: {
          type: 'string',
          enum: [...LOOK_IDS],
          description: `The look from \`studio_looks\`. Default ${DEFAULT_LOOK}.`,
        },
        manifest: {
          type: 'object',
          additionalProperties: true,
          required: true,
          description: 'The page or deck manifest, in the shape the `page-studio` skill gives. Plain text fields, not HTML; `kind` and `look` are arguments, never manifest fields.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ok: { type: 'boolean', required: true, description: 'True when the folder was written; false when the manifest, the look or the target was refused, with the problems that refused it.' },
            dir: { type: 'string', description: 'The resolved folder.' },
            files: { type: 'array', items: { type: 'string' }, description: 'Every file the build set out to write.' },
            written: { type: 'array', items: { type: 'string' }, description: 'write.failed: the files written before the fault, in the order written.' },
            kind: { type: 'string', description: 'The kind built.' },
            look: { type: 'string', description: 'The look used.' },
            recipe: { type: 'string', description: 'The recipe used.' },
            variant: { type: 'string', description: 'The recipe variant, when the manifest carried one.' },
            structure: { type: 'array', items: { type: 'string' }, description: 'section types (page) or slide layouts (deck), in render order' },
            code: { type: 'string', description: 'kind.unknown, manifest.*, recipe.*, target.*, look.unknown or write.failed' },
            message: { type: 'string', description: 'The refusal in one sentence.' },
            problems: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  code: { type: 'string', required: true, description: 'The rule that refused it.' },
                  path: { type: 'string', required: true, description: 'The manifest path that broke the rule.' },
                  detail: { type: 'string', required: true, description: 'What the rule expects there.' },
                },
              },
              description: 'Every refusal found in this pass, in manifest order.',
            },
          },
        },
        render: (_args, value) => {
          if (value.ok !== true) {
            const problems = value.problems ?? []
            return [{
              type: 'text',
              text: [
                `refused: ${value.code} — ${value.message ?? ''}`,
                ...problems.slice(0, 20).map((problem) => `${problem.path}: ${problem.detail}`),
                ...(problems.length > 20 ? [`… ${problems.length - 20} more`] : []),
                ...(value.code === 'write.failed' && value.written !== undefined ? [`already written: ${value.written.join(', ')}`] : []),
              ].join('\n'),
            }]
          }
          return [{
            type: 'text',
            text: [
              `built ${value.kind} (${value.look}, recipe ${value.recipe}${value.variant === undefined ? '' : `, ${value.variant}`}) → ${value.dir}`,
              `structure: ${value.structure.join(', ')}`,
              `files: ${value.files.join(', ')}`,
            ].join('\n'),
          }]
        },
      },
      // lib/build owns validation, composition and the write path; the tool resolves targetDir, applies the look
      // default, and returns a refusal as a value (ok: false with its problems), never as a thrown error.
      execute: (args, exec) => buildPage({
        kind: args.kind,
        targetDir: args.targetDir,
        look: args.look ?? DEFAULT_LOOK,
        manifest: args.manifest,
        exec,
        ctx,
      }),
    }),
    defineTool({
      name: 'studio_check',
      description:
        'Run the static checks on a folder studio_build wrote: contrast, colour-only meaning, headings, alt text, '
        + 'landmarks, skip link, external assets, placeholders, byte budget, the deck\'s slide count, heading structure, '
        + 'counter and keys wiring in the source, and the recipe composition. The fitted deck geometry and rendered line '
        + 'counts are the capture\'s — unchecked here without a browser. Every gate answers pass, fail or unchecked; a gate '
        + 'with no instrument is unchecked with its reason, never pass. It reads the folder only and writes nothing; a '
        + 'folder without the studio\'s own page.json marker is refused rather than half-checked.',
      parameters: {
        dir: { type: 'string', required: true, description: 'The folder to check, as studio_build returned it.' },
      },
      output: {
        /* The schema as written made `dir`, `kind`, `gates` and `summary` required at the root beside its
           own `ok !== true` refusal branch, so a refusal (`ok: false` with the code that refused it)
           could never validate — the platform validates a tool's value against this schema and throws on
           a violation. The root is therefore two branches: a check that ran, with the whole success shape
           enforced, and a refusal, which is not a check with empty gates. Only the root shape is
           corrected; the property descriptions stand as written. */
        schema: {
          description: 'A check that ran (`ok: true`) or a folder the check refused (`ok: false`). A refusal is not a check with empty gates: it carries the code that refused it.',
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                ok: { type: 'boolean', const: true, required: true, description: 'True when the check ran — a failing page is still ok; false when the folder was refused.' },
                dir: { type: 'string', required: true, description: 'The folder checked.' },
                kind: { type: 'string', required: true, description: 'The kind the folder declares.' },
                gates: {
                  type: 'array',
                  required: true,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      code: { type: 'string', required: true, description: 'The gate\'s code.' },
                      state: { type: 'string', enum: ['pass', 'fail', 'unchecked'], required: true },
                      detail: { type: 'string', description: 'What is wrong, or why no instrument could decide it.' },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  required: true,
                  additionalProperties: false,
                  properties: {
                    pass: { type: 'number', required: true },
                    fail: { type: 'number', required: true },
                    unchecked: { type: 'number', required: true },
                    total: { type: 'number', required: true },
                  },
                },
              },
            },
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                ok: { type: 'boolean', const: false, required: true, description: 'False when the folder was refused rather than checked.' },
                code: { type: 'string', required: true, description: 'target.missing, target.isFile or target.notOwned, when ok is false.' },
                message: { type: 'string', description: 'The refusal in one sentence.' },
              },
            },
          ],
        },
        render: (_args, value) => {
          if (value.ok !== true) return [{ type: 'text', text: `refused: ${value.code} — ${value.message ?? ''}` }]
          const notPassing = value.gates.filter((gate) => gate.state !== 'pass')
          return [{
            type: 'text',
            text: [
              `${value.summary.pass} pass, ${value.summary.fail} fail, ${value.summary.unchecked} unchecked — ${value.dir}`,
              ...notPassing.slice(0, 20).map((gate) => `${gate.state} ${gate.code}: ${gate.detail ?? ''}`),
              ...(notPassing.length > 20 ? [`… ${notPassing.length - 20} more`] : []),
            ].join('\n'),
          }]
        },
      },
      // lib/check owns the catalogue; the tool refuses a folder that carries no page.json with the generator marker.
      execute: (args, exec) => checkDir({ dir: args.dir, exec, ctx }),
    }),
    defineTool({
      name: 'studio_shot',
      description:
        'Open a built page or deck in headless Edge from its file URL, capture desktop (1440) and mobile (390) screenshots '
        + 'plus a colour-vision-deficiency capture at 1440, and check computed styles at each viewport (focus, target size, '
        + 'horizontal overflow; deck geometry at 1440). Screenshots and page files stay apart: the evidence folder is a '
        + 'sibling outside the target. No Edge, a launch failure or a read-only session answers unchecked with the reason — '
        + 'never a pass.',
      parameters: {
        dir: { type: 'string', required: true, description: 'The folder studio_build wrote.' },
        viewports: {
          type: 'array',
          items: { type: 'integer' },
          description: 'CSS pixel widths to measure; default [320, 390, 768, 1440].',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            status: { type: 'string', enum: ['done', 'unchecked'], required: true },
            dir: { type: 'string', description: 'The folder captured.' },
            evidenceDir: { type: 'string', description: 'absolute path outside the target; absent when no evidence folder was made, present otherwise whatever the answer' },
            shots: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string', required: true },
                  path: { type: 'string', required: true },
                  viewport: { type: 'number' },
                  cvd: { type: 'string' },
                },
              },
            },
            gates: {
              type: 'array',
              required: true,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  code: { type: 'string', required: true },
                  state: { type: 'string', enum: ['pass', 'fail', 'unchecked'], required: true },
                  detail: { type: 'string' },
                },
              },
            },
            reason: { type: 'string', description: 'why unchecked: no resolver, no executable, launch failed, killed, policy refused, unwritable evidence path' },
          },
        },
        render: (_args, value) => {
          const gates = value.gates ?? []
          const count = (state) => gates.filter((gate) => gate.state === state).length
          const head = []
          if (value.status === 'done') head.push(`captured → ${value.evidenceDir}`)
          else head.push(`unchecked: ${value.reason ?? 'no capture was taken'}`)
          if (value.status !== 'done' && value.evidenceDir !== undefined) head.push(`evidence → ${value.evidenceDir}`)
          return [{
            type: 'text',
            text: [
              ...head,
              ...(value.shots ?? []).map((shot) => `${shot.name}: ${shot.path}${shot.viewport === undefined ? '' : ` (${shot.viewport}px)`}`),
              `${count('pass')} pass, ${count('fail')} fail, ${count('unchecked')} unchecked`,
              ...gates.map((gate) => `${gate.state} ${gate.code}${gate.detail === undefined ? '' : `: ${gate.detail}`}`),
            ].join('\n'),
          }]
        },
      },
      // lib/shot resolves Edge (PATH, then the measured absolute candidate), captures, and kills the process.
      execute: (args, exec) => shotDir({ dir: args.dir, viewports: args.viewports, exec, ctx }),
    }),
  ]
}
