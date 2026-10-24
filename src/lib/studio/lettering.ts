// Effets de lettrage des maillots et des affiches (même contrat et même rendu que l'API,
// src/render/lettering.ts) : halo néon, relief, second contour (cranté, dentelé ou plein), contour,
// remplissage (uni ou en bandes de couleurs : drapeau, deux tons), reflet holographique, texture
// (rayures, carbone, usé, griffes, pixels, étoiles, camouflage), trame de points et liseré
// intérieur (une ou plusieurs lignes, plein ou en couture), dessinés en calques vectoriels autour
// d'un même groupe de glyphes (`<use>`), découpés à la forme des lettres.

export const PATTERN_KINDS = [
  "stripes",
  "carbon",
  "distressed",
  "claws",
  "bands",
  "pixels",
  "stars",
  "camo",
  "holo",
] as const;
export type PatternKind = (typeof PATTERN_KINDS)[number];

export interface TextEffects {
  /** Second contour, autour du contour (style universitaire) ; bord cranté ou dentelé. */
  outline2?: { color: string; width: number; notched?: boolean; dotted?: boolean } | null;
  /** Liseré intérieur : `lines` traits de `width` (séparés de `gap`), le premier à `inset` du bord. */
  inline?: {
    color: string;
    width: number;
    inset: number;
    lines?: number;
    gap?: number;
    /** Liseré en pointillés, façon couture. */
    dashed?: boolean;
  } | null;
  /** Relief : lettres répétées sur `depth` vers `angle` (degrés, 0 = droite, 90 = bas). */
  extrude?: { color: string; depth: number; angle: number } | null;
  /** Trame de points dans les lettres, grossissant vers `angle` ; `size` : pas de la grille. */
  halftone?: { color: string; size: number; angle: number } | null;
  /**
   * Texture dans les lettres (rayures, carbone, usé, griffes, pixels, étoiles, camouflage), bandes
   * de couleurs à la place du remplissage (`color` puis `colors` : drapeau, deux tons) ou reflet
   * holographique ; `size` : pas ou largeur.
   */
  pattern?: { kind: PatternKind; color: string; size: number; angle: number; colors?: string[] } | null;
  /** Halo néon autour des lettres, sur `size`. */
  glow?: { color: string; size: number } | null;
}

const n = (value: number) => Math.round(value * 100) / 100;

/** Points au-delà desquels la grille de la trame est élargie (poids du fichier). */
const MAX_DOTS = 6000;
/** Copies au plus pour le relief. */
const MAX_EXTRUDE_STEPS = 48;
/** Graine des textures : même dessin au navigateur et au serveur. */
const TEXTURE_SEED = 7;

export interface LetteringInput {
  /** Préfixe des identifiants (unique dans le document). */
  pid: string;
  /** Glyphes sans peinture : `<text>` du navigateur ou tracés du serveur. */
  glyphs: string;
  /** Valeur de `fill` (couleur ou `url(#…)`). */
  fill: string;
  stroke?: { color: string; width: number } | null;
  effects: TextEffects;
  /** Zone couverte par les lettres (repère de l'élément). */
  box: { x: number; y: number; width: number; height: number };
  /** Corps du texte (pas du relief). */
  size: number;
  defs: string[];
}

type Box = LetteringInput["box"];

