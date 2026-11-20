import type { PrintTechnique } from "@/lib/apparel/types";
import { evaluateTextileContrast } from "@/lib/apparel/contrast";
import type {
  DominantColor,
  DpiRating,
  ImageAnalysis,
  ImageFileFormat,
  RawImageData,
  TechniqueVerdict,
} from "./types";

export function calculateEffectiveDpi(pixels: number, targetMm: number): number {
  const inches = targetMm / 25.4;
  return Math.max(1, Math.round(pixels / inches));
}

export function evaluateTechniqueCompatibility(params: {
  format: ImageFileFormat;
  hasAlpha: boolean;
  hasSolidBackground: boolean;
  colorCount: number;
  effectiveDpi: number;
  activeTechnique: PrintTechnique;
  blurScore?: number;
}): Record<PrintTechnique, TechniqueVerdict> {
  return auditPrintTechniques(
    params.effectiveDpi,
    params.colorCount,
    params.hasAlpha,
    params.hasSolidBackground,
    params.blurScore ?? 150,
    4.5,
  );
}

export interface AnalysisInput {
  image: RawImageData;
  format: ImageFileFormat;
  fileSizeBytes: number;
  targetZoneMm: { width: number; height: number };
  garmentHex: string;
}

/**
 * Calcule la variance du Laplacien sur l'image en niveaux de gris pour détecter le flou.
 * Une variance < 100 indique généralement une image floue ou manquant de piqué.
 */
export function calculateLaplacianVariance(image: RawImageData): number {
  const { width, height, data } = image;
  if (width < 3 || height < 3) return 0;

  // Sous-échantillonnage pour la rapidité si image > 800px
  const step = Math.max(1, Math.floor(Math.max(width, height) / 600));
  const sampleW = Math.floor(width / step);
  const sampleH = Math.floor(height / step);

  // Conversion en niveaux de gris
  const gray = new Float32Array(sampleW * sampleH);
  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const srcIdx = (y * step * width + x * step) * 4;
      gray[y * sampleW + x] = 0.299 * data[srcIdx]! + 0.587 * data[srcIdx + 1]! + 0.114 * data[srcIdx + 2]!;
    }
  }

  // Application du noyau Laplacien 3x3 :
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const c = gray[y * sampleW + x]!;
      const up = gray[(y - 1) * sampleW + x]!;
      const down = gray[(y + 1) * sampleW + x]!;
      const left = gray[y * sampleW + (x - 1)]!;
      const right = gray[y * sampleW + (x + 1)]!;

      const lap = up + down + left + right - 4 * c;
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, Math.round(variance));
}

/**
 * Détecte si le fond de l'image est uni en analysant les pixels périphériques (bords).
 */
export function detectSolidBackground(image: RawImageData): {
  isSolid: boolean;
  colorHex: string | null;
} {
  const { width, height, data } = image;
  const edgePixels: [number, number, number][] = [];
  const step = Math.max(1, Math.floor((width + height) / 300));

  const sample = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    // Ne prendre en compte que si opaque
    if (data[idx + 3]! > 200) {
      edgePixels.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
    }
  };

  for (let x = 0; x < width; x += step) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    sample(0, y);
    sample(width - 1, y);
  }

  if (edgePixels.length < 10) {
    return { isSolid: false, colorHex: null };
  }

  // Calcul de la couleur moyenne des bords
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  for (const [r, g, b] of edgePixels) {
    rSum += r;
    gSum += g;
    bSum += b;
  }
  const avgR = rSum / edgePixels.length;
  const avgG = gSum / edgePixels.length;
  const avgB = bSum / edgePixels.length;

  // Calcul de l'écart-type
  let variance = 0;
  for (const [r, g, b] of edgePixels) {
    const dr = r - avgR;
    const dg = g - avgG;
    const db = b - avgB;
    variance += dr * dr + dg * dg + db * db;
  }
  variance /= edgePixels.length;

  // Si la variance sur les bords est très faible (< 450), le fond est considéré comme uni
  const isSolid = variance < 450;
  const hex = isSolid
    ? `#${Math.round(avgR).toString(16).padStart(2, "0")}${Math.round(avgG).toString(16).padStart(2, "0")}${Math.round(avgB).toString(16).padStart(2, "0")}`.toUpperCase()
    : null;

  return { isSolid, colorHex: hex };
}

