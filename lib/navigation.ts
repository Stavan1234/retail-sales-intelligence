export type NavigationItem = {
  href: string;
  label: string;
  module: string;
  question: string;
};

/** The pages follow the data science process, one page per syllabus module. */
export const NAV_ITEMS: NavigationItem[] = [
  {
    href: "/overview",
    label: "Overview",
    module: "Course project",
    question: "What does this project do, and how is the store performing overall?",
  },
  {
    href: "/data-preparation",
    label: "Data Preparation",
    module: "Module 1",
    question: "Is the raw data clean, and what was derived from it before analysis?",
  },
  {
    href: "/descriptive",
    label: "Descriptive Statistics",
    module: "Module 2",
    question: "What do sales, profit, quantity and discount look like, and how are they related?",
  },
  {
    href: "/hypothesis-tests",
    label: "Hypothesis Tests",
    module: "Module 3",
    question: "Are the differences we see between groups real, or could they be due to chance?",
  },
  {
    href: "/regression",
    label: "Regression",
    module: "Module 4",
    question: "How well can quantity, discount and product or customer attributes predict sales?",
  },
  {
    href: "/anomalies",
    label: "Anomaly Detection",
    module: "Module 5",
    question: "Which transactions are unusual enough to deserve a closer look?",
  },
  {
    href: "/forecast",
    label: "Forecasting",
    module: "Module 6",
    question: "What are monthly sales likely to be over the next six months?",
  },
];
