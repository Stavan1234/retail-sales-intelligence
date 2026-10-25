# Retail Sales Intelligence

A calm, business-facing retail analytics workspace built from the supplied Superstore dataset.

## Product goal

Turn raw retail transactions into clean data, understandable visual insights, statistical evidence, regression-based prediction, anomaly investigation, and short-horizon sales forecasting.

The Jupyter notebook remains the academic evidence layer. The web application consumes the same Python analytical logic through FastAPI.

## Architecture

```text
Superstore Excel
      ↓
Python analytics engine
      ↓
FastAPI
      ↓
Next.js / React UI
```

The dataset is small enough to stay file-backed and in-memory. No database, authentication layer, or real-time infrastructure is required for the current scope.

## Application sections

The pages follow the data science process, one page per module of the Applied Data Science (CEPEC7041) syllabus. Each page states the question it answers, explains how to read every chart and ends with plain-language takeaways.

1. **Overview** (course project): project summary, business KPIs, monthly trend, category and region comparison.
2. **Data Preparation** (Module 1): pipeline, data types, quality checks, engineered fields with formulas, and a browser for the prepared data.
3. **Descriptive Statistics** (Module 2): histograms, summary measures (including Karl Pearson and Bowley skewness), grouped comparisons, scatter plots and the Pearson correlation matrix.
4. **Hypothesis Tests** (Module 3): 95% confidence interval, Welch t-test, one-way ANOVA with Tukey HSD, and chi-square test of independence.
5. **Regression** (Module 4): simple regression equation, multiple regression, test-set MAE/RMSE/R², residuals, 5-fold cross-validation and partial coefficients.
6. **Anomaly Detection** (Module 5): IQR rule, Z-score and Isolation Forest, with the most unusual order lines.
7. **Forecasting** (Module 6): Holt-Winters with a 3-month moving average, validation against a seasonal-naive benchmark, and a six-month forecast with 80%/95% intervals.

Older URLs (`/command-center`, `/explore`, `/statistics`) redirect to the new pages.

## Frontend stack

- Node.js **24.21.x (approved project runtime)**
- Next.js **16.3.8**
- React **19.3.0**
- TypeScript **6.0.3**
- Tailwind CSS **4.3.3**
- Biome **2.5.15** for linting and formatting
- Apache ECharts **6.1.0**
- TanStack Table **9.2.4**
- Lucide React **1.52.0**
- Motion **14.0.0**

The UI follows the current shadcn/base-nova direction with local, source-owned components and CSS variables rather than a large opaque runtime UI framework.

## Backend stack

Python **3.13** with:

- FastAPI **0.135.4**
- Pydantic **2.13.5**
- Uvicorn **0.54.0**
- Pandas **3.0.6**
- NumPy **2.5.3**
- SciPy **1.18.1**
- scikit-learn **1.9.1**
- statsmodels **0.15.0**
- OpenPyXL **3.1.5**
- pytest **9.0.2**

## Quick start (after the first setup)

Double-click `run.bat`. It starts the analytics API (port 8000) and the website (port 3000) in two windows and opens `http://localhost:3000/overview`. Close those two windows to stop. Run `setup.bat` once first on a new machine.

## Presenting and deploying

- `PRESENTATION_GUIDE.md`: a 3–4 minute script for the website, an explanation of every page, and likely questions with answers.
- `DEPLOYMENT.md`: free hosting of the website and analytics API as one Vercel project (`vercel.json`), with Render (`render.yaml`) as a backup.

## One-click Windows setup

Double-click `setup.bat`. It verifies the required Node/npm and Python versions, creates or reuses the backend virtual environment, installs dependencies, runs data and analytical truth checks, checks frontend formatting/types, builds Next.js, audits production dependencies, starts FastAPI + Next.js, verifies both live services, writes timestamped logs, and opens the dashboard.

Runtime logs are written to `logs/`. Every setup run gets a timestamped setup log, plus timestamped backend stdout/stderr and frontend stdout/stderr logs. The folder is ignored by Git so local logs never pollute the repository.

