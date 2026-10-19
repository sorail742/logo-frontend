import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NameTry } from "@/components/tools/name-try";

export async function generateMetadata({ params }: PageProps<"/[locale]/outils/generateur-de-noms">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.nameTool" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function NameToolPage({ params }: PageProps<"/[locale]/outils/generateur-de-noms">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing.nameTool");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-8 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      <NameTry />
    </div>
  );
}
