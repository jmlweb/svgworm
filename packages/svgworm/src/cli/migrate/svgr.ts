import type * as TypeScript from 'typescript';

import type { TypeScriptApi } from './typescript.ts';

import { toPosix } from '../../core/fs.ts';

/** What the project knows about the file an `.svg` import points at. */
export type IconLookup =
  | { readonly kind: 'icon'; readonly name: string }
  | { readonly kind: 'skip'; readonly reason: string };

export type SvgrSource = {
  /** Path from `cwd`, `/`-separated. Used in messages. */
  readonly path: string;
  readonly absolutePath: string;
  readonly content: string;
  /** Module specifier that imports the Icon component from this file. */
  readonly iconImport: string;
};

export type MigrationChange = {
  readonly line: number;
  readonly from: string;
  readonly to: string;
};

export type MigrationSkip = {
  readonly file: string;
  readonly line: number;
  readonly specifier: string;
  readonly binding: string;
  readonly reason: string;
};

export type FileMigration = {
  readonly file: string;
  /** The new content, or `undefined` when nothing in the file changes. */
  readonly output: string | undefined;
  readonly changes: readonly MigrationChange[];
  readonly skipped: readonly MigrationSkip[];
};

export type MigrateSvgrInput = {
  readonly ts: TypeScriptApi;
  readonly files: readonly SvgrSource[];
  readonly lookup: (specifier: string, fromAbsolutePath: string) => IconLookup;
  /** Whether a specifier in this file resolves to the Icon component, aliases included. */
  readonly isIconImport: (
    specifier: string,
    fromAbsolutePath: string,
  ) => boolean;
};

type Node = TypeScript.Node;
type Edit = {
  readonly start: number;
  readonly end: number;
  readonly text: string;
};

