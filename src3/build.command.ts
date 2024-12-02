import fs from 'node:fs';

import { fdir } from 'fdir';
import path from 'path';
import colors from 'picocolors';

import FilesCache from './cache';
import loadConfig from './config';
import { PrettyError } from './errors';
import IdsToPaths from './ids-to-paths';
import ProcessFiles, { Processor } from './process-files';
import SVGOptimizer from './svg-optimizer';
import { Writer } from './writer';

const printHeading = () => {
  console.log(
    colors.cyanBright(`                                              
  _____   ____ ___      _____  _ __ _ __ ___  
 / __\\ \\ / / _\` \\ \\ /\\ / / _ \\| '__| '_ \` _ \\ 
 \\__ \\\\ V / (_| |\\ V  V / (_) | |  | | | | | |
 |___/ \\_/ \\__, | \\_/\\_/ \\___/|_|  |_| |_| |_|
            __/ |                             
           |___/                              
`),
  );
};

const buildCommand = async (
  src?: string,
  dest?: string,
  cliOptions?: Omit<Parameters<typeof loadConfig>[0], 'src' | 'dest'>,
) => {
  const startTime = performance.now();
  printHeading();
  const [appConfig, svgoConfig, prettierConfig] = await loadConfig({
    src,
    dest,
    ...cliOptions,
  });
  const srcPath = path.resolve(process.cwd(), appConfig.src);
  const files = await new fdir()
    .withRelativePaths()
    .glob('./**/*.svg')
    .crawl(srcPath)
    .withPromise();

  if (!files.length) {
    throw new PrettyError(`No SVG files found in ${srcPath}`);
  }

  console.log(
    colors.blueBright(
      `Processing ${colors.bold(colors.whiteBright(files.length))} SVG files...`,
    ),
  );

  const idsToPaths = IdsToPaths(appConfig.flatten);
  const svgOptimizer = SVGOptimizer(appConfig.optimize, svgoConfig);
  const filesCache = FilesCache(appConfig.optimize, svgOptimizer);

  const processor: Processor = (filePath, cb) => {
    fs.readFile(
      path.resolve(srcPath, filePath),
      'utf-8',
      (err, fileContent) => {
        if (err) {
          cb(err);
          return;
        }
        const id = idsToPaths.add(filePath);
        filesCache(id, fileContent, (err2, data2) => {
          if (!data2) {
            cb(err2 ?? new Error('Unknown error'));
            return;
          }
          const { content, fileHash } = data2;
          cb(null, { id, file: filePath, content, fileHash });
        });
      },
    );
  };

  const processFiles = ProcessFiles(processor);

  processFiles(files, async ({ data, errors, hash }) => {
    const writeResults = Writer(appConfig.dest);
    if (errors.length) {
      console.table(errors);
    }

    await writeResults(data);

    console.log(hash);

    console.log(
      colors.dim(
        `Command run time: ${(performance.now() - startTime).toFixed(3)}ms`,
      ),
    );
  });
};

export default buildCommand;
