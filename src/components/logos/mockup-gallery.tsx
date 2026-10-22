"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { VisualGallery } from "@/components/brand/visual-gallery";
import { slugify } from "@/lib/format";
import { brandAssets, MOCKUP_HEIGHT, MOCKUP_SCENES, MOCKUP_WIDTH, mockupSceneSvg } from "@/lib/render/logo-assets";
import type { LogoSpec } from "@/lib/types";

/**
 * Mises en situation : devanture, t-shirt, mugs, cartes, téléphone, véhicule, sacs, stand.
 * `showcase` : page publique du kit, en consultation seule.
 */
export function MockupGallery({ spec, canDownload, isFree, showcase = false }: { spec: LogoSpec; canDownload: boolean; isFree: boolean; showcase?: boolean }) {
  const t = useTranslations("logos.scenes");
  const base = slugify(spec.text) || "logo";
  const assets = useMemo(() => brandAssets(spec), [spec]);
  const visuals = MOCKUP_SCENES.map((scene) => ({
    id: scene.id,
    label: t(`items.${scene.id}`),
    file: `${base}-${scene.file}`,
    width: MOCKUP_WIDTH,
    height: MOCKUP_HEIGHT,
    render: () => mockupSceneSvg(spec, scene, assets),
    type: "image/jpeg" as const,
  }));
  return (
    <VisualGallery
      title={t("title")}
      description={showcase ? t("showcase") : isFree ? t("free") : t("body")}
      visuals={visuals}
      source={spec}
      canDownload={canDownload && !isFree}
      labels={{ download: t("download"), done: t("done") }}
    />
  );
}
