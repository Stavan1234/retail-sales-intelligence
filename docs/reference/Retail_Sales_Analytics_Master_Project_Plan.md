# Retail Sales Analytics & Prediction
## Master Implementation, UI, Architecture & Presentation Plan

**Project style:** beautiful, calm, professional retail intelligence workspace  
**Primary goal:** satisfy the ADS syllabus clearly while making the project feel like a small, usable business analytics product.  
**Implementation model:** one coherent system, not a collection of disconnected charts.  
**Recommended approach:** hybrid — Python/Notebook for academic evidence + Next.js web app for the polished product/demo.

---

# 1. The project in one sentence

> **Turn raw retail transactions into clean data, understandable visual insights, statistical evidence, sales predictions, anomaly detection and future sales forecasts through a simple business-facing analytics workspace.**

The product should make a user feel:

> "I can open this, understand the business in a minute, investigate a problem, and trust where the numbers came from."

Do **not** make it feel like a student dashboard containing 30 unrelated graphs.

---

# 2. What we already have

The current ADS work is a strong starting point.

## Dataset

The actual Superstore workbook contains:

- `Orders` — **10,194 rows × 21 columns**
- `Returns` — **296 returned Order IDs**
- `People` — **4 regional managers**

The processed CSV currently contains **31 columns**, including engineered fields.

Raw Orders columns include:

- Row ID
- Order ID
- Order Date
- Ship Date
- Ship Mode
- Customer ID
- Customer Name
- Segment
- Country/Region
- City
- State/Province
- Postal Code
- Region
- Product ID
- Category
- Sub-Category
- Product Name
- Sales
- Quantity
- Discount
- Profit

Current engineered fields include:

- Year
- Month
- Month Name
- Quarter
- Day
- Day of Week
- Week
- Profit Margin
- Shipping Days
- Order Month

## Current notebook status

The current notebook already contains substantial work:

### Data understanding / preparation
- Dataset loading
- Shape and column inspection
- Data types
- Missing-value analysis
- Duplicate analysis
- Numeric/categorical identification
- Unique-value analysis
- Date-range inspection
- Basic quality report
- Date conversion
- Feature engineering
- Shipping-duration calculation
- Profit-margin calculation
- Processed dataset export

### EDA / descriptive analysis
- Sales, Profit, Quantity and Discount distributions
- Boxplots
- Category analysis
- Sub-category analysis
- Region analysis
- Segment analysis
- Sales vs Profit scatter
- Discount vs Profit
- Quantity vs Sales
- Correlation matrix
- Monthly sales
- Yearly sales
- Quarterly sales
- Profit-margin analysis

### Inferential statistics
- 95% confidence interval
- Independent Welch t-test
- One-way ANOVA
- Tukey HSD post-hoc analysis
- Chi-square test of independence
- Visual/statistical summaries

### Regression
- Simple Linear Regression
- Multiple Linear Regression
- Train/test split
- MAE
- MSE
- RMSE
- R²
- Actual vs predicted chart
- Residual analysis
- Regression coefficients

### Anomaly detection
The current notebook JSON also contains:
- IQR anomaly detection
- Z-score anomaly detection
- Isolation Forest
- Comparison of anomaly counts
- Isolation Forest visualization
- Anomaly-score ranking

### Important gap

The current notebook does **not yet contain the complete Time Series Forecasting module**.

That is the major analytical piece to add so the project covers the complete intended ADS story.

Also re-export the notebook after the anomaly + forecasting work so the final PDF evidence is complete. The currently rendered PDF ends around the regression analysis/coefficients section, while the notebook itself now continues further.

---

# 3. Current dataset baseline — keep these as verification values

These are useful as internal "truth checks" while the web application is being built.

| Metric | Baseline |
|---|---:|
| Order-line rows | 10,194 |
| Raw columns | 21 |
| Processed columns | 31 |
| Distinct orders | 5,111 |
| Distinct customers | 804 |
| Distinct products | 1,862 |
| Total sales | ≈ $2.327M |
| Total profit | ≈ $292.3K |
| Total units | 38,654 |
| Date coverage | Jan 2023 – Dec 2026 |
| Returns / distinct orders | ≈ 5.79% |

Useful analytical checks from the current data:

