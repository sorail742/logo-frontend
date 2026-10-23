"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { curveFunction, type CurvePoint, type PhotoCurves } from "@/lib/render/photo";
import type { Histogram } from "@/lib/studio/pixels";
import { cn } from "@/lib/utils";

type Channel = keyof PhotoCurves;
const CHANNELS: Channel[] = ["rgb", "r", "g", "b"];
const STROKES: Record<Channel, string> = { rgb: "currentColor", r: "#ef4444", g: "#22c55e", b: "#3b82f6" };
const SIZE = 256;
const DEFAULT: CurvePoint[] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
];

/** Aire de l'histogramme d'un canal (échelle racine : les pics ne écrasent pas le reste). */
function histogramPath(counts: Uint32Array, height: number) {
  const max = Math.sqrt(Math.max(1, ...counts));
  let d = `M0 ${height}`;
  for (let i = 0; i < 256; i++) d += `L${i} ${height - (Math.sqrt(counts[i]!) / max) * height}`;
  return `${d}L255 ${height}Z`;
}

/** Histogramme du résultat : luminance et trois canaux. */
export function HistogramView({ histogram, className }: Readonly<{ histogram: Histogram | null; className?: string }>) {
  const t = useTranslations("studio.photo");
  return (
    <svg viewBox="0 0 256 80" preserveAspectRatio="none" className={cn("h-20 w-full rounded-md bg-muted/60", className)} aria-label={t("histogram")}>
      <title>{t("histogram")}</title>
      {histogram && (
        <>
          <path d={histogramPath(histogram.r, 80)} fill="#ef4444" opacity={0.35} />
          <path d={histogramPath(histogram.g, 80)} fill="#22c55e" opacity={0.35} />
          <path d={histogramPath(histogram.b, 80)} fill="#3b82f6" opacity={0.35} />
          <path d={histogramPath(histogram.l, 80)} fill="currentColor" opacity={0.25} />
        </>
      )}
    </svg>
  );
}

/**
 * Courbes (comme Photoshop) : canal RVB et canaux rouge, vert, bleu. Clic pour ajouter un point,
 * glisser pour le déplacer, double-clic ou glisser hors du cadre pour le retirer.
 */
export function CurvesEditor({ curves, onChange, histogram }: Readonly<{ curves: PhotoCurves | undefined; onChange: (curves: PhotoCurves | undefined) => void; histogram: Histogram | null }>) {
  const t = useTranslations("studio.photo");
  const [channel, setChannel] = useState<Channel>("rgb");
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<number | null>(null);
  const points = curves?.[channel]?.length ? curves[channel]! : DEFAULT;

  const write = (next: CurvePoint[] | null) => {
    const all: PhotoCurves = { ...curves };
    if (next && !(next.length === 2 && next[0]!.x === 0 && next[0]!.y === 0 && next[1]!.x === 1 && next[1]!.y === 1)) all[channel] = next;
    else delete all[channel];
    onChange(Object.keys(all).length ? all : undefined);
  };

  const toPoint = (event: ReactPointerEvent) => {
    const rect = svg.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height)),
      outside: event.clientX < rect.left - 24 || event.clientX > rect.right + 24 || event.clientY < rect.top - 24 || event.clientY > rect.bottom + 24,
    };
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const p = toPoint(event);
    let index = points.findIndex((q) => Math.abs(q.x - p.x) < 0.04 && Math.abs(q.y - p.y) < 0.06);
    let next = points;
    if (index < 0) {
      next = [...points, { x: p.x, y: p.y }].sort((a, b) => a.x - b.x);
      index = next.findIndex((q) => q.x === p.x && q.y === p.y);
      write(next);
    }
    drag.current = index;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const index = drag.current;
    if (index === null) return;
    const p = toPoint(event);
    const isEnd = index === 0 || index === points.length - 1;
    if (p.outside && !isEnd && points.length > 2) {
      drag.current = null;
      write(points.filter((_, i) => i !== index));
      return;
    }
    // Un point reste entre ses voisins.
    const lo = index > 0 ? points[index - 1]!.x + 0.01 : 0;
    const hi = index < points.length - 1 ? points[index + 1]!.x - 0.01 : 1;
    write(points.map((q, i) => (i === index ? { x: Math.min(hi, Math.max(lo, p.x)), y: p.y } : q)));
  };

  const curve = curveFunction(points);
  let d = "";
  for (let i = 0; i <= 64; i++) {
    const x = i / 64;
    d += `${i ? "L" : "M"}${x * SIZE} ${(1 - curve(x)) * SIZE}`;
  }
  const histogramKey = channel === "rgb" ? "l" : channel;
  const counts = histogram ? histogram[histogramKey] : null;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <fieldset className="flex rounded-lg border p-0.5">
          <legend className="sr-only">{t("channel")}</legend>
          {CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={channel === c}
              onClick={() => setChannel(c)}
              className={cn("h-6 rounded-md px-2 text-xs font-medium", channel === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              {t(`channels.${c}`)}
            </button>
          ))}
        </fieldset>
        <Button type="button" size="xs" variant="ghost" onClick={() => write(null)}>
          <RotateCcw /> {t("resetCurve")}
        </Button>
      </div>
      <svg
        ref={svg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="aspect-square w-full cursor-crosshair touch-none rounded-md border bg-muted/40 text-foreground"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={(event) => {
          const rect = svg.current!.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const index = points.findIndex((q, i) => i > 0 && i < points.length - 1 && Math.abs(q.x - x) < 0.04);
          if (index > 0) write(points.filter((_, i) => i !== index));
        }}
        aria-label={t("curves")}
      >
        {counts && <path d={histogramPath(counts, SIZE)} transform={`scale(${SIZE / 256} 1)`} fill={STROKES[channel]} opacity={0.18} />}
        {[0.25, 0.5, 0.75].map((g) => (
          <g key={g} stroke="currentColor" strokeOpacity={0.12}>
            <line x1={g * SIZE} x2={g * SIZE} y1={0} y2={SIZE} />
            <line y1={g * SIZE} y2={g * SIZE} x1={0} x2={SIZE} />
          </g>
        ))}
        <line x1={0} y1={SIZE} x2={SIZE} y2={0} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="4 4" />
        <path d={d} fill="none" stroke={STROKES[channel]} strokeWidth={2} />
        {points.map((p) => (
          <circle key={p.x.toFixed(4)} cx={p.x * SIZE} cy={(1 - p.y) * SIZE} r={5} fill="var(--background)" stroke={STROKES[channel]} strokeWidth={2} />
        ))}
      </svg>
      <p className="text-xs text-muted-foreground">{t("curvesHint")}</p>
    </div>
  );
}
