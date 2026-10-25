"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileImage, Loader2, Package, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/common/button-link";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { waitForJob } from "@/hooks/use-job";
import { api, type ApiClient } from "@/lib/api";
import { downloadBlob, downloadSvg, svgToPngBlob } from "@/lib/render/export";
import { iconPackEntries, socialSvg, SOCIAL_KIT, type SocialFormat } from "@/lib/render/logo-assets";
import { renderLogoSvg } from "@/lib/render/logo";
import { buildZip } from "@/lib/render/zip";
import { slugify } from "@/lib/format";
import type { LogoSpec } from "@/lib/types";

export const FREE_WATERMARK = "Marka · version gratuite";

function ExportItem({ id, label, onClick, busy }: { id: string; label: string; onClick: () => void; busy: string | null }) {
  return (
    <Button variant="outline" className="justify-start" onClick={onClick} disabled={Boolean(busy)}>
      {busy === id ? <Loader2 className="animate-spin" /> : <Download />}
      {label}
    </Button>
  );
}

type ExportInput = Parameters<ApiClient["logos"]["requestExport"]>[1];

/** Ouvre le lien signé de l'archive : l'API le sert en pièce jointe. */
function openDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * `saved` : la spec affichée est la dernière version enregistrée. L'export serveur porte sur
 * cette version ; une modification en cours doit d'abord être enregistrée.
 */
export function ExportPanel({ spec, logoId, isFree, saved = true }: { spec: LogoSpec; logoId: string; isFree: boolean; saved?: boolean }) {
  const t = useTranslations("logos.export");
  const tSocial = useTranslations("logos.export.socialFormats");
  const onError = useApiErrorToast();
  const [busy, setBusy] = useState<string | null>(null);
  const base = slugify(spec.text) || "logo";

  const run = async (id: string, task: () => Promise<void>) => {
    setBusy(id);
    try {
      await task();
      toast.success(t("done"));
    } catch (error) {
      onError(error);
    } finally {
      setBusy(null);
    }
  };

  const png = (size: number, type: "image/png" | "image/jpeg" = "image/png") =>
    run(`${type}-${size}`, async () => {
      const { svg } = renderLogoSvg(spec, { watermark: isFree ? FREE_WATERMARK : null });
      const blob = await svgToPngBlob(svg, { size, padding: 0.06, type, background: type === "image/jpeg" ? spec.colors.background : null });
      downloadBlob(blob, `${base}-${size}.${type === "image/jpeg" ? "jpg" : "png"}`);
    });

  const social = (format: SocialFormat) =>
    run(`social-${format.id}`, async () => {
      const blob = await svgToPngBlob(socialSvg(spec, format), { size: Math.max(format.width, format.height) });
      downloadBlob(blob, `${base}-${format.file}.png`);
    });

  const server = (id: string, input: ExportInput) =>
    run(id, async () => {
      const { jobId } = await api.logos.requestExport(logoId, input);
      const job = await waitForJob(jobId);
      if (job.status !== "SUCCEEDED" || !job.result?.downloadUrl) throw new Error(job.error ?? t("serverFailed"));
      openDownload(job.result.downloadUrl);
    });

  const pdf = () => {
    if (api.mode === "mock") return void toast.info(t("pdfServer"));
    if (!saved) return void toast.info(t("saveFirst"));
    server("pdf", { formats: ["pdf"], iconPack: false, social: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("title")}</CardTitle>
        <CardDescription className="text-xs">{t("previewNote")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isFree ? (
          <>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">{t("watermark")}</p>
            <ExportItem busy={busy} id="image/png-512" label={t("png", { size: 512 })} onClick={() => png(512)} />
            <ButtonLink href="/app/facturation" size="lg">
              {t("upgrade")}
            </ButtonLink>
          </>
        ) : (
          <>
            <div className="grid gap-2">
              <ExportItem busy={busy} id="svg" label={t("svg")} onClick={() => run("svg", () => downloadSvg(renderLogoSvg(spec).svg, `${base}.svg`))} />
              {[512, 1024, 2048].map((size) => (
                <ExportItem busy={busy} key={size} id={`image/png-${size}`} label={t("png", { size })} onClick={() => png(size)} />
              ))}
              <ExportItem busy={busy} id="image/jpeg-1024" label={t("jpg")} onClick={() => png(1024, "image/jpeg")} />
              <ExportItem busy={busy} id="pdf" label={t("pdf")} onClick={pdf} />
            </div>
            {api.mode === "http" && (
              <div className="grid gap-2 border-t pt-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Package className="size-4" aria-hidden="true" />
                  {t("zipAll")}
                </p>
                <p className="text-xs text-muted-foreground">{saved ? t("zipAllBody") : t("saveFirst")}</p>
                <Button
                  onClick={() => server("zip", { formats: ["svg", "pdf", "png", "jpg"], sizes: [512, 1024, 2048], iconPack: true, social: true })}
                  disabled={Boolean(busy) || !saved}
                >
                  {busy === "zip" ? <Loader2 className="animate-spin" /> : <Download />}
                  {t("zipAllButton")}
                </Button>
              </div>
            )}
            <div className="grid gap-2 border-t pt-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Package className="size-4" aria-hidden="true" />
                {t("iconPack")}
              </p>
              <p className="text-xs text-muted-foreground">{t("iconPackBody")}</p>
              <ExportItem
                busy={busy}
                id="icons"
                label={t("iconPack")}
                onClick={() => run("icons", async () => downloadBlob(await buildZip(await iconPackEntries(spec, "")), `${base}-icones-app.zip`))}
              />
            </div>
            <div className="grid gap-2 border-t pt-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Share2 className="size-4" aria-hidden="true" />
                {t("social")}
              </p>
              {SOCIAL_KIT.map((format) => (
                <ExportItem key={format.id} busy={busy} id={`social-${format.id}`} label={tSocial(format.id, { size: `${format.width} × ${format.height}` })} onClick={() => social(format)} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function VariantsGrid({ spec }: { spec: LogoSpec }) {
  const t = useTranslations("logos.variants");
  const variants = [
    { id: "color", options: {}, dark: false },
    { id: "black", options: { variant: "black" as const }, dark: false },
    { id: "white", options: { variant: "white" as const, withBackground: false }, dark: true },
    { id: "icon", options: { layout: "icon" as const }, dark: false },
    { id: "horizontal", options: { layout: "horizontal" as const }, dark: false },
    { id: "vertical", options: { layout: "vertical" as const }, dark: false },
  ] as const;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileImage className="size-4" aria-hidden="true" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {variants.map((variant) => {
          const { svg } = renderLogoSvg(spec, variant.options);
          return (
            <figure key={variant.id} className="grid gap-1">
              <div
                className={variant.dark ? "svg-fit flex aspect-[3/2] items-center rounded-lg bg-neutral-900 p-3" : "svg-fit bg-checker flex aspect-[3/2] items-center rounded-lg p-3"}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <figcaption className="text-center text-xs text-muted-foreground">{t(variant.id)}</figcaption>
            </figure>
          );
        })}
      </CardContent>
    </Card>
  );
}
