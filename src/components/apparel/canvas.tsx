"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { FlipHorizontal2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { REFERENCE_SIZE } from "@/lib/apparel/defaults";
import { isTextKind, textChecks } from "@/lib/apparel/elements";
import { zoneRect } from "@/lib/apparel/garments";
import { renderGarmentLayers, sizedZone, type EditorElement, type SizeView } from "@/lib/apparel/render";
import type { ApparelTemplate, PrintZone } from "@/lib/apparel/types";
import { useApparel } from "@/stores/apparel";
import { useSvgPrefix } from "./garment-view";
import { FloatingToolbar } from "./floating-toolbar";

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

function elementBox(el: EditorElement, zone: PrintZone) {
  const rect = zoneRect(zone);
  const x = rect.x + el.offsetXMm;
  const y = rect.y + el.offsetYMm;
  return { x, y, width: el.widthMm, height: el.heightMm, cx: x + el.widthMm / 2, cy: y + el.heightMm / 2 };
}

const zoneTitle = (zone: PrintZone) => `${zone.label} · ${zone.maxWidthMm} × ${zone.maxHeightMm} mm`;
const labelWidth = (zone: PrintZone) => zoneTitle(zone).length * 5.8 + 12;
const contains = (zone: PrintZone, p: Point) => {
  const r = zoneRect(zone);
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
};

function snapAxis(offset: number, size: number, max: number, snap: number) {
  if (snap <= 0) return { offset, centered: false };
  const center = (max - size) / 2;
  if (Math.abs(offset - center) < snap) return { offset: center, centered: true };
  if (Math.abs(offset) < snap) return { offset: 0, centered: false };
  if (Math.abs(offset - (max - size)) < snap) return { offset: max - size, centered: false };
  return { offset, centered: false };
}

function movePatch(g: { el: EditorElement; zone: PrintZone; start: Point }, p: Point, snap: number) {
  const { el, zone } = g;
  const rect = zoneRect(zone);
  const x = snapAxis(el.offsetXMm + p.x - g.start.x, el.widthMm, zone.maxWidthMm, snap);
  const y = snapAxis(el.offsetYMm + p.y - g.start.y, el.heightMm, zone.maxHeightMm, snap);
  return {
    patch: { offsetXMm: round(x.offset), offsetYMm: round(y.offset) },
    guides: {
      x: x.centered ? rect.x + zone.maxWidthMm / 2 : undefined,
      y: y.centered ? rect.y + zone.maxHeightMm / 2 : undefined,
    },
  };
}

function scalePatch(g: { el: EditorElement; zone: PrintZone; center: Point }, p: Point) {
  const { el, zone, center } = g;
  const halfW = Math.max(MIN_SIZE_MM / 2, Math.abs(p.x - center.x));
  const halfH = Math.max(MIN_SIZE_MM / 2, Math.abs(p.y - center.y));
  const ratio = el.widthMm / el.heightMm;
  const [w, h] = halfW / halfH > ratio ? [halfW * 2, (halfW * 2) / ratio] : [(halfH * 2) / ratio, halfH * 2];
  const maxW = Math.min(w, zone.maxWidthMm);
  const maxH = Math.min(h, zone.maxHeightMm);
  const rect = zoneRect(zone);
  return {
    widthMm: round(maxW),
    heightMm: round(maxH),
    offsetXMm: round(Math.max(0, Math.min(zone.maxWidthMm - maxW, center.x - rect.x - maxW / 2))),
    offsetYMm: round(Math.max(0, Math.min(zone.maxHeightMm - maxH, center.y - rect.y - maxH / 2))),
  };
}

function rotation(center: Point, p: Point, stepped: boolean) {
  let angle = (Math.atan2(p.y - center.y, p.x - center.x) * 180) / Math.PI + 90;
  if (angle > 180) angle -= 360;
  const step = stepped ? 15 : 45;
  const nearest = Math.round(angle / step) * step;
  return Math.round(stepped || Math.abs(angle - nearest) < 3 ? nearest : angle);
}

export interface ApparelCanvasProps {
  template: ApparelTemplate;
  canEdit: boolean;
  zoom?: number;
  showGrid?: boolean;
}

