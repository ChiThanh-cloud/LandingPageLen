import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Migration Status",
  robots: {
    index: false,
    follow: false
  }
};

const checkpoints = [
  "Next.js App Router is present.",
  "TypeScript config is present.",
  "Shared header, footer, floating contact, fonts, icons, and tracking are wired for SP2.",
  "Legacy HTML/CSS/JavaScript files stay untouched.",
  "Homepage, blog pages, and product pages are not converted in this step."
];

export default function MigrationStatusPage() {
  return (
    <main className="migration-shell">
      <section className="migration-panel" aria-labelledby="migration-title">
        <p className="migration-eyebrow">SP1 scaffold</p>
        <h1 id="migration-title">LenTiny Next.js foundation is ready.</h1>
        <p>
          This route exists only to verify the migration foundation. The legacy
          static website remains in place until the next planned migration step.
        </p>
        <ul className="migration-list" aria-label="Migration checkpoints">
          {checkpoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
