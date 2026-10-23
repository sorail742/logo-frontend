"use client";

import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFieldControl } from "./field";

/** Sélecteur natif stylé : léger, accessible et adapté au mobile. */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  const field = useFieldControl(props.id);
  return (
    <div className={cn("relative", className)}>
      <select
        {...field}
        className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}
