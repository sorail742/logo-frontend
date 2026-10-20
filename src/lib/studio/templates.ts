import { contrastRatio, luminance, mix } from "@/lib/render/color";
import type { FontChoice, StudioBrand } from "./brand";
import { readableFrom } from "./color";
import { createIcon, createPage, createShape, createSvg, createText, solid } from "./doc";
import { svgParts } from "./render";
import { TEMPLATE_ICONS, type TemplateIconId } from "./template-icons";
import { naturalWidth, relayout } from "./text";
import type { DesignElement, DesignPage, ElementRole, Paint, PrintSpec, TextElement } from "./types";

// Modèles à la marque : chaque modèle compose ses pages à partir de l'identité du projet
// (logo, couleurs, polices, nom, slogan) et s'adapte au format (carré, portrait, story,
// paysage, bannière, impression avec marge de sécurité). Mise en page dans le navigateur,
// avec les vraies polices : les textes ne débordent pas.

export interface TemplateCopy {
  kicker: string;
  announceTitle: string;
  announceBody: string;
  cta: string;
  promoKicker: string;
  promoValue: string;
  promoTitle: string;
  promoBody: string;
  eventKicker: string;
  eventTitle: string;
  eventDate: string;
  eventPlace: string;
  quote: string;
  quoteAuthor: string;
  hiringKicker: string;
  hiringTitle: string;
  hiringRole: string;
  hiringPoints: string[];
  hiringCta: string;
  photoTitle: string;
  photoBody: string;
  statsTitle: string;
  stats: { value: string; label: string }[];
  carouselCover: string;
  carouselSwipe: string;
  carouselTips: { title: string; body: string }[];
  carouselEnd: string;
  person: string;
  role: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface TemplateContext {
  brand: StudioBrand;
  width: number;
  height: number;
  print?: PrintSpec | null;
  copy: TemplateCopy;
}

export type TemplateCategory = "announce" | "promo" | "event" | "quote" | "hiring" | "info" | "minimal" | "card" | "carousel";

export interface StudioTemplate {
  id: string;
  category: TemplateCategory;
  build(ctx: TemplateContext): DesignPage[];
}

// ─── Cadre de mise en page ───

type Orientation = "banner" | "landscape" | "square" | "portrait" | "story";

function orientation(width: number, height: number): Orientation {
  const ratio = width / height;
  if (ratio >= 2.2) return "banner";
  if (ratio > 1.15) return "landscape";
  if (ratio >= 0.87) return "square";
  if (ratio < 0.66) return "story";
  return "portrait";
}

interface Frame {
  w: number;
  h: number;
  /** 1 % du petit côté. */
  u: number;
  /** Marge : 7 % du petit côté, au moins la zone de sécurité de 5 mm à l'impression. */
  m: number;
  o: Orientation;
}

function frame(ctx: TemplateContext): Frame {
  const { width: w, height: h } = ctx;
  const u = Math.min(w, h) / 100;
  const safe = ctx.print ? (5 / ctx.print.widthMm) * w : 0;
  return { w, h, u, m: Math.max(7 * u, safe + 3 * u), o: orientation(w, h) };
}

// ─── Briques ───

interface TextStyle {
  font: FontChoice;
  size: number;
  color: string;
  align?: TextElement["align"];
  uppercase?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  role?: ElementRole;
  highlight?: TextElement["highlight"];
}

function text(content: string, style: TextStyle, width: number): TextElement {
  return relayout(
    createText({
      text: content,
      fontId: style.font.fontId,
      fontWeight: style.font.fontWeight,
      fontSize: style.size,
      fill: solid(style.color),
      align: style.align ?? "left",
      uppercase: style.uppercase ?? false,
      letterSpacing: style.letterSpacing ?? 0,
      lineHeight: style.lineHeight ?? 1.15,
      role: style.role,
      highlight: style.highlight ?? null,
      width,
    }),
  );
}

/** Texte réduit jusqu'à tenir sur `maxLines` lignes. */
function fitLines(el: TextElement, maxLines: number, minSize = 8): TextElement {
  let current = el;
  while ((current.lines?.length ?? 1) > maxLines && current.fontSize > minSize) {
    current = relayout({ ...current, fontSize: current.fontSize * 0.92 });
  }
  return current;
}

/** Texte à sa largeur naturelle (étiquettes, boutons). */
function label(content: string, style: TextStyle): TextElement {
  const probe = createText({
    text: content,
    fontId: style.font.fontId,
    fontWeight: style.font.fontWeight,
    fontSize: style.size,
    letterSpacing: style.letterSpacing ?? 0,
    uppercase: style.uppercase ?? false,
  });
  return text(content, { ...style, align: style.align ?? "center" }, naturalWidth(probe));
}

/** Groupe d'éléments placés relativement à son origine. */
interface Block {
  items: DesignElement[];
  width: number;
  height: number;
}

const single = (el: DesignElement): Block => ({ items: [{ ...el, x: 0, y: 0 }], width: el.width, height: el.height });

function button(content: string, font: FontChoice, size: number, fill: string, color: string, role: ElementRole = "cta"): Block {
  const caption = label(content, { font: { ...font, fontWeight: Math.max(font.fontWeight, 600) }, size, color, role });
  const padX = size * 1.1;
  const padY = size * 0.55;
  const width = caption.width + padX * 2;
  const height = caption.height + padY * 2;
  const pill = createShape("rect", { width, height, radius: height / 2, fill: solid(fill), role: "cta" });
  return { items: [{ ...pill, x: 0, y: 0 }, { ...caption, x: padX, y: padY }], width, height };
}

function iconRow(icon: TemplateIconId, content: string, style: TextStyle, width: number, iconColor: string): Block {
  const size = style.size * 1.25;
  const gap = style.size * 0.6;
  const caption = text(content, style, width - size - gap);
  const height = Math.max(size, caption.height);
  return {
    items: [
      { ...createIcon(icon, TEMPLATE_ICONS[icon], { width: size, height: size, color: iconColor, strokeWidth: 2, role: "info" }), x: 0, y: (height - size) / 2 },
      { ...caption, x: size + gap, y: (height - caption.height) / 2 },
    ],
    width,
    height,
  };
}

/** Logo de la marque (SVG), ou son nom si le projet n'a pas encore de logo. */
function logo(brand: StudioBrand, background: string, height: number, maxWidth: number, prefer: "full" | "icon" = "full"): DesignElement {
  const dark = luminance(background) < 0.35;
  const svg =
    prefer === "icon"
      ? (brand.logos.icon ?? brand.logos.color)
      : dark
        ? (brand.logos.white ?? brand.logos.color)
        : (brand.logos.color ?? brand.logos.black);
  if (svg) {
    const parts = svgParts(svg);
    const ratio = parts.width / parts.height || 1;
    const width = Math.min(maxWidth, height * ratio);
    return createSvg(svg, "logo", { width, height: width / ratio, role: "logo" });
  }
  const color = readableFrom([brand.colors.primary, brand.colors.text, "#ffffff"], background, 3);
  return fitLines(label(brand.name, { font: brand.heading, size: height * 0.55, color, role: "logo" }), 1);
}

/**
 * Empile des blocs dans une colonne, alignés horizontalement et répartis verticalement ;
 * réduit le tout (k) jusqu'à tenir dans la hauteur disponible.
 */
function column(
  make: (k: number) => (Block | null)[],
  area: { x: number; width: number; top: number; bottom: number },
  options: { align?: "start" | "center" | "end"; valign?: "start" | "center" | "end"; gap: number },
): DesignElement[] {
  let k = 1;
  let blocks = make(k).filter((b): b is Block => Boolean(b));
  const total = (list: Block[], gap: number) => list.reduce((sum, b) => sum + b.height, 0) + gap * Math.max(0, list.length - 1);
  while (total(blocks, options.gap * k) > area.bottom - area.top && k > 0.45) {
    k *= 0.9;
    blocks = make(k).filter((b): b is Block => Boolean(b));
  }
  const gap = options.gap * k;
  const height = total(blocks, gap);
  const valign = options.valign ?? "center";
  let y = valign === "start" ? area.top : valign === "end" ? area.bottom - height : area.top + (area.bottom - area.top - height) / 2;
  const out: DesignElement[] = [];
  for (const block of blocks) {
    const align = options.align ?? "start";
    const x = align === "start" ? area.x : align === "end" ? area.x + area.width - block.width : area.x + (area.width - block.width) / 2;
    for (const item of block.items) out.push({ ...item, x: item.x + x, y: item.y + y });
    y += block.height + gap;
  }
  return out;
}

const textAlign = (align: "start" | "center" | "end"): TextElement["align"] => (align === "start" ? "left" : align === "end" ? "right" : "center");

function page(background: Paint, elements: DesignElement[]): DesignPage {
  return { ...createPage(background), elements };
}

/** Accent lisible sur un fond (secondaire, sinon fond éclairci). */
function accentOn(brand: StudioBrand, background: string) {
  const { secondary, primary } = brand.colors;
  if (contrastRatio(secondary, background) >= 1.8) return secondary;
  if (contrastRatio(primary, background) >= 1.8) return primary;
  return mix(background, luminance(background) > 0.5 ? "#000000" : "#ffffff", 0.3);
}

// ─── Modèles ───

const boldAnnounce: StudioTemplate = {
  id: "bold-announce",
  category: "announce",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const bg = brand.colors.primary;
    const ink = readableFrom([brand.colors.background, "#ffffff", brand.colors.text], bg);
    const accent = accentOn(brand, bg);
    const big = Math.max(f.w, f.h);
    const decor: DesignElement[] = [
      createShape("blob", { x: f.w - big * 0.38, y: f.h - big * 0.36, width: big * 0.62, height: big * 0.56, fill: solid(accent), seed: 11, role: "decor" }),
      createShape("ellipse", {
        x: -big * 0.1,
        y: -big * 0.1,
        width: big * 0.3,
        height: big * 0.3,
        fill: { type: "none" },
        stroke: { color: ink, width: f.u * 0.7, dash: "solid" },
        opacity: 0.22,
        role: "decor",
      }),
    ];
    const banner = f.o === "banner";
    const brandMark = logo(brand, bg, banner ? f.h * 0.42 : f.u * 10, banner ? f.w * 0.22 : f.w * 0.4);
    const area = banner
      ? { x: f.m + brandMark.width + f.m, width: f.w * 0.5, top: f.m * 0.6, bottom: f.h - f.m * 0.6 }
      : { x: f.m, width: f.o === "landscape" ? f.w * 0.56 : f.w - 2 * f.m, top: f.m + brandMark.height + f.u * 4, bottom: f.h - f.m };
    const size = banner ? f.h / 100 : f.u;
    const content = column(
      (k) => [
        single(label(copy.kicker, { font: brand.body, size: 3.6 * size * k, color: accent === bg ? ink : accent, uppercase: true, letterSpacing: 0.22, role: "subtitle", align: "left" })),
        single(fitLines(text(copy.announceTitle, { font: brand.heading, size: (banner ? 26 : 13) * size * k, color: ink, lineHeight: 1.02, role: "title" }, area.width), 3)),
        banner ? null : single(text(copy.announceBody, { font: brand.body, size: 4.2 * size * k, color: ink, lineHeight: 1.35, role: "body" }, area.width * 0.9)),
        banner ? null : button(copy.cta, brand.body, 3.6 * size * k, accent, readableFrom([bg, brand.colors.text, "#ffffff"], accent)),
      ],
      area,
      { gap: 3.2 * size, valign: banner ? "center" : "center" },
    );
    const extra = banner
      ? [
          (() => {
            const cta = button(copy.cta, brand.body, 9 * size, accent, readableFrom([bg, brand.colors.text, "#ffffff"], accent));
            const x = f.w - f.m - cta.width;
            const y = (f.h - cta.height) / 2;
            return cta.items.map((el) => ({ ...el, x: el.x + x, y: el.y + y }));
          })(),
        ].flat()
      : [];
    const mark = banner ? { ...brandMark, x: f.m, y: (f.h - brandMark.height) / 2 } : { ...brandMark, x: f.m, y: f.m };
    return [page(solid(bg), [...decor, mark, ...content, ...extra])];
  },
};

