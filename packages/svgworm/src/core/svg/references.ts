import { ColorKind } from './color/classify.ts';
import { indexIds } from './color/paint.ts';
import {
  getDocumentElement,
  isElement,
  parseUrlId,
  removeAttribute,
  removeChild,
  type XastElement,
  type XastParent,
  type XastRoot,
  walkElements,
} from './tree.ts';

export const Delivery = { USE: 'use', IMG: 'img', MASK: 'mask' } as const;
export type Delivery = (typeof Delivery)[keyof typeof Delivery];

const URL_REFERENCE = /url\(\s*['"]?#/;

/**
 * True when the icon uses a `url(#…)` reference: paint servers, clip paths, masks, filters
 * and markers. WebKit resolves none of them through an external `<use>` (ADR-0006).
 * An internal `<use href="#…">` alone does not count: it renders everywhere.
 */
export const hasUrlReferences = (root: XastRoot): boolean => {
  let isFound = false;
  walkElements(root, (element) => {
    if (
      Object.values(element.attributes).some((value) =>
        URL_REFERENCE.test(value),
      )
    ) {
      isFound = true;
    }
  });
  return isFound;
};

export const toDelivery = (
  color: ColorKind,
  hasReferences: boolean,
): Delivery => {
  if (!hasReferences) return Delivery.USE;
  return color === ColorKind.MONO ? Delivery.MASK : Delivery.IMG;
};

const NUMBER = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const PATH_TOKEN = /([MmHhVvLlZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;

type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

const parseViewBox = (viewBox: string): Box | undefined => {
  const [x, y, width, height] = viewBox.trim().split(/\s+/).map(Number);
  return x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
    ? undefined
    : { x, y, width, height };
};

const covers = (shape: Box, view: Box): boolean =>
  shape.x <= view.x &&
  shape.y <= view.y &&
  shape.x + shape.width >= view.x + view.width &&
  shape.y + shape.height >= view.y + view.height;

const rectBox = (rect: XastElement): Box | undefined => {
  const a = rect.attributes;
  if (
    ['rx', 'ry', 'transform'].some(
      (name) => (a[name] ?? '0') !== '0' && a[name] !== undefined,
    )
  ) {
    return undefined;
  }
  const values = [a['x'] ?? '0', a['y'] ?? '0', a['width'], a['height']].map(
    (value) =>
      value !== undefined && new RegExp(`^${NUMBER.source}$`, 'i').test(value)
        ? Number(value)
        : Number.NaN,
  );
  const [x, y, width, height] = values;
  return [x, y, width, height].every(
    (n) => n !== undefined && Number.isFinite(n),
  )
    ? { x: x ?? 0, y: y ?? 0, width: width ?? 0, height: height ?? 0 }
    : undefined;
};

// Only M, H, V, L and Z can draw a rectangle that is axis-aligned and closed, so any other
// command makes the path "not a plain rectangle" and the clip stays.
const pathBox = (d: string): Box | undefined => {
  const tokens = [...d.matchAll(PATH_TOKEN)].map(
    (match) => match[1] ?? match[2] ?? '',
  );
  const points: (readonly [number, number])[] = [];
  let x = 0;
  let y = 0;
  let command = '';
  let pending: number[] = [];
  const arity: Readonly<Record<string, number>> = {
    M: 2,
    L: 2,
    H: 1,
    V: 1,
    Z: 0,
  };
  const apply = (): boolean => {
    const upper = command.toUpperCase();
    const isRelative = command !== upper;
    const [a = 0, b = 0] = pending;
    const previous: readonly [number, number] = [x, y];
    if (upper === 'M' || upper === 'L') {
      x = isRelative ? x + a : a;
      y = isRelative ? y + b : b;
    } else if (upper === 'H') {
      x = isRelative ? x + a : a;
    } else if (upper === 'V') {
      y = isRelative ? y + a : a;
    }
    if (upper === 'L' && x !== previous[0] && y !== previous[1]) return false;
    points.push([x, y]);
    pending = [];
    return true;
  };
  for (const token of tokens) {
    if (/^[A-Za-z]$/.test(token)) {
      if (pending.length > 0) return undefined;
      command = token;
      if (token.toUpperCase() === 'Z') points.push(points[0] ?? [x, y]);
      continue;
    }
    if (command === '') return undefined;
    pending.push(Number(token));
    if (pending.length === (arity[command.toUpperCase()] ?? 0)) {
      if (!apply()) return undefined;
      // Extra coordinate pairs after M are implicit L commands.
      if (command === 'M') command = 'L';
      else if (command === 'm') command = 'l';
    }
  }
  if (pending.length > 0 || points.length < 4) return undefined;
  const xs = new Set(points.map(([px]) => px));
  const ys = new Set(points.map(([, py]) => py));
  if (xs.size !== 2 || ys.size !== 2) return undefined;
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
};

const isFullViewBoxClip = (clip: XastElement, view: Box): boolean => {
  const units = clip.attributes['clipPathUnits'];
  if (
    (units !== undefined && units !== 'userSpaceOnUse') ||
    clip.attributes['transform'] !== undefined ||
    clip.attributes['clip-path'] !== undefined
  ) {
    return false;
  }
  const children = clip.children.filter(isElement);
  const [child] = children;
  if (
    children.length !== 1 ||
    child === undefined ||
    child.attributes['transform'] !== undefined
  ) {
    return false;
  }
  const box =
    child.name === 'rect'
      ? rectBox(child)
      : child.name === 'path' && child.attributes['d'] !== undefined
        ? pathBox(child.attributes['d'])
        : undefined;
  return box !== undefined && covers(box, view);
};

const isReferenced = (root: XastRoot, id: string): boolean => {
  let isFound = false;
  walkElements(root, (element) => {
    isFound ||= Object.entries(element.attributes).some(([name, value]) =>
      (name === 'href' || name === 'xlink:href') && value === `#${id}`
        ? true
        : value.includes(`#${id}`) &&
          (URL_REFERENCE.test(value) || name === 'begin' || name === 'end'),
    );
  });
  return isFound;
};

/**
 * Many Figma exports wrap content in a `clipPath` that covers the whole viewBox. It does
 * nothing, but WebKit ignores clips in external sprites, so the icon would be pushed to the
 * stack for no reason (ADR-0006, Consequences). Removes such clips and returns how many.
 */
export const dropNoopClips = (root: XastRoot, viewBox: string): number => {
  const view = parseViewBox(viewBox);
  const document = getDocumentElement(root);
  if (view === undefined || document === undefined) return 0;
  const ids = indexIds(root);
  const noop = new Set(
    [...ids.entries()]
      .filter(
        ([, element]) =>
          element.name === 'clipPath' && isFullViewBoxClip(element, view),
      )
      .map(([id]) => id),
  );
  if (noop.size === 0) return 0;

  // The clip lives in the user space of the element that references it, so it only equals
  // the viewBox when neither that element nor an ancestor moves or scales that space.
  const visit = (parent: XastParent, isTransformed: boolean): void => {
    parent.children.filter(isElement).forEach((element) => {
      const hasTransform =
        isTransformed || element.attributes['transform'] !== undefined;
      const clipId = parseUrlId(element.attributes['clip-path'] ?? '');
      if (
        clipId !== undefined &&
        noop.has(clipId) &&
        !hasTransform &&
        element.name !== 'svg'
      ) {
        removeAttribute(element, 'clip-path');
      }
      visit(element, hasTransform || element.name === 'svg');
    });
  };
  visit(document, false);

  let removed = 0;
  walkElements(document, (element, parent) => {
    const id = element.attributes['id'];
    if (
      element.name === 'clipPath' &&
      id !== undefined &&
      noop.has(id) &&
      !isReferenced(root, id)
    ) {
      removeChild(parent, element);
      removed += 1;
    }
  });
  walkElements(document, (element, parent) => {
    if (
      element.name === 'defs' &&
      element.children.every(
        (child) => child.type === 'text' || child.type === 'comment',
      )
    ) {
      removeChild(parent, element);
    }
  });
  return removed;
};
