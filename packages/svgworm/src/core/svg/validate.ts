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

const findExternalUrls = (value: string): readonly string[] =>
  [...value.matchAll(URL_FUNCTION)]
    .map((match) => (match[2] ?? '').trim())
    .filter((target) => !target.startsWith('#') && !/^data:/i.test(target));

const isExternalHref = (value: string): boolean => {
  const target = value.trim();
  return !target.startsWith('#') && !/^data:/i.test(target);
};

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
    if (/^\s*javascript:/i.test(value)) {
      add(
        DiagnosticCode.FORBIDDEN_ATTRIBUTE,
        `<${owner}> ${attribute} runs script`,
      );
    }
    if (
      (attribute === 'href' || attribute === 'xlink:href') &&
      isExternalHref(value)
    ) {
      add(
        DiagnosticCode.EXTERNAL_REFERENCE,
        `<${owner}> ${attribute}="${value}" points outside the file`,
      );
    }
    findExternalUrls(value).forEach((target) => {
      add(
        DiagnosticCode.EXTERNAL_REFERENCE,
        `<${owner}> ${attribute} references "${target}" outside the file`,
      );
    });
  };
  walkElements({ type: 'root', children: [document] }, (element) => {
    if (element.name === 'script') {
      add(DiagnosticCode.FORBIDDEN_ELEMENT, '<script> is not allowed');
    }
    if (element.name === 'style') {
      findExternalUrls(getTextContent(element)).forEach((target) => {
        add(
          DiagnosticCode.EXTERNAL_REFERENCE,
          `<style> references "${target}" outside the file`,
        );
      });
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
