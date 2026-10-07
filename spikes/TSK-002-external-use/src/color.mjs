// Per-icon color classification and mono rewrite. Spike code: evidence, not product.
import { optimize } from 'svgo';

export const CURRENT = 'currentColor';

const NAMED = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff',
  yellow: '#ffff00', gray: '#808080', grey: '#808080', orange: '#ffa500', purple: '#800080',
  silver: '#c0c0c0', navy: '#000080', maroon: '#800000', lime: '#00ff00', aqua: '#00ffff',
  cyan: '#00ffff', fuchsia: '#ff00ff', magenta: '#ff00ff', teal: '#008080', olive: '#808000',
  darkgray: '#a9a9a9', darkgrey: '#a9a9a9', lightgray: '#d3d3d3', lightgrey: '#d3d3d3',
  dimgray: '#696969', dimgrey: '#696969', gold: '#ffd700', pink: '#ffc0cb', brown: '#a52a2a'
};

const SHAPES = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath']);
// Content of these is either geometry-only or only rendered when referenced.
const NON_RENDERED = new Set([
  'defs', 'clipPath', 'mask', 'symbol', 'marker', 'pattern', 'linearGradient', 'radialGradient',
  'filter', 'style', 'script', 'title', 'desc', 'metadata'
]);
const PAINT_ATTRS = ['fill', 'stroke'];

export const normalizeColor = raw => {
  const value = raw.trim().toLowerCase();
  if (value === 'currentcolor') return CURRENT;
  if (NAMED[value]) return NAMED[value];
  const short = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  const long = value.match(/^#([0-9a-f]{6})(ff)?$/);
  if (long) return `#${long[1]}`;
  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*(1|1\.0+|100%))?\s*\)$/);
  if (rgb) return `#${rgb.slice(1, 4).map(n => Number(n).toString(16).padStart(2, '0')).join('')}`;
  return value;
};

const isNone = value => value === 'none' || value === 'transparent';
const urlId = value => value.match(/^url\(\s*['"]?#([^'")]+)['"]?\s*\)/)?.[1];
const hrefId = node => (node.attributes.href ?? node.attributes['xlink:href'])?.match(/^#(.+)$/)?.[1];

// Inline <style> rules and style="" declarations into presentation attributes so later
// passes read colors from one place.
export const normalizeStyles = svg =>
  optimize(svg, {
    multipass: false,
    plugins: [
      { name: 'inlineStyles', params: { onlyMatchedOnce: false, removeMatchedSelectors: true } },
      'convertStyleToAttrs'
    ]
  }).data;

const parseTree = svg => {
  let tree;
  optimize(svg, {
    plugins: [{ name: 'capture', fn: root => { tree = root; return {}; } }]
  });
  return tree;
};

const indexIds = root => {
  const ids = new Map();
  const visit = node => {
    if (node.type !== 'element' && node.type !== 'root') return;
    if (node.attributes?.id) ids.set(node.attributes.id, node);
    node.children.forEach(visit);
  };
  visit(root);
  return ids;
};

const gradientStops = (ids, node, seen = new Set()) => {
  const stops = node.children.filter(child => child.type === 'element' && child.name === 'stop');
  if (stops.length > 0) return stops;
  const parentId = hrefId(node);
  if (!parentId || seen.has(parentId) || !ids.get(parentId)) return [];
  return gradientStops(ids, ids.get(parentId), new Set([...seen, parentId]));
};

// Walks everything that actually renders, following <use>, paint servers and filters.
// Calls onPaint(node, attr, value) for every effective paint value.
const walkRendered = (root, ids, onPaint, onFlag) => {
  const resolvePaint = (node, attr, value, state) => {
    if (isNone(value)) return;
    const id = urlId(value);
    if (id) {
      const target = ids.get(id);
      if (!target) {
        const fallback = value.replace(/^url\([^)]*\)\s*/, '');
        if (fallback) resolvePaint(node, attr, fallback, state);
        return;
      }
      if (target.name === 'pattern') return onFlag('pattern');
      if (target.name === 'linearGradient' || target.name === 'radialGradient') {
        // A transparent stop still tints the interpolation toward its color, so it only
        // drops out when every stop is transparent.
        const stops = gradientStops(ids, target);
        if (stops.every(stop => Number(stop.attributes['stop-opacity'] ?? 1) === 0)) return;
        stops.forEach(stop => {
          const raw = stop.attributes['stop-color'] ?? 'black';
          const color = normalizeColor(raw);
          onPaint(stop, 'stop-color', color === CURRENT ? state.color : color);
        });
        return;
      }
      return;
    }
    const color = normalizeColor(value);
    onPaint(node, attr, color === CURRENT ? state.color : color);
  };

  const visitFilter = (filterNode, state) => {
    filterNode.children.forEach(child => {
      if (child.type !== 'element') return;
      if (child.name === 'feFlood' || child.name === 'feDropShadow') {
        if (Number(child.attributes['flood-opacity'] ?? 1) === 0) return;
        const color = normalizeColor(child.attributes['flood-color'] ?? 'black');
        onPaint(child, 'flood-color', color === CURRENT ? state.color : color);
      }
      if (child.name === 'feDiffuseLighting' || child.name === 'feSpecularLighting') {
        onPaint(child, 'lighting-color', normalizeColor(child.attributes['lighting-color'] ?? 'white'));
      }
      if (child.name === 'feImage') onFlag('image');
    });
  };

  const visit = (node, state, useStack) => {
    if (node.type !== 'element') return;
    const attrs = node.attributes;
    if (attrs.display === 'none') return;
    if (NON_RENDERED.has(node.name) && !state.viaUse) return;
    if (node.name === 'image' || node.name === 'foreignObject') return onFlag('image');

    const next = { ...state, viaUse: false };
    if (attrs.color && attrs.color !== 'inherit') {
      const color = normalizeColor(attrs.color);
      if (color !== CURRENT) next.color = color;
    }
    PAINT_ATTRS.forEach(attr => {
      if (attrs[attr] && attrs[attr] !== 'inherit') next[attr] = { value: attrs[attr], owner: node };
    });
    ['fill-opacity', 'stroke-opacity', 'stroke-width'].forEach(attr => {
      if (attrs[attr] !== undefined) next[attr] = attrs[attr];
    });

    if (attrs.filter) {
      const filterNode = ids.get(urlId(attrs.filter));
      if (filterNode) visitFilter(filterNode, next);
    }

    if (SHAPES.has(node.name) && attrs.opacity !== '0' && attrs.visibility !== 'hidden') {
      const hasArea = node.name !== 'line';
      if (hasArea && Number(next['fill-opacity'] ?? 1) !== 0) {
        resolvePaint(next.fill.owner, 'fill', next.fill.value, next);
      }
      if (Number(next['stroke-opacity'] ?? 1) !== 0 && Number(next['stroke-width'] ?? 1) !== 0) {
        resolvePaint(next.stroke.owner, 'stroke', next.stroke.value, next);
      }
    }

    if (node.name === 'use') {
      const id = hrefId(node);
      const target = id && ids.get(id);
      if (target && !useStack.has(id)) visit(target, { ...next, viaUse: true }, new Set([...useStack, id]));
      return;
    }
    node.children.forEach(child => visit(child, next, useStack));
  };

  const rootSvg = root.children.find(child => child.type === 'element' && child.name === 'svg');
  // `owner: null` marks the SVG default (black fill), which the rewrite has to make explicit.
  const initial = {
    fill: { value: 'black', owner: null },
    stroke: { value: 'none', owner: null },
    color: CURRENT,
    viaUse: false
  };
  visit(rootSvg, initial, new Set());
  return rootSvg;
};

