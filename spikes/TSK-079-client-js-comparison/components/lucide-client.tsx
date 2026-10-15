'use client';

import { useState } from 'react';

import { lucideIcons } from './lucide-icons';

export function LucideClient() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        clicked {count}
      </button>
      <ul>
        {lucideIcons.map((LucideIcon, index) => (
          <li key={index}>
            <LucideIcon />
          </li>
        ))}
      </ul>
    </div>
  );
}
