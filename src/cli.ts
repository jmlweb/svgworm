#!/usr/bin/env node
import { cac } from 'cac';

import { command } from './command';
import { handleError } from './errors/handle-error';

const run = async () => {
  const cli = cac('svgworm');

  cli
    .command('[src] [dest]', 'Build files')
    .option('--ci', 'ci mode', { default: false })
    .option('--mode <mode>', 'Mode (file or component)')
    .option('--ts', 'Enable TypeScript')
    .option('--cache', 'Enable caching')
    .option('--flatten', 'Flatten categories/directories')
    .option('--no-config', 'Disable config file')
    .option('--config <config>', 'config file name', {
      default: 'svgworm',
    })
    .option('--prefix <prefix>', 'Prefix for sprite')
    .option('--color', "Preserve colors (don't convert to currentColor)")
    .option('--show-performance', 'Show performance data')
    .action(command);

  cli.help();

  try {
    cli.parse(process.argv, { run: false });
    await cli.runMatchedCommand();
  } catch (error) {
    handleError(error);
  }
};

run();
