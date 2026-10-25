from __future__ import annotations

import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing


FORECAST_MODEL_NAME = "Holt-Winters Exponential Smoothing"
SEASONAL_PERIODS = 12
VALIDATION_MONTHS = 12
SIMULATION_REPETITIONS = 2000
SIMULATION_SEED = 42


def monthly_series(frame: pd.DataFrame) -> pd.Series:
    """Aggregate transaction sales to a complete month-start series."""
    if frame.empty:
        raise ValueError("At least one transaction is required for forecasting")
    series = frame.set_index("Order Date")["Sales"].resample("MS").sum().sort_index()
    return series.asfreq("MS", fill_value=0.0).astype(float)


def _fit(train: pd.Series, damped: bool = False, seasonal: str = "add"):
    return ExponentialSmoothing(
        train,
        trend="add",
        damped_trend=damped,
        seasonal=seasonal,
        seasonal_periods=SEASONAL_PERIODS,
        initialization_method="estimated",
    ).fit(optimized=True)


def _seasonal_naive(train: pd.Series, horizon: int) -> pd.Series:
    values = train.iloc[-SEASONAL_PERIODS:].to_numpy(dtype=float)
    future_index = pd.date_range(
        train.index[-1] + pd.offsets.MonthBegin(1),
        periods=horizon,
        freq="MS",
    )
    repeats = np.resize(values, horizon)
    return pd.Series(repeats, index=future_index)


def _metrics(actual: pd.Series, predicted: pd.Series) -> dict[str, float]:
    actual_values = actual.to_numpy(dtype=float)
    predicted_values = predicted.to_numpy(dtype=float)
    error = actual_values - predicted_values
    mae = float(np.mean(np.abs(error)))
    rmse = float(np.sqrt(np.mean(error**2)))
    smape = float(
        np.mean(
            2 * np.abs(error) / (np.abs(actual_values) + np.abs(predicted_values) + 1e-12)
        )
        * 100
    )
    return {"mae": mae, "rmse": rmse, "smape": smape}


