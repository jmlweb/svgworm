import { DocsIcon, PlainIcon, type IconName } from './_ui/sprite-icon';

const names: IconName[] = [
  'general:mono-fill', 'general:stroke', 'general:multicolor', 'general:gradient',
  'general:mask', 'general:café', 'brand:logo', 'brand:stroke'
];

export default function Page() {
  return (
    <main style={{ color: '#0a7' }}>
      <section id="docs">{names.map(n => <DocsIcon key={n} name={n} data-name={n} />)}</section>
      <section id="plain">{names.map(n => <PlainIcon key={n} name={n} data-name={n} />)}</section>
    </main>
  );
}
