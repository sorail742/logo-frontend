"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { VisualGallery } from "@/components/brand/visual-gallery";
import { slugify } from "@/lib/format";
import { brandAssets, socialSvg, SOCIAL_KIT } from "@/lib/render/logo-assets";
import type { LogoSpec } from "@/lib/types";

/** Kit réseaux sociaux : chaque format aperçu à sa proportion réelle, téléchargeable en PNG. */
export function SocialKitSection({ spec, name, canDownload, isFree }: { spec: LogoSpec; name: string; canDownload: boolean; isFree: boolean }) {
  const t = useTranslations("kit.social");
  const tFormat = useTranslations("logos.export.socialFormats");
  const base = slugify(name) || "marque";
  const assets = useMemo(() => brandAssets(spec), [spec]);
  const visuals = SOCIAL_KIT.map((format) => ({
    id: format.id,
    label: tFormat(format.id, { size: `${format.width} × ${format.height}` }),
    file: `${base}-${format.file}`,
    width: format.width,
    height: format.height,
    render: () => socialSvg(spec, format, assets),
  }));
  return (
    <VisualGallery
      title={t("title")}
      description={isFree ? t("free") : t("body")}
      visuals={visuals}
      source={spec}
      canDownload={canDownload && !isFree}
      labels={{ download: t("download"), done: t("done") }}
    />
  );
}
