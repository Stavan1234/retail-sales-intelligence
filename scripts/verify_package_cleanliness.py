from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANNED_NAMES = {"node_modules", ".next", ".pytest_cache", "__pycache__", ".venv"}
BANNED_SUFFIXES = {".pyc", ".tsbuildinfo"}


def main() -> None:
    failures: list[str] = []
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if any(part in BANNED_NAMES for part in relative.parts):
            failures.append(str(relative))
        elif path.is_file() and path.suffix in BANNED_SUFFIXES:
            failures.append(str(relative))

    if failures:
        raise SystemExit("Release package contains generated artifacts:\n- " + "\n- ".join(failures[:40]))

    print("PACKAGE CLEANLINESS: PASS")


if __name__ == "__main__":
    main()
