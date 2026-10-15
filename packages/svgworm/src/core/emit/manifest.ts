import type { ColorKind } from '../svg/color/classify.ts';
import type { Delivery } from '../svg/references.ts';

export const MANIFEST_VERSION = 1;
/** Only `crossOrigin: "inject"` output uses it (ADR-0027). */
export const INJECT_MANIFEST_VERSION = 2;

export type ManifestIcon = {
  readonly name: string;
  readonly id: string;
  readonly viewBox: string;
  readonly color: ColorKind;
  readonly delivery: Delivery;
};

export type ManifestFile = { readonly file: string; readonly url: string };

export type ManifestIntegrityFile = ManifestFile & {
  readonly integrity: string;
};

export type ManifestInput = {
  readonly icons: readonly ManifestIcon[];
  readonly sprite: ManifestFile | null;
  readonly stack: ManifestFile | null;
  /** Present only with `crossOrigin: "inject"`, which makes the manifest version 2. */
  readonly inject?: {
    /** sha384 of the sprite, `null` when there is no sprite. */
    readonly spriteIntegrity: string | null;
    readonly loader: ManifestIntegrityFile | null;
  };
};

/**
 * Serializes the manifest by hand. A plain object would reorder integer-like names
 * ("10", "2") ahead of the others, but the contract orders keys by code point, so the
 * caller's order must survive.
 */
export const serializeManifest = (input: ManifestInput): string => {
  const quote = (value: string): string => JSON.stringify(value);
  const file = (
    value: ManifestFile | null,
    pad: string,
    integrity?: string | null,
  ): string =>
    value === null
      ? 'null'
      : `{\n${pad}  "file": ${quote(value.file)},\n${pad}  "url": ${quote(value.url)}` +
        (integrity == null
          ? ''
          : `,\n${pad}  "integrity": ${quote(integrity)}`) +
        `\n${pad}}`;
  const icons = input.icons
    .map(
      (icon) =>
        `    ${quote(icon.name)}: {\n` +
        `      "sprite": "icons",\n` +
        `      "id": ${quote(icon.id)},\n` +
        `      "viewBox": ${quote(icon.viewBox)},\n` +
        `      "color": ${quote(icon.color)},\n` +
        `      "delivery": ${quote(icon.delivery)}\n` +
        `    }`,
    )
    .join(',\n');
  const { inject } = input;
  const head =
    inject === undefined
      ? `  "version": ${String(MANIFEST_VERSION)},\n`
      : `  "version": ${String(INJECT_MANIFEST_VERSION)},\n  "crossOrigin": "inject",\n`;
  const loader =
    inject === undefined
      ? ''
      : `,\n      "loader": ${file(inject.loader, '      ', inject.loader?.integrity)}`;
  return (
    `{\n${head}  "sprites": {\n    "icons": {\n` +
    `      "sprite": ${file(input.sprite, '      ', inject?.spriteIntegrity)},\n` +
    `      "stack": ${file(input.stack, '      ')}${loader}\n    }\n  },\n` +
    `  "icons": ${icons === '' ? '{}' : `{\n${icons}\n  }`}\n}`
  );
};

/** `publicPath` is already normalized: no trailing slash, and "" for the site root. */
export const toFileReference = (
  fileName: string,
  publicPath: string,
): ManifestFile => ({ file: fileName, url: `${publicPath}/${fileName}` });
