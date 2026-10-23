import { contrastRatio, luminance } from "@/lib/render/color";
import type {
  ApparelElement,
  ApparelIssue,
  ElementKind,
  PrintTechnique,
  PrintZone,
  ProductSize,
} from "./types";

// Contrôles de conformité d'une tenue, calculés en direct pendant l'édition. Même règles que
// l'API (apparel-rules.ts), qui fait foi avant l'envoi du BAT et applique en plus les
// règlements sportifs et l'effectif.

/** Épaisseur minimale par défaut, réglable dans le profil atelier. */
export const MIN_STROKE_MM: Record<PrintTechnique, number> = {
  SCREEN_PRINT: 0.5,
  HEAT_TRANSFER_VINYL: 2,
  FLOCK: 3,
  DTF: 1,
  DTG: 0.5,
  SUBLIMATION: 0.3,
  EMBROIDERY: 1.5,
};

export const MIN_RASTER_DPI = 300;
export const MIN_EMBROIDERY_TEXT_MM = 5;
export const MIN_GARMENT_CONTRAST = 3;
const CUT_TECHNIQUES = new Set<PrintTechnique>(["HEAT_TRANSFER_VINYL", "FLOCK"]);
const AD_KINDS = new Set<ElementKind>(["LOGO", "SPONSOR", "IMAGE"]);
const TEXT_KINDS = new Set<ElementKind>(["TEXT", "PLAYER_NAME", "PLAYER_NUMBER"]);

/** Une zone pleine remplace les zones qu'elle recouvre. */
const FULL_ZONE_CONFLICTS: Record<string, string[]> = {
  front_full: ["left_chest", "right_chest", "front_sponsor"],
  back_full: ["back_sponsor"],
};

const isChildSize = (s: ProductSize) => /(?:ans|yrs|y)$/i.test(s.label);
const round = (value: number) => Math.round(value * 10) / 10;

/** Zone adaptée à une taille (TEX-03) : proportionnelle, ou fixe (réduite pour un enfant). */
export function resolveZone(zone: PrintZone, size: ProductSize, ref: ProductSize): PrintZone {
  const ratio = size.chestWidthMm / ref.chestWidthMm;
  let k = 1;
  if (zone.scaling === "PROPORTIONAL") k = ratio;
  else if (isChildSize(size)) k = Math.min(1, ratio);
  return {
    ...zone,
    offsetXMm: round(zone.offsetXMm * k),
    offsetYMm: round(
      zone.offsetYMm * (zone.scaling === "PROPORTIONAL" ? size.bodyLengthMm / ref.bodyLengthMm : 1),
    ),
    maxWidthMm: round(zone.maxWidthMm * k),
    maxHeightMm: round(zone.maxHeightMm * k),
  };
}

/** Résolution d'une image à sa taille imprimée, en dpi. */
export function printDpi(el: ApparelElement) {
  return el.content.pixelWidth && el.widthMm > 0 ? el.content.pixelWidth / (el.widthMm / 25.4) : null;
}

