"use client";

import { useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { ImageUp, Layers, LayoutTemplate, MessageSquare, Palette, PanelLeftClose, Shapes, ShieldCheck, Type, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommentsListPanel, useDesignThreads } from "./comments";
import { BrandPanel } from "./panels/brand-panel";
import { CheckPanel, useQuality } from "./panels/check-panel";
import { ElementsPanel } from "./panels/elements-panel";
import { GeneratePanel } from "./panels/generate-panel";
import { LayersPanel } from "./panels/layers-panel";
import { TemplatesPanel } from "./panels/templates-panel";
import { TextPanel } from "./panels/text-panel";
import { UploadsPanel } from "./panels/uploads-panel";

// Barre latérale : rail d'onglets et panneau correspondant (repliable).

export type PanelId = "templates" | "elements" | "generate" | "text" | "brand" | "uploads" | "layers" | "check" | "comments";

const TABS: { id: PanelId; icon: ComponentType<{ className?: string }>; Panel: ComponentType }[] = [
  { id: "templates", icon: LayoutTemplate, Panel: TemplatesPanel },
  { id: "elements", icon: Shapes, Panel: ElementsPanel },
  { id: "generate", icon: WandSparkles, Panel: GeneratePanel },
  { id: "text", icon: Type, Panel: TextPanel },
  { id: "brand", icon: Palette, Panel: BrandPanel },
  { id: "uploads", icon: ImageUp, Panel: UploadsPanel },
  { id: "layers", icon: Layers, Panel: LayersPanel },
  { id: "check", icon: ShieldCheck, Panel: CheckPanel },
  { id: "comments", icon: MessageSquare, Panel: CommentsListPanel },
];

function CheckBadge() {
  const issues = useQuality();
  const errors = issues.filter((i) => i.severity !== "info").length;
  if (!errors) return null;
  return <span className="absolute top-1 right-2 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">{errors}</span>;
}

function CommentsBadge() {
  const { threads } = useDesignThreads();
  const open = threads.filter((th) => !th.root.resolvedAt).length;
  if (!open) return null;
  return <span className="absolute top-1 right-2 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{open}</span>;
}

export function SidePanel({ panel, onPanel, only }: { panel: PanelId | null; onPanel(panel: PanelId | null): void; only?: PanelId[] }) {
  const t = useTranslations("studio.panels");
  const tabs = only ? TABS.filter((tab) => only.includes(tab.id)) : TABS;
  const [lastPanel, setLastPanel] = useState<PanelId>(tabs[0]!.id);
  const active = tabs.find((tab) => tab.id === panel);

  return (
    <div className="relative z-20 flex h-full shrink-0 border-r bg-background">
      <nav className="flex w-[68px] flex-col items-stretch gap-0.5 border-r py-2" aria-label={t("label")}>
        {tabs.map((tab) => {
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
              {tab.id === "comments" && <CommentsBadge />}
            </button>
          );
        })}
      </nav>
      {active ? (
        <div className="flex w-[300px] flex-col bg-background max-md:absolute max-md:inset-y-0 max-md:left-full max-md:w-[min(300px,calc(100vw-68px))] max-md:border-r max-md:shadow-xl">
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