/**
 * Extraction des couleurs dominantes par k-moyennes déterministe sur les pixels opaques.
 */
export function extractDominantColors(image: RawImageData, k = 5): DominantColor[] {
  const { data } = image;
  const opaqueSamples: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(data.length / (4 * 12000)));

  for (let i = 0; i < data.length; i += step * 4) {
    if (data[i + 3]! > 128) {
      opaqueSamples.push([data[i]!, data[i + 1]!, data[i + 2]!]);
    }
  }

  if (opaqueSamples.length === 0) return [];

  // Initialisation k-means++ simplifiée
  const centers: [number, number, number][] = [opaqueSamples[Math.floor(opaqueSamples.length / 2)]!];
  while (centers.length < Math.min(k, opaqueSamples.length)) {
    let farthest = opaqueSamples[0]!;
    let maxDist = -1;
    for (const p of opaqueSamples) {
      let minDist = Infinity;
      for (const c of centers) {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < minDist) minDist = d;
      }
      if (minDist > maxDist) {
        maxDist = minDist;
        farthest = p;
      }
    }
    centers.push(farthest);
  }

  // 6 itérations de k-moyennes
  const clusters: [number, number, number][][] = Array.from({ length: centers.length }, () => []);
  for (let iter = 0; iter < 6; iter++) {
    clusters.forEach((c) => (c.length = 0));
    for (const p of opaqueSamples) {
      let bestCenter = 0;
      let bestDist = Infinity;
      for (let ci = 0; ci < centers.length; ci++) {
        const c = centers[ci]!;
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < bestDist) {
          bestDist = d;
          bestCenter = ci;
        }
      }
      clusters[bestCenter]!.push(p);
    }

    // Recalcul des centres
    for (let ci = 0; ci < centers.length; ci++) {
      const cluster = clusters[ci]!;
      if (cluster.length > 0) {
        let r = 0;
        let g = 0;
        let b = 0;
        for (const pt of cluster) {
          r += pt[0];
          g += pt[1];
          b += pt[2];
        }
        centers[ci] = [
          Math.round(r / cluster.length),
          Math.round(g / cluster.length),
          Math.round(b / cluster.length),
        ];
      }
    }
  }

  // Calcul des pourcentages
  const total = opaqueSamples.length;
  return centers
    .map((c, i) => {
      const count = clusters[i]!.length;
      const pct = Math.round((count / total) * 100);
      const hex =
        `#${c[0].toString(16).padStart(2, "0")}${c[1].toString(16).padStart(2, "0")}${c[2].toString(16).padStart(2, "0")}`.toUpperCase();
      return { hex, percentage: pct, rgb: c };
    })
    .filter((dc) => dc.percentage > 3)
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Évalue la conformité de l'image pour chaque technique d'impression textile.
 */
