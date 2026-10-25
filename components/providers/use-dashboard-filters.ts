"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Filters } from "@/types/analytics";

export function useDashboardFilters(): Filters {
  const searchParams = useSearchParams();
  const year = searchParams.get("year") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const segment = searchParams.get("segment") ?? undefined;
  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? undefined;

  return useMemo(
    () => ({
      year,
      region,
      category,
      segment,
      start_date: year ? undefined : startDate,
      end_date: year ? undefined : endDate,
    }),
    [year, region, category, segment, startDate, endDate],
  );
}
