# Contributing

Contributions are licensed under MIT, the project license, simply by submitting them. There is no CLA and no DCO sign-off ([ADR-0009](docs/adr/0009-license-versioning-and-release.md)).

Read [AGENTS.md](AGENTS.md) first: it has the product principles, the commands, and the rules for decisions and tests.

User-facing changes need a changeset: run `pnpm changeset` and commit the generated file.

Tooling comes from the shared `@jmlweb/*` packages ([ADR-0011](docs/adr/0011-oxc-lint-format-and-shared-tooling-configs.md)): Oxlint (`pnpm lint`), Oxfmt (`pnpm format`), and commitlint. Commit messages must follow Conventional Commits (`type(scope): description`). `pnpm install` sets up the husky hook that checks them. For VS Code, install the Oxc extension.
