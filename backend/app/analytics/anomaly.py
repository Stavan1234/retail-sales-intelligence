from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

FEATURES = ["Sales", "Quantity", "Discount", "Profit"]
FLAGGED_COLUMNS = [
    "Row ID",
    "Order ID",
    "Order Date",
    "Customer Name",
    "Product Name",
    "Category",
    "Region",
    "Segment",
    "Sales",
    "Quantity",
    "Discount",
    "Profit",
]


def _require_rows(frame: pd.DataFrame) -> None:
    if frame.empty:
        raise ValueError("At least one transaction is required for anomaly detection")
    if len(frame) < 5:
        raise ValueError("At least five transactions are recommended for stable anomaly detection")


def _iqr_mask(series: pd.Series) -> pd.Series:
    q1, q3 = series.quantile([0.25, 0.75])
    iqr = q3 - q1
    return (series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)


def _z_mask(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    standard_deviation = series.std(ddof=0)
    if standard_deviation == 0:
        return pd.Series(False, index=series.index)
    z = (series - series.mean()) / standard_deviation
    return z.abs() > threshold


def analyze(frame: pd.DataFrame) -> dict:
    _require_rows(frame)

    numeric = frame[FEATURES].apply(pd.to_numeric, errors="coerce")
    if numeric.isna().any().any() or not np.isfinite(numeric.to_numpy()).all():
        raise ValueError("Anomaly detection requires finite Sales, Quantity, Discount and Profit values")

    sales_iqr = _iqr_mask(numeric["Sales"])
    profit_iqr = _iqr_mask(numeric["Profit"])
    sales_z = _z_mask(numeric["Sales"])
    profit_z = _z_mask(numeric["Profit"])

    iso = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=42,
        n_jobs=-1,
    )
    labels = iso.fit_predict(numeric)
    scores = iso.score_samples(numeric)
    anomaly_mask = labels == -1

    rows = frame.loc[anomaly_mask, FLAGGED_COLUMNS].copy()
    rows["anomaly_score"] = scores[anomaly_mask]
    rows = rows.sort_values("anomaly_score", kind="mergesort").head(120)
    records = rows.to_dict(orient="records")

    for record in records:
        for key, value in list(record.items()):
            if isinstance(value, np.integer):
                record[key] = int(value)
            elif isinstance(value, np.floating):
                record[key] = float(value)
            elif isinstance(value, pd.Timestamp):
                record[key] = value.strftime("%Y-%m-%d")

    return {
        "methods": [
            {"method": "IQR", "metric": "Sales", "count": int(sales_iqr.sum())},
            {"method": "Z-score", "metric": "Sales", "count": int(sales_z.sum())},
            {"method": "IQR", "metric": "Profit", "count": int(profit_iqr.sum())},
            {"method": "Z-score", "metric": "Profit", "count": int(profit_z.sum())},
            {
                "method": "Isolation Forest",
                "metric": "Multivariate",
                "count": int(anomaly_mask.sum()),
            },
        ],
        "isolation_forest": {
            "normal": int((~anomaly_mask).sum()),
            "anomalies": int(anomaly_mask.sum()),
            "total": int(len(frame)),
        },
        "flagged_rows": records,
    }
