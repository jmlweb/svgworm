import { htmlToJsx } from 'html-to-jsx-transform';

import Optimizer from './optimizer';

const Transformer = async () => {
  const optimizer = await Optimizer();

  return (id: string, content: string) =>
    htmlToJsx(optimizer(id, content))
      .replace('<svg', '<symbol')
      .replace('</svg', '</symbol');
};

export default Transformer;
