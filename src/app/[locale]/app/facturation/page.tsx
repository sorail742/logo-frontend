"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Coins, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/page-header";
import { CheckoutDialog } from "@/components/billing/checkout-dialog";
import { PlansGrid } from "@/components/billing/plans-grid";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useCredits, useWorkspace } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { formatGnf } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import type { Plan } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const t = useTranslations("billing");
  const tm = useTranslations("marketing");
  const format = useFormatter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { workspace, can } = useWorkspace();
  const credits = useCredits();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [promo, setPromo] = useState("");
  const proofInput = useRef<HTMLInputElement>(null);
  const isOwner = can("billing.manage");
  const wid = workspace?.id ?? "none";

  const { data: plans = [] } = useQuery({ queryKey: qk.plans, queryFn: api.billing.plans });
  const { data: ledger = [] } = useQuery({ queryKey: qk.ledger(wid), queryFn: () => api.billing.ledger(wid), enabled: Boolean(workspace) && isOwner });
  const { data: invoices = [] } = useQuery({ queryKey: qk.invoices(wid), queryFn: () => api.billing.invoices(wid), enabled: Boolean(workspace) && isOwner });

  const applyPromo = useMutation({
    mutationFn: () => api.billing.applyPromo(wid, promo),
    onSuccess: ({ credits }) => {
      toast.success(t("promoApplied", { credits }));
      setPromo("");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError,
  });
  const sendProof = useMutation({
    mutationFn: (file: File) => api.billing.sendAssociationProof(wid, file),
    onSuccess: () => toast.success(t("associationSent")),
    onError,
  });
  const cancel = useMutation({
    mutationFn: () => api.billing.cancelSubscription(wid),
    onSuccess: () => toast.success(t("canceled")),
    onError,
  });

  const planName = plans.find((p) => p.code === credits.data?.planCode)?.name ?? credits.data?.planCode;
  const subscribed = plans.find((p) => p.code === credits.data?.planCode)?.interval;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>{t("balance")}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Coins className="size-7 text-brand-accent" aria-hidden="true" />
              {credits.data?.balance ?? "…"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("plan")}</CardDescription>
            <CardTitle className="text-3xl">{planName ?? "…"}</CardTitle>
            {credits.data?.renewsAt && <CardDescription>{t("renews", { date: format.dateTime(new Date(credits.data.renewsAt), { dateStyle: "long" }) })}</CardDescription>}
          </CardHeader>
          {subscribed && isOwner && (
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => window.confirm(t("cancelConfirm")) && cancel.mutate()}>
                {t("cancel")}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {!isOwner ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{t("ownerOnly")}</p>
      ) : (
        <div className="grid gap-8">
          <section>
            <h2 className="mb-1 text-lg font-semibold">{t("plans")}</h2>
            <p className="mb-4 text-xs text-muted-foreground">{tm("pricing.provisional")}</p>
            <PlansGrid plans={plans} currentPlan={credits.data?.planCode} onSelect={setSelected} />
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("promo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (promo.trim()) applyPromo.mutate();
                  }}
                >
                  <Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} aria-label={t("promo")} placeholder="BIENVENUE" />
                  <Button type="submit" variant="outline" disabled={applyPromo.isPending}>
                    {t("promoApply")}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("association")}</CardTitle>
                <CardDescription className="text-xs">{t("associationBody")}</CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={proofInput}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) sendProof.mutate(file);
                  }}
                />
                <Button variant="outline" onClick={() => proofInput.current?.click()} disabled={sendProof.isPending}>
                  <FileUp />
                  {t("associationSend")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("ledger")}</h2>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ledgerEmpty")}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("columns.date")}</TableHead>
                      <TableHead>{t("columns.reason")}</TableHead>
                      <TableHead>{t("columns.note")}</TableHead>
                      <TableHead className="text-right">{t("columns.delta")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">{format.dateTime(new Date(entry.createdAt), { dateStyle: "short", timeStyle: "short" })}</TableCell>
                        <TableCell>{t(`reasons.${entry.reason}`)}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.note}</TableCell>
                        <TableCell className={cn("text-right font-medium tabular-nums", entry.delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "")}>
                          {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("invoices")}</h2>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("invoicesEmpty")}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoice.number")}</TableHead>
                      <TableHead>{t("invoice.date")}</TableHead>
                      <TableHead className="text-right">{t("invoice.amount")}</TableHead>
                      <TableHead className="text-right">{t("invoice.tax")}</TableHead>
                      <TableHead>{t("invoice.pdf")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.number}</TableCell>
                        <TableCell>{format.dateTime(new Date(invoice.issuedAt), { dateStyle: "medium" })}</TableCell>
                        <TableCell className="text-right">{formatGnf(invoice.amountGnf, locale)}</TableCell>
                        <TableCell className="text-right">{formatGnf(invoice.taxGnf, locale)}</TableCell>
                        <TableCell>{invoice.pdfUrl ? <a href={invoice.pdfUrl} className="text-primary hover:underline">PDF</a> : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      )}

      {workspace && <CheckoutDialog key={selected?.code ?? "none"} plan={selected} workspaceId={workspace.id} onClose={() => setSelected(null)} />}
    </>
  );
}
