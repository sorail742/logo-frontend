"use client";

import { useTranslations } from "next-intl";
import { Pipette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/common/native-select";
import { SliderField } from "@/components/studio/fields";
import type { AdjustKey, PhotoAdjust, PhotoTone } from "@/lib/render/photo";

/** Réglages par groupe, dans l'ordre de Lightroom : lumière, couleur, détail, effets. */
const GROUPS: { id: string; keys: { key: AdjustKey; min: number; max: number; step?: number }[] }[] = [
  {
    id: "light",
    keys: [
      { key: "exposure", min: -3, max: 3, step: 0.05 },
      { key: "contrast", min: -100, max: 100 },
      { key: "highlights", min: -100, max: 100 },
      { key: "shadows", min: -100, max: 100 },
      { key: "whites", min: -100, max: 100 },
      { key: "blacks", min: -100, max: 100 },
      { key: "brightness", min: -100, max: 100 },
    ],
  },
  {
    id: "color",
    keys: [
      { key: "temperature", min: -100, max: 100 },
      { key: "tint", min: -100, max: 100 },
      { key: "vibrance", min: -100, max: 100 },
      { key: "saturation", min: -100, max: 100 },
      { key: "hue", min: -180, max: 180 },
    ],
  },
  {
    id: "detail",
    keys: [
      { key: "clarity", min: -100, max: 100 },
      { key: "sharpen", min: 0, max: 100 },
      { key: "blur", min: 0, max: 100, step: 0.5 },
    ],
  },
  {
    id: "effects",
    keys: [
      { key: "vignette", min: -100, max: 100 },
      { key: "grain", min: 0, max: 100 },
      { key: "fade", min: 0, max: 100 },
    ],
  },
];

const TONES: PhotoTone[] = ["color", "mono", "sepia", "duotone"];

/** Valeur affichée : signe explicite, IL avec deux décimales. */
function format(key: AdjustKey, value: number) {
  if (key === "exposure") return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
  if (key === "hue") return `${Math.round(value)}°`;
  return `${value > 0 ? "+" : ""}${Math.round(value)}`;
}

export function AdjustPanel({
  adjust,
  onChange,
  picking,
  onPick,
}: {
  adjust: PhotoAdjust;
  onChange: (adjust: PhotoAdjust) => void;
  /** Pipette de balance des blancs active. */
  picking: boolean;
  onPick: (active: boolean) => void;
}) {
  const t = useTranslations("studio.photo");
  const set = (key: AdjustKey, value: number) => {
    const next = { ...adjust, [key]: value };
    if (!value) delete next[key];
    onChange(next);
  };
  const reset = (keys: AdjustKey[]) => {
    const next = { ...adjust };
    for (const key of keys) delete next[key];
    onChange(next);
  };

  return (
    <div className="grid gap-5">
      {GROUPS.map((group) => (
        <section key={group.id} className="grid gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`groups.${group.id}`)}</h3>
            <div className="flex items-center gap-1">
              {group.id === "color" && (
                <Button
                  type="button"
                  size="icon-xs"
                  variant={picking ? "secondary" : "ghost"}
                  aria-pressed={picking}
                  aria-label={t("whitePicker")}
                  title={t("whitePicker")}
                  onClick={() => onPick(!picking)}
                >
                  <Pipette />
                </Button>
              )}
              <Button type="button" size="icon-xs" variant="ghost" aria-label={t("resetGroup")} title={t("resetGroup")} onClick={() => reset(group.keys.map((k) => k.key))}>
                <RotateCcw />
              </Button>
            </div>
          </div>
          {group.keys.map(({ key, min, max, step }) => (
            <div key={key} onDoubleClick={() => set(key, 0)} title={t("doubleClickReset")}>
              <SliderField label={t(`adjust.${key}`)} value={adjust[key] ?? 0} min={min} max={max} step={step} format={(v) => format(key, v)} onChange={(v) => set(key, v)} />
            </div>
          ))}
        </section>
      ))}

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("groups.tone")}</h3>
        <NativeSelect value={adjust.tone ?? "color"} onChange={(e) => onChange({ ...adjust, tone: e.target.value as PhotoTone })} aria-label={t("groups.tone")}>
          {TONES.map((tone) => (
            <option key={tone} value={tone}>
              {t(`tones.${tone}`)}
            </option>
          ))}
        </NativeSelect>
        {adjust.tone === "duotone" && (
          <div className="grid grid-cols-2 gap-2">
            {([0, 1] as const).map((i) => (
              <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="color"
                  value={(adjust.duotone ?? ["#1b1f3b", "#f6d365"])[i]}
                  onChange={(e) => {
                    const pair = [...(adjust.duotone ?? ["#1b1f3b", "#f6d365"])] as [string, string];
                    pair[i] = e.target.value;
                    onChange({ ...adjust, duotone: pair });
                  }}
                  className="h-7 w-9 cursor-pointer rounded border bg-transparent p-0.5"
                />
                {t(i === 0 ? "duotoneDark" : "duotoneLight")}
              </label>
            ))}
          </div>
        )}
        <label className="flex items-center justify-between text-xs">
          {t("invert")}
          <Switch checked={Boolean(adjust.invert)} onCheckedChange={(invert) => onChange({ ...adjust, invert })} />
        </label>
      </section>
    </div>
  );
}
