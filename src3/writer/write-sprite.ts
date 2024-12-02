import { htmlToJsx } from 'html-to-jsx-transform';

import { Result } from '../types';
import { Write } from './types';

const writeSprite = (write: Write, results: Result[]) =>
  write(
    `
    const Sprite = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
        ${results.map(({ content }) => htmlToJsx(content).replace('<svg', '<symbol').replace('</svg', '</symbol')).join('\n')}
      </svg>
    );
    
    export default Sprite;
  `,
    'sprite.tsx',
  );

export default writeSprite;
