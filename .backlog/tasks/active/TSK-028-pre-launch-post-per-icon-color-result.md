---
id: TSK-028
title: Pre-launch post: per-icon color result
status: active
priority: P2
tags: [traction, launch, content]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-12
---

# Pre-launch post: per-icon color result

## Description

Build in public before the 12-week clock starts (docs/traction.md, pre-launch). Story: 31,390 icons, 99.98% agreement with rendering, zero multicolor icons recolored (ADR-0004). Aimed at the symptom (multicolor icons going black), not at "sprite generator".


## Acceptance Criteria

- [ ] Blog post on jmlweb.es with the 31k-icon result and a before/after image
- [ ] Every claim links to the TSK-003 spike
- [ ] Short social thread cross-posted with link to the repo
- [ ] Published before v0.1.0 (date recorded)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] docs/posts/per-icon-color.md: full draft of the blog post (symptom, method, numbers linked to the TSK-003 spike, mask trap, call to action) plus a 5-post social thread and the spec of the before/after image. Publishing on jmlweb.es, the image and the date need the maintainer.
- [2026-10-12] Rendered docs/posts/per-icon-color.png (994x472 at 2x) with the product pipeline for rows 1 and 3 and a literal global reset for row 2, rasterized with resvg from the TSK-003 spike. Draft plus image ready; publishing and the date are the maintainer's.