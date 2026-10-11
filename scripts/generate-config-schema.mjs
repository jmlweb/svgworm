import { writeFile } from 'node:fs/promises';

import { getConfigJsonSchema } from '../packages/svgworm/dist/index.js';

// The schema is committed and published next to the package so editors and agents can fetch it
// by URL. A test compares the file with the live zod schema, so a stale copy fails CI.
const target = new URL(
  '../packages/svgworm/svgworm.schema.json',
  import.meta.url,
);
await writeFile(target, `${JSON.stringify(getConfigJsonSchema(), null, 2)}\n`);
