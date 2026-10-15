import { ColorMode } from '../config/schema.ts';
import { DiagnosticCode, type Diagnostic } from '../errors.ts';
import { classifyIcon, ColorKind } from './color/classify.ts';
import { describePaintFlag } from './color/paint.ts';
import { rewriteToCurrentColor } from './color/rewrite.ts';
import { renameIds } from './ids.ts';
import {
  findLeftoverStyles,
  normalizeStyles,
  optimizeMarkup,
} from './optimize.ts';
import {
  dropNoopClips,
  hasUrlReferences,
  toDelivery,
  type Delivery,
} from './references.ts';
import {
  collectLicenseComments,
  getDocumentElement,
  mutateSvgTree,
  parseSvgTree,
  removeAttribute,
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
 * svgo plugins can throw on odd but well-formed input (CSS it cannot parse, for one).
 * That is the user's file, so it comes back as a diagnostic. Nothing else in the
 * pipeline is caught: a failure there is a svgworm bug and must surface as one.
 */
const runSvgo = (
  pass: (text: string) => string,
  text: string,
  file: string,
):
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: Diagnostic } => {
  try {
    return { ok: true, text: pass(text) };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: DiagnosticCode.INVALID_XML,
        file,
        message: `svgo could not process the file: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
};

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

  const raw = parseSvgTree(decoded.text);
  if (!raw.ok) {
    return fail([
      { code: DiagnosticCode.INVALID_XML, file, message: raw.message },
    ]);
  }
  const rawErrors = validateTree(raw.root, file);
  if (rawErrors.length > 0) return fail(rawErrors);
  // Read before svgo runs: its preset strips every comment, license or not.
  const licenses = collectLicenseComments(raw.root);

  const rootAttributes = getDocumentElement(raw.root)?.attributes ?? {};
  const viewBox = resolveViewBox(rootAttributes, file);
  if (!viewBox.ok) return fail([viewBox.error]);

  const styled = runSvgo(normalizeStyles, decoded.text, file);
  if (!styled.ok) return fail([styled.error]);
  const styledTree = parseSvgTree(styled.text);
  if (!styledTree.ok) {
    return fail([
      {
        code: DiagnosticCode.INVALID_XML,
        file,
        message: styledTree.message,
      },
    ]);
  }
  const leftover = findLeftoverStyles(styledTree.root, file);
  if (leftover.length > 0) return fail(leftover);

  const optimized = runSvgo(optimizeMarkup, styled.text, file);
  if (!optimized.ok) return fail([optimized.error]);

  const outcome = mutateSvgTree(optimized.text, (root) => {
    const document = getDocumentElement(root);
    const classification = classifyIcon(root);
    const isForced = input.mode === ColorMode.MONO;
    if (isForced && classification.flags.length > 0) {
      return {
        ok: false as const,
        error: {
          code: DiagnosticCode.FORCED_MONO_UNSAFE,
          file,
          message: `color "mono" is forced, but the icon has ${classification.flags.map(describePaintFlag).join(' and ')}, which cannot follow currentColor`,
        },
      };
    }
    const isRecolored =
      isForced ||
      (input.mode === ColorMode.AUTO && classification.kind === ColorKind.MONO);
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
    return {
      ok: true as const,
      color: isRecolored ? ColorKind.MONO : ColorKind.MULTICOLOR,
      hasReferences,
      attributes,
    };
  });

  if (!outcome.result.ok) return fail([outcome.result.error]);
  const { color, hasReferences, attributes } = outcome.result;
  return {
    ok: true,
    icon: {
      viewBox: viewBox.viewBox,
      isViewBoxDerived: viewBox.isDerived,
      color,
      delivery: toDelivery(color, hasReferences),
      licenses,
      attributes,
      inner: sliceInner(outcome.data),
    },
  };
};
