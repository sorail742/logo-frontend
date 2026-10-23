// Effets de lettrage des maillots et des affiches (même contrat et même rendu que l'API,
// src/render/lettering.ts) : relief, second contour, contour, remplissage, trame de points et
// liseré intérieur, dessinés en calques vectoriels autour d'un même groupe de glyphes (`<use>`),
// découpés à la forme des lettres.

export interface TextEffects {
  /** Second contour, autour du contour (style universitaire). */
  outline2?: { color: string; width: number } | null;
  /** Liseré intérieur : trait de `width` à `inset` du bord des lettres. */
  inline?: { color: string; width: number; inset: number } | null;
  /** Relief : lettres répétées sur `depth` vers `angle` (degrés, 0 = droite, 90 = bas). */
  extrude?: { color: string; depth: number; angle: number } | null;
  /** Trame de points dans les lettres, grossissant vers `angle` ; `size` : pas de la grille. */
  halftone?: { color: string; size: number; angle: number } | null;
}

const n = (value: number) => Math.round(value * 100) / 100;

/** Points au-delà desquels la grille de la trame est élargie (poids du fichier). */
const MAX_DOTS = 6000;
/** Copies au plus pour le relief. */
const MAX_EXTRUDE_STEPS = 48;

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

export function hasEffects(effects: TextEffects | null | undefined): effects is TextEffects {
  return [effects?.outline2, effects?.inline, effects?.extrude, effects?.halftone].some(Boolean);
}

/** Points de la trame : grille en quinconce, rayon croissant dans la direction de l'angle. */
export function halftoneDots(box: LetteringInput["box"], halftone: NonNullable<TextEffects["halftone"]>) {
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

/** Liseré : anneau entre `inset` et `inset + width` depuis le bord (masque blanc moins masque noir). */
function inlineLayer(
  ref: string,
  pid: string,
  inline: NonNullable<TextEffects["inline"]>,
  rect: string,
  defs: string[],
) {
  const ring = `<use ${ref} fill="none" stroke="#fff" stroke-width="${n((inline.inset + inline.width) * 2)}" ${ROUND}/>`;
  const cut =
    inline.inset > 0
      ? `<use ${ref} fill="none" stroke="#000" stroke-width="${n(inline.inset * 2)}" ${ROUND}/>`
      : "";
  defs.push(`<mask id="${pid}-inline" maskUnits="userSpaceOnUse" ${rect}>${ring}${cut}</mask>`);
  return `<g clip-path="url(#${pid}-clip)"><rect ${rect} fill="${inline.color}" mask="url(#${pid}-inline)"/></g>`;
}

/** Calques d'un texte avec effets, du fond vers le dessus. */
export function letteringLayers(input: LetteringInput) {
  const { pid, effects, box, defs } = input;
  const ref = `href="#${pid}-g"`;
  const outline = input.stroke && input.stroke.width > 0 ? input.stroke : null;
  const inner = outline?.width ?? 0;
  const outer = inner + (effects.outline2?.width ?? 0);
  const pad = outer * 2 + (effects.extrude?.depth ?? 0) + input.size;
  const rect = `x="${n(box.x - pad)}" y="${n(box.y - pad)}" width="${n(box.width + pad * 2)}" height="${n(box.height + pad * 2)}"`;
  defs.push(`<g id="${pid}-g">${input.glyphs}</g>`);
  if (effects.halftone || effects.inline) {
    // Un clipPath ne peut pas viser un groupe par <use> : glyphes recopiés.
    defs.push(`<clipPath id="${pid}-clip">${input.glyphs}</clipPath>`);
  }
  const { extrude, outline2, halftone, inline } = effects;
  return [
    extrude && extrude.depth > 0 ? extrudeLayers(ref, extrude, outer, input.size) : "",
    outline2 && outline2.width > 0 ? outlineLayer(ref, outline2.color, outer) : "",
    outline ? outlineLayer(ref, outline.color, inner) : "",
    `<use ${ref} fill="${input.fill}"/>`,
    halftone
      ? `<g clip-path="url(#${pid}-clip)" fill="${halftone.color}">${halftoneDots(box, halftone)}</g>`
      : "",
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
  return {
    outline2: recolor(effects.outline2),
    inline: recolor(effects.inline),
    extrude: recolor(effects.extrude),
    halftone: recolor(effects.halftone),
  };
}

// ─── Préréglages : formes de lettrage des maillots ───

export const LETTERING_PRESETS = [
  "plain",
  "outline",
  "college",
  "inline",
  "relief",
  "halftone",
  "shadow",
] as const;
export type LetteringPreset = (typeof LETTERING_PRESETS)[number];

export interface LetteringStyle {
  stroke: { color: string; width: number } | null;
  effects: TextEffects | null;
}

/**
 * Forme de lettrage à partir d'un préréglage : épaisseurs proportionnelles au corps, couleurs
 * d'accent (`accent`, `second`) choisies pour contraster avec le remplissage.
 */
export function presetStyle(
  preset: LetteringPreset,
  size: number,
  colors: { accent: string; second: string },
): LetteringStyle {
  const w = (ratio: number) => Math.round(size * ratio * 100) / 100;
  switch (preset) {
    case "outline":
      return { stroke: { color: colors.accent, width: w(0.05) }, effects: null };
    case "college":
      return {
        stroke: { color: colors.accent, width: w(0.05) },
        effects: { outline2: { color: colors.second, width: w(0.05) } },
      };
    case "inline":
      return {
        stroke: null,
        effects: { inline: { color: colors.accent, width: w(0.012), inset: w(0.022) } },
      };
    case "relief":
      return {
        stroke: { color: colors.second, width: w(0.035) },
        effects: { extrude: { color: colors.second, depth: w(0.09), angle: 45 } },
      };
    case "halftone":
      return {
        stroke: { color: colors.second, width: w(0.04) },
        effects: { halftone: { color: colors.accent, size: w(0.09), angle: 90 } },
      };
    case "shadow":
      return { stroke: null, effects: { extrude: { color: colors.second, depth: w(0.06), angle: 35 } } };
    default:
      return { stroke: null, effects: null };
  }
}

/** Préréglage le plus proche d'un style existant (bouton actif de l'inspecteur). */
export function presetOf(style: LetteringStyle): LetteringPreset {
  const e = style.effects;
  if (e?.halftone) return "halftone";
  if (e?.inline) return "inline";
  if (e?.extrude) return style.stroke ? "relief" : "shadow";
  if (e?.outline2) return "college";
  return style.stroke ? "outline" : "plain";
}
