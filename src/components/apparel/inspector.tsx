"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  Coins,
  Loader2,
  Pipette,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/studio/fields";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { COLOR_FAMILIES, PRESET_GARMENT_COLORS, findColorName } from "@/lib/apparel/colors-data";
import { PRINT_TECHNIQUES_META, checkTechniqueCompatibility } from "@/lib/apparel/techniques-data";
import { checkElements, type SportLeague } from "@/lib/apparel/rules";
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

function DesignSettings() {
  const t = useTranslations("apparel");
  const onError = useApiErrorToast();
  const queryClient = useQueryClient();
  const { canEdit, applyDesign, brandColors, template } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const [name, setName] = useState<string | null>(null);
  const [roster, setRoster] = useState(false);
  const [showColorPickerPopover, setShowColorPickerPopover] = useState(false);
  const [customHex, setCustomHex] = useState(design.garmentColor);

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
      void queryClient.invalidateQueries({ queryKey: qk.apparel(next.projectId) });
    },
    onError,
  });

  const commitName = () => {
    const value = name?.trim();
    setName(null);
    if (value && value !== design.name) update.mutate({ name: value.slice(0, 120) });
  };

  const handleEyeDropper = async () => {
    try {
      const EyeDropper = (
        window as Window & {
          EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> };
        }
      ).EyeDropper;
      if (!EyeDropper) return;
      const eyeDropper = new EyeDropper();
      const res = await eyeDropper.open();
      if (res?.sRGBHex) {
        update.mutate({ garmentColor: res.sRGBHex });
        setCustomHex(res.sRGBHex);
      }
    } catch {
      // User cancelled
    }
  };

  const currentColorName = findColorName(design.garmentColor);
  const popularColors = PRESET_GARMENT_COLORS.slice(0, 12);

  return (
    <>
      {/* 1. Titre & Nom */}
      <Section title="Tenue textile">
        <label className="text-muted-foreground grid gap-1 text-xs">
          Nom de la tenue
          <Input
            value={name ?? design.name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            maxLength={120}
            disabled={!canEdit}
            className="h-8 text-xs font-semibold"
          />
        </label>
        <div className="text-muted-foreground flex items-center justify-between pt-1 text-xs">
          <span>
            Support : <strong>{design.template.name}</strong>
          </span>
          <span className="text-[11px]">{template.zones.length} zones</span>
        </div>
      </Section>

      {/* 2. Couleur du tissu (Compact & Pro) */}
      <Section title="Couleur du tissu">
        <div className="space-y-2">
          {/* Active color header with Pipette */}
          <div className="border-border/80 bg-muted/30 flex items-center justify-between rounded-lg border p-2">
            <div className="flex items-center gap-2">
              <span
                className="ring-border/80 size-5 rounded-full border-2 border-white shadow-xs ring-1"
                style={{ backgroundColor: design.garmentColor }}
              />
              <span className="text-foreground text-xs font-bold">{currentColorName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {typeof window !== "undefined" && "EyeDropper" in window && (
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  title="Prélever à l'écran (Pipette)"
                  className="border-border/70 text-muted-foreground hover:bg-muted flex size-7 items-center justify-center rounded-md border transition"
                >
                  <Pipette className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowColorPickerPopover((prev) => !prev)}
                className="border-border/70 text-foreground hover:bg-muted rounded-md border px-2 py-1 text-[11px] font-semibold"
              >
                {showColorPickerPopover ? "Fermer" : "Plus..."}
              </button>
            </div>
          </div>

          {/* Color Popover if opened */}
          {showColorPickerPopover && (
            <div className="border-border/80 bg-card animate-in fade-in-0 space-y-2.5 rounded-xl border p-3 shadow-md duration-150">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.garmentColor}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    useApparel.getState().setDesign({ garmentColor: e.target.value });
                  }}
                  onBlur={() => update.mutate({ garmentColor: customHex })}
                  className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <Input
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      update.mutate({ garmentColor: e.target.value });
                    }
                  }}
                  placeholder="#000000"
                  className="h-8 font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          )}

          {/* Brand Colors if available */}
          {brandColors.length > 0 && canEdit && (
            <div className="space-y-1 pt-1">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="size-3" />
                Couleurs de marque :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {brandColors.map((color) => {
                  const active = design.garmentColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => update.mutate({ garmentColor: color })}
                      className={cn(
                        "size-6 rounded-full border shadow-2xs transition hover:scale-110",
                        active && "scale-105 ring-2 ring-[#0B6B4F] ring-offset-1",
                      )}
                      style={{ background: color }}
                      aria-label={color}
                      title={`Couleur marque: ${color}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Swatches */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {popularColors.map((c) => {
              const active = design.garmentColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => update.mutate({ garmentColor: c.hex })}
                  className={cn(
                    "size-6 rounded-full border shadow-2xs transition hover:scale-110",
                    active && "scale-105 ring-2 ring-[#0B6B4F] ring-offset-1",
                  )}
                  style={{ background: c.hex }}
                  aria-label={c.nameFr}
                  title={c.nameFr}
                />
              );
            })}
          </div>
        </div>
      </Section>

      {/* 3. Technique d'impression */}
      <Section title="Technique de marquage">
        <div className="space-y-2">
          <NativeSelect
            value={design.technique}
            onChange={(e) => update.mutate({ technique: e.target.value as ApparelDesignInput["technique"] })}
            disabled={!canEdit}
            className="h-9 text-xs font-semibold"
          >
            {TECHNIQUES.map((tech) => {
              const meta = PRINT_TECHNIQUES_META[tech];
              const { compatible } = checkTechniqueCompatibility(
                tech,
                design.template.category,
                design.garmentColor,
              );
              return (
                <option key={tech} value={tech} disabled={!compatible}>
                  {meta?.name ?? tech} {!compatible ? "(Incompatible)" : ""}
                </option>
              );
            })}
          </NativeSelect>

          {/* Quick summary of the selected technique */}
          {PRINT_TECHNIQUES_META[design.technique] && (
            <div className="bg-muted/40 text-muted-foreground space-y-1 rounded-lg p-2.5 text-xs">
              <p className="text-[11px] leading-tight">{PRINT_TECHNIQUES_META[design.technique].summary}</p>
              <div className="text-foreground border-border/40 flex items-center justify-between border-t pt-1 text-[10px] font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="text-muted-foreground size-3" />
                  {PRINT_TECHNIQUES_META[design.technique].turnaroundDays}
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="text-muted-foreground size-3" />
                  Tarif : {PRINT_TECHNIQUES_META[design.technique].priceTier}
                </span>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* 4. Règlements sportifs */}
      <Section title="Règlement & Homologation" defaultOpen={Boolean(design.rulePresetId)}>
        <NativeSelect
          value={design.rulePresetId ?? ""}
          onChange={(e) => update.mutate({ rulePresetId: e.target.value || null })}
          disabled={!canEdit}
          className="h-8 text-xs"
        >
          <option value="">Aucun règlement imposé</option>
          {presets.data?.presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
        {design.rulePreset && (
          <p className="text-muted-foreground pt-1 text-[11px]">
            Contrôle automatique des cotes de sponsors et numéros selon les normes de la ligue.
          </p>
        )}
      </Section>

      {/* 5. Effectif & Personnalisation joueurs */}
      <Section title="Effectif de l'équipe">
        <p className="text-muted-foreground text-xs">
          Roster avec noms de joueurs, numéros de maillots et répartition des tailles.
        </p>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRoster(true)}
            className="w-full text-xs font-semibold"
          >
            <Users className="size-3.5" />
            Gérer l&apos;effectif ({design.roster?.entries?.length ?? 0} joueurs)
          </Button>
        )}
      </Section>

      {roster && <RosterDialog onClose={() => setRoster(false)} />}
    </>
  );
}

function IssueList({
  issues,
  onSelect,
}: Readonly<{ issues: ApparelIssue[]; onSelect(issue: ApparelIssue): void }>) {
  return (
    <ul className="grid gap-1.5">
      {issues.map((issue) => {
        const Icon = issue.severity === "error" ? CircleAlert : AlertTriangle;
        return (
          <li key={`${issue.code}-${issue.elementId ?? issue.zoneKey ?? ""}-${issue.message}`}>
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

  const live = useMemo(() => {
    const code = design.rulePreset?.code?.toUpperCase() ?? "";
    let league: SportLeague = "NONE";
    if (code.includes("FOOTBALL") || code.includes("UEFA") || code.includes("FIFA")) league = "UEFA";
    else if (code.includes("FFF")) league = "FFF";
    else if (code.includes("FIBA") || code.includes("BASKET")) league = "FIBA";
    else if (code.includes("NBA")) league = "NBA";
    return checkElements(template.zones, elements, design.technique, design.garmentColor, league);
  }, [template.zones, elements, design.technique, design.garmentColor, design.rulePreset?.code]);

  const errors = live.filter((i) => i.severity === "error");
  const warnings = live.filter((i) => i.severity === "warning");

  // Calculate live score (out of 100)
  const auditScore = Math.max(0, 100 - errors.length * 25 - warnings.length * 8);

  const full = useMutation({
    mutationFn: async () => {
      await flush();
      return api.apparel.check(design.id);
    },
    onSuccess: (result) => {
      const local = (issues: ApparelIssue[]) =>
        issues.map((i) => ({ ...i, elementId: localId(i.elementId) }));
      setReport({ ...result, errors: local(result.errors), warnings: local(result.warnings) });
    },
    onError,
  });

  const reveal = (issue: ApparelIssue) => {
    const state = useApparel.getState();
    const el = issue.elementId ? state.elements.find((e) => e.id === issue.elementId) : undefined;
    const zone = template.zones.find((z) => z.key === (el?.zoneKey ?? issue.zoneKey));
    if (zone && zone.view !== state.view) state.setView(zone.view);
    if (el) state.select(el.id);
    else if (zone) state.setTargetZone(zone.key);
  };

  return (
    <Section title="Contrôles & Conformité BAT">
      {/* Score gauge banner */}
      <div className="border-border/80 bg-muted/30 flex items-center justify-between rounded-xl border p-2.5">
        <div>
          <span className="text-muted-foreground block text-[11px]">Score d&apos;homologation :</span>
          <span
            className={cn(
              "text-sm font-extrabold",
              auditScore >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600",
            )}
          >
            {auditScore}/100 {auditScore >= 90 ? "· Conforme" : "· À vérifier"}
          </span>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <ShieldCheck className="size-5" />
        </div>
      </div>

      {live.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" aria-hidden="true" />{" "}
          {elements.length ? "Tous les contrôles sont au vert" : "Prêt à accueillir vos éléments"}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            {t("summary", { errors: errors.length, warnings: warnings.length })}
          </p>
          <IssueList issues={[...errors, ...warnings]} onSelect={reveal} />
        </>
      )}

      {canEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => full.mutate()}
          disabled={full.isPending}
          className="w-full text-xs"
        >
          {full.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="size-3.5" />
          )}
          Vérification approfondie atelier
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
        </div>
      )}
    </Section>
  );
}

export function Inspector() {
  const el = useApparel((s) => s.elements.find((e) => e.id === s.selection));
  return (
    <div className="space-y-3 p-1">
      {el ? <ElementInspector el={el} /> : <DesignSettings />}
      <ChecksPanel />
    </div>
  );
}
