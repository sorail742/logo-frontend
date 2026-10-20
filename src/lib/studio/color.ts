import { contrastRatio, hexToRgb, mix, normalizeHex, rgbToHex } from "@/lib/render/color";
import type { Paint } from "./types";

// Couleurs du Studio : conversions HSL, harmonies, teintes et écart perçu (CIE76),
// pour les nuanciers, les variations et le contrôle des couleurs hors marque.

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lig = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

const rotate = (hex: string, degrees: number) => {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h + degrees, s, l);
};

export type HarmonyKind = "complementary" | "analogous" | "triadic" | "split" | "tints" | "shades";

/** Couleurs en harmonie avec une couleur de base (roue chromatique). */
export function harmony(hex: string, kind: HarmonyKind): string[] {
  const base = normalizeHex(hex);
  switch (kind) {
    case "complementary":
      return [base, rotate(base, 180)];
    case "analogous":
      return [rotate(base, -30), base, rotate(base, 30)];
    case "triadic":
      return [base, rotate(base, 120), rotate(base, 240)];
    case "split":
      return [base, rotate(base, 150), rotate(base, 210)];
    case "tints":
      return [0.2, 0.4, 0.6, 0.8].map((t) => mix(base, "#ffffff", t));
    case "shades":
      return [0.2, 0.4, 0.6, 0.8].map((t) => mix(base, "#000000", t));
  }
}

// ─── Écart perçu (CIELAB, D65) ───

function toLab(hex: string): [number, number, number] {
  const lin = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const [r, g, b] = lin;
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Écart de couleur perçu (ΔE 1976) : < 2 imperceptible, > 10 nettement différent. */
export function deltaE(a: string, b: string) {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Couleur de la palette la plus proche d'une couleur donnée. */
export function nearestColor(hex: string, palette: string[]) {
  let best = { color: palette[0] ?? hex, distance: Infinity };
  for (const color of palette) {
    const distance = deltaE(hex, color);
    if (distance < best.distance) best = { color, distance };
  }
  return best;
}

/** Les neutres (blanc, noir, gris) vont avec toutes les marques. */
export function isNeutral(hex: string) {
  const [, s, l] = hexToHsl(hex);
  return s < 8 || l < 6 || l > 96;
}

/** Couleur dominante d'une peinture (moyenne des arrêts d'un dégradé). */
export function paintColor(paint: Paint): string | null {
  if (paint.type === "solid") return paint.color;
  if (paint.type === "none") return null;
  const [first, ...rest] = paint.stops;
  if (!first) return null;
  return rest.reduce((acc, stop, i) => mix(acc, stop.color, 1 / (i + 2)), first.color);
}

/** Couleur la plus lisible de la palette sur un fond, sinon noir ou blanc. */
export function readableFrom(palette: string[], background: string, ratio = 4.5) {
  const candidates = [...palette].sort((a, b) => contrastRatio(b, background) - contrastRatio(a, background));
  const best = candidates[0];
  if (best && contrastRatio(best, background) >= ratio) return best;
  return contrastRatio("#ffffff", background) >= contrastRatio("#111827", background) ? "#ffffff" : "#111827";
}
