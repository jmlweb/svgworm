import colors from 'picocolors';
import * as v from 'valibot';

import { PrettyError } from '../errors/pretty-error';
import { timeMeasurer } from '../shared/time-measurer';
import { askUser, QUESTIONS } from './ask-user';
import { DEFAULT_VALUES } from './constants';
import { loadConfigFile } from './load-config-file';
import {
  BaseConfigSchema,
  CliOptionsSchema,
  FinalConfigSchema,
} from './schemas';
import { CliOptionsInput } from './types';

const validate = <S extends Parameters<typeof v.safeParse>[0]>(
  errorTitle: string,
  schema: S,
  options: unknown,
) => {
  const stopMeasuring = timeMeasurer.start('main.config');
  const result = v.safeParse(schema, options);
  stopMeasuring();
  if (!result.success) {
    throw PrettyError.of(
      result.issues
        .map(
          (issue) =>
            `\n- ${colors.bold(v.getDotPath(issue))} => ${colors.redBright(issue.message)}`,
        )
        .join(),
      colors.bold(errorTitle),
    );
  }
  return result.output;
};

export const resolveConfig = async (cliOptions: CliOptionsInput) => {
  const parsedCliOptions = validate(
    'Invalid CLI options',
    CliOptionsSchema,
    cliOptions,
  );

  const fileConfig = parsedCliOptions.config
    ? validate(
        'Invalid file config',
        BaseConfigSchema,
        await loadConfigFile(parsedCliOptions.config),
      )
    : {};

  const partialConfig = { ...fileConfig, ...parsedCliOptions };

  console.log(
    Object.entries(partialConfig).reduce(
      (acc, [key, value]) =>
        value === undefined
          ? acc
          : `${acc}\n${colors.green('✔')} ${colors.bold(
              key in QUESTIONS
                ? QUESTIONS[key as keyof typeof QUESTIONS].message
                : key,
            )}: ${colors.whiteBright(value?.toString())}`,
      '',
    ),
  );

  if (parsedCliOptions.ci) {
    return validate('Invalid config', FinalConfigSchema, {
      ...DEFAULT_VALUES,
      ...partialConfig,
    });
  }

  const userConfig = await askUser(partialConfig);
  return validate('Invalid config', FinalConfigSchema, {
    ...DEFAULT_VALUES,
    ...fileConfig,
    ...parsedCliOptions,
    ...userConfig,
  });
};
