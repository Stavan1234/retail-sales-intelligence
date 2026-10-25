"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionConfig } from "motion/react";
import { OceanBackdrop, WaveMark } from "@/components/layout/ocean-backdrop";
import { PageStepper } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { useFilterActions } from "@/components/providers/use-filter-actions";
import { apiFetch } from "@/lib/api";
import { NAV_ITEMS } from "@/lib/navigation";
import type { FilterOptions, Filters } from "@/types/analytics";

type FilterKey = "year" | "region" | "category" | "segment";

const FILTERS: Array<{ key: FilterKey; label: string; options: (options: FilterOptions) => string[] }> = [
  { key: "year", label: "Year", options: (options) => options.years.map(String) },
  { key: "region", label: "Region", options: (options) => options.regions },
  { key: "category", label: "Category", options: (options) => options.categories },
  { key: "segment", label: "Segment", options: (options) => options.segments },
];

const FILTER_LABELS: Record<keyof Filters, string> = {
  year: "Year",
  region: "Region",
  category: "Category",
  segment: "Segment",
  start_date: "From",
  end_date: "To",
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useDashboardFilters();
  const { setFilter, clearFilters, isPending } = useFilterActions();
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [optionsError, setOptionsError] = useState<Error | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // On narrow screens the steps become a horizontal strip; keep the current step visible in it.
  useEffect(() => {
    const strip = navRef.current?.querySelector("ol");
    const current = navRef.current?.querySelector<HTMLElement>(`a[href^="${pathname}"]`);
    if (!strip || !current || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: current.offsetLeft - strip.clientWidth / 2 + current.offsetWidth / 2 });
  }, [pathname]);

  useEffect(() => {
    const controller = new AbortController();

    apiFetch<FilterOptions>("/api/filters", {}, controller.signal)
      .then(setOptions)
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setOptionsError(error instanceof Error ? error : new Error("Could not load filter options."));
      });

    return () => controller.abort();
  }, []);

  const active = (Object.entries(filters) as Array<[keyof Filters, string | undefined]>).filter(
    (entry): entry is [keyof Filters, string] => Boolean(entry[1]),
  );
  const query = searchParams.toString();

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <OceanBackdrop />
      <div className="app-shell">
        <aside className="sidebar">
          <Link href="/overview" className="sidebar-brand">
            <span className="brand-mark" aria-hidden="true">
              <WaveMark />
            </span>
            <span className="brand-copy">
              <strong>Retail Sales Intelligence</strong>
              <span>Applied Data Science project</span>
            </span>
          </Link>

          <nav className="nav" aria-label="Analysis steps" ref={navRef}>
            <div className="nav-heading">Analysis journey</div>
            <ol>
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={query ? `${item.href}?${query}` : item.href}
                      className={`nav-item ${isActive ? "active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="nav-step" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="nav-text">
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-module">{item.module}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="sidebar-status" aria-live="polite">
            <span className={`status-dot ${optionsError ? "status-dot-error" : ""}`} aria-hidden="true" />
            <span>
              {optionsError
                ? "Analytics API not reachable. A sleeping free server can take up to a minute to wake; then refresh."
                : options
                  ? "Connected to the analytics API"
                  : "Connecting…"}
            </span>
          </div>
        </aside>

        <div className="main" id="main-content" tabIndex={-1}>
          <div className="filter-bar">
            <form
              className="filter-strip"
              aria-label="Data filters"
              aria-busy={isPending}
              onSubmit={(event) => event.preventDefault()}
            >
              {FILTERS.map((filter) => (
                <label key={filter.key} className={`filter-control ${filters[filter.key] ? "is-set" : ""}`}>
                  <span>{filter.label}</span>
                  <select
                    value={filters[filter.key] ?? ""}
                    disabled={!options || isPending}
                    onChange={(event) => setFilter(filter.key, event.target.value)}
                  >
                    <option value="">All</option>
                    {(options ? filter.options(options) : []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </form>
            <div className="filter-summary" aria-live="polite">
              {active.length === 0 ? (
                <span className="filter-hint">Showing all data. Filters apply to every page.</span>
              ) : (
                <>
                  {active.map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      className="filter-chip"
                      onClick={() => clearFilters([key])}
                      disabled={isPending}
                      aria-label={`Remove filter ${FILTER_LABELS[key]}: ${value}`}
                    >
                      {FILTER_LABELS[key]}: {value} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="filter-clear"
                    onClick={() => clearFilters()}
                    disabled={isPending}
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          {children}
          <PageStepper />
        </div>
      </div>
    </MotionConfig>
  );
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
