"use client";

import { memo, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Copy, Lock, LockOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cssFontFamily } from "@/lib/render/fonts";
import { cloneElement, mapPage, scaleElement } from "@/lib/studio/doc";
import {
  aabb,
  center,
  corners,
  handleVector,
  intersects,
  normalizeBox,
  resizeBox,
  rotatePoint,
  rotationAngle,
  snapBox,
  snapTargets,
  union,
  type Box,
  type Guide,
  type Handle,
  type Point,
} from "@/lib/studio/geometry";
import { photoPlacement } from "@/lib/render/photo";
import { elementTransform, renderBackground, renderElement } from "@/lib/studio/render";
import { isFrame } from "@/lib/studio/smart";
import { naturalWidth, relayout } from "@/lib/studio/text";
import type { DesignElement, DesignPage, ImageElement, TextElement } from "@/lib/studio/types";
import { MAX_ZOOM, MIN_ZOOM, useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";
import { CommentLayer } from "./comments";

// Zone de travail du Studio : la page est dessinée en SVG (repère de la page, zoom et
// déplacement par transformation), les poignées et repères par-dessus, en px écran pour
// garder une taille constante. Tous les gestes passent par les événements pointeur.

const HANDLE = 9;
const ROTATE_OFFSET = 28;
const DRAG_THRESHOLD = 3;
const SNAP_PX = 6;

const ALL_HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const CORNERS: Handle[] = ["nw", "ne", "se", "sw"];

/** Poignées proposées selon le type : le texte s'élargit par les côtés, les icônes gardent leurs proportions. */
function handlesFor(el: DesignElement, screenW: number, screenH: number): Handle[] {
  if (el.type === "text") return screenW > 36 ? ["nw", "ne", "se", "sw", "e", "w"] : CORNERS;
  if (el.type === "icon" || el.type === "svg") return CORNERS;
  return screenW > 40 && screenH > 40 ? ALL_HANDLES : CORNERS;
}

const CURSORS = ["ew-resize", "nwse-resize", "ns-resize", "nesw-resize"];

function handleCursor(handle: Handle, rotation: number) {
  const [hx, hy] = handleVector(handle);
  const angle = (Math.atan2(hy, hx) * 180) / Math.PI + rotation;
  const index = Math.round((((angle % 180) + 180) % 180) / 45) % 4;
  return CURSORS[index];
}

/** Élément sous le pointeur, du premier plan vers le fond. */
function hitTest(elements: DesignElement[], p: Point, tolerance: number) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]!;
    if (el.hidden) continue;
    const local = rotatePoint(p, center(el), -el.rotation);
    const padX = Math.max(0, tolerance - el.width / 2);
    const padY = Math.max(0, tolerance - el.height / 2);
    if (local.x >= el.x - padX && local.x <= el.x + el.width + padX && local.y >= el.y - padY && local.y <= el.y + el.height + padY) return el;
  }
  return null;
}

type Originals = Map<string, DesignElement>;

type Gesture =
  | { type: "pending"; start: Point; screen: Point; hitId: string; alt: boolean }
  | { type: "move"; start: Point; originals: Originals; targets: ReturnType<typeof snapTargets>; startBox: Box }
  | { type: "resize"; handle: Handle; originals: Originals; startBox: Box & { rotation: number }; targets: ReturnType<typeof snapTargets> }
  | { type: "rotate"; pivot: Point; startAngle: number; originals: Originals }
  | { type: "marquee"; start: Point; current: Point; base: string[] }
  | { type: "pan"; screen: Point; panX: number; panY: number }
  | { type: "crop"; start: Point; original: ImageElement }
  /** Deux doigts : écartement et milieu au départ (repère de l'écran), vue de départ. */
  | { type: "pinch"; distance: number; mid: Point; zoom: number; panX: number; panY: number };

const ElementLayer = memo(function ElementLayer({ el }: { el: DesignElement }) {
  return <g data-el={el.id} dangerouslySetInnerHTML={{ __html: renderElement(el) }} />;
});

const BackgroundLayer = memo(function BackgroundLayer({ page, width, height }: { page: DesignPage; width: number; height: number }) {
  return <g dangerouslySetInnerHTML={{ __html: renderBackground(page, { width, height }) }} />;
});

