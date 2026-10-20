"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Ban, Pipette, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { hexToRgb, normalizeHex, rgbToHex } from "@/lib/render/color";
import { harmony, type HarmonyKind } from "@/lib/studio/color";
import type { GradientStop, Paint } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

// Sélecteur de peinture : couleur unie (teinte, saturation, luminosité, pipette), dégradé
// linéaire ou radial à plusieurs arrêts, nuanciers de la marque, du document et harmonies.

const CLASSICS = ["#111827", "#ffffff", "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"];
const HARMONIES: HarmonyKind[] = ["complementary", "analogous", "triadic", "split", "tints", "shades"];

/** CSS d'une peinture (aperçus). */
export function paintCss(paint: Paint) {
  switch (paint.type) {
    case "none":
      return "repeating-conic-gradient(#e5e7eb 0 25%, #ffffff 0 50%) 0 0 / 10px 10px";
    case "solid":
      return paint.color;
    case "linear":
      return `linear-gradient(${paint.angle + 90}deg, ${paint.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;
    case "radial":
      return `radial-gradient(circle, ${paint.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;
  }
}

// ─── HSV ───

function hexToHsv(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, max ? d / max : 0, max];
}

function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255);
}

interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropperApi {
  open(): Promise<EyeDropperResult>;
}

function Swatches({ colors, onPick, label }: { colors: string[]; onPick(color: string): void; label: string }) {
  if (!colors.length) return null;
  return (
    <div className="grid gap-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onPick(color)}
            className="size-6 rounded-md border border-black/10 shadow-xs transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            style={{ background: color }}
            title={color.toUpperCase()}
            aria-label={color.toUpperCase()}
          />
        ))}
      </div>
    </div>
  );
}

/** Couleur unie : carré saturation/luminosité, barre de teinte, saisie hexadécimale, pipette. */
export function ColorField({ value, onChange }: { value: string; onChange(color: string, final: boolean): void }) {
  const t = useTranslations("studio.paint");
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [lastValue, setLastValue] = useState(value);
  const [draft, setDraft] = useState(value);
  const area = useRef<HTMLDivElement>(null);
  if (value !== lastValue) {
    // Valeur changée de l'extérieur : la teinte est conservée pour les gris.
    const next = hexToHsv(value);
    setHsv(next[1] === 0 ? [hsv[0], next[1], next[2]] : next);
    setLastValue(value);
    setDraft(value);
  }

  const emit = (next: [number, number, number], final: boolean) => {
    setHsv(next);
    const hex = hsvToHex(...next);
    setLastValue(hex);
    setDraft(hex);
    onChange(hex, final);
  };

  const pick = (event: ReactPointerEvent<HTMLDivElement>, final: boolean) => {
    const rect = area.current!.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const v = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    emit([hsv[0], s, v], final);
  };

  const dropper = typeof window !== "undefined" && "EyeDropper" in window;

  return (
    <div className="grid gap-2.5">
      <div
        ref={area}
        className="relative h-36 cursor-crosshair touch-none rounded-lg"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv[0]} 100% 50%)` }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pick(event, false);
        }}
        onPointerMove={(event) => event.buttons === 1 && pick(event, false)}
        onPointerUp={(event) => pick(event, true)}
        role="slider"
        aria-label={t("saturation")}
        aria-valuenow={Math.round(hsv[1] * 100)}
        tabIndex={0}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          emit([hsv[0], Math.min(1, Math.max(0, hsv[1] + move[0])), Math.min(1, Math.max(0, hsv[2] + move[1]))], true);
        }}
      >
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%`, background: hsvToHex(...hsv) }}
        />
      </div>
      <Slider
        value={[hsv[0]]}
        min={0}
        max={359}
        onValueChange={(v) => emit([Array.isArray(v) ? v[0]! : (v as number), hsv[1], hsv[2]], false)}
        onValueCommitted={() => onChange(hsvToHex(...hsv), true)}
        aria-label={t("hue")}
        className="[&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
      />
      <div className="flex items-center gap-2">
        <span className="size-8 shrink-0 rounded-md border" style={{ background: value }} aria-hidden="true" />
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const hex = normalizeHex(draft);
            if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(draft.trim())) onChange(hex, true);
            else setDraft(value);
          }}
          onKeyDown={(event) => event.key === "Enter" && (event.target as HTMLInputElement).blur()}
          className="h-8 font-mono text-xs uppercase"
          aria-label={t("hex")}
          spellCheck={false}
        />
        {dropper && (
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              try {
                const result = await new (window as unknown as { EyeDropper: new () => EyeDropperApi }).EyeDropper().open();
                onChange(normalizeHex(result.sRGBHex), true);
              } catch {
                // Pipette annulée
              }
            }}
            aria-label={t("eyedropper")}
            title={t("eyedropper")}
          >
            <Pipette />
          </Button>
        )}
      </div>
    </div>
  );
}

