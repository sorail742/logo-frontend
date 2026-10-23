"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Crop,
  FlipHorizontal2,
  FlipVertical2,
  ImageUp,
  Lock,
  LockOpen,
  Scissors,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  SwatchBook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/common/native-select";
import { closestWeight, getFont } from "@/lib/render/fonts";
import { documentColors } from "@/lib/studio/doc";
import { aabb, union } from "@/lib/studio/geometry";
import { relayout } from "@/lib/studio/text";
import { PHOTO_PRESETS } from "@/lib/render/photo";
import { autoAdjust, downscale } from "@/lib/studio/pixels";
import { BLEND_MODES, type BlendMode, type DesignElement, type ImageElement, type ShapeElement, type SvgElement, type TextElement } from "@/lib/studio/types";
import { randomInt } from "@/lib/random";
import { selectedElements, useStudio } from "@/stores/studio";
import { useStudioContext } from "./context";
import { NumberField, Section, SliderField, ToggleButtons } from "./fields";
import { FontCoverageNotice } from "./font-coverage";
import { FontPicker } from "./font-picker";
import { ColorPicker, PaintPicker } from "./paint-picker";
import { PhotoEditor, type PhotoTab } from "./photo/photo-editor";

// Inspecteur : propriétés de la sélection (ou de la page), regroupées par section.

/** Filtres proposés d'un clic dans l'inspecteur (la galerie complète est dans l'atelier photo). */
const QUICK_PRESETS = ["original", "vivid", "warm", "mono", "vintage", "dramatic"];

type Updater = (fn: (el: DesignElement) => DesignElement, mergeKey?: string) => void;