export function hasEffects(effects: TextEffects | null | undefined): effects is TextEffects {
  return [
    effects?.outline2,
    effects?.inline,
    effects?.extrude,
    effects?.halftone,
    effects?.pattern,
    effects?.glow,
  ].some(Boolean);
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points de la trame : grille en quinconce, rayon croissant dans la direction de l'angle. */
export function halftoneDots(box: Box, halftone: NonNullable<TextEffects["halftone"]>) {
  const area = Math.max(1, box.width * box.height);
  const step = Math.max(halftone.size, Math.sqrt(area / MAX_DOTS));
  const rowStep = step * 0.866;
  const angle = (halftone.angle * Math.PI) / 180;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const corners = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].map(([x, y]) => x * ux + y * uy);
  const min = Math.min(...corners);
  const span = Math.max(1e-6, Math.max(...corners) - min);
  const dots: string[] = [];
  for (let row = 0; box.y + row * rowStep <= box.y + box.height + step; row++) {
    const y = box.y + row * rowStep;
    const shift = row % 2 ? step / 2 : 0;
    for (let x = box.x - shift; x <= box.x + box.width + step; x += step) {
      const t = (x * ux + y * uy - min) / span;
      const r = Math.min(1, Math.max(0, t)) * step * 0.62;
      if (r >= step * 0.06) dots.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`);
    }
  }
  return dots.join("");
}

// ─── Textures (rayures, carbone, usé, griffes, pixels, étoiles, camouflage) ───

/** Pas d'une grille de `size`, élargi pour ne pas dépasser `limit` cellules. */
const gridStep = (box: Box, size: number, limit: number) =>
  Math.max(size, Math.sqrt(Math.max(1, box.width * box.height) / limit));

/** Rayures parallèles d'épaisseur moitié du pas, inclinées de `angle`. */
function stripes(box: Box, size: number, angle: number) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const half = Math.hypot(box.width, box.height) / 2 + size;
  const step = Math.max(size, (half * 2) / 400);
  const bars: string[] = [];
  for (let y = -half; y <= half; y += step) {
    bars.push(
      `<rect x="${n(cx - half)}" y="${n(cy + y)}" width="${n(half * 2)}" height="${n(step * 0.5)}"/>`,
    );
  }
  return `<g transform="rotate(${n(angle)} ${n(cx)} ${n(cy)})">${bars.join("")}</g>`;
}

/** Tissage façon fibre de carbone : barres alternées horizontales et verticales. */
function carbon(box: Box, size: number) {
  const step = gridStep(box, size, 4000);
  const cells: string[] = [];
  for (let i = 0; i * step < box.width + step; i++) {
    for (let j = 0; j * step < box.height + step; j++) {
      const x = box.x + i * step;
      const y = box.y + j * step;
      cells.push(
        (i + j) % 2 === 0
          ? `<rect x="${n(x + step * 0.05)}" y="${n(y + step * 0.1)}" width="${n(step * 0.9)}" height="${n(step * 0.35)}"/>`
          : `<rect x="${n(x + step * 0.1)}" y="${n(y + step * 0.05)}" width="${n(step * 0.35)}" height="${n(step * 0.9)}"/>`,
      );
    }
  }
  return cells.join("");
}

/** Éclats irréguliers semés au hasard (déterministe) : aspect usé, vintage. */
function distressed(box: Box, size: number) {
  const random = seeded(TEXTURE_SEED);
  const area = Math.max(1, box.width * box.height);
  const count = Math.min(2500, Math.round((area / (size * size)) * 0.6));
  const specks: string[] = [];
  for (let k = 0; k < count; k++) {
    const cx = box.x + random() * box.width;
    const cy = box.y + random() * box.height;
    const r = size * (0.08 + random() * 0.32);
    const points = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 + random();
      const d = r * (0.55 + random() * 0.45);
      return `${n(cx + Math.cos(a) * d)},${n(cy + Math.sin(a) * d)}`;
    });
    specks.push(`<polygon points="${points.join(" ")}"/>`);
  }
  return specks.join("");
}

/** Trois griffures effilées qui traversent les lettres dans la direction de `angle`. */
function claws(box: Box, size: number, angle: number) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const vx = -uy;
  const vy = ux;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  // Griffure à peu près de la hauteur des lettres : pointes effilées visibles.
  const length = Math.min(Math.hypot(box.width, box.height) * 0.7, box.height * 0.95);
  const samples = 12;
  const slashes = [-1, 0, 1].map((k) => {
    const offset = k * size * 1.4;
    const side = (sign: number) =>
      Array.from({ length: samples + 1 }, (_, i) => {
        const t = i / samples;
        const along = (t - 0.5) * length;
        const bend = Math.sin(Math.PI * t) * size * 0.6;
        const half = size * 0.42 * Math.sin(Math.PI * t);
        const x = cx + ux * along + vx * (offset + bend + sign * half);
        const y = cy + uy * along + vy * (offset + bend + sign * half);
        return `${n(x)} ${n(y)}`;
      });
    const left = side(1);
    const right = side(-1).reverse();
    return `<path d="M${left.join("L")}L${right.join("L")}Z"/>`;
  });
  return slashes.join("");
}

/** Mosaïque de pixels : cases d'une grille, un peu moins d'une sur deux (tirage déterministe). */
function pixels(box: Box, size: number) {
  const random = seeded(TEXTURE_SEED);
  const step = gridStep(box, size, 3000);
  const cells: string[] = [];
  for (let y = box.y; y < box.y + box.height; y += step) {
    for (let x = box.x; x < box.x + box.width; x += step) {
      if (random() < 0.45) {
        cells.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(step * 0.92)}" height="${n(step * 0.92)}"/>`);
      }
    }
  }
  return cells.join("");
}

