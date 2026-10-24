import { contrastRatio, luminance, mix } from "@/lib/render/color";
import type { FontChoice } from "./brand";
import { readableFrom } from "./color";
import { flagColors, flagPalette, flagSvg, getCountry, nextCelebration, type Country } from "./countries";
import {
  balloons,
  bunting,
  christmasTree,
  confetti,
  crescentStar,
  fireworks,
  flourish,
  gift,
  graduationCap,
  lanterns,
  mosque,
  snowflakes,
  sparkles,
  sunburst,
  weddingRings,
  type Box,
  type Decor,
} from "./decor";
import { createShape, createSvg, solid } from "./doc";
import type { TextEffects } from "./lettering";
import {
  column,
  fitLines,
  frame,
  label,
  logo,
  page,
  single,
  text,
  type Frame,
  type StudioTemplate,
  type TemplateContext,
} from "./templates";
import type { DesignElement, Paint, SvgElement, TextElement } from "./types";

// Modèles de fête : indépendance et fête nationale (drapeau et date du pays choisi), anniversaire,
// mariage, Aïd, Ramadan, nouvel an, remise de diplômes, Noël et naissance. Décors vectoriels
// (src/lib/studio/decor.ts), polices de fête de la bibliothèque, logo et couleurs de la marque.

const SCRIPT: FontChoice = { fontId: "great-vibes", fontWeight: 400 };
const PARTY: FontChoice = { fontId: "pacifico", fontWeight: 400 };
const ROUND: FontChoice = { fontId: "titan-one", fontWeight: 400 };
const ELEGANT: FontChoice = { fontId: "cinzel-decorative", fontWeight: 700 };
const SERIF: FontChoice = { fontId: "cormorant-garamond", fontWeight: 600 };
const FRIENDLY: FontChoice = { fontId: "fredoka", fontWeight: 600 };

/** Polices à charger avant de composer les modèles de fête. */
export const CELEBRATION_FONTS: FontChoice[] = [SCRIPT, PARTY, ROUND, ELEGANT, SERIF, FRIENDLY];

// ─── Fête choisie ───

export interface Occasion {
  country: Country;
  /** Nom du pays dans la langue de l'interface. */
  name: string;
  /** Prochaine date de la fête (« 2 octobre 2026 ») et jour seul (« 2 octobre »). */
  date: string;
  dayMonth: string;
  /** Date d'origine (« 2 octobre 1958 ») et années écoulées, pour une indépendance. */
  since: string | null;
  years: number | null;
  /** Année du prochain nouvel an et année en cours (promotion). */
  newYear: number;
  year: number;
}

export function occasionFor(code: string, locale = "fr", today = new Date()): Occasion {
  const country = getCountry(code);
  const next = nextCelebration(country, today);
  const long = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
  const short = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });
  let name = country.code;
  try {
    name = new Intl.DisplayNames([locale], { type: "region" }).of(country.code) ?? country.code;
  } catch {
    // Code ISO affiché tel quel
  }
  return {
    country,
    name,
    date: long.format(next.date),
    dayMonth: short.format(next.date),
    since: country.year ? long.format(new Date(country.year, country.month - 1, country.day)) : null,
    years: next.years,
    newYear: today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear(),
    year: today.getFullYear(),
  };
}

const occasionOf = (ctx: TemplateContext) => ctx.occasion ?? occasionFor("GN", ctx.locale);

// ─── Briques ───

/** Décor dans une boîte, proportions conservées : contenu (centré) ou couvrant (rogné hors page). */
function place(d: Decor, box: Box, mode: "contain" | "cover" = "contain", patch: Partial<SvgElement> = {}) {
  const scale = (mode === "cover" ? Math.max : Math.min)(box.width / d.width, box.height / d.height);
  const width = d.width * scale;
  const height = d.height * scale;
  return createSvg(d.svg, "graphic", {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
    role: "decor",
    ...patch,
  });
}

/** Semis (confettis, étincelles, flocons) tiré aux dimensions de la zone, hors de la zone du texte. */
function scatter(
  make: (size: { width: number; height: number; avoid: Box | null }) => Decor,
  box: Box,
  keep: Box | null,
  patch: Partial<SvgElement> = {},
) {
  const avoid = keep && { ...keep, x: keep.x - box.x, y: keep.y - box.y };
  const d = make({ width: box.width, height: box.height, avoid });
  return createSvg(d.svg, "graphic", { ...box, role: "decor", ...patch });
}

