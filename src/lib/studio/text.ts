import { closestWeight, getFont } from "@/lib/render/fonts";
import { curveGeometry, displayText, lineMetrics } from "./render";
import type { TextElement } from "./types";

// Mise en page du texte dans le navigateur, avec les vraies polices : retour à la ligne à la
// largeur de la boîte. Les lignes obtenues sont enregistrées dans le document ; le serveur les
// reprend telles quelles pour le PDF, d'où un rendu identique.

const families = new Map<string, string>();

/** Nom réel de la famille (posé par next/font dans la variable CSS de la police). */
export function fontFamilyName(fontId: string) {
  const cached = families.get(fontId);
  if (cached) return cached;
  const font = getFont(fontId);
  let family = "";
  if (typeof document !== "undefined") {
    family = getComputedStyle(document.documentElement).getPropertyValue(font.cssVar).split(",")[0]?.trim().replace(/['"]/g, "") ?? "";
  }
  family ||= font.name;
  families.set(fontId, family);
  return family;
}

/** Charge les polices avant de mesurer ou d'exporter. */
export async function ensureFonts(fonts: { fontId: string; fontWeight: number }[]) {
  if (typeof document === "undefined" || !document.fonts) return;
  const unique = new Map(fonts.map((f) => [`${f.fontId}:${f.fontWeight}`, f]));
  await Promise.all(
    [...unique.values()].map((f) =>
      document.fonts.load(`${closestWeight(f.fontId, f.fontWeight)} 32px "${fontFamilyName(f.fontId)}"`).catch(() => undefined),
    ),
  );
}

let context: CanvasRenderingContext2D | null = null;

type Measurable = Pick<TextElement, "fontId" | "fontWeight" | "fontSize" | "letterSpacing">;

export function measureText(text: string, style: Measurable) {
  if (typeof document === "undefined") return text.length * style.fontSize * getFont(style.fontId).widthFactor;
  context ??= document.createElement("canvas").getContext("2d");
  if (!context) return text.length * style.fontSize * 0.6;
  context.font = `${closestWeight(style.fontId, style.fontWeight)} ${style.fontSize}px "${fontFamilyName(style.fontId)}"`;
  const characters = Array.from(text).length;
  return context.measureText(text).width + style.letterSpacing * style.fontSize * Math.max(0, characters - 1);
}

/** Coupe un mot trop long pour la largeur, caractère par caractère. */
function breakWord(word: string, max: number, style: Measurable) {
  const parts: string[] = [];
  let current = "";
  for (const char of Array.from(word)) {
    if (current && measureText(current + char, style) > max) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** Lignes du texte à la largeur de la boîte (retours explicites conservés). */
export function wrapText(el: TextElement) {
  const text = displayText(el);
  if (el.curve) return [text.replace(/\s*\n\s*/g, " ")];
  const max = Math.max(1, el.width);
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const tokens = paragraph.split(/(\s+)/).filter((t) => t.length > 0);
    let line = "";
    for (const token of tokens) {
      const candidate = line + token;
      if (!line.trim() || measureText(candidate.trimEnd(), el) <= max) {
        if (!line.trim() && !/^\s+$/.test(token) && measureText(token, el) > max) {
          const pieces = breakWord(token, max, el);
          lines.push(...pieces.slice(0, -1));
          line = pieces.at(-1) ?? "";
        } else {
          line = candidate;
        }
        continue;
      }
      lines.push(line.trimEnd());
      if (/^\s+$/.test(token)) {
        line = "";
      } else if (measureText(token, el) > max) {
        const pieces = breakWord(token, max, el);
        lines.push(...pieces.slice(0, -1));
        line = pieces.at(-1) ?? "";
      } else {
        line = token;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

/** Lignes et hauteur d'un texte : la boîte s'ajuste à son contenu. */
export function layoutText(el: TextElement): { lines: string[]; height: number } {
  const lines = wrapText(el);
  const { box } = lineMetrics(el);
  const height = el.curve ? box + curveGeometry(el).sagitta : Math.max(box, lines.length * box);
  return { lines, height };
}

/** Largeur qui tient chaque paragraphe sur une ligne (création d'un texte). */
export function naturalWidth(el: TextElement) {
  const widths = displayText(el)
    .split("\n")
    .map((paragraph) => measureText(paragraph, el));
  return Math.ceil(Math.max(el.fontSize, ...widths) + el.fontSize * 0.1);
}

/** Recalcule la mise en page d'un texte après une modification. */
export function relayout(el: TextElement): TextElement {
  const { lines, height } = layoutText(el);
  return { ...el, lines, height };
}
