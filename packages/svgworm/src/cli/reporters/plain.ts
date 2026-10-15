import type { Diagnostic } from '../../core/api.ts';
import type { CliIo } from '../io.ts';
import type { Reporter } from './types.ts';

import {
  createStyle,
  describeStale,
  formatBytes,
  summaryRows,
} from './format.ts';

const describe = (
  diagnostic: Pick<Diagnostic, 'file' | 'message'> & { readonly code: string },
): string =>
  diagnostic.file === ''
    ? `[${diagnostic.code}] ${diagnostic.message}`
    : `[${diagnostic.code}] ${diagnostic.file}: ${diagnostic.message}`;

export type PlainOptions = {
  /** One `icon` line per icon. Off by default: 2,000 icons made 2,000 lines per CI run. */
  readonly isVerbose: boolean;
};

/** Stable lines for the files and the summary. Diagnostics go to stderr. */
export const createPlainReporter = (
  io: CliIo,
  options: PlainOptions = { isVerbose: false },
): Reporter => {
  const style = createStyle(io.env);
  const out = (line: string): void => void io.stdout.write(`${line}\n`);
  const err = (line: string): void => void io.stderr.write(`${line}\n`);

  return {
    usingDefaultSource: (dir) => {
      out(`svgworm: using default source ${dir}/`);
    },
    onEvent: (event) => {
      switch (event.type) {
        case 'start':
          out(`svgworm: reading ${String(event.total)} SVG file(s)`);
          break;
        case 'icon':
          if (options.isVerbose) {
            out(
              `icon ${event.name} ${event.color} ${event.delivery}${event.fromCache ? ' (cached)' : ''}`,
            );
          }
          break;
        case 'warning':
          err(`${style('yellow', 'warning')} ${describe(event.diagnostic)}`);
          break;
        case 'write':
          out(`write ${event.path} (${formatBytes(event.bytes)})`);
          break;
        case 'remove':
          out(`remove ${event.path}`);
          break;
        case 'done':
          break;
      }
    },
    succeed: (result) => {
      out(style('green', 'svgworm: build done'));
      const rows = summaryRows(result.stats);
      const width = Math.max(...rows.map(([label]) => label.length));
      rows.forEach(([label, value]) => {
        out(`  ${label.padEnd(width)}  ${value}`);
      });
    },
    checked: (result) => {
      result.differences.forEach((entry) => {
        out(`check ${entry.path} ${entry.status}`);
      });
      if (result.upToDate) {
        out(
          style(
            'green',
            `svgworm: output is up to date (${String(result.files.length)} file(s))`,
          ),
        );
      } else {
        err(`${style('red', 'svgworm:')} ${describeStale(result)}`);
      }
    },
    fail: (errors) => {
      errors.forEach((error) => {
        err(`${style('red', 'error')} ${describe(error)}`);
      });
      err(
        `svgworm: build failed with ${String(errors.length)} error(s), nothing was written`,
      );
    },
    fatal: (message) => {
      err(`${style('red', 'svgworm:')} ${message}`);
    },
    watching: (sources) => {
      out(`svgworm: watching ${sources.join(', ')} for changes`);
    },
    initialized: (result) => {
      result.actions.forEach((action) => {
        out(
          action.reason === undefined
            ? `init ${action.path} ${action.status}`
            : `init ${action.path} ${action.status} (${action.reason})`,
        );
        if (action.warning !== undefined) {
          err(
            `${style('yellow', 'warning')} ${action.path}: ${action.warning}`,
          );
        }
      });
      if (result.framework !== undefined) {
        out(
          `init framework ${result.framework} (${result.frameworkSource ?? 'detected'})`,
        );
      }
      result.build.warnings.forEach((warning) => {
        err(`${style('yellow', 'warning')} ${describe(warning)}`);
      });
      if (result.build.ok) {
        out(
          `init build ${String(result.build.icons)} icon(s), ${String(result.build.written.length)} file(s) written`,
        );
        out(style('green', 'svgworm: init done'));
      } else {
        result.build.errors.forEach((error) => {
          err(`${style('red', 'error')} ${describe(error)}`);
        });
        err(
          `${style('red', 'svgworm:')} init done, but the first build failed with ${String(result.build.errors.length)} error(s); fix them and run svgworm`,
        );
      }
      out('Next steps:');
      result.nextSteps.forEach((step, index) => {
        out(`  ${String(index + 1)}. ${step}`);
      });
    },
  };
};
