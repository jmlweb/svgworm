import { optimize, type CustomPlugin } from 'svgo';

import { ColorMode } from '../config/schema.ts';
import { DiagnosticCode, type Diagnostic } from '../errors.ts';
import { classifyIcon, ColorKind } from './color/classify.ts';
import { describePaintFlag } from './color/paint.ts';
import { rewriteToCurrentColor } from './color/rewrite.ts';
import { renameIds } from './ids.ts';
import {
  findLeftoverStyles,
  OPTIMIZE_PLUGINS,
  STYLE_PLUGINS,
} from './optimize.ts';
import {
  dropNoopClips,
  hasUrlReferences,
  toDelivery,
  type Delivery,
} from './references.ts';
import {
  collectLicenseComments,
  describeParseError,
  getDocumentElement,
  removeAttribute,
  SERIALIZE_OPTIONS,
  walkElements,
} from './tree.ts';
import { decodeSource, validateTree } from './validate.ts';
import { resolveViewBox } from './viewbox.ts';

export type IconMarkup = {
  readonly viewBox: string;
  readonly isViewBoxDerived: boolean;
  readonly color: ColorKind;
  readonly delivery: Delivery;
  /**
   * License notices from the source (`<!-- @license … -->` and `<!--! … -->`, the forms icon
   * packages and minifiers use), trimmed, unique and sorted. The sprite keeps them once.
   */
  readonly licenses: readonly string[];
  /** Presentation attributes of the source root that the symbol inherits. */
  readonly attributes: readonly (readonly [string, string])[];
  /** Serialized children of the source root, with ids renamed. */
  readonly inner: string;
};

export type TransformResult =
  | { readonly ok: true; readonly icon: IconMarkup }
  | { readonly ok: false; readonly errors: readonly Diagnostic[] };

// Attributes that only make sense on a standalone document. The symbol gets its own id and
// viewBox, and everything else a design tool put on the root is kept, because a symbol's
// presentation attributes inherit into its children.
const ROOT_ONLY_ATTRIBUTES = new Set([
  'id',
  'width',
  'height',
  'viewBox',
  'x',
  'y',
  'version',
  'baseProfile',
  'class',
  'style',
]);

const isRootOnly = (name: string): boolean =>
  ROOT_ONLY_ATTRIBUTES.has(name) ||
  name === 'xmlns' ||
  name.startsWith('xmlns:') ||
  name.startsWith('xml:');

const EMPTY_ROOT = '<svg/>';

const sliceInner = (serialized: string): string => {
  if (serialized === EMPTY_ROOT) return '';
  // The root has no attributes at this point, so its tags are exactly `<svg>` and `</svg>`.
  return serialized.slice('<svg>'.length, serialized.length - '</svg>'.length);
};

const fail = (errors: readonly Diagnostic[]): TransformResult => ({
  ok: false,
  errors,
});

/**
 * Ends the single svgo run from one of svgworm's plugins with diagnostics on the file. svgo 4.1
 * lets a plugin's throw leave `optimize` as is, without wrapping it (pinned in
 * transform.test.ts), so the catch can tell it apart from a failure inside svgo.
 */
class Rejection extends Error {
  readonly errors: readonly Diagnostic[];
  constructor(errors: readonly Diagnostic[]) {
    super('svgworm rejected the icon');
    this.name = 'Rejection';
    this.errors = errors;
  }
}

// Which code was running when the svgo run threw. svgo plugins can throw on odd but
// well-formed input (CSS they cannot parse, for one); that is the user's file, so it comes
// back as a diagnostic. A throw from svgworm's own steps is a svgworm bug and surfaces as one.
const Stage = {
  PARSE: 'parse',
  SVGWORM: 'svgworm',
  SVGO: 'svgo',
} as const;
type Stage = (typeof Stage)[keyof typeof Stage];

export type TransformInput = {
  readonly content: Uint8Array;
  /** Path used in diagnostics. */
  readonly file: string;
  readonly symbolId: string;
  readonly mode: ColorMode;
};

/**
 * The whole per-icon pipeline: validate, derive the viewBox, inline styles, optimize,
 * classify and recolor (ADR-0004), drop no-op clips, rename ids, and decide the delivery
 * (ADR-0006). Pure: bytes in, markup out.
 */
