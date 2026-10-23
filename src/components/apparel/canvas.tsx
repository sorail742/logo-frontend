"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { REFERENCE_SIZE } from "@/lib/apparel/defaults";
import { isTextKind, textChecks } from "@/lib/apparel/elements";
import { zoneRect } from "@/lib/apparel/garments";
import { renderGarmentLayers, sizedZone, type EditorElement, type SizeView } from "@/lib/apparel/render";
import type { ApparelTemplate, PrintZone } from "@/lib/apparel/types";
import { useApparel } from "@/stores/apparel";
import { useSvgPrefix } from "./garment-view";

// Canevas de l'éditeur textile : vêtement en couches (fond, impressions, éclairage fusionné) et
// calque d'édition en millimètres par-dessus — zones d'impression, sélection, déplacement avec
// magnétisme sur l'axe et les bords de la zone, mise à l'échelle et rotation autour du centre.

const PADDING = 24;
const SNAP_PX = 6;
const MIN_SIZE_MM = 5;

type Point = { x: number; y: number };
type Gesture =
  | { mode: "move"; id: string; start: Point; el: EditorElement; zone: PrintZone; moved: boolean }
  | {
      mode: "scale";
      id: string;
      start: Point;
      el: EditorElement;
      zone: PrintZone;
      center: Point;
      moved: boolean;
    }
  | { mode: "rotate"; id: string; el: EditorElement; center: Point; moved: boolean };

const round = (value: number) => Math.round(value * 10) / 10;

/** Taille de référence et taille affichée (aperçu des tailles). */
export function useSizing(template: ApparelTemplate | undefined): SizeView | undefined {
  const previewSize = useApparel((s) => s.previewSize);
  return useMemo(() => {
    if (!template || !previewSize) return undefined;
    const ref =
      template.sizes.find((s) => s.label === REFERENCE_SIZE) ??
      template.sizes[Math.floor(template.sizes.length / 2)];
    const size = template.sizes.find((s) => s.label === previewSize);
    return ref && size ? { ref, size } : undefined;
  }, [template, previewSize]);
}

/** Boîte d'un élément dans la vue (mm) : coin, dimensions, centre. */
function elementBox(el: EditorElement, zone: PrintZone) {
  const rect = zoneRect(zone);
  const x = rect.x + el.offsetXMm;
  const y = rect.y + el.offsetYMm;
  return { x, y, width: el.widthMm, height: el.heightMm, cx: x + el.widthMm / 2, cy: y + el.heightMm / 2 };
}

const zoneTitle = (zone: PrintZone) => `${zone.label} · ${zone.maxWidthMm} × ${zone.maxHeightMm} mm`;
/** Largeur estimée de l'étiquette (px écran, corps 10). */
const labelWidth = (zone: PrintZone) => zoneTitle(zone).length * 5.6 + 10;

const contains = (zone: PrintZone, p: Point) => {
  const r = zoneRect(zone);
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
};

/** Une coordonnée attirée par le centre, puis par les bords de la zone (longueur `size`). */
function snapAxis(
  value: number,
  size: number,
  extent: number,
  snap: number,
): { value: number; centered: boolean } {
  if (Math.abs(value + size / 2 - extent / 2) < snap) return { value: extent / 2 - size / 2, centered: true };
  if (Math.abs(value) < snap) return { value: 0, centered: false };
  if (Math.abs(value + size - extent) < snap) return { value: extent - size, centered: false };
  return { value, centered: false };
}

/** Déplacement dans la zone, avec magnétisme sur son axe et ses bords (`snap` = 0 : libre). */
function movePatch(g: Extract<Gesture, { mode: "move" }>, p: Point, snap: number) {
  const { el, zone } = g;
  const rect = zoneRect(zone);
  const x = snapAxis(el.offsetXMm + p.x - g.start.x, el.widthMm, zone.maxWidthMm, snap);
  const y = snapAxis(el.offsetYMm + p.y - g.start.y, el.heightMm, zone.maxHeightMm, snap);
  return {
    patch: { offsetXMm: round(x.value), offsetYMm: round(y.value) },
    guides: {
      x: x.centered ? rect.x + zone.maxWidthMm / 2 : undefined,
      y: y.centered ? rect.y + zone.maxHeightMm / 2 : undefined,
    },
  };
}

/** Mise à l'échelle autour du centre, proportions conservées ; le texte suit sa hauteur. */
function scalePatch(g: Extract<Gesture, { mode: "scale" }>, p: Point): Partial<EditorElement> {
  const { el, zone, center } = g;
  const k =
    Math.hypot(p.x - center.x, p.y - center.y) /
    Math.max(0.1, Math.hypot(g.start.x - center.x, g.start.y - center.y));
  const factor = Math.max(MIN_SIZE_MM / Math.min(el.widthMm, el.heightMm), k);
  const width = el.widthMm * factor;
  const height = el.heightMm * factor;
  const rect = zoneRect(zone);
  const content = isTextKind(el.kind)
    ? { ...el.content, ...textChecks(el.content, height, width) }
    : el.content;
  return {
    widthMm: round(width),
    heightMm: round(height),
    offsetXMm: round(center.x - width / 2 - rect.x),
    offsetYMm: round(center.y - height / 2 - rect.y),
    content,
  };
}

/** Angle de la poignée de rotation : par 15° avec Maj, aimanté à 45° près sinon. */
function rotation(center: Point, p: Point, stepped: boolean) {
  let angle = (Math.atan2(p.y - center.y, p.x - center.x) * 180) / Math.PI + 90;
  if (angle > 180) angle -= 360;
  const step = stepped ? 15 : 45;
  const nearest = Math.round(angle / step) * step;
  return Math.round(stepped || Math.abs(angle - nearest) < 3 ? nearest : angle);
}

