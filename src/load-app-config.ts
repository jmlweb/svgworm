import { cosmiconfig } from 'cosmiconfig';
import * as v from 'valibot';

const DEFAULT_FILE_CONFIG = {
  src: 'svg',
  dest: undefined,
  optimize: true,
  clean: true,
  force: false,
};

const NonEmptyStringSchema = v.pipe(v.string(), v.minLength(1));

const FileConfigSchema = v.fallback(
  v.object({
    src: v.fallback(NonEmptyStringSchema, DEFAULT_FILE_CONFIG.src),
    dest: v.fallback(
      v.optional(NonEmptyStringSchema),
      DEFAULT_FILE_CONFIG.dest,
    ),
    optimize: v.fallback(v.boolean(), DEFAULT_FILE_CONFIG.optimize),
    clean: v.fallback(v.boolean(), DEFAULT_FILE_CONFIG.clean),
    force: v.fallback(v.boolean(), DEFAULT_FILE_CONFIG.force),
  }),
  DEFAULT_FILE_CONFIG,
);

const loadFileConfig = async () => {
  const explorer = cosmiconfig('svgworm', {
    searchStrategy: 'project',
  });
  const result = await explorer
    .search()
    .catch(() => ({ config: DEFAULT_FILE_CONFIG }));
  return v.parse(FileConfigSchema, result?.config);
};

const CliOptionsSchema = v.object({
  src: v.fallback(v.optional(NonEmptyStringSchema), undefined),
  dest: v.fallback(v.optional(NonEmptyStringSchema), undefined),
  optimize: v.fallback(v.optional(v.boolean()), undefined),
  clean: v.fallback(v.optional(v.boolean()), undefined),
  force: v.fallback(v.optional(v.boolean()), undefined),
});

type CliOptions = v.InferInput<typeof CliOptionsSchema>;

const OptionsSchema = v.object({
  src: v.string('Source folder is required'),
  dest: v.string('Destination folder is required'),
  optimize: v.boolean(),
  clean: v.boolean(),
  force: v.boolean(),
});

type ParsedOptions = v.InferInput<typeof OptionsSchema>;

/**
 * Load the configuration from the CLI options and the configuration file.
 * Returns the merged configuration, with CLI options taking precedence.
 */
const loadAppConfig = async (options: CliOptions): Promise<ParsedOptions> => {
  const cliOptions = v.parse(CliOptionsSchema, options);
  const fileConfig = await loadFileConfig();
  return v.parse(OptionsSchema, {
    src: cliOptions.src ?? fileConfig.src,
    dest: cliOptions.dest ?? fileConfig.dest,
    optimize: cliOptions.optimize ?? fileConfig.optimize,
    clean: cliOptions.clean ?? fileConfig.clean,
    force: cliOptions.force ?? fileConfig.force,
  });
};

export default loadAppConfig;
