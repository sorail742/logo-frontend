import { mix } from "@/lib/render/color";
import { getFont } from "@/lib/render/fonts";
import { sanitizeSvg } from "@/lib/render/svg";
import { createImage, createSvg, createText, solid } from "@/lib/studio/doc";
import { renderElement } from "@/lib/studio/render";
import type { DesignElement } from "@/lib/studio/types";
import { garmentShape, zoneRect, type GarmentShape } from "./garments";
import { resolveZone } from "./rules";
import type { ApparelElement, GarmentView, PrintZone, ProductCategory, ProductSize } from "./types";

// Rendu d'une vue de vêtement : tissu, impressions et éclairage. Les impressions passent par le
// moteur du Studio (même retouche photo, mêmes polices) dans un repère en millimètres ; le
// vêtement est dessiné en couches pour que l'éditeur ne recalcule que les impressions : le fond
// (ombre portée, tissu, intérieur du col), les impressions, puis les passes d'éclairage (plis,
// volumes, maille) fusionnées par-dessus, qui font « entrer » l'encre dans le tissu.

const n = (value: number) => Math.round(value * 100) / 100;

/** Identifiant local d'un élément (l'API en attribue un nouveau à chaque enregistrement). */
export type EditorElement = ApparelElement & { id: string };

// ─── Éléments ───

const safeSvg = new Map<string, string>();

/** SVG d'un logo nettoyé avant affichage : le contenu vient de la base (BAT public compris). */
function cleanSvg(svg: string) {
  const cached = safeSvg.get(svg);
  if (cached !== undefined) return cached;
  const clean = sanitizeSvg(svg) ?? "";
  if (safeSvg.size > 64) safeSvg.clear();
  safeSvg.set(svg, clean);
  return clean;
}

/** Flèche d'un texte en arc (même géométrie que le Studio). */
export function arcSagitta(width: number, curve = 0) {
  const theta = Math.max(0.0001, (Math.min(100, Math.abs(curve)) / 100) * Math.PI);
  const radius = width / (2 * Math.sin(theta / 2));
  return curve ? radius * (1 - Math.cos(theta / 2)) : 0;
}

/** Corps de police qui donne au texte la hauteur de sa boîte (ascendantes et descendantes). */
export function textFontSize(el: Pick<ApparelElement, "heightMm" | "widthMm" | "content">) {
  const font = getFont(el.content.fontId ?? "montserrat");
  return Math.max(1, (el.heightMm - arcSagitta(el.widthMm, el.content.curve)) / (font.ascent + font.descent));
}

/** Élément du Studio équivalent, placé dans la vue (coin de la zone + décalage). */
export function toStudioElement(el: ApparelElement, zone: PrintZone, id: string): DesignElement | null {
  const rect = zoneRect(zone);
  const box = {
    id,
    x: rect.x + el.offsetXMm,
    y: rect.y + el.offsetYMm,
    width: el.widthMm,
    height: el.heightMm,
    rotation: el.rotationDeg ?? 0,
  };
  const c = el.content;
  if (c.photo) {
    const p = c.photo;
    return createImage(p.src, p.naturalWidth, p.naturalHeight, {
      ...box,
      fit: "contain",
      mask: "none",
      adjust: p.adjust,
      crop: p.crop,
      straighten: p.straighten,
      cutout: p.cutout,
      outline: p.outline,
      glow: p.glow,
      flipX: p.flipX,
      flipY: p.flipY,
    });
  }
  if (c.svg) {
    const svg = cleanSvg(c.svg);
    return svg ? createSvg(svg, "logo", box) : null;
  }
  if (c.text !== undefined) {
    const font = getFont(c.fontId ?? "montserrat");
    return createText({
      ...box,
      text: c.text,
      lines: [c.text],
      fontId: font.id,
      fontWeight: c.fontWeight ?? 700,
      fontSize: textFontSize(el),
      lineHeight: font.ascent + font.descent,
      letterSpacing: c.letterSpacing ?? 0,
      align: "center",
      curve: c.curve,
      fill: solid(c.fill ?? "#111111"),
      stroke:
        c.textOutline && c.textOutline.widthMm > 0
          ? { color: c.textOutline.color, width: c.textOutline.widthMm }
          : null,
      effects: c.effects ?? null,
    });
  }
  return null;
}

// ─── Taille affichée ───

export interface SizeView {
  size: ProductSize;
  ref: ProductSize;
}

/** Zone et élément adaptés à une taille : une zone proportionnelle agrandit son impression. */
export function sizedZone(zone: PrintZone, sizing?: SizeView) {
  if (!sizing || sizing.size.label === sizing.ref.label) return { zone, k: 1 };
  const resolved = resolveZone(zone, sizing.size, sizing.ref);
  return { zone: resolved, k: resolved.maxWidthMm / zone.maxWidthMm };
}

