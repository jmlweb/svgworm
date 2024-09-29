#!/usr/bin/env node
import { cac } from 'cac';
import path from 'path';

import loadConfig from './load-config';
import extractIdsToPaths from './extract-ids-to-paths';
import { extractContent } from './extract-content';

const runner = async () => {
  const cli = cac();

  cli
    // Simply omit the command name, just brackets
    .command('[src] [dest]', 'Build files')
    .option('--no-optimize', 'Disable SVG optimization')
    .action(
      async (
        src: string,
        dest: string,
        {
          noOptimize,
        }: {
          noOptimize?: boolean;
        },
      ) => {
        const config = await loadConfig({
          src,
          dest,
          noOptimize,
        });
        const srcPath = path.resolve(process.cwd(), config.src);
        const idsToPaths = await extractIdsToPaths(srcPath);
        const results = await Promise.allSettled(Object.keys(idsToPaths).map(
          async (id) => {
            const file = id in idsToPaths ? idsToPaths[id] : undefined;
            if (!file) {
              throw new Error(`File not found for id: ${id}`);
            }
            const content = await extractContent(id, file);
            return { id, content };
          }
        ));
        const content: string[] = [];
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            content.push(result.value.content);
          } else {
            console.error(result.reason);
          }
        });
        const formatted = `<svg>${content.join('')}</svg>`;
        console.log(formatted);
        // const families = Object.keys(idsToPaths).reduce(
        //   (acc, id) => {
        //     const parts = id.split('.');
        //     const family = parts.slice(0, -1).join('.');
        //     if (!(family in acc)) {
        //       acc[family] = [];
        //     }
        //     acc[family]!.push(parts[parts.length - 1]!);
        //     return acc;
        //   },
        //   {} as Record<string, string[]>,
        // );
        // console.log(families);
      },
    );

  cli.help();

  try {
    cli.parse(process.argv, { run: false });
    await cli.runMatchedCommand();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runner();
