import { confirm, isCancel, select, text } from '@clack/prompts';

import type { InitOptions, ProjectFacts } from './plan.ts';

import { normalizePublicPath } from '../../core/config/schema.ts';
import { componentFileFor, Framework, resolveFramework } from './plan.ts';

/** Thrown when the user cancels a prompt; the command maps it to exit 2 with no files written. */
export class InitCancelledError extends Error {
  constructor() {
    super('init cancelled, nothing was written');
    this.name = 'InitCancelledError';
  }
}

const orCancel = <T>(value: T | symbol): T => {
  if (isCancel(value)) throw new InitCancelledError();
  return value as T;
};

/**
 * Fills the options a TTY user did not pass as flags. Flags are the defaults of each prompt,
 * so an answer never silently replaces an explicit choice (R-56).
 */
export const askInitOptions = async (
  options: InitOptions,
  facts: ProjectFacts,
): Promise<InitOptions> => {
  // Several --source flags are an explicit choice the single-folder prompt cannot hold.
  const sources =
    options.sources.length > 1
      ? options.sources
      : [
          orCancel(
            await text({
              message: 'Folder with your SVG files',
              defaultValue: options.sources[0] ?? 'icons',
              placeholder: options.sources[0] ?? 'icons',
              validate: (value) =>
                value !== undefined && /[?*\\]/.test(value)
                  ? 'A folder path, not a glob'
                  : undefined,
            }),
          ),
        ];
  const publicPath = orCancel(
    await text({
      message:
        'URL path the sprites are served from (include the Next basePath, if any)',
      defaultValue: options.publicPath ?? '/icons',
      placeholder: options.publicPath ?? '/icons',
      validate: (value) => {
        if (value === undefined || value === '') return undefined;
        const result = normalizePublicPath(value);
        return result.ok ? undefined : result.message;
      },
    }),
  );
  const addScripts = orCancel(
    await confirm({
      message: 'Add predev and prebuild scripts that run svgworm?',
      initialValue: options.addScripts,
    }),
  );
  // Only a real ambiguity is asked: no flag, and both frameworks are dependencies.
  const framework =
    options.framework === undefined && facts.usesReact && facts.usesAstro
      ? orCancel(
          await select({
            message:
              'Both react and astro are dependencies. Which one renders icons?',
            options: [
              { value: Framework.ASTRO, label: 'Astro (Icon.astro)' },
              { value: Framework.REACT, label: 'React (Server Component)' },
            ],
            initialValue: Framework.ASTRO,
          }),
        )
      : options.framework;
  const resolved = resolveFramework({ ...options, framework }, facts).framework;
  const addComponent = orCancel(
    await confirm({
      message: `Write the ${resolved === Framework.ASTRO ? 'Astro' : 'React Server Component'} wiring (${componentFileFor(options, facts.hasSrcFolder, resolved)})?`,
      initialValue: options.addComponent ?? resolved !== undefined,
    }),
  );
  const addAgentsMd = orCancel(
    await confirm({
      message: 'Add a short svgworm section to AGENTS.md for AI agents?',
      initialValue: options.addAgentsMd,
    }),
  );
  return {
    ...options,
    sources,
    publicPath: publicPath === '/icons' ? options.publicPath : publicPath,
    // A custom publicPath needs an outDir the app serves there; keep the default folder.
    ...(publicPath !== '/icons' && options.outDir === undefined
      ? { outDir: 'public/icons' }
      : {}),
    framework,
    addScripts,
    addComponent,
    addAgentsMd,
  };
};
