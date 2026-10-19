import type { HandwrittenData, InkColor, StampData } from "@/lib/types";
import { cssFontFamily } from "./fonts";
import { escapeXml } from "./svg";

export const INK_COLORS: Record<InkColor, string> = {
  blue: "#1d3f9e",
  violet: "#5b2a86",
  red: "#b3141f",
  black: "#1a1a1a",
};

// Termes officiels qui imposent une validation manuelle du cachet (§6.4).
export const OFFICIAL_TERMS = [
  "republique",
  "ministere",
  "prefecture",
  "police",
  "gendarmerie",
  "tribunal",
  "presidence",
  "gouvernement",
  "armee",
  "douane",
  "ambassade",
  "cour supreme",
  "assemblee nationale",
  "republic",
  "ministry",
  "court",
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function findOfficialTerms(...texts: string[]) {
  const haystack = normalize(texts.join(" "));
  return OFFICIAL_TERMS.filter((term) => new RegExp(`\\b${term}\\b`).test(haystack));
}

interface StampRenderOptions {
  idPrefix: string;
  fontFamily?: (fontId: string) => string;
  logoMarkup?: string; // symbole SVG (sans balise <svg>) pour le mode « logo »
}

function inkFilter(id: string) {
  return `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="mask"/><feComposite in="SourceGraphic" in2="mask" operator="in" result="speckled"/><feDisplacementMap in="speckled" in2="noise" scale="1.6"/></filter>`;
}

export function renderStampSvg(data: StampData, options: StampRenderOptions) {
  const ink = INK_COLORS[data.ink];
  const fontFamily = options.fontFamily ?? cssFontFamily;
  const font = `font-family:${fontFamily("montserrat")}`;
  const p = options.idPrefix;
  const filter = data.inkEffect ? ` filter="url(#${p}-ink)"` : "";
  const defs: string[] = [];
  if (data.inkEffect) defs.push(inkFilter(`${p}-ink`));
  const body: string[] = [];
  let width = 320;
  let height = 320;

  const center = (cx: number, cy: number, size: number) => {
    if (data.centerMode === "logo" && options.logoMarkup) {
      return `<g transform="translate(${cx - size / 2} ${cy - size / 2})">${options.logoMarkup}</g>`;
    }
    const text = data.centerText || "";
    const lines = text.split(/\n/).slice(0, 3);
    const fontSize = data.centerMode === "acronym" ? Math.min(54, (size * 1.4) / Math.max(text.length, 2)) : 18;
    return lines
      .map(
        (line, i) =>
          `<text x="${cx}" y="${cy + (i - (lines.length - 1) / 2) * (fontSize * 1.15)}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize.toFixed(1)}" font-weight="800" fill="${ink}" style="${font}">${escapeXml(line)}</text>`,
      )
      .join("");
  };

  if (data.shape === "rectangle") {
    width = 420;
    height = 220;
    body.push(`<rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="10" fill="none" stroke="${ink}" stroke-width="6"/>`);
    body.push(`<rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="4" fill="none" stroke="${ink}" stroke-width="2"/>`);
    body.push(`<text x="${width / 2}" y="58" text-anchor="middle" font-size="22" font-weight="800" letter-spacing="2" fill="${ink}" style="${font}">${escapeXml(data.ringText.toUpperCase())}</text>`);
    body.push(center(width / 2, height / 2 + 6, 80));
    body.push(`<text x="${width / 2}" y="${height - 40}" text-anchor="middle" font-size="16" font-weight="700" letter-spacing="2" fill="${ink}" style="${font}">${escapeXml(data.bottomText.toUpperCase())}</text>`);
  } else {
    const isOval = data.shape === "oval";
    width = isOval ? 400 : 320;
    height = 320;
    const cx = width / 2;
    const cy = height / 2;
    const rx = width / 2 - 10;
    const ry = height / 2 - 10;
    const trx = rx - 34;
    const try_ = ry - 34;
    // Arc supérieur (gauche → droite) et arc inférieur (gauche → droite, lu à l'endroit)
    defs.push(`<path id="${p}-top" d="M ${cx - trx} ${cy} A ${trx} ${try_} 0 0 1 ${cx + trx} ${cy}"/>`);
    defs.push(`<path id="${p}-bottom" d="M ${cx - trx - 14} ${cy} A ${trx + 14} ${try_ + 14} 0 0 0 ${cx + trx + 14} ${cy}"/>`);
    body.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ink}" stroke-width="6"/>`);
    body.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx - 62}" ry="${ry - 62}" fill="none" stroke="${ink}" stroke-width="2.5"/>`);
    body.push(
      `<text font-size="22" font-weight="800" letter-spacing="3" fill="${ink}" style="${font}"><textPath href="#${p}-top" startOffset="50%" text-anchor="middle">${escapeXml(data.ringText.toUpperCase())}</textPath></text>`,
    );
    body.push(
      `<text font-size="18" font-weight="700" letter-spacing="3" fill="${ink}" style="${font}"><textPath href="#${p}-bottom" startOffset="50%" text-anchor="middle">${escapeXml(data.bottomText.toUpperCase())}</textPath></text>`,
    );
    body.push(`<text x="${cx - rx + 22}" y="${cy + 6}" font-size="16" fill="${ink}" text-anchor="middle">★</text>`);
    body.push(`<text x="${cx + rx - 22}" y="${cy + 6}" font-size="16" fill="${ink}" text-anchor="middle">★</text>`);
    body.push(center(cx, cy, Math.min(rx, ry) - 80));
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(data.ringText)}"><defs>${defs.join("")}</defs><g${filter} opacity="0.92">${body.join("")}</g></svg>`;
}

export function renderHandwrittenSvg(data: HandwrittenData, fontFamily: (id: string) => string = cssFontFamily) {
  const ink = INK_COLORS[data.ink];
  if (data.strokes) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="600" height="240" role="img" aria-label="Paraphe"><path d="${escapeXml(data.strokes)}" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  const size = Math.min(96, 900 / Math.max(data.text.length, 4));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="600" height="240" role="img" aria-label="${escapeXml(data.text)}"><text x="300" y="130" text-anchor="middle" dominant-baseline="central" font-size="${size.toFixed(1)}" fill="${ink}" style="font-family:${fontFamily(data.fontId)}">${escapeXml(data.text)}</text><path d="M ${300 - size * 2.2} 178 C ${300 - size} 196, ${300 + size} 160, ${300 + size * 2.4} 182" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></svg>`;
}

/** Lissage d'un tracé à main levée en courbes quadratiques (SIG-21). */
export function smoothStroke(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i]!;
    const next = points[i + 1]!;
    d += ` Q ${current.x.toFixed(1)} ${current.y.toFixed(1)} ${((current.x + next.x) / 2).toFixed(1)} ${((current.y + next.y) / 2).toFixed(1)}`;
  }
  const last = points[points.length - 1]!;
  return `${d} L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
}
