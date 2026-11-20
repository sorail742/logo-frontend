import type { PrintTechnique } from "@/lib/apparel/types";
import type { RawImageData } from "./types";

export interface ThreadMatch {
  code: string;
  name: string;
  brand: "Madeira" | "Gunold";
  hex: string;
  distance: number;
}

export interface FilmSeparation {
  colorHex: string;
  colorName?: string;
  coveragePercent: number;
  maskImage: RawImageData;
}

export interface TechniquePrepResult {
  technique: PrintTechnique;
  // Spécifique DTF
  dtfWhiteUnderbase?: {
    mask: RawImageData;
    chokePixels: number;
    whiteInkAreaPercent: number;
  };
  // Spécifique Sérigraphie
  screenFilms?: FilmSeparation[];
  // Spécifique Broderie
  embroideryPreview?: {
    estimatedStitches: number;
    matchedThreads: ThreadMatch[];
    densityScore: "OPTIMAL" | "DENSE" | "LIGHT";
  };
  // Spécifique Flocage / Vinyle
  plotterCut?: {
    perimeterMm: number;
    isolatedIslandsCount: number;
    warningWeeding: boolean;
  };
}

/** Nuancier standard de fils de broderie (Madeira Polyneon & Gunold) */
const EMBROIDERY_THREADS: {
  code: string;
  name: string;
  brand: "Madeira" | "Gunold";
  hex: string;
  rgb: [number, number, number];
}[] = [
  { code: "1801", name: "Super White", brand: "Madeira", hex: "#FFFFFF", rgb: [255, 255, 255] },
  { code: "1800", name: "Emerald Black", brand: "Madeira", hex: "#0A0A0A", rgb: [10, 10, 10] },
  { code: "1843", name: "Classic Navy", brand: "Madeira", hex: "#1A2542", rgb: [26, 37, 66] },
  { code: "1776", name: "Royal Blue", brand: "Madeira", hex: "#1D4ED8", rgb: [29, 78, 216] },
  { code: "1838", name: "Sky Blue", brand: "Madeira", hex: "#38BDF8", rgb: [56, 189, 248] },
  { code: "1851", name: "Forest Green", brand: "Madeira", hex: "#0D533A", rgb: [13, 83, 58] },
  { code: "1902", name: "Kelly Green", brand: "Madeira", hex: "#16A34A", rgb: [22, 163, 74] },
  { code: "1837", name: "Fire Red", brand: "Madeira", hex: "#DC2626", rgb: [220, 38, 38] },
  { code: "1982", name: "Bordeaux Wine", brand: "Madeira", hex: "#831843", rgb: [131, 24, 67] },
  { code: "1678", name: "Warm Orange", brand: "Madeira", hex: "#EA580C", rgb: [234, 88, 12] },
  { code: "1924", name: "Lemon Yellow", brand: "Madeira", hex: "#FACC15", rgb: [250, 204, 21] },
  { code: "1734", name: "Old Gold", brand: "Madeira", hex: "#CA8A04", rgb: [202, 138, 4] },
  { code: "1765", name: "Silver Grey", brand: "Madeira", hex: "#94A3B8", rgb: [148, 163, 184] },
  { code: "1610", name: "Charcoal", brand: "Gunold", hex: "#334155", rgb: [51, 65, 85] },
];

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

/**
 * Trouve le fil de broderie le plus proche d'une couleur RGB
 */
export function matchNearestThread(r: number, g: number, b: number): ThreadMatch {
  let best = EMBROIDERY_THREADS[0]!;
  let minDist = Infinity;

  for (const thread of EMBROIDERY_THREADS) {
    const d = colorDistance(r, g, b, thread.rgb[0], thread.rgb[1], thread.rgb[2]);
    if (d < minDist) {
      minDist = d;
      best = thread;
    }
  }

  return {
    code: best.code,
    name: best.name,
    brand: best.brand,
    hex: best.hex,
    distance: Math.round(minDist),
  };
}

/**
 * Génère le masque de sous-couche blanche DTF avec retrait (choke) de 1 à 2 pixels.
 * Empêche le liseré blanc parasite sur les textiles foncés.
 */
export function generateDtfWhiteUnderbase(
  image: RawImageData,
  chokePixels = 1,
): { mask: RawImageData; chokePixels: number; whiteInkAreaPercent: number } {
  const { width, height, data } = image;
  const total = width * height;

  // 1. Masque binaire brut de présence d'encre (alpha > 40)
  const initialMask = new Uint8Array(total);
  let whitePixels = 0;

  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3]! > 40) {
      initialMask[i] = 255;
      whitePixels++;
    }
  }

  // 2. Choke (érosion morphologique) pour rétracter la sous-couche
  let currentMask = initialMask;

  for (let step = 0; step < chokePixels; step++) {
    const eroded = new Uint8Array(total);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (currentMask[idx] === 0) continue;

        // Si l'un des 4 voisins directs est transparent, le pixel est érodé
        if (
          currentMask[idx - 1] === 0 ||
          currentMask[idx + 1] === 0 ||
          currentMask[idx - width] === 0 ||
          currentMask[idx + width] === 0
        ) {
          eroded[idx] = 0;
        } else {
          eroded[idx] = 255;
        }
      }
    }
    currentMask = eroded;
  }

  // 3. Construction de l'image de masque (blanc sur transparent)
  const outData = new Uint8ClampedArray(total * 4);
  let finalWhitePixels = 0;

  for (let i = 0; i < total; i++) {
    if (currentMask[i] === 255) {
      const idx = i * 4;
      outData[idx] = 255; // Blanc R
      outData[idx + 1] = 255; // Blanc G
      outData[idx + 2] = 255; // Blanc B
      outData[idx + 3] = 255; // Opaque
      finalWhitePixels++;
    }
  }

  return {
    mask: { width, height, data: outData },
    chokePixels,
    whiteInkAreaPercent: Number(((finalWhitePixels / total) * 100).toFixed(1)),
  };
}

