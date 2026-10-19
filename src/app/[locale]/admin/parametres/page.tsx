"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatGnf } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings");
  const locale = useLocale();
  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">{t("readOnlyNote")}</p>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("plans")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Crédits</TableHead>
                <TableHead className="text-right">Membres</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLANS.map((plan) => (
                <TableRow key={plan.code}>
                  <TableCell className="font-mono">{plan.code}</TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell className="text-right">{formatGnf(plan.priceGnf, locale)}</TableCell>
                  <TableCell className="text-right">{plan.monthlyCredits || plan.includedCredits}</TableCell>
                  <TableCell className="text-right">{plan.maxMembers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("tax")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t("taxValue")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              {t("maintenance")}
              <Switch disabled aria-label={t("maintenance")} />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
