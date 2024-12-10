const generateTSUnionString = (items: string[]) =>
  items.map((v) => `'${v}'`).join(' | ');

const typesTemplate = (data: string[], prefix?: string) => {
  const typeItems = data.reduce(
    (acc, id) => {
      acc.iconNames.push(id);
      const processFamilies = (subId: string) => {
        const nextIndex = subId.lastIndexOf('.');
        if (nextIndex === -1) {
          return acc;
        }
        acc.families.add(subId.slice(0, nextIndex));
        return processFamilies(subId.slice(0, nextIndex));
      };

      return processFamilies(id);
    },
    {
      families: new Set<string>(),
      iconNames: [] as string[],
    },
  );
  const parsedItems = {
    families: Array.from(typeItems.families).sort(),
    iconNames: typeItems.iconNames,
  };
  return `
    export type ${prefix}IconFamilies = ${generateTSUnionString(parsedItems.families)};

    export type ${prefix}IconNames = ${generateTSUnionString(parsedItems.iconNames)};

    type ExtractNames<
      F extends ${prefix}IconFamilies | undefined,
      L extends string,
    > = F extends undefined ? L : L extends \`\${F}.\${infer N}\` ? N : never;

    export interface ${prefix}IconNameProps<
      F extends ${prefix}IconFamilies | undefined,
      N extends ExtractNames<F, ${prefix}IconNames> = ExtractNames<F, ${prefix}IconNames>,
    > {
      family?: F;
      name: N;
    }
  `;
};

export default typesTemplate;
