import { mix } from "@/lib/render/color";
import { mulberry32 } from "./render";

// Décors de fête vectoriels : confettis, ballons, feux d'artifice, fanions, croissant et étoile,
// lanternes, mosquée, étincelles, rayons, toque, alliances, ornement, gâteau, cadeau, flocons et
// sapin. Chaque décor est un SVG autonome (élément « graphic » dont les couleurs se changent dans
// l'inspecteur), tiré d'un générateur déterministe : même dessin à l'écran et à l'export serveur.

export interface Decor {
  svg: string;
  width: number;
  height: number;
}

type Point = readonly [number, number];

const n = (v: number) => Math.round(v * 100) / 100;
const pt = ([x, y]: Point) => `${n(x)} ${n(y)}`;
const polar = (cx: number, cy: number, r: number, deg: number): Point => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const at = <T>(list: readonly T[], i: number) => list[i % list.length];

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Semis dans une zone, hors d'une zone réservée (le texte) : `avoid` en unités du décor. */
interface ScatterOptions {
  width?: number;
  height?: number;
  count?: number;
  seed?: number;
  avoid?: Box | null;
}

function inside(box: Box | null | undefined, x: number, y: number, margin: number) {
  if (!box) return false;
  const inX = x > box.x - margin && x < box.x + box.width + margin;
  return inX && y > box.y - margin && y < box.y + box.height + margin;
}

function wrap(width: number, height: number, body: string, defs = ""): Decor {
  const head = defs ? `<defs>${defs}</defs>` : "";
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(width)} ${n(height)}" width="${n(width)}" height="${n(height)}">${head}${body}</svg>`,
    width: n(width),
    height: n(height),
  };
}

/** Sommets d'une étoile à `count` branches. */
export function starPoints(cx: number, cy: number, outer: number, inner: number, count = 5, rotation = -90) {
  return Array.from({ length: count * 2 }, (_, i) =>
    pt(polar(cx, cy, i % 2 ? inner : outer, rotation + (i * 180) / count)),
  ).join(" ");
}

/** Croissant ouvert vers la droite, inscrit dans un cercle de rayon `r` (pointes à droite). */
export function crescentPath(cx: number, cy: number, r: number) {
  const top = pt([cx + 0.2 * r, cy - 0.98 * r]);
  const bottom = pt([cx + 0.2 * r, cy + 0.98 * r]);
  return `M${top}A${n(r)} ${n(r)} 0 1 0 ${bottom}A${n(r)} ${n(r)} 0 0 1 ${top}Z`;
}

/** Confettis (bandes, ronds, triangles, serpentins), plus denses en haut. */
export function confetti(colors: readonly string[], options: ScatterOptions = {}) {
  const { width = 1000, height = 600, count = 70, seed = 3, avoid } = options;
  const random = mulberry32(seed);
  const pieces = Array.from({ length: count }, () => {
    const x = random() * width;
    const y = height * random() ** 1.4;
    const s = width * (0.016 + random() * 0.016);
    const rotate = Math.round(random() * 360);
    const color = colors[Math.floor(random() * colors.length)] ?? "#f59e0b";
    const shape = Math.floor(random() * 4);
    if (inside(avoid, x, y, s)) return "";
    const transform = `transform="translate(${n(x)} ${n(y)}) rotate(${rotate})"`;
    switch (shape) {
      case 0:
        return `<rect ${transform} x="${n(-s * 0.22)}" y="${n(-s * 0.55)}" width="${n(s * 0.45)}" height="${n(s * 1.1)}" rx="${n(s * 0.08)}" fill="${color}"/>`;
      case 1:
        return `<circle ${transform} r="${n(s * 0.3)}" fill="${color}"/>`;
      case 2:
        return `<polygon ${transform} points="${n(-s * 0.4)} ${n(s * 0.3)} ${n(s * 0.4)} ${n(s * 0.3)} 0 ${n(-s * 0.4)}" fill="${color}"/>`;
      default:
        return `<path ${transform} d="M${n(-s * 0.6)} 0q${n(s * 0.3)} ${n(-s * 0.4)} ${n(s * 0.6)} 0t${n(s * 0.6)} 0" fill="none" stroke="${color}" stroke-width="${n(s * 0.2)}" stroke-linecap="round"/>`;
    }
  });
  return wrap(width, height, pieces.join(""));
}

