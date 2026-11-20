"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/common/button-link";
import { formatGnf } from "@/lib/format";
import type { Plan, PlanCode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlansGrid({
  plans,
  currentPlan,
  onSelect,
}: {
  plans: Plan[];
  currentPlan?: PlanCode;
  /** Sans gestionnaire, les boutons mènent à l'inscription (page publique). */
  onSelect?: (plan: Plan) => void;
}) {
  const t = useTranslations("marketing");
  const locale = useLocale();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {plans.map((plan) => {
        const current = currentPlan === plan.code;
        return (
          <article
            key={plan.code}
            className={cn(
              "glow-card bg-card relative flex flex-col rounded-2xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
              plan.highlighted &&
                "border-primary from-primary/5 to-card shadow-primary/10 ring-primary/20 bg-gradient-to-b shadow-lg ring-1",
            )}
          >
            {plan.highlighted && <Badge className="absolute -top-2.5 left-5">{t("pricing.popular")}</Badge>}
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{formatGnf(plan.priceGnf, locale)}</p>
            <p className="text-muted-foreground text-xs">
              {plan.interval ? t("pricing.perMonth") : plan.priceGnf ? t("pricing.oneOff") : " "}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t("pricing.members", { count: plan.maxMembers })}
            </p>
            <ul className="mt-4 grid flex-1 content-start gap-2 text-sm">
              {plan.features.map((feature) => {
                const [group, key] = feature.split(".") as [string, string];
                return (
                  <li key={feature} className="flex gap-2">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {t(`features.${group}.${key}` as "features.free.names")}
                  </li>
                );
              })}
            </ul>
            <div className="mt-5">
              {current ? (
                <Button variant="secondary" className="w-full" disabled>
                  {t("pricing.current")}
                </Button>
              ) : onSelect ? (
                plan.code !== "FREE" && (
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => onSelect(plan)}
                  >
                    {t("pricing.choose")}
                  </Button>
                )
              ) : (
                <ButtonLink
                  href="/inscription"
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {t("pricing.choose")}
                </ButtonLink>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
