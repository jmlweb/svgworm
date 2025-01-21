const cache = new Map<string, string>();

export const capitalize = (str: string) => {
  const trimmedStr = str.trim();
  const cached = cache.get(trimmedStr);
  if (cached !== undefined) return cached;

  if (!trimmedStr[0] || trimmedStr === '') return str;
  if (!/^[a-z]/.test(str)) return str;

  const capitalized = trimmedStr[0].toUpperCase() + trimmedStr.slice(1);
  cache.set(trimmedStr, capitalized);
  return capitalized;
};
