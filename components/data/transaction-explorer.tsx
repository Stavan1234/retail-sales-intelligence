"use client";

import { useMemo, useState } from "react";
import { TransactionTable } from "@/components/data/transaction-table";
import { SectionCard } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { toQuery } from "@/lib/api";
import { useApiQueryResource, useDebouncedValue } from "@/lib/hooks";
import { formatNumber } from "@/lib/utils";
import type { Filters, TransactionResponse, TransactionSortKey } from "@/types/analytics";

const SORT_KEYS: TransactionSortKey[] = [
  "Order Date",
  "Sales",
  "Profit",
  "Quantity",
  "Discount",
  "Category",
  "Region",
  "Segment",
];

export function TransactionExplorer({ filters }: { filters: Filters }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [sort, setSort] = useState<TransactionSortKey>("Order Date");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const transactionQuery = useMemo(() => {
    const query = toQuery(filters);
    query.set("page", String(page));
    query.set("page_size", "15");
    query.set("sort_by", sort);
    query.set("sort_dir", direction);

    const term = debouncedSearch.trim();
    if (term) query.set("search", term);
    return query.toString();
  }, [debouncedSearch, direction, filters, page, sort]);

  const transactions = useApiQueryResource<TransactionResponse>("/api/data", transactionQuery, true);
  const current = transactions.data;

  return (
    <SectionCard
      title="Browse the prepared data"
      subtitle={`${formatNumber(current?.total ?? 0)} order lines match the current filters.`}
    >
      <div className="table-toolbar">
        <label className="search-field">
          <span>Search</span>
          <input
            className="search-input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Order ID, customer, product…"
            autoComplete="off"
          />
        </label>
        <label className="search-field">
          <span>Sort by</span>
          <select
            className="search-select"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as TransactionSortKey);
              setPage(1);
            }}
          >
            {SORT_KEYS.map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button"
          onClick={() => {
            setDirection((value) => (value === "asc" ? "desc" : "asc"));
            setPage(1);
          }}
        >
          {direction === "asc" ? "Ascending ↑" : "Descending ↓"}
        </button>
      </div>

      {transactions.error ? (
        <ErrorState title="Transactions unavailable" error={transactions.error} />
      ) : (
        <div className="table-wrap" aria-busy={transactions.loading}>
          <TransactionTable rows={current?.rows ?? []} />
        </div>
      )}

      <div className="pagination">
        <button
          type="button"
          className="button"
          disabled={transactions.loading || !current || current.page <= 1}
          onClick={() => setPage((value) => Math.max(1, (current?.page ?? value) - 1))}
        >
          ← Previous
        </button>
        <span aria-live="polite">
          Page {current?.page ?? page} of {current?.pages ?? 1}
        </span>
        <button
          type="button"
          className="button"
          disabled={transactions.loading || !current || current.page >= current.pages}
          onClick={() => setPage((value) => Math.min(current?.pages ?? value, (current?.page ?? value) + 1))}
        >
          Next →
        </button>
      </div>
    </SectionCard>
  );
}
