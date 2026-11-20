import { describe, expect, it } from "vitest";
import { checkElements, resolveZone } from "./rules";
import type { ApparelElement, PrintZone, ProductSize } from "./types";

describe("Apparel Rules & Zone Resolution", () => {
  const adultM: ProductSize = { label: "M", chestWidthMm: 530, bodyLengthMm: 720 };
  const adultXL: ProductSize = { label: "XL", chestWidthMm: 600, bodyLengthMm: 760 };
  const child10: ProductSize = { label: "10 ans", chestWidthMm: 420, bodyLengthMm: 580 };

  const fixedZone: PrintZone = {
    key: "left_chest",
    view: "FRONT",
    label: "Cœur",
    offsetXMm: 90,
    offsetYMm: 70,
    maxWidthMm: 90,
    maxHeightMm: 90,
    scaling: "FIXED",
  };

  const propZone: PrintZone = {
    key: "front_sponsor",
    view: "FRONT",
    label: "Sponsor",
    offsetXMm: 0,
    offsetYMm: 180,
    maxWidthMm: 250,
    maxHeightMm: 100,
    scaling: "PROPORTIONAL",
  };

  describe("resolveZone", () => {
    it("conserve la taille fixe pour un adulte XL", () => {
      const resolved = resolveZone(fixedZone, adultXL, adultM);
      expect(resolved.maxWidthMm).toBe(90);
      expect(resolved.maxHeightMm).toBe(90);
    });

    it("réduit la taille fixe pour un enfant (10 ans)", () => {
      const resolved = resolveZone(fixedZone, child10, adultM);
      const expectedRatio = 420 / 530;
      expect(resolved.maxWidthMm).toBeCloseTo(90 * expectedRatio, 0);
    });

    it("agrandit la zone proportionnelle pour un adulte XL", () => {
      const resolved = resolveZone(propZone, adultXL, adultM);
      const ratio = 600 / 530;
      expect(resolved.maxWidthMm).toBeCloseTo(250 * ratio, 0);
    });
  });

  describe("checkElements", () => {
    const zones = [fixedZone, propZone];

    it("signale un élément qui déborde de sa zone", () => {
      const element: ApparelElement = {
        id: "el-1",
        kind: "LOGO",
        zoneKey: "left_chest",
        offsetXMm: 10,
        offsetYMm: 10,
        widthMm: 100, // dépasse maxWidthMm de 90
        heightMm: 50,
        content: { colors: ["#ffffff"] },
      };

      const issues = checkElements(zones, [element], "DTF", "#111111");
      const outOfZone = issues.find((i) => i.code === "OUT_OF_ZONE");
      expect(outOfZone).toBeDefined();
      expect(outOfZone?.severity).toBe("error");
    });

    it("signale un contraste insuffisant entre le texte et le tissu", () => {
      const element: ApparelElement = {
        id: "el-2",
        kind: "TEXT",
        zoneKey: "left_chest",
        offsetXMm: 5,
        offsetYMm: 5,
        widthMm: 50,
        heightMm: 20,
        content: { text: "Texte", colors: ["#222222"] },
      };

      // Tissu noir (#111111) et texte foncé (#222222)
      const issues = checkElements(zones, [element], "DTF", "#111111");
      const contrastIssue = issues.find((i) => i.code === "LOW_CONTRAST");
      expect(contrastIssue).toBeDefined();
      expect(contrastIssue?.severity).toBe("warning");
    });

    it("alerte si le flex est utilisé avec un dégradé", () => {
      const element: ApparelElement = {
        id: "el-3",
        kind: "TEXT",
        zoneKey: "front_sponsor",
        offsetXMm: 0,
        offsetYMm: 0,
        widthMm: 100,
        heightMm: 40,
        content: { text: "SPONSOR", colors: ["#ffffff"], gradient: true },
      };

      const issues = checkElements(zones, [element], "HEAT_TRANSFER_VINYL", "#000000");
      const notCuttable = issues.find((i) => i.code === "NOT_CUTTABLE");
      expect(notCuttable).toBeDefined();
      expect(notCuttable?.severity).toBe("error");
    });

    it("bloque la sublimation sur tissu sombre", () => {
      const issues = checkElements(zones, [], "SUBLIMATION", "#111111");
      const subDark = issues.find((i) => i.code === "SUBLIMATION_DARK");
      expect(subDark).toBeDefined();
      expect(subDark?.severity).toBe("error");
    });

    it("autorise la sublimation sur tissu blanc ou très clair", () => {
      const issues = checkElements(zones, [], "SUBLIMATION", "#ffffff");
      const subDark = issues.find((i) => i.code === "SUBLIMATION_DARK");
      expect(subDark).toBeUndefined();
    });

    it("vérifie le dépassement de surface sponsor selon le règlement UEFA (max 200 cm²)", () => {
      const element: ApparelElement = {
        id: "el-sponsor-oversized",
        kind: "SPONSOR",
        zoneKey: "front_sponsor",
        offsetXMm: 0,
        offsetYMm: 0,
        widthMm: 250,
        heightMm: 100, // 250 * 100 = 25 000 mm² = 250 cm² > 200 cm²
        content: { text: "BIG SPONSOR", colors: ["#ffffff"] },
      };

      const issues = checkElements(zones, [element], "DTF", "#000000", "UEFA");
      const sponsorIssue = issues.find((i) => i.code === "SPONSOR_CHEST_EXCEEDED");
      expect(sponsorIssue).toBeDefined();
      expect(sponsorIssue?.severity).toBe("error");
    });

    it("valide la conformité d'un numéro dos selon UEFA (hauteur min 250 mm)", () => {
      const smallNumber: ApparelElement = {
        id: "el-num-small",
        kind: "PLAYER_NUMBER",
        zoneKey: "back_full",
        offsetXMm: 10,
        offsetYMm: 10,
        widthMm: 120,
        heightMm: 200, // < 250 mm
        content: { text: "10", colors: ["#ffffff"] },
      };

      const issues = checkElements(zones, [smallNumber], "DTF", "#000000", "UEFA");
      const numIssue = issues.find((i) => i.code === "NUMBER_BACK_TOO_SMALL");
      expect(numIssue).toBeDefined();
      expect(numIssue?.severity).toBe("error");
    });

    it("rejette un numéro non autorisé en FIBA (ex: 105)", () => {
      const invalidNumber: ApparelElement = {
        id: "el-num-fiba-invalid",
        kind: "PLAYER_NUMBER",
        zoneKey: "back_full",
        offsetXMm: 10,
        offsetYMm: 10,
        widthMm: 120,
        heightMm: 220,
        content: { text: "105", colors: ["#ffffff"] },
      };

      const issues = checkElements(zones, [invalidNumber], "DTF", "#000000", "FIBA");
      const invalidIssue = issues.find((i) => i.code === "INVALID_SPORT_NUMBER");
      expect(invalidIssue).toBeDefined();
      expect(invalidIssue?.severity).toBe("error");
    });
  });
});
