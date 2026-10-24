import { crescentPath, starPoints } from "./decor";

// Fêtes d'indépendance et fêtes nationales : date, année d'origine et drapeau simplifié (bandes,
// emblème principal ; armoiries et devises omises) de chaque pays, pour les modèles de fête.

export type FlagLayout = "vertical" | "horizontal" | "hoist" | "canton" | "rhombus" | "diagonal";
export type EmblemKind =
  "star" | "pentagram" | "disc" | "ring" | "crescent-star" | "sun" | "maple" | "stars-grid";

export interface Flag {
  layout: FlagLayout;
  /** Bandes, de la hampe vers le battant ou de haut en bas (première : bande de hampe, fond). */
  colors: string[];
  weights?: number[];
  /** Largeur de la bande de hampe (hoist), en proportion. */
  hoist?: number;
  /** Rayures et canton (canton). */
  stripes?: number;
  /** Canton : proportions de la largeur et de la hauteur ; `square` : carré, quelle que soit la largeur. */
  canton?: { color: string; width?: number; height: number; square?: boolean };
  /** Emblème : position relative (centre par défaut), rotation, disque de fond (croissant). */
  emblem?: {
    kind: EmblemKind;
    color: string;
    size: number;
    x?: number;
    y?: number;
    rotate?: number;
    disc?: string;
  };
}

export interface Country {
  code: string;
  flag: Flag;
  month: number;
  day: number;
  /** Année de l'indépendance (anniversaire affiché). */
  year?: number;
  kind: "independence" | "national";
}

const v = (colors: string[], emblem?: Flag["emblem"], weights?: number[]): Flag => ({
  layout: "vertical",
  colors,
  emblem,
  weights,
});
const h = (colors: string[], emblem?: Flag["emblem"], weights?: number[]): Flag => ({
  layout: "horizontal",
  colors,
  emblem,
  weights,
});
const star = (color: string, size = 0.3, x?: number, y?: number) => ({
  kind: "star" as const,
  color,
  size,
  x,
  y,
});
const crescent = (color: string, size: number, extra: Partial<NonNullable<Flag["emblem"]>> = {}) => ({
  kind: "crescent-star" as const,
  color,
  size,
  ...extra,
});

