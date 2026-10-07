---
id: TSK-002
title: Spike: external <use> browser compatibility
status: complete
priority: P1
tags: [spike, browser, adr]
created: 2026-10-07
source: manual
depends-on: [TSK-001]
started: 2026-10-07
completed: 2026-10-07
---

# Spike: external <use> browser compatibility

## Description

Resolve Q-01, Q-03, Q-04 (browser side), Q-06; inform Q-02 and Q-05. Throwaway prototype in spikes/. Render fixture symbols via external <use href=file.svg#id> in current Chromium, Firefox, WebKit. Test gradients, masks, clipPath, filters, <style>, viewBox sizing, cross-origin behavior.

Scope cut (TSK-014): cross-origin is documented as a constraint with same-origin recommended, not prototyped. The ADR-0004 mono rewrite is also checked in all three browsers, since it was verified only with resvg.

## Acceptance Criteria

- [x] Matrix feature x browser recorded in ADR
- [x] ADR-0004 mono rewrite rendered in Chromium, Firefox, WebKit
- [x] Cross-origin constraint documented; same-origin recommended (no workaround prototype)
- [x] `<style>` leakage between symbols confirmed or ruled out per browser (Q-04)
- [x] Repeatable browser-check method chosen and documented (feeds testing.md)
- [x] New ADR accepted/rejected; ADR 0001 moved from proposed to accepted or rejected
- [x] open-questions.md updated
- [x] Learning added

## Notes

## Learnings

- LRN-017: WebKit ignores url(#...) references in external use sprites
## Progress Log

- [2026-10-07] Created
- [2026-10-07] Started
- [2026-10-07] Spike spikes/TSK-002-external-use (Playwright Chromium/Firefox/WebKit). WebKit drops all url(#) refs from external sprites; Firefox drops masks containing <use>. SVG-stack fallback (<img>, CSS mask for mono) renders 24/24 everywhere. ADR-0004 mono rewrite confirmed in all three engines. Raw <style> leaks in Chromium, ignored elsewhere. Cross-origin blocked everywhere. ADR-0006 accepted (pulls part of Q-05 into v0.1, pending user sign-off); ADR-0001 accepted. open-questions, output-contract, R-23, viability, testing.md updated. Learning LRN-017. Branch tsk-002-external-use-spike, commit 312fb9a (not merged).
- [2026-10-07] User accepted the ADR-0006 scope change (part of Q-05 pulled into v0.1). Merged into next.
- [2026-10-07] Completed