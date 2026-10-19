"use client";

import { useTranslations } from "next-intl";
import { Lock, ShieldAlert } from "lucide-react";

/** Avertissement et attestation horodatée exigés avant chaque export (§6.4). */
export function Attestation({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const t = useTranslations("signatures.security");
  return (
    <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <p className="flex gap-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t("notLegal")}
      </p>
      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{t("attest")}</span>
      </label>
      <p className="flex items-center gap-2 text-xs opacity-80">
        <Lock className="size-3.5" aria-hidden="true" />
        {t("private")}
      </p>
    </div>
  );
}