export const COUNTRIES: Country[] = [
  {
    code: "GN",
    flag: v(["#ce1126", "#fcd116", "#009460"]),
    day: 2,
    month: 10,
    year: 1958,
    kind: "independence",
  },
  {
    code: "SN",
    flag: v(["#00853f", "#fdef42", "#e31b23"], star("#00853f")),
    day: 4,
    month: 4,
    year: 1960,
    kind: "independence",
  },
  {
    code: "ML",
    flag: v(["#14b53a", "#fcd116", "#ce1126"]),
    day: 22,
    month: 9,
    year: 1960,
    kind: "independence",
  },
  {
    code: "CI",
    flag: v(["#f77f00", "#ffffff", "#009e60"]),
    day: 7,
    month: 8,
    year: 1960,
    kind: "independence",
  },
  {
    code: "SL",
    flag: h(["#1eb53a", "#ffffff", "#0072c6"]),
    day: 27,
    month: 4,
    year: 1961,
    kind: "independence",
  },
  {
    code: "LR",
    flag: {
      layout: "canton",
      colors: ["#bf0a30", "#ffffff"],
      stripes: 11,
      canton: { color: "#002868", height: 5 / 11, square: true },
      emblem: star("#ffffff", 0.26),
    },
    day: 26,
    month: 7,
    year: 1847,
    kind: "independence",
  },
  {
    code: "BF",
    flag: h(["#ef2b2d", "#009e49"], star("#fcd116", 0.36)),
    day: 5,
    month: 8,
    year: 1960,
    kind: "independence",
  },
  {
    code: "NE",
    flag: h(["#e05206", "#ffffff", "#0db02b"], { kind: "disc", color: "#e05206", size: 0.26 }),
    day: 3,
    month: 8,
    year: 1960,
    kind: "independence",
  },
  {
    code: "TD",
    flag: v(["#002664", "#fecb00", "#c60c30"]),
    day: 11,
    month: 8,
    year: 1960,
    kind: "independence",
  },
  {
    code: "BJ",
    flag: { layout: "hoist", colors: ["#008751", "#fcd116", "#e8112d"], hoist: 0.4 },
    day: 1,
    month: 8,
    year: 1960,
    kind: "independence",
  },
  {
    code: "TG",
    flag: {
      layout: "canton",
      colors: ["#006a4e", "#ffce00"],
      stripes: 5,
      canton: { color: "#d21034", height: 0.6, square: true },
      emblem: star("#ffffff", 0.36),
    },
    day: 27,
    month: 4,
    year: 1960,
    kind: "independence",
  },
  {
    code: "CM",
    flag: v(["#007a5e", "#ce1126", "#fcd116"], star("#fcd116")),
    day: 20,
    month: 5,
    kind: "national",
  },
  {
    code: "GA",
    flag: h(["#009e60", "#fcd116", "#3a75c4"]),
    day: 17,
    month: 8,
    year: 1960,
    kind: "independence",
  },
  {
    code: "CG",
    flag: { layout: "diagonal", colors: ["#009543", "#fbde4a", "#dc241f"] },
    day: 15,
    month: 8,
    year: 1960,
    kind: "independence",
  },
  {
    code: "GH",
    flag: h(["#ce1126", "#fcd116", "#006b3f"], star("#000000", 0.32)),
    day: 6,
    month: 3,
    year: 1957,
    kind: "independence",
  },
  {
    code: "NG",
    flag: v(["#008751", "#ffffff", "#008751"]),
    day: 1,
    month: 10,
    year: 1960,
    kind: "independence",
  },
  {
    code: "GM",
    flag: h(["#ce1126", "#ffffff", "#0c1c8c", "#ffffff", "#3a7728"], undefined, [6, 1, 4, 1, 6]),
    day: 18,
    month: 2,
    year: 1965,
    kind: "independence",
  },
  {
    code: "GW",
    flag: {
      layout: "hoist",
      colors: ["#ce1126", "#fcd116", "#009e49"],
      hoist: 1 / 3,
      emblem: star("#000000", 0.32, 1 / 6),
    },
    day: 24,
    month: 9,
    year: 1973,
    kind: "independence",
  },
  {
    code: "MR",
    flag: h(
      ["#d01c1f", "#00a95c", "#d01c1f"],
      crescent("#ffd700", 0.42, { y: 0.52, rotate: -90 }),
      [1, 3, 1],
    ),
    day: 28,
    month: 11,
    year: 1960,
    kind: "independence",
  },
  {
    code: "MA",
    flag: v(["#c1272d"], { kind: "pentagram", color: "#006233", size: 0.5 }),
    day: 18,
    month: 11,
    year: 1956,
    kind: "independence",
  },
  {
    code: "DZ",
    flag: v(["#006233", "#ffffff"], crescent("#d21034", 0.5)),
    day: 5,
    month: 7,
    year: 1962,
    kind: "independence",
  },
  {
    code: "TN",
    flag: v(["#e70013"], crescent("#e70013", 0.5, { disc: "#ffffff" })),
    day: 20,
    month: 3,
    year: 1956,
    kind: "independence",
  },
  {
    code: "MG",
    flag: { layout: "hoist", colors: ["#ffffff", "#fc3d32", "#007e3a"], hoist: 1 / 3 },
    day: 26,
    month: 6,
    year: 1960,
    kind: "independence",
  },
  {
    code: "RW",
    flag: h(
      ["#00a1de", "#fad201", "#20603d"],
      { kind: "sun", color: "#e5be01", size: 0.3, x: 0.85, y: 0.25 },
      [2, 1, 1],
    ),
    day: 1,
    month: 7,
    year: 1962,
    kind: "independence",
  },
  { code: "HT", flag: h(["#00209f", "#d21034"]), day: 1, month: 1, year: 1804, kind: "independence" },
  {
    code: "US",
    flag: {
      layout: "canton",
      colors: ["#b22234", "#ffffff"],
      stripes: 13,
      canton: { color: "#3c3b6e", width: 0.4, height: 7 / 13 },
      emblem: { kind: "stars-grid", color: "#ffffff", size: 1 },
    },
    day: 4,
    month: 7,
    year: 1776,
    kind: "independence",
  },
  {
    code: "MX",
    flag: v(["#006847", "#ffffff", "#ce1126"]),
    day: 16,
    month: 9,
    year: 1810,
    kind: "independence",
  },
  {
    code: "BR",
    flag: {
      layout: "rhombus",
      colors: ["#009c3b", "#ffdf00"],
      emblem: { kind: "disc", color: "#002776", size: 0.5 },
    },
    day: 7,
    month: 9,
    year: 1822,
    kind: "independence",
  },
  {
    code: "AR",
    flag: h(["#74acdf", "#ffffff", "#74acdf"], { kind: "sun", color: "#f6b40e", size: 0.3 }),
    day: 9,
    month: 7,
    year: 1816,
    kind: "independence",
  },
  {
    code: "CO",
    flag: h(["#fcd116", "#003893", "#ce1126"], undefined, [2, 1, 1]),
    day: 20,
    month: 7,
    year: 1810,
    kind: "independence",
  },
  {
    code: "PE",
    flag: v(["#d91023", "#ffffff", "#d91023"]),
    day: 28,
    month: 7,
    year: 1821,
    kind: "independence",
  },
  { code: "ID", flag: h(["#ff0000", "#ffffff"]), day: 17, month: 8, year: 1945, kind: "independence" },
  {
    code: "IN",
    flag: h(["#ff9933", "#ffffff", "#138808"], { kind: "ring", color: "#000080", size: 0.28 }),
    day: 15,
    month: 8,
    year: 1947,
    kind: "independence",
  },
  {
    code: "PK",
    flag: {
      layout: "hoist",
      colors: ["#ffffff", "#01411c"],
      hoist: 0.25,
      emblem: crescent("#ffffff", 0.5, { x: 0.62, rotate: -40 }),
    },
    day: 14,
    month: 8,
    year: 1947,
    kind: "independence",
  },
  {
    code: "BD",
    flag: v(["#006a4e"], { kind: "disc", color: "#f42a41", size: 0.4, x: 0.45 }),
    day: 26,
    month: 3,
    year: 1971,
    kind: "independence",
  },
  { code: "UA", flag: h(["#0057b7", "#ffd700"]), day: 24, month: 8, year: 1991, kind: "independence" },
  { code: "PL", flag: h(["#ffffff", "#dc143c"]), day: 11, month: 11, year: 1918, kind: "independence" },
  { code: "FR", flag: v(["#002395", "#ffffff", "#ed2939"]), day: 14, month: 7, kind: "national" },
  { code: "BE", flag: v(["#000000", "#fae042", "#ed2939"]), day: 21, month: 7, kind: "national" },
  {
    code: "CA",
    flag: v(["#d52b1e", "#ffffff", "#d52b1e"], { kind: "maple", color: "#d52b1e", size: 0.56 }, [1, 2, 1]),
    day: 1,
    month: 7,
    kind: "national",
  },
  { code: "DE", flag: h(["#000000", "#dd0000", "#ffce00"]), day: 3, month: 10, kind: "national" },
  { code: "IT", flag: v(["#009246", "#ffffff", "#ce2b37"]), day: 2, month: 6, kind: "national" },
  {
    code: "ES",
    flag: h(["#aa151b", "#f1bf00", "#aa151b"], undefined, [1, 2, 1]),
    day: 12,
    month: 10,
    kind: "national",
  },
  { code: "IE", flag: v(["#169b62", "#ffffff", "#ff883e"]), day: 17, month: 3, kind: "national" },
  { code: "NL", flag: h(["#ae1c28", "#ffffff", "#21468b"]), day: 27, month: 4, kind: "national" },
  { code: "AT", flag: h(["#ed2939", "#ffffff", "#ed2939"]), day: 26, month: 10, kind: "national" },
  { code: "RU", flag: h(["#ffffff", "#0039a6", "#d52b1e"]), day: 12, month: 6, kind: "national" },
  {
    code: "TR",
    flag: v(["#e30a17"], crescent("#ffffff", 0.5, { x: 0.42 })),
    day: 29,
    month: 10,
    kind: "national",
  },
  {
    code: "TH",
    flag: h(["#a51931", "#f4f5f8", "#2d2a4a", "#f4f5f8", "#a51931"], undefined, [1, 1, 2, 1, 1]),
    day: 5,
    month: 12,
    kind: "national",
  },
];

