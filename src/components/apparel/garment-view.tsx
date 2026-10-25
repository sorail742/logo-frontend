"use client";

import { useId, useMemo } from "react";
import { renderGarment, type SizeView } from "@/lib/apparel/render";
import type { ApparelElement, GarmentView, PrintZone, ProductCategory } from "@/lib/apparel/types";
import { labelSvg } from "@/lib/render/svg";
import { cn } from "@/lib/utils";

/** Préfixe d'identifiants SVG unique par instance (plusieurs vues sur une même page). */
export function useSvgPrefix(prefix: string) {
  return `${prefix}${useId().replaceAll(/[^\w-]/g, "")}`;
}

const NO_ELEMENTS: ApparelElement[] = [];

/** Vue d'un vêtement avec ses impressions (aperçu non interactif : listes, BAT). */
export function GarmentPreview({
  category,
  view,
  color,
  zones,
  elements = NO_ELEMENTS,
  sizing,
  className,
  label,
}: Readonly<{
  category: ProductCategory;
  view: GarmentView;
  color: string;
  zones: PrintZone[];
  elements?: ApparelElement[];
  sizing?: SizeView;
  className?: string;
  label?: string;
}>) {
  const prefix = useSvgPrefix("gp");
  const svg = useMemo(
    () =>
      renderGarment({
        category,
        view,
        color,
        zones,
        elements,
        sizing,
        idPrefix: `${prefix}${view.toLowerCase()}`,
      }).replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"'),
    [category, view, color, zones, elements, sizing, prefix],
  );
  return (
    <div
      className={cn("[&>svg]:block", className)}
      dangerouslySetInnerHTML={{ __html: labelSvg(svg, label) }}
    />
  );
}
