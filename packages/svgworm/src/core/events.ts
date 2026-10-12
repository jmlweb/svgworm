import type { Diagnostic } from './errors.ts';
import type { ColorKind } from './svg/color/classify.ts';
import type { Delivery } from './svg/references.ts';

export type BuildStats = {
  readonly icons: number;
  readonly mono: number;
  readonly multicolor: number;
  readonly delivery: Readonly<Record<Delivery, number>>;
  readonly sourceBytes: number;
  readonly spriteBytes: number;
  readonly stackBytes: number;
  /** Source bytes minus output bytes (sprite and stack). Negative when output is larger. */
  readonly savingsBytes: number;
  readonly durationMs: number;
};

/** What the core reports while it works. The CLI turns these into progress and stats. */
export type BuildEvent =
  | { readonly type: 'start'; readonly total: number }
  | {
      readonly type: 'icon';
      readonly name: string;
      readonly file: string;
      readonly index: number;
      readonly total: number;
      readonly color: ColorKind;
      readonly delivery: Delivery;
      /** True when a watch rebuild reused the previous transform of this exact content (ADR-0015). */
      readonly fromCache: boolean;
    }
  | { readonly type: 'warning'; readonly diagnostic: Diagnostic }
  /** A file whose bytes changed was written. Identical files are left alone and emit nothing. */
  | { readonly type: 'write'; readonly path: string; readonly bytes: number }
  | { readonly type: 'remove'; readonly path: string }
  | { readonly type: 'done'; readonly stats: BuildStats };

export type BuildEventHandler = (event: BuildEvent) => void;
