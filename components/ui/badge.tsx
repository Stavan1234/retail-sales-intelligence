import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "positive" | "warning" | "negative";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        tone === "positive" && "positive",
        tone === "warning" && "warning",
        tone === "negative" && "negative",
      )}
    >
      {children}
    </span>
  );
}