- Sales and Profit are positively related.
- Discount and Profit show a negative association.
- Furniture has substantially weaker profitability than Technology and Office Supplies.
- Regional sales and regional profitability are not identical stories.
- Sales and Profit distributions are strongly right-skewed/heavy-tailed.
- There are meaningful extreme observations, so anomalies should be **flagged and investigated**, not automatically deleted.

**Rule:** these baseline values are for validation. The website should calculate them from the dataset; never hardcode them into the UI.

---

# 4. The core design debate

## Option A — Only Colab / Jupyter Notebook

### Advantages
- Very easy to explain academically.
- Code, calculations and outputs are visible.
- Teacher can see the exact statistical methods.
- Minimal engineering work.

### Problems
- Looks like coursework rather than a finished product.
- No real user workflow.
- No polished interaction.
- Filters and exploration are limited.
- Does not demonstrate modern software development or UI skills.
- Harder to create a memorable presentation.

### Verdict

**Not enough for this project.**

---

# 5. Option B — Only the Website

### Advantages
- Excellent visual impact.
- Easy to demonstrate.
- Feels like a real analytics product.
- Interactive charts and filtering.
- Stronger "industry" impression.

### Problems
- Teacher may ask where the calculations came from.
- Statistical methodology can become hidden behind UI.
- A pretty dashboard alone can look superficial.
- Harder to prove every ADS concept.

### Verdict

**Better product, weaker academic evidence.**

---

# 6. Option C — Hybrid system

## This is the winner.

Use three layers:

### 1. Notebook / Colab
The **academic laboratory**.

Contains:
- data preparation
- formulas / statistical calculations
- EDA
- hypothesis tests
- regression
- anomaly methods
- forecasting
- validation

### 2. Web application
The **business-facing product**.

Contains:
- clean KPI overview
- interactive visualizations
- data-health/profiling
- statistics
- regression
- anomaly investigation
- forecasting

### 3. Presentation
The **story** connecting the two.

The presentation should not become a screenshot dump of the notebook.

Use the website to tell the story, and use the notebook as technical evidence when needed.

---

# 7. Final product philosophy

The application should be:

**Simple to navigate + rich underneath.**

The user should see only a few major sections.

Do not create:
- 15 sidebar pages
- a page for every chart
- a page for every statistical formula
- unnecessary login/authentication
- database infrastructure
- complicated ML pipelines
- chatbot/AI assistant
- product recommendation engine
- customer segmentation
- giant map page
- real-time streaming
- fake enterprise features

Those things increase implementation risk without improving ADS marks enough.

---

# 8. Recommended website structure

Use **5 primary sections**.

## 1. Command Center

The executive view.

Show:

- Total Sales
- Total Profit
- Profit Margin
- Orders
- Units Sold

Then:

- Monthly/quarterly sales trend
- Sales vs Profit by category
- Profit margin by region
- One or two generated insight cards

Example insight:

> "Technology generates the strongest overall profit contribution, while Furniture produces much lower profitability despite substantial sales volume."

The dashboard should answer:

> **What is happening?**

---

## 2. Data Preparation

This is where the ADS preprocessing work becomes visible.

Show a clean visual pipeline:

```text
RAW DATA
   ↓
INGEST
   ↓
VALIDATE
   ↓
CLEAN
   ↓
TRANSFORM
   ↓
FEATURE ENGINEERING
   ↓
ANALYSIS READY
```

Show:

- Rows
- Columns
- Missing values
- Duplicate rows
- Data-type distribution
- Date range
- Invalid/inconsistent values
- Numerical vs categorical variables

Show engineered features:

- Year
- Month
- Quarter
- Day of Week
- Shipping Days
- Profit Margin
- Order Month

This page is important because it proves:

> "We did not simply throw the dataset into charts."

---

# 9. Explore & Visualize

This replaces many small pages with one controlled analysis workspace.

Use tabs:

### Overview
- Distribution of Sales
- Distribution of Profit
- Distribution of Quantity
- Distribution of Discount

### Group Analysis
- Sales by Category
- Profit by Category
- Sales/Profit by Region
- Sales/Profit by Segment

### Relationships
- Sales vs Profit
- Discount vs Profit
- Quantity vs Sales
- Correlation matrix

### Statistics
Show:

- Mean
- Median
- Mode
- Range
- Variance
- Standard deviation
- Quartiles
- IQR
- Skewness
- Kurtosis

This directly supports descriptive-statistics concepts instead of hiding them.

---

# 10. Statistics & Prediction

