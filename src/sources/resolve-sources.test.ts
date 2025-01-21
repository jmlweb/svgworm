import { resolveSources } from './resolve-sources';

jest.mock('./resolve-file-paths.ts', () => ({
  resolveFilePaths: jest.fn(() => [
    'brands/behance.svg',
    'brands/classroom.svg',
    'brands/fiverr.svg',
    'brands/dribbble.svg',
    'ai/ai-filter.svg',
  ]),
}));

describe('resolveSources', () => {
  it('should return an array of sources (each source is a tuple of [id, relativePath])', async () => {
    const config = {
      flatten: false,
    };
    const srcPath = '/user/client/myproject/src';
    const sources = await resolveSources({
      config,
      srcPath,
    });
    expect(sources).toEqual([
      ['ai.ai-filter', 'ai/ai-filter.svg'],
      ['brands.behance', 'brands/behance.svg'],
      ['brands.classroom', 'brands/classroom.svg'],
      ['brands.dribbble', 'brands/dribbble.svg'],
      ['brands.fiverr', 'brands/fiverr.svg'],
    ]);
  });
});
