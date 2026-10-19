import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { LocaleSwitcher } from "@/components/common/locale-switcher";
import { MockBanner } from "@/components/layout/mock-banner";

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <MockBanner />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Accueil">
          <PlatformLogo />
        </Link>
        <LocaleSwitcher />
      </header>
      <main id="contenu" className="flex flex-1 items-start justify-center bg-muted/30 px-4 py-10 sm:items-center">
        {children}
      </main>
    </>
  );
}