export function getCountry(code: string | null | undefined) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

// ─── Drapeaux ───

const r2 = (v: number) => Math.round(v * 100) / 100;

function bands(
  colors: string[],
  weights: number[] | undefined,
  length: number,
  cross: number,
  vertical: boolean,
  offset = 0,
) {
  const total = (weights ?? colors.map(() => 1)).reduce((sum, w) => sum + w, 0);
  let at = 0;
  return colors
    .map((color, i) => {
      const size = ((weights?.[i] ?? 1) / total) * length;
      // Léger recouvrement : pas de filet clair entre deux bandes à l'écran.
      const extra = i < colors.length - 1 ? 0.5 : 0;
      const rect = vertical
        ? `<rect x="${r2(offset + at)}" y="0" width="${r2(size + extra)}" height="${r2(cross)}" fill="${color}"/>`
        : `<rect x="${r2(offset)}" y="${r2(at)}" width="${r2(cross)}" height="${r2(size + extra)}" fill="${color}"/>`;
      at += size;
      return rect;
    })
    .join("");
}

// prettier-ignore
const MAPLE: [number, number][] = [
  [0, -0.45], [0.06, -0.33], [0.13, -0.37], [0.11, -0.17], [0.23, -0.28], [0.26, -0.22], [0.38, -0.24], [0.34, -0.1],
  [0.41, -0.06], [0.22, 0.08], [0.25, 0.16], [0.03, 0.13], [0.03, 0.35], [-0.03, 0.35], [-0.03, 0.13], [-0.25, 0.16],
  [-0.22, 0.08], [-0.41, -0.06], [-0.34, -0.1], [-0.38, -0.24], [-0.26, -0.22], [-0.23, -0.28], [-0.11, -0.17], [-0.13, -0.37],
  [-0.06, -0.33],
];

