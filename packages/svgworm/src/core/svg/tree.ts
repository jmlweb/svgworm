import { optimize, type XastChild, type XastElement, type XastParent, type XastRoot } from 'svgo';

export type { XastChild, XastElement, XastParent, XastRoot };

export type ParseResult =
  | { readonly ok: true; readonly root: XastRoot }
  | { readonly ok: false; readonly message: string };

/**
 * svgo 4 has no public parse function (LRN-015). A capture plugin on a no-op run hands us
 * the parsed tree, and the parser's error is the only XML validation we need.
 */
export const parseSvgTree = (text: string): ParseResult => {
  let captured: XastRoot | undefined;
  try {
    optimize(text, {
      plugins: [
        {
          name: 'svgworm-capture',
          fn: (root) => {
            captured = root;
            return {};
          },
        },
      ],
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
  return captured === undefined
    ? { ok: false, message: 'svgo did not produce a tree' }
    : { ok: true, root: captured };
};

export const isElement = (node: XastChild | XastRoot): node is XastElement =>
  node.type === 'element';

/** The first element child of the document, whatever its name. */
export const getDocumentElement = (root: XastRoot): XastElement | undefined =>
  root.children.find(isElement);

export const getSvgRoot = (root: XastRoot): XastElement | undefined => {
  const element = getDocumentElement(root);
  return element?.name === 'svg' ? element : undefined;
};

/** Depth-first, document order. */
export const walkElements = (
  node: XastParent,
  visit: (element: XastElement, parent: XastParent) => void,
): void => {
  node.children.forEach((child) => {
    if (!isElement(child)) return;
    visit(child, node);
    walkElements(child, visit);
  });
};

export const getHref = (element: XastElement): string | undefined =>
  element.attributes['href'] ?? element.attributes['xlink:href'];

/** The id of `url(#id)` (with optional quotes), or undefined for anything else. */
export const parseUrlId = (value: string): string | undefined =>
  /^\s*url\(\s*(['"]?)#([^'")]+)\1\s*\)/.exec(value)?.[2];

export const getTextContent = (element: XastElement): string =>
  element.children
    .map((child) =>
      child.type === 'text' || child.type === 'cdata' ? child.value : '',
    )
    .join('');
