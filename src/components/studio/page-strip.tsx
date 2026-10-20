"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Copy, Maximize, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";
import { PageThumb } from "./panels/templates-panel";

// Bande des pages (carrousels, recto-verso, présentations) et réglages du zoom.

const ZOOMS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

export function PageStrip() {
  const t = useTranslations("studio.pages");
  const doc = useStudio((s) => s.doc);
  const pageIndex = useStudio((s) => s.pageIndex);
  const zoom = useStudio((s) => s.zoom);
  if (!doc) return null;
  const state = useStudio.getState();
  const thumbWidth = Math.round(Math.min(96, (52 * doc.width) / doc.height));

  return (
    <div className="flex h-[76px] shrink-0 items-center gap-3 border-t bg-background px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2" role="tablist" aria-label={t("label")}>
        {doc.pages.map((page, index) => (
          <div key={page.id} className="group relative shrink-0">
            <button
              type="button"
              role="tab"
              aria-selected={index === pageIndex}
              onClick={() => state.setPage(index)}
              className={cn("block overflow-hidden rounded-md border-2 bg-white shadow-xs transition", index === pageIndex ? "border-primary" : "border-transparent hover:border-border")}
              style={{ width: thumbWidth }}
              title={page.name || t("page", { number: index + 1 })}
            >
              <PageThumb doc={doc} page={page} width={thumbWidth} />
            </button>
            <span className="pointer-events-none absolute bottom-0.5 left-1 rounded bg-black/55 px-1 text-[9px] font-medium text-white">{index + 1}</span>
            {index === pageIndex && (
              <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => state.movePage(index, index - 1)} disabled={index === 0} className="rounded bg-background p-0.5 shadow disabled:opacity-40" aria-label={t("moveLeft")} title={t("moveLeft")}>
                  <ChevronLeft className="size-3" />
                </button>
                <button type="button" onClick={() => state.movePage(index, index + 1)} disabled={index === doc.pages.length - 1} className="rounded bg-background p-0.5 shadow disabled:opacity-40" aria-label={t("moveRight")} title={t("moveRight")}>
                  <ChevronRight className="size-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        <Button variant="outline" size="icon" className="shrink-0" onClick={() => state.addPage()} disabled={doc.pages.length >= 30} aria-label={t("add")} title={t("add")}>
          <Plus />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => state.duplicatePage(pageIndex)} disabled={doc.pages.length >= 30} aria-label={t("duplicate")} title={t("duplicate")}>
          <Copy />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => state.removePage(pageIndex)} disabled={doc.pages.length <= 1} aria-label={t("remove")} title={t("remove")}>
          <Trash2 />
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5">
        <Button variant="ghost" size="icon-sm" onClick={() => state.zoomAt(zoom / 1.25)} aria-label={t("zoomOut")} title={`${t("zoomOut")} (Ctrl −)`}>
          <Minus />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" className="h-7 w-14 rounded-md text-xs tabular-nums hover:bg-muted" aria-label={t("zoom")} />}>{Math.round(zoom * 100)} %</DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            <DropdownMenuItem onClick={() => state.fit()}>
              <Maximize />
              {t("fit")}
            </DropdownMenuItem>
            {ZOOMS.map((z) => (
              <DropdownMenuItem key={z} onClick={() => state.zoomAt(z)}>
                {Math.round(z * 100)} %
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon-sm" onClick={() => state.zoomAt(zoom * 1.25)} aria-label={t("zoomIn")} title={`${t("zoomIn")} (Ctrl +)`}>
          <Plus />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => state.fit()} aria-label={t("fit")} title={`${t("fit")} (Ctrl 0)`}>
          <Maximize />
        </Button>
      </div>
    </div>
  );
}
