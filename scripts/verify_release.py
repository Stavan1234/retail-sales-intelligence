from __future__ import annotations

import re
import shutil
import subprocess
import sys


def run(label: str, command: list[str]) -> None:
    print(f"\n[{label}] {' '.join(command)}")
    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


run("DATA TRUTH", [sys.executable, "scripts/verify_data.py"])
run("TRUTH GATE", [sys.executable, "scripts/verify_truth.py"])
run("PYTHON ENVIRONMENT", [sys.executable, "scripts/verify_python_environment.py"])
run("TOOLCHAIN CONTRACT", [sys.executable, "scripts/verify_toolchain.py"])
run("PYTHON COMPILE", [sys.executable, "-m", "compileall", "-q", "backend"])
run("PYTEST", [sys.executable, "-m", "pytest", "-q"])
run("PIP CHECK", [sys.executable, "-m", "pip", "check"])

npm_command = "npm.cmd" if sys.platform == "win32" else "npm"
if shutil.which("node") is None or shutil.which(npm_command) is None:
    raise SystemExit("Node.js 24.21.x project runtime and npm 11.19.x are required for the frontend release gate.")

node_version = subprocess.check_output(["node", "--version"], text=True).strip()
npm_version = subprocess.check_output([npm_command, "--version"], text=True).strip()
if not re.fullmatch(r"v24\.21\.\d+", node_version):
    raise SystemExit(f"Unsupported Node version {node_version}; use Node 24.21.x project runtime.")
if not re.fullmatch(r"11\.19\.\d+", npm_version):
    raise SystemExit(f"Unsupported npm version {npm_version}; use npm 11.19.x.")

run("FRONTEND IMPORTS", [npm_command, "run", "frontend:imports"])
run("FRONTEND STATIC", [npm_command, "run", "frontend:static"])
run("FRONTEND FORMAT", [npm_command, "run", "format:check"])
run("FRONTEND QUALITY", [npm_command, "run", "quality"])
print("\nFINAL RELEASE GATE: PASS")