export function Inspector() {
  const t = useTranslations("studio.inspector");
  const doc = useStudio((s) => s.doc);
  const pageIndex = useStudio((s) => s.pageIndex);
  const selection = useStudio((s) => s.selection);
  const selected = useMemo(() => selectedElements({ doc, pageIndex, selection }), [doc, pageIndex, selection]);
  const { brand } = useStudioContext();
  const docColors = useMemo(() => (doc ? documentColors(doc) : []), [doc]);
  const brandColors = brand?.palette ?? [];

  if (!doc) return null;
  const state = useStudio.getState();

  const update: Updater = (fn, mergeKey) => state.updateElements(selection, fn, mergeKey ? { merge: mergeKey } : "push");
  const colorProps = { brandColors, documentColors: docColors };

  if (!selected.length) return <PageInspector colorProps={colorProps} />;

  const single = selected.length === 1 ? selected[0]! : null;
  const box = union(selected.map(aabb))!;
  const locked = selected.every((el) => el.locked);

  // Alignement : sur la page pour un élément, sur la sélection pour plusieurs.
  const align = (kind: "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom") => {
    const ref = single ? { x: 0, y: 0, width: doc.width, height: doc.height } : box;
    update((el) => {
      if (el.locked) return el;
      const b = aabb(el);
      const dx = kind === "left" ? ref.x - b.x : kind === "right" ? ref.x + ref.width - b.x - b.width : kind === "hcenter" ? ref.x + (ref.width - b.width) / 2 - b.x : 0;
      const dy = kind === "top" ? ref.y - b.y : kind === "bottom" ? ref.y + ref.height - b.y - b.height : kind === "vcenter" ? ref.y + (ref.height - b.height) / 2 - b.y : 0;
      return { ...el, x: el.x + dx, y: el.y + dy };
    });
  };
  const distribute = (axis: "x" | "y") => {
    const items = selected.filter((el) => !el.locked).map((el) => ({ el, b: aabb(el) }));
    items.sort((a, b) => (axis === "x" ? a.b.x - b.b.x : a.b.y - b.b.y));
    const size = (b: { width: number; height: number }) => (axis === "x" ? b.width : b.height);
    const first = items[0]!.b;
    const last = items.at(-1)!.b;
    const span = axis === "x" ? last.x + last.width - first.x : last.y + last.height - first.y;
    const gap = (span - items.reduce((sum, i) => sum + size(i.b), 0)) / (items.length - 1);
    let cursor = axis === "x" ? first.x : first.y;
    const targets = new Map<string, number>();
    for (const item of items) {
      targets.set(item.el.id, cursor - (axis === "x" ? item.b.x : item.b.y));
      cursor += size(item.b) + gap;
    }
    update((el) => {
      const delta = targets.get(el.id) ?? 0;
      return axis === "x" ? { ...el, x: el.x + delta } : { ...el, y: el.y + delta };
    });
  };

  const moveGroup = (axis: "x" | "y", value: number) => {
    const delta = value - (axis === "x" ? box.x : box.y);
    update((el) => (el.locked ? el : axis === "x" ? { ...el, x: el.x + delta } : { ...el, y: el.y + delta }), `pos-${axis}`);
  };

  const shadow = single?.shadow ?? null;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold">{single ? t(`types.${single.type}`) : t("multiple", { count: selected.length })}</p>
        <Button variant="ghost" size="icon-sm" onClick={() => update((el) => ({ ...el, locked: !locked }))} aria-label={locked ? t("unlock") : t("lock")} title={locked ? t("unlock") : t("lock")}>
          {locked ? <Lock /> : <LockOpen />}
        </Button>
      </div>

      {single?.type === "text" && <TextSection el={single} update={update} colorProps={colorProps} />}
      {single?.type === "shape" && <ShapeSection el={single} update={update} colorProps={colorProps} />}
      {single?.type === "icon" && (
        <Section title={t("icon")}>
          <ColorPicker value={single.color} onChange={(color) => update((el) => (el.type === "icon" ? { ...el, color } : el), "icon-color")} label={t("color")} {...colorProps} />
          <SliderField label={t("strokeWidth")} value={single.strokeWidth} min={0.5} max={4} step={0.25} onChange={(v) => update((el) => (el.type === "icon" ? { ...el, strokeWidth: v } : el), "icon-stroke")} />
        </Section>
      )}
      {single?.type === "image" && <ImageSection el={single} update={update} />}
      {single?.type === "svg" && <SvgSection el={single} update={update} />}

      <Section title={t("layout")}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={single ? single.x : box.x} onChange={(v) => (single ? update((el) => ({ ...el, x: v }), "pos-x") : moveGroup("x", v))} disabled={locked} />
          <NumberField label="Y" value={single ? single.y : box.y} onChange={(v) => (single ? update((el) => ({ ...el, y: v }), "pos-y") : moveGroup("y", v))} disabled={locked} />
          <NumberField
            label="L"
            title={t("width")}
            value={single ? single.width : box.width}
            min={1}
            disabled={!single || locked}
            onChange={(v) =>
              update((el) => {
                if (el.type === "text") return relayout({ ...el, width: v });
                const keep = el.type === "icon" || el.type === "svg";
                return { ...el, width: v, height: keep ? (el.height * v) / el.width : el.height };
              }, "size-w")
            }
          />
          <NumberField
            label="H"
            title={t("height")}
            value={single ? single.height : box.height}
            min={1}
            disabled={!single || locked || single.type === "text"}
            onChange={(v) =>
              update((el) => {
                const keep = el.type === "icon" || el.type === "svg";
                return { ...el, height: v, width: keep ? (el.width * v) / el.height : el.width };
              }, "size-h")
            }
          />
          <NumberField label="↻" title={t("rotation")} value={single?.rotation ?? 0} min={-180} max={180} suffix="°" disabled={!single || locked} onChange={(v) => update((el) => ({ ...el, rotation: v }), "rotation")} />
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="flex-1" onClick={() => update((el) => ({ ...el, flipX: !el.flipX }))} aria-label={t("flipX")} title={t("flipX")} disabled={locked}>
              <FlipHorizontal2 />
            </Button>
            <Button variant="outline" size="icon" className="flex-1" onClick={() => update((el) => ({ ...el, flipY: !el.flipY }))} aria-label={t("flipY")} title={t("flipY")} disabled={locked}>
              <FlipVertical2 />
            </Button>
          </div>
        </div>
        <fieldset className="grid grid-cols-6 gap-1">
          <legend className="sr-only">{single ? t("alignPage") : t("alignSelection")}</legend>
          {(
            [
              ["left", AlignStartVertical],
              ["hcenter", AlignCenterVertical],
              ["right", AlignEndVertical],
              ["top", AlignStartHorizontal],
              ["vcenter", AlignCenterHorizontal],
              ["bottom", AlignEndHorizontal],
            ] as const
          ).map(([kind, Icon]) => (
            <Button key={kind} variant="ghost" size="icon-sm" onClick={() => align(kind)} aria-label={t(`align.${kind}`)} title={t(`align.${kind}`)} disabled={locked}>
              <Icon />
            </Button>
          ))}
        </fieldset>
        {selected.length >= 3 && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => distribute("x")}>
              <AlignHorizontalDistributeCenter />
              {t("distributeX")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => distribute("y")}>
              <AlignVerticalDistributeCenter />
              {t("distributeY")}
            </Button>
          </div>
        )}
        <fieldset className="grid grid-cols-4 gap-1">
          <legend className="sr-only">{t("order")}</legend>
          <Button variant="ghost" size="sm" onClick={() => state.arrange("front")} title={`${t("front")} (Ctrl+⇧+])`}>
            <ArrowUpToLine />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => state.arrange("forward")} title={`${t("forward")} (Ctrl+])`}>
            <ChevronUp />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => state.arrange("backward")} title={`${t("backward")} (Ctrl+[)`}>
            <ChevronDown />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => state.arrange("back")} title={`${t("back")} (Ctrl+⇧+[)`}>
            <ArrowDownToLine />
          </Button>
        </fieldset>
      </Section>

      <Section title={t("effects")}>
        <SliderField label={t("opacity")} value={Math.round((single?.opacity ?? selected[0]!.opacity) * 100)} min={0} max={100} format={(v) => `${v} %`} onChange={(v) => update((el) => ({ ...el, opacity: v / 100 }), "opacity")} />
        <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("blend")}</span>
          <NativeSelect value={single?.blend ?? "normal"} onChange={(e) => update((el) => ({ ...el, blend: e.target.value as BlendMode }))} aria-label={t("blend")}>
            {BLEND_MODES.map((b) => (
              <option key={b} value={b}>
                {t(`blends.${b}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("shadow")}</span>
          <Switch
            checked={Boolean(shadow)}
            onCheckedChange={(on) =>
              update((el) => ({ ...el, shadow: on ? { x: 0, y: Math.max(4, el.height * 0.03), blur: Math.max(8, el.height * 0.08), color: "#0f172a", opacity: 0.3 } : null }))
            }
            aria-label={t("shadow")}
          />
        </div>
        {shadow && (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ["soft", { x: 0, y: 8, blur: 24, color: "#0f172a", opacity: 0.25 }],
                  ["hard", { x: 8, y: 8, blur: 0, color: "#0f172a", opacity: 0.9 }],
                  ["glow", { x: 0, y: 0, blur: 28, color: brandColors[1] ?? "#f59e0b", opacity: 0.8 }],
                ] as const
              ).map(([id, preset]) => (
                <Button key={id} variant="outline" size="xs" onClick={() => update((el) => ({ ...el, shadow: { ...preset } }))}>
                  {t(`shadows.${id}`)}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <NumberField label="X" value={shadow.x} onChange={(v) => update((el) => ({ ...el, shadow: el.shadow && { ...el.shadow, x: v } }), "shadow")} />
              <NumberField label="Y" value={shadow.y} onChange={(v) => update((el) => ({ ...el, shadow: el.shadow && { ...el.shadow, y: v } }), "shadow")} />
              <NumberField label={t("blur")} value={shadow.blur} min={0} onChange={(v) => update((el) => ({ ...el, shadow: el.shadow && { ...el.shadow, blur: v } }), "shadow")} />
            </div>
            <ColorPicker value={shadow.color} onChange={(color) => update((el) => ({ ...el, shadow: el.shadow && { ...el.shadow, color } }), "shadow-color")} label={t("shadowColor")} {...colorProps} />
            <SliderField label={t("shadowOpacity")} value={Math.round(shadow.opacity * 100)} min={0} max={100} format={(v) => `${v} %`} onChange={(v) => update((el) => ({ ...el, shadow: el.shadow && { ...el.shadow, opacity: v / 100 } }), "shadow")} />
          </>
        )}
      </Section>
    </div>
  );
}

type ColorProps = { brandColors: string[]; documentColors: string[] };

function Row({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function TextSection({ el, update, colorProps }: Readonly<{ el: TextElement; update: Updater; colorProps: ColorProps }>) {
  const t = useTranslations("studio.inspector");
  const { brand } = useStudioContext();
  const font = getFont(el.fontId);
  const text = (fn: (el: TextElement) => TextElement, key?: string) => update((e) => (e.type === "text" ? relayout(fn(e)) : e), key);
  const brandFonts = brand ? [brand.heading.fontId, brand.body.fontId] : [];

  return (
    <>
      <Section title={t("text")}>
        <FontPicker value={el.fontId} onChange={(fontId) => text((e) => ({ ...e, fontId, fontWeight: closestWeight(fontId, e.fontWeight) }))} brandFonts={brandFonts} />
        <FontCoverageNotice text={el.text} fontId={el.fontId} />
        <div className="grid grid-cols-2 gap-2">
          <NativeSelect value={String(el.fontWeight)} onChange={(e) => text((x) => ({ ...x, fontWeight: Number(e.target.value) }))} aria-label={t("weight")}>
            {font.weights.map((w) => (
              <option key={w} value={w}>
                {t(`weights.${w}`)}
              </option>
            ))}
          </NativeSelect>
          <NumberField label="Aa" title={t("size")} value={el.fontSize} min={4} max={2000} precision={1} onChange={(v) => text((x) => ({ ...x, fontSize: v }), "font-size")} />
          <NumberField label="↔" title={t("letterSpacing")} value={Math.round(el.letterSpacing * 100)} min={-20} max={100} suffix="%" onChange={(v) => text((x) => ({ ...x, letterSpacing: v / 100 }), "letter-spacing")} />
          <NumberField label="↕" title={t("lineHeight")} value={el.lineHeight} min={0.6} max={3} step={0.05} precision={2} onChange={(v) => text((x) => ({ ...x, lineHeight: v }), "line-height")} />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <ToggleButtons
            label={t("textAlign")}
            value={el.align}
            onChange={(align) => text((x) => ({ ...x, align }))}
            options={[
              { value: "left", label: t("alignText.left"), icon: <AlignLeft /> },
              { value: "center", label: t("alignText.center"), icon: <AlignCenter /> },
              { value: "right", label: t("alignText.right"), icon: <AlignRight /> },
            ]}
          />
          <Button variant={el.uppercase ? "default" : "outline"} size="sm" onClick={() => text((x) => ({ ...x, uppercase: !x.uppercase }))} aria-pressed={el.uppercase} title={t("uppercase")}>
            AA
          </Button>
        </div>
        <Row label={t("fill")}>
          <PaintPicker value={el.fill} onChange={(fill) => update((e) => (e.type === "text" ? { ...e, fill } : e), "text-fill")} label={t("fill")} {...colorProps} />
        </Row>
      </Section>
      <Section title={t("textEffects")} defaultOpen={Boolean(el.stroke || el.curve || el.highlight)}>
        <Row label={t("outline")}>
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(el.stroke)}
              onCheckedChange={(on) => update((e) => (e.type === "text" ? { ...e, stroke: on ? { color: "#111827", width: Math.max(1, e.fontSize * 0.04) } : null } : e))}
              aria-label={t("outline")}
            />
            {el.stroke && (
              <>
                <ColorPicker value={el.stroke.color} onChange={(color) => update((e) => (e.type === "text" && e.stroke ? { ...e, stroke: { ...e.stroke, color } } : e), "text-stroke")} label={t("outlineColor")} {...colorProps} />
                <NumberField label="⌀" className="w-20 shrink-0" value={el.stroke.width} min={0.5} max={200} precision={1} onChange={(v) => update((e) => (e.type === "text" && e.stroke ? { ...e, stroke: { ...e.stroke, width: v } } : e), "text-stroke-w")} />
              </>
            )}
          </div>
        </Row>
        <SliderField label={t("curve")} value={el.curve ?? 0} min={-100} max={100} onChange={(v) => text((x) => ({ ...x, curve: v || undefined }), "curve")} />
        <Row label={t("highlight")}>
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(el.highlight)}
              onCheckedChange={(on) => update((e) => (e.type === "text" ? { ...e, highlight: on ? { color: colorProps.brandColors[1] ?? "#fde047", padding: e.fontSize * 0.25, radius: e.fontSize * 0.2 } : null } : e))}
              aria-label={t("highlight")}
            />
            {el.highlight && <ColorPicker value={el.highlight.color} onChange={(color) => update((e) => (e.type === "text" && e.highlight ? { ...e, highlight: { ...e.highlight, color } } : e), "highlight")} label={t("highlightColor")} {...colorProps} />}
          </div>
        </Row>
        {el.highlight && (
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="⇲" title={t("padding")} value={el.highlight.padding} min={0} onChange={(v) => update((e) => (e.type === "text" && e.highlight ? { ...e, highlight: { ...e.highlight, padding: v } } : e), "highlight-p")} />
            <NumberField label="◜" title={t("radius")} value={el.highlight.radius} min={0} onChange={(v) => update((e) => (e.type === "text" && e.highlight ? { ...e, highlight: { ...e.highlight, radius: v } } : e), "highlight-r")} />
          </div>
        )}
      </Section>
    </>
  );
}

function ShapeSection({ el, update, colorProps }: Readonly<{ el: ShapeElement; update: Updater; colorProps: ColorProps }>) {
  const t = useTranslations("studio.inspector");
  const shape = (fn: (el: ShapeElement) => ShapeElement, key?: string) => update((e) => (e.type === "shape" ? fn(e) : e), key);
  const line = el.shape === "line" || el.shape === "arrow";
  return (
    <Section title={t("shape")}>
      {!line && (
        <Row label={t("fill")}>
          <PaintPicker value={el.fill} onChange={(fill) => shape((e) => ({ ...e, fill }), "shape-fill")} label={t("fill")} allowNone {...colorProps} />
        </Row>
      )}
      <Row label={line ? t("line") : t("border")}>
        <div className="flex items-center gap-2">
          {!line && (
            <Switch checked={Boolean(el.stroke)} onCheckedChange={(on) => shape((e) => ({ ...e, stroke: on ? { color: "#111827", width: Math.max(2, Math.min(e.width, e.height) * 0.02), dash: "solid" } : null }))} aria-label={t("border")} />
          )}
          {el.stroke && (
            <>
              <ColorPicker value={el.stroke.color} onChange={(color) => shape((e) => (e.stroke ? { ...e, stroke: { ...e.stroke, color } } : e), "shape-stroke")} label={t("borderColor")} {...colorProps} />
              <NumberField label="⌀" className="w-20 shrink-0" value={el.stroke.width} min={0.5} max={400} precision={1} onChange={(v) => shape((e) => (e.stroke ? { ...e, stroke: { ...e.stroke, width: v } } : e), "shape-stroke-w")} />
            </>
          )}
        </div>
      </Row>
      {el.stroke && (
        <Row label={t("dash")}>
          <NativeSelect value={el.stroke.dash ?? "solid"} onChange={(e) => shape((x) => (x.stroke ? { ...x, stroke: { ...x.stroke, dash: e.target.value as "solid" | "dashed" | "dotted" } } : x))} aria-label={t("dash")}>
            {(["solid", "dashed", "dotted"] as const).map((d) => (
              <option key={d} value={d}>
                {t(`dashes.${d}`)}
              </option>
            ))}
          </NativeSelect>
        </Row>
      )}
      {el.shape === "rect" && <SliderField label={t("radius")} value={Math.round(el.radius ?? 0)} min={0} max={Math.round(Math.min(el.width, el.height) / 2)} onChange={(v) => shape((e) => ({ ...e, radius: v }), "radius")} />}
      {(el.shape === "polygon" || el.shape === "star") && <SliderField label={el.shape === "star" ? t("points") : t("sides")} value={el.sides ?? 5} min={3} max={24} onChange={(v) => shape((e) => ({ ...e, sides: v }), "sides")} />}
      {el.shape === "star" && <SliderField label={t("innerRatio")} value={Math.round((el.innerRatio ?? 0.5) * 100)} min={15} max={95} format={(v) => `${v} %`} onChange={(v) => shape((e) => ({ ...e, innerRatio: v / 100 }), "inner")} />}
      {el.shape === "blob" && (
        <Button variant="outline" size="sm" onClick={() => shape((e) => ({ ...e, seed: randomInt(1000) }))}>
          <Shuffle />
          {t("reshape")}
        </Button>
      )}
    </Section>
  );
}

function ImageSection({ el, update }: Readonly<{ el: ImageElement; update: Updater }>) {
  const t = useTranslations("studio.inspector");
  const tp = useTranslations("studio.photo");
  const { pickImages } = useStudioContext();
  const [editing, setEditing] = useState<PhotoTab | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const image = (fn: (el: ImageElement) => ImageElement, key?: string) => update((e) => (e.type === "image" ? fn(e) : e), key);
  const retouched = [el.adjust, el.filters, el.crop, el.cutout, el.outline, el.glow].some(Boolean) || Boolean(el.straighten);
  const enhance = () => {
    setEnhancing(true);
    void downscale(el.src, 320)
      .then(({ pixels }) => image((e) => ({ ...e, filters: undefined, adjust: { ...e.adjust, ...autoAdjust(pixels) } })))
      .finally(() => setEnhancing(false));
  };
  return (
    <>
      <Section title={t("photo")}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => useStudio.getState().setCrop(el.id)} title={t("reframeHint")}>
            <Crop />
            {t("reframe")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => pickImages(el.id)}>
            <ImageUp />
            {t("replace")}
          </Button>
        </div>
        <Row label={t("fit")}>
          <ToggleButtons
            label={t("fit")}
            value={el.fit}
            onChange={(fit) => image((e) => ({ ...e, fit }))}
            options={[
              { value: "cover", label: t("fits.cover"), icon: <span className="text-[10px] font-medium">{t("fits.cover")}</span> },
              { value: "contain", label: t("fits.contain"), icon: <span className="text-[10px] font-medium">{t("fits.contain")}</span> },
            ]}
          />
        </Row>
        <Row label={t("mask")}>
          <NativeSelect value={el.mask} onChange={(e) => image((x) => ({ ...x, mask: e.target.value as ImageElement["mask"] }))} aria-label={t("mask")}>
            {(["none", "rounded", "circle", "arch", "blob"] as const).map((m) => (
              <option key={m} value={m}>
                {t(`masks.${m}`)}
              </option>
            ))}
          </NativeSelect>
        </Row>
        {el.mask === "rounded" && <SliderField label={t("radius")} value={Math.round(el.radius ?? Math.min(el.width, el.height) * 0.12)} min={0} max={Math.round(Math.min(el.width, el.height) / 2)} onChange={(v) => image((e) => ({ ...e, radius: v }), "radius")} />}
      </Section>
      <Section title={t("filters")}>
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" onClick={() => setEditing("adjust")}>
            <SlidersHorizontal />
            {tp("open")}
          </Button>
          <Button size="sm" variant="outline" disabled={enhancing} onClick={enhance}>
            <Sparkles />
            {tp("auto")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing("presets")}>
            <SwatchBook />
            {tp("tabs.presets")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing("crop")}>
            <Crop />
            {tp("tabs.crop")}
          </Button>
          <Button size="sm" variant="outline" className="col-span-2" onClick={() => setEditing("cutout")}>
            <Scissors />
            {tp("removeBackground")}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {QUICK_PRESETS.map((id) => (
            <Button
              key={id}
              variant="ghost"
              size="xs"
              onClick={() => image((e) => ({ ...e, filters: undefined, adjust: id === "original" ? undefined : structuredClone(PHOTO_PRESETS.find((p) => p.id === id)?.adjust) }))}
            >
              {tp(`presets.${id}`)}
            </Button>
          ))}
        </div>
        {retouched && (
          <Button
            variant="ghost"
            size="xs"
            className="justify-self-start text-muted-foreground"
            onClick={() => image((e) => ({ ...e, filters: undefined, adjust: undefined, crop: null, straighten: undefined, cutout: null, outline: null, glow: null }))}
          >
            {tp("resetAll")}
          </Button>
        )}
      </Section>
      {editing && (
        <PhotoEditor
          el={el}
          initialTab={editing}
          onClose={() => setEditing(null)}
          onApply={(next) => {
            image(() => next);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function SvgSection({ el, update }: Readonly<{ el: SvgElement; update: Updater }>) {
  const t = useTranslations("studio.inspector");
  const { brand } = useStudioContext();
  const variants = Object.entries(brand?.logos ?? {}).filter(([, svg]) => Boolean(svg)) as [string, string][];
  if (el.source !== "logo" || variants.length < 2) return null;
  return (
    <Section title={t("logoVariant")}>
      <div className="grid grid-cols-3 gap-1.5">
        {variants.map(([id, svg]) => (
          <button
            key={id}
            type="button"
            onClick={() => update((e) => (e.type === "svg" ? { ...e, svg } : e))}
            className={`flex aspect-[4/3] items-center justify-center rounded-lg border p-1.5 transition hover:border-primary ${id === "white" ? "bg-slate-800" : "bg-white"} ${el.svg === svg ? "ring-2 ring-primary" : ""}`}
            title={t(`logoVariants.${id}`)}
            aria-label={t(`logoVariants.${id}`)}
          >
            <span className="flex size-full items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          </button>
        ))}
      </div>
    </Section>
  );
}

function PageInspector({ colorProps }: Readonly<{ colorProps: ColorProps }>) {
  const t = useTranslations("studio.inspector");
  const doc = useStudio((s) => s.doc)!;
  const pageIndex = useStudio((s) => s.pageIndex);
  const printGuides = useStudio((s) => s.printGuides);
  const page = doc.pages[pageIndex]!;
  const state = useStudio.getState();
  const setPage = (patch: Partial<typeof page>, key?: string) =>
    state.change((d) => ({ ...d, pages: d.pages.map((p, i) => (i === pageIndex ? { ...p, ...patch } : p)) }), key ? { merge: key } : "push");

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">{t("page", { number: pageIndex + 1 })}</p>
        <p className="text-xs text-muted-foreground">
          {doc.print ? t("printSize", { width: doc.print.widthMm, height: doc.print.heightMm, bleed: doc.print.bleedMm }) : t("screenSize", { width: doc.width, height: doc.height })}
        </p>
      </div>
      <Section title={t("background")}>
        <PaintPicker value={page.background} onChange={(background) => setPage({ background }, "page-bg")} label={t("background")} {...colorProps} />
        {colorProps.brandColors.length > 0 && (
          <div className="flex gap-1.5">
            {colorProps.brandColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setPage({ background: { type: "solid", color } })}
                className="size-7 rounded-md border border-black/10 transition hover:scale-105"
                style={{ background: color }}
                aria-label={t("useAsBackground", { color: color.toUpperCase() })}
                title={t("useAsBackground", { color: color.toUpperCase() })}
              />
            ))}
          </div>
        )}
        <Row label={t("pageName")}>
          <Input value={page.name ?? ""} onChange={(e) => setPage({ name: e.target.value || undefined }, "page-name")} className="h-8 text-xs" placeholder={t("page", { number: pageIndex + 1 })} />
        </Row>
      </Section>
      {doc.print && (
        <Section title={t("print")}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("printGuides")}</span>
            <Switch checked={printGuides} onCheckedChange={() => state.togglePrintGuides()} aria-label={t("printGuides")} />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("printHelp", { bleed: doc.print.bleedMm })}</p>
        </Section>
      )}
      <Section title={t("tips")}>
        <ul className="grid gap-1.5 text-xs leading-relaxed text-muted-foreground">
          {(["tipDrag", "tipAlt", "tipShift", "tipSpace", "tipDouble"] as const).map((key) => (
            <li key={key} className="flex gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
