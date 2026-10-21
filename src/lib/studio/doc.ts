import type { IconNode } from "@/lib/render/icons";
import type { DesignFormat } from "./formats";
import type {
  DesignDoc,
  DesignElement,
  DesignPage,
  IconElement,
  ImageElement,
  Paint,
  ShapeElement,
  ShapeKind,
  SvgElement,
  TextElement,
} from "./types";

// Création et transformations pures du document (aucune dépendance au navigateur).

export function newId() {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2);
  return random.slice(0, 12);
}

export const solid = (color: string): Paint => ({ type: "solid", color });

export function createPage(background: Paint = solid("#ffffff")): DesignPage {
  return { id: newId(), background, elements: [] };
}

export function createDoc(format: Pick<DesignFormat, "width" | "height" | "print">): DesignDoc {
  return { version: 1, width: format.width, height: format.height, print: format.print ?? null, pages: [createPage()] };
}

const base = { rotation: 0, opacity: 1 };

export function createText(patch: Partial<TextElement> & Pick<TextElement, "text">): TextElement {
  return {
    id: newId(),
    type: "text",
    x: 0,
    y: 0,
    width: 400,
    height: 60,
    ...base,
    fontId: "montserrat",
    fontWeight: 400,
    fontSize: 40,
    letterSpacing: 0,
    lineHeight: 1.2,
    align: "left",
    uppercase: false,
    fill: solid("#111827"),
    ...patch,
  };
}

export function createShape(shape: ShapeKind, patch: Partial<ShapeElement> = {}): ShapeElement {
  const line = shape === "line" || shape === "arrow";
  return {
    id: newId(),
    type: "shape",
    shape,
    x: 0,
    y: 0,
    width: 240,
    height: line ? 24 : 240,
    ...base,
    fill: solid("#0f766e"),
    stroke: line ? { color: "#111827", width: 6, dash: "solid" } : null,
    radius: shape === "rect" ? 0 : undefined,
    sides: shape === "polygon" ? 6 : shape === "star" ? 5 : undefined,
    innerRatio: shape === "star" ? 0.5 : undefined,
    seed: shape === "blob" ? Math.floor(Math.random() * 1000) : undefined,
    ...patch,
  };
}

export function createIcon(iconId: string, node: IconNode, patch: Partial<IconElement> = {}): IconElement {
  return { id: newId(), type: "icon", iconId, node, x: 0, y: 0, width: 160, height: 160, ...base, color: "#111827", strokeWidth: 2, ...patch };
}

export function createImage(src: string, naturalWidth: number, naturalHeight: number, patch: Partial<ImageElement> = {}): ImageElement {
  return { id: newId(), type: "image", src, naturalWidth, naturalHeight, x: 0, y: 0, width: naturalWidth, height: naturalHeight, ...base, fit: "cover", mask: "none", ...patch };
}

export function createSvg(svg: string, source: SvgElement["source"], patch: Partial<SvgElement> = {}): SvgElement {
  return { id: newId(), type: "svg", svg, source, x: 0, y: 0, width: 300, height: 200, ...base, ...patch };
}

/** Copie d'un élément avec un nouvel identifiant, décalée. */
export function cloneElement<T extends DesignElement>(el: T, offset = 0): T {
  return { ...structuredClone(el), id: newId(), x: el.x + offset, y: el.y + offset };
}

export function clonePage(page: DesignPage): DesignPage {
  return { ...structuredClone(page), id: newId(), elements: page.elements.map((el) => cloneElement(el)) };
}

/** Remplace la page `index` par le résultat de `fn` (document immuable). */
export function mapPage(doc: DesignDoc, index: number, fn: (page: DesignPage) => DesignPage): DesignDoc {
  return { ...doc, pages: doc.pages.map((page, i) => (i === index ? fn(page) : page)) };
}

export function mapElements(doc: DesignDoc, pageIndex: number, ids: ReadonlySet<string>, fn: (el: DesignElement) => DesignElement): DesignDoc {
  return mapPage(doc, pageIndex, (page) => ({ ...page, elements: page.elements.map((el) => (ids.has(el.id) ? fn(el) : el)) }));
}

/**
 * Met un élément à l'échelle (taille, corps du texte, contours, rayons, ombres) autour de
 * l'origine de la page ; `sx`/`sy` différents déforment seulement les formes et les photos.
 */
export function scaleElement<T extends DesignElement>(el: T, s: number, sx = s, sy = s): T {
  const uniform = el.type === "text" || el.type === "icon" || el.type === "svg";
  const kx = uniform ? s : sx;
  const ky = uniform ? s : sy;
  const scaled: DesignElement = {
    ...el,
    x: el.x * sx + (el.width * sx - el.width * kx) / 2,
    y: el.y * sy + (el.height * sy - el.height * ky) / 2,
    width: el.width * kx,
    height: el.height * ky,
    shadow: el.shadow ? { ...el.shadow, x: el.shadow.x * s, y: el.shadow.y * s, blur: el.shadow.blur * s } : el.shadow,
  };
  switch (scaled.type) {
    case "text":
      scaled.fontSize = scaled.fontSize * s;
      if (scaled.stroke) scaled.stroke = { ...scaled.stroke, width: scaled.stroke.width * s };
      if (scaled.highlight) scaled.highlight = { ...scaled.highlight, padding: scaled.highlight.padding * s, radius: scaled.highlight.radius * s };
      break;
    case "shape":
      if (scaled.stroke) scaled.stroke = { ...scaled.stroke, width: scaled.stroke.width * s };
      if (scaled.radius) scaled.radius = scaled.radius * s;
      break;
    case "image":
      if (scaled.radius) scaled.radius = scaled.radius * s;
      if (scaled.filters?.blur) scaled.filters = { ...scaled.filters, blur: scaled.filters.blur * s };
      break;
  }
  return scaled as T;
}

/** Toutes les couleurs pleines utilisées dans le document (palette « couleurs du document »). */
export function documentColors(doc: DesignDoc): string[] {
  const colors = new Set<string>();
  const addPaint = (paint: Paint | undefined) => {
    if (!paint) return;
    if (paint.type === "solid") colors.add(paint.color.toLowerCase());
    if (paint.type === "linear" || paint.type === "radial") paint.stops.forEach((s) => colors.add(s.color.toLowerCase()));
  };
  for (const page of doc.pages) {
    addPaint(page.background);
    for (const el of page.elements) {
      if (el.type === "text" || el.type === "shape") addPaint(el.fill);
      if ((el.type === "text" || el.type === "shape") && el.stroke) colors.add(el.stroke.color.toLowerCase());
      if (el.type === "icon") colors.add(el.color.toLowerCase());
    }
  }
  return [...colors];
}

/** Polices utilisées (chargement avant mesure ou export). */
export function documentFonts(doc: DesignDoc) {
  return doc.pages.flatMap((page) => page.elements.filter((el): el is TextElement => el.type === "text").map((el) => ({ fontId: el.fontId, fontWeight: el.fontWeight })));
}
