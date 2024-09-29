import { cosmiconfig } from 'cosmiconfig';
import * as v from 'valibot';

const PathSchema = v.pipe(v.string(), v.trim(), v.nonEmpty());


const FileConfigSchema = v.optional(
  v.object({
    src: v.optional(PathSchema, './svg'),
    dest: v.optional(PathSchema),
    optimize: v.optional(v.boolean(), true),
  }),
  {},
);

interface CliOptions {
  src?: string;
  dest?: string;
  noOptimize?: boolean;
}

const loadConfig = (options: CliOptions) => {
  const explorer = cosmiconfig('svgworm', {
    searchStrategy: 'project',
  });
  return explorer
    .search()
    .catch((error) => {
      console.error(error);
      return undefined;
    })
    .then((result) => {
      const fileConfig = v.parse(FileConfigSchema, result?.config);
      const parsedDest = options.dest ?? fileConfig.dest;
      if (!parsedDest) {
        throw new Error('Destination folder is required');
      }
      return {
        src: options.src ?? fileConfig.src,
        dest: parsedDest,
        optimize: options.noOptimize ? false : fileConfig.optimize,
      };
    });
};

export default loadConfig;
