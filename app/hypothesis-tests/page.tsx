"use client";

import type { ReactNode } from "react";
import type { EChartsOption } from "echarts";
import { EChart } from "@/components/charts/echart";
import { PageIntro } from "@/components/layout/page-intro";
import { useDashboardFilters } from "@/components/providers/use-dashboard-filters";
import { useFilterActions } from "@/components/providers/use-filter-actions";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/card";
import { Callout, Takeaways } from "@/components/ui/explainer";
import { MetricGrid } from "@/components/ui/metric";
import { ErrorState, LoadingState, MessageState } from "@/components/ui/states";
import { useApiResource } from "@/lib/hooks";
import { formatCurrency, formatNumber, formatPValue } from "@/lib/utils";
import type { StatisticalTests } from "@/types/analytics";

export default function HypothesisTests() {
  const filters = useDashboardFilters();
  const { clearFilters, isPending } = useFilterActions();
  // The tests compare segments and categories, so filtering to one of them leaves nothing to compare.
  const blocked = Boolean(filters.segment || filters.category);
  const tests = useApiResource<StatisticalTests>("/api/tests", filters, !blocked);

  return (
    <main className="page-shell">
      <PageIntro />

      <Callout title="How to read a hypothesis test">
        Each test starts from a <strong>null hypothesis H₀</strong> that there is no difference or no
        association. The <strong>p-value</strong> is the probability of a result at least this extreme if H₀
        were true. If p &lt; α = 0.05 we <strong>reject H₀</strong>. Otherwise we{" "}
        <strong>fail to reject</strong> it, which is not the same as proving it. Rejecting a true H₀ is a{" "}
        <strong>Type I error</strong> (its probability is α). Failing to reject a false H₀ is a{" "}
        <strong>Type II error</strong>.
      </Callout>

      {blocked ? (
        <MessageState
          title="Clear the Segment and Category filters to run these tests"
          copy="The t-test compares customer segments, and ANOVA and chi-square compare product categories. With one segment or category selected there is nothing left to compare. Year and Region filters still work."
          action={
            <button
              type="button"
              className="button button-primary"
              disabled={isPending}
              onClick={() => clearFilters(["segment", "category"])}
            >
              Clear Segment and Category
            </button>
          }
        />
      ) : tests.loading ? (
        <LoadingState label="Running statistical tests" />
      ) : tests.error ? (
        <ErrorState title="The tests could not run for this scope" error={tests.error} />
      ) : tests.data ? (
        <TestsContent data={tests.data} />
      ) : null}
    </main>
  );
}

function significant(p: number, alpha: number) {
  return p < alpha;
}

