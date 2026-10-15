import { describe, expect, it } from 'vitest';

import { compile } from '../../core/api.ts';
import { SAMPLE_ICON_NAME, SAMPLE_ICON_SVG } from './sample-icon.ts';

describe('sample icon', () => {
  it('compiles to one mono icon with <use> delivery and no warnings', () => {
    const result = compile(
      [
        {
          path: `icons/${SAMPLE_ICON_NAME}.svg`,
          relativePath: `${SAMPLE_ICON_NAME}.svg`,
          content: new TextEncoder().encode(SAMPLE_ICON_SVG),
        },
      ],
      { flatten: false, publicPath: '/icons', color: [] },
    );
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.warnings).toEqual([]);
    expect(result.icons).toMatchObject([
      { name: SAMPLE_ICON_NAME, color: 'mono', delivery: 'use' },
    ]);
  });
});