function elementIssues(
  el: ApparelElement,
  zone: PrintZone | undefined,
  technique: PrintTechnique,
  garmentColor: string,
): ApparelIssue[] {
  const ref = { elementId: el.id, zoneKey: el.zoneKey };
  if (!zone)
    return [
      {
        ...ref,
        code: "UNKNOWN_ZONE",
        severity: "error",
        message: `Zone ${el.zoneKey} absente de ce support`,
      },
    ];
  const issues: ApparelIssue[] = [];
  if (
    el.offsetXMm < 0 ||
    el.offsetYMm < 0 ||
    el.offsetXMm + el.widthMm > zone.maxWidthMm + 0.5 ||
    el.offsetYMm + el.heightMm > zone.maxHeightMm + 0.5
  ) {
    issues.push({
      ...ref,
      code: "OUT_OF_ZONE",
      severity: "error",
      message: `L'élément sort de la zone ${zone.label} (${zone.maxWidthMm} × ${zone.maxHeightMm} mm)`,
    });
  }
  const c = el.content;
  if (AD_KINDS.has(el.kind) && c.source === "upload" && !c.rightsAttested) {
    issues.push({
      ...ref,
      code: "RIGHTS_REQUIRED",
      severity: "error",
      message: "Logo ou image importé : attestez détenir les droits ou l'autorisation de son titulaire",
    });
  }
  for (const color of c.colors ?? []) {
    const ratio = contrastRatio(color, garmentColor);
    if (ratio < MIN_GARMENT_CONTRAST) {
      issues.push({
        ...ref,
        code: "LOW_CONTRAST",
        severity: "warning",
        message: `Contraste faible entre ${color} et le tissu ${garmentColor} (${ratio.toFixed(1)}:1)`,
      });
    }
  }
  const minStroke = MIN_STROKE_MM[technique];
  if (c.strokeMm !== undefined && c.strokeMm < minStroke) {
    issues.push({
      ...ref,
      code: "STROKE_TOO_THIN",
      severity: "error",
      message: `Trait de ${c.strokeMm} mm, minimum ${minStroke} mm pour cette technique`,
    });
  }
  if (CUT_TECHNIQUES.has(technique) && (el.kind === "IMAGE" || el.kind === "PATTERN" || c.gradient)) {
    issues.push({
      ...ref,
      code: "NOT_CUTTABLE",
      severity: "error",
      message: "Le flex et le flocage ne permettent ni image, ni motif, ni dégradé",
    });
  }
  if (technique === "EMBROIDERY" && TEXT_KINDS.has(el.kind) && el.heightMm < MIN_EMBROIDERY_TEXT_MM) {
    issues.push({
      ...ref,
      code: "EMBROIDERY_TEXT",
      severity: "error",
      message: `Texte brodé d'au moins ${MIN_EMBROIDERY_TEXT_MM} mm de haut`,
    });
  }
  const dpi = printDpi(el);
  if (dpi !== null && dpi < MIN_RASTER_DPI) {
    issues.push({
      ...ref,
      code: "LOW_RESOLUTION",
      severity: "error",
      message: `Image à ${Math.round(dpi)} dpi à taille réelle, ${MIN_RASTER_DPI} dpi requis`,
    });
  }
  return issues;
}

/** Contrôle d'une tenue (sans règlement sportif ni effectif, vérifiés par l'API). */
export function checkElements(
  zones: PrintZone[],
  elements: ApparelElement[],
  technique: PrintTechnique,
  garmentColor: string,
): ApparelIssue[] {
  const byKey = new Map(zones.map((z) => [z.key, z]));
  const used = new Set(elements.map((e) => e.zoneKey));
  const issues: ApparelIssue[] = [];
  for (const [full, conflicts] of Object.entries(FULL_ZONE_CONFLICTS)) {
    const clash = conflicts.filter((c) => used.has(c));
    if (used.has(full) && clash.length) {
      issues.push({
        code: "ZONE_OVERLAP",
        severity: "error",
        zoneKey: full,
        message: `La zone ${byKey.get(full)?.label ?? full} remplace ${clash.map((k) => byKey.get(k)?.label ?? k).join(", ")} : elles ne peuvent pas être utilisées ensemble`,
      });
    }
  }
  for (const el of elements)
    issues.push(...elementIssues(el, byKey.get(el.zoneKey), technique, garmentColor));
  const lum = luminance(garmentColor);
  if (technique === "SUBLIMATION" && lum < 0.6)
    issues.push({
      code: "SUBLIMATION_DARK",
      severity: "error",
      message: "La sublimation exige un tissu polyester clair",
    });
  if (technique === "DTG" && lum < 0.2)
    issues.push({
      code: "DTG_DARK",
      severity: "warning",
      message: "DTG sur tissu foncé : sous-couche blanche nécessaire",
    });
  return issues;
}
