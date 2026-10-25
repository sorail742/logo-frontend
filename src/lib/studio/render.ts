import { cssFontFamily, getFont } from "@/lib/render/fonts";
import { adjustFilter, effectsFilter, photoPlacement, vignetteGradient } from "@/lib/render/photo";
import { escapeXml } from "@/lib/render/svg";
import { hasEffects, letteringLayers } from "./lettering";
import type {
  DesignDoc,
  DesignElement,
  DesignPage,
  ImageElement,
  Paint,
  Shadow,
  ShapeElement,
  Stroke,
  SvgElement,
  TextElement,
} from "./types";

// Rendu SVG d'une page du Studio. Le canevas de l'éditeur, les exports PNG/JPG du navigateur et
// le rendu serveur (texte en tracés, PDF) partagent ces règles : chaque élément est dessiné dans
// son repère local (0, 0, largeur, hauteur), puis placé par une transformation autour de son centre.

const n = (value: number) => Math.round(value * 100) / 100;

export interface RenderOptions {
  /** Éléments à ne pas dessiner (texte en cours d'édition). */
  skip?: ReadonlySet<string>;
}

// ─── Peintures, contours, ombres ───

function stops(paint: Extract<Paint, { stops: unknown }>) {
  return paint.stops.map((stop) => `<stop offset="${n(stop.offset)}" stop-color="${stop.color}"/>`).join("");
}

/** Valeur d'un attribut fill/stroke ; les dégradés sont ajoutés aux définitions. */
export function paintValue(paint: Paint, id: string, defs: string[]) {
  switch (paint.type) {
    case "none":
      return "none";
    case "solid":
      return paint.color;
    case "linear": {
      const rad = (paint.angle * Math.PI) / 180;
      const dx = Math.cos(rad) / 2;
      const dy = Math.sin(rad) / 2;
      defs.push(`<linearGradient id="${id}" x1="${n(0.5 - dx)}" y1="${n(0.5 - dy)}" x2="${n(0.5 + dx)}" y2="${n(0.5 + dy)}">${stops(paint)}</linearGradient>`);
      return `url(#${id})`;
    }
    case "radial":
      defs.push(`<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5">${stops(paint)}</radialGradient>`);
      return `url(#${id})`;
  }
}

function strokeAttrs(stroke: Stroke | null | undefined, extraWidth = 1) {
  if (!stroke || stroke.width <= 0) return "";
  const width = stroke.width * extraWidth;
  const dash =
    stroke.dash === "dashed" ? ` stroke-dasharray="${n(width * 3)} ${n(width * 2)}"` : stroke.dash === "dotted" ? ` stroke-dasharray="0 ${n(width * 2)}" stroke-linecap="round"` : "";
  return ` stroke="${stroke.color}" stroke-width="${n(width)}" stroke-linejoin="round"${dash}`;
}