export function auditPrintTechniques(
  effectiveDpi: number,
  colorCount: number,
  hasAlpha: boolean,
  hasSolidBackground: boolean,
  blurScore: number,
  contrastRatio: number,
): Record<PrintTechnique, TechniqueVerdict> {
  const isHighDpi = effectiveDpi >= 200;
  const isBlurry = blurScore < 100;

  return {
    DTF: {
      compliant: isHighDpi && hasAlpha,
      warnings: [
        ...(hasSolidBackground
          ? [
              "L'image a un fond plein : un détourage est recommandé pour éviter un cadre rectangulaire opaque sur le t-shirt.",
            ]
          : []),
        ...(effectiveDpi < 200
          ? [`Résolution de ${effectiveDpi} DPI inférieure au seuil optimal de 300 DPI.`]
          : []),
      ],
      recommendations: [
        ...(hasSolidBackground ? ["Utilisez l'outil « Détourer » pour rendre le fond transparent."] : []),
        ...(isHighDpi && hasAlpha ? ["Prêt pour l'impression DTF haute fidélité."] : []),
      ],
      actionFixId: hasSolidBackground ? "remove-bg" : effectiveDpi < 200 ? "vectorize" : undefined,
    },
    SCREEN_PRINT: {
      compliant: colorCount <= 6,
      warnings: [
        ...(colorCount > 6
          ? [
              `L'image comporte environ ${colorCount} teintes. La sérigraphie est limitée à 6 couleurs directes.`,
            ]
          : []),
      ],
      recommendations: [
        ...(colorCount > 6
          ? ["Réduisez à 1 à 6 couleurs ou vectorisez le visuel."]
          : ["Nombre de couleurs optimal pour les films de sérigraphie."]),
      ],
      actionFixId: colorCount > 6 ? "reduce-colors" : undefined,
    },
    HEAT_TRANSFER_VINYL: {
      compliant: colorCount <= 2 && hasAlpha,
      warnings: [
        ...(colorCount > 2 ? ["Le flex/vinyle découpé requiert 1 ou 2 couleurs unies sans dégradés."] : []),
      ],
      recommendations: [
        ...(colorCount > 2
          ? ["Passez en mode « Monochrome » ou vectorisez en silhouette."]
          : ["Parfait pour la découpe vinyle."]),
      ],
      actionFixId: colorCount > 2 ? "monochrome" : undefined,
    },
    FLOCK: {
      compliant: colorCount <= 2 && hasAlpha,
      warnings: [
        ...(colorCount > 2 ? ["Le flocage velours s'applique sur des motifs unis 1 à 2 couleurs."] : []),
      ],
      recommendations: [...(colorCount > 2 ? ["Simplifiez en 1 couleur pour le relief velours."] : [])],
      actionFixId: colorCount > 2 ? "monochrome" : undefined,
    },
    EMBROIDERY: {
      compliant: colorCount <= 8 && !isBlurry,
      warnings: [
        ...(colorCount > 8
          ? ["Trop de nuances pour les fils de broderie (max 8 couleurs recommandées)."]
          : []),
        ...(isBlurry ? ["Contours flous : la broderie nécessite des tracés vectoriels nets."] : []),
      ],
      recommendations: ["Vectorisez le logo pour obtenir des contours parfaits pour le piquage broderie."],
      actionFixId: "vectorize",
    },
    SUBLIMATION: {
      compliant: isHighDpi,
      warnings: [...(effectiveDpi < 180 ? ["Résolution limite pour une sublimation grand format."] : [])],
      recommendations: ["Idéal pour maillots sportifs polyester clair."],
    },
    DTG: {
      compliant: isHighDpi,
      warnings: [
        ...(effectiveDpi < 200 ? ["Résolution moyenne pour l'impression directe jet d'encre."] : []),
      ],
      recommendations: ["Compatible coton clair ou foncé avec sous-couche blanche."],
    },
  };
}

/**
 * Analyse complète d'une image importée.
 */
export function analyzeImage(input: AnalysisInput): ImageAnalysis {
  const { image, format, fileSizeBytes, targetZoneMm, garmentHex } = input;
  const { width, height, data } = image;

  // Calcul du DPI effectif : pixels ÷ pouces
  const widthInches = targetZoneMm.width / 25.4;
  const effectiveDpi = Math.max(1, Math.round(width / widthInches));

  let dpiRating: DpiRating = "CRITICAL";
  if (effectiveDpi >= 300) dpiRating = "EXCELLENT";
  else if (effectiveDpi >= 200) dpiRating = "GOOD";
  else if (effectiveDpi >= 150) dpiRating = "LOW";

  // Détection de transparence
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 16) {
    if (data[i]! < 240) {
      hasAlpha = true;
      break;
    }
  }

  // Détection de fond uni
  const { isSolid: hasSolidBackground, colorHex: solidBackgroundColor } = detectSolidBackground(image);

  // Couleurs dominantes
  const dominantColors = extractDominantColors(image, 5);

  // Score de netteté / flou
  const blurScore = calculateLaplacianVariance(image);
  const isBlurry = blurScore < 110;

  // Contraste avec le tissu
  const mainColorHex = dominantColors[0]?.hex ?? "#111111";
  const contrast = evaluateTextileContrast(mainColorHex, garmentHex);

  const techniqueAudit = auditPrintTechniques(
    effectiveDpi,
    dominantColors.length,
    hasAlpha,
    hasSolidBackground,
    blurScore,
    contrast.ratio,
  );

  return {
    width,
    height,
    format,
    fileSizeBytes,
    hasAlpha,
    hasSolidBackground,
    solidBackgroundColor,
    effectiveDpi,
    dpiRating,
    targetZoneMm,
    blurScore,
    isBlurry,
    colorCount: dominantColors.length,
    dominantColors,
    contrastWithGarment: {
      ratio: contrast.ratio,
      isGood: contrast.isCompliant,
    },
    techniqueAudit,
  };
}
