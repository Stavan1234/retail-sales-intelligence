"use client";

import type { EChartsOption } from "echarts";
import { EChart } from "@/components/charts/echart";
import { PageIntro } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { useFilterActions } from "@/components/providers/use-filter-actions";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/card";
import { Callout, Takeaways } from "@/components/ui/explainer";
import { ErrorState, LoadingState, MessageState } from "@/components/ui/states";
import { useApiResource } from "@/lib/hooks";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentPoints } from "@/lib/utils";
import type { ForecastModelResult, ForecastResults } from "@/types/analytics";

export default function Forecast() {
  const filters = useDashboardFilters();
  const { clearFilters, isPending } = useFilterActions();
  // A seasonal model needs at least two full years of months; a single year cannot provide that.
  const blocked = Boolean(filters.year || filters.start_date || filters.end_date);
  const forecast = useApiResource<ForecastResults>("/api/forecast", filters, !blocked);

  return (
    <main className="page-shell">
      <PageIntro />

      <Callout title="Method">
        Order lines are summed into <strong>monthly sales</strong>. The series has a trend and a yearly
        seasonal pattern, so it is modelled with <strong>Holt-Winters exponential smoothing</strong> (level +
        trend + 12-month seasonality). Four variants were fitted on all months except the last 12: additive or
        multiplicative seasonality, each with and without a damped trend. The variant with the lowest error on
        those 12 held-out months was chosen and then refitted on the full series.
      </Callout>

      {blocked ? (
        <MessageState
          title="Clear the Year filter to forecast"
          copy="Holt-Winters needs at least 24 months of history to learn the yearly pattern, and one year only has 12. Region, Category and Segment filters still work."
          action={
            <button
              type="button"
              className="button button-primary"
              disabled={isPending}
              onClick={() => clearFilters(["year", "start_date", "end_date"])}
            >
              Clear Year filter
            </button>
          }
        />
      ) : forecast.loading ? (
        <LoadingState label="Fitting forecast model" />
      ) : forecast.error ? (
        <ErrorState title="Forecast unavailable for this scope" error={forecast.error} />
      ) : forecast.data ? (
        <ForecastContent data={forecast.data} />
      ) : null}
    </main>
  );
}

function modelName(model: ForecastModelResult) {
  return `${model.seasonal === "add" ? "Additive" : "Multiplicative"}${model.damped ? ", damped trend" : ""}`;
}

function sameModel(a: ForecastModelResult, b: ForecastModelResult) {
  return a.damped === b.damped && a.seasonal === b.seasonal;
}

function previousYearPeriod(period: string) {
  const [year, month] = period.split("-");
  return `${Number(year) - 1}-${month}`;
}

