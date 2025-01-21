import prompts from 'prompts';

import { askUser } from './ask-user';
import { loadConfigFile } from './load-config-file';
import { resolveConfig } from './resolve-config';

jest.mock('./load-config-file');
jest.mock('./ask-user', () => ({
  askUser: jest.fn(jest.requireActual('./ask-user').askUser),
  QUESTIONS: jest.requireActual('./ask-user').QUESTIONS,
}));

describe('resolveConfig', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if no config option is provided', async () => {
    await expect(resolveConfig({})).rejects.toThrow();
  });

  it('should not call loadConfigFile if config option is false', async () => {
    await resolveConfig({
      ci: true,
      config: false,
      src: 'svg',
      dest: 'dest',
    });

    expect(loadConfigFile).not.toHaveBeenCalled();
  });

  it('should apply default values if they are not provided and ci option is true', async () => {
    const config = await resolveConfig({
      ci: true,
      config: false,
      src: 'svg',
      dest: 'dest',
    });
    expect(config).toEqual({
      ci: true,
      src: 'svg',
      dest: 'dest',
      mode: 'file',
      cache: true,
      color: false,
      flatten: false,
      ts: true,
      showPerformance: false,
    });
  });

  it('should not call askUser if ci option is true', async () => {
    await resolveConfig({
      ci: true,
      config: false,
      src: 'svg',
      dest: 'dest',
    });

    expect(askUser).not.toHaveBeenCalled();
  });

  it('should ask user for missing options if ci option is false', async () => {
    prompts.inject(['file', true, false, false, false, false]);

    await resolveConfig({
      ci: false,
      config: false,
      src: 'svg',
      dest: 'dest',
    });

    expect(askUser).toHaveBeenCalled();
  });

  it('should overwrite config file options with cli options', async () => {
    (loadConfigFile as jest.Mock).mockResolvedValue({
      src: 'svg',
      dest: 'dest',
      mode: 'file',
      cache: false,
      color: true,
      flatten: true,
      ts: true,
    });
    const config = await resolveConfig({
      ci: true,
      config: 'svgworm',
      cache: true,
      ts: false,
    });
    expect(config).toEqual({
      ci: true,
      src: 'svg',
      dest: 'dest',
      mode: 'file',
      cache: true,
      color: true,
      flatten: true,
      ts: false,
      showPerformance: false,
    });
  });
});