const SVG_SPECIFIER = /^(?<path>[^?#]+\.svg)(?:\?(?<query>[^#]*))?$/i;
// vite-plugin-svgr and friends mark a component import with a query.
const COMPONENT_QUERIES: ReadonlySet<string> = new Set([
  'react',
  'component',
  'svgr',
]);
const SVGR_NAMED_EXPORT = 'ReactComponent';
const ICON = 'Icon';

const CHILDREN_REASON = 'passes children; the svgworm Icon renders none';

// Props that change what SVGR renders inside the <svg>; a <use> shadow tree cannot follow them.
const BLOCKED_PROPS: Readonly<Record<string, string>> = {
  ref: 'passes a ref; the svgworm Icon takes no ref',
  name: 'sets a name prop, which the Icon uses for the icon name',
  children: CHILDREN_REASON,
  fill: 'sets fill, which SVGR applies to the inline paths; color a sprite icon with color or CSS (currentColor)',
  stroke:
    'sets stroke, which SVGR applies to the inline paths; color a sprite icon with color or CSS (currentColor)',
  titleId: 'sets titleId, an SVGR-only prop',
  desc: 'sets desc, an SVGR-only prop',
  descId: 'sets descId, an SVGR-only prop',
};

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();

type Candidate = {
  readonly nameNode: TypeScript.Identifier;
  /** `ReactComponent`, or a `?react` query: a component, not a URL. */
  readonly isComponent: boolean;
};

type BindingOutcome =
  | { readonly kind: 'ignore' }
  | { readonly kind: 'skip'; readonly skips: readonly MigrationSkip[] }
  | {
      readonly kind: 'convert';
      readonly edits: readonly Edit[];
      readonly changes: readonly MigrationChange[];
    };

type FileContext = {
  readonly ts: TypeScriptApi;
  readonly checker: TypeScript.TypeChecker;
  readonly source: TypeScript.SourceFile;
  readonly file: SvgrSource;
  readonly lookup: MigrateSvgrInput['lookup'];
  readonly isIconImport: MigrateSvgrInput['isIconImport'];
};

const lineOf = (context: FileContext, node: Node): number =>
  context.source.getLineAndCharacterOfPosition(node.getStart(context.source))
    .line + 1;

const identifiersNamed = (
  ts: TypeScriptApi,
  root: Node,
  name: string,
): readonly TypeScript.Identifier[] => {
  const found: TypeScript.Identifier[] = [];
  const visit = (node: Node): void => {
    if (ts.isIdentifier(node) && node.text === name) found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
};

type Uses = {
  readonly tags: readonly (
    | TypeScript.JsxSelfClosingElement
    | TypeScript.JsxElement
  )[];
  readonly values: readonly Node[];
};

/** Every reference to the import binding, by symbol, so a shadowing local is not touched. */
const usesOf = (
  context: FileContext,
  nameNode: TypeScript.Identifier,
): Uses => {
  const { ts, checker, source } = context;
  const symbol = checker.getSymbolAtLocation(nameNode);
  const tags: Uses['tags'][number][] = [];
  const values: Node[] = [];
  // `{ Logo }` and `export { Logo }` resolve to their own symbol, not to the import.
  const refersToImport = (id: TypeScript.Identifier): boolean => {
    const parent = id.parent;
    if (ts.isShorthandPropertyAssignment(parent) && parent.name === id) {
      return checker.getShorthandAssignmentValueSymbol(parent) === symbol;
    }
    if (ts.isExportSpecifier(parent)) {
      return checker.getExportSpecifierLocalTargetSymbol(parent) === symbol;
    }
    return checker.getSymbolAtLocation(id) === symbol;
  };
  for (const id of identifiersNamed(ts, source, nameNode.text)) {
    if (id === nameNode || !refersToImport(id)) continue;
    const parent = id.parent;
    if (ts.isJsxClosingElement(parent)) continue;
    if (ts.isJsxSelfClosingElement(parent) && parent.tagName === id) {
      tags.push(parent);
    } else if (
      ts.isJsxOpeningElement(parent) &&
      parent.tagName === id &&
      ts.isJsxElement(parent.parent)
    ) {
      tags.push(parent.parent);
    } else {
      values.push(id);
    }
  }
  return { tags, values };
};

const openingOf = (
  ts: TypeScriptApi,
  element: Uses['tags'][number],
): TypeScript.JsxOpeningLikeElement =>
  ts.isJsxElement(element) ? element.openingElement : element;

const elementProblem = (
  ts: TypeScriptApi,
  element: Uses['tags'][number],
): string | undefined => {
  if (
    ts.isJsxElement(element) &&
    !element.children.every(
      (child) => ts.isJsxText(child) && child.containsOnlyTriviaWhiteSpaces,
    )
  ) {
    return CHILDREN_REASON;
  }
  const opening = openingOf(ts, element);
  if (opening.typeArguments !== undefined) {
    return 'passes type arguments to the component';
  }
  for (const property of opening.attributes.properties) {
    if (!ts.isJsxAttribute(property)) continue;
    const name = ts.isIdentifier(property.name)
      ? property.name.text
      : property.name.getText();
    const reason = Object.hasOwn(BLOCKED_PROPS, name)
      ? BLOCKED_PROPS[name]
      : undefined;
    if (reason !== undefined) return reason;
  }
  return undefined;
};

const rewriteElement = (
  context: FileContext,
  element: Uses['tags'][number],
  name: string,
): { readonly edit: Edit; readonly change: MigrationChange } => {
  const { ts, source } = context;
  const text = source.text;
  const start = element.getStart(source);
  const opening = openingOf(ts, element);
  const tag = `${ICON} name="${name}"`;
  const edit: Edit = ts.isJsxElement(element)
    ? {
        start,
        end: element.end,
        // Only whitespace inside, so it becomes self-closing like any Icon.
        text: `<${tag}${text.slice(opening.tagName.end, opening.attributes.end).trimEnd()} />`,
      }
    : {
        start: opening.tagName.getStart(source),
        end: opening.tagName.end,
        text: tag,
      };
  const from = text.slice(start, element.end);
  const to =
    text.slice(start, edit.start) +
    edit.text +
    text.slice(edit.end, element.end);
  return {
    edit,
    change: {
      line: lineOf(context, element),
      from: collapse(from),
      to: collapse(to),
    },
  };
};

const analyzeBinding = (
  context: FileContext,
  declaration: TypeScript.ImportDeclaration,
  candidate: Candidate,
): BindingOutcome => {
  const { ts, file } = context;
  const specifier = (declaration.moduleSpecifier as TypeScript.StringLiteral)
    .text;
  const binding = candidate.nameNode.text;
  const skip = (node: Node, reason: string): MigrationSkip => ({
    file: file.path,
    line: lineOf(context, node),
    specifier,
    binding,
    reason,
  });
  const { tags, values } = usesOf(context, candidate.nameNode);
  const [firstValue] = values;
  // A plain default import with no JSX use is a URL import (Vite, CRA), not SVGR.
  if (
    tags.length === 0 &&
    (firstValue === undefined || !candidate.isComponent)
  ) {
    return { kind: 'ignore' };
  }
  const icon = context.lookup(specifier, file.absolutePath);
  if (firstValue !== undefined) {
    // styled(Logo), an icon map, a prop: only a person can say where the <Icon> goes.
    const byHand =
      icon.kind === 'icon'
        ? `; rewrite it by hand with <${ICON} name="${icon.name}" />`
        : '';
    return {
      kind: 'skip',
      skips: [
        tags.length === 0
          ? skip(firstValue, `is used as a value, not as a JSX tag${byHand}`)
          : skip(
              declaration,
              `is also used as a value on line ${String(lineOf(context, firstValue))}, not only as a JSX tag${byHand}`,
            ),
      ],
    };
  }
  if (icon.kind === 'skip') {
    return { kind: 'skip', skips: [skip(declaration, icon.reason)] };
  }
  const problems = tags.flatMap((element) => {
    const reason = elementProblem(ts, element);
    return reason === undefined ? [] : [skip(element, reason)];
  });
  if (problems.length > 0) return { kind: 'skip', skips: problems };
  const rewritten = tags.map((element) =>
    rewriteElement(context, element, icon.name),
  );
  return {
    kind: 'convert',
    edits: rewritten.map(({ edit }) => edit),
    changes: rewritten.map(({ change }) => change),
  };
};

// TypeScript 6 has `phaseModifier`; 5.x before 5.9 only `isTypeOnly`.
const isTypeOnlyClause = (
  ts: TypeScriptApi,
  clause: TypeScript.ImportClause,
): boolean =>
  (Reflect.get(clause, 'phaseModifier') as unknown) ===
    ts.SyntaxKind.TypeKeyword ||
  (Reflect.get(clause, 'isTypeOnly') as unknown) === true;

const candidatesOf = (
  ts: TypeScriptApi,
  declaration: TypeScript.ImportDeclaration,
  query: string | undefined,
): readonly Candidate[] => {
  const clause = declaration.importClause;
  if (clause === undefined || isTypeOnlyClause(ts, clause)) return [];
  const isComponentQuery = query !== undefined && COMPONENT_QUERIES.has(query);
  const named = clause.namedBindings;
  return [
    ...(clause.name === undefined
      ? []
      : [{ nameNode: clause.name, isComponent: isComponentQuery }]),
    ...(named !== undefined && ts.isNamedImports(named)
      ? named.elements
          .filter(
            (element) =>
              !element.isTypeOnly &&
              (element.propertyName ?? element.name).text === SVGR_NAMED_EXPORT,
          )
          .map((element) => ({ nameNode: element.name, isComponent: true }))
      : []),
  ];
};

/** Every value binding of an import, as the names it declares. */
const bindingsOf = (
  ts: TypeScriptApi,
  declaration: TypeScript.ImportDeclaration,
): readonly TypeScript.Identifier[] => {
  const clause = declaration.importClause;
  if (clause === undefined) return [];
  const named = clause.namedBindings;
  return [
    ...(clause.name === undefined ? [] : [clause.name]),
    ...(named === undefined
      ? []
      : ts.isNamespaceImport(named)
        ? [named.name]
        : named.elements.map((element) => element.name)),
  ];
};

type SvgSpecifier =
  | { readonly isSvg: false }
  | { readonly isSvg: true; readonly query: string | undefined };

const svgSpecifier = (
  ts: TypeScriptApi,
  specifier: TypeScript.Expression | undefined,
): SvgSpecifier => {
  if (specifier === undefined || !ts.isStringLiteral(specifier)) {
    return { isSvg: false };
  }
  const match = SVG_SPECIFIER.exec(specifier.text);
  if (match === null) return { isSvg: false };
  const query = match.groups?.['query'];
  // `?url`, `?raw` and the like are not components.
  if (query !== undefined && !COMPONENT_QUERIES.has(query))
    return { isSvg: false };
  return { isSvg: true, query };
};

const svgImports = (
  ts: TypeScriptApi,
  source: TypeScript.SourceFile,
): readonly {
  readonly declaration: TypeScript.ImportDeclaration;
  readonly query: string | undefined;
}[] =>
  source.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement)) return [];
    const svg = svgSpecifier(ts, statement.moduleSpecifier);
    return svg.isSvg ? [{ declaration: statement, query: svg.query }] : [];
  });

