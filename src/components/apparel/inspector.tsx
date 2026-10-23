"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, CircleAlert, Loader2, ShieldCheck, Upload, Users } from "lucide-react";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/studio/fields";
import { ColorField } from "@/components/studio/paint-picker";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { GARMENT_COLORS } from "@/lib/apparel/defaults";
import { checkElements } from "@/lib/apparel/rules";
import {
  TECHNIQUES,
  type ApparelCheck,
  type ApparelDesignInput,
  type ApparelIssue,
} from "@/lib/apparel/types";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useApparel } from "@/stores/apparel";
import { useApparelEditor } from "./editor";
import { ElementInspector } from "./element-inspector";
import { RosterDialog } from "./roster-dialog";

// Panneau de droite : réglages de l'élément sélectionné, sinon ceux de la tenue (technique,
// tissu, règlement, effectif) ; contrôles de conformité en direct et contrôle complet de l'API.

function DesignSettings() {
  const t = useTranslations("apparel");
  const onError = useApiErrorToast();
  const queryClient = useQueryClient();
  const { canEdit, applyDesign, brandColors } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const [name, setName] = useState<string | null>(null);
  const [roster, setRoster] = useState(false);
  const presets = useQuery({
    queryKey: qk.apparelPresets,
    queryFn: () => api.apparel.rulePresets(),
    staleTime: 10 * 60_000,
  });

  const update = useMutation({
    mutationFn: (patch: Partial<Omit<ApparelDesignInput, "templateId">>) =>
      api.apparel.update(design.id, patch),
    onMutate: (patch) => useApparel.getState().setDesign(patch),
    onSuccess: (next) => {
      applyDesign(next);
      queryClient.invalidateQueries({ queryKey: qk.apparel(next.projectId) });
    },
    onError,
  });

  const commitName = () => {
    const value = name?.trim();
    setName(null);
    if (value && value !== design.name) update.mutate({ name: value.slice(0, 120) });
  };

  return (
    <>
      <Section title={t("settings.design")}>
        <label className="text-muted-foreground grid gap-1 text-xs">
          {t("settings.name")}
          <Input
            value={name ?? design.name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            maxLength={120}
            disabled={!canEdit}
          />
        </label>
        <p className="text-muted-foreground text-xs">
          {t("settings.support", { name: design.template.name })}
        </p>
      </Section>
      <Section title={t("settings.technique")}>
        <NativeSelect
          value={design.technique}
          onChange={(e) => update.mutate({ technique: e.target.value as ApparelDesignInput["technique"] })}
          disabled={!canEdit}
          aria-label={t("settings.technique")}
        >
          {TECHNIQUES.map((tech) => (
            <option key={tech} value={tech}>
              {t(`techniques.${tech}.name`)}
            </option>
          ))}
        </NativeSelect>
        <p className="text-muted-foreground text-[11px]">{t(`techniques.${design.technique}.hint`)}</p>
      </Section>
      <Section title={t("settings.fabric")}>
        <div className="grid grid-cols-9 gap-1" role="group" aria-label={t("settings.fabric")}>
          {GARMENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              disabled={!canEdit}
              aria-pressed={design.garmentColor.toLowerCase() === color}
              aria-label={color}
              title={color}
              onClick={() => update.mutate({ garmentColor: color })}
              className={cn(
                "aspect-square rounded-full border shadow-xs transition hover:scale-110",
                design.garmentColor.toLowerCase() === color &&
                  "ring-primary ring-offset-background ring-2 ring-offset-2",
              )}
              style={{ background: color }}
            />
          ))}
        </div>
        {canEdit && (
          <ColorField
            value={design.garmentColor}
            onChange={(color, final) =>
              final
                ? update.mutate({ garmentColor: color })
                : useApparel.getState().setDesign({ garmentColor: color })
            }
          />
        )}
        {brandColors.length > 0 && canEdit && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px]">{t("settings.brandColors")}</span>
            {brandColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => update.mutate({ garmentColor: color })}
                className="size-5 rounded-full border shadow-xs"
                style={{ background: color }}
                aria-label={color}
                title={color}
              />
            ))}
          </div>
        )}
      </Section>
      <Section title={t("settings.rules")} defaultOpen={Boolean(design.rulePresetId)}>
        <NativeSelect
          value={design.rulePresetId ?? ""}
          onChange={(e) => update.mutate({ rulePresetId: e.target.value || null })}
          disabled={!canEdit}
          aria-label={t("settings.rules")}
        >
          <option value="">{t("settings.noRules")}</option>
          {presets.data?.presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
        {presets.data && <p className="text-muted-foreground text-[11px]">{presets.data.disclaimer}</p>}
      </Section>
      <Section title={t("roster.title")} defaultOpen={Boolean(design.roster)}>
        {design.roster ? (
          <p className="flex items-center gap-2 text-xs">
            <Users className="text-primary size-4" aria-hidden="true" />
            {t("roster.summary", {
              name: design.roster.name,
              players: design.roster.entries.length,
              garments: design.roster.entries.reduce((n, e) => n + e.quantity, 0),
            })}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">{t("roster.empty")}</p>
        )}
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setRoster(true)}>
            <Upload /> {t("roster.import")}
          </Button>
        )}
      </Section>
      {roster && <RosterDialog onClose={() => setRoster(false)} />}
    </>
  );
}