This combines M3 and M4 without overwhelming the user.

Use two tabs:

## Statistical Testing

### 95% Confidence Interval
Question:

> "What is the plausible range for the population mean sales?"

Show:
- sample size
- mean
- confidence level
- lower limit
- upper limit

### Independent t-test

Question:

> "Do Consumer and Corporate segments have different mean Sales?"

Show:
- mean of each group
- t-statistic
- p-value
- alpha
- decision
- plain-language conclusion

### One-way ANOVA

Question:

> "Does mean Profit differ across product categories?"

Show:
- group means
- F-statistic
- p-value
- conclusion

Then show Tukey post-hoc results only after ANOVA when relevant.

### Chi-square

Question:

> "Is Customer Segment associated with Product Category?"

Show:
- contingency table
- chi-square statistic
- p-value
- conclusion
- heatmap

---

# 11. Prediction tab

Keep regression intentionally simple.

## Model 1 — Simple Linear Regression

Example:

**Quantity → Sales**

Show:
- equation
- regression line
- MAE
- RMSE
- R²

## Model 2 — Multiple Linear Regression

Use the existing feature idea:

- Quantity
- Discount
- Category
- Sub-Category
- Region
- Segment

Categoricals are one-hot encoded.

Show:

- MAE
- RMSE
- R²
- actual vs predicted
- residuals
- top coefficients

### Add one small M1 validation feature

Use **5-fold cross-validation** as a model-validation card.

Show:

- mean CV score
- score spread
- explanation of why cross-validation is used

This makes the M1 cross-validation topic visible in the actual product instead of existing only in theory.

---

# 12. Anomalies & Forecast

This is the final analytical workspace.

Split it into two tabs.

## Anomaly Detection

Methods:

### IQR
Great for:
- Sales
- Profit

### Z-score
Useful for:
- unusually large/small numerical observations

### Isolation Forest
Use as the multivariate method.

Inputs:

- Sales
- Quantity
- Discount
- Profit

Show:

- number of anomalies
- anomaly percentage
- method comparison
- anomaly table
- Sales vs Profit scatter
- anomaly score

### Important product behavior

Do **not** label every statistical outlier as "bad data."

Use wording such as:

> "Flagged for investigation"

An anomaly may be:
- a legitimate large order
- an unusually profitable transaction
- a deeply discounted sale
- a loss-making order
- a data-quality issue

The product should support investigation, not automatic deletion.

---

# 13. Time Series Forecasting

This is the major missing piece.

Aggregate the data by:

```text
Order Month → Total Sales
```

Use monthly sales because the dataset gives enough monthly history.

## Show

### Historical trend
48 monthly observations.

### Rolling trend
Optional 3-month rolling mean.

### Seasonality
Show recurring monthly behavior.

### Forecast
Forecast the next **6 months**.

Use a straightforward time-series model such as:

**Holt-Winters / Exponential Smoothing**

This is preferable to creating a "model zoo."

### Forecast display

Show:

- historical sales
- forecast line
- confidence/uncertainty band if supported
- expected next 6 months
- forecast direction
- small explanation card

Example:

> "The model expects continued sales growth with recurring seasonal variation."

Do not make the forecast UI pretend that it knows the future exactly.

---

# 14. Website information architecture

Final sidebar:

```text
┌─────────────────────────────┐
│ Retail Intelligence         │
│                             │
│  Command Center             │
│  Data Preparation            │
│  Explore & Visualize         │
│  Statistics & Prediction     │
│  Anomalies & Forecast        │
│                             │
│  Data status                 │
│  ✓ Dataset loaded            │
└─────────────────────────────┘
```

That is enough.

No clutter.

---

# 15. Visual/UI direction

The UI is a major part of the project.

## Desired feeling

**Calm + premium + analytical + trustworthy**

Think:

- modern enterprise analytics
- spacious layout
- strong typography
- subtle borders
- restrained shadows
- clean cards
- minimal gradients
- smooth but not distracting motion

Avoid the classic student-project look:

- neon colors everywhere
- giant glowing cards
- excessive glassmorphism
- floating particles
- rainbow charts
- 10 animations per page
- tiny text packed into boxes

## Suggested visual language

- warm/off-white or deep-ink background
- one primary accent family
- one positive color
- one negative color
- muted neutral tones
- large readable numbers
- clear chart titles
- generous whitespace

Use color semantically:

- positive = profit / healthy
- negative = loss / warning
- neutral = informational

---

# 16. Interaction rules

Every chart must be useful.

### Global filters

A small filter bar can control:

- Date range
- Year
- Region
- Category
- Segment

Avoid exposing 15 filters at once.

### Chart behavior

Charts should support:

- hover tooltips
- zoom where appropriate
- legend toggling
- readable labels
- empty-state messages
- loading state
- responsive resizing

### Data table

Use a proper searchable/filterable table.

The user should be able to:

- search
- sort
- filter
- paginate
- inspect row details

Do not render all 10,194 rows at once.

---

# 17. Best technology stack

## Frontend

### Next.js 16.x
**Recommended.**

Use:
- App Router
- TypeScript
- React Server Components where useful
- Client components only for interactive dashboards

Next.js 16.3 is the current Active LTS line as of the September 2026 security release. Its recent releases emphasize performance and fast navigation. Use the latest patched 16.3.x version available when the project is created.

### React 19.3
Use the current React major/minor supported by the Next.js setup.

### Tailwind CSS 4.3
Use modern Tailwind for layout and design.

### shadcn/ui
Recommended for the component foundation.

Use it for:
- Cards
- Buttons
- Tabs
- Dialogs
- Dropdowns
- Tooltips
- Selects
- Tables
- Badges
- Skeletons

The components are added to your codebase rather than forcing a large opaque UI framework.

### Lucide React
Use for icons.

### Motion
Use lightly for:
- page transitions
- number-card entrance
- tab transitions
- hover states

Do not animate data visualizations unnecessarily.

---

# 18. Charts

## Apache ECharts

**Recommended chart engine.**

Why:

- strong interactive charts
- professional tooltips
- responsive resizing
- scatter plots
- heatmaps
- histograms
- bar charts
- line charts
- boxplot support
- rich configuration
- excellent dashboard capabilities

Use ECharts directly rather than adding several different chart libraries.

### Principle

> **One charting library.**

Do not mix:
- Chart.js
- Recharts
- D3
- Plotly
- ECharts

all in one project.

That creates unnecessary complexity.

---

# 19. Backend

## FastAPI + Python

This is the cleanest architecture for the ADS project because the actual analytics already lives in Python.

Use:

- FastAPI
- Pydantic
- Pandas
- NumPy
- SciPy
- Scikit-learn
- Statsmodels
- OpenPyXL

### Analysis responsibilities

Python backend handles:

- loading data
- validation
- preprocessing
- aggregation
- descriptive statistics
- inferential statistics
- regression
- anomaly detection
- forecasting

Next.js handles:

- presentation
- interaction
- navigation
- UI state
- charts

---

# 20. Database decision

## Do NOT add a database yet.

The dataset is only around 10k rows.

A database would add:

- migrations
- schema management
- ORM code
- deployment complexity
- unnecessary infrastructure

Use:

```text
Excel / CSV
      ↓
Python preprocessing
      ↓
in-memory DataFrame / analysis layer
      ↓
FastAPI
      ↓
Next.js
```

A database only becomes justified if the scope later includes persistent user-generated data, multiple datasets, authentication, or production-scale ingestion.

That is **not needed for this academic project**.

---

# 21. Recommended repository structure

```text
retail-sales-intelligence/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── public/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── analytics/
│   │   │   ├── preprocessing.py
│   │   │   ├── descriptive.py
│   │   │   ├── inferential.py
│   │   │   ├── regression.py
│   │   │   ├── anomaly.py
│   │   │   └── forecasting.py
│   │   └── config.py
│   └── requirements.txt
│
├── data/
│   ├── sample_-_superstore.xlsx
│   └── superstore_processed.csv
│
├── notebooks/
│   └── ADS_Mini_Project.ipynb
│
├── docs/
│   ├── presentation/
│   └── screenshots/
│
├── README.md
└── .gitignore
```

Keep the analytical logic in Python modules so that:

> **Notebook and website use the same analytical ideas/results.**

Do not create one implementation in the notebook and a totally different implementation in the API.

---

# 22. Data pipeline

The application should follow one clear pipeline:

