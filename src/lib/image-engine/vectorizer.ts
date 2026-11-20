import type { RawImageData } from "./types";

export interface VectorizeOptions {
  colorsCount: number; // 1 à 16 couleurs
  simplifyTolerance: number; // 0.5 à 5 (tolérance Douglas-Peucker)
  mode: "color" | "monochrome" | "logo";
  minAreaPixels?: number; // Ignorer les îlots de bruit inférieurs à ce nombre de pixels (défaut: 8)
}

export interface VectorizeResult {
  svg: string;
  pathsCount: number;
  colors: string[];
}

interface Point {
  x: number;
  y: number;
}

/** Distance euclidienne au carré entre deux couleurs RGB */
function colorDistSq(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Quantification des couleurs par k-means local
 */
function quantizeColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  k: number,
): { palette: [number, number, number][]; pixelLabels: Int16Array } {
  const total = width * height;
  const pixelLabels = new Int16Array(total);
  pixelLabels.fill(-1);

  // Recueillir les pixels visibles (alpha > 40)
  const visibleIndices: number[] = [];
  const step = Math.max(1, Math.floor(total / 10000));
  for (let i = 0; i < total; i += step) {
    if (data[i * 4 + 3]! > 40) {
      visibleIndices.push(i);
    }
  }

  if (visibleIndices.length === 0) {
    return { palette: [[0, 0, 0]], pixelLabels };
  }

  const actualK = Math.min(k, Math.max(1, visibleIndices.length));
  const palette: [number, number, number][] = [];

  // Initialisation K-means++ simple
  const firstIdx = visibleIndices[Math.floor(visibleIndices.length / 2)]! * 4;
  palette.push([data[firstIdx]!, data[firstIdx + 1]!, data[firstIdx + 2]!]);

  while (palette.length < actualK) {
    let maxDist = -1;
    let bestIdx = visibleIndices[0]!;
    for (const vIdx of visibleIndices) {
      const idx = vIdx * 4;
      const r = data[idx]!;
      const g = data[idx + 1]!;
      const b = data[idx + 2]!;
      let minDist = Infinity;
      for (const [pr, pg, pb] of palette) {
        const d = colorDistSq(r, g, b, pr, pg, pb);
        if (d < minDist) minDist = d;
      }
      if (minDist > maxDist) {
        maxDist = minDist;
        bestIdx = vIdx;
      }
    }
    const idx = bestIdx * 4;
    palette.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
  }

  // Itérations K-means (jusqu'à 6 tours pour vitesse et convergence)
  for (let iter = 0; iter < 6; iter++) {
    const sums = palette.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

    for (const vIdx of visibleIndices) {
      const idx = vIdx * 4;
      const r = data[idx]!;
      const g = data[idx + 1]!;
      const b = data[idx + 2]!;

      let bestCenter = 0;
      let minDist = Infinity;
      for (let c = 0; c < palette.length; c++) {
        const [pr, pg, pb] = palette[c]!;
        const d = colorDistSq(r, g, b, pr, pg, pb);
        if (d < minDist) {
          minDist = d;
          bestCenter = c;
        }
      }

      sums[bestCenter]!.r += r;
      sums[bestCenter]!.g += g;
      sums[bestCenter]!.b += b;
      sums[bestCenter]!.count++;
    }

    let changed = false;
    for (let c = 0; c < palette.length; c++) {
      const s = sums[c]!;
      if (s.count > 0) {
        const nr = Math.round(s.r / s.count);
        const ng = Math.round(s.g / s.count);
        const nb = Math.round(s.b / s.count);
        if (palette[c]![0] !== nr || palette[c]![1] !== ng || palette[c]![2] !== nb) {
          palette[c] = [nr, ng, nb];
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  // Assignation finale de chaque pixel
  for (let i = 0; i < total; i++) {
    const a = data[i * 4 + 3]!;
    if (a < 40) {
      pixelLabels[i] = -1; // Transparent
      continue;
    }
    const r = data[i * 4]!;
    const g = data[i * 4 + 1]!;
    const b = data[i * 4 + 2]!;

    let bestCenter = 0;
    let minDist = Infinity;
    for (let c = 0; c < palette.length; c++) {
      const [pr, pg, pb] = palette[c]!;
      const d = colorDistSq(r, g, b, pr, pg, pb);
      if (d < minDist) {
        minDist = d;
        bestCenter = c;
      }
    }
    pixelLabels[i] = bestCenter;
  }

  return { palette, pixelLabels };
}

/**
 * Simplification de polygone selon l'algorithme de Ramer-Douglas-Peucker
 */
function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0]!;
  const end = points[points.length - 1]!;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lineLenSq = dx * dx + dy * dy;

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    let dist = 0;
    if (lineLenSq === 0) {
      const px = p.x - start.x;
      const py = p.y - start.y;
      dist = Math.sqrt(px * px + py * py);
    } else {
      const t = Math.max(0, Math.min(1, ((p.x - start.x) * dx + (p.y - start.y) * dy) / lineLenSq));
      const projX = start.x + t * dx;
      const projY = start.y + t * dy;
      const distSq = (p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY);
      dist = Math.sqrt(distSq);
    }

    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const right = ramerDouglasPeucker(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  } else {
    return [start, end];
  }
}

/**
 * Tracé des contours par marching squares 2D par couche de couleur
 */
function traceContoursForLayer(
  labels: Int16Array,
  width: number,
  height: number,
  targetColorIndex: number,
  minArea: number,
): Point[][] {
  const binary = new Uint8Array(width * height);
  let activePixels = 0;

  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === targetColorIndex) {
      binary[i] = 1;
      activePixels++;
    }
  }

  if (activePixels < minArea) return [];

  // Détection des arêtes de contours par balayage des transitions
  // Chaque cellule (x, y) de taille 1x1 est analysée par ses 4 sommets
  const visited = new Uint8Array((width + 1) * (height + 1));
  const contours: Point[][] = [];

  // Fonction de test de pixel intérieur
  const isFilled = (px: number, py: number): boolean => {
    if (px < 0 || px >= width || py < 0 || py >= height) return false;
    return binary[py * width + px] === 1;
  };

  // Suivi de contour Moore-Neighbor pour former des boucles fermées
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isFilled(x, y)) continue;

      // Chercher si c'est un point de départ de contour extérieur (haut vide)
      if (y === 0 || !isFilled(x, y - 1)) {
        const startKey = y * (width + 1) + x;
        if (visited[startKey]) continue;

        // Suivre la frontière extérieure
        const polygon: Point[] = [];
        let cx = x;
        let cy = y;
        let dir = 0; // 0: Droite, 1: Bas, 2: Gauche, 3: Haut

        // Coordonnées de déplacement
        const dX = [1, 0, -1, 0];
        const dY = [0, 1, 0, -1];

        let loopCount = 0;
        const maxLoops = (width + height) * 4;

        while (loopCount < maxLoops) {
          polygon.push({ x: cx, y: cy });
          visited[cy * (width + 1) + cx] = 1;

          // Chercher la prochaine direction
          let foundNext = false;
          for (let turn = -1; turn <= 2; turn++) {
            const nextDir = (dir + turn + 4) % 4;
            const nx = cx + dX[nextDir]!;
            const ny = cy + dY[nextDir]!;

            // Vérifier la présence du bord
            // Selon la direction, la cellule intérieure est à notre droite
            let inside = false;
            if (nextDir === 0) inside = isFilled(cx, cy);
            else if (nextDir === 1) inside = isFilled(cx - 1, cy);
            else if (nextDir === 2) inside = isFilled(cx - 1, cy - 1);
            else if (nextDir === 3) inside = isFilled(cx, cy - 1);

            if (inside) {
              cx = nx;
              cy = ny;
              dir = nextDir;
              foundNext = true;
              break;
            }
          }

          if (!foundNext || (cx === x && cy === y && polygon.length > 2)) {
            break;
          }
          loopCount++;
        }

        if (polygon.length >= 4) {
          contours.push(polygon);
        }
      }
    }
  }

  return contours;
}

