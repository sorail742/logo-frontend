"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cssFontFamily } from "@/lib/render/fonts";
import { contrastRatio, readableOn } from "@/lib/render/color";
import {
  LETTERING_PRESETS,
  PATTERN_KINDS,
  letteringLayers,
  presetOf,
  presetStyle,
  type LetteringPreset,
  type LetteringStyle,
  type PatternKind,
  type TextEffects,
} from "@/lib/studio/lettering";
import { NativeSelect } from "@/components/common/native-select";
import { cn } from "@/lib/utils";
import { NumberField } from "./fields";
import { ColorPicker } from "./paint-picker";

const NO_COLORS: string[] = [];

/** Couleurs d'accent d'un préréglage : lisibles sur le remplissage, la marque en second. */
function presetColors(fill: string, brandColors: string[]) {
  const accent = readableOn(fill);
  const second =
    brandColors.find((c) => contrastRatio(c, accent) >= 2 && contrastRatio(c, fill) >= 1.5) ??
    (accent === "#ffffff" ? "#111111" : "#ffffff");
  return { accent, second };
}

/** Aperçu d'un préréglage : « 10 » en police de maillot. */
function PresetPreview({
  preset,
  fill,
  colors,
  uid,
}: Readonly<{
  preset: LetteringPreset;
  fill: string;
  colors: { accent: string; second: string };
  uid: string;
}>) {
  const size = 26;
  const style = presetStyle(preset, size, colors);
  const defs: string[] = [];
  const glyphs = `<text x="30" y="29" text-anchor="middle" font-size="${size}" font-weight="400" style="font-family:${cssFontFamily("graduate")}">10</text>`;
  const pid = `${uid}-${preset}`;
  const outline = style.stroke
    ? ` stroke="${style.stroke.color}" stroke-width="${style.stroke.width * 2}" paint-order="stroke" stroke-linejoin="round"`
    : "";
  const body = style.effects
    ? letteringLayers({
        pid,
        glyphs,
        fill,
        size,
        defs,
        stroke: style.stroke,
        effects: style.effects,
        box: { x: 8, y: 6, width: 44, height: 26 },
      })
    : glyphs.replace("<text ", `<text fill="${fill}"${outline} `);
  // Lettres claires : aperçu sur fond sombre pour rester visible.
  const backdrop =
    contrastRatio(fill, "#ffffff") < 1.6 ? '<rect width="60" height="38" rx="4" fill="#334155"/>' : "";
  return (
    <svg
      viewBox="0 0 60 38"
      className="h-7 w-12"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: `<defs>${defs.join("")}</defs>${backdrop}${body}` }}
    />
  );
}

function LayerRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      {/* Retour à la ligne : quatre réglages (texture, liseré) ne tiennent pas dans un panneau étroit. */}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * Forme du lettrage (maillots, affiches) : préréglages puis réglages fins de chaque calque.
 * `size` : corps du texte (épaisseurs des préréglages) ; `unit` : unité affichée des épaisseurs.
 */
