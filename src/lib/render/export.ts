"use client";

import { FALLBACK_FONTS, FONTS, fontVars } from "./fonts";

// Exports réalisés dans le navigateur pour l'aperçu et le mode simulé.
// En production, les fichiers définitifs (texte en tracés, SVGO, PDF, ZIP) sont produits par les workers.

/** Lettres du latin étendu (pular…) et de l'écriture N'Ko : polices de secours à intégrer. */
const EXTENDED = /[\u0100-\u02FF\u1E00-\u1EFF\uA720-\uA7FF]/u;
const NKO = /[\u07C0-\u07FF]/u;

/** Remplace les variables CSS de police par le nom réel des polices (police, puis secours). */
export function resolveFontVars(svg: string) {
  const fallbacks = FALLBACK_FONTS.map((f) => `'${f.name}'`).join(", ");
  return svg.replaceAll("var(--logo-font-fallbacks)", fallbacks).replaceAll(/var\(--font-[\w-]+\),\s*/g, "");
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Règles @font-face d'une famille dans les feuilles de style de la page (même origine). */
function fontFaces(family: string) {
  const faces: { rule: CSSFontFaceRule; base: string }[] = [];
  for (const sheet of [...document.styleSheets]) {
    let cssRules: CSSRule[] = [];
    try {
      cssRules = [...sheet.cssRules];
    } catch {
      // Feuille d'une autre origine : illisible
    }
    for (const rule of cssRules) {
      const ruleFamily = rule instanceof CSSFontFaceRule ? rule.style.getPropertyValue("font-family").replace(/['"]/g, "").trim() : null;
      if (ruleFamily === family) faces.push({ rule: rule as CSSFontFaceRule, base: sheet.href ?? location.href });
    }
  }
  return faces;
}

/** Règle @font-face autonome (fichier intégré en data URL) sous le nom `name`. */
async function inlineFace({ rule, base }: { rule: CSSFontFaceRule; base: string }, name: string) {
  const match = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue("src"));
  if (!match) return null;
  try {
    const response = await fetch(new URL(match[1], base));
    const dataUrl = await blobToDataUrl(await response.blob());
    const weight = rule.style.getPropertyValue("font-weight") || "400";
    // La plage de caractères est conservée : le latin étendu complète le latin de la même famille.
    const range = rule.style.getPropertyValue("unicode-range");
    const declarations = [`font-family:'${name}'`, `src:url(${dataUrl})`, `font-weight:${weight}`, ...(range ? [`unicode-range:${range}`] : [])];
    return `@font-face{${declarations.join(";")}}`;
  } catch {
    return null; // Police indisponible : le rendu utilisera la police de repli
  }
}

/** Règles @font-face chargées par next/font pour une variable CSS, intégrées sous le nom `name`. */
async function faceRules(cssVar: string, name: string) {
  const family = getComputedStyle(document.documentElement).getPropertyValue(cssVar).split(",")[0]?.trim().replace(/['"]/g, "");
  if (!family) return [];
  const rules = await Promise.all(fontFaces(family).map((face) => inlineFace(face, name)));
  return rules.filter((rule): rule is string => rule !== null);
}

/**
 * Cherche les @font-face chargées par next/font et les intègre au SVG (nécessaire pour le rendu
 * PNG) : latin de chaque police utilisée, latin étendu et polices de secours seulement si le texte
 * en a besoin.
 */
async function embedFonts(svg: string) {
  const used = FONTS.filter((font) => svg.includes(`var(${font.cssVar})`) || svg.includes(`'${font.name}'`));
  const extended = EXTENDED.test(svg);
  const sources: { cssVar: string; name: string }[] = used.flatMap((font) =>
    fontVars(font.id)
      .slice(0, extended ? 2 : 1)
      .map((cssVar) => ({ cssVar, name: font.name })),
  );
  const [extendedFallback, nkoFallback] = FALLBACK_FONTS;
  if (extended && extendedFallback) sources.push(extendedFallback);
  if (NKO.test(svg) && nkoFallback) sources.push(nkoFallback);
  const resolved = resolveFontVars(svg);
  if (!sources.length) return resolved;
  const rules = (await Promise.all(sources.map((source) => faceRules(source.cssVar, source.name)))).flat();
  if (!rules.length) return resolved;
  return resolved.replace(/(<svg[^>]*>)/, `$1<defs><style>${rules.join("")}</style></defs>`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function svgToStandalone(svg: string) {
  return embedFonts(svg);
}

export async function downloadSvg(svg: string, filename: string) {
  const standalone = await embedFonts(svg);
  downloadBlob(new Blob([standalone], { type: "image/svg+xml" }), filename);
}

export interface PngOptions {
  size: number; // côté le plus long, en px
  background?: string | null; // null = transparent
  square?: boolean;
  padding?: number; // proportion (0 – 0.4)
  type?: "image/png" | "image/jpeg";
  /** Qualité JPEG (0 à 1). */
  quality?: number;
}

export async function svgToPngBlob(svg: string, options: PngOptions): Promise<Blob> {
  const standalone = await embedFonts(svg);
  const viewBox = standalone.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const vw = viewBox ? Number(viewBox[1]) : 512;
  const vh = viewBox ? Number(viewBox[2]) : 512;
  const img = new Image();
  img.decoding = "async";
  const url = URL.createObjectURL(new Blob([standalone], { type: "image/svg+xml" }));
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG illisible"));
      img.src = url;
    });
    const padding = options.padding ?? 0;
    let width: number;
    let height: number;
    if (options.square) {
      width = height = options.size;
    } else if (vw >= vh) {
      width = options.size;
      height = Math.round((options.size * vh) / vw);
    } else {
      height = options.size;
      width = Math.round((options.size * vw) / vh);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const background = options.type === "image/jpeg" ? (options.background ?? "#ffffff") : options.background;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    }
    const availableW = width * (1 - padding * 2);
    const availableH = height * (1 - padding * 2);
    const scale = Math.min(availableW / vw, availableH / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export impossible"))), options.type ?? "image/png", options.quality ?? 0.92),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function svgToPngDataUrl(svg: string, options: PngOptions) {
  return blobToDataUrl(await svgToPngBlob(svg, options));
}

/** favicon.ico multi-tailles (16/32/48) à partir d'images PNG (LOGO-22). */
export async function buildIco(svg: string, sizes = [16, 32, 48]) {
  const pngs = await Promise.all(
    sizes.map(async (size) => new Uint8Array(await (await svgToPngBlob(svg, { size, square: true, padding: 0.04 })).arrayBuffer())),
  );
  const headerSize = 6 + 16 * pngs.length;
  const total = headerSize + pngs.reduce((sum, png) => sum + png.length, 0);
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, pngs.length, true);
  let offset = headerSize;
  pngs.forEach((png, i) => {
    const size = sizes[i]!;
    const entry = 6 + i * 16;
    view.setUint8(entry, size >= 256 ? 0 : size);
    view.setUint8(entry + 1, size >= 256 ? 0 : size);
    view.setUint8(entry + 2, 0);
    view.setUint8(entry + 3, 0);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, png.length, true);
    view.setUint32(entry + 12, offset, true);
    new Uint8Array(buffer, offset, png.length).set(png);
    offset += png.length;
  });
  return new Blob([buffer], { type: "image/x-icon" });
}

/** Pack d'icônes d'application (LOGO-22). */
export const APP_ICON_SIZES = [
  { id: "apple-touch-icon", size: 180 },
  { id: "android-192", size: 192 },
  { id: "android-512", size: 512 },
  { id: "ios-1024", size: 1024 },
] as const;
