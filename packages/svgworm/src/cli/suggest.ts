// Levenshtein distance, enough for "did you mean" on flag and icon names.
const distance = (a: string, b: string): number => {
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(
        (next[j - 1] ?? 0) + 1,
        (row[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + cost,
      );
    }
    row = next;
  }
  return row[b.length] ?? 0;
};

/**
 * Candidates close enough to `input` to be a typo, nearest first. The allowance grows
 * with the length, so a short name tolerates one or two edits and a long one a few more.
 */
export const suggestClosest = (
  input: string,
  candidates: readonly string[],
  limit = 3,
): readonly string[] => {
  const allowance = Math.max(2, Math.floor(input.length / 3));
  const needle = input.toLowerCase();
  return candidates
    .map((candidate) => ({
      candidate,
      cost: distance(needle, candidate.toLowerCase()),
    }))
    .filter(({ cost }) => cost <= allowance)
    .toSorted((a, b) => a.cost - b.cost || (a.candidate < b.candidate ? -1 : 1))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
};

/** The `Did you mean …?` tail of an error message, or nothing when no name is close. */
export const didYouMean = (suggestions: readonly string[]): string =>
  suggestions.length === 0
    ? ''
    : ` Did you mean ${suggestions.map((name) => `"${name}"`).join(', ')}?`;