/** Boîte englobant des éléments, élargie de `pad`. */
function bounds(elements: DesignElement[], pad: number): Box | null {
  if (!elements.length) return null;
  const x = Math.min(...elements.map((e) => e.x)) - pad;
  const y = Math.min(...elements.map((e) => e.y)) - pad;
  const right = Math.max(...elements.map((e) => e.x + e.width)) + pad;
  const bottom = Math.max(...elements.map((e) => e.y + e.height)) + pad;
  return { x, y, width: right - x, height: bottom - y };
}

/** Unité des corps de texte : un peu plus grande sur les formats hauts, qui ont la place. */
const TEXT_SCALE: Partial<Record<Frame["o"], number>> = { story: 1.25, portrait: 1.1 };
const textUnit = (f: Frame) => f.u * (TEXT_SCALE[f.o] ?? 1);

const full = (f: Frame, top = 0, share = 1): Box => ({ x: 0, y: f.h * top, width: f.w, height: f.h * share });

/** Zone d'illustration et zone de texte : côte à côte (formats larges) ou empilées. */
function split(f: Frame, share: number) {
  if (f.o === "banner" || f.o === "landscape") {
    const vw = f.w * (f.o === "banner" ? 0.3 : 0.44);
    return {
      wide: true,
      visual: { x: f.m * 0.6, y: f.m * 0.5, width: vw - f.m * 0.6, height: f.h - f.m },
      text: { x: vw + f.m * 0.4, width: f.w - vw - f.m * 1.2, top: f.m * 0.5, bottom: f.h - f.m * 0.5 },
    };
  }
  const vh = f.h * share;
  return {
    wide: false,
    visual: { x: f.m, y: f.m * 0.8, width: f.w - 2 * f.m, height: vh - f.m * 0.8 },
    text: { x: f.m, width: f.w - 2 * f.m, top: vh + 2 * f.u, bottom: f.h - f.m },
  };
}

const center = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const square = (c: { x: number; y: number }, side: number): Box => ({
  x: c.x - side / 2,
  y: c.y - side / 2,
  width: side,
  height: side,
});

/** Gros titre en lettrage relief (contour, ombre portée), sur une ligne. */
function lettered(
  content: string,
  font: FontChoice,
  size: number,
  width: number,
  colors: { fill: Paint; outline: string; depth: string },
) {
  const el = fitLines(
    text(content, { font, size, color: "#000000", align: "center", lineHeight: 1.05, role: "title" }, width),
    1,
  );
  const effects: TextEffects = { extrude: { color: colors.depth, depth: el.fontSize * 0.07, angle: 45 } };
  return {
    ...el,
    fill: colors.fill,
    stroke: { color: colors.outline, width: el.fontSize * 0.035 },
    effects,
  } satisfies TextElement;
}

/** Bandeau aux couleurs du drapeau au bas de la page (fond perdu compris à l'impression). */
function flagBand(ctx: TemplateContext, f: Frame, colors: string[], height: number): DesignElement[] {
  const bleed = ctx.print ? (ctx.print.bleedMm / ctx.print.widthMm) * f.w : 0;
  const width = (f.w + 2 * bleed) / colors.length;
  return colors.map((color, i) =>
    createShape("rect", {
      x: -bleed + i * width,
      y: f.h - height,
      width: width + (i < colors.length - 1 ? 0.5 : 0),
      height: height + bleed,
      fill: solid(color),
      role: "decor",
    }),
  );
}

/** Couleur vive la plus lisible sur un fond, sinon l'or. */
function brightOn(colors: string[], background: string, ratio = 3, fallback = "#fcd34d") {
  const best = [...colors].sort((a, b) => contrastRatio(b, background) - contrastRatio(a, background))[0];
  return best && contrastRatio(best, background) >= ratio ? best : fallback;
}

/** Couleurs de fête : celles de la marque d'abord, puis or et rose. */
function partyColors(ctx: TemplateContext) {
  const { primary, secondary } = ctx.brand.colors;
  return [...new Set([primary, secondary, "#f59e0b", "#ec4899"].map((c) => c.toLowerCase()))];
}

const caps = (font: FontChoice, size: number, color: string, spacing = 0.2) =>
  ({
    font,
    size,
    color,
    uppercase: true,
    letterSpacing: spacing,
    role: "subtitle",
    align: "center",
  }) as const;

// ─── Indépendance et fête nationale ───

