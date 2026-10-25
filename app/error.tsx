"use client";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ reset }: ErrorBoundaryProps) {
  return (
    <main className="center-state" role="alert">
      <div className="state-card">
        <span className="eyebrow">Application error</span>
        <h1>Something went wrong.</h1>
        <p>The page could not finish rendering. Try the page again before changing any filters.</p>
        <button type="button" className="button button-primary" onClick={reset}>
          Retry
        </button>
      </div>
    </main>
  );
}
