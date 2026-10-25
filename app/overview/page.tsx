"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EChart } from "@/components/charts/echart";
import { PageIntro } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { Card, CardContent, SectionCard } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Takeaways } from "@/components/ui/explainer";
import { ErrorState, LoadingState, MessageState } from "@/components/ui/states";
import { useApiResource } from "@/lib/hooks";
import { NAV_ITEMS } from "@/lib/navigation";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatPercentPoints,
} from "@/lib/utils";
import type { Overview } from "@/types/analytics";

export default function OverviewPage() {
  const filters = useDashboardFilters();
  const searchParams = useSearchParams();
  const { data, error, loading } = useApiResource<Overview>("/api/overview", filters);
  const query = searchParams.toString();

  return (
    <main className="page-shell">
      <PageIntro
        meta={
          data && data.rows > 0 ? (
            <>
              {data.date_min} to {data.date_max}
              <br />
              {formatNumber(data.rows)} order lines
            </>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="project-summary">
          <div>
            <h2 className="card-title">About this project</h2>
            <p>
              A retail superstore records every order line it sells, but thousands of raw rows do not explain
              performance on their own. This project applies the Applied Data Science workflow to the{" "}
              <strong>Sample Superstore</strong> dataset (Orders sheet, 10,194 order lines × 21 columns, US
              and Canada, 2023–2026). It prepares the data, describes it, tests claims statistically, models
              sales with regression, flags unusual transactions and forecasts monthly sales.
            </p>
            <p className="summary-stack">
              Analysis in Python (pandas, SciPy, statsmodels, scikit-learn), served by FastAPI and displayed
              with Next.js. The Jupyter notebook in <code>notebooks/</code> contains the same analysis step by
              step.
            </p>
          </div>
          <ol className="process-list">
            {NAV_ITEMS.slice(1).map((item, index) => (
              <li key={item.href}>
                <Link href={query ? `${item.href}?${query}` : item.href}>
                  <span className="process-step">{index + 2}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <span className="process-module">{item.module}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading overview" />
      ) : error ? (
        <ErrorState title="Could not load the overview" error={error} />
      ) : !data || data.rows === 0 ? (
        <MessageState
          title="No transactions match these filters"
          copy="Choose a different combination of filters."
        />
      ) : (
        <OverviewContent data={data} />
      )}
    </main>
  );
}

function OverviewContent({ data }: { data: Overview }) {
  const topCategory = [...data.category].sort((a, b) => b.profit - a.profit)[0];
  const lowCategory = [...data.category].sort((a, b) => a.margin - b.margin)[0];
  const topRegion = [...data.region].sort((a, b) => b.margin - a.margin)[0];
  const lowRegion = [...data.region].sort((a, b) => a.margin - b.margin)[0];

  return (
    <>
      <h2 className="section-title">Business snapshot</h2>
      <div className="kpi-grid">
        <Kpi
          label="Sales"
          value={data.sales}
          format={formatCurrency}
          note="Total revenue of all order lines"
        />
        <Kpi
          label="Profit"
          value={data.profit}
          format={formatCurrency}
          note="Sum of profit (losses included)"
        />
        <Kpi
          label="Profit margin"
          value={data.profit_margin ?? 0}
          format={formatPercent}
          note="Total profit ÷ total sales"
        />
        <Kpi label="Orders" value={data.orders} format={formatNumber} note="Distinct order IDs" />
        <Kpi label="Units sold" value={data.quantity} format={formatNumber} note="Sum of quantity" />
      </div>

      <SectionCard
        title="Monthly sales"
        subtitle="Total sales per calendar month."
        howToRead="each point is one month. Repeating peaks around the same months each year point to seasonality, which the Forecasting page models."
      >
        <EChart
          height={300}
          ariaLabel="Monthly sales trend"
          option={{
            tooltip: {
              trigger: "axis",
              valueFormatter: (value) => formatCurrency(typeof value === "number" ? value : Number(value)),
            },
            grid: { left: 8, right: 16, top: 16, bottom: 8 },
            xAxis: { type: "category", data: data.monthly.map((point) => point.period) },
            yAxis: {
              type: "value",
              axisLabel: { formatter: (value) => formatCompactCurrency(Number(value)) },
            },
            series: [
              {
                name: "Sales",
                type: "line",
                data: data.monthly.map((point) => point.sales),
                areaStyle: { opacity: 0.08 },
              },
            ],
          }}
        />
      </SectionCard>

      <div className="grid-2">
        <SectionCard
          title="Sales and profit by category"
          subtitle="High sales do not always mean high profit."
          howToRead="compare the two bars in each category. A short profit bar next to a tall sales bar means a thin margin."
        >
          <EChart
            height={300}
            ariaLabel="Category sales and profit"
            option={{
              tooltip: {
                trigger: "axis",
                valueFormatter: (value) => formatCurrency(typeof value === "number" ? value : Number(value)),
              },
              legend: { bottom: 0 },
              grid: { left: 8, right: 8, top: 16, bottom: 36 },
              xAxis: { type: "category", data: data.category.map((row) => row.Category) },
              yAxis: {
                type: "value",
                axisLabel: { formatter: (value) => formatCompactCurrency(Number(value)) },
              },
              series: [
                { name: "Sales", type: "bar", data: data.category.map((row) => row.sales) },
                { name: "Profit", type: "bar", data: data.category.map((row) => row.profit) },
              ],
            }}
          />
        </SectionCard>

        <SectionCard
          title="Profit margin by region"
          subtitle="Profit ÷ sales within each region."
          howToRead="a higher bar means the region keeps more of each dollar of sales as profit."
        >
          <EChart
            height={300}
            ariaLabel="Regional profit margin"
            option={{
              tooltip: {
                trigger: "axis",
                valueFormatter: (value) => {
                  const scalar = Array.isArray(value) ? value[0] : value;
                  return formatPercentPoints(typeof scalar === "number" ? scalar : null);
                },
              },
              grid: { left: 8, right: 8, top: 16, bottom: 8 },
              xAxis: { type: "category", data: data.region.map((row) => row.Region) },
              yAxis: { type: "value", axisLabel: { formatter: (value) => `${Math.round(Number(value))}%` } },
              series: [
                {
                  name: "Margin",
                  type: "bar",
                  data: data.region.map((row) => row.margin),
                  itemStyle: { color: "--chart-3" },
                },
              ],
            }}
          />
        </SectionCard>
      </div>

      <Takeaways
        items={[
          {
            id: "top-category",
            text: (
              <>
                <strong>{topCategory?.Category}</strong> earns the most profit:{" "}
                {formatCurrency(topCategory?.profit)} on {formatCurrency(topCategory?.sales)} of sales.
              </>
            ),
          },
          {
            id: "low-category",
            text: (
              <>
                <strong>{lowCategory?.Category}</strong> has the thinnest margin at{" "}
                {formatPercentPoints(lowCategory?.margin)}.
              </>
            ),
          },
          {
            id: "regions",
            text: (
              <>
                Margins range from {formatPercentPoints(lowRegion?.margin)} in{" "}
                <strong>{lowRegion?.Region}</strong> to {formatPercentPoints(topRegion?.margin)} in{" "}
                <strong>{topRegion?.Region}</strong>.
              </>
            ),
          },
          {
            id: "next",
            text: "These figures only describe the data. The Hypothesis Tests page checks whether such differences are statistically significant.",
          },
        ]}
      />
    </>
  );
}

function Kpi({
  label,
  value,
  format,
  note,
}: {
  label: string;
  value: number;
  format: (value: number) => string;
  note: string;
}) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        <CountUp value={value} format={format} />
      </div>
      <div className="kpi-note">{note}</div>
    </div>
  );
}