/** Bouquet de ballons (reflets, nœuds, ficelles réunies). */
export function balloons(colors: readonly string[], options: { count?: number; seed?: number } = {}) {
  const { count = 5, seed = 5 } = options;
  const random = mulberry32(seed);
  const spots: Point[] = [
    [150, 105],
    [78, 175],
    [222, 168],
    [116, 262],
    [190, 255],
  ];
  const tie: Point = [150, 540];
  const defs: string[] = [];
  const body = spots.slice(0, Math.min(Math.max(count, 1), spots.length)).map(([cx, cy], i) => {
    const color = at(colors, i);
    const rx = 56;
    const ry = 68;
    const tilt = Math.round((random() - 0.5) * 18);
    defs.push(
      `<radialGradient id="b${i}" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="${mix(color, "#ffffff", 0.35)}"/><stop offset="1" stop-color="${mix(color, "#000000", 0.12)}"/></radialGradient>`,
    );
    const knot = cy + ry;
    const string = `<path d="M${n(cx)} ${n(knot + 8)}Q${n(cx + (tie[0] - cx) * 0.2 + 14)} ${n((knot + tie[1]) / 2)} ${pt(tie)}" fill="none" stroke="#9ca3af" stroke-width="2"/>`;
    const shape = `M${cx} ${cy - ry}C${cx + rx * 1.12} ${cy - ry} ${cx + rx * 0.95} ${cy + ry * 0.62} ${cx} ${knot}C${cx - rx * 0.95} ${cy + ry * 0.62} ${cx - rx * 1.12} ${cy - ry} ${cx} ${cy - ry}Z`;
    return `${string}<g transform="rotate(${tilt} ${cx} ${cy})"><path d="${shape}" fill="url(#b${i})"/><path d="M${cx - 7} ${knot + 9}L${cx + 7} ${knot + 9}L${cx} ${knot - 1}Z" fill="${mix(color, "#000000", 0.15)}"/><ellipse cx="${n(cx - rx * 0.4)}" cy="${n(cy - ry * 0.4)}" rx="${n(rx * 0.14)}" ry="${n(ry * 0.26)}" transform="rotate(-25 ${n(cx - rx * 0.4)} ${n(cy - ry * 0.4)})" fill="#ffffff" opacity="0.45"/></g>`;
  });
  const bow = `<path d="M150 540q-26 -16 -20 6q4 12 20 -6q26 -16 20 6q-4 12 -20 -6M150 540q-6 22 -18 40M150 540q8 24 22 38" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>`;
  return wrap(300, 600, body.join("") + bow, defs.join(""));
}

/** Gerbes de feux d'artifice. */
export function fireworks(
  colors: readonly string[],
  options: { count?: number; seed?: number; width?: number; height?: number } = {},
) {
  const { count = 3, seed = 11, width = 600, height = 400 } = options;
  const random = mulberry32(seed);
  // Gerbes réparties sur le grand côté de la zone.
  const vertical = height > width;
  const cell = (vertical ? height : width) / count;
  const cross = vertical ? width : height;
  const bursts = Array.from({ length: count }, (_, i) => {
    const r = Math.min(cell, cross) * (0.3 + random() * 0.18);
    const along = cell * (i + 0.5) + (random() - 0.5) * cell * 0.2;
    const across = r * 1.15 + random() * Math.max(0, cross - 2.3 * r);
    const [cx, cy] = vertical ? [across, along] : [along, across];
    const main = at(colors, i);
    const second = at(colors, i + 1);
    const rays = 14 + Math.floor(random() * 6);
    const parts: string[] = [];
    for (let k = 0; k < rays; k++) {
      const deg = (k * 360) / rays + random() * 6;
      parts.push(
        `<path d="M${pt(polar(cx, cy, r * 0.3, deg))}L${pt(polar(cx, cy, r, deg))}" stroke="${main}" stroke-width="${n(r * 0.05)}" stroke-linecap="round"/>`,
        `<circle cx="${n(polar(cx, cy, r * 1.1, deg)[0])}" cy="${n(polar(cx, cy, r * 1.1, deg)[1])}" r="${n(r * 0.04)}" fill="${second}"/>`,
        `<path d="M${pt(polar(cx, cy, r * 0.12, deg + 180 / rays))}L${pt(polar(cx, cy, r * 0.55, deg + 180 / rays))}" stroke="${second}" stroke-width="${n(r * 0.035)}" stroke-linecap="round"/>`,
      );
    }
    return parts.join("") + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.05)}" fill="${main}"/>`;
  });
  return wrap(width, height, bursts.join(""));
}

