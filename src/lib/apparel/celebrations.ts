import { contrastRatio, readableOn } from "@/lib/render/color";
import { getFont } from "@/lib/render/fonts";
import { svgParts } from "@/lib/studio/render";
import { flagBands, flagSvg, getCountry, nationalMotto, nextCelebration } from "@/lib/studio/countries";
import { presetStyle, type LetteringPreset, type PresetColors } from "@/lib/studio/lettering";
import { letteringFamily, newElementId, svgColors, textChecks, textWidthMm } from "./elements";
import type { EditorElement } from "./render";
import type { ApparelContent, PrintZone } from "./types";

// T-shirts de fête : indépendance (drapeau, nom du pays en lettres drapeau, années, devise),
// anniversaire, promotion de diplômés et « Team » (mariage, famille, baptême). Chaque modèle pose
// des éléments ordinaires de la tenue, empilés dans la zone visée : textes, formes de lettrage et
// drapeau restent modifiables un à un (texte, police, couleurs, forme, place).

export const CELEBRATION_KITS = ["independence", "birthday", "graduation", "team"] as const;
export type CelebrationKit = (typeof CELEBRATION_KITS)[number];

/** Textes du modèle, dans la langue de l'interface (`{years}`, `{year}` remplacés). */
export interface KitCopy {
  years: string;
  birthday: string;
  name: string;
  age: string;
  promo: string;
  school: string;
  graduate: string;
  team: string;
  teamName: string;
}

export interface KitContext {
  kit: CelebrationKit;
  /** Pays de la fête (indépendance) : drapeau, couleurs, devise, années. */
  country: string;
  /** Couleur du tissu, encre lisible dessus et seconde couleur (marque) des formes de lettrage. */
  garment: string;
  ink: string;
  second: string;
  locale: string;
  copy: KitCopy;
  today?: Date;
}

type Line =
  | {
      type: "text";
      text: string;
      fontId: string;
      fontWeight: number;
      share: number;
      preset?: LetteringPreset;
      fill?: string;
    }
  | { type: "svg"; svg: string; share: number };

const round = (value: number) => Math.round(value * 10) / 10;

