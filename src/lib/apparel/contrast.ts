import { contrastRatio, luminance } from "@/lib/render/color";

export type ContrastRating = "AAA" | "AA" | "AA_LARGE" | "FAIL";

export interface TextileContrastCheck {
  textColor: string;
  garmentColor: string;
  ratio: number;
  rating: ContrastRating;
  isCompliant: boolean;
  minRecommendedRatio: number;
  suggestions: string[];
}

/**
 * Évalue la conformité du contraste d'un marquage sur tissu selon les critères WCAG 2.1
 * et les recommandations des ligues sportives (visibilité des numéros à distance).
 */
export function evaluateTextileContrast(
  textColor: string,
  garmentColor: string,
  isLargeText = true, // Les numéros de maillots et noms sont presque toujours du grand texte (> 18pt / > 24mm)
): TextileContrastCheck {
  const ratio = Math.round(contrastRatio(textColor, garmentColor) * 10) / 10;
  const minRatio = isLargeText ? 3.0 : 4.5;

  let rating: ContrastRating = "FAIL";
  if (ratio >= 7.0) {
    rating = "AAA";
  } else if (ratio >= 4.5) {
    rating = "AA";
  } else if (ratio >= 3.0) {
    rating = "AA_LARGE";
  }

  const isCompliant = ratio >= minRatio;

  // Suggestions de couleurs avec contraste élevé si insuffisant
  const suggestions: string[] = [];
  const lum = luminance(garmentColor);

  if (lum < 0.3) {
    // Tissu sombre : suggérer blanc, or sportif, jaune fluo, argent
    suggestions.push("#FFFFFF", "#FACC15", "#E2E8F0", "#38BDF8");
  } else if (lum > 0.7) {
    // Tissu très clair : suggérer noir profond, bleu marine, vert forêt, bordeaux
    suggestions.push("#0F172A", "#1E3A8A", "#064E3B", "#881337");
  } else {
    // Tissu intermédiaire (ex: rouge, bleu royal)
    suggestions.push("#FFFFFF", "#000000", "#FEF08A");
  }

  return {
    textColor,
    garmentColor,
    ratio,
    rating,
    isCompliant,
    minRecommendedRatio: minRatio,
    suggestions,
  };
}
