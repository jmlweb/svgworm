---
id: LRN-051
title: Vite replays a pre-connect error payload to the first client only
status: active
tags: [vite, plugin, dev-server]
task: TSK-091
created: 2026-10-16
---

## Context
The plugin sends a build error to the overlay with `server.ws.send({ type: 'error' })`, often before any browser has connected.

## Insight
Vite buffers a payload sent before any client connects and delivers it to the first client only. A reload or a second tab never sees the error, so the page looks fine while the icons are stale.

## Application
Keep the last error and resend it from a `server.ws.on('vite:client:connect', (_data, client) => client.send(...))` listener until a good build clears it. After recovery, send `full-reload`, because a fix that writes identical output triggers no HMR update to clear the overlay.
