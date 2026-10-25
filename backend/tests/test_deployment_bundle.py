import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_bundled_workbook_matches_source() -> None:
    """Vercel deploys only backend/, so it carries a copy of the workbook. The copy must never drift."""
    source = ROOT / "data" / "source" / "sample_-_superstore.xlsx"
    bundled = ROOT / "backend" / "data" / "sample_-_superstore.xlsx"
    assert bundled.exists(), "backend/data/sample_-_superstore.xlsx is missing; copy it from data/source/"
    assert _sha256(bundled) == _sha256(source)
