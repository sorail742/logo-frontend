"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileImage, FileText, FileType2, Loader2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { SliderField } from "./fields";
import { waitForJob } from "@/hooks/use-job";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import { downloadBlob, svgToPngBlob, svgToStandalone } from "@/lib/render/export";
import { buildZip, type ZipEntry } from "@/lib/render/zip";
import { documentFonts } from "@/lib/studio/doc";
import { renderPage } from "@/lib/studio/render";
import { ensureFonts } from "@/lib/studio/text";
import type { DesignDoc } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";
import { useStudioContext } from "./context";

// Export : PNG et JPG produits dans le navigateur (toutes résolutions), PDF d'impression
// (taille réelle, fond perdu, traits de coupe) et SVG au texte vectorisé produits par le serveur.

type Format = "png" | "jpg" | "pdf" | "svg";

const FORMATS: { id: Format; icon: LucideIcon }[] = [
  { id: "png", icon: FileImage },
  { id: "jpg", icon: FileImage },
  { id: "pdf", icon: FileText },
  { id: "svg", icon: FileType2 },
];

function openDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Page sans son fond (PNG transparent). */
function withoutBackground(doc: DesignDoc): DesignDoc {
  return { ...doc, pages: doc.pages.map((p) => ({ ...p, background: { type: "none" } })) };
}

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const t = useTranslations("studio.export");
  const onError = useApiErrorToast();
  const { flush } = useStudioContext();
  const doc = useStudio((s) => s.doc);
  const meta = useStudio((s) => s.meta);
  const pageIndex = useStudio((s) => s.pageIndex);
  const [format, setFormat] = useState<Format>("png");
  const [scope, setScope] = useState<"all" | "current">("all");
  const [scale, setScale] = useState(2);
  const [transparent, setTransparent] = useState(false);
  const [quality, setQuality] = useState(90);
  const [cropMarks, setCropMarks] = useState(true);
  const [busy, setBusy] = useState(false);
  if (!doc || !meta) return null;

  const server = api.isAvailable("studioExport");
  const pages = scope === "current" || doc.pages.length === 1 ? [pageIndex] : doc.pages.map((_, i) => i);
  const base = slugify(meta.name) || "creation";
  const pixels = (s: number) => `${Math.round(doc.width * s)} × ${Math.round(doc.height * s)} px`;

  const run = async () => {
    setBusy(true);
    try {
      if (format === "png" || format === "jpg") {
        await ensureFonts(documentFonts(doc));
        const source = format === "png" && transparent ? withoutBackground(doc) : doc;
        const type = format === "png" ? "image/png" : "image/jpeg";
        const files: ZipEntry[] = [];
        for (const index of pages) {
          const svg = renderPage(source, index);
          const blob = await svgToPngBlob(svg, { size: Math.round(Math.max(doc.width, doc.height) * scale), type, quality: quality / 100, background: format === "png" && transparent ? null : undefined });
          files.push({ path: `${base}${pages.length > 1 ? `-${index + 1}` : ""}.${format}`, data: blob });
        }
        if (files.length === 1) downloadBlob(files[0]!.data as Blob, files[0]!.path);
        else downloadBlob(await buildZip(files), `${base}-${format}.zip`);
      } else if (format === "svg" && !server) {
        await ensureFonts(documentFonts(doc));
        const files: ZipEntry[] = [];
        for (const index of pages) files.push({ path: `${base}${pages.length > 1 ? `-${index + 1}` : ""}.svg`, data: await svgToStandalone(renderPage(doc, index)) });
        if (files.length === 1) downloadBlob(new Blob([files[0]!.data as string], { type: "image/svg+xml" }), files[0]!.path);
        else downloadBlob(await buildZip(files), `${base}-svg.zip`);
      } else {
        await flush();
        const { jobId } = await api.studio.requestExport(meta.id, { format: format === "pdf" ? "pdf" : "svg", pages: scope === "current" ? [pageIndex] : undefined, cropMarks: format === "pdf" && Boolean(doc.print) && cropMarks }, crypto.randomUUID());
        const job = await waitForJob(jobId);
        if (job.status !== "SUCCEEDED" || !job.result?.downloadUrl) throw new Error(job.error ?? t("failed"));
        openDownload(job.result.downloadUrl);
      }
      toast.success(t("done"));
      onOpenChange(false);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{doc.print ? t("printDescription", { width: doc.print.widthMm, height: doc.print.heightMm }) : t("description", { size: pixels(1) })}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t("format")}>
          {FORMATS.map(({ id, icon: Icon }) => {
            const disabled = id === "pdf" && !server;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={format === id}
                disabled={disabled}
                onClick={() => setFormat(id)}
                className={cn("grid place-items-center gap-1 rounded-xl border p-3 text-xs font-semibold uppercase transition disabled:opacity-40", format === id ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted")}
                title={disabled ? t("serverOnly") : undefined}
              >
                <Icon className="size-5" aria-hidden="true" />
                {id}
              </button>
            );
          })}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{t(`help.${format}`, { print: doc.print ? "yes" : "no" })}</p>

        {doc.pages.length > 1 && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5 text-xs" role="radiogroup" aria-label={t("pages")}>
            {(["all", "current"] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={scope === s} onClick={() => setScope(s)} className={cn("rounded-md py-1.5 transition", scope === s ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}>
                {s === "all" ? t("allPages", { count: doc.pages.length }) : t("currentPage", { number: pageIndex + 1 })}
              </button>
            ))}
          </div>
        )}

        {(format === "png" || format === "jpg") && (
          <div className="grid gap-3">
            <div className="grid grid-cols-4 gap-1.5">
              {[0.5, 1, 2, 3].map((s) => (
                <button key={s} type="button" onClick={() => setScale(s)} aria-pressed={scale === s} className={cn("rounded-lg border px-2 py-1.5 text-xs transition", scale === s ? "border-primary bg-primary/5 font-medium text-primary" : "hover:bg-muted")}>
                  ×{s}
                  <span className="block text-[10px] text-muted-foreground">{pixels(s)}</span>
                </button>
              ))}
            </div>
            {format === "png" && (
              <label className="flex items-center justify-between text-xs">
                {t("transparent")}
                <Switch checked={transparent} onCheckedChange={setTransparent} />
              </label>
            )}
            {format === "jpg" && <SliderField label={t("quality")} value={quality} min={50} max={100} format={(v) => `${v} %`} onChange={setQuality} />}
          </div>
        )}
        {format === "pdf" && doc.print && (
          <label className="flex items-center justify-between text-xs">
            {t("cropMarks")}
            <Switch checked={cropMarks} onCheckedChange={setCropMarks} />
          </label>
        )}

        <DialogFooter>
          <Button onClick={run} disabled={busy} size="lg">
            {busy ? <Loader2 className="animate-spin" /> : <Download />}
            {busy ? t("working") : t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