function IssueList({ issues, onSelect }: { issues: ApparelIssue[]; onSelect(issue: ApparelIssue): void }) {
  return (
    <ul className="grid gap-1.5">
      {issues.map((issue, i) => {
        const Icon = issue.severity === "error" ? CircleAlert : AlertTriangle;
        return (
          <li key={`${issue.code}-${issue.elementId ?? issue.zoneKey ?? ""}-${i}`}>
            <button
              type="button"
              onClick={() => onSelect(issue)}
              className={cn(
                "hover:bg-muted flex w-full gap-2 rounded-lg border p-2 text-left text-xs transition",
                issue.severity === "error" ? "border-destructive/30" : "border-amber-500/30",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-3.5 shrink-0",
                  issue.severity === "error" ? "text-destructive" : "text-amber-600",
                )}
                aria-hidden="true"
              />
              <span>{issue.message}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ChecksPanel() {
  const t = useTranslations("apparel.checks");
  const onError = useApiErrorToast();
  const { template, canEdit, flush, localId } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const elements = useApparel((s) => s.elements);
  const [report, setReport] = useState<ApparelCheck | null>(null);
  const live = useMemo(
    () => checkElements(template.zones, elements, design.technique, design.garmentColor),
    [template.zones, elements, design.technique, design.garmentColor],
  );
  const errors = live.filter((i) => i.severity === "error");
  const warnings = live.filter((i) => i.severity === "warning");
  const screens = useMemo(() => new Set(elements.flatMap((el) => el.content.colors ?? [])).size, [elements]);

  const full = useMutation({
    mutationFn: async () => {
      await flush();
      return api.apparel.check(design.id);
    },
    // Les anomalies désignent les éléments enregistrés : ramenées aux identifiants de l'éditeur.
    onSuccess: (result) => {
      const local = (issues: ApparelIssue[]) =>
        issues.map((i) => ({ ...i, elementId: localId(i.elementId) }));
      setReport({ ...result, errors: local(result.errors), warnings: local(result.warnings) });
    },
    onError,
  });

  /** Anomalie d'un élément : vue et sélection de l'élément. */
  const reveal = (issue: ApparelIssue) => {
    const state = useApparel.getState();
    const el = issue.elementId ? state.elements.find((e) => e.id === issue.elementId) : undefined;
    const zone = template.zones.find((z) => z.key === (el?.zoneKey ?? issue.zoneKey));
    if (zone && zone.view !== state.view) state.setView(zone.view);
    if (el) state.select(el.id);
    else if (zone) state.setTargetZone(zone.key);
  };

  return (
    <Section title={t("title")}>
      {live.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" aria-hidden="true" /> {elements.length ? t("ok") : t("empty")}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            {t("summary", { errors: errors.length, warnings: warnings.length })}
          </p>
          <IssueList issues={[...errors, ...warnings]} onSelect={reveal} />
        </>
      )}
      {design.technique === "SCREEN_PRINT" && screens > 0 && (
        <p className="text-muted-foreground text-xs">{t("screens", { count: screens })}</p>
      )}
      {canEdit && (
        <Button size="sm" variant="outline" onClick={() => full.mutate()} disabled={full.isPending}>
          {full.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />} {t("full")}
        </Button>
      )}
      {report && (
        <div className="grid gap-2 rounded-lg border p-2.5">
          <p
            className={cn(
              "text-xs font-medium",
              report.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {report.ok
              ? t("fullOk", { size: report.referenceSize })
              : t("fullErrors", { count: report.errors.length })}
          </p>
          {report.errors.length + report.warnings.length > 0 && (
            <IssueList issues={[...report.errors, ...report.warnings]} onSelect={reveal} />
          )}
          {report.disclaimer && <p className="text-muted-foreground text-[11px]">{report.disclaimer}</p>}
        </div>
      )}
    </Section>
  );
}

export function Inspector() {
  const el = useApparel((s) => s.elements.find((e) => e.id === s.selection));
  return (
    <div>
      {el ? <ElementInspector el={el} /> : <DesignSettings />}
      <ChecksPanel />
    </div>
  );
}
