import { Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { LocaleSwitcher } from "@/components/common/locale-switcher";
import { MockBanner } from "@/components/layout/mock-banner";
import { StudioShowcase } from "@/components/marketing/studio-showcase";

// Pages d'accès : formulaire à gauche, vitrine du Studio à droite (grands écrans).
export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing");
  return (
    <>
      <MockBanner />
      <div className="grid flex-1 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col">
          <header className="flex w-full items-center justify-between px-6 py-5">
            <Link href="/" aria-label="Accueil">
              <PlatformLogo />
            </Link>
            <LocaleSwitcher />
          </header>
          <main id="contenu" className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
            {children}
          </main>
        </div>
        <aside className="relative isolate hidden overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-center">
          <div className="absolute -top-24 -right-24 -z-10 size-96 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-32 -left-24 -z-10 size-96 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
          <div className="mx-auto w-full max-w-xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">{t("studio.kicker")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{t("studio.title")}</h2>
            <ul className="mt-5 grid gap-2 text-sm text-white/80">
              {(t.raw("bento.studio.points") as string[]).map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-300" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-10 [&_[role=group]_button]:text-white/70 [&_[role=group]_button[aria-pressed=true]]:bg-white/10 [&_[role=group]_button[aria-pressed=true]]:text-white">
              <StudioShowcase />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
