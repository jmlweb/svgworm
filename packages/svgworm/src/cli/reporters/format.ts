import { styleText } from 'node:util';

import type { BuildStats } from '../../core/api.ts';

type Format = Parameters<typeof styleText>[0];

export type Style = (format: Format, text: string) => string;

/** Color only when asked for with FORCE_COLOR: plain output must stay stable for pipes and CI. */
export const createStyle = (
  env: Readonly<Record<string, string | undefined>>,
): Style => {
  const isForced =
    env['FORCE_COLOR'] !== undefined &&
    env['FORCE_COLOR'] !== '' &&
    env['FORCE_COLOR'] !== '0';
  return (format, text) =>
    isForced ? styleText(format, text, { validateStream: false }) : text;
};

export const formatBytes = (bytes: number): string =>
  Math.abs(bytes) < 1024
    ? `${String(bytes)} B`
    : `${(bytes / 1024).toFixed(1)} KiB`;

const formatSavings = (stats: BuildStats): string => {
  if (stats.sourceBytes === 0) return formatBytes(stats.savingsBytes);
  const percent = (stats.savingsBytes / stats.sourceBytes) * 100;
  return `${formatBytes(stats.savingsBytes)} (${percent.toFixed(1)}%)`;
};

export const formatDuration = (milliseconds: number): string =>
  milliseconds < 1000
    ? `${String(Math.round(milliseconds))} ms`
    : `${(milliseconds / 1000).toFixed(2)} s`;

/** Label and value pairs of the end-of-run summary, shared by the plain and clack reporters. */
export const summaryRows = (
  stats: BuildStats,
): readonly (readonly [string, string])[] => [
  [
    'icons',
    `${String(stats.icons)} (${String(stats.mono)} mono, ${String(stats.multicolor)} multicolor)`,
  ],
  [
    'delivery',
    `use ${String(stats.delivery.use)}, img ${String(stats.delivery.img)}, mask ${String(stats.delivery.mask)}`,
  ],
  ['source', formatBytes(stats.sourceBytes)],
  [
    'output',
    `${formatBytes(stats.spriteBytes + stats.stackBytes)} (sprite ${formatBytes(stats.spriteBytes)}, stack ${formatBytes(stats.stackBytes)})`,
  ],
  ['savings', formatSavings(stats)],
  ['time', formatDuration(stats.durationMs)],
];
