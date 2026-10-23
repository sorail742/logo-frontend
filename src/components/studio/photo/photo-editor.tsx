"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Columns2, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api, errorMessage, newIdempotencyKey } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { photoPlacement, type PhotoAdjust } from "@/lib/render/photo";
import { renderElement } from "@/lib/studio/render";
import {
  autoAdjust,
  downscale,
  fullMask,
  histogram as computeHistogram,
  invertMask,
  isFullMask,
  loadPixels,
  maskFromDataUrl,
  maskToDataUrl,
  neutralize,
  refineMask,
  removeBackground,
  svgPixels,
  type Histogram,
  type Pixels,
} from "@/lib/studio/pixels";
import type { ImageElement } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";
import { AdjustPanel } from "./adjust-panel";
import { aspectRatio, CropPanel, CropView, fitCrop, FULL_CROP, type AspectId } from "./crop-tool";
import { CurvesEditor, HistogramView } from "./curves-editor";
import { CutoutPanel, CutoutView, defaultCutoutSettings, type CutoutSettings } from "./cutout-tool";
import { frameOf, PresetsPanel } from "./presets-panel";

export type PhotoTab = "adjust" | "curves" | "presets" | "crop" | "cutout";
const TABS: PhotoTab[] = ["adjust", "curves", "presets", "crop", "cutout"];

/** Anciens filtres simples traduits en réglages (pour reprendre une photo déjà retouchée). */
function legacyAdjust(el: ImageElement): PhotoAdjust {
  const f = el.filters;
  if (!f) return {};
  const adjust: PhotoAdjust = {};
  if (f.brightness !== 1) adjust.exposure = Math.round(Math.log2(f.brightness) * 100) / 100;
  if (f.contrast !== 1) adjust.contrast = Math.round((f.contrast - 1) * 100);
  if (f.saturation !== 1) adjust.saturation = Math.round((f.saturation - 1) * 100);
  if (f.blur) adjust.blur = Math.min(100, f.blur * 2);
  return adjust;
}

