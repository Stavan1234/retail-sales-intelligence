import type { ReactNode } from "react";

export type Takeaway = { id: string; text: ReactNode };

/** Plain-language conclusions that close a page. */
export function Takeaways({ title = "What this shows", items }: { title?: string; items: Takeaway[] }) {
  return (
    <section className="takeaways" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </section>
  );
}

/** A short method or concept explanation. */
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="callout">
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}