export function LetteringControls({
  value,
  onChange,
  size,
  fill,
  unit,
  brandColors = NO_COLORS,
  documentColors,
}: Readonly<{
  value: LetteringStyle;
  onChange(next: LetteringStyle, key?: string): void;
  size: number;
  fill: string;
  unit: "px" | "mm";
  brandColors?: string[];
  documentColors?: string[];
}>) {
  const t = useTranslations("studio.lettering");
  const uid = useId().replaceAll(":", "");
  const colors = presetColors(fill, brandColors);
  const active = presetOf(value);
  const { stroke } = value;
  const effects: TextEffects = value.effects ?? {};
  const max = Math.max(1, Math.round(size));
  const precision = unit === "mm" ? 1 : 0;
  const setEffects = (patch: Partial<TextEffects>, key: string) =>
    onChange({ stroke, effects: { ...effects, ...patch } }, key);
  const color = (label: string, current: string, set: (c: string) => void) => (
    <ColorPicker
      label={label}
      value={current}
      onChange={set}
      brandColors={brandColors}
      documentColors={documentColors}
    />
  );
  const thickness = (
    label: string,
    current: number,
    set: (v: number) => void,
    limit = max / 2,
    symbol = "⌀",
  ) => (
    <NumberField
      label={symbol}
      title={label}
      className={cn("shrink-0", unit === "mm" ? "w-24" : "w-20")}
      value={current}
      min={0}
      max={limit}
      step={unit === "mm" ? 0.5 : 1}
      precision={precision}
      suffix={unit}
      onChange={set}
    />
  );

  return (
    <div className="grid gap-3">
      <fieldset className="grid grid-cols-4 gap-1.5">
        <legend className="text-muted-foreground mb-1.5 text-xs">{t("title")}</legend>
        {LETTERING_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={active === preset}
            onClick={() => onChange(presetStyle(preset, size, colors), "lettering-preset")}
            className={cn(
              "hover:bg-muted grid justify-items-center gap-0.5 rounded-md border p-1 text-[10px] leading-tight",
              active === preset && "border-primary bg-accent",
            )}
          >
            <PresetPreview preset={preset} fill={fill} colors={colors} uid={uid} />
            {t(`presets.${preset}`)}
          </button>
        ))}
      </fieldset>

      {stroke && (
        <LayerRow label={t("outline")}>
          {color(t("outline"), stroke.color, (c) =>
            onChange({ stroke: { ...stroke, color: c }, effects: value.effects }, "lettering-stroke"),
          )}
          {thickness(t("width"), stroke.width, (v) =>
            onChange(
              { stroke: v ? { ...stroke, width: v } : null, effects: value.effects },
              "lettering-stroke-w",
            ),
          )}
        </LayerRow>
      )}
      {effects.outline2 && (
        <LayerRow label={t("outline2")}>
          {color(t("outline2"), effects.outline2.color, (c) =>
            setEffects({ outline2: { ...effects.outline2!, color: c } }, "lettering-o2"),
          )}
          {thickness(t("width"), effects.outline2.width, (v) =>
            setEffects({ outline2: v ? { ...effects.outline2!, width: v } : null }, "lettering-o2-w"),
          )}
          <button
            type="button"
            aria-pressed={Boolean(effects.outline2.notched)}
            onClick={() =>
              setEffects(
                { outline2: { ...effects.outline2!, notched: !effects.outline2!.notched } },
                "lettering-o2-n",
              )
            }
            className={cn(
              "hover:bg-muted h-8 shrink-0 rounded-md border px-2 text-[11px]",
              effects.outline2.notched && "border-primary bg-accent",
            )}
          >
            {t("notched")}
          </button>
        </LayerRow>
      )}
      {effects.inline && (
        <LayerRow label={t("inline")}>
          {color(t("inline"), effects.inline.color, (c) =>
            setEffects({ inline: { ...effects.inline!, color: c } }, "lettering-in"),
          )}
          {thickness(t("width"), effects.inline.width, (v) =>
            setEffects({ inline: v ? { ...effects.inline!, width: v } : null }, "lettering-in-w"),
          )}
          {thickness(
            t("inset"),
            effects.inline.inset,
            (v) => setEffects({ inline: { ...effects.inline!, inset: v } }, "lettering-in-i"),
            max / 2,
            "⇥",
          )}
          <NumberField
            label="≡"
            title={t("lines")}
            className="w-14 shrink-0"
            value={effects.inline.lines ?? 1}
            min={1}
            max={6}
            onChange={(v) => setEffects({ inline: { ...effects.inline!, lines: v } }, "lettering-in-l")}
          />
        </LayerRow>
      )}
      {effects.extrude && (
        <LayerRow label={t("extrude")}>
          {color(t("extrude"), effects.extrude.color, (c) =>
            setEffects({ extrude: { ...effects.extrude!, color: c } }, "lettering-ex"),
          )}
          {thickness(
            t("depth"),
            effects.extrude.depth,
            (v) => setEffects({ extrude: v ? { ...effects.extrude!, depth: v } : null }, "lettering-ex-d"),
            max,
          )}
          <NumberField
            label="∠"
            title={t("angle")}
            className="w-16 shrink-0"
            value={effects.extrude.angle}
            min={-180}
            max={180}
            suffix="°"
            onChange={(v) => setEffects({ extrude: { ...effects.extrude!, angle: v } }, "lettering-ex-a")}
          />
        </LayerRow>
      )}
      {effects.pattern && (
        <LayerRow label={t("pattern")}>
          <NativeSelect
            aria-label={t("pattern")}
            className="w-28 shrink-0"
            value={effects.pattern.kind}
            onChange={(e) =>
              setEffects(
                { pattern: { ...effects.pattern!, kind: e.target.value as PatternKind } },
                "lettering-pt-k",
              )
            }
          >
            {PATTERN_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`presets.${kind}`)}
              </option>
            ))}
          </NativeSelect>
          {color(t("pattern"), effects.pattern.color, (c) =>
            setEffects({ pattern: { ...effects.pattern!, color: c } }, "lettering-pt"),
          )}
          {thickness(t("patternSize"), effects.pattern.size, (v) =>
            setEffects({ pattern: { ...effects.pattern!, size: Math.max(0.5, v) } }, "lettering-pt-s"),
          )}
          {(effects.pattern.kind === "stripes" || effects.pattern.kind === "claws") && (
            <NumberField
              label="∠"
              title={t("angle")}
              className="w-16 shrink-0"
              value={effects.pattern.angle}
              min={-180}
              max={180}
              suffix="°"
              onChange={(v) => setEffects({ pattern: { ...effects.pattern!, angle: v } }, "lettering-pt-a")}
            />
          )}
        </LayerRow>
      )}
      {effects.halftone && (
        <LayerRow label={t("halftone")}>
          {color(t("halftone"), effects.halftone.color, (c) =>
            setEffects({ halftone: { ...effects.halftone!, color: c } }, "lettering-ht"),
          )}
          {thickness(t("dotSize"), effects.halftone.size, (v) =>
            setEffects({ halftone: { ...effects.halftone!, size: Math.max(0.5, v) } }, "lettering-ht-s"),
          )}
          <NumberField
            label="∠"
            title={t("angle")}
            className="w-16 shrink-0"
            value={effects.halftone.angle}
            min={-180}
            max={180}
            suffix="°"
            onChange={(v) => setEffects({ halftone: { ...effects.halftone!, angle: v } }, "lettering-ht-a")}
          />
        </LayerRow>
      )}
    </div>
  );
}
