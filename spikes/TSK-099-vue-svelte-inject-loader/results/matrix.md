# TSK-099 matrix

18 of 18 cases pass.

| App | Mount | Engine | Loader tag in server HTML | Sprite injected (count) | Icon painted (red share) | After loader remount | Swapped loader refused | Hydration warnings | Result |
|-----|-------|--------|---------------------------|-------------------------|--------------------------|----------------------|------------------------|--------------------|--------|
| Vue | client-only (Vite SPA) | chromium | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Vue | client-only (Vite SPA) | firefox | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Vue | client-only (Vite SPA) | webkit | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Nuxt | SSR + hydration | chromium | yes | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Nuxt | SSR + hydration | firefox | yes | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Nuxt | SSR + hydration | webkit | yes | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Nuxt | client-only (ssr: false) | chromium | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Nuxt | client-only (ssr: false) | firefox | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Nuxt | client-only (ssr: false) | webkit | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Svelte | client-only (Vite SPA, mount) | chromium | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Svelte | client-only (Vite SPA, mount) | firefox | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| Svelte | client-only (Vite SPA, mount) | webkit | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| SvelteKit | SSR + hydration | chromium | yes | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| SvelteKit | SSR + hydration | firefox | yes | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| SvelteKit | SSR + hydration | webkit | yes | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| SvelteKit | client-only (ssr = false) | chromium | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| SvelteKit | client-only (ssr = false) | firefox | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |
| SvelteKit | client-only (ssr = false) | webkit | no | yes (1) | 0.45 | 1 sprite, 0.45 | yes | 0 | pass |

Console errors on the swapped-loader page, first case: `error: Failed to find a valid digest in the 'integrity' attribute for resource 'http://localhost:4311/icons/icons.loader.fd330b48.js' with computed SHA-384 integrity 'plFC6wRR/jw/nzVgLdhn0ZfX2KgBWVG1U57lMGGCEBp0sZM27PAFor5wn9+hdN05'. The resource has been blocked.`
