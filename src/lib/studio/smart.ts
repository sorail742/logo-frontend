import { contrastRatio, ensureContrast, luminance, mix } from "@/lib/render/color";
import { FONT_PAIRINGS, type StudioBrand } from "./brand";
import { harmony, paintColor } from "./color";
import { createImage, newId, scaleElement } from "./doc";
import { aabb, union, type Box } from "./geometry";
import { naturalWidth, relayout } from "./text";
import type { DesignDoc, DesignElement, DesignPage, ImageElement, Paint, PrintSpec, ShapeElement, TextElement } from "./types";

// Fonctions « intelligentes » du Studio : redimensionnement magique vers un autre format,
// variations à la marque d'une page, et cadre photo rempli par une image.

// ─── Redimensionnement magique ───

export interface TargetFormat {
  width: number;
  height: number;
  print?: PrintSpec | null;
}

type Kind = "background" | "decor" | "content";

const margin = (width: number, height: number) => Math.min(width, height) * 0.07;

/**
 * Fond : rôle « background » ou élément qui couvre l'essentiel de la page ; décor : rôle « decor »
 * ou élément qui déborde de la page ; contenu : le reste (titres, textes, logos, boutons…).
 */
function classify(el: DesignElement, width: number, height: number): Kind {
  if (el.role === "background") return "background";
  if (el.role === "decor") return "decor";
  const box = aabb(el);
  if (el.type !== "text" && box.width * box.height >= width * height * 0.7) return "background";
  const off = box.x < -1 || box.y < -1 || box.x + box.width > width + 1 || box.y + box.height > height + 1;
  if (off && el.type !== "text") return "decor";
  return "content";
}

/** Place un élément pour que le centre de sa boîte soit (cx, cy). */
const centerAt = <T extends DesignElement>(el: T, cx: number, cy: number): T => ({ ...el, x: cx - el.width / 2, y: cy - el.height / 2 });

interface Band {
  items: DesignElement[];
  box: Box;
}

/** Regroupe le contenu en bandes horizontales (éléments qui se chevauchent verticalement). */
function bands(items: DesignElement[]): Band[] {
  const sorted = [...items].map((el) => ({ el, box: aabb(el) })).sort((a, b) => a.box.y - b.box.y);
  const out: Band[] = [];
  for (const { el, box } of sorted) {
    const last = out.at(-1);
    if (last && box.y < last.box.y + last.box.height - 1) {
      last.items.push(el);
      last.box = union([last.box, box])!;
    } else {
      out.push({ items: [el], box });
    }
  }
  return out;
}

function adaptPage(page: DesignPage, source: { width: number; height: number }, target: TargetFormat): DesignPage {
  const { width: w, height: h } = source;
  const { width: tw, height: th } = target;
  const sx = tw / w;
  const sy = th / h;
  const s = Math.min(sx, sy);
  const sd = Math.sqrt(sx * sy);
  const m = margin(w, h);
  const tm = margin(tw, th);
  const order = new Map(page.elements.map((el, i) => [el.id, i]));
  const placed: DesignElement[] = [];
  const content: DesignElement[] = [];

  for (const el of page.elements) {
    const kind = classify(el, w, h);
    if (kind === "background") {
      // Étiré pour couvrir le même espace (une photo en recouvrement se recadre seule).
      const stretched = el.type === "text" || el.type === "icon" || el.type === "svg" ? scaleElement(el, sd) : scaleElement(el, s, sx, sy);
      placed.push(centerAt(stretched, (el.x + el.width / 2) * sx, (el.y + el.height / 2) * sy));
    } else if (kind === "decor") {
      // Ancré au coin le plus proche, à l'échelle moyenne.
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const scaled = scaleElement(el, sd);
      const nx = cx < w / 2 ? cx * sd : tw - (w - cx) * sd;
      const ny = cy < h / 2 ? cy * sd : th - (h - cy) * sd;
      placed.push(centerAt(scaled, nx, ny));
    } else {
      content.push(el);
    }
  }

  const groups = bands(content);
  if (groups.length) {
    const contentBox = union(groups.map((g) => g.box))!;
    // Chaque bande garde sa composition ; elle peut grandir un peu si la place le permet.
    const boost = Math.sqrt(Math.max(1, Math.max(sx, sy) / s));
    const scales = groups.map((g) => Math.max(Math.min(s * boost, (tw - 2 * tm) / Math.max(1, g.box.width)), Math.min(s, (tw - 2 * tm) / Math.max(1, g.box.width))));
    let heights = groups.map((g, i) => g.box.height * scales[i]!);
    const gaps = groups.slice(1).map((g, i) => Math.max(0, g.box.y - (groups[i]!.box.y + groups[i]!.box.height)));
    const available = th - 2 * tm;
    let total = heights.reduce((a, b) => a + b, 0);
    if (total > available * 0.96) {
      const k = (available * 0.96) / total;
      scales.forEach((_, i) => (scales[i] = scales[i]! * k));
      heights = heights.map((x) => x * k);
      total = available * 0.96;
    }
    const gapSum = gaps.reduce((a, b) => a + b, 0);
    // Hauteur visée : celle du contenu d'origine, étirée comme la page, dans la zone utile.
    const wanted = Math.min(available, Math.max(total + gapSum * s, contentBox.height * sy * 0.9));
    const gapScale = gapSum > 0 ? Math.max(0, (wanted - total) / gapSum) : 0;
    const stackHeight = total + gapSum * gapScale;
    const centerRatio = (contentBox.y + contentBox.height / 2) / h;
    let y = Math.min(Math.max(tm, centerRatio * th - stackHeight / 2), th - tm - stackHeight);
    if (stackHeight > available) y = tm;

    groups.forEach((group, i) => {
      const k = scales[i]!;
      const gw = group.box.width * k;
      const centered = Math.abs(group.box.x + group.box.width / 2 - w / 2) < w * 0.06;
      const nearLeft = group.box.x <= w * 0.2;
      const nearRight = w - (group.box.x + group.box.width) <= w * 0.2;
      let gx: number;
      if (centered) gx = (tw - gw) / 2;
      else if (nearLeft && !nearRight) gx = Math.max(tm, (group.box.x / m) * tm);
      else if (nearRight && !nearLeft) gx = tw - Math.max(tm, ((w - group.box.x - group.box.width) / m) * tm) - gw;
      else gx = ((group.box.x + group.box.width / 2) / w) * tw - gw / 2;
      gx = Math.min(Math.max(gx, Math.min(tm, (tw - gw) / 2)), tw - gw - Math.min(tm, (tw - gw) / 2));
      for (const el of group.items) {
        const scaled = scaleElement(el, k);
        const cx = gx + (el.x + el.width / 2 - group.box.x) * k;
        const cy = y + (el.y + el.height / 2 - group.box.y) * k;
        placed.push(centerAt(scaled, cx, cy));
      }
      y += heights[i]! + (gaps[i] ?? 0) * gapScale;
    });
  }

  const elements = placed
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!)
    .map((el) => (el.type === "text" ? relayout(el) : el));
  return { ...page, elements };
}

/** Le même document dans un autre format, page par page. */
export function adaptDoc(doc: DesignDoc, target: TargetFormat): DesignDoc {
  return {
    ...doc,
    width: target.width,
    height: target.height,
    print: target.print ?? null,
    pages: doc.pages.map((page) => ({ ...adaptPage(page, doc, target), id: newId() })),
  };
}

// ─── Cadres photo ───

const FRAME_MASKS: Partial<Record<ShapeElement["shape"], ImageElement["mask"]>> = {
  ellipse: "circle",
  arch: "arch",
  blob: "blob",
};

/** Un cadre (forme) prend une photo : même boîte, masque assorti à la forme. */
export function fillFrame(frame: DesignElement, image: { src: string; naturalWidth: number; naturalHeight: number }): ImageElement {
  const mask: ImageElement["mask"] =
    frame.type === "shape" ? (FRAME_MASKS[frame.shape] ?? (frame.shape === "rect" && frame.radius ? "rounded" : "none")) : frame.type === "image" ? frame.mask : "none";
  const radius = frame.type === "shape" && frame.shape === "rect" ? frame.radius : frame.type === "image" ? frame.radius : undefined;
  return createImage(image.src, image.naturalWidth, image.naturalHeight, {
    id: frame.id,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    rotation: frame.rotation,
    opacity: frame.opacity,
    flipX: frame.flipX,
    flipY: frame.flipY,
    shadow: frame.shadow,
    role: "photo",
    mask,
    radius,
  });
}

/** Élément qui peut recevoir une photo (cadre ou photo existante). */
export function isFrame(el: DesignElement) {
  return el.role === "photo" && (el.type === "shape" || el.type === "image");
}

// ─── Variations ───

type ColorMap = (color: string) => string;

function mapPaint(paint: Paint, map: ColorMap): Paint {
  if (paint.type === "solid") return { ...paint, color: map(paint.color) };
  if (paint.type === "linear" || paint.type === "radial") return { ...paint, stops: paint.stops.map((s) => ({ ...s, color: map(s.color) })) };
  return paint;
}

function recolor(page: DesignPage, map: ColorMap): DesignPage {
  const cache = new Map<string, string>();
  const m: ColorMap = (c) => {
    const key = c.toLowerCase();
    if (!cache.has(key)) cache.set(key, map(key));
    return cache.get(key)!;
  };
  return {
    ...page,
    background: mapPaint(page.background, m),
    elements: page.elements.map((el) => {
      switch (el.type) {
        case "text":
          return {
            ...el,
            fill: mapPaint(el.fill, m),
            stroke: el.stroke ? { ...el.stroke, color: m(el.stroke.color) } : el.stroke,
            highlight: el.highlight ? { ...el.highlight, color: m(el.highlight.color) } : el.highlight,
          };
        case "shape":
          return { ...el, fill: mapPaint(el.fill, m), stroke: el.stroke ? { ...el.stroke, color: m(el.stroke.color) } : el.stroke };
        case "icon":
          return { ...el, color: m(el.color) };
        default:
          return el;
      }
    }),
  };
}

/** Couleur sous le centre d'un élément : forme opaque la plus haute en dessous, sinon le fond. */
export function backdropColor(page: DesignPage, el: DesignElement): string | null {
  const index = page.elements.findIndex((e) => e.id === el.id);
  const box = aabb(el);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  for (let i = index - 1; i >= 0; i--) {
    const under = page.elements[i]!;
    if (under.hidden || under.opacity < 0.6) continue;
    const b = aabb(under);
    if (cx < b.x || cx > b.x + b.width || cy < b.y || cy > b.y + b.height) continue;
    if (under.type === "image") return null;
    if (under.type === "shape" && under.shape !== "line" && under.shape !== "arrow") {
      const color = paintColor(under.fill);
      if (color) return color;
    }
  }
  return paintColor(page.background) ?? "#ffffff";
}

/**
 * Rétablit la lisibilité après un changement de couleurs : textes (4,5:1), icônes (3:1) et
 * logo, remplacé par sa version blanche sur fond sombre ou couleur sur fond clair.
 */
function keepReadable(page: DesignPage, brand?: StudioBrand): DesignPage {
  return {
    ...page,
    elements: page.elements.map((el) => {
      if (el.type === "text" && el.fill.type === "solid" && !el.highlight) {
        const backdrop = backdropColor(page, el);
        if (!backdrop || contrastRatio(el.fill.color, backdrop) >= 3) return el;
        return { ...el, fill: { type: "solid", color: ensureContrast(el.fill.color, backdrop, 4.5) } };
      }
      if (el.type === "icon") {
        const backdrop = backdropColor(page, el);
        if (!backdrop || contrastRatio(el.color, backdrop) >= 3) return el;
        return { ...el, color: ensureContrast(el.color, backdrop, 3) };
      }
      if (el.type === "svg" && el.source === "logo" && brand) {
        const backdrop = backdropColor(page, el);
        const { white, color } = brand.logos;
        if (!backdrop || !white || !color) return el;
        const wanted = luminance(backdrop) < 0.35 ? white : color;
        return el.svg === white || el.svg === color ? { ...el, svg: wanted } : el;
      }
      return el;
    }),
  };
}

/** Change la police d'un texte ; un texte court qui épousait sa boîte est réduit pour y tenir. */
function withFont(el: TextElement, fontId: string, fontWeight: number): TextElement {
  const before = naturalWidth(el);
  // Une seule ligne qui remplit sa boîte (étiquette, bouton) ; un paragraphe se remet en page.
  const hugging = !el.curve && el.width >= before - 2 && el.width <= before * 1.15 + el.fontSize;
  const next = { ...el, fontId, fontWeight };
  if (hugging) {
    const after = naturalWidth(next);
    if (after > el.width) next.fontSize = el.fontSize * (el.width / after);
  }
  return relayout(next);
}

function swapFonts(page: DesignPage, pairing: (typeof FONT_PAIRINGS)[number]): DesignPage {
  const texts = page.elements.filter((el): el is TextElement => el.type === "text");
  const largest = Math.max(0, ...texts.map((t) => t.fontSize));
  return {
    ...page,
    elements: page.elements.map((el) => {
      if (el.type !== "text" || el.role === "logo") return el;
      const heading = el.role === "title" || (!el.role && el.fontSize >= largest * 0.6);
      const font = heading ? pairing[0] : pairing[1];
      return withFont(el, font.fontId, heading ? font.fontWeight : el.fontWeight >= 600 ? 700 : 400);
    }),
  };
}

function mirror(page: DesignPage, width: number): DesignPage {
  const flipAlign = (align: TextElement["align"]): TextElement["align"] => (align === "left" ? "right" : align === "right" ? "left" : align);
  return {
    ...page,
    background: page.background.type === "linear" ? { ...page.background, angle: 180 - page.background.angle } : page.background,
    elements: page.elements.map((el) => {
      const moved = { ...el, x: width - el.x - el.width, rotation: -el.rotation };
      return moved.type === "text" ? { ...moved, align: flipAlign(moved.align) } : moved;
    }),
  };
}

function reshape(page: DesignPage, salt: number): DesignPage {
  return {
    ...page,
    elements: page.elements.map((el) => (el.type === "shape" && el.shape === "blob" ? { ...el, seed: ((el.seed ?? 1) * 31 + salt) % 997 } : el)),
  };
}

export interface Variation {
  id: string;
  kind: "palette" | "fonts" | "mirror" | "dark" | "harmony" | "mix";
  page: DesignPage;
}

/**
 * Variations à la marque d'une page : permutations de la palette, mode sombre, harmonie de
 * couleurs, associations de polices, mise en page en miroir. Les textes restent lisibles.
 */
export function variations(page: DesignPage, doc: Pick<DesignDoc, "width" | "height">, brand: StudioBrand): Variation[] {
  const { primary, secondary, background } = brand.colors;
  const lower = (c: string) => c.toLowerCase();
  const swap = (pairs: [string, string][]): ColorMap => {
    const table = new Map<string, string>();
    for (const [a, b] of pairs) {
      table.set(lower(a), b);
    }
    return (c) => table.get(c) ?? c;
  };
  // Fond inversé : un fond clair devient sombre (teinte de la marque), un fond sombre ou saturé devient clair.
  const pageBg = paintColor(page.background) ?? background;
  const inverted = luminance(pageBg) > 0.45 ? mix(primary, "#000000", 0.72) : luminance(background) > 0.6 ? background : mix(primary, "#ffffff", 0.9);
  const analog = harmony(primary, "analogous");
  const currentFont = page.elements.find((el): el is TextElement => el.type === "text" && el.role === "title")?.fontId;
  const pairings = FONT_PAIRINGS.filter(([h]) => h.fontId !== currentFont);
  const pick = (i: number) => pairings[(i * 5 + 3) % pairings.length]!;

  const out: Variation[] = [
    { id: "swap", kind: "palette", page: keepReadable(recolor(page, swap([[primary, secondary], [secondary, primary]])), brand) },
    { id: "dark", kind: "dark", page: keepReadable({ ...recolor(page, swap([[pageBg, inverted], [inverted, pageBg]])), background: { type: "solid", color: inverted } }, brand) },
    { id: "fonts-a", kind: "fonts", page: swapFonts(page, pick(0)) },
    { id: "mirror", kind: "mirror", page: reshape(mirror(page, doc.width), 7) },
    { id: "harmony", kind: "harmony", page: keepReadable(recolor(page, swap([[primary, analog[0]!], [secondary, analog[2]!]])), brand) },
    { id: "fonts-b", kind: "fonts", page: swapFonts(reshape(page, 13), pick(1)) },
    { id: "mix", kind: "mix", page: swapFonts(keepReadable(recolor(mirror(page, doc.width), swap([[primary, secondary], [secondary, primary]])), brand), pick(2)) },
    { id: "light", kind: "palette", page: keepReadable(recolor(page, swap([[primary, mix(primary, "#ffffff", 0.82)], [background, primary]])), brand) },
  ];
  return out.map((v) => ({ ...v, page: { ...v.page, id: newId(), elements: v.page.elements.map((el) => ({ ...el, id: newId() })) } }));
}
