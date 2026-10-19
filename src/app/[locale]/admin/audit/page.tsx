"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";

export default function AdminAuditPage() {
  const t = useTranslations("admin.audit");
  const format = useFormatter();
  const { data: entries = [] } = useQuery({ queryKey: qk.admin("audit"), queryFn: api.admin.auditLogs });
  if (!entries.length) return <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("actor")}</TableHead>
            <TableHead>{t("action")}</TableHead>
            <TableHead>{t("entity")}</TableHead>
            <TableHead>{t("ip")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap">{format.dateTime(new Date(entry.createdAt), { dateStyle: "short", timeStyle: "medium" })}</TableCell>
              <TableCell>{entry.actorName}</TableCell>
              <TableCell className="font-mono text-xs">{entry.action}</TableCell>
              <TableCell className="font-mono text-xs">
                {entry.entityType} · {entry.entityId.slice(0, 12)}
              </TableCell>
              <TableCell className="font-mono text-xs">{entry.ip}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
