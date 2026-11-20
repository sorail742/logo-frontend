import type { PrintTechnique } from "@/lib/apparel/types";
import { analyzeImage } from "./analysis";
import { removeBackground } from "./background-removal";
import { vectorizeImage } from "./vectorizer";
import {
  applyAdjustments,
  applyMonochrome,
  applyReplaceColor,
  applyHalftone,
  cropImage,
  rotateImage,
  flipImage,
} from "./adjustments";
import type { ImageAnalysis, ImageOperation, ProcessedImageResult, RawImageData } from "./types";

/** Convertit des données RawImageData en Data URL PNG dans le navigateur */
export function rawImageToDataUrl(image: RawImageData): string {
  if (typeof document === "undefined") {
    // Environnement non-navigateur (tests node)
    return `data:image/png;base64,placeholder_${image.width}x${image.height}`;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imgData = ctx.createImageData(image.width, image.height);
  imgData.data.set(image.data);
  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL("image/png");
}

/** Charge un Data URL ou URL en RawImageData */
export async function dataUrlToRawImage(url: string): Promise<RawImageData> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      resolve({ width: 100, height: 100, data: new Uint8ClampedArray(100 * 100 * 4) });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Impossible d'obtenir le contexte canvas 2D"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        data: imgData.data,
      });
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/** Calcul d'un hash déterministe pour le cache */
function computeHash(width: number, height: number, ops: ImageOperation[]): string {
  const str = `${width}x${height}:${JSON.stringify(ops)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `img_${Math.abs(hash).toString(16)}`;
}

export interface PipelineOptions {
  originalImage: RawImageData;
  operations: ImageOperation[];
  targetZoneMm: { width: number; height: number };
  garmentColorHex?: string;
  technique?: PrintTechnique;
  assetId?: string;
}

/**
 * Moteur de pipeline non destructif pour le traitement d'images textile 100% local.
 */
export function runImagePipeline(options: PipelineOptions): ProcessedImageResult {
  const startTime = performance.now();
  const { originalImage, operations, targetZoneMm, garmentColorHex = "#ffffff", technique = "DTF" } = options;

  let current: RawImageData = {
    width: originalImage.width,
    height: originalImage.height,
    data: new Uint8ClampedArray(originalImage.data),
  };

  let svgOutput: string | undefined;
  let vectorNodeCount: number | undefined;

  for (const op of operations) {
    switch (op.type) {
      case "auto-enhance": {
        current = applyAdjustments(current, {
          contrast: 15,
          saturation: 10,
          sharpen: 20,
        });
        break;
      }
      case "adjust": {
        current = applyAdjustments(current, op.params);
        break;
      }
      case "remove-background": {
        current = removeBackground(current, {
          tolerance: op.params.tolerance,
          edgeSmooth: op.params.edgeSmooth,
          feather: op.params.feather,
          decontaminate: op.params.decontaminate,
          magicWandSeeds: op.params.magicWandPoints,
        });
        break;
      }
      case "monochrome": {
        current = applyMonochrome(current, op.params.color, op.params.threshold);
        break;
      }
      case "replace-color": {
        current = applyReplaceColor(
          current,
          op.params.targetHex,
          op.params.replacementHex,
          op.params.tolerance,
        );
        break;
      }
      case "halftone": {
        current = applyHalftone(current, op.params.dotSize, op.params.angleDeg);
        break;
      }
      case "crop": {
        current = cropImage(current, op.params.x, op.params.y, op.params.width, op.params.height);
        break;
      }
      case "rotate": {
        current = rotateImage(current, op.params.angleDeg);
        break;
      }
      case "flip": {
        current = flipImage(current, op.params.horizontal, op.params.vertical);
        break;
      }
      case "vectorize": {
        const vResult = vectorizeImage(current, {
          colorsCount: op.params.colorsCount,
          simplifyTolerance: op.params.simplifyTolerance,
          mode: op.params.mode,
        });
        svgOutput = vResult.svg;
        vectorNodeCount = vResult.pathsCount;
        break;
      }
      default:
        break;
    }
  }

  // Analyse complète de l'image finale
  const analysis: ImageAnalysis = analyzeImage({
    image: current,
    format: svgOutput ? "SVG" : "PNG",
    fileSizeBytes: Math.round(current.data.length * 0.75), // estimation taille PNG
    targetZoneMm,
    garmentHex: garmentColorHex ?? "#ffffff",
  });

  const hash = computeHash(current.width, current.height, operations);
  const dataUrl = rawImageToDataUrl(current);
  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    assetId: options.assetId ?? hash,
    rawImage: current,
    dataUrl,
    svgOutput,
    vectorNodeCount,
    operations,
    analysis,
    hash,
    executionTimeMs,
  };
}
