from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    service: str
    status: str
    rows: int
    date_min: str | None
    date_max: str | None