/** Aimantation des bords tirés pendant un redimensionnement (éléments droits). */
function snapResize(box: Box, handle: Handle, targets: ReturnType<typeof snapTargets>, threshold: number, keepRatio: boolean) {
  const [hx, hy] = handleVector(handle);
  const guides: Guide[] = [];
  const out = { ...box };
  const ratio = box.width / box.height;
  const nearest = (value: number, list: number[]) => {
    let best: number | null = null;
    for (const t of list) if (Math.abs(t - value) <= threshold && (best === null || Math.abs(t - value) < Math.abs(best - value))) best = t;
    return best;
  };
  if (hx) {
    const edge = hx > 0 ? out.x + out.width : out.x;
    const target = nearest(edge, targets.x);
    if (target !== null) {
      if (hx > 0) out.width = target - out.x;
      else {
        out.width += out.x - target;
        out.x = target;
      }
      guides.push({ axis: "x", position: target, from: Math.min(out.y, 0), to: Math.max(out.y + out.height, 0) });
      if (keepRatio) {
        const height = out.width / ratio;
        if (hy < 0) out.y += out.height - height;
        out.height = height;
        return { box: out, guides };
      }
    }
  }
  if (hy && !(keepRatio && hx)) {
    const edge = hy > 0 ? out.y + out.height : out.y;
    const target = nearest(edge, targets.y);
    if (target !== null) {
      if (hy > 0) out.height = target - out.y;
      else {
        out.height += out.y - target;
        out.y = target;
      }
      guides.push({ axis: "y", position: target, from: Math.min(out.x, 0), to: Math.max(out.x + out.width, 0) });
    }
  }
  return { box: out, guides };
}

/** Applique une boîte à un élément : un texte se met en page, un groupe se met à l'échelle. */
function applyBox(el: DesignElement, box: Box, handle: Handle): DesignElement {
  if (el.type === "text") {
    if (handle === "e" || handle === "w") return relayout({ ...el, x: box.x, width: Math.max(el.fontSize * 0.6, box.width) });
    const s = box.width / el.width;
    const scaled = scaleElement(el, s);
    return relayout({ ...scaled, x: box.x, y: box.y, width: box.width });
  }
  return { ...el, ...box };
}

export interface CanvasProps {
  /** Fichiers déposés : point de dépôt dans la page et cadre photo visé. */
  onDropFiles(files: File[], point: Point, frameId: string | null): void;
  /** Double-clic sur un cadre photo vide. */
  onRequestImage(frameId: string): void;
}

