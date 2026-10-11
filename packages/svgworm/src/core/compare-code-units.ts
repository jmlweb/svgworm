// Relational operators on strings compare UTF-16 code units, which is locale-independent.
// `localeCompare` depends on ICU data and the process locale, so it breaks determinism.
export const compareCodeUnits = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

/**
 * Unicode code point order, which equals UTF-8 byte order. The output contract requires it
 * for names; it differs from code unit order when an astral character meets U+E000..U+FFFF.
 */
export const compareCodePoints = (a: string, b: string): number => {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const x = a.codePointAt(i) ?? 0;
    const y = b.codePointAt(j) ?? 0;
    if (x !== y) return x < y ? -1 : 1;
    i += x > 0xffff ? 2 : 1;
    j += y > 0xffff ? 2 : 1;
  }
  return a.length - i === b.length - j
    ? 0
    : a.length - i < b.length - j
      ? -1
      : 1;
};
