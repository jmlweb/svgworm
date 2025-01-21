import { pLimit } from './p-limit';

describe('pLimit', () => {
  it('should return a instance of function', () => {
    expect(pLimit(1)).toBeInstanceOf(Function);
  });

  it('should return a promise resolving to the result of the function', async () => {
    const limit = pLimit(1);
    const result = await limit(() => 1);
    expect(result).toBe(1);
  });

  it('should work when providing a promise', async () => {
    const limit = pLimit(1);
    const result = await limit(() => Promise.resolve(1));
    expect(result).toBe(1);
  });
  it('should limit the number of concurrent executions', async () => {
    let executing = 0;
    const limit = pLimit(4);
    const promises = Array.from({ length: 10 }, (_, i) =>
      limit(
        () =>
          new Promise((resolve) => {
            executing += 1;
            if (executing > 4) {
              throw new Error('Too many executions');
            }
            setTimeout(() => {
              resolve(i);
              executing -= 1;
            }, 10 - i);
          }),
      ),
    );
    const results = await Promise.all(promises);
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
