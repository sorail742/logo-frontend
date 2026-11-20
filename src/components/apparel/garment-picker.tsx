"use client";

import { useMemo, useState } from "react";
import { Check, Layers, Sparkles } from "lucide-react";
import type { ApparelTemplate } from "@/lib/apparel/types";
import {
  GARMENT_FILTER_TABS,
  GARMENT_METADATA,
  type GarmentFilterCategory,
} from "@/lib/apparel/templates-data";
import { GarmentPreview } from "./garment-view";
import { cn } from "@/lib/utils";

export interface GarmentPickerProps {
  templates: ApparelTemplate[];
  selectedTemplateId: string;
  currentColor: string;
  onSelect(template: ApparelTemplate): void;
}

export function GarmentPicker({
  templates,
  selectedTemplateId,
  currentColor,
  onSelect,
}: Readonly<GarmentPickerProps>) {
  const [activeCategory, setActiveCategory] = useState<GarmentFilterCategory>("ALL");

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "ALL") return templates;
    return templates.filter((tpl) => {
      const meta = GARMENT_METADATA[tpl.id];
      if (!meta) return true;
      if (activeCategory === "TOPS") return meta.group === "TOPS";
      if (activeCategory === "SPORT") return meta.group === "SPORT";
      if (activeCategory === "BOTTOMS") return meta.group === "BOTTOMS";
      return true;
    });
  }, [templates, activeCategory]);

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="border-border/60 flex flex-wrap items-center gap-1.5 border-b pb-3" role="tablist">
        {GARMENT_FILTER_TABS.map((tab) => {
          const active = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all select-none",
                active
                  ? "bg-[#0B6B4F] text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Large Garment Cards */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Sélection du vêtement ou support"
      >
        {filteredTemplates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplateId;
          const meta = GARMENT_METADATA[tpl.id];
          const frontView = tpl.zones.some((z) => z.view === "FRONT")
            ? "FRONT"
            : (tpl.zones[0]?.view ?? "FRONT");

          return (
            <button
              key={tpl.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(tpl)}
              className={cn(
                "group focus-visible:ring-primary relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-300 select-none focus-visible:ring-2 focus-visible:outline-none",
                isSelected
                  ? "border-[#0B6B4F] bg-[#0B6B4F]/5 shadow-md ring-2 shadow-emerald-950/10 ring-[#0B6B4F]"
                  : "border-border/80 bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-md",
              )}
            >
              {/* Badge & Check status */}
              <div className="flex items-start justify-between gap-2">
                {meta?.badge ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      meta.badge === "Populaire" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                      meta.badge === "Pro" && "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
                      meta.badge === "Sport" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    <Sparkles className="size-2.5" />
                    {meta.badge}
                  </span>
                ) : (
                  <span />
                )}

                {/* Selected Checkmark */}
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full transition-colors",
                    isSelected
                      ? "bg-[#0B6B4F] text-white shadow-xs"
                      : "border-border/80 bg-muted/40 group-hover:border-primary/40 border text-transparent",
                  )}
                >
                  <Check className="size-3 stroke-[3]" />
                </div>
              </div>

              {/* Garment Preview Visual */}
              <div className="bg-muted/40 relative my-2 flex aspect-[4/3] w-full items-center justify-center rounded-xl p-2 transition group-hover:scale-102">
                <GarmentPreview
                  category={tpl.category}
                  view={frontView}
                  color={currentColor}
                  zones={tpl.zones}
                  className="size-full max-h-36 object-contain drop-shadow-sm"
                />
              </div>

              {/* Details & Specs */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <h3
                    className={cn(
                      "text-sm font-bold tracking-tight transition-colors",
                      isSelected ? "text-[#0B6B4F] dark:text-emerald-400" : "text-foreground",
                    )}
                  >
                    {meta?.name ?? tpl.name}
                  </h3>
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-semibold">
                    <Layers className="size-3 text-emerald-600" />
                    {tpl.zones.length} zones
                  </span>
                </div>

                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {meta?.tagline ?? "Support textile personnalisable haute qualité."}
                </p>

                <div className="text-muted-foreground/90 border-border/40 flex items-center justify-between border-t pt-2 text-[11px]">
                  <span>{meta?.material ?? "100% Coton"}</span>
                  <span className="text-foreground font-semibold">
                    dès {meta?.minPrice.toFixed(2) ?? "12.50"} €
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