function shadowFilter(id: string, shadow: Shadow) {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feDropShadow dx="${n(shadow.x)}" dy="${n(shadow.y)}" stdDeviation="${n(shadow.blur / 2)}" flood-color="${shadow.color}" flood-opacity="${n(shadow.opacity)}"/></filter>`;
}

// ─── Formes ───

/** Générateur pseudo-aléatoire déterministe (formes organiques, décors). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Forme organique fermée, lissée (Catmull-Rom), inscrite dans la boîte. */
export function blobPath(width: number, height: number, seed = 1) {
  const random = mulberry32(seed);
  const count = 7;
  const points = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const radius = 0.72 + random() * 0.28;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const;
  });
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const fit = points.map(([x, y]) => [((x - minX) / (maxX - minX)) * width, ((y - minY) / (maxY - minY)) * height] as const);
  let d = `M${n(fit[0]![0])} ${n(fit[0]![1])}`;
  for (let i = 0; i < count; i++) {
    const p0 = fit[(i - 1 + count) % count]!;
    const p1 = fit[i]!;
    const p2 = fit[(i + 1) % count]!;
    const p3 = fit[(i + 2) % count]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0]!)} ${n(c1[1]!)} ${n(c2[0]!)} ${n(c2[1]!)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return `${d}Z`;
}

function regularPoints(width: number, height: number, count: number, inner?: number) {
  const total = inner === undefined ? count : count * 2;
  return Array.from({ length: total }, (_, i) => {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const r = inner !== undefined && i % 2 === 1 ? inner : 1;
    return `${n(width / 2 + (Math.cos(angle) * r * width) / 2)},${n(height / 2 + (Math.sin(angle) * r * height) / 2)}`;
  }).join(" ");
}

/** Arche : rectangle surmonté d'un demi-cercle (fenêtres, cadres photo). */
export function archPath(width: number, height: number) {
  const r = Math.min(width / 2, height);
  return `M0 ${n(height)}V${n(r)}A${n(width / 2)} ${n(r)} 0 0 1 ${n(width)} ${n(r)}V${n(height)}Z`;
}

function renderShape(el: ShapeElement, pid: string, defs: string[]) {
  const { width: w, height: h } = el;
  const fill = paintValue(el.fill, `${pid}-f`, defs);
  const stroke = strokeAttrs(el.stroke);
  const paint = `fill="${fill}"${stroke}`;
  switch (el.shape) {
    case "rect": {
      const r = Math.min(el.radius ?? 0, w / 2, h / 2);
      return `<rect width="${n(w)}" height="${n(h)}"${r > 0 ? ` rx="${n(r)}"` : ""} ${paint}/>`;
    }
    case "ellipse":
      return `<ellipse cx="${n(w / 2)}" cy="${n(h / 2)}" rx="${n(w / 2)}" ry="${n(h / 2)}" ${paint}/>`;
    case "triangle":
      return `<polygon points="${n(w / 2)},0 ${n(w)},${n(h)} 0,${n(h)}" ${paint}/>`;
    case "polygon":
      return `<polygon points="${regularPoints(w, h, Math.max(3, el.sides ?? 6))}" ${paint}/>`;
    case "star":
      return `<polygon points="${regularPoints(w, h, Math.max(3, el.sides ?? 5), el.innerRatio ?? 0.5)}" ${paint}/>`;
    case "blob":
      return `<path d="${blobPath(w, h, el.seed)}" ${paint}/>`;
    case "arch":
      return `<path d="${archPath(w, h)}" ${paint}/>`;
    case "line":
    case "arrow": {
      // Trait horizontal au milieu de la boîte, à la couleur du contour (ou du remplissage).
      const color = el.stroke?.color ?? (el.fill.type === "solid" ? el.fill.color : "#111827");
      const width = el.stroke?.width ?? Math.max(2, h / 4);
      const dash = strokeAttrs({ color, width, dash: el.stroke?.dash ?? "solid" });
      const head = el.shape === "arrow" ? Math.min(w / 3, width * 4) : 0;
      const line = `<line x1="0" y1="${n(h / 2)}" x2="${n(w - head * 0.8)}" y2="${n(h / 2)}"${dash} stroke-linecap="round"/>`;
      if (!head) return line;
      return `${line}<polygon points="${n(w - head)},${n(h / 2 - head / 2)} ${n(w)},${n(h / 2)} ${n(w - head)},${n(h / 2 + head / 2)}" fill="${color}"/>`;
    }
  }
}

// ─── Texte ───

/** Texte affiché (majuscules appliquées) et lignes : celles de l'éditeur, sinon les retours. */
export function displayText(el: Pick<TextElement, "text" | "uppercase">) {
  return el.uppercase ? el.text.toLocaleUpperCase("fr") : el.text;
}

export function textLines(el: TextElement) {
  return el.lines?.length ? el.lines : displayText(el).split("\n");
}

/** Hauteur d'une ligne et position de la ligne de base dans cette hauteur. */
export function lineMetrics(el: Pick<TextElement, "fontId" | "fontSize" | "lineHeight">) {
  const font = getFont(el.fontId);
  const box = el.fontSize * el.lineHeight;
  const baseline = (box - (font.ascent + font.descent) * el.fontSize) / 2 + font.ascent * el.fontSize;
  return { box, baseline };
}

/** Géométrie d'un texte en arc : rayon, flèche et ordonnée des extrémités. */
export function curveGeometry(el: TextElement) {
  const bend = Math.max(-100, Math.min(100, el.curve ?? 0)) / 100;
  const theta = Math.max(0.0001, Math.abs(bend) * Math.PI);
  const radius = el.width / (2 * Math.sin(theta / 2));
  const sagitta = radius * (1 - Math.cos(theta / 2));
  return { bend, theta, radius, sagitta };
}

function renderText(el: TextElement, pid: string, defs: string[]) {
  const size = el.fontSize;
  const spacing = el.letterSpacing * size;
  const fill = paintValue(el.fill, `${pid}-f`, defs);
  // Police par variable CSS (style) : résolue en nom réel et intégrée à l'export.
  const stroke = el.stroke && el.stroke.width > 0 ? `${strokeAttrs(el.stroke, 2)} paint-order="stroke"` : "";
  const effects = hasEffects(el.effects) ? el.effects : null;
  const letterSpacing = spacing ? ` letter-spacing="${n(spacing)}"` : "";
  const fontAttrs = `style="font-family:${cssFontFamily(el.fontId)}" font-size="${n(size)}" font-weight="${el.fontWeight}"${letterSpacing}`;
  // Avec effets, les glyphes restent sans peinture : chaque calque les peint (lettering.ts).
  const attrs = effects ? `${fontAttrs} xml:space="preserve"` : `${fontAttrs} fill="${fill}"${stroke} xml:space="preserve"`;
  const paint = (glyphs: string) =>
    effects
      ? letteringLayers({ pid, glyphs, fill, effects, size, defs, stroke: el.stroke, box: { x: 0, y: 0, width: el.width, height: el.height } })
      : glyphs;
  const { box, baseline } = lineMetrics(el);
  const parts: string[] = [];

  if (el.highlight) {
    const pad = el.highlight.padding;
    parts.push(`<rect x="${n(-pad)}" y="${n(-pad)}" width="${n(el.width + pad * 2)}" height="${n(el.height + pad * 2)}" rx="${n(el.highlight.radius)}" fill="${el.highlight.color}"/>`);
  }

  if (el.curve) {
    const { bend, radius, sagitta } = curveGeometry(el);
    const line = textLines(el).join(" ");
    const y = bend > 0 ? baseline + sagitta : baseline;
    const sweep = bend > 0 ? 1 : 0;
    defs.push(`<path id="${pid}-arc" d="M0 ${n(y)}A${n(radius)} ${n(radius)} 0 0 ${sweep} ${n(el.width)} ${n(y)}"/>`);
    parts.push(paint(`<text ${attrs} text-anchor="middle"><textPath href="#${pid}-arc" startOffset="50%">${escapeXml(line)}</textPath></text>`));
    return parts.join("");
  }

  // L'espacement des lettres s'ajoute aussi après le dernier caractère : compensé pour centrer.
  const x = el.align === "center" ? el.width / 2 + spacing / 2 : el.align === "right" ? el.width + spacing : 0;
  const anchor = el.align === "center" ? "middle" : el.align === "right" ? "end" : "start";
  const tspans = textLines(el)
    .map((line, i) => `<tspan x="${n(x)}" y="${n(i * box + baseline)}">${escapeXml(line) || " "}</tspan>`)
    .join("");
  parts.push(paint(`<text ${attrs} text-anchor="${anchor}">${tspans}</text>`));
  return parts.join("");
}

// ─── Images et SVG ───

export function imageMaskShape(el: ImageElement) {
  const { width: w, height: h } = el;
  switch (el.mask) {
    case "circle":
      return `<ellipse cx="${n(w / 2)}" cy="${n(h / 2)}" rx="${n(w / 2)}" ry="${n(h / 2)}"/>`;
    case "rounded": {
      const r = el.radius ?? Math.min(w, h) * 0.12;
      return `<rect width="${n(w)}" height="${n(h)}" rx="${n(r)}"/>`;
    }
    case "arch":
      return `<path d="${archPath(w, h)}"/>`;
    case "blob":
      return `<path d="${blobPath(w, h, 7)}"/>`;
    default:
      return `<rect width="${n(w)}" height="${n(h)}"/>`;
  }
}

/** Image entière dans le repère de l'élément (recadrage compris, avant redressement). */
export function imagePlacement(el: ImageElement) {
  return photoPlacement(el).image;
}

function imageFilter(id: string, el: ImageElement) {
  const f = el.filters;
  if (!f) return null;
  const neutral = f.brightness === 1 && f.contrast === 1 && f.saturation === 1 && !f.blur;
  if (neutral) return null;
  const slope = f.brightness * f.contrast;
  const intercept = 0.5 - 0.5 * f.contrast;
  const channel = (c: string) => `<feFunc${c} type="linear" slope="${n(slope)}" intercept="${n(intercept)}"/>`;
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${n(f.saturation)}"/><feComponentTransfer>${channel("R")}${channel("G")}${channel("B")}</feComponentTransfer>${f.blur ? `<feGaussianBlur stdDeviation="${n(f.blur)}"/>` : ""}</filter>`;
}

