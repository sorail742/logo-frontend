import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">{t("pricing.title")}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t("pricing.subtitle")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("pricing.provisional")}</p>
      <div className="mt-8">
        <PlansGrid plans={PLANS} />
      </div>

      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">{t("pricing.costsTitle")}</h2>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y">
              {(Object.entries(CREDIT_COSTS) as [keyof typeof CREDIT_COSTS, number][]).map(([action, cost]) => (
                <tr key={action}>
                  <td className="py-2">{t(`costs.${action}`)}</td>
                  <td className="py-2 text-right font-medium tabular-nums">{cost === 0 ? tc("free") : tc("credits", { count: cost })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t("pricing.faqTitle")}</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            {(["1", "2", "3", "4"] as const).map((n) => (
              <div key={n}>
                <dt className="font-medium">{t(`pricing.faq.q${n}`)}</dt>
                <dd className="mt-1 text-muted-foreground">{t(`pricing.faq.a${n}`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
