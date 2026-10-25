from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

MULTI_FEATURES = ["Quantity", "Discount", "Category", "Sub-Category", "Region", "Segment"]
CAT_FEATURES = ["Category", "Sub-Category", "Region", "Segment"]
NUM_FEATURES = ["Quantity", "Discount"]
MIN_ROWS = 10


def _require_rows(frame: pd.DataFrame) -> None:
    if len(frame) < MIN_ROWS:
        raise ValueError(f"Regression requires at least {MIN_ROWS} transactions in the selected scope")


def _metrics(y_true: pd.Series, y_pred: np.ndarray) -> dict:
    mse = float(mean_squared_error(y_true, y_pred))
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "mse": mse,
        "rmse": float(np.sqrt(mse)),
        "r2": float(r2_score(y_true, y_pred)),
    }


def simple(frame: pd.DataFrame) -> dict:
    _require_rows(frame)
    X = frame[["Quantity"]].astype(float)
    y = frame["Sales"].astype(float)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )
    model = LinearRegression().fit(X_train, y_train)
    pred = model.predict(X_test)
    metrics = _metrics(y_test, pred)
    residual = y_test.to_numpy() - pred

    return {
        "name": "Quantity → Sales",
        "kind": "simple",
        "features": ["Quantity"],
        "intercept": float(model.intercept_),
        "coefficients": [{"feature": "Quantity", "coefficient": float(model.coef_[0])}],
        "metrics": metrics,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "actual_predicted": [
            {"actual": float(actual), "predicted": float(predicted)}
            for actual, predicted in zip(y_test.to_numpy()[:500], pred[:500])
        ],
        "residuals": [
            {"predicted": float(predicted), "residual": float(residual_value)}
            for predicted, residual_value in zip(pred[:500], residual[:500])
        ],
        "cv": None,
    }


def multiple(frame: pd.DataFrame) -> dict:
    _require_rows(frame)
    X = frame[MULTI_FEATURES].copy()
    y = frame["Sales"].astype(float)

    transformer = ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUM_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CAT_FEATURES,
            ),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    pipeline = Pipeline([("preprocess", transformer), ("model", LinearRegression())])
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )
    pipeline.fit(X_train, y_train)
    pred = pipeline.predict(X_test)
    metrics = _metrics(y_test, pred)

    cv = cross_validate(
        pipeline,
        X,
        y,
        cv=KFold(n_splits=5, shuffle=True, random_state=42),
        scoring={
            "r2": "r2",
            "mae": "neg_mean_absolute_error",
            "rmse": "neg_root_mean_squared_error",
        },
        return_train_score=False,
        error_score="raise",
    )

    cv_arrays = [cv["test_r2"], cv["test_mae"], cv["test_rmse"]]
    if not all(np.isfinite(values).all() for values in cv_arrays):
        raise ValueError("Cross-validation produced undefined metrics for the selected scope")

    pre = pipeline.named_steps["preprocess"]
    names = pre.get_feature_names_out().tolist()
    coefs = pipeline.named_steps["model"].coef_.tolist()
    ranked = sorted(
        (
            {
                "feature": str(name),
                "coefficient": float(coefficient),
                "abs_coefficient": abs(float(coefficient)),
            }
            for name, coefficient in zip(names, coefs)
        ),
        key=lambda item: item["abs_coefficient"],
        reverse=True,
    )[:12]

    residual = y_test.to_numpy() - pred
    return {
        "name": "Quantity + Discount + Category + Sub-Category + Region + Segment → Sales",
        "kind": "multiple",
        "features": MULTI_FEATURES,
        "metrics": metrics,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "encoded_feature_count": len(names),
        "coefficients": [
            {key: value for key, value in row.items() if key != "abs_coefficient"}
            for row in ranked
        ],
        "actual_predicted": [
            {"actual": float(actual), "predicted": float(predicted)}
            for actual, predicted in zip(y_test.to_numpy()[:500], pred[:500])
        ],
        "residuals": [
            {"predicted": float(predicted), "residual": float(residual_value)}
            for predicted, residual_value in zip(pred[:500], residual[:500])
        ],
        "cv": {
            "folds": [
                {
                    "fold": index + 1,
                    "r2": float(r2),
                    "mae": float(-mae),
                    "rmse": float(-rmse),
                }
                for index, (r2, mae, rmse) in enumerate(
                    zip(cv["test_r2"], cv["test_mae"], cv["test_rmse"])
                )
            ],
            "mean_r2": float(np.mean(cv["test_r2"])),
            "std_r2": float(np.std(cv["test_r2"], ddof=1)),
            "mean_mae": float(np.mean(-cv["test_mae"])),
            "mean_rmse": float(np.mean(-cv["test_rmse"])),
        },
    }
