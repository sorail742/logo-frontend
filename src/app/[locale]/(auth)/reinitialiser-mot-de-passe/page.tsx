import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/reinitialiser-mot-de-passe">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("reset.title"), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[locale]/reinitialiser-mot-de-passe">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