/**
 * `export { default as Logo } from './logo.svg'` in a barrel: the components are used in
 * other files, so only a person can move each one to `<Icon>`.
 */
const svgReexports = (context: FileContext): readonly MigrationSkip[] => {
  const { ts, source, file } = context;
  return source.statements.flatMap((statement) => {
    if (
      !ts.isExportDeclaration(statement) ||
      statement.isTypeOnly ||
      !svgSpecifier(ts, statement.moduleSpecifier).isSvg ||
      statement.exportClause === undefined ||
      !ts.isNamedExports(statement.exportClause)
    ) {
      return [];
    }
    const specifier = (statement.moduleSpecifier as TypeScript.StringLiteral)
      .text;
    const icon = context.lookup(specifier, file.absolutePath);
    const byHand =
      icon.kind === 'icon' ? ` with <${ICON} name="${icon.name}" />` : '';
    return statement.exportClause.elements
      .filter((element) =>
        ['default', SVGR_NAMED_EXPORT].includes(
          (element.propertyName ?? element.name).text,
        ),
      )
      .map((element) => ({
        file: file.path,
        line: lineOf(context, element),
        specifier,
        binding: element.name.text,
        reason: `is re-exported; import it where it is used, or rewrite the export by hand${byHand}`,
      }));
  });
};

