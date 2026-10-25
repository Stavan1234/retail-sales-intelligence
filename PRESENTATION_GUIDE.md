# Presentation Guide: Retail Sales Intelligence

This guide has four parts:

1. **The script**: what to say, page by page, in about 3 to 4 minutes.
2. **Understanding each page**: the ideas behind every page, explained so you know *why* each sentence in the script is true.
3. **Questions the teacher may ask**, with short, honest answers.
4. **Checklist** for the day.

Read Part 2 once properly before practising the script. You will speak much more confidently when you understand what each number means, not just what it is.

All numbers below are for the **full dataset with no filters selected**. Clear all filters before presenting so the screen matches what you say.

---

## Part 1: The script (about 3½ minutes)

Speak slowly. Point at the screen when you mention a number. The times in brackets are a guide only.

### Page 1: Overview (35 seconds)

> Good morning. Our project is called **Retail Sales Intelligence**.
>
> We used the **Sample Superstore dataset**, which contains **10,194 order lines** from **2023 to 2026**. Our aim was to apply the complete data science process from our syllabus to this one dataset. The website follows that process step by step, and each page matches one module of the syllabus.
>
> This first page gives the overall picture. Total sales are about **2.33 million dollars**, total profit is about **292 thousand dollars**, and the overall profit margin is **12.6 percent**.
>
> One point stands out. **Furniture** sells almost as much as the other two categories, but its profit margin is only **2.6 percent**.

### Page 2: Data Preparation (25 seconds)

> Before any analysis, we checked the quality of the data.
>
> There are **no missing values**, **no duplicate rows**, and **no impossible values**, such as negative quantities or discounts above 100 percent. So we did not need to remove or fill in any rows.
>
> We then created **10 new columns** from the original 21. For example, **profit margin**, **shipping days**, and the **month of each order**, which we later use for forecasting.

### Page 3: Descriptive Statistics (35 seconds)

> Next, we described the data.
>
> Sales are **strongly right-skewed**. The **median** order line is only **54 dollars**, but the **mean** is **228 dollars**, because a small number of very large orders pull the mean upwards. For this reason, the median is the better measure of a typical order. We also calculated the **Karl Pearson** and **Bowley** coefficients of skewness, which confirm this.
>
> In the correlation matrix, sales and profit have a **moderate positive correlation of 0.48**, and discount and profit have a **weak negative correlation of minus 0.22**. These are associations only. They do not prove cause and effect.

### Page 4: Hypothesis Tests (40 seconds)

> On this page, we checked whether the differences we observed are statistically significant, using a **5 percent significance level**.
>
> The **95 percent confidence interval** for mean sales per order line is **216 to 240 dollars**.
>
> The **Welch t-test** gives a p-value of **0.46**, so we **fail to reject** the null hypothesis. There is no evidence that Consumer and Corporate customers spend differently per order line.
>
> **ANOVA** gives a p-value **below 0.001**, so mean profit **does differ** across categories. The **Tukey test** shows that **Technology** differs from both Furniture and Office Supplies.
>
> The **chi-square test** gives a p-value of **0.77**, so we found no evidence that customer segment and product category are related.

### Page 5: Regression (35 seconds)

> Here, we tried to predict the sales value of an order line.
>
> Using quantity alone, the fitted equation is **Sales = 19.49 + 54.02 × Quantity**. However, this explains only **3.4 percent** of the variation in sales.
>
> When we add discount, category, sub-category, region and segment, the **multiple regression** model explains about **23 percent** of the variation on test data the model had not seen. **Five-fold cross-validation** gives a similar result, so this is stable.
>
> So the model is useful but limited. The main reason is that the price of each product is not one of the inputs.

### Page 6: Anomaly Detection (30 seconds)

> Next, we looked for unusual transactions using three methods.
>
> The **IQR rule** flags **1,183** sales values, while the **Z-score** method flags only **128**. The difference comes from the skewness: the extreme values inflate the standard deviation, so the Z-score misses many of them.
>
> **Isolation Forest** looks at sales, quantity, discount and profit together, and flags **1,610** rows.
>
> We treat these as rows to **review**, not as errors, because many of them are genuine large orders or heavily discounted sales.

