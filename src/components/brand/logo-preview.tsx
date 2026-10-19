"use client";

import { useMemo } from "react";
import { renderLogoSvg, type RenderOptions } from "@/lib/render/logo";
import type { LogoSpec } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SvgView } from "./svg-view";

export function LogoPreview({
  spec,
  className,
  dark,
  variant,
  layout,
  watermark,
  withBackground,
}: { spec: LogoSpec; className?: string; dark?: boolean } & Omit<RenderOptions, "fontFamily">) {
  const { svg } = useMemo(
    () => renderLogoSvg(spec, { variant, layout, watermark, withBackground }),
    [spec, variant, layout, watermark, withBackground],
  );
  return <SvgView svg={svg} label={spec.text} className={cn("p-3", dark ? "bg-neutral-900" : "bg-checker", className)} />;
}
