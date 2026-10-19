"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SvgView } from "@/components/brand/svg-view";
import { EmptyState } from "@/components/common/empty-state";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { ComingSoon } from "@/components/common/coming-soon";

export default function AdminModerationPage() {
  return api.isAvailable("moderation") ? <AdminModerationContent /> : <ComingSoon feature="moderation" />;
}

function AdminModerationContent() {
  const t = useTranslations("admin.moderation");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data: items = [] } = useQuery({ queryKey: qk.admin("moderation"), queryFn: api.admin.moderation });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "APPROVE" | "REJECT" }) => api.admin.review(id, decision, notes[id] ?? ""),
    onSuccess: () => {
      toast.success(t("done"));
      queryClient.invalidateQueries({ queryKey: qk.admin("moderation") });
    },
    onError,
  });

  if (!items.length) return <EmptyState icon={ShieldCheck} title={t("empty")} />;

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="grid gap-3 rounded-xl border bg-card p-4">
          {item.previewSvg && <SvgView svg={item.previewSvg} className="bg-checker h-48 rounded-lg p-3" />}
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">{item.reason}</p>
            <p className="text-xs text-muted-foreground">
              {item.workspaceName} · {format.dateTime(new Date(item.createdAt), { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <Input value={notes[item.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))} placeholder={t("note")} aria-label={t("note")} />
          <div className="flex gap-2">
            <Button onClick={() => review.mutate({ id: item.id, decision: "APPROVE" })} disabled={review.isPending}>
              {t("approve")}
            </Button>
            <Button variant="destructive" onClick={() => review.mutate({ id: item.id, decision: "REJECT" })} disabled={review.isPending || !notes[item.id]?.trim()}>
              {t("reject")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
