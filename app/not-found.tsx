import Link from "next/link";

export default function NotFound() {
  return (
    <main className="center-state">
      <div className="state-card">
        <div className="eyebrow">Retail Sales Intelligence</div>
        <h1>Page not found.</h1>
        <p>This page does not exist.</p>
        <Link className="button button-primary" href="/overview">
          Back to Overview
        </Link>
      </div>
    </main>
  );
}