```text
RAW EXCEL
   │
   ▼
INGESTION
   │
   ▼
SCHEMA / TYPE VALIDATION
   │
   ├── Missing values
   ├── Duplicates
   ├── Invalid dates
   ├── Numeric range checks
   └── Category consistency
   │
   ▼
CLEANING
   │
   ▼
TRANSFORMATION
   │
   ├── Date conversion
   ├── Category normalization
   └── Numerical preparation
   │
   ▼
FEATURE ENGINEERING
   │
   ├── Year
   ├── Month
   ├── Quarter
   ├── Day / Day of Week
   ├── Shipping Days
   ├── Profit Margin
   └── Order Month
   │
   ▼
ANALYSIS-READY DATA
   │
   ├── Descriptive Statistics
   ├── Inferential Statistics
   ├── Regression
   ├── Anomaly Detection
   └── Forecasting
```

This pipeline should be visible in the Data Preparation page.

---

# 23. API design

Keep the API small.

Possible endpoints:

```text
GET /api/health
GET /api/overview
GET /api/data-quality
GET /api/explore
GET /api/statistics
GET /api/tests
GET /api/regression
GET /api/anomalies
GET /api/forecast
```

Filters can be query parameters:

```text
?year=2026
&region=West
&category=Technology
&segment=Consumer
```

Do not create hundreds of endpoints.

---

# 24. Most important rule for the coding AI

The coding AI must NOT invent dashboard values.

Bad:

```text
sales: 2326000
profit: 292000
```

Good:

```python
sales = df["Sales"].sum()
profit = df["Profit"].sum()
```

The same applies to charts.

Every displayed number should originate from the analytical/data layer.

---

# 25. Recommended implementation order

Build in batches.

Do NOT ask an AI to "build the whole project" in one giant generation.

## Batch 0 — Freeze the source

Tasks:

- preserve current notebook
- preserve original Excel
- preserve processed CSV
- create project repo
- record baseline metrics
- record Python package versions
- record expected dataset columns

**Exit condition:**
You can reproduce the baseline numbers.

---

## Batch 1 — Python analytics engine

Create modules:

```text
preprocessing.py
descriptive.py
inferential.py
regression.py
anomaly.py
forecasting.py
```

First make the analytics work without a website.

**Exit condition:**
All analytical functions return structured data.

---

## Batch 2 — Forecasting

Complete M6.

Add:

- monthly aggregation
- trend
- seasonality
- train/validation split
- Holt-Winters / Exponential Smoothing
- forecast horizon
- evaluation metrics

Use the final 12 months as a validation period where appropriate.

Then refit on full history for the final 6-month forecast.

**Exit condition:**
Forecasting works independently of the UI.

---

## Batch 3 — FastAPI

Expose the analytics through clean endpoints.

Create Pydantic response models.

Add:

- validation
- useful error messages
- health endpoint

**Exit condition:**
Postman/browser can retrieve real analysis results.

---

## Batch 4 — Next.js design system

Before wiring every chart:

Build:

- sidebar
- top header
- global filters
- cards
- typography
- spacing
- tabs
- loading states
- empty states
- dialogs
- dark/light theme if desired

**Exit condition:**
The UI already looks professional before the data is connected.

---

## Batch 5 — Command Center + Data Preparation

Wire:

- KPI cards
- trend charts
- category/region views
- data-health cards
- preprocessing pipeline

**Exit condition:**
The app already feels like a real usable product.

---

## Batch 6 — Explore & Visualize

Wire:

- distributions
- boxplots
- descriptive statistics
- category/region/segment charts
- correlation
- scatter plots
- data table

**Exit condition:**
M2 is clearly represented.

---

## Batch 7 — Statistics & Prediction

Wire:

- confidence interval
- t-test
- ANOVA
- Tukey
- chi-square
- regression
- model comparison
- cross-validation
- residuals

**Exit condition:**
M3 + M4 are visible and defensible.

---

## Batch 8 — Anomaly + Forecast

Wire:

- IQR
- Z-score
- Isolation Forest
- anomaly table
- monthly forecast
- forecast confidence/uncertainty display

**Exit condition:**
M5 + M6 are complete.

---

## Batch 9 — Product polish

Add:

- smooth motion
- hover states
- chart transitions
- responsive layouts
- keyboard accessibility
- loading skeletons
- error states
- helpful tooltips
- consistent number formatting
- currency formatting
- percentage formatting

Do not add new analytical features here.

Polish what exists.

---

## Batch 10 — Verification

Run a complete comparison:

```text
Notebook result
      VS
Python analytics module
      VS
API result
      VS
Website display
```

