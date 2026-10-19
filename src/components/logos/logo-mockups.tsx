"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SvgView } from "@/components/brand/svg-view";
import { renderLogoSvg } from "@/lib/render/logo";
import type { LogoSpec } from "@/lib/types";

/** Proposition présentée en situation : carte de visite, fond sombre, avatar, icône d'app (LOGO-05). */
export function LogoMockups({ spec, compact = false }: { spec: LogoSpec; compact?: boolean }) {
  const t = useTranslations("logos.mockups");
  const svgs = useMemo(
    () => ({
      main: renderLogoSvg(spec).svg,
      white: renderLogoSvg(spec, { variant: "white", withBackground: false }).svg,
      icon: renderLogoSvg({ ...spec, iconFrame: spec.iconFrame === "none" ? "circle" : spec.iconFrame }, { layout: "icon" }).svg,
    }),
    [spec],
  );

  const items = [
    {
      id: "card",
      node: (
        <div className="flex aspect-[1.75] w-full flex-col justify-between rounded-md bg-white p-2 shadow-sm ring-1 ring-black/5">
          <SvgView svg={svgs.main} className="h-1/2 w-2/3 justify-start" />
          <div className="grid gap-0.5">
            <span className="h-1 w-1/2 rounded bg-neutral-300" />
            <span className="h-1 w-1/3 rounded bg-neutral-200" />
          </div>
        </div>
      ),
    },
    {
      id: "dark",
      node: (
        <div className="flex aspect-[1.75] w-full items-center justify-center rounded-md bg-neutral-900 p-2">
          <SvgView svg={svgs.white} className="h-full w-full" />
        </div>
      ),
    },
    {
      id: "avatar",
      node: (
        <div className="flex aspect-square h-full items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
          <SvgView svg={svgs.icon} className="size-full p-1" />
        </div>
      ),
    },
    {
      id: "appIcon",
      node: (
        <div className="flex aspect-square h-full items-center justify-center overflow-hidden rounded-[22%] shadow-sm ring-1 ring-black/10" style={{ background: spec.colors.background }}>
          <SvgView svg={svgs.icon} className="size-full" />
        </div>
      ),
    },
  ] as const;

  return (
    <div className={compact ? "grid grid-cols-4 items-center gap-2" : "grid grid-cols-2 gap-3 sm:grid-cols-4"}>
      {items.map((item) => (
        <figure key={item.id} className="grid justify-items-center gap-1">
          <div className={compact ? "flex h-12 w-full items-center justify-center" : "flex h-24 w-full items-center justify-center"}>{item.node}</div>
          {!compact && <figcaption className="text-xs text-muted-foreground">{t(item.id)}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
