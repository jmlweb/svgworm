import { z } from 'zod';

export const ColorMode = {
  AUTO: 'auto',
  MONO: 'mono',
  PRESERVE: 'preserve',
} as const;
export type ColorMode = (typeof ColorMode)[keyof typeof ColorMode];

export type PublicPathResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly message: string };

const PUBLIC_PATH_SEGMENT = /^[A-Za-z0-9\-_.~!$&'()*+,;=:@]+$/;

export const CrossOrigin = {
  NONE: 'none',
  INJECT: 'inject',
} as const;
export type CrossOrigin = (typeof CrossOrigin)[keyof typeof CrossOrigin];

const normalizePath = (raw: string): PublicPathResult => {
  const fail = (message: string): PublicPathResult => ({ ok: false, message });
  if (raw === '/') return { ok: true, value: '' };
  const value = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  if (/[?#\\\s]/.test(value)) {
    return fail('must not contain "?", "#", "\\" or whitespace');
  }
  if (value.includes('%')) return fail('must not contain "%"');
  const segments = value.split('/').slice(1);
  if (segments.some((segment) => segment === '')) {
    return fail('must not contain empty segments ("//")');
  }
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return fail('must not contain "." or ".." segments');
  }
  if (!segments.every((segment) => PUBLIC_PATH_SEGMENT.test(segment))) {
    return fail('must contain only ASCII URL path characters');
  }
  return { ok: true, value };
};

const HTTPS_ORIGIN = /^https:\/\/([^/?#]*)(.*)$/i;

/**
 * publicPath rules of the output contract. `/` alone is the site root and normalizes to
 * the empty string, so a URL is always `"/" + file`, never `//file`. An `https:` origin is
 * allowed only with `crossOrigin: "inject"` (ADR-0027), because browsers block a
 * cross-origin `<use>`.
 */
export const normalizePublicPath = (
  raw: string,
  options: { readonly crossOrigin?: CrossOrigin | undefined } = {},
): PublicPathResult => {
  const fail = (message: string): PublicPathResult => ({ ok: false, message });
  const isInject = options.crossOrigin === CrossOrigin.INJECT;
  const absolute = HTTPS_ORIGIN.exec(raw);
  if (absolute !== null) {
    if (!isInject) {
      return fail(
        'is an absolute URL: sprites must be same-origin unless "crossOrigin": "inject" is set (it loads them with a small script, ADR-0027)',
      );
    }
    const [, host = '', path = ''] = absolute;
    if (host === '' || host.includes('@') || /[\\\s%]/.test(host)) {
      return fail('must be https://<host>[:port]/<path> with no user info');
    }
    let origin: string;
    try {
      origin = new URL(`https://${host}`).origin;
    } catch {
      return fail(`has an invalid host "${host}"`);
    }
    if (path === '') return { ok: true, value: origin };
    const rest = normalizePath(path);
    return rest.ok ? { ok: true, value: `${origin}${rest.value}` } : rest;
  }
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return fail(
      isInject
        ? 'must be a path starting with "/" or an https:// URL'
        : 'must start with "/": sprites must be same-origin, so relative and http(s) URLs are not allowed',
    );
  }
  return normalizePath(raw);
};

const colorRuleSchema = z.strictObject({
  match: z
    .string()
    .min(1)
    .describe(
      'Glob matched against the icon public name (NFC, "/" separators). The last matching rule wins.',
    ),
  color: z
    .enum([ColorMode.AUTO, ColorMode.MONO, ColorMode.PRESERVE])
    .describe(
      '"auto" classifies the icon, "mono" forces currentColor, "preserve" keeps the colors.',
    ),
});

const GLOB_HELP =
  'Globs on the path inside dir with "/" separators: "house.svg", "arrows/*.svg", "**/arrow-*.svg".';

const sourceObjectSchema = z.strictObject({
  dir: z
    .string()
    .min(1)
    .describe(
      'Folder with the SVG files, relative to the config. It may point into node_modules.',
    ),
  include: z
    .array(z.string().min(1))
    .min(1)
    .optional()
    .describe(
      `Only files that match one of these globs are icons. Default: every .svg file. ${GLOB_HELP}`,
    ),
  exclude: z
    .array(z.string().min(1))
    .optional()
    .describe(`Files to leave out, applied after include. ${GLOB_HELP}`),
});

export const configSchema = z
  .strictObject({
    $schema: z.string().optional(),
    sources: z
      .array(z.union([z.string().min(1), sourceObjectSchema]))
      .min(1)
      .describe(
        'Folders that contain the SVG files, relative to the config: a path, or { "dir", "include", "exclude" } to pick files by glob (for example from an icon package in node_modules).',
      ),
    outDir: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Where sprite files are written. Default "public/icons". Needs publicPath when set.',
      ),
    publicPath: z
      .string()
      .optional()
      .describe(
        'URL path the sprites are served from, same-origin. Default "/icons". An https:// URL needs "crossOrigin": "inject".',
      ),
    moduleDir: z
      .string()
      .min(1)
      .optional()
      .describe('Where the manifest and types are written. Default "svgworm".'),
    flatten: z
      .boolean()
      .optional()
      .describe('Drop folder names from icon names. Default false.'),
    color: z
      .array(colorRuleSchema)
      .optional()
      .describe('Per-icon color overrides. The last matching rule wins.'),
    crossOrigin: z
      .enum([CrossOrigin.NONE, CrossOrigin.INJECT])
      .optional()
      .describe(
        'Default "none": sprites are served same-origin with zero client JS. "inject" allows an https:// publicPath on another origin (a CDN) and emits a small loader script that fetches the sprite with CORS and integrity and injects it (ADR-0027). Icons need JS in that mode.',
      ),
  })
  .superRefine((value, context) => {
    if (value.publicPath === undefined) return;
    const result = normalizePublicPath(value.publicPath, {
      crossOrigin: value.crossOrigin,
    });
    if (!result.ok) {
      context.addIssue({
        code: 'custom',
        path: ['publicPath'],
        message: result.message,
      });
    }
  });

export type ConfigInput = z.input<typeof configSchema>;
export type ColorRule = z.output<typeof colorRuleSchema>;

/** A source folder with its optional file filters, as `sources` entries normalize to. */
export type SourceSpec = z.output<typeof sourceObjectSchema>;

export const toSourceSpec = (source: string | SourceSpec): SourceSpec =>
  typeof source === 'string' ? { dir: source } : source;

/** JSON Schema of the config file, for editors and agents (R-55). */
export const getConfigJsonSchema = (): unknown =>
  z.toJSONSchema(configSchema, { io: 'input', target: 'draft-2020-12' });
