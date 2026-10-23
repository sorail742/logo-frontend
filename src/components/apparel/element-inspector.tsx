"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDown,
  ArrowUp,
  Copy,
  Crop,
  FlipHorizontal2,
  FlipVertical2,
  Loader2,
  Maximize,
  Palette,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NumberField, Section, SliderField } from "@/components/studio/fields";
import { FontCoverageNotice } from "@/components/studio/font-coverage";
import { FontPicker } from "@/components/studio/font-picker";
import { ColorPicker } from "@/components/studio/paint-picker";
import { PhotoEditor, type PhotoTab } from "@/components/studio/photo/photo-editor";
import { errorMessage } from "@/lib/api/errors";
import {
  fitInZone,
  isTextKind,
  photoPixelWidth,
  refitText,
  svgColors,
  textChecks,
} from "@/lib/apparel/elements";
import { toStudioElement, type EditorElement } from "@/lib/apparel/render";
import { MIN_RASTER_DPI, printDpi } from "@/lib/apparel/rules";
import { separateInks } from "@/lib/apparel/separation";
import type { ApparelContent, ApparelPhoto, PrintZone } from "@/lib/apparel/types";
import { getFont } from "@/lib/render/fonts";
import type { BrandLogos } from "@/lib/studio/brand";
import { autoAdjust, loadPixels } from "@/lib/studio/pixels";
import { ensureFonts } from "@/lib/studio/text";
import type { ImageElement } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { omit } from "@/lib/object";
import { useApparel } from "@/stores/apparel";
import { useApparelEditor } from "./editor";

// Inspecteur d'un élément : zone et géométrie en millimètres, puis réglages propres au texte
// (police, couleurs, contour, arc), au logo (déclinaison, couleur unique) ou à la photo
// (atelier de retouche du Studio, séparation en tons directs, droits).

const round = (value: number) => Math.round(value * 10) / 10;

const INSPECTOR = "apparel.inspector";

