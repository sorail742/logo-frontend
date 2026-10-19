import type { LogoColors, LogoLayout, LogoSpec } from "@/lib/types";
import { ensureContrast } from "./color";
import { closestWeight, cssFontFamily, estimateTextWidth } from "./fonts";
import { getIcon, type IconNode } from "./icons";
import { escapeXml } from "./svg";
import { initials } from "@/lib/format";

export type LogoVariant = "color" | "black" | "white";

export interface RenderOptions {
  variant?: LogoVariant;
  /** Remplace la disposition de la spec (variantes automatiques). */
  layout?: LogoLayout;
  /** Ajoute un filigrane (offre gratuite, LOGO-24). */
  watermark?: string | null;
  /** Fond plein derrière le logo (par défaut : transparent, sauf variante blanche). */
  withBackground?: boolean;
  /** Résolution de la font-family (export : nom réel au lieu de la variable CSS). */
  fontFamily?: (fontId: string) => string;
}

export interface RenderedLogo {
  svg: string;
  width: number;
  height: number;
}

const TEXT_SIZE = 64;
const TAGLINE_SIZE = 20;
const PAD = 32;

function variantColors(colors: LogoColors, variant: LogoVariant): LogoColors {
  if (variant === "black") return { primary: "#111111", secondary: "#111111", text: "#111111", background: "#ffffff" };
  if (variant === "white") return { primary: "#ffffff", secondary: "#ffffff", text: "#ffffff", background: "#111111" };
  return {
    ...colors,
    // Contraste texte / fond d'au moins 4,5:1 (§5.5)
    text: ensureContrast(colors.text, colors.background),
  };
}

function renderIconNode(node: IconNode) {
  return node
    .map(([tag, attrs]) => {
      const attributes = Object.entries(attrs)
        .map(([key, value]) => `${key}="${escapeXml(String(value))}"`)
        .join(" ");
      return `<${tag} ${attributes}/>`;
    })
    .join("");
}

/** Symbole (icône ou monogramme) dans un carré de côté `size`, coin supérieur gauche en (x, y). */
function renderMark(spec: LogoSpec, colors: LogoColors, x: number, y: number, size: number, variant: LogoVariant, fontFamily: (id: string) => string) {
  const parts: string[] = [];
  const framed = spec.iconFrame !== "none";
  const cx = x + size / 2;
  const cy = y + size / 2;

  if (spec.iconFrame === "circle") {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${colors.primary}"/>`);
  } else if (spec.iconFrame === "rounded") {
    parts.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${colors.primary}"/>`);
  } else if (spec.iconFrame === "hexagon") {
    const r = size / 2;
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
    }).join(" ");
    parts.push(`<polygon points="${points}" fill="${colors.primary}"/>`);
  }

  const inkOnFrame = variant === "color" ? "#ffffff" : variant === "white" ? "#111111" : "#ffffff";
  const ink = framed ? inkOnFrame : colors.primary;

  if (spec.type === "MONOGRAM" || !spec.iconId) {
    const letters = initials(spec.text, 2) || spec.text.slice(0, 1).toUpperCase();
    const fontSize = size * (letters.length > 1 ? 0.42 : 0.56);
    parts.push(
      `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-weight="${closestWeight(spec.fontId, 800)}" fill="${ink}" style="font-family:${fontFamily(spec.fontId)}">${escapeXml(letters)}</text>`,
    );
  } else {
    const icon = getIcon(spec.iconId);
    if (icon) {
      const inner = framed ? size * 0.56 * spec.iconScale : size * spec.iconScale;
      const scale = inner / 24;
      const ox = cx - inner / 2;
      const oy = cy - inner / 2;
      parts.push(
        `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${scale.toFixed(4)})" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${renderIconNode(icon.node)}</g>`,
      );
    }
  }
  return parts.join("");
}