const independenceFlag: StudioTemplate = {
  id: "independence-flag",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const o = occasionOf(ctx);
    const { flag } = o.country;
    const vivid = flagColors(flag);
    const deep = [...vivid].sort((a, b) => luminance(a) - luminance(b))[0];
    const bg = mix(deep, "#000000", 0.62);
    const accent = brightOn(vivid, bg, 3.5);
    const layout = split(f, 0.42);
    const v = layout.visual;
    const flagW = Math.min(v.width * 0.9, v.height * 0.86 * 1.5);
    const flagH = flagW / 1.5;
    const fx = v.x + (v.width - flagW) / 2;
    const fy = v.y + (v.height - flagH) / 2;
    const burst = Math.max(v.width, v.height) * 1.6;
    const decor: DesignElement[] = [
      place(sunburst(accent), square(center(v), burst), "contain", { opacity: 0.12 }),
      createShape("rect", {
        x: fx + f.u * 1.4,
        y: fy + f.u * 1.4,
        width: flagW,
        height: flagH,
        radius: f.u * 0.8,
        fill: solid("#000000"),
        opacity: 0.3,
        rotation: -3,
        role: "decor",
      }),
      createSvg(flagSvg(flag), "graphic", {
        x: fx,
        y: fy,
        width: flagW,
        height: flagH,
        rotation: -3,
        role: "decor",
      }),
    ];
    const t = layout.text;
    const independence = o.years !== null;
    const content = column(
      (k) => [
        single(
          label(independence ? copy.independenceKicker : copy.nationalKicker, {
            ...caps(brand.body, 3.4 * u * k, accent, 0.18),
            font: { ...brand.body, fontWeight: 700 },
          }),
        ),
        single(
          fitLines(
            text(
              o.name,
              {
                font: brand.heading,
                size: 10 * u * k,
                color: "#ffffff",
                align: "center",
                lineHeight: 1.02,
                role: "title",
              },
              t.width,
            ),
            2,
          ),
        ),
        single(
          lettered(
            independence ? String(o.years) : o.dayMonth,
            ROUND,
            (independence ? 26 : 14) * u * k,
            t.width,
            { fill: solid(accent), outline: "#ffffff", depth: mix(deep, "#000000", 0.35) },
          ),
        ),
        independence
          ? single(label(copy.independenceYears, caps(brand.body, 3.6 * u * k, "#ffffff", 0.16)))
          : null,
        o.since
          ? single(
              text(
                `${o.since} – ${o.date}`,
                {
                  font: brand.body,
                  size: 3.2 * u * k,
                  color: mix("#ffffff", bg, 0.25),
                  align: "center",
                  role: "info",
                },
                t.width,
              ),
            )
          : null,
        single(
          text(
            copy.independenceBody,
            {
              font: brand.body,
              size: 3.8 * u * k,
              color: "#ffffff",
              align: "center",
              lineHeight: 1.35,
              role: "body",
            },
            t.width * 0.92,
          ),
        ),
        single(logo(brand, bg, 6 * u * k, t.width * 0.4)),
      ],
      t,
      { align: "center", gap: 2.4 * f.u },
    );
    const confettis = scatter(
      (size) => confetti([...vivid, accent], { ...size, seed: 9, count: 55 }),
      full(f, 0, 0.62),
      bounds(content, 1.5 * f.u),
      { opacity: 0.85 },
    );
    return [
      page(solid(bg), [...decor, confettis, ...content, ...flagBand(ctx, f, flagPalette(flag), 1.6 * f.u)]),
    ];
  },
};

