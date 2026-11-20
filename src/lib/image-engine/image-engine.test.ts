import { describe, expect, it } from "vitest";
import { detectImageFormat, sanitizeSvg, validateImageDimensions } from "./security";
import { analyzeImage, calculateEffectiveDpi, evaluateTechniqueCompatibility } from "./analysis";
import { removeBackground } from "./background-removal";
import { applyAdjustments, applyMonochrome, flipImage, rotateImage } from "./adjustments";
import { vectorizeImage } from "./vectorizer";
import { generateDtfWhiteUnderbase, matchNearestThread, prepareForTechnique } from "./technique-prep";
import { runImagePipeline } from "./pipeline";
import type { RawImageData } from "./types";

function createTestImage(
  width: number,
  height: number,
  fillRgba: [number, number, number, number],
): RawImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = fillRgba[0];
    data[idx + 1] = fillRgba[1];
    data[idx + 2] = fillRgba[2];
    data[idx + 3] = fillRgba[3];
  }
  return { width, height, data };
}

describe("Image Engine Security", () => {
  it("detects PNG magic bytes", () => {
    const pngBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;
    expect(detectImageFormat(pngBuffer)).toBe("PNG");
  });

  it("detects JPEG magic bytes", () => {
    const jpegBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    expect(detectImageFormat(jpegBuffer)).toBe("JPEG");
  });

  it("rejects decompression bomb dimensions", () => {
    expect(() => validateImageDimensions(9000, 500)).toThrow();
  });

  it("sanitizes dangerous SVG elements and script injections", () => {
    const dangerousSvg = `<svg><script>alert('xss')</script><circle cx="10" cy="10" r="5" onload="steal()"/></svg>`;
    const safeSvg = sanitizeSvg(dangerousSvg);
    expect(safeSvg).not.toContain("<script>");
    expect(safeSvg).not.toContain("onload");
    expect(safeSvg).toContain("<circle");
  });
});

describe("Image Analysis & DPI Calculation", () => {
  it("calculates correct DPI based on target physical print zone in mm", () => {
    // 1063 px sur 90 mm (cœur de t-shirt) = 300 DPI
    const dpi = calculateEffectiveDpi(1063, 90);
    expect(dpi).toBe(300);
  });

  it("identifies low DPI images", () => {
    // 200 px sur 300 mm = ~17 DPI
    const dpi = calculateEffectiveDpi(200, 300);
    expect(dpi).toBeLessThan(50);
  });

  it("flags technique incompatibilities (e.g. solid background for embroidery)", () => {
    const audit = evaluateTechniqueCompatibility({
      format: "JPEG",
      hasAlpha: false,
      hasSolidBackground: true,
      colorCount: 24,
      effectiveDpi: 120,
      activeTechnique: "EMBROIDERY",
    });

    expect(audit.EMBROIDERY.compliant).toBe(false);
    expect(audit.EMBROIDERY.warnings.length).toBeGreaterThan(0);
  });
});

describe("Local Background Removal", () => {
  it("removes white border background and sets alpha to 0", () => {
    const img = createTestImage(20, 20, [255, 255, 255, 255]);
    // Dessiner un carré rouge au centre (5 à 15)
    for (let y = 6; y < 14; y++) {
      for (let x = 6; x < 14; x++) {
        const idx = (y * 20 + x) * 4;
        img.data[idx] = 255;
        img.data[idx + 1] = 0;
        img.data[idx + 2] = 0;
      }
    }

    const result = removeBackground(img, {
      tolerance: 20,
      edgeSmooth: 0,
      feather: 0,
      decontaminate: false,
    });

    // Le coin (0,0) doit être devenu transparent
    expect(result.data[3]).toBe(0);
    // Le centre (10,10) doit rester opaque et rouge
    const centerIdx = (10 * 20 + 10) * 4;
    expect(result.data[centerIdx + 3]).toBe(255);
    expect(result.data[centerIdx]).toBe(255);
  });
});

