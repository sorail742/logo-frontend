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
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 h-8 w-full appearance-none rounded-lg border bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none focus-visible:ring-3 disabled:opacity-50 aria-invalid:ring-3"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
    </div>
  );
}
