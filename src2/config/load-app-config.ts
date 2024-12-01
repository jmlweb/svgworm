import { cosmiconfig } from 'cosmiconfig';
import * as v from 'valibot';

const DEFAULT_CONFIG = {
  src: 'svg',
  dest: undefined,
  optimize: true,
  clean: true,
  force: false,
  flatten: false,
};

type CliOptions = Partial<Record<keyof typeof DEFAULT_CONFIG, unknown>>;

const OptionsSchema = v.object({
  src: v.string('Source folder is required'),
  dest: v.string('Destination folder is required'),
  optimize: v.boolean('Optimize option must be a boolean'),
  clean: v.boolean('Clean option must be a boolean'),
  force: v.boolean('Force option must be a boolean'),
  flatten: v.boolean('Flatten option must be a boolean'),
});

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
  const fileConfig = await loadFileConfig();
  return v.parse(OptionsSchema, {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    ...cleanCliOptions(cliOptions),
  });
};

export default loadAppConfig;
