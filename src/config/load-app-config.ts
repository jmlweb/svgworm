import { cosmiconfig } from 'cosmiconfig';
import * as v from 'valibot';

import { PrettyError } from '../errors';

const DEFAULT_CONFIG = {
  src: 'svg',
  dest: undefined,
  clean: true,
  force: false,
  flatten: false,
};

type CliOptions = Partial<Record<keyof typeof DEFAULT_CONFIG, unknown>>;

const OptionsSchema = v.object({
  src: v.fallback(
    v.string('Source folder is required'),
    () => DEFAULT_CONFIG.src,
  ),
  dest: v.string('Destination folder is required'),
  clean: v.fallback(
    v.boolean('Clean option must be a boolean'),
    () => DEFAULT_CONFIG.clean,
  ),
  force: v.fallback(
    v.boolean('Force option must be a boolean'),
    () => DEFAULT_CONFIG.force,
  ),
  flatten: v.fallback(
    v.boolean('Flatten option must be a boolean'),
    () => DEFAULT_CONFIG.flatten,
  ),
});

export type ResolvedOptions = v.InferOutput<typeof OptionsSchema>;

const loadFileConfig = async () => {
  const explorer = cosmiconfig('svgworm', {
    searchStrategy: 'project',
  });
  const result = await explorer.search().catch(() => ({ config: undefined }));
  return result?.config;
};

const cleanCliOptions = (cliOptions: CliOptions) =>
  Object.fromEntries(
    Object.entries(cliOptions).filter(([, value]) => value !== undefined),
  );

const loadAppConfig = async (cliOptions: CliOptions) => {
  try {
    const fileConfig = await loadFileConfig();
    return v.parse(OptionsSchema, {
      ...DEFAULT_CONFIG,
      ...fileConfig,
      ...cleanCliOptions(cliOptions),
    });
  } catch (error) {
    throw new PrettyError(
      `There was a problem loading the app config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export default loadAppConfig;