export function ApparelCanvas({
  template,
  canEdit,
  zoom = 1,
  showGrid = false,
}: Readonly<ApparelCanvasProps>) {
  const t = useTranslations("apparel.editor");
  const design = useApparel((s) => s.design)!;
  const elements = useApparel((s) => s.elements);
  const view = useApparel((s) => s.view);
  const selection = useApparel((s) => s.selection);
  const targetZone = useApparel((s) => s.targetZone);
  const showZones = useApparel((s) => s.showZones);
  const isMirrored = useApparel((s) => s.isMirrored);
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
  const baseScale = Math.max(
    0.05,
    Math.min((space.width - PADDING * 2) / box.width, (space.height - PADDING * 2) / box.height),
  );
  const scale = baseScale * zoom;
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

  const containerLeft = (space.width - width) / 2;
  const containerTop = (space.height - height) / 2;

  return (
    <div
      ref={wrap}
      className={cn(
        "textile-spotlight relative min-h-0 flex-1 overflow-hidden transition-all duration-300",
        showGrid &&
          "bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:24px_24px] dark:bg-[radial-gradient(#334155_1.2px,transparent_1.2px)]",
      )}
    >
      {/* Floating Action Toolbar on top of selected element */}
      {selected && selBox && zoneByKey.get(selected.zoneKey) && (
        <FloatingToolbar
          element={selected}
          zone={zoneByKey.get(selected.zoneKey)!}
          x={containerLeft + (selBox.cx - box.x) * scale}
          y={containerTop + (selBox.y - box.y) * scale}
        />
      )}

      {/* Mirror Mode Indicator */}
      {isMirrored && (
        <div className="glow-card border-primary/40 bg-card/95 text-primary absolute top-3 left-4 z-20 flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-bold shadow-md backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <FlipHorizontal2 className="size-4" />
          <span>Mode Miroir Transfert Actif (DTF / Flex)</span>
        </div>
      )}

      {/* 3D Floor Shadow under garment */}
      <div
        className="stage-floor-shadow"
        style={{
          left: containerLeft + width * 0.15,
          top: containerTop + height * 0.88,
          width: width * 0.7,
        }}
        aria-hidden="true"
      />

      {/* Garment SVG container */}
      <div
        className={cn("absolute transition-transform duration-300", isMirrored && "scale-x-[-1]")}
        style={{
          left: containerLeft,
          top: containerTop,
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
            {/* Zones Overlays */}
            {showZones &&
              zones.map((zone) => {
                const r = zoneRect(zone);
                const active = zone.key === targetZone || zone.key === selected?.zoneKey;
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
                      rx={px(4)}
                      fill={active ? "rgba(11, 107, 79, 0.08)" : "transparent"}
                      stroke={active ? "#0B6B4F" : "#10b981"}
                      strokeOpacity={active ? 0.95 : 0.6}
                      strokeWidth={px(active ? 1.75 : 1.2)}
                      strokeDasharray={`${px(6)} ${px(4)}`}
                    />
                    <title>{zoneTitle(zone)}</title>
                    {labelled && (
                      <g pointerEvents="none">
                        <rect
                          x={r.x}
                          y={r.y - px(18)}
                          width={px(labelWidth(zone))}
                          height={px(16)}
                          rx={px(4)}
                          fill={active ? "#0B6B4F" : "rgba(15, 23, 42, 0.85)"}
                        />
                        <text
                          x={r.x + px(6)}
                          y={r.y - px(6)}
                          fontSize={px(10)}
                          fontWeight={600}
                          fill="#ffffff"
                        >
                          {zoneTitle(zone)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

            {/* Elements Interactive Hitboxes */}
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

            {/* Magnetic Snap Guides */}
            {guides.x !== undefined && (
              <line
                x1={guides.x}
                x2={guides.x}
                y1={box.y}
                y2={box.y + box.height}
                stroke="#10b981"
                strokeWidth={px(1.5)}
                strokeDasharray={`${px(4)} ${px(3)}`}
              />
            )}
            {guides.y !== undefined && (
              <line
                y1={guides.y}
                y2={guides.y}
                x1={box.x}
                x2={box.x + box.width}
                stroke="#10b981"
                strokeWidth={px(1.5)}
                strokeDasharray={`${px(4)} ${px(3)}`}
              />
            )}

            {/* Selection Bounding Box & Handles */}
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
                  stroke="#0B6B4F"
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
                      stroke="#0B6B4F"
                      strokeWidth={px(1.5)}
                    />
                    <circle
                      cx={selBox.cx}
                      cy={selBox.y - px(22)}
                      r={handle}
                      fill="#fff"
                      stroke="#0B6B4F"
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
                        stroke="#0B6B4F"
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
