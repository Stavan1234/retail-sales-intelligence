from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import numpy as np
import pandas as pd

RAW_COLUMNS = [
    "Row ID", "Order ID", "Order Date", "Ship Date", "Ship Mode",
    "Customer ID", "Customer Name", "Segment", "Country/Region", "City",
    "State/Province", "Postal Code", "Region", "Product ID", "Category",
    "Sub-Category", "Product Name", "Sales", "Quantity", "Discount", "Profit",
]
ENGINEERED_COLUMNS = [
    "Year", "Month", "Month Name", "Quarter", "Day", "Day of Week",
    "Week", "Profit Margin", "Shipping Days", "Order Month",
]


@dataclass(frozen=True)
class DatasetPaths:
    workbook: Path
    processed_csv: Path


def load_orders(workbook: str | Path) -> pd.DataFrame:
    path = Path(workbook)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    frame = pd.read_excel(path, sheet_name="Orders")
    validate_raw_schema(frame)
    return feature_engineer(frame.copy())


def validate_raw_schema(frame: pd.DataFrame) -> None:
    missing = [c for c in RAW_COLUMNS if c not in frame.columns]
    if missing:
        raise ValueError(f"Orders sheet is missing required columns: {missing}")


def feature_engineer(frame: pd.DataFrame) -> pd.DataFrame:
    frame["Order Date"] = pd.to_datetime(frame["Order Date"], errors="coerce")
    frame["Ship Date"] = pd.to_datetime(frame["Ship Date"], errors="coerce")
    if frame[["Order Date", "Ship Date"]].isna().any().any():
        raise ValueError("Order Date / Ship Date contains invalid dates")

    frame["Year"] = frame["Order Date"].dt.year.astype(int)
    frame["Month"] = frame["Order Date"].dt.month.astype(int)
    frame["Month Name"] = frame["Order Date"].dt.month_name()
    frame["Quarter"] = frame["Order Date"].dt.quarter.astype(int)
    frame["Day"] = frame["Order Date"].dt.day.astype(int)
    frame["Day of Week"] = frame["Order Date"].dt.day_name()
    frame["Week"] = frame["Order Date"].dt.isocalendar().week.astype(int)
    frame["Profit Margin"] = np.where(
        frame["Sales"] != 0,
        (frame["Profit"] / frame["Sales"]) * 100,
        0,
    )
    frame["Shipping Days"] = (frame["Ship Date"] - frame["Order Date"]).dt.days.astype(int)
    frame["Order Month"] = frame["Order Date"].dt.to_period("M").astype(str)
    return frame


def filter_frame(
    frame: pd.DataFrame,
    *,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> pd.DataFrame:
    result = frame
    if year is not None:
        result = result[result["Year"] == year]
    if region:
        result = result[result["Region"] == region]
    if category:
        result = result[result["Category"] == category]
    if segment:
        result = result[result["Segment"] == segment]
    if start_date:
        result = result[result["Order Date"] >= pd.Timestamp(start_date)]
    if end_date:
        # Date filters represent whole calendar days, not a midnight instant.
        end_exclusive = pd.Timestamp(end_date) + pd.Timedelta(days=1)
        result = result[result["Order Date"] < end_exclusive]
    return result.copy()


def data_quality(frame: pd.DataFrame) -> dict:
    numeric_cols = frame.select_dtypes(include=np.number).columns.tolist()
    datetime_cols = frame.select_dtypes(include=["datetime64[ns]"]).columns.tolist()
    categorical_cols = [
        column
        for column, dtype in frame.dtypes.items()
        if pd.api.types.is_string_dtype(dtype) or isinstance(dtype, pd.CategoricalDtype)
    ]
    type_counts: dict[str, int] = {}
    for dtype in frame.dtypes:
        type_counts[str(dtype)] = type_counts.get(str(dtype), 0) + 1
    invalid_ranges: dict[str, int] = {
        "negative_quantity": int((frame["Quantity"] < 0).sum()),
        "discount_out_of_range": int(((frame["Discount"] < 0) | (frame["Discount"] > 1)).sum()),
        "invalid_shipping_days": int((frame["Shipping Days"] < 0).sum()),
        "nonfinite_numeric": int((~np.isfinite(frame[numeric_cols].to_numpy())).sum()),
    }
    return {
        "rows": int(len(frame)),
        "columns": int(len(frame.columns)),
        "missing_values": int(frame.isna().sum().sum()),
        "duplicate_rows": int(frame.duplicated().sum()),
        "date_min": frame["Order Date"].min().date().isoformat() if len(frame) else None,
        "date_max": frame["Order Date"].max().date().isoformat() if len(frame) else None,
        "numeric_columns": len(numeric_cols),
        "categorical_columns": len(categorical_cols),
        "datetime_columns": len(datetime_cols),
        "dtype_counts": type_counts,
        "invalid_ranges": invalid_ranges,
    }


def filter_options(frame: pd.DataFrame) -> dict:
    return {
        "years": sorted(frame["Year"].dropna().astype(int).unique().tolist()),
        "regions": sorted(frame["Region"].dropna().astype(str).unique().tolist()),
        "categories": sorted(frame["Category"].dropna().astype(str).unique().tolist()),
        "segments": sorted(frame["Segment"].dropna().astype(str).unique().tolist()),
        "date_min": frame["Order Date"].min().date().isoformat(),
        "date_max": frame["Order Date"].max().date().isoformat(),
    }
