// src/components/ui/app-card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function AppCard(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>
) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white dark:bg-[#0e1422] shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}
