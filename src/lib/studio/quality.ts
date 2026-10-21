import { contrastRatio, ensureContrast } from "@/lib/render/color";
import { getFont } from "@/lib/render/fonts";
import type { StudioBrand } from "./brand";
import { isNeutral, nearestColor } from "./color";
import { mapElements, mapPage } from "./doc";
import { aabb, intersects } from "./geometry";
import { imagePlacement } from "./render";
import { backdropColor } from "./smart";
import { relayout } from "./text";
import type { DesignDoc, DesignElement, DesignPage, Paint, TextElement } from "./types";

// Contrôle qualité d'une création, avant export : lisibilité (contraste WCAG, corps minimal),
// impression (zone de sécurité, fond perdu, résolution des photos), cohérence de marque
// (couleurs hors palette, nombre de polices). Chaque problème peut porter sa correction.

export type QualityCode =
  | "contrast"
  | "textOverPhoto"
  | "tinyText"
  | "safeMargin"
  | "offPage"
  | "bleed"
  | "lowResolution"
  | "upscaled"
  | "offBrand"
  | "tooManyFonts"
  | "emptyText"
  | "hidden"
  | "textOverlap";

export interface QualityIssue {
  id: string;
  code: QualityCode;
  severity: "error" | "warning" | "info";
  pageIndex: number;
  elementId?: string;
  params?: Record<string, string | number>;
  /** Correction automatique (document à jour → document corrigé). */
  fix?: (doc: DesignDoc) => DesignDoc;
}

const SAFE_MM = 5;
const MIN_PRINT_PT = 6;
const COMFORT_PRINT_PT = 8;

const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

/** px de document → mm (formats imprimés). */
const mmPerPx = (doc: DesignDoc) => (doc.print ? doc.print.widthMm / doc.width : 0);

function isLarge(el: TextElement, doc: DesignDoc) {
  // Grand texte WCAG : 18 pt, ou 14 pt gras, rapporté à une page écran de 1080 px de large.
  const reference = Math.min(doc.width, doc.height) / 1080;
  const pt = (el.fontSize / reference) * 0.75;
  return pt >= 24 || (pt >= 18.66 && el.fontWeight >= 700);
}

function moveInside(el: DesignElement, doc: DesignDoc, inset: number): DesignElement {
  const box = aabb(el);
  let dx = 0;
  let dy = 0;
  if (box.width <= doc.width - 2 * inset) {
    if (box.x < inset) dx = inset - box.x;
    else if (box.x + box.width > doc.width - inset) dx = doc.width - inset - box.x - box.width;
  }
  if (box.height <= doc.height - 2 * inset) {
    if (box.y < inset) dy = inset - box.y;
    else if (box.y + box.height > doc.height - inset) dy = doc.height - inset - box.y - box.height;
  }
  return { ...el, x: el.x + dx, y: el.y + dy };
}

const fixElement =
  (pageIndex: number, id: string, fn: (el: DesignElement, doc: DesignDoc) => DesignElement) =>
  (doc: DesignDoc): DesignDoc =>
    mapElements(doc, pageIndex, new Set([id]), (el) => fn(el, doc));

function paintColors(paint: Paint): string[] {
  if (paint.type === "solid") return [paint.color];
  if (paint.type === "linear" || paint.type === "radial") return paint.stops.map((s) => s.color);
  return [];
}

function mapPaint(paint: Paint, fn: (c: string) => string): Paint {
  if (paint.type === "solid") return { ...paint, color: fn(paint.color) };
  if (paint.type === "linear" || paint.type === "radial") return { ...paint, stops: paint.stops.map((s) => ({ ...s, color: fn(s.color) })) };
  return paint;
}

function elementColors(el: DesignElement): string[] {
  switch (el.type) {
    case "text":
      return [...paintColors(el.fill), ...(el.stroke ? [el.stroke.color] : []), ...(el.highlight ? [el.highlight.color] : [])];
    case "shape":
      return [...paintColors(el.fill), ...(el.stroke ? [el.stroke.color] : [])];
    case "icon":
      return [el.color];
    default:
      return [];
  }
}

function snapColors(el: DesignElement, palette: string[]): DesignElement {
  const snap = (c: string) => (isNeutral(c) ? c : nearestColor(c, palette).color);
  switch (el.type) {
    case "text":
      return {
        ...el,
        fill: mapPaint(el.fill, snap),
        stroke: el.stroke ? { ...el.stroke, color: snap(el.stroke.color) } : el.stroke,
        highlight: el.highlight ? { ...el.highlight, color: snap(el.highlight.color) } : el.highlight,
      };
    case "shape":
      return { ...el, fill: mapPaint(el.fill, snap), stroke: el.stroke ? { ...el.stroke, color: snap(el.stroke.color) } : el.stroke };
    case "icon":
      return { ...el, color: snap(el.color) };
    default:
      return el;
  }
}

