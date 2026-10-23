import type { ApparelTemplate, GarmentView, PrintZone, ProductCategory } from "./types";

// Dessins techniques à plat des supports, en mm, taille de référence M (poitrine 520 mm, longueur
// 720 mm). Repère : x = 0 sur l'axe du vêtement, y = 0 au bas du col de la vue (devant : creux
// de l'encolure ; dos : nuque), y vers le bas. Les zones d'impression s'y placent directement.

export interface GarmentShape {
  /** Contour du vêtement (tracé fermé). */
  outline: string;
  /** Coutures, col, bord-côtes : traits de détail. */
  details: string[];
  /** Intérieur du dos visible par l'encolure (vue de devant). */
  inner?: string;
  /** Pièces rapportées (col polo), dessinées par-dessus le tissu. */
  pieces?: string[];
  /** Cadre de la vue (marges comprises). */
  box: { x: number; y: number; width: number; height: number };
}

type Point = [number, number];

/** Tracé symétrique : la moitié droite (vue) est donnée, la gauche est son miroir. */
function mirrored(neck: string, right: Point[], hem: number) {
  const side = right.map(([x, y]) => `L${x} ${y}`).join("");
  const back = [...right]
    .reverse()
    .map(([x, y]) => `L${-x} ${y}`)
    .join("");
  const last = right.at(-1)!;
  return `M0 0${neck}${side}Q0 ${hem + 6} ${-last[0]} ${last[1]}${back}`;
}

const TEE_FRONT: Point[] = [
  [210, -42],
  [350, 115],
  [280, 165],
  [258, 128],
  [262, 645],
];
const TEE_BACK: Point[] = [
  [210, 10],
  [350, 167],
  [280, 217],
  [258, 180],
  [262, 700],
];
const TANK_FRONT: Point[] = [
  [150, -60],
  [175, -55],
  [190, 60],
  [262, 150],
  [262, 645],
];
const TANK_BACK: Point[] = [
  [150, -10],
  [175, -5],
  [190, 90],
  [262, 170],
  [262, 700],
];

interface TeeOptions {
  vNeck?: boolean;
  polo?: boolean;
  tank?: boolean;
}

function sidePoints(front: boolean, tank?: boolean): Point[] {
  if (tank) return front ? TANK_FRONT : TANK_BACK;
  return front ? TEE_FRONT : TEE_BACK;
}

/**
 * Encolure : aller du creux (0, 0) au point d'épaule droit, retour depuis l'épaule gauche, et
 * fermeture de l'intérieur du dos visible par l'encolure (en V ou en courbe).
 */
function neckline(neckX: number, neckY: number, front: boolean, vNeck: boolean) {
  if (vNeck) return { out: `L${neckX} ${neckY}`, back: "L0 0", inner: "L0 0" };
  const sag = front ? -5 : -2;
  const control = neckX - 5;
  return {
    out: `Q${control} ${sag} ${neckX} ${neckY}`,
    back: `Q${-control} ${sag} 0 0`,
    inner: `Q${control} -5 0 0Q${-control} -5 ${-neckX} ${neckY}`,
  };
}

/** Bord-côte du col, doublé à 12 mm. */
function ribPath(front: boolean, vNeck: boolean, neckX: number, neckY: number) {
  if (!front) return `M${-neckX - 10} ${neckY + 3}Q0 14 ${neckX + 10} ${neckY + 3}`;
  if (vNeck) return `M${-neckX - 8} ${neckY + 4}L0 16L${neckX + 8} ${neckY + 4}`;
  return `M${-neckX - 10} ${neckY + 4}Q${-(neckX - 2)} 12 0 14Q${neckX - 2} 12 ${neckX + 10} ${neckY + 4}`;
}

/** Coutures d'emmanchure et ourlets de manches, des deux côtés. */
function sleeveSeams(right: Point[]) {
  const [shoulder, outer, cuff, armpit] = right as [Point, Point, Point, Point, Point];
  return [1, -1].flatMap((s) => [
    `M${s * shoulder[0]} ${shoulder[1]}Q${s * (shoulder[0] + 20)} ${(shoulder[1] + armpit[1]) / 2} ${s * armpit[0]} ${armpit[1]}`,
    `M${s * (outer[0] - 8)} ${outer[1] + 9}L${s * (cuff[0] - 6)} ${cuff[1] - 8}`,
  ]);
}

