"""Phase 0 dataset verification for Retail Sales Intelligence.

Checks the frozen Excel workbook against the frozen processed CSV and the
Phase 0 baseline snapshot. The goal is to catch accidental dataset drift
before the analytics engine or UI is built.

Usage:
    python scripts/verify_data.py
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "data" / "source" / "sample_-_superstore.xlsx"
CSV = ROOT / "data" / "processed" / "superstore_processed.csv"
BASELINE = ROOT / "data" / "baseline.json"
SCHEMA = ROOT / "data" / "schema.json"

RAW_COLUMNS = [
    "Row ID",
    "Order ID",
    "Order Date",
    "Ship Date",
    "Ship Mode",
    "Customer ID",
    "Customer Name",
    "Segment",
    "Country/Region",
    "City",
    "State/Province",
    "Postal Code",
    "Region",
    "Product ID",
    "Category",
    "Sub-Category",
    "Product Name",
    "Sales",
    "Quantity",
    "Discount",
    "Profit",
]

DERIVED_COLUMNS = [
    "Year",
    "Month",
    "Month Name",
    "Quarter",
    "Day",
    "Day of Week",
    "Week",
    "Profit Margin",
    "Shipping Days",
    "Order Month",
]


class VerificationError(RuntimeError):
    """Raised when a Phase 0 invariant does not hold."""


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise VerificationError(message)


def comparable_series(series: pd.Series, dtype_kind: str) -> pd.Series:
    if dtype_kind == "date":
        return pd.to_datetime(series, errors="raise")
    if dtype_kind == "numeric":
        return pd.to_numeric(series, errors="raise")
    return series.astype("string")


def compare_series(a: pd.Series, b: pd.Series, kind: str) -> tuple[bool, float | None]:
    if kind == "numeric":
        aa = pd.to_numeric(a, errors="raise").to_numpy(dtype=float)
        bb = pd.to_numeric(b, errors="raise").to_numpy(dtype=float)
        diff = np.abs(aa - bb)
        max_diff = float(np.nanmax(diff)) if len(diff) else 0.0
        return bool(np.allclose(aa, bb, equal_nan=True, rtol=1e-12, atol=1e-10)), max_diff
    if kind == "date":
        aa = pd.to_datetime(a, errors="raise").to_numpy()
        bb = pd.to_datetime(b, errors="raise").to_numpy()
        return bool(np.array_equal(aa, bb)), None
    aa = a.astype("string").fillna("<NA>").to_numpy()
    bb = b.astype("string").fillna("<NA>").to_numpy()
    return bool(np.array_equal(aa, bb)), None


def main() -> int:
    baseline: dict[str, Any] = json.loads(BASELINE.read_text(encoding="utf-8"))

    require(XLSX.exists(), f"Missing source workbook: {XLSX}")
    require(CSV.exists(), f"Missing processed CSV: {CSV}")
    require(BASELINE.exists(), f"Missing baseline: {BASELINE}")
    require(SCHEMA.exists(), f"Missing schema: {SCHEMA}")

    orders = pd.read_excel(XLSX, sheet_name="Orders")
    returns = pd.read_excel(XLSX, sheet_name="Returns")
    people = pd.read_excel(XLSX, sheet_name="People")
    processed = pd.read_csv(CSV)

    require(list(orders.columns) == RAW_COLUMNS, "Orders column order/schema changed.")
    require(list(processed.columns) == RAW_COLUMNS + DERIVED_COLUMNS, "Processed column order/schema changed.")
    require(tuple(orders.shape) == tuple(baseline["dataset"]["orders_shape"]), "Orders shape changed.")
    require(tuple(processed.shape) == tuple(baseline["dataset"]["processed_shape"]), "Processed CSV shape changed.")
    require(len(returns) == baseline["dataset"]["returns_rows"], "Returns row count changed.")
    require(len(people) == baseline["dataset"]["people_rows"], "People row count changed.")

    require(orders.isna().sum().sum() == 0, "Orders contains unexpected missing values.")
    require(orders.duplicated().sum() == 0, "Orders contains unexpected duplicate rows.")
    require(processed.isna().sum().sum() == 0, "Processed CSV contains unexpected missing values.")
    require(processed.duplicated().sum() == 0, "Processed CSV contains unexpected duplicate rows.")

    # Key dataset metrics.
    distinct_orders = int(orders["Order ID"].nunique())
    distinct_customers = int(orders["Customer ID"].nunique())
    distinct_products = int(orders["Product ID"].nunique())
    sales_total = float(orders["Sales"].sum())
    profit_total = float(orders["Profit"].sum())
    quantity_total = int(orders["Quantity"].sum())
    order_dates = pd.to_datetime(orders["Order Date"], errors="raise")
    returns_unique = int(returns["Order ID"].nunique())

    require(distinct_orders == baseline["dataset"]["distinct_orders"], "Distinct-order count changed.")
    require(distinct_customers == baseline["dataset"]["distinct_customers"], "Distinct-customer count changed.")
    require(distinct_products == baseline["dataset"]["distinct_products"], "Distinct-product count changed.")
    require(np.isclose(sales_total, baseline["dataset"]["total_sales"], rtol=0, atol=1e-9), "Total sales changed.")
    require(np.isclose(profit_total, baseline["dataset"]["total_profit"], rtol=0, atol=1e-9), "Total profit changed.")
    require(quantity_total == baseline["dataset"]["total_quantity"], "Total quantity changed.")
    require(str(order_dates.min().date()) == baseline["dataset"]["order_date_min"], "Minimum order date changed.")
    require(str(order_dates.max().date()) == baseline["dataset"]["order_date_max"], "Maximum order date changed.")
    require(returns_unique == baseline["dataset"]["returns_unique_order_ids"], "Unique returned-order count changed.")

    # Returns must refer to real orders.
    order_ids = set(orders["Order ID"])
    missing_returns = sorted(set(returns["Order ID"]) - order_ids)
    require(not missing_returns, f"Returns contains unknown Order IDs: {missing_returns[:5]}")

    # People must map one-to-one to the four order regions.
    order_regions = sorted(orders["Region"].dropna().unique().tolist())
    people_regions = sorted(people["Region"].dropna().unique().tolist())
    require(order_regions == people_regions, "People sheet regions do not match Orders regions.")
    require(len(people["Region"]) == people["Region"].nunique(), "People sheet has duplicate region mappings.")

    # Recompute engineered features from raw Orders and compare row-by-row.
    work = orders.copy()
    work["Order Date"] = pd.to_datetime(work["Order Date"], errors="raise")
    work["Ship Date"] = pd.to_datetime(work["Ship Date"], errors="raise")
    work["Year"] = work["Order Date"].dt.year
    work["Month"] = work["Order Date"].dt.month
    work["Month Name"] = work["Order Date"].dt.month_name()
    work["Quarter"] = work["Order Date"].dt.quarter
    work["Day"] = work["Order Date"].dt.day
    work["Day of Week"] = work["Order Date"].dt.day_name()
    work["Week"] = work["Order Date"].dt.isocalendar().week.astype(int)
    work["Profit Margin"] = np.where(work["Sales"] != 0, work["Profit"] / work["Sales"] * 100, np.nan)
    work["Shipping Days"] = (work["Ship Date"] - work["Order Date"]).dt.days
    work["Order Month"] = work["Order Date"].dt.to_period("M").astype(str)

    kinds: dict[str, str] = {
        "Order Date": "date",
        "Ship Date": "date",
        "Row ID": "numeric",
        "Sales": "numeric",
        "Quantity": "numeric",
        "Discount": "numeric",
        "Profit": "numeric",
        "Year": "numeric",
        "Month": "numeric",
        "Quarter": "numeric",
        "Day": "numeric",
        "Week": "numeric",
        "Profit Margin": "numeric",
        "Shipping Days": "numeric",
    }

    for col in RAW_COLUMNS + DERIVED_COLUMNS:
        lhs = work[col]
        rhs = orders[col] if col in orders.columns else processed[col]
        if col in orders.columns:
            ok, max_diff = compare_series(lhs, rhs, kinds.get(col, "string"))
        else:
            ok, max_diff = compare_series(lhs, processed[col], kinds.get(col, "string"))
        require(ok, f"Feature/value mismatch in column '{col}'" + (f" (max diff {max_diff})" if max_diff is not None else ""))

    # Raw 21 columns in processed CSV must still equal the source workbook.
    for col in RAW_COLUMNS:
        ok, max_diff = compare_series(orders[col], processed[col], kinds.get(col, "string"))
        require(ok, f"Processed raw column drift in '{col}'" + (f" (max diff {max_diff})" if max_diff is not None else ""))

    print("PHASE 0 DATA VERIFICATION: PASS")
    print(f"Orders: {orders.shape[0]:,} rows × {orders.shape[1]} columns")
    print(f"Processed: {processed.shape[0]:,} rows × {processed.shape[1]} columns")
    print(f"Distinct orders/customers/products: {distinct_orders:,} / {distinct_customers:,} / {distinct_products:,}")
    print(f"Sales: ${sales_total:,.4f}")
    print(f"Profit: ${profit_total:,.4f}")
    print(f"Quantity: {quantity_total:,}")
    print(f"Date range: {order_dates.min().date()} → {order_dates.max().date()}")
    print(f"Returned order IDs: {returns_unique:,} ({returns_unique / distinct_orders:.4%})")
    print("Processed engineered columns: all 10 match recomputation exactly within floating-point tolerance.")
    print(f"Source SHA-256 (xlsx): {sha256(XLSX)}")
    print(f"Source SHA-256 (csv):  {sha256(CSV)}")
    print(f"Source SHA-256 (ipynb): {sha256(ROOT / 'notebooks' / 'ADS_Mini_Project.ipynb')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
