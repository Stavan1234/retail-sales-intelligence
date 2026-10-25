export type Filters = {
  year?: string;
  region?: string;
  category?: string;
  segment?: string;
  start_date?: string;
  end_date?: string;
};

export type FilterOptions = {
  years: number[];
  regions: string[];
  categories: string[];
  segments: string[];
  date_min: string;
  date_max: string;
};

export type GroupSummary = {
  sales: number;
  profit: number;
  quantity: number;
  orders: number;
  margin: number;
};

export type CategorySummary = GroupSummary & { Category: string };
export type RegionSummary = GroupSummary & { Region: string };
export type SegmentSummary = GroupSummary & { Segment: string };

export type Overview = {
  rows: number;
  orders: number;
  customers: number;
  products: number;
  sales: number;
  profit: number;
  quantity: number;
  profit_margin: number | null;
  date_min: string | null;
  date_max: string | null;
  monthly: Array<{ period: string; sales: number }>;
  category: CategorySummary[];
  region: RegionSummary[];
};

export type DataQuality = {
  rows: number;
  columns: number;
  missing_values: number;
  duplicate_rows: number;
  date_min: string | null;
  date_max: string | null;
  numeric_columns: number;
  categorical_columns: number;
  datetime_columns: number;
  dtype_counts: Record<string, number>;
  invalid_ranges: Record<string, number>;
};

export type DescriptiveRow = {
  variable: string;
  count: number;
  mean: number;
  median: number;
  mode: number | null;
  std: number | null;
  variance: number | null;
  min: number;
  q1: number;
  q3: number;
  max: number;
  iqr: number;
  skewness: number | null;
  kurtosis: number | null;
};

export type Distribution = {
  column: string;
  bins: number[];
  counts: number[];
  n: number;
};

export type ScatterPoint = { x: number; y: number };
export type ScatterSeries = {
  x: string;
  y: string;
  total: number;
  sampled: number;
  points: ScatterPoint[];
};

export type CorrelationMatrix = {
  labels: string[];
  matrix: Array<Array<number | null>>;
};

export type ExploreData = {
  descriptive: DescriptiveRow[];
  category: CategorySummary[];
  region: RegionSummary[];
  segment: SegmentSummary[];
  correlation: CorrelationMatrix;
  distributions: Record<"Sales" | "Profit" | "Quantity" | "Discount", Distribution>;
  scatters: Record<"sales_profit" | "discount_profit" | "quantity_sales", ScatterSeries>;
};

export type TransactionRow = {
  "Row ID": number;
  "Order ID": string;
  "Order Date": string;
  "Customer Name": string;
  "Product Name": string;
  Category: string;
  Region: string;
  Segment: string;
  Sales: number;
  Quantity: number;
  Discount: number;
  Profit: number;
};

export type TransactionSortKey =
  | "Order Date"
  | "Sales"
  | "Profit"
  | "Quantity"
  | "Discount"
  | "Category"
  | "Region"
  | "Segment";

export type TransactionResponse = {
  page: number;
  page_size: number;
  total: number;
  pages: number;
  sort_by: TransactionSortKey;
  sort_dir: "asc" | "desc";
  rows: TransactionRow[];
};

export type ConfidenceInterval = {
  question: string;
  sample_size: number;
  mean: number;
  standard_error: number;
  confidence: number;
  margin_of_error: number | null;
  lower: number | null;
  upper: number | null;
};

export type WelchTest = {
  question: string;
  null: string;
  alternative: string;
  alpha: number;
  group_a: string;
  group_b: string;
  n_a: number;
  n_b: number;
  mean_a: number;
  mean_b: number;
  std_a: number;
  std_b: number;
  t_statistic: number;
  p_value: number;
  df: number;
  decision: string;
};

export type AnovaGroup = {
  Category: string;
  count: number;
  mean_profit: number;
  std_profit: number;
};

export type Anova = {
  question: string;
  null: string;
  alternative: string;
  alpha: number;
  f_statistic: number;
  p_value: number;
  df_between: number;
  df_within: number;
  groups: AnovaGroup[];
  decision: string;
};

export type TukeyRow = {
  group1: string;
  group2: string;
  mean_difference: number;
  p_adj: number;
  lower: number;
  upper: number;
  reject: boolean;
};

export type ChiSquare = {
  question: string;
  null: string;
  alternative: string;
  alpha: number;
  chi_square: number;
  p_value: number;
  df: number;
  labels_row: string[];
  labels_col: string[];
  observed: number[][];
  expected: number[][];
  min_expected: number;
  assumption_warning: boolean;
  decision: string;
};

export type StatisticalTests = {
  confidence_interval: ConfidenceInterval;
  welch: WelchTest;
  anova: Anova;
  tukey: TukeyRow[];
  chi_square: ChiSquare;
};

export type RegressionMetrics = {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
};

export type RegressionPoint = {
  actual: number;
  predicted: number;
};

export type ResidualPoint = {
  predicted: number;
  residual: number;
};

export type RegressionCoefficient = {
  feature: string;
  coefficient: number;
};

export type CrossValidationFold = {
  fold: number;
  r2: number;
  mae: number;
  rmse: number;
};

export type CrossValidation = {
  folds: CrossValidationFold[];
  mean_r2: number;
  std_r2: number;
  mean_mae: number;
  mean_rmse: number;
};

export type SimpleRegression = {
  name: string;
  kind: "simple";
  features: ["Quantity"];
  intercept: number;
  coefficients: [{ feature: "Quantity"; coefficient: number }];
  metrics: RegressionMetrics;
  train_samples: number;
  test_samples: number;
  actual_predicted: RegressionPoint[];
  residuals: ResidualPoint[];
  cv: null;
};

export type MultipleRegression = {
  name: string;
  kind: "multiple";
  features: string[];
  metrics: RegressionMetrics;
  train_samples: number;
  test_samples: number;
  encoded_feature_count: number;
  coefficients: RegressionCoefficient[];
  actual_predicted: RegressionPoint[];
  residuals: ResidualPoint[];
  cv: CrossValidation;
};

export type RegressionResults = {
  simple: SimpleRegression;
  multiple: MultipleRegression;
};

export type AnomalyMethod = {
  method: "IQR" | "Z-score" | "Isolation Forest";
  metric: string;
  count: number;
};

export type FlaggedTransaction = TransactionRow & {
  anomaly_score: number;
};

export type AnomalyResults = {
  methods: AnomalyMethod[];
  isolation_forest: {
    normal: number;
    anomalies: number;
    total: number;
  };
  flagged_rows: FlaggedTransaction[];
};

export type ForecastHistoryPoint = {
  period: string;
  sales: number;
};

export type ForecastPoint = {
  period: string;
  forecast: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
};

export type ForecastModelResult = {
  damped: boolean;
  seasonal: "add" | "mul";
  mae: number;
  rmse: number;
  smape: number;
};

export type ForecastResults = {
  history: ForecastHistoryPoint[];
  rolling_3m: Array<{ period: string; value: number }>;
  validation: {
    selected: ForecastModelResult;
    models: ForecastModelResult[];
    seasonal_naive: {
      mae: number;
      rmse: number;
      smape: number;
    };
  };
  forecast: ForecastPoint[];
  model: string;
  uncertainty_method: string;
  direction: "upward" | "stable/downward";
};