/** Étoiles à cinq branches semées dans les lettres. */
function starField(box: Box, size: number) {
  const random = seeded(TEXTURE_SEED);
  const area = Math.max(1, box.width * box.height);
  const count = Math.min(600, Math.max(1, Math.round((area / (size * size)) * 0.55)));
  const stars: string[] = [];
  for (let k = 0; k < count; k++) {
    const cx = box.x + random() * box.width;
    const cy = box.y + random() * box.height;
    const r = size * (0.25 + random() * 0.25);
    const turn = random() * 72;
    const points = Array.from({ length: 10 }, (_, i) => {
      const a = ((turn - 90 + i * 36) * Math.PI) / 180;
      const d = i % 2 ? r * 0.4 : r;
      return `${n(cx + Math.cos(a) * d)},${n(cy + Math.sin(a) * d)}`;
    });
    stars.push(`<polygon points="${points.join(" ")}"/>`);
  }
  return stars.join("");
}

/** Camouflage : taches organiques lissées, en trois intensités de la couleur du motif. */
function camo(box: Box, size: number) {
  const random = seeded(TEXTURE_SEED);
  const area = Math.max(1, box.width * box.height);
  const count = Math.min(400, Math.max(3, Math.round((area / (size * size)) * 1.3)));
  const blobs: string[] = [];
  for (let k = 0; k < count; k++) {
    const cx = box.x + random() * box.width;
    const cy = box.y + random() * box.height;
    const r = size * (0.45 + random() * 0.55);
    const points = Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2;
      const d = r * (0.6 + random() * 0.5);
      return [cx + Math.cos(a) * d * 1.4, cy + Math.sin(a) * d];
    });
    // Courbes passant par les milieux des côtés : contour arrondi.
    const mid = (i: number) => {
      const [x1, y1] = points[i % 7];
      const [x2, y2] = points[(i + 1) % 7];
      return `${n((x1 + x2) / 2)} ${n((y1 + y2) / 2)}`;
    };
    const curve = points.map(([x, y], i) => `Q${n(x)} ${n(y)} ${mid(i)}`).join("");
    blobs.push(`<path d="M${mid(6)}${curve}Z" opacity="${[0.35, 0.6, 0.9][k % 3]}"/>`);
  }
  return blobs.join("");
}

/** Formes d'une texture, dans la zone des lettres (bandes et reflet : peintures, sans formes). */
export function patternShapes(box: Box, pattern: NonNullable<TextEffects["pattern"]>) {
  switch (pattern.kind) {
    case "stripes":
      return stripes(box, pattern.size, pattern.angle);
    case "carbon":
      return carbon(box, pattern.size);
    case "distressed":
      return distressed(box, pattern.size);
    case "claws":
      return claws(box, pattern.size, pattern.angle);
    case "pixels":
      return pixels(box, pattern.size);
    case "stars":
      return starField(box, pattern.size);
    case "camo":
      return camo(box, pattern.size);
    default:
      return "";
  }
}

/**
 * Vecteur d'un dégradé qui traverse toute l'emprise des lettres dans la direction de `angle`
 * (unités de la boîte englobante : élément <text> du navigateur, tracé unique du serveur).
 */
function gradientVector(angle: number) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const half = (Math.abs(ux) + Math.abs(uy)) / 2;
  return `x1="${n(0.5 - ux * half)}" y1="${n(0.5 - uy * half)}" x2="${n(0.5 + ux * half)}" y2="${n(0.5 + uy * half)}"`;
}

