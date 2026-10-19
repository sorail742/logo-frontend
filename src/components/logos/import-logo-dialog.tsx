"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SvgView } from "@/components/brand/svg-view";
import { extractPalette } from "@/lib/render/color";
import { sanitizeSvg } from "@/lib/render/svg";

const MAX_BYTES = 5 * 1024 * 1024;

/** Vérifie le type réel par signature binaire (pas seulement l'extension, §14.1). */
async function sniffType(file: File): Promise<"png" | "svg" | null> {
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "png";
  const text = new TextDecoder().decode(head).trimStart();
  if (text.startsWith("<svg") || (text.startsWith("<?xml") && text.includes("<svg"))) return "svg";
  return null;
}

async function paletteFromImage(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  const size = 160;
  const scale = Math.min(size / img.width, size / img.height, 1) || 1;
  canvas.width = Math.max(1, Math.round(img.width * scale)) || size;
  canvas.height = Math.max(1, Math.round(img.height * scale)) || size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return extractPalette(ctx.getImageData(0, 0, canvas.width, canvas.height).data, 4);
}

export function ImportLogoDialog({
  open,
  onOpenChange,
  onImport,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (input: { svg?: string; pngDataUrl?: string; palette: string[] }) => void;
  busy: boolean;
}) {
  const t = useTranslations("logos");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ svg?: string; png?: string; palette: string[] } | null>(null);

  const onFile = async (file: File | undefined) => {
    setError(null);
    setPreview(null);
    if (!file) return;
    const type = await sniffType(file);
    if (!type || file.size > MAX_BYTES) return setError(t("invalidFile"));
    if (type === "svg") {
      const clean = sanitizeSvg(await file.text());
      if (!clean) return setError(t("invalidFile"));
      const url = URL.createObjectURL(new Blob([clean], { type: "image/svg+xml" }));
      const palette = await paletteFromImage(url).catch(() => []);
      URL.revokeObjectURL(url);
      setPreview({ svg: clean, palette });
    } else {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      setPreview({ png: dataUrl, palette: await paletteFromImage(dataUrl) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importBody")}</DialogDescription>
        </DialogHeader>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-sm hover:bg-muted">
          <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
          {t("importFile")}
          <input type="file" accept=".svg,image/svg+xml,.png,image/png" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {preview && (
          <div className="grid gap-3">
            <div className="bg-checker flex h-40 items-center justify-center rounded-lg p-4">
              {preview.svg ? (
                <SvgView svg={preview.svg} className="h-full w-full" />
              ) : (
                // Aperçu d'un fichier local (data URL) : next/image n'apporte rien ici
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.png} alt="" className="max-h-full max-w-full object-contain" />
              )}
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">{t("extracted")}</p>
              <div className="flex gap-2">
                {preview.palette.map((hex) => (
                  <span key={hex} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                    <span className="size-4 rounded" style={{ background: hex }} aria-hidden="true" />
                    {hex.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button disabled={!preview || busy} onClick={() => preview && onImport({ svg: preview.svg, pngDataUrl: preview.png, palette: preview.palette })}>
            {t("importConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
