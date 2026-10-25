"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api, newIdempotencyKey } from "@/lib/api";
import { formatGnf } from "@/lib/format";
import type { PaymentProvider, Plan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ComingSoon } from "@/components/common/coming-soon";

type Phase = "form" | "pending" | "succeeded" | "failed";

export function CheckoutDialog({ plan, workspaceId, onClose }: Readonly<{ plan: Plan | null; workspaceId: string; onClose: () => void }>) {
  const t = useTranslations("billing.checkout");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const [provider, setProvider] = useState<PaymentProvider>("ORANGE_MONEY");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [phone, setPhone] = useState("+224 ");
  const [phase, setPhase] = useState<Phase>("form");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);
  // Une clé par tentative : un double clic ne crée pas deux paiements (PAY-03)
  const idempotencyKey = useMemo(() => newIdempotencyKey(), [plan, provider, interval]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "pending" || !paymentId) return;
    const poll = async () => {
      try {
        const payment = await api.billing.payment(paymentId);
        if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
          setPhase(payment.status === "SUCCEEDED" ? "succeeded" : "failed");
          queryClient.invalidateQueries({ queryKey: ["workspaces"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      } catch {
        // Nouvelle tentative au prochain intervalle
      }
    };
    const timer = window.setInterval(() => void poll(), 1500);
    return () => window.clearInterval(timer);
  }, [phase, paymentId, queryClient]);

  if (!plan) return null;
  const amount = plan.interval && interval === "year" ? (plan.priceGnf ?? 0) * 10 : (plan.priceGnf ?? 0);

  const pay = async () => {
    try {
      const result = await api.billing.checkout(workspaceId, { planCode: plan.code, provider, phone: phone.replace(/\s/g, ""), interval: plan.interval ? interval : undefined }, idempotencyKey);
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      setPaymentId(result.paymentId);
      setInstructions(result.instructions ?? null);
      setPhase(result.status === "SUCCEEDED" ? "succeeded" : result.status === "FAILED" ? "failed" : "pending");
    } catch (error) {
      onError(error);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { plan: plan.name })}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t("secure")}
          </DialogDescription>
        </DialogHeader>

        {!api.isAvailable("payments") && <ComingSoon feature="payments" />}

        {phase === "form" && api.isAvailable("payments") && (
          <div className="grid gap-4">
            {plan.interval && (
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-medium">{t("interval")}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["month", "year"] as const).map((value) => (
                    <label key={value} className={cn("cursor-pointer rounded-lg border px-3 py-2 text-sm", interval === value ? "border-primary bg-accent" : "hover:bg-muted")}>
                      <input type="radio" className="sr-only" checked={interval === value} onChange={() => setInterval(value)} />
                      {value === "month" ? t("monthly") : t("yearly")}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium">{t("method")}</legend>
              {(["ORANGE_MONEY", "MOBILE_MONEY_AGGREGATOR", "CARD"] as const).map((value) => (
                <label key={value} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm", provider === value ? "border-primary bg-accent" : "hover:bg-muted")}>
                  <input type="radio" className="sr-only" checked={provider === value} onChange={() => setProvider(value)} />
                  <span className={cn("size-3 rounded-full border-2", provider === value ? "border-primary bg-primary" : "border-muted-foreground")} aria-hidden="true" />
                  {t(`methods.${value}`)}
                  {value === "ORANGE_MONEY" && <span className="ml-auto size-5 rounded bg-[#ff7900]" aria-hidden="true" />}
                </label>
              ))}
            </fieldset>
            {provider === "CARD" ? (
              <p className="text-sm text-muted-foreground">{t("cardUnavailable")}</p>
            ) : (
              <Field label={t("phone")} htmlFor="mm-phone" hint={t("phoneHint")}>
                <Input id="mm-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
            )}
            <p className="flex items-baseline justify-between border-t pt-3 text-sm">
              {t("amount")}
              <span className="text-xl font-semibold">{formatGnf(amount, locale)}</span>
            </p>
          </div>
        )}

        {phase === "pending" && (
          <output className="grid justify-items-center gap-3 py-6 text-center">
            <Smartphone className="size-10 text-[#ff7900]" aria-hidden="true" />
            <p className="flex items-center gap-2 font-medium">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("pending")}
            </p>
            <p className="text-sm text-muted-foreground">{instructions ?? t("pendingBody")}</p>
          </output>
        )}
        {phase === "succeeded" && (
          <output className="flex items-center gap-2 py-6 font-medium text-emerald-700">
            <CheckCircle2 className="size-5" aria-hidden="true" />
            {t("succeeded")}
          </output>
        )}
        {phase === "failed" && (
          <p className="flex items-center gap-2 py-6 font-medium text-destructive" role="alert">
            <XCircle className="size-5" aria-hidden="true" />
            {t("failed")}
          </p>
        )}

        <DialogFooter>
          {phase === "form" ? (
            <Button size="lg" onClick={() => void pay()} disabled={provider === "CARD"}>
              {t("pay", { amount: formatGnf(amount, locale) })}
            </Button>
          ) : (
            phase !== "pending" && (
              <Button variant="outline" onClick={onClose}>
                OK
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
