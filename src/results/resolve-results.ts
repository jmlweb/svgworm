import { extractErrorMessage } from '../errors/extract-error-message';
import { pLimit } from '../shared/p-limit';

export const resolveResults = async ({
  sources,
  iconPipeline,
}: {
  sources: [string, string][];
  iconPipeline: (source: (typeof sources)[number]) => Promise<[string, string]>;
}) => {
  const limit = pLimit(10);
  const opResults = await Promise.all(
    sources.map((source) =>
      limit(() =>
        iconPipeline(source).catch((error) => extractErrorMessage(error)),
      ),
    ),
  );

  return opResults.reduce(
    (results, result) => {
      if (typeof result === 'string') {
        results.errors.push(result);
      } else {
        results.ids.push(result[0]);
        results.content += result[1];
      }
      return results;
    },
    { ids: [], errors: [], content: '' } as {
      ids: string[];
      errors: string[];
      content: string;
    },
  );
};
