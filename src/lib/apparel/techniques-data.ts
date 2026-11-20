import type { PrintTechnique, ProductCategory } from "./types";

export interface PrintTechniqueMeta {
  id: PrintTechnique;
  name: string;
  badge?: string;
  summary: string;
  description: string;
  priceTier: "€" | "€€" | "€€€";
  relativeCost: number; // multiplier for unit price estimate
  turnaroundDays: string;
  minQuantity: number;
  pros: string[];
  cons: string[];
  suitableFabrics: string;
  recommendedFor: ProductCategory[];
  incompatibleConditions?: {
    darkFabricOnly?: boolean;
    lightFabricOnly?: boolean;
    polyesterOnly?: boolean;
    cottonOnly?: boolean;
    noTinyDetails?: boolean;
  };
}

export const PRINT_TECHNIQUES_META: Record<PrintTechnique, PrintTechniqueMeta> = {
  DTF: {
    id: "DTF",
    name: "DTF (Transfert Numérique Direct)",
    badge: "Recommandé · Universel",
    summary: "Polyvalent : photos, dégradés et détails fins sans contrainte de couleur",
    description:
      "Impression numérique haute résolution sur film transféré à chaud. Adhérence ultra-forte sur coton et polyester.",
    priceTier: "€€",
    relativeCost: 1.0,
    turnaroundDays: "3-5 jours ouvrés",
    minQuantity: 1,
    pros: [
      "Fidélité photo & dégradés parfaits",
      "Compatible tissus clairs et foncés",
      "Dès 1 seule pièce",
      "Résistant aux lavages jusqu'à 60°C",
    ],
    cons: ["Légère sensation de matière sur les aplats très larges (A3)"],
    suitableFabrics: "Coton, polyester, élasthanne, mélanges",
    recommendedFor: ["TSHIRT", "POLO", "HOODIE", "OTHER"],
  },
  SCREEN_PRINT: {
    id: "SCREEN_PRINT",
    name: "Sérigraphie Artisanale",
    badge: "Le choix économique en série",
    summary: "La référence historique pour les séries : aplats éclatants et longévité maximale",
    description:
      "Dépôt d'encre direct à travers des écrans de soie. Imbattable pour les commandes d'équipes et événements à partir de 25 pièces.",
    priceTier: "€",
    relativeCost: 0.75, // cheaper in volume
    turnaroundDays: "6-8 jours ouvrés",
    minQuantity: 20,
    pros: [
      "Coût unitaire imbattable en volume",
      "Toucher textile doux très agréable",
      "Tenue dans le temps exceptionnelle",
    ],
    cons: ["Frais fixes d'écrans (déconseillé < 20 pièces)", "Pas de dégradés photo continus"],
    suitableFabrics: "Coton peigné, molleton, toile",
    recommendedFor: ["TSHIRT", "POLO", "BAG"],
  },
  SUBLIMATION: {
    id: "SUBLIMATION",
    name: "Sublimation Thermique",
    badge: "Maillots Sportifs & All-Over",
    summary: "Incrustation totale dans la fibre polyester : toucher 100% zéro matière",
    description:
      "L'encre gazeuse pénètre au cœur des microfibres. Zéro surépaisseur, le tissu reste parfaitement respirant et anti-transpirant.",
    priceTier: "€€",
    relativeCost: 1.15,
    turnaroundDays: "5-7 jours ouvrés",
    minQuantity: 1,
    pros: [
      "Aucune surépaisseur, respirabilité 100%",
      "Couleurs fluo et éclatantes inaltérables",
      "Idéal pour numéros, sponsors et motifs intégraux",
    ],
    cons: ["Incompatible coton ou tissus sombres", "Réservé aux textiles polyester clairs/blancs"],
    suitableFabrics: "100% Polyester micro-aéré clair/blanc",
    recommendedFor: ["FOOTBALL_JERSEY", "BASKETBALL_JERSEY", "SHORTS"],
    incompatibleConditions: {
      polyesterOnly: true,
      lightFabricOnly: true,
    },
  },
  EMBROIDERY: {
    id: "EMBROIDERY",
    name: "Broderie Haute Définition",
    badge: "Prestige Corporate & Luxe",
    summary: "Fils textiles tissés en relief pour un rendu prestigieux et inusable",
    description:
      "Piquage industriel au fil polyester résistant. Apporte une texture tactile, de la noblesse et une durabilité à vie.",
    priceTier: "€€€",
    relativeCost: 1.5,
    turnaroundDays: "6-9 jours ouvrés",
    minQuantity: 5,
    pros: [
      "Aspect premium et prestigieux",
      "Tenue à vie, résiste à l'ébullition",
      "Idéal écussons poitrine et logos compacts",
    ],
    cons: [
      "Détails fins < 5 mm impossibles",
      "Pas de photos ni de dégradés continus",
      "Déconseillé sur t-shirts très légers",
    ],
    suitableFabrics: "Polos en maille piquée, casquettes, sweats lourds",
    recommendedFor: ["POLO", "CAP"],
    incompatibleConditions: {
      noTinyDetails: true,
    },
  },
  HEAT_TRANSFER_VINYL: {
    id: "HEAT_TRANSFER_VINYL",
    name: "Flex / Vinyle Découpé",
    badge: "Noms & Numéros Officiels",
    summary: "Découpe numérique ultra-nette pour les numéros de maillots et noms de joueurs",
    description:
      "Film polyuréthane mat thermo-collé sous presse. Bords au rasoir parfaits pour le lettrage sportif.",
    priceTier: "€€",
    relativeCost: 0.95,
    turnaroundDays: "3-4 jours ouvrés",
    minQuantity: 1,
    pros: [
      "Contours chirurgicaux et opacité maximale",
      "Parfait pour numéros dos et noms individuels",
      "Finitions or, argent, réfléchissant ou fluo",
    ],
    cons: ["Unicolore ou bicolore uniquement", "Pas de motifs complexes ou photos"],
    suitableFabrics: "Maillots de sport, polyester et coton",
    recommendedFor: ["FOOTBALL_JERSEY", "BASKETBALL_JERSEY", "TSHIRT"],
  },
  FLOCK: {
    id: "FLOCK",
    name: "Flocage Velours 3D",
    badge: "Toucher Velours Rétro",
    summary: "Finition suédine en léger relief au toucher doux et texturé",
    description:
      "Microfibres douces pressées à chaud. Donne un aspect rétro élégant et tactile très apprécié.",
    priceTier: "€€",
    relativeCost: 1.1,
    turnaroundDays: "4-6 jours ouvrés",
    minQuantity: 1,
    pros: ["Toucher velours unique et doux", "Épaisseur et relief tactile 3D"],
    cons: ["Lavage délicat conseillé (à l'envers, 40°C max)"],
    suitableFabrics: "Polos, sweats, t-shirts épais",
    recommendedFor: ["POLO", "TSHIRT"],
  },
  DTG: {
    id: "DTG",
    name: "Impression Directe Textile (DTG)",
    badge: "Toucher Naturel Coton",
    summary: "Impression jet d'encre à base d'eau imprégnant directement le fil de coton",
    description:
      "L'imprimante textile dépose l'encre aqueuse directement dans la maille pour un toucher zéro matière.",
    priceTier: "€€€",
    relativeCost: 1.35,
    turnaroundDays: "4-6 jours ouvrés",
    minQuantity: 1,
    pros: ["Toucher coton 100% naturel", "Idéal créations artistiques et photos complexes"],
    cons: ["Réservé au coton à au moins 80%", "Coût unitaire plus élevé"],
    suitableFabrics: "100% Coton peigné",
    recommendedFor: ["TSHIRT"],
    incompatibleConditions: {
      cottonOnly: true,
    },
  },
};

