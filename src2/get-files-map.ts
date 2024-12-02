import path from 'node:path';

export const convertToHTMLIdSegment = (
  input: string,
  mustStartWithAlphabetic: boolean,
) => {
  const cleanInput = input
    .trim()
    // convert diacritics to their base characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // convert camelCase to kebab-case
    .replace(
      /([a-z])([A-Z])|([A-Z])([A-Z][a-z])/g,
      (_, lower, upper, start, rest) =>
        lower
          ? `${lower}-${upper.toLowerCase()}`
          : `${start.toLowerCase()}-${rest.toLowerCase()}`,
    )
    // transform to lowercase after kebabizing
    .toLowerCase()
    // replace spaces and dots with hyphens
    .replace(/[\s.]+/g, '-')
    // remove non-valid html id characters plus dots
    .replace(/[^a-z0-9_-]/g, '');
  const firstChar = cleanInput[0];
  if (firstChar === undefined) {
    return 'u';
  }
  if (mustStartWithAlphabetic && !/[a-z]/.test(firstChar)) {
    return `s_${cleanInput}`;
  }
  return cleanInput;
};

const getFilesMap = (files: string[]) => {
  const idsCounter = new Map<string, number>();

  return files.reduce(
    (acc, file) => {
      if (path.extname(file).toLowerCase() !== '.svg') {
        return acc;
      }
      const id = file
        .slice(0, -4)
        .split('/')
        .map((part, index) => convertToHTMLIdSegment(part, index === 0))
        .join('.');
      const count = (idsCounter.get(id) ?? 0) + 1;
      idsCounter.set(id, count);
      const uniqueId = count > 1 ? `${id}-${count}` : id;
      acc[uniqueId] = file;
      return acc;
    },
    {} as Record<string, string>,
  );
};

export default getFilesMap;
