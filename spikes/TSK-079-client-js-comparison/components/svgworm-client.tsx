'use client';

import { useState } from 'react';

import { Icon, svgwormNames } from './svgworm-icon';

export function SvgwormClient() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        clicked {count}
      </button>
      <ul>
        {svgwormNames.map((name) => (
          <li key={name}>
            <Icon name={name} />
          </li>
        ))}
      </ul>
    </div>
  );
}
