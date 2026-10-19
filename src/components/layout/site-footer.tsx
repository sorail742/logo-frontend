import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLogo } from "@/components/brand/platform-logo";

export function SiteFooter() {
  const t = useTranslations("common");
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <PlatformLogo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <nav className="grid content-start gap-2 text-sm" aria-label={t("nav.tools")}>
          <span className="font-medium">{t("nav.tools")}</span>
          <Link href="/outils/generateur-de-noms" className="text-muted-foreground hover:text-foreground">
            {t("nav.nameTool")}
          </Link>
          <Link href="/outils/signature-email" className="text-muted-foreground hover:text-foreground">
            {t("nav.emailTool")}
          </Link>
          <Link href="/tarifs" className="text-muted-foreground hover:text-foreground">
            {t("nav.pricing")}
          </Link>
        </nav>
        <nav className="grid content-start gap-2 text-sm" aria-label={t("footer.legal")}>
          <span className="font-medium">{t("footer.legal")}</span>
          <Link href="/legal/cgu" className="text-muted-foreground hover:text-foreground">
            {t("footer.terms")}
          </Link>
          <Link href="/legal/confidentialite" className="text-muted-foreground hover:text-foreground">
            {t("footer.privacy")}
          </Link>
          <a href="mailto:contact@exemple.gn" className="text-muted-foreground hover:text-foreground">
            {t("footer.contact")}
          </a>
        </nav>
      </div>
      <p className="border-t py-4 text-center text-xs text-muted-foreground">{t("footer.rights", { year: 2026 })}</p>
    </footer>
  );
}
