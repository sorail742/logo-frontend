"use client";

import { useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { ImageUp, Layers, LayoutTemplate, Palette, PanelLeftClose, Shapes, ShieldCheck, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandPanel } from "./panels/brand-panel";
import { CheckPanel, useQuality } from "./panels/check-panel";
import { ElementsPanel } from "./panels/elements-panel";
import { LayersPanel } from "./panels/layers-panel";
import { TemplatesPanel } from "./panels/templates-panel";
import { TextPanel } from "./panels/text-panel";
import { UploadsPanel } from "./panels/uploads-panel";

// Barre latérale : rail d'onglets et panneau correspondant (repliable).

export type PanelId = "templates" | "elements" | "text" | "brand" | "uploads" | "layers" | "check";

const TABS: { id: PanelId; icon: ComponentType<{ className?: string }>; Panel: ComponentType }[] = [
  { id: "templates", icon: LayoutTemplate, Panel: TemplatesPanel },
  { id: "elements", icon: Shapes, Panel: ElementsPanel },
  { id: "text", icon: Type, Panel: TextPanel },
  { id: "brand", icon: Palette, Panel: BrandPanel },
  { id: "uploads", icon: ImageUp, Panel: UploadsPanel },
  { id: "layers", icon: Layers, Panel: LayersPanel },
  { id: "check", icon: ShieldCheck, Panel: CheckPanel },
];

function CheckBadge() {
  const issues = useQuality();
  const errors = issues.filter((i) => i.severity !== "info").length;
  if (!errors) return null;
  return <span className="absolute top-1 right-2 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">{errors}</span>;
}

export function SidePanel({ panel, onPanel }: { panel: PanelId | null; onPanel(panel: PanelId | null): void }) {
  const t = useTranslations("studio.panels");
  const [lastPanel, setLastPanel] = useState<PanelId>("templates");
  const active = TABS.find((tab) => tab.id === panel);

  return (
    <div className="flex h-full shrink-0 border-r bg-background">
      <nav className="flex w-[68px] flex-col items-stretch gap-0.5 border-r py-2" aria-label={t("label")}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = panel === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setLastPanel(tab.id);
                onPanel(selected ? null : tab.id);
              }}
              aria-pressed={selected}
              className={cn(
                "relative mx-1.5 flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition",
                selected ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {t(tab.id)}
              {tab.id === "check" && <CheckBadge />}
            </button>
          );
        })}
      </nav>
      {active ? (
        <div className="flex w-[300px] flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <h2 className="text-sm font-semibold">{t(active.id)}</h2>
            <Button variant="ghost" size="icon-sm" onClick={() => onPanel(null)} aria-label={t("close")} title={t("close")}>
              <PanelLeftClose />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <active.Panel />
          </div>
        </div>
      ) : (
        <button type="button" className="sr-only" onClick={() => onPanel(lastPanel)}>
          {t("open")}
        </button>
      )}
    </div>
  );
}