/** Vérifie si une technique est compatible avec le support et la couleur choisis. */
export function checkTechniqueCompatibility(
  technique: PrintTechnique,
  category: ProductCategory,
  garmentHex: string,
): { compatible: boolean; reason?: string } {
  const meta = PRINT_TECHNIQUES_META[technique];
  if (!meta) return { compatible: true };

  // Sublimation n'est possible que sur du polyester clair
  if (technique === "SUBLIMATION") {
    const isPolyester =
      category === "FOOTBALL_JERSEY" || category === "BASKETBALL_JERSEY" || category === "SHORTS";
    if (!isPolyester) {
      return {
        compatible: false,
        reason:
          "La sublimation requiert un tissu 100% polyester (maillots ou shorts) et n'adhère pas sur le coton.",
      };
    }
    // Check luminance (only light colors for sublimation)
    const isDark = isColorDark(garmentHex);
    if (isDark) {
      return {
        compatible: false,
        reason:
          "La sublimation ne fonctionne que sur tissu blanc ou très clair (les encres étant transparentes).",
      };
    }
  }

  // DTG requiert du coton
  if (technique === "DTG") {
    if (category === "FOOTBALL_JERSEY" || category === "BASKETBALL_JERSEY" || category === "SHORTS") {
      return {
        compatible: false,
        reason:
          "L'impression DTG nécessite une fibre naturelle (coton) et ne tient pas sur le polyester sportif.",
      };
    }
  }

  return { compatible: true };
}

function isColorDark(hex: string): boolean {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  // Perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 120;
}
