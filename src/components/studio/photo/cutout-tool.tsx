"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Brush, Eraser, FlipHorizontal, Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SliderField } from "@/components/studio/fields";
import { magicWand, paintMask, type Pixels } from "@/lib/studio/pixels";
import type { ImageElement } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export type CutoutTool = "erase" | "restore" | "wand";

export interface CutoutSettings {
  tool: CutoutTool;
  /** Rayon du pinceau, en px de l'image. */
  size: number;
  hardness: number;
  /** Tolérance de la baguette et du fond uni (0 à 100). */
  tolerance: number;
  contiguous: boolean;
  /** Fond uni : retirer aussi les zones intérieures de la même couleur. */
  holes: boolean;
  /** Bord du masque : lissage et contraction, en px de l'image. */
  feather: number;
  contract: number;
  /** Zones retirées affichées en rouge plutôt que transparentes. */
  overlay: boolean;
}

export function defaultCutoutSettings(el: ImageElement): CutoutSettings {
  return {
    tool: "erase",
    size: Math.round(Math.max(el.naturalWidth, el.naturalHeight) * 0.03),
    hardness: 0.6,
    tolerance: 22,
    contiguous: true,
    holes: false,
    feather: 0,
    contract: 0,
    overlay: false,
  };
}

/** Toile de détourage : photo et masque composés, pinceaux et baguette magique. */
export function CutoutView({
  source,
  mask,
  preview,
  version,
  settings,
  onEdit,
}: {
  source: Pixels;
  /** Masque modifié en place par les outils. */
  mask: Uint8ClampedArray;
  /** Masque affiché au repos (bords affinés). */
  preview: Uint8ClampedArray;
  version: number;
  settings: CutoutSettings;
  onEdit: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  /** Cercle du pinceau, en px de la vue (relatif au conteneur). */
  const [cursor, setCursor] = useState<{ left: number; top: number; size: number } | null>(null);
  const { width, height } = source;

  const layers = useMemo(() => {
    const make = () => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      return c;
    };
    const photo = make();
    photo.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(source.data), width, height), 0, 0);
    return { photo, matte: make() };
  }, [source, width, height]);

  const draw = (values: Uint8ClampedArray) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const matte = layers.matte.getContext("2d")!;
    const image = matte.createImageData(width, height);
    for (let i = 0; i < values.length; i++) {
      if (settings.overlay) {
        // Mode masque rapide : les zones retirées apparaissent en rouge sur la photo.
        image.data[i * 4] = 239;
        image.data[i * 4 + 1] = 68;
        image.data[i * 4 + 2] = 68;
        image.data[i * 4 + 3] = (255 - values[i]!) * 0.6;
      } else {
        image.data[i * 4 + 3] = values[i]!;
      }
    }
    matte.putImageData(image, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(layers.photo, 0, 0);
    ctx.globalCompositeOperation = settings.overlay ? "source-over" : "destination-in";
    ctx.drawImage(layers.matte, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  };

  useEffect(() => {
    draw(preview);
    // `draw` lit les réglages courants ; seul l'aperçu ou le mode d'affichage déclenche un rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, version, settings.overlay, layers]);

  const toImage = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
      scale: rect.width / width,
    };
  };

  const stroke = (p: { x: number; y: number }) => {
    const from = last.current ?? p;
    paintMask(mask, width, height, from, p, settings.size, settings.hardness, settings.tool === "erase" ? 0 : 255);
    last.current = p;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => draw(mask));
  };

  return (
    <div ref={box} className="relative flex h-full w-full items-center justify-center">
      <canvas
        ref={canvas}
        width={width}
        height={height}
        className={cn("bg-checker max-h-full max-w-full touch-none", settings.tool === "wand" ? "cursor-crosshair" : "cursor-none")}
        onPointerDown={(event) => {
          const p = toImage(event);
          if (settings.tool === "wand") {
            magicWand(source, mask, p.x, p.y, settings.tolerance, { contiguous: settings.contiguous, restore: event.altKey });
            onEdit();
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          last.current = null;
          stroke(p);
        }}
        onPointerMove={(event) => {
          const p = toImage(event);
          const origin = box.current!.getBoundingClientRect();
          const r = settings.size * p.scale;
          setCursor({ left: event.clientX - origin.left - r, top: event.clientY - origin.top - r, size: r * 2 });
          if (last.current && event.buttons === 1) stroke(p);
        }}
        onPointerUp={() => {
          if (!last.current) return;
          last.current = null;
          onEdit();
        }}
        onPointerLeave={() => setCursor(null)}
      />
      {cursor && settings.tool !== "wand" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full border border-white mix-blend-difference"
          style={{ left: cursor.left, top: cursor.top, width: cursor.size, height: cursor.size }}
        />
      )}
    </div>
  );
}