function cantonSize(flag: Flag, width: number, height: number) {
  const ch = (flag.canton?.height ?? 0.5) * height;
  return { cw: flag.canton?.square ? ch : (flag.canton?.width ?? 0.4) * width, ch };
}

interface EmblemSpot {
  e: NonNullable<Flag["emblem"]>;
  cx: number;
  cy: number;
  /** Taille de l'emblème (px). */
  s: number;
  /** Canton (drapeaux à canton) et hauteur du drapeau. */
  cw: number;
  ch: number;
  height: number;
}

const circle = (cx: number, cy: number, r: number, attrs: string) =>
  `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" ${attrs}/>`;

/** Point à `r` du centre, dans la direction `a` (radians), formaté. */
const around = (cx: number, cy: number, r: number, a: number) =>
  `${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}`;

function pentagram({ e, cx, cy, s }: EmblemSpot) {
  const p = Array.from({ length: 5 }, (_, i) => around(cx, cy, s / 2, ((-90 + i * 144) * Math.PI) / 180));
  return `<path d="M${p.join("L")}Z" fill="none" stroke="${e.color}" stroke-width="${r2(s * 0.07)}" stroke-linejoin="miter"/>`;
}

function ring({ e, cx, cy, s }: EmblemSpot) {
  const center = `${r2(cx)} ${r2(cy)}`;
  const spokes = Array.from(
    { length: 24 },
    (_, i) => `M${center}L${around(cx, cy, s / 2, (i * 15 * Math.PI) / 180)}`,
  );
  return [
    circle(cx, cy, s * 0.46, `fill="none" stroke="${e.color}" stroke-width="${r2(s * 0.07)}"`),
    `<path d="${spokes.join("")}" stroke="${e.color}" stroke-width="${r2(s * 0.02)}"/>`,
    circle(cx, cy, s * 0.08, `fill="${e.color}"`),
  ].join("");
}

