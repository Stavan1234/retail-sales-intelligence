"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiFetchUrl } from "@/lib/api";
import type { Filters } from "@/types/analytics";

type ResourceState<T> = {
  requestKey: string | null;
  data: T | null;
  error: Error | null;
};

function stableFilterKey(filters: Filters): string {
  return JSON.stringify([
    filters.year ?? null,
    filters.region ?? null,
    filters.category ?? null,
    filters.segment ?? null,
    filters.start_date ?? null,
    filters.end_date ?? null,
  ]);
}

function useResource<T>(requestKey: string, request: (signal: AbortSignal) => Promise<T>, enabled: boolean) {
  const [state, setState] = useState<ResourceState<T>>({
    requestKey: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let cancelled = false;

    request(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState({ requestKey, data, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setState({
          requestKey,
          data: null,
          error: error instanceof Error ? error : new Error("Unexpected analytics error"),
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, request, requestKey]);

  const isCurrent = state.requestKey === requestKey;
  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    loading: enabled && !isCurrent,
  };
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function useApiResource<T>(path: string, filters: Filters, enabled = true) {
  const filterKey = stableFilterKey(filters);
  const requestKey = `${path}:${filterKey}`;
  const request = useCallback((signal: AbortSignal) => apiFetch<T>(path, filters, signal), [filters, path]);

  return useResource(requestKey, request, enabled);
}

export function useApiQueryResource<T>(path: string, query: string, enabled = true) {
  const requestKey = `${path}?${query}`;
  const request = useCallback(
    (signal: AbortSignal) => apiFetchUrl<T>(`${path}?${query}`, signal),
    [path, query],
  );

  return useResource(requestKey, request, enabled);
}

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}
