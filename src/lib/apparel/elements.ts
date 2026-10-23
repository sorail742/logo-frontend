import { normalizeHex } from "@/lib/render/color";
import { getFont } from "@/lib/render/fonts";
import { randomId } from "@/lib/random";
import { svgParts } from "@/lib/studio/render";
import { measureText } from "@/lib/studio/text";
import { arcSagitta, type EditorElement } from "./render";
import type { ApparelContent, ApparelPhoto, ElementKind, PrintZone } from "./types";
import { effectColors, type TextEffects } from "@/lib/studio/lettering";

// Création des éléments d'une tenue : texte, nom et numéro de joueur, logo, image. Chaque
// élément est dimensionné pour sa zone et porte les informations lues par les contrôles
// (couleurs imprimées, trait le plus fin, pixels utiles, origine et droits).

export const newElementId = () => randomId();

export type TextKind = Extract<ElementKind, "TEXT" | "PLAYER_NAME" | "PLAYER_NUMBER">;
export const TEXT_KINDS: TextKind[] = ["TEXT", "PLAYER_NAME", "PLAYER_NUMBER"];
export const isTextKind = (kind: ElementKind): kind is TextKind =>
  (TEXT_KINDS as ElementKind[]).includes(kind);

const round = (value: number) => Math.round(value * 10) / 10;

/** Corps de police sans arc : hauteur de boîte / (ascendantes + descendantes). */
function plainFontSize(content: ApparelContent, heightMm: number) {
  const font = getFont(content.fontId ?? "montserrat");
  return heightMm / (font.ascent + font.descent);
}

/** Largeur d'un texte pour une hauteur donnée (polices réelles chargées). */
export function textWidthMm(content: ApparelContent, heightMm: number) {
  const fontSize = plainFontSize(content, heightMm);
  const width = measureText(content.text ?? "", {
    fontId: content.fontId ?? "montserrat",
    fontWeight: content.fontWeight ?? 700,
    fontSize,
    letterSpacing: content.letterSpacing ?? 0,
  });
  return Math.max(4, width + fontSize * 0.06 + (content.textOutline?.widthMm ?? 0) * 2 + effectsWidthMm(content.effects));
}

/** Largeur ajoutée par les effets : second contour des deux côtés, relief vers la droite ou la gauche. */
function effectsWidthMm(effects: TextEffects | null | undefined) {
  if (!effects) return 0;
  const extrude = effects.extrude ? Math.abs(Math.cos((effects.extrude.angle * Math.PI) / 180)) * effects.extrude.depth : 0;
  return (effects.outline2?.width ?? 0) * 2 + extrude;
}

/** Famille de style des règles d'impression (STYLE_TECHNIQUES de l'API) d'après la forme du lettrage. */
export function letteringFamily(stroke: unknown, effects: TextEffects | null | undefined) {
  if (effects?.halftone) return "HALFTONE";
  if (effects?.pattern) return "TEXTURED";
  if (effects?.extrude) return "RIBBON_3D";
  if (effects?.inline) return "GEOMETRIC_INLINE";
  if (effects?.outline2?.notched) return "NOTCHED";
  if (effects?.outline2 || stroke) return "CLASSIC_OUTLINE";
  return undefined;
}

/** Épaisseur du fût des lettres, en proportion du corps, selon la graisse. */
function stemRatio(weight: number) {
  if (weight >= 800) return 0.14;
  if (weight >= 700) return 0.12;
  if (weight >= 600) return 0.1;
  return 0.075;
}

/** Trait le plus fin d'un texte : fût des lettres estimé d'après la graisse, ou contour. */
export function textStrokeMm(content: ApparelContent, heightMm: number) {
  const font = getFont(content.fontId ?? "montserrat");
  const ratio = stemRatio(content.fontWeight ?? 700) * (font.category === "script" ? 0.5 : 1);
  const stem = plainFontSize(content, heightMm) * ratio;
  // Traits imprimés les plus fins : fût, contours, liseré.
  const lines = [content.textOutline?.widthMm, content.effects?.outline2?.width, content.effects?.inline?.width].filter((w): w is number => Boolean(w && w > 0));
  return round(Math.min(stem, ...lines));
}