export function StudioCanvas({ onDropFiles, onRequestImage }: CanvasProps) {
  const t = useTranslations("studio.canvas");
  const doc = useStudio((s) => s.doc);
  const pageIndex = useStudio((s) => s.pageIndex);
  const selection = useStudio((s) => s.selection);
  const editingId = useStudio((s) => s.editingId);
  const cropId = useStudio((s) => s.cropId);
  const zoom = useStudio((s) => s.zoom);
  const panX = useStudio((s) => s.panX);
  const panY = useStudio((s) => s.panY);
  const guides = useStudio((s) => s.guides);
  const printGuides = useStudio((s) => s.printGuides);
  const viewport = useStudio((s) => s.viewport);
  const commentMode = useStudio((s) => s.commentMode);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const space = useRef(false);
  /** Doigts posés sur l'écran tactile (position à l'écran). */
  const touches = useRef(new Map<number, Point>());
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<Box | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [active, setActive] = useState<Gesture["type"] | null>(null);
  const busy = active !== null;
  const [dropFrame, setDropFrame] = useState<string | null>(null);

  const page = doc?.pages[pageIndex] ?? null;

  // Fin d'édition d'un texte : un texte vidé est supprimé.
  const lastEditing = useRef<string | null>(null);
  useEffect(() => {
    const previous = lastEditing.current;
    lastEditing.current = editingId;
    if (!previous || previous === editingId) return;
    const state = useStudio.getState();
    const el = state.doc?.pages[state.pageIndex]?.elements.find((e) => e.id === previous);
    if (el?.type === "text" && !el.text.trim()) {
      state.change((d) => mapPage(d, state.pageIndex, (p) => ({ ...p, elements: p.elements.filter((e) => e.id !== previous) })));
      state.select(state.selection.filter((id) => id !== previous));
    }
  }, [editingId]);

  // Taille de la zone de travail.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) useStudio.getState().setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Molette : zoom (Ctrl/⌘ ou pincement), sinon défilement.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const state = useStudio.getState();
      const rect = node.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0025));
        state.zoomAt(state.zoom * factor, { x: event.clientX - rect.left, y: event.clientY - rect.top });
      } else {
        const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        const dy = event.shiftKey && !event.deltaX ? 0 : event.deltaY;
        state.setView({ panX: state.panX - dx, panY: state.panY - dy });
      }
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  // Barre d'espace maintenue : main (déplacement de la vue).
  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const down = (event: KeyboardEvent) => {
      if (event.code === "Space" && !typing(event.target)) {
        space.current = true;
        event.preventDefault();
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "Space") space.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const toPage = (clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    const { zoom: z, panX: px, panY: py } = useStudio.getState();
    return { x: (clientX - rect.left - px) / z, y: (clientY - rect.top - py) / z };
  };
  const toScreen = (p: Point): Point => ({ x: panX + p.x * zoom, y: panY + p.y * zoom });
  /** Écartement et milieu des deux premiers doigts, milieu dans le repère de la zone de travail. */
  const twoFingers = () => {
    const [a, b] = [...touches.current.values()];
    if (!a || !b) return null;
    const rect = svgRef.current!.getBoundingClientRect();
    return { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), mid: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top } };
  };

  const selectedEls = useMemo(() => {
    const ids = new Set(selection);
    return page?.elements.filter((el) => ids.has(el.id)) ?? [];
  }, [page, selection]);

  if (!doc || !page) return <div ref={containerRef} className="relative flex-1" />;

  // ─── Gestes ───

  const startMove = (start: Point, alt: boolean) => {
    const state = useStudio.getState();
    const current = state.doc!.pages[state.pageIndex]!;
    let ids = state.selection.filter((id) => !current.elements.find((el) => el.id === id)?.locked);
    if (!ids.length) return null;
    state.begin();
    if (alt) {
      // Alt + glisser : déplace une copie.
      const copies = current.elements.filter((el) => ids.includes(el.id)).map((el) => cloneElement(el));
      state.change((d) => mapPage(d, state.pageIndex, (p) => ({ ...p, elements: [...p.elements, ...copies] })), "none");
      ids = copies.map((el) => el.id);
      state.select(ids);
    }
    const fresh = useStudio.getState().doc!.pages[state.pageIndex]!;
    const set = new Set(ids);
    const originals: Originals = new Map(fresh.elements.filter((el) => set.has(el.id)).map((el) => [el.id, el]));
    return {
      type: "move" as const,
      start,
      originals,
      targets: snapTargets(doc, fresh.elements.filter((el) => !set.has(el.id))),
      startBox: union([...originals.values()].map(aabb))!,
    };
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const state = useStudio.getState();
    const p = toPage(event.clientX, event.clientY);
    svgRef.current!.setPointerCapture(event.pointerId);

    if (event.pointerType === "touch") {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const fingers = touches.current.size >= 2 ? twoFingers() : null;
      if (fingers) {
        // Deuxième doigt : pincer zoome, glisser déplace la vue ; le geste du premier doigt est annulé.
        const g = gesture.current;
        if (g && (g.type === "move" || g.type === "resize" || g.type === "rotate" || g.type === "crop")) state.cancel();
        setMarquee(null);
        setInfo(null);
        gesture.current = { type: "pinch", ...fingers, zoom: state.zoom, panX: state.panX, panY: state.panY };
        setActive("pinch");
        return;
      }
    }

    if (event.button === 1 || space.current) {
      gesture.current = { type: "pan", screen: { x: event.clientX, y: event.clientY }, panX: state.panX, panY: state.panY };
      setActive("pan");
      return;
    }
    if (event.button !== 0) return;

    // Mode commentaire : un clic sur la page pose une épingle.
    if (state.commentMode) {
      // Pas de changement de focus au clic : la zone de saisie de l'épingle le garde.
      event.preventDefault();
      gesture.current = null;
      const inside = p.x >= 0 && p.y >= 0 && p.x <= doc.width && p.y <= doc.height;
      state.setDraftPin(inside ? { x: p.x / doc.width, y: p.y / doc.height } : null);
      return;
    }
    if (state.activeThread) state.openThread(null);

    const handle = (event.target as Element).closest("[data-handle]")?.getAttribute("data-handle");
    const current = state.doc!.pages[state.pageIndex]!;
    const chosen = current.elements.filter((el) => state.selection.includes(el.id) && !el.locked);

    if (handle && chosen.length) {
      state.begin();
      const originals: Originals = new Map(chosen.map((el) => [el.id, el]));
      const others = current.elements.filter((el) => !originals.has(el.id));
      if (handle === "rotate") {
        const pivot = chosen.length === 1 ? center(chosen[0]!) : center(union(chosen.map(aabb))!);
        gesture.current = { type: "rotate", pivot, startAngle: rotationAngle(pivot, p, false), originals };
      } else {
        const startBox = chosen.length === 1 ? { ...chosen[0]!, rotation: chosen[0]!.rotation } : { ...union(chosen.map(aabb))!, rotation: 0 };
        gesture.current = { type: "resize", handle: handle as Handle, originals, startBox, targets: snapTargets(doc, others) };
      }
      setActive(handle === "rotate" ? "rotate" : "resize");
      return;
    }

    // Recadrage d'une photo : glisser déplace l'image dans son masque.
    if (state.cropId) {
      const target = current.elements.find((el) => el.id === state.cropId);
      if (target?.type === "image" && hitTest([target], p, 0)) {
        state.begin();
        gesture.current = { type: "crop", start: p, original: target };
        setActive("crop");
        return;
      }
      state.setCrop(null);
    }
    if (state.editingId) state.setEditing(null);

    const hit = hitTest(current.elements, p, 4 / state.zoom);
    if (hit) {
      if (event.shiftKey) {
        state.toggle(hit.id);
        gesture.current = null;
        return;
      }
      if (!state.selection.includes(hit.id)) state.select([hit.id]);
      gesture.current = { type: "pending", start: p, screen: { x: event.clientX, y: event.clientY }, hitId: hit.id, alt: event.altKey };
    } else {
      const base = event.shiftKey ? state.selection : [];
      if (!event.shiftKey) state.select([]);
      // Au doigt, glisser sur le fond déplace la vue (la sélection par lasso reste à la souris).
      if (event.pointerType === "touch") {
        gesture.current = { type: "pan", screen: { x: event.clientX, y: event.clientY }, panX: state.panX, panY: state.panY };
        setActive("pan");
        return;
      }
      gesture.current = { type: "marquee", start: p, current: p, base };
    }
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const state = useStudio.getState();
    if (touches.current.has(event.pointerId)) touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    const p = toPage(event.clientX, event.clientY);
    if (!g) {
      const hit = hitTest(state.doc!.pages[state.pageIndex]!.elements, p, 4 / state.zoom);
      if ((hit?.id ?? null) !== hoverId) setHoverId(hit?.id ?? null);
      return;
    }
    const threshold = SNAP_PX / state.zoom;

    switch (g.type) {
      case "pan":
        state.setView({ panX: g.panX + event.clientX - g.screen.x, panY: g.panY + event.clientY - g.screen.y });
        return;
      case "pinch": {
        const fingers = twoFingers();
        if (!fingers) return;
        const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (g.zoom * fingers.distance) / g.distance));
        // Le point de la page pris entre les doigts au départ reste entre les doigts.
        state.setView({ zoom: z, panX: fingers.mid.x - ((g.mid.x - g.panX) / g.zoom) * z, panY: fingers.mid.y - ((g.mid.y - g.panY) / g.zoom) * z });
        return;
      }
      case "pending": {
        if (Math.hypot(event.clientX - g.screen.x, event.clientY - g.screen.y) < DRAG_THRESHOLD) return;
        const move = startMove(g.start, g.alt);
        gesture.current = move;
        if (move) setActive("move");
        return;
      }
      case "move": {
        let dx = p.x - g.start.x;
        let dy = p.y - g.start.y;
        if (event.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0;
          else dx = 0;
        }
        let shown: Guide[] = [];
        if (!event.metaKey && !event.ctrlKey) {
          const snapped = snapBox({ ...g.startBox, x: g.startBox.x + dx, y: g.startBox.y + dy }, g.targets, threshold);
          dx += snapped.dx;
          dy += snapped.dy;
          shown = snapped.guides;
        }
        state.change((d) => mapPage(d, state.pageIndex, (pg) => ({ ...pg, elements: pg.elements.map((el) => {
          const original = g.originals.get(el.id);
          return original ? { ...el, x: original.x + dx, y: original.y + dy } : el;
        }) })), "none");
        state.setGuides(shown);
        setInfo(`X ${Math.round(g.startBox.x + dx)} · Y ${Math.round(g.startBox.y + dy)}`);
        return;
      }
      case "resize": {
        const originals = [...g.originals.values()];
        const single = originals.length === 1 ? originals[0]! : null;
        const corner = g.handle.length === 2;
        const keepRatio = single
          ? single.type === "text" || single.type === "icon" || single.type === "svg"
            ? corner
            : single.type === "image"
              ? corner !== event.shiftKey
              : event.shiftKey
          : true;
        let box = resizeBox(g.startBox, g.handle, p, { keepRatio, fromCenter: event.altKey, minSize: 4 });
        let shown: Guide[] = [];
        if (!g.startBox.rotation && !event.altKey && !event.metaKey && !event.ctrlKey) {
          const snapped = snapResize(box, g.handle, g.targets, threshold, keepRatio);
          box = snapped.box;
          shown = snapped.guides;
        }
        if (single) {
          state.change((d) => mapPage(d, state.pageIndex, (pg) => ({ ...pg, elements: pg.elements.map((el) => (el.id === single.id ? applyBox(single, box, g.handle) : el)) })), "none");
        } else {
          const s = box.width / g.startBox.width;
          state.change(
            (d) =>
              mapPage(d, state.pageIndex, (pg) => ({
                ...pg,
                elements: pg.elements.map((el) => {
                  const original = g.originals.get(el.id);
                  if (!original) return el;
                  const scaled = scaleElement(original, s);
                  const c = center(original);
                  const nc = { x: box.x + (c.x - g.startBox.x) * s, y: box.y + (c.y - g.startBox.y) * s };
                  const placed = { ...scaled, x: nc.x - scaled.width / 2, y: nc.y - scaled.height / 2 };
                  return placed.type === "text" ? relayout(placed) : placed;
                }),
              })),
            "none",
          );
        }
        state.setGuides(shown);
        setInfo(`${Math.round(box.width)} × ${Math.round(box.height)}`);
        return;
      }
      case "rotate": {
        const angle = rotationAngle(g.pivot, p, event.shiftKey);
        const originals = [...g.originals.values()];
        if (originals.length === 1) {
          state.change((d) => mapPage(d, state.pageIndex, (pg) => ({ ...pg, elements: pg.elements.map((el) => (el.id === originals[0]!.id ? { ...el, rotation: angle } : el)) })), "none");
          setInfo(`${Math.round(angle)}°`);
        } else {
          const delta = angle - g.startAngle;
          state.change(
            (d) =>
              mapPage(d, state.pageIndex, (pg) => ({
                ...pg,
                elements: pg.elements.map((el) => {
                  const original = g.originals.get(el.id);
                  if (!original) return el;
                  const c = rotatePoint(center(original), g.pivot, delta);
                  return { ...el, x: c.x - el.width / 2, y: c.y - el.height / 2, rotation: (((original.rotation + delta + 180) % 360) + 360) % 360 - 180 };
                }),
              })),
            "none",
          );
          setInfo(`${Math.round(delta)}°`);
        }
        return;
      }
      case "marquee": {
        g.current = p;
        const box = normalizeBox(g.start, p);
        setMarquee(box);
        const current = state.doc!.pages[state.pageIndex]!;
        const inside = current.elements
          .filter((el) => {
            if (el.hidden || el.locked) return false;
            const b = aabb(el);
            // Un élément qui contient toute la sélection (un fond) n'est pas retenu.
            const contains = b.x <= box.x && b.y <= box.y && b.x + b.width >= box.x + box.width && b.y + b.height >= box.y + box.height;
            return intersects(b, box) && !contains;
          })
          .map((el) => el.id);
        state.select([...new Set([...g.base, ...inside])]);
        return;
      }
      case "crop": {
        const el = g.original;
        // Cadrage dans la zone recadrée (l'image entière quand elle n'est pas recadrée).
        const place = photoPlacement(el).region;
        const local = rotatePoint({ x: p.x - g.start.x, y: p.y - g.start.y }, { x: 0, y: 0 }, -el.rotation);
        const overflowX = place.width - el.width;
        const overflowY = place.height - el.height;
        const focusX = overflowX > 0 ? Math.min(1, Math.max(0, (el.focusX ?? 0.5) - local.x / overflowX)) : 0.5;
        const focusY = overflowY > 0 ? Math.min(1, Math.max(0, (el.focusY ?? 0.5) - local.y / overflowY)) : 0.5;
        state.updateElements([el.id], (e) => ({ ...e, focusX, focusY }), "none");
        return;
      }
    }
  };

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const state = useStudio.getState();
    touches.current.delete(event.pointerId);
    const g = gesture.current;
    // Un doigt levé pendant le pincement : la vue reste où elle est, le doigt restant ne fait plus rien.
    if (g?.type === "pinch" && touches.current.size >= 2) return;
    gesture.current = null;
    setActive(null);
    setInfo(null);
    setMarquee(null);
    if (!g) return;
    if (g.type === "pending") {
      // Simple clic dans une sélection multiple : ne garde que l'élément cliqué.
      if (state.selection.length > 1) state.select([g.hitId]);
      return;
    }
    if (g.type === "move" || g.type === "resize" || g.type === "rotate" || g.type === "crop") state.end();
    state.setGuides([]);
  };

  const onDoubleClick = (event: ReactMouseEvent<SVGSVGElement>) => {
    const state = useStudio.getState();
    if (state.commentMode) return;
    const p = toPage(event.clientX, event.clientY);
    const hit = hitTest(state.doc!.pages[state.pageIndex]!.elements, p, 4 / state.zoom);
    if (!hit || hit.locked) return;
    if (hit.type === "text") state.setEditing(hit.id);
    else if (hit.type === "image") state.setCrop(hit.id);
    else if (isFrame(hit)) onRequestImage(hit.id);
  };

  // ─── Dépôt de fichiers ───

  const dropTarget = (event: DragEvent) => {
    const p = toPage(event.clientX, event.clientY);
    const hit = hitTest(page.elements, p, 0);
    return { p, frame: hit && isFrame(hit) ? hit.id : null };
  };
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    const { frame } = dropTarget(event);
    if (frame !== dropFrame) setDropFrame(frame);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    const files = [...event.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
    setDropFrame(null);
    if (!files.length) return;
    event.preventDefault();
    const { p, frame } = dropTarget(event);
    onDropFiles(files, p, frame);
  };

  // ─── Calques d'interface ───

  const pageScreen = { x: panX, y: panY, width: doc.width * zoom, height: doc.height * zoom };
  const bleed = doc.print ? (doc.print.bleedMm / doc.print.widthMm) * doc.width : 0;
  const safe = doc.print ? (5 / doc.print.widthMm) * doc.width : 0;
  const editing = editingId ? (page.elements.find((el) => el.id === editingId) as TextElement | undefined) : undefined;
  const crop = cropId ? (page.elements.find((el) => el.id === cropId) as ImageElement | undefined) : undefined;
  const hover = hoverId && !selection.includes(hoverId) && !busy && !commentMode ? page.elements.find((el) => el.id === hoverId) : undefined;
  const outside = (inset: number) => {
    const x = panX - inset * zoom;
    const y = panY - inset * zoom;
    const w = (doc.width + inset * 2) * zoom;
    const h = (doc.height + inset * 2) * zoom;
    return `M0 0H${viewport.width}V${viewport.height}H0Z M${x} ${y}h${w}v${h}h${-w}Z`;
  };
  const polygon = (el: DesignElement) =>
    corners(el)
      .map(toScreen)
      .map((pt) => `${pt.x},${pt.y}`)
      .join(" ");

  const selectionBox = selectedEls.length > 1 ? union(selectedEls.map(aabb)) : null;
  const single = selectedEls.length === 1 ? selectedEls[0]! : null;
  const showHandles = !busy || active === "resize" || active === "rotate";
  const allLocked = selectedEls.length > 0 && selectedEls.every((el) => el.locked);

  const renderHandles = (box: Box, rotation: number, handles: Handle[]) => {
    const c = center(box);
    const items = handles.map((h) => {
      const [hx, hy] = handleVector(h);
      const pt = toScreen(rotatePoint({ x: c.x + (hx * box.width) / 2, y: c.y + (hy * box.height) / 2 }, c, rotation));
      const corner = h.length === 2;
      const w = corner ? HANDLE : hx ? 6 : 16;
      const hgt = corner ? HANDLE : hx ? 16 : 6;
      return (
        <rect
          key={h}
          data-handle={h}
          x={-w / 2}
          y={-hgt / 2}
          width={w}
          height={hgt}
          rx={corner ? 2 : 3}
          transform={`translate(${pt.x} ${pt.y}) rotate(${rotation})`}
          className="fill-white stroke-primary"
          strokeWidth={1.5}
          style={{ cursor: handleCursor(h, rotation) }}
        />
      );
    });
    const bottom = toScreen(rotatePoint({ x: c.x, y: c.y + box.height / 2 }, c, rotation));
    const rad = (rotation * Math.PI) / 180;
    const knob = { x: bottom.x - Math.sin(rad) * ROTATE_OFFSET, y: bottom.y + Math.cos(rad) * ROTATE_OFFSET };
    items.push(
      <g key="rotate" data-handle="rotate" transform={`translate(${knob.x} ${knob.y})`} style={{ cursor: "grab" }}>
        <circle r={11} className="fill-white stroke-border" strokeWidth={1} />
        <path d="M-4.5 -1.5a4.8 4.8 0 1 1 1.2 4.6M-4.5 -1.5V-5M-4.5 -1.5H-1" className="fill-none stroke-foreground" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
    return items;
  };

  const toolbarAnchor = (() => {
    if (!selectedEls.length || busy || editing || crop || commentMode) return null;
    const box = union(selectedEls.map(aabb))!;
    const top = toScreen({ x: box.x + box.width / 2, y: box.y });
    return { x: top.x, y: Math.max(8, top.y - 52) };
  })();

  const state = useStudio.getState();

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-muted"
      onDragOver={onDragOver}
      onDragLeave={() => setDropFrame(null)}
      onDrop={onDrop}
      onPointerLeave={() => setHoverId(null)}
    >
      <svg
        ref={svgRef}
        className={cn("absolute inset-0 size-full touch-none select-none", active === "pan" && "cursor-grabbing", commentMode && "cursor-crosshair")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        role="application"
        aria-label={t("label")}
      >
        <defs>
          <filter id="studio-page-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.16" />
          </filter>
          {viewport.width > 0 && (
            <clipPath id="studio-outside">
              <path d={outside(0)} clipRule="evenodd" />
            </clipPath>
          )}
        </defs>
        <rect {...pageScreen} fill="#ffffff" />
        <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
          <BackgroundLayer page={page} width={doc.width} height={doc.height} />
          {page.elements.map((el) => (el.id === editingId ? null : <ElementLayer key={el.id} el={el} />))}
        </g>
        {/* Hors page : estompé (fond perdu plus légèrement pour l'impression). */}
        {viewport.width > 0 && (
          <>
            <path d={outside(bleed)} fillRule="evenodd" className="pointer-events-none fill-muted/85" />
            {bleed > 0 && <path d={outside(0)} fillRule="evenodd" className="pointer-events-none fill-muted/40" />}
            <rect {...pageScreen} fill="#ffffff" filter="url(#studio-page-shadow)" clipPath="url(#studio-outside)" className="pointer-events-none" />
            <rect {...pageScreen} className="pointer-events-none fill-none stroke-foreground/10" />
          </>
        )}
        <g transform={`translate(${panX} ${panY}) scale(${zoom})`} className="pointer-events-none">
          {doc.print && printGuides && (
            <>
              <rect x={-bleed} y={-bleed} width={doc.width + bleed * 2} height={doc.height + bleed * 2} className="fill-none stroke-red-500/70" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
              <rect x={safe} y={safe} width={doc.width - safe * 2} height={doc.height - safe * 2} className="fill-none stroke-sky-500/70" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            </>
          )}
          {crop && <CropGhost el={crop} />}
        </g>

        {/* Survol, sélection, repères */}
        <g>
          {hover && <polygon points={polygon(hover)} className="pointer-events-none fill-none stroke-primary/70" strokeWidth={1.5} />}
          {dropFrame && (() => {
            const el = page.elements.find((e) => e.id === dropFrame);
            return el ? <polygon points={polygon(el)} className="pointer-events-none fill-primary/15 stroke-primary" strokeWidth={2} strokeDasharray="6 4" /> : null;
          })()}
          {selectedEls.map((el) => (
            <polygon key={el.id} points={polygon(el)} className={cn("pointer-events-none fill-none", el.locked ? "stroke-amber-500" : "stroke-primary")} strokeWidth={selectionBox ? 1 : 1.5} />
          ))}
          {selectionBox && <rect {...{ x: toScreen(selectionBox).x, y: toScreen(selectionBox).y, width: selectionBox.width * zoom, height: selectionBox.height * zoom }} className="pointer-events-none fill-none stroke-primary" strokeDasharray="4 3" />}
          {showHandles && !allLocked && !editing && !crop && single && renderHandles(single, single.rotation, handlesFor(single, single.width * zoom, single.height * zoom))}
          {showHandles && !allLocked && !editing && selectionBox && renderHandles(selectionBox, 0, CORNERS)}
          {guides.map((g, i) =>
            g.axis === "x" ? (
              <line key={i} x1={panX + g.position * zoom} x2={panX + g.position * zoom} y1={panY + g.from * zoom} y2={panY + g.to * zoom} className="pointer-events-none stroke-fuchsia-500" strokeWidth={1} />
            ) : (
              <line key={i} y1={panY + g.position * zoom} y2={panY + g.position * zoom} x1={panX + g.from * zoom} x2={panX + g.to * zoom} className="pointer-events-none stroke-fuchsia-500" strokeWidth={1} />
            ),
          )}
          {marquee && <rect x={toScreen(marquee).x} y={toScreen(marquee).y} width={marquee.width * zoom} height={marquee.height * zoom} className="pointer-events-none fill-primary/10 stroke-primary" strokeWidth={1} />}
        </g>
      </svg>

      {info && selectedEls.length > 0 && (() => {
        const box = union(selectedEls.map(aabb))!;
        const at = toScreen({ x: box.x + box.width / 2, y: box.y + box.height });
        return (
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-[11px] font-medium text-background tabular-nums shadow" style={{ left: at.x, top: at.y + 40 }}>
            {info}
          </div>
        );
      })()}

      {toolbarAnchor && (
        <div className="absolute z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border bg-popover p-1 shadow-lg" style={{ left: toolbarAnchor.x, top: toolbarAnchor.y }}>
          <Button variant="ghost" size="icon-sm" onClick={() => state.duplicateSelected()} aria-label={t("duplicate")} title={`${t("duplicate")} (Ctrl+D)`}>
            <Copy />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => state.updateElements(selection, (el) => ({ ...el, locked: !allLocked }))}
            aria-label={allLocked ? t("unlock") : t("lock")}
            title={allLocked ? t("unlock") : t("lock")}
          >
            {allLocked ? <LockOpen /> : <Lock />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => state.removeSelected()} disabled={allLocked} aria-label={t("delete")} title={`${t("delete")} (⌫)`}>
            <Trash2 />
          </Button>
        </div>
      )}

      {editing && <TextEditor el={editing} zoom={zoom} panX={panX} panY={panY} />}

      <CommentLayer />

      {crop && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-foreground px-3 py-1.5 text-xs text-background shadow">
          {t("cropHint")}
        </div>
      )}
    </div>
  );
}

