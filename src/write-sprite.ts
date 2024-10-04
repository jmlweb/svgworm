import fs from 'node:fs/promises';

import { htmlToJsx } from 'html-to-jsx-transform';

import { Formatter, Result } from './types';

const writeSprite = async (
  results: Result[],
  destPath: string,
  formatter: Formatter,
) => {
  const template = await formatter.formatTS(`
    const Sprite = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
        ${results.map(({ content }) => htmlToJsx(content).replace('<svg', '<symbol').replace('</svg', '</symbol')).join('\n')}
      </svg>
    );
    
    export default Sprite;
  `);
  await fs.writeFile(`${destPath}/sprite.tsx`, template);
};

export default writeSprite;
