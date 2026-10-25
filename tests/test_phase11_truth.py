from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

def test_phase11_truth_gate_passes():
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "verify_truth.py")],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    assert "PHASE 11 TRUTH GATE: PASS" in result.stdout
