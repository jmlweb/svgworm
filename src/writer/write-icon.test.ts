import fs from 'node:fs/promises';

import path from 'path';

import { writeIcon } from './write-icon';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('writeIcon', () => {
  const mockFormat = jest.fn().mockResolvedValue('formatted');
  const mockConfig = {
    prefix: 'test',
    ts: true,
  };
  const destPath = '/test/path';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should write TypeScript icon file with prefix', async () => {
    await writeIcon({
      config: mockConfig,
      destPath,
      format: mockFormat,
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(destPath, 'test-icon.tsx'),
      'formatted',
    );

    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining('export const TestIcon'),
      { parser: 'typescript' },
    );

    // Verify template contents
    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining("import type { ComponentProps } from 'react'"),
      expect.any(Object),
    );
    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining(
        "import type { TestIconName } from './test-types'",
      ),
      expect.any(Object),
    );
    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining(
        "export interface TestIconProps extends ComponentProps<'svg'>",
      ),
      expect.any(Object),
    );
    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining('<use href={`#test.${name}`} />'),
      expect.any(Object),
    );
  });

  it('should write JavaScript icon file without prefix', async () => {
    await writeIcon({
      config: { prefix: undefined, ts: false },
      destPath,
      format: mockFormat,
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(destPath, 'icon.jsx'),
      'formatted',
    );

    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining('const Icon'),
      { parser: 'babel' },
    );

    // Verify template contents
    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining('<use href={`#${name}`} />'),
      expect.any(Object),
    );
    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining('width = 24'),
      expect.any(Object),
    );
    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining('height = 24'),
      expect.any(Object),
    );
  });

  it('should write TypeScript icon file with different prefix', async () => {
    await writeIcon({
      config: { prefix: 'custom', ts: true },
      destPath,
      format: mockFormat,
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(destPath, 'custom-icon.tsx'),
      'formatted',
    );

    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining('export const CustomIcon'),
      { parser: 'typescript' },
    );

    expect(mockFormat).toHaveBeenCalledWith(
      expect.stringContaining(
        "import type { CustomIconName } from './custom-types'",
      ),
      expect.any(Object),
    );
  });
});
