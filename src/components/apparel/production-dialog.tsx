"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CircleAlert, Download, FlipHorizontal2, Loader2, PackageCheck } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">{t("support")}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRINT_SUPPORTS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={support === id}
                onClick={() => choose(id)}
                className={cn(
                  "hover:border-primary grid gap-0.5 rounded-lg border p-2.5 text-left transition",
                  support === id && "border-primary bg-primary/5",
                )}
              >
                <span className="text-sm font-medium">{t(`supports.${id}.label`)}</span>
                <span className="text-muted-foreground text-[11px] leading-snug">
                  {t(`supports.${id}.hint`)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 rounded-lg border p-3">
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
                  className="w-48"
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
                    className="h-8 w-24"
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

        {entries.length ? (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("players", { count: chosen, total: entries.length })}
            </legend>
            <div className="grid max-h-44 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
              {entries.map((e) => (
                <label
                  key={e.id}
                  className="hover:bg-muted flex items-center gap-2 rounded px-1.5 py-1 text-sm"
                >
                  <Checkbox
                    checked={selection ? selection.has(e.id) : true}
                    onCheckedChange={(on) => toggle(e.id, Boolean(on))}
                  />
                  <span className="w-7 text-right font-semibold tabular-nums">{e.number ?? "—"}</span>
                  <span className="truncate">{e.displayName}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {e.size}
                    {e.quantity > 1 ? ` ×${e.quantity}` : ""}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">{t("playersHint")}</p>
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
                className="h-8 w-20"
              />
              <NativeSelect
                aria-label={t("size")}
                value={copiesSize}
                onChange={(e) => setCopiesSize(e.target.value)}
                className="w-28"
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

        {job?.result && (
          <div className="grid gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
              <PackageCheck className="size-4" aria-hidden="true" />
              {t("ready", { pieces: job.result.pieces ?? 0, sheets: job.result.sheets ?? 0 })}
            </p>
            {warnings.length > 0 && (
              <ul className="grid gap-1 text-xs text-amber-700 dark:text-amber-400">
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
                className="justify-self-start"
                onClick={() => openDownload(job.result!.downloadUrl!)}
              >
                <Download /> {t("downloadAgain")}
              </Button>
            )}
          </div>
        )}
        {!available && <p className="text-muted-foreground text-xs">{t("serverOnly")}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button
            onClick={() => void run()}
            disabled={busy || !available || (entries.length > 0 && chosen === 0)}
          >
            {busy ? <Loader2 className="animate-spin" /> : <PackageCheck />}
            {busy ? t("working") : t("generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
