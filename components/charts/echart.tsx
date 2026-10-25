"use client";

import { useEffect, useRef } from "react";
import type { ECharts, EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import { BarChart, HeatmapChart, LineChart, ScatterChart } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

const REGISTERED_COMPONENTS = [
  BarChart,
  HeatmapChart,
  LineChart,
  ScatterChart,
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
];

echarts.use(REGISTERED_COMPONENTS);

type EChartProps = {
  option: EChartsOption;
  height?: number;
  ariaLabel?: string;
  className?: string;
};

type AxisDefaults = Record<string, unknown>;

function readThemeColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function mergeNestedObject(
  defaults: Record<string, unknown> | undefined,
  source: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!defaults && !source) return undefined;
  return { ...(defaults ?? {}), ...(source ?? {}) };
}

function mergeAxis(axis: unknown, defaults: AxisDefaults): unknown {
  if (Array.isArray(axis)) {
    return axis.map((item) => mergeAxis(item, defaults));
  }

  if (typeof axis !== "object" || axis === null) {
    return defaults;
  }

  const source = axis as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...defaults, ...source };

  for (const key of ["axisLine", "axisLabel", "splitLine"] as const) {
    const defaultPart = defaults[key];
    const sourcePart = source[key];
    if (
      (typeof defaultPart === "object" && defaultPart !== null) ||
      (typeof sourcePart === "object" && sourcePart !== null)
    ) {
      const mergedPart = mergeNestedObject(
        defaultPart as Record<string, unknown> | undefined,
        sourcePart as Record<string, unknown> | undefined,
      );
      if (mergedPart) {
        mergedPart.lineStyle = mergeNestedObject(
          (defaultPart as Record<string, unknown> | undefined)?.lineStyle as
            | Record<string, unknown>
            | undefined,
          (sourcePart as Record<string, unknown> | undefined)?.lineStyle as
            | Record<string, unknown>
            | undefined,
        );
        merged[key] = mergedPart;
      }
    }
  }

  return merged;
}

function withXAxisDefaults(axis: EChartsOption["xAxis"], defaults: AxisDefaults): EChartsOption["xAxis"] {
  return mergeAxis(axis, defaults) as EChartsOption["xAxis"];
}

function withYAxisDefaults(axis: EChartsOption["yAxis"], defaults: AxisDefaults): EChartsOption["yAxis"] {
  return mergeAxis(axis, defaults) as EChartsOption["yAxis"];
}

function withGridDefaults(grid: EChartsOption["grid"]): EChartsOption["grid"] {
  if (Array.isArray(grid)) {
    return grid.map((item) =>
      mergeNestedObject({ containLabel: true }, item as Record<string, unknown> | undefined),
    ) as EChartsOption["grid"];
  }

  return mergeNestedObject(
    { containLabel: true },
    grid as Record<string, unknown> | undefined,
  ) as EChartsOption["grid"];
}

/** Replace CSS custom property names (e.g. "--chart-2") with their current values, so charts follow the theme. */
function resolveTokens<T>(value: T): T {
  if (typeof value === "string") {
    return (value.startsWith("--") ? readThemeColor(value, value) : value) as T;
  }
  if (Array.isArray(value)) return value.map((item) => resolveTokens(item)) as T;
  if (typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) result[key] = resolveTokens(item);
    return result as T;
  }
  return value;
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color;
  const [red, green, blue] = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function withSeriesDefaults(series: EChartsOption["series"], palette: string[]): EChartsOption["series"] {
  if (!series) return series;
  const list = Array.isArray(series) ? series : [series];
  const styled = list.map((item, index) => {
    if (!item || typeof item !== "object") return item;
    const source = item as Record<string, unknown>;
    const lineStyle = typeof source.lineStyle === "object" && source.lineStyle ? source.lineStyle : {};
    const itemStyle = typeof source.itemStyle === "object" && source.itemStyle ? source.itemStyle : {};

    if (source.type === "line") {
      const area = typeof source.areaStyle === "object" && source.areaStyle ? source.areaStyle : null;
      // An area without its own colour gets a soft "water" gradient in the line's colour.
      const baseColor = String((lineStyle as { color?: unknown }).color ?? palette[index % palette.length]);
      const areaStyle =
        area && !("color" in area)
          ? {
              ...area,
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: withAlpha(baseColor, 0.32) },
                { offset: 1, color: withAlpha(baseColor, 0.02) },
              ]),
            }
          : source.areaStyle;
      return {
        showSymbol: false,
        symbol: "circle",
        symbolSize: 6,
        smooth: 0.3,
        smoothMonotone: "x",
        ...source,
        areaStyle,
        lineStyle: { width: 2.5, cap: "round", ...lineStyle },
      };
    }
    if (source.type === "bar") {
      return {
        barMaxWidth: 40,
        ...source,
        itemStyle: { borderRadius: [6, 6, 0, 0], ...itemStyle },
      };
    }
    if (source.type === "scatter") {
      return { symbolSize: 6, ...source, itemStyle: { opacity: 0.6, ...itemStyle } };
    }
    return source;
  });

  return (Array.isArray(series) ? styled : styled[0]) as EChartsOption["series"];
}