export const transformIcon = (input: TransformInput): TransformResult => {
  const { file } = input;
  const decoded = decodeSource(input.content, file);
  if (!decoded.ok) return fail([decoded.error]);

  // One svgo run per icon (TSK-096): every pass used to be a full parse and stringify. The
  // plugin order keeps the old order of checks: parse, validate, viewBox, styles, leftover
  // styles, optimize, then recolor and rename.
  // Widened on purpose: the plugins reassign it inside closures, which TypeScript does not track.
  let stage = Stage.PARSE as Stage;
  let licenses: readonly string[] = [];
  let viewBox = { viewBox: '', isDerived: false };
  let outcome:
    | {
        readonly color: ColorKind;
        readonly hasReferences: boolean;
        readonly attributes: readonly (readonly [string, string])[];
      }
    | undefined;

  const intake: CustomPlugin = {
    name: 'svgworm-intake',
    fn: (root) => {
      stage = Stage.SVGWORM;
      const errors = validateTree(root, file);
      if (errors.length > 0) throw new Rejection(errors);
      // Read before the optimize plugins run: the preset strips every comment, license or not.
      licenses = collectLicenseComments(root);
      // A copy, because the style plugins write to the root's attributes.
      const resolved = resolveViewBox(
        { ...getDocumentElement(root)?.attributes },
        file,
      );
      if (!resolved.ok) throw new Rejection([resolved.error]);
      viewBox = resolved;
      stage = Stage.SVGO;
      return null;
    },
  };

  const leftover: CustomPlugin = {
    name: 'svgworm-leftover',
    fn: (root) => {
      stage = Stage.SVGWORM;
      const errors = findLeftoverStyles(root, file);
      if (errors.length > 0) throw new Rejection(errors);
      stage = Stage.SVGO;
      return null;
    },
  };

  const finish: CustomPlugin = {
    name: 'svgworm-transform',
    fn: (root) => {
      stage = Stage.SVGWORM;
      const document = getDocumentElement(root);
      const classification = classifyIcon(root);
      const isForced = input.mode === ColorMode.MONO;
      if (isForced && classification.flags.length > 0) {
        throw new Rejection([
          {
            code: DiagnosticCode.FORCED_MONO_UNSAFE,
            file,
            message: `color "mono" is forced, but the icon has ${classification.flags.map(describePaintFlag).join(' and ')}, which cannot follow currentColor`,
          },
        ]);
      }
      const isRecolored =
        isForced ||
        (input.mode === ColorMode.AUTO &&
          classification.kind === ColorKind.MONO);
      if (isRecolored) rewriteToCurrentColor(root, classification);

      walkElements(root, (element) => {
        removeAttribute(element, 'class');
      });
      dropNoopClips(root, viewBox.viewBox);
      renameIds(root, input.symbolId);

      // Checked while the root still carries its attributes: a filter or mask can sit there.
      const hasReferences = hasUrlReferences(root);
      const attributes = Object.entries(document?.attributes ?? {}).filter(
        ([name]) => !isRootOnly(name),
      );
      // Leave `<svg>` bare so the inner markup can be sliced out of the serialization.
      Object.keys(document?.attributes ?? {}).forEach((name) => {
        if (document !== undefined) removeAttribute(document, name);
      });
      outcome = {
        color: isRecolored ? ColorKind.MONO : ColorKind.MULTICOLOR,
        hasReferences,
        attributes,
      };
      return null;
    },
  };

  let serialized: string;
  try {
    serialized = optimize(decoded.text, {
      multipass: false,
      js2svg: SERIALIZE_OPTIONS,
      plugins: [
        intake,
        ...STYLE_PLUGINS,
        leftover,
        ...OPTIMIZE_PLUGINS,
        finish,
      ],
    }).data;
  } catch (error) {
    if (error instanceof Rejection) return fail(error.errors);
    if (stage === Stage.SVGWORM) throw error;
    return fail([
      {
        code: DiagnosticCode.INVALID_XML,
        file,
        message:
          stage === Stage.PARSE
            ? describeParseError(error)
            : `svgo could not process the file: ${error instanceof Error ? error.message : String(error)}`,
      },
    ]);
  }
  if (outcome === undefined) throw new Error('svgo did not run the transform');
  const { color, hasReferences, attributes } = outcome;
  return {
    ok: true,
    icon: {
      viewBox: viewBox.viewBox,
      isViewBoxDerived: viewBox.isDerived,
      color,
      delivery: toDelivery(color, hasReferences),
      licenses,
      attributes,
      inner: sliceInner(serialized),
    },
  };
};
