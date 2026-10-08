import type { IconName } from '../svgworm/icons.js';
import { Icon } from './_ui/icon';

const names: IconName[] = ['home', 'ui/check', 'brand/sunset', 'café'];

export default function Page() {
  return (
    <main id="icons" style={{ color: '#ff0000', background: '#ffffff', display: 'flex', gap: 8, padding: 8 }}>
      {names.map(name => (
        <Icon key={name} name={name} />
      ))}
    </main>
  );
}
