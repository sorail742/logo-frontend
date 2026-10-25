import { describe, expect, it } from "vitest";
import { contrastRatio, hexToCmyk, hexToRgb, luminance, normalizeHex } from "./color";
import { renderLogoSvg } from "./logo";
import { qrSvg, vcard, wifiPayload } from "./qr";
import { findOfficialTerms, INK_COLORS, renderStampSvg } from "./stamp";
import type { LogoSpec, StampData } from "@/lib/types";

describe("Color & Contrast Utilities", () => {
  it("normalise les couleurs hexadécimales", () => {
    expect(normalizeHex("#fff")).toBe("#ffffff");
    expect(normalizeHex("000")).toBe("#000000");
    expect(normalizeHex("#0F6B5C")).toBe("#0f6b5c");
  });

  it("convertit hex vers rgb et cmyk", () => {
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToCmyk("#000000")).toEqual([0, 0, 0, 100]);
  });

  it("calcule la luminance relative et le ratio de contraste", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1, 2);
    expect(luminance("#000000")).toBeCloseTo(0, 2);

    // Noir sur blanc : 21:1
    const maxContrast = contrastRatio("#000000", "#ffffff");
    expect(maxContrast).toBeCloseTo(21, 0);

    // Même couleur : 1:1
    const noContrast = contrastRatio("#123456", "#123456");
    expect(noContrast).toBeCloseTo(1, 1);
  });
});

describe("Stamp Rendering & Moderation", () => {
  it("détecte les termes officiels nécessitant une modération", () => {
    expect(findOfficialTerms("République de Guinée")).toContain("republique");
    expect(findOfficialTerms("Ministère des Sports")).toContain("ministere");
    expect(findOfficialTerms("Association sportive du quartier")).toHaveLength(0);
  });

  it("génère le SVG d'un cachet rond avec encrage", () => {
    const stampData: StampData = {
      shape: "round",
      ringText: "Association des Jeunes Cadres",
      bottomText: "Conakry · Guinée",
      centerText: "AJC",
      centerMode: "acronym",
      ink: "blue",
      inkEffect: false,
    };

    const svg = renderStampSvg(stampData, { idPrefix: "test-stamp" });
    expect(svg).toContain("<svg");
    expect(svg).toContain(INK_COLORS.blue);
    expect(svg).toContain("Association des Jeunes Cadres");
    expect(svg).toContain("AJC");
  });
});

describe("QR Code Generator", () => {
  it("produit un SVG vectoriel valide pour une URL", () => {
    const svg = qrSvg("https://exemple.gn");
    expect(svg).toContain("<svg");
    expect(svg).toContain("<path d=");
    expect(svg).toContain('fill="#111111"');
  });

  it("génère une fiche vCard formatée", () => {
    const card = vcard({
      fullName: "Alpha Diallo",
      organization: "Tech Guinée",
      phone: "+224620000000",
      email: "alpha@tech.gn",
    });

    expect(card).toContain("BEGIN:VCARD");
    expect(card).toContain("FN:Alpha Diallo");
    expect(card).toContain("TEL;TYPE=CELL:+224620000000");
    expect(card).toContain("END:VCARD");
  });

  it("génère une chaîne Wi-Fi WPA valide", () => {
    const payload = wifiPayload("MonBureau", "Secret1234");
    expect(payload).toBe("WIFI:T:WPA;S:MonBureau;P:Secret1234;;");
  });
});

describe("Logo SVG Renderer", () => {
  it("génère un logo de type ICON_TEXT", () => {
    const spec: LogoSpec = {
      type: "ICON_TEXT",
      text: "Baobab",
      tagline: "Innovation",
      fontId: "montserrat",
      fontWeight: 700,
      letterSpacing: 0,
      uppercase: false,
      iconId: "sprout",
      iconScale: 1,
      iconFrame: "circle",
      layout: "horizontal",
      colors: {
        primary: "#15803d",
        secondary: "#ca8a04",
        text: "#14532d",
        background: "#ffffff",
      },
    };

    const { svg, width, height } = renderLogoSvg(spec);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(svg).toContain("<svg");
    expect(svg).toContain("Baobab");
    expect(svg).toContain("INNOVATION");
  });
});
