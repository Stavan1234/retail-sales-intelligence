"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HeroWaves } from "@/components/layout/ocean-backdrop";
import { NAV_ITEMS } from "@/lib/navigation";

/** Page heading taken from the navigation, so titles and questions stay consistent everywhere. */
export function PageIntro({ meta }: { meta?: ReactNode }) {
  const pathname = usePathname();
  const index = NAV_ITEMS.findIndex((item) => item.href === pathname);
  const item = NAV_ITEMS[index];
  if (!item) return null;

  return (
    <header className="page-intro">
      <div>
        <div className="page-tag">
          Step {index + 1} of {NAV_ITEMS.length} · {item.module}
        </div>
        <h1>{item.label}</h1>
        <p className="page-question">{item.question}</p>
      </div>
      {meta && <div className="page-meta">{meta}</div>}
      <HeroWaves />
    </header>
  );
}

export function PageStepper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const index = NAV_ITEMS.findIndex((item) => item.href === pathname);
  if (index === -1) return null;

  const query = searchParams.toString();
  const withQuery = (href: string) => (query ? `${href}?${query}` : href);
  const previous = NAV_ITEMS[index - 1];
  const next = NAV_ITEMS[index + 1];

  return (
    <nav className="page-stepper" aria-label="Previous and next step">
      {previous ? (
        <Link href={withQuery(previous.href)} className="stepper-link">
          <span>← Previous</span>
          <strong>{previous.label}</strong>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={withQuery(next.href)} className="stepper-link stepper-next">
          <span>Next →</span>
          <strong>{next.label}</strong>
        </Link>
      )}
    </nav>
  );
}
