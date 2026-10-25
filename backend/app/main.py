from __future__ import annotations

from contextlib import asynccontextmanager
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .analytics.engine import AnalyticsEngine
from .api.routes import router

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
WORKBOOK = DATA_DIR / "source" / "sample_-_superstore.xlsx"
PROCESSED = DATA_DIR / "processed" / "superstore_processed.csv"
BACKEND_ENV = ROOT / "backend" / ".env"
load_dotenv(BACKEND_ENV)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.analytics = AnalyticsEngine.from_paths(WORKBOOK, PROCESSED)
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
