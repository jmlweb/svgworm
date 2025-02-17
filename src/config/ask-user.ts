import prompts from 'prompts';

import { DEFAULT_VALUES } from './constants';
import { CliOptions } from './schemas';

export const QUESTIONS = {
  src: {
    type: 'text',
    name: 'src',
    format: (value?: string) => value?.trim(),
    validate: (value?: string) =>
      Boolean(value?.trim().length) || 'Source directory is required',
    message: 'Enter the source directory',
  },
  dest: {
    type: 'text',
    name: 'dest',
    format: (value?: string) => value?.trim(),
    validate: (value?: string) =>
      Boolean(value?.trim().length) || 'Destination directory is required',
    message: 'Enter the destination directory',
  },
  mode: {
    type: 'select',
    name: 'mode',
    choices: [
      {
        title: 'File',
        description: 'Create a SVG sprite file',
        value: 'file',
      },
      {
        title: 'Component',
        description: 'Create a Sprite React component',
        value: 'component',
      },
    ],
    message: 'Select the mode',
    initial: DEFAULT_VALUES.mode === 'file' ? 0 : 1,
  },
  baseUrl: {
    type: prev => prev === 'file' ? 'text' : null,
    name: 'baseUrl',
    message: 'Base URL for file mode',
    initial: '/',
    validate: (value?: string) => {
      if (!value) {
        return 'Base URL is required';
      }
      return true;
    },
  },
  ts: {
    type: 'toggle',
    name: 'ts',
    message: 'Enable TypeScript',
    initial: DEFAULT_VALUES.ts,
  },
  cache: {
    type: 'toggle',
    name: 'cache',
    message: 'Enable caching',
    initial: DEFAULT_VALUES.cache,
  },
  flatten: {
    type: 'toggle',
    name: 'flatten',
    message: 'Flatten the directory structure (omit categories)',
    initial: DEFAULT_VALUES.flatten,
  },
  color: {
    type: 'toggle',
    name: 'color',
    message: "Preserve colors (don't convert to currentColor)",
    initial: DEFAULT_VALUES.color,
  },
  prefix: {
    type: 'text',
    name: 'prefix',
    format: (value?: string) => {
      if (!value) {
        return undefined;
      }
      const trimmedValue = value.trim();
      return trimmedValue.length ? trimmedValue : undefined;
    },
    message: 'Prefix for the sprite (leave it empty for none)',
  },
} satisfies Record<string, prompts.PromptObject>;

export const askUser = async (
  initialConfig: Omit<CliOptions, 'ci' | 'config'>,
) => {
  const options: prompts.PromptObject[] = [];
  Object.entries(QUESTIONS).forEach(([name, question]) => {
    if (
      !(name in initialConfig) ||
      typeof initialConfig[name as keyof typeof initialConfig] === 'undefined'
    ) {
      options.push(question);
    }
  });
  return prompts(options) ?? {};
};
