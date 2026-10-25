import type { ReactNode } from "react";

export type MetricItem = {
  label: string;
  value: ReactNode;
  hint?: string;
};

export function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <dl className="metric-grid">
      {items.map((item) => (
        <div className="metric" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.hint && <span className="metric-hint">{item.hint}</span>}
        </div>
      ))}
    </dl>
  );
}