const isDeclaredName = (
  ts: TypeScriptApi,
  id: TypeScript.Identifier,
): boolean => {
  const parent = id.parent;
  return (
    (ts.isVariableDeclaration(parent) ||
      ts.isParameter(parent) ||
      ts.isBindingElement(parent) ||
      ts.isFunctionDeclaration(parent) ||
      ts.isFunctionExpression(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isClassExpression(parent) ||
      ts.isInterfaceDeclaration(parent) ||
      ts.isTypeAliasDeclaration(parent) ||
      ts.isEnumDeclaration(parent) ||
      ts.isImportSpecifier(parent) ||
      ts.isImportClause(parent) ||
      ts.isNamespaceImport(parent) ||
      ts.isImportEqualsDeclaration(parent)) &&
    parent.name === id
  );
};

/** A value import `{ Icon }` of the component itself, which the rewrites can use as is. */
const isReusableIconImport = (
  context: FileContext,
  id: TypeScript.Identifier,
): boolean => {
  const { ts, file } = context;
  const specifier = id.parent;
  if (!ts.isImportSpecifier(specifier) || specifier.isTypeOnly) return false;
  if ((specifier.propertyName ?? specifier.name).text !== ICON) return false;
  const declaration = specifier.parent.parent.parent;
  return (
    !isTypeOnlyClause(ts, specifier.parent.parent) &&
    ts.isStringLiteral(declaration.moduleSpecifier) &&
    context.isIconImport(declaration.moduleSpecifier.text, file.absolutePath)
  );
};

type IconBinding =
  | { readonly kind: 'none' }
  | { readonly kind: 'reuse' }
  | { readonly kind: 'conflict'; readonly line: number };

/** Any `Icon` declared in the file, at any depth, would capture or clash with the rewrites. */
const iconBinding = (context: FileContext): IconBinding => {
  const declared = identifiersNamed(context.ts, context.source, ICON).filter(
    (id) => isDeclaredName(context.ts, id),
  );
  const [first] = declared;
  if (first === undefined) return { kind: 'none' };
  if (declared.length === 1 && isReusableIconImport(context, first)) {
    return { kind: 'reuse' };
  }
  const clash =
    declared.find((id) => !isReusableIconImport(context, id)) ?? first;
  return { kind: 'conflict', line: lineOf(context, clash) };
};

/** Extends a removal over the rest of the line, so no blank line is left behind. */
const throughLineEnd = (text: string, end: number): number => {
  let index = end;
  while (text[index] === ' ' || text[index] === '\t') index += 1;
  if (text.startsWith('\r\n', index)) return index + 2;
  if (text[index] === '\n') return index + 1;
  return end;
};

const importText = (
  clause: string,
  declaration: TypeScript.ImportDeclaration,
  source: TypeScript.SourceFile,
  specifier: string,
): string => {
  const original = declaration.getText(source);
  const quote = declaration.moduleSpecifier.getText(source)[0] ?? "'";
  const semicolon = original.trimEnd().endsWith(';') ? ';' : '';
  return `import ${clause} from ${quote}${specifier}${quote}${semicolon}`;
};

const keptClause = (
  ts: TypeScriptApi,
  declaration: TypeScript.ImportDeclaration,
  source: TypeScript.SourceFile,
  converted: ReadonlySet<TypeScript.Identifier>,
): string => {
  const clause = declaration.importClause;
  const named = clause?.namedBindings;
  const defaultName =
    clause?.name !== undefined && !converted.has(clause.name)
      ? [clause.name.text]
      : [];
  if (named !== undefined && ts.isNamespaceImport(named)) {
    return [...defaultName, named.getText(source)].join(', ');
  }
  const elements = (named?.elements ?? [])
    .filter((element) => !converted.has(element.name))
    .map((element) => element.getText(source));
  return [
    ...defaultName,
    ...(elements.length === 0 ? [] : [`{ ${elements.join(', ')} }`]),
  ].join(', ');
};

const applyEdits = (text: string, edits: readonly Edit[]): string =>
  edits
    .toSorted((a, b) => b.start - a.start)
    .reduce(
      (result, edit) =>
        result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      text,
    );

const migrateFile = (context: FileContext): FileMigration => {
  const { ts, source, file } = context;
  const imports = svgImports(ts, source);
  const outcomes = imports.map(({ declaration, query }) => ({
    declaration,
    bindings: candidatesOf(ts, declaration, query).map((candidate) => ({
      candidate,
      outcome: analyzeBinding(context, declaration, candidate),
    })),
  }));
  const skipped = [
    ...svgReexports(context),
    ...outcomes.flatMap(({ bindings }) =>
      bindings.flatMap(({ outcome }) =>
        outcome.kind === 'skip' ? outcome.skips : [],
      ),
    ),
  ];
  const converting = outcomes.flatMap(({ declaration, bindings }) =>
    bindings.flatMap(({ candidate, outcome }) =>
      outcome.kind === 'convert' ? [{ declaration, candidate, outcome }] : [],
    ),
  );
  const unchanged = (extra: readonly MigrationSkip[] = []): FileMigration => ({
    file: file.path,
    output: undefined,
    changes: [],
    skipped: [...skipped, ...extra].toSorted((a, b) => a.line - b.line),
  });
  if (converting.length === 0) return unchanged();

  const icon = iconBinding(context);
  const hasIconImport = icon.kind === 'reuse';
  if (icon.kind === 'conflict') {
    return unchanged(
      converting.map(({ declaration, candidate }) => ({
        file: file.path,
        line: lineOf(context, declaration),
        specifier: (declaration.moduleSpecifier as TypeScript.StringLiteral)
          .text,
        binding: candidate.nameNode.text,
        reason: `this file already declares ${ICON} (line ${String(icon.line)}); rename it, then run again`,
      })),
    );
  }

  const eol = source.text.includes('\r\n') ? '\r\n' : '\n';
  const converted = new Set(
    converting.map(({ candidate }) => candidate.nameNode),
  );
  const declarationEdits = outcomes.flatMap(({ declaration }): Edit[] => {
    const bindings = bindingsOf(ts, declaration);
    if (!bindings.some((id) => converted.has(id))) return [];
    const start = declaration.getStart(source);
    if (bindings.every((id) => converted.has(id))) {
      return [
        { start, end: throughLineEnd(source.text, declaration.end), text: '' },
      ];
    }
    return [
      {
        start,
        end: declaration.end,
        text: importText(
          keptClause(ts, declaration, source, converted),
          declaration,
          source,
          (declaration.moduleSpecifier as TypeScript.StringLiteral).text,
        ),
      },
    ];
  });

  const iconImportEdits = (): readonly Edit[] => {
    if (hasIconImport) return declarationEdits;
    const [firstRemoved] = declarationEdits.filter((edit) => edit.text === '');
    const template = converting[0]?.declaration;
    if (template === undefined) return declarationEdits;
    const statement = importText(
      `{ ${ICON} }`,
      template,
      source,
      file.iconImport,
    );
    if (firstRemoved !== undefined) {
      // The Icon import takes the place of the first svg import it replaces.
      return declarationEdits.map((edit) =>
        edit === firstRemoved
          ? {
              ...edit,
              text: `${statement}${/\r?\n$/.exec(source.text.slice(edit.start, edit.end))?.[0] ?? ''}`,
            }
          : edit,
      );
    }
    const lastImport = source.statements.findLast((statement) =>
      ts.isImportDeclaration(statement),
    );
    const at = lastImport?.end ?? 0;
    return [
      ...declarationEdits,
      {
        start: at,
        end: at,
        text: at === 0 ? `${statement}${eol}` : `${eol}${statement}`,
      },
    ];
  };

  const edits = [
    ...iconImportEdits(),
    ...converting.flatMap(({ outcome }) => outcome.edits),
  ];
  return {
    file: file.path,
    output: applyEdits(source.text, edits),
    changes: converting
      .flatMap(({ outcome }) => outcome.changes)
      .toSorted((a, b) => a.line - b.line),
    skipped: skipped.toSorted((a, b) => a.line - b.line),
  };
};

/**
 * Rewrites SVGR component imports into `<Icon name="…" />` calls. Pure: it reads only the
 * given contents. One program over all files, so references are found by symbol, not by name.
 */
export const migrateSvgr = (
  input: MigrateSvgrInput,
): readonly FileMigration[] => {
  const { ts, files, lookup, isIconImport } = input;
  // No lib and no resolution: only the bindings inside each file matter.
  const options: TypeScript.CompilerOptions = {
    allowJs: true,
    noLib: true,
    noResolve: true,
    types: [],
    jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
  };
  const byName = new Map(
    files.map((file) => [toPosix(file.absolutePath), file]),
  );
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (fileName, languageVersion) => {
    const file = byName.get(toPosix(fileName));
    return file === undefined
      ? undefined
      : ts.createSourceFile(fileName, file.content, languageVersion, true);
  };
  host.fileExists = (fileName) => byName.has(toPosix(fileName));
  host.readFile = (fileName) => byName.get(toPosix(fileName))?.content;
  const program = ts.createProgram({
    rootNames: [...byName.keys()],
    options,
    host,
  });
  const checker = program.getTypeChecker();
  return files.map((file) => {
    const source = program.getSourceFile(toPosix(file.absolutePath));
    if (source === undefined) {
      return { file: file.path, output: undefined, changes: [], skipped: [] };
    }
    return migrateFile({ ts, checker, source, file, lookup, isIconImport });
  });
};