function sizedElement(el: ApparelElement, k: number): ApparelElement {
  if (k === 1) return el;
  return {
    ...el,
    widthMm: el.widthMm * k,
    heightMm: el.heightMm * k,
    offsetXMm: el.offsetXMm * k,
    offsetYMm: el.offsetYMm * k,
  };
}

/** Échelle du dessin du vêtement pour une taille (dessin de référence : M). */
export function garmentScale(view: GarmentView, sizing?: SizeView) {
  if (!sizing) return { kx: 1, ky: 1 };
  const kx = sizing.size.chestWidthMm / sizing.ref.chestWidthMm;
  const ky =
    view === "LEFT_SLEEVE" || view === "RIGHT_SLEEVE"
      ? kx
      : sizing.size.bodyLengthMm / sizing.ref.bodyLengthMm;
  return { kx, ky };
}

// ─── Vêtement ───

export interface GarmentLayers {
  /** Cadre de la vue, en mm (marges comprises). */
  box: GarmentShape["box"];
  /** viewBox commun aux trois couches. */
  viewBox: string;
  base: string;
  prints: string;
  light: LightPass[];
}

export interface GarmentRenderInput {
  category: ProductCategory;
  view: GarmentView;
  color: string;
  zones: PrintZone[];
  elements: ApparelElement[];
  sizing?: SizeView;
  /** Éléments à ne pas dessiner. */
  skip?: ReadonlySet<string>;
  /** Préfixe des identifiants SVG (plusieurs vues dans une même page). */
  idPrefix?: string;
}

/** Fond de la vue : ombre portée, tissu, intérieur du col, coutures. */
function baseLayer(shape: GarmentShape, color: string, id: string, transform: string) {
  const edge = mix(color, "#000000", 0.32);
  const seam = mix(color, "#000000", 0.42);
  const inside = mix(color, "#000000", 0.28);
  const details = shape.details.map((d) => `<path d="${d}"/>`).join("");
  // Points de couture le long des ourlets (traits doublés).
  const stitches = shape.details.map((d) => `<path d="${d}" transform="translate(0 4)"/>`).join("");
  return [
    `<defs><filter id="${id}-drop" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter><clipPath id="${id}-seams"><path d="${shape.outline}"/></clipPath></defs>`,
    `<g transform="${transform}">`,
    `<path d="${shape.outline}" fill="#000" opacity="0.16" transform="translate(0 10)" filter="url(#${id}-drop)"/>`,
    shape.inner ? `<path d="${shape.inner}" fill="${inside}" stroke="${edge}" stroke-width="1.2"/>` : "",
    `<path d="${shape.outline}" fill="${color}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>`,
    ...(shape.pieces ?? []).map(
      (d) => `<path d="${d}" fill="${color}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/>`,
    ),
    // Coutures et surpiqûres découpées au contour (elles ne dépassent pas des ourlets).
    `<g clip-path="url(#${id}-seams)">`,
    `<g fill="none" stroke="${seam}" stroke-width="1.3" stroke-linecap="round" opacity="0.55">${details}</g>`,
    `<g fill="none" stroke="${seam}" stroke-width="0.8" stroke-dasharray="2.6 2.2" opacity="0.4">${stitches}</g>`,
    `</g>`,
    `</g>`,
  ].join("");
}

/** Sous-couche d'éclairage, fusionnée sur le tissu et les impressions. */
export interface LightPass {
  blend: "soft-light" | "multiply" | "screen";
  opacity: number;
  markup: string;
}

/**
 * Éclairage : relief des plis, volumes, reflet et maille. Chaque passe est fusionnée seule
 * (un groupe découpé isolerait la fusion) et découpée au contour du vêtement.
 */
