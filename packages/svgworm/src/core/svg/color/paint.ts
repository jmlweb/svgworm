import {
  getHref,
  isElement,
  parseUrlId,
  walkElements,
  type XastElement,
  type XastRoot,
} from '../tree.ts';
import { CURRENT_COLOR, isNone, normalizeColor } from './colors.ts';

export const PaintAttr = {
  FILL: 'fill',
  STROKE: 'stroke',
  STOP_COLOR: 'stop-color',
  FLOOD_COLOR: 'flood-color',
  LIGHTING_COLOR: 'lighting-color',
} as const;
export type PaintAttr = (typeof PaintAttr)[keyof typeof PaintAttr];

export const PaintFlag = { IMAGE: 'image', PATTERN: 'pattern' } as const;
export type PaintFlag = (typeof PaintFlag)[keyof typeof PaintFlag];

/** One effective paint value. `node` is null for the SVG default (a black fill). */
export type PaintSite = {
  readonly node: XastElement | null;
  readonly attr: PaintAttr;
  readonly color: string;
};

export type PaintAnalysis = {
  readonly sites: readonly PaintSite[];
  readonly flags: ReadonlySet<PaintFlag>;
};

const SHAPES = new Set([
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'textPath',
]);

// Their content is either geometry only or rendered only when referenced.
const NON_RENDERED = new Set([
  'defs',
  'clipPath',
  'mask',
  'symbol',
  'marker',
  'pattern',
  'linearGradient',
  'radialGradient',
  'filter',
  'style',
  'script',
  'title',
  'desc',
  'metadata',
]);

type PaintSource = {
  readonly value: string;
  readonly owner: XastElement | null;
};

type State = {
  readonly fill: PaintSource;
  readonly stroke: PaintSource;
  readonly color: string;
  readonly viaUse: boolean;
  readonly fillOpacity: string | undefined;
  readonly strokeOpacity: string | undefined;
  readonly strokeWidth: string | undefined;
};

const numberOr = (value: string | undefined, fallback: number): number =>
  value === undefined ? fallback : Number(value);

export const indexIds = (root: XastRoot): ReadonlyMap<string, XastElement> => {
  const ids = new Map<string, XastElement>();
  walkElements(root, (element) => {
    const id = element.attributes['id'];
    if (id !== undefined && !ids.has(id)) ids.set(id, element);
  });
  return ids;
};

const hrefTarget = (element: XastElement): string | undefined =>
  /^#(.+)$/.exec(getHref(element) ?? '')?.[1];

const gradientStops = (
  ids: ReadonlyMap<string, XastElement>,
  gradient: XastElement,
  seen: ReadonlySet<string> = new Set(),
): readonly XastElement[] => {
  const stops = gradient.children.filter(
    (child): child is XastElement => isElement(child) && child.name === 'stop',
  );
  if (stops.length > 0) return stops;
  const parentId = hrefTarget(gradient);
  const parent = parentId === undefined ? undefined : ids.get(parentId);
  if (parentId === undefined || parent === undefined || seen.has(parentId)) {
    return [];
  }
  return gradientStops(ids, parent, new Set([...seen, parentId]));
};

/**
 * Walks everything that actually renders (following `<use>`, paint servers and filters)
 * and lists every effective paint value, as the TSK-003 spike specified (ADR-0004).
 */