function themedOption(option: EChartsOption, reducedMotion = false): EChartsOption {
  const resolved = resolveTokens(option);
  const foreground = readThemeColor("--foreground", "#111827");
  const muted = readThemeColor("--muted", "#4b5563");
  const gridLine = readThemeColor("--chart-grid", "#e5e7eb");
  const axisLine = readThemeColor("--border-strong", "#d1d5db");
  const defaultPalette = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"].map(
    (name) => readThemeColor(name, "#2563eb"),
  );
  const palette = resolved.color ?? defaultPalette;
  const colors = Array.isArray(palette) ? palette.map(String) : defaultPalette;
  const fontFamily =
    typeof window === "undefined"
      ? "ui-sans-serif, system-ui, sans-serif"
      : getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim() ||
        "ui-sans-serif, system-ui, sans-serif";

  return {
    ...resolved,
    animation: reducedMotion ? false : (resolved.animation ?? true),
    animationDuration: reducedMotion ? 0 : 900,
    animationEasing: "cubicOut",
    animationDurationUpdate: reducedMotion ? 0 : 300,
    textStyle: {
      fontFamily,
      color: foreground,
      fontSize: 12,
      ...(resolved.textStyle ?? {}),
    },
    aria: resolved.aria ?? { enabled: true, decal: { show: false } },
    color: colors,
    tooltip: {
      backgroundColor: readThemeColor("--tooltip-bg", "#111827"),
      borderWidth: 0,
      padding: [8, 12],
      extraCssText:
        "border-radius:12px; box-shadow:0 12px 30px -8px rgba(4,30,60,0.45); backdrop-filter:blur(8px);",
      textStyle: { color: readThemeColor("--tooltip-fg", "#f9fafb"), fontSize: 12, fontFamily },
      ...(typeof resolved.tooltip === "object" && resolved.tooltip ? resolved.tooltip : {}),
    },
    legend:
      resolved.legend === undefined
        ? resolved.legend
        : {
            textStyle: { color: muted, fontFamily, fontSize: 12 },
            itemGap: 16,
            icon: "roundRect",
            itemWidth: 12,
            itemHeight: 8,
            ...(typeof resolved.legend === "object" && resolved.legend ? resolved.legend : {}),
          },
    grid: withGridDefaults(resolved.grid),
    xAxis: withXAxisDefaults(resolved.xAxis, {
      axisLine: { lineStyle: { color: axisLine } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontSize: 11, fontFamily },
      nameTextStyle: { color: muted, fontFamily },
      splitLine: { lineStyle: { color: gridLine } },
    }),
    yAxis: withYAxisDefaults(resolved.yAxis, {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: muted, fontSize: 11, fontFamily },
      nameTextStyle: { color: muted, fontFamily },
      splitLine: { lineStyle: { color: gridLine } },
    }),
    series: withSeriesDefaults(resolved.series, colors),
  };
}

export function EChart({ option, height = 320, ariaLabel = "Analytical chart", className }: EChartProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const optionRef = useRef(option);

  useEffect(() => {
    optionRef.current = option;
    chartRef.current?.setOption(themedOption(option), true);
  }, [option]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const chart = echarts.init(element, undefined, { renderer: "canvas" });
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(element);

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreferences = () =>
      chart.setOption(themedOption(optionRef.current, reducedMotion.matches), true);
    colorScheme.addEventListener("change", applyPreferences);
    reducedMotion.addEventListener("change", applyPreferences);
    applyPreferences();

    return () => {
      colorScheme.removeEventListener("change", applyPreferences);
      reducedMotion.removeEventListener("change", applyPreferences);
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ width: "100%", height }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