const splitPromo: StudioTemplate = {
  id: "split-promo",
  category: "promo",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const light = brand.colors.background;
    const primary = brand.colors.primary;
    const onPrimary = readableFrom([light, "#ffffff"], primary);
    const accent = accentOn(brand, primary);
    const wide = f.o === "banner" || f.o === "landscape";
    const elements: DesignElement[] = [];
    if (wide) {
      const panel = f.w * 0.46;
      elements.push(createShape("rect", { x: 0, y: 0, width: panel, height: f.h, fill: solid(primary), role: "background" }));
      elements.push(createShape("ellipse", { x: panel - f.h * 0.25, y: f.h * 0.5, width: f.h * 0.5, height: f.h * 0.5, fill: solid(accent), opacity: 0.9, role: "decor" }));
      elements.push(
        ...column(
          (k) => [
            single(label(copy.promoKicker, { font: brand.body, size: 4.2 * f.u * k, color: onPrimary, uppercase: true, letterSpacing: 0.2, align: "left", role: "subtitle" })),
            single(fitLines(text(copy.promoValue, { font: brand.heading, size: 30 * f.u * k, color: accent === primary ? onPrimary : accent, lineHeight: 0.95, role: "title" }, panel - 2 * f.m), 1)),
          ],
          { x: f.m, width: panel - 2 * f.m, top: f.m * 0.6, bottom: f.h - f.m * 0.6 },
          { gap: 2 * f.u },
        ),
      );
      const right = { x: panel + f.m, width: f.w - panel - 2 * f.m, top: f.m * 0.6, bottom: f.h - f.m * 0.6 };
      const ink = readableFrom([brand.colors.text, primary], light);
      elements.push(
        ...column(
          (k) => [
            single(fitLines(text(copy.promoTitle, { font: brand.heading, size: 10 * f.u * k, color: ink, lineHeight: 1.05, role: "title" }, right.width), 2)),
            single(text(copy.promoBody, { font: brand.body, size: 4.4 * f.u * k, color: mix(ink, light, 0.25), role: "body" }, right.width)),
            button(copy.cta, brand.body, 3.8 * f.u * k, primary, onPrimary),
          ],
          right,
          { gap: 3 * f.u },
        ),
      );
      return [page(solid(light), elements)];
    }
    const split = f.h * (f.o === "story" ? 0.52 : 0.56);
    elements.push(createShape("arch", { x: -f.w * 0.1, y: -f.h * 0.05, width: f.w * 1.2, height: split + f.h * 0.05, flipY: true, fill: solid(primary), role: "background" }));
    elements.push(createShape("star", { x: f.w - f.m - 24 * f.u, y: f.m, width: 24 * f.u, height: 24 * f.u, sides: 12, innerRatio: 0.82, fill: solid(accent), rotation: 12, role: "decor" }));
    elements.push(
      ...column(
        (k) => [
          single(label(copy.promoKicker, { font: brand.body, size: 4.2 * f.u * k, color: onPrimary, uppercase: true, letterSpacing: 0.25, role: "subtitle" })),
          single(fitLines(text(copy.promoValue, { font: brand.heading, size: 34 * f.u * k, color: onPrimary, align: "center", lineHeight: 0.95, role: "title" }, f.w - 2 * f.m), 1)),
        ],
        { x: f.m, width: f.w - 2 * f.m, top: f.m + 8 * f.u, bottom: split - 6 * f.u },
        { align: "center", gap: 2 * f.u },
      ),
    );
    const ink = readableFrom([brand.colors.text, primary], light);
    const brandMark = logo(brand, light, 8 * f.u, f.w * 0.4);
    elements.push(
      ...column(
        (k) => [
          single(fitLines(text(copy.promoTitle, { font: brand.heading, size: 9 * f.u * k, color: ink, align: "center", lineHeight: 1.05, role: "title" }, f.w - 2 * f.m), 2)),
          single(text(copy.promoBody, { font: brand.body, size: 4.4 * f.u * k, color: mix(ink, light, 0.25), align: "center", role: "body" }, f.w - 2 * f.m)),
          button(copy.cta, brand.body, 3.8 * f.u * k, primary, onPrimary),
        ],
        { x: f.m, width: f.w - 2 * f.m, top: split + 4 * f.u, bottom: f.h - f.m - brandMark.height - 4 * f.u },
        { align: "center", gap: 3 * f.u },
      ),
    );
    elements.push({ ...brandMark, x: (f.w - brandMark.width) / 2, y: f.h - f.m - brandMark.height });
    return [page(solid(light), elements)];
  },
};

