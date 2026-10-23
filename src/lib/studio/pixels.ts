import type { PhotoAdjust } from "@/lib/render/photo";

// Analyse et détourage des photos dans le navigateur : histogramme, amélioration automatique,
// pipette de balance des blancs, suppression d'un fond uni, baguette magique, pinceaux et
// lissage du masque. Le masque (0 = effacé, 255 = visible) est enregistré en PNG dans l'élément.

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Histogram {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  /** Luminance (Rec. 709). */
  l: Uint32Array;
  total: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = src;
  });
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d", { willReadFrequently: true })! };
}

/** Pixels d'une image (data URL ou URL d'objet), réduits à `maxSide` si besoin. */
export async function loadPixels(src: string, maxSide = Infinity): Promise<Pixels> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const { ctx } = canvasOf(width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height };
}

/** Pixels d'un SVG autonome (rendu d'un élément retouché), pour l'histogramme du résultat. */
export async function svgPixels(svg: string, maxSide: number): Promise<Pixels> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    return await loadPixels(url, maxSide);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function histogram(px: Pixels): Histogram {
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  const l = new Uint32Array(256);
  let total = 0;
  const { data } = px;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 128) continue;
    r[data[i]!]!++;
    g[data[i + 1]!]!++;
    b[data[i + 2]!]!++;
    l[Math.round(luma(data[i]!, data[i + 1]!, data[i + 2]!))]!++;
    total++;
  }
  return { r, g, b, l, total };
}

function percentile(counts: Uint32Array, total: number, fraction: number) {
  let sum = 0;
  const target = total * fraction;
  for (let i = 0; i < 256; i++) {
    sum += counts[i]!;
    if (sum >= target) return i;
  }
  return 255;
}

/** Réglages de balance des blancs qui rendent neutre la couleur (r, g, b) choisie à la pipette. */
export function neutralize(r: number, g: number, b: number): { temperature: number; tint: number } {
  // Gains de photo.ts : R = 1 + 0,18 t + 0,06 m ; G = 1 + 0,02 t − 0,14 m ; B = 1 − 0,2 t + 0,06 m.
  const [r1, g1, b1] = [Math.max(r, 1), Math.max(g, 1), Math.max(b, 1)];
  const a11 = 0.18 * r1 - 0.02 * g1;
  const a12 = 0.06 * r1 + 0.14 * g1;
  const a21 = -0.2 * b1 - 0.02 * g1;
  const a22 = 0.06 * b1 + 0.14 * g1;
  const det = a11 * a22 - a12 * a21;
  if (Math.abs(det) < 1e-6) return { temperature: 0, tint: 0 };
  const c1 = g1 - r1;
  const c2 = g1 - b1;
  const t = (c1 * a22 - a12 * c2) / det;
  const m = (a11 * c2 - c1 * a21) / det;
  return { temperature: Math.round(clamp(t, -1, 1) * 100), tint: Math.round(clamp(m, -1, 1) * 100) };
}

/** Luminance cumulée, saturation cumulée et moyenne des tons moyens (balance des blancs). */
function toneStats(px: Pixels) {
  let sum = 0;
  let sat = 0;
  let count = 0;
  const avg: [number, number, number] = [0, 0, 0];
  const { data } = px;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 128) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const y = luma(r, g, b);
    sum += y;
    sat += (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    // Balance des blancs estimée sur les tons moyens (ni noirs ni blancs brûlés).
    if (y > 50 && y < 215) {
      avg[0] += r;
      avg[1] += g;
      avg[2] += b;
      count++;
    }
  }
  return { sum, sat, count, avg };
}

/** Correction partielle : la dominante d'une scène (coucher de soleil) n'est pas une erreur. */
function partialWhiteBalance(avg: [number, number, number], count: number): PhotoAdjust {
  const wb = neutralize(avg[0] / count, avg[1] / count, avg[2] / count);
  const temperature = Math.round(clamp(wb.temperature * 0.5, -30, 30));
  const tint = Math.round(clamp(wb.tint * 0.5, -25, 25));
  return { ...(Math.abs(temperature) >= 3 && { temperature }), ...(Math.abs(tint) >= 3 && { tint }) };
}

/** Amélioration automatique : niveaux étirés, tons moyens, balance des blancs, vibrance, netteté. */
export function autoAdjust(px: Pixels): PhotoAdjust {
  const h = histogram(px);
  if (!h.total) return {};
  const lo = percentile(h.l, h.total, 0.005);
  const hi = percentile(h.l, h.total, 0.995);
  const adjust: PhotoAdjust = { sharpen: 15, clarity: 8 };
  if (hi - lo > 16 && (lo > 4 || hi < 250)) {
    // Niveaux étirés aux deux tiers : un étirement complet durcit les images peu contrastées.
    adjust.curves = {
      rgb: [
        { x: (lo / 255) * 0.66, y: 0 },
        { x: 1 - (1 - hi / 255) * 0.66, y: 1 },
      ],
    };
  }
  const { sum, sat, count, avg } = toneStats(px);
  const mean = sum / h.total / 255;
  const [low, high] = [lo * 0.66, 255 - (255 - hi) * 0.66];
  const stretched = (mean * 255 - low) / (high - low);
  const brightness = Math.round(clamp((0.47 - stretched) * 160, -40, 40));
  if (Math.abs(brightness) >= 3) adjust.brightness = brightness;
  if (count > h.total * 0.05) Object.assign(adjust, partialWhiteBalance(avg, count));
  adjust.vibrance = sat / h.total < 0.3 ? 18 : 6;
  return adjust;
}

// ─── Détourage ───

/** Écart perçu entre deux couleurs (« redmean », de 0 à 765). */
function distance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

/** Tolérance (0 à 100) en écart de couleur. */
const threshold = (tolerance: number) => (clamp(tolerance, 0, 100) / 100) * 380;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** Couleur du fond : médiane des pixels du pourtour de l'image. */
export function backgroundColor(px: Pixels): [number, number, number] {
  const { data, width, height } = px;
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  const step = Math.max(1, Math.floor((width + height) / 800));
  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    r.push(data[i]!);
    g.push(data[i + 1]!);
    b.push(data[i + 2]!);
  };
  for (let x = 0; x < width; x += step) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    push(0, y);
    push(width - 1, y);
  }
  return [median(r), median(g), median(b)];
}

/** Masque entièrement visible. */
export const fullMask = (px: Pixels) => new Uint8ClampedArray(px.width * px.height).fill(255);

/**
 * Remplissage par diffusion depuis des germes : un pixel est gagné s'il est proche de la couleur de
 * référence, ou, dans un dégradé doux, proche de son voisin déjà gagné. Renvoie les pixels gagnés.
 */
function flood(px: Pixels, seeds: number[], ref: [number, number, number], limit: number): Uint8Array {
  const { data, width, height } = px;
  const won = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const gain = (j: number) => {
    won[j] = 1;
    queue[tail] = j;
    tail += 1;
  };
  for (const seed of seeds) {
    if (!won[seed] && distance(...colorAt(data, seed), ...ref) < limit) gain(seed);
  }
  while (head < tail) {
    const i = queue[head]!;
    head += 1;
    for (const j of neighbours(i, width, height)) {
      if (!won[j] && accepts(data, i, j, ref, limit)) gain(j);
    }
  }
  return won;
}

function colorAt(data: Uint8ClampedArray, i: number): [number, number, number] {
  return [data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!];
}

/** Voisins directs d'un pixel (gauche, droite, haut, bas) dans l'image. */
function neighbours(i: number, width: number, height: number) {
  const x = i % width;
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < width - 1) out.push(i + 1);
  if (i >= width) out.push(i - width);
  if (i + width < width * height) out.push(i + width);
  return out;
}

/** Pixel gagné : proche du fond, ou proche de son voisin gagné dans un dégradé doux. */
function accepts(data: Uint8ClampedArray, from: number, to: number, ref: [number, number, number], limit: number) {
  const color = colorAt(data, to);
  const d = distance(...color, ...ref);
  return d < limit || (distance(...color, ...colorAt(data, from)) < limit * 0.25 && d < limit * 2.2);
}

/** Bords adoucis : les pixels voisins de la zone retirée prennent une opacité selon leur écart au fond. */
function softenEdges(px: Pixels, mask: Uint8ClampedArray, won: Uint8Array, ref: [number, number, number], limit: number) {
  const { data, width, height } = px;
  for (let i = 0; i < won.length; i++) {
    if (won[i]) continue;
    const x = i % width;
    const edge = (x > 0 && won[i - 1]) || (x < width - 1 && won[i + 1]) || (i >= width && won[i - width]) || (i + width < width * height && won[i + width]);
    if (!edge) continue;
    const d = distance(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!, ...ref);
    const alpha = clamp((d - limit * 0.5) / limit, 0, 1);
    mask[i] = Math.min(mask[i]!, Math.round(alpha * 255));
  }
}

/** Suppression d'un fond uni (logo scanné, produit sur fond blanc) depuis le pourtour de l'image. */
export function removeBackground(px: Pixels, tolerance: number, options: { holes?: boolean } = {}): Uint8ClampedArray {
  const { data, width, height } = px;
  const ref = backgroundColor(px);
  const limit = threshold(tolerance);
  const seeds: number[] = [];
  for (let x = 0; x < width; x++) seeds.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) seeds.push(y * width, y * width + width - 1);
  const won = flood(px, seeds, ref, limit);
  if (options.holes) {
    // Zones intérieures (creux d'un « O ») de la couleur du fond, même sans lien avec le bord.
    for (let i = 0; i < won.length; i++) {
      if (!won[i] && distance(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!, ...ref) < limit * 0.8) won[i] = 1;
    }
  }
  const mask = fullMask(px);
  for (let i = 0; i < won.length; i++) if (won[i]) mask[i] = 0;
  softenEdges(px, mask, won, ref, limit);
  return mask;
}

/** Baguette magique : retire (ou rétablit) la zone de couleur proche du point cliqué. */
export function magicWand(
  px: Pixels,
  mask: Uint8ClampedArray,
  x: number,
  y: number,
  tolerance: number,
  options: { contiguous: boolean; restore: boolean },
) {
  const { data, width, height } = px;
  const cx = clamp(Math.round(x), 0, width - 1);
  const cy = clamp(Math.round(y), 0, height - 1);
  const start = cy * width + cx;
  const ref: [number, number, number] = [data[start * 4]!, data[start * 4 + 1]!, data[start * 4 + 2]!];
  const limit = Math.max(8, threshold(tolerance));
  let won: Uint8Array;
  if (options.contiguous) {
    won = flood(px, [start], ref, limit);
  } else {
    won = new Uint8Array(width * height);
    for (let i = 0; i < won.length; i++) {
      if (distance(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!, ...ref) < limit) won[i] = 1;
    }
  }
  const value = options.restore ? 255 : 0;
  for (let i = 0; i < won.length; i++) if (won[i]) mask[i] = value;
  if (!options.restore) softenEdges(px, mask, won, ref, limit);
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Pinceau gomme (value 0) ou restauration (value 255) le long d'un segment. Dureté de 0 à 1 :
 * part du rayon peinte à pleine opacité. Renvoie la zone modifiée (pour un rafraîchissement partiel).
 */
export function paintMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
  radius: number,
  hardness: number,
  value: 0 | 255,
): Box {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(length / Math.max(1, radius / 4)));
  const box = { x0: width, y0: height, x1: 0, y1: 0 };
  const brush = { radius, inner: radius * clamp(hardness, 0, 1), value };
  for (let s = 0; s <= steps; s++) {
    const dab = paintDab(mask, width, height, from.x + ((to.x - from.x) * s) / steps, from.y + ((to.y - from.y) * s) / steps, brush);
    box.x0 = Math.min(box.x0, dab.x0);
    box.y0 = Math.min(box.y0, dab.y0);
    box.x1 = Math.max(box.x1, dab.x1);
    box.y1 = Math.max(box.y1, dab.y1);
  }
  return box;
}

