import { svgrIcons } from '../../components/svgr-icons';

export default function Page() {
  return (
    <main>
      <ul>
        {svgrIcons.map((SvgrIcon, index) => (
          <li key={index}>
            <SvgrIcon />
          </li>
        ))}
      </ul>
    </main>
  );
}