function lightPasses(shape: GarmentShape, id: string, transform: string): LightPass[] {
  const { x, y, width, height } = shape.box;
  const area = `x="${x}" y="${y}" width="${width}" height="${height}"`;
  const clip = (key: string) => `<clipPath id="${id}-${key}-clip"><path d="${shape.outline}"/></clipPath>`;
  const pass = (
    key: string,
    blend: LightPass["blend"],
    opacity: number,
    defs: string,
    body: string,
  ): LightPass => ({
    blend,
    opacity,
    markup: `<defs>${clip(key)}${defs}</defs><g transform="${transform}"><g clip-path="url(#${id}-${key}-clip)">${body}</g></g>`,
  });
  const half = width / 2;
  // Ombres douces sous les bras et le long des flancs.
  const creases = [
    `M${-half * 0.62} ${y + height * 0.28}Q${-half * 0.5} ${y + height * 0.55} ${-half * 0.58} ${y + height * 0.9}`,
    `M${half * 0.62} ${y + height * 0.28}Q${half * 0.5} ${y + height * 0.55} ${half * 0.58} ${y + height * 0.9}`,
  ]
    .map((d) => `<path d="${d}" fill="none" stroke="#000" stroke-width="26" stroke-linecap="round"/>`)
    .join("");
  return [
    // Plis : bruit large mis en relief par une lumière rasante, neutre (50 %) sur le plat.
    pass(
      "folds",
      "soft-light",
      0.85,
      `<filter id="${id}-folds" filterUnits="userSpaceOnUse" ${area} color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.0055 0.0035" numOctaves="4" seed="11"/><feDiffuseLighting surfaceScale="15" diffuseConstant="0.58" lighting-color="#fff"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting></filter>`,
      `<rect ${area} filter="url(#${id}-folds)"/>`,
    ),
    pass(
      "shade",
      "multiply",
      1,
      `<linearGradient id="${id}-sides" x1="0" x2="1" y1="0" y2="0"><stop offset="0.12" stop-color="#000" stop-opacity="0.16"/><stop offset="0.3" stop-color="#000" stop-opacity="0.04"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="0.7" stop-color="#000" stop-opacity="0.04"/><stop offset="0.88" stop-color="#000" stop-opacity="0.16"/></linearGradient><filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>`,
      `<rect ${area} fill="url(#${id}-sides)"/><g filter="url(#${id}-soft)" opacity="0.12">${creases}</g>`,
    ),
    pass(
      "sheen",
      "screen",
      1,
      `<radialGradient id="${id}-sheen" cx="0.42" cy="0.3" r="0.55"><stop offset="0" stop-color="#fff" stop-opacity="0.2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
      `<rect ${area} fill="url(#${id}-sheen)"/>`,
    ),
    // Maille : grain fin qui fait « entrer » l'encre dans le tissu.
    pass(
      "knit",
      "soft-light",
      0.3,
      `<filter id="${id}-knit" filterUnits="userSpaceOnUse" ${area} color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.55" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1"/></filter>`,
      `<rect ${area} filter="url(#${id}-knit)"/>`,
    ),
  ];
}

/** Les trois couches d'une vue, dans un repère commun dont l'origine est le coin du cadre. */
export function renderGarmentLayers(input: GarmentRenderInput): GarmentLayers {
  const shape = garmentShape(input.category, input.view);
  const { kx, ky } = garmentScale(input.view, input.sizing);
  const id = input.idPrefix ?? `g${input.view.toLowerCase()}`;
  const box = {
    x: shape.box.x * kx,
    y: shape.box.y * ky,
    width: shape.box.width * kx,
    height: shape.box.height * ky,
  };
  // Origine du cadre en (0, 0) : l'export PNG lit un viewBox « 0 0 w h ».
  const origin = `translate(${n(-box.x)} ${n(-box.y)})`;
  const scaled = `${origin} scale(${n(kx * 1000) / 1000} ${n(ky * 1000) / 1000})`;
  const zones = new Map(input.zones.filter((z) => z.view === input.view).map((z) => [z.key, z]));
  const prints = input.elements
    .map((el, i) => ({ el, i }))
    .filter(({ el }) => zones.has(el.zoneKey) && !(el.id && input.skip?.has(el.id)))
    .sort((a, b) => (a.el.zIndex ?? a.i) - (b.el.zIndex ?? b.i))
    .map(({ el, i }) => {
      const { zone, k } = sizedZone(zones.get(el.zoneKey)!, input.sizing);
      const studio = toStudioElement(sizedElement(el, k), zone, `${id}-${el.id ?? i}`);
      return studio ? renderElement(studio) : "";
    })
    .join("");
  return {
    box,
    viewBox: `0 0 ${n(box.width)} ${n(box.height)}`,
    base: baseLayer(shape, input.color, id, scaled),
    prints: `<g transform="${origin}">${prints}</g>`,
    light: lightPasses(shape, id, scaled),
  };
}

/** Passe d'éclairage dans un SVG : groupe fusionné avec ce qui est dessous. */
export function lightMarkup(pass: LightPass) {
  const opacity = pass.opacity < 1 ? ` opacity="${pass.opacity}"` : "";
  return `<g style="mix-blend-mode:${pass.blend}"${opacity}>${pass.markup}</g>`;
}

/**
 * Vue complète en SVG autonome (aperçu, BAT, maquette PNG) : impressions limitées au tissu,
 * éclairage fusionné dans un groupe isolé.
 */
export function renderGarment(input: GarmentRenderInput & { width?: number }) {
  const layers = renderGarmentLayers(input);
  const shape = garmentShape(input.category, input.view);
  const { kx, ky } = garmentScale(input.view, input.sizing);
  const id = input.idPrefix ?? `g${input.view.toLowerCase()}`;
  const clip = `<clipPath id="${id}-print"><path d="${shape.outline}" transform="translate(${n(-layers.box.x)} ${n(-layers.box.y)}) scale(${n(kx * 1000) / 1000} ${n(ky * 1000) / 1000})"/></clipPath>`;
  const width = input.width ?? layers.box.width;
  const height = (width * layers.box.height) / layers.box.width;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${layers.viewBox}" width="${n(width)}" height="${n(height)}"><defs>${clip}</defs><g style="isolation:isolate">${layers.base}<g clip-path="url(#${id}-print)">${layers.prints}</g>${layers.light.map(lightMarkup).join("")}</g></svg>`;
}
