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

- [ ] LinkedIn article with the 31k-icon result and a before/after image
- [ ] Every claim links to the TSK-003 spike
- [ ] Short social thread on X and a LinkedIn post, with link to the repo
- [ ] Published (date recorded in TSK-028 and docs/metrics/manual.json)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] docs/posts/per-icon-color.md: full draft of the blog post (symptom, method, numbers linked to the TSK-003 spike, mask trap, call to action) plus a 5-post social thread and the spec of the before/after image. Publishing on jmlweb.es, the image and the date need the maintainer.
- [2026-10-12] Rendered docs/posts/per-icon-color.png (994x472 at 2x) with the product pipeline for rows 1 and 3 and a literal global reset for row 2, rasterized with resvg from the TSK-003 spike. Draft plus image ready; publishing and the date are the maintainer's.
- [2026-10-14] Criteria reworded with the maintainer: jmlweb.es has no blog, so the post is a LinkedIn article plus an X thread and a LinkedIn share post; "published before v0.1.0" became "published, date recorded" because 0.1.0 shipped on 2026-10-13. docs/traction.md updated to match.
- [2026-10-14] Draft checked against spikes/TSK-003-color-classification/RESULTS.md: every number matches. Fixed the mask claim (the 2,029,875 to 437,829 pixel drop is the spike's #fff to currentColor negative control), listed all 5 misses (d3js, uwsgi, flag xx, gulp), and linked each claim to the spike (RESULTS sections, src/color.mjs, src/evaluate.mjs), the TSK-002 browser results, ADR-0006 and docs/comparison.md.
- [2026-10-14] X thread (5 posts, 178-245 chars with t.co URLs) and the LinkedIn share post are in docs/posts/per-icon-color.md. Remaining for the maintainer: publish the article with the image, then the X thread and LinkedIn post, then send the URLs and date.