function renderImage(el: ImageElement, pid: string, defs: string[]) {
  const place = photoPlacement(el);
  const { image, region } = place;
  defs.push(`<clipPath id="${pid}-clip">${imageMaskShape(el)}</clipPath>`);
  // Réglages de retouche ; à défaut, les anciens filtres simples (documents existants).
  const filter = el.adjust ? adjustFilter(`${pid}-img`, el.adjust, Math.max(region.width, region.height)) : imageFilter(`${pid}-img`, el);
  if (filter) defs.push(filter);
  const box = `x="${n(image.x)}" y="${n(image.y)}" width="${n(image.width)}" height="${n(image.height)}"`;
  const filterAttr = filter ? ` filter="url(#${pid}-img)"` : "";
  let body = `<image href="${escapeXml(el.src)}" ${box} preserveAspectRatio="none"${filterAttr}/>`;
  const vignette = el.adjust?.vignette ?? 0;
  if (vignette) {
    defs.push(vignetteGradient(`${pid}-vig`, vignette, region));
    body += `<rect x="${n(region.x)}" y="${n(region.y)}" width="${n(region.width)}" height="${n(region.height)}" fill="url(#${pid}-vig)"/>`;
  }
  if (el.cutout) {
    defs.push(`<mask id="${pid}-cut" maskUnits="userSpaceOnUse" ${box}><image href="${escapeXml(el.cutout)}" ${box} preserveAspectRatio="none"/></mask>`);
    body = `<g mask="url(#${pid}-cut)">${body}</g>`;
  }
  if (el.crop) {
    defs.push(`<clipPath id="${pid}-crop"><rect x="${n(region.x)}" y="${n(region.y)}" width="${n(region.width)}" height="${n(region.height)}"/></clipPath>`);
    body = `<g clip-path="url(#${pid}-crop)">${body}</g>`;
  }
  if (place.transform) body = `<g transform="${place.transform}">${body}</g>`;
  const framed = `<g clip-path="url(#${pid}-clip)">${body}</g>`;
  const effects = effectsFilter(`${pid}-fx`, el.outline, el.glow, el);
  if (!effects) return framed;
  defs.push(effects);
  return `<g filter="url(#${pid}-fx)">${framed}</g>`;
}