const TOOLS: { id: CutoutTool; icon: typeof Eraser }[] = [
  { id: "erase", icon: Eraser },
  { id: "restore", icon: Brush },
  { id: "wand", icon: Wand2 },
];

/** Panneau de détourage : actions rapides, outils, bords, contour et lueur. */
export function CutoutPanel({
  el,
  settings,
  onSettings,
  onAuto,
  onAi,
  aiAvailable,
  aiPending,
  onInvert,
  onReset,
  onChange,
}: {
  el: ImageElement;
  settings: CutoutSettings;
  onSettings: (patch: Partial<CutoutSettings>) => void;
  onAuto: () => void;
  onAi: () => void;
  aiAvailable: boolean;
  aiPending: boolean;
  onInvert: () => void;
  onReset: () => void;
  onChange: (patch: Partial<ImageElement>) => void;
}) {
  const t = useTranslations("studio.photo");
  const maxSize = Math.round(Math.max(el.naturalWidth, el.naturalHeight) * 0.15);
  return (
    <div className="grid gap-5">
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("cutoutAuto")}</h3>
        <Button type="button" variant="default" disabled={!aiAvailable || aiPending} onClick={onAi}>
          {aiPending ? <Loader2 className="animate-spin" /> : <Sparkles />} {t("cutoutAi")}
        </Button>
        {!aiAvailable && <p className="text-xs text-muted-foreground">{t("cutoutAiUnavailable")}</p>}
        <Button type="button" variant="outline" onClick={onAuto}>
          <Wand2 /> {t("cutoutPlain")}
        </Button>
        <SliderField label={t("tolerance")} value={settings.tolerance} min={1} max={100} onChange={(tolerance) => onSettings({ tolerance })} />
        <label className="flex items-center justify-between text-xs">
          {t("holes")}
          <Switch checked={settings.holes} onCheckedChange={(holes) => onSettings({ holes })} />
        </label>
      </section>

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("tools")}</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {TOOLS.map(({ id, icon: Icon }) => (
            <Button key={id} type="button" size="sm" variant={settings.tool === id ? "default" : "outline"} aria-pressed={settings.tool === id} onClick={() => onSettings({ tool: id })}>
              <Icon /> {t(`cutoutTools.${id}`)}
            </Button>
          ))}
        </div>
        {settings.tool === "wand" ? (
          <>
            <label className="flex items-center justify-between text-xs">
              {t("contiguous")}
              <Switch checked={settings.contiguous} onCheckedChange={(contiguous) => onSettings({ contiguous })} />
            </label>
            <p className="text-xs text-muted-foreground">{t("wandHint")}</p>
          </>
        ) : (
          <>
            <SliderField label={t("brushSize")} value={settings.size} min={2} max={maxSize} onChange={(size) => onSettings({ size })} />
            <SliderField label={t("hardness")} value={Math.round(settings.hardness * 100)} min={0} max={100} format={(v) => `${v} %`} onChange={(v) => onSettings({ hardness: v / 100 })} />
          </>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant="ghost" onClick={onInvert}>
            <FlipHorizontal /> {t("invertMask")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onReset}>
            <RotateCcw /> {t("resetMask")}
          </Button>
        </div>
        <label className="flex items-center justify-between text-xs">
          {t("showMask")}
          <Switch checked={settings.overlay} onCheckedChange={(overlay) => onSettings({ overlay })} />
        </label>
      </section>

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("edges")}</h3>
        <SliderField label={t("feather")} value={settings.feather} min={0} max={20} onChange={(feather) => onSettings({ feather })} />
        <SliderField label={t("contract")} value={settings.contract} min={0} max={10} onChange={(contract) => onSettings({ contract })} />
      </section>

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("sticker")}</h3>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={el.outline?.color ?? "#ffffff"}
            aria-label={t("outlineColor")}
            onChange={(e) => onChange({ outline: { color: e.target.value, width: el.outline?.width || 8 } })}
            className="h-7 w-9 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
          />
          <div className="min-w-0 flex-1">
            <SliderField label={t("outline")} value={Math.round(el.outline?.width ?? 0)} min={0} max={60} onChange={(width) => onChange({ outline: width ? { color: el.outline?.color ?? "#ffffff", width } : null })} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={el.glow?.color ?? "#ffd166"}
            aria-label={t("glowColor")}
            onChange={(e) => onChange({ glow: { color: e.target.value, size: el.glow?.size || 24, opacity: el.glow?.opacity ?? 0.8 } })}
            className="h-7 w-9 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
          />
          <div className="min-w-0 flex-1">
            <SliderField label={t("glow")} value={Math.round(el.glow?.size ?? 0)} min={0} max={120} onChange={(size) => onChange({ glow: size ? { color: el.glow?.color ?? "#ffd166", size, opacity: el.glow?.opacity ?? 0.8 } : null })} />
          </div>
        </div>
      </section>
    </div>
  );
}
