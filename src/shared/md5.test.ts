import { md5 } from './md5';

describe('md5', () => {
  it('should hash the input', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });
});