/** Guirlande de fanions sur une ficelle (couleurs en alternance). */
export function bunting(colors: readonly string[], options: { count?: number } = {}) {
  const { count = 11 } = options;
  const width = 1000;
  const y0 = 18;
  const yc = 170;
  const point = (t: number): Point => [width * t, (1 - t) ** 2 * y0 + 2 * t * (1 - t) * yc + t ** 2 * y0];
  const span = 0.82 / count;
  const depth = (width / count) * 0.95;
  const flags = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const a = point(t - span / 2);
    const b = point(t + span / 2);
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    const apex: Point = [(a[0] + b[0]) / 2 - (ty / len) * depth, (a[1] + b[1]) / 2 + (tx / len) * depth];
    const color = at(colors, i);
    return `<polygon points="${pt(a)} ${pt(b)} ${pt(apex)}" fill="${color}" stroke="${mix(color, "#000000", 0.15)}" stroke-width="2" stroke-linejoin="round"/>`;
  });
  const string = `<path d="M0 ${y0}Q${width / 2} ${yc} ${width} ${y0}" fill="none" stroke="#4b5563" stroke-width="3"/>`;
  return wrap(width, 200, string + flags.join(""));
}

/** Croissant de lune et étoile (Aïd, Ramadan). */
export function crescentStar(color: string, star = color) {
  return wrap(
    200,
    200,
    `<g transform="rotate(-18 100 100)"><path d="${crescentPath(92, 100, 80)}" fill="${color}"/><polygon points="${starPoints(132, 92, 26, 10.5)}" fill="${star}"/></g>`,
  );
}

/** Lanternes orientales suspendues à des chaînes de longueurs différentes. */
export function lanterns(color: string, glass = "#fde68a", options: { count?: number } = {}) {
  const { count = 3 } = options;
  const chains = [70, 150, 30, 110, 55];
  const defs = `<radialGradient id="glow"><stop offset="0" stop-color="${glass}" stop-opacity="0.55"/><stop offset="1" stop-color="${glass}" stop-opacity="0"/></radialGradient>`;
  const body = Array.from({ length: count }, (_, i) => {
    const x = i * 120;
    const c = chains[i % chains.length];
    const y = (v: number) => n(v + c);
    const px = (v: number) => n(v + x);
    return [
      `<path d="M${px(60)} 0V${y(0)}" stroke="${color}" stroke-width="2.5"/>`,
      `<circle cx="${px(60)}" cy="${y(168)}" r="70" fill="url(#glow)"/>`,
      `<circle cx="${px(60)}" cy="${y(5)}" r="6" fill="none" stroke="${color}" stroke-width="3"/>`,
      `<path d="M${px(36)} ${y(112)}Q${px(60)} ${y(68)} ${px(84)} ${y(112)}Z" fill="${color}"/>`,
      `<polygon points="${px(30)} ${y(112)} ${px(90)} ${y(112)} ${px(100)} ${y(150)} ${px(90)} ${y(225)} ${px(30)} ${y(225)} ${px(20)} ${y(150)}" fill="${color}"/>`,
      `<polygon points="${px(38)} ${y(122)} ${px(82)} ${y(122)} ${px(89)} ${y(150)} ${px(82)} ${y(213)} ${px(38)} ${y(213)} ${px(31)} ${y(150)}" fill="${glass}"/>`,
      `<path d="M${px(60)} ${y(122)}V${y(213)}M${px(31)} ${y(150)}H${px(89)}" stroke="${color}" stroke-width="4"/>`,
      `<polygon points="${px(36)} ${y(225)} ${px(84)} ${y(225)} ${px(72)} ${y(245)} ${px(48)} ${y(245)}" fill="${color}"/>`,
      `<polygon points="${px(54)} ${y(245)} ${px(66)} ${y(245)} ${px(60)} ${y(264)}" fill="${color}"/>`,
    ].join("");
  });
  return wrap(count * 120, 264 + Math.max(...chains.slice(0, count)), body.join(""), defs);
}

