export interface GarmentColorOption {
  hex: string;
  nameFr: string;
  nameEn: string;
  family: "BRAND" | "NEUTRALS" | "COOL" | "WARM" | "VIVID";
  stockStatus: "IN_STOCK" | "ON_DEMAND";
}

export const PRESET_GARMENT_COLORS: GarmentColorOption[] = [
  // Neutres
  { hex: "#FFFFFF", nameFr: "Blanc Pur", nameEn: "Pure White", family: "NEUTRALS", stockStatus: "IN_STOCK" },
  {
    hex: "#F5F3EC",
    nameFr: "Blanc Cassé / Écru",
    nameEn: "Off-White / Natural",
    family: "NEUTRALS",
    stockStatus: "IN_STOCK",
  },
  {
    hex: "#D1D5DB",
    nameFr: "Gris Chiné",
    nameEn: "Heather Grey",
    family: "NEUTRALS",
    stockStatus: "IN_STOCK",
  },
  {
    hex: "#4B5563",
    nameFr: "Gris Anthracite",
    nameEn: "Charcoal Grey",
    family: "NEUTRALS",
    stockStatus: "IN_STOCK",
  },
  {
    hex: "#111827",
    nameFr: "Noir Intense",
    nameEn: "Deep Black",
    family: "NEUTRALS",
    stockStatus: "IN_STOCK",
  },

  // Froids
  { hex: "#1E293B", nameFr: "Bleu Marine", nameEn: "Navy Blue", family: "COOL", stockStatus: "IN_STOCK" },
  {
    hex: "#1D4ED8",
    nameFr: "Bleu Royal / Cobalt",
    nameEn: "Royal Blue",
    family: "COOL",
    stockStatus: "IN_STOCK",
  },
  { hex: "#38BDF8", nameFr: "Bleu Azur / Ciel", nameEn: "Sky Blue", family: "COOL", stockStatus: "IN_STOCK" },
  {
    hex: "#14532D",
    nameFr: "Vert Forêt Profond",
    nameEn: "Forest Green",
    family: "COOL",
    stockStatus: "IN_STOCK",
  },
  {
    hex: "#0F766E",
    nameFr: "Vert Canard / Teal",
    nameEn: "Deep Teal",
    family: "COOL",
    stockStatus: "IN_STOCK",
  },
  {
    hex: "#4D7C0F",
    nameFr: "Vert Kaki / Olive",
    nameEn: "Olive Green",
    family: "COOL",
    stockStatus: "ON_DEMAND",
  },

  // Chauds
  {
    hex: "#881337",
    nameFr: "Bordeaux / Grenat",
    nameEn: "Burgundy",
    family: "WARM",
    stockStatus: "IN_STOCK",
  },
  { hex: "#DC2626", nameFr: "Rouge Rubis", nameEn: "Ruby Red", family: "WARM", stockStatus: "IN_STOCK" },
  { hex: "#EA580C", nameFr: "Orange Vif", nameEn: "Vivid Orange", family: "WARM", stockStatus: "IN_STOCK" },
  {
    hex: "#EAB308",
    nameFr: "Jaune Or Sport",
    nameEn: "Golden Yellow",
    family: "WARM",
    stockStatus: "IN_STOCK",
  },
  { hex: "#B45309", nameFr: "Ocre / Camel", nameEn: "Warm Camel", family: "WARM", stockStatus: "ON_DEMAND" },

  // Vifs
  {
    hex: "#E11D48",
    nameFr: "Rose Framboise",
    nameEn: "Raspberry Pink",
    family: "VIVID",
    stockStatus: "ON_DEMAND",
  },
  {
    hex: "#7C3AED",
    nameFr: "Violet Impérial",
    nameEn: "Imperial Purple",
    family: "VIVID",
    stockStatus: "ON_DEMAND",
  },
  {
    hex: "#84CC16",
    nameFr: "Vert Lime Fluo",
    nameEn: "Neon Lime",
    family: "VIVID",
    stockStatus: "ON_DEMAND",
  },
  {
    hex: "#06B6D4",
    nameFr: "Cyan Électrique",
    nameEn: "Electric Cyan",
    family: "VIVID",
    stockStatus: "ON_DEMAND",
  },
];

export const COLOR_FAMILIES = [
  { id: "BRAND", labelFr: "Couleurs de ma marque", labelEn: "Brand Colors" },
  { id: "NEUTRALS", labelFr: "Neutres & Essentiels", labelEn: "Neutrals & Essentials" },
  { id: "COOL", labelFr: "Tons Froids & Bleus", labelEn: "Cool & Blues" },
  { id: "WARM", labelFr: "Tons Chauds & Rouges", labelEn: "Warm & Reds" },
  { id: "VIVID", labelFr: "Tons Vifs & Sport", labelEn: "Vivid & Sport" },
] as const;

export function findColorName(hex: string): string {
  const norm = hex.trim().toUpperCase();
  const match = PRESET_GARMENT_COLORS.find((c) => c.hex.toUpperCase() === norm);
  if (match) return match.nameFr;
  // If custom
  return `Personnalisé (${norm})`;
}

/** Calcule si la couleur du vêtement est foncée (luminance perçue < 128). */
export function isDarkGarment(hex: string): boolean {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 < 130;
}
