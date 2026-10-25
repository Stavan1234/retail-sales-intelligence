"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Filters } from "@/types/analytics";

export function useFilterActions() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = (query: URLSearchParams) => {
    const nextUrl = query.toString() ? `${pathname}?${query.toString()}` : pathname;
    startTransition(() => router.replace(nextUrl, { scroll: false }));
  };

  const setFilter = (key: keyof Filters, value: string) => {
    const query = new URLSearchParams(searchParams.toString());
    if (value) query.set(key, value);
    else query.delete(key);

    if (key === "year" && value) {
      query.delete("start_date");
      query.delete("end_date");
    }
    navigate(query);
  };

  const clearFilters = (keys?: Array<keyof Filters>) => {
    if (!keys) {
      navigate(new URLSearchParams());
      return;
    }
    const query = new URLSearchParams(searchParams.toString());
    for (const key of keys) query.delete(key);
    navigate(query);
  };

  return { setFilter, clearFilters, isPending };
}
