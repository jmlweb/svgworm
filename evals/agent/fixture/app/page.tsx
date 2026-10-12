// The task for the agent: the four nav items and the two brand badges below need the icons
// from ./icons (see README.md). Nothing else on this page should change.
export default function Page() {
  return (
    <main>
      <nav aria-label="Main">
        <a href="/">Home</a>
        <a href="/house">House</a>
        <a href="https://github.com/acme">GitHub</a>
        <a href="/close">Close</a>
      </nav>
      <section>
        <h2>Built with</h2>
        <span>Kotlin</span>
        <span>Next.js</span>
        <span>About</span>
        <span>Café</span>
      </section>
    </main>
  );
}
