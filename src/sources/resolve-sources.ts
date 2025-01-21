import { Config } from '../config/schemas';
import { IdsGenerator } from './ids-generator';
import { resolveFilePaths } from './resolve-file-paths';

export const resolveSources = async ({
  config: { flatten },
  srcPath,
}: {
  config: Pick<Config, 'flatten'>;
  srcPath: string;
}) => {
  const generateId = IdsGenerator(flatten);
  const filePaths = await resolveFilePaths(srcPath);
  return filePaths
    .map((filePath): [string, string] => [generateId(filePath), filePath])
    .sort((a, b) => a[0].localeCompare(b[0]));
};
