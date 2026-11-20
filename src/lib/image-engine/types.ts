import type { PrintTechnique } from "@/lib/apparel/types";

export interface RawImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export type ImageFileFormat = "PNG" | "JPEG" | "WEBP" | "SVG" | "GIF" | "UNKNOWN";

export type DpiRating = "EXCELLENT" | "GOOD" | "LOW" | "CRITICAL";

export interface DominantColor {
  hex: string;
  percentage: number;
  rgb: [number, number, number];
}

export interface TechniqueVerdict {
  compliant: boolean;
  warnings: string[];
  recommendations: string[];
  actionFixId?: "remove-bg" | "vectorize" | "reduce-colors" | "monochrome" | "upscale";
}

export interface ImageAnalysis {
  width: number;
  height: number;
  format: ImageFileFormat;
  fileSizeBytes: number;
  hasAlpha: boolean;
  hasSolidBackground: boolean;
  solidBackgroundColor: string | null;
  effectiveDpi: number;
  dpiRating: DpiRating;
  targetZoneMm: { width: number; height: number };
  blurScore: number; // Variance du Laplacien
  isBlurry: boolean;
  colorCount: number;
  dominantColors: DominantColor[];
  contrastWithGarment: {
    ratio: number;
    isGood: boolean;
  };
  techniqueAudit: Record<PrintTechnique, TechniqueVerdict>;
}

export type ImageOperation =
  | {
      id: string;
      type: "auto-enhance";
    }
  | {
      id: string;
      type: "adjust";
      params: {
        brightness?: number; // -100 to 100
        contrast?: number; // -100 to 100
        saturation?: number; // -100 to 100
        exposure?: number; // -3 to 3
        temperature?: number; // -100 to 100
        tint?: number; // -100 to 100
        sharpen?: number; // 0 to 100
        blur?: number; // 0 to 50
      };
    }
  | {
      id: string;
      type: "remove-background";
      params: {
        tolerance: number; // 0 to 100
        edgeSmooth: number; // 0 to 10
        feather: number; // 0 to 10
        decontaminate: boolean;
        magicWandPoints?: { x: number; y: number }[];
      };
    }
  | {
      id: string;
      type: "monochrome";
      params: {
        color: string;
        threshold?: number; // 0 to 255
      };
    }
  | {
      id: string;
      type: "replace-color";
      params: {
        targetHex: string;
        replacementHex: string;
        tolerance: number;
      };
    }
  | {
      id: string;
      type: "halftone";
      params: {
        dotSize: number; // 2 to 20
        angleDeg: number; // 0 to 90
      };
    }
  | {
      id: string;
      type: "vectorize";
      params: {
        colorsCount: number; // 1 to 16
        simplifyTolerance: number; // 0.5 to 5
        mode: "color" | "monochrome" | "logo";
      };
    }
  | {
      id: string;
      type: "crop";
      params: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | {
      id: string;
      type: "rotate";
      params: {
        angleDeg: number; // 90, 180, 270
      };
    }
  | {
      id: string;
      type: "flip";
      params: {
        horizontal: boolean;
        vertical: boolean;
      };
    }
  | {
      id: string;
      type: "technique-prep";
      params: {
        technique: PrintTechnique;
        spotColorsCount?: number;
        generateCutPath?: boolean;
      };
    };

export interface ProcessedImageResult {
  assetId: string;
  rawImage: RawImageData;
  dataUrl: string;
  svgOutput?: string;
  vectorNodeCount?: number;
  operations: ImageOperation[];
  analysis: ImageAnalysis;
  hash: string;
  executionTimeMs: number;
}