### Page 7: Forecasting (35 seconds)

> Finally, we forecast monthly sales for the next six months using **Holt-Winters exponential smoothing**, which models the level, the trend and the yearly seasonal pattern.
>
> We tested four versions of the model on the **last 12 months**, which the model did not see during fitting. The best version had an average error of about **11,200 dollars per month**. That is **29 percent lower** than a simple benchmark that just repeats last year's values.
>
> The shaded bands show the uncertainty, and they become wider further into the future.

### Closing (15 seconds)

> To conclude, this project allowed us to apply each module of the syllabus to one complete dataset, from data preparation to forecasting. The full analysis is also available in our Jupyter notebook.
>
> Thank you. We would be happy to answer any questions.

**Timing:** the script is about 560 words, which takes 3½ to 4 minutes at a calm pace. If you need to shorten it, drop the last sentence on each page first.

---

## Part 2: Understanding each page

### The big picture first

The project follows the **data science process**:

**collect data → prepare it → describe it → test ideas → build a model → find unusual cases → predict the future**

Each page of the website is one step of that process, and each step is one module of the syllabus. When a teacher asks "what is your project about?", that sentence is your answer.

**What is one row?** One row is an **order line**: one product inside one order. If a customer buys a chair and a lamp in the same order, that is **one order but two order lines**. This is why there are **5,111 orders** but **10,194 rows**. Almost every number on the website is calculated per order line.

**About the dates (2023 to 2026):** this is the version of the Sample Superstore dataset we were given. It is a well-known **teaching dataset**, not live company data, and its dates are set by the publisher. We kept the data exactly as supplied rather than changing it.

---

### Page 1: Overview

**Purpose:** give the audience the context before any statistics.

**Key terms**
- **Sales**: the money received for an order line.
- **Profit**: sales minus costs. It can be **negative**, which means that order line lost money.
- **Profit margin** = total profit ÷ total sales. A margin of 12.6% means that, out of every 100 dollars of sales, the store keeps about 12.60 dollars as profit.

**What our numbers say**
- Furniture: 755k sales, only 20k profit, so a **2.6%** margin.
- Office Supplies: **17.2%** margin. Technology: **17.5%** margin, the highest profit at 147k.
- Regions: Central has the lowest margin (**7.9%**) and West the highest (**15.0%**).

**Be careful:** this page only *describes* the data. It does not explain *why* Furniture's margin is low. That is why the script says "one point stands out" and does not claim a reason.

---

### Page 2: Data Preparation (Module 1)

**Purpose:** show the data can be trusted before we analyse it. If the data has errors, every later result is wrong. In data science this step usually takes the most time.

**The checks**
- **Missing values**: empty cells. We found **0**.
- **Duplicate rows**: the same row recorded twice, which would count a sale twice. We found **0**.
- **Range checks**: values that are impossible, like a negative quantity, a discount above 100%, or a ship date before the order date. We found **0**.

**Why didn't we remove negative profits?** A negative profit is not an error. It is a real loss-making sale. Removing those rows would hide an important part of the business.

**Feature engineering** means creating new, useful columns from existing ones:
- **Profit Margin** = Profit ÷ Sales × 100, for each order line.
- **Shipping Days** = Ship Date − Order Date.
- **Order Month** (for example 2025-03): needed to build the monthly series used for forecasting.
- Year, Month, Quarter, Day, Day of Week and Week: all taken from the order date, used for grouping.

So **21 original columns + 10 new columns = 31 columns.**

**Types of data (syllabus 2.1)**
- **Numeric** (quantitative): Sales, Profit, Quantity, Discount.
- **Categorical** (qualitative): Region, Category, Segment.
- **Date**: Order Date and Ship Date.

---

### Page 3: Descriptive Statistics (Module 2)

**Purpose:** summarise what the data looks like before testing anything.

**1. Histograms (univariate)**

A histogram splits the values into ranges and counts how many rows fall in each range. It shows the **shape** of the distribution.