/** Silhouette de mosquée : coupole, minarets et petites coupoles. */
export function mosque(color: string) {
  const dome = (cx: number, base: number, r: number) =>
    `<path d="M${cx - r} ${base}C${cx - r} ${base - r * 1.25} ${cx - r * 0.2} ${base - r * 1.3} ${cx} ${base - r * 1.9}C${cx + r * 0.2} ${base - r * 1.3} ${cx + r} ${base - r * 1.25} ${cx + r} ${base}Z"/>`;
  const minaret = (cx: number) =>
    `<rect x="${cx - 9}" y="70" width="18" height="230"/><rect x="${cx - 13}" y="118" width="26" height="8"/><path d="M${cx - 9} 70L${cx} 36L${cx + 9} 70Z"/>`;
  return wrap(
    600,
    300,
    `<g fill="${color}"><rect x="0" y="250" width="600" height="50"/><rect x="170" y="170" width="260" height="90"/>${dome(300, 175, 95)}${dome(190, 200, 40)}${dome(410, 200, 40)}${minaret(120)}${minaret(480)}<rect x="40" y="215" width="100" height="40"/><rect x="460" y="215" width="100" height="40"/>${dome(90, 218, 30)}${dome(510, 218, 30)}</g>`,
  );
}

/** Étincelles à quatre branches et petits points. */
export function sparkles(colors: readonly string[], options: ScatterOptions = {}) {
  const { width = 600, height = 400, count = 24, seed = 21, avoid } = options;
  const random = mulberry32(seed);
  const items = Array.from({ length: count }, (_, i) => {
    const x = random() * width;
    const y = random() * height;
    const color = colors[Math.floor(random() * colors.length)] ?? "#fde68a";
    const s = width * (0.013 + random() * 0.027);
    if (inside(avoid, x, y, s)) return "";
    if (i % 3 === 2) return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(s * 0.22)}" fill="${color}"/>`;
    return `<path d="M${n(x)} ${n(y - s)}Q${n(x)} ${n(y)} ${n(x + s)} ${n(y)}Q${n(x)} ${n(y)} ${n(x)} ${n(y + s)}Q${n(x)} ${n(y)} ${n(x - s)} ${n(y)}Q${n(x)} ${n(y)} ${n(x)} ${n(y - s)}Z" fill="${color}"/>`;
  });
  return wrap(width, height, items.join(""));
}

/** Rayons de soleil en éventail autour du centre. */
export function sunburst(color: string, options: { rays?: number } = {}) {
  const { rays = 24 } = options;
  const r = 500;
  const wedges = Array.from({ length: rays }, (_, i) => {
    const from = (i * 360) / rays;
    const to = from + 180 / rays;
    return `<path d="M${r} ${r}L${pt(polar(r, r, r, from))}A${r} ${r} 0 0 1 ${pt(polar(r, r, r, to))}Z"/>`;
  });
  return wrap(2 * r, 2 * r, `<g fill="${color}">${wedges.join("")}</g>`);
}

/** Toque de diplômé avec son gland. */
export function graduationCap(color: string, tassel = "#f59e0b") {
  return wrap(
    240,
    180,
    `<path d="M60 84V128Q120 160 180 128V84L120 106Z" fill="${mix(color, "#000000", 0.25)}"/><polygon points="120 20 230 62 120 104 10 62" fill="${color}"/><path d="M120 62Q175 70 200 76V135" fill="none" stroke="${tassel}" stroke-width="4"/><circle cx="120" cy="62" r="6" fill="${tassel}"/><path d="M192 132H208L213 166H187Z" fill="${tassel}"/>`,
  );
}

