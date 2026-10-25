# Final Repository Repair — Forecast Truth, Windows Bootstrap, and QA

This repair addresses the Windows setup run where the data integrity gate passed but the analytical truth gate failed because the frozen forecast values were generated with an older statsmodels release.

## Key correction

The exact future forecast numbers are no longer treated as immutable truth. Source-data facts remain exact invariants; forecasting is verified through a stable analytical contract: 48 historical months, six future months, Holt-Winters model family, chronological validation, performance against a seasonal-naive benchmark, finite/non-negative output, correctly nested uncertainty bands, and deterministic uncertainty simulation for a fixed seed.

## Runtime correction

The setup bootstrap now installs the pinned backend environment from `backend/requirements-lock.txt`, verifies exact package versions with `scripts/verify_python_environment.py`, and loads `backend/.env`.

## Windows bootstrap

`setup.ps1` is intentionally self-contained, uses `npm.cmd` resolution, auto-formats the frontend before quality checks, validates the actual dataset-backed backend health, records service PIDs, writes separate stdout/stderr logs, and cleans up only processes started by setup when setup fails.

## Data semantics correction

End-date filters include the entire requested calendar day, and grouped profit margin is computed as aggregate profit divided by aggregate sales rather than the mean of row-level margins.
