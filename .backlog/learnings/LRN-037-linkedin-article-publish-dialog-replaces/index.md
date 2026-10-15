---
id: LRN-037
title: LinkedIn article publish dialog replaces a separate share post
status: active
tags: [traction, content, linkedin]
task: TSK-028
created: 2026-10-15
---

## Context
TSK-028 planned a LinkedIn article plus a separate LinkedIn share post linking to it.

## Insight
LinkedIn's article flow (Help a522427) ends with Next and a "Tell your network what your article is about" field. That text becomes the feed post that carries the article, so a second share post is redundant. Articles are desktop-only; the editor supports code blocks. Cover-size guidance disagrees (16:9 vs about 1200x630), so a 1200x630 OG image may lose about 40px per side.

## Application
For a LinkedIn article, write the share copy as the publish-dialog commentary, without an article link. Check the cover preview before publishing. Record each published post in docs/metrics/manual.json `posts`.
