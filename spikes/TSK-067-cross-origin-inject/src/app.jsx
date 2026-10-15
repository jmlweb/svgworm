// A React 19 document rendered on the server and hydrated on the client, to see whether
// hydration keeps a sprite the loader injected into <body>. Spike code.
import { useState } from 'react';

export const App = ({ icons, loaderUrl, clientUrl }) => {
  const [count, setCount] = useState(0);
  return (
    <html lang="en">
      <head>
        <title>react</title>
        <script async src={loaderUrl} />
      </head>
      <body style={{ margin: 0, background: '#fff' }}>
        <main id="cells">
          {icons.map((icon) => (
            <svg
              key={icon.id}
              className="cell"
              data-id={icon.id}
              focusable="false"
              height="48"
              viewBox={icon.viewBox}
              width="48"
            >
              <use href={`#${icon.id}`} />
            </svg>
          ))}
        </main>
        <button id="bump" onClick={() => setCount((value) => value + 1)} type="button">
          bumped {count}
        </button>
        <script src={clientUrl} type="module" />
      </body>
    </html>
  );
};
