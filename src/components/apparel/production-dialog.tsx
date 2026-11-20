"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  Download,
  Flame,
  FlipHorizontal2,
  Gauge,
  Layers,
  Loader2,
  PackageCheck,
  Printer,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/common/native-select";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { waitForJob } from "@/hooks/use-job";
import { api } from "@/lib/api";
import {
  PRINT_SUPPORTS,
  SUPPORT_DEFAULTS,
  TECHNIQUE_SUPPORT,
  type PrintSupport,
  type ProductionExportInput,
  type SheetFormat,
} from "@/lib/apparel/types";
import type { GenerationJob } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useApparel } from "@/stores/apparel";
import { useApparelEditor } from "./editor";

// Pack atelier : ce n'est pas le maillot qui sort de l'imprimante, mais le support posé ensuite
// sous la presse (film DTF, papier transfert, papier sublimation, flex découpé, films de
// sérigraphie). L'API prépare tous les fichiers ; on choisit ici le support et ses réglages.

const SHEETS: SheetFormat[] = ["A4", "A3", "A3_PLUS", "ROLL"];
/** Le pack peut être long (planches PNG à 300 dpi pour tout l'effectif). */
const PACK_TIMEOUT_MS = 10 * 60_000;

interface PressSpecs {
  temp: string;
  time: string;
  pressure: string;
  peel: string;
}

const PRESS_SPECS: Record<PrintSupport, PressSpecs> = {
  DTF_FILM: { temp: "155 °C", time: "15 s", pressure: "4.5 bar", peel: "À chaud / tiède" },
  FLEX: { temp: "160 °C", time: "15 s", pressure: "4.0 bar", peel: "À tiède" },
  FLOCK: { temp: "160 °C", time: "20 s", pressure: "4.5 bar", peel: "À froid" },
  SUBLIMATION_PAPER: { temp: "200 °C", time: "45 s", pressure: "5.0 bar", peel: "À chaud" },
  TRANSFER_LIGHT: { temp: "185 °C", time: "20 s", pressure: "4.0 bar", peel: "À chaud" },
  TRANSFER_DARK: { temp: "175 °C", time: "25 s", pressure: "4.0 bar", peel: "À froid" },
  SCREEN_FILM: { temp: "160 °C", time: "Tunnel IR", pressure: "Raclage", peel: "Polymérisation" },
  DTG: { temp: "160 °C", time: "60 s", pressure: "Légère", peel: "Direct tissu" },
  EMBROIDERY: { temp: "—", time: "—", pressure: "Tension fil", peel: "Numérisation" },
};

function openDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function Row({ label, hint, children }: Readonly<{ label: string; hint?: string; children: ReactNode }>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="grid gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function ProductionDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange(open: boolean): void }>) {
  const t = useTranslations("apparel.production");
  const onError = useApiErrorToast();
  const { template, flush } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const entries = (design.roster?.entries ?? []).filter((e): e is typeof e & { id: string } => Boolean(e.id));
  const [support, setSupport] = useState<PrintSupport>(TECHNIQUE_SUPPORT[design.technique]);
  const defaults = SUPPORT_DEFAULTS[support];
  const [mirror, setMirror] = useState(defaults.mirror);
  const [sheet, setSheet] = useState<SheetFormat>(defaults.sheet ?? "A3");
  const [rollWidth, setRollWidth] = useState(defaults.rollWidthMm ?? 580);
  const [cutMarks, setCutMarks] = useState(defaults.cutMarks);
  const [selection, setSelection] = useState<Set<string> | null>(null);
  const [copies, setCopies] = useState(1);
  const [copiesSize, setCopiesSize] = useState(
    template.sizes.find((s) => s.label === "M")?.label ?? template.sizes[0]?.label ?? "M",
  );
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const available = api.isAvailable("productionPack");

  const choose = (next: PrintSupport) => {
    const d = SUPPORT_DEFAULTS[next];
    setSupport(next);
    setMirror(d.mirror);
    if (d.sheet) setSheet(d.sheet);
    if (d.rollWidthMm) setRollWidth(d.rollWidthMm);
    setCutMarks(d.cutMarks);
    setJob(null);
  };

  const toggle = (id: string, on: boolean) => {
    const next = new Set(selection ?? entries.map((e) => e.id));
    if (on) next.add(id);
    else next.delete(id);
    setSelection(next);
  };

  const run = async () => {
    setBusy(true);
    setJob(null);
    try {
      await flush();
      const input: ProductionExportInput = {
        support,
        mirror,
        cutMarks,
        ...(defaults.sheet && { sheetFormat: sheet, ...(sheet === "ROLL" && { rollWidthMm: rollWidth }) }),
        ...(entries.length ? selection && { entryIds: [...selection] } : { copies, copiesSize }),
      };
      const { jobId } = await api.apparel.productionExport(design.id, input, crypto.randomUUID());
      const done = await waitForJob(jobId, PACK_TIMEOUT_MS);
      if (done.status !== "SUCCEEDED" || !done.result?.downloadUrl)
        throw new Error(done.error ?? t("failed"));
      setJob(done);
      openDownload(done.result.downloadUrl);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const chosen = selection?.size ?? entries.length;
  const warnings = job?.result?.warnings ?? [];
  const press = PRESS_SPECS[support] ?? PRESS_SPECS.DTF_FILM;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
              <Printer className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
              <DialogDescription className="text-xs">{t("description")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* PRE-FLIGHT CHECKLIST CARDS (Ultra-Pro Atelier) */}
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
              <span>Résolution</span>
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">300 DPI</p>
            <p className="text-muted-foreground text-[10px]">Contours vectorisés</p>
          </div>

          <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
              <span>Marges sécurité</span>
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">15 mm</p>
            <p className="text-muted-foreground text-[10px]">Coutures & cols</p>
          </div>

          <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
              <span>Mode Miroir</span>
              <span className={cn("size-2 rounded-full", mirror ? "bg-emerald-500" : "bg-slate-300")} />
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              {mirror ? "Inversion Active" : "Direct Normal"}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {mirror ? "Indispensable DTF/flex" : "Standard"}
            </p>
          </div>

          <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
              <span>Effectif</span>
              <Layers className="text-primary size-3.5" />
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              {entries.length > 0 ? `${chosen} / ${entries.length} joueurs` : `${copies} ex. (${copiesSize})`}
            </p>
            <p className="text-muted-foreground text-[10px]">Fichiers individualisés</p>
          </div>
        </div>

        {/* CHOIX DU SUPPORT D'IMPRESSION */}
        <fieldset className="grid gap-2">
          <legend className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
            {t("support")}
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRINT_SUPPORTS.map((id) => {
              const isSelected = support === id;
              const isRecommended = TECHNIQUE_SUPPORT[design.technique] === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => choose(id)}
                  className={cn(
                    "glow-card group relative flex flex-col justify-between gap-1 rounded-xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-primary/20 shadow-xs ring-1"
                      : "bg-card hover:border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs leading-tight font-bold">{t(`supports.${id}.label`)}</span>
                    {isRecommended && (
                      <Badge variant="outline" className="text-primary text-[9px] font-bold">
                        Conseillé
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground text-[10px] leading-snug">
                    {t(`supports.${id}.hint`)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* PARAMÈTRES TECHNIQUES PRESSE & ATELIER (2 COLONNES) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* COLONNE GAUCHE : OPTIONS MIROIR & PLANCHE */}
          <div className="glow-card bg-card grid content-start gap-3 rounded-xl border p-3 shadow-2xs">
            <h3 className="text-foreground text-xs font-bold">Réglages du Support</h3>
            <Row label={t("mirror")} hint={t(defaults.mirror ? "mirrorAdvised" : "mirrorNotAdvised")}>
              <span className="flex items-center gap-2">
                <FlipHorizontal2 className="text-muted-foreground size-4" aria-hidden="true" />
                <Switch checked={mirror} onCheckedChange={setMirror} aria-label={t("mirror")} />
              </span>
            </Row>

            {defaults.sheet && (
              <Row label={t("sheet")} hint={t("sheetHint")}>
                <span className="flex items-center gap-2">
                  <NativeSelect
                    aria-label={t("sheet")}
                    value={sheet}
                    onChange={(e) => setSheet(e.target.value as SheetFormat)}
                    className="w-36 text-xs"
                  >
                    {SHEETS.map((s) => (
                      <option key={s} value={s}>
                        {t(`sheets.${s}`)}
                      </option>
                    ))}
                  </NativeSelect>
                  {sheet === "ROLL" && (
                    <Input
                      type="number"
                      aria-label={t("rollWidth")}
                      title={t("rollWidth")}
                      min={100}
                      max={1600}
                      value={rollWidth}
                      onChange={(e) =>
                        setRollWidth(Math.min(1600, Math.max(100, Number(e.target.value) || 100)))
                      }
                      className="h-8 w-20 text-xs"
                    />
                  )}
                </span>
              </Row>
            )}

            {defaults.sheet && (
              <Row label={t("cutMarks")} hint={t("cutMarksHint")}>
                <Switch checked={cutMarks} onCheckedChange={setCutMarks} aria-label={t("cutMarks")} />
              </Row>
            )}
          </div>

          {/* COLONNE DROITE : PARAMÈTRES TECHNIQUES MACHINE DE POSE */}
          <div className="glow-card bg-card grid content-start gap-2 rounded-xl border p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground flex items-center gap-1.5 text-xs font-bold">
                <Flame className="size-3.5 text-amber-500" />
                Presse Thermique Atelier
              </h3>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {support}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/60 rounded-lg p-2">
                <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                  Température
                </span>
                <span className="text-foreground font-mono text-base font-bold">{press.temp}</span>
                <span className="text-muted-foreground block text-[9px]">± 2 °C tolérance</span>
              </div>

              <div className="bg-muted/60 rounded-lg p-2">
                <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                  Temps de pose
                </span>
                <span className="text-foreground font-mono text-base font-bold">{press.time}</span>
                <span className="text-muted-foreground block text-[9px]">Chrono automatique</span>
              </div>

              <div className="bg-muted/60 rounded-lg p-2">
                <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                  Pression
                </span>
                <span className="text-foreground font-mono text-base font-bold">{press.pressure}</span>
                <span className="text-muted-foreground block text-[9px]">Pneumatique / manuelle</span>
              </div>

              <div className="bg-muted/60 rounded-lg p-2">
                <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                  Pelage du film
                </span>
                <span className="text-foreground font-mono text-base font-bold">{press.peel}</span>
                <span className="text-muted-foreground block text-[9px]">Consigne opérateur</span>
              </div>
            </div>
          </div>
        </div>

        {/* LISTE DES JOUEURS DU ROSTER OU COPIES SIMPLES */}
        {entries.length ? (
          <fieldset className="grid gap-2">
            <legend className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
              {t("players", { count: chosen, total: entries.length })}
            </legend>
            <div className="bg-card grid max-h-40 gap-1.5 overflow-y-auto rounded-xl border p-2 sm:grid-cols-2">
              {entries.map((e) => (
                <label
                  key={e.id}
                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition"
                >
                  <Checkbox
                    checked={selection ? selection.has(e.id) : true}
                    onCheckedChange={(on) => toggle(e.id, Boolean(on))}
                  />
                  <span className="text-primary w-8 text-right font-mono font-bold">
                    {e.number ? `#${e.number}` : "—"}
                  </span>
                  <span className="truncate font-medium">{e.displayName}</span>
                  <span className="text-muted-foreground ml-auto font-mono text-[11px]">
                    {e.size}
                    {e.quantity > 1 ? ` ×${e.quantity}` : ""}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-muted-foreground text-[11px]">{t("playersHint")}</p>
          </fieldset>
        ) : (
          <Row label={t("copies")} hint={t("copiesHint")}>
            <span className="flex items-center gap-2">
              <Input
                type="number"
                aria-label={t("copies")}
                min={1}
                max={1000}
                value={copies}
                onChange={(e) => setCopies(Math.min(1000, Math.max(1, Number(e.target.value) || 1)))}
                className="h-8 w-20 text-xs"
              />
              <NativeSelect
                aria-label={t("size")}
                value={copiesSize}
                onChange={(e) => setCopiesSize(e.target.value)}
                className="w-28 text-xs"
              >
                {template.sizes.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </span>
          </Row>
        )}

        {/* RÉSULTAT DU PACK GÉNÉRÉ */}
        {job?.result && (
          <div className="glow-card grid gap-2 rounded-xl bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <PackageCheck className="size-5" aria-hidden="true" />
              {t("ready", { pieces: job.result.pieces ?? 0, sheets: job.result.sheets ?? 0 })}
            </p>
            {warnings.length > 0 && (
              <ul className="grid gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                {warnings.map((w) => (
                  <li key={w} className="flex gap-1.5">
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {w}
                  </li>
                ))}
              </ul>
            )}
            {job.result.downloadUrl && (
              <Button
                variant="outline"
                size="sm"
                className="justify-self-start font-semibold text-emerald-900 dark:text-emerald-100"
                onClick={() => openDownload(job.result!.downloadUrl!)}
              >
                <Download className="size-4" /> {t("downloadAgain")}
              </Button>
            )}
          </div>
        )}
        {!available && <p className="text-muted-foreground text-xs">{t("serverOnly")}</p>}

        <DialogFooter className="mt-2 border-t pt-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button
            onClick={() => void run()}
            disabled={busy || !available || (entries.length > 0 && chosen === 0)}
            className="shadow-sm"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
            {busy ? t("working") : t("generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
