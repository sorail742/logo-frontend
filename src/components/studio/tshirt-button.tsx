"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Shirt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { createImageElement } from "@/lib/apparel/elements";
import { svgToPngBlob } from "@/lib/render/export";
import { documentFonts } from "@/lib/studio/doc";
import { prepareImage } from "@/lib/studio/images";
import { renderPage } from "@/lib/studio/render";
import { ensureFonts } from "@/lib/studio/text";
import type { DesignDoc } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";

// Du Studio au textile : la page en cours devient l'impression du devant d'un t-shirt, dans une
// nouvelle tenue du projet, puis se retravaille dans l'éditeur textile (place, taille, retouche,
// textes, noms et numéros ajoutés) ; la création du Studio reste modifiable de son côté.

/** Côté le plus long de l'image envoyée : environ 30 cm à 300 dpi. */
const TSHIRT_PIXELS = 3600;

/** Page sans son fond (PNG transparent). */
export function withoutBackground(doc: DesignDoc): DesignDoc {
  return { ...doc, pages: doc.pages.map((p) => ({ ...p, background: { type: "none" } })) };
}

export function SendToTshirt({ transparent, onDone }: Readonly<{ transparent: boolean; onDone(): void }>) {
  const t = useTranslations("studio.export");
  const router = useRouter();
  const onError = useApiErrorToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const { doc, meta, pageIndex } = useStudio.getState();
    if (!doc || !meta) return;
    setBusy(true);
    try {
      await ensureFonts(documentFonts(doc));
      const source = transparent ? withoutBackground(doc) : doc;
      const blob = await svgToPngBlob(renderPage(source, pageIndex), {
        size: TSHIRT_PIXELS,
        background: transparent ? null : undefined,
      });
      const image = await prepareImage(blob, { maxSide: TSHIRT_PIXELS });
      const templates = await api.apparel.templates();
      const template = templates.find((tpl) => tpl.category === "TSHIRT") ?? templates[0];
      // Plus grande zone du devant (devant plein sur un t-shirt).
      const zone = template?.zones
        .filter((z) => z.view === "FRONT")
        .sort((a, b) => b.maxWidthMm * b.maxHeightMm - a.maxWidthMm * a.maxHeightMm)[0];
      if (!template || !zone) throw new Error(t("tshirtFailed"));
      const design = await api.apparel.create(meta.projectId, {
        templateId: template.id,
        name: meta.name.slice(0, 120),
        technique: "DTF",
        garmentColor: "#ffffff",
      });
      await api.apparel.saveElements(design.id, [createImageElement(image, zone)]);
      toast.success(t("tshirtDone"));
      onDone();
      router.push(`/textile/${design.id}`);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="lg" onClick={() => void run()} disabled={busy} title={t("tshirtHint")}>
      {busy ? <Loader2 className="animate-spin" /> : <Shirt />}
      {t("tshirt")}
    </Button>
  );
}
