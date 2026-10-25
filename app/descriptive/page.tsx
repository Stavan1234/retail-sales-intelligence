"use client";

import { EChart } from "@/components/charts/echart";
import { PageIntro } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { SectionCard } from "@/components/ui/card";
import { Callout, Takeaways } from "@/components/ui/explainer";
import { ErrorState, LoadingState, MessageState } from "@/components/ui/states";
import { useApiResource } from "@/lib/hooks";
import {
  correlationStrength,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercentPoints,
  isFiniteNumber,
} from "@/lib/utils";
import type { DescriptiveRow, ExploreData, GroupSummary } from "@/types/analytics";

type DistributionKey = keyof ExploreData["distributions"];
type ScatterKey = keyof ExploreData["scatters"];
type GroupKey = "Category" | "Region" | "Segment";
type GroupRow = GroupSummary & Partial<Record<GroupKey, string>>;

const DISTRIBUTIONS: Array<[DistributionKey, string]> = [
  ["Sales", "Sales per order line ($)"],
  ["Profit", "Profit per order line ($)"],
  ["Quantity", "Units per order line"],
  ["Discount", "Discount rate (0 = none, 0.8 = 80%)"],
];

const SCATTERS: Array<[ScatterKey, string, string, string]> = [
  [
    "sales_profit",
    "Sales",
    "Profit",
    "each dot is one order line. Dots below zero are sales that lost money.",
  ],
  [
    "discount_profit",
    "Discount",
    "Profit",
    "discounts take a few fixed values, so dots form columns. Check whether profit drops as the discount grows.",
  ],
  [
    "quantity_sales",
    "Quantity",
    "Sales",
    "quantity is a whole number, so dots form columns. A tall column means unit prices vary a lot.",
  ],
];

/** Karl Pearson's second coefficient of skewness: 3(mean − median) / s. */
function pearsonSkew(row: DescriptiveRow) {
  return isFiniteNumber(row.std) && row.std !== 0 ? (3 * (row.mean - row.median)) / row.std : null;
}

/** Bowley's (quartile) coefficient of skewness: (Q3 + Q1 − 2·median) / (Q3 − Q1). */
function bowleySkew(row: DescriptiveRow) {
  return row.iqr !== 0 ? (row.q3 + row.q1 - 2 * row.median) / row.iqr : null;
}

function formatValue(variable: string, value: number | null) {
  return variable === "Profit Margin" ? formatPercentPoints(value, 2) : formatNumber(value, 2);
}

export default function Descriptive() {
  const filters = useDashboardFilters();
  const { data, error, loading } = useApiResource<ExploreData>("/api/explore", filters);

  return (
    <main className="page-shell">
      <PageIntro />
      {loading ? (
        <LoadingState label="Loading descriptive statistics" />
      ) : error ? (
        <ErrorState title="Descriptive statistics unavailable" error={error} />
      ) : !data || data.descriptive.length === 0 ? (
        <MessageState
          title="No transactions match these filters"
          copy="Choose a different combination of filters."
        />
      ) : (
        <DescriptiveContent data={data} />
      )}
    </main>
  );
}

