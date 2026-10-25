from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

EXPECTED_DEPENDENCIES = {
    "next": "16.3.8",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "@tanstack/react-table": "9.2.4",
    "echarts": "6.1.0",
    "lucide-react": "1.52.0",
    "motion": "14.0.0",
}
EXPECTED_DEV = {
    "@biomejs/biome": "2.5.15",
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "24.10.1",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "tailwindcss": "4.3.3",
    "typescript": "6.0.3",
}


def main() -> None:
    failures: list[str] = []
    for key, expected in EXPECTED_DEPENDENCIES.items():
        actual = PACKAGE.get("dependencies", {}).get(key)
        if actual != expected:
            failures.append(f"dependency {key}: {actual!r} != {expected!r}")
    for key, expected in EXPECTED_DEV.items():
        actual = PACKAGE.get("devDependencies", {}).get(key)
        if actual != expected:
            failures.append(f"devDependency {key}: {actual!r} != {expected!r}")

    if failures:
        raise SystemExit("TOOLCHAIN CONTRACT: FAIL\n- " + "\n- ".join(failures))

    print("TOOLCHAIN CONTRACT: PASS")


if __name__ == "__main__":
    main()
