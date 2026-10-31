import { confirm, isCancel, select, text } from '@clack/prompts';

import type { InitOptions, ProjectFacts } from './plan.ts';

import { normalizePublicPath } from '../../core/config/schema.ts';
import {
  componentFileFor,
  detectedFrameworks,
  Framework,
  FrameworkSource,
  resolveFramework,
  withFrameworkDefaults,
} from './plan.ts';

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

const CHOICE_LABEL = {
  [Framework.ASTRO]: 'Astro (Icon.astro)',
  [Framework.VUE]: 'Vue (Icon.vue)',
  [Framework.SVELTE]: 'Svelte (Icon.svelte)',
  [Framework.REACT]: 'React (Server Component)',
} as const;

const WIRING_LABEL = {
  [Framework.ASTRO]: 'Astro',
  [Framework.VUE]: 'Vue',
  [Framework.SVELTE]: 'Svelte',
  [Framework.REACT]: 'React Server Component',
} as const;

const basePathHint = (facts: ProjectFacts): string =>
  facts.usesNext
    ? ' (include the Next basePath, if any)'
    : facts.usesAstro
      ? ' (include the Astro base, if any)'
      : facts.usesNuxt
        ? ' (include the Nuxt app.baseURL, if any)'
        : facts.usesSvelteKit
          ? ' (include the SvelteKit paths.base, if any)'
          : '';

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
  // Only a real ambiguity is asked: no flag, and several frameworks are dependencies.
  const detected = detectedFrameworks(facts);
  const isAsked = options.framework === undefined && detected.length > 1;
  const framework = isAsked
    ? orCancel(
        await select({
          message: `${detected.slice(0, -1).join(', ')} and ${detected.at(-1) ?? ''} are dependencies. Which one renders icons?`,
          options: detected.map((value) => ({
            value,
            label: CHOICE_LABEL[value],
          })),
          initialValue: detected[0],
        }),
      )
    : options.framework;
  const resolved = resolveFramework({ ...options, framework }, facts).framework;
  // Never on by default: inject mode makes icons need JS (ADR-0027).
  const isCdn =
    options.cdnUrl !== undefined ||
    (options.publicPath === undefined &&
      orCancel(
        await confirm({
          message:
            'Serve sprites from a CDN on another origin? (needs a small loader script; same-origin needs none)',
          initialValue: false,
        }),
      ));
  const cdnUrl =
    options.cdnUrl ??
    (isCdn
      ? orCancel(
          await text({
            message: 'CDN URL the sprites are served from (https://…)',
            placeholder: 'https://cdn.example.com/icons',
            validate: (value) => {
              if (value === undefined || !value.startsWith('https://')) {
                return 'An https:// URL';
              }
              const result = normalizePublicPath(value, {
                crossOrigin: 'inject',
              });
              return result.ok ? undefined : result.message;
            },
          }),
        )
      : undefined);
  const publicPath = isCdn
    ? '/icons'
    : orCancel(
        await text({
          message: `URL path the sprites are served from${basePathHint(facts)}`,
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
      message: facts.runsScriptHooks
        ? 'Add predev and prebuild scripts that run svgworm?'
        : 'Run svgworm at the start of the dev and build scripts? (Yarn 2+ skips predev and prebuild)',
      initialValue: options.addScripts,
    }),
  );
  const addComponent = orCancel(
    await confirm({
      message: `Write the ${WIRING_LABEL[resolved ?? Framework.REACT]} wiring (${componentFileFor(options, facts, resolved)})?`,
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
    cdnUrl,
    sources,
    publicPath: publicPath === '/icons' ? options.publicPath : publicPath,
    // A custom publicPath needs an outDir the app serves there; keep the default folder.
    ...(publicPath !== '/icons' && options.outDir === undefined
      ? {
          outDir:
            withFrameworkDefaults(options, facts, resolved).outDir ??
            'public/icons',
        }
      : {}),
    framework,
    ...(isAsked ? { frameworkSource: FrameworkSource.PROMPT } : {}),
    addScripts,
    addComponent,
    addAgentsMd,
  };
};