/** Couleurs HEX d'un SVG (remplissages, contours, dégradés). */
export function svgColors(svg: string) {
  const found = new Set<string>();
  for (const match of svg.matchAll(/(?:fill|stroke|stop-color)\s*[=:]\s*["']?(#[0-9a-f]{3,6})\b/gi)) {
    const hex = normalizeHex(match[1]!);
    if (/^#[0-9a-f]{6}$/i.test(hex)) found.add(hex.toLowerCase());
  }
  return [...found];
}

/** Informations de contrôle d'un texte, recalculées à chaque modification (arc : corps réduit). */
export function textChecks(content: ApparelContent, heightMm: number, widthMm = 0): Partial<ApparelContent> {
  const colors = [content.fill ?? "#111111"];
  if (content.textOutline && content.textOutline.widthMm > 0) colors.push(content.textOutline.color);
  colors.push(...effectColors(content.effects));
  const outline = content.textOutline && content.textOutline.widthMm > 0 ? content.textOutline.color : null;
  const edge = [content.effects?.outline2?.color ?? outline ?? content.fill ?? "#111111", content.effects?.extrude?.color].filter((c): c is string => Boolean(c));
  const glyphHeight = Math.max(1, heightMm - arcSagitta(widthMm, content.curve));
  return {
    colors: [...new Set(colors.map((c) => c.toLowerCase()))],
    edgeColors: [...new Set(edge.map((c) => c.toLowerCase()))],
    strokeMm: textStrokeMm(content, glyphHeight),
    gradient: false,
  };
}

/** Pixels utiles d'une photo (recadrage compris). */
export const photoPixelWidth = (photo: ApparelPhoto) =>
  Math.round(photo.naturalWidth * (photo.crop?.width ?? 1));

/** Boîte centrée dans la zone, au plus `fill` de sa taille, proportions conservées. */
export function fitInZone(ratio: number, zone: PrintZone, fill = 0.9, maxHeight = Infinity) {
  let heightMm = Math.min(zone.maxHeightMm * fill, maxHeight);
  let widthMm = heightMm * ratio;
  if (widthMm > zone.maxWidthMm * fill) {
    widthMm = zone.maxWidthMm * fill;
    heightMm = widthMm / ratio;
  }
  return {
    widthMm: round(widthMm),
    heightMm: round(heightMm),
    offsetXMm: round((zone.maxWidthMm - widthMm) / 2),
    offsetYMm: round((zone.maxHeightMm - heightMm) / 2),
  };
}

const TEXT_DEFAULTS: Record<
  TextKind,
  { text: string; fontId: string; fontWeight: number; maxHeight: number; fill: number }
> = {
  TEXT: { text: "TEXTE", fontId: "montserrat", fontWeight: 800, maxHeight: 50, fill: 0.5 },
  PLAYER_NAME: { text: "NOM", fontId: "oswald", fontWeight: 700, maxHeight: 75, fill: 0.85 },
  PLAYER_NUMBER: { text: "10", fontId: "oswald", fontWeight: 700, maxHeight: 250, fill: 0.85 },
};

/** Texte, nom ou numéro dimensionné pour la zone. */
export function createTextElement(
  kind: TextKind,
  zone: PrintZone,
  patch: Partial<ApparelContent> = {},
): EditorElement {
  const defaults = TEXT_DEFAULTS[kind];
  const content: ApparelContent = {
    text: defaults.text,
    fontId: defaults.fontId,
    fontWeight: defaults.fontWeight,
    fill: "#111111",
    textOutline: null,
    source: "library",
    ...patch,
  };
  let heightMm = Math.min(zone.maxHeightMm * defaults.fill, defaults.maxHeight);
  let widthMm = textWidthMm(content, heightMm);
  if (widthMm > zone.maxWidthMm * 0.95) {
    const k = (zone.maxWidthMm * 0.95) / widthMm;
    heightMm *= k;
    widthMm *= k;
  }
  return {
    id: newElementId(),
    zoneKey: zone.key,
    kind,
    content: { ...content, ...textChecks(content, heightMm) },
    widthMm: round(widthMm),
    heightMm: round(heightMm),
    offsetXMm: round((zone.maxWidthMm - widthMm) / 2),
    offsetYMm: round((zone.maxHeightMm - heightMm) / 2),
    rotationDeg: 0,
  };
}

/**
 * Texte remis à la largeur de son contenu, centré sur son ancien axe. Plus large que sa zone, il
 * est réduit pour y tenir (corps diminué, hauteur proportionnelle).
 */
export function refitText(el: EditorElement, content: ApparelContent, zone?: PrintZone): EditorElement {
  let heightMm = el.heightMm;
  let widthMm = textWidthMm(content, heightMm);
  const max = zone ? zone.maxWidthMm * 0.95 : Infinity;
  if (widthMm > max) {
    heightMm *= max / widthMm;
    widthMm = max;
  }
  const centerX = el.offsetXMm + el.widthMm / 2;
  const centerY = el.offsetYMm + el.heightMm / 2;
  let offsetXMm = centerX - widthMm / 2;
  if (zone) offsetXMm = Math.min(Math.max(0, offsetXMm), zone.maxWidthMm - widthMm);
  return {
    ...el,
    content: { ...content, ...textChecks(content, heightMm, widthMm) },
    widthMm: round(widthMm),
    heightMm: round(heightMm),
    offsetXMm: round(offsetXMm),
    offsetYMm: round(centerY - heightMm / 2),
  };
}

/** Logo ou sponsor (SVG) dimensionné pour la zone. */
export function createLogoElement(
  svg: string,
  zone: PrintZone,
  content: Partial<ApparelContent>,
  kind: "LOGO" | "SPONSOR" = "LOGO",
): EditorElement {
  const parts = svgParts(svg);
  const box = fitInZone(parts.width / parts.height || 1, zone, 0.85);
  return {
    id: newElementId(),
    zoneKey: zone.key,
    kind,
    content: { svg, colors: svgColors(svg), source: "library", ...content },
    ...box,
    rotationDeg: 0,
  };
}

/** Image importée dimensionnée pour la zone (droits à attester avant le BAT). */
export function createImageElement(photo: ApparelPhoto, zone: PrintZone): EditorElement {
  const box = fitInZone(photo.naturalWidth / photo.naturalHeight || 1, zone, 0.85);
  return {
    id: newElementId(),
    zoneKey: zone.key,
    kind: "IMAGE",
    content: { photo, source: "upload", rightsAttested: false, pixelWidth: photoPixelWidth(photo) },
    ...box,
    rotationDeg: 0,
  };
}
