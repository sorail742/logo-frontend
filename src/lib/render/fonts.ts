// Bibliothèque interne de polices (toutes sous licence OFL, servies par next/font).
// Le rendu utilise la variable CSS de chaque police ; l'export la résout en nom réel.

export type FontCategory = "sans" | "serif" | "display" | "script";

export interface LibraryFontDef {
  id: string;
  name: string;
  cssVar: string;
  category: FontCategory;
  license: "OFL";
  weights: number[];
  /** Largeur moyenne d'un caractère, en em, pour estimer la taille du texte. */
  widthFactor: number;
}

export const FONTS: LibraryFontDef[] = [
  { id: "montserrat", name: "Montserrat", cssVar: "--font-montserrat", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.66 },
  { id: "poppins", name: "Poppins", cssVar: "--font-poppins", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.64 },
  { id: "space-grotesk", name: "Space Grotesk", cssVar: "--font-space-grotesk", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.6 },
  { id: "nunito", name: "Nunito", cssVar: "--font-nunito", category: "sans", license: "OFL", weights: [400, 700, 800], widthFactor: 0.58 },
  { id: "raleway", name: "Raleway", cssVar: "--font-raleway", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.62 },
  { id: "oswald", name: "Oswald", cssVar: "--font-oswald", category: "display", license: "OFL", weights: [400, 600, 700], widthFactor: 0.46 },
  { id: "bebas-neue", name: "Bebas Neue", cssVar: "--font-bebas-neue", category: "display", license: "OFL", weights: [400], widthFactor: 0.42 },
  { id: "playfair", name: "Playfair Display", cssVar: "--font-playfair", category: "serif", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.6 },
  { id: "lora", name: "Lora", cssVar: "--font-lora", category: "serif", license: "OFL", weights: [400, 600, 700], widthFactor: 0.58 },
  { id: "merriweather", name: "Merriweather", cssVar: "--font-merriweather", category: "serif", license: "OFL", weights: [400, 700, 900], widthFactor: 0.66 },
  { id: "great-vibes", name: "Great Vibes", cssVar: "--font-great-vibes", category: "script", license: "OFL", weights: [400], widthFactor: 0.46 },
  { id: "dancing-script", name: "Dancing Script", cssVar: "--font-dancing-script", category: "script", license: "OFL", weights: [400, 700], widthFactor: 0.48 },
  { id: "allura", name: "Allura", cssVar: "--font-allura", category: "script", license: "OFL", weights: [400], widthFactor: 0.42 },
  { id: "satisfy", name: "Satisfy", cssVar: "--font-satisfy", category: "script", license: "OFL", weights: [400], widthFactor: 0.5 },
  { id: "sacramento", name: "Sacramento", cssVar: "--font-sacramento", category: "script", license: "OFL", weights: [400], widthFactor: 0.4 },
];

export const LOGO_FONTS = FONTS.filter((font) => font.category !== "script");
export const SCRIPT_FONTS = FONTS.filter((font) => font.category === "script");

export function getFont(id: string): LibraryFontDef {
  return FONTS.find((font) => font.id === id) ?? FONTS[0]!;
}

/** Valeur font-family utilisable dans un attribut style d'un SVG inséré dans la page. */
export function cssFontFamily(id: string) {
  const font = getFont(id);
  const fallback = font.category === "serif" ? "serif" : font.category === "script" ? "cursive" : "sans-serif";
  return `var(${font.cssVar}), '${font.name}', ${fallback}`;
}

/** Plus proche graisse disponible. */
export function closestWeight(id: string, weight: number) {
  const { weights } = getFont(id);
  return weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), weights[0]!);
}

export function estimateTextWidth(text: string, fontId: string, fontSize: number, letterSpacingEm = 0) {
  const font = getFont(fontId);
  return text.length * fontSize * (font.widthFactor + letterSpacingEm);
}
