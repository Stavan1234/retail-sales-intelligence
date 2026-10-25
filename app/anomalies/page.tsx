"use client";

import { useMemo, useState } from "react";
import { EChart } from "@/components/charts/echart";
import { PageIntro } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { SectionCard } from "@/components/ui/card";
import { Takeaways } from "@/components/ui/explainer";
import { MetricGrid } from "@/components/ui/metric";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useApiResource } from "@/lib/hooks";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { AnomalyResults, FlaggedTransaction } from "@/types/analytics";

const METHODS = [
  {
    name: "IQR rule",
    kind: "Statistical, one variable",
    rule: "Flags a value below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR. These are the same fences a box plot draws.",
  },
  {
    name: "Z-score",
    kind: "Statistical, one variable",
    rule: "z = (x − mean) ÷ std dev. Flags values with |z| > 3, more than 3 standard deviations from the mean.",
  },
  {
    name: "Isolation Forest",
    kind: "Tree-based, several variables",
    rule: "Splits the data at random using Sales, Quantity, Discount and Profit together (200 trees). Unusual rows get isolated in fewer splits.",
  },
] as const;

const PAGE_SIZE = 15;

export default function Anomalies() {
  const filters = useDashboardFilters();
  const anomalies = useApiResource<AnomalyResults>("/api/anomalies", filters);

  return (
    <main className="page-shell">
      <PageIntro />

      <div className="grid-3">
        {METHODS.map((method) => (
          <div className="card method-card" key={method.name}>
            <span className="method-kind">{method.kind}</span>
            <strong>{method.name}</strong>
            <p>{method.rule}</p>
          </div>
        ))}
      </div>

      {anomalies.loading ? (
        <LoadingState label="Detecting anomalies" />
      ) : anomalies.error ? (
        <ErrorState title="Anomaly detection unavailable for this scope" error={anomalies.error} />
      ) : anomalies.data ? (
        <AnomalyContent data={anomalies.data} />
      ) : null}
    </main>
  );
}

function AnomalyContent({ data }: { data: AnomalyResults }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const count = (method: string, metric: string) =>
    data.methods.find((item) => item.method === method && item.metric === metric)?.count ?? 0;
  const iqrSales = count("IQR", "Sales");
  const zSales = count("Z-score", "Sales");
  const forest = data.isolation_forest;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data.flagged_rows;
    return data.flagged_rows.filter((row) =>
      [row["Order ID"], row["Customer Name"], row["Product Name"], row.Category, row.Region, row.Segment]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [data.flagged_rows, search]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);

  return (
    <>
      <div className="grid-wide">
        <SectionCard
          title="How many rows each method flags"
          subtitle={`Out of ${formatNumber(forest.total)} order lines.`}
          howToRead="the methods answer different questions, so their counts are not expected to agree."
        >
          <EChart
            height={300}
            ariaLabel="Anomaly detection method comparison"
            option={{
              tooltip: { trigger: "axis" },
              grid: { left: 8, right: 16, top: 12, bottom: 8 },
              xAxis: {
                type: "category",
                data: data.methods.map((item) =>
                  item.method === "Isolation Forest"
                    ? "Isolation Forest\n(all 4 variables)"
                    : `${item.method}\n(${item.metric})`,
                ),
                axisLabel: { interval: 0 },
              },
              yAxis: { type: "value", name: "Flagged rows" },
              series: [
                {
                  name: "Flagged rows",
                  type: "bar",
                  data: data.methods.map((item) => item.count),
                  label: { show: true, position: "top", color: "--muted" },
                },
              ],
            }}
          />
        </SectionCard>

        <SectionCard title="Isolation Forest result" subtitle="Rows labelled as anomalies by the model.">
          <MetricGrid
            items={[
              { label: "Flagged", value: formatNumber(forest.anomalies) },
              { label: "Normal", value: formatNumber(forest.normal) },
              {
                label: "Share flagged",
                value: formatPercent(forest.total ? forest.anomalies / forest.total : null),
              },
            ]}
          />
          <p className="card-copy">
            The cut-off comes from scikit-learn&apos;s default (<code>contamination=&quot;auto&quot;</code>),
            not a number we chose.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Most unusual order lines (Isolation Forest)"
        subtitle={`The ${formatNumber(data.flagged_rows.length)} lowest-scoring flagged rows.`}
        howToRead="the score is scikit-learn's anomaly score. The lower (more negative) it is, the more unusual the row. Look at the Sales, Discount and Profit columns together to see why a row stands out."
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
          <span className="toolbar-count">{formatNumber(rows.length)} shown</span>
        </div>
        <AnomalyTable rows={rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)} />
        <div className="pagination">
          <button
            type="button"
            className="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ← Previous
          </button>
          <span aria-live="polite">
            Page {currentPage} of {pages}
          </span>
          <button
            type="button"
            className="button"
            disabled={currentPage >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      </SectionCard>

      <Takeaways
        items={[
          {
            id: "iqr-vs-z",
            text:
              iqrSales > zSales
                ? `On Sales, the IQR rule flags ${formatNumber(iqrSales)} rows but the Z-score flags only ${formatNumber(zSales)}. Sales is heavily right-skewed, so the extreme values inflate the standard deviation and the Z-score misses many of them. The quartile-based IQR is not affected this way.`
                : `On Sales, the IQR rule flags ${formatNumber(iqrSales)} rows and the Z-score flags ${formatNumber(zSales)}.`,
          },
          {
            id: "forest",
            text: "Isolation Forest looks at all four variables at once. It can catch a row that is ordinary on each variable separately but unusual as a combination, such as a large sale with a deep discount and a loss.",
          },
          {
            id: "causes",
            text: "An outlier is not automatically an error. It can be a data-entry mistake, but in retail it is more often a genuine bulk order or a heavily discounted, loss-making sale. These rows are candidates for review, not rows to delete.",
          },
        ]}
      />
    </>
  );
}

function AnomalyTable({ rows }: { rows: FlaggedTransaction[] }) {
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Flagged retail transactions</caption>
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Product</th>
            <th scope="col">Region</th>
            <th scope="col">Sales</th>
            <th scope="col">Qty</th>
            <th scope="col">Discount</th>
            <th scope="col">Profit</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="table-empty">
                No flagged rows match the search.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={`${row["Row ID"]}-${row["Order ID"]}`}>
                <td>{row["Order ID"]}</td>
                <td title={row["Product Name"]}>
                  {row["Product Name"].length > 38
                    ? `${row["Product Name"].slice(0, 38)}…`
                    : row["Product Name"]}
                </td>
                <td>{row.Region}</td>
                <td>{formatCurrency(row.Sales)}</td>
                <td>{formatNumber(row.Quantity)}</td>
                <td>{formatPercent(row.Discount, 0)}</td>
                <td className={row.Profit < 0 ? "value-negative" : undefined}>
                  {formatCurrency(row.Profit)}
                </td>
                <td>{formatNumber(row.anomaly_score, 3)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
