import type { DesignElement } from "./types";

// Géométrie de l'éditeur : boîtes, rotation, aimantation et redimensionnement.

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const RAD = Math.PI / 180;

export function rotatePoint(p: Point, center: Point, degrees: number): Point {
  if (!degrees) return p;
  const a = degrees * RAD;
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return { x: center.x + dx * Math.cos(a) - dy * Math.sin(a), y: center.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

export function center(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Coins d'un élément dans la page, rotation comprise. */
export function corners(el: Box & { rotation?: number }): Point[] {
  const c = center(el);
  return [
    { x: el.x, y: el.y },
    { x: el.x + el.width, y: el.y },
    { x: el.x + el.width, y: el.y + el.height },
    { x: el.x, y: el.y + el.height },
  ].map((p) => rotatePoint(p, c, el.rotation ?? 0));
}

/** Boîte englobante alignée sur les axes. */
export function aabb(el: Box & { rotation?: number }): Box {
  const pts = corners(el);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

export function union(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x, y, width: right - x, height: bottom - y };
}

export function intersects(a: Box, b: Box) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function normalizeBox(a: Point, b: Point): Box {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

// ─── Aimantation ───

export interface Guide {
  axis: "x" | "y";
  /** Position de la ligne (x pour un guide vertical, y pour un guide horizontal). */
  position: number;
  from: number;
  to: number;
}

interface SnapTargets {
  x: number[];
  y: number[];
  boxes: Box[];
}

/** Repères d'aimantation : bords et centre de la page, bords et centres des autres éléments. */
export function snapTargets(page: { width: number; height: number }, others: DesignElement[]): SnapTargets {
  const boxes = others.filter((el) => !el.hidden).map(aabb);
  const x = [0, page.width / 2, page.width];
  const y = [0, page.height / 2, page.height];
  for (const b of boxes) {
    x.push(b.x, b.x + b.width / 2, b.x + b.width);
    y.push(b.y, b.y + b.height / 2, b.y + b.height);
  }
  return { x, y, boxes: [{ x: 0, y: 0, width: page.width, height: page.height }, ...boxes] };
}

function nearest(values: number[], targets: number[], threshold: number) {
  let best: { delta: number; target: number; value: number } | null = null;
  for (const value of values) {
    for (const target of targets) {
      const delta = target - value;
      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, target, value };
    }
  }
  return best;
}

/** Décale une boîte vers les repères proches ; renvoie le décalage et les guides à afficher. */
export function snapBox(box: Box, targets: SnapTargets, threshold: number) {
  const xs = [box.x, box.x + box.width / 2, box.x + box.width];
  const ys = [box.y, box.y + box.height / 2, box.y + box.height];
  const sx = nearest(xs, targets.x, threshold);
  const sy = nearest(ys, targets.y, threshold);
  const dx = sx?.delta ?? 0;
  const dy = sy?.delta ?? 0;
  const moved = { ...box, x: box.x + dx, y: box.y + dy };
  const guides: Guide[] = [];
  if (sx) {
    const related = targets.boxes.filter((b) => [b.x, b.x + b.width / 2, b.x + b.width].some((v) => Math.abs(v - sx.target) < 0.5));
    const span = union([moved, ...related])!;
    guides.push({ axis: "x", position: sx.target, from: span.y, to: span.y + span.height });
  }
  if (sy) {
    const related = targets.boxes.filter((b) => [b.y, b.y + b.height / 2, b.y + b.height].some((v) => Math.abs(v - sy.target) < 0.5));
    const span = union([moved, ...related])!;
    guides.push({ axis: "y", position: sy.target, from: span.x, to: span.x + span.width });
  }
  return { dx, dy, guides };
}

// ─── Redimensionnement ───

const HANDLE_VECTORS: Record<Handle, [number, number]> = {
  nw: [-1, -1],
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
};

export function handleVector(handle: Handle) {
  return HANDLE_VECTORS[handle];
}

export function isCorner(handle: Handle) {
  return handle.length === 2;
}

/**
 * Nouvelle boîte d'un élément tiré par une poignée : le coin ou le côté opposé reste fixe,
 * rotation comprise. `keepRatio` conserve les proportions ; `fromCenter` agrandit depuis le centre.
 */
export function resizeBox(
  start: Box & { rotation: number },
  handle: Handle,
  pointer: Point,
  options: { keepRatio: boolean; fromCenter: boolean; minSize?: number },
): Box {
  const [hx, hy] = HANDLE_VECTORS[handle];
  const c = center(start);
  const min = options.minSize ?? 4;
  // Pointeur dans le repère local de l'élément (non tourné, origine au centre)
  const local = rotatePoint(pointer, c, -start.rotation);
  const lx = local.x - c.x;
  const ly = local.y - c.y;
  const anchorX = options.fromCenter ? 0 : (-hx * start.width) / 2;
  const anchorY = options.fromCenter ? 0 : (-hy * start.height) / 2;
  const factor = options.fromCenter ? 2 : 1;
  let width = hx ? Math.max(min, Math.abs(lx - anchorX) * factor) : start.width;
  let height = hy ? Math.max(min, Math.abs(ly - anchorY) * factor) : start.height;
  if (options.keepRatio) {
    const ratio = start.width / start.height;
    if (hx && hy) {
      if (width / height > ratio) height = width / ratio;
      else width = height * ratio;
    } else if (hx) {
      height = width / ratio;
    } else {
      width = height * ratio;
    }
  }
  // Nouveau centre : l'ancre (côté opposé) reste en place.
  const newCenterLocal = options.fromCenter
    ? { x: 0, y: 0 }
    : { x: hx ? anchorX + (hx * width) / 2 : 0, y: hy ? anchorY + (hy * height) / 2 : 0 };
  const newCenter = rotatePoint({ x: c.x + newCenterLocal.x, y: c.y + newCenterLocal.y }, c, start.rotation);
  return { x: newCenter.x - width / 2, y: newCenter.y - height / 2, width, height };
}

/** Angle (degrés) du pointeur autour du centre, poignée de rotation au-dessus de l'élément. */
export function rotationAngle(centerPoint: Point, pointer: Point, snap: boolean) {
  let angle = (Math.atan2(pointer.y - centerPoint.y, pointer.x - centerPoint.x) * 180) / Math.PI + 90;
  angle = ((angle % 360) + 360) % 360;
  if (snap) angle = Math.round(angle / 15) * 15;
  else {
    for (const right of [0, 90, 180, 270, 360]) if (Math.abs(angle - right) < 3) angle = right;
  }
  return angle % 360 > 180 ? (angle % 360) - 360 : angle % 360;
}
