export const DiagnosticCode = {
  INVALID_PATH_ENCODING: 'path/invalid-encoding',
  NOT_SVG_FILE: 'path/not-svg',
  EMPTY_NAME: 'name/empty-segment',
  NAME_COLLISION: 'name/collision',
  CASE_FOLDED: 'name/case-folded',
  INVALID_ENCODING: 'svg/invalid-encoding',
  INVALID_XML: 'svg/invalid-xml',
  NOT_SVG_ROOT: 'svg/not-svg-root',
  FORBIDDEN_ELEMENT: 'svg/forbidden-element',
  FORBIDDEN_ATTRIBUTE: 'svg/forbidden-attribute',
  EXTERNAL_REFERENCE: 'svg/external-reference',
  UNSCOPABLE_STYLE: 'style/unscopable',
  LEFTOVER_STYLE: 'style/leftover',
  MISSING_VIEWBOX: 'viewbox/underivable',
  VIEWBOX_DERIVED: 'viewbox/derived',
  INVALID_VIEWBOX: 'viewbox/invalid',
  FORCED_MONO_UNSAFE: 'color/forced-mono-unsafe',
  UNREADABLE_FILE: 'io/unreadable',
  NO_ICONS: 'build/no-icons',
} as const;
export type DiagnosticCode =
  (typeof DiagnosticCode)[keyof typeof DiagnosticCode];

/** A problem found in one input. `file` is the NFC, `/`-separated path used for sorting. */
export type Diagnostic = {
  readonly code: DiagnosticCode;
  readonly file: string;
  readonly message: string;
};

/** Raised for invalid configuration. The CLI maps it to exit code 2. */
export class ConfigError extends Error {
  readonly issues: readonly string[];

  constructor(message: string, issues: readonly string[] = []) {
    super(message);
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

/** Raised when a build fails for an expected reason (invalid input, collisions, no icons). */
export class BuildFailedError extends Error {
  readonly errors: readonly Diagnostic[];

  constructor(errors: readonly Diagnostic[]) {
    super(`Build failed with ${String(errors.length)} error(s)`);
    this.name = 'BuildFailedError';
    this.errors = errors;
  }
}