**2. Centre and spread**
- **Mean**: the average. It is pulled towards extreme values.
- **Median**: the middle value when sorted. It is **not** affected by extreme values.
- **Standard deviation**: the typical distance of values from the mean.
- **Q1 and Q3**: the values below which 25% and 75% of the data fall.
- **IQR** = Q3 − Q1: the range of the middle 50%.

**3. Skewness: the most important idea on this page**

When a few values are very large, the distribution has a long tail to the right. This is **right skew**, or positive skew.

In our data, sales have **mean 228 but median 54**. When the mean is much bigger than the median, a few large values are pulling it up. So "a typical order line is worth about 54 dollars" is the honest statement.

There are three ways to measure skewness, and the table shows all three:
- **Skewness** (moment coefficient, from SciPy): 12.98 for sales. 0 means symmetric, and positive means a right tail.
- **Karl Pearson's coefficient** = 3 × (mean − median) ÷ standard deviation.
  For sales: 3 × (228 − 54) ÷ 620 ≈ **0.84**, which is positive, so right-skewed.
- **Bowley's coefficient** = (Q3 + Q1 − 2 × median) ÷ (Q3 − Q1). It uses only quartiles, so extreme values do not affect it.
  For sales: (209.5 + 17.2 − 107.8) ÷ 192.3 ≈ **0.62**, which is also positive.

All three are positive, so all three agree that sales are right-skewed.

**Excess kurtosis** measures how heavy the tails are compared with a normal distribution, which has 0. Sales has about 306, which means extremely heavy tails: very rare, very extreme values.

**4. Correlation (multivariate)**

**Karl Pearson's r** measures how strongly two numeric variables move together **in a straight line**. It goes from −1 to +1:
- **+1**: perfect positive (both rise together)
- **0**: no linear relationship
- **−1**: perfect negative (one rises, the other falls)

The usual guide is: under 0.3 is weak, 0.3 to 0.7 is moderate, and above 0.7 is strong.

Our results:
- **Sales and profit: r = 0.48 (moderate positive).** Bigger sales usually bring bigger profit, but not always, because some large sales lose money.
- **Discount and profit: r = −0.22 (weak negative).** Higher discounts tend to go with lower profit.

**Correlation is not causation.** r only tells us two things move together. It does not prove that one causes the other. Always say "is associated with", never "causes".

---

### Page 4: Hypothesis Tests (Module 3)

**Purpose:** decide whether a difference we see is **real**, or could just be **random chance**.

**How every test works.** Understand this once and every test on the page becomes easy.

1. **Null hypothesis (H₀)**: the "nothing is happening" claim. For example, "both groups have the same mean".
2. **Alternative hypothesis (H₁)**: the opposite. For example, "the means are different".
3. We calculate a **test statistic** (t, F or χ²) and its **p-value**.
4. **p-value**: if H₀ were true, how likely is a result at least this extreme? A **small p-value** means our result would be very unusual if H₀ were true, so we doubt H₀.
5. We compare p with the **significance level α = 0.05**:
   - **p < 0.05**: **reject H₀**. The difference is statistically significant.
   - **p ≥ 0.05**: **fail to reject H₀**. There is not enough evidence.

**"Fail to reject" is not the same as "prove H₀".** It only means we do not have enough evidence against it. That is why the script says "there is **no evidence** of a difference", not "they are equal".

**Type I and Type II errors**
- **Type I error**: rejecting H₀ when it is actually true (a false alarm). Its probability is α, so 5%.
- **Type II error**: failing to reject H₀ when it is actually false (missing a real difference).

**The confidence interval**

Our sample mean of sales is 228.23 dollars. The 95% confidence interval is **216.19 to 240.26 dollars**.

What it means: if we repeated this sampling many times, about **95% of intervals built this way would contain the true mean**.

We used the **t-distribution** because the population standard deviation is unknown. Margin of error = t × standard error = ± 12.04 dollars.

**Welch t-test: comparing the means of two groups**
- Question: do Consumer and Corporate customers have different mean sales per order line?
- Means are 221.67 vs 231.65 dollars, with **t = −0.74 and p = 0.458**.
- 0.458 > 0.05, so we **fail to reject H₀**. The small gap could easily be chance.
- Why Welch? The normal t-test assumes both groups have equal variance. Welch's version does not, so it is safer.

