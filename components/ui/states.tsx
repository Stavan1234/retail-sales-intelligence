import type { ReactNode } from "react";

export function LoadingState({ label = "Loading analysis" }: { label?: string }) {
  return (
    <div className="loading-state" aria-busy="true">
      <span className="sr-only" role="status" aria-live="polite">
        {label}
      </span>
      <div className="skeleton-grid" aria-hidden="true">
        {["one", "two", "three", "four"].map((item) => (
          <div key={item} className="skeleton-block" />
        ))}
      </div>
      <div className="skeleton-block skeleton-chart" aria-hidden="true" />
    </div>
  );
}

export function MessageState({
  title,
  copy,
  action,
  tone = "neutral",
}: {
  title: string;
  copy: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div className={`message-state ${tone === "error" ? "message-error" : ""}`} role="status">
      <h2>{title}</h2>
      <p>{copy}</p>
      {action && <div className="message-action">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, error }: { title: string; error: Error }) {
  return <MessageState tone="error" title={title} copy={error.message} />;
}