const eventGradient: StudioTemplate = {
  id: "event-gradient",
  category: "event",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const top = brand.colors.primary;
    const bottom = mix(top, "#000000", 0.45);
    const ink = readableFrom(["#ffffff", brand.colors.background], bottom);
    const accent = accentOn(brand, top);
    const big = Math.max(f.w, f.h);
    const background: Paint = { type: "linear", angle: 90, stops: [{ offset: 0, color: top }, { offset: 1, color: bottom }] };
    const rings = [0.5, 0.36, 0.22].map((r, i) =>
      createShape("ellipse", {
        x: f.w - big * r * 0.6,
        y: -big * r * 0.4,
        width: big * r,
        height: big * r,
        fill: { type: "none" },
        stroke: { color: accent, width: f.u * 0.6, dash: i === 1 ? "dashed" : "solid" },
        opacity: 0.55 - i * 0.1,
        role: "decor",
      }),
    );
    const banner = f.o === "banner";
    const width = banner ? f.w * 0.55 : f.o === "landscape" ? f.w * 0.6 : f.w - 2 * f.m;
    const brandMark = logo(brand, bottom, banner ? f.h * 0.3 : 9 * f.u, f.w * 0.35);
    const size = banner ? f.h / 100 : f.u;
    const content = column(
      (k) => [
        single(
          label(copy.eventKicker, {
            font: brand.body,
            size: 3.4 * size * k,
            color: readableFrom([top, brand.colors.text], accent),
            uppercase: true,
            letterSpacing: 0.2,
            role: "subtitle",
            highlight: { color: accent, padding: 1.4 * size * k, radius: 1.2 * size * k },
          }),
        ),
        single(fitLines(text(copy.eventTitle, { font: brand.heading, size: (banner ? 20 : 12) * size * k, color: ink, lineHeight: 1.02, role: "title" }, width), 3)),
        iconRow("calendar", copy.eventDate, { font: brand.body, size: 4 * size * k, color: ink, role: "info" }, width, accent),
        iconRow("map-pin", copy.eventPlace, { font: brand.body, size: 4 * size * k, color: ink, role: "info" }, width, accent),
      ],
      { x: f.m, width, top: banner ? f.m * 0.5 : f.m, bottom: banner ? f.h - f.m * 0.5 : f.h - f.m - brandMark.height - 5 * f.u },
      { gap: 3 * size, valign: banner ? "center" : "end" },
    );
    const mark = banner
      ? { ...brandMark, x: f.w - f.m - brandMark.width, y: f.h - f.m * 0.6 - brandMark.height }
      : { ...brandMark, x: f.m, y: f.h - f.m - brandMark.height };
    return [page(background, [...rings, ...content, mark])];
  },
};

const quoteSerif: StudioTemplate = {
  id: "quote-serif",
  category: "quote",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const bg = brand.colors.background;
    const ink = readableFrom([brand.colors.text, "#111827"], bg);
    const accent = accentOn(brand, bg);
    const serif: FontChoice = { fontId: "playfair", fontWeight: 700 };
    const big = Math.max(f.w, f.h);
    const frameShape = createShape("rect", {
      x: f.m * 0.5,
      y: f.m * 0.5,
      width: f.w - f.m,
      height: f.h - f.m,
      fill: { type: "none" },
      stroke: { color: accent, width: f.u * 0.5, dash: "solid" },
      radius: 3 * f.u,
      role: "decor",
    });
    const blob = createShape("blob", { x: -big * 0.15, y: f.h - big * 0.3, width: big * 0.45, height: big * 0.4, fill: solid(mix(accent, bg, 0.75)), seed: 23, role: "decor" });
    const banner = f.o === "banner";
    const size = banner ? f.h / 100 : f.u;
    const brandMark = logo(brand, bg, banner ? 18 * size : 7 * f.u, f.w * 0.3);
    const width = banner ? f.w * 0.62 : f.w - 2.4 * f.m;
    const content = column(
      (k) => [
        single(createIcon("quote", TEMPLATE_ICONS.quote, { width: 12 * size * k, height: 12 * size * k, color: accent, strokeWidth: 1.5, role: "decor" })),
        single(fitLines(text(copy.quote, { font: serif, size: (banner ? 11 : 7) * size * k, color: ink, align: "center", lineHeight: 1.25, role: "title" }, width), 6)),
        single(label(`— ${copy.quoteAuthor}`, { font: brand.body, size: 3.6 * size * k, color: mix(ink, bg, 0.3), uppercase: true, letterSpacing: 0.15, role: "subtitle" })),
      ],
      { x: (f.w - width) / 2, width, top: f.m * 1.2, bottom: f.h - f.m * 1.2 - (banner ? 0 : brandMark.height + 3 * f.u) },
      { align: "center", gap: 3.5 * size },
    );
    const mark = banner ? { ...brandMark, x: f.w - f.m - brandMark.width, y: f.h - f.m - brandMark.height } : { ...brandMark, x: (f.w - brandMark.width) / 2, y: f.h - f.m * 1.1 - brandMark.height };
    return [page(solid(bg), [blob, frameShape, ...content, mark])];
  },
};

const hiringList: StudioTemplate = {
  id: "hiring-list",
  category: "hiring",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const bg = brand.colors.background;
    const primary = brand.colors.primary;
    const ink = readableFrom([brand.colors.text, "#111827"], bg);
    const onPrimary = readableFrom([bg, "#ffffff"], primary);
    const band = f.o === "banner" ? f.h : f.h * 0.34;
    const wide = f.o === "banner" || f.o === "landscape";
    const elements: DesignElement[] = [];
    if (wide) {
      const panel = f.w * 0.42;
      elements.push(createShape("rect", { x: 0, y: 0, width: panel, height: f.h, fill: solid(primary), role: "background" }));
      elements.push(
        ...column(
          (k) => [
            single(label(copy.hiringKicker, { font: brand.body, size: 3.8 * f.u * k, color: onPrimary, uppercase: true, letterSpacing: 0.2, align: "left", role: "subtitle" })),
            single(fitLines(text(copy.hiringTitle, { font: brand.heading, size: 13 * f.u * k, color: onPrimary, lineHeight: 1, role: "title" }, panel - 2 * f.m), 3)),
          ],
          { x: f.m, width: panel - 2 * f.m, top: f.m * 0.6, bottom: f.h - f.m * 0.6 },
          { gap: 2.5 * f.u },
        ),
      );
      const right = { x: panel + f.m, width: f.w - panel - 2 * f.m, top: f.m * 0.6, bottom: f.h - f.m * 0.6 };
      elements.push(
        ...column(
          (k) => [
            single(fitLines(text(copy.hiringRole, { font: brand.heading, size: 6.5 * f.u * k, color: ink, role: "subtitle" }, right.width), 2)),
            ...copy.hiringPoints.map((point) => iconRow("circle-check", point, { font: brand.body, size: 3.8 * f.u * k, color: ink, role: "body" }, right.width, primary)),
            single(text(copy.hiringCta, { font: brand.body, size: 3.4 * f.u * k, color: mix(ink, bg, 0.3), role: "info" }, right.width)),
          ],
          right,
          { gap: 2.4 * f.u },
        ),
      );
      return [page(solid(bg), elements)];
    }
    elements.push(createShape("rect", { x: 0, y: 0, width: f.w, height: band, fill: solid(primary), role: "background" }));
    elements.push(createShape("ellipse", { x: f.w - 30 * f.u, y: band - 15 * f.u, width: 30 * f.u, height: 30 * f.u, fill: solid(accentOn(brand, primary)), role: "decor" }));
    elements.push(
      ...column(
        (k) => [
          single(label(copy.hiringKicker, { font: brand.body, size: 3.8 * f.u * k, color: onPrimary, uppercase: true, letterSpacing: 0.2, align: "left", role: "subtitle" })),
          single(fitLines(text(copy.hiringTitle, { font: brand.heading, size: 12 * f.u * k, color: onPrimary, lineHeight: 1, role: "title" }, f.w - 2 * f.m - 20 * f.u), 2)),
        ],
        { x: f.m, width: f.w - 2 * f.m, top: f.m, bottom: band - 4 * f.u },
        { gap: 2 * f.u, valign: "end" },
      ),
    );
    const brandMark = logo(brand, bg, 8 * f.u, f.w * 0.4);
    elements.push(
      ...column(
        (k) => [
          single(fitLines(text(copy.hiringRole, { font: brand.heading, size: 6.4 * f.u * k, color: ink, role: "subtitle" }, f.w - 2 * f.m), 2)),
          ...copy.hiringPoints.map((point) => iconRow("circle-check", point, { font: brand.body, size: 4 * f.u * k, color: ink, role: "body" }, f.w - 2 * f.m, primary)),
          button(copy.hiringCta, brand.body, 3.6 * f.u * k, primary, onPrimary),
        ],
        { x: f.m, width: f.w - 2 * f.m, top: band + 6 * f.u, bottom: f.h - f.m - brandMark.height - 5 * f.u },
        { gap: 3 * f.u, valign: "start" },
      ),
    );
    elements.push({ ...brandMark, x: f.m, y: f.h - f.m - brandMark.height });
    return [page(solid(bg), elements)];
  },
};

