import pandas as pd
from fastapi.testclient import TestClient

from backend.app.analytics.descriptive import descriptive_stats, group_summary
from backend.app.analytics.forecasting import forecast
from backend.app.analytics.preprocessing import load_orders
from backend.app.main import app


def test_api_smoke_and_truth() -> None:
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        health_body = health.json()
        assert health_body["service"] == "retail-sales-intelligence"
        assert health_body["rows"] == 10_194

        overview = client.get("/api/overview").json()
        assert round(overview["sales"], 4) == 2_326_534.3543
        assert overview["orders"] == 5_111
        assert round(overview["profit_margin"], 9) == round(292_296.8146 / 2_326_534.3543, 9)

        filters = client.get("/api/filters").json()
        assert filters["regions"] == ["Central", "East", "South", "West"]

        quality = client.get("/api/data-quality").json()
        assert quality["missing_values"] == 0
        assert quality["duplicate_rows"] == 0
        assert all(value == 0 for value in quality["invalid_ranges"].values())

        explore = client.get("/api/explore").json()
        assert len(explore["monthly"]) == 48
        assert set(explore["distributions"]) == {"Sales", "Profit", "Quantity", "Discount"}
        margin_row = next(row for row in explore["descriptive"] if row["variable"] == "Profit Margin")
        assert 12.0 < margin_row["mean"] < 12.5

        tests = client.get("/api/tests").json()
        assert round(tests["welch"]["p_value"], 6) == 0.457606
        assert round(tests["chi_square"]["p_value"], 6) == 0.770084

        regression = client.get("/api/regression").json()
        assert round(regression["multiple"]["metrics"]["r2"], 4) == 0.2281

        anomalies = client.get("/api/anomalies").json()
        assert anomalies["isolation_forest"]["anomalies"] == 1_610

        forecast_response = client.get("/api/forecast")
        assert forecast_response.status_code == 200
        forecast_body = forecast_response.json()
        assert [row["period"] for row in forecast_body["forecast"]] == [
            "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"
        ]
        assert forecast_body["validation"]["selected"]["mae"] < forecast_body["validation"]["seasonal_naive"]["mae"]
        assert forecast_body["validation"]["selected"]["rmse"] < forecast_body["validation"]["seasonal_naive"]["rmse"]
        assert forecast_body["uncertainty_method"] == "State-space simulation with bootstrap errors"
        for row in forecast_body["forecast"]:
            assert row["lower95"] <= row["lower80"] <= row["forecast"] <= row["upper80"] <= row["upper95"]

        rows = client.get("/api/data?page=1&page_size=10&sort_by=Sales&sort_dir=desc").json()
        assert rows["page"] == 1
        assert len(rows["rows"]) == 10
        assert rows["rows"][0]["Sales"] >= rows["rows"][1]["Sales"]


def test_filtering_and_boundaries() -> None:
    with TestClient(app) as client:
        response = client.get("/api/overview?year=2026")
        assert response.status_code == 200
        body = response.json()
        assert body["date_min"].startswith("2026-")
        assert body["date_max"].startswith("2026-")

        empty = client.get("/api/data?search=definitely-no-match")
        assert empty.status_code == 200
        assert empty.json()["total"] == 0
        assert empty.json()["pages"] == 1

        invalid_sort = client.get("/api/data?sort_by=not-a-column")
        assert invalid_sort.status_code == 422

        forecast = client.get("/api/forecast?year=2026")
        assert forecast.status_code == 422
        assert "24 monthly observations" in forecast.json()["detail"]


def test_end_date_includes_the_full_calendar_day() -> None:
    with TestClient(app) as client:
        response = client.get("/api/overview?start_date=2026-12-30&end_date=2026-12-30")
        assert response.status_code == 200
        body = response.json()
        assert body["rows"] > 0
        assert body["date_min"] == "2026-12-30"
        assert body["date_max"] == "2026-12-30"


def test_invalid_date_window() -> None:
    with TestClient(app) as client:
        response = client.get("/api/overview?start_date=2026-12-30&end_date=2026-01-01")
        assert response.status_code == 422


def test_single_row_descriptive_statistics_are_json_safe() -> None:
    frame = pd.DataFrame(
        {
            "Sales": [100.0],
            "Profit": [20.0],
            "Quantity": [2],
            "Discount": [0.1],
            "Profit Margin": [20.0],
            "Shipping Days": [2],
        }
    )
    rows = descriptive_stats(frame)
    assert len(rows) == 6
    assert all(row["std"] is None for row in rows)
    assert all(row["variance"] is None for row in rows)


def test_constant_data_statistics_are_json_safe() -> None:
    frame = pd.DataFrame(
        {
            "Sales": [100.0, 100.0, 100.0, 100.0],
            "Profit": [10.0, 10.0, 10.0, 10.0],
            "Quantity": [2, 2, 2, 2],
            "Discount": [0.1, 0.1, 0.1, 0.1],
            "Profit Margin": [10.0, 10.0, 10.0, 10.0],
            "Shipping Days": [2, 2, 2, 2],
        }
    )
    rows = descriptive_stats(frame)
    assert all(row["skewness"] is None for row in rows)
    assert all(row["kurtosis"] is None for row in rows)


def test_group_margin_is_aggregate_profit_over_sales() -> None:
    frame = pd.DataFrame(
        {
            "Category": ["A", "A"],
            "Order ID": ["O1", "O2"],
            "Sales": [10.0, 90.0],
            "Profit": [1.0, 45.0],
            "Quantity": [1, 1],
        }
    )
    row = group_summary(frame, "Category")[0]
    assert row["margin"] == 46.0


def test_forecast_is_deterministic_for_fixed_seed_and_contract() -> None:
    frame = load_orders("data/source/sample_-_superstore.xlsx")
    first = forecast(frame)
    second = forecast(frame)
    assert first["forecast"] == second["forecast"]
    assert first["validation"]["selected"] == second["validation"]["selected"]
