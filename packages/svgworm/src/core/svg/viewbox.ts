import { DiagnosticCode, type Diagnostic } from '../errors.ts';

export type ViewBoxResult =
  | { readonly ok: true; readonly viewBox: string; readonly isDerived: boolean }
  | { readonly ok: false; readonly error: Diagnostic };

const PLAIN_LENGTH = /^\d+(?:\.\d+)?(?:px)?$/;

const toLength = (value: string | undefined): number | undefined => {
  const trimmed = value?.trim();
  if (trimmed === undefined || !PLAIN_LENGTH.test(trimmed)) return undefined;
  const length = Number.parseFloat(trimmed);
  return length > 0 ? length : undefined;
};

/**
 * A symbol without a viewBox is not scaled in any browser (ADR-0006, rule 6). A missing one
 * is derived from a plain numeric width and height, and anything else is an error.
 */
export const resolveViewBox = (
  attributes: Readonly<Record<string, string>>,
  file: string,
): ViewBoxResult => {
  const fail = (code: Diagnostic['code'], message: string): ViewBoxResult => ({
    ok: false,
    error: { code, file, message },
  });
  const raw = attributes['viewBox'];
  if (raw !== undefined) {
    const parts = raw
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const [, , width, height] = parts;
    if (
      parts.length !== 4 ||
      !parts.every(Number.isFinite) ||
      (width ?? 0) <= 0 ||
      (height ?? 0) <= 0
    ) {
      return fail(
        DiagnosticCode.INVALID_VIEWBOX,
        `viewBox="${raw}" must be four numbers with a positive width and height`,
      );
    }
    return { ok: true, viewBox: parts.map(String).join(' '), isDerived: false };
  }
  const width = toLength(attributes['width']);
  const height = toLength(attributes['height']);
  if (width === undefined || height === undefined) {
    return fail(
      DiagnosticCode.MISSING_VIEWBOX,
      'no viewBox, and width and height are not both plain numbers or px values, so a viewBox cannot be derived',
    );
  }
  return {
    ok: true,
    viewBox: `0 0 ${String(width)} ${String(height)}`,
    isDerived: true,
  };
};
