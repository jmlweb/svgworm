---
id: LRN-023
title: Task scope text goes stale when later ADRs change a decision
status: active
tags: [design, contract, adr]
task: TSK-008
created: 2026-10-11
---

**Context:** TSK-008 (written 2026-10-07) said the per-icon `delivery` field (Q-05) was deferred past v0.1. ADR-0006 and ADR-0010 (2026-10-08) later pulled it into v0.1, because Firefox and WebKit cannot render `url(#…)` references through an external `<use>`.

**Insight:** A task's Description is a snapshot. Before freezing a contract, check the ADRs that answer its open questions, and do not trust the scope text alone. Here the stale text would have dropped a field that the rendering spikes proved necessary.

**Application:** When starting a task that cites open questions, grep `docs/open-questions.md` for each one. If an ADR resolved it after the task was written, follow the ADR and log the deviation in the task's progress log and the new ADR.
