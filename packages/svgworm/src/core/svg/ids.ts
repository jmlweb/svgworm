import { toInternalId } from '../naming.ts';
import {
  getDocumentElement,
  removeAttribute,
  setAttribute,
  walkElements,
  type XastElement,
  type XastRoot,
} from './tree.ts';

const URL_REFERENCE = /url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g;
// SMIL timing: `id.end`, `id.begin+1s`, possibly in a `;` list.
const TIMING_REFERENCE = /^(\s*)([^\s.;+-]+)\.(?=[A-Za-z])/;

/**
 * Renames every id of the icon to `<symbolId>_<n>` (n from 1, in document order), so ids
 * never collide across icons and never depend on how the source named them (LRN-012). The
 * root `<svg>` is not numbered: it becomes the symbol. Returns the old to new mapping.
 */
export const renameIds = (
  root: XastRoot,
  symbolId: string,
): ReadonlyMap<string, string> => {
  const document = getDocumentElement(root);
  const mapping = new Map<string, string>();
  const elements: XastElement[] = [];
  let ordinal = 0;
  if (document === undefined) return mapping;

  walkElements(document, (element) => {
    elements.push(element);
    const id = element.attributes['id'];
    if (id === undefined) return;
    ordinal += 1;
    const renamed = toInternalId(symbolId, ordinal);
    // The first element wins a duplicate id, as it does in a browser.
    if (!mapping.has(id)) mapping.set(id, renamed);
    setAttribute(element, 'id', renamed);
  });
  removeAttribute(document, 'id');

  const renameReference = (id: string): string => mapping.get(id) ?? id;
  [document, ...elements].forEach((element) => {
    Object.entries(element.attributes).forEach(([name, value]) => {
      if (name === 'id') return;
      if (name === 'href' || name === 'xlink:href') {
        const target = /^#(.+)$/.exec(value)?.[1];
        if (target !== undefined)
          setAttribute(element, name, `#${renameReference(target)}`);
        return;
      }
      if (name === 'begin' || name === 'end') {
        setAttribute(
          element,
          name,
          value
            .split(';')
            .map((part) =>
              part.replace(
                TIMING_REFERENCE,
                (_match, space: string, id: string) =>
                  mapping.has(id)
                    ? `${space}${renameReference(id)}.`
                    : `${space}${id}.`,
              ),
            )
            .join(';'),
        );
        return;
      }
      if (value.includes('url(')) {
        setAttribute(
          element,
          name,
          value.replace(
            URL_REFERENCE,
            (_match, _quote: string, id: string) =>
              `url(#${renameReference(id)})`,
          ),
        );
      }
    });
  });
  return mapping;
};