const minimalLogo: StudioTemplate = {
  id: "minimal-logo",
  category: "minimal",
  build(ctx) {
    const f = frame(ctx);
    const { brand } = ctx;
    const bg = brand.colors.background;
    const ink = readableFrom([brand.colors.text, "#111827"], bg);
    const banner = f.o === "banner";
    const size = banner ? f.h / 100 : f.u;
    const mark = logo(brand, bg, (banner ? 40 : 26) * size, f.w * 0.7);
    const line = createShape("line", { width: 16 * size, height: 2 * size, stroke: { color: brand.colors.primary, width: 0.8 * size, dash: "solid" }, role: "decor" });
    const content = column(
      (k) => [
        single({ ...mark, width: mark.width * k, height: mark.height * k }),
        single({ ...line, width: line.width * k }),
        brand.slogan ? single(fitLines(text(brand.slogan, { font: brand.body, size: 4.4 * size * k, color: mix(ink, bg, 0.2), align: "center", letterSpacing: 0.04, role: "subtitle" }, f.w - 2 * f.m), 2)) : null,
      ],
      { x: f.m, width: f.w - 2 * f.m, top: f.m * 0.6, bottom: f.h - f.m * 0.6 },
      { align: "center", gap: 4 * size },
    );
    return [page(solid(bg), content)];
  },
};

const photoFrame: StudioTemplate = {
  id: "photo-frame",
  category: "info",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const bg = brand.colors.background;
    const ink = readableFrom([brand.colors.text, "#111827"], bg);
    const accent = accentOn(brand, bg);
    const wide = f.o === "banner" || f.o === "landscape";
    // Cadre photo : une photo importée pendant qu'il est sélectionné (ou déposée dessus) le remplit.
    const photoBox = wide
      ? { x: f.w * 0.52, y: f.m * 0.6, width: f.w * 0.48 - f.m * 0.6, height: f.h - f.m * 1.2 }
      : { x: f.m, y: f.m, width: f.w - 2 * f.m, height: f.h * (f.o === "story" ? 0.5 : 0.48) };
    const photo = createShape("arch", { ...photoBox, fill: solid(mix(brand.colors.primary, bg, 0.7)), role: "photo" });
    const dot = createShape("ellipse", { x: photoBox.x - 6 * f.u, y: photoBox.y + photoBox.height - 14 * f.u, width: 18 * f.u, height: 18 * f.u, fill: solid(accent), role: "decor" });
    const area = wide
      ? { x: f.m, width: f.w * 0.52 - 2 * f.m, top: f.m * 0.6, bottom: f.h - f.m * 0.6 }
      : { x: f.m, width: f.w - 2 * f.m, top: photoBox.y + photoBox.height + 5 * f.u, bottom: f.h - f.m };
    const content = column(
      (k) => [
        single(logo(brand, bg, 7 * f.u * k, area.width * 0.6)),
        single(fitLines(text(copy.photoTitle, { font: brand.heading, size: 9.5 * f.u * k, color: ink, lineHeight: 1.05, role: "title" }, area.width), 3)),
        single(text(copy.photoBody, { font: brand.body, size: 4.1 * f.u * k, color: mix(ink, bg, 0.25), lineHeight: 1.4, role: "body" }, area.width)),
      ],
      area,
      { gap: 3 * f.u, valign: wide ? "center" : "start" },
    );
    return [page(solid(bg), [photo, dot, ...content])];
  },
};

