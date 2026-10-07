# Decision rules

- Choosing a runtime, language target, build tool, test runner, SVG parser or optimizer, CLI framework, or config format **requires an ADR** in `docs/adr/`.
- Use `docs/adr/0000-template.md`. Number ADRs sequentially and name them `NNNN-kebab-title.md`.
- Status flow: `proposed` → `accepted` | `rejected`. Later, an ADR can become `superseded by NNNN`.
- Never edit an accepted ADR's decision. Write a new ADR that supersedes it.
- Every ADR cites evidence: a spike result, benchmark, docs link, or browser test. "It's popular" is not evidence.
- When an ADR answers an item in `docs/open-questions.md`, mark that item resolved there with a link to the ADR.
- Prefer few dependencies. Each new runtime dependency must be justified in an ADR, because consumers pay for it.
