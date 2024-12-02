const convertToHTMLIdSegment = (
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

const IdsToPaths = (flatten: boolean) => {
  const idsCounter = new Map<string, number>();
  const idsMap: Record<string, string> = {};

  const getId = (file: string) => {
    const parts = file.slice(0, -4).split('/');
    if (flatten) {
      const lastPart = parts[parts.length - 1];
      return lastPart ? convertToHTMLIdSegment(lastPart, true) : 'u';
    } else {
      return parts
        .map((part, index) => convertToHTMLIdSegment(part, index === 0))
        .join('.');
    }
  };

  return {
    add: (file: string) => {
      const id = getId(file);
      const count = (idsCounter.get(id) ?? 0) + 1;
      idsCounter.set(id, count);
      const uniqueId = count > 1 ? `${id}-${count}` : id;
      idsMap[uniqueId] = file;
      return uniqueId;
    },
    get: (id: string) => idsMap[id],
    getAll: () => idsMap,
  };
};

export default IdsToPaths;
