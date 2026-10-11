import type { Diagnostic } from '../../core/api.ts';
import type { CliIo } from '../io.ts';
import type { Reporter } from './types.ts';

import { createStyle, formatBytes, summaryRows } from './format.ts';

const describe = (diagnostic: Diagnostic): string =>
  diagnostic.file === ''
    ? `[${diagnostic.code}] ${diagnostic.message}`
    : `[${diagnostic.code}] ${diagnostic.file}: ${diagnostic.message}`;

/** One stable line per event, then the summary. Diagnostics go to stderr. */
export const createPlainReporter = (io: CliIo): Reporter => {
  const style = createStyle(io.env);
  const out = (line: string): void => void io.stdout.write(`${line}\n`);
  const err = (line: string): void => void io.stderr.write(`${line}\n`);

  return {
    onEvent: (event) => {
      switch (event.type) {
        case 'start':
          out(`svgworm: reading ${String(event.total)} SVG file(s)`);
          break;
        case 'icon':
          out(`icon ${event.name} ${event.color} ${event.delivery}`);
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
  };
};
