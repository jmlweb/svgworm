// Prompts a visitor pastes into a coding agent. They point at llms.txt and the docs instead of
// repeating CLI flags, so a change to the setup commands never leaves them stale.
const LLMS_TXT = 'https://svgworm.com/llms.txt';

export const setupPrompt = `Set up svgworm in this project for my SVG icons. Read ${LLMS_TXT}, detect the framework (Next.js, Vite + React or Astro), follow the matching guide linked there, and run the build to check it works.`;

const migrationPrompt = (from: string) =>
  `Migrate this project from ${from} to svgworm. Read ${LLMS_TXT} first and set svgworm up with the guide for this project's framework. Then copy the SVG source of each ${from} icon the code uses into the icons folder, replace every ${from} import with the svgworm icon component, and remove ${from} from package.json once nothing imports it. Run the build and the type check to confirm every icon name still resolves.`;

export const migrationPrompts = [
  {
    id: 'lucide-react',
    label: 'From lucide-react',
    text: migrationPrompt('lucide-react'),
  },
  {
    id: 'react-icons',
    label: 'From react-icons',
    text: migrationPrompt('react-icons'),
  },
] as const;
