import { cosmiconfig } from 'cosmiconfig';
import { format } from 'prettier';

import PrettierFormatter from './prettier-formatter';

jest.mock('cosmiconfig', () => {
  return {
    cosmiconfig: jest.fn(() => ({
      search: jest.fn(() => Promise.resolve({ config: {} })),
    })),
  };
});

jest.mock('prettier', () => {
  return {
    format: jest.fn((v) => v),
  };
});

describe('PrettierFormatter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should work with svg with no options', async () => {
    const formatter = await PrettierFormatter();
    await formatter.formatSVG('<svg></svg>');
    expect(format).toHaveBeenCalledWith('<svg></svg>', {
      endOfLine: 'lf',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
      parser: 'html',
    });
  });
  it('should work with typescript with no options', async () => {
    const formatter = await PrettierFormatter();
    await formatter.formatTS('type A = "a";');
    expect(format).toHaveBeenCalledWith('type A = "a";', {
      endOfLine: 'lf',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
      parser: 'typescript',
    });
  });
  it('should work with custom options', async () => {
    const formatter = await PrettierFormatter();
    (cosmiconfig as jest.Mock).mockImplementationOnce(() => ({
      search: jest.fn(() =>
        Promise.resolve({
          config: {
            tabWidth: 4,
          },
        }),
      ),
    }));
    await formatter.formatSVG('<svg></svg>');
    expect(format).toHaveBeenCalledWith('<svg></svg>', {
      endOfLine: 'lf',
      semi: true,
      singleQuote: true,
      tabWidth: 4,
      trailingComma: 'all',
      parser: 'html',
    });
  });
});
