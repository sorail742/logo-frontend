import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { PlansGrid } from "@/components/billing/plans-grid";
import { CREDIT_COSTS } from "@/lib/credits";
import { PLANS } from "@/lib/plans";

export async function generateMetadata({ params }: PageProps<"/[locale]/tarifs">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.pricing" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PricingPage({ params }: PageProps<"/[locale]/tarifs">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing");
  const tc = await getTranslations("common");

  return (
    <div className="relative isolate">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            {t("pricing.kicker")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {t("pricing.title")}
          </h1>
          <p className="text-muted-foreground mt-4 text-pretty">{t("pricing.subtitle")}</p>
          <p className="text-muted-foreground mt-2 text-xs">{t("pricing.provisional")}</p>
        </div>
        <div className="border-primary/15 bg-primary/5 mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border p-4">
          <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">{t("pricing.studioIncluded")}</p>
            <p className="text-muted-foreground text-sm">{t("pricing.studioIncludedBody")}</p>
          </div>
        </div>
        <div className="mt-10">
          <PlansGrid plans={PLANS} />
        </div>

        <section className="mt-14 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">{t("pricing.costsTitle")}</h2>
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y">
                {(Object.entries(CREDIT_COSTS) as [keyof typeof CREDIT_COSTS, number][]).map(
                  ([action, cost]) => (
                    <tr key={action}>
                      <td className="py-2">{t(`costs.${action}`)}</td>
                      <td className="py-2 text-right font-medium tabular-nums">
                        {cost === 0 ? tc("free") : tc("credits", { count: cost })}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{t("pricing.faqTitle")}</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              {(["1", "2", "3", "4"] as const).map((n) => (
                <div key={n}>
                  <dt className="font-medium">{t(`pricing.faq.q${n}`)}</dt>
                  <dd className="text-muted-foreground mt-1">{t(`pricing.faq.a${n}`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