/** Remplace toutes les couleurs d'un SVG par une seule (flex, flocage, broderie). */
function recolorSvg(svg: string, color: string) {
  return svg.replaceAll(/((?:fill|stroke|stop-color)\s*[=:]\s*["']?)#[0-9a-f]{3,6}\b/gi, `$1${color}`);
}

/** Couleur de l'indicateur de résolution. */
function dpiTone(dpi: number | null) {
  if (dpi === null) return "bg-muted";
  return dpi >= MIN_RASTER_DPI
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "bg-destructive/10 text-destructive";
}

function Geometry({
  el,
  zone,
  zones,
  editable,
}: Readonly<{
  el: EditorElement;
  zone: PrintZone;
  zones: PrintZone[];
  editable: boolean;
}>) {
  const t = useTranslations(INSPECTOR);
  const update = (patch: Partial<EditorElement>, merge = "geometry") =>
    useApparel.getState().update(el.id, patch, { merge: `${merge}-${el.id}` });
  const ratio = el.widthMm / el.heightMm;

  /** Nouvelle taille, centre conservé ; le texte suit sa hauteur. */
  const resize = (widthMm: number, heightMm: number) => {
    const content = isTextKind(el.kind)
      ? { ...el.content, ...textChecks(el.content, heightMm, widthMm) }
      : el.content;
    update(
      {
        widthMm: round(widthMm),
        heightMm: round(heightMm),
        offsetXMm: round(el.offsetXMm + (el.widthMm - widthMm) / 2),
        offsetYMm: round(el.offsetYMm + (el.heightMm - heightMm) / 2),
        content,
      },
      "size",
    );
  };

  const moveTo = (key: string) => {
    const target = zones.find((z) => z.key === key);
    if (!target) return;
    // Recentré dans la nouvelle zone, réduit s'il n'y tient pas.
    const k = Math.min(1, (target.maxWidthMm * 0.95) / el.widthMm, (target.maxHeightMm * 0.95) / el.heightMm);
    const widthMm = round(el.widthMm * k);
    const heightMm = round(el.heightMm * k);
    const content = isTextKind(el.kind)
      ? { ...el.content, ...textChecks(el.content, heightMm, widthMm) }
      : el.content;
    useApparel
      .getState()
      .update(el.id, {
        zoneKey: key,
        widthMm,
        heightMm,
        offsetXMm: round((target.maxWidthMm - widthMm) / 2),
        offsetYMm: round((target.maxHeightMm - heightMm) / 2),
        content,
      });
    useApparel.getState().setTargetZone(key);
  };

  return (
    <Section title={t("placement")}>
      <label className="text-muted-foreground grid gap-1 text-xs">
        {t("zone")}
        <NativeSelect value={el.zoneKey} onChange={(e) => moveTo(e.target.value)} disabled={!editable}>
          {zones.map((z) => (
            <option key={z.key} value={z.key}>
              {z.label} ({z.maxWidthMm} × {z.maxHeightMm} mm)
            </option>
          ))}
        </NativeSelect>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="L"
          title={t("width")}
          value={el.widthMm}
          min={5}
          max={zone.maxWidthMm * 1.5}
          precision={1}
          suffix="mm"
          onChange={(w) => resize(w, w / ratio)}
          disabled={!editable}
        />
        <NumberField
          label="H"
          title={t("height")}
          value={el.heightMm}
          min={5}
          max={zone.maxHeightMm * 1.5}
          precision={1}
          suffix="mm"
          onChange={(h) => resize(h * ratio, h)}
          disabled={!editable}
        />
        <NumberField
          label="X"
          title={t("offsetX")}
          value={el.offsetXMm}
          precision={1}
          suffix="mm"
          onChange={(x) => update({ offsetXMm: round(x) })}
          disabled={!editable}
        />
        <NumberField
          label="Y"
          title={t("offsetY")}
          value={el.offsetYMm}
          precision={1}
          suffix="mm"
          onChange={(y) => update({ offsetYMm: round(y) })}
          disabled={!editable}
        />
        <NumberField
          label="°"
          title={t("rotation")}
          value={el.rotationDeg ?? 0}
          min={-180}
          max={180}
          onChange={(r) => update({ rotationDeg: Math.round(r) }, "rotation")}
          disabled={!editable}
        />
      </div>
      {editable && (
        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => update({ offsetXMm: round((zone.maxWidthMm - el.widthMm) / 2) })}
          >
            <AlignCenterVertical /> {t("centerH")}
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => update({ offsetYMm: round((zone.maxHeightMm - el.heightMm) / 2) })}
          >
            <AlignCenterHorizontal /> {t("centerV")}
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              const box = fitInZone(ratio, zone, 0.95);
              const content = isTextKind(el.kind)
                ? { ...el.content, ...textChecks(el.content, box.heightMm, box.widthMm) }
                : el.content;
              useApparel.getState().update(el.id, { ...box, rotationDeg: 0, content });
            }}
          >
            <Maximize /> {t("fit")}
          </Button>
        </div>
      )}
    </Section>
  );
}