/** Photo entière en transparence pendant le recadrage. */
function CropGhost({ el }: { el: ImageElement }) {
  const { image, region, transform } = photoPlacement(el);
  return (
    <g transform={elementTransform(el)} opacity={0.4}>
      <g transform={transform ?? undefined}>
        <image href={el.src} x={image.x} y={image.y} width={image.width} height={image.height} preserveAspectRatio="none" />
        <rect x={region.x} y={region.y} width={region.width} height={region.height} className="fill-none stroke-primary" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
      </g>
    </g>
  );
}

/**
 * Un texte court, dont la boîte épouse le contenu, s'élargit (ou se resserre) pendant la saisie,
 * autour de son point d'alignement ; au-delà de la largeur de la page, il passe à la ligne.
 */
function autoWidth(el: TextElement, text: string, pageWidth: number): TextElement {
  if (el.curve) return { ...el, text };
  const before = naturalWidth(el);
  const hugging = el.width >= before - 2 && el.width <= before * 1.15 + el.fontSize;
  if (!hugging) return { ...el, text };
  const width = Math.min(naturalWidth({ ...el, text }), pageWidth * 0.9);
  const x = el.align === "center" ? el.x + (el.width - width) / 2 : el.align === "right" ? el.x + el.width - width : el.x;
  return { ...el, text, x, width };
}

