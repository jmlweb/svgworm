import getFilesMap, { convertToHTMLIdSegment } from './get-files-map';

describe('convertToHTMLIdSegment', () => {
  it('should trim the input', () => {
    expect(convertToHTMLIdSegment('  foo  ', false)).toBe('foo');
  });
  it('should convert diacritics to their base characters', () => {
    expect(convertToHTMLIdSegment('áéíóú', false)).toBe('aeiou');
  });
  it('should convert camelCase to kebab-case', () => {
    expect(convertToHTMLIdSegment('fooBar', false)).toBe('foo-bar');
  });
  it('should transform to lowercase after kebabizing', () => {
    expect(convertToHTMLIdSegment('fooBar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('FooBar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('FooBAr', false)).toBe('foo-bar');
  });
  it('should replace spaces with hyphens', () => {
    expect(convertToHTMLIdSegment('foo bar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('foo  bar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('foo\tbar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('foo\nbar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('foo\t\n bar', false)).toBe('foo-bar');
  });
  it('should replace dots with dashes', () => {
    expect(convertToHTMLIdSegment('foo.bar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('foo..bar', false)).toBe('foo-bar');
    expect(convertToHTMLIdSegment('foo.bar.baz', false)).toBe('foo-bar-baz');
  });
  it('should remove non-valid html id characters', () => {
    expect(convertToHTMLIdSegment('foo!@#$%^&*()_+bar', false)).toBe('foo_bar');
    expect(convertToHTMLIdSegment('foo!@#$%^&*()_+bar', false)).toBe('foo_bar');
    expect(convertToHTMLIdSegment('foo!@#$%^&*()_+bar', false)).toBe('foo_bar');
  });
  it('should return u if the clean input is empty', () => {
    expect(convertToHTMLIdSegment('!@#$%^&*()+', false)).toBe('u');
  });
  it('should add the prefix "s_" if first char is not alphabetic and mustStartWithAlphabetic is true', () => {
    expect(convertToHTMLIdSegment('123', true)).toBe('s_123');
  });
});

describe('getFilesMap', () => {
  it('should return a map of files', () => {
    const files = [
      'src/foo.svg',
      'src/bar/foo.svg',
      'src/bar/baz.svg',
      'src/bar/baz/qux.svg',
    ];
    const expected = {
      foo: 'src/foo.svg',
      'src.bar.baz.qux': 'src/bar/baz/qux.svg',
      'src.bar.baz': 'src/bar/baz.svg',
      'src.bar.foo': 'src/bar/foo.svg',
    };
    expect(getFilesMap(files)).toEqual(expected);
  });
});