function TextSettings({ el, zone, editable }: Readonly<{ el: EditorElement; zone: PrintZone; editable: boolean }>) {
  const t = useTranslations(INSPECTOR);
  const { brandColors } = useApparelEditor();
  const c = el.content;
  const font = getFont(c.fontId ?? "montserrat");

  /** Contenu modifié : largeur recalculée (polices chargées d'abord). */
  const write = async (patch: Partial<ApparelContent>, merge = "text") => {
    const content = { ...c, ...patch };
    // Police changée, ou lettres hors du latin de base (pular, N'Ko) : polices chargées avant la mesure.
    if (patch.fontId || patch.fontWeight || /[\u0100-\uFFFF]/u.test(patch.text ?? ""))
      await ensureFonts([{ fontId: content.fontId ?? "montserrat", fontWeight: content.fontWeight ?? 700, text: content.text }]);
    useApparel
      .getState()
      .update(el.id, (current) => refitText(current, { ...current.content, ...patch }, zone), {
        merge: `${merge}-${el.id}`,
      });
  };

  // La boîte reste la même : le corps diminue à mesure que l'arc se creuse.
  const setCurve = (curve: number) =>
    useApparel.getState().update(
      el.id,
      (current) => {
        const content = { ...current.content, curve: curve || undefined };
        return {
          ...current,
          content: { ...content, ...textChecks(content, current.heightMm, current.widthMm) },
        };
      },
      { merge: `curve-${el.id}` },
    );

  return (
    <Section title={t("text")}>
      <Input
        value={c.text ?? ""}
        onChange={(e) =>
          void write({
            text:
              el.kind === "PLAYER_NUMBER"
                ? e.target.value.replaceAll(/\D/g, "").slice(0, 3)
                : e.target.value.slice(0, 60),
          })
        }
        inputMode={el.kind === "PLAYER_NUMBER" ? "numeric" : undefined}
        aria-label={t("content")}
        disabled={!editable}
      />
      {el.kind === "PLAYER_NAME" && <p className="text-muted-foreground text-[11px]">{t("nameHint")}</p>}
      <FontPicker
        value={font.id}
        onChange={(fontId) =>
          void write({
            fontId,
            fontWeight: getFont(fontId).weights.includes(c.fontWeight ?? 700)
              ? c.fontWeight
              : getFont(fontId).weights.at(-1),
          })
        }
      />
      <FontCoverageNotice text={c.text ?? ""} fontId={font.id} />
      <NativeSelect
        value={String(c.fontWeight ?? 700)}
        onChange={(e) => void write({ fontWeight: Number(e.target.value) })}
        aria-label={t("weight")}
        disabled={!editable}
      >
        {font.weights.map((w) => (
          <option key={w} value={w}>
            {t(`weights.${w}`)}
          </option>
        ))}
      </NativeSelect>
      <ColorPicker
        label={t("fill")}
        value={c.fill ?? "#111111"}
        onChange={(fill) => void write({ fill }, "fill")}
        brandColors={brandColors}
      />
      <SliderField
        label={t("outline")}
        value={c.textOutline?.widthMm ?? 0}
        min={0}
        max={8}
        step={0.5}
        format={(v) => `${v} mm`}
        onChange={(widthMm) =>
          void write(
            { textOutline: widthMm ? { color: c.textOutline?.color ?? "#ffffff", widthMm } : null },
            "outline",
          )
        }
      />
      {(c.textOutline?.widthMm ?? 0) > 0 && (
        <ColorPicker
          label={t("outlineColor")}
          value={c.textOutline!.color}
          onChange={(color) =>
            void write({ textOutline: { widthMm: c.textOutline!.widthMm, color } }, "outline-color")
          }
          brandColors={brandColors}
        />
      )}
      <SliderField
        label={t("spacing")}
        value={c.letterSpacing ?? 0}
        min={-0.05}
        max={0.4}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(letterSpacing) => void write({ letterSpacing }, "spacing")}
      />
      {el.kind !== "PLAYER_NUMBER" && (
        <SliderField
          label={t("arc")}
          value={c.curve ?? 0}
          min={-100}
          max={100}
          format={(v) => `${v}`}
          onChange={setCurve}
        />
      )}
    </Section>
  );
}

