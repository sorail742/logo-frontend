"use client";

import { useTranslations } from "next-intl";
import { Paintbrush, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cssFontFamily, getFont } from "@/lib/render/fonts";
import { isNeutral, nearestColor } from "@/lib/studio/color";
import { createIcon, createSvg, createText, mapPage, solid } from "@/lib/studio/doc";
import { svgParts } from "@/lib/studio/render";
import { ensureFonts, naturalWidth, relayout } from "@/lib/studio/text";
import type { DesignElement, Paint, TextElement } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { useStudioContext } from "../context";
import { addCentered, centered, pageUnit, useInkColors } from "../placement";

// Identité du projet : logos, couleurs, polices, nom et slogan, et application de la marque
// à toute une page (couleurs ramenées à la palette, polices de la marque).

function snapPaint(paint: Paint, palette: string[]): Paint {
  const snap = (c: string) => (isNeutral(c) ? c : nearestColor(c, palette).color);
  if (paint.type === "solid") return { ...paint, color: snap(paint.color) };
  if (paint.type === "linear" || paint.type === "radial") return { ...paint, stops: paint.stops.map((s) => ({ ...s, color: snap(s.color) })) };
  return paint;
}

export function BrandPanel() {
  const t = useTranslations("studio.brand");
  const { brand } = useStudioContext();
  const colors = useInkColors(brand);
  if (!brand) return <p className="text-xs text-muted-foreground">{t("none")}</p>;

  const logos = Object.entries(brand.logos).filter(([, svg]) => Boolean(svg)) as [string, string][];

  const addLogo = (svg: string) => {
    const parts = svgParts(svg);
    const ratio = parts.width / parts.height || 1;
    const height = pageUnit() * (ratio > 2 ? 0.16 : 0.3);
    addCentered([createSvg(svg, "logo", { width: height * ratio, height, role: "logo" })]);
  };

  const addText = async (content: string, heading: boolean) => {
    const font = heading ? brand.heading : brand.body;
    await ensureFonts([font]);
    const base = createText({ text: content, fontId: font.fontId, fontWeight: font.fontWeight, fontSize: pageUnit() * (heading ? 0.09 : 0.04), fill: solid(heading ? colors.accent : colors.ink), align: "center", role: heading ? "title" : "subtitle" });
    const width = Math.min(naturalWidth(base), useStudio.getState().doc!.width * 0.8);
    addCentered([relayout({ ...base, width })]);
  };

  /** Applique une couleur : à la sélection (remplissage, couleur) ou au fond de la page. */
  const applyColor = (color: string) => {
    const state = useStudio.getState();
    if (!state.selection.length) {
      state.change((d) => mapPage(d, state.pageIndex, (p) => ({ ...p, background: solid(color) })));
      return;
    }
    state.updateElements(state.selection, (el): DesignElement => {
      if (el.type === "text" || el.type === "shape") return { ...el, fill: solid(color) };
      if (el.type === "icon") return { ...el, color };
      return el;
    });
  };

  const applyBrand = async () => {
    const state = useStudio.getState();
    await ensureFonts([brand.heading, brand.body]);
    const palette = brand.palette;
    state.change((d) =>
      mapPage(d, state.pageIndex, (page) => {
        const texts = page.elements.filter((el): el is TextElement => el.type === "text");
        const largest = Math.max(0, ...texts.map((x) => x.fontSize));
        return {
          ...page,
          background: snapPaint(page.background, palette),
          elements: page.elements.map((el) => {
            switch (el.type) {
              case "text": {
                const heading = el.role === "title" || (!el.role && el.fontSize >= largest * 0.6);
                const font = heading ? brand.heading : brand.body;
                return relayout({ ...el, fontId: font.fontId, fontWeight: heading ? font.fontWeight : el.fontWeight, fill: snapPaint(el.fill, palette), stroke: el.stroke ? { ...el.stroke, color: isNeutral(el.stroke.color) ? el.stroke.color : nearestColor(el.stroke.color, palette).color } : el.stroke });
              }
              case "shape":
                return { ...el, fill: snapPaint(el.fill, palette), stroke: el.stroke ? { ...el.stroke, color: isNeutral(el.stroke.color) ? el.stroke.color : nearestColor(el.stroke.color, palette).color } : el.stroke };
              case "icon":
                return { ...el, color: isNeutral(el.color) ? el.color : nearestColor(el.color, palette).color };
              default:
                return el;
            }
          }),
        };
      }),
    );
    toast.success(t("applied"));
  };

  return (
    <div className="grid gap-4">
      <Button onClick={applyBrand} className="w-full">
        <Paintbrush />
        {t("apply")}
      </Button>
      <p className="-mt-2 text-[11px] leading-relaxed text-muted-foreground">{t("applyHelp")}</p>

      {logos.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-xs font-semibold">{t("logos")}</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {logos.map(([id, svg]) => (
              <button
                key={id}
                type="button"
                onClick={() => addLogo(svg)}
                className={`flex aspect-[4/3] items-center justify-center rounded-lg border p-2 transition hover:border-primary ${id === "white" ? "bg-slate-800" : "bg-white"}`}
                title={t(`variants.${id}`)}
                aria-label={t(`variants.${id}`)}
              >
                <span className="flex size-full items-center justify-center [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold">{t("colors")}</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(["primary", "secondary", "text", "background"] as const).map((role) => (
            <button key={role} type="button" onClick={() => applyColor(brand.colors[role])} className="grid gap-1 text-left" title={t("useColor")}>
              <span className="h-10 rounded-lg border border-black/10 shadow-xs transition hover:scale-105" style={{ background: brand.colors[role] }} />
              <span className="truncate text-[10px] text-muted-foreground">{t(`roles.${role}`)}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">{t("colorHelp")}</p>
      </section>

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold">{t("fonts")}</h3>
        <button type="button" onClick={() => addText(brand.name, true)} className="rounded-lg border px-3 py-2 text-left transition hover:border-primary hover:bg-muted">
          <span className="block truncate text-xl" style={{ fontFamily: cssFontFamily(brand.heading.fontId), fontWeight: brand.heading.fontWeight }}>
            {brand.name}
          </span>
          <span className="text-[11px] text-muted-foreground">{t("headingFont", { font: getFont(brand.heading.fontId).name })}</span>
        </button>
        {brand.slogan && (
          <button type="button" onClick={() => addText(brand.slogan!, false)} className="rounded-lg border px-3 py-2 text-left transition hover:border-primary hover:bg-muted">
            <span className="block truncate text-sm" style={{ fontFamily: cssFontFamily(brand.body.fontId) }}>
              {brand.slogan}
            </span>
            <span className="text-[11px] text-muted-foreground">{t("bodyFont", { font: getFont(brand.body.fontId).name })}</span>
          </button>
        )}
      </section>

      {brand.icon && (
        <section className="grid gap-2">
          <h3 className="text-xs font-semibold">{t("symbol")}</h3>
          <Button
            variant="outline"
            onClick={() => {
              const size = pageUnit() * 0.2;
              useStudio.getState().add([centered(createIcon(brand.icon!.id, brand.icon!.node, { width: size, height: size, color: colors.accent }))]);
            }}
          >
            <Sparkles />
            {t("addSymbol")}
          </Button>
        </section>
      )}
    </div>
  );
}
