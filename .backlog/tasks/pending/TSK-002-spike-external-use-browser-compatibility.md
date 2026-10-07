---
id: TSK-002
title: Spike: external <use> browser compatibility
status: pending
priority: P1
tags: [spike, browser, adr]
created: 2026-10-07
source: manual
depends-on: [TSK-001]
---

# Spike: external <use> browser compatibility

## Description

Resolve Q-01, Q-03, Q-04 (browser side), Q-06; inform Q-02 and Q-05. Throwaway prototype in spikes/. Render fixture symbols via external <use href=file.svg#id> in current Chromium, Firefox, WebKit. Test gradients, masks, clipPath, filters, <style>, viewBox sizing, cross-origin behavior.

## Acceptance Criteria

- [ ] Matrix feature x browser recorded in ADR
- [ ] Cross-origin behavior documented with recommended workaround
- [ ] `<style>` leakage between symbols confirmed or ruled out per browser (Q-04)
- [ ] Repeatable browser-check method chosen and documented (feeds testing.md)
- [ ] New ADR accepted/rejected; ADR 0001 moved from proposed to accepted or rejected
- [ ] open-questions.md updated
- [ ] Learning added

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created