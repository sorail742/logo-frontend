"use client";

import {
  Cake,
  ImagePlus,
  Layers,
  LayoutTemplate,
  Shapes,
  Sparkles,
  Target,
  Type,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolTabId =
  "templates" | "zones" | "logo" | "text" | "images" | "shapes" | "celebrations" | "layers";

export interface ToolRailItem {
  id: ToolTabId;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const TOOL_RAIL_ITEMS: ToolRailItem[] = [
  { id: "templates", label: "Modèles", icon: LayoutTemplate, badge: "Nouveau" },
  { id: "zones", label: "Zones", icon: Target },
  { id: "logo", label: "Logo", icon: Sparkles },
  { id: "text", label: "Texte", icon: Type },
  { id: "images", label: "Images", icon: ImagePlus },
  { id: "shapes", label: "Formes", icon: Shapes },
  { id: "celebrations", label: "Fêtes", icon: Cake },
  { id: "layers", label: "Calques", icon: Layers },
];

export interface ToolRailProps {
  activeTab: ToolTabId | null;
  layerCount: number;
  onTabClick(id: ToolTabId): void;
}

export function ToolRail({ activeTab, layerCount, onTabClick }: Readonly<ToolRailProps>) {
  return (
    <nav
      aria-label="Outils de création textile"
      className="border-border/70 bg-card z-20 flex w-[72px] shrink-0 flex-col items-center border-r py-2.5 select-none"
    >
      <div className="flex w-full flex-1 flex-col items-center gap-1">
        {TOOL_RAIL_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onTabClick(item.id)}
              className={cn(
                "group focus-visible:ring-primary relative flex w-[64px] flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none",
                isActive
                  ? "bg-[#0B6B4F] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "size-6 stroke-[1.85] transition-transform duration-200 group-hover:scale-110",
                    isActive && "text-white",
                  )}
                />
                {item.id === "layers" && layerCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full text-[9px] font-extrabold",
                      isActive ? "bg-white text-[#0B6B4F]" : "bg-emerald-600 text-white",
                    )}
                  >
                    {layerCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-tight",
                  isActive ? "font-bold text-white" : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
