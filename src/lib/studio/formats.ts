import type { PrintSpec } from "./types";

// Formats proposés à la création. Les formats imprimés sont décrits en millimètres (avec fond
// perdu de 3 mm) ; leur taille en px fixe seulement la précision de l'édition.

export type FormatGroup = "social" | "print" | "screen" | "brand";

export interface DesignFormat {
  id: string;
  group: FormatGroup;
  width: number;
  height: number;
  print?: PrintSpec;
}

/** Taille en px d'un format imprimé, à la résolution d'édition voulue (px par mm). */
function printFormat(id: string, widthMm: number, heightMm: number, pxPerMm = 150 / 25.4): DesignFormat {
  return {
    id,
    group: "print",
    width: Math.round(widthMm * pxPerMm),
    height: Math.round(heightMm * pxPerMm),
    print: { widthMm, heightMm, bleedMm: 3 },
  };
}

export const FORMATS: DesignFormat[] = [
  { id: "post-square", group: "social", width: 1080, height: 1080 },
  { id: "post-portrait", group: "social", width: 1080, height: 1350 },
  { id: "story", group: "social", width: 1080, height: 1920 },
  { id: "facebook-cover", group: "social", width: 1640, height: 624 },
  { id: "linkedin-banner", group: "social", width: 1584, height: 396 },
  { id: "youtube-thumbnail", group: "social", width: 1280, height: 720 },
  printFormat("flyer-a5", 148, 210),
  printFormat("flyer-a4", 210, 297),
  printFormat("poster-a3", 297, 420),
  printFormat("business-card", 85, 55, 8),
  printFormat("invitation", 148, 105),
  printFormat("certificate", 297, 210),
  printFormat("rollup", 850, 2000, 0.8),
  { id: "slide", group: "screen", width: 1920, height: 1080 },
  { id: "email-banner", group: "screen", width: 1200, height: 400 },
  { id: "logo-canvas", group: "brand", width: 1200, height: 800 },
];

export const FORMAT_GROUPS: FormatGroup[] = ["social", "print", "screen", "brand"];

export function getFormat(id: string): DesignFormat | undefined {
  return FORMATS.find((format) => format.id === id);
}

/** Format libre en px. */
export function customFormat(width: number, height: number): DesignFormat {
  return { id: "custom", group: "screen", width: Math.round(width), height: Math.round(height) };
}
