import type { ApparelTemplate, PrintZone, ProductSize } from "./types";

// Supports du mode démonstration : mêmes valeurs que le seed de l'API (apparel-defaults.ts),
// proposées pour un adulte M et à valider sur un vêtement réel.

export const REFERENCE_SIZE = "M";

export const DEFAULT_SIZES: ProductSize[] = [
  { label: "4 ANS", chestWidthMm: 330, bodyLengthMm: 460 },
  { label: "6 ANS", chestWidthMm: 360, bodyLengthMm: 490 },
  { label: "8 ANS", chestWidthMm: 390, bodyLengthMm: 520 },
  { label: "10 ANS", chestWidthMm: 420, bodyLengthMm: 560 },
  { label: "12 ANS", chestWidthMm: 450, bodyLengthMm: 600 },
  { label: "14 ANS", chestWidthMm: 480, bodyLengthMm: 640 },
  { label: "XS", chestWidthMm: 470, bodyLengthMm: 680 },
  { label: "S", chestWidthMm: 490, bodyLengthMm: 700 },
  { label: "M", chestWidthMm: 520, bodyLengthMm: 720 },
  { label: "L", chestWidthMm: 550, bodyLengthMm: 740 },
  { label: "XL", chestWidthMm: 580, bodyLengthMm: 760 },
  { label: "2XL", chestWidthMm: 610, bodyLengthMm: 780 },
  { label: "3XL", chestWidthMm: 640, bodyLengthMm: 800 },
];

const zone = (
  key: string,
  view: PrintZone["view"],
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  scaling: PrintZone["scaling"],
): PrintZone => ({
  key,
  view,
  label,
  offsetXMm: x,
  offsetYMm: y,
  maxWidthMm: w,
  maxHeightMm: h,
  scaling,
});

const Z = {
  right_chest: zone("right_chest", "FRONT", "Poitrine droite du porteur", -90, 70, 90, 90, "FIXED"),
  left_chest: zone("left_chest", "FRONT", "Cœur (poitrine gauche)", 90, 70, 90, 90, "FIXED"),
  front_sponsor: zone(
    "front_sponsor",
    "FRONT",
    "Sponsor ou logo principal",
    0,
    180,
    250,
    100,
    "PROPORTIONAL",
  ),
  front_number: zone("front_number", "FRONT", "Numéro devant", 0, 300, 200, 150, "FIXED"),
  front_full: zone("front_full", "FRONT", "Devant plein", 0, 80, 300, 380, "PROPORTIONAL"),
  nape: zone("nape", "BACK", "Nuque", 0, 20, 80, 40, "FIXED"),
  back_name: zone("back_name", "BACK", "Nom du joueur", 0, 70, 280, 75, "FIXED"),
  back_number: zone("back_number", "BACK", "Numéro dos", 0, 185, 300, 350, "FIXED"),
  back_sponsor: zone("back_sponsor", "BACK", "Sponsor dos", 0, 560, 200, 80, "PROPORTIONAL"),
  back_full: zone("back_full", "BACK", "Dos plein", 0, 60, 300, 380, "PROPORTIONAL"),
  sleeve_left: zone("sleeve_left", "LEFT_SLEEVE", "Manche gauche", 0, 80, 80, 80, "FIXED"),
  sleeve_right: zone("sleeve_right", "RIGHT_SLEEVE", "Manche droite", 0, 80, 80, 80, "FIXED"),
  shorts_number: zone("shorts_number", "SHORTS_FRONT", "Numéro de short", 0, 60, 150, 150, "FIXED"),
};

const adult = DEFAULT_SIZES.filter((s) => !s.label.includes("ANS"));

export const DEFAULT_TEMPLATES: ApparelTemplate[] = [
  {
    id: "tpl-tshirt",
    category: "TSHIRT",
    name: "T-shirt",
    sizes: DEFAULT_SIZES,
    zones: [
      Z.left_chest,
      Z.right_chest,
      Z.front_sponsor,
      Z.front_full,
      Z.nape,
      Z.back_full,
      Z.back_sponsor,
      Z.sleeve_left,
      Z.sleeve_right,
    ],
  },
  {
    id: "tpl-polo",
    category: "POLO",
    name: "Polo",
    sizes: adult,
    zones: [Z.left_chest, Z.right_chest, Z.back_full, Z.sleeve_left, Z.sleeve_right],
  },
  {
    id: "tpl-football",
    category: "FOOTBALL_JERSEY",
    name: "Maillot de football",
    sizes: DEFAULT_SIZES,
    zones: [
      Z.left_chest,
      Z.right_chest,
      Z.front_sponsor,
      Z.front_number,
      Z.nape,
      Z.back_name,
      Z.back_number,
      Z.back_sponsor,
      { ...Z.sleeve_left, maxWidthMm: 120 },
      { ...Z.sleeve_right, maxWidthMm: 120 },
    ],
  },
  {
    id: "tpl-basket",
    category: "BASKETBALL_JERSEY",
    name: "Maillot de basket",
    sizes: DEFAULT_SIZES,
    zones: [Z.front_sponsor, Z.front_number, Z.back_name, Z.back_number],
  },
  { id: "tpl-shorts", category: "SHORTS", name: "Short", sizes: DEFAULT_SIZES, zones: [Z.shorts_number] },
];

/** Couleurs de tissu courantes (catalogues des fournisseurs de textile vierge). */
export const GARMENT_COLORS = [
  "#ffffff",
  "#f3efe6",
  "#c9ccd1",
  "#6b7280",
  "#1f2937",
  "#111111",
  "#1e2a4a",
  "#1d4ed8",
  "#38bdf8",
  "#0f766e",
  "#166534",
  "#a3e635",
  "#facc15",
  "#f97316",
  "#dc2626",
  "#7f1d1d",
  "#db2777",
  "#7c3aed",
];