**One-way ANOVA: comparing the means of three or more groups**
- Question: does mean profit differ across Furniture, Office Supplies and Technology?
- **F = 55.19, p < 0.001**, so we **reject H₀**. At least one category is different.
- F compares the variation **between** groups with the variation **within** groups. A large F means the groups are far apart compared with the scatter inside each group.
- Mean profit per order line: Furniture 8.96, Office Supplies 20.57, Technology 78.58 dollars.

**Tukey HSD: which categories differ?**

ANOVA only says "at least one differs". Tukey compares every pair, and adjusts the p-values because doing many tests raises the chance of a false alarm.

| Pair | Difference in mean profit | Adjusted p | Result |
|---|---|---|---|
| Technology vs Furniture | +69.61 | < 0.001 | Differs |
| Technology vs Office Supplies | +58.01 | < 0.001 | Differs |
| Office Supplies vs Furniture | +11.60 | 0.108 | Not significant |

So **Technology** is the category that stands apart.

**Chi-square test of independence: are two categorical variables related?**
- Question: does the mix of categories bought depend on the customer segment?
- It compares the **observed counts** in the segment × category table with the counts we would **expect** if the two were unrelated.
- **χ² = 1.81, p = 0.770**, so we **fail to reject H₀**. All segments buy roughly the same mix of categories.
- The condition for this test is that every expected count is at least 5. Our smallest is 333.5, so the test is valid.

---

### Page 5: Regression (Module 4)

**Purpose:** build an equation that predicts sales from other variables, and measure how good it is.

**Simple linear regression: one input**

**Sales = 19.49 + 54.02 × Quantity**

- **Slope (54.02)**: each extra unit in an order line is associated with about 54 dollars more sales, on average.
- **Intercept (19.49)**: the predicted sales when quantity is 0. It only positions the line. It has no business meaning, because no order line has 0 units.
- **Error term**: the difference between the actual and predicted values. We cannot predict perfectly.

**Multiple linear regression: several inputs together**
- Inputs: Quantity, Discount, Category, Sub-Category, Region and Segment.
- Text columns cannot go into an equation directly, so we used **one-hot encoding**: each category becomes its own 0/1 column. That turns 6 inputs into **29 columns**.
- The coefficients are **partial regression coefficients**: the effect of one input **while holding the others constant**.

**Train / test split**

We fit the model on **80%** of the rows and measured it on the other **20%**, which it never saw. Testing on unseen data is the only honest way to check a model. Any model can "memorise" the data it was trained on.

**How to judge the model**
- **MAE** (mean absolute error): the average size of a mistake, in dollars. Multiple model: **223.66 dollars**.
- **RMSE** (root mean squared error): like MAE but punishes big mistakes more. Multiple model: **634.77 dollars**. RMSE is much bigger than MAE here because a few very large orders are predicted badly.
- **R²**: the share of the variation in sales that the model explains, from 0 to 1.
  - Simple model: **0.034 (3.4%)**.
  - Multiple model: **0.228 (22.8%)**.

**Is 22.8% bad?** It is modest, and we say so honestly. The main reason is that sales depends mostly on **which product** was bought and its **price**, and unit price is not an input. A copier and a pen can have the same quantity but very different sales. The model does improve a lot over quantity alone.

**Five-fold cross-validation (syllabus 1.4)**

We split the data into 5 equal parts. Each part takes one turn as the test set while the other 4 train the model. The average R² is **0.230 ± 0.058**, which is very close to our single test result. So our result does not depend on one lucky split.

**Residuals**

Residual = actual − predicted. In a good model, residuals scatter randomly around zero. Our residual plot spreads out as predictions get larger. That shows **errors grow for large orders**, which matches what RMSE tells us.

**Association, not cause:** the coefficients describe patterns in this data. They do not prove that changing an input would change sales.

---

### Page 6: Anomaly Detection (Module 5)

**Purpose:** find rows that are very different from the rest, so someone can check them.

