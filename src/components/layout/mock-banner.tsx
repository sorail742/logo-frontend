"use client";

import { useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { API_MODE } from "@/lib/api";

export function MockBanner() {
  const t = useTranslations("common");
  const [hidden, setHidden] = useState(false);
  if (API_MODE !== "mock" || hidden) return null;
  return (
    <div className="no-print flex items-start gap-2 bg-amber-100 px-4 py-2 text-xs text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <p className="flex-1">{t("mockBanner")}</p>
      <button type="button" onClick={() => setHidden(true)} aria-label={t("actions.close")}>
        <X className="size-3.5" />
      </button>
    </div>
  );
}
