"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { formatGnf } from "@/lib/format";
import { canAdmin } from "@/lib/permissions";
import { qk } from "@/lib/query-keys";
import { downloadBlob } from "@/lib/render/export";
import type { Payment } from "@/lib/types";
import { useSessionStore } from "@/stores/session";
import { ComingSoon } from "@/components/common/coming-soon";

function toCsv(payments: Payment[]) {
  const header = ["id", "date", "espace", "moyen", "montant_gnf", "statut", "offre"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = payments.map((p) => [p.id, p.createdAt, p.workspaceName ?? "", p.provider, String(p.amountGnf), p.status, p.planCode ?? ""].map(escape).join(";"));
  return [header.join(";"), ...rows].join("\n");
}

export default function AdminPaymentsPage() {
  return api.isAvailable("payments") ? <AdminPaymentsContent /> : <ComingSoon feature="payments" />;
}

function AdminPaymentsContent() {
  const t = useTranslations("admin.payments");
  const tb = useTranslations("billing.checkout.methods");
  const format = useFormatter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const role = useSessionStore((s) => s.user?.role);
  const canRefund = canAdmin("payments.refund", role);
  const { data: payments = [] } = useQuery({ queryKey: qk.admin("payments"), queryFn: api.admin.payments });
  const refund = useMutation({
    mutationFn: api.admin.refund,
    onSuccess: () => {
      toast.success(t("refunded"));
      queryClient.invalidateQueries({ queryKey: qk.admin("payments") });
    },
    onError,
  });

  return (
    <div className="grid gap-4">
      <Button variant="outline" className="justify-self-end" onClick={() => downloadBlob(new Blob(["﻿", toCsv(payments)], { type: "text/csv" }), "paiements.csv")} disabled={!payments.length}>
        <Download />
        {t("exportCsv")}
      </Button>
      {payments.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("workspace")}</TableHead>
                <TableHead>{t("provider")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="whitespace-nowrap">{format.dateTime(new Date(payment.createdAt), { dateStyle: "short", timeStyle: "short" })}</TableCell>
                  <TableCell>{payment.workspaceName}</TableCell>
                  <TableCell>{tb(payment.provider)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatGnf(payment.amountGnf, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "SUCCEEDED" ? "default" : payment.status === "FAILED" ? "destructive" : "secondary"}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canRefund && payment.status === "SUCCEEDED" && (
                      <Button variant="ghost" size="sm" onClick={() => window.confirm(t("refundConfirm")) && refund.mutate(payment.id)}>
                        {t("refund")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