/** Bandes nettes sur les lettres (drapeau, deux tons) : dégradé à arrêts francs. */
function bandsGradient(id: string, pattern: NonNullable<TextEffects["pattern"]>) {
  const colors = [pattern.color, ...(pattern.colors ?? [])];
  const stops = colors.flatMap((color, i) => [
    `<stop offset="${n(i / colors.length)}" stop-color="${color}"/>`,
    `<stop offset="${n((i + 1) / colors.length)}" stop-color="${color}"/>`,
  ]);
  return `<linearGradient id="${id}" ${gradientVector(pattern.angle)}>${stops.join("")}</linearGradient>`;
}

/** Couleurs irisées du reflet holographique. */
const HOLO = ["#ff9ad5", "#9ad8ff", "#b9ffd8", "#fff3a3", "#d6a9ff"];

function holoGradient(id: string, angle: number) {
  const stops = HOLO.map((color, i) => `<stop offset="${n(i / (HOLO.length - 1))}" stop-color="${color}"/>`);
  return `<linearGradient id="${id}" ${gradientVector(angle)}>${stops.join("")}</linearGradient>`;
}

// ─── Calques ───

const ROUND = 'stroke-linejoin="round" stroke-linecap="round"';

/** Relief : copies décalées, de la plus profonde à la plus proche. */
function extrudeLayers(
  ref: string,
  extrude: NonNullable<TextEffects["extrude"]>,
  outer: number,
  size: number,
) {
  const angle = (extrude.angle * Math.PI) / 180;
  const steps = Math.min(
    MAX_EXTRUDE_STEPS,
    Math.max(1, Math.ceil(extrude.depth / Math.max(0.5, size * 0.015))),
  );
  const width = outer > 0 ? ` stroke="${extrude.color}" stroke-width="${n(outer * 2)}" ${ROUND}` : "";
  const layers: string[] = [];
  for (let i = steps; i >= 1; i--) {
    const d = (extrude.depth * i) / steps;
    const shift = `translate(${n(Math.cos(angle) * d)} ${n(Math.sin(angle) * d)})`;
    layers.push(`<use ${ref} transform="${shift}" fill="${extrude.color}"${width}/>`);
  }
  return layers.join("");
}

/** Contour : trait centré sur le bord, dont la moitié `halfWidth` dépasse des lettres. */
const outlineLayer = (ref: string, color: string, halfWidth: number) =>
  `<use ${ref} fill="${color}" stroke="${color}" stroke-width="${n(halfWidth * 2)}" ${ROUND}/>`;

/** Contour cranté : trait en tirets à angles vifs, créneaux sur le bord extérieur. */
function notchedLayer(ref: string, color: string, halfWidth: number, notch: number) {
  const dash = `${n(Math.max(notch, 0.5) * 1.6)} ${n(Math.max(notch, 0.5))}`;
  return `<use ${ref} fill="${color}" stroke="${color}" stroke-width="${n(halfWidth * 2)}" stroke-dasharray="${dash}" stroke-linejoin="miter" stroke-linecap="butt"/>`;
}

/** Contour dentelé : festons ronds sur le bord (points du trait, à moitié cachés par les lettres). */
function scallopLayer(ref: string, color: string, halfWidth: number) {
  return `<use ${ref} fill="${color}" stroke="${color}" stroke-width="${n(halfWidth * 2)}" stroke-dasharray="0 ${n(halfWidth * 1.7)}" ${ROUND}/>`;
}

/** Halo néon : traits de plus en plus larges et transparents autour des lettres (sans filtre). */
function glowLayers(ref: string, glow: NonNullable<TextEffects["glow"]>, outer: number) {
  const steps = 6;
  const layers: string[] = [];
  for (let i = steps; i >= 1; i--) {
    const width = (outer + (glow.size * i) / steps) * 2;
    layers.push(
      `<use ${ref} fill="${glow.color}" stroke="${glow.color}" stroke-width="${n(width)}" opacity="0.16" ${ROUND}/>`,
    );
  }
  return layers.join("");
}

/**
 * Liseré : `lines` anneaux de `width`, le premier à `inset` du bord, séparés de `gap` (masque :
 * pour chaque anneau, du plus profond au plus proche du bord, blanc jusqu'à son bord intérieur
 * puis noir jusqu'à son bord extérieur).
 */
