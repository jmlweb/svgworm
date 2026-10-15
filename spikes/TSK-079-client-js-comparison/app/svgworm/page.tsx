import { Icon, svgwormNames } from '../../components/svgworm-icon';

export default function Page() {
  return (
    <main>
      <ul>
        {svgwormNames.map((name) => (
          <li key={name}>
            <Icon name={name} />
          </li>
        ))}
      </ul>
    </main>
  );
}