function ForecastContent({ data }: { data: ForecastResults }) {
  const selected = data.validation.selected;
  const naive = data.validation.seasonal_naive;
  const improvement = naive.mae > 0 ? (1 - selected.mae / naive.mae) * 100 : null;
  const historyByPeriod = new Map(data.history.map((point) => [point.period, point.sales]));
  const lastYear = data.forecast.map((point) => historyByPeriod.get(previousYearPeriod(point.period)));
  const hasLastYear = lastYear.every((value) => value !== undefined);
  const forecastTotal = data.forecast.reduce((sum, point) => sum + point.forecast, 0);
  const lastYearTotal = lastYear.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const yearOnYear = hasLastYear && lastYearTotal > 0 ? (forecastTotal / lastYearTotal - 1) * 100 : null;
  const first = data.forecast[0];
  const last = data.forecast.at(-1);

  return (
    <>
      <SectionCard
        title="Monthly sales with a six-month forecast"
        subtitle={`${data.history[0]?.period} to ${data.history.at(-1)?.period} actual, then ${first?.period} to ${last?.period} forecast.`}
        howToRead="the dashed line is the most likely value. The darker band is where sales should fall 80% of the time, and the lighter band 95% of the time. The wider the band, the less certain the forecast."
      >
        <EChart height={400} ariaLabel="Monthly sales with six-month forecast" option={forecastChart(data)} />
      </SectionCard>

      <div className="grid-stack">
        <SectionCard
          title="Model validation on the last 12 months"
          subtitle="Errors when each model forecast 12 months it had not seen."
          howToRead="MAE and RMSE are in dollars per month. sMAPE is the symmetric mean absolute percentage error. The benchmark simply repeats last year's value for each month, and a useful model should beat it."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Model (seasonality, trend)</th>
                  <th scope="col">MAE</th>
                  <th scope="col">RMSE</th>
                  <th scope="col">sMAPE</th>
                </tr>
              </thead>
              <tbody>
                {data.validation.models.map((model) => (
                  <tr
                    key={modelName(model)}
                    className={sameModel(model, selected) ? "row-selected" : undefined}
                  >
                    <th scope="row">
                      Holt-Winters ({modelName(model)}){" "}
                      {sameModel(model, selected) && <Badge tone="positive">Selected</Badge>}
                    </th>
                    <td>{formatCurrency(model.mae)}</td>
                    <td>{formatCurrency(model.rmse)}</td>
                    <td>{formatPercentPoints(model.smape)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Seasonal naive (benchmark)</th>
                  <td>{formatCurrency(naive.mae)}</td>
                  <td>{formatCurrency(naive.rmse)}</td>
                  <td>{formatPercentPoints(naive.smape)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Forecast values" subtitle="Point forecast with 80% and 95% prediction intervals.">
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Six-month sales forecast</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Forecast</th>
                  <th scope="col">80% interval</th>
                  <th scope="col">95% interval</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((row) => (
                  <tr key={row.period}>
                    <th scope="row">{row.period}</th>
                    <td>{formatCurrency(row.forecast)}</td>
                    <td>
                      {formatCurrency(row.lower80)} – {formatCurrency(row.upper80)}
                    </td>
                    <td>
                      {formatCurrency(row.lower95)} – {formatCurrency(row.upper95)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="formula-note">
            Intervals come from 2,000 simulated future paths that resample the model&apos;s own past errors
            (bootstrap). Values below $0 are shown as $0.
          </p>
        </SectionCard>
      </div>

      <Takeaways
        items={[
          {
            id: "benchmark",
            text:
              improvement === null
                ? "The benchmark comparison is unavailable for this scope."
                : improvement > 0
                  ? `The selected model's validation error (MAE ${formatCurrency(selected.mae)}) is ${formatNumber(improvement, 0)}% lower than the seasonal-naive benchmark (${formatCurrency(naive.mae)}), so it adds value over simply repeating last year.`
                  : `The selected model does not beat the seasonal-naive benchmark (MAE ${formatCurrency(selected.mae)} vs ${formatCurrency(naive.mae)}), so its forecast should be treated with caution.`,
          },
          {
            id: "total",
            text:
              yearOnYear === null
                ? `The model projects ${formatCurrency(forecastTotal)} in total sales from ${first?.period} to ${last?.period}.`
                : `The model projects ${formatCurrency(forecastTotal)} in total sales from ${first?.period} to ${last?.period}. That is ${formatNumber(Math.abs(yearOnYear), 1)}% ${yearOnYear >= 0 ? "above" : "below"} the same six months a year earlier (${formatCurrency(lastYearTotal)}).`,
          },
          {
            id: "uncertainty",
            text: "The bands widen further into the future because errors build up month by month. A forecast is an estimate, not a guarantee.",
          },
        ]}
      />
    </>
  );
}

function forecastChart(data: ForecastResults): EChartsOption {
  const periods = [...data.history.map((item) => item.period), ...data.forecast.map((item) => item.period)];
  const future = data.forecast.length;
  const past = data.history.length;
  const blanks = (count: number) => Array<null>(Math.max(0, count)).fill(null);
  const rolling = new Map(data.rolling_3m.map((item) => [item.period, item.value]));

  const band = (
    lower: (index: number) => number,
    upper: (index: number) => number,
    stack: string,
    opacity: number,
  ) => [
    {
      type: "line" as const,
      stack,
      data: [...blanks(past), ...data.forecast.map((_, index) => lower(index))],
      lineStyle: { opacity: 0 },
      silent: true,
      tooltip: { show: false },
    },
    {
      type: "line" as const,
      stack,
      data: [...blanks(past), ...data.forecast.map((_, index) => Math.max(0, upper(index) - lower(index)))],
      lineStyle: { opacity: 0 },
      areaStyle: { color: "--chart-2", opacity },
      silent: true,
      tooltip: { show: false },
    },
  ];

  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => (value == null ? "—" : formatCurrency(Number(value))),
    },
    legend: { bottom: 0, data: ["Actual sales", "3-month moving average", "Forecast"] },
    grid: { left: 8, right: 16, top: 16, bottom: 36 },
    xAxis: { type: "category", data: periods },
    yAxis: { type: "value", axisLabel: { formatter: (value) => formatCompactCurrency(Number(value)) } },
    series: [
      ...band(
        (index) => data.forecast[index].lower95,
        (index) => data.forecast[index].upper95,
        "band95",
        0.12,
      ),
      ...band(
        (index) => data.forecast[index].lower80,
        (index) => data.forecast[index].upper80,
        "band80",
        0.22,
      ),
      {
        name: "Actual sales",
        type: "line",
        data: [...data.history.map((item) => item.sales), ...blanks(future)],
        itemStyle: { color: "--chart-1" },
        lineStyle: { color: "--chart-1" },
      },
      {
        name: "3-month moving average",
        type: "line",
        data: [...data.history.map((item) => rolling.get(item.period) ?? null), ...blanks(future)],
        itemStyle: { color: "--chart-6" },
        lineStyle: { color: "--chart-6", width: 1.75 },
      },
      {
        name: "Forecast",
        type: "line",
        showSymbol: true,
        data: [
          ...blanks(past - 1),
          data.history.at(-1)?.sales ?? null,
          ...data.forecast.map((item) => item.forecast),
        ],
        itemStyle: { color: "--chart-2" },
        lineStyle: { color: "--chart-2", type: "dashed" },
      },
    ],
  };
}