const keyFigures: StudioTemplate = {
  id: "key-figures",
  category: "info",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const bg = mix(brand.colors.primary, "#000000", 0.55);
    const ink = readableFrom(["#ffffff", brand.colors.background], bg);
    const accent = accentOn(brand, bg);
    const stats = copy.stats.slice(0, 3);
    const vertical = f.o === "story" || f.o === "portrait";
    const elements: DesignElement[] = [createShape("rect", { x: 0, y: f.h - 2 * f.u, width: f.w, height: 2 * f.u, fill: solid(accent), role: "decor" })];
    const brandMark = logo(brand, bg, 7 * f.u, f.w * 0.35);
    const title = fitLines(text(copy.statsTitle, { font: brand.heading, size: 8 * f.u, color: ink, lineHeight: 1.05, role: "title" }, f.w - 2 * f.m), 2);
    elements.push({ ...brandMark, x: f.m, y: f.m }, { ...title, x: f.m, y: f.m + brandMark.height + 4 * f.u });
    const top = f.m + brandMark.height + 4 * f.u + title.height + 6 * f.u;
    const bottom = f.h - f.m;
    if (vertical || f.o === "square") {
      elements.push(
        ...column(
          (k) =>
            stats.map((stat) => {
              const value = label(stat.value, { font: brand.heading, size: 13 * f.u * k, color: accent, align: "left", role: "title" });
              const caption = text(stat.label, { font: brand.body, size: 3.8 * f.u * k, color: ink, role: "body" }, f.w - 2 * f.m - value.width - 4 * f.u);
              const height = Math.max(value.height, caption.height);
              return { items: [{ ...value, x: 0, y: 0 }, { ...caption, x: value.width + 4 * f.u, y: (height - caption.height) / 2 }], width: f.w - 2 * f.m, height };
            }),
          { x: f.m, width: f.w - 2 * f.m, top, bottom },
          { gap: 5 * f.u, valign: "center" },
        ),
      );
    } else {
      const cell = (f.w - 2 * f.m) / stats.length;
      stats.forEach((stat, i) => {
        elements.push(
          ...column(
            (k) => [
              single(fitLines(text(stat.value, { font: brand.heading, size: 14 * f.u * k, color: accent, align: "center", role: "title" }, cell - 4 * f.u), 1)),
              single(text(stat.label, { font: brand.body, size: 3.6 * f.u * k, color: ink, align: "center", role: "body" }, cell - 4 * f.u)),
            ],
            { x: f.m + i * cell + 2 * f.u, width: cell - 4 * f.u, top, bottom },
            { align: "center", gap: 2 * f.u },
          ),
        );
      });
    }
    return [page(solid(bg), elements)];
  },
};

const businessCard: StudioTemplate = {
  id: "business-card",
  category: "card",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const primary = brand.colors.primary;
    const light = brand.colors.background;
    const ink = readableFrom([brand.colors.text, "#111827"], light);
    const accent = accentOn(brand, light);
    // Recto : logo centré sur la couleur principale.
    const front = logo(brand, primary, f.h * 0.34, f.w * 0.7);
    const recto = page(
      solid(primary),
      [
        createShape("ellipse", { x: f.w * 0.72, y: -f.h * 0.3, width: f.h * 0.9, height: f.h * 0.9, fill: solid(accentOn(brand, primary)), opacity: 0.85, role: "decor" }),
        { ...front, x: (f.w - front.width) / 2, y: (f.h - front.height) / 2 },
      ],
    );
    // Verso : coordonnées.
    const width = f.w - 2 * f.m;
    const details = column(
      (k) => [
        single(fitLines(text(copy.person, { font: brand.heading, size: 9 * f.u * k, color: ink, role: "title" }, width), 1)),
        single(text(copy.role, { font: brand.body, size: 5 * f.u * k, color: accent, uppercase: true, letterSpacing: 0.12, role: "subtitle" }, width)),
        iconRow("phone", copy.phone, { font: brand.body, size: 5 * f.u * k, color: ink, role: "info" }, width * 0.62, primary),
        iconRow("mail", copy.email, { font: brand.body, size: 5 * f.u * k, color: ink, role: "info" }, width * 0.62, primary),
        iconRow("globe", copy.website, { font: brand.body, size: 5 * f.u * k, color: ink, role: "info" }, width * 0.62, primary),
      ],
      { x: f.m, width, top: f.m, bottom: f.h - f.m },
      { gap: 2.6 * f.u },
    );
    const back = logo(brand, light, f.h * 0.22, f.w * 0.3, "icon");
    const verso = page(
      solid(light),
      [
        createShape("rect", { x: f.w - 3 * f.u, y: 0, width: 3 * f.u, height: f.h, fill: solid(primary), role: "decor" }),
        ...details,
        { ...back, x: f.w - f.m - back.width, y: f.h - f.m - back.height },
      ],
    );
    return [recto, verso];
  },
};

