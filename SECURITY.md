# Security policy

## Supported versions

Only the latest minor release of `svgworm` and `@svgworm/react` gets security fixes.

## Reporting a vulnerability

Report it privately through [GitHub private vulnerability reporting](https://github.com/jmlweb/svgworm/security/advisories/new). Do not open a public issue.

Include the affected version, a reproduction (an SVG or config that triggers the problem is ideal), and the impact you see. You should get a first reply within 7 days.

svgworm reads SVG files and writes generated files at build time. Reports about crafted SVGs that escape sanitization, break out of the output directory, or end up as script in generated components are in scope.
