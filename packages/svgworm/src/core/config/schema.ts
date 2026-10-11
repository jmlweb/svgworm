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

/**
 * publicPath rules of the output contract. `/` alone is the site root and normalizes to
 * the empty string, so a URL is always `"/" + file`, never `//file`.
 */
export const normalizePublicPath = (raw: string): PublicPathResult => {
  const fail = (message: string): PublicPathResult => ({ ok: false, message });
  if (!raw.startsWith('/')) {
    return fail(
      'must start with "/": sprites must be same-origin, so relative and http(s) URLs are not allowed',
    );
  }
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

export const configSchema = z
  .strictObject({
    $schema: z.string().optional(),
    sources: z
      .array(z.string().min(1))
      .min(1)
      .describe('Folders that contain the SVG files, relative to the config.'),
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
        'URL path the sprites are served from, same-origin. Default "/icons".',
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
  })
  .superRefine((value, context) => {
    if (value.publicPath === undefined) return;
    const result = normalizePublicPath(value.publicPath);
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

/** JSON Schema of the config file, for editors and agents (R-55). */
export const getConfigJsonSchema = (): unknown =>
  z.toJSONSchema(configSchema, { io: 'input', target: 'draft-2020-12' });
