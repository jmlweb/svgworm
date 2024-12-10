#!/usr/bin/env node
import { cac } from 'cac';

import command from './command';
import { handleError } from './errors';

const run = async () => {
  const cli = cac('svgworm');

  cli
    .command('[src] [dest]', 'Build files')
    .option('--clean', 'Clean destination folder before building', {
      default: undefined,
    })
    .option('--force', 'Disable caching', { default: undefined })
    .option('--flatten', 'Flatten directories', { default: undefined })
    .option('--color', 'Preserve colors', { default: undefined })
    .option('--prefix <prefix>', 'Prefix for sprite', { default: undefined })
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
