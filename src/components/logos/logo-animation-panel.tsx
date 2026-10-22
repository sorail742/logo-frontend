"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Film, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { slugify } from "@/lib/format";
import { downloadBlob } from "@/lib/render/export";
import {
  animatedLogoSvg,
  LOGO_ANIMATIONS,
  recordLogoVideo,
  videoSupported,
  type AnimationBackground,
  type LogoAnimation,
} from "@/lib/render/logo-animation";
import type { LogoSpec } from "@/lib/types";
import { cn } from "@/lib/utils";

function Choice<T extends string>({ value, options, label, onChange }: { value: T; options: readonly T[]; label: (option: T) => string; onChange: (option: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn("rounded-lg border px-3 py-1.5 text-sm", value === option ? "border-primary bg-accent font-medium" : "hover:bg-muted")}
        >
          {label(option)}
        </button>
      ))}
    </div>
  );
}

/** Logo animé : aperçu, SVG animé pour le web, vidéo pour les statuts et réseaux sociaux. */
export function LogoAnimationPanel({ spec, canDownload, isFree }: { spec: LogoSpec; canDownload: boolean; isFree: boolean }) {
  const t = useTranslations("logos.animation");
  const onError = useApiErrorToast();
  const [style, setStyle] = useState<LogoAnimation>("reveal");
  const [background, setBackground] = useState<AnimationBackground>("light");
  const [preview, setPreview] = useState<string | null>(null);
  const shown = useRef<string | null>(null);
  const [replay, setReplay] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const base = slugify(spec.text) || "logo";

  useEffect(
    () => () => {
      if (shown.current) URL.revokeObjectURL(shown.current);
    },
    [],
  );

  // L'aperçu précédent reste affiché jusqu'à son remplacement.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const svg = await animatedLogoSvg(spec, style, background).catch(() => null);
      if (cancelled || !svg) return;
      const previous = shown.current;
      shown.current = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      setPreview(shown.current);
      if (previous) URL.revokeObjectURL(previous);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [spec, style, background]);

  const downloadSvg = async () => {
    try {
      const svg = await animatedLogoSvg(spec, style, background);
      downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${base}-anime.svg`);
      toast.success(t("done"));
    } catch (error) {
      onError(error);
    }
  };

  const downloadVideo = async () => {
    setProgress(0);
    try {
      const { blob, extension } = await recordLogoVideo(spec, style, background, { onProgress: setProgress });
      downloadBlob(blob, `${base}-anime.${extension}`);
      toast.success(t("done"));
    } catch (error) {
      onError(error);
    } finally {
      setProgress(null);
    }
  };

  const downloads = canDownload && !isFree;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Film className="size-4" aria-hidden="true" />
          {t("title")}
        </CardTitle>
        <CardDescription className="text-xs">{isFree ? t("free") : t("body")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- SVG animé local (URL blob)
            <img key={`${preview}-${replay}`} src={preview} alt={t("alt", { name: spec.text })} className="size-full object-contain" />
          )}
          <Button variant="secondary" size="sm" className="absolute right-2 bottom-2" onClick={() => setReplay((n) => n + 1)}>
            <RotateCcw />
            {t("replay")}
          </Button>
        </div>
        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">{t("style")}</p>
          <Choice value={style} options={LOGO_ANIMATIONS} label={(option) => t(`styles.${option}`)} onChange={setStyle} />
        </div>
        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">{t("background")}</p>
          <Choice value={background} options={["light", "brand"] as const} label={(option) => t(`backgrounds.${option}`)} onChange={setBackground} />
        </div>
        {downloads && (
          <div className="grid gap-2 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadSvg} disabled={progress !== null}>
                <Download />
                {t("svg")}
              </Button>
              {videoSupported() && (
                <Button onClick={downloadVideo} disabled={progress !== null}>
                  {progress === null ? <Film /> : <Loader2 className="animate-spin" />}
                  {progress === null ? t("video") : t("recording")}
                </Button>
              )}
            </div>
            {progress !== null && <Progress value={Math.round(progress * 100)} aria-label={t("recording")} />}
            <p className="text-xs text-muted-foreground">{t("videoNote")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
