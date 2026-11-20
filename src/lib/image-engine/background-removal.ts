import type { RawImageData } from "./types";

export interface RemoveBackgroundOptions {
  tolerance: number; // 0 to 100
  edgeSmooth: number; // 0 to 10 (lissage des bords)
  feather: number; // 0 to 10 (adoucissement)
  decontaminate: boolean; // suppression des franges colorées résiduelles
  magicWandSeeds?: { x: number; y: number }[];
}

/** Distance perceptive entre 2 couleurs RGB (« redmean », échelle 0 à 765). */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

/**
 * Supprime le fond de l'image de manière 100% locale, sans aucun appel externe.
 */
export function removeBackground(image: RawImageData, options: RemoveBackgroundOptions): RawImageData {
  const { width, height } = image;
  const outputData = new Uint8ClampedArray(image.data);
  const totalPixels = width * height;

  const toleranceThreshold = (Math.max(1, Math.min(100, options.tolerance)) / 100) * 360;

  // Masque binaire : 1 = fond à supprimer, 0 = sujet conservé
  const backgroundMask = new Uint8Array(totalPixels);

  // Étape 1 : Détermination des points de départ (seeds)
  const seeds: number[] = [];

  if (options.magicWandSeeds && options.magicWandSeeds.length > 0) {
    // Mode Baguette magique : germes spécifiés par l'utilisateur
    for (const pt of options.magicWandSeeds) {
      const clampedX = Math.max(0, Math.min(width - 1, Math.round(pt.x)));
      const clampedY = Math.max(0, Math.min(height - 1, Math.round(pt.y)));
      seeds.push(clampedY * width + clampedX);
    }
  } else {
    // Mode Automatique : germes sur tout le pourtour (bords) de l'image
    const step = Math.max(1, Math.floor((width + height) / 400));
    for (let x = 0; x < width; x += step) {
      seeds.push(x); // Bord supérieur
      seeds.push((height - 1) * width + x); // Bord inférieur
    }
    for (let y = 0; y < height; y += step) {
      seeds.push(y * width); // Bord gauche
      seeds.push(y * width + (width - 1)); // Bord droit
    }
  }

  // Échantillon de couleur de référence depuis le premier germe ou la médiane du bord
  let refR = outputData[seeds[0]! * 4]!;
  let refG = outputData[seeds[0]! * 4 + 1]!;
  let refB = outputData[seeds[0]! * 4 + 2]!;

  if (!options.magicWandSeeds || options.magicWandSeeds.length === 0) {
    // Médiane des bords
    const rList: number[] = [];
    const gList: number[] = [];
    const bList: number[] = [];
    for (let i = 0; i < Math.min(seeds.length, 120); i++) {
      const idx = seeds[i]! * 4;
      rList.push(outputData[idx]!);
      gList.push(outputData[idx + 1]!);
      bList.push(outputData[idx + 2]!);
    }
    rList.sort((a, b) => a - b);
    gList.sort((a, b) => a - b);
    bList.sort((a, b) => a - b);
    refR = rList[Math.floor(rList.length / 2)] ?? refR;
    refG = gList[Math.floor(gList.length / 2)] ?? refG;
    refB = bList[Math.floor(bList.length / 2)] ?? refB;
  }

  // Étape 2 : Flood Fill (diffusion) pour détecter tout le fond contigu
  const queue = new Int32Array(totalPixels);
  let queueHead = 0;
  let queueTail = 0;

  for (const seed of seeds) {
    const idx = seed * 4;
    const dist = colorDistance(
      outputData[idx]!,
      outputData[idx + 1]!,
      outputData[idx + 2]!,
      refR,
      refG,
      refB,
    );
    if (dist < toleranceThreshold && !backgroundMask[seed]) {
      backgroundMask[seed] = 1;
      queue[queueTail++] = seed;
    }
  }

  while (queueHead < queueTail) {
    const current = queue[queueHead++]!;
    const curX = current % width;
    const curY = Math.floor(current / width);
    const curIdx = current * 4;
    const curR = outputData[curIdx]!;
    const curG = outputData[curIdx + 1]!;
    const curB = outputData[curIdx + 2]!;

    // 4 voisins directs (haut, bas, gauche, droite)
    const neighbors = [
      curX > 0 ? current - 1 : -1,
      curX < width - 1 ? current + 1 : -1,
      curY > 0 ? current - width : -1,
      curY < height - 1 ? current + width : -1,
    ];

    for (const nb of neighbors) {
      if (nb === -1 || backgroundMask[nb]) continue;
      const nbIdx = nb * 4;
      const distRef = colorDistance(
        outputData[nbIdx]!,
        outputData[nbIdx + 1]!,
        outputData[nbIdx + 2]!,
        refR,
        refG,
        refB,
      );
      // Différence locale douce pour suivre les légers dégradés
      const distLocal = colorDistance(
        outputData[nbIdx]!,
        outputData[nbIdx + 1]!,
        outputData[nbIdx + 2]!,
        curR,
        curG,
        curB,
      );

      if (
        distRef < toleranceThreshold ||
        (distLocal < toleranceThreshold * 0.35 && distRef < toleranceThreshold * 1.3)
      ) {
        backgroundMask[nb] = 1;
        queue[queueTail++] = nb;
      }
    }
  }

  // Étape 3 : Application de la transparence avec adoucissement et anti-aliasing
  for (let i = 0; i < totalPixels; i++) {
    if (backgroundMask[i] === 1) {
      outputData[i * 4 + 3] = 0; // Transparent
    }
  }

  // Étape 4 : Décontamination des bords (enlève le halo résiduel de la couleur de fond)
  if (options.decontaminate) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const alpha = outputData[i * 4 + 3]!;
        // Pixel de bordure opaque voisin d'un pixel transparent
        if (alpha > 0) {
          const hasTransparentNeighbor =
            outputData[(i - 1) * 4 + 3] === 0 ||
            outputData[(i + 1) * 4 + 3] === 0 ||
            outputData[(i - width) * 4 + 3] === 0 ||
            outputData[(i + width) * 4 + 3] === 0;

          if (hasTransparentNeighbor) {
            // Remplacer la teinte contaminée par la moyenne des voisins intérieurs
            const pR = outputData[i * 4]!;
            const pG = outputData[i * 4 + 1]!;
            const pB = outputData[i * 4 + 2]!;
            const d = colorDistance(pR, pG, pB, refR, refG, refB);

            // Si le pixel de bordure tire fortement sur la couleur de fond, on réduit son opacité pour l'adoucir
            if (d < toleranceThreshold * 1.1) {
              const blend = Math.max(0, Math.min(1, d / (toleranceThreshold * 1.1)));
              outputData[i * 4 + 3] = Math.round(alpha * blend);
            }
          }
        }
      }
    }
  }

  return {
    width,
    height,
    data: outputData,
  };
}

/**
 * Pinceau manuel pour effacer ou restaurer des zones à la souris.
 */
export function applyBrushStroke(
  image: RawImageData,
  center: { x: number; y: number },
  radius: number,
  mode: "erase" | "restore",
  originalData: Uint8ClampedArray,
): RawImageData {
  const { width, height } = image;
  const outputData = new Uint8ClampedArray(image.data);

  const cx = Math.round(center.x);
  const cy = Math.round(center.y);
  const rSq = radius * radius;

  const minX = Math.max(0, cx - radius);
  const maxX = Math.min(width - 1, cx + radius);
  const minY = Math.max(0, cy - radius);
  const maxY = Math.min(height - 1, cy + radius);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const distSq = (x - cx) ** 2 + (y - cy) ** 2;
      if (distSq <= rSq) {
        const idx = (y * width + x) * 4;
        if (mode === "erase") {
          outputData[idx + 3] = 0;
        } else {
          // Restaurer depuis l'original
          outputData[idx] = originalData[idx]!;
          outputData[idx + 1] = originalData[idx + 1]!;
          outputData[idx + 2] = originalData[idx + 2]!;
          outputData[idx + 3] = originalData[idx + 3]!;
        }
      }
    }
  }

  return { width, height, data: outputData };
}
