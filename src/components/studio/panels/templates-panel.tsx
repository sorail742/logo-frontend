"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { clonePage } from "@/lib/studio/doc";
import { renderPage } from "@/lib/studio/render";
import { TEMPLATE_CATEGORIES, TEMPLATES, suggestedTemplates, type TemplateCategory, type TemplateCopy } from "@/lib/studio/templates";
import { ensureFonts } from "@/lib/studio/text";
import type { DesignDoc, DesignPage } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";
import { useStudioContext } from "../context";

// Modèles à la marque, composés pour le format de la création.

export const PageThumb = memo(function PageThumb({ doc, page, width }: { doc: Pick<DesignDoc, "width" | "height" | "print">; page: DesignPage; width: number }) {
  const svg = useMemo(() => renderPage({ version: 1, width: doc.width, height: doc.height, print: doc.print, pages: [page] }, 0, { outputWidth: width }), [doc.width, doc.height, doc.print, page, width]);
  return <span className="block [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
});

export function TemplatesPanel() {
  const t = useTranslations("studio.templates");
  const { brand } = useStudioContext();
  const width = useStudio((s) => s.doc?.width ?? 0);
  const height = useStudio((s) => s.doc?.height ?? 0);
  const print = useStudio((s) => s.doc?.print ?? null);
  const format = useStudio((s) => s.meta?.format ?? "");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!brand) return;
    let alive = true;
    ensureFonts([brand.heading, brand.body, { fontId: "playfair", fontWeight: 700 }]).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [brand]);

  const copy = t.raw("copy") as TemplateCopy;
  const built = useMemo(() => {
    if (!brand || !ready || !width) return [];
    const suggested = suggestedTemplates(format);
    const ordered = [...TEMPLATES].sort((a, b) => {
      const ia = suggested.indexOf(a.id);
      const ib = suggested.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return ordered.map((template) => ({ template, pages: template.build({ brand, width, height, print, copy }) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, ready, width, height, print, format]);

  const apply = (pages: DesignPage[]) => {
    const state = useStudio.getState();
    const doc = state.doc!;
    const copies = pages.map(clonePage);
    const current = doc.pages[state.pageIndex]!;
    const replace = current.elements.length === 0;
    const index = replace ? state.pageIndex : state.pageIndex + 1;
    state.change((d) => ({ ...d, pages: [...d.pages.slice(0, index), ...copies, ...d.pages.slice(replace ? index + 1 : index)] }));
    state.setPage(index);
    toast.success(copies.length > 1 ? t("appliedPages", { count: copies.length }) : t("applied"));
  };

  const visible = built.filter((b) => category === "all" || b.template.category === category);

  return (
    <div className="grid gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{t("intro")}</p>
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...TEMPLATE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn("rounded-full border px-2.5 py-1 text-[11px] transition", category === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>
      {!built.length && <div className="grid grid-cols-2 gap-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />)}</div>}
      <div className="grid grid-cols-2 gap-2">
        {visible.map(({ template, pages }) => (
          <button
            key={template.id}
            type="button"
            onClick={() => apply(pages)}
            className="group relative overflow-hidden rounded-lg border bg-white text-left shadow-xs transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            title={t(`names.${template.id}`)}
          >
            <PageThumb doc={{ width, height, print }} page={pages[0]!} width={150} />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 pt-5 pb-1.5 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {t(`names.${template.id}`)}
              {pages.length > 1 && <span className="rounded bg-white/25 px-1">{t("pages", { count: pages.length })}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
