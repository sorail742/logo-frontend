"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck, Info, TriangleAlert, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkDesign, fixAll, qualityScore, type QualityIssue } from "@/lib/studio/quality";
import { useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";
import { useStudioContext } from "../context";

// Contrôle qualité en continu : score, problèmes par gravité, corrections en un clic.

const SEVERITY = {
  error: { icon: CircleAlert, className: "text-destructive" },
  warning: { icon: TriangleAlert, className: "text-amber-600 dark:text-amber-400" },
  info: { icon: Info, className: "text-sky-600 dark:text-sky-400" },
} as const;

export function useQuality() {
  const doc = useStudio((s) => s.doc);
  const { brand } = useStudioContext();
  return useMemo(() => (doc ? checkDesign(doc, brand) : []), [doc, brand]);
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? "stroke-emerald-500" : score >= 60 ? "stroke-amber-500" : "stroke-destructive";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} className={cn("fill-none transition-all", color)} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
    </svg>
  );
}

export function CheckPanel() {
  const t = useTranslations("studio.check");
  const issues = useQuality();
  const score = qualityScore(issues);
  const fixable = issues.filter((i) => i.fix);
  const state = useStudio.getState();

  const show = (issue: QualityIssue) => {
    if (state.pageIndex !== issue.pageIndex) state.setPage(issue.pageIndex);
    if (issue.elementId) state.select([issue.elementId]);
  };
  const fix = (issue: QualityIssue) => {
    state.change((d) => issue.fix!(d));
    toast.success(t("fixed"));
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 rounded-xl border p-3">
        <div className="relative">
          <ScoreRing score={score} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{score}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{score >= 85 ? t("great") : score >= 60 ? t("good") : t("needsWork")}</p>
          <p className="text-[11px] text-muted-foreground">{t("summary", { errors: issues.filter((i) => i.severity === "error").length, warnings: issues.filter((i) => i.severity === "warning").length })}</p>
        </div>
      </div>
      {fixable.length > 1 && (
        <Button
          onClick={() => {
            state.change((d) => fixAll(d, fixable));
            toast.success(t("fixedAll", { count: fixable.length }));
          }}
        >
          <Wand2 />
          {t("fixAll", { count: fixable.length })}
        </Button>
      )}
      {!issues.length ? (
        <div className="grid place-items-center gap-2 py-6 text-center">
          <CircleCheck className="size-8 text-emerald-500" aria-hidden="true" />
          <p className="text-sm font-medium">{t("perfect")}</p>
          <p className="text-xs text-muted-foreground">{t("perfectBody")}</p>
        </div>
      ) : (
        <ul className="grid gap-1.5">
          {issues.map((issue) => {
            const { icon: Icon, className } = SEVERITY[issue.severity];
            return (
              <li key={issue.id} className="grid gap-1.5 rounded-lg border p-2.5">
                <div className="flex gap-2">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{t(`codes.${issue.code}.title`, issue.params ?? {})}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{t(`codes.${issue.code}.body`, issue.params ?? {})}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <span className="mr-auto self-center text-[10px] text-muted-foreground">{t("page", { number: issue.pageIndex + 1 })}</span>
                  {issue.elementId && (
                    <Button variant="ghost" size="xs" onClick={() => show(issue)}>
                      {t("show")}
                    </Button>
                  )}
                  {issue.fix && (
                    <Button variant="outline" size="xs" onClick={() => fix(issue)}>
                      {t("fix")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
