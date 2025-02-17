const generateTSUnionString = (items: string[]) =>
  items.map((v) => `'${v}'`).join(' | ');

export const typesTpl = ({
  ids,
  capitalizedIconName,
}: {
  ids: string[];
  capitalizedIconName: string;
}) => `
  export type ${capitalizedIconName}Name = ${generateTSUnionString(ids)};
`;
