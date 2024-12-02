#!/usr/bin/env node
import { cac } from 'cac';

import buildCommand from './build.command';
import { handleError } from './errors';

const run = async () => {
  const cli = cac();

  cli
    .command('[src] [dest]', 'Build files')
    .option('--optimize', 'Enable SVG optimization', { default: undefined })
    .option('--clean', 'Clean destination folder before building', {
      default: undefined,
    })
    .option('--force', 'Disable caching', { default: undefined })
    .option('--flatten', 'Flatten directories', { default: undefined })
    .action(buildCommand);

  cli.help();

  try {
    cli.parse(process.argv, { run: false });
    await cli.runMatchedCommand();
  } catch (error) {
    handleError(error);
  }
};

run();