const toRgb = color => (/^#[0-9a-f]{6}$/.test(color) ? [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)) : null);

// Groups colors whose channels all differ by at most `tolerance` (e.g. #000000 and #010101,
// a common export artifact). Unparseable values always stay separate.
const clusterColors = (colors, tolerance) =>
  colors.reduce((clusters, color) => {
    const rgb = toRgb(color);
    const match = rgb && clusters.find(c => c.rgb && c.rgb.every((v, i) => Math.abs(v - rgb[i]) <= tolerance));
    return match ? clusters : [...clusters, { color, rgb }];
  }, []);

export const classify = (svg, { tolerance = 8 } = {}) => {
  const root = parseTree(normalizeStyles(svg));
  const ids = indexIds(root);
  const colors = new Set();
  const flags = new Set();
  let usesDefaultFill = false;
  walkRendered(
    root,
    ids,
    (node, attr, color) => {
      colors.add(color);
      if (node === null && attr === 'fill') usesDefaultFill = true;
    },
    flag => flags.add(flag)
  );
  const literal = [...colors].filter(color => color !== CURRENT);
  const distinct = clusterColors(literal, tolerance).length + (colors.has(CURRENT) ? 1 : 0);
  const kind =
    flags.size > 0 || distinct > 1 ? 'multicolor' : distinct === 1 && literal.length === 0 ? 'mono-current' : 'mono';
  return { kind, colors: [...colors].sort(), flags: [...flags].sort(), usesDefaultFill };
};

// Rewrites a mono icon so its single color follows `currentColor`. Only touches nodes that
// render; mask and clipPath content keeps its own (made explicit) paint.
export const toCurrentColor = svg => {
  const normalized = normalizeStyles(svg);
  return optimize(normalized, {
    plugins: [
      {
        name: 'rewrite',
        fn: root => {
          const ids = indexIds(root);
          const rootSvg = root.children.find(child => child.type === 'element' && child.name === 'svg');
          let usesDefaultFill = false;
          const rewrites = [];
          walkRendered(
            root,
            ids,
            (node, attr) => {
              if (node === null) {
                if (attr === 'fill') usesDefaultFill = true;
                return;
              }
              rewrites.push([node, attr]);
            },
            () => {}
          );
          rewrites.forEach(([node, attr]) => {
            node.attributes[attr] = CURRENT;
          });

          // Masks inherit paint from where they are declared. Freeze their inherited fill
          // before changing the root default, so mask luminance does not follow the theme.
          const freezeMasks = (node, inheritedFill) => {
            if (node.type !== 'element') return;
            const fill = node.attributes.fill ?? inheritedFill;
            if (node.name === 'mask' && node.attributes.fill === undefined) node.attributes.fill = fill;
            node.children.forEach(child => freezeMasks(child, fill));
          };
          if (usesDefaultFill) {
            freezeMasks(rootSvg, 'black');
            rootSvg.attributes.fill = CURRENT;
          }

          const dropColorAttr = node => {
            if (node.type !== 'element' || node.name === 'mask' || node.name === 'clipPath') return;
            delete node.attributes.color;
            node.children.forEach(dropColorAttr);
          };
          dropColorAttr(rootSvg);
          return {};
        }
      }
    ]
  }).data;
};
