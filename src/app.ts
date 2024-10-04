#!/usr/bin/env node
import { cac } from 'cac';
import pc from 'picocolors';

import { AppAction } from './types';

const app = async (appAction: AppAction) => {
  const cli = cac();

  cli
    .command('[src] [dest]', 'Build files')
    .option('--optimize', 'Enable SVG optimization', { default: undefined })
    .option('--clean', 'Clean destination folder before building', {
      default: undefined,
    })
    .action(appAction);

  cli.help();

  try {
    cli.parse(process.argv, { run: false });
    await cli.runMatchedCommand();
  } catch (error) {
    console.error(
      pc.whiteBright(
        pc.bgRed(error instanceof Error ? error.message : 'Unknown error'),
      ),
    );
    process.exit(1);
  }
};

export default app;
