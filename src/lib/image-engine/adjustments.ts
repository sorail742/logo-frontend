import type { RawImageData } from "./types";

export interface AdjustmentParams {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  exposure?: number; // -3 to 3
  temperature?: number; // -100 to 100
  tint?: number; // -100 to 100
  sharpen?: number; // 0 to 100
  blur?: number; // 0 to 50
}

function clamp(v: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0]! + clean[0]!, 16),
      parseInt(clean[1]! + clean[1]!, 16),
      parseInt(clean[2]! + clean[2]!, 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

/**
 * Applique les ajustements colorimétriques généraux (luminosité, contraste, saturation, etc.)
 */
export function applyAdjustments(image: RawImageData, params: AdjustmentParams): RawImageData {
  const { width, height } = image;
  const out = new Uint8ClampedArray(image.data);
  const total = width * height;

  const brightness = params.brightness ?? 0;
  const contrast = params.contrast ?? 0;
  const saturation = params.saturation ?? 0;
  const exposure = params.exposure ?? 0;
  const temperature = params.temperature ?? 0;
  const tint = params.tint ?? 0;

  // Facteurs précalculés
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const expFactor = Math.pow(2, exposure);
  const satFactor = (saturation + 100) / 100;
  const tempR = temperature > 0 ? (temperature / 100) * 35 : 0;
  const tempB = temperature < 0 ? (-temperature / 100) * 35 : 0;
  const tintG = tint < 0 ? (-tint / 100) * 25 : 0;
  const tintM = tint > 0 ? (tint / 100) * 25 : 0;

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const a = out[idx + 3]!;
    if (a === 0) continue;

    let r = out[idx]!;
    let g = out[idx + 1]!;
    let b = out[idx + 2]!;

    // 1. Exposition
    if (exposure !== 0) {
      r *= expFactor;
      g *= expFactor;
      b *= expFactor;
    }

    // 2. Luminosité
    if (brightness !== 0) {
      const bOffset = (brightness / 100) * 128;
      r += bOffset;
      g += bOffset;
      b += bOffset;
    }

    // 3. Contraste
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 4. Température & Teinte
    if (temperature !== 0 || tint !== 0) {
      r += tempR + tintM;
      g += tintG;
      b += tempB + tintM;
    }

    // 5. Saturation
    if (saturation !== 0) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * satFactor;
      g = lum + (g - lum) * satFactor;
      b = lum + (b - lum) * satFactor;
    }

    out[idx] = clamp(r);
    out[idx + 1] = clamp(g);
    out[idx + 2] = clamp(b);
  }

  // 6. Netteté (Sharpen via masque flou / Laplacian 3x3)
  if (params.sharpen && params.sharpen > 0) {
    const amount = (params.sharpen / 100) * 1.5;
    const sharpData = new Uint8ClampedArray(out);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (out[idx + 3] === 0) continue;

        for (let c = 0; c < 3; c++) {
          const center = out[idx + c]!;
          const top = out[((y - 1) * width + x) * 4 + c]!;
          const bottom = out[((y + 1) * width + x) * 4 + c]!;
          const left = out[(y * width + (x - 1)) * 4 + c]!;
          const right = out[(y * width + (x + 1)) * 4 + c]!;

          const laplacian = 4 * center - top - bottom - left - right;
          sharpData[idx + c] = clamp(center + laplacian * amount);
        }
      }
    }
    return { width, height, data: sharpData };
  }

  return { width, height, data: out };
}

/**
 * Convertit l'image en monochrome pur (silhouette unicolore) avec seuillage réglable.
 * Idéal pour le flocage vinyle, flex et sérigraphie 1 couleur.
 */
export function applyMonochrome(image: RawImageData, targetHex: string, threshold = 128): RawImageData {
  const { width, height } = image;
  const out = new Uint8ClampedArray(image.data.length);
  const [tr, tg, tb] = hexToRgb(targetHex);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const a = image.data[idx + 3]!;
    if (a < 30) {
      out[idx + 3] = 0;
      continue;
    }

    const r = image.data[idx]!;
    const g = image.data[idx + 1]!;
    const b = image.data[idx + 2]!;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Si le pixel est plus sombre que le seuil, il est conservé avec la couleur cible
    if (lum < threshold) {
      out[idx] = tr;
      out[idx + 1] = tg;
      out[idx + 2] = tb;
      out[idx + 3] = 255;
    } else {
      out[idx + 3] = 0; // Transparent
    }
  }

  return { width, height, data: out };
}

/**
 * Remplace une couleur spécifique par une autre selon une tolérance.
 */
export function applyReplaceColor(
  image: RawImageData,
  targetHex: string,
  replacementHex: string,
  tolerance = 25,
): RawImageData {
  const { width, height } = image;
  const out = new Uint8ClampedArray(image.data);
  const [tr, tg, tb] = hexToRgb(targetHex);
  const [rr, rg, rb] = hexToRgb(replacementHex);
  const thresholdDistSq = Math.pow((tolerance / 100) * 440, 2);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const a = out[idx + 3]!;
    if (a === 0) continue;

    const r = out[idx]!;
    const g = out[idx + 1]!;
    const b = out[idx + 2]!;

    const dr = r - tr;
    const dg = g - tg;
    const db = b - tb;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq <= thresholdDistSq) {
      out[idx] = rr;
      out[idx + 1] = rg;
      out[idx + 2] = rb;
    }
  }

  return { width, height, data: out };
}