const independenceBunting: StudioTemplate = {
  id: "independence-bunting",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const o = occasionOf(ctx);
    const { flag } = o.country;
    const vivid = flagColors(flag);
    const bg = "#fffdf7";
    const ink = "#1f2937";
    const strong = [...vivid].sort((a, b) => contrastRatio(b, bg) - contrastRatio(a, bg))[0];
    const accent = contrastRatio(strong, bg) >= 3 ? strong : ink;
    const garland = place(bunting(flagPalette(flag)), {
      x: 0,
      y: 0,
      width: f.w,
      height: Math.min(f.w * 0.2, f.h * 0.3),
    });
    const garlandBottom = garland.y + garland.height;
    const band = 2 * f.u;
    const width = f.o === "banner" ? f.w * 0.6 : f.w - 2 * f.m;
    const independence = o.years !== null;
    const content = column(
      (k) => [
        single(createSvg(flagSvg(flag), "graphic", { width: 15 * u * k, height: 10 * u * k, role: "decor" })),
        single(
          label(independence ? copy.independenceKicker : copy.nationalKicker, {
            ...caps(brand.body, 3.4 * u * k, accent, 0.2),
            font: { ...brand.body, fontWeight: 700 },
          }),
        ),
        single(
          fitLines(
            text(
              o.name,
              {
                font: brand.heading,
                size: 13 * u * k,
                color: ink,
                align: "center",
                lineHeight: 1,
                role: "title",
              },
              width,
            ),
            2,
          ),
        ),
        single(
          text(
            independence ? `${o.years} ${copy.independenceYears}` : o.date,
            {
              font: { ...brand.body, fontWeight: 700 },
              size: 5 * u * k,
              color: accent,
              align: "center",
              role: "subtitle",
            },
            width,
          ),
        ),
        o.since
          ? single(
              text(
                `${o.since} – ${o.date}`,
                {
                  font: brand.body,
                  size: 3.2 * u * k,
                  color: mix(ink, bg, 0.35),
                  align: "center",
                  role: "info",
                },
                width,
              ),
            )
          : null,
        single(
          text(
            copy.independenceBody,
            {
              font: brand.body,
              size: 3.8 * u * k,
              color: mix(ink, bg, 0.15),
              align: "center",
              lineHeight: 1.35,
              role: "body",
            },
            width * 0.9,
          ),
        ),
        single(logo(brand, bg, 6 * u * k, width * 0.4)),
      ],
      { width, x: (f.w - width) / 2, top: garlandBottom + 1.5 * f.u, bottom: f.h - band - f.m * 0.7 },
      { align: "center", gap: 2.4 * f.u },
    );
    const confettis = scatter(
      (size) => confetti(vivid, { ...size, seed: 4, count: 45 }),
      full(f, 0.08, 0.8),
      bounds(content, 1.5 * f.u),
      { opacity: 0.8 },
    );
    return [
      page(solid(bg), [
        confettis,
        { ...garland, y: -f.u },
        ...content,
        ...flagBand(ctx, f, flagPalette(flag), band),
      ]),
    ];
  },
};

// ─── Anniversaire, mariage, naissance ───

const birthdayBalloons: StudioTemplate = {
  id: "birthday-balloons",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const colors = partyColors(ctx);
    const primary = brand.colors.primary;
    const bg = mix(primary, "#ffffff", 0.86);
    const ink = readableFrom([brand.colors.text, primary, "#1f2937"], bg);
    const title = readableFrom([primary, brand.colors.text], bg, 3);
    const gold = brightOn(colors.slice(1), bg, 1.8, "#f59e0b");
    const wide = f.o === "banner" || f.o === "landscape";
    const decor: DesignElement[] = [
      place(
        balloons(colors, { seed: 5 }),
        wide
          ? { x: -f.w * 0.02, y: f.h * 0.05, width: f.w * 0.26, height: f.h * 1.05 }
          : { x: -f.w * 0.06, y: f.h * 0.44, width: f.w * 0.26, height: f.h * 0.6 },
      ),
      place(
        balloons([...colors].reverse(), { seed: 8, count: 3 }),
        wide
          ? { x: f.w * 0.78, y: -f.h * 0.05, width: f.w * 0.22, height: f.h * 0.9 }
          : { x: f.w * 0.76, y: 0, width: f.w * 0.26, height: f.h * 0.45 },
      ),
    ];
    const width = wide ? f.w * 0.5 : f.w - 2 * f.m;
    const content = column(
      (k) => [
        single(
          fitLines(
            text(
              copy.birthdayTitle,
              { font: PARTY, size: 9 * u * k, color: title, align: "center", lineHeight: 1.2, role: "title" },
              width,
            ),
            2,
          ),
        ),
        single(
          lettered(copy.birthdayAge, ROUND, 30 * u * k, width * 0.8, {
            fill: solid(gold),
            outline: "#ffffff",
            depth: mix(primary, "#000000", 0.25),
          }),
        ),
        single(
          fitLines(
            text(
              copy.birthdayName,
              {
                font: brand.heading,
                size: 8 * u * k,
                color: ink,
                align: "center",
                lineHeight: 1.05,
                role: "subtitle",
              },
              width,
            ),
            2,
          ),
        ),
        single(
          text(
            copy.birthdayBody,
            {
              font: brand.body,
              size: 3.8 * u * k,
              color: mix(ink, bg, 0.15),
              align: "center",
              lineHeight: 1.35,
              role: "body",
            },
            width * (wide ? 0.85 : 0.7),
          ),
        ),
        single(logo(brand, bg, 5.5 * u * k, width * 0.35)),
      ],
      { width, x: (f.w - width) / 2, top: f.m, bottom: f.h - f.m },
      { align: "center", gap: 2.6 * f.u },
    );
    const confettis = scatter(
      (size) => confetti(colors, { ...size, seed: 12, count: 60 }),
      full(f, 0, 0.7),
      bounds(content, 1.5 * f.u),
    );
    return [page(solid(bg), [confettis, ...decor, ...content])];
  },
};

