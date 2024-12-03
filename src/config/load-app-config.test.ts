import { cosmiconfig } from 'cosmiconfig';

import loadAppConfig from './load-app-config';

jest.mock('cosmiconfig', () => {
  return {
    cosmiconfig: jest.fn(() => ({
      search: jest.fn(() => Promise.resolve({ config: {} })),
    })),
  };
});

describe('loadConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should throw if no dest option is passed, not from a file nor from the cli', async () => {
    expect(async () => {
      await loadAppConfig({});
    }).rejects.toThrow('Destination folder is required');
  });
  it('should return the config from the file if no options are passed', async () => {
    (cosmiconfig as jest.Mock).mockImplementationOnce(() => ({
      search: jest.fn(() =>
        Promise.resolve({
          config: {
            src: './svg2',
            dest: './dest2',
            clean: false,
            force: false,
          },
        }),
      ),
    }));
    const config = await loadAppConfig({});
    expect(config).toEqual({
      src: './svg2',
      dest: './dest2',
      flatten: false,
      clean: false,
      force: false,
    });
  });
  it('should take the default values', async () => {
    (cosmiconfig as jest.Mock).mockImplementationOnce(() => ({
      search: jest.fn(() => Promise.resolve({ config: { dest: './dest' } })),
    }));
    const config = await loadAppConfig({});
    expect(config).toEqual({
      src: 'svg',
      dest: './dest',
      flatten: false,
      clean: true,
      force: false,
    });
  });
  it('should merge the values from the config file with the values passed from cli', async () => {
    (cosmiconfig as jest.Mock).mockImplementationOnce(() => ({
      search: jest.fn(() =>
        Promise.resolve({
          config: { src: './svg', dest: './dest' },
        }),
      ),
    }));
    const config = await loadAppConfig({
      src: './svg2',
      clean: false,
    });
    expect(config).toEqual({
      src: './svg2',
      dest: './dest',
      flatten: false,
      clean: false,
      force: false,
    });
  });
  it('should work if an error happens when loading the file', async () => {
    (cosmiconfig as jest.Mock).mockImplementationOnce(() => ({
      search: jest.fn(() => Promise.reject('Error')),
    }));
    const config = await loadAppConfig({
      src: './svg2',
      dest: './svg',
    });
    expect(config).toEqual({
      src: './svg2',
      dest: './svg',
      flatten: false,
      clean: true,
      force: false,
    });
  });
  it('should discard non valid values passed from the cli', async () => {
    (cosmiconfig as jest.Mock).mockImplementationOnce(() => ({
      search: jest.fn(() =>
        Promise.resolve({
          config: { src: './svg', dest: './dest' },
        }),
      ),
    }));
    const config = await loadAppConfig({
      src: ['./svg2'] as unknown as string,
      dest: './dest2',
      clean: 'blabla' as unknown as boolean,
    });
    expect(config).toEqual({
      src: 'svg',
      dest: './dest2',
      flatten: false,
      clean: true,
      force: false,
    });
  });
});
