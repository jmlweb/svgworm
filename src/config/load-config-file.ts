import { cosmiconfig } from 'cosmiconfig';

import { PrettyError } from '../errors/pretty-error';
import { timeMeasurer } from '../shared/time-measurer';

export const loadConfigFile = (configFileName: string) => {
  const stopMeasuring = timeMeasurer.start('resolveConfig');
  return cosmiconfig(configFileName, {
    searchStrategy: 'project',
  })
    .search()
    .then((result) => {
      stopMeasuring();
      return result?.config ?? {};
    })
    .catch((error) => {
      stopMeasuring();
      throw PrettyError.of(error, `Failed to load config: ${configFileName}`);
    });
};
