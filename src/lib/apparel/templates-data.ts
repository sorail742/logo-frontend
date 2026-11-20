import type { ProductCategory } from "./types";

export interface GarmentTemplateMeta {
  id: string;
  category: ProductCategory;
  name: string;
  badge?: "Populaire" | "Nouveau" | "Pro" | "Sport";
  tagline: string;
  description: string;
  zonesCount: number;
  minPrice: number;
  leadDays: string;
  defaultCut: string;
  material: string;
  group: "TOPS" | "SPORT" | "BOTTOMS" | "ACCESSORIES";
}

export const GARMENT_METADATA: Record<string, GarmentTemplateMeta> = {
  "tpl-tshirt": {
    id: "tpl-tshirt",
    category: "TSHIRT",
    name: "T-shirt Col Rond",
    badge: "Populaire",
    tagline: "Le classique universel en coton peigné 180g/m²",
    description: "Idéal pour le merchandising, événements d'entreprise, festivals et tenues d'équipe.",
    zonesCount: 9,
    minPrice: 12.5,
    leadDays: "3-5 jours",
    defaultCut: "Unisexe (Coupe régulière)",
    material: "100% Coton peigné biologique",
    group: "TOPS",
  },
  "tpl-polo": {
    id: "tpl-polo",
    category: "POLO",
    name: "Polo Piqué Classique",
    badge: "Pro",
    tagline: "Élégance corporate et finitions soignées en maille piquée",
    description:
      "Col renforcé, patte de boutonnage 2 boutons, parfait pour équipes commerciales et hôtellerie.",
    zonesCount: 5,
    minPrice: 19.9,
    leadDays: "4-6 jours",
    defaultCut: "Coupe cintrée & ajustée",
    material: "100% Coton piqué 210g/m²",
    group: "TOPS",
  },
  "tpl-football": {
    id: "tpl-football",
    category: "FOOTBALL_JERSEY",
    name: "Maillot de Football Pro",
    badge: "Sport",
    tagline: "Tissu respirant ultra-léger avec technologie dry-fit",
    description:
      "Idéal pour clubs amateurs ou pros, tournois et académies sportives. Rendu éclatant des couleurs et numéros.",
    zonesCount: 10,
    minPrice: 24.0,
    leadDays: "5-7 jours",
    defaultCut: "Coupe athlétique ventilée",
    material: "100% Polyester micro-aéré 145g/m²",
    group: "SPORT",
  },
  "tpl-basket": {
    id: "tpl-basket",
    category: "BASKETBALL_JERSEY",
    name: "Maillot de Basket Débardeur",
    badge: "Sport",
    tagline: "Coupe débardeur ample en mesh respirant anti-transpiration",
    description: "Conçu pour la liberté de mouvement, idéal pour tournois 3x3, clubs et streetball.",
    zonesCount: 4,
    minPrice: 22.5,
    leadDays: "5-7 jours",
    defaultCut: "Coupe débardeur ample",
    material: "100% Polyester mesh alvéolé 160g/m²",
    group: "SPORT",
  },
  "tpl-shorts": {
    id: "tpl-shorts",
    category: "SHORTS",
    name: "Short Match & Entraînement",
    badge: "Sport",
    tagline: "Short technique léger avec ceinture élastique et cordon",
    description: "Complément parfait des maillots football ou basket pour une tenue complète et coordonnée.",
    zonesCount: 1,
    minPrice: 16.0,
    leadDays: "4-6 jours",
    defaultCut: "Coupe sportive au-dessus du genou",
    material: "100% Polyester interlock 140g/m²",
    group: "BOTTOMS",
  },
};

export type GarmentFilterCategory = "ALL" | "TOPS" | "SPORT" | "BOTTOMS" | "ACCESSORIES";

export const GARMENT_FILTER_TABS: { id: GarmentFilterCategory; label: string; count?: number }[] = [
  { id: "ALL", label: "Tous les supports" },
  { id: "TOPS", label: "Hauts & T-shirts" },
  { id: "SPORT", label: "Sport & Matchs" },
  { id: "BOTTOMS", label: "Bas & Shorts" },
  { id: "ACCESSORIES", label: "Accessoires (Bientôt)" },
];
