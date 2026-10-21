import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VerifyEmail } from "@/components/auth/verify-email";

export async function generateMetadata({ params }: PageProps<"/[locale]/verifier-email">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("verifyEmail.title"), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[locale]/verifier-email">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