function checkPage(doc: DesignDoc, page: DesignPage, pageIndex: number, brand: StudioBrand | null, issues: QualityIssue[]) {
  const push = (issue: Omit<QualityIssue, "id" | "pageIndex">) => issues.push({ ...issue, pageIndex, id: `${pageIndex}-${issue.code}-${issue.elementId ?? issues.length}` });
  const mm = mmPerPx(doc);
  const safe = mm ? SAFE_MM / mm : 0;
  const texts = page.elements.filter((el): el is TextElement => el.type === "text" && !el.hidden);
  const brandPalette = brand?.palette ?? [];

  for (const el of page.elements) {
    if (el.hidden) {
      push({ code: "hidden", severity: "info", elementId: el.id });
      continue;
    }
    const box = aabb(el);
    const onPage = intersects(box, { x: 0, y: 0, width: doc.width, height: doc.height });

    if (el.type === "text") {
      if (!el.text.trim()) {
        push({ code: "emptyText", severity: "info", elementId: el.id, fix: (d) => mapPage(d, pageIndex, (p) => ({ ...p, elements: p.elements.filter((e) => e.id !== el.id) })) });
        continue;
      }
      // Contraste du texte sur ce qui se trouve derrière lui.
      if (el.fill.type === "solid" && !el.highlight) {
        const backdrop = backdropColor(page, el);
        if (backdrop === null) {
          if (!el.shadow && !el.stroke) {
            push({
              code: "textOverPhoto",
              severity: "warning",
              elementId: el.id,
              fix: fixElement(pageIndex, el.id, (e) => ({ ...e, shadow: { x: 0, y: el.fontSize * 0.04, blur: el.fontSize * 0.25, color: "#000000", opacity: 0.55 } })),
            });
          }
        } else {
          const ratio = contrastRatio(el.fill.color, backdrop);
          const minimum = isLarge(el, doc) ? 3 : 4.5;
          if (ratio < minimum) {
            push({
              code: "contrast",
              severity: ratio < 2 ? "error" : "warning",
              elementId: el.id,
              params: { ratio: round(ratio), minimum },
              fix: fixElement(pageIndex, el.id, (e) => (e.type === "text" ? { ...e, fill: { type: "solid", color: ensureContrast(el.fill.type === "solid" ? el.fill.color : "#000000", backdrop, minimum) } } : e)),
            });
          }
        }
      }
      // Corps minimal : 6 pt à l'impression (8 pt conseillés), ~2,2 % du petit côté à l'écran.
      if (mm) {
        const pt = (el.fontSize * mm * 72) / 25.4;
        if (pt < COMFORT_PRINT_PT) {
          const target = ((COMFORT_PRINT_PT * 25.4) / 72 / mm) * 1.01;
          push({
            code: "tinyText",
            severity: pt < MIN_PRINT_PT ? "error" : "warning",
            elementId: el.id,
            params: { size: `${round(pt)} pt`, minimum: `${COMFORT_PRINT_PT} pt` },
            fix: fixElement(pageIndex, el.id, (e) => (e.type === "text" ? relayout({ ...e, fontSize: target }) : e)),
          });
        }
      } else {
        const minimum = Math.min(doc.width, doc.height) * 0.022;
        if (el.fontSize < minimum * 0.999) {
          push({
            code: "tinyText",
            severity: "warning",
            elementId: el.id,
            params: { size: `${Math.round(el.fontSize)} px`, minimum: `${Math.ceil(minimum)} px` },
            fix: fixElement(pageIndex, el.id, (e) => (e.type === "text" ? relayout({ ...e, fontSize: Math.ceil(minimum) }) : e)),
          });
        }
      }
    }

    const essential = el.type === "text" || el.type === "icon" || el.role === "logo" || el.type === "svg" || el.role === "cta";
    if (essential && onPage && el.role !== "decor") {
      const off = box.x < -0.5 || box.y < -0.5 || box.x + box.width > doc.width + 0.5 || box.y + box.height > doc.height + 0.5;
      if (off) {
        push({ code: "offPage", severity: "warning", elementId: el.id, fix: fixElement(pageIndex, el.id, (e, d) => moveInside(e, d, safe)) });
      } else if (safe && (box.x < safe || box.y < safe || box.x + box.width > doc.width - safe || box.y + box.height > doc.height - safe)) {
        push({ code: "safeMargin", severity: "warning", elementId: el.id, params: { margin: `${SAFE_MM} mm` }, fix: fixElement(pageIndex, el.id, (e, d) => moveInside(e, d, safe)) });
      }
    }

    // Fond perdu : un aplat ou une photo qui touche un bord doit le dépasser de 3 mm.
    if (doc.print && (el.type === "shape" || el.type === "image") && !el.rotation) {
      const bleed = doc.print.bleedMm / mm;
      const touches = {
        left: Math.abs(el.x) < 1,
        top: Math.abs(el.y) < 1,
        right: Math.abs(el.x + el.width - doc.width) < 1,
        bottom: Math.abs(el.y + el.height - doc.height) < 1,
      };
      if (Object.values(touches).some(Boolean)) {
        push({
          code: "bleed",
          severity: "warning",
          elementId: el.id,
          params: { bleed: `${doc.print.bleedMm} mm` },
          fix: fixElement(pageIndex, el.id, (e) => {
            let { x, y, width, height } = e;
            if (touches.left) {
              x -= bleed;
              width += bleed;
            }
            if (touches.top) {
              y -= bleed;
              height += bleed;
            }
            if (touches.right) width += bleed;
            if (touches.bottom) height += bleed;
            return { ...e, x, y, width, height };
          }),
        });
      }
    }

    // Résolution des photos : 150 dpi minimum à l'impression, pas d'agrandissement à l'écran.
    if (el.type === "image") {
      const place = imagePlacement(el);
      const scale = place.width / el.naturalWidth;
      if (mm) {
        const dpi = (el.naturalWidth / (place.width * mm)) * 25.4;
        if (dpi < 150) push({ code: "lowResolution", severity: dpi < 96 ? "error" : "warning", elementId: el.id, params: { dpi: Math.round(dpi) } });
      } else if (scale > 1.5) {
        push({ code: "upscaled", severity: "warning", elementId: el.id, params: { factor: round(scale) } });
      }
    }

    // Couleurs hors marque (les neutres sont toujours admis).
    if (brandPalette.length) {
      const off = elementColors(el).filter((c) => !isNeutral(c) && nearestColor(c, brandPalette).distance > 14);
      if (off.length) {
        push({
          code: "offBrand",
          severity: "info",
          elementId: el.id,
          params: { color: off[0]!.toUpperCase() },
          fix: fixElement(pageIndex, el.id, (e) => snapColors(e, brandPalette)),
        });
      }
    }
  }

  // Textes qui se recouvrent.
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = aabb(texts[i]!);
      const b = aabb(texts[j]!);
      const overlapW = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapH = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (overlapW > 0 && overlapH > Math.min(a.height, b.height) * 0.35) {
        push({ code: "textOverlap", severity: "warning", elementId: texts[j]!.id });
      }
    }
  }

  // Fond de page hors marque.
  if (brandPalette.length) {
    const off = paintColors(page.background).filter((c) => !isNeutral(c) && nearestColor(c, brandPalette).distance > 14);
    if (off.length) {
      push({
        code: "offBrand",
        severity: "info",
        params: { color: off[0]!.toUpperCase() },
        fix: (d) => mapPage(d, pageIndex, (p) => ({ ...p, background: mapPaint(p.background, (c) => (isNeutral(c) ? c : nearestColor(c, brandPalette).color)) })),
      });
    }
  }
}

export function checkDesign(doc: DesignDoc, brand: StudioBrand | null): QualityIssue[] {
  const issues: QualityIssue[] = [];
  doc.pages.forEach((page, index) => checkPage(doc, page, index, brand, issues));
  const families = new Set(doc.pages.flatMap((p) => p.elements.filter((el): el is TextElement => el.type === "text" && !el.hidden).map((el) => getFont(el.fontId).name)));
  if (families.size > 3) {
    issues.push({ id: "fonts", code: "tooManyFonts", severity: "warning", pageIndex: 0, params: { count: families.size } });
  }
  const rank = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => rank[a.severity] - rank[b.severity] || a.pageIndex - b.pageIndex);
}

/** Score de 0 à 100 affiché dans l'éditeur. */
export function qualityScore(issues: QualityIssue[]) {
  const penalty = issues.reduce((sum, issue) => sum + (issue.severity === "error" ? 18 : issue.severity === "warning" ? 7 : 1), 0);
  return Math.max(0, 100 - penalty);
}

/** Applique toutes les corrections disponibles, dans l'ordre. */
export function fixAll(doc: DesignDoc, issues: QualityIssue[]) {
  return issues.reduce((current, issue) => (issue.fix ? issue.fix(current) : current), doc);
}

