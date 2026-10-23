"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { FlipHorizontal2, FlipVertical2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/studio/fields";
import type { PhotoCrop } from "@/lib/render/photo";
import type { ImageElement } from "@/lib/studio/types";

export const FULL_CROP: PhotoCrop = { x: 0, y: 0, width: 1, height: 1 };
const MIN = 0.02;

/** Proportions proposées : libre, cadre de l'élément, image d'origine, formats courants. */
export const ASPECTS = [
  { id: "free", ratio: null },
  { id: "frame", ratio: null },
  { id: "original", ratio: null },
  { id: "1:1", ratio: 1 },
  { id: "4:5", ratio: 4 / 5 },
  { id: "3:2", ratio: 3 / 2 },
  { id: "16:9", ratio: 16 / 9 },
  { id: "9:16", ratio: 9 / 16 },
] as const;
export type AspectId = (typeof ASPECTS)[number]["id"];

/** Proportions (largeur / hauteur, en px de l'image) d'un choix ; null : libre. */
export function aspectRatio(id: AspectId, el: ImageElement) {
  if (id === "frame") return el.width / el.height;
  if (id === "original") return el.naturalWidth / el.naturalHeight;
  return ASPECTS.find((a) => a.id === id)?.ratio ?? null;
}

/** Plus grand recadrage centré aux proportions voulues. */
export function fitCrop(ratio: number, el: ImageElement, around: PhotoCrop = FULL_CROP): PhotoCrop {
  const nw = el.naturalWidth;
  const nh = el.naturalHeight;
  const cx = (around.x + around.width / 2) * nw;
  const cy = (around.y + around.height / 2) * nh;
  let w = nw;
  let h = w / ratio;
  if (h > nh) {
    h = nh;
    w = h * ratio;
  }
  const x = Math.min(nw - w, Math.max(0, cx - w / 2));
  const y = Math.min(nh - h, Math.max(0, cy - h / 2));
  return { x: x / nw, y: y / nh, width: w / nw, height: h / nh };
}

