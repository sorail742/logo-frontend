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
          <article key={plan.code} className={cn("relative flex flex-col rounded-xl border bg-card p-5", plan.highlighted && "border-primary shadow-md")}>
            {plan.highlighted && <Badge className="absolute -top-2.5 left-5">{t("pricing.popular")}</Badge>}
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{formatGnf(plan.priceGnf, locale)}</p>
            <p className="text-xs text-muted-foreground">{plan.interval ? t("pricing.perMonth") : plan.priceGnf ? t("pricing.oneOff") : " "}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("pricing.members", { count: plan.maxMembers })}</p>
            <ul className="mt-4 grid flex-1 content-start gap-2 text-sm">
              {plan.features.map((feature) => {
                const [group, key] = feature.split(".") as [string, string];
                return (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
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
                  <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} onClick={() => onSelect(plan)}>
                    {t("pricing.choose")}
                  </Button>
                )
              ) : (
                <ButtonLink href="/inscription" className="w-full" variant={plan.highlighted ? "default" : "outline"}>
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