const weddingElegant: StudioTemplate = {
  id: "wedding-elegant",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const bg = "#fbf7f0";
    const gold = "#b8902f";
    // Encre de la marque si elle est très sombre (marine, noir), sinon brun doux.
    const ink = luminance(brand.colors.primary) < 0.08 ? brand.colors.primary : "#3f3a36";
    const inset = f.m * 0.45;
    const border = (offset: number, width: number) =>
      createShape("rect", {
        x: offset,
        y: offset,
        width: f.w - 2 * offset,
        height: f.h - 2 * offset,
        fill: { type: "none" },
        stroke: { width, color: gold, dash: "solid" },
        role: "decor",
      });
    const width = f.o === "banner" || f.o === "landscape" ? f.w * 0.62 : f.w - 2 * f.m - 2 * f.u;
    const soft = mix(ink, bg, 0.3);
    const content = column(
      (k) => [
        single(place(weddingRings(gold), { x: 0, y: 0, width: 20 * u * k, height: 14 * u * k })),
        single(label(copy.weddingKicker, caps(SERIF, 3.6 * u * k, gold, 0.3))),
        single(
          fitLines(
            text(
              copy.weddingNames,
              { font: SCRIPT, size: 15 * u * k, color: ink, align: "center", lineHeight: 1.1, role: "title" },
              width,
            ),
            2,
          ),
        ),
        single(place(flourish(gold), { x: 0, y: 0, width: width * 0.55, height: 6 * u * k })),
        single(
          text(
            copy.weddingDate,
            { font: SERIF, size: 4.6 * u * k, color: ink, align: "center", role: "info" },
            width,
          ),
        ),
        single(
          text(
            copy.weddingPlace,
            { font: SERIF, size: 3.8 * u * k, color: soft, align: "center", role: "info" },
            width,
          ),
        ),
        single(
          text(
            copy.weddingBody,
            { font: SERIF, size: 3.8 * u * k, color: soft, align: "center", lineHeight: 1.35, role: "body" },
            width * 0.85,
          ),
        ),
        single(logo(brand, bg, 4.5 * u * k, width * 0.3)),
      ],
      { width, x: (f.w - width) / 2, top: f.m + 2 * f.u, bottom: f.h - f.m - 2 * f.u },
      { align: "center", gap: 2.4 * f.u },
    );
    return [page(solid(bg), [border(inset, 0.35 * f.u), border(inset + 1.4 * f.u, 0.15 * f.u), ...content])];
  },
};

const babyWelcome: StudioTemplate = {
  id: "baby-welcome",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const bg = mix(brand.colors.secondary, "#ffffff", 0.84);
    const ink = readableFrom([brand.colors.text, brand.colors.primary, "#1f2937"], bg);
    const title = readableFrom([brand.colors.primary, brand.colors.text], bg, 3);
    const gold = "#e0a526";
    const pastel = partyColors(ctx).map((c) => mix(c, "#ffffff", 0.45));
    const garland = place(bunting(pastel, { count: 9 }), {
      x: 0,
      y: -f.u,
      width: f.w,
      height: Math.min(f.w * 0.2, f.h * 0.25),
    });
    const layout = split(f, 0.4);
    // Croissant sous la guirlande (formats hauts) ou à gauche du texte (formats larges).
    const v = layout.wide
      ? layout.visual
      : {
          ...layout.visual,
          y: garland.y + garland.height,
          height: layout.text.top - garland.y - garland.height,
        };
    const moon = place(crescentStar(gold), square(center(v), Math.min(v.width, v.height) * 0.8));
    const t = layout.text;
    const content = column(
      (k) => [
        single(
          label(copy.babyKicker, {
            font: PARTY,
            size: 8 * u * k,
            color: title,
            align: "center",
            role: "subtitle",
          }),
        ),
        single(
          fitLines(
            text(
              copy.babyName,
              { font: FRIENDLY, size: 14 * u * k, color: ink, align: "center", lineHeight: 1, role: "title" },
              t.width,
            ),
            2,
          ),
        ),
        single(
          text(
            copy.babyBody,
            {
              font: brand.body,
              size: 3.8 * u * k,
              color: mix(ink, bg, 0.15),
              align: "center",
              lineHeight: 1.35,
              role: "body",
            },
            t.width * 0.9,
          ),
        ),
        single(logo(brand, bg, 5.5 * u * k, t.width * 0.35)),
      ],
      t,
      { align: "center", gap: 2.6 * f.u },
    );
    const stars = scatter(
      (size) => sparkles([gold, "#ffffff", ...pastel], { ...size, seed: 17, count: 30 }),
      full(f),
      bounds([...content, moon], 1.5 * f.u),
      { opacity: 0.9 },
    );
    return [page(solid(bg), [garland, stars, moon, ...content])];
  },
};