function DescriptiveContent({ data }: { data: ExploreData }) {
  const byName = new Map(data.descriptive.map((row) => [row.variable, row]));
  const sales = byName.get("Sales");
  const strongest = strongestCorrelation(data);

  return (
    <>
      <h2 className="section-title">1. Univariate: how is each variable distributed?</h2>
      <div className="grid-2">
        {DISTRIBUTIONS.map(([key, axisName]) => {
          const distribution = data.distributions[key];
          const row = byName.get(key);
          return (
            <SectionCard
              key={key}
              title={`${key} histogram`}
              subtitle={`${formatNumber(distribution.n)} order lines · skewness ${formatNumber(row?.skewness, 2)}`}
            >
              <EChart
                height={240}
                ariaLabel={`${key} histogram`}
                option={{
                  tooltip: { trigger: "axis" },
                  grid: { left: 8, right: 8, top: 12, bottom: 24 },
                  xAxis: {
                    type: "category",
                    name: axisName,
                    nameLocation: "middle",
                    nameGap: 28,
                    data: distribution.bins.map((value) => formatNumber(value, Math.abs(value) < 1 ? 2 : 0)),
                  },
                  yAxis: { type: "value", name: "Count" },
                  series: [
                    { name: "Order lines", type: "bar", barCategoryGap: "4%", data: distribution.counts },
                  ],
                }}
              />
            </SectionCard>
          );
        })}
      </div>
      <Callout title="Why the Sales and Profit bars are bunched together">
        Most order lines are small, but a few are extreme: Sales has a long right tail, and Profit has long
        tails on both sides (large gains and large losses). Those few values stretch the axis, so nearly all
        rows fall into one or two bars. For data like this the median is a better &quot;typical value&quot;
        than the mean.
      </Callout>

      <SectionCard
        title="Summary measures"
        subtitle="Central tendency, spread and shape of each numeric variable."
        howToRead="skewness near 0 means a symmetric distribution, positive means a long right tail. Excess kurtosis above 0 means heavier tails than a normal distribution."
      >
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Descriptive statistics for numeric variables</caption>
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">n</th>
                <th scope="col">Mean</th>
                <th scope="col">Median</th>
                <th scope="col">Std dev</th>
                <th scope="col">Min</th>
                <th scope="col">Q1</th>
                <th scope="col">Q3</th>
                <th scope="col">Max</th>
                <th scope="col">IQR</th>
                <th scope="col">Skewness</th>
                <th scope="col">Pearson Sk</th>
                <th scope="col">Bowley Sk</th>
                <th scope="col">Excess kurtosis</th>
              </tr>
            </thead>
            <tbody>
              {data.descriptive.map((row) => (
                <tr key={row.variable}>
                  <th scope="row">{row.variable}</th>
                  <td>{formatNumber(row.count)}</td>
                  <td>{formatValue(row.variable, row.mean)}</td>
                  <td>{formatValue(row.variable, row.median)}</td>
                  <td>{formatValue(row.variable, row.std)}</td>
                  <td>{formatValue(row.variable, row.min)}</td>
                  <td>{formatValue(row.variable, row.q1)}</td>
                  <td>{formatValue(row.variable, row.q3)}</td>
                  <td>{formatValue(row.variable, row.max)}</td>
                  <td>{formatValue(row.variable, row.iqr)}</td>
                  <td>{formatNumber(row.skewness, 2)}</td>
                  <td>{formatNumber(pearsonSkew(row), 2)}</td>
                  <td>{formatNumber(bowleySkew(row), 2)}</td>
                  <td>{formatNumber(row.kurtosis, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="formula-note">
          Skewness = bias-corrected moment coefficient (SciPy). Pearson Sk = 3(mean − median) ÷ std dev.
          Bowley Sk = (Q3 + Q1 − 2·median) ÷ (Q3 − Q1). Std dev and variance use n − 1.
        </p>
      </SectionCard>

      <h2 className="section-title">2. Grouped: how do categories, regions and segments compare?</h2>
      <div className="grid-3">
        <GroupChart group="Category" rows={data.category} />
        <GroupChart group="Region" rows={data.region} />
        <GroupChart group="Segment" rows={data.segment} />
      </div>

      <h2 className="section-title">3. Multivariate: how are the variables related?</h2>
      <div className="grid-3">
        {SCATTERS.map(([key, xName, yName, note]) => {
          const series = data.scatters[key];
          return (
            <SectionCard
              key={key}
              title={`${xName} vs ${yName}`}
              subtitle={`Random sample of ${formatNumber(series.sampled)} of ${formatNumber(series.total)} order lines`}
              howToRead={note}
            >
              <EChart
                height={260}
                ariaLabel={`${xName} versus ${yName} scatter plot`}
                option={{
                  tooltip: { trigger: "item" },
                  grid: { left: 8, right: 16, top: 28, bottom: 24 },
                  xAxis: {
                    type: "value",
                    name: xName,
                    nameLocation: "middle",
                    nameGap: 26,
                    axisLabel: { formatter: (value) => compact(Number(value)) },
                  },
                  yAxis: {
                    type: "value",
                    name: yName,
                    axisLabel: { formatter: (value) => compact(Number(value)) },
                  },
                  series: [{ type: "scatter", data: series.points.map((point) => [point.x, point.y]) }],
                }}
              />
            </SectionCard>
          );
        })}
      </div>

      <SectionCard
        title="Karl Pearson correlation matrix"
        subtitle="r ranges from −1 (perfect negative) through 0 (no linear relationship) to +1 (perfect positive)."
        howToRead="each cell is r for one pair. Darker blue = stronger positive, darker red = stronger negative. Correlation measures association only; it does not show that one variable causes the other."
      >
        <EChart
          height={320}
          ariaLabel="Pearson correlation heatmap"
          option={{
            tooltip: {
              position: "top",
              formatter: (params) => {
                if (Array.isArray(params) || !Array.isArray(params.value)) return "";
                const [column, row, value] = params.value as [number, number, number];
                return `${data.correlation.labels[row]} · ${data.correlation.labels[column]}: r = ${Number(value).toFixed(3)}`;
              },
            },
            grid: { left: 8, right: 8, top: 8, bottom: 56 },
            xAxis: { type: "category", data: data.correlation.labels, splitLine: { show: false } },
            yAxis: {
              type: "category",
              inverse: true,
              data: data.correlation.labels,
              splitLine: { show: false },
            },
            visualMap: {
              min: -1,
              max: 1,
              orient: "horizontal",
              left: "center",
              bottom: 0,
              itemHeight: 160,
              textStyle: { color: "--muted" },
              inRange: { color: ["--heat-low", "--heat-mid", "--heat-high"] },
            },
            series: [
              {
                type: "heatmap",
                label: {
                  show: true,
                  color: "--foreground",
                  formatter: (params) =>
                    Array.isArray(params.value) ? Number(params.value[2]).toFixed(2) : "",
                },
                itemStyle: { borderColor: "--surface", borderWidth: 2 },
                data: data.correlation.matrix.flatMap((row, rowIndex) =>
                  row.map((value, columnIndex) => [columnIndex, rowIndex, value ?? 0]),
                ),
              },
            ],
          }}
        />
      </SectionCard>

      <Takeaways
        items={[
          {
            id: "skew",
            text: sales ? (
              <>
                A typical order line is worth <strong>{formatCurrency(sales.median)}</strong> (median), but
                the mean is {formatCurrency(sales.mean)} because a few large orders pull it up (skewness{" "}
                {formatNumber(sales.skewness, 1)}).
              </>
            ) : (
              "Sales summary unavailable in this scope."
            ),
          },
          {
            id: "corr",
            text: strongest ? (
              <>
                The strongest linear relationship is <strong>{strongest.pair}</strong> (r ={" "}
                {strongest.value.toFixed(2)}, {correlationStrength(strongest.value)}).
              </>
            ) : (
              "Correlations are undefined in this scope."
            ),
          },
          {
            id: "discount",
            text: (() => {
              const r = correlationValue(data, "Discount", "Profit");
              return r === null
                ? "Discount–profit correlation is undefined in this scope."
                : `Discount and Profit have r = ${r.toFixed(2)} (${correlationStrength(r)})${
                    r < 0 ? ": heavier discounts are associated with lower profit." : "."
                  }`;
            })(),
          },
        ]}
      />
    </>
  );
}

function GroupChart({ group, rows }: { group: GroupKey; rows: GroupRow[] }) {
  return (
    <SectionCard title={`By ${group.toLowerCase()}`} subtitle="Total sales and profit.">
      <EChart
        height={260}
        ariaLabel={`${group} sales and profit`}
        option={{
          tooltip: {
            trigger: "axis",
            valueFormatter: (value) => formatCurrency(typeof value === "number" ? value : Number(value)),
          },
          legend: { bottom: 0 },
          grid: { left: 8, right: 8, top: 12, bottom: 32 },
          xAxis: {
            type: "category",
            data: rows.map((row) => row[group] ?? "Unknown"),
            axisLabel: { interval: 0, formatter: (value: string) => value.replace(" ", "\n") },
          },
          yAxis: { type: "value", axisLabel: { formatter: (value) => formatCompactCurrency(Number(value)) } },
          series: [
            { name: "Sales", type: "bar", data: rows.map((row) => row.sales) },
            { name: "Profit", type: "bar", data: rows.map((row) => row.profit) },
          ],
        }}
      />
    </SectionCard>
  );
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function correlationValue(data: ExploreData, a: string, b: string) {
  const i = data.correlation.labels.indexOf(a);
  const j = data.correlation.labels.indexOf(b);
  const value = i >= 0 && j >= 0 ? data.correlation.matrix[i]?.[j] : null;
  return isFiniteNumber(value) ? value : null;
}

function strongestCorrelation(data: ExploreData) {
  let best: { pair: string; value: number } | null = null;
  const labels = data.correlation.labels;
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      const value = data.correlation.matrix[i]?.[j];
      if (isFiniteNumber(value) && (!best || Math.abs(value) > Math.abs(best.value))) {
        best = { pair: `${labels[i]} and ${labels[j]}`, value };
      }
    }
  }
  return best;
}
