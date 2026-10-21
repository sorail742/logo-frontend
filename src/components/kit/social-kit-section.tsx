"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { slugify } from "@/lib/format";
import { downloadBlob, svgToPngBlob, svgToStandalone } from "@/lib/render/export";
import { socialSvg, SOCIAL_KIT, type SocialFormat } from "@/lib/render/logo-assets";
import type { LogoSpec } from "@/lib/types";

/**
 * Kit réseaux sociaux du kit de marque : chaque format aperçu à sa proportion réelle, téléchargeable
 * en PNG à sa taille native. Les aperçus passent par des images (pas de SVG en ligne) : chaque
 * visuel garde ses propres identifiants de dégradés et de motifs.
 */
export function SocialKitSection({ spec, name, canDownload, isFree }: { spec: LogoSpec; name: string; canDownload: boolean; isFree: boolean }) {
  const t = useTranslations("kit.social");
  const tFormat = useTranslations("logos.export.socialFormats");
  const onError = useApiErrorToast();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      for (const format of SOCIAL_KIT) {
        const svg = await svgToStandalone(socialSvg(spec, format));
        if (cancelled) return;
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        urls.push(url);
        setPreviews((current) => ({ ...current, [format.id]: url }));
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
      setPreviews({});
    };
  }, [spec]);

  const download = async (format: SocialFormat) => {
    setBusy(format.id);
    try {
      const blob = await svgToPngBlob(socialSvg(spec, format), { size: Math.max(format.width, format.height) });
      downloadBlob(blob, `${slugify(name) || "marque"}-${format.file}.png`);
      toast.success(t("done"));
    } catch (error) {
      onError(error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("title")}</CardTitle>
        <CardDescription className="text-xs">{isFree ? t("free") : t("body")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_KIT.map((format) => {
          const label = tFormat(format.id, { size: `${format.width} × ${format.height}` });
          return (
            <figure key={format.id} className="grid content-start gap-2">
              <div className="overflow-hidden rounded-lg border bg-muted" style={{ aspectRatio: `${format.width} / ${format.height}` }}>
                {previews[format.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu local (URL blob), hors de l'optimiseur d'images
                  <img src={previews[format.id]} alt={label} className="size-full object-cover" />
                ) : (
                  <div className="size-full animate-pulse" />
                )}
              </div>
              <figcaption className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="min-w-0">{label}</span>
                {canDownload && !isFree && (
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => download(format)} disabled={busy !== null} aria-label={`${t("download")} — ${label}`} title={t("download")}>
                    {busy === format.id ? <Loader2 className="animate-spin" /> : <Download />}
                  </Button>
                )}
              </figcaption>
            </figure>
          );
        })}
      </CardContent>
    </Card>
  );
}
