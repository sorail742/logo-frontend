import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { MockBanner } from "@/components/layout/mock-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default async function MarketingLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <MockBanner />
      <Suspense fallback={<div className="h-14 border-b" />}>
        <SiteHeader />
      </Suspense>
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
