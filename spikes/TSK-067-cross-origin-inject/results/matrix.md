Loader: 1217 B unminified (with a real URL and sha384), no dependencies. Sprite 87672 B, 6 use / 3 img / 2 mask icons checked.

| Engine | Scenario | Pass | Detail |
| --- | --- | --- | --- |
| chromium | inject: use #id renders like same-origin external use | yes | diff 0.00% ink 14.6%, injected 1, at 384 ms, CLS 0, errors 0 |
| chromium | time to sprite: same-origin responseEnd vs injected (latency 120 ms per response) | yes | same-origin 250 ms, injected 384 ms, delta 134 ms |
| chromium | SRI mismatch injects nothing, logs an error | yes | injected 0, ink 0.00%, log: error: svgworm: sprite not loaded from http://localhost:49404/cors/tampered.svg: Failed to fetch |
| chromium | CDN without CORS injects nothing, logs an error | yes | injected 0, log: error: svgworm: sprite not loaded from http://localhost:49404/nocors/icons.6df314fa.svg: Failed to fetch |
| chromium | stack img-cors cross-origin renders like same-origin | yes | diff 0.00% ink 13.1% |
| chromium | stack img-nocors cross-origin renders like same-origin | yes | diff 0.00% ink 13.1% |
| chromium | stack mask-cors cross-origin renders like same-origin | yes | diff 0.00% ink 8.3% red 97% |
| chromium | stack mask-nocors: blank (masks need CORS), as expected | yes | diff 8.18% ink 0.0% red 0% |
| chromium | CSP script-src + connect-src CDN: works | yes | diff 0.00%, CSP errors 0 |
| chromium | CSP without connect-src CDN: blocked, nothing injected | yes | injected 0, logs: error: Connecting to 'http://localhost:49404/cors/icons.6df314fa.svg' violates the following Content Security Policy directive: "connect-src 'self'". The action has been blocked. \| error: Fetch API cannot load http://loc |
| chromium | duplicate loader tags + re-added tag inject once | yes | injected 1, diff 0.00%, errors 0 |
| chromium | page id equal to a symbol id: sprite is prepended, so the symbol wins | yes | getElementById → <symbol>, diff 0.00% |
| chromium | loader with integrity + crossorigin: works | yes | diff 0.00%, errors 0 |
| chromium | tampered loader with pinned integrity: never runs | yes | {"pwned":null,"injected":0}, log: error: Failed to find a valid digest in the 'integrity' attribute for resource 'http://localhost:49404/cors/loader-tampered.js' with computed SHA-384 integrity '0S2KFX1z+eO8lsjoGm2A6hxu71Eg/vumSmmQU1g |
| chromium | body swap (view transitions): the loader re-injects the sprite | yes | injected after swap 1, ink 14.59% |
| chromium | hostile sprite (with valid SRI): no script, handler or javascript: URL runs | yes | {"pwned":null,"injected":1,"scripts":0} |
| chromium | React 19 hydration (react): sprite kept, no hydration error | yes | {"order":"inject first","hydrated":true,"injected":1,"label":"bumped 1"}, ink 13.5%, errors: none |
| chromium | React 19 hydration (react-late): sprite kept, no hydration error | yes | {"order":"hydrate first","hydrated":true,"injected":1,"label":"bumped 1"}, ink 13.5%, errors: none |
| firefox | inject: use #id renders like same-origin external use | yes | diff 0.00% ink 14.6%, injected 1, at 391 ms, CLS 0, errors 0 |
| firefox | time to sprite: same-origin responseEnd vs injected (latency 120 ms per response) | yes | same-origin 253 ms, injected 391 ms, delta 138 ms |
| firefox | SRI mismatch injects nothing, logs an error | yes | injected 0, ink 0.00%, log: error: svgworm: sprite not loaded from http://localhost:49404/cors/tampered.svg: NetworkError when attempting to fetch resource. |
| firefox | CDN without CORS injects nothing, logs an error | yes | injected 0, log: error: svgworm: sprite not loaded from http://localhost:49404/nocors/icons.6df314fa.svg: NetworkError when attempting to fetch resource. |
| firefox | stack img-cors cross-origin renders like same-origin | yes | diff 0.00% ink 13.1% |
| firefox | stack img-nocors cross-origin renders like same-origin | yes | diff 0.00% ink 13.1% |
| firefox | stack mask-cors cross-origin renders like same-origin | yes | diff 0.00% ink 8.2% red 97% |
| firefox | stack mask-nocors: blank (masks need CORS), as expected | yes | diff 8.15% ink 0.0% red 0% |
| firefox | CSP script-src + connect-src CDN: works | yes | diff 0.00%, CSP errors 0 |
| firefox | CSP without connect-src CDN: blocked, nothing injected | yes | injected 0, logs: error: svgworm: sprite not loaded from http://localhost:49404/cors/icons.6df314fa.svg: NetworkError when attempting to fetch resource. \| error: [JavaScript Error: "Content-Security-Policy: The page’s settings blocked the |
| firefox | duplicate loader tags + re-added tag inject once | yes | injected 1, diff 0.00%, errors 0 |
| firefox | page id equal to a symbol id: sprite is prepended, so the symbol wins | yes | getElementById → <symbol>, diff 0.00% |
| firefox | loader with integrity + crossorigin: works | yes | diff 0.00%, errors 0 |
| firefox | tampered loader with pinned integrity: never runs | yes | {"pwned":null,"injected":0}, log: error: [JavaScript Error: "None of the “sha384” hashes in the integrity attribute match the content of the subresource at “http://localhost:49404/cors/loader-tampered.js”. The computed hash is “0S2KFX |
| firefox | body swap (view transitions): the loader re-injects the sprite | yes | injected after swap 1, ink 14.59% |
| firefox | hostile sprite (with valid SRI): no script, handler or javascript: URL runs | yes | {"pwned":null,"injected":1,"scripts":0} |
| firefox | React 19 hydration (react): sprite kept, no hydration error | yes | {"order":"inject first","hydrated":true,"injected":1,"label":"bumped 1"}, ink 13.0%, errors: none |
| firefox | React 19 hydration (react-late): sprite kept, no hydration error | yes | {"order":"hydrate first","hydrated":true,"injected":1,"label":"bumped 1"}, ink 13.0%, errors: none |
| webkit | inject: use #id renders like same-origin external use | yes | diff 0.00% ink 14.6%, injected 1, at 409 ms, CLS 0, errors 0 |
| webkit | time to sprite: same-origin responseEnd vs injected (latency 120 ms per response) | yes | same-origin 248 ms, injected 409 ms, delta 161 ms |
| webkit | SRI mismatch injects nothing, logs an error | yes | injected 0, ink 0.00%, log: error: svgworm: sprite not loaded from http://localhost:49404/cors/tampered.svg: Load failed |
| webkit | CDN without CORS injects nothing, logs an error | yes | injected 0, log: error: svgworm: sprite not loaded from http://localhost:49404/nocors/icons.6df314fa.svg: Load failed |
| webkit | stack img-cors cross-origin renders like same-origin | yes | diff 0.00% ink 13.1% |
| webkit | stack img-nocors cross-origin renders like same-origin | yes | diff 0.00% ink 13.1% |
| webkit | stack mask-cors cross-origin renders like same-origin | yes | diff 0.00% ink 8.2% red 97% |
| webkit | stack mask-nocors: blank (masks need CORS), as expected | yes | diff 8.15% ink 0.0% red 0% |
| webkit | CSP script-src + connect-src CDN: works | yes | diff 0.00%, CSP errors 0 |
| webkit | CSP without connect-src CDN: blocked, nothing injected | yes | injected 0, logs: error: Refused to connect to http://localhost:49404/cors/icons.6df314fa.svg because it does not appear in the connect-src directive of the Content Security Policy. \| error: svgworm: sprite not loaded from http://localhos |
| webkit | duplicate loader tags + re-added tag inject once | yes | injected 1, diff 0.00%, errors 0 |
| webkit | page id equal to a symbol id: sprite is prepended, so the symbol wins | yes | getElementById → <symbol>, diff 0.00% |
| webkit | loader with integrity + crossorigin: works | yes | diff 0.00%, errors 0 |
| webkit | tampered loader with pinned integrity: never runs | yes | {"pwned":null,"injected":0}, log: error: Cannot load script http://localhost:49404/cors/loader-tampered.js. Failed integrity metadata check. Content length: 1239, Expected content length: -1, Expected metadata: sha384-Y+oBMSbbHYoGkici |
| webkit | body swap (view transitions): the loader re-injects the sprite | yes | injected after swap 1, ink 14.58% |
| webkit | hostile sprite (with valid SRI): no script, handler or javascript: URL runs | yes | {"pwned":null,"injected":1,"scripts":0} |
| webkit | React 19 hydration (react): sprite kept, no hydration error | yes | {"order":"inject first","hydrated":true,"injected":1,"label":"bumped 1"}, ink 13.5%, errors: none |
| webkit | React 19 hydration (react-late): sprite kept, no hydration error | yes | {"order":"hydrate first","hydrated":true,"injected":1,"label":"bumped 1"}, ink 13.5%, errors: none |