/** Une touche de pinceau centrée en (cx, cy) ; renvoie la zone touchée. */
function paintDab(mask: Uint8ClampedArray, width: number, height: number, cx: number, cy: number, brush: { radius: number; inner: number; value: 0 | 255 }): Box {
  const { radius, inner, value } = brush;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > radius) continue;
      const a = d <= inner ? 1 : 1 - (d - inner) / Math.max(1e-6, radius - inner);
      const i = y * width + x;
      mask[i] = value === 0 ? Math.min(mask[i]!, Math.round(255 * (1 - a))) : Math.max(mask[i]!, Math.round(255 * a));
    }
  }
  return { x0, y0, x1, y1 };
}

/** Flou de boîte séparable, deux passes (proche d'un flou gaussien). */
function boxBlur(mask: Uint8ClampedArray, width: number, height: number, radius: number) {
  const r = Math.round(radius);
  if (r < 1) return mask;
  let src = mask;
  for (let pass = 0; pass < 2; pass++) {
    // Lignes puis colonnes : une même moyenne glissante, avec un pas de 1 ou de `width`.
    const rows = slidingMean(src, height, width, width, 1, r);
    src = slidingMean(rows, width, height, 1, width, r);
  }
  return src;
}

/** Moyenne glissante de rayon r le long de `count` lignes de `length` valeurs (bords prolongés). */
function slidingMean(src: Uint8ClampedArray, count: number, length: number, lineStep: number, step: number, r: number) {
  const out = new Uint8ClampedArray(src.length);
  for (let line = 0; line < count; line++) {
    const base = line * lineStep;
    const at = (k: number) => src[base + clamp(k, 0, length - 1) * step]!;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += at(k);
    for (let k = 0; k < length; k++) {
      out[base + k * step] = acc / (2 * r + 1);
      acc += at(k + r + 1) - at(k - r);
    }
  }
  return out;
}

/** Bord du masque : rétréci (contraction > 0, en px) puis adouci (lissage, en px). */
export function refineMask(mask: Uint8ClampedArray, width: number, height: number, options: { feather: number; contract: number }) {
  let out = mask;
  if (options.contract > 0) {
    // Contraction : flou de la largeur voulue puis seuil relevé ; le bord recule sans escaliers.
    const blurred = boxBlur(out, width, height, options.contract);
    out = blurred.map((v) => clamp(((v - 200) * 255) / 55, 0, 255));
  }
  return options.feather > 0 ? boxBlur(out, width, height, options.feather / 2) : out;
}

export const invertMask = (mask: Uint8ClampedArray) => mask.map((v) => 255 - v);

/** Le masque laisse-t-il tout visible ? */
export const isFullMask = (mask: Uint8ClampedArray) => mask.every((v) => v === 255);

/** Masque en PNG (niveaux de gris, opaque), aligné sur l'image entière. */
export function maskToDataUrl(mask: Uint8ClampedArray, width: number, height: number) {
  const { canvas, ctx } = canvasOf(width, height);
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < mask.length; i++) {
    const v = mask[i]!;
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Masque enregistré (PNG), relu à la taille de l'image. */
export async function maskFromDataUrl(src: string, width: number, height: number): Promise<Uint8ClampedArray> {
  const px = await loadPixels(src);
  if (px.width === width && px.height === height) {
    const mask = new Uint8ClampedArray(width * height);
    for (let i = 0; i < mask.length; i++) mask[i] = px.data[i * 4]!;
    return mask;
  }
  const img = await loadImage(src);
  const { ctx } = canvasOf(width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const mask = new Uint8ClampedArray(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4]!;
  return mask;
}

/** Copie réduite d'une image (vignettes, histogramme) : JPEG, ou PNG si elle a de la transparence. */
export async function downscale(src: string, maxSide: number): Promise<{ src: string; pixels: Pixels }> {
  const pixels = await loadPixels(src, maxSide);
  const { canvas, ctx } = canvasOf(pixels.width, pixels.height);
  ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height), 0, 0);
  let transparent = false;
  for (let i = 3; i < pixels.data.length; i += 4) {
    if (pixels.data[i]! < 250) {
      transparent = true;
      break;
    }
  }
  return { src: transparent ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85), pixels };
}