const carouselTips: StudioTemplate = {
  id: "carousel-tips",
  category: "carousel",
  build(ctx) {
    const f = frame(ctx);
    const { brand, copy } = ctx;
    const primary = brand.colors.primary;
    const light = brand.colors.background;
    const onPrimary = readableFrom([light, "#ffffff"], primary);
    const ink = readableFrom([brand.colors.text, "#111827"], light);
    const accent = accentOn(brand, light);
    const total = copy.carouselTips.length + 2;
    const counter = (index: number, color: string) => {
      const el = label(`${index}/${total}`, { font: brand.body, size: 3.4 * f.u, color, align: "right", role: "info" });
      return { ...el, x: f.w - f.m - el.width, y: f.m };
    };
    const width = f.w - 2 * f.m;
    const cover = page(
      solid(primary),
      [
        createShape("blob", { x: f.w * 0.45, y: f.h * 0.55, width: f.w * 0.8, height: f.w * 0.7, fill: solid(accentOn(brand, primary)), seed: 5, role: "decor" }),
        { ...logo(brand, primary, 7 * f.u, f.w * 0.4), x: f.m, y: f.m },
        counter(1, onPrimary),
        ...column(
          (k) => [
            single(fitLines(text(copy.carouselCover, { font: brand.heading, size: 12 * f.u * k, color: onPrimary, lineHeight: 1.02, role: "title" }, width), 4)),
            iconRow("arrow-right", copy.carouselSwipe, { font: brand.body, size: 4 * f.u * k, color: onPrimary, role: "info" }, width, onPrimary),
          ],
          { x: f.m, width, top: f.m + 12 * f.u, bottom: f.h - f.m },
          { gap: 4 * f.u },
        ),
      ],
    );
    const tips = copy.carouselTips.map((tip, i) =>
      page(
        solid(light),
        [
          createShape("rect", { x: 0, y: 0, width: 2.2 * f.u, height: f.h, fill: solid(primary), role: "decor" }),
          counter(i + 2, mix(ink, light, 0.4)),
          ...column(
            (k) => [
              single(label(String(i + 1).padStart(2, "0"), { font: brand.heading, size: 22 * f.u * k, color: accent, align: "left", role: "decor" })),
              single(fitLines(text(tip.title, { font: brand.heading, size: 8 * f.u * k, color: ink, lineHeight: 1.05, role: "title" }, width), 3)),
              single(text(tip.body, { font: brand.body, size: 4.4 * f.u * k, color: mix(ink, light, 0.2), lineHeight: 1.4, role: "body" }, width)),
            ],
            { x: f.m, width, top: f.m * 1.5, bottom: f.h - f.m },
            { gap: 3.5 * f.u },
          ),
        ],
      ),
    );
    const end = page(
      solid(primary),
      [
        counter(total, onPrimary),
        ...column(
          (k) => [
            single(logo(brand, primary, 14 * f.u * k, width * 0.7)),
            single(fitLines(text(copy.carouselEnd, { font: brand.heading, size: 8 * f.u * k, color: onPrimary, align: "center", lineHeight: 1.1, role: "title" }, width), 3)),
            button(copy.cta, brand.body, 4 * f.u * k, accentOn(brand, primary), readableFrom([primary, brand.colors.text, "#ffffff"], accentOn(brand, primary))),
          ],
          { x: f.m, width, top: f.m, bottom: f.h - f.m },
          { align: "center", gap: 5 * f.u },
        ),
      ],
    );
    return [cover, ...tips, end];
  },
};

export const TEMPLATES: StudioTemplate[] = [boldAnnounce, splitPromo, eventGradient, quoteSerif, hiringList, photoFrame, keyFigures, minimalLogo, carouselTips, businessCard];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ["announce", "promo", "event", "quote", "hiring", "info", "minimal", "carousel", "card"];

/** Modèles conseillés en premier pour un format. */
export function suggestedTemplates(formatId: string) {
  if (formatId === "business-card") return ["business-card", "minimal-logo"];
  if (formatId.startsWith("post") || formatId === "story") return ["bold-announce", "carousel-tips", "split-promo", "event-gradient"];
  if (formatId.startsWith("flyer") || formatId === "poster-a3") return ["event-gradient", "split-promo", "photo-frame"];
  return [];
}
