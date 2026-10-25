"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { JobEvent } from "@/lib/types";

export function JobProgress({ event, running }: Readonly<{ event: JobEvent | null; running: boolean }>) {
  const t = useTranslations("app.job");
  if (!running) return null;
  const status = event?.status ?? "QUEUED";
  return (
    <output className="grid gap-2 rounded-xl border bg-accent/40 p-4" aria-live="polite">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t(status)}
      </p>
      <Progress value={event?.progress ?? 5} aria-label={t(status)} />
    </output>
  );
}
