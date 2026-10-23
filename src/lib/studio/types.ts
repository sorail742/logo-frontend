import type { IconNode } from "@/lib/render/icons";
import type { PhotoAdjust, PhotoCrop, PhotoGlow, PhotoOutline } from "@/lib/render/photo";

// Document du Studio de création : pages, éléments positionnés en px dans le repère de la page
// (origine en haut à gauche, rotation autour du centre). Même contrat que l'API (render/design.ts),
// qui valide le document et en produit le PDF d'impression et le SVG vectorisé.

export interface GradientStop {
  /** Position de 0 à 1. */
  offset: number;
  color: string;
}

export type Paint =
  | { type: "none" }
  | { type: "solid"; color: string }
  /** Angle en degrés : 0 = de gauche à droite, 90 = de haut en bas. */
  | { type: "linear"; angle: number; stops: GradientStop[] }
  | { type: "radial"; stops: GradientStop[] };

export interface Stroke {
  color: string;
  width: number;
  dash?: "solid" | "dashed" | "dotted";
}

export interface Shadow {
  x: number;
  y: number;
  blur: number;
  color: string;
  opacity: number;
}

/** Modes de fusion des calques (mix-blend-mode CSS, rendus aussi par l'API). */
export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
] as const;
export type BlendMode = (typeof BLEND_MODES)[number];

/** Rôle sémantique d'un élément : redimensionnement magique, application de la marque, contrôles. */
export type ElementRole = "background" | "title" | "subtitle" | "body" | "logo" | "cta" | "photo" | "decor" | "info";

interface ElementBase {
  id: string;
  name?: string;
  role?: ElementRole;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrés, sens horaire, autour du centre. */
  rotation: number;
  opacity: number;
  flipX?: boolean;
  flipY?: boolean;
  locked?: boolean;
  hidden?: boolean;
  shadow?: Shadow | null;
  blend?: BlendMode;
}

export interface TextElement extends ElementBase {
  type: "text";
  text: string;
  fontId: string;
  fontWeight: number;
  fontSize: number;
  /** En em. */
  letterSpacing: number;
  /** Multiple du corps. */
  lineHeight: number;
  align: "left" | "center" | "right";
  uppercase: boolean;
  fill: Paint;
  stroke?: Stroke | null;
  /** Courbure de -100 à 100 (texte en arc, une seule ligne) ; 0 = droit. */
  curve?: number;
  /** Surlignage derrière le texte. */
  highlight?: { color: string; padding: number; radius: number } | null;
  /** Lignes calculées par l'éditeur : le serveur les reprend telles quelles. */
  lines?: string[];
}

export type ShapeKind = "rect" | "ellipse" | "triangle" | "polygon" | "star" | "line" | "arrow" | "blob" | "arch";

export interface ShapeElement extends ElementBase {
  type: "shape";
  shape: ShapeKind;
  fill: Paint;
  stroke?: Stroke | null;
  /** Rayon des coins (rect). */
  radius?: number;
  /** Côtés (polygon) ou branches (star). */
  sides?: number;
  /** Rayon intérieur relatif d'une étoile (0,2 à 0,9). */
  innerRatio?: number;
  /** Graine d'une forme organique (blob). */
  seed?: number;
}

export interface IconElement extends ElementBase {
  type: "icon";
  iconId: string;
  /** Tracés de l'icône (lucide, 24 × 24) : le document se suffit à lui-même. */
  node: IconNode;
  color: string;
  strokeWidth: number;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export interface ImageElement extends ElementBase {
  type: "image";
  /** data URL PNG ou JPEG (réduite à l'import). */
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  fit: "cover" | "contain";
  /** Point de cadrage en recouvrement, de 0 à 1. */
  focusX?: number;
  focusY?: number;
  mask: "none" | "circle" | "rounded" | "arch" | "blob";
  radius?: number;
  /** Anciens filtres simples (documents existants) ; remplacés par `adjust` à la première retouche. */
  filters?: ImageFilters;
  /** Réglages de retouche non destructifs (src/lib/render/photo.ts). */
  adjust?: PhotoAdjust;
  /** Recadrage dans l'image d'origine, en proportions. */
  crop?: PhotoCrop | null;
  /** Redressement, en degrés (-45 à 45). */
  straighten?: number;
  /** Masque de détourage : PNG en niveaux de gris (blanc = visible) aligné sur l'image entière. */
  cutout?: string | null;
  /** Contour « autocollant » autour de la forme visible. */
  outline?: PhotoOutline | null;
  glow?: PhotoGlow | null;
}

/** SVG prêt à l'emploi : logo du projet, cachet, illustration (balisage nettoyé). */
export interface SvgElement extends ElementBase {
  type: "svg";
  svg: string;
  source: "logo" | "stamp" | "graphic";
}

export type DesignElement = TextElement | ShapeElement | IconElement | ImageElement | SvgElement;
export type ElementType = DesignElement["type"];

export interface DesignPage {
  id: string;
  name?: string;
  background: Paint;
  elements: DesignElement[];
}

export interface PrintSpec {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
}

export interface DesignDoc {
  version: 1;
  width: number;
  height: number;
  /** Format imprimé : dimensions réelles et fond perdu (PDF d'impression). */
  print?: PrintSpec | null;
  pages: DesignPage[];
}

export interface StudioDesign {
  id: string;
  projectId: string;
  name: string;
  format: string;
  width: number;
  height: number;
  doc: DesignDoc;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Liste : sans le document. */
export type StudioDesignSummary = Omit<StudioDesign, "doc">;