// ─── Fêtes religieuses et de fin d'année ───

/** Nuit étoilée : lanternes, étincelles, silhouette de mosquée, croissant ; texte au centre. */
function nightFeast(
  ctx: TemplateContext,
  options: {
    top: string;
    bottom: string;
    gold: string;
    kicker: string;
    title: string;
    body: string;
    moon: "column" | "corner";
  },
) {
  const f = frame(ctx);
  const u = textUnit(f);
  const { brand } = ctx;
  const { gold } = options;
  const background: Paint = {
    type: "linear",
    angle: 90,
    stops: [
      { offset: 0, color: options.top },
      { offset: 1, color: options.bottom },
    ],
  };
  const skylineW = Math.min(f.w, f.h * 0.34 * 2);
  const layout = split(f, 0.4);
  // Formats larges : croissant au-dessus du texte, comme pour l'Aïd (le coin est pris par le texte).
  const corner = options.moon === "corner" && !layout.wide;
  const decor: DesignElement[] = [
    place(
      lanterns(gold, "#fde68a"),
      { x: f.m * 0.4, y: 0, width: f.w * 0.3, height: f.h * 0.42 },
      "contain",
      { y: 0 },
    ),
    place(mosque(mix(options.bottom, "#000000", 0.45)), {
      x: (f.w - skylineW) / 2,
      y: f.h - skylineW / 2,
      width: skylineW,
      height: skylineW / 2,
    }),
  ];
  if (corner) {
    const side = Math.min(f.w, f.h) * 0.34;
    decor.push(place(crescentStar(gold), { x: f.w - f.m - side, y: f.m * 0.6, width: side, height: side }));
  } else {
    decor.push(
      place(
        lanterns(gold, "#fde68a", { count: 2 }),
        { x: f.w - f.w * 0.2 - f.m * 0.4, y: 0, width: f.w * 0.2, height: f.h * 0.34 },
        "contain",
        { y: 0 },
      ),
    );
  }
  const t =
    corner || layout.wide
      ? layout.text
      : { x: f.m, width: f.w - 2 * f.m, top: f.h * 0.22, bottom: f.h - f.m };
  const content = column(
    (k) => [
      corner
        ? null
        : single(place(crescentStar(gold), { x: 0, y: 0, width: 20 * u * k, height: 20 * u * k })),
      single(
        label(options.kicker, {
          ...caps(brand.body, 3.4 * u * k, gold, 0.22),
          font: { ...brand.body, fontWeight: 700 },
        }),
      ),
      single(
        fitLines(
          text(
            options.title,
            {
              font: ELEGANT,
              size: 10 * u * k,
              color: "#ffffff",
              align: "center",
              lineHeight: 1.1,
              role: "title",
            },
            t.width,
          ),
          2,
        ),
      ),
      single(place(flourish(gold), { x: 0, y: 0, width: t.width * 0.5, height: 5 * u * k })),
      single(
        text(
          options.body,
          {
            font: brand.body,
            size: 3.8 * u * k,
            color: mix("#ffffff", options.top, 0.12),
            align: "center",
            lineHeight: 1.4,
            role: "body",
          },
          t.width * 0.88,
        ),
      ),
      single(logo(brand, options.bottom, 6 * u * k, t.width * 0.4)),
    ],
    t,
    { align: "center", gap: 2.6 * f.u },
  );
  const stars = scatter(
    (size) => sparkles([gold, "#ffffff"], { ...size, seed: corner ? 31 : 37, count: 34 }),
    full(f),
    bounds(content, 1.5 * f.u),
    { opacity: 0.85 },
  );
  return [page(background, [stars, ...decor, ...content])];
}

const eidMubarak: StudioTemplate = {
  id: "eid-mubarak",
  category: "celebration",
  build: (ctx) =>
    nightFeast(ctx, {
      top: "#0f5132",
      bottom: "#052e1f",
      gold: "#e3b341",
      kicker: ctx.copy.eidKicker,
      title: ctx.copy.eidTitle,
      body: ctx.copy.eidBody,
      moon: "column",
    }),
};

