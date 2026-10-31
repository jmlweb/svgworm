---
id: LRN-062
title: SvelteKit 3, Node 25 and NODE_ENV=production traps when checking generated components
status: active
tags: [svelte, vue, testing, spike]
task: TSK-099
created: 2026-10-31
---

Spike-time breakages: (1) SvelteKit 3.1 dropped svelte.config.js (config goes to sveltekit({...}) in vite.config) and removed the $lib alias (module_removed_lib, use #lib); init's SvelteKit next step still says $lib/components/Icon.svelte. (2) SvelteKit 3.1.1 builds fail on Node 25.8 with styleText('grey'); use Node 24. (3) This host exports NODE_ENV=production, which makes Vue's SSR swallow render errors: the three Icon.vue 'throws' conformance tests fail locally until NODE_ENV is unset. (4) Playwright WebKit on this Ubuntu 24.04 host lacks libevent/libavif/libwoff2/libjxl.so.0.8; extract the debs to /tmp and launch through an executablePath wrapper that sets LD_LIBRARY_PATH (symlink libjxl.so.0.8 to 0.7) instead of installing system packages.