export function ApparelCanvas({ template, canEdit }: Readonly<{ template: ApparelTemplate; canEdit: boolean }>) {
  const t = useTranslations("apparel.editor");
  const design = useApparel((s) => s.design)!;
  const elements = useApparel((s) => s.elements);
  const view = useApparel((s) => s.view);
  const selection = useApparel((s) => s.selection);
  const targetZone = useApparel((s) => s.targetZone);
  const showZones = useApparel((s) => s.showZones);
  const sizing = useSizing(template);
  const editable = canEdit && !sizing;
  const prefix = useSvgPrefix("ed");
  const wrap = useRef<HTMLDivElement>(null);
  const overlay = useRef<SVGSVGElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [space, setSpace] = useState({ width: 800, height: 600 });
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});

  useEffect(() => {
    const node = wrap.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(
      ([entry]) => entry && setSpace({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const category = design.template.category;
  const color = design.garmentColor;
  const zones = useMemo(
    () => template.zones.filter((z) => z.view === view).map((z) => sizedZone(z, sizing).zone),
    [template.zones, view, sizing],
  );
  const garment = useMemo(
    () =>
      renderGarmentLayers({
        category,
        view,
        color,
        zones: template.zones,
        elements: [],
        sizing,
        idPrefix: `${prefix}g`,
      }),
    [category, view, color, template.zones, sizing, prefix],
  );
  const prints = useMemo(
    () =>
      renderGarmentLayers({
        category,
        view,
        color,
        zones: template.zones,
        elements,
        sizing,
        idPrefix: `${prefix}p`,
      }).prints,
    [category, view, color, template.zones, elements, sizing, prefix],
  );

  const { box } = garment;
  const scale = Math.max(
    0.05,
    Math.min((space.width - PADDING * 2) / box.width, (space.height - PADDING * 2) / box.height),
  );
  const px = (screen: number) => screen / scale;
  const zoneByKey = new Map(zones.map((z) => [z.key, z]));
  const visible = elements.filter((el) => zoneByKey.has(el.zoneKey));
  const selected = visible.find((el) => el.id === selection);

  const toMm = (event: { clientX: number; clientY: number }): Point => {
    const r = overlay.current!.getBoundingClientRect();
    return {
      x: box.x + ((event.clientX - r.left) / r.width) * box.width,
      y: box.y + ((event.clientY - r.top) / r.height) * box.height,
    };
  };

  const startMove = (event: ReactPointerEvent, el: EditorElement) => {
    event.stopPropagation();
    useApparel.getState().select(el.id);
    if (!editable) return;
    const zone = zoneByKey.get(el.zoneKey)!;
    gesture.current = { mode: "move", id: el.id, start: toMm(event), el, zone, moved: false };
    overlay.current!.setPointerCapture(event.pointerId);
  };

  const startHandle = (event: ReactPointerEvent, mode: "scale" | "rotate") => {
    event.stopPropagation();
    if (!selected || !editable) return;
    const zone = zoneByKey.get(selected.zoneKey)!;
    const b = elementBox(selected, zone);
    const center = { x: b.cx, y: b.cy };
    gesture.current =
      mode === "scale"
        ? { mode, id: selected.id, start: toMm(event), el: selected, zone, center, moved: false }
        : { mode, id: selected.id, el: selected, center, moved: false };
    overlay.current!.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const store = useApparel.getState();
    if (!g.moved) {
      store.begin();
      g.moved = true;
    }
    const p = toMm(event);
    if (g.mode === "move") {
      const result = movePatch(g, p, event.altKey ? 0 : px(SNAP_PX));
      setGuides(result.guides);
      store.update(g.id, result.patch, "none");
    } else if (g.mode === "scale") {
      store.update(g.id, scalePatch(g, p), "none");
    } else {
      store.update(g.id, { rotationDeg: rotation(g.center, p, event.shiftKey) }, "none");
    }
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    setGuides({});
    if (!g?.moved) return;
    const store = useApparel.getState();
    const el = store.elements.find((e) => e.id === g.id);
    if (g.mode === "move" && el) {
      // Déposé sur une autre zone de la vue : l'élément en change, à la même position.
      const b = elementBox(el, g.zone);
      const center = { x: b.cx, y: b.cy };
      const other =
        !contains(g.zone, center) && zones.find((z) => z.key !== g.zone.key && contains(z, center));
      if (other) {
        const r = zoneRect(other);
        store.update(
          el.id,
          { zoneKey: other.key, offsetXMm: round(b.x - r.x), offsetYMm: round(b.y - r.y) },
          "none",
        );
        store.setTargetZone(other.key);
      }
    }
    store.change((els) => els, "push");
  };

  const width = box.width * scale;
  const height = box.height * scale;
  const layer = "pointer-events-none absolute inset-0 size-full";
  const origin = `translate(${-box.x} ${-box.y})`;
  const selBox = selected ? elementBox(selected, zoneByKey.get(selected.zoneKey)!) : null;
  const handle = px(5);

  return (
    <div ref={wrap} className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="absolute"
        style={{
          left: (space.width - width) / 2,
          top: (space.height - height) / 2,
          width,
          height,
          isolation: "isolate",
        }}
      >
        <svg
          viewBox={garment.viewBox}
          className={layer}
          dangerouslySetInnerHTML={{ __html: garment.base }}
          aria-hidden="true"
        />
        <svg
          viewBox={garment.viewBox}
          className={layer}
          dangerouslySetInnerHTML={{ __html: prints }}
          aria-hidden="true"
        />
        {garment.light.map((pass) => (
          <svg
            key={pass.blend + pass.opacity}
            viewBox={garment.viewBox}
            className={layer}
            style={{ mixBlendMode: pass.blend, opacity: pass.opacity }}
            dangerouslySetInnerHTML={{ __html: pass.markup }}
            aria-hidden="true"
          />
        ))}
        <svg
          ref={overlay}
          viewBox={garment.viewBox}
          className="absolute inset-0 size-full touch-none select-none"
          onPointerDown={() => useApparel.getState().select(null)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="application"
          aria-label={t("canvas")}
        >
          <g transform={origin}>
            {showZones &&
              zones.map((zone) => {
                const r = zoneRect(zone);
                const active = zone.key === targetZone || zone.key === selected?.zoneKey;
                // Libellé des petites zones seulement quand elles sont visées (sinon en infobulle).
                const labelled = active || r.width * scale > labelWidth(zone);
                return (
                  <g
                    key={zone.key}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      useApparel.getState().select(null);
                      useApparel.getState().setTargetZone(zone.key);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.height}
                      fill={active ? "rgba(37,99,235,0.07)" : "transparent"}
                      stroke={active ? "#2563eb" : "#64748b"}
                      strokeOpacity={active ? 0.9 : 0.55}
                      strokeWidth={px(1)}
                      strokeDasharray={`${px(5)} ${px(4)}`}
                    />
                    <title>{zoneTitle(zone)}</title>
                    {labelled && (
                      // Étiquette sur fond clair : lisible sur tous les tissus.
                      <g pointerEvents="none">
                        <rect
                          x={r.x}
                          y={r.y - px(17)}
                          width={px(labelWidth(zone))}
                          height={px(15)}
                          rx={px(4)}
                          fill={active ? "#2563eb" : "rgba(255,255,255,0.9)"}
                        />
                        <text
                          x={r.x + px(5)}
                          y={r.y - px(6)}
                          fontSize={px(10)}
                          fontWeight={500}
                          fill={active ? "#ffffff" : "#334155"}
                        >
                          {zoneTitle(zone)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            {visible.map((el) => {
              const b = elementBox(el, zoneByKey.get(el.zoneKey)!);
              return (
                <rect
                  key={el.id}
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  transform={el.rotationDeg ? `rotate(${el.rotationDeg} ${b.cx} ${b.cy})` : undefined}
                  fill="transparent"
                  className={editable ? "cursor-move" : "cursor-pointer"}
                  onPointerDown={(event) => startMove(event, el)}
                  onDoubleClick={() =>
                    el.content.photo &&
                    editable &&
                    useApparel.getState().editPhoto({ id: el.id, tab: "adjust" })
                  }
                />
              );
            })}
            {guides.x !== undefined && (
              <line
                x1={guides.x}
                x2={guides.x}
                y1={box.y}
                y2={box.y + box.height}
                stroke="#db2777"
                strokeWidth={px(1)}
              />
            )}
            {guides.y !== undefined && (
              <line
                y1={guides.y}
                y2={guides.y}
                x1={box.x}
                x2={box.x + box.width}
                stroke="#db2777"
                strokeWidth={px(1)}
              />
            )}
            {selected && selBox && (
              <g
                transform={
                  selected.rotationDeg
                    ? `rotate(${selected.rotationDeg} ${selBox.cx} ${selBox.cy})`
                    : undefined
                }
              >
                <rect
                  x={selBox.x}
                  y={selBox.y}
                  width={selBox.width}
                  height={selBox.height}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={px(1.5)}
                  pointerEvents="none"
                />
                {editable && (
                  <>
                    <line
                      x1={selBox.cx}
                      x2={selBox.cx}
                      y1={selBox.y}
                      y2={selBox.y - px(22)}
                      stroke="#2563eb"
                      strokeWidth={px(1.5)}
                    />
                    <circle
                      cx={selBox.cx}
                      cy={selBox.y - px(22)}
                      r={handle}
                      fill="#fff"
                      stroke="#2563eb"
                      strokeWidth={px(1.5)}
                      className="cursor-grab"
                      onPointerDown={(e) => startHandle(e, "rotate")}
                    >
                      <title>{t("rotate")}</title>
                    </circle>
                    {[
                      [selBox.x, selBox.y, "nwse"],
                      [selBox.x + selBox.width, selBox.y, "nesw"],
                      [selBox.x, selBox.y + selBox.height, "nesw"],
                      [selBox.x + selBox.width, selBox.y + selBox.height, "nwse"],
                    ].map(([x, y, cursor]) => (
                      <rect
                        key={`${x}-${y}`}
                        x={(x as number) - handle}
                        y={(y as number) - handle}
                        width={handle * 2}
                        height={handle * 2}
                        rx={px(1.5)}
                        fill="#fff"
                        stroke="#2563eb"
                        strokeWidth={px(1.5)}
                        style={{ cursor: `${cursor as string}-resize` }}
                        onPointerDown={(e) => startHandle(e, "scale")}
                      />
                    ))}
                  </>
                )}
              </g>
            )}
          </g>
        </svg>
      </div>
      {sizing && (
        <p className="bg-foreground/85 text-background absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs shadow">
          {t("previewSize", { size: sizing.size.label, ref: sizing.ref.label })}
        </p>
      )}
    </div>
  );
}
