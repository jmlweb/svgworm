import app from './app';

describe('app', () => {
  it('should work with default values', async () => {
    const appAction = jest.fn();
    process.argv = ['node', 'cli.js'];
    await app(appAction);
    expect(appAction).toHaveBeenCalledWith(undefined, undefined, {
      '--': [],
    });
  });
  it('should work with src and dest', async () => {
    const appAction = jest.fn();
    process.argv = ['node', 'cli.js', 'src', 'dest'];
    await app(appAction);
    expect(appAction).toHaveBeenCalledWith('src', 'dest', {
      '--': [],
    });
  });
  it('should work with src and dest and --no-optimize', async () => {
    const appAction = jest.fn();
    process.argv = ['node', 'cli.js', 'src', 'dest', '--no-optimize'];
    await app(appAction);
    expect(appAction).toHaveBeenCalledWith('src', 'dest', {
      '--': [],
      optimize: false,
    });
  });
});
