"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ButtonLink } from "@/components/common/button-link";
import { LocaleSwitcher } from "@/components/common/locale-switcher";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { useSessionStore } from "@/stores/session";

export function SiteHeader() {
  const t = useTranslations("common.nav");
  const status = useSessionStore((s) => s.status);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/#fonctionnalites", label: t("features") },
    { href: "/#studio", label: t("studio") },
    { href: "/tarifs", label: t("pricing") },
    { href: "/outils/generateur-de-noms", label: t("nameTool") },
    { href: "/outils/signature-email", label: t("emailTool") },
  ];

  const account =
    status === "authenticated" ? (
      <ButtonLink href="/app" size="lg">
        {t("dashboard")}
      </ButtonLink>
    ) : (
      <>
        <ButtonLink href="/connexion" variant="ghost" size="lg">
          {t("login")}
        </ButtonLink>
        <ButtonLink href="/inscription" size="lg">
          {t("signup")}
        </ButtonLink>
      </>
    );

  return (
    <header className="border-border/70 bg-background/88 sticky top-0 z-40 border-b backdrop-blur-xl">
      <a
        href="#contenu"
        className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:p-2"
      >
        {t("skip")}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link href="/" aria-label="Accueil">
          <PlatformLogo />
        </Link>
        <nav aria-label="Navigation principale" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-2 text-sm transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          {account}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Menu"
        >
          <Menu />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              <PlatformLogo />
            </SheetTitle>
          </SheetHeader>
          <nav className="grid gap-1 px-4" aria-label="Navigation mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="hover:bg-muted rounded-md px-3 py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid gap-2 p-4">
            {account}
            <LocaleSwitcher />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
