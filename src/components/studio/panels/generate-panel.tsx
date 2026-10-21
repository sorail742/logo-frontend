"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Info, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreditCost } from "@/components/common/credit-cost";
import { waitForJob } from "@/hooks/use-job";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import type { StudioImagesInput } from "@/lib/api/contract";
import { CREDIT_COSTS } from "@/lib/credits";
import { ARTWORK_STYLES, renderArtwork } from "@/lib/render/artwork";
import { prepareImage } from "@/lib/studio/images";
import { cn } from "@/lib/utils";
import { useStudioContext } from "../context";
import { placeAsBackground, placeImages } from "../placement";

// Images générées pour la création : fonds, motifs et illustrations aux couleurs de la marque.
// Quatre propositions par lot ; un clic pose l'image (ou remplit le cadre photo sélectionné).

type Style = StudioImagesInput["style"];
type Aspect = StudioImagesInput["aspect"];
type Result = { url: string; width: number; height: number };

const STYLES: Style[] = ["auto", ...ARTWORK_STYLES];
const ASPECTS: Aspect[] = ["square", "portrait", "landscape"];

/** Aperçu d'un style (rendu local, isolé dans une image pour ne pas mêler les identifiants SVG). */
function StylePreview({ style, palette }: { style: Style; palette: string[] }) {
  const src = useMemo(() => {
    if (style === "auto") return null;
    const svg = renderArtwork({ style, palette, width: 120, height: 120, seed: 11 });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [style, palette]);
  if (!src) {
    return (
      <span className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-amber-300/30">
        <Sparkles className="size-5 text-primary" aria-hidden="true" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- aperçu SVG local
  return <img src={src} alt="" className="size-full object-cover" />;
}

export function GeneratePanel() {
  const t = useTranslations("studio.generate");
  const onError = useApiErrorToast();
  const { projectId, brand } = useStudioContext();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<Style>("auto");
  const [aspect, setAspect] = useState<Aspect>("square");
  const [useBrand, setUseBrand] = useState(true);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [demo, setDemo] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const palette = brand?.palette.length ? brand.palette : ["#0f6b5c", "#f2b705", "#14281d", "#f6fbf4"];

  const generate = async () => {
    setBusy(true);
    try {
      const { jobId } = await api.studio.generateImages(projectId, { prompt: prompt.trim(), style, aspect, palette: useBrand ? palette : undefined }, crypto.randomUUID());
      const job = await waitForJob(jobId, 60_000);
      if (job.status !== "SUCCEEDED" || !job.result?.images?.length) throw new Error(job.error ?? t("failed"));
      setResults(job.result.images);
      setDemo(Boolean(job.result.demo));
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const add = async (index: number, background = false) => {
    setAdding(index);
    try {
      const response = await fetch(results[index]!.url);
      const prepared = await prepareImage(await response.blob());
      if (background) placeAsBackground(prepared);
      else placeImages([prepared]);
      toast.success(background ? t("addedBackground") : t("added"));
    } catch (error) {
      onError(error);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="generate-prompt" className="text-xs font-semibold">
          {t("describe")}
        </label>
        <Textarea
          id="generate-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={t("placeholder")}
          rows={3}
          maxLength={300}
          className="resize-none text-sm"
        />
        <div className="flex flex-wrap gap-1">
          {(t.raw("ideas") as string[]).map((idea) => (
            <button key={idea} type="button" onClick={() => setPrompt(idea)} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground">
              {idea}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-xs font-semibold">{t("style")}</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              aria-pressed={style === s}
              className={cn("grid gap-1 rounded-lg p-1 text-center text-[10px] transition", style === s ? "bg-primary/10 font-semibold text-primary ring-2 ring-primary" : "hover:bg-muted")}
            >
              <span className="block aspect-square overflow-hidden rounded-md border">
                <StylePreview style={s} palette={palette} />
              </span>
              {t(`styles.${s}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-0.5 text-xs" role="radiogroup" aria-label={t("format")}>
        {ASPECTS.map((a) => (
          <button key={a} type="button" role="radio" aria-checked={aspect === a} onClick={() => setAspect(a)} className={cn("rounded-md py-1.5 transition", aspect === a ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}>
            {t(`aspects.${a}`)}
          </button>
        ))}
      </div>

      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-2">
          {t("brandColors")}
          <span className="flex -space-x-1" aria-hidden="true">
            {palette.slice(0, 4).map((c) => (
              <span key={c} className="size-3.5 rounded-full ring-2 ring-background" style={{ background: c }} />
            ))}
          </span>
        </span>
        <Switch checked={useBrand} onCheckedChange={setUseBrand} />
      </label>

      <div className="flex items-center justify-between gap-2">
        <CreditCost cost={CREDIT_COSTS.STUDIO_IMAGES} />
        <Button onClick={generate} disabled={busy || prompt.trim().length < 3}>
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {busy ? t("working") : t("generate")}
        </Button>
      </div>

      {results.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-xs font-semibold">{t("results")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {results.map((image, index) => (
              <div key={image.url} className="group relative overflow-hidden rounded-lg border bg-muted transition hover:border-primary" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- image générée (URL signée) */}
                <img src={image.url} alt={t("result", { index: index + 1 })} className="size-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-6 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                  <Button size="xs" variant="secondary" className="flex-1" onClick={() => add(index)} disabled={adding !== null}>
                    {adding === index ? t("adding") : t("add")}
                  </Button>
                  <Button size="xs" variant="secondary" className="flex-1" onClick={() => add(index, true)} disabled={adding !== null}>
                    {t("background")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {demo && (
            <p className="flex gap-1.5 rounded-lg bg-muted/70 p-2 text-[11px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t("demo")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
