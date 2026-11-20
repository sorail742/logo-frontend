import type { PrintTechnique, ProductCategory } from "./types";

export interface OutfitPreset {
  id: string;
  name: string;
  tagline: string;
  category: ProductCategory;
  templateId: string;
  color: string;
  technique: PrintTechnique;
  styleTag: "Streetwear" | "Club Foot" | "Corporate" | "Événement" | "Basketball" | "Éco-Bio";
  suggestedName: string;
  badge?: string;
}

export const OUTFIT_PRESETS: OutfitPreset[] = [
  {
    id: "streetwear-dark",
    name: "Streetwear Heavyweight",
    tagline: "Coton lourd noir intense avec marquage haute fidélité",
    category: "TSHIRT",
    templateId: "tpl-tshirt",
    color: "#111827",
    technique: "DTF",
    styleTag: "Streetwear",
    suggestedName: "T-shirt Streetwear Essential",
    badge: "Tendance",
  },
  {
    id: "football-home",
    name: "Club Football Domicile",
    tagline: "Maillot technique cobalt avec flocage net des sponsors",
    category: "FOOTBALL_JERSEY",
    templateId: "tpl-football",
    color: "#1D4ED8",
    technique: "HEAT_TRANSFER_VINYL",
    styleTag: "Club Foot",
    suggestedName: "Maillot Domicile Saison 2026",
    badge: "Best-seller",
  },
  {
    id: "corporate-polo",
    name: "Polo Corporate Executive",
    tagline: "Polo bleu marine en maille piquée avec broderie discrète",
    category: "POLO",
    templateId: "tpl-polo",
    color: "#1E293B",
    technique: "EMBROIDERY",
    styleTag: "Corporate",
    suggestedName: "Polo Staff & Représentation",
    badge: "Premium",
  },
  {
    id: "event-light",
    name: "Événement & Festival",
    tagline: "T-shirt blanc pur imprimé en sérigraphie haute durabilité",
    category: "TSHIRT",
    templateId: "tpl-tshirt",
    color: "#FFFFFF",
    technique: "SCREEN_PRINT",
    styleTag: "Événement",
    suggestedName: "T-shirt Festival / Staff 2026",
  },
  {
    id: "basket-black-gold",
    name: "Basket Street League",
    tagline: "Débardeur ample noir avec marquage or athlétique",
    category: "BASKETBALL_JERSEY",
    templateId: "tpl-basket",
    color: "#111827",
    technique: "HEAT_TRANSFER_VINYL",
    styleTag: "Basketball",
    suggestedName: "Débardeur Team League 3x3",
  },
  {
    id: "football-away-white",
    name: "Maillot Extérieur Sublimé",
    tagline: "Maillot blanc pur sublimé avec dégradés et motifs sans toucher",
    category: "FOOTBALL_JERSEY",
    templateId: "tpl-football",
    color: "#FFFFFF",
    technique: "SUBLIMATION",
    styleTag: "Club Foot",
    suggestedName: "Maillot Extérieur Sublimé 2026",
  },
];

/**
 * Génère 3 combinaisons intelligentes "Surprends-moi" basées sur
 * les couleurs de la marque du projet et les meilleurs accords textiles.
 */
export function generateSurpriseCombos(brandColors: string[] = []): OutfitPreset[] {
  const primaryBrandColor = brandColors[0] || "#0D6E5F";
  const secondaryBrandColor = brandColors[1] || "#1D4ED8";

  return [
    {
      id: "ai-brand-tshirt",
      name: "T-shirt Signature Marque",
      tagline: "Teinté aux couleurs exactes de votre charte graphique",
      category: "TSHIRT",
      templateId: "tpl-tshirt",
      color: primaryBrandColor,
      technique: "DTF",
      styleTag: "Corporate",
      suggestedName: "T-shirt Signature Marque",
      badge: "IA Recommandé",
    },
    {
      id: "ai-contrast-jersey",
      name: "Maillot Sport Pro",
      tagline: "Tenue haute performance accordée à votre seconde couleur",
      category: "FOOTBALL_JERSEY",
      templateId: "tpl-football",
      color: secondaryBrandColor,
      technique: "HEAT_TRANSFER_VINYL",
      styleTag: "Club Foot",
      suggestedName: "Maillot Pro Édition Club",
      badge: "IA Match",
    },
    {
      id: "ai-premium-black",
      name: "T-shirt Noir & Écusson Marque",
      tagline: "Fond noir profond avec contraste maximal de votre logo",
      category: "TSHIRT",
      templateId: "tpl-tshirt",
      color: "#111827",
      technique: "DTF",
      styleTag: "Streetwear",
      suggestedName: "T-shirt Minimaliste Noir",
      badge: "IA Épuré",
    },
  ];
}
