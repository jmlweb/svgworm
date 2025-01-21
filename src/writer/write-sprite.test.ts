import fs from 'node:fs/promises';
import path from 'node:path';

import { fdir } from 'fdir';

import { WriteSprite } from './write-sprite';

jest.mock('node:fs/promises');
jest.mock('fdir');

describe('WriteSprite', () => {
  const destPath = '/dest';

  beforeEach(() => {
    jest.resetAllMocks();
    (fdir as jest.Mock).mockReturnValue({
      withFullPaths: jest.fn().mockReturnThis(),
      glob: jest.fn().mockReturnThis(),
      crawl: jest.fn().mockReturnThis(),
      withPromise: jest.fn().mockResolvedValue([]),
    });
  });

  describe('file mode', () => {
    it('should write new sprite file when no matching hash exists', async () => {
      const mockFormat = jest.fn(async (content) => content);
      const writeSprite = WriteSprite({
        config: { mode: 'file', prefix: undefined },
        destPath,
        format: mockFormat,
      });

      await writeSprite('<symbol>content</symbol>');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/sprite\.[a-f0-9]+\.svg$/),
        '<svg xmlns="http://www.w3.org/2000/svg"><defs><symbol>content</symbol></defs></svg>',
      );
      expect(mockFormat).toHaveBeenCalledWith(
        expect.stringContaining('<symbol>content</symbol>'),
        expect.objectContaining({ parser: 'html' }),
      );
    });

    it('should handle prefix in file mode', async () => {
      const mockFormat = jest.fn(async (content) => content);
      const writeSprite = WriteSprite({
        config: { mode: 'file', prefix: 'test' },
        destPath,
        format: mockFormat,
      });

      await writeSprite('<symbol>content</symbol>');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/test-sprite\.[a-f0-9]+\.svg$/),
        '<svg xmlns="http://www.w3.org/2000/svg"><defs><symbol>content</symbol></defs></svg>',
      );
    });

    it('should remove old sprite files when new content is written', async () => {
      const mockFormat = jest.fn().mockResolvedValue('formatted');
      (fdir as jest.Mock).mockReturnValue({
        withFullPaths: jest.fn().mockReturnThis(),
        glob: jest.fn().mockReturnThis(),
        crawl: jest.fn().mockReturnThis(),
        withPromise: jest
          .fn()
          .mockResolvedValue([
            '/dest/sprite.old1.svg',
            '/dest/sprite.old2.svg',
            '/dest/sprite.b75a814e604791b7747c6fa471a24dd1.svg',
          ]),
      });

      const writeSprite = WriteSprite({
        config: { mode: 'file', prefix: undefined },
        destPath,
        format: mockFormat,
      });

      await writeSprite('<symbol>content</symbol>');

      expect(fs.unlink).toHaveBeenCalledWith('/dest/sprite.old1.svg');
      expect(fs.unlink).toHaveBeenCalledWith('/dest/sprite.old2.svg');
      expect(fs.unlink).not.toHaveBeenCalledWith(
        '/dest/sprite.b75a814e604791b7747c6fa471a24dd1.svg',
      );
    });
  });

  describe('component mode', () => {
    it('should write sprite component file', async () => {
      const mockFormat = jest.fn(async (content) => content);
      const writeSprite = WriteSprite({
        config: { mode: 'component', prefix: undefined },
        destPath,
        format: mockFormat,
      });
      await writeSprite('<symbol>content</symbol>');

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(destPath, 'sprite.tsx'),
        `export const IconSprite = () => (
  <svg xmlns=\"http://www.w3.org/2000/svg\" width="0" height="0" style={{ visibility: 'hidden' }}>
    <symbol>content</symbol>
  </svg>
);`,
      );
      expect(mockFormat).toHaveBeenCalledWith(
        expect.stringContaining('export const IconSprite'),
      );
    });

    it('should handle prefix in component mode', async () => {
      const mockFormat = jest.fn().mockResolvedValue('formatted');
      const writeSprite = WriteSprite({
        config: { mode: 'component', prefix: 'test' },
        destPath,
        format: mockFormat,
      });

      await writeSprite('<symbol>content</symbol>');

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(destPath, 'test-sprite.tsx'),
        'formatted',
      );
      expect(mockFormat).toHaveBeenCalledWith(
        expect.stringContaining('export const testIconSprite'),
      );
    });
  });
});
