# Contributing

Thanks for helping out! Bug reports, fixes and docs improvements are all welcome.

## Before you start

- Read [AGENTS.md](AGENTS.md) first. It has the product principles, the commands, and the rules for decisions and tests.
- Contributions are licensed under MIT, the project license, simply by submitting them. There is no CLA and no DCO sign-off ([ADR-0009](docs/adr/0009-license-versioning-and-release.md)).

## Setup

```bash
pnpm install    # also sets up the husky commit-msg hook
pnpm verify     # lint, format, typecheck, tests and package checks
```

## Making a change

- **Commits** follow Conventional Commits (`type(scope): description`). The husky hook checks them. Start the subject lowercase: `@jmlweb/commitlint-config` rejects sentence-case, start-case, PascalCase and upper-case subjects.
- **User-facing changes** need a changeset: run `pnpm changeset` and commit the generated file.
- **Tooling** comes from the shared `@jmlweb/*` packages ([ADR-0011](docs/adr/0011-oxc-lint-format-and-shared-tooling-configs.md)): Oxlint (`pnpm lint`), Oxfmt (`pnpm format`), and commitlint. For VS Code, install the Oxc extension.