/** Aperçu de l'élément (cadre, réglages, détourage, effets) à la taille de la vue. */
function ElementPreview({ el, onPick, picking }: { el: ImageElement; picking: boolean; onPick: (x: number, y: number) => void }) {
  // Identifiant propre à l'atelier : le même élément est aussi rendu sur le canevas.
  const markup = useMemo(() => renderElement(frameOf(el, { id: `${el.id}-atelier` })), [el]);
  return (
    <svg
      viewBox={`0 0 ${el.width} ${el.height}`}
      className={cn("max-h-full max-w-full overflow-visible drop-shadow-xl", picking && "cursor-crosshair")}
      style={{ aspectRatio: `${el.width} / ${el.height}`, width: el.width >= el.height ? "100%" : "auto", height: el.width >= el.height ? "auto" : "100%" }}
      onClick={(event) => {
        if (!picking) return;
        const rect = event.currentTarget.getBoundingClientRect();
        onPick(((event.clientX - rect.left) / rect.width) * el.width, ((event.clientY - rect.top) / rect.height) * el.height);
      }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

/**
 * Atelier photo : réglages, courbes, filtres, recadrage et détourage d'une photo du Studio, avec
 * aperçu avant/après et histogramme du résultat. Tout est enregistré en une étape d'annulation.
 */
export function PhotoEditor({
  el,
  initialTab = "adjust",
  onApply,
  onClose,
  projectId: project,
}: {
  el: ImageElement;
  initialTab?: PhotoTab;
  onApply: (el: ImageElement) => void;
  onClose: () => void;
  /** Projet facturé pour le détourage IA (par défaut : celui de la création du Studio ouverte). */
  projectId?: string;
}) {
  const t = useTranslations("studio.photo");
  const onError = useApiErrorToast();
  const studioProject = useStudio((s) => s.meta?.projectId);
  const projectId = project ?? studioProject;
  const [tab, setTab] = useState<PhotoTab>(initialTab);
  const [draft, setDraft] = useState<ImageElement>(el);
  const [comparing, setComparing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [thumb, setThumb] = useState<{ src: string; pixels: Pixels } | null>(null);
  const [hist, setHist] = useState<Histogram | null>(null);
  const [aspect, setAspect] = useState<AspectId>("frame");
  // Détourage : photo en pleine résolution et masque modifié en place.
  const [source, setSource] = useState<Pixels | null>(null);
  // Masque modifié en place par les pinceaux et la baguette ; `maskVersion` signale ces modifications.
  const [mask, setMask] = useState<Uint8ClampedArray | null>(null);
  const [maskVersion, setMaskVersion] = useState(0);
  const [maskTouched, setMaskTouched] = useState(false);
  const [cutout, setCutout] = useState<CutoutSettings>(() => defaultCutoutSettings(el));
  const { data: caps } = useQuery({ queryKey: qk.capabilities, queryFn: () => api.library.capabilities(), staleTime: 5 * 60_000 });

  const adjust = useMemo(() => draft.adjust ?? legacyAdjust(draft), [draft]);
  const setAdjust = (next: PhotoAdjust) => setDraft((d) => ({ ...d, adjust: next, filters: undefined }));
  const patch = (next: Partial<ImageElement>) => setDraft((d) => ({ ...d, ...next }));

  useEffect(() => {
    let alive = true;
    downscale(el.src, 320)
      .then((result) => alive && setThumb(result))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [el.src]);

  // Histogramme du résultat (image réduite), recalculé peu après la dernière modification.
  useEffect(() => {
    if (!thumb || (tab !== "adjust" && tab !== "curves")) return;
    const timer = setTimeout(() => {
      const frame = frameOf(draft, { id: "histogram", src: thumb.src, cutout: null, outline: null, glow: null, mask: "none" });
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${draft.width} ${draft.height}" width="${draft.width}" height="${draft.height}">${renderElement(frame)}</svg>`;
      svgPixels(svg, 320)
        .then((px) => setHist(computeHistogram(px)))
        .catch(() => setHist(computeHistogram(thumb.pixels)));
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, thumb, tab]);

  /** Photo en pleine résolution (détourage, pipette), chargée une seule fois. */
  const ensureSource = useCallback(async () => {
    if (source) return source;
    const px = await loadPixels(el.src);
    setSource(px);
    return px;
  }, [el.src, source]);

  // Entrée dans le détourage : photo en pleine résolution, masque existant relu ou masque plein.
  useEffect(() => {
    if (tab !== "cutout" || mask) return;
    let alive = true;
    const load = async () => {
      const px = source ?? (await loadPixels(el.src));
      const initial = el.cutout ? await maskFromDataUrl(el.cutout, px.width, px.height) : fullMask(px);
      if (!alive) return;
      if (!source) setSource(px);
      setMask(initial);
    };
    load().catch((error: unknown) => toast.error(errorMessage(error)));
    return () => {
      alive = false;
    };
  }, [tab, mask, source, el.src, el.cutout]);

  /** Masque modifié (en place, ou remplacé par `next`). */
  const touchMask = (next?: Uint8ClampedArray) => {
    if (next) setMask(next);
    setMaskTouched(true);
    setMaskVersion((v) => v + 1);
  };

  // Masque affiché au repos : bords lissés et contractés comme à l'enregistrement.
  const previewMask = useMemo(() => {
    // maskVersion change à chaque modification en place du masque : l'aperçu est recalculé.
    if (!mask || !source || maskVersion < 0) return null;
    return refineMask(mask, source.width, source.height, { feather: cutout.feather, contract: cutout.contract });
  }, [mask, maskVersion, source, cutout.feather, cutout.contract]);

  const ai = useMutation({
    mutationFn: async () => {
      const result = await api.studio.cutout(projectId!, { image: el.src }, newIdempotencyKey());
      const px = await ensureSource();
      return { mask: await maskFromDataUrl(result.mask, px.width, px.height), cost: result.costCredits };
    },
    onSuccess: ({ mask: next, cost }) => {
      touchMask(next);
      toast.success(t("cutoutDone", { cost }));
    },
    onError,
  });

  const pickWhite = async (x: number, y: number) => {
    const px = await ensureSource();
    const { image } = photoPlacement(draft);
    const nx = Math.round(((x - image.x) / image.width) * px.width);
    const ny = Math.round(((y - image.y) / image.height) * px.height);
    if (nx < 0 || ny < 0 || nx >= px.width || ny >= px.height) return;
    // Moyenne sur 5 × 5 px : un pixel isolé est bruité.
    let [r, g, b, count] = [0, 0, 0, 0];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const sx = Math.min(px.width - 1, Math.max(0, nx + dx));
        const sy = Math.min(px.height - 1, Math.max(0, ny + dy));
        const i = (sy * px.width + sx) * 4;
        r += px.data[i]!;
        g += px.data[i + 1]!;
        b += px.data[i + 2]!;
        count++;
      }
    }
    setAdjust({ ...adjust, ...neutralize(r / count, g / count, b / count) });
    setPicking(false);
  };

  const auto = () => {
    if (!thumb) return;
    setAdjust({ ...adjust, ...autoAdjust(thumb.pixels) });
    toast.success(t("autoDone"));
  };

  const chooseAspect = (id: AspectId) => {
    setAspect(id);
    const ratio = aspectRatio(id, draft);
    if (ratio) patch({ crop: fitCrop(ratio, draft, draft.crop ?? FULL_CROP) });
  };

  const resetAll = () => {
    setDraft({ ...el, adjust: undefined, filters: undefined, crop: null, straighten: undefined, cutout: null, outline: null, glow: null });
    if (source) touchMask(fullMask(source));
  };

  const apply = () => {
    let result: ImageElement = { ...draft };
    if (maskTouched && mask && source) {
      const final = refineMask(mask, source.width, source.height, { feather: cutout.feather, contract: cutout.contract });
      result.cutout = isFullMask(final) ? null : maskToDataUrl(final, source.width, source.height);
    }
    // Recadrage à d'autres proportions que le cadre : le cadre prend celles du recadrage.
    if (result.crop && result.fit === "cover" && aspect !== "frame") {
      const ratio = (result.crop.width * result.naturalWidth) / (result.crop.height * result.naturalHeight);
      const height = result.width / ratio;
      if (Math.abs(height - result.height) > 0.5) result = { ...result, y: result.y + (result.height - height) / 2, height, focusX: 0.5, focusY: 0.5 };
    }
    if (result.crop?.x === 0 && result.crop.y === 0 && result.crop.width === 1 && result.crop.height === 1) result.crop = null;
    onApply(result);
  };

  const original = useMemo(() => frameOf(el), [el]);
  const shown = comparing ? original : draft;
  const crop = draft.crop ?? FULL_CROP;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="flex h-[min(92vh,920px)] w-[min(1320px,96vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription className="text-xs">{t("description")}</DialogDescription>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" disabled={!thumb} onClick={auto}>
              <Sparkles /> {t("auto")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={comparing ? "secondary" : "outline"}
              aria-pressed={comparing}
              onPointerDown={() => setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              onKeyDown={(e) => e.key === " " && setComparing(true)}
              onKeyUp={() => setComparing(false)}
              title={t("compareHint")}
            >
              <Columns2 /> {t("compare")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetAll}>
              <RotateCcw /> {t("resetAll")}
            </Button>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="bg-checker relative flex min-h-[40vh] items-center justify-center overflow-hidden p-6">
            {tab === "crop" && !comparing && (
              <CropView el={draft} crop={crop} ratio={aspect === "free" ? null : aspectRatio(aspect, draft)} onChange={(next) => patch({ crop: next })} />
            )}
            {tab === "cutout" && !comparing && (source && mask && previewMask ? (
              <CutoutView source={source} mask={mask} preview={previewMask} version={maskVersion} settings={cutout} onEdit={() => touchMask()} />
            ) : (
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label={t("loading")} />
            ))}
            {(tab === "adjust" || tab === "curves" || tab === "presets" || comparing) && <ElementPreview el={shown} picking={picking && !comparing} onPick={(x, y) => void pickWhite(x, y)} />}
            {picking && <p className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs shadow">{t("pickHint")}</p>}
          </div>

          <aside className="flex min-h-0 flex-col border-l">
            <div className="flex gap-1 overflow-x-auto border-b p-2" role="tablist" aria-label={t("title")}>
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => {
                    setTab(id);
                    setPicking(false);
                  }}
                  className={cn("h-8 shrink-0 rounded-md px-2.5 text-xs font-medium", tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                >
                  {t(`tabs.${id}`)}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {(tab === "adjust" || tab === "curves") && <HistogramView histogram={hist} className="mb-4" />}
              {tab === "adjust" && <AdjustPanel adjust={adjust} onChange={setAdjust} picking={picking} onPick={setPicking} />}
              {tab === "curves" && <CurvesEditor curves={adjust.curves} histogram={hist} onChange={(curves) => setAdjust({ ...adjust, curves })} />}
              {tab === "presets" && <PresetsPanel el={draft} thumbSrc={thumb?.src ?? null} current={adjust} onPick={setAdjust} />}
              {tab === "crop" && <CropPanel el={draft} aspect={aspect} onAspect={chooseAspect} onChange={patch} />}
              {tab === "cutout" && (
                <CutoutPanel
                  el={draft}
                  settings={cutout}
                  onSettings={(next) => setCutout((c) => ({ ...c, ...next }))}
                  onAuto={() => {
                    if (source) touchMask(removeBackground(source, cutout.tolerance, { holes: cutout.holes }));
                  }}
                  onAi={() => ai.mutate()}
                  aiAvailable={Boolean(caps?.cutout && projectId)}
                  aiPending={ai.isPending}
                  onInvert={() => {
                    if (mask) touchMask(invertMask(mask));
                  }}
                  onReset={() => {
                    if (source) touchMask(fullMask(source));
                  }}
                  onChange={patch}
                />
              )}
            </div>
          </aside>
        </div>

        <DialogFooter className="m-0 flex-row justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={apply}>
            {t("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
