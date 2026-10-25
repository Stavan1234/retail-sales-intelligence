from __future__ import annotations

from contextlib import asynccontextmanager
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .analytics.engine import AnalyticsEngine
from .api.routes import router

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT = BACKEND_DIR.parent
DATA_DIR = ROOT / "data"
WORKBOOK_NAME = "sample_-_superstore.xlsx"


def _workbook_path() -> Path:
    """Prefer the repository's source workbook; fall back to the identical copy bundled with the backend.

    On Vercel the `api` service is built from `backend/` alone, so only `backend/data/` is deployed.
    A test keeps the two files byte-identical.
    """
    for candidate in (DATA_DIR / "source" / WORKBOOK_NAME, BACKEND_DIR / "data" / WORKBOOK_NAME):
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Dataset not found: {WORKBOOK_NAME}")


PROCESSED = DATA_DIR / "processed" / "superstore_processed.csv"
BACKEND_ENV = BACKEND_DIR / ".env"
load_dotenv(BACKEND_ENV)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.analytics = AnalyticsEngine.from_paths(_workbook_path(), PROCESSED)
    yield


app = FastAPI(title="Retail Sales Intelligence API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")
