"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatGnf } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import type { AdminStats, JobKind } from "@/lib/types";

// Taux indicatif pour estimer la marge ; la conversion réelle est faite côté API.
const GNF_PER_USD = 8600;

/** Une seule série : barres fines d'une teinte, infobulle au survol, axes discrets. */
function RevenueChart({ daily }: { daily: AdminStats["daily"] }) {
  const locale = useLocale();
  const format = useFormatter();
  const max = Math.max(...daily.map((d) => d.revenueGnf), 1);
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <div className="flex h-48 flex-col justify-between text-right text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
        <span>{formatGnf(max, locale)}</span>
        <span>{formatGnf(max / 2, locale)}</span>
        <span>0</span>
      </div>
      <div>
        <div className="relative flex h-48 items-end gap-0.5 border-b border-border" role="img" aria-label="Revenus par jour">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border/60" aria-hidden="true" />
          {daily.map((day) => (
            <div key={day.date} className="group relative flex h-full flex-1 items-end justify-center">
              <div className="w-full max-w-5 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80" style={{ height: `${(day.revenueGnf / max) * 100}%` }} />
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover:block">
                <p className="font-medium">{format.dateTime(new Date(day.date), { day: "numeric", month: "short" })}</p>
                <p>{formatGnf(day.revenueGnf, locale)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground" aria-hidden="true">
          <span>{format.dateTime(new Date(daily[0]!.date), { day: "numeric", month: "short" })}</span>
          <span>{format.dateTime(new Date(daily[daily.length - 1]!.date), { day: "numeric", month: "short" })}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const format = useFormatter();
  const { data } = useQuery({ queryKey: qk.admin("stats"), queryFn: api.admin.stats });

  if (!data) return <Skeleton className="h-96" />;
  const margin = data.revenueGnf - data.aiCostUsd * GNF_PER_USD;
  const tiles = [
    { label: t("stats.signups"), value: format.number(data.signups) },
    { label: t("stats.active"), value: format.number(data.activeUsers) },
    { label: t("stats.conversion"), value: format.number(data.conversionRate, { style: "percent", maximumFractionDigits: 1 }) },
    { label: t("stats.revenue"), value: formatGnf(data.revenueGnf, locale) },
    { label: t("stats.aiCost"), value: format.number(data.aiCostUsd, { style: "currency", currency: "USD" }) },
    { label: t("stats.margin"), value: formatGnf(margin, locale) },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <Card key={tile.label} size="sm">
            <CardHeader>
              <CardDescription className="text-xs">{tile.label}</CardDescription>
              <CardTitle className="text-xl tabular-nums">{tile.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("stats.dailyRevenue")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RevenueChart daily={data.daily} />
            <details>
              <summary className="cursor-pointer text-sm text-muted-foreground">{t("stats.showTable")}</summary>
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("stats.date")}</TableHead>
                    <TableHead className="text-right">{t("stats.revenueCol")}</TableHead>
                    <TableHead className="text-right">{t("stats.costCol")}</TableHead>
                    <TableHead className="text-right">{t("stats.generationsCol")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.daily.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{format.dateTime(new Date(day.date), { dateStyle: "medium" })}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatGnf(day.revenueGnf, locale)}</TableCell>
                      <TableCell className="text-right tabular-nums">{day.aiCostUsd.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">{day.generations}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </details>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("stats.generations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm">
              {(Object.entries(data.generations) as [JobKind, number][]).map(([kind, count]) => {
                const max = Math.max(...Object.values(data.generations));
                return (
                  <li key={kind} className="grid gap-1">
                    <div className="flex justify-between">
                      <span>{t(`jobs.${kind}`)}</span>
                      <span className="tabular-nums text-muted-foreground">{format.number(count)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
