import { htmlToJsx } from 'html-to-jsx-transform';

import { ResolvedOptions } from '../config/load-app-config';
import Optimizer from './optimizer';

const Transformer = async (
  options: Pick<ResolvedOptions, 'color' | 'prefix'>,
) => {
  const optimizer = await Optimizer(options);

  return (id: string, content: string) =>
    htmlToJsx(optimizer(id, content))
      .replace('<svg', '<symbol')
      .replace('</svg', '</symbol');
};

export default Transformer;
