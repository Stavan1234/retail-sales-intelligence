export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function isFiniteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

export function formatCurrency(value: number | null | undefined, maximumFractionDigits = 0) {
  if (!isFiniteNumber(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

export function formatCompactCurrency(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, maximumFractionDigits = 0) {
  if (!isFiniteNumber(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (!isFiniteNumber(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatPercentPoints(value: number | null | undefined, digits = 1) {
  if (!isFiniteNumber(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** p-values below 0.001 are reported as "< 0.001", the usual convention in statistics reports. */
export function formatPValue(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return "—";
  if (value < 0.001) return "< 0.001";
  return value.toFixed(value < 0.01 ? 4 : 3);
}

/** Conventional strength labels for the absolute value of Pearson's r. */
export function correlationStrength(r: number) {
  const size = Math.abs(r);
  const strength = size < 0.1 ? "negligible" : size < 0.3 ? "weak" : size < 0.7 ? "moderate" : "strong";
  if (strength === "negligible") return strength;
  return `${strength} ${r > 0 ? "positive" : "negative"}`;
}
