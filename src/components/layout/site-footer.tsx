import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLogo } from "@/components/brand/platform-logo";

export function SiteFooter() {
  const t = useTranslations("common");
  return (
    <footer className="border-border/70 bg-muted/35 mt-auto border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-[2fr_1fr_1fr] sm:px-6">
        <div>
          <PlatformLogo />
          <p className="text-muted-foreground mt-3 max-w-sm text-sm">{t("footer.tagline")}</p>
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
      <p className="text-muted-foreground border-t py-4 text-center text-xs">
        {t("footer.rights", { year: 2026 })}
      </p>
    </footer>
  );
}