const ramadanKareem: StudioTemplate = {
  id: "ramadan-kareem",
  category: "celebration",
  build: (ctx) =>
    nightFeast(ctx, {
      top: "#1e1b4b",
      bottom: "#0b0a24",
      gold: "#f5c451",
      kicker: ctx.copy.ramadanKicker,
      title: ctx.copy.ramadanTitle,
      body: ctx.copy.ramadanBody,
      moon: "corner",
    }),
};

const newYearGold: StudioTemplate = {
  id: "new-year-gold",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const o = occasionOf(ctx);
    const dark = "#020617";
    const gold = "#f5c451";
    const background: Paint = {
      type: "radial",
      stops: [
        { offset: 0, color: "#1e293b" },
        { offset: 1, color: dark },
      ],
    };
    const goldPaint: Paint = {
      type: "linear",
      angle: 90,
      stops: [
        { offset: 0, color: "#fde68a" },
        { offset: 0.55, color: "#f59e0b" },
        { offset: 1, color: "#b45309" },
      ],
    };
    const wide = f.o === "banner" || f.o === "landscape";
    const decor: DesignElement[] = [
      ...(wide
        ? [
            place(
              fireworks([gold, "#ffffff", brand.colors.primary], {
                count: 2,
                seed: 11,
                width: f.w * 0.22,
                height: f.h * 0.9,
              }),
              { x: 0, y: f.h * 0.05, width: f.w * 0.22, height: f.h * 0.9 },
            ),
            place(
              fireworks([gold, "#ffffff", brand.colors.secondary], {
                count: 2,
                seed: 19,
                width: f.w * 0.22,
                height: f.h * 0.9,
              }),
              { x: f.w * 0.78, y: f.h * 0.05, width: f.w * 0.22, height: f.h * 0.9 },
            ),
          ]
        : [
            place(fireworks([gold, "#ffffff", brand.colors.primary, brand.colors.secondary]), {
              x: 0,
              y: 0,
              width: f.w,
              height: f.h * 0.42,
            }),
          ]),
    ];
    const width = wide ? f.w * 0.56 : f.w - 2 * f.m;
    const content = column(
      (k) => [
        single(
          fitLines(
            text(
              copy.newYearTitle,
              {
                font: SCRIPT,
                size: 13 * u * k,
                color: "#ffffff",
                align: "center",
                lineHeight: 1.1,
                role: "subtitle",
              },
              width,
            ),
            2,
          ),
        ),
        single(
          lettered(String(o.newYear), ROUND, 30 * u * k, width, {
            fill: goldPaint,
            outline: "#fffbeb",
            depth: "#78350f",
          }),
        ),
        single(
          text(
            copy.newYearBody,
            {
              font: brand.body,
              size: 3.8 * u * k,
              color: "#e2e8f0",
              align: "center",
              lineHeight: 1.4,
              role: "body",
            },
            width * 0.85,
          ),
        ),
        single(logo(brand, dark, 6 * u * k, width * 0.4)),
      ],
      { width, x: (f.w - width) / 2, top: wide ? f.m : f.h * 0.3, bottom: f.h - f.m },
      { align: "center", gap: 3 * f.u },
    );
    const keep = bounds(content, 1.5 * f.u);
    const stars = scatter(
      (size) => sparkles([gold, "#ffffff"], { ...size, seed: 41, count: 30 }),
      full(f),
      keep,
      { opacity: 0.7 },
    );
    const confettis = scatter(
      (size) => confetti([gold, "#ffffff", "#fde68a"], { ...size, seed: 23, count: 40 }),
      full(f, 0.45, 0.55),
      keep,
      { opacity: 0.6 },
    );
    return [page(background, [stars, confettis, ...decor, ...content])];
  },
};

