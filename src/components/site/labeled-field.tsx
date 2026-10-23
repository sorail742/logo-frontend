import type { ReactNode } from "react";

/** Champ dont le libellé englobe la saisie : le libellé nomme le champ sans identifiant à gérer. */
export function LabeledField({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-sm leading-none font-medium select-none">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
