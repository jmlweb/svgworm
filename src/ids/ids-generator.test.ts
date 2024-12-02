import IdsGenerator, { convertToHTMLIdSegment } from './ids-generator';

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

describe('IdsGenerator', () => {
  it('should generate unique ids for files when flatten is true', () => {
    const idsGenerator = IdsGenerator(true);
    expect(idsGenerator('foo/bar.svg')).toBe('bar');
    expect(idsGenerator('foo2/bar.svg')).toBe('bar-2');
    expect(idsGenerator('foo/baz.svg')).toBe('baz');
  });
  it('should generate unique ids for files when flatten is false', () => {
    const idsGenerator = IdsGenerator(false);
    expect(idsGenerator('foo/bar.svg')).toBe('foo.bar');
    expect(idsGenerator('foo2/bar.svg')).toBe('foo2.bar');
    expect(idsGenerator('foo/baz.svg')).toBe('foo.baz');
    expect(idsGenerator('foo/baz.svg')).toBe('foo.baz-2');
  });
});
