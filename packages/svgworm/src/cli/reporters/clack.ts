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

import { describeStale, summaryRows } from './format.ts';
import { createPlainReporter } from './plain.ts';

/**
 * Animated progress and a colored summary for an interactive terminal. Visual only, so it
 * has no snapshot test (testing.md); the plain and JSON reporters cover the same data.
 */
export const createClackReporter = (io: CliIo): Reporter => {
  let bar: ProgressResult | undefined;
  let warnings: Diagnostic[] = [];
  let removed: string[] = [];
  // Messages wait until the bar stops, because a log line would tear the animation.
  const flushWarnings = (): void => {
    warnings.forEach((warning) => {
      log.warn(`${warning.file}: ${warning.message}`);
    });
    warnings = [];
  };
  const summary = (rows: readonly (readonly [string, string])[]): void => {
    const width = Math.max(...rows.map(([label]) => label.length));
    note(
      rows
        .map(([label, value]) => `${label.padEnd(width)}  ${value}`)
        .join('\n'),
      'Summary',
    );
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
      removed = [];
      summary(summaryRows(result.stats));
      outro(`Wrote ${String(result.written.length)} files`);
    },
    checked: (result) => {
      bar?.stop(`Compiled ${String(result.stats.icons)} icons`);
      flushWarnings();
      if (result.upToDate) {
        outro(`Output is up to date (${String(result.files.length)} files)`);
        return;
      }
      result.stale.forEach((entry) => {
        log.error(`${entry.status.padEnd(7)} ${entry.path}`);
      });
      outro(describeStale(result));
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
    watching: (sources) => {
      log.info(
        `Watching ${sources.join(', ')} for changes. Press Ctrl+C to stop`,
      );
    },
    initialized: (result) => {
      intro('svgworm init');
      const width = Math.max(
        ...result.actions.map((action) => action.status.length),
      );
      result.actions.forEach((action) => {
        const line = `${action.status.padEnd(width)}  ${action.path}${action.reason === undefined ? '' : ` (${action.reason})`}`;
        if (action.status === 'skipped') log.warn(line);
        else log.success(line);
      });
      if (result.framework !== undefined) {
        log.info(
          `framework: ${result.framework} (${result.frameworkSource ?? 'detected'})`,
        );
      }
      note(
        result.nextSteps
          .map((step, index) => `${String(index + 1)}. ${step}`)
          .join('\n'),
        'Next steps',
      );
      outro('svgworm is set up');
    },
  };
};