/**
 * Convertit une liste de polygones en chemin SVG lissé avec des courbes de Bézier
 */
function pointsToSvgPath(points: Point[]): string {
  if (points.length < 3) return "";

  let d = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;

  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % points.length]!;
    const p3 = points[(i + 2) % points.length]!;

    // Spline Catmull-Rom vers Bézier cubique pour un lissage naturel de niveau illustrateur
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  d += " Z";
  return d;
}

/**
 * Vectorise une image matricielle (PNG/JPEG) en SVG pur 100% en local.
 * Aucun appel externe, pas de dépendance binaire externe.
 */
export function vectorizeImage(image: RawImageData, options: VectorizeOptions): VectorizeResult {
  const { width, height, data } = image;
  const minArea = options.minAreaPixels ?? 8;
  const epsilon = Math.max(0.5, Math.min(5.0, options.simplifyTolerance));

  // 1. Quantification en N couleurs
  const targetK = options.mode === "monochrome" ? 1 : Math.max(1, Math.min(16, options.colorsCount));
  const { palette, pixelLabels } = quantizeColors(data, width, height, targetK);

  const colorsHex: string[] = [];
  const svgLayers: string[] = [];
  let totalPaths = 0;

  for (let c = 0; c < palette.length; c++) {
    const [r, g, b] = palette[c]!;
    const hex = options.mode === "monochrome" ? "#000000" : rgbToHex(r, g, b);
    colorsHex.push(hex);

    // 2. Extraire les contours pour cette couleur
    const rawContours = traceContoursForLayer(pixelLabels, width, height, c, minArea);
    if (rawContours.length === 0) continue;

    const layerPathDList: string[] = [];

    for (const contour of rawContours) {
      // 3. Simplification Ramer-Douglas-Peucker
      const simplified = ramerDouglasPeucker(contour, epsilon);
      if (simplified.length < 3) continue;

      // 4. Lissage Bézier
      const pathD = pointsToSvgPath(simplified);
      if (pathD) {
        layerPathDList.push(pathD);
        totalPaths++;
      }
    }

    if (layerPathDList.length > 0) {
      svgLayers.push(`  <path d="${layerPathDList.join(" ")}" fill="${hex}" fill-rule="evenodd" />`);
    }
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    ...svgLayers,
    `</svg>`,
  ].join("\n");

  return {
    svg,
    pathsCount: totalPaths,
    colors: colorsHex,
  };
}
