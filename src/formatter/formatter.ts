import { format } from 'prettier';

import loadPrettierConfig from '../config/load-prettier-config';
import { PrettyError } from '../errors';

const Formatter = async () => {
  const config = await loadPrettierConfig().then((prettierConfig) => ({
    ...prettierConfig,
    parser: 'typescript',
  }));

  return async (content: string) => {
    try {
      const template = await format(content, config);
      return template;
    } catch (error) {
      throw new PrettyError(
        `There was a problem formatting the content: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };
};

export default Formatter;