describe("Image Adjustments & Monochrome", () => {
  it("applies brightness adjustment", () => {
    const img = createTestImage(4, 4, [100, 100, 100, 255]);
    const adjusted = applyAdjustments(img, { brightness: 50 });
    expect(adjusted.data[0]).toBeGreaterThan(100);
  });

  it("converts image to monochrome for single-color flock/screen printing", () => {
    const img = createTestImage(4, 4, [50, 50, 50, 255]);
    const mono = applyMonochrome(img, "#ff0000", 128);
    // Lum < 128 => pixel coloré en rouge (#ff0000)
    expect(mono.data[0]).toBe(255);
    expect(mono.data[1]).toBe(0);
    expect(mono.data[2]).toBe(0);
    expect(mono.data[3]).toBe(255);
  });

  it("rotates image by 90 degrees", () => {
    const img = createTestImage(4, 8, [10, 20, 30, 255]);
    const rotated = rotateImage(img, 90);
    expect(rotated.width).toBe(8);
    expect(rotated.height).toBe(4);
  });

  it("flips image horizontally", () => {
    const img = createTestImage(4, 4, [0, 0, 0, 255]);
    img.data[0] = 255; // coin haut gauche rouge
    const flipped = flipImage(img, true, false);
    // Le coin haut droit doit maintenant être rouge
    expect(flipped.data[3 * 4]).toBe(255);
  });
});

describe("Local Vectorizer", () => {
  it("vectorizes raster image into valid SVG format with paths", () => {
    const img = createTestImage(30, 30, [0, 0, 0, 0]);
    // Ajouter un disque noir au milieu
    for (let y = 5; y < 25; y++) {
      for (let x = 5; x < 25; x++) {
        const idx = (y * 30 + x) * 4;
        img.data[idx] = 10;
        img.data[idx + 1] = 10;
        img.data[idx + 2] = 10;
        img.data[idx + 3] = 255;
      }
    }

    const result = vectorizeImage(img, {
      colorsCount: 2,
      simplifyTolerance: 1.0,
      mode: "logo",
    });

    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("</svg>");
    expect(result.pathsCount).toBeGreaterThan(0);
  });
});

describe("Textile Technique Prep", () => {
  it("generates choked white underbase mask for DTF printing", () => {
    const img = createTestImage(20, 20, [0, 0, 0, 0]);
    for (let y = 4; y < 16; y++) {
      for (let x = 4; x < 16; x++) {
        const idx = (y * 20 + x) * 4;
        img.data[idx] = 200;
        img.data[idx + 3] = 255;
      }
    }

    const underbase = generateDtfWhiteUnderbase(img, 1);
    expect(underbase.mask.width).toBe(20);
    expect(underbase.chokePixels).toBe(1);
    expect(underbase.whiteInkAreaPercent).toBeGreaterThan(0);
    // Les pixels de bordure (4,4) doivent être érodés (choked)
    const edgeIdx = (4 * 20 + 4) * 4;
    expect(underbase.mask.data[edgeIdx + 3]).toBe(0);
  });

  it("matches nearest embroidery thread from Madeira catalog", () => {
    const thread = matchNearestThread(20, 80, 50); // Vert forêt
    expect(thread.brand).toBe("Madeira");
    expect(thread.code).toBe("1851"); // Forest Green
  });

  it("calculates embroidery stitches and density estimate", () => {
    const img = createTestImage(50, 50, [20, 80, 50, 255]);
    const prep = prepareForTechnique(img, "EMBROIDERY", { width: 90, height: 90 });
    expect(prep.embroideryPreview).toBeDefined();
    expect(prep.embroideryPreview?.estimatedStitches).toBeGreaterThan(5000);
  });
});

describe("Non-Destructive Image Pipeline", () => {
  it("executes operations chain and produces complete result", () => {
    const img = createTestImage(20, 20, [100, 100, 100, 255]);
    const result = runImagePipeline({
      originalImage: img,
      operations: [
        { id: "op1", type: "auto-enhance" },
        { id: "op2", type: "adjust", params: { brightness: 10 } },
      ],
      targetZoneMm: { width: 90, height: 90 },
      technique: "DTF",
    });

    expect(result.rawImage).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(result.hash).toBeDefined();
    expect(result.operations.length).toBe(2);
  });
});