/** Patte de boutonnage et col rabattu (deux pointes) d'un polo. */
function poloParts(neckX: number, neckY: number) {
  return {
    details: [`M-14 0L-14 110L14 110L14 0`, `M0 30L0 30.5M0 62L0 62.5M0 94L0 94.5`],
    pieces: [1, -1].map(
      (s) =>
        `M${s * (neckX + 6)} ${neckY - 2}Q${s * (neckX - 10)} ${neckY + 40} ${s * 36} ${neckY + 84}L${s * 2} ${neckY + 66}Q${s * 30} ${neckY + 20} ${s * (neckX - 22)} ${neckY - 4}Z`,
    ),
  };
}

function tee(view: "FRONT" | "BACK", options: TeeOptions = {}): GarmentShape {
  const front = view === "FRONT";
  const neckY = front ? -70 : -18;
  const neckX = options.tank ? 120 : 85;
  const right = sidePoints(front, options.tank);
  const vNeck = front && Boolean(options.vNeck);
  const neck = neckline(neckX, neckY, front, vNeck);
  const [hemX, hem] = right.at(-1)!;
  const outline = `${mirrored(neck.out, right, hem)}L${-neckX} ${neckY}${neck.back}Z`;
  const details = [ribPath(front, vNeck, neckX, neckY)];
  if (!options.tank) details.push(...sleeveSeams(right));
  details.push(`M${-hemX + 4} ${hem - 18}Q0 ${hem - 12} ${hemX - 4} ${hem - 18}`);
  const polo = options.polo && front ? poloParts(neckX, neckY) : { details: [], pieces: [] };
  details.push(...polo.details);
  // Encolure du dos, plus haute : on voit l'intérieur du vêtement entre les deux.
  const inner = front ? `M${-neckX} ${neckY}Q0 ${neckY + 22} ${neckX} ${neckY}${neck.inner}Z` : undefined;
  const top = neckY - 10;
  return {
    outline,
    details,
    inner,
    pieces: polo.pieces,
    box: { x: -400, y: top - 20, width: 800, height: hem + 40 - (top - 20) },
  };
}

function sleeve(): GarmentShape {
  return {
    outline: "M-115 20Q-70 -38 0 -44Q70 -38 115 20L96 205L-96 205Z",
    details: ["M-97 188L97 188"],
    box: { x: -170, y: -80, width: 340, height: 320 },
  };
}

function shorts(): GarmentShape {
  return {
    outline: "M-300 0L300 0L325 480L30 480L0 270L-30 480L-325 480Z",
    details: ["M-300 40L300 40", "M-322 450L-34 450", "M322 450L34 450", "M0 40L0 270"],
    box: { x: -380, y: -40, width: 760, height: 560 },
  };
}

/** Dessin d'une vue d'un support. */
export function garmentShape(category: ProductCategory, view: GarmentView): GarmentShape {
  if (view === "LEFT_SLEEVE" || view === "RIGHT_SLEEVE") return sleeve();
  if (view === "SHORTS_FRONT" || category === "SHORTS") return shorts();
  const face = view === "BACK" ? "BACK" : "FRONT";
  if (category === "POLO") return tee(face, { polo: true });
  if (category === "FOOTBALL_JERSEY") return tee(face, { vNeck: true });
  if (category === "BASKETBALL_JERSEY") return tee(face, { tank: true, vNeck: true });
  return tee(face);
}

/** Vues d'un support, dans l'ordre d'affichage. */
export function viewsOf(template: Pick<ApparelTemplate, "zones">): GarmentView[] {
  const order: GarmentView[] = ["FRONT", "BACK", "LEFT_SLEEVE", "RIGHT_SLEEVE", "SHORTS_FRONT", "OTHER"];
  const present = new Set(template.zones.map((z) => z.view));
  return order.filter((v) => present.has(v));
}

/**
 * Rectangle d'une zone dans la vue. Le côté gauche du porteur (x positif) apparaît à droite sur
 * le devant et à gauche sur le dos.
 */
export function zoneRect(zone: PrintZone) {
  const axis = zone.view === "BACK" ? -zone.offsetXMm : zone.offsetXMm;
  return {
    x: axis - zone.maxWidthMm / 2,
    y: zone.offsetYMm,
    width: zone.maxWidthMm,
    height: zone.maxHeightMm,
  };
}
