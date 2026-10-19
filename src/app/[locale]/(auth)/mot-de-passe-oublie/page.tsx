import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/mot-de-passe-oublie">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("forgot.title"), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[locale]/mot-de-passe-oublie">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ForgotPasswordForm />
  );
}