All important numbers must agree.

Test at least:

- row count
- column count
- missing values
- duplicate count
- total sales
- total profit
- order count
- category totals
- region totals
- correlation values
- inferential test outputs
- regression metrics
- anomaly counts

---

# 26. Charts we should actually keep

The application does **not** need every graph created in the notebook.

Keep the highest-value visuals.

## Command Center
1. Monthly Sales Trend
2. Category Sales vs Profit
3. Regional Profit Margin

## Data Preparation
4. Data-quality summary
5. Data-type composition

## Explore
6. Sales Histogram
7. Profit Histogram
8. Sales/Profit Boxplot
9. Category comparison
10. Region comparison
11. Sales vs Profit Scatter
12. Discount vs Profit Scatter
13. Correlation Heatmap

## Statistics
14. Consumer vs Corporate boxplot
15. Profit by Category boxplot
16. Segment × Category heatmap

## Regression
17. Actual vs Predicted
18. Residuals vs Predicted
19. Top Coefficients

## Anomaly
20. IQR / Z-score / Isolation Forest comparison
21. Anomaly scatter
22. Anomaly investigation table

## Forecast
23. Historical + Forecast line
24. Forecast uncertainty band

That is already more than enough.

The trick is not reducing analytical depth.

The trick is **organizing the depth behind a simple interface.**

---

# 27. What belongs in the website vs notebook vs presentation?

| Material | Notebook | Website | Presentation |
|---|---:|---:|---:|
| Raw dataset inspection | ✓ | ✓ | brief |
| Data preprocessing | ✓ | ✓ | ✓ |
| Data-quality checks | ✓ | ✓ | brief |
| Descriptive statistics | ✓ | ✓ | ✓ |
| Histograms/boxplots | ✓ | ✓ | selected |
| Correlation | ✓ | ✓ | ✓ |
| Confidence interval | ✓ | ✓ | ✓ |
| t-test | ✓ | ✓ | ✓ |
| ANOVA | ✓ | ✓ | ✓ |
| Chi-square | ✓ | ✓ | selected |
| Regression code | ✓ | ✓ | ✓ |
| Anomaly calculations | ✓ | ✓ | ✓ |
| Forecast calculations | ✓ | ✓ | ✓ |
| Every single chart | ✓ | no | no |
| Raw code | ✓ | no | appendix only |
| Interactive exploration | limited | **✓** | live demo |

---

# 28. Presentation strategy

## The website should be the star.

Do not present the project as:

> "Here is our Colab notebook with 46 pages."

Instead present:

> "We built a retail analytics workspace that takes transactional data through the complete data-science workflow."

Then show the workflow.

---

# 29. Recommended presentation structure

## Slide 1 — Title

**Retail Sales Analytics & Prediction**

Subtitle:

> From Raw Transactions to Data-Driven Retail Decisions

Show a clean screenshot of the application.

---

## Slide 2 — Business Problem

Explain:

Retail data contains thousands of transactions, but raw records do not immediately reveal:

- where revenue is profitable
- how discounts relate to profitability
- which segments/categories differ
- what transactions are unusual
- what future sales may look like

---

## Slide 3 — Dataset

Show:

- 10,194 transactions/order lines
- 21 original variables
- 31 processed variables
- 2023–2026 coverage
- Orders / Returns / People sheets

Keep this slide visual.

---

## Slide 4 — Data Science Pipeline

```text
Problem
  ↓
Data
  ↓
Preparation
  ↓
EDA
  ↓
Statistics
  ↓
Regression
  ↓
Anomalies
  ↓
Forecast
  ↓
Decision Support
```

This is the "complete ADS" slide.

---

## Slide 5 — Data Preparation + EDA

Show:

- data-quality result
- feature engineering
- 2–3 important charts

Do not show 10 screenshots.

---

## Slide 6 — Statistical Evidence

Show:

- confidence interval
- t-test
- ANOVA
- chi-square

The message should be:

> "We did not only visualize patterns; we statistically tested them."

---

## Slide 7 — Regression

Show:

- simple vs multiple regression
- MAE / RMSE / R²
- Actual vs Predicted chart
- one sentence about model usefulness

---

## Slide 8 — Anomaly Detection

Show:

- IQR
- Z-score
- Isolation Forest
- one anomaly investigation example

Key message:

> "Anomalies are flagged for investigation, not blindly deleted."

