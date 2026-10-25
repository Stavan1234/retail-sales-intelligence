"use client";

import type { EChartsOption } from "echarts";
import { EChart } from "@/components/charts/echart";
import { PageIntro } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { SectionCard } from "@/components/ui/card";
import { Callout, Takeaways } from "@/components/ui/explainer";
import { MetricGrid } from "@/components/ui/metric";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useApiResource } from "@/lib/hooks";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { RegressionCoefficient, RegressionResults } from "@/types/analytics";

export default function Regression() {
  const filters = useDashboardFilters();
  const regression = useApiResource<RegressionResults>("/api/regression", filters);

  return (
    <main className="page-shell">
      <PageIntro />

      <Callout title="Set-up">
        The target is the <strong>Sales value of one order line</strong>. The rows are split at random into
        80% for training and 20% for testing (fixed seed 42), and every metric below is measured on the test
        rows the model never saw. Categorical inputs are one-hot encoded (one 0/1 column per category).
      </Callout>

      {regression.loading ? (
        <LoadingState label="Fitting regression models" />
      ) : regression.error ? (
        <ErrorState title="Regression unavailable for this scope" error={regression.error} />
      ) : regression.data ? (
        <RegressionContent data={regression.data} />
      ) : null}
    </main>
  );
}

function RegressionContent({ data }: { data: RegressionResults }) {
  const { simple, multiple } = data;
  const slope = simple.coefficients[0].coefficient;
  const intercept = simple.intercept;

  return (
    <>
      <div className="grid-2">
        <SectionCard title="Simple linear regression" subtitle="One input: Quantity.">
          <div className="equation" role="math" aria-label="Fitted regression equation">
            Sales = {formatNumber(intercept, 2)} {slope >= 0 ? "+" : "−"} {formatNumber(Math.abs(slope), 2)} ×
            Quantity
          </div>
          <ul className="plain-list">
            <li>
              <strong>Slope ({formatNumber(slope, 2)}):</strong> each extra unit in an order line is
              associated with about {formatCurrency(Math.abs(slope), 2)} {slope >= 0 ? "more" : "less"} sales
              on average.
            </li>
            <li>
              <strong>Intercept ({formatNumber(intercept, 2)}):</strong> the predicted sales when Quantity =
              0. It anchors the line and has no business meaning, since no order line has zero units.
            </li>
            <li>
              <strong>Error term:</strong> the gap between actual and predicted sales, measured by MAE and
              RMSE below.
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="Multiple linear regression" subtitle="Six inputs predicting Sales together.">
          <p className="card-copy">
            Sales = b₀ + b₁·Quantity + b₂·Discount + Category, Sub-Category, Region and Segment indicators
          </p>
          <MetricGrid
            items={[
              { label: "Input variables", value: formatNumber(multiple.features.length) },
              {
                label: "Encoded columns",
                value: formatNumber(multiple.encoded_feature_count),
                hint: "after one-hot encoding",
              },
              { label: "Training rows", value: formatNumber(multiple.train_samples) },
              { label: "Test rows", value: formatNumber(multiple.test_samples) },
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Model fit on the test set"
        subtitle="Lower MAE and RMSE are better, and R² closer to 1 is better."
        howToRead="MAE is the average size of a prediction error in dollars. RMSE squares errors before averaging, so it punishes large misses more. R² is the share of the variation in Sales that the model explains."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">MAE</th>
                <th scope="col">RMSE</th>
                <th scope="col">R²</th>
                <th scope="col">Variance explained</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Simple (Quantity)</th>
                <td>{formatCurrency(simple.metrics.mae, 2)}</td>
                <td>{formatCurrency(simple.metrics.rmse, 2)}</td>
                <td>{formatNumber(simple.metrics.r2, 3)}</td>
                <td>{formatPercent(simple.metrics.r2)}</td>
              </tr>
              <tr>
                <th scope="row">Multiple (6 inputs)</th>
                <td>{formatCurrency(multiple.metrics.mae, 2)}</td>
                <td>{formatCurrency(multiple.metrics.rmse, 2)}</td>
                <td>{formatNumber(multiple.metrics.r2, 3)}</td>
                <td>{formatPercent(multiple.metrics.r2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid-2">
        <SectionCard
          title="Actual vs predicted (multiple model)"
          subtitle="Up to 500 test rows."
          howToRead="a perfect model puts every dot on the dashed line. Dots far above or below it are large errors."
        >
          <EChart
            height={300}
            ariaLabel="Actual versus predicted sales"
            option={actualPredictedChart(data)}
          />
        </SectionCard>

        <SectionCard
          title="Residuals (multiple model)"
          subtitle="Residual = actual − predicted."
          howToRead="residuals should scatter evenly around zero with no pattern. A funnel shape that widens to the right means errors grow with the size of the sale."
        >
          <EChart height={300} ariaLabel="Regression residuals" option={residualChart(data)} />
        </SectionCard>
      </div>

      <div className="grid-2">
        <SectionCard
          title="5-fold cross-validation (multiple model)"
          subtitle="The data is split into 5 parts. Each part is used once as the test set."
          howToRead="similar scores across folds mean the result does not depend on one lucky train/test split."
        >
          <MetricGrid
            items={[
              {
                label: "Mean R²",
                value: `${formatNumber(multiple.cv.mean_r2, 3)} ± ${formatNumber(multiple.cv.std_r2, 3)}`,
                hint: "mean ± standard deviation",
              },
              { label: "Mean MAE", value: formatCurrency(multiple.cv.mean_mae, 2) },
              { label: "Mean RMSE", value: formatCurrency(multiple.cv.mean_rmse, 2) },
            ]}
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Fold</th>
                  <th scope="col">R²</th>
                  <th scope="col">MAE</th>
                  <th scope="col">RMSE</th>
                </tr>
              </thead>
              <tbody>
                {multiple.cv.folds.map((fold) => (
                  <tr key={fold.fold}>
                    <th scope="row">{fold.fold}</th>
                    <td>{formatNumber(fold.r2, 3)}</td>
                    <td>{formatCurrency(fold.mae, 2)}</td>
                    <td>{formatCurrency(fold.rmse, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Largest partial regression coefficients"
          subtitle="Top 12 by size, multiple model."
          howToRead="a coefficient is the expected change in Sales for that input, holding all other inputs constant. For Quantity and Discount it is per unit. A category column (e.g. Sub-Category_Copiers) shows how that group's predicted sales compare with other groups. Compare these columns with each other rather than reading them alone."
        >
          <EChart
            height={360}
            ariaLabel="Regression coefficient ranking"
            option={coefficientChart(multiple.coefficients)}
          />
        </SectionCard>
      </div>

      <Takeaways
        items={[
          {
            id: "r2",
            text: (
              <>
                Quantity alone explains <strong>{formatPercent(simple.metrics.r2)}</strong> of the variation
                in order-line sales. Adding discount and product and customer attributes raises this to{" "}
                <strong>{formatPercent(multiple.metrics.r2)}</strong> on the test set.
              </>
            ),
          },
          {
            id: "mae",
            text: `On average the multiple model's prediction is off by ${formatCurrency(multiple.metrics.mae)} per order line (MAE).`,
          },
          {
            id: "unexplained",
            text: `The remaining ${formatPercent(1 - multiple.metrics.r2)} of the variation is not explained by these inputs. For example, the product's unit price is not one of them.`,
          },
          {
            id: "causal",
            text: "The coefficients describe associations in this data. They do not prove that changing an input would change sales.",
          },
        ]}
      />
    </>
  );
}

/** Round an axis limit away from zero to a clean value (e.g. 3,805 → 4,000) so axis labels stay readable. */
function niceLimit(value: number) {
  if (value === 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)));
  return Math.sign(value) * Math.ceil(Math.abs(value) / magnitude) * magnitude;
}

function extent(values: number[]) {
  return values.length ? [niceLimit(Math.min(...values)), niceLimit(Math.max(...values))] : [0, 0];
}

function actualPredictedChart(data: RegressionResults): EChartsOption {
  const points = data.multiple.actual_predicted;
  const [min, max] = extent(points.flatMap((point) => [point.actual, point.predicted, 0]));
  return {
    tooltip: { trigger: "item" },
    grid: { left: 8, right: 16, top: 28, bottom: 24 },
    xAxis: { type: "value", name: "Actual sales", nameLocation: "middle", nameGap: 26, min, max },
    yAxis: { type: "value", name: "Predicted sales", min, max },
    series: [
      { name: "Test rows", type: "scatter", data: points.map((point) => [point.actual, point.predicted]) },
      {
        name: "Perfect prediction",
        type: "line",
        data: [
          [min, min],
          [max, max],
        ],
        silent: true,
        lineStyle: { type: "dashed", color: "--muted", width: 1.5 },
      },
    ],
  };
}

function residualChart(data: RegressionResults): EChartsOption {
  const points = data.multiple.residuals;
  const [, residualMaxRaw] = extent(points.map((point) => Math.abs(point.residual)));
  const residualMax = Math.max(residualMaxRaw, 1);
  const [predictedMin, predictedMax] = extent(points.map((point) => point.predicted));
  return {
    tooltip: { trigger: "item" },
    grid: { left: 8, right: 16, top: 28, bottom: 24 },
    xAxis: {
      type: "value",
      name: "Predicted sales",
      nameLocation: "middle",
      nameGap: 26,
      min: Math.min(predictedMin, 0),
      max: predictedMax,
    },
    yAxis: { type: "value", name: "Residual", min: -residualMax, max: residualMax },
    series: [
      {
        name: "Residual",
        type: "scatter",
        data: points.map((point) => [point.predicted, point.residual]),
        itemStyle: { color: "--chart-5" },
      },
      {
        name: "Zero error",
        type: "line",
        data: [
          [Math.min(predictedMin, 0), 0],
          [predictedMax, 0],
        ],
        silent: true,
        lineStyle: { type: "dashed", color: "--muted", width: 1.5 },
      },
    ],
  };
}

function coefficientChart(rows: RegressionCoefficient[]): EChartsOption {
  const ordered = [...rows].reverse();
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value) => formatNumber(typeof value === "number" ? value : Number(value), 2),
    },
    grid: { left: 8, right: 16, top: 8, bottom: 8 },
    xAxis: { type: "value" },
    yAxis: {
      type: "category",
      data: ordered.map((row) => (row.feature.length > 30 ? `${row.feature.slice(0, 30)}…` : row.feature)),
      splitLine: { show: false },
    },
    series: [
      {
        name: "Coefficient",
        type: "bar",
        barMaxWidth: 16,
        data: ordered.map((row) => ({
          value: row.coefficient,
          itemStyle: {
            color: row.coefficient >= 0 ? "--chart-1" : "--chart-5",
            borderRadius: row.coefficient >= 0 ? [0, 3, 3, 0] : [3, 0, 0, 3],
          },
        })),
      },
    ],
  };
}
