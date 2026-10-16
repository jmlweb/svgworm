import {
  optimize,
  type XastChild,
  type XastElement,
  type XastParent,
  type XastRoot,
} from 'svgo';

export type { XastChild, XastElement, XastParent, XastRoot };

export type ParseResult =
  | { readonly ok: true; readonly root: XastRoot }
  | { readonly ok: false; readonly message: string };

/** svgo names the document "<input>"; the diagnostic already names the file. */
export const describeParseError = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).replace(
    /^<input>:(\d+):(\d+): /,
    'line $1, column $2: ',
  );

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
    return { ok: false, message: describeParseError(error) };
  }
  return captured === undefined
    ? { ok: false, message: 'svgo did not produce a tree' }
    : { ok: true, root: captured };
};

export const SERIALIZE_OPTIONS = {
  pretty: false,
  eol: 'lf',
  finalNewline: false,
} as const;

/**
 * Runs `transform` on the parsed tree and serializes the result. svgo is the only
 * serializer available (LRN-015), so every tree mutation goes through this one helper.
 */
export const mutateSvgTree = <T>(
  text: string,
  transform: (root: XastRoot) => T,
): { readonly data: string; readonly result: T } => {
  let outcome: { readonly value: T } | undefined;
  const { data } = optimize(text, {
    multipass: false,
    js2svg: SERIALIZE_OPTIONS,
    plugins: [
      {
        name: 'svgworm-transform',
        fn: (root) => {
          outcome = { value: transform(root) };
          return {};
        },
      },
    ],
  });
  if (outcome === undefined) throw new Error('svgo did not run the transform');
  return { data, result: outcome.value };
};

// svgo trees are mutable by design and plugins edit them in place, so these two helpers are
// the only places that write to a node.
export const setAttribute = (
  element: XastElement,
  name: string,
  value: string,
): void => {
  // eslint-disable-next-line no-param-reassign
  element.attributes[name] = value;
};

export const removeAttribute = (element: XastElement, name: string): void => {
  Reflect.deleteProperty(element.attributes, name);
};

export const removeChild = (parent: XastParent, child: XastChild): void => {
  // eslint-disable-next-line no-param-reassign
  parent.children = parent.children.filter((candidate) => candidate !== child);
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

// The two conventions for a comment that must survive minification: `@license` (Google
// Closure, svgo's own `preserveComments`) and a leading `!` (UglifyJS, terser, Font Awesome).
const isLicenseComment = (value: string): boolean =>
  value.startsWith('@license') || value.startsWith('!');

/** Every license comment in the document, trimmed, unique and sorted by code point. */
export const collectLicenseComments = (root: XastRoot): readonly string[] => {
  const found = new Set<string>();
  const visit = (node: XastParent): void => {
    node.children.forEach((child) => {
      if (child.type === 'comment') {
        const value = child.value.trim();
        if (isLicenseComment(value)) found.add(value);
      } else if (isElement(child)) {
        visit(child);
      }
    });
  };
  visit(root);
  return [...found].toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
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
