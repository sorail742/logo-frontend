"use client";

import { CheckCircle2, Eye, EyeOff, Grid, Maximize2, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomBarProps {
  zoom: number;
  showZones: boolean;
  showGrid: boolean;
  saveStatus: string;
  onZoomChange(level: number): void;
  onToggleZones(): void;
  onToggleGrid(): void;
  onResetZoom(): void;
}

export function BottomBar({
  zoom,
  showZones,
  showGrid,
  saveStatus,
  onZoomChange,
  onToggleZones,
  onToggleGrid,
  onResetZoom,
}: Readonly<BottomBarProps>) {
  return (
    <footer
      aria-label="Barre d'état et contrôles du canevas"
      className="border-border/70 bg-card/90 z-10 flex h-11 shrink-0 items-center justify-between border-t px-4 text-xs backdrop-blur-md select-none"
    >
      {/* Left: Resolution Quality & Save status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          <span>Qualité 300 DPI (Vectoriel)</span>
        </div>

        <span className="text-muted-foreground hidden sm:inline-block">·</span>

        <span className="text-muted-foreground hidden text-[11px] sm:inline-block">{saveStatus}</span>
      </div>

      {/* Right: Zones switch, Grid switch, Zoom controls */}
      <div className="flex items-center gap-2">
        {/* Toggle Zones */}
        <button
          type="button"
          onClick={onToggleZones}
          title={showZones ? "Masquer les zones d'impression" : "Afficher les zones d'impression"}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
            showZones
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-border/70 text-muted-foreground hover:bg-muted",
          )}
        >
          {showZones ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          <span className="hidden sm:inline">Zones</span>
        </button>

        {/* Toggle Grid */}
        <button
          type="button"
          onClick={onToggleGrid}
          title={showGrid ? "Masquer la grille d'alignement" : "Afficher la grille d'alignement"}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
            showGrid
              ? "border-[#0B6B4F]/40 bg-[#0B6B4F]/10 text-[#0B6B4F] dark:text-emerald-400"
              : "border-border/70 text-muted-foreground hover:bg-muted",
          )}
        >
          <Grid className="size-3.5" />
          <span className="hidden sm:inline">Grille</span>
        </button>

        {/* Zoom Stepper */}
        <div className="border-border/70 bg-muted/40 flex items-center gap-1 rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            title="Réduire (Ctrl+-)"
            className="text-muted-foreground hover:bg-card hover:text-foreground flex size-6 items-center justify-center rounded-md transition"
          >
            <ZoomOut className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            title="Ajuster à 100%"
            className="text-foreground px-1.5 text-[11px] font-bold"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))}
            title="Agrandir (Ctrl++)"
            className="text-muted-foreground hover:bg-card hover:text-foreground flex size-6 items-center justify-center rounded-md transition"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>

        {/* Fit to screen button */}
        <button
          type="button"
          onClick={onResetZoom}
          title="Ajuster la vue à l'écran"
          className="border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center rounded-lg border transition"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </footer>
  );
}
