"use client";

import { FONTS } from "./fonts";

// Exports réalisés dans le navigateur pour l'aperçu et le mode simulé.
// En production, les fichiers définitifs (texte en tracés, SVGO, PDF, ZIP) sont produits par les workers.

/** Remplace les variables CSS de police par le nom réel de la police. */
export function resolveFontVars(svg: string) {
  let out = svg;
  for (const font of FONTS) {
    out = out.replaceAll(`var(${font.cssVar}), `, "");
  }
  return out;
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Cherche les @font-face chargées par next/font et les intègre au SVG (nécessaire pour le rendu PNG). */
async function embedFonts(svg: string) {
  const used = FONTS.filter((font) => svg.includes(font.cssVar) || svg.includes(`'${font.name}'`));
  if (!used.length) return svg;
  const root = getComputedStyle(document.documentElement);
  const rules: string[] = [];

  for (const font of used) {
    const family = root.getPropertyValue(font.cssVar).split(",")[0]?.trim().replace(/['"]/g, "");
    if (!family) continue;
    for (const sheet of [...document.styleSheets]) {
      let cssRules: CSSRuleList;
      try {
        cssRules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of [...cssRules]) {
        if (!(rule instanceof CSSFontFaceRule)) continue;
        const ruleFamily = rule.style.getPropertyValue("font-family").replace(/['"]/g, "").trim();
        if (ruleFamily !== family) continue;
        const src = rule.style.getPropertyValue("src");
        const match = src.match(/url\(["']?([^"')]+)["']?\)/);
        // Seul le sous-ensemble latin est intégré pour limiter le poids
        const range = rule.style.getPropertyValue("unicode-range");
        if (!match || (range && !range.includes("U+0000"))) continue;
        try {
          const response = await fetch(new URL(match[1]!, sheet.href ?? location.href));
          const dataUrl = await blobToDataUrl(await response.blob());
          rules.push(
            `@font-face{font-family:'${font.name}';src:url(${dataUrl});font-weight:${rule.style.getPropertyValue("font-weight") || "400"};}`,
          );
        } catch {
          // Police indisponible : le rendu utilisera la police de repli
        }
      }
    }
  }
  const resolved = resolveFontVars(svg);
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
