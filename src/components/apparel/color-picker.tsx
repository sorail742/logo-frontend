"use client";

import { useMemo, useState } from "react";
import { Check, Pipette, Sparkles } from "lucide-react";
import {
  COLOR_FAMILIES,
  PRESET_GARMENT_COLORS,
  findColorName,
  type GarmentColorOption,
} from "@/lib/apparel/colors-data";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  selectedColor: string;
  brandColors?: string[];
  onSelect(hex: string): void;
}

type EyeDropperConstructor = new () => {
  open(): Promise<{ sRGBHex: string }>;
};

export function ColorPicker({ selectedColor, brandColors = [], onSelect }: Readonly<ColorPickerProps>) {
  const [customHex, setCustomHex] = useState(selectedColor);
  const currentColorName = useMemo(() => findColorName(selectedColor), [selectedColor]);

  // Handle pipette (EyeDropper API)
  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  const handlePickWithEyeDropper = async () => {
    try {
      const EyeDropper = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
      if (!EyeDropper) return;
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        onSelect(result.sRGBHex);
        setCustomHex(result.sRGBHex);
      }
    } catch {
      // User cancelled picker
    }
  };

  const handleHexInput = (val: string) => {
    setCustomHex(val);
    const cleaned = val.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned) || /^#[0-9A-Fa-f]{3}$/.test(cleaned)) {
      onSelect(cleaned);
    }
  };

  return (
    <div className="space-y-5">
      {/* Active Color Header */}
      <div className="border-border/80 bg-muted/30 flex items-center justify-between rounded-xl border p-3.5">
        <div className="flex items-center gap-3">
          <div
            className="ring-border/80 size-10 rounded-xl border-2 border-white shadow-md ring-2"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <div className="text-muted-foreground text-xs">Couleur sélectionnée</div>
            <div className="text-foreground text-sm font-bold">{currentColorName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* EyeDropper button */}
          {hasEyeDropper && (
            <button
              type="button"
              onClick={handlePickWithEyeDropper}
              title="Prélever une couleur à l'écran (Pipette)"
              className="border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-lg border transition"
            >
              <Pipette className="size-4" />
            </button>
          )}

          {/* Hex Input */}
          <div className="w-28">
            <Input
              value={customHex}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#FFFFFF"
              maxLength={7}
              className="h-9 font-mono text-xs uppercase"
            />
          </div>
        </div>
      </div>

      {/* Brand Colors (if available) */}
      {brandColors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>Couleurs de votre Kit de marque</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {brandColors.map((hex, idx) => {
              const active = selectedColor.toUpperCase() === hex.toUpperCase();
              return (
                <button
                  key={`${hex}-${idx}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onSelect(hex);
                    setCustomHex(hex);
                  }}
                  title={`Couleur marque : ${hex}`}
                  className={cn(
                    "group focus-visible:ring-primary relative flex size-10 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:outline-none",
                    active
                      ? "scale-105 border-white shadow-md ring-2 ring-[#0B6B4F] ring-offset-2"
                      : "border-border/60 hover:shadow-xs",
                  )}
                  style={{ backgroundColor: hex }}
                >
                  {active && <Check className="size-4 stroke-[3] text-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Swatches grouped by family */}
      {COLOR_FAMILIES.filter((f) => f.id !== "BRAND").map((fam) => {
        const familyColors = PRESET_GARMENT_COLORS.filter((c) => c.family === fam.id);
        if (familyColors.length === 0) return null;

        return (
          <div key={fam.id} className="space-y-2">
            <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {fam.labelFr}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {familyColors.map((c) => {
                const active = selectedColor.toUpperCase() === c.hex.toUpperCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      onSelect(c.hex);
                      setCustomHex(c.hex);
                    }}
                    title={`${c.nameFr} (${c.stockStatus === "IN_STOCK" ? "En stock" : "Sur commande"})`}
                    className={cn(
                      "group focus-visible:ring-primary relative flex size-10 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:outline-none",
                      active
                        ? "scale-105 border-white shadow-md ring-2 ring-[#0B6B4F] ring-offset-2"
                        : "border-border/60 hover:shadow-xs",
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {active && (
                      <Check
                        className={cn(
                          "size-4 stroke-[3] drop-shadow-sm",
                          c.hex === "#FFFFFF" || c.hex === "#F5F3EC" ? "text-slate-900" : "text-white",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
