import { Config } from '../config/schemas';
import { timeMeasurer } from '../shared/time-measurer';

export const convertToHTMLIdSegment = (
  input: string,
  mustStartWithAlphabetic: boolean,
) => {
  // Pre-compile regex patterns
  const diacriticsPattern = /[\u0300-\u036f]/g;
  const camelCasePattern = /([a-z])([A-Z])|([A-Z])([A-Z][a-z])/g;
  const spacesDotsPattern = /[\s.]+/g;
  const invalidCharsPattern = /[^a-z0-9_-]/g;
  const alphabeticPattern = /[a-z]/;

  // Chain transformations in a single pass where possible
  const cleanInput = input
    .trim()
    .normalize('NFD')
    .replace(diacriticsPattern, '')
    .replace(camelCasePattern, (_, lower, upper, start, rest) =>
      lower
        ? `${lower}-${upper.toLowerCase()}`
        : `${start.toLowerCase()}-${rest.toLowerCase()}`,
    )
    .toLowerCase()
    .replace(spacesDotsPattern, '-')
    .replace(invalidCharsPattern, '');

  // Early return for empty string
  if (!cleanInput) {
    return 'u';
  }

  // Check first character only once
  if (
    mustStartWithAlphabetic &&
    cleanInput[0] &&
    !alphabeticPattern.test(cleanInput[0])
  ) {
    return `s_${cleanInput}`;
  }

  return cleanInput;
};

export const IdsGenerator = (flatten: Config['flatten']) => {
  const idsCounter = new Map<string, number>();

  const getId = (file: string) => {
    // Remove extension and split once
    const parts = file.slice(0, -4).split('/');

    // For flatten mode, just process last segment
    if (flatten) {
      return convertToHTMLIdSegment(parts[parts.length - 1] || '', true) || 'u';
    }

    // For hierarchical mode, process all parts at once
    let firstPart = true;
    return parts.reduce((acc, part) => {
      const segment = convertToHTMLIdSegment(part, firstPart);
      firstPart = false;
      return acc ? `${acc}.${segment}` : segment;
    }, '');
  };

  return (filePath: string) => {
    const stopMeasuring = timeMeasurer.start('generateId');
    const id = getId(filePath);

    // Increment counter and get unique ID in one pass
    const count = idsCounter.get(id) || 0;
    idsCounter.set(id, count + 1);

    stopMeasuring();
    return count ? `${id}-${count + 1}` : id;
  };
};
