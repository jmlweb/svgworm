import { lucideIcons } from '../../components/lucide-icons';

export default function Page() {
  return (
    <main>
      <ul>
        {lucideIcons.map((LucideIcon, index) => (
          <li key={index}>
            <LucideIcon />
          </li>
        ))}
      </ul>
    </main>
  );
}