type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const HANDLES: Exclude<Handle, "move">[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const CURSORS: Record<Exclude<Handle, "move">, string> = {
  n: "cursor-ns-resize",
  s: "cursor-ns-resize",
  e: "cursor-ew-resize",
  w: "cursor-ew-resize",
  ne: "cursor-nesw-resize",
  sw: "cursor-nesw-resize",
  nw: "cursor-nwse-resize",
  se: "cursor-nwse-resize",
};

/** Position d'une poignée sur un axe : 0 (côté `start`), 1 (côté `end`) ou 0,5 (milieu). */
function along(handle: Handle, start: string, end: string) {
  if (handle.includes(start)) return 0;
  if (handle.includes(end)) return 1;
  return 0.5;
}

/**
 * Zone aux proportions imposées (`r` : largeur sur hauteur en proportions de l'image) : la hauteur
 * suit la largeur (poignées latérales et d'angle) ou l'inverse, sans sortir de l'image.
 */
function constrain(box: { x: number; y: number; right: number; bottom: number }, handle: Handle, r: number): PhotoCrop {
  let { x, y } = box;
  const byWidth = handle !== "n" && handle !== "s";
  let width = byWidth ? box.right - x : (box.bottom - y) * r;
  let height = width / r;
  if (handle.includes("n")) y = box.bottom - height;
  if (handle.includes("w")) x = box.right - width;
  if (x < 0 || y < 0 || x + width > 1 || y + height > 1) {
    const fit = Math.min(width, 1 - Math.max(0, x), (1 - Math.max(0, y)) * r);
    width = fit;
    height = fit / r;
    x = Math.min(Math.max(0, x), 1 - width);
    y = Math.min(Math.max(0, y), 1 - height);
  }
  return { x, y, width, height };
}

/** Vue de recadrage : photo entière, zone conservée, poignées et grille des tiers. */
export function CropView({ el, crop, ratio, onChange }: { el: ImageElement; crop: PhotoCrop; ratio: number | null; onChange: (crop: PhotoCrop) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ handle: Handle; start: { x: number; y: number }; crop: PhotoCrop } | null>(null);
  const nw = el.naturalWidth;
  const nh = el.naturalHeight;
  const px = { x: crop.x * nw, y: crop.y * nh, w: crop.width * nw, h: crop.height * nh };
  const handleSize = Math.max(nw, nh) * 0.018;

  const toImage = (event: ReactPointerEvent) => {
    const rect = svg.current!.getBoundingClientRect();
    // L'image est centrée dans la vue (preserveAspectRatio meet).
    const scale = Math.min(rect.width / nw, rect.height / nh);
    const ox = rect.left + (rect.width - nw * scale) / 2;
    const oy = rect.top + (rect.height - nh * scale) / 2;
    return { x: (event.clientX - ox) / scale / nw, y: (event.clientY - oy) / scale / nh };
  };

  const begin = (handle: Handle, event: ReactPointerEvent) => {
    event.stopPropagation();
    drag.current = { handle, start: toImage(event), crop };
    svg.current!.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = toImage(event);
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    const c = d.crop;
    if (d.handle === "move") {
      onChange({ ...c, x: Math.min(1 - c.width, Math.max(0, c.x + dx)), y: Math.min(1 - c.height, Math.max(0, c.y + dy)) });
      return;
    }
    let { x, y } = c;
    let right = c.x + c.width;
    let bottom = c.y + c.height;
    if (d.handle.includes("w")) x = Math.min(right - MIN, Math.max(0, c.x + dx));
    if (d.handle.includes("e")) right = Math.max(x + MIN, Math.min(1, right + dx));
    if (d.handle.includes("n")) y = Math.min(bottom - MIN, Math.max(0, c.y + dy));
    if (d.handle.includes("s")) bottom = Math.max(y + MIN, Math.min(1, bottom + dy));
    onChange(ratio ? constrain({ x, y, right, bottom }, d.handle, ratio * (nh / nw)) : { x, y, width: right - x, height: bottom - y });
  };


  const handlePos = (h: Handle) => ({ cx: px.x + px.w * along(h, "w", "e"), cy: px.y + px.h * along(h, "n", "s") });
  const angle = el.straighten ?? 0;
  const center = `${px.x + px.w / 2} ${px.y + px.h / 2}`;

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${nw} ${nh}`}
      className="h-full max-h-full w-full touch-none"
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={onPointerMove}
      onPointerUp={() => (drag.current = null)}
    >
      <g transform={angle ? `rotate(${angle} ${center})` : undefined}>
        <image href={el.src} width={nw} height={nh} preserveAspectRatio="none" />
      </g>
      <path d={`M0 0H${nw}V${nh}H0Z M${px.x} ${px.y}v${px.h}h${px.w}v${-px.h}Z`} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />
      <rect x={px.x} y={px.y} width={px.w} height={px.h} fill="transparent" stroke="#fff" strokeWidth={Math.max(1, handleSize / 6)} className="cursor-move" onPointerDown={(event) => begin("move", event)} />
      {[1, 2].map((i) => (
        <g key={i} stroke="#fff" strokeOpacity={0.6} strokeWidth={Math.max(0.5, handleSize / 12)} pointerEvents="none">
          <line x1={px.x + (px.w * i) / 3} x2={px.x + (px.w * i) / 3} y1={px.y} y2={px.y + px.h} />
          <line y1={px.y + (px.h * i) / 3} y2={px.y + (px.h * i) / 3} x1={px.x} x2={px.x + px.w} />
        </g>
      ))}
      {HANDLES.map((h) => {
        const pos = handlePos(h);
        return (
          <rect
            key={h}
            x={pos.cx - handleSize / 2}
            y={pos.cy - handleSize / 2}
            width={handleSize}
            height={handleSize}
            rx={handleSize / 5}
            fill="#fff"
            stroke="#111"
            strokeWidth={handleSize / 10}
            className={CURSORS[h]}
            onPointerDown={(event) => begin(h, event)}
          />
        );
      })}
    </svg>
  );
}

/** Panneau de recadrage : proportions, redressement, symétries, réinitialisation. */
export function CropPanel({
  el,
  aspect,
  onAspect,
  onChange,
}: {
  el: ImageElement;
  aspect: AspectId;
  onAspect: (aspect: AspectId) => void;
  onChange: (patch: Partial<ImageElement>) => void;
}) {
  const t = useTranslations("studio.photo");
  return (
    <div className="grid gap-5">
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("aspect")}</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {ASPECTS.map((a) => (
            <Button key={a.id} type="button" size="xs" variant={aspect === a.id ? "default" : "outline"} onClick={() => onAspect(a.id)}>
              {t.has(`aspects.${a.id}`) ? t(`aspects.${a.id}`) : a.id}
            </Button>
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("straighten")}</h3>
        <div onDoubleClick={() => onChange({ straighten: 0 })}>
          <SliderField label={t("angle")} value={el.straighten ?? 0} min={-45} max={45} step={0.5} format={(v) => `${v}°`} onChange={(v) => onChange({ straighten: v || undefined })} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant={el.flipX ? "secondary" : "outline"} onClick={() => onChange({ flipX: !el.flipX })}>
            <FlipHorizontal2 /> {t("flipX")}
          </Button>
          <Button type="button" size="sm" variant={el.flipY ? "secondary" : "outline"} onClick={() => onChange({ flipY: !el.flipY })}>
            <FlipVertical2 /> {t("flipY")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ crop: null, straighten: undefined, focusX: 0.5, focusY: 0.5 })}>
            <RotateCcw /> {t("resetCrop")}
          </Button>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">{t("cropHint")}</p>
    </div>
  );
}