/** Édition du texte en place : zone de saisie aux mêmes police, corps et interlignage. */
function TextEditor({ el, zoom, panX, panY }: { el: TextElement; zoom: number; panX: number; panY: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = el.id;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    node.select();
  }, [id]);

  const finish = () => {
    const state = useStudio.getState();
    if (state.editingId === id) state.setEditing(null);
  };

  const color = el.fill.type === "solid" ? el.fill.color : el.fill.type === "none" ? "#111827" : (el.fill.stops[0]?.color ?? "#111827");
  return (
    <textarea
      ref={ref}
      value={el.text}
      spellCheck
      onChange={(event) => {
        const text = event.target.value;
        const doc = useStudio.getState().doc!;
        useStudio.getState().updateElements([id], (e) => (e.type === "text" ? relayout(autoWidth(e, text, doc.width)) : e), { merge: `text-${id}` });
      }}
      onBlur={finish}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          finish();
        }
      }}
      className="absolute z-10 resize-none overflow-hidden border-0 bg-transparent p-0 outline-2 outline-offset-2 outline-primary/60 outline-dashed"
      style={{
        left: panX + el.x * zoom,
        top: panY + el.y * zoom,
        width: el.width * zoom,
        height: el.height * zoom,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        fontFamily: cssFontFamily(el.fontId),
        fontWeight: el.fontWeight,
        fontSize: el.fontSize * zoom,
        lineHeight: el.lineHeight,
        letterSpacing: `${el.letterSpacing}em`,
        textAlign: el.align,
        textTransform: el.uppercase ? "uppercase" : "none",
        color,
        caretColor: color,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      }}
    />
  );
}