export interface PaintPickerProps {
  value: Paint;
  onChange(paint: Paint, final: boolean): void;
  label: string;
  gradients?: boolean;
  allowNone?: boolean;
  brandColors?: string[];
  documentColors?: string[];
  className?: string;
}

function defaultStops(color: string): GradientStop[] {
  return [
    { offset: 0, color },
    { offset: 1, color: harmony(color, "analogous")[2]! },
  ];
}

export function PaintPicker({ value, onChange, label, gradients = true, allowNone = false, brandColors = [], documentColors = [], className }: PaintPickerProps) {
  const t = useTranslations("studio.paint");
  const [stopIndex, setStopIndex] = useState(0);
  const [harmonyKind, setHarmonyKind] = useState<HarmonyKind>("complementary");
  const base = value.type === "solid" ? value.color : value.type === "none" ? "#111827" : (value.stops[0]?.color ?? "#111827");
  const stops = value.type === "linear" || value.type === "radial" ? value.stops : null;
  const activeStop = stops ? Math.min(stopIndex, stops.length - 1) : 0;
  const current = stops ? stops[activeStop]!.color : base;

  const setColor = (color: string, final: boolean) => {
    if (stops && (value.type === "linear" || value.type === "radial")) {
      onChange({ ...value, stops: stops.map((s, i) => (i === activeStop ? { ...s, color } : s)) }, final);
    } else {
      onChange({ type: "solid", color }, final);
    }
  };

  const setType = (type: Paint["type"]) => {
    if (type === value.type) return;
    if (type === "none") onChange({ type: "none" }, true);
    else if (type === "solid") onChange({ type: "solid", color: base }, true);
    else if (type === "linear") onChange({ type: "linear", angle: value.type === "linear" ? value.angle : 90, stops: stops ?? defaultStops(base) }, true);
    else onChange({ type: "radial", stops: stops ?? defaultStops(base) }, true);
    setStopIndex(0);
  };

  const presets: GradientStop[][] = brandColors.length >= 2
    ? [
        [{ offset: 0, color: brandColors[0]! }, { offset: 1, color: brandColors[1]! }],
        [{ offset: 0, color: brandColors[0]! }, { offset: 1, color: "#000000" }],
        [{ offset: 0, color: brandColors[1]! }, { offset: 1, color: "#ffffff" }],
      ]
    : [];

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-lg border border-input px-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          className,
        )}
        aria-label={label}
      >
        <span className="size-5 shrink-0 rounded border border-black/10" style={{ background: paintCss(value) }} aria-hidden="true" />
        <span className="truncate font-mono uppercase">{value.type === "solid" ? value.color : value.type === "none" ? t("none") : t(value.type)}</span>
      </PopoverTrigger>
      <PopoverContent className="grid w-72 gap-3" side="left" align="start">
        {(gradients || allowNone) && (
          <div className="grid grid-flow-col gap-1 rounded-lg bg-muted p-0.5 text-xs">
            {(["solid", ...(gradients ? (["linear", "radial"] as const) : []), ...(allowNone ? (["none"] as const) : [])] as Paint["type"][]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setType(type)}
                className={cn("rounded-md px-2 py-1 transition", value.type === type ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {type === "none" ? <Ban className="mx-auto size-3.5" aria-label={t("none")} /> : t(type)}
              </button>
            ))}
          </div>
        )}

        {stops && (value.type === "linear" || value.type === "radial") && (
          <div className="grid gap-2">
            <div className="relative h-7 rounded-md border" style={{ background: `linear-gradient(90deg, ${stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})` }}>
              {stops.map((stop, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStopIndex(i)}
                  className={cn("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow", i === activeStop ? "border-primary ring-2 ring-primary/30" : "border-white")}
                  style={{ left: `${stop.offset * 100}%`, background: stop.color }}
                  aria-label={t("stop", { index: i + 1 })}
                  aria-pressed={i === activeStop}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-14 text-[11px] text-muted-foreground">{t("position")}</span>
              <Slider
                value={[Math.round(stops[activeStop]!.offset * 100)]}
                min={0}
                max={100}
                onValueChange={(v) => {
                  const offset = (Array.isArray(v) ? v[0]! : (v as number)) / 100;
                  onChange({ ...value, stops: stops.map((s, i) => (i === activeStop ? { ...s, offset } : s)) }, false);
                }}
                onValueCommitted={() => onChange(value, true)}
                aria-label={t("position")}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
                  const a = sorted[Math.max(0, sorted.length - 2)]!;
                  const b = sorted.at(-1)!;
                  const next = [...stops, { offset: (a.offset + b.offset) / 2, color: a.color }];
                  onChange({ ...value, stops: next }, true);
                  setStopIndex(next.length - 1);
                }}
                disabled={stops.length >= 5}
                aria-label={t("addStop")}
                title={t("addStop")}
              >
                <Plus />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  onChange({ ...value, stops: stops.filter((_, i) => i !== activeStop) }, true);
                  setStopIndex(0);
                }}
                disabled={stops.length <= 2}
                aria-label={t("removeStop")}
                title={t("removeStop")}
              >
                <X />
              </Button>
            </div>
            {value.type === "linear" && (
              <div className="flex items-center gap-2">
                <span className="w-14 text-[11px] text-muted-foreground">{t("angle")}</span>
                <Slider
                  value={[value.angle]}
                  min={0}
                  max={359}
                  onValueChange={(v) => onChange({ ...value, angle: Array.isArray(v) ? v[0]! : (v as number) }, false)}
                  onValueCommitted={() => onChange(value, true)}
                  aria-label={t("angle")}
                />
                <span className="w-9 text-right text-[11px] tabular-nums">{value.angle}°</span>
              </div>
            )}
            {presets.length > 0 && (
              <div className="flex gap-1.5">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onChange({ ...value, stops: preset }, true)}
                    className="h-6 flex-1 rounded-md border border-black/10"
                    style={{ background: `linear-gradient(90deg, ${preset[0]!.color}, ${preset[1]!.color})` }}
                    aria-label={t("preset", { index: i + 1 })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {value.type !== "none" && <ColorField value={current} onChange={setColor} />}

        <Swatches colors={brandColors} onPick={(c) => setColor(c, true)} label={t("brand")} />
        <Swatches colors={documentColors.filter((c) => !brandColors.includes(c)).slice(0, 14)} onPick={(c) => setColor(c, true)} label={t("document")} />
        {value.type !== "none" && (
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground">{t("harmonies")}</p>
              <select
                value={harmonyKind}
                onChange={(event) => setHarmonyKind(event.target.value as HarmonyKind)}
                className="rounded-md border-0 bg-transparent text-[11px] text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={t("harmonies")}
              >
                {HARMONIES.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`harmony.${kind}`)}
                  </option>
                ))}
              </select>
            </div>
            <Swatches colors={harmony(current, harmonyKind)} onPick={(c) => setColor(c, true)} label="" />
          </div>
        )}
        <Swatches colors={CLASSICS} onPick={(c) => setColor(c, true)} label={t("classics")} />
      </PopoverContent>
    </Popover>
  );
}

/** Couleur unie seule (contours, icônes, surlignage). */
export function ColorPicker({ value, onChange, label, brandColors, documentColors }: { value: string; onChange(color: string, final: boolean): void; label: string; brandColors?: string[]; documentColors?: string[] }) {
  return (
    <PaintPicker
      value={{ type: "solid", color: value }}
      onChange={(paint, final) => paint.type === "solid" && onChange(paint.color, final)}
      label={label}
      gradients={false}
      brandColors={brandColors}
      documentColors={documentColors}
    />
  );
}
