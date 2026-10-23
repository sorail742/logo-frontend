import { rgbToHex } from "@/lib/render/color";
import { renderElement } from "@/lib/studio/render";
import { svgPixels } from "@/lib/studio/pixels";
import type { ImageElement } from "@/lib/studio/types";
import { omit } from "@/lib/object";
import type { ApparelPhoto } from "./types";

// Séparation en tons directs (sérigraphie) : la photo retouchée est rendue à 300 dpi à sa
// taille imprimée, puis réduite à quelques encres par k-moyennes. Chaque pixel prend l'encre la
// plus proche et devient opaque ou transparent : un écran par couleur, sans demi-teinte.

const PRINT_DPI = 300;
const MAX_SIDE = 3600;
const SAMPLES = 24_000;
const ITERATIONS = 12;

type Rgb = [number, number, number];

/** Distance perceptive simple (« redmean ») au carré. */
function distance(a: Rgb, r: number, g: number, b: number) {
  const mean = (a[0] + r) / 2;
  const dr = a[0] - r;
  const dg = a[1] - g;
  const db = a[2] - b;
  return (2 + mean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - mean) / 256) * db * db;
}

function nearest(centers: Rgb[], r: number, g: number, b: number) {
  let best = 0;
  let bestDistance = Infinity;
  for (const [i, center] of centers.entries()) {
    const d = distance(center, r, g, b);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

/** Échantillon régulier des pixels opaques. */
function sample(data: Uint8ClampedArray): Rgb[] {
  const opaque = Math.max(1, Math.floor(data.length / 4));
  const step = Math.max(1, Math.floor(opaque / SAMPLES));
  const points: Rgb[] = [];
  for (let i = 0; i < data.length; i += step * 4) {
    if (data[i + 3]! >= 128) points.push([data[i]!, data[i + 1]!, data[i + 2]!]);
  }
  return points;
}

/** Encres par k-moyennes, initialisées en s'éloignant des encres déjà choisies (k-means++ déterministe). */
export function inkColors(data: Uint8ClampedArray, count: number): Rgb[] {
  const points = sample(data);
  if (!points.length) return [];
  const centers: Rgb[] = [points[Math.floor(points.length / 2)]!];
  while (centers.length < Math.min(count, points.length)) {
    let far = points[0]!;
    let farDistance = -1;
    for (const p of points) {
      const d = distance(centers[nearest(centers, ...p)]!, ...p);
      if (d > farDistance) {
        farDistance = d;
        far = p;
      }
    }
    if (farDistance <= 0) break;
    centers.push([...far]);
  }
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of points) {
      const s = sums[nearest(centers, ...p)]!;
      s[0] += p[0];
      s[1] += p[1];
      s[2] += p[2];
      s[3]! += 1;
    }
    let moved = false;
    sums.forEach(([r, g, b, n], i) => {
      if (!n) return;
      const next: Rgb = [Math.round(r! / n), Math.round(g! / n), Math.round(b! / n)];
      if (next.some((v, c) => v !== centers[i]![c])) moved = true;
      centers[i] = next;
    });
    if (!moved) break;
  }
  return centers;
}

/** Taille de rendu à 300 dpi pour la taille imprimée (plafonnée). */
export function printPixels(widthMm: number, heightMm: number) {
  const scale = Math.min(1, MAX_SIDE / ((Math.max(widthMm, heightMm) / 25.4) * PRINT_DPI));
  const width = Math.max(1, Math.round((widthMm / 25.4) * PRINT_DPI * scale));
  const height = Math.max(1, Math.round((heightMm / 25.4) * PRINT_DPI * scale));
  return { width, height };
}

/**
 * Photo réduite à `count` encres. Les retouches, le recadrage, le détourage et le contour sont
 * appliqués (rendus) avant la réduction ; la photo d'origine est conservée pour revenir en arrière.
 */
export async function separateInks(
  el: ImageElement,
  photo: ApparelPhoto,
  sizeMm: { widthMm: number; heightMm: number },
  count: number,
) {
  const { width, height } = printPixels(sizeMm.widthMm, sizeMm.heightMm);
  const flat: ImageElement = { ...el, x: 0, y: 0, rotation: 0, opacity: 1, shadow: null, blend: "normal" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${el.width} ${el.height}" width="${width}" height="${height}">${renderElement(flat)}</svg>`;
  const pixels = await svgPixels(svg, Math.max(width, height));
  const centers = inkColors(pixels.data, count);
  const out = new Uint8ClampedArray(pixels.data.length);
  const { data } = pixels;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 128 || !centers.length) continue;
    const c = centers[nearest(centers, data[i]!, data[i + 1]!, data[i + 2]!)]!;
    out[i] = c[0];
    out[i + 1] = c[1];
    out[i + 2] = c[2];
    out[i + 3] = 255;
  }
  const canvas = document.createElement("canvas");
  canvas.width = pixels.width;
  canvas.height = pixels.height;
  canvas.getContext("2d")!.putImageData(new ImageData(out, pixels.width, pixels.height), 0, 0);
  const source = omit(photo, ["original"]);
  const separated: ApparelPhoto = {
    src: canvas.toDataURL("image/png"),
    naturalWidth: pixels.width,
    naturalHeight: pixels.height,
    original: photo.original ?? source,
  };
  return { photo: separated, colors: centers.map((c) => rgbToHex(...c).toLowerCase()) };
}