/**
 * Prépare les films de séparation pour la sérigraphie (typons positifs)
 */
export function generateScreenFilms(image: RawImageData, spotColors: string[]): FilmSeparation[] {
  const { width, height, data } = image;
  const total = width * height;
  const results: FilmSeparation[] = [];

  for (const hex of spotColors) {
    const clean = hex.replace("#", "");
    const tr = parseInt(clean.slice(0, 2), 16) || 0;
    const tg = parseInt(clean.slice(2, 4), 16) || 0;
    const tb = parseInt(clean.slice(4, 6), 16) || 0;

    const maskData = new Uint8ClampedArray(total * 4);
    let count = 0;

    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      const a = data[idx + 3]!;
      if (a < 40) continue;

      const r = data[idx]!;
      const g = data[idx + 1]!;
      const b = data[idx + 2]!;

      // Distance à la couleur du typon
      const d = colorDistance(r, g, b, tr, tg, tb);
      if (d < 65) {
        // En sérigraphie, le typon est noir opaque là où l'encre doit passer
        maskData[idx] = 0;
        maskData[idx + 1] = 0;
        maskData[idx + 2] = 0;
        maskData[idx + 3] = 255;
        count++;
      }
    }

    results.push({
      colorHex: hex,
      coveragePercent: Number(((count / total) * 100).toFixed(1)),
      maskImage: { width, height, data: maskData },
    });
  }

  return results;
}

/**
 * Exécute la préparation technique complète pour une image selon la technique choisie.
 */
export function prepareForTechnique(
  image: RawImageData,
  technique: PrintTechnique,
  targetZoneMm: { width: number; height: number },
): TechniquePrepResult {
  const result: TechniquePrepResult = { technique };

  if (technique === "DTF" || technique === "DTG") {
    result.dtfWhiteUnderbase = generateDtfWhiteUnderbase(image, 1);
  }

  if (technique === "EMBROIDERY") {
    // Calcul des points de broderie estimés (4.5 points/mm² en zone remplie)
    let filledPixels = 0;
    const rSum: number[] = [];
    const gSum: number[] = [];
    const bSum: number[] = [];

    for (let i = 0; i < image.width * image.height; i++) {
      const idx = i * 4;
      if (image.data[idx + 3]! > 40) {
        filledPixels++;
        if (filledPixels % 50 === 0) {
          rSum.push(image.data[idx]!);
          gSum.push(image.data[idx + 1]!);
          bSum.push(image.data[idx + 2]!);
        }
      }
    }

    const fillRatio = filledPixels / (image.width * image.height);
    const areaMm2 = targetZoneMm.width * targetZoneMm.height * fillRatio;
    const estimatedStitches = Math.round(areaMm2 * 4.2);

    const matchedThreads: ThreadMatch[] = [];
    if (rSum.length > 0) {
      const avgR = Math.round(rSum.reduce((a, b) => a + b, 0) / rSum.length);
      const avgG = Math.round(gSum.reduce((a, b) => a + b, 0) / gSum.length);
      const avgB = Math.round(bSum.reduce((a, b) => a + b, 0) / bSum.length);
      matchedThreads.push(matchNearestThread(avgR, avgG, avgB));
    }

    result.embroideryPreview = {
      estimatedStitches,
      matchedThreads,
      densityScore: estimatedStitches > 25000 ? "DENSE" : estimatedStitches < 2000 ? "LIGHT" : "OPTIMAL",
    };
  }

  if (technique === "HEAT_TRANSFER_VINYL") {
    // Détection des découpes complexes pour flex/flocage
    let perimeterPixels = 0;
    const { width, height, data } = image;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3]! > 40) {
          if (
            data[idx - 4 + 3]! <= 40 ||
            data[idx + 4 + 3]! <= 40 ||
            data[idx - width * 4 + 3]! <= 40 ||
            data[idx + width * 4 + 3]! <= 40
          ) {
            perimeterPixels++;
          }
        }
      }
    }

    const mmPerPixel = targetZoneMm.width / width;
    const perimeterMm = Math.round(perimeterPixels * mmPerPixel);

    result.plotterCut = {
      perimeterMm,
      isolatedIslandsCount: Math.round(perimeterPixels / 150),
      warningWeeding: perimeterMm > 2500,
    };
  }

  return result;
}
