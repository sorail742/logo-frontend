"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Replace, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clonePage, documentFonts } from "@/lib/studio/doc";
import { variations } from "@/lib/studio/smart";
import { ensureFonts } from "@/lib/studio/text";
import { FONT_PAIRINGS } from "@/lib/studio/brand";
import { useStudio } from "@/stores/studio";
import { useStudioContext } from "./context";
import { PageThumb } from "./panels/templates-panel";

// Variations de la page courante, à la marque : palettes, mode sombre, harmonies, polices,
// miroir. Chaque variation remplace la page ou s'ajoute à la suite.

export function VariationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const t = useTranslations("studio.variations");
  const { brand } = useStudioContext();
  const doc = useStudio((s) => s.doc);
  const pageIndex = useStudio((s) => s.pageIndex);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open || !doc) return;
    ensureFonts([...documentFonts(doc), ...FONT_PAIRINGS.flat()]).then(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const page = doc?.pages[pageIndex];
  const list = useMemo(() => (open && ready && doc && page && brand ? variations(page, doc, brand) : []), [open, ready, page, brand]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!doc || !page) return null;

  const applyVariation = (index: number, mode: "replace" | "add") => {
    const state = useStudio.getState();
    const next = clonePage(list[index]!.page);
    if (mode === "replace") {
      state.change((d) => ({ ...d, pages: d.pages.map((p, i) => (i === pageIndex ? { ...next, id: p.id } : p)) }));
      state.select([]);
    } else {
      state.addPage(next);
    }
    toast.success(mode === "replace" ? t("replaced") : t("added"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{brand ? t("description") : t("noBrand")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {!list.length && brand && Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />)}
          {list.map((variation, index) => (
            <figure key={variation.id} className="group grid gap-1.5">
              <div className="relative overflow-hidden rounded-lg border bg-white shadow-xs">
                <PageThumb doc={doc} page={variation.page} width={200} />
                <div className="absolute inset-0 flex items-end justify-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                  <Button size="xs" variant="secondary" onClick={() => applyVariation(index, "replace")}>
                    <Replace />
                    {t("replace")}
                  </Button>
                  <Button size="xs" variant="secondary" onClick={() => applyVariation(index, "add")}>
                    <Plus />
                    {t("add")}
                  </Button>
                </div>
              </div>
              <figcaption className="text-[11px] text-muted-foreground">{t(`kinds.${variation.kind}`)}</figcaption>
            </figure>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
