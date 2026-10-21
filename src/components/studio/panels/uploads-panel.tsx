"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImageElement } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { useStudioContext } from "../context";
import { placeImages } from "../placement";

// Photos : import (bouton, glisser-déposer, coller) et photos déjà utilisées dans la création.

export function UploadsPanel() {
  const t = useTranslations("studio.uploads");
  const { pickImages } = useStudioContext();
  const doc = useStudio((s) => s.doc);
  const used = useMemo(() => {
    const seen = new Map<string, ImageElement>();
    for (const page of doc?.pages ?? []) for (const el of page.elements) if (el.type === "image" && !seen.has(el.src)) seen.set(el.src, el);
    return [...seen.values()];
  }, [doc]);

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={() => pickImages(null)}
        className="grid place-items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition hover:border-primary hover:bg-muted"
      >
        <ImageUp className="size-7 text-primary" aria-hidden="true" />
        <span className="text-sm font-medium">{t("import")}</span>
        <span className="text-[11px] leading-relaxed text-muted-foreground">{t("help")}</span>
      </button>
      <Button variant="outline" size="sm" onClick={() => pickImages(null)}>
        {t("browse")}
      </Button>
      {used.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-xs font-semibold">{t("used")}</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {used.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => placeImages([{ src: img.src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }])}
                className="aspect-square overflow-hidden rounded-lg border bg-muted transition hover:border-primary"
                title={t("reuse")}
                aria-label={t("reuse")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL locale */}
                <img src={img.src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("rights")}</p>
    </div>
  );
}