function inlineLayer(
  ref: string,
  pid: string,
  inline: NonNullable<TextEffects["inline"]>,
  rect: string,
  defs: string[],
) {
  const lines = Math.max(1, Math.round(inline.lines ?? 1));
  const gap = inline.gap ?? inline.width;
  const rings: string[] = [];
  for (let k = lines - 1; k >= 0; k--) {
    const inset = inline.inset + k * (inline.width + gap);
    rings.push(
      `<use ${ref} fill="none" stroke="#fff" stroke-width="${n((inset + inline.width) * 2)}" ${ROUND}/>`,
    );
    if (inset > 0) {
      rings.push(`<use ${ref} fill="none" stroke="#000" stroke-width="${n(inset * 2)}" ${ROUND}/>`);
    }
  }
  defs.push(`<mask id="${pid}-inline" maskUnits="userSpaceOnUse" ${rect}>${rings.join("")}</mask>`);
  const mask = `mask="url(#${pid}-inline)"`;
  // Couture : traits en pointillés le long du bord, gardés dans les anneaux par le masque.
  const reach = inline.inset + lines * (inline.width + gap);
  const paint = inline.dashed
    ? `<use ${ref} fill="none" stroke="${inline.color}" stroke-width="${n(reach * 2)}" stroke-dasharray="${n(inline.width * 3)} ${n(inline.width * 2)}" ${mask}/>`
    : `<rect ${rect} fill="${inline.color}" ${mask}/>`;
  return `<g clip-path="url(#${pid}-clip)">${paint}</g>`;
}

/** Calques d'un texte avec effets, du fond vers le dessus. */
export function letteringLayers(input: LetteringInput) {
  const { pid, effects, box, defs } = input;
  const ref = `href="#${pid}-g"`;
  const outline = input.stroke && input.stroke.width > 0 ? input.stroke : null;
  const inner = outline?.width ?? 0;
  const outer = inner + (effects.outline2?.width ?? 0);
  const glow = effects.glow && effects.glow.size > 0 ? effects.glow : null;
  const pad = outer * 2 + (effects.extrude?.depth ?? 0) + (glow?.size ?? 0) * 2 + input.size;
  const rect = `x="${n(box.x - pad)}" y="${n(box.y - pad)}" width="${n(box.width + pad * 2)}" height="${n(box.height + pad * 2)}"`;
  const { extrude, outline2, halftone, inline, pattern } = effects;
  // Bandes et reflet peignent les lettres elles-mêmes ; les autres textures sont des formes.
  const painted = pattern?.kind === "bands" || pattern?.kind === "holo";
  const textured = pattern && !painted ? pattern : null;
  defs.push(`<g id="${pid}-g">${input.glyphs}</g>`);
  if (halftone || inline || textured) {
    // Un clipPath ne peut pas viser un groupe par <use> : glyphes recopiés.
    defs.push(`<clipPath id="${pid}-clip">${input.glyphs}</clipPath>`);
  }
  const clipped = (color: string, shapes: string) =>
    `<g clip-path="url(#${pid}-clip)" fill="${color}">${shapes}</g>`;
  let second = "";
  if (outline2 && outline2.width > 0) {
    if (outline2.dotted) second = scallopLayer(ref, outline2.color, outer);
    else if (outline2.notched) second = notchedLayer(ref, outline2.color, outer, outline2.width);
    else second = outlineLayer(ref, outline2.color, outer);
  }
  let fill = input.fill;
  if (pattern?.kind === "bands") {
    defs.push(bandsGradient(`${pid}-bands`, pattern));
    fill = `url(#${pid}-bands)`;
  }
  let holo = "";
  if (pattern?.kind === "holo") {
    defs.push(holoGradient(`${pid}-holo`, pattern.angle));
    holo = `<use ${ref} fill="url(#${pid}-holo)" opacity="0.6"/>`;
  }
  return [
    glow ? glowLayers(ref, glow, outer) : "",
    extrude && extrude.depth > 0 ? extrudeLayers(ref, extrude, outer, input.size) : "",
    second,
    outline ? outlineLayer(ref, outline.color, inner) : "",
    `<use ${ref} fill="${fill}"/>`,
    holo,
    textured ? clipped(textured.color, patternShapes(box, textured)) : "",
    halftone ? clipped(halftone.color, halftoneDots(box, halftone)) : "",
    inline && inline.width > 0 ? inlineLayer(ref, pid, inline, rect, defs) : "",
  ].join("");
}

