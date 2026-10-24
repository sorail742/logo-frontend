"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FileImage, Images, Loader2, PackageCheck, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { errorMessage } from "@/lib/api/errors";
import { viewsOf, zoneRect } from "@/lib/apparel/garments";
import { renderGarment, toStudioElement } from "@/lib/apparel/render";
import { printPixels } from "@/lib/apparel/separation";
import { downloadBlob, svgToPngBlob } from "@/lib/render/export";
import { slugify } from "@/lib/format";
import { renderElement } from "@/lib/studio/render";
import { useApparel } from "@/stores/apparel";
import { useSizing } from "./canvas";
import { useApparelEditor } from "./editor";
import { ProductionDialog } from "./production-dialog";

// Exports : maquette de la vue (présentation au client), planche de toutes les vues et fichiers
// d'impression par zone — PNG à 300 dpi, fond transparent, à la taille réelle — et pack atelier
// (supports de transfert, découpe, films, un fichier par joueur), produit par l'API.

const MOCKUP_SIZE = 2400;
const BOARD_GAP = 60;

export function ExportMenu({ children }: Readonly<{ children: ReactNode }>) {
  const t = useTranslations("apparel.export");
  const tv = useTranslations("apparel.views");
  const { template } = useApparelEditor();
  const sizing = useSizing(template);
  const [busy, setBusy] = useState(false);
  const [production, setProduction] = useState(false);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const base = () => {
    const { design, elements } = useApparel.getState();
    return {
      design: design!,
      input: {
        category: design!.template.category,
        color: design!.garmentColor,
        zones: template.zones,
        elements,
        sizing,
      },
    };
  };

  const mockup = () =>
    run(async () => {
      const { design, input } = base();
      const view = useApparel.getState().view;
      const svg = renderGarment({ ...input, view, idPrefix: "mk" });
      downloadBlob(
        await svgToPngBlob(svg, { size: MOCKUP_SIZE, background: "#f4f4f5", padding: 0.04 }),
        `${slugify(design.name)}-${slugify(tv(view))}.png`,
      );
    });

  const board = () =>
    run(async () => {
      const { design, input } = base();
      const views = viewsOf(template).filter((v) => v !== "OTHER");
      // Vues côte à côte, alignées en bas, à la même échelle (mm).
      const parts = views.map((view, i) => {
        const svg = renderGarment({ ...input, view, idPrefix: `bd${i}` });
        const size = /viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/.exec(svg)!;
        return { svg, w: Number(size[1]), h: Number(size[2]) };
      });
      const height = Math.max(...parts.map((p) => p.h));
      let x = 0;
      const nested = parts.map((p) => {
        const inner = p.svg
          .replace("<svg ", `<svg x="${x}" y="${height - p.h}" `)
          .replace(/ width="[\d.]+" height="[\d.]+"/, ` width="${p.w}" height="${p.h}"`);
        x += p.w + BOARD_GAP;
        return inner;
      });
      const width = x - BOARD_GAP;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${nested.join("")}</svg>`;
      downloadBlob(
        await svgToPngBlob(svg, { size: 3600, background: "#f4f4f5", padding: 0.03 }),
        `${slugify(design.name)}-planche.png`,
      );
    });

  const printFiles = () =>
    run(async () => {
      const { design, elements } = useApparel.getState();
      const used = template.zones.filter((z) => elements.some((el) => el.zoneKey === z.key));
      if (!used.length) {
        toast.info(t("nothing"));
        return;
      }
      // Rendus en parallèle (polices intégrées), puis téléchargements successifs.
      const files = await Promise.all(
        used.map(async (zone) => {
          const r = zoneRect(zone);
          const prints = elements
            .filter((el) => el.zoneKey === zone.key)
            .map((el) => toStudioElement(el, zone, `pf-${el.id}`))
            .map((el) => (el ? renderElement(el) : ""))
            .join("");
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r.width} ${r.height}" width="${r.width}" height="${r.height}"><g transform="translate(${-r.x} ${-r.y})">${prints}</g></svg>`;
          const { width, height } = printPixels(r.width, r.height);
          return {
            blob: await svgToPngBlob(svg, { size: Math.max(width, height), background: null }),
            name: `${slugify(design!.name)}-${zone.key}-${r.width}x${r.height}mm-300dpi.png`,
          };
        }),
      );
      for (const file of files) downloadBlob(file.blob, file.name);
      toast.success(t("printDone", { count: used.length }));
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={busy} />}>
          {busy ? <Loader2 className="animate-spin" /> : children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => void mockup()}>
            <FileImage />
            <span className="grid">
              <span>{t("mockup")}</span>
              <span className="text-muted-foreground text-[11px]">{t("mockupHint")}</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void board()}>
            <Images />
            <span className="grid">
              <span>{t("board")}</span>
              <span className="text-muted-foreground text-[11px]">{t("boardHint")}</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void printFiles()}>
            <Printer />
            <span className="grid">
              <span>{t("print")}</span>
              <span className="text-muted-foreground text-[11px]">{t("printHint")}</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setProduction(true)}>
            <PackageCheck />
            <span className="grid">
              <span>{t("production")}</span>
              <span className="text-muted-foreground text-[11px]">{t("productionHint")}</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {production && <ProductionDialog open={production} onOpenChange={setProduction} />}
    </>
  );
}