/** Deux alliances entrelacées, l'une sertie. */
export function weddingRings(gold = "#c9a227") {
  const light = mix(gold, "#ffffff", 0.3);
  // Le premier anneau repasse devant le second à leur croisement du bas (entrelacs).
  const over = `M${pt(polar(95, 105, 55, 32))}A55 55 0 0 1 ${pt(polar(95, 105, 55, 66))}`;
  return wrap(
    240,
    170,
    `<circle cx="95" cy="105" r="55" fill="none" stroke="${gold}" stroke-width="12"/><circle cx="150" cy="95" r="55" fill="none" stroke="${light}" stroke-width="12"/><path d="${over}" fill="none" stroke="${gold}" stroke-width="12"/><polygon points="150 52 134 33 140 22 160 22 166 33" fill="#e0f2fe" stroke="${gold}" stroke-width="2" stroke-linejoin="round"/>`,
  );
}

/** Ornement de séparation : filets, points et losange. */
export function flourish(color: string) {
  return wrap(
    400,
    40,
    `<path d="M20 20H168M232 20H380" stroke="${color}" stroke-width="2"/><circle cx="180" cy="20" r="3.5" fill="${color}"/><circle cx="220" cy="20" r="3.5" fill="${color}"/><polygon points="200 8 212 20 200 32 188 20" fill="${color}"/>`,
  );
}

/** Gâteau d'anniversaire à deux étages, nappage et bougies. */
export function cake(colors: readonly string[]) {
  const cream = "#fff7ed";
  const drip = (left: number, right: number, top: number, step: number) => {
    const parts = [`M${left} ${top}H${right}V${top + 14}`];
    let i = 0;
    for (let x = right; x > left; x -= step, i++) {
      const next = Math.max(left, x - step);
      const depth = i % 2 ? 9 : 22;
      parts.push(`C${x} ${top + 14 + depth} ${next} ${top + 14 + depth} ${next} ${top + 14}`);
    }
    return `<path d="${parts.join("")}Z" fill="${cream}"/>`;
  };
  const candles = [90, 120, 150]
    .map(
      (x, i) =>
        `<rect x="${x - 4}" y="52" width="8" height="34" rx="2" fill="${at(colors, i + 1)}"/><path d="M${x} 30C${x + 8} 40 ${x + 6} 50 ${x} 50C${x - 6} 50 ${x - 8} 40 ${x} 30Z" fill="#f59e0b"/><path d="M${x} 39C${x + 3} 44 ${x + 3} 48 ${x} 48C${x - 3} 48 ${x - 3} 44 ${x} 39Z" fill="#fde68a"/>`,
    )
    .join("");
  const dots = Array.from(
    { length: 7 },
    (_, i) => `<circle cx="${48 + i * 24}" cy="205" r="5" fill="${at(colors, 2)}"/>`,
  ).join("");
  return wrap(
    240,
    256,
    `<ellipse cx="120" cy="238" rx="108" ry="13" fill="#e5e7eb"/><rect x="30" y="150" width="180" height="86" rx="10" fill="${at(colors, 0)}"/>${drip(30, 210, 150, 22.5)}${dots}<rect x="60" y="86" width="120" height="68" rx="8" fill="${at(colors, 1)}"/>${drip(60, 180, 86, 20)}${candles}`,
  );
}

/** Paquet cadeau et son nœud. */
export function gift(color: string, ribbon = "#f59e0b") {
  return wrap(
    200,
    200,
    `<rect x="30" y="86" width="140" height="104" rx="4" fill="${color}"/><rect x="30" y="92" width="140" height="8" fill="#000000" opacity="0.12"/><rect x="22" y="62" width="156" height="30" rx="4" fill="${mix(color, "#ffffff", 0.15)}"/><rect x="90" y="62" width="20" height="128" fill="${ribbon}"/><ellipse cx="74" cy="50" rx="28" ry="15" transform="rotate(-25 74 50)" fill="none" stroke="${ribbon}" stroke-width="9"/><ellipse cx="126" cy="50" rx="28" ry="15" transform="rotate(25 126 50)" fill="none" stroke="${ribbon}" stroke-width="9"/><circle cx="100" cy="58" r="10" fill="${mix(ribbon, "#000000", 0.15)}"/>`,
  );
}

