from __future__ import annotations

import importlib.metadata
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "fastapi": "0.135.4",
    "httpx2": "2.13.1",
    "pydantic": "2.13.5",
    "uvicorn": "0.54.0",
    "pandas": "3.0.6",
    "numpy": "2.5.3",
    "scipy": "1.18.1",
    "scikit-learn": "1.9.1",
    "statsmodels": "0.15.0",
    "openpyxl": "3.1.5",
    "pytest": "9.0.2",
}

def main() -> None:
    version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if not (sys.version_info.major == 3 and sys.version_info.minor == 13):
        raise SystemExit(f"PYTHON ENVIRONMENT GATE: FAIL\nPython 3.13.x required; found {version}")

    failures: list[str] = []
    for package, expected in EXPECTED.items():
        try:
            actual = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            failures.append(f"{package}: missing (expected {expected})")
            continue
        if actual != expected:
            failures.append(f"{package}: {actual} (expected {expected})")

    print(f"Python: {version}")
    if failures:
        print(f"PYTHON ENVIRONMENT GATE: FAIL ({len(failures)} issue(s))")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print("PYTHON ENVIRONMENT GATE: PASS")
    for package, expected in EXPECTED.items():
        print(f"- {package}=={expected}: PASS")

if __name__ == "__main__":
    main()
