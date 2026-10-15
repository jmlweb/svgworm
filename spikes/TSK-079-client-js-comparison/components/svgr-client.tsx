'use client';

import { useState } from 'react';

import { svgrIcons } from './svgr-icons';

export function SvgrClient() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        clicked {count}
      </button>
      <ul>
        {svgrIcons.map((SvgrIcon, index) => (
          <li key={index}>
            <SvgrIcon />
          </li>
        ))}
      </ul>
    </div>
  );
}
