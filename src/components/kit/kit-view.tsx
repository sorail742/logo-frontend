"use client";

import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SvgView } from "@/components/brand/svg-view";
import { LOGO_VARIANTS, renderLogoSvg } from "@/lib/render/logo";
import { cssFontFamily } from "@/lib/render/fonts";
import { readableOn } from "@/lib/render/color";
import type { BrandKit } from "@/lib/types";

export function KitView({ kit, projectName, acronym, meaning }: { kit: BrandKit; projectName: string; acronym?: string | null; meaning?: string | null }) {
  const t = useTranslations("kit");
  const tv = useTranslations("logos.variants");
  const spec = kit.logoSpec;

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div className="grid gap-2">
            <p className="text-xs text-muted-foreground">{t("name")}</p>
            <p className="text-3xl font-semibold tracking-tight">{projectName}</p>
            {acronym && acronym !== projectName && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t("acronym")} : </span>
                {acronym}
              </p>
            )}
            {meaning && <p className="text-sm text-muted-foreground">{meaning}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{t("slogan")}</p>
            <p className="text-lg italic">{kit.slogan ?? t("noSlogan")}</p>
          </div>
          {spec && <SvgView svg={renderLogoSvg(spec).svg} label={projectName} className="bg-checker aspect-[16/9] rounded-xl p-6" />}
        </CardContent>
      </Card>

      {spec && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("logo")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LOGO_VARIANTS.map((variant) => (
              <figure key={variant.id} className="grid gap-1">
                <SvgView
                  svg={renderLogoSvg(spec, { variant: variant.variant, layout: variant.layout, withBackground: false }).svg}
                  className={variant.dark ? "aspect-[3/2] rounded-lg bg-neutral-900 p-3" : "bg-checker aspect-[3/2] rounded-lg p-3"}
                />
                <figcaption className="text-center text-xs text-muted-foreground">{tv(variant.id)}</figcaption>
              </figure>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("palette")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {kit.palette.map((color) => (
              <div key={color.role} className="flex items-center gap-3 rounded-lg border p-2">
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-md text-[10px] font-medium ring-1 ring-black/10"
                  style={{ background: color.hex, color: readableOn(color.hex) }}
                >
                  Aa
                </span>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="text-sm font-medium">{t(`colorRoles.${color.role}` as "colorRoles.primary")}</p>
                  <p className="font-mono">HEX {color.hex}</p>
                  <p className="font-mono text-muted-foreground">RGB {color.rgb}</p>
                  <p className="font-mono text-muted-foreground">CMJN {color.cmyk}</p>
                </div>
                <button
                  type="button"
                  className="rounded p-1.5 hover:bg-muted"
                  onClick={() => navigator.clipboard.writeText(color.hex).then(() => toast.success(color.hex))}
                  aria-label={`Copier ${color.hex}`}
                >
                  <Copy className="size-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("fonts")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {kit.fonts.map((font) => (
              <div key={font.id} className="rounded-lg border p-3">
                <p className="text-2xl" style={{ fontFamily: cssFontFamily(font.id) }}>
                  {font.name}
                </p>
                <p className="text-sm" style={{ fontFamily: cssFontFamily(font.id) }}>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éèàçô
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("licence", { licence: font.license })}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