/** Couleurs des effets (contrôle du nombre de couleurs, séparation des encres). */
export function effectColors(effects: TextEffects | null | undefined): string[] {
  if (!effects) return [];
  return [
    effects.outline2?.color,
    effects.inline?.color,
    effects.extrude?.color,
    effects.halftone?.color,
    effects.pattern?.color,
    ...(effects.pattern?.colors ?? []),
    effects.glow?.color,
  ].filter((c): c is string => Boolean(c));
}

/** Effets recolorés (harmonies, couleurs de la marque). */
export function mapEffectColors(
  effects: TextEffects | null | undefined,
  fn: (color: string) => string,
): TextEffects | null | undefined {
  if (!effects) return effects;
  const recolor = <T extends { color: string }>(layer: T | null | undefined) =>
    layer ? { ...layer, color: fn(layer.color) } : layer;
  const pattern = recolor(effects.pattern);
  return {
    outline2: recolor(effects.outline2),
    inline: recolor(effects.inline),
    extrude: recolor(effects.extrude),
    halftone: recolor(effects.halftone),
    pattern: pattern?.colors ? { ...pattern, colors: pattern.colors.map(fn) } : pattern,
    glow: recolor(effects.glow),
  };
}

// ─── Préréglages : formes de lettrage des maillots ───

export const LETTERING_PRESETS = [
  "plain",
  "outline",
  "college",
  "inline",
  "lines",
  "stitched",
  "notched",
  "scalloped",
  "relief",
  "shadow",
  "neon",
  "flag",
  "twoTone",
  "holo",
  "halftone",
  "stripes",
  "carbon",
  "distressed",
  "claws",
  "pixels",
  "stars",
  "camo",
] as const;
export type LetteringPreset = (typeof LETTERING_PRESETS)[number];

export interface LetteringStyle {
  stroke: { color: string; width: number } | null;
  effects: TextEffects | null;
}

/** Bandes d'un drapeau : couleurs de la hampe au battant (angle 0) ou de haut en bas (angle 90). */
export interface FlagBands {
  colors: string[];
  angle: number;
}

/** Drapeau par défaut des lettres « drapeau » : Guinée (rouge, jaune, vert). */
export const DEFAULT_FLAG: FlagBands = { colors: ["#ce1126", "#fcd116", "#009460"], angle: 0 };

export interface PresetColors {
  /** Couleur lisible sur le remplissage (contours, textures). */
  accent: string;
  /** Seconde couleur (marque) : second contour, relief. */
  second: string;
  /** Remplissage du texte : première couleur des deux tons. */
  fill?: string;
  flag?: FlagBands;
}

/** Couleur du halo : la seconde couleur, sauf noir ou blanc (néon cyan). */
const neonColor = (second: string) =>
  ["#111111", "#000000", "#ffffff"].includes(second) ? "#22d3ee" : second;

/** Bandes de couleurs à la place du remplissage. */
const bands = (colors: string[], size: number, angle: number): TextEffects["pattern"] => ({
  kind: "bands",
  color: colors[0],
  colors: colors.slice(1),
  size,
  angle,
});

/**
 * Forme de lettrage à partir d'un préréglage : épaisseurs proportionnelles au corps, couleurs
 * d'accent (`accent`, `second`) choisies pour contraster avec le remplissage.
 */