/** Flocons de neige à six branches. */
export function snowflakes(color: string, options: ScatterOptions = {}) {
  const { width = 600, height = 400, count = 16, seed = 13, avoid } = options;
  const random = mulberry32(seed);
  const flakes = Array.from({ length: count }, () => {
    const x = random() * width;
    const y = random() * height;
    const s = width * (0.017 + random() * 0.037);
    const turn = random() * 60;
    if (inside(avoid, x, y, s)) return "";
    const arms = Array.from({ length: 6 }, (_, k) => {
      const deg = turn + k * 60;
      const tip = polar(x, y, s, deg);
      const knot = polar(x, y, s * 0.6, deg);
      return `M${n(x)} ${n(y)}L${pt(tip)}M${pt(knot)}L${pt(polar(knot[0], knot[1], s * 0.3, deg - 45))}M${pt(knot)}L${pt(polar(knot[0], knot[1], s * 0.3, deg + 45))}`;
    });
    return `<path d="${arms.join("")}" fill="none" stroke="${color}" stroke-width="${n(s * 0.09)}" stroke-linecap="round"/>`;
  });
  return wrap(width, height, flakes.join(""));
}

/** Sapin décoré, étoile et boules. */
export function christmasTree(
  green = "#15803d",
  star = "#facc15",
  baubles: readonly string[] = ["#dc2626", "#facc15", "#ffffff"],
) {
  const tiers = [
    [110, 115, 25, 240, 195],
    [110, 70, 40, 165, 180],
    [110, 30, 55, 105, 165],
  ]
    .map(
      ([x, top, left, base, right], i) =>
        `<polygon points="${x} ${top} ${left} ${base} ${right} ${base}" fill="${mix(green, "#ffffff", i * 0.08)}"/>`,
    )
    .join("");
  const spots: Point[] = [
    [80, 210],
    [140, 222],
    [110, 185],
    [70, 150],
    [150, 145],
    [100, 120],
    [125, 90],
    [160, 200],
    [55, 228],
  ];
  const balls = spots
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${at(baubles, i)}"/>`)
    .join("");
  return wrap(
    220,
    270,
    `<rect x="98" y="236" width="24" height="32" fill="#78350f"/>${tiers}${balls}<polygon points="${starPoints(110, 30, 22, 9)}" fill="${star}"/>`,
  );
}

/** Couleurs distinctes (#rrggbb) d'un SVG, dans l'ordre d'apparition. */
export function svgColors(svg: string) {
  return [...new Set((svg.match(/#[0-9a-f]{6}\b/gi) ?? []).map((c) => c.toLowerCase()))];
}

/** Remplace une couleur partout dans un SVG. */
export function replaceColor(svg: string, from: string, to: string) {
  return /^#[0-9a-f]{6}$/i.test(from) ? svg.replace(new RegExp(`${from}\\b`, "gi"), to.toLowerCase()) : svg;
}

export const DECOR_IDS = [
  "confetti",
  "balloons",
  "fireworks",
  "bunting",
  "crescent",
  "lanterns",
  "mosque",
  "sparkles",
  "sunburst",
  "cap",
  "rings",
  "flourish",
  "cake",
  "gift",
  "snowflakes",
  "tree",
] as const;
export type DecorId = (typeof DECOR_IDS)[number];

/** Palette d'un décor : couleurs vives (marque d'abord), or, encre. */
export interface DecorPalette {
  colors: string[];
  gold: string;
  ink: string;
}

export function buildDecor(id: DecorId, palette: DecorPalette): Decor {
  const { colors, gold, ink } = palette;
  switch (id) {
    case "confetti":
      return confetti([...colors, gold]);
    case "balloons":
      return balloons([...colors, gold]);
    case "fireworks":
      return fireworks([gold, ...colors]);
    case "bunting":
      return bunting(colors);
    case "crescent":
      return crescentStar(gold);
    case "lanterns":
      return lanterns(gold);
    case "mosque":
      return mosque(ink);
    case "sparkles":
      return sparkles([gold, ...colors]);
    case "sunburst":
      return sunburst(gold);
    case "cap":
      return graduationCap(ink, gold);
    case "rings":
      return weddingRings(gold);
    case "flourish":
      return flourish(gold);
    case "cake":
      return cake(colors);
    case "gift":
      return gift(at(colors, 0), gold);
    case "snowflakes":
      return snowflakes("#7dd3fc");
    case "tree":
      return christmasTree();
  }
}