def _simulate_intervals(results, horizon: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Generate deterministic bootstrap state-space forecast intervals.

    statsmodels 0.15 exposes state-space simulation with bootstrap errors.
    An explicit error matrix is used here so the intervals are deterministic
    across repeated requests and do not depend on global RNG state.
    """
    residuals = np.asarray(results.resid.dropna(), dtype=float)
    if residuals.size == 0:
        raise ValueError("Forecast uncertainty cannot be estimated without fitted residuals")

    rng = np.random.default_rng(SIMULATION_SEED)
    random_errors = rng.choice(
        residuals,
        size=(horizon, SIMULATION_REPETITIONS),
        replace=True,
    )

    # Explicit random_errors makes the simulation deterministic across repeated
    # requests. statsmodels 0.15 accepts this ndarray directly; the older API
    # also supports an error matrix of shape (nsimulations, repetitions).
    simulations = results.simulate(
        horizon,
        anchor="end",
        repetitions=SIMULATION_REPETITIONS,
        error="add",
        random_errors=random_errors,
    )

    if isinstance(simulations, pd.DataFrame):
        values = simulations.to_numpy(dtype=float)
    elif isinstance(simulations, pd.Series):
        values = simulations.to_numpy(dtype=float).reshape(horizon, 1)
    else:
        values = np.asarray(simulations, dtype=float)
        if values.ndim == 1:
            values = values.reshape(horizon, 1)

    if values.shape[0] != horizon:
        raise ValueError("Forecast simulation returned an unexpected horizon")
    if not np.isfinite(values).all():
        raise ValueError("Forecast simulation produced non-finite uncertainty values")

    lower95, upper95 = np.quantile(values, [0.025, 0.975], axis=1)
    lower80, upper80 = np.quantile(values, [0.10, 0.90], axis=1)
    return lower80, upper80, lower95, upper95


def forecast(frame: pd.DataFrame, horizon: int = 6) -> dict:
    if horizon < 1 or horizon > 24:
        raise ValueError("Forecast horizon must be between 1 and 24 months")

    series = monthly_series(frame)
    if len(series) < SEASONAL_PERIODS * 2:
        raise ValueError(
            f"At least {SEASONAL_PERIODS * 2} monthly observations are required for seasonal forecasting"
        )

    train = series.iloc[:-VALIDATION_MONTHS]
    validation = series.iloc[-VALIDATION_MONTHS:]
    configs = [
        (False, "add"),
        (True, "add"),
        (False, "mul"),
        (True, "mul"),
    ]
    candidates: list[dict[str, float | bool | str]] = []

    for damped, seasonal in configs:
        try:
            model = _fit(train, damped=damped, seasonal=seasonal)
            predicted = pd.Series(model.forecast(len(validation)), index=validation.index)
            metrics = _metrics(validation, predicted)
            candidates.append(
                {
                    "damped": damped,
                    "seasonal": seasonal,
                    **metrics,
                }
            )
        except (ValueError, FloatingPointError, np.linalg.LinAlgError):
            continue

    if not candidates:
        raise ValueError("Unable to fit a seasonal Holt-Winters model")

    candidates.sort(key=lambda item: (float(item["mae"]), float(item["rmse"])))
    best = candidates[0]

    selected = _fit(
        series,
        damped=bool(best["damped"]),
        seasonal=str(best["seasonal"]),
    )
    point = pd.Series(
        selected.forecast(horizon),
        index=pd.date_range(
            series.index[-1] + pd.offsets.MonthBegin(1),
            periods=horizon,
            freq="MS",
        ),
        dtype=float,
    )
    if not np.isfinite(point.to_numpy()).all():
        raise ValueError("Forecast model produced non-finite point forecasts")

    lower80, upper80, lower95, upper95 = _simulate_intervals(selected, horizon)
    display_point = np.maximum(point.to_numpy(dtype=float), 0.0)
    display_lower80 = np.maximum(lower80, 0.0)
    display_upper80 = np.maximum(upper80, 0.0)
    display_lower95 = np.maximum(lower95, 0.0)
    display_upper95 = np.maximum(upper95, 0.0)

    if not (
        np.all(display_lower95 <= display_lower80)
        and np.all(display_lower80 <= display_point)
        and np.all(display_point <= display_upper80)
        and np.all(display_upper80 <= display_upper95)
    ):
        raise ValueError("Forecast uncertainty bands are not properly nested")

    forecast_rows = []
    for index, period in enumerate(point.index):
        forecast_rows.append(
            {
                "period": period.strftime("%Y-%m"),
                "forecast": float(display_point[index]),
                "lower80": float(display_lower80[index]),
                "upper80": float(display_upper80[index]),
                "lower95": float(display_lower95[index]),
                "upper95": float(display_upper95[index]),
            }
        )

    historical = [
        {"period": period.strftime("%Y-%m"), "sales": float(value)}
        for period, value in series.items()
    ]
    rolling = series.rolling(3).mean()
    rolling_rows = [
        {"period": period.strftime("%Y-%m"), "value": float(value)}
        for period, value in rolling.dropna().items()
    ]

    naive_pred = _seasonal_naive(train, len(validation))
    naive_metrics = _metrics(validation, naive_pred)

    return {
        "history": historical,
        "rolling_3m": rolling_rows,
        "validation": {
            "selected": best,
            "models": [
                {
                    "damped": bool(row["damped"]),
                    "seasonal": str(row["seasonal"]),
                    "mae": float(row["mae"]),
                    "rmse": float(row["rmse"]),
                    "smape": float(row["smape"]),
                }
                for row in candidates
            ],
            "seasonal_naive": naive_metrics,
        },
        "forecast": forecast_rows,
        "model": FORECAST_MODEL_NAME,
        "uncertainty_method": "State-space simulation with bootstrap errors",
        "direction": "upward" if float(display_point.mean()) > float(series.tail(6).mean()) else "stable/downward",
    }