For normal development, re-running `setup.bat` is safe: it reuses an existing virtual environment, uses `npm ci` when the lockfile matches `package.json`, automatically regenerates a stale lockfile when the direct dependency contract has changed, and does not start a second server when ports 8000/3000 are already in use.

## Run locally on Windows

### 1. Use the required Node version

The repository intentionally targets the Node 24.21.x runtime baseline. The `.nvmrc`, `.node-version`, `package.json`, and `.npmrc` all enforce that baseline. The bootstrap also checks Python 3.13.x and the pinned backend environment.

Check:

```powershell
node -v
npm -v
```

Expected runtime baseline:

```text
Node v24.21.x
npm 11.19.x
```

The repository does not auto-install system runtimes. Install the approved Node/Python versions once; after that `setup.bat` handles the project setup and verification. It also checks the exact application dependency contract before building.

Using Node 22 will now fail installation instead of producing a misleading `EBADENGINE` warning.

### 2. One-click setup (recommended)

Double-click `setup.bat`. It is the canonical Windows bootstrap: it checks Node/npm/Python, repairs an outdated project virtual environment, installs dependencies, checks source formatting, runs the data and analytical truth gates, runs Python tests, runs the frontend quality/type checks, builds Next.js, audits production dependencies, starts FastAPI and Next.js, verifies both live services, writes logs, and opens the dashboard.

For a manual clean install, remove only the dependency tree and generated Next output:

```powershell
Remove-Item -Recurse -Force node_modules,.next -ErrorAction SilentlyContinue
```

Then run:

```powershell
npm install
npm run doctor
npm run format
npm run check
npm run build
npm run dev
```

If `package-lock.json` is present and was generated under the approved Node/npm baseline, **keep it**. Do not delete it during normal development. A lockfile is part of the reproducible dependency state.

Open `http://localhost:3000` after the development service is started.

### 3. Start the backend manually

The one-click setup is recommended. For a manual backend run, use the pinned environment:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The FastAPI service is available at `http://127.0.0.1:8000`.

### 4. Environment variables

Frontend (`.env.local`):

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Backend: copy `backend/.env.example` into your environment or configure `FRONTEND_ORIGINS` directly.

## Verification

Data integrity:

```powershell
python scripts\verify_data.py
```

Full analytical truth gate:

```powershell
python scripts\verify_truth.py
```

Toolchain contract:

```powershell
python scripts\verify_toolchain.py
```

Python tests:

```powershell
python -m pytest -q
```

Frontend:

```powershell
npm run check
npm run build
```

Production dependency audit:

```powershell
npm run audit:prod
```

Do **not** run `npm audit fix --force` blindly. It can replace the project's intentionally selected dependency graph with breaking upgrades.

## Data truth

The authoritative source is:

```text
data/source/sample_-_superstore.xlsx
```

The current verified baseline is:

```text
Orders                 10,194 rows × 21 columns
Processed dataset      10,194 rows × 31 columns
Distinct orders         5,111
Distinct customers        804
Distinct products       1,862
Total sales       $2,326,534.3543
Total profit        $292,296.8146
Total quantity          38,654
Order dates       2023-01-03 → 2026-12-30
```

The processed CSV and the independent feature reconstruction are verified against the source workbook. Baseline analytical results are preserved in `data/baseline.json`. Future Holt-Winters point forecasts are validated by a reproducible analytical contract (history length, chronological validation performance, forecast horizon, finite/non-negative values and uncertainty-band invariants), not frozen to one statsmodels patch release.

Do not replace the supplied workbook with another Superstore variant.

The date range through 2026-12-30 is a property of the supplied source and is intentionally preserved.

## Engineering rules

- Analytical values are calculated from the dataset; they are not hardcoded into UI components.
- The notebook, Python analytics engine, API and UI represent one analytical source of truth.
- The transaction table uses server-side filtering, sorting and pagination.
- Outliers are flags for investigation, not automatically invalid records.
- Observational associations are not presented as causal claims.
- Time-series validation respects chronological order.
- The project prefers a small number of strong components over unnecessary infrastructure.

### Logs and service shutdown

Each setup run writes timestamped setup and service logs under `logs/`. Use `stop.bat` to stop only the services started by the most recent setup run; it does not scan and kill unrelated processes by port.

