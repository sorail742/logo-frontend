"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PHOTO_PRESETS, type PhotoAdjust } from "@/lib/render/photo";
import type { ImageElement } from "@/lib/studio/types";
import { renderElement } from "@/lib/studio/render";
import { cn } from "@/lib/utils";

/** Élément ramené à l'origine, sans rotation ni ombre : vignette ou aperçu de l'atelier. */
export function frameOf(el: ImageElement, patch: Partial<ImageElement> = {}): ImageElement {
  return { ...el, x: 0, y: 0, rotation: 0, shadow: null, opacity: 1, blend: "normal", ...patch };
}

/** Miniature SVG de l'élément avec d'autres réglages (image réduite pour rester légère). */
function Thumbnail({ id, el, adjust, thumbSrc }: { id: string; el: ImageElement; adjust: PhotoAdjust; thumbSrc: string }) {
  // Identifiant propre à la vignette : les filtres de toutes les vignettes cohabitent dans la page.
  const svg = useMemo(() => renderElement(frameOf(el, { id: `preset-${id}`, src: thumbSrc, adjust, filters: undefined })), [id, el, adjust, thumbSrc]);
  return (
    <svg viewBox={`0 0 ${el.width} ${el.height}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

/** Galerie de filtres : un clic remplace tous les réglages par ceux du préréglage. */
export function PresetsPanel({ el, thumbSrc, current, onPick }: { el: ImageElement; thumbSrc: string | null; current: PhotoAdjust; onPick: (adjust: PhotoAdjust) => void }) {
  const t = useTranslations("studio.photo");
  const active = JSON.stringify(current);
  return (
    <div className="grid grid-cols-3 gap-2">
      {PHOTO_PRESETS.map((preset) => {
        const selected = JSON.stringify(preset.adjust) === active;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(structuredClone(preset.adjust))}
            className={cn("grid gap-1 rounded-lg border-2 p-1 text-left text-[11px] font-medium", selected ? "border-primary" : "border-transparent hover:border-muted-foreground/30")}
          >
            <span className="bg-checker block aspect-square overflow-hidden rounded-md">{thumbSrc && <Thumbnail id={preset.id} el={el} adjust={preset.adjust} thumbSrc={thumbSrc} />}</span>
            <span className="truncate px-0.5">{t(`presets.${preset.id}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