---

## Slide 9 — Forecasting

Show:

- historical monthly sales
- forecast
- uncertainty band

This is where the project becomes forward-looking.

---

## Slide 10 — Product / Website

Show the UI.

Explain:

> "All analytical outputs are exposed through a business-facing interactive workspace."

Mention:

- filters
- charts
- data table
- statistical results
- prediction
- anomalies
- forecast

---

## Slide 11 — Technology Stack

Use a simple architecture diagram:

```text
Next.js / React
       │
       ▼
Beautiful Analytics UI
       │
       ▼
FastAPI
       │
       ▼
Python Analytics
       │
       ├── Pandas
       ├── NumPy
       ├── SciPy
       ├── Scikit-learn
       └── Statsmodels
       │
       ▼
Superstore Dataset
```

---

## Slide 12 — Conclusion

Three takeaways:

1. Retail sales can be understood through descriptive and visual analytics.
2. Statistical and regression methods turn observations into evidence/predictions.
3. Anomaly detection + forecasting extend the project from historical analysis toward decision support.

---

# 30. Live demonstration order

If you get only 2–4 minutes:

### Step 1
Open Command Center.

Say:

> "This gives the business a quick picture of sales, profit and trends."

### Step 2
Apply a Region/Category filter.

Say:

> "The same analysis can be interactively explored instead of generating separate reports."

### Step 3
Open Data Preparation.

Say:

> "Before analysis, we validate the dataset and create analysis-ready features."

### Step 4
Open Statistics.

Show one hypothesis test.

Say:

> "The application also provides statistical evidence, not only charts."

### Step 5
Open Regression.

Show actual vs predicted + model metrics.

### Step 6
Open Anomalies.

Show one flagged observation.

### Step 7
Open Forecast.

Say:

> "Finally, the historical monthly sales series is used to estimate future sales."

Stop.

Do not spend five minutes explaining every chart.

---

# 31. Notebook strategy

Keep the notebook.

Do not replace it with the website.

The notebook is your:

- calculation evidence
- academic record
- experimentation area
- viva backup
- reproducibility layer

But clean it before submission.

Recommended notebook order:

```text
1. Introduction
2. Dataset
3. Data Understanding
4. Data Preparation
5. Feature Engineering
6. EDA
7. Descriptive Statistics
8. Inferential Statistics
9. Regression
10. Anomaly Detection
11. Time Series Forecasting
12. Conclusions
```

Remove duplicate cells and repeated charts where possible.

---

# 32. Important analytical corrections / safeguards

## Do not claim causation

For example:

Bad:

> "Discount causes profit to decrease."

Better:

> "Higher discount levels are associated with lower profitability in this dataset."

The project uses observational transaction data, so the website should distinguish:

**association ≠ causation**

---

## Do not automatically delete outliers

The dataset is heavy-tailed.

Large transactions are not necessarily errors.

Use:

> "Outlier / anomaly flag"

not:

> "Bad row"

unless the data-quality rules actually prove it is invalid.

---

## Do not hide the statistical assumptions

For tests, show a small "Method" tooltip:

- H0
- H1
- alpha
- test statistic
- p-value
- decision

This makes the project more defensible without cluttering the main UI.

---

# 33. Performance strategy

The dataset is small enough that the project does not need an elaborate data warehouse.

Use:

- one loaded dataset
- reusable analytical functions
- aggregated API responses
- lazy-loaded charts/pages
- server-side computation where possible
- client-side interaction only where it improves UX

Do not recalculate giant analyses every time a hover happens.

---

# 34. Deployment recommendation

## Development

Run:

```text
Next.js → localhost:3000
FastAPI → localhost:8000
```

## Demo deployment

Simple option:

```text
Frontend → Vercel
Backend → Render / similar Python host
```

Keep deployment secondary.

The academic project should work completely on the laptop even without internet.

---

# 35. AI coding-agent rules

Give the other AI this document first.

Then enforce:

### Rule 1
**Read the existing notebook before rewriting anything.**

### Rule 2
**Do not replace the dataset with another Superstore version.**

### Rule 3
**Do not invent metrics.**

### Rule 4
**Do not create fake/dummy chart values after the real data layer exists.**

### Rule 5
**Do not introduce a database unless there is an actual requirement.**

### Rule 6
**Do not add extra ML models just to make the project look advanced.**

### Rule 7
**Do not restructure everything in one shot.**

