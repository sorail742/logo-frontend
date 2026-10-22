"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { downloadBlob, svgToPngBlob, svgToStandalone } from "@/lib/render/export";

export interface GalleryVisual {
  id: string;
  label: string;
  /** Nom du fichier téléchargé, sans extension. */
  file: string;
  width: number;
  height: number;
  render: () => string;
  type?: "image/png" | "image/jpeg";
}

/**
 * Visuels composés (kit réseaux sociaux, mises en situation) : aperçus à leur proportion réelle,
 * téléchargeables à leur taille native. Les aperçus passent par des images (pas de SVG en ligne) :
 * chaque visuel garde ses propres identifiants de dégradés et de motifs.
 * `source` : la donnée dont dépendent les visuels (la spec du logo) ; les aperçus sont refaits
 * quand elle change, après une courte pause pendant l'édition.
 */
export function VisualGallery({
  title,
  description,
  visuals,
  source,
  canDownload,
  labels,
}: {
  title: string;
  description: string;
  visuals: GalleryVisual[];
  source: unknown;
  canDownload: boolean;
  labels: { download: string; done: string };
}) {
  const onError = useApiErrorToast();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // Un aperçu reste affiché jusqu'à son remplacement : pas de vide pendant l'édition.
  const shown = useRef<Record<string, string>>({});

  useEffect(() => () => Object.values(shown.current).forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      for (const visual of visuals) {
        const svg = await svgToStandalone(visual.render()).catch(() => null);
        if (cancelled) return;
        if (!svg) continue;
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        const previous = shown.current[visual.id];
        shown.current = { ...shown.current, [visual.id]: url };
        setPreviews(shown.current);
        if (previous) URL.revokeObjectURL(previous);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Les visuels sont recalculés à chaque rendu : seule leur source compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const download = async (visual: GalleryVisual) => {
    setBusy(visual.id);
    try {
      const type = visual.type ?? "image/png";
      const blob = await svgToPngBlob(visual.render(), { size: Math.max(visual.width, visual.height), type, quality: 0.9 });
      downloadBlob(blob, `${visual.file}.${type === "image/jpeg" ? "jpg" : "png"}`);
      toast.success(labels.done);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {visuals.map((visual) => (
          <figure key={visual.id} className="grid content-start gap-2">
            <div className="overflow-hidden rounded-lg border bg-muted" style={{ aspectRatio: `${visual.width} / ${visual.height}` }}>
              {previews[visual.id] ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local (URL blob), hors de l'optimiseur d'images
                <img src={previews[visual.id]} alt={visual.label} className="size-full object-cover" />
              ) : (
                <div className="size-full animate-pulse" />
              )}
            </div>
            <figcaption className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="min-w-0">{visual.label}</span>
              {canDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => download(visual)}
                  disabled={busy !== null}
                  aria-label={`${labels.download} — ${visual.label}`}
                  title={labels.download}
                >
                  {busy === visual.id ? <Loader2 className="animate-spin" /> : <Download />}
                </Button>
              )}
            </figcaption>
          </figure>
        ))}
      </CardContent>
    </Card>
  );
}