const christmasCard: StudioTemplate = {
  id: "christmas-tree",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const gold = "#facc15";
    const bottom = "#450a0a";
    const background: Paint = {
      type: "linear",
      angle: 90,
      stops: [
        { offset: 0, color: "#991b1b" },
        { offset: 1, color: bottom },
      ],
    };
    const layout = split(f, 0.46);
    const v = layout.visual;
    const treeH = v.height * 0.98;
    const tree = place(christmasTree("#15803d", gold), { x: v.x, y: v.y, width: v.width, height: treeH });
    const giftSide = tree.height * 0.28;
    const decor: DesignElement[] = [
      tree,
      place(gift("#1d4ed8", gold), {
        x: tree.x + tree.width * 0.78,
        y: tree.y + tree.height - giftSide,
        width: giftSide,
        height: giftSide,
      }),
      place(gift(gold, "#dc2626"), {
        x: Math.max(f.u, tree.x - giftSide * 0.55),
        y: tree.y + tree.height - giftSide * 0.8,
        width: giftSide * 0.8,
        height: giftSide * 0.8,
      }),
    ];
    const t = layout.text;
    const content = column(
      (k) => [
        single(
          fitLines(
            text(
              copy.christmasTitle,
              {
                font: SCRIPT,
                size: 14 * u * k,
                color: "#ffffff",
                align: "center",
                lineHeight: 1.1,
                role: "title",
              },
              t.width,
            ),
            2,
          ),
        ),
        single(place(flourish(gold), { x: 0, y: 0, width: t.width * 0.5, height: 5 * u * k })),
        single(
          text(
            copy.christmasBody,
            {
              font: brand.body,
              size: 3.8 * u * k,
              color: "#fee2e2",
              align: "center",
              lineHeight: 1.4,
              role: "body",
            },
            t.width * 0.88,
          ),
        ),
        single(logo(brand, bottom, 6 * u * k, t.width * 0.4)),
      ],
      t,
      { align: "center", gap: 2.8 * f.u },
    );
    const snow = scatter(
      (size) => snowflakes("#ffffff", { ...size, seed: 13, count: 22 }),
      full(f),
      bounds(content, 1.5 * f.u),
      { opacity: 0.55 },
    );
    return [page(background, [snow, ...decor, ...content])];
  },
};

// ─── Remise de diplômes ───

const graduationCapTemplate: StudioTemplate = {
  id: "graduation-cap",
  category: "celebration",
  build(ctx) {
    const f = frame(ctx);
    const u = textUnit(f);
    const { brand, copy } = ctx;
    const o = occasionOf(ctx);
    const primary = brand.colors.primary;
    const bg = luminance(primary) < 0.2 ? primary : mix(primary, "#0f172a", 0.6);
    const gold = "#f5b301";
    const layout = split(f, 0.4);
    const v = layout.visual;
    const disc = Math.min(v.width, v.height) * 0.86;
    const c = center(v);
    const decor: DesignElement[] = [
      place(sunburst(gold), square(c, disc * 2.2), "contain", { opacity: 0.12 }),
      createShape("ellipse", { ...square(c, disc), fill: solid(gold), role: "decor" }),
      place(graduationCap("#111827", "#ffffff"), square({ x: c.x, y: c.y + disc * 0.04 }, disc * 0.8)),
    ];
    const t = layout.text;
    const content = column(
      (k) => [
        single(
          label(copy.graduationKicker, {
            font: PARTY,
            size: 8 * u * k,
            color: gold,
            align: "center",
            role: "subtitle",
          }),
        ),
        single(
          fitLines(
            text(
              copy.graduationName,
              {
                font: brand.heading,
                size: 10 * u * k,
                color: "#ffffff",
                align: "center",
                lineHeight: 1.05,
                role: "title",
              },
              t.width,
            ),
            2,
          ),
        ),
        single(
          label(
            copy.graduationClass.replace("{year}", String(o.year)),
            caps(brand.body, 3.6 * u * k, gold, 0.2),
          ),
        ),
        single(
          text(
            copy.graduationDegree,
            {
              font: brand.body,
              size: 4 * u * k,
              color: mix("#ffffff", bg, 0.1),
              align: "center",
              lineHeight: 1.35,
              role: "body",
            },
            t.width * 0.9,
          ),
        ),
        single(logo(brand, bg, 6 * u * k, t.width * 0.4)),
      ],
      t,
      { align: "center", gap: 2.6 * f.u },
    );
    const confettis = scatter(
      (size) => confetti([gold, "#ffffff", brand.colors.secondary], { ...size, seed: 27, count: 55 }),
      full(f, 0, 0.7),
      bounds(content, 1.5 * f.u),
      { opacity: 0.85 },
    );
    return [page(solid(bg), [decor[0], confettis, ...decor.slice(1), ...content])];
  },
};

export const CELEBRATION_TEMPLATES: StudioTemplate[] = [
  independenceFlag,
  independenceBunting,
  birthdayBalloons,
  weddingElegant,
  eidMubarak,
  ramadanKareem,
  newYearGold,
  graduationCapTemplate,
  christmasCard,
  babyWelcome,
];