/** Dimensions et contenu d'un SVG (sans la racine ni le titre). */
export function svgParts(svg: string) {
  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? "";
  const viewBox = root.match(/viewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
  const width = Number(root.match(/\bwidth="([\d.]+)/)?.[1] ?? 100);
  const height = Number(root.match(/\bheight="([\d.]+)/)?.[1] ?? 100);
  const box = viewBox ? viewBox.slice(1, 5).map(Number) : [0, 0, width, height];
  const inner = svg
    .replace(/^[\s\S]*?<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<title>[\s\S]*?<\/title>/g, "");
  return { minX: box[0]!, minY: box[1]!, width: box[2]!, height: box[3]!, inner };
}

/** Préfixe les identifiants internes d'un SVG pour éviter les collisions entre éléments. */
export function prefixIds(markup: string, prefix: string) {
  return markup
    .replace(/\bid="([^"]+)"/g, (_m, id: string) => `id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${prefix}-${id})`)
    .replace(/(href)="#([^"]+)"/g, (_m, attr: string, id: string) => `${attr}="#${prefix}-${id}"`);
}

function renderSvg(el: SvgElement, pid: string) {
  const parts = svgParts(el.svg);
  const scale = Math.min(el.width / parts.width, el.height / parts.height);
  const ox = (el.width - parts.width * scale) / 2 - parts.minX * scale;
  const oy = (el.height - parts.height * scale) / 2 - parts.minY * scale;
  return `<g transform="translate(${n(ox)} ${n(oy)}) scale(${n(scale * 10000) / 10000})">${prefixIds(parts.inner, pid)}</g>`;
}

function renderIcon(el: Extract<DesignElement, { type: "icon" }>) {
  const nodes = el.node
    .map(([tag, attrs]) => {
      const attributes = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => `${key}="${escapeXml(value === "currentColor" ? el.color : value)}"`)
        .join(" ");
      return `<${tag} ${attributes}/>`;
    })
    .join("");
  return `<g transform="scale(${n(el.width / 24)} ${n(el.height / 24)})" fill="none" stroke="${el.color}" stroke-width="${n(el.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round">${nodes}</g>`;
}

// ─── Éléments et pages ───

/** Transformation qui place le repère local d'un élément dans la page. */
export function elementTransform(el: DesignElement) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rotate = el.rotation ? ` rotate(${n(el.rotation)})` : "";
  const flip = el.flipX || el.flipY ? ` scale(${el.flipX ? -1 : 1} ${el.flipY ? -1 : 1})` : "";
  return `translate(${n(cx)} ${n(cy)})${rotate}${flip} translate(${n(-el.width / 2)} ${n(-el.height / 2)})`;
}

/** Identifiant SVG sûr dérivé de l'identifiant d'un élément. */
export function svgId(id: string) {
  return `s${id.replace(/[^\w-]/g, "")}`;
}

export function renderElement(el: DesignElement) {
  if (el.hidden) return "";
  const pid = svgId(el.id);
  const defs: string[] = [];
  let body: string;
  switch (el.type) {
    case "text":
      body = renderText(el, pid, defs);
      break;
    case "shape":
      body = renderShape(el, pid, defs);
      break;
    case "icon":
      body = renderIcon(el);
      break;
    case "image":
      body = renderImage(el, pid, defs);
      break;
    case "svg":
      body = renderSvg(el, pid);
      break;
  }
  // Ombre appliquée hors de la rotation : sa direction reste celle de la page.
  const outer: string[] = [];
  if (el.shadow && el.shadow.opacity > 0) {
    defs.push(shadowFilter(`${pid}-sh`, el.shadow));
    outer.push(`filter="url(#${pid}-sh)"`);
  }
  if (el.opacity < 1) outer.push(`opacity="${n(el.opacity)}"`);
  if (el.blend && el.blend !== "normal") outer.push(`style="mix-blend-mode:${el.blend}"`);
  const defsMarkup = defs.length ? `<defs>${defs.join("")}</defs>` : "";
  return `<g${outer.length ? ` ${outer.join(" ")}` : ""}>${defsMarkup}<g transform="${elementTransform(el)}">${body}</g></g>`;
}

export function renderBackground(page: DesignPage, doc: Pick<DesignDoc, "width" | "height">, bleed = 0) {
  const defs: string[] = [];
  const fill = paintValue(page.background, `bg-${svgId(page.id)}`, defs);
  if (fill === "none") return "";
  return `${defs.length ? `<defs>${defs.join("")}</defs>` : ""}<rect x="${n(-bleed)}" y="${n(-bleed)}" width="${n(doc.width + bleed * 2)}" height="${n(doc.height + bleed * 2)}" fill="${fill}"/>`;
}

export interface PageRenderOptions extends RenderOptions {
  /** Fond perdu en px de document autour de la page (export d'impression). */
  bleed?: number;
  /** Taille de sortie (attributs width/height) ; par défaut, celle du document. */
  outputWidth?: number;
}

/** Page complète en SVG autonome (polices par variable CSS : à intégrer pour un fichier isolé). */
export function renderPage(doc: DesignDoc, pageIndex: number, options: PageRenderOptions = {}) {
  const page = doc.pages[pageIndex] ?? doc.pages[0]!;
  const bleed = options.bleed ?? 0;
  const width = doc.width + bleed * 2;
  const height = doc.height + bleed * 2;
  const outW = options.outputWidth ?? width;
  const outH = (outW * height) / width;
  const elements = page.elements
    .filter((el) => !options.skip?.has(el.id))
    .map(renderElement)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(-bleed)} ${n(-bleed)} ${n(width)} ${n(height)}" width="${n(outW)}" height="${n(outH)}">${renderBackground(page, doc, bleed)}${elements}</svg>`;
}
