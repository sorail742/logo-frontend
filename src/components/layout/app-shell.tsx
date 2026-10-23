"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  Coins,
  CreditCard,
  FolderKanban,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  WifiOff,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { LocaleSwitcher } from "@/components/common/locale-switcher";
import { MockBanner } from "./mock-banner";
import { api } from "@/lib/api";
import { isInternalRole } from "@/lib/permissions";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useCredits, useWorkspace } from "@/hooks/use-workspace";
import { useSessionStore } from "@/stores/session";

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function NavLinks({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const { can } = useWorkspace();
  const links = [
    { href: "/app", label: t("projects"), icon: FolderKanban, match: (p: string) => p === "/app" || p.startsWith("/app/projets") },
    ...(can("trash.view") ? [{ href: "/app/corbeille", label: t("trash"), icon: Trash2 }] : []),
    { href: "/app/espace", label: t("workspace"), icon: Users },
    { href: "/app/facturation", label: t("billing"), icon: CreditCard },
    { href: "/app/notifications", label: t("notifications"), icon: Bell },
    { href: "/app/profil", label: t("profile"), icon: UserRound },
  ];
  return (
    <nav className="grid gap-0.5" aria-label="Application">
      {links.map(({ href, label, icon: Icon, match }) => {
        const active = match ? match(pathname) : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-background font-medium text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-primary")} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
      {isInternalRole(user?.role) && (
        <Link href="/admin" onClick={onNavigate} className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t("admin")}
        </Link>
      )}
    </nav>
  );
}

function WorkspaceSwitcher() {
  const t = useTranslations("app.nav");
  const tc = useTranslations("common.roles");
  const { workspaces, workspace } = useWorkspace();
  const setWorkspace = useSessionStore((s) => s.setWorkspace);
  const router = useRouter();
  if (!workspace) return <Skeleton className="h-10 w-full" />;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
          />
        }
      >
        <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{workspace.name}</span>
          <span className="block text-xs text-muted-foreground">{tc(workspace.role)}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("workspaces")}</DropdownMenuLabel>
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onClick={() => setWorkspace(w.id)}>
              <span className="flex-1 truncate">{w.name}</span>
              {w.id === workspace.id && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/app/espace?nouveau=1")}>
          <Plus className="size-4" />
          {t("createWorkspace")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreditsBadge() {
  const t = useTranslations("app.shell");
  const { data } = useCredits();
  return (
    <Link href="/app/facturation" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted" title={t("buyCredits")}>
      <Coins className="size-4 text-brand-accent" aria-hidden="true" />
      {data ? t("credits", { count: data.balance }) : "…"}
    </Link>
  );
}

/** Solde de crédits en pied de barre latérale, avec accès à la recharge. */
function SidebarCredits({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const t = useTranslations("app.shell");
  const { data } = useCredits();
  return (
    <div className="mt-auto rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-amber-400/10 p-4 ring-1 ring-primary/10">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Coins className="size-3.5 text-brand-accent" aria-hidden="true" />
        {t("creditsCard")}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{data ? data.balance : "…"}</p>
      <Link href="/app/facturation" onClick={onNavigate} className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
        {t("topUp")} →
      </Link>
    </div>
  );
}

function NotificationsBell() {
  const t = useTranslations("app.nav");
  const { data } = useQuery({ queryKey: qk.notifications, queryFn: api.notifications.list, refetchInterval: 60_000 });
  const unread = data?.filter((n) => !n.readAt).length ?? 0;
  return (
    <Link href="/app/notifications" className="relative rounded-lg p-2 hover:bg-muted" aria-label={`${t("notifications")} (${unread})`}>
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const t = useTranslations("app.nav");
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = async () => {
    await api.auth.logout();
    queryClient.clear();
    setUser(null);
    router.replace("/connexion");
  };
  const initials = user?.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-label={user?.fullName ?? t("profile")}
          />
        }
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate">{user?.fullName}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/app/profil")}>
          <UserRound className="size-4" />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void logout()}>
          <LogOut className="size-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Garde côté client : l'API (guards NestJS) reste la seule autorité. */
export function useRequireAuth() {
  const status = useSessionStore((s) => s.status);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (status === "anonymous") router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);
  return status;
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const t = useTranslations("app");
  const status = useRequireAuth();
  const online = useOnline();
  const [menuOpen, setMenuOpen] = useState(false);
  const { workspace } = useWorkspace();

  if (status !== "authenticated") {
    return (
      <output className="flex flex-1 items-center justify-center p-10">
        <Skeleton className="h-8 w-48" />
      </output>
    );
  }

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link href="/app" onClick={onNavigate} className="px-1">
        <PlatformLogo />
      </Link>
      <WorkspaceSwitcher />
      <Button render={<Link href="/app/projets/nouveau" onClick={onNavigate} />} nativeButton={false} size="lg">
        <Plus />
        {t("nav.newProject")}
      </Button>
      <NavLinks onNavigate={onNavigate} />
      <SidebarCredits onNavigate={onNavigate} />
    </div>
  );

  return (
    <div className="flex min-h-svh flex-col">
      <MockBanner />
      {!online && (
        <output className="flex items-center gap-2 bg-muted px-4 py-2 text-xs">
          <WifiOff className="size-3.5" aria-hidden="true" />
          <OfflineNotice />
        </output>
      )}
      <div className="flex flex-1">
        <aside className="no-print sticky top-0 hidden h-svh w-64 shrink-0 border-r bg-sidebar lg:block">{sidebar()}</aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <Menu />
            </Button>
            <div className="ml-auto flex items-center gap-1.5">
              <CreditsBadge />
              <LocaleSwitcher />
              <NotificationsBell />
              <UserMenu />
            </div>
          </header>
          {workspace?.role === "VIEWER" && (
            <p className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">{t("shell.readOnly")}</p>
          )}
          <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          {sidebar(() => setMenuOpen(false))}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OfflineNotice() {
  const t = useTranslations("common");
  return <span>{t("offline")}</span>;
}
