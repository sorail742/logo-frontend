import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import type { ApiFeature } from "@/lib/api";

/** Module pas encore servi par l'API (phases 4 à 6 du planning). */
export function ComingSoon({ feature, title }: { feature: ApiFeature; title?: string }) {
  const t = useTranslations("common.comingSoon");
  return (
    <>
      {title && <PageHeader title={title} />}
      <EmptyState icon={Clock} title={t("title")} description={t(feature)} />
    </>
  );
}
