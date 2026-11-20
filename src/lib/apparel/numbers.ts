/**
/**
 * Typographie sportive & condensation intelligente des noms de joueurs
 * Module Textile (Section 16 du Cahier des Charges & Plan d'implémentation)
 */

export interface AthleticFont {
  id: string;
  name: string;
  category: "CLASSIC" | "MODERN" | "GEOMETRIC" | "BLOCK";
  minCondensationRatio: number; // Jusqu'à 0.80 (80%) pour préserver la lisibilité
  strokeSupported: boolean;
  inlineSupported: boolean;
  recommendedFor: ("FOOTBALL" | "BASKETBALL" | "RUGBY" | "ESPORT")[];
}

export const ATHLETIC_FONTS: AthleticFont[] = [
  {
    id: "college_block",
    name: "College Block (Varsity)",
    category: "BLOCK",
    minCondensationRatio: 0.75,
    strokeSupported: true,
    inlineSupported: true,
    recommendedFor: ["FOOTBALL", "BASKETBALL", "RUGBY"],
  },
  {
    id: "modern_athletic",
    name: "Modern Pro Athletic",
    category: "MODERN",
    minCondensationRatio: 0.8,
    strokeSupported: true,
    inlineSupported: false,
    recommendedFor: ["FOOTBALL", "ESPORT"],
  },
  {
    id: "octagonal_speed",
    name: "Octagonal Aero",
    category: "GEOMETRIC",
    minCondensationRatio: 0.8,
    strokeSupported: true,
    inlineSupported: true,
    recommendedFor: ["BASKETBALL", "ESPORT"],
  },
  {
    id: "heritage_serif",
    name: "Heritage Serif Athletic",
    category: "CLASSIC",
    minCondensationRatio: 0.85,
    strokeSupported: true,
    inlineSupported: false,
    recommendedFor: ["RUGBY"],
  },
];

export interface CondensationResult {
  originalWidthMm: number;
  condensedWidthMm: number;
  scaleX: number; // 0.80 à 1.00
  letterSpacingEm: number;
  fits: boolean;
  overflowMm: number;
}

/**
 * Calcule la condensation automatique d'un nom de joueur pour s'ajuster
 * à la largeur maximale autorisée de la zone de marquage dos (ex: 300 mm).
 * Ne descend jamais sous minRatio (80% par défaut) pour préserver la lisibilité de loin.
 */
export function calculateNameCondensation(
  name: string,
  fontSizeMm: number,
  maxAvailableWidthMm: number,
  minRatio = 0.8,
): CondensationResult {
  const clean = name.trim();
  if (!clean) {
    return {
      originalWidthMm: 0,
      condensedWidthMm: 0,
      scaleX: 1,
      letterSpacingEm: 0.05,
      fits: true,
      overflowMm: 0,
    };
  }

  // Largeur moyenne approximative d'un caractère majuscule sportif = 0.65 * fontSize
  const charWidthFactor = 0.65;
  const naturalCharWidth = fontSizeMm * charWidthFactor;
  const naturalTrackingMm = fontSizeMm * 0.05; // 0.05em
  const naturalWidth = clean.length * naturalCharWidth + (clean.length - 1) * naturalTrackingMm;

  if (naturalWidth <= maxAvailableWidthMm) {
    return {
      originalWidthMm: Math.round(naturalWidth * 10) / 10,
      condensedWidthMm: Math.round(naturalWidth * 10) / 10,
      scaleX: 1.0,
      letterSpacingEm: 0.05,
      fits: true,
      overflowMm: 0,
    };
  }

  // Calcul du ratio de compression nécessaire
  const targetRatio = maxAvailableWidthMm / naturalWidth;
  const clampedScaleX = Math.max(minRatio, Math.min(1.0, targetRatio));
  const condensedWidth = naturalWidth * clampedScaleX;
  const fits = condensedWidth <= maxAvailableWidthMm + 0.5;

  return {
    originalWidthMm: Math.round(naturalWidth * 10) / 10,
    condensedWidthMm: Math.round(condensedWidth * 10) / 10,
    scaleX: Math.round(clampedScaleX * 100) / 100,
    letterSpacingEm: clampedScaleX < 0.9 ? 0.02 : 0.05, // Réduction du tracking si très condensé
    fits,
    overflowMm: fits ? 0 : Math.round((condensedWidth - maxAvailableWidthMm) * 10) / 10,
  };
}

/**
 * Calcule l'arc de courbure SVG pour un nom courbé sur maillot (ex: curve = 25%)
 */
export function computeArcTransform(curvePercent: number, widthMm: number) {
  if (Math.abs(curvePercent) < 1) {
    return { isCurved: false, d: "" };
  }

  // Rayon de l'arc en fonction du pourcentage (-100 à +100)
  const normalized = Math.max(-100, Math.min(100, curvePercent));
  const radius = (widthMm * 100) / (Math.abs(normalized) * 1.5);
  const sweep = normalized > 0 ? 1 : 0;
  const midY = normalized > 0 ? widthMm * 0.15 : -widthMm * 0.15;

  return {
    isCurved: true,
    radius,
    midY,
    sweep,
    d: `M 0,${midY} A ${radius},${radius} 0 0,${sweep} ${widthMm},${midY}`,
  };
}
