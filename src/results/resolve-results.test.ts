import { resolveResults } from './resolve-results';

describe('resolveResults', () => {
  it('should return an object with ids and content', async () => {
    const iconPipeline = jest.fn(async (source: [string, string]) => source);
    const result = await resolveResults({
      sources: [
        ['id1', 'path1'],
        ['id2', 'path2'],
      ],
      iconPipeline,
    });
    expect(result).toEqual({
      ids: ['id1', 'id2'],
      errors: [],
      content: 'path1path2',
    });
  });
  it('should return an object with errors', async () => {
    const iconPipeline = jest.fn(async ([id]: [string, string]) => {
      throw new Error(`error: ${id}`);
    });
    const result = await resolveResults({
      sources: [
        ['id1', 'path1'],
        ['id2', 'path2'],
      ],
      iconPipeline,
    });
    expect(result).toEqual({
      ids: [],
      errors: ['error: id1', 'error: id2'],
      content: '',
    });
  });

  it('should preserve the order of the sources', async () => {
    const iconPipeline = jest.fn(
      (source: [string, string]): Promise<[string, string]> => {
        const time = Math.random() * 10;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(source);
          }, time);
        });
      },
    );
    const sources: [string, string][] = Array.from(
      {
        length: 100,
      },
      (_, i) => [i.toString(), i.toString()],
    );
    const result = await resolveResults({
      sources,
      iconPipeline,
    });
    expect(result.ids).toEqual(sources.map(([id]) => id));
  });
});
