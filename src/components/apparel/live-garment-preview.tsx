"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { renderGarment } from "@/lib/apparel/render";
import { zoneRect } from "@/lib/apparel/garments";
import type { ApparelElement, GarmentView, PrintZone, ProductCategory } from "@/lib/apparel/types";
import { isDarkGarment } from "@/lib/apparel/colors-data";
import { cn } from "@/lib/utils";

export type StudioStageBackground = "studio" | "mannequin" | "hanger";

export interface LiveGarmentPreviewProps {
  category: ProductCategory;
  color: string;
  zones: PrintZone[];
  garmentName: string;
  brandLogoSvg?: string | null;
  contrastWarning?: {
    ratio: number;
    message: string;
    suggestion: string;
    onApplySuggestion?: () => void;
  } | null;
  className?: string;
}

export function LiveGarmentPreview({
  category,
  color,
  zones,
  garmentName,
  brandLogoSvg,
  contrastWarning,
  className,
}: Readonly<LiveGarmentPreviewProps>) {
  const instanceId = useId().replaceAll(/[^\w-]/g, "");

  // Available views for this garment
  const availableViews: GarmentView[] = useMemo(() => {
    const set = new Set<GarmentView>();
    zones.forEach((z) => set.add(z.view));
    if (set.size === 0) set.add("FRONT");
    return Array.from(set);
  }, [zones]);

  const [activeView, setActiveView] = useState<GarmentView>("FRONT");
  const [stage, setStage] = useState<StudioStageBackground>("studio");
  const [showZones, setShowZones] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.25 | 1.5>(1);

  // Auto-switch view if active view is not available for this category
  const view = availableViews.includes(activeView) ? activeView : (availableViews[0] ?? "FRONT");

  const isDark = isDarkGarment(color);

  // Prepare brand logo element for the chest zone if available
  const elements = useMemo<ApparelElement[]>(() => {
    if (!brandLogoSvg || view !== "FRONT") return [];

    // Find chest or front sponsor zone
    const targetZone =
      zones.find((z) => z.key === "left_chest" && z.view === "FRONT") ||
      zones.find((z) => z.key === "front_sponsor" && z.view === "FRONT") ||
      zones.find((z) => z.view === "FRONT");

    if (!targetZone) return [];

    const isChest = targetZone.key.includes("chest");
    const widthMm = isChest ? 75 : 180;
    const heightMm = isChest ? 75 : 90;

    // Adapt SVG color if monochromatic/contrast is needed
    let adaptedSvg = brandLogoSvg;
    if (isDark && brandLogoSvg.includes('fill="#000000"')) {
      adaptedSvg = brandLogoSvg.replaceAll('fill="#000000"', 'fill="#FFFFFF"');
    }

    return [
      {
        id: "preview-brand-logo",
        zoneKey: targetZone.key,
        kind: "LOGO",
        widthMm,
        heightMm,
        offsetXMm: isChest ? (targetZone.maxWidthMm - widthMm) / 2 : (targetZone.maxWidthMm - widthMm) / 2,
        offsetYMm: (targetZone.maxHeightMm - heightMm) / 2,
        content: {
          svg: adaptedSvg,
        },
      },
    ];
  }, [brandLogoSvg, view, zones, isDark]);

  // Render SVG string
  const garmentSvg = useMemo(() => {
    try {
      const raw = renderGarment({
        category,
        view,
        color,
        zones,
        elements,
        idPrefix: `live-${instanceId}-${view.toLowerCase()}`,
      });

      // If showZones is true, inject zone overlays into the SVG
      if (showZones) {
        const activeZones = zones.filter((z) => z.view === view);
        const overlays = activeZones
          .map((z) => {
            const r = zoneRect(z);
            return `
              <g class="zone-guide">
                <rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" 
                      fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" stroke-width="1.8" 
                      stroke-dasharray="6 4" rx="6" />
                <rect x="${r.x}" y="${r.y}" width="${Math.min(r.width, z.label.length * 6.5 + 16)}" height="20" 
                      fill="#0b6b4f" rx="4" />
                <text x="${r.x + 8}" y="${r.y + 14}" fill="#ffffff" font-size="10" font-weight="600" 
                      font-family="sans-serif">${z.label}</text>
              </g>
            `;
          })
          .join("");

        // Insert overlays right before </svg>
        return raw.replace("</svg>", `<g id="zones-overlay">${overlays}</g></svg>`);
      }

      return raw;
    } catch {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><text x="50%" y="50%" text-anchor="middle" fill="#666">Aperçu en cours...</text></svg>`;
    }
  }, [category, view, color, zones, elements, instanceId, showZones]);

  const viewLabels: Record<GarmentView, string> = {
    FRONT: "Face",
    BACK: "Dos",
    LEFT_SLEEVE: "Manche G",
    RIGHT_SLEEVE: "Manche D",
    SHORTS_FRONT: "Face Short",
    OTHER: "Vue",
  };

  return (
    <div
      className={cn(
        "border-border/70 from-muted/30 via-card to-muted/20 relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-b shadow-inner",
        className,
      )}
    >
      {/* Top bar: View pills + controls */}
      <div className="border-border/50 bg-background/80 z-10 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 backdrop-blur-md">
        {/* View Switchers */}
        <div className="bg-muted/60 flex items-center gap-1 rounded-xl p-1" role="tablist">
          {availableViews.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setActiveView(v)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 select-none",
                view === v
                  ? "bg-[#0B6B4F] text-white shadow-xs"
                  : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
              )}
            >
              {viewLabels[v] || v}
            </button>
          ))}
        </div>

        {/* Right Tools: Show zones, Background, Zoom */}
        <div className="flex items-center gap-1.5">
          {/* Toggle zones */}
          <button
            type="button"
            onClick={() => setShowZones((prev) => !prev)}
            title={showZones ? "Masquer les zones d'impression" : "Afficher les zones d'impression"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors select-none",
              showZones
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Layers className="size-3.5" />
            <span className="hidden sm:inline">Zones</span>
            <span className="text-[10px] font-bold opacity-80">
              ({zones.filter((z) => z.view === view).length})
            </span>
          </button>

          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1))}
            title="Agrandir / Réduire l'aperçu"
            className="border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center rounded-lg border transition"
          >
            {zoomLevel > 1 ? <ZoomOut className="size-3.5" /> : <ZoomIn className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className={cn(
          "relative flex flex-1 items-center justify-center p-6 transition-all duration-500",
          stage === "studio" &&
            "bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.9)_0%,rgba(241,245,249,0.7)_60%,rgba(226,232,240,0.5)_100%)] dark:bg-[radial-gradient(circle_at_50%_35%,rgba(30,41,59,0.9)_0%,rgba(15,23,42,0.8)_60%,rgba(2,6,23,0.95)_100%)]",
          stage === "mannequin" && "bg-slate-100/90 dark:bg-slate-900/90",
        )}
      >
        {/* Soft 3D Floor Shadow */}
        <div
          className="pointer-events-none absolute bottom-8 h-10 w-[60%] max-w-[340px] rounded-[100%] bg-black/15 blur-xl transition-all duration-300 dark:bg-black/40"
          aria-hidden="true"
        />

        {/* Garment SVG container with smooth transitions */}
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="relative flex max-h-[580px] w-full max-w-[460px] items-center justify-center drop-shadow-2xl [&>svg]:h-auto [&>svg]:max-h-[520px] [&>svg]:w-full [&>svg]:object-contain"
          dangerouslySetInnerHTML={{ __html: garmentSvg }}
        />

        {/* Live Logo Badge if pre-displayed */}
        {brandLogoSvg && (
          <div className="bg-background/90 absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm backdrop-blur dark:text-emerald-400">
            <Sparkles className="size-3 text-emerald-500" />
            <span>Logo du projet intégré</span>
          </div>
        )}

        {/* Contrast Warning Toast Overlay if poor visibility */}
        {contrastWarning && (
          <div className="absolute right-4 bottom-4 left-4 z-20 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 shadow-lg backdrop-blur-md dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">{contrastWarning.message}</p>
              <p className="text-[11px] opacity-90">{contrastWarning.suggestion}</p>
              {contrastWarning.onApplySuggestion && (
                <button
                  type="button"
                  onClick={contrastWarning.onApplySuggestion}
                  className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-amber-700"
                >
                  <Check className="size-3" />
                  Appliquer la suggestion
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom info pill */}
      <div className="border-border/50 bg-background/70 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span
            className="size-3.5 rounded-full border shadow-2xs"
            style={{ backgroundColor: color }}
            title={color}
          />
          <span className="text-foreground font-medium">{garmentName}</span>
        </div>
        <span className="text-[11px]">Rendu vectoriel ultra haute définition (300 DPI)</span>
      </div>
    </div>
  );
}
