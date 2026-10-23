import type { PhotoAdjust, PhotoCrop, PhotoGlow, PhotoOutline } from "@/lib/render/photo";

// Module textile (Module 5, §16 du cahier des charges) : supports (vêtements), zones
// d'impression en mm, tenues et leurs éléments. Mêmes formes que l'API (apparel.service.ts).
// Repère d'une zone : X depuis l'axe du vêtement (positif = côté gauche du porteur), Y depuis le
// bas du col ; un élément est placé par son coin haut-gauche relativement à celui de sa zone.

export type ProductCategory =
  "TSHIRT" | "POLO" | "FOOTBALL_JERSEY" | "BASKETBALL_JERSEY" | "SHORTS" | "HOODIE" | "CAP" | "BAG" | "OTHER";
export type GarmentView = "FRONT" | "BACK" | "LEFT_SLEEVE" | "RIGHT_SLEEVE" | "SHORTS_FRONT" | "OTHER";
export type PrintTechnique =
  "SCREEN_PRINT" | "HEAT_TRANSFER_VINYL" | "FLOCK" | "DTF" | "DTG" | "SUBLIMATION" | "EMBROIDERY";
export type SizeScaling = "FIXED" | "PROPORTIONAL";
export type ElementKind = "LOGO" | "SPONSOR" | "TEXT" | "PLAYER_NAME" | "PLAYER_NUMBER" | "IMAGE" | "PATTERN";
export type ApparelStatus = "DRAFT" | "PROOF_SENT" | "APPROVED" | "IN_PRODUCTION";

export const TECHNIQUES: PrintTechnique[] = [
  "DTF",
  "SCREEN_PRINT",
  "DTG",
  "HEAT_TRANSFER_VINYL",
  "FLOCK",
  "SUBLIMATION",
  "EMBROIDERY",
];

export interface PrintZone {
  key: string;
  view: GarmentView;
  label: string;
  /** Axe de la zone depuis l'axe du vêtement (positif = gauche du porteur). */
  offsetXMm: number;
  /** Haut de la zone sous le col. */
  offsetYMm: number;
  maxWidthMm: number;
  maxHeightMm: number;
  scaling: SizeScaling;
}

export interface ProductSize {
  label: string;
  chestWidthMm: number;
  bodyLengthMm: number;
  sortOrder?: number;
}

export interface ApparelTemplate {
  id: string;
  category: ProductCategory;
  name: string;
  sizes: ProductSize[];
  zones: PrintZone[];
}

/** Photo d'un élément « image » : mêmes réglages que le Studio (retouche, détourage). */
export interface ApparelPhoto {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  adjust?: PhotoAdjust;
  crop?: PhotoCrop | null;
  straighten?: number;
  cutout?: string | null;
  outline?: PhotoOutline | null;
  glow?: PhotoGlow | null;
  flipX?: boolean;
  flipY?: boolean;
  /** Photo avant séparation en tons directs (pour revenir en arrière). */
  original?: Omit<ApparelPhoto, "original">;
}

/** Contenu libre d'un élément, lu par les contrôles de l'API (couleurs, trait, pixels, droits). */
export interface ApparelContent {
  /** Couleurs imprimées (HEX) : contraste avec le tissu, nombre d'écrans en sérigraphie. */
  colors?: string[];
  source?: "library" | "brand-kit" | "upload";
  rightsAttested?: boolean;
  /** Trait le plus fin, en mm. */
  strokeMm?: number;
  gradient?: boolean;
  /** Largeur utile de l'image en pixels (contrôle 300 dpi). */
  pixelWidth?: number;
  style?: string;
  /** Logo : SVG de la variante choisie. */
  svg?: string;
  logoId?: string;
  /** Déclinaison du logo (couleur, blanc, noir, symbole…). */
  logoVariant?: string;
  /** Texte. */
  text?: string;
  fontId?: string;
  fontWeight?: number;
  fill?: string;
  textOutline?: { color: string; widthMm: number } | null;
  /** Texte en arc, de -100 à 100. */
  curve?: number;
  /** Espacement des lettres, en em. */
  letterSpacing?: number;
  /** Image. */
  photo?: ApparelPhoto;
  /** Séparation en tons directs (sérigraphie) appliquée à l'image. */
  spotColors?: number;
}

export interface ApparelElement {
  id?: string;
  zoneKey: string;
  kind: ElementKind;
  content: ApparelContent;
  widthMm: number;
  heightMm: number;
  offsetXMm: number;
  offsetYMm: number;
  rotationDeg?: number;
  zIndex?: number;
}

export interface RulePreset {
  id: string;
  code: string;
  name: string;
}

export interface RosterEntry {
  playerName: string;
  /** Nom imprimé au dos. */
  displayName: string;
  number: string | null;
  size: string;
  quantity: number;
  role?: string | null;
}

export interface ApparelRoster {
  name: string;
  entries: RosterEntry[];
}

export interface RosterSummary {
  players: number;
  garments: number;
  bySize: Record<string, number>;
}

export interface ApparelDesignInput {
  templateId: string;
  rulePresetId?: string | null;
  name: string;
  technique: PrintTechnique;
  garmentColor: string;
}

export interface ApparelDesign {
  id: string;
  projectId: string;
  templateId: string;
  rulePresetId: string | null;
  name: string;
  technique: PrintTechnique;
  garmentColor: string;
  status: ApparelStatus;
  proofToken: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: { id: string; name: string; category: ProductCategory };
  rulePreset?: RulePreset | null;
  elements: ApparelElement[];
  roster?: ApparelRoster | null;
}

export interface ApparelDesignSummary {
  id: string;
  templateId: string;
  name: string;
  technique: PrintTechnique;
  garmentColor: string;
  status: ApparelStatus;
  updatedAt: string;
  template: { name: string; category: ProductCategory };
  _count: { elements: number };
}

export interface ApparelIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  elementId?: string;
  zoneKey?: string;
}

export interface ApparelCheck {
  ok: boolean;
  errors: ApparelIssue[];
  warnings: ApparelIssue[];
  disclaimer?: string;
  referenceSize: string;
}

/** BAT consulté sans compte (lien /bat/<jeton>). */
export interface PublicProof {
  name: string;
  technique: PrintTechnique;
  garmentColor: string;
  status: ApparelStatus;
  approvedAt: string | null;
  template: { name: string; category: ProductCategory; zones: PrintZone[] };
  elements: ApparelElement[];
  roster: {
    name: string;
    entries: Pick<RosterEntry, "displayName" | "number" | "size" | "quantity">[];
  } | null;
}
