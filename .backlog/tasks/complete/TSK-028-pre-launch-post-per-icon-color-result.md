---
id: TSK-028
title: Pre-launch post: per-icon color result
status: complete
priority: P2
tags: [traction, launch, content]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-12
completed: 2026-10-15
---

# Pre-launch post: per-icon color result

## Description

Build in public before the 12-week clock starts (docs/traction.md, pre-launch). Story: 31,390 icons, 99.98% agreement with rendering, zero multicolor icons recolored (ADR-0004). Aimed at the symptom (multicolor icons going black), not at "sprite generator".


## Acceptance Criteria

- [x] LinkedIn article with the 31k-icon result and a before/after image — evidence: LinkedIn article published 2026-10-15 with the 31,390-icon result and docs/posts/per-icon-color.png (2026-10-15)
- [x] Every claim links to the TSK-003 spike — evidence: docs/posts/per-icon-color.md: every claim links to spikes/TSK-003-color-classification (RESULTS.md sections, src/color.mjs, src/evaluate.mjs); all links 200 (2026-10-15)
- [x] Short social thread on X and a LinkedIn post, with link to the repo — evidence: X thread (5 posts) and LinkedIn commentary published 2026-10-15, linking the repo and svgworm.com (2026-10-15)
- [x] Published (date recorded in TSK-028 and docs/metrics/manual.json) — evidence: published 2026-10-15; recorded in this log and docs/metrics/manual.json posts[per-icon-color] (2026-10-15)

## Notes

## Learnings

- LRN-037: LinkedIn article publish dialog replaces a separate share post
## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] docs/posts/per-icon-color.md: full draft of the blog post (symptom, method, numbers linked to the TSK-003 spike, mask trap, call to action) plus a 5-post social thread and the spec of the before/after image. Publishing on jmlweb.es, the image and the date need the maintainer.
- [2026-10-12] Rendered docs/posts/per-icon-color.png (994x472 at 2x) with the product pipeline for rows 1 and 3 and a literal global reset for row 2, rasterized with resvg from the TSK-003 spike. Draft plus image ready; publishing and the date are the maintainer's.
- [2026-10-14] Criteria reworded with the maintainer: jmlweb.es has no blog, so the post is a LinkedIn article plus an X thread and a LinkedIn share post; "published before v0.1.0" became "published, date recorded" because 0.1.0 shipped on 2026-10-13. docs/traction.md updated to match.
- [2026-10-14] Draft checked against spikes/TSK-003-color-classification/RESULTS.md: every number matches. Fixed the mask claim (the 2,029,875 to 437,829 pixel drop is the spike's #fff to currentColor negative control), listed all 5 misses (d3js, uwsgi, flag xx, gulp), and linked each claim to the spike (RESULTS sections, src/color.mjs, src/evaluate.mjs), the TSK-002 browser results, ADR-0006 and docs/comparison.md.
- [2026-10-14] X thread (5 posts, 178-245 chars with t.co URLs) and the LinkedIn share post are in docs/posts/per-icon-color.md. Remaining for the maintainer: publish the article with the image, then the X thread and LinkedIn post, then send the URLs and date.
- [2026-10-15] Post retargeted for the current release: "0.2 is on npm" instead of 0.1.0, the closing section covers Next.js and Astro (Icon.astro, Astro install without @svgworm/react, from apps/site docs), and the links lead with svgworm.com (docs and comparison) while every spike claim keeps its GitHub link. All 11 links return 200; the RESULTS.md anchors exist.
- [2026-10-15] LinkedIn flow confirmed in LinkedIn Help: the publish step has a "Tell your network what your article is about" field, so the share post is now that commentary (no article link, #astro added); it covers criterion 3 together with the X thread. X post 5 trimmed to 264 characters. Cover: https://svgworm.com/og.png; the before/after PNG stays in the body (kept off-brand by the maintainer's choice).
- [2026-10-15] Publishing kit v2: https://claude.ai/artifact/BGfv7yrCfdsFeZXRCPfWFK (cover, title, article, SEO title and description, commentary, thread). docs/metrics/manual.json has no post-date field and the snapshot script reads only known keys, so the date goes in this task; criterion 4 needs rewording or a manual.json field when the maintainer reports back.
- [2026-10-15] Published by the maintainer on 2026-10-15: LinkedIn article (cover og.png, before/after PNG in the body, commentary in the publish dialog) and the 5-post X thread. Date recorded here and in docs/metrics/manual.json under a new posts field (documented in docs/metrics/README.md; the snapshot script does not read it). Article and thread URLs not yet recorded.
- [2026-10-15] Completed