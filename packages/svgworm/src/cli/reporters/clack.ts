import {
  intro,
  log,
  note,
  outro,
  progress,
  type ProgressResult,
} from '@clack/prompts';

import type { Diagnostic } from '../../core/api.ts';
import type { CliIo } from '../io.ts';
import type { Reporter } from './types.ts';

import { summaryRows } from './format.ts';
import { createPlainReporter } from './plain.ts';

/**
 * Animated progress and a colored summary for an interactive terminal. Visual only, so it
 * has no snapshot test (testing.md); the plain and JSON reporters cover the same data.
 */
export const createClackReporter = (io: CliIo): Reporter => {
  let bar: ProgressResult | undefined;
  const warnings: Diagnostic[] = [];
  const removed: string[] = [];
  // Messages wait until the bar stops, because a log line would tear the animation.
  const flushWarnings = (): void => {
    warnings.forEach((warning) => {
      log.warn(`${warning.file}: ${warning.message}`);
    });
  };

  return {
    onEvent: (event) => {
      switch (event.type) {
        case 'start':
          intro('svgworm');
          bar = progress({ max: event.total });
          bar.start('Optimizing icons');
          break;
        case 'icon':
          bar?.advance(1, event.name);
          break;
        case 'warning':
          warnings.push(event.diagnostic);
          break;
        case 'remove':
          removed.push(event.path);
          break;
        case 'write':
        case 'done':
          break;
      }
    },
    succeed: (result) => {
      bar?.stop(`Built ${String(result.stats.icons)} icons`);
      flushWarnings();
      removed.forEach((path) => {
        log.info(`Removed stale ${path}`);
      });
      const rows = summaryRows(result.stats);
      const width = Math.max(...rows.map(([label]) => label.length));
      note(
        rows
          .map(([label, value]) => `${label.padEnd(width)}  ${value}`)
          .join('\n'),
        'Summary',
      );
      outro(`Wrote ${String(result.written.length)} files`);
    },
    fail: (errors) => {
      bar?.error('Build failed');
      flushWarnings();
      errors.forEach((error) => {
        log.error(
          error.file === '' ? error.message : `${error.file}: ${error.message}`,
        );
      });
      outro(`${String(errors.length)} error(s), nothing was written`);
    },
    fatal: (message, code) => {
      // Not worth an animation: a usage mistake should read like any other CLI error.
      bar?.error('Build failed');
      createPlainReporter(io).fatal(message, code);
    },
  };
};
