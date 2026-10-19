import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/connexion">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("login.title"), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[locale]/connexion">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