Work batch-by-batch:

```text
Implement
   ↓
Run
   ↓
Test
   ↓
Compare with notebook
   ↓
Review
   ↓
Next batch
```

### Rule 8
Every feature must answer at least one of:

- What happened?
- How is the data distributed?
- Is the pattern statistically meaningful?
- Can we predict sales?
- What is unusual?
- What might happen next?

If it answers none of these:

> **Do not build it.**

---

# 36. Definition of "finished"

The project is finished when:

### Data
- [ ] Correct Superstore dataset is used
- [ ] Data-quality checks work
- [ ] Preprocessing is reproducible
- [ ] Feature engineering is reproducible

### ADS coverage
- [ ] M1 concepts represented
- [ ] M2 descriptive analysis represented
- [ ] M3 inferential statistics represented
- [ ] M4 regression represented
- [ ] M5 anomaly detection represented
- [ ] M6 forecasting represented

### Website
- [ ] 5 primary sections
- [ ] Global filters
- [ ] Interactive charts
- [ ] Data table
- [ ] Data-preparation view
- [ ] Statistics
- [ ] Regression
- [ ] Anomaly investigation
- [ ] Forecast

### Quality
- [ ] No hardcoded analytical values
- [ ] Notebook/API/UI agree
- [ ] Loading states work
- [ ] Error states work
- [ ] Responsive layout works
- [ ] Numbers formatted correctly
- [ ] Charts are readable
- [ ] UI is calm rather than overloaded

### Presentation
- [ ] 10–12 slides
- [ ] 2–4 minute live demo
- [ ] notebook retained as evidence
- [ ] final notebook export updated
- [ ] final website screenshot set prepared

---

# 37. Final recommendation

The winning approach is:

```text
                 ┌───────────────────┐
                 │   SUPERSTORE DATA  │
                 └─────────┬─────────┘
                           ↓
                 ┌───────────────────┐
                 │ PREPROCESSING      │
                 │ + FEATURE ENGINEERING
                 └─────────┬─────────┘
                           ↓
              ┌──────────────────────────┐
              │     PYTHON ANALYTICS     │
              │                          │
              │ Descriptive              │
              │ Inferential              │
              │ Regression               │
              │ Anomaly Detection        │
              │ Forecasting              │
              └────────────┬─────────────┘
                           ↓
                    ┌─────────────┐
                    │   FASTAPI   │
                    └──────┬──────┘
                           ↓
                ┌────────────────────┐
                │ NEXT.JS WEB APP    │
                │                    │
                │ Command Center     │
                │ Data Preparation   │
                │ Explore            │
                │ Statistics         │
                │ Anomaly + Forecast │
                └─────────┬──────────┘
                          ↓
              ┌────────────────────────┐
              │ PRESENTATION / DEMO    │
              └────────────────────────┘
```

## The one-line decision

> **Build a polished Next.js analytics product backed by a small FastAPI/Python analytics engine, while keeping the Colab/Jupyter notebook as the academic source of calculations and evidence.**

That gives you the best balance of:

**ADS syllabus coverage + real functionality + beautiful UI + explainability + presentation impact + manageable implementation complexity.**

---

# 38. Recommended stack summary

| Layer | Choice |
|---|---|
| Frontend | Next.js 16.x |
| Language | TypeScript |
| UI | Tailwind CSS 4.3 |
| Components | shadcn/ui |
| Icons | Lucide React |
| Motion | Motion |
| Charts | Apache ECharts |
| Table | TanStack Table |
| Backend | FastAPI |
| Data | Pandas |
| Numerical | NumPy |
| Statistics | SciPy |
| ML / Regression / Anomaly | Scikit-learn |
| Forecasting | Statsmodels |
| Excel loading | OpenPyXL |
| Database | **None for now** |
| Deployment | Vercel + Python host, or local |

Use the latest compatible patched releases when implementing rather than copying stale version numbers from this document.

---

# 39. Source / technical verification notes

Current technology recommendations were checked against official project sources during planning:

- Next.js 16.3 is the current active line in the September 2026 security release.
- React's current documented version is 19.3.
- Tailwind CSS 4.3 is the current 2026 release line.
- shadcn/ui supports Tailwind v4 + React 19.
- FastAPI has active 2026 releases.
- Apache ECharts has an active modern release line and remains appropriate for interactive analytical dashboards.

