import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]/app">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Coque cliente (session, URL) : rendue à la demande, sous Suspense (Cache Components).
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center" role="status" aria-busy="true" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