/** Lignes du modèle, du haut vers le bas ; `share` : part de la hauteur de la zone. */
function kitLines(ctx: KitContext): Line[] {
  const { copy } = ctx;
  const today = ctx.today ?? new Date();
  const dateOf = (date: Date) =>
    new Intl.DateTimeFormat(ctx.locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  switch (ctx.kit) {
    case "independence": {
      const country = getCountry(ctx.country);
      const next = nextCelebration(country, today);
      const year = next.date.getFullYear();
      let name = country.code;
      try {
        name = new Intl.DisplayNames([ctx.locale], { type: "region" }).of(country.code) ?? country.code;
      } catch {
        // Code ISO affiché tel quel
      }
      const motto = nationalMotto(country.code);
      const dayMonth = new Intl.DateTimeFormat(ctx.locale, { day: "numeric", month: "long" }).format(
        next.date,
      );
      const lines: (Line | null)[] = [
        { type: "svg", svg: flagSvg(country.flag), share: 1.3 },
        {
          type: "text",
          text: name.toUpperCase(),
          fontId: "anton",
          fontWeight: 400,
          share: 1.5,
          preset: "flag",
        },
        {
          type: "text",
          text:
            next.years === null ? dayMonth.toUpperCase() : copy.years.replace("{years}", String(next.years)),
          fontId: "graduate",
          fontWeight: 400,
          share: 2,
          preset: "college",
        },
        motto
          ? { type: "text", text: motto.toUpperCase(), fontId: "oswald", fontWeight: 600, share: 0.5 }
          : null,
        country.year
          ? { type: "text", text: `${country.year} – ${year}`, fontId: "oswald", fontWeight: 700, share: 0.6 }
          : null,
      ];
      return lines.filter((line): line is Line => line !== null);
    }
    case "birthday":
      return [
        { type: "text", text: copy.birthday, fontId: "pacifico", fontWeight: 400, share: 1 },
        { type: "text", text: copy.name, fontId: "anton", fontWeight: 400, share: 1.3, preset: "outline" },
        { type: "text", text: copy.age, fontId: "graduate", fontWeight: 400, share: 2.4, preset: "neon" },
        { type: "text", text: dateOf(today), fontId: "oswald", fontWeight: 600, share: 0.55 },
      ];
    case "graduation":
      return [
        { type: "text", text: copy.graduate, fontId: "pacifico", fontWeight: 400, share: 0.9 },
        {
          type: "text",
          text: copy.promo.replace("{year}", String(today.getFullYear())),
          fontId: "graduate",
          fontWeight: 400,
          share: 2,
          preset: "college",
        },
        { type: "text", text: copy.school, fontId: "oswald", fontWeight: 700, share: 0.8 },
      ];
    default:
      return [
        { type: "text", text: copy.team, fontId: "anton", fontWeight: 400, share: 1.8, preset: "twoTone" },
        { type: "text", text: copy.teamName, fontId: "pacifico", fontWeight: 400, share: 1.3 },
        { type: "text", text: dateOf(today), fontId: "oswald", fontWeight: 600, share: 0.55 },
      ];
  }
}

/** Contenu d'un texte de hauteur `heightMm`, avec la forme de lettrage à l'échelle de son corps. */
function textContent(
  line: Extract<Line, { type: "text" }>,
  heightMm: number,
  colors: PresetColors,
): ApparelContent {
  const font = getFont(line.fontId);
  const fontSize = heightMm / (font.ascent + font.descent);
  const fill = line.fill ?? colors.fill ?? "#111111";
  const style = line.preset ? presetStyle(line.preset, fontSize, colors) : { stroke: null, effects: null };
  return {
    fill,
    text: line.text,
    fontId: line.fontId,
    fontWeight: line.fontWeight,
    textOutline: style.stroke ? { color: style.stroke.color, widthMm: style.stroke.width } : null,
    effects: style.effects,
    style: letteringFamily(style.stroke, style.effects),
    source: "library",
  };
}

/** Polices des modèles de fête (à charger avant de mesurer les textes). */
export const KIT_FONTS = [
  { fontId: "anton", fontWeight: 400 },
  { fontId: "graduate", fontWeight: 400 },
  { fontId: "oswald", fontWeight: 600 },
  { fontId: "oswald", fontWeight: 700 },
  { fontId: "pacifico", fontWeight: 400 },
];

/**
 * Éléments d'un t-shirt de fête, empilés et centrés dans `zone` : chaque ligne reçoit sa part de
 * la hauteur, puis est réduite si elle dépasse la largeur.
 */
export function celebrationKit(ctx: KitContext, zone: PrintZone): EditorElement[] {
  const lines = kitLines(ctx);
  const country = getCountry(ctx.country);
  const accent = readableOn(ctx.ink);
  const colors: PresetColors = {
    accent,
    second: contrastRatio(ctx.second, ctx.ink) >= 1.5 ? ctx.second : accent,
    fill: ctx.ink,
    flag: flagBands(country.flag),
  };
  // Lettres drapeau : contour neutre lisible sur le tissu, pour ne masquer aucune bande.
  const flagColors: PresetColors = { ...colors, second: readableOn(ctx.garment) };
  const usable = zone.maxHeightMm * 0.92;
  const gap = usable * 0.03;
  const shares = lines.reduce((sum, line) => sum + line.share, 0);
  const unit = (usable - gap * (lines.length - 1)) / shares;
  const maxWidth = zone.maxWidthMm * 0.95;
  let y = (zone.maxHeightMm - usable) / 2;
  const elements: EditorElement[] = [];
  for (const line of lines) {
    const slot = line.share * unit;
    const lineColors = line.type === "text" && line.preset === "flag" ? flagColors : colors;
    const placed =
      line.type === "svg" ? svgLine(line.svg, slot, maxWidth) : textLine(line, slot, maxWidth, lineColors);
    elements.push({
      ...placed,
      id: newElementId(),
      zoneKey: zone.key,
      offsetXMm: round((zone.maxWidthMm - placed.widthMm) / 2),
      offsetYMm: round(y + (slot - placed.heightMm) / 2),
      rotationDeg: 0,
    });
    y += slot + gap;
  }
  return elements;
}

function svgLine(svg: string, slot: number, maxWidth: number) {
  const parts = svgParts(svg);
  const ratio = parts.width / parts.height || 1.5;
  const heightMm = Math.min(slot, maxWidth / ratio);
  return {
    kind: "LOGO" as const,
    content: { svg, colors: svgColors(svg), source: "library" as const },
    widthMm: round(heightMm * ratio),
    heightMm: round(heightMm),
  };
}

function textLine(
  line: Extract<Line, { type: "text" }>,
  slot: number,
  maxWidth: number,
  colors: PresetColors,
) {
  let heightMm = slot;
  let content = textContent(line, heightMm, colors);
  let widthMm = textWidthMm(content, heightMm);
  if (widthMm > maxWidth) {
    heightMm *= maxWidth / widthMm;
    content = textContent(line, heightMm, colors);
    widthMm = Math.min(maxWidth, textWidthMm(content, heightMm));
  }
  return {
    kind: "TEXT" as const,
    content: { ...content, ...textChecks(content, heightMm, widthMm) },
    widthMm: round(widthMm),
    heightMm: round(heightMm),
  };
}
