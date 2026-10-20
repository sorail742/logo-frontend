"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, Printer, Wand2 } from "lucide-react";
import { renderLogoSvg } from "@/lib/render/logo";
import { buildBrand, type StudioBrand } from "@/lib/studio/brand";
import { getFormat } from "@/lib/studio/formats";
import { renderPage } from "@/lib/studio/render";
import { TEMPLATES, type TemplateCopy } from "@/lib/studio/templates";
import { ensureFonts } from "@/lib/studio/text";
import type { LogoSpec } from "@/lib/types";
import { cn } from "@/lib/utils";

// Vitrine du Studio sur la page d'accueil : une même marque déclinée en story, publication,
// flyer et carte de visite, composée en direct par les modèles de l'éditeur.

const BRANDS: { name: string; slogan: string; spec: LogoSpec }[] = [
  {
    name: "Djoliba",
    slogan: "Festival des arts",
    spec: { type: "ICON_TEXT", text: "Djoliba", tagline: "", fontId: "playfair", fontWeight: 700, letterSpacing: 0.02, uppercase: false, iconId: "music", iconScale: 1, iconFrame: "hexagon", layout: "horizontal", colors: { primary: "#b91c1c", secondary: "#f2b705", text: "#3b1d0a", background: "#fff8ec" } },
  },
  {
    name: "Baobab Vert",
    slogan: "Jeunesse et nature",
    spec: { type: "ICON_TEXT", text: "Baobab Vert", tagline: "", fontId: "montserrat", fontWeight: 800, letterSpacing: 0, uppercase: false, iconId: "sprout", iconScale: 1, iconFrame: "circle", layout: "horizontal", colors: { primary: "#166534", secondary: "#facc15", text: "#14281d", background: "#f6fbf4" } },
  },
  {
    name: "Kora Pay",
    slogan: "Payer simplement",
    spec: { type: "ICON_TEXT", text: "Kora Pay", tagline: "", fontId: "poppins", fontWeight: 700, letterSpacing: 0, uppercase: false, iconId: "wallet", iconScale: 1, iconFrame: "rounded", layout: "horizontal", colors: { primary: "#4338ca", secondary: "#22d3ee", text: "#0f172a", background: "#f5f7ff" } },
  },
];

const PIECES = [
  { format: "story", template: "event-gradient", className: "left-0 top-[10%] w-[28%] -rotate-6 z-10" },
  { format: "post-square", template: "bold-announce", className: "left-[27%] top-[2%] w-[45%] z-20" },
  { format: "flyer-a5", template: "split-promo", className: "right-[2%] top-[14%] w-[31%] rotate-[5deg] z-10" },
  { format: "business-card", template: "business-card", className: "left-[34%] bottom-[2%] w-[38%] -rotate-3 z-30" },
] as const;

function brandOf(entry: (typeof BRANDS)[number]): StudioBrand {
  const render = (variant: "color" | "white") => renderLogoSvg(entry.spec, { variant, withBackground: false }).svg;
  return buildBrand({ name: entry.name, slogan: entry.slogan, spec: entry.spec, logos: { color: render("color"), white: render("white"), icon: renderLogoSvg(entry.spec, { layout: "icon", withBackground: false }).svg } });
}

export function StudioShowcase() {
  const t = useTranslations("marketing.showcase");
  const tc = useTranslations("studio.templates");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const brands = useMemo(() => BRANDS.map(brandOf), []);

  useEffect(() => {
    let alive = true;
    ensureFonts(brands.flatMap((b) => [b.heading, b.body]).concat({ fontId: "playfair", fontWeight: 700 })).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [brands]);

  useEffect(() => {
    if (paused || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % BRANDS.length), 5000);
    return () => clearInterval(timer);
  }, [paused]);

  const copy = tc.raw("copy") as TemplateCopy;
  const sets = useMemo(() => {
    if (!ready) return null;
    return brands.map((brand) =>
      PIECES.map((piece) => {
        const format = getFormat(piece.format)!;
        const template = TEMPLATES.find((tpl) => tpl.id === piece.template)!;
        const doc = { version: 1 as const, width: format.width, height: format.height, print: format.print ?? null, pages: template.build({ brand, width: format.width, height: format.height, print: format.print, copy }) };
        return renderPage(doc, piece.format === "business-card" ? 1 : 0, { outputWidth: 480 });
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, brands]);

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-[1.05] w-full" aria-hidden="true">
        {PIECES.map((piece, index) => (
          <div key={piece.format} className={cn("absolute overflow-hidden rounded-xl bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5 transition-transform duration-500 hover:z-40 hover:scale-[1.03]", piece.className)}>
            {sets ? (
              sets.map((set, brandIndex) => (
                <div
                  key={brandIndex}
                  className={cn("transition-opacity duration-700 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full", brandIndex === active ? "relative opacity-100" : "absolute inset-0 opacity-0")}
                  dangerouslySetInnerHTML={{ __html: set[index]! }}
                />
              ))
            ) : (
              <div className="animate-pulse bg-muted" style={{ aspectRatio: `${getFormat(piece.format)!.width} / ${getFormat(piece.format)!.height}` }} />
            )}
          </div>
        ))}
        <span className="absolute top-[4%] right-[4%] z-40 hidden items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-lg ring-1 ring-black/5 sm:inline-flex">
          <Wand2 className="size-3.5 text-violet-600" />
          {t("chipResize")}
        </span>
        <span className="absolute bottom-[26%] left-[0%] z-40 hidden items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-lg ring-1 ring-black/5 sm:inline-flex">
          <CircleCheck className="size-3.5 text-emerald-600" />
          {t("chipCheck")}
        </span>
        <span className="absolute right-[0%] bottom-[10%] z-40 hidden items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-lg ring-1 ring-black/5 sm:inline-flex">
          <Printer className="size-3.5 text-sky-600" />
          {t("chipPrint")}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2" role="group" aria-label={t("brands")}>
        {BRANDS.map((brand, index) => (
          <button
            key={brand.name}
            type="button"
            onClick={() => setActive(index)}
            aria-pressed={index === active}
            className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition", index === active ? "border-foreground/20 bg-background shadow-sm" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            <span className="flex -space-x-1" aria-hidden="true">
              {[brand.spec.colors.primary, brand.spec.colors.secondary].map((c) => (
                <span key={c} className="size-3 rounded-full ring-2 ring-background" style={{ background: c }} />
              ))}
            </span>
            {brand.name}
          </button>
        ))}
      </div>
    </div>
  );
}
