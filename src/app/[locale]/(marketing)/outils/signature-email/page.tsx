import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicEmailSignature } from "@/components/tools/public-email-signature";

export async function generateMetadata({ params }: PageProps<"/[locale]/outils/signature-email">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.emailTool" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function EmailToolPage({ params }: PageProps<"/[locale]/outils/signature-email">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing.emailTool");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-8 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      <PublicEmailSignature />
    </div>
  );
}
