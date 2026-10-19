import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/inscription">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("register.title"), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[locale]/inscription">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RegisterForm />
  );
}
