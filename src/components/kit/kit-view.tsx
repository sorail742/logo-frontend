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

/**
 * Page du kit (KIT-01). Le contenu figé de la version (nom, sigle, origine) prime sur celui du
 * projet, qui sert de repli pour les kits qui n'en ont pas.
 */
export function KitView({
  kit,
  projectName,
  acronym,
  meaning,
}: {
  kit: BrandKit;
  projectName: string;
  acronym?: string | null;
  meaning?: string | null;
}) {
  const t = useTranslations("kit");
  const tv = useTranslations("logos.variants");
  // Logo importé non retravaillé : son SVG d'origine (nettoyé par l'API) fait foi, sans variantes.
  const spec = kit.logoSvg ? null : kit.logoSpec;
  const mainSvg = kit.logoSvg ?? (spec ? renderLogoSvg(spec).svg : null);
  // Une version figée fait foi même sans sigle ni origine (nom saisi) : pas de repli sur le projet.
  const frozen = kit.name !== null;
  const name = kit.name ?? projectName;
  const shownAcronym = frozen ? kit.acronym : acronym;
  const shownMeaning = frozen ? kit.meaning : meaning;

  return (
    <div className="grid gap-6">
      <Card className="glow-card glow-card-3d glow-card-shimmer border-border/80 hover:border-primary/50 shadow-xs hover:shadow-xl">
        <CardContent className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div className="grid gap-2">
            <p className="text-muted-foreground text-xs">{t("name")}</p>
            <p className="text-3xl font-semibold tracking-tight">{name}</p>
            {shownAcronym && shownAcronym !== name && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t("acronym")} : </span>
                {shownAcronym}
              </p>
            )}
            {shownMeaning && <p className="text-muted-foreground text-sm">{shownMeaning}</p>}
            <p className="text-muted-foreground mt-2 text-xs">{t("slogan")}</p>
            <p className="text-lg italic">{kit.slogan ?? t("noSlogan")}</p>
            {kit.devise && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t("devise")} : </span>
                {kit.devise}
              </p>
            )}
            {kit.mission && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t("mission")} : </span>
                {kit.mission}
              </p>
            )}
          </div>
          {mainSvg && (
            <SvgView
              svg={mainSvg}
              label={name}
              className="studio-stage border-border/60 aspect-[16/9] rounded-xl border p-6 shadow-inner transition-transform duration-300 hover:scale-[1.02]"
            />
          )}
        </CardContent>
      </Card>

      {spec && (
        <Card className="glow-card border-border/80 hover:border-primary/40 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm">{t("logo")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LOGO_VARIANTS.map((variant) => (
              <figure key={variant.id} className="grid gap-1">
                <SvgView
                  svg={
                    renderLogoSvg(spec, {
                      variant: variant.variant,
                      layout: variant.layout,
                      withBackground: false,
                    }).svg
                  }
                  className={
                    variant.dark
                      ? "aspect-[3/2] rounded-lg bg-neutral-900 p-3"
                      : "bg-checker aspect-[3/2] rounded-lg p-3"
                  }
                />
                <figcaption className="text-muted-foreground text-center text-xs">
                  {tv(variant.id)}
                </figcaption>
              </figure>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glow-card border-border/80 hover:border-primary/40 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm">{t("palette")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {kit.palette.map((color) => (
              <div
                key={color.role}
                className="group border-border/70 bg-card/60 hover:border-primary/30 hover:bg-muted/40 flex items-center gap-3 rounded-xl border p-2.5 transition-colors"
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-md text-[10px] font-medium ring-1 ring-black/10"
                  style={{ background: color.hex, color: readableOn(color.hex) }}
                >
                  Aa
                </span>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="text-sm font-medium">
                    {t(`colorRoles.${color.role}` as "colorRoles.primary")}
                  </p>
                  <p className="font-mono">HEX {color.hex}</p>
                  <p className="text-muted-foreground font-mono">RGB {color.rgb}</p>
                  <p className="text-muted-foreground font-mono">CMJN {color.cmyk}</p>
                </div>
                <button
                  type="button"
                  className="hover:bg-muted rounded p-1.5"
                  onClick={() =>
                    navigator.clipboard.writeText(color.hex).then(() => toast.success(color.hex))
                  }
                  aria-label={`Copier ${color.hex}`}
                >
                  <Copy className="size-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glow-card border-border/80 hover:border-primary/40 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm">{t("fonts")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {kit.fonts.map((font) => (
              <div
                key={font.id}
                className="border-border/70 bg-card/60 hover:border-primary/30 rounded-xl border p-3.5 transition-colors"
              >
                <p className="text-2xl" style={{ fontFamily: cssFontFamily(font.id) }}>
                  {font.name}
                </p>
                <p className="text-sm" style={{ fontFamily: cssFontFamily(font.id) }}>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éèàçô
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("licence", { licence: font.license })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