/** Croissant et étoile, éventuellement sur un disque (Tunisie). */
function crescentEmblem({ e, cx, cy, s }: EmblemSpot) {
  const disc = e.disc ? circle(cx, cy, s / 2, `fill="${e.disc}"`) : "";
  const r = (e.disc ? 0.36 : 0.5) * s;
  const rotate = e.rotate ? ` transform="rotate(${e.rotate} ${r2(cx)} ${r2(cy)})"` : "";
  const star = starPoints(cx + r * 0.48, cy, r * 0.36, r * 0.14);
  return `${disc}<g${rotate}><path d="${crescentPath(cx - r * 0.12, cy, r)}" fill="${e.color}"/><polygon points="${star}" fill="${e.color}"/></g>`;
}

function sun({ e, cx, cy, s }: EmblemSpot) {
  const inner = 0.24 * s;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5 * Math.PI) / 180;
    const outer = (i % 2 ? 0.42 : 0.5) * s;
    return `M${around(cx, cy, inner, a - 0.09)}L${around(cx, cy, outer, a)}L${around(cx, cy, inner, a + 0.09)}Z`;
  });
  const fill = `fill="${e.color}"`;
  return `<path d="${rays.join("")}" ${fill}/>${circle(cx, cy, s * 0.25, fill)}`;
}

function maple({ e, cx, cy, s }: EmblemSpot) {
  const points = MAPLE.map(([x, y]) => `${r2(cx + x * s * 1.6)} ${r2(cy + y * s * 1.6)}`).join(" ");
  return `<polygon points="${points}" fill="${e.color}"/>`;
}

/** Cinquante étoiles en rangées alternées de 6 et 5 (États-Unis). */
function starsGrid({ e, cw, ch, height }: EmblemSpot) {
  const stars: string[] = [];
  for (let row = 0; row < 9; row++) {
    const odd = row % 2 === 1;
    for (let col = 0; col < (odd ? 5 : 6); col++) {
      const x = (cw * (2 * col + (odd ? 2 : 1))) / 12;
      const y = (ch * (row + 1)) / 10;
      stars.push(`<polygon points="${starPoints(x, y, height * 0.0308, height * 0.0118)}"/>`);
    }
  }
  return `<g fill="${e.color}">${stars.join("")}</g>`;
}

const EMBLEMS: Record<EmblemKind, (spot: EmblemSpot) => string> = {
  pentagram,
  ring,
  sun,
  maple,
  star: ({ e, cx, cy, s }) =>
    `<polygon points="${starPoints(cx, cy, s / 2, (s / 2) * 0.382)}" fill="${e.color}"/>`,
  disc: ({ e, cx, cy, s }) => circle(cx, cy, s / 2, `fill="${e.color}"`),
  "crescent-star": crescentEmblem,
  "stars-grid": starsGrid,
};