export const collectPaints = (root: XastRoot): PaintAnalysis => {
  const ids = indexIds(root);
  const sites: PaintSite[] = [];
  const flags = new Set<PaintFlag>();
  const addSite = (
    node: XastElement | null,
    attr: PaintAttr,
    color: string,
    state: State,
  ): void => {
    sites.push({
      node,
      attr,
      color: color === CURRENT_COLOR ? state.color : color,
    });
  };

  const resolvePaint = (
    source: PaintSource,
    attr: PaintAttr,
    value: string,
    state: State,
  ): void => {
    if (isNone(value)) return;
    const id = parseUrlId(value);
    if (id !== undefined) {
      const target = ids.get(id);
      if (target === undefined) {
        const fallback = value.replace(/^url\([^)]*\)\s*/, '');
        if (fallback !== '') resolvePaint(source, attr, fallback, state);
        return;
      }
      if (target.name === 'pattern') {
        flags.add(PaintFlag.PATTERN);
        return;
      }
      if (
        target.name === 'linearGradient' ||
        target.name === 'radialGradient'
      ) {
        // A transparent stop still tints the interpolation toward its color (LRN-005), so it
        // only drops out when every stop is transparent.
        const stops = gradientStops(ids, target);
        if (
          stops.every(
            (stop) => numberOr(stop.attributes['stop-opacity'], 1) === 0,
          )
        ) {
          return;
        }
        stops.forEach((stop) => {
          addSite(
            stop,
            PaintAttr.STOP_COLOR,
            normalizeColor(stop.attributes['stop-color'] ?? 'black'),
            state,
          );
        });
      }
      return;
    }
    addSite(source.owner, attr, normalizeColor(value), state);
  };

  const visitFilter = (filter: XastElement, state: State): void => {
    filter.children.filter(isElement).forEach((child) => {
      if (child.name === 'feFlood' || child.name === 'feDropShadow') {
        if (numberOr(child.attributes['flood-opacity'], 1) === 0) return;
        addSite(
          child,
          PaintAttr.FLOOD_COLOR,
          normalizeColor(child.attributes['flood-color'] ?? 'black'),
          state,
        );
      }
      if (
        child.name === 'feDiffuseLighting' ||
        child.name === 'feSpecularLighting'
      ) {
        addSite(
          child,
          PaintAttr.LIGHTING_COLOR,
          normalizeColor(child.attributes['lighting-color'] ?? 'white'),
          state,
        );
      }
      if (child.name === 'feImage') flags.add(PaintFlag.IMAGE);
    });
  };

  const visit = (
    node: XastElement,
    inherited: State,
    useStack: ReadonlySet<string>,
  ): void => {
    const attrs = node.attributes;
    if (attrs['display'] === 'none') return;
    if (NON_RENDERED.has(node.name) && !inherited.viaUse) return;
    if (node.name === 'image' || node.name === 'foreignObject') {
      flags.add(PaintFlag.IMAGE);
      return;
    }

    const colorAttr = attrs['color'];
    const ownColor =
      colorAttr !== undefined && colorAttr !== 'inherit'
        ? normalizeColor(colorAttr)
        : CURRENT_COLOR;
    const fillAttr = attrs['fill'];
    const strokeAttr = attrs['stroke'];
    const state: State = {
      color: ownColor === CURRENT_COLOR ? inherited.color : ownColor,
      viaUse: false,
      fill:
        fillAttr !== undefined && fillAttr !== 'inherit'
          ? { value: fillAttr, owner: node }
          : inherited.fill,
      stroke:
        strokeAttr !== undefined && strokeAttr !== 'inherit'
          ? { value: strokeAttr, owner: node }
          : inherited.stroke,
      fillOpacity: attrs['fill-opacity'] ?? inherited.fillOpacity,
      strokeOpacity: attrs['stroke-opacity'] ?? inherited.strokeOpacity,
      strokeWidth: attrs['stroke-width'] ?? inherited.strokeWidth,
    };

    const filterId =
      attrs['filter'] === undefined ? undefined : parseUrlId(attrs['filter']);
    const filter = filterId === undefined ? undefined : ids.get(filterId);
    if (filter !== undefined) visitFilter(filter, state);

    if (
      SHAPES.has(node.name) &&
      attrs['opacity'] !== '0' &&
      attrs['visibility'] !== 'hidden'
    ) {
      // A line has no area, so its fill never paints.
      if (node.name !== 'line' && numberOr(state.fillOpacity, 1) !== 0) {
        resolvePaint(state.fill, PaintAttr.FILL, state.fill.value, state);
      }
      if (
        numberOr(state.strokeOpacity, 1) !== 0 &&
        numberOr(state.strokeWidth, 1) !== 0
      ) {
        resolvePaint(state.stroke, PaintAttr.STROKE, state.stroke.value, state);
      }
    }

    if (node.name === 'use') {
      const id = hrefTarget(node);
      const target = id === undefined ? undefined : ids.get(id);
      if (id !== undefined && target !== undefined && !useStack.has(id)) {
        visit(target, { ...state, viaUse: true }, new Set([...useStack, id]));
      }
      return;
    }
    node.children.filter(isElement).forEach((child) => {
      visit(child, state, useStack);
    });
  };

  const svg = root.children.find(isElement);
  if (svg !== undefined) {
    // `owner: null` marks the SVG default (black fill), which the rewrite makes explicit.
    visit(
      svg,
      {
        fill: { value: 'black', owner: null },
        stroke: { value: 'none', owner: null },
        color: CURRENT_COLOR,
        viaUse: false,
        fillOpacity: undefined,
        strokeOpacity: undefined,
        strokeWidth: undefined,
      },
      new Set(),
    );
  }
  return { sites, flags };
};