/**
 * Effet tramage demi-teinte (Halftone) pour sérigraphie textile.
 */
export function applyHalftone(image: RawImageData, dotSize = 8, angleDeg = 45): RawImageData {
  const { width, height } = image;
  const out = new Uint8ClampedArray(image.data.length);
  const angleRad = (angleDeg * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const maxRadius = (dotSize * Math.SQRT2) / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = image.data[idx + 3]!;
      if (a === 0) continue;

      const r = image.data[idx]!;
      const g = image.data[idx + 1]!;
      const b = image.data[idx + 2]!;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Coordonnées tournées dans le repère de la trame
      const rotX = x * cosA - y * sinA;
      const rotY = x * sinA + y * cosA;

      const cellX = (((rotX % dotSize) + dotSize) % dotSize) - dotSize / 2;
      const cellY = (((rotY % dotSize) + dotSize) % dotSize) - dotSize / 2;
      const distFromCenter = Math.sqrt(cellX * cellX + cellY * cellY);

      // Le rayon du point noir est proportionnel à l'obscurité (1 - luminance)
      const dotRadius = maxRadius * Math.sqrt(1 - lum);

      if (distFromCenter <= dotRadius) {
        out[idx] = 0;
        out[idx + 1] = 0;
        out[idx + 2] = 0;
        out[idx + 3] = 255;
      } else {
        out[idx + 3] = 0;
      }
    }
  }

  return { width, height, data: out };
}

/**
 * Découpe (crop) d'une zone de l'image
 */
export function cropImage(
  image: RawImageData,
  x: number,
  y: number,
  cropWidth: number,
  cropHeight: number,
): RawImageData {
  const clampedX = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const clampedY = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const targetW = Math.max(1, Math.min(image.width - clampedX, Math.round(cropWidth)));
  const targetH = Math.max(1, Math.min(image.height - clampedY, Math.round(cropHeight)));

  const out = new Uint8ClampedArray(targetW * targetH * 4);

  for (let row = 0; row < targetH; row++) {
    const srcStart = ((clampedY + row) * image.width + clampedX) * 4;
    const destStart = row * targetW * 4;
    out.set(image.data.subarray(srcStart, srcStart + targetW * 4), destStart);
  }

  return { width: targetW, height: targetH, data: out };
}

/**
 * Rotation à 90, 180 ou 270 degrés
 */
export function rotateImage(image: RawImageData, angleDeg: number): RawImageData {
  const normAngle = ((angleDeg % 360) + 360) % 360;
  if (normAngle === 0) return image;

  const { width, height } = image;

  if (normAngle === 180) {
    const out = new Uint8ClampedArray(image.data.length);
    const total = width * height;
    for (let i = 0; i < total; i++) {
      const srcIdx = i * 4;
      const destIdx = (total - 1 - i) * 4;
      out[destIdx] = image.data[srcIdx]!;
      out[destIdx + 1] = image.data[srcIdx + 1]!;
      out[destIdx + 2] = image.data[srcIdx + 2]!;
      out[destIdx + 3] = image.data[srcIdx + 3]!;
    }
    return { width, height, data: out };
  }

  const newW = height;
  const newH = width;
  const out = new Uint8ClampedArray(newW * newH * 4);

  if (normAngle === 90) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const destIdx = (x * newW + (height - 1 - y)) * 4;
        out[destIdx] = image.data[srcIdx]!;
        out[destIdx + 1] = image.data[srcIdx + 1]!;
        out[destIdx + 2] = image.data[srcIdx + 2]!;
        out[destIdx + 3] = image.data[srcIdx + 3]!;
      }
    }
  } else if (normAngle === 270) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const destIdx = ((width - 1 - x) * newW + y) * 4;
        out[destIdx] = image.data[srcIdx]!;
        out[destIdx + 1] = image.data[srcIdx + 1]!;
        out[destIdx + 2] = image.data[srcIdx + 2]!;
        out[destIdx + 3] = image.data[srcIdx + 3]!;
      }
    }
  }

  return { width: newW, height: newH, data: out };
}

/**
 * Retournement horizontal et/ou vertical (Flip)
 */
export function flipImage(image: RawImageData, horizontal: boolean, vertical: boolean): RawImageData {
  if (!horizontal && !vertical) return image;

  const { width, height } = image;
  const out = new Uint8ClampedArray(image.data.length);

  for (let y = 0; y < height; y++) {
    const destY = vertical ? height - 1 - y : y;
    for (let x = 0; x < width; x++) {
      const destX = horizontal ? width - 1 - x : x;
      const srcIdx = (y * width + x) * 4;
      const destIdx = (destY * width + destX) * 4;

      out[destIdx] = image.data[srcIdx]!;
      out[destIdx + 1] = image.data[srcIdx + 1]!;
      out[destIdx + 2] = image.data[srcIdx + 2]!;
      out[destIdx + 3] = image.data[srcIdx + 3]!;
    }
  }

  return { width, height, data: out };
}
