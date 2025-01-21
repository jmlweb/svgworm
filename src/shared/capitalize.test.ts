import { capitalize } from './capitalize';

describe('capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });

  it('should handle empty strings', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle single character strings', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('should not modify already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello');
    expect(capitalize('World')).toBe('World');
  });

  it('should cache results', () => {
    const result1 = capitalize('test');
    const result2 = capitalize('test');
    expect(result1).toBe(result2);
  });

  it('should handle strings with numbers and special characters', () => {
    expect(capitalize('123abc')).toBe('123abc');
    expect(capitalize('!hello')).toBe('!hello');
  });
  it('should handle strings with leading and trailing whitespace', () => {
    expect(capitalize(' hello ')).toBe('Hello');
    expect(capitalize(' world ')).toBe('World');
  });
});