**What is an outlier, and what causes it?** An outlier is a value far from the others. Possible causes:
- a **data entry error**, for example an extra zero typed
- a **genuine rare event**, for example a bulk order
- a **special situation**, for example a very heavy discount

An outlier is **not automatically wrong**, so we **flag** these rows. We do not delete them.

**Method 1: IQR rule (statistical, one variable)**

A value is an outlier if it is below **Q1 − 1.5 × IQR** or above **Q3 + 1.5 × IQR**. These are the same limits a box plot uses.
- Flags: **1,183** sales values and **1,913** profit values.

**Method 2: Z-score (statistical, one variable)**

z = (value − mean) ÷ standard deviation, which tells you how many standard deviations a value is from the mean. A row is flagged when |z| > 3.
- Flags: **128** sales values and **109** profit values.

**Why are the counts so different?** This is a very good point to understand. The Z-score uses the mean and standard deviation, and both are **pulled up by the extreme values themselves**. A huge standard deviation makes the "3 standard deviations" limit very wide, so many unusual values hide inside it. The IQR uses quartiles, which extreme values do not affect, so it is more reliable for skewed data like ours.

**Method 3: Isolation Forest (several variables together)**

It looks at Sales, Quantity, Discount and Profit **together**. It repeatedly splits the data at random. Normal rows sit in crowded areas and need many splits to separate. Unusual rows are separated in only a few splits, and these get flagged.
- Flags: **1,610** rows (15.8%), using scikit-learn's default cut-off.
- The **score** column: the lower (more negative), the more unusual.
- Its advantage: it can catch a combination that is unusual, even when each value on its own looks normal. For example, a large sale with a deep discount and a loss.

---

### Page 7: Forecasting (Module 6)

**Purpose:** predict the next six months of total monthly sales.

**Time series basics**
- A **time series** is data recorded over time, here **total sales per month**.
- **Trend**: the long-term direction (up or down).
- **Seasonality**: a pattern that repeats every year, such as certain months always being high.
- **Irregular part**: random ups and downs left over.

**Moving average (syllabus 6.2)**

The orange line is the **3-month moving average**: each point is the average of that month and the two before it. It smooths out the random noise so the trend is easier to see.

**Holt-Winters exponential smoothing**
- It tracks three things: the **level** (the current base value), the **trend** and the **seasonal pattern** (12 months).
- "Exponential smoothing" means **recent months get more weight** than older months when updating the forecast.
- **Additive vs multiplicative seasonality**: additive means the seasonal effect is a fixed amount (+10,000 dollars every March). Multiplicative means it is a percentage (+15% every March).
- **Damped trend**: the trend is gradually flattened in the future, so the forecast does not grow forever. This is usually more realistic.

**How we chose the model (validation)**

We fitted four versions (additive or multiplicative, each with and without damping) on all months **except the last 12**. Then we checked how well each one predicted those 12 months.

The time order was kept. We never used future months to predict past ones, because that would be cheating.

The best was **additive seasonality with a damped trend**:
- **MAE**: about 11,206 dollars per month, the average miss.
- **RMSE**: 14,922 dollars.
- **sMAPE**: about 20%, the average error as a percentage.

**The benchmark**

A model is only useful if it beats a simple rule. Our benchmark is the **seasonal naive** forecast: "this month will equal the same month last year". Its MAE was 15,793 dollars. Our model's error is **29% lower**, so it adds real value.

**Prediction intervals (the shaded bands)**
- The **darker band**: where sales should fall about 80% of the time.
- The **lighter band**: about 95% of the time.
- They **get wider** further ahead, because uncertainty builds up month after month.

**The forecast numbers**

The model projects about 371,000 dollars in total for January to June 2027. That is 42% above the same months a year earlier. If asked about this, explain that sales grew strongly through 2026 and the model continues that trend. This is exactly why the uncertainty bands matter: it is an estimate, not a promise.

---

## Part 3: Questions the teacher may ask

**What problem does your project solve?**
A store has thousands of transaction rows, which are hard to understand directly. We turned them into clear answers: how the business performs, which differences are real, how well sales can be predicted, which transactions look unusual, and what sales may look like next.

