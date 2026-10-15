import { hydrateRoot } from 'react-dom/client';

import { App } from './app.jsx';

// eslint-disable-next-line no-undef -- injected by esbuild define
const props = __PROPS__;
const delay = Number(new URLSearchParams(location.search).get('hydrateDelay') ?? 0);
new MutationObserver((_, observer) => {
  if (document.querySelector('svg[data-svgworm]')) {
    window.__tInject = performance.now();
    observer.disconnect();
  }
}).observe(document.documentElement, { subtree: true, childList: true });
if (document.querySelector('svg[data-svgworm]')) window.__tInject = 0;
setTimeout(() => {
  window.__tHydrate = performance.now();
  hydrateRoot(document, <App {...props} />, {
    onRecoverableError: (error) => console.error(`recoverable: ${String(error)}`),
  });
  window.__hydrated = true;
}, delay);
