const generateTSUnionString = (items: string[]) =>
  items.map((v) => `'${v}'`).join(' | ');

const typesTemplate = (data: string[]) => {
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
    export type Families = ${generateTSUnionString(parsedItems.families)};

    export type IconNames = ${generateTSUnionString(parsedItems.iconNames)};

    type ExtractNames<
      F extends Families | undefined,
      L extends string,
    > = F extends undefined ? L : L extends \`\${F}.\${infer N}\` ? N : never;

    export interface IconNameProps<
      F extends Families | undefined,
      N extends ExtractNames<F, IconNames> = ExtractNames<F, IconNames>,
    > {
      family?: F;
      name: N;
    }
  `;
};

export default typesTemplate;
