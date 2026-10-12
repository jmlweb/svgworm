import { DiagnosticCode, type Diagnostic } from '../errors.ts';
import {
  getDocumentElement,
  getTextContent,
  walkElements,
  type XastRoot,
} from './tree.ts';

const utf8 = new TextDecoder('utf-8', { fatal: true });

export type DecodeResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: Diagnostic };

export const decodeSource = (bytes: Uint8Array, file: string): DecodeResult => {
  try {
    return { ok: true, text: utf8.decode(bytes) };
  } catch {
    return {
      ok: false,
      error: {
        code: DiagnosticCode.INVALID_ENCODING,
        file,
        message: 'file is not valid UTF-8',
      },
    };
  }
};

// Anything a browser could load from outside the sprite is a reference we refuse (contract:
// "Must not contain scripts or external references").
const URL_FUNCTION = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

// Elements that run code or embed another document. Matched on the local name, because a
// prefixed `<x:script xmlns:x="…">` is still a script to the browser and svgo keeps it.
const FORBIDDEN_ELEMENTS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'audio',
  'video',
  'canvas',
  'handler',
  'listener',
]);

// SMIL can rewrite any attribute; these two retarget a link or add a handler at runtime.
const ANIMATING_ELEMENTS = new Set(['set', 'animate']);

// Only raster `data:` images are allowed in `href`; an SVG data URL is a document.
const RASTER_DATA_URL = /^data:image\/(?:png|jpe?g|gif|webp|avif)[;,]/i;

const localName = (name: string): string =>
  name.slice(name.lastIndexOf(':') + 1).toLowerCase();

// CSS lets `url(` be written as `\75rl(`; scan the decoded text, not the escaped one.
const unescapeCss = (value: string): string =>
  value.replaceAll(
    /\\([0-9a-f]{1,6})\s?|\\(.)/gi,
    (_, hex: string | undefined, char: string | undefined) => {
      if (hex === undefined) return char ?? '';
      const codePoint = Number.parseInt(hex, 16);
      return codePoint > 0x10ffff ? '�' : String.fromCodePoint(codePoint);
    },
  );

const findExternalUrls = (value: string): readonly string[] =>
  [...unescapeCss(value).matchAll(URL_FUNCTION)]
    .map((match) => (match[2] ?? '').trim())
    .filter((target) => !target.startsWith('#') && !/^data:/i.test(target));

const isExternalHref = (value: string): boolean => {
  const target = value.trim();
  return !target.startsWith('#') && !/^data:/i.test(target);
};

// Browsers skip control characters and whitespace inside a scheme (`java\tscript:`).
const runsScript = (value: string): boolean =>
  // oxlint-disable-next-line no-control-regex -- the control characters are the point
  /^(?:javascript|vbscript):/i.test(value.replaceAll(/[\s\u0000-\u001f]/g, ''));

/** Checks the raw tree of one input. Returns every problem found. */
export const validateTree = (
  root: XastRoot,
  file: string,
): readonly Diagnostic[] => {
  const document = getDocumentElement(root);
  if (document?.name !== 'svg') {
    return [
      {
        code: DiagnosticCode.NOT_SVG_ROOT,
        file,
        message:
          document === undefined
            ? 'file has no root element'
            : `root element is <${document.name}>, expected <svg>`,
      },
    ];
  }
  const errors: Diagnostic[] = [];
  const add = (code: Diagnostic['code'], message: string): void => {
    errors.push({ code, file, message });
  };
  const check = (owner: string, attribute: string, value: string): void => {
    if (runsScript(value)) {
      add(
        DiagnosticCode.FORBIDDEN_ATTRIBUTE,
        `<${owner}> ${attribute} runs script`,
      );
    }
    if (attribute === 'href' || attribute === 'xlink:href') {
      const target = value.trim();
      if (isExternalHref(target)) {
        add(
          DiagnosticCode.EXTERNAL_REFERENCE,
          `<${owner}> ${attribute}="${value}" points outside the file`,
        );
      } else if (/^data:/i.test(target) && !RASTER_DATA_URL.test(target)) {
        add(
          DiagnosticCode.FORBIDDEN_ATTRIBUTE,
          `<${owner}> ${attribute} is a data: URL that is not a PNG, JPEG, GIF, WebP or AVIF image`,
        );
      }
    }
    findExternalUrls(value).forEach((target) => {
      add(
        DiagnosticCode.EXTERNAL_REFERENCE,
        `<${owner}> ${attribute} references "${target}" outside the file`,
      );
    });
  };
  walkElements({ type: 'root', children: [document] }, (element) => {
    const local = localName(element.name);
    if (FORBIDDEN_ELEMENTS.has(local)) {
      add(DiagnosticCode.FORBIDDEN_ELEMENT, `<${element.name}> is not allowed`);
    }
    if (local === 'style') {
      findExternalUrls(getTextContent(element)).forEach((target) => {
        add(
          DiagnosticCode.EXTERNAL_REFERENCE,
          `<style> references "${target}" outside the file`,
        );
      });
    }
    if (ANIMATING_ELEMENTS.has(local)) {
      const target = (element.attributes['attributeName'] ?? '').trim();
      if (/^(?:xlink:)?href$/i.test(target) || /^on/i.test(target)) {
        add(
          DiagnosticCode.FORBIDDEN_ATTRIBUTE,
          `<${element.name}> animates ${target}, which could load or run something at runtime`,
        );
      }
    }
    Object.entries(element.attributes).forEach(([attribute, value]) => {
      if (/^on/i.test(attribute)) {
        add(
          DiagnosticCode.FORBIDDEN_ATTRIBUTE,
          `<${element.name}> ${attribute} is an event handler`,
        );
      }
      check(element.name, attribute, value);
    });
  });
  return errors;
};