function emblem(e: NonNullable<Flag["emblem"]>, width: number, height: number, flag: Flag) {
  // Sans position, l'emblème d'un drapeau à canton se place au centre du canton.
  const { cw, ch } = cantonSize(flag, width, height);
  const inCanton = flag.layout === "canton";
  const cx = e.x === undefined && inCanton ? cw / 2 : (e.x ?? 0.5) * width;
  const cy = e.y === undefined && inCanton ? ch / 2 : (e.y ?? 0.5) * height;
  return EMBLEMS[e.kind]({ e, cx, cy, cw, ch, height, s: e.size * height });
}

/** Drapeau simplifié en SVG, à n'importe quelles proportions (les bandes s'étirent, pas l'emblème). */
export function flagSvg(flag: Flag, width = 300, height = 200) {
  const parts: string[] = [];
  const [first = "#ffffff", second = "#ffffff", third = "#ffffff"] = flag.colors;
  switch (flag.layout) {
    case "vertical":
      parts.push(bands(flag.colors, flag.weights, width, height, true));
      break;
    case "horizontal":
      parts.push(bands(flag.colors, flag.weights, height, width, false));
      break;
    case "hoist": {
      const hoist = (flag.hoist ?? 1 / 3) * width;
      parts.push(
        bands(flag.colors.slice(1), flag.weights?.slice(1), height, width - hoist + 0.5, false, hoist - 0.5),
      );
      parts.push(`<rect x="0" y="0" width="${r2(hoist)}" height="${height}" fill="${first}"/>`);
      break;
    }
    case "canton": {
      const count = flag.stripes ?? 13;
      for (let i = 0; i < count; i++) {
        parts.push(
          `<rect x="0" y="${r2((i * height) / count)}" width="${width}" height="${r2(height / count + 0.5)}" fill="${flag.colors[i % flag.colors.length]}"/>`,
        );
      }
      const { cw, ch } = cantonSize(flag, width, height);
      parts.push(
        `<rect x="0" y="0" width="${r2(cw)}" height="${r2(ch)}" fill="${flag.canton?.color ?? "#3c3b6e"}"/>`,
      );
      break;
    }
    case "rhombus": {
      const mx = width * 0.085;
      const my = height * 0.121;
      parts.push(
        `<rect width="${width}" height="${height}" fill="${first}"/>`,
        `<polygon points="${r2(width / 2)} ${r2(my)} ${r2(width - mx)} ${r2(height / 2)} ${r2(width / 2)} ${r2(height - my)} ${r2(mx)} ${r2(height / 2)}" fill="${second}"/>`,
      );
      break;
    }
    case "diagonal":
      parts.push(
        `<rect width="${width}" height="${height}" fill="${second}"/>`,
        `<polygon points="0 0 ${r2(width * 0.7)} 0 0 ${r2(height * 0.7)}" fill="${first}"/>`,
        `<polygon points="${width} ${height} ${width} ${r2(height * 0.3)} ${r2(width * 0.3)} ${height}" fill="${third}"/>`,
      );
      break;
  }
  if (flag.emblem) parts.push(emblem(flag.emblem, width, height, flag));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join("")}</svg>`;
}

/** Toutes les couleurs d'un drapeau (bandes, canton, emblème), pour les fanions et le bandeau. */
export function flagPalette(flag: Flag) {
  return [
    ...new Set(
      [...flag.colors, flag.canton?.color, flag.emblem?.color]
        .filter((c): c is string => Boolean(c))
        .map((c) => c.toLowerCase()),
    ),
  ];
}

/** Couleurs vives d'un drapeau (sans le blanc), pour les confettis. */
export function flagColors(flag: Flag) {
  const vivid = flagPalette(flag).filter((c) => c !== "#ffffff");
  return vivid.length ? vivid : ["#111111"];
}

/** Prochaine célébration (aujourd'hui compris) : date et nombre d'années depuis l'origine. */
export function nextCelebration(country: Country, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let year = today.getFullYear();
  if (new Date(year, country.month - 1, country.day) < start) year += 1;
  return {
    date: new Date(year, country.month - 1, country.day),
    years: country.year ? year - country.year : null,
  };
}
