// Relational operators on strings compare UTF-16 code units, which is locale-independent.
// `localeCompare` depends on ICU data and the process locale, so it breaks determinism.
export const compareCodeUnits = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;
