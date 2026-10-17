---
id: LRN-059
title: getSymbolAtLocation on { Logo } and export { Logo } returns their own symbol, not the import
status: active
tags: [typescript, compiler-api, codemod]
task: TSK-093
created: 2026-10-17
---

## Context
The SVGR codemod finds every reference to an import binding by comparing `checker.getSymbolAtLocation(id)` with the import alias symbol. The goal is to rewrite JSX only when the binding is used solely as a tag.

## Insight
- For a shorthand property `{ Logo }`, `getSymbolAtLocation` returns the property symbol.
- For `export { Logo }`, it returns the export-specifier symbol.

Neither compares equal to the import alias. Those value uses were missed, and the codemod deleted an import that was still referenced, with exit 0. A fresh-context review caught it.

## Application
- In reference scans, resolve shorthand properties with `checker.getShorthandAssignmentValueSymbol(parent)`.
- Resolve export specifiers with `checker.getExportSpecifierLocalTargetSymbol(parent)`.
- Add a test for each when a codemod removes a declaration based on "no other uses".
