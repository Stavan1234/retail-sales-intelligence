from __future__ import annotations

from collections.abc import Callable
from datetime import date
from typing import Any, Literal, TypeVar

from fastapi import APIRouter, HTTPException, Query, Request

from ..analytics.engine import AnalyticsEngine
from ..schemas.api import HealthResponse

router = APIRouter()
T = TypeVar("T")


def filters_from_request(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, Any]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must be before or equal to end_date")

    return {
        "year": year,
        "region": region,
        "category": category,
        "segment": segment,
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
    }


def get_engine(request: Request) -> AnalyticsEngine:
    analytics = getattr(request.app.state, "analytics", None)
    if analytics is None:
        raise HTTPException(status_code=503, detail="Analytics engine is not initialized")
    return analytics


def run_analysis(operation: Callable[[], T]) -> T:
    try:
        return operation()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/health", response_model=HealthResponse)
def health(request: Request):
    analytics = get_engine(request)
    frame = analytics.frame
    return {
        "service": "retail-sales-intelligence",
        "status": "ok",
        "rows": int(len(frame)),
        "date_min": frame["Order Date"].min().date().isoformat() if len(frame) else None,
        "date_max": frame["Order Date"].max().date().isoformat() if len(frame) else None,
    }


@router.get("/filters")
def filters(request: Request):
    return get_engine(request).filters()


@router.get("/overview")
def overview(
    request: Request,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(lambda: get_engine(request).overview(**params))


@router.get("/data-quality")
def quality(
    request: Request,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(lambda: get_engine(request).quality(**params))


@router.get("/explore")
def explore(
    request: Request,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(lambda: get_engine(request).explore(**params))


@router.get("/tests")
def tests(
    request: Request,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(lambda: get_engine(request).tests(**params))


@router.get("/regression")
def regression(
    request: Request,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(lambda: get_engine(request).regression(**params))


@router.get("/anomalies")
def anomalies(
    request: Request,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(lambda: get_engine(request).anomalies(**params))


@router.get("/forecast")
def forecast(
    request: Request,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(lambda: get_engine(request).forecast(**params))


@router.get("/data")
def rows(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: Literal["Order Date", "Sales", "Profit", "Quantity", "Discount", "Category", "Region", "Segment"] = "Order Date",
    sort_dir: Literal["asc", "desc"] = Query("desc"),
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    params = filters_from_request(year, region, category, segment, start_date, end_date)
    return run_analysis(
        lambda: get_engine(request).rows(
            page=page,
            page_size=page_size,
            search=search,
            sort_by=sort_by,
            sort_dir=sort_dir,
            **params,
        )
    )