**Why did you use the median instead of the mean?**
Sales are strongly right-skewed: the mean is 228 and the median is 54. A few very large orders pull the mean up, while the median is not affected by them.

**What does a p-value of 0.458 mean?**
If there were truly no difference between Consumer and Corporate customers, a gap at least as large as ours would occur about 46% of the time by chance. That is very common, so we have no evidence of a real difference.

**Why didn't you use a Z-test?**
A Z-test needs the population standard deviation, which we do not know, so the t-test is the correct choice. With over 10,000 rows, the t-distribution is practically the same as the normal distribution anyway, so the result would be almost identical.

**Why Welch's t-test instead of the normal t-test?**
The two groups have different variances and sizes (5,281 and 3,090 rows). Welch's test does not assume equal variances.

**Why is your R² only 0.23?**
The most important driver of an order line's sales is the product's price, and price is not one of our inputs. We report this honestly rather than hiding it. The multiple model still improves a lot over quantity alone (3.4%).

**What is the difference between MAE and RMSE?**
Both measure the average error in dollars. RMSE squares the errors first, so it penalises large mistakes more. RMSE being much larger than MAE tells us there are a few very large errors.

**Why did you use cross-validation?**
One train/test split could be lucky or unlucky. Five-fold cross-validation tests the model five times on different parts of the data. The average R² (0.230) matched our single test (0.228), so the result is stable.

**Why didn't you use cross-validation for the forecast?**
For time series, the order of time matters. We cannot train on the future and test on the past. So we held out the **last 12 months** as the test period instead of shuffling.

**Why do IQR and Z-score give such different counts?**
Extreme values inflate the standard deviation, which widens the Z-score limit, so many outliers are missed. The IQR uses quartiles, which are not affected by extreme values. That makes it more suitable for skewed data.

**Are the outliers errors? Did you delete them?**
No. An outlier can be an error, but in retail it is usually a genuine bulk order or a heavily discounted sale. We flag them for review and keep them in the analysis.

**Why didn't you use SMOTE?**
SMOTE is used for **classification** problems where one class is much rarer than the other, and it creates synthetic examples of the rare class. Our project has no labelled classes to balance: anomaly detection here is unsupervised, and regression predicts a number. So SMOTE does not apply.

**Isolation Forest is not named in the syllabus. Why did you use it?**
The syllabus covers anomaly detection techniques in general. We used two statistical methods from the syllabus (IQR and Z-score) and added Isolation Forest because it can look at several variables together, which single-variable methods cannot. Distance-based and density-based methods, such as k-nearest neighbours or Local Outlier Factor, would be a good extension.

**What is Holt-Winters, in one sentence?**
A forecasting method that tracks the level, trend and yearly seasonal pattern of a time series, giving more weight to recent months.

**How do you know your forecast is any good?**
We tested it on the last 12 months, which it had not seen. Its average error was 29% lower than a simple benchmark that repeats last year's values.

**Does correlation prove that discount reduces profit?**
No. r = −0.22 shows a weak association only. Other factors, for example which products are usually discounted, could explain it.

**Why does the data go up to 2026?**
That is the version of the Sample Superstore dataset we were given. It is a standard teaching dataset with dates set by the publisher. We kept the data exactly as supplied.

**What tools did you use?**
Python for the analysis (pandas, SciPy, statsmodels, scikit-learn), FastAPI to serve the results, and Next.js for the website. The same analysis is in our Jupyter notebook.

**If you don't know an answer**, say: *"That's a good question. We didn't explore that in this project, but it would be a useful next step."* This is honest and professional.

---

## Part 4: Checklist for the day

- [ ] Start the website with `run.bat` at least 5 minutes early, and open every page once so the charts are loaded.
- [ ] **Clear all filters** ("Clear all" in the top bar) so the numbers match this script.
- [ ] Use the **Next →** button at the bottom of each page to move through the presentation in order.
- [ ] Keep this guide open on your phone or printed, in case you forget a number.
- [ ] Practise the script out loud at least twice, with a timer.
- [ ] Keep the Jupyter notebook ready in case the teacher asks to see the code.
