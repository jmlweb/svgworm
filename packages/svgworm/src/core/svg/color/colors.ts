export const CURRENT_COLOR = 'currentColor';

const NAMED: Readonly<Record<string, string>> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  gray: '#808080',
  grey: '#808080',
  orange: '#ffa500',
  purple: '#800080',
  silver: '#c0c0c0',
  navy: '#000080',
  maroon: '#800000',
  lime: '#00ff00',
  aqua: '#00ffff',
  cyan: '#00ffff',
  fuchsia: '#ff00ff',
  magenta: '#ff00ff',
  teal: '#008080',
  olive: '#808000',
  darkgray: '#a9a9a9',
  darkgrey: '#a9a9a9',
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  dimgray: '#696969',
  dimgrey: '#696969',
  gold: '#ffd700',
  pink: '#ffc0cb',
  brown: '#a52a2a',
};

/** Canonical form of a literal color: `#rrggbb`, `currentColor`, or the lowercased input. */
export const normalizeColor = (raw: string): string => {
  const value = raw.trim().toLowerCase();
  if (value === 'currentcolor') return CURRENT_COLOR;
  const named = NAMED[value];
  if (named !== undefined) return named;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(value);
  if (short) {
    return `#${(short[1] ?? '').repeat(2)}${(short[2] ?? '').repeat(2)}${(short[3] ?? '').repeat(2)}`;
  }
  const long = /^#([0-9a-f]{6})(ff)?$/.exec(value);
  if (long) return `#${long[1] ?? ''}`;
  const rgb =
    /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*(?:1|1\.0+|100%))?\s*\)$/.exec(
      value,
    );
  if (rgb) {
    return `#${rgb
      .slice(1, 4)
      .map((channel) => Number(channel).toString(16).padStart(2, '0'))
      .join('')}`;
  }
  return value;
};

export const isNone = (value: string): boolean =>
  value === 'none' || value === 'transparent';

const toRgb = (color: string): readonly number[] | undefined =>
  /^#[0-9a-f]{6}$/.test(color)
    ? [1, 3, 5].map((index) =>
        Number.parseInt(color.slice(index, index + 2), 16),
      )
    : undefined;

const isWithin = (
  a: readonly number[] | undefined,
  b: readonly number[] | undefined,
  tolerance: number,
): boolean =>
  a !== undefined &&
  b !== undefined &&
  a.every((channel, index) => Math.abs(channel - (b[index] ?? 0)) <= tolerance);

/**
 * Number of distinct colors once colors within `tolerance` per channel are merged (an export
 * artifact such as #000000 vs #010101). Unparseable values always stay separate.
 */
export const countColorClusters = (
  colors: readonly string[],
  tolerance: number,
): number =>
  colors
    .map(toRgb)
    .reduce<readonly (readonly number[] | undefined)[]>(
      (clusters, rgb) =>
        clusters.some((cluster) => isWithin(cluster, rgb, tolerance))
          ? clusters
          : [...clusters, rgb],
      [],
    ).length;