function TestsContent({ data }: { data: StatisticalTests }) {
  const { confidence_interval: ci, welch, anova, chi_square: chi } = data;
  const welchSig = significant(welch.p_value, welch.alpha);
  const anovaSig = significant(anova.p_value, anova.alpha);
  const chiSig = significant(chi.p_value, chi.alpha);
  const differingPairs = data.tukey.filter((row) => row.reject);

  return (
    <>
      <SectionCard title="Results at a glance" subtitle="All tests use α = 0.05.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Test</th>
                <th scope="col">Question</th>
                <th scope="col">Statistic</th>
                <th scope="col">p-value</th>
                <th scope="col">Decision</th>
              </tr>
            </thead>
            <tbody>
              <SummaryRow
                test="Welch t-test"
                question={welch.question}
                statistic={`t = ${formatNumber(welch.t_statistic, 3)}`}
                p={welch.p_value}
                reject={welchSig}
              />
              <SummaryRow
                test="One-way ANOVA"
                question={anova.question}
                statistic={`F = ${formatNumber(anova.f_statistic, 3)}`}
                p={anova.p_value}
                reject={anovaSig}
              />
              <SummaryRow
                test="Chi-square"
                question={chi.question}
                statistic={`χ² = ${formatNumber(chi.chi_square, 3)}`}
                p={chi.p_value}
                reject={chiSig}
              />
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid-2">
        <SectionCard
          title="95% confidence interval for mean sales"
          subtitle={ci.question}
          howToRead="if we took many samples and built an interval like this from each, about 95% of those intervals would contain the true mean. The interval uses the t-distribution because the population standard deviation is unknown."
        >
          <div className="ci-result">
            {formatCurrency(ci.lower, 2)} <span>to</span> {formatCurrency(ci.upper, 2)}
          </div>
          <MetricGrid
            items={[
              { label: "Sample size n", value: formatNumber(ci.sample_size) },
              { label: "Sample mean", value: formatCurrency(ci.mean, 2) },
              { label: "Standard error", value: formatCurrency(ci.standard_error, 2), hint: "s ÷ √n" },
              {
                label: "Margin of error",
                value: `± ${formatCurrency(ci.margin_of_error, 2)}`,
                hint: "t × SE",
              },
            ]}
          />
        </SectionCard>

        <TestCard
          title="Welch two-sample t-test"
          question={welch.question}
          nullText={welch.null}
          alternative={welch.alternative}
          reject={welchSig}
          metrics={[
            { label: "t statistic", value: formatNumber(welch.t_statistic, 3) },
            { label: "Degrees of freedom", value: formatNumber(welch.df, 1) },
            { label: "p-value", value: formatPValue(welch.p_value) },
            {
              label: "Group means",
              value: `${formatCurrency(welch.mean_a)} vs ${formatCurrency(welch.mean_b)}`,
              hint: `${welch.group_a} (n = ${formatNumber(welch.n_a)}) vs ${welch.group_b} (n = ${formatNumber(welch.n_b)})`,
            },
          ]}
          conclusion={
            welchSig
              ? `Mean sales per order line differ between ${welch.group_a} and ${welch.group_b} customers.`
              : `There is no significant evidence that mean sales differ between ${welch.group_a} and ${welch.group_b} customers.`
          }
          note="Welch's version does not assume the two groups have equal variances."
        />
      </div>

      <div className="grid-2">
        <TestCard
          title="One-way ANOVA"
          question={anova.question}
          nullText={anova.null}
          alternative={anova.alternative}
          reject={anovaSig}
          metrics={[
            { label: "F statistic", value: formatNumber(anova.f_statistic, 3) },
            {
              label: "Degrees of freedom",
              value: `${formatNumber(anova.df_between)}, ${formatNumber(anova.df_within)}`,
              hint: "between, within",
            },
            { label: "p-value", value: formatPValue(anova.p_value) },
          ]}
          conclusion={
            anovaSig
              ? "At least one category has a different mean profit per order line."
              : "There is no significant evidence that mean profit differs between categories."
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">n</th>
                  <th scope="col">Mean profit</th>
                  <th scope="col">Std dev</th>
                </tr>
              </thead>
              <tbody>
                {anova.groups.map((group) => (
                  <tr key={group.Category}>
                    <th scope="row">{group.Category}</th>
                    <td>{formatNumber(group.count)}</td>
                    <td>{formatCurrency(group.mean_profit, 2)}</td>
                    <td>{formatCurrency(group.std_profit, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TestCard>

        <SectionCard
          title="Tukey HSD: which categories differ?"
          subtitle="Pairwise follow-up to ANOVA, with p-values adjusted for multiple comparisons."
          howToRead="a pair differs significantly when its adjusted p is below 0.05, which is the same as its 95% interval not containing 0."
        >
          <div className="table-wrap table-wrap-text">
            <table>
              <thead>
                <tr>
                  <th scope="col">Pair</th>
                  <th scope="col">Difference in mean profit (95% interval)</th>
                  <th scope="col">Adjusted p</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {data.tukey.map((row) => (
                  <tr key={`${row.group1}-${row.group2}`}>
                    <th scope="row">
                      {row.group2} − {row.group1}
                    </th>
                    <td>
                      <strong>{formatCurrency(row.mean_difference, 2)}</strong>
                      <span className="cell-detail">
                        {formatCurrency(row.lower, 2)} to {formatCurrency(row.upper, 2)}
                      </span>
                    </td>
                    <td>{formatPValue(row.p_adj)}</td>
                    <td>
                      <Badge tone={row.reject ? "positive" : "default"}>
                        {row.reject ? "Differs" : "Not significant"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="grid-2">
        <TestCard
          title="Chi-square test of independence"
          question={chi.question}
          nullText={chi.null}
          alternative={chi.alternative}
          reject={chiSig}
          metrics={[
            { label: "χ² statistic", value: formatNumber(chi.chi_square, 3) },
            { label: "Degrees of freedom", value: formatNumber(chi.df), hint: "(rows − 1)(columns − 1)" },
            { label: "p-value", value: formatPValue(chi.p_value) },
            {
              label: "Smallest expected count",
              value: formatNumber(chi.min_expected, 1),
              hint: chi.assumption_warning ? "below 5: interpret with care" : "≥ 5, so the test is valid",
            },
          ]}
          conclusion={
            chiSig
              ? "The mix of product categories bought depends on the customer segment."
              : "There is no significant evidence that the category mix depends on the customer segment."
          }
        />

        <SectionCard
          title="Observed counts: segment × category"
          subtitle="The contingency table used by the chi-square test."
          howToRead="each cell counts order lines. The test compares these counts with the counts expected if segment and category were independent."
        >
          <EChart
            height={280}
            ariaLabel="Observed segment by category counts"
            option={chiSquareChart(data)}
          />
        </SectionCard>
      </div>

      <Takeaways
        items={[
          {
            id: "welch",
            text: `${welchSig ? "Reject" : "Fail to reject"} H₀ for the t-test (p ${pText(welch.p_value)}): ${
              welchSig
                ? "the segments differ in mean sales."
                : "no evidence the two segments differ in mean sales."
            }`,
          },
          {
            id: "anova",
            text: `${anovaSig ? "Reject" : "Fail to reject"} H₀ for ANOVA (p ${pText(anova.p_value)})${
              differingPairs.length
                ? `. Tukey finds ${differingPairs.length} of ${data.tukey.length} category pairs differ in mean profit.`
                : "."
            }`,
          },
          {
            id: "chi",
            text: `${chiSig ? "Reject" : "Fail to reject"} H₀ for chi-square (p ${pText(chi.p_value)}): ${
              chiSig
                ? "segment and category are associated."
                : "no evidence that segment and category are associated."
            }`,
          },
          {
            id: "meaning",
            text: "Statistical significance says a difference is unlikely to be chance. It does not say how large or important the difference is.",
          },
        ]}
      />
    </>
  );
}

function pText(p: number) {
  const formatted = formatPValue(p);
  return formatted.startsWith("<") ? formatted : `= ${formatted}`;
}

function SummaryRow({
  test,
  question,
  statistic,
  p,
  reject,
}: {
  test: string;
  question: string;
  statistic: string;
  p: number;
  reject: boolean;
}) {
  return (
    <tr>
      <th scope="row">{test}</th>
      <td>{question}</td>
      <td>{statistic}</td>
      <td>{formatPValue(p)}</td>
      <td>
        <Badge tone={reject ? "positive" : "default"}>{reject ? "Reject H₀" : "Fail to reject H₀"}</Badge>
      </td>
    </tr>
  );
}

function TestCard({
  title,
  question,
  nullText,
  alternative,
  reject,
  metrics,
  conclusion,
  note,
  children,
}: {
  title: string;
  question: string;
  nullText: string;
  alternative: string;
  reject: boolean;
  metrics: Array<{ label: string; value: string; hint?: string }>;
  conclusion: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <SectionCard
      title={title}
      subtitle={question}
      action={
        <Badge tone={reject ? "positive" : "default"}>{reject ? "Reject H₀" : "Fail to reject H₀"}</Badge>
      }
    >
      <dl className="hypothesis">
        <div>
          <dt>H₀</dt>
          <dd>{nullText}</dd>
        </div>
        <div>
          <dt>H₁</dt>
          <dd>{alternative}</dd>
        </div>
      </dl>
      <MetricGrid items={metrics} />
      {children}
      <p className="conclusion">
        <strong>Conclusion:</strong> {conclusion}
      </p>
      {note && <p className="formula-note">{note}</p>}
    </SectionCard>
  );
}

function chiSquareChart(data: StatisticalTests): EChartsOption {
  const { observed, labels_row: rows, labels_col: columns } = data.chi_square;
  const points: [number, number, number][] = [];
  for (let row = 0; row < observed.length; row += 1) {
    for (let column = 0; column < observed[row].length; column += 1) {
      points.push([column, row, observed[row][column]]);
    }
  }

  return {
    tooltip: {
      position: "top",
      formatter: (params) => {
        if (Array.isArray(params) || !Array.isArray(params.value)) return "";
        const [column, row, value] = params.value as [number, number, number];
        return `${rows[row] ?? ""} · ${columns[column] ?? ""}: ${formatNumber(value)} order lines`;
      },
    },
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: "category", data: columns, splitLine: { show: false } },
    yAxis: { type: "category", inverse: true, data: rows, splitLine: { show: false } },
    visualMap: {
      show: false,
      min: 0,
      max: Math.max(...observed.flat(), 1),
      inRange: { color: ["--heat-mid", "--heat-high"] },
    },
    series: [
      {
        type: "heatmap",
        data: points,
        label: { show: true, color: "--foreground" },
        itemStyle: { borderColor: "--surface", borderWidth: 2 },
      },
    ],
  };
}