export function presetStyle(preset: LetteringPreset, size: number, colors: PresetColors): LetteringStyle {
  const w = (ratio: number) => Math.round(size * ratio * 100) / 100;
  const { accent, second } = colors;
  const textured = (kind: PatternKind, ratio: number, angle = 0): LetteringStyle => ({
    stroke: { color: second, width: w(0.03) },
    effects: { pattern: { kind, angle, color: accent, size: w(ratio) } },
  });
  switch (preset) {
    case "outline":
      return { stroke: { color: accent, width: w(0.05) }, effects: null };
    case "college":
      return {
        stroke: { color: accent, width: w(0.05) },
        effects: { outline2: { color: second, width: w(0.05) } },
      };
    case "inline":
      return { stroke: null, effects: { inline: { color: accent, width: w(0.012), inset: w(0.022) } } };
    case "lines":
      return {
        stroke: null,
        effects: { inline: { color: accent, width: w(0.01), inset: w(0.016), lines: 3, gap: w(0.012) } },
      };
    case "stitched":
      return {
        stroke: { color: second, width: w(0.03) },
        effects: { inline: { color: accent, width: w(0.012), inset: w(0.03), dashed: true } },
      };
    case "notched":
      return {
        stroke: { color: accent, width: w(0.035) },
        effects: { outline2: { color: second, width: w(0.05), notched: true } },
      };
    case "scalloped":
      return {
        stroke: { color: accent, width: w(0.035) },
        effects: { outline2: { color: second, width: w(0.06), dotted: true } },
      };
    case "relief":
      return {
        stroke: { color: second, width: w(0.035) },
        effects: { extrude: { color: second, depth: w(0.09), angle: 45 } },
      };
    case "shadow":
      return { stroke: null, effects: { extrude: { color: second, depth: w(0.06), angle: 35 } } };
    case "neon":
      return {
        stroke: { color: neonColor(second), width: w(0.02) },
        effects: { glow: { color: neonColor(second), size: w(0.1) } },
      };
    case "flag": {
      const flag = colors.flag ?? DEFAULT_FLAG;
      return {
        stroke: { color: second, width: w(0.03) },
        effects: { pattern: bands(flag.colors, w(0.05), flag.angle) },
      };
    }
    case "twoTone":
      return {
        stroke: { color: accent, width: w(0.03) },
        effects: { pattern: bands([colors.fill ?? accent, second], w(0.05), 90) },
      };
    case "holo":
      return textured("holo", 0.1, 45);
    case "halftone":
      return {
        stroke: { color: second, width: w(0.04) },
        effects: { halftone: { color: accent, size: w(0.09), angle: 90 } },
      };
    case "stripes":
      return {
        stroke: { color: second, width: w(0.035) },
        effects: { pattern: { kind: "stripes", color: accent, size: w(0.06), angle: -35 } },
      };
    case "carbon":
      return textured("carbon", 0.05);
    case "distressed":
      return {
        stroke: null,
        effects: { pattern: { kind: "distressed", color: accent, size: w(0.05), angle: 0 } },
      };
    case "claws":
      return {
        stroke: { color: second, width: w(0.035) },
        effects: {
          extrude: { color: second, depth: w(0.06), angle: 45 },
          pattern: { kind: "claws", color: second, size: w(0.09), angle: -60 },
        },
      };
    case "pixels":
      return textured("pixels", 0.06);
    case "stars":
      return textured("stars", 0.14);
    case "camo":
      return textured("camo", 0.16);
    default:
      return { stroke: null, effects: null };
  }
}

/** Préréglage d'une texture : bandes de trois couleurs ou plus = drapeau, sinon deux tons. */
function patternPreset(pattern: NonNullable<TextEffects["pattern"]>): LetteringPreset {
  if (pattern.kind !== "bands") return pattern.kind;
  return (pattern.colors?.length ?? 0) >= 2 ? "flag" : "twoTone";
}

function outline2Preset(outline2: NonNullable<TextEffects["outline2"]>): LetteringPreset {
  if (outline2.dotted) return "scalloped";
  return outline2.notched ? "notched" : "college";
}

function inlinePreset(inline: NonNullable<TextEffects["inline"]>): LetteringPreset {
  if (inline.dashed) return "stitched";
  return (inline.lines ?? 1) > 1 ? "lines" : "inline";
}

/** Préréglage le plus proche d'un style existant (bouton actif de l'inspecteur). */
export function presetOf(style: LetteringStyle): LetteringPreset {
  const e = style.effects;
  if (e?.glow) return "neon";
  if (e?.pattern) return patternPreset(e.pattern);
  if (e?.halftone) return "halftone";
  if (e?.inline) return inlinePreset(e.inline);
  if (e?.extrude) return style.stroke ? "relief" : "shadow";
  if (e?.outline2) return outline2Preset(e.outline2);
  return style.stroke ? "outline" : "plain";
}