function LogoSettings({ el, editable }: Readonly<{ el: EditorElement; editable: boolean }>) {
  const t = useTranslations(INSPECTOR);
  const ta = useTranslations("apparel.add");
  const { logos, brandColors } = useApparelEditor();
  const c = el.content;
  const variants = (Object.keys(logos) as (keyof BrandLogos)[]).filter(
    (k) => logos[k] && ["color", "white", "black"].includes(k),
  );
  const mono = c.colors?.length === 1 ? c.colors[0]! : null;

  const applyVariant = (key: keyof BrandLogos) => {
    const svg = logos[key]!;
    useApparel.getState().update(el.id, { content: { ...c, svg, logoVariant: key, colors: svgColors(svg) } });
  };

  return (
    <Section title={t("logo")}>
      {variants.length > 0 && c.source !== "upload" && (
        <fieldset className="flex flex-wrap gap-1">
          <legend className="sr-only">{t("variant")}</legend>
          {variants.map((key) => (
            <Button
              key={key}
              size="xs"
              variant={c.logoVariant === key ? "default" : "outline"}
              onClick={() => applyVariant(key)}
              disabled={!editable}
            >
              {ta(`variants.${key}`)}
            </Button>
          ))}
        </fieldset>
      )}
      <div className="grid gap-1.5">
        <span className="text-muted-foreground text-xs">{t("inks", { count: c.colors?.length ?? 0 })}</span>
        <div className="flex flex-wrap gap-1">
          {(c.colors ?? []).map((color) => (
            <span
              key={color}
              className="size-5 rounded-full border shadow-xs"
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>
      </div>
      {editable && (
        <>
          <ColorPicker
            label={t("monochrome")}
            value={mono ?? "#111111"}
            onChange={(color) =>
              useApparel
                .getState()
                .update(
                  el.id,
                  { content: { ...c, svg: recolorSvg(c.svg ?? "", color), colors: [color.toLowerCase()] } },
                  { merge: `mono-${el.id}` },
                )
            }
            brandColors={brandColors}
          />
          <p className="text-muted-foreground text-[11px]">{t("monochromeHint")}</p>
          {c.logoVariant && logos[c.logoVariant as keyof BrandLogos] && (
            <Button variant="ghost" size="xs" onClick={() => applyVariant(c.logoVariant as keyof BrandLogos)}>
              <Undo2 /> {t("restoreColors")}
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

function PhotoSettings({ el, zone, editable }: Readonly<{ el: EditorElement; zone: PrintZone; editable: boolean }>) {
  const t = useTranslations(INSPECTOR);
  const technique = useApparel((s) => s.design?.technique);
  const photo = el.content.photo!;
  const [inks, setInks] = useState(technique === "SCREEN_PRINT" ? 4 : 6);
  const [busy, setBusy] = useState<"auto" | "separate" | null>(null);
  const dpi = printDpi(el);
  const open = (tab: PhotoTab) => useApparel.getState().editPhoto({ id: el.id, tab });
  const setPhoto = (patch: Partial<ApparelPhoto>, history?: { merge: string }) => {
    const next = { ...photo, ...patch };
    useApparel
      .getState()
      .update(el.id, { content: { ...el.content, photo: next, pixelWidth: photoPixelWidth(next) } }, history);
  };

  const auto = async () => {
    setBusy("auto");
    try {
      setPhoto({ adjust: autoAdjust(await loadPixels(photo.src, 400)) });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const separate = async () => {
    setBusy("separate");
    try {
      const studio = toStudioElement(el, zone, el.id) as ImageElement;
      const result = await separateInks(studio, photo, el, inks);
      useApparel
        .getState()
        .update(el.id, {
          content: {
            ...el.content,
            photo: result.photo,
            pixelWidth: result.photo.naturalWidth,
            colors: result.colors,
            spotColors: result.colors.length,
          },
        });
      toast.success(t("separated", { count: result.colors.length }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const restore = () => {
    const original = photo.original;
    if (!original) return;
    const content = omit(el.content, ["colors", "spotColors"]);
    useApparel
      .getState()
      .update(el.id, { content: { ...content, photo: original, pixelWidth: photoPixelWidth(original) } });
  };

  const tools: { tab: PhotoTab; icon: typeof Wand2; label: string }[] = [
    { tab: "adjust", icon: SlidersHorizontal, label: t("retouch") },
    { tab: "presets", icon: Palette, label: t("filters") },
    { tab: "crop", icon: Crop, label: t("crop") },
    { tab: "cutout", icon: Scissors, label: t("cutout") },
  ];

  return (
    <>
      <Section title={t("photo")}>
        <p className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium", dpiTone(dpi))}>
          {dpi === null ? t("dpiUnknown") : t("dpi", { dpi: Math.round(dpi), min: MIN_RASTER_DPI })}
        </p>
        {editable && (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {tools.map(({ tab, icon: Icon, label }) => (
                <Button
                  key={tab}
                  variant="outline"
                  size="sm"
                  onClick={() => open(tab)}
                  disabled={Boolean(photo.original)}
                >
                  <Icon /> {label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={() => void auto()}
                disabled={busy !== null || Boolean(photo.original)}
              >
                {busy === "auto" ? <Loader2 className="animate-spin" /> : <Wand2 />} {t("auto")}
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPhoto({ flipX: !photo.flipX })}
                aria-pressed={Boolean(photo.flipX)}
              >
                <FlipHorizontal2 /> {t("flipX")}
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPhoto({ flipY: !photo.flipY })}
                aria-pressed={Boolean(photo.flipY)}
              >
                <FlipVertical2 /> {t("flipY")}
              </Button>
            </div>
          </>
        )}
      </Section>
      {editable && (
        <Section title={t("separation")} defaultOpen={technique === "SCREEN_PRINT"}>
          <p className="text-muted-foreground text-[11px]">{t("separationHint")}</p>
          <SliderField
            label={t("inkCount")}
            value={inks}
            min={1}
            max={8}
            onChange={setInks}
            format={(v) => String(v)}
          />
          <Button size="sm" variant="secondary" onClick={() => void separate()} disabled={busy !== null}>
            {busy === "separate" ? <Loader2 className="animate-spin" /> : <Sparkles />} {t("separate")}
          </Button>
          {photo.original && (
            <>
              <div className="flex flex-wrap gap-1">
                {(el.content.colors ?? []).map((color) => (
                  <span
                    key={color}
                    className="size-5 rounded-full border shadow-xs"
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
              <Button size="xs" variant="ghost" onClick={restore}>
                <Undo2 /> {t("restorePhoto")}
              </Button>
            </>
          )}
        </Section>
      )}
    </>
  );
}

function Rights({ el, editable }: Readonly<{ el: EditorElement; editable: boolean }>) {
  const t = useTranslations(INSPECTOR);
  const attested = Boolean(el.content.rightsAttested);
  return (
    <Section title={t("rights")}>
      <label
        className={cn(
          "flex items-start gap-2 rounded-lg border p-2.5 text-xs",
          !attested && "border-amber-500/50 bg-amber-500/5",
        )}
      >
        <Checkbox
          checked={attested}
          disabled={!editable}
          onCheckedChange={(checked) =>
            useApparel
              .getState()
              .update(el.id, { content: { ...el.content, rightsAttested: Boolean(checked) } })
          }
          className="mt-0.5"
        />
        <span>{t("rightsLabel")}</span>
      </label>
    </Section>
  );
}

export function ElementInspector({ el }: Readonly<{ el: EditorElement }>) {
  const t = useTranslations("apparel");
  const { template, canEdit, projectId } = useApparelEditor();
  const previewSize = useApparel((s) => s.previewSize);
  const photoEditing = useApparel((s) => s.photoEditing);
  const editable = canEdit && !previewSize;
  const zone = template.zones.find((z) => z.key === el.zoneKey)!;
  const zones = template.zones.filter((z) => z.view === zone.view);
  const store = useApparel.getState;

  /** Photo retouchée : la boîte épouse la partie visible (recadrage), centre conservé. */
  const applyPhoto = (result: ImageElement) => {
    const photo: ApparelPhoto = {
      ...el.content.photo!,
      adjust: result.adjust,
      crop: result.crop ?? null,
      straighten: result.straighten,
      cutout: result.cutout ?? null,
      outline: result.outline ?? null,
      glow: result.glow ?? null,
      flipX: result.flipX,
      flipY: result.flipY,
    };
    const crop = photo.crop ?? { x: 0, y: 0, width: 1, height: 1 };
    const ratio = (crop.width * photo.naturalWidth) / (crop.height * photo.naturalHeight);
    const heightMm = round(el.widthMm / ratio);
    store().update(el.id, {
      heightMm,
      offsetYMm: round(el.offsetYMm + (el.heightMm - heightMm) / 2),
      content: { ...el.content, photo, pixelWidth: photoPixelWidth(photo) },
    });
    store().editPhoto(null);
  };

  return (
    <div>
      <div className="flex items-center gap-1 border-b px-4 py-2.5">
        <p className="mr-auto text-sm font-semibold">{t(`kinds.${el.kind}`)}</p>
        {editable && (
          <>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => store().arrange(el.id, "forward")}
              aria-label={t("add.forward")}
              title={t("add.forward")}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => store().arrange(el.id, "backward")}
              aria-label={t("add.backward")}
              title={t("add.backward")}
            >
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => store().duplicate(el.id)}
              aria-label={t("inspector.duplicate")}
              title={t("inspector.duplicate")}
            >
              <Copy />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => store().remove(el.id)}
              aria-label={t("add.remove")}
              title={t("add.remove")}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
      <Geometry el={el} zone={zone} zones={zones} editable={editable} />
      {isTextKind(el.kind) && <TextSettings el={el} zone={zone} editable={editable} />}
      {el.content.svg && <LogoSettings el={el} editable={editable} />}
      {el.content.photo && <PhotoSettings el={el} zone={zone} editable={editable} />}
      {el.content.source === "upload" && <Rights el={el} editable={editable} />}
      {photoEditing?.id === el.id && el.content.photo && (
        <PhotoEditor
          el={toStudioElement(el, zone, el.id) as ImageElement}
          initialTab={photoEditing.tab as PhotoTab}
          projectId={projectId}
          onApply={applyPhoto}
          onClose={() => store().editPhoto(null)}
        />
      )}
    </div>
  );
}
