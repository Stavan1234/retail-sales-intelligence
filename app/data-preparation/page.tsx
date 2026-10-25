"use client";

import { TransactionExplorer } from "@/components/data/transaction-explorer";
import { PageIntro } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/card";
import { Takeaways } from "@/components/ui/explainer";
import { MetricGrid } from "@/components/ui/metric";
import { ErrorState, LoadingState, MessageState } from "@/components/ui/states";
import { useApiResource } from "@/lib/hooks";
import { formatNumber } from "@/lib/utils";
import type { DataQuality } from "@/types/analytics";

const PIPELINE = [
  ["Load", "Read the Orders sheet of the Excel workbook (21 columns)."],
  ["Validate", "Check that all required columns exist and both date columns parse."],
  ["Quality checks", "Count missing values, duplicate rows and out-of-range values."],
  ["Feature engineering", "Derive 10 new columns from the order and ship dates, sales and profit."],
  ["Analyse", "The same prepared table feeds every page and the notebook."],
] as const;

const ENGINEERED = [
  ["Year", "Year of Order Date", "Year filter, yearly comparison"],
  ["Month", "Month number (1–12) of Order Date", "Seasonality"],
  ["Month Name", "Month name of Order Date", "Readable labels"],
  ["Quarter", "Quarter (1–4) of Order Date", "Quarterly grouping"],
  ["Day", "Day of the month of Order Date", "Calendar breakdown"],
  ["Day of Week", "Weekday name of Order Date", "Weekday patterns"],
  ["Week", "ISO week number of Order Date", "Weekly grouping"],
  ["Profit Margin", "Profit ÷ Sales × 100 (0 when Sales is 0)", "Profitability of each order line"],
  ["Shipping Days", "Ship Date − Order Date, in days", "Delivery time, range check"],
  ["Order Month", "Year and month of Order Date (YYYY-MM)", "Monthly time series for forecasting"],
] as const;

const CHECK_LABELS: Record<string, string> = {
  negative_quantity: "Quantity is negative",
  discount_out_of_range: "Discount outside 0–100%",
  invalid_shipping_days: "Ship date before order date",
  nonfinite_numeric: "Infinite or invalid numbers",
};

export default function DataPreparation() {
  const filters = useDashboardFilters();
  const { data, error, loading } = useApiResource<DataQuality>("/api/data-quality", filters);

  return (
    <main className="page-shell">
      <PageIntro />

      <SectionCard
        title="Preparation pipeline"
        subtitle="Every page uses this one path from raw file to analysis."
      >
        <ol className="pipeline">
          {PIPELINE.map(([title, detail], index) => (
            <li className="pipeline-step" key={title}>
              <span className="pipeline-index">{index + 1}</span>
              <strong>{title}</strong>
              <span>{detail}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      {loading ? (
        <LoadingState label="Loading data quality report" />
      ) : error ? (
        <ErrorState title="Data quality report unavailable" error={error} />
      ) : !data || data.rows === 0 ? (
        <MessageState title="No rows match these filters" copy="Choose a different combination of filters." />
      ) : (
        <QualityReport data={data} />
      )}

      <SectionCard
        title="Engineered fields"
        subtitle="New columns derived from the 21 source columns. The source values themselves are not changed."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">How it is derived</th>
                <th scope="col">Used for</th>
              </tr>
            </thead>
            <tbody>
              {ENGINEERED.map(([name, formula, use]) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>{formula}</td>
                  <td>{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <TransactionExplorer filters={filters} />
    </main>
  );
}

function QualityReport({ data }: { data: DataQuality }) {
  const checks: Array<[string, string, number]> = [
    ["missing", "Missing values", data.missing_values],
    ["duplicates", "Duplicate rows", data.duplicate_rows],
    ...Object.entries(data.invalid_ranges).map(([key, value]): [string, string, number] => [
      key,
      CHECK_LABELS[key] ?? key.replaceAll("_", " "),
      value,
    ]),
  ];
  const passed = checks.filter(([, , value]) => value === 0).length;

  return (
    <>
      <div className="grid-2">
        <SectionCard title="Dataset shape" subtitle="After feature engineering, in the current filter scope.">
          <MetricGrid
            items={[
              { label: "Rows", value: formatNumber(data.rows), hint: "one row = one order line" },
              { label: "Columns", value: formatNumber(data.columns), hint: "21 source + 10 derived" },
              {
                label: "Numeric",
                value: formatNumber(data.numeric_columns),
                hint: "e.g. Sales, Profit, Quantity",
              },
              {
                label: "Categorical",
                value: formatNumber(data.categorical_columns),
                hint: "e.g. Region, Category, Segment",
              },
              { label: "Date", value: formatNumber(data.datetime_columns), hint: "Order Date, Ship Date" },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Quality checks"
          subtitle={`${passed} of ${checks.length} checks pass.`}
          action={
            <Badge tone={passed === checks.length ? "positive" : "warning"}>
              {passed === checks.length ? "Clean" : "Review"}
            </Badge>
          }
        >
          <ul className="check-list">
            {checks.map(([key, label, value]) => (
              <li key={key}>
                <span>{label}</span>
                <span className="check-count">{formatNumber(value)}</span>
                <Badge tone={value === 0 ? "positive" : "warning"}>{value === 0 ? "Pass" : "Review"}</Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <Takeaways
        items={[
          {
            id: "clean",
            text:
              passed === checks.length
                ? "The source data has no missing values, duplicates or impossible values, so no rows had to be removed or imputed."
                : "Some checks flag rows. They are kept and reported rather than silently removed.",
          },
          {
            id: "losses",
            text: "Negative profit is valid (a loss-making order line), so it is not treated as an error.",
          },
          {
            id: "types",
            text: "Numeric columns are summarised with means, spreads and correlations. Categorical columns are used to group and compare.",
          },
        ]}
      />
    </>
  );
}
