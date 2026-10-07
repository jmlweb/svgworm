import { createSvgSpriteBuilder } from '@neodx/svg';

const builder = createSvgSpriteBuilder({
  inputRoot: 'icons',
  output: 'public/sprites',
  fileName: '{name}.{hash:8}.svg',
  metadata: 'app/sprite.gen.ts',
  group: true
});

await builder.load('**/*.svg');
await builder.build();
