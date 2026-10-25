from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from . import anomaly, descriptive, forecasting, inferential, regression
from .preprocessing import DatasetPaths, data_quality, filter_frame, filter_options, load_orders


@dataclass
class AnalyticsEngine:
    frame: pd.DataFrame
    paths: DatasetPaths

    @classmethod
    def from_paths(cls, workbook: str | Path, processed_csv: str | Path) -> "AnalyticsEngine":
        workbook_path = Path(workbook)
        processed_path = Path(processed_csv)
        frame = load_orders(workbook_path)
        return cls(
            frame=frame,
            paths=DatasetPaths(workbook=workbook_path, processed_csv=processed_path),
        )

    def filtered(self, **filters: object) -> pd.DataFrame:
        return filter_frame(self.frame, **filters)

    def overview(self, **filters: object) -> dict:
        frame = self.filtered(**filters)
        return {
            **descriptive.overview(frame),
            "monthly": descriptive.monthly_sales(frame),
            "category": descriptive.group_summary(frame, "Category"),
            "region": descriptive.group_summary(frame, "Region"),
        }

    def quality(self, **filters: object) -> dict:
        return data_quality(self.filtered(**filters))

    def explore(self, **filters: object) -> dict:
        frame = self.filtered(**filters)
        return {
            "descriptive": descriptive.descriptive_stats(frame),
            "category": descriptive.group_summary(frame, "Category"),
            "region": descriptive.group_summary(frame, "Region"),
            "segment": descriptive.group_summary(frame, "Segment"),
            "monthly": descriptive.monthly_sales(frame),
            "yearly": descriptive.yearly_sales(frame),
            "quarterly": descriptive.quarterly_sales(frame),
            "correlation": descriptive.correlation(frame),
            "distributions": {
                column: descriptive.distributions(frame, column)
                for column in ["Sales", "Profit", "Quantity", "Discount"]
            },
            "scatters": {
                "sales_profit": descriptive.scatter(frame, "Sales", "Profit"),
                "discount_profit": descriptive.scatter(frame, "Discount", "Profit"),
                "quantity_sales": descriptive.scatter(frame, "Quantity", "Sales"),
            },
        }

    def tests(self, **filters: object) -> dict:
        frame = self.filtered(**filters)
        return {
            "confidence_interval": inferential.confidence_interval(frame),
            "welch": inferential.welch_test(frame),
            "anova": inferential.anova(frame),
            "tukey": inferential.tukey(frame),
            "chi_square": inferential.chi_square(frame),
        }

    def regression(self, **filters: object) -> dict:
        frame = self.filtered(**filters)
        return {
            "simple": regression.simple(frame),
            "multiple": regression.multiple(frame),
        }

    def anomalies(self, **filters: object) -> dict:
        return anomaly.analyze(self.filtered(**filters))

    def forecast(self, **filters: object) -> dict:
        return forecasting.forecast(self.filtered(**filters))

    def filters(self) -> dict:
        return filter_options(self.frame)

    def rows(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        sort_by: str = "Order Date",
        sort_dir: str = "desc",
        **filters: object,
    ) -> dict:
        frame = self.filtered(**filters)
        if search:
            term = search.strip().lower()
            if term:
                searchable = [
                    "Order ID",
                    "Customer Name",
                    "Product Name",
                    "Category",
                    "Region",
                    "Segment",
                ]
                mask = (
                    frame[searchable]
                    .astype(str)
                    .apply(lambda column: column.str.lower().str.contains(term, regex=False))
                    .any(axis=1)
                )
                frame = frame[mask]

        allowed = [
            column
            for column in [
                "Order Date",
                "Sales",
                "Profit",
                "Quantity",
                "Discount",
                "Category",
                "Region",
                "Segment",
            ]
            if column in frame.columns
        ]
        if sort_by not in allowed:
            sort_by = "Order Date"

        ascending = sort_dir.lower() == "asc"
        frame = frame.sort_values(sort_by, ascending=ascending, kind="mergesort")
        total = len(frame)
        pages = max(1, (total + page_size - 1) // page_size)
        current_page = max(1, min(page, pages))
        start = (current_page - 1) * page_size
        part = frame.iloc[start : start + page_size]

        columns = [
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
        rows_frame = part[columns].copy()
        rows_frame["Order Date"] = rows_frame["Order Date"].dt.strftime("%Y-%m-%d")

        return {
            "page": current_page,
            "page_size": page_size,
            "total": total,
            "pages": pages,
            "sort_by": sort_by,
            "sort_dir": sort_dir,
            "rows": rows_frame.to_dict(orient="records"),
        }
