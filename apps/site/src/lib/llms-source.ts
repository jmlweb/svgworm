import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

// llms.txt lives at the repo root, where agents, Context7 and GitHub read it (ADR-0018).
// The site serves it as is; its links already point to the site. Builds run from apps/site.
export const readLlmsTxt = (): Promise<string> =>
  readFile(join(process.cwd(), '../../llms.txt'), 'utf8');
