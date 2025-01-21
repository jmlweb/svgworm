import prompts from 'prompts';

import { askUser } from './ask-user';

describe('askUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should not ask the user if all values are provided', async () => {
    const result = await askUser({
      src: 'src',
      dest: 'dest',
      mode: 'file',
      cache: true,
      flatten: true,
      color: true,
      prefix: 'prefix',
      ts: true,
    });
    expect(result).toEqual({});
  });
  it('should ask the user for missing values', async () => {
    prompts.inject(['file', true, true, false, false, '']);

    const result = await askUser({
      src: 'svg',
      dest: 'dest',
    });

    expect(result).toEqual({
      mode: 'file',
      cache: true,
      flatten: false,
      color: false,
      prefix: undefined,
      ts: true,
    });
  });
});
