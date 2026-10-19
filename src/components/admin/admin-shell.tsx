"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { ButtonLink } from "@/components/common/button-link";
import { EmptyState } from "@/components/common/empty-state";
import { useRequireAuth } from "@/components/layout/app-shell";
import { MockBanner } from "@/components/layout/mock-banner";
import { canAccessAdmin, isInternalRole, type AdminSection } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";

const SECTIONS: { id: AdminSection; path: string }[] = [
  { id: "dashboard", path: "/admin" },
  { id: "users", path: "/admin/utilisateurs" },
  { id: "payments", path: "/admin/paiements" },
  { id: "moderation", path: "/admin/moderation" },
  { id: "library", path: "/admin/bibliotheque" },
  { id: "ai", path: "/admin/ia" },
  { id: "settings", path: "/admin/parametres" },
  { id: "audit", path: "/admin/audit" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const status = useRequireAuth();
  const user = useSessionStore((s) => s.user);
  const pathname = usePathname();

  if (status !== "authenticated" || !user) return <Skeleton className="m-10 h-8 w-48" />;
  if (!isInternalRole(user.role)) {
    return (
      <div className="p-10">
        <EmptyState icon={ShieldAlert} title={t("denied")} action={<ButtonLink href="/app">{t("backToApp")}</ButtonLink>} />
      </div>
    );
  }
  // Double authentification obligatoire pour les rôles internes (CPT-05) ; l'API le vérifie aussi.
  if (!user.totpEnabled) {
    return (
      <div className="p-10">
        <EmptyState icon={ShieldAlert} title={t("require2fa")} action={<ButtonLink href="/app/profil">{t("enable2fa")}</ButtonLink>} />
      </div>
    );
  }

  const sections = SECTIONS.filter((s) => canAccessAdmin(user.role, s.id));
  const current = [...sections].reverse().find((s) => (s.path === "/admin" ? pathname === "/admin" : pathname.startsWith(s.path)));
  const allowed = current ? canAccessAdmin(user.role, current.id) : true;

  return (
    <div className="flex min-h-svh flex-col">
      <MockBanner />
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <PlatformLogo />
        <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background">{t("title")}</span>
        <Link href="/app" className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("backToApp")}
        </Link>
      </header>
      <nav className="overflow-x-auto border-b px-4" aria-label={t("title")}>
        <ul className="flex min-w-max gap-1">
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                href={section.path}
                aria-current={current?.id === section.id ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-3 py-2.5 text-sm",
                  current?.id === section.id ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`nav.${section.id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <p className="mb-4 text-xs text-muted-foreground">{t("audited")}</p>
        {allowed ? children : <EmptyState icon={ShieldAlert} title={t("denied")} />}
      </main>
    </div>
  );
}