function textAttrs(spec: LogoSpec, fontFamily: (id: string) => string) {
  const weight = closestWeight(spec.fontId, spec.fontWeight);
  const spacing = spec.letterSpacing ? ` letter-spacing="${(spec.letterSpacing * TEXT_SIZE).toFixed(2)}"` : "";
  return `font-size="${TEXT_SIZE}" font-weight="${weight}"${spacing} style="font-family:${fontFamily(spec.fontId)}"`;
}

function displayText(spec: LogoSpec) {
  return spec.uppercase ? spec.text.toUpperCase() : spec.text;
}

function watermarkLayer(width: number, height: number, label: string) {
  const rows: string[] = [];
  const stepX = 220;
  const stepY = 90;
  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      rows.push(`<text x="${x}" y="${y}">${escapeXml(label)}</text>`);
    }
  }
  return `<g transform="rotate(-24 ${width / 2} ${height / 2})" font-size="18" font-family="sans-serif" font-weight="700" fill="#000000" fill-opacity="0.12">${rows.join("")}</g>`;
}

export function renderLogoSvg(spec: LogoSpec, options: RenderOptions = {}): RenderedLogo {
  const variant = options.variant ?? "color";
  const fontFamily = options.fontFamily ?? cssFontFamily;
  const colors = variantColors(spec.colors, variant);
  let layout: LogoLayout = options.layout ?? spec.layout;
  if (spec.type === "WORDMARK" && !options.layout) layout = "text";

  const text = displayText(spec);
  const tagline = spec.tagline.trim();
  const textWidth = estimateTextWidth(text, spec.fontId, TEXT_SIZE, spec.letterSpacing);
  const taglineWidth = tagline ? estimateTextWidth(tagline.toUpperCase(), "montserrat", TAGLINE_SIZE, 0.18) : 0;
  const blockWidth = Math.max(textWidth, taglineWidth);
  const textBlockHeight = TEXT_SIZE + (tagline ? TAGLINE_SIZE + 14 : 0);
  const markSize = 112;

  const body: string[] = [];
  let width: number;
  let height: number;

  const taglineEl = (x: number, y: number, anchor: "start" | "middle") =>
    tagline
      ? `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${TAGLINE_SIZE}" font-weight="600" letter-spacing="${(0.18 * TAGLINE_SIZE).toFixed(1)}" fill="${colors.secondary === colors.background ? colors.text : ensureContrast(colors.secondary, colors.background, 3)}" style="font-family:${fontFamily("montserrat")}">${escapeXml(tagline.toUpperCase())}</text>`
      : "";

  if (spec.type === "EMBLEM" && layout !== "icon" && layout !== "text") {
    // Badge : symbole et nom réunis dans un cercle à double filet
    const diameter = Math.max(320, blockWidth * 0.62 + 120);
    width = diameter + PAD * 2;
    height = diameter + PAD * 2;
    const cx = width / 2;
    const cy = height / 2;
    const r = diameter / 2;
    body.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors.primary}"/>`);
    body.push(`<circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="${colors.secondary}" stroke-width="3"/>`);
    const inner = { ...spec, iconFrame: "none" as const };
    const markColors = { ...colors, primary: variant === "white" ? "#111111" : "#ffffff" };
    body.push(renderMark(inner, markColors, cx - 48, cy - r * 0.62, 96, variant, fontFamily));
    const fitted = Math.min(TEXT_SIZE, ((diameter - 80) / Math.max(text.length, 1)) / 0.62);
    body.push(
      `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="${fitted.toFixed(1)}" font-weight="${closestWeight(spec.fontId, spec.fontWeight)}" fill="${variant === "white" ? "#111111" : "#ffffff"}" style="font-family:${fontFamily(spec.fontId)}">${escapeXml(text)}</text>`,
    );
    if (tagline) {
      body.push(
        `<text x="${cx}" y="${cy + 30 + 40}" text-anchor="middle" font-size="16" font-weight="600" letter-spacing="3" fill="${variant === "white" ? "#111111" : "#ffffff"}" fill-opacity="0.85" style="font-family:${fontFamily("montserrat")}">${escapeXml(tagline.toUpperCase())}</text>`,
      );
    }
  } else if (layout === "icon") {
    width = markSize + PAD * 2;
    height = markSize + PAD * 2;
    body.push(renderMark(spec, colors, PAD, PAD, markSize, variant, fontFamily));
  } else if (layout === "text") {
    width = blockWidth + PAD * 2;
    height = textBlockHeight + PAD * 2;
    body.push(`<text x="${width / 2}" y="${PAD + TEXT_SIZE * 0.8}" text-anchor="middle" ${textAttrs(spec, fontFamily)} fill="${colors.text}">${escapeXml(text)}</text>`);
    body.push(taglineEl(width / 2, PAD + TEXT_SIZE + TAGLINE_SIZE + 6, "middle"));
  } else if (layout === "vertical") {
    width = Math.max(blockWidth, markSize) + PAD * 2;
    height = markSize + 28 + textBlockHeight + PAD * 2;
    body.push(renderMark(spec, colors, (width - markSize) / 2, PAD, markSize, variant, fontFamily));
    const baseline = PAD + markSize + 28 + TEXT_SIZE * 0.8;
    body.push(`<text x="${width / 2}" y="${baseline}" text-anchor="middle" ${textAttrs(spec, fontFamily)} fill="${colors.text}">${escapeXml(text)}</text>`);
    body.push(taglineEl(width / 2, baseline + TAGLINE_SIZE + 18, "middle"));
  } else {
    const gap = 28;
    width = markSize + gap + blockWidth + PAD * 2;
    height = Math.max(markSize, textBlockHeight) + PAD * 2;
    body.push(renderMark(spec, colors, PAD, (height - markSize) / 2, markSize, variant, fontFamily));
    const textX = PAD + markSize + gap;
    const top = (height - textBlockHeight) / 2;
    const baseline = top + TEXT_SIZE * 0.8;
    body.push(`<text x="${textX}" y="${baseline}" ${textAttrs(spec, fontFamily)} fill="${colors.text}">${escapeXml(text)}</text>`);
    body.push(taglineEl(textX, baseline + TAGLINE_SIZE + 18, "start"));
  }

  width = Math.ceil(width);
  height = Math.ceil(height);
  const background =
    (options.withBackground ?? variant === "white")
      ? `<rect width="${width}" height="${height}" fill="${colors.background}"/>`
      : "";
  const watermark = options.watermark ? watermarkLayer(width, height, options.watermark) : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(spec.text)}"><title>${escapeXml(spec.text)}</title>${background}${body.join("")}${watermark}</svg>`;
  return { svg, width, height };
}

export interface LogoVariantDef {
  id: string;
  variant: LogoVariant;
  layout?: LogoLayout;
  dark: boolean;
}

/** Variantes produites automatiquement (LOGO-20). */
export const LOGO_VARIANTS: LogoVariantDef[] = [
  { id: "color", variant: "color", dark: false },
  { id: "black", variant: "black", dark: false },
  { id: "white", variant: "white", dark: true },
  { id: "icon", variant: "color", layout: "icon", dark: false },
  { id: "horizontal", variant: "color", layout: "horizontal", dark: false },
  { id: "vertical", variant: "color", layout: "vertical", dark: false },
];

export const DEFAULT_SPEC: LogoSpec = {
  type: "ICON_TEXT",
  text: "Ma marque",
  tagline: "",
  fontId: "montserrat",
  fontWeight: 700,
  letterSpacing: 0,
  uppercase: false,
  iconId: "leaf",
  iconScale: 1,
  iconFrame: "circle",
  layout: "horizontal",
  colors: { primary: "#0f766e", secondary: "#f59e0b", text: "#0f172a", background: "#ffffff" },
};
