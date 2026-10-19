import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/common/button-link";

export default function NotFound() {
  const t = useTranslations("common.notFound");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <p className="text-6xl font-semibold text-muted-foreground/50">404</p>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <ButtonLink href="/">{t("home")}</ButtonLink>
    </main>
  );
}
