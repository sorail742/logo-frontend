import type { ApparelElement, ApparelIssue } from "./types";

export type SportLeague = "NONE" | "FIFA" | "UEFA" | "FIBA" | "FFF" | "NBA";

export interface SportLeagueRule {
  league: SportLeague;
  name: string;
  description: string;
  badgeMaxAreaCm2: number;
  sponsorChestMaxAreaCm2: number;
  sponsorSleeveMaxAreaCm2?: number;
  numberBackMinHeightMm: number;
  numberBackMaxHeightMm: number;
  numberFrontMinHeightMm?: number;
  numberFrontMaxHeightMm?: number;
  numberStrokeMinMm?: number;
  playerNameMinHeightMm?: number;
  playerNameMaxHeightMm?: number;
  allowedNumberPattern?: RegExp;
}

export const SPORT_LEAGUES: Record<SportLeague, SportLeagueRule> = {
  NONE: {
    league: "NONE",
    name: "Standard / Libre",
    description: "Aucune contrainte réglementaire stricte de compétition.",
    badgeMaxAreaCm2: 250,
    sponsorChestMaxAreaCm2: 600,
    numberBackMinHeightMm: 120,
    numberBackMaxHeightMm: 350,
  },
  FIFA: {
    league: "FIFA",
    name: "FIFA (Football International)",
    description: "Règlement FIFA Equipement pour compétitions internationales et sélections.",
    badgeMaxAreaCm2: 100, // 100 cm² max pour l'écusson
    sponsorChestMaxAreaCm2: 200, // 200 cm² max pour le sponsor principal avant
    sponsorSleeveMaxAreaCm2: 100,
    numberBackMinHeightMm: 200, // 20-35 cm
    numberBackMaxHeightMm: 350,
    numberFrontMinHeightMm: 100, // 10-15 cm
    numberFrontMaxHeightMm: 150,
    numberStrokeMinMm: 25,
    playerNameMinHeightMm: 50,
    playerNameMaxHeightMm: 75,
    allowedNumberPattern: /^(?:[1-9]|[1-8][0-9]|99)$/,
  },
  UEFA: {
    league: "UEFA",
    name: "UEFA (Ligue des Champions & Coupes d'Europe)",
    description: "Kit Regulations UEFA Art. 28-36 (numérotation et sponsors).",
    badgeMaxAreaCm2: 100,
    sponsorChestMaxAreaCm2: 200,
    sponsorSleeveMaxAreaCm2: 100,
    numberBackMinHeightMm: 250,
    numberBackMaxHeightMm: 350,
    numberFrontMinHeightMm: 100,
    numberFrontMaxHeightMm: 150,
    numberStrokeMinMm: 30,
    playerNameMinHeightMm: 50,
    playerNameMaxHeightMm: 75,
    allowedNumberPattern: /^(?:[1-9]|[1-8][0-9]|99)$/,
  },
  FFF: {
    league: "FFF",
    name: "FFF (Fédération Française de Football)",
    description: "Règlement des tenues FFF (Ligue 1, Coupe de France, National).",
    badgeMaxAreaCm2: 100,
    sponsorChestMaxAreaCm2: 250,
    sponsorSleeveMaxAreaCm2: 100,
    numberBackMinHeightMm: 200,
    numberBackMaxHeightMm: 260,
    numberFrontMinHeightMm: 80,
    numberFrontMaxHeightMm: 120,
    playerNameMinHeightMm: 50,
    playerNameMaxHeightMm: 70,
    allowedNumberPattern: /^(?:[1-9]|[1-8][0-9]|99)$/,
  },
  FIBA: {
    league: "FIBA",
    name: "FIBA (Basketball International)",
    description: "Règlement officiel de basketball FIBA Art. 4.3 (numérotation obligatoire).",
    badgeMaxAreaCm2: 80,
    sponsorChestMaxAreaCm2: 150,
    numberBackMinHeightMm: 200,
    numberBackMaxHeightMm: 300,
    numberFrontMinHeightMm: 100,
    numberFrontMaxHeightMm: 180,
    playerNameMinHeightMm: 60,
    playerNameMaxHeightMm: 80,
    allowedNumberPattern: /^(?:0|00|[1-9]|[1-8][0-9]|99)$/,
  },
  NBA: {
    league: "NBA",
    name: "NBA (National Basketball Association)",
    description: "NBA Uniform Specifications (jersey patch, numéros avant/arrière).",
    badgeMaxAreaCm2: 60,
    sponsorChestMaxAreaCm2: 45, // Patch publicitaire d'épaule ~6.35 x 6.35 cm
    numberBackMinHeightMm: 180,
    numberBackMaxHeightMm: 280,
    numberFrontMinHeightMm: 100,
    numberFrontMaxHeightMm: 160,
    playerNameMinHeightMm: 50,
    playerNameMaxHeightMm: 75,
    allowedNumberPattern: /^(?:0|00|[1-9]|[1-8][0-9]|99)$/,
  },
};

/**
 * Calcule la surface en cm² d'un élément rectangulaire ou de sa boîte englobante.
 */
export function getElementAreaCm2(el: ApparelElement): number {
  return Math.round(((el.widthMm * el.heightMm) / 100) * 10) / 10;
}

/**
 * Valide les éléments d'une tenue au regard des règlements sportifs officiels.
 */
export function checkSportsRegulations(
  elements: ApparelElement[],
  league: SportLeague = "NONE",
): ApparelIssue[] {
  if (league === "NONE") return [];

  const rule = SPORT_LEAGUES[league];
  if (!rule) return [];

  const issues: ApparelIssue[] = [];

  for (const el of elements) {
    const ref = { elementId: el.id, zoneKey: el.zoneKey };
    const areaCm2 = getElementAreaCm2(el);

    // 1. Contrôle des sponsors
    if (el.kind === "SPONSOR") {
      const isSleeve = el.zoneKey.includes("sleeve");
      if (isSleeve && rule.sponsorSleeveMaxAreaCm2) {
        if (areaCm2 > rule.sponsorSleeveMaxAreaCm2) {
          issues.push({
            ...ref,
            code: "SPONSOR_SLEEVE_EXCEEDED",
            severity: "error",
            message: `Sponsor manche de ${areaCm2} cm² : maximum ${rule.sponsorSleeveMaxAreaCm2} cm² (${rule.name})`,
          });
        }
      } else if (!isSleeve && areaCm2 > rule.sponsorChestMaxAreaCm2) {
        issues.push({
          ...ref,
          code: "SPONSOR_CHEST_EXCEEDED",
          severity: "error",
          message: `Sponsor torse de ${areaCm2} cm² : maximum ${rule.sponsorChestMaxAreaCm2} cm² (${rule.name})`,
        });
      }
    }

    // 2. Contrôle de l'écusson / badge
    if (el.kind === "LOGO" && (el.zoneKey === "left_chest" || el.zoneKey === "right_chest")) {
      if (areaCm2 > rule.badgeMaxAreaCm2) {
        issues.push({
          ...ref,
          code: "BADGE_AREA_EXCEEDED",
          severity: "warning",
          message: `Écusson de ${areaCm2} cm² : recommandé max ${rule.badgeMaxAreaCm2} cm² (${rule.name})`,
        });
      }
    }

    // 3. Contrôle des numéros de joueurs
    if (el.kind === "PLAYER_NUMBER") {
      const isBack = el.zoneKey.includes("back");
      const isFront = el.zoneKey.includes("front") || el.zoneKey.includes("chest");

      if (isBack) {
        if (el.heightMm < rule.numberBackMinHeightMm) {
          issues.push({
            ...ref,
            code: "NUMBER_BACK_TOO_SMALL",
            severity: "error",
            message: `Numéro au dos de ${el.heightMm} mm : minimum réglementaire ${rule.numberBackMinHeightMm} mm (${rule.name})`,
          });
        } else if (el.heightMm > rule.numberBackMaxHeightMm) {
          issues.push({
            ...ref,
            code: "NUMBER_BACK_TOO_LARGE",
            severity: "warning",
            message: `Numéro au dos de ${el.heightMm} mm : maximum réglementaire ${rule.numberBackMaxHeightMm} mm (${rule.name})`,
          });
        }
      } else if (isFront && rule.numberFrontMinHeightMm) {
        if (el.heightMm < rule.numberFrontMinHeightMm) {
          issues.push({
            ...ref,
            code: "NUMBER_FRONT_TOO_SMALL",
            severity: "warning",
            message: `Numéro avant de ${el.heightMm} mm : minimum réglementaire ${rule.numberFrontMinHeightMm} mm (${rule.name})`,
          });
        }
      }

      // Format du numéro (ex: FIBA exige 0, 00 ou 1-99)
      const numStr = el.content.text?.trim();
      if (numStr && rule.allowedNumberPattern && !rule.allowedNumberPattern.test(numStr)) {
        issues.push({
          ...ref,
          code: "INVALID_SPORT_NUMBER",
          severity: "error",
          message: `Numéro « ${numStr} » non conforme aux règles de numérotation (${rule.name})`,
        });
      }
    }

    // 4. Contrôle du nom du joueur
    if (el.kind === "PLAYER_NAME") {
      if (rule.playerNameMinHeightMm && el.heightMm < rule.playerNameMinHeightMm) {
        issues.push({
          ...ref,
          code: "PLAYER_NAME_TOO_SMALL",
          severity: "warning",
          message: `Nom joueur de ${el.heightMm} mm : minimum réglementaire ${rule.playerNameMinHeightMm} mm (${rule.name})`,
        });
      }
      if (rule.playerNameMaxHeightMm && el.heightMm > rule.playerNameMaxHeightMm) {
        issues.push({
          ...ref,
          code: "PLAYER_NAME_TOO_LARGE",
          severity: "warning",
          message: `Nom joueur de ${el.heightMm} mm : maximum réglementaire ${rule.playerNameMaxHeightMm} mm (${rule.name})`,
        });
      }
    }
  }

  return issues;
}
