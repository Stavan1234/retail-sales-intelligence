import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Retail Sales Intelligence",
    template: "%s · Retail Sales Intelligence",
  },
  description:
    "Applied Data Science course project: data preparation, descriptive statistics, hypothesis tests, regression, anomaly detection and forecasting on the Superstore retail dataset.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eaf4fa" },
    { media: "(prefers-color-scheme: dark)", color: "#051727" },
  ],
};

function DashboardFallback() {
  return (
    <div className="app-shell" aria-busy="true">
      <aside className="sidebar" aria-hidden="true" />
      <main className="main">
        <div className="center-state">
          <div className="state-card" role="status" aria-live="polite">
            <div className="eyebrow">Retail Sales Intelligence</div>
            <h1>Loading</h1>
            <p>Preparing the analysis.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Suspense fallback={<DashboardFallback />}>
          <DashboardShell>{children}</DashboardShell>
        </Suspense>
      </body>
    </html>
  );
}
