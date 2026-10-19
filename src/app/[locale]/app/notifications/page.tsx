"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { Bell, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const t = useTranslations("app.notifications");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: qk.notifications, queryFn: api.notifications.list });
  const markRead = useMutation({
    mutationFn: api.notifications.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.notifications }),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("title")} />
      {data.length === 0 ? (
        <EmptyState icon={Bell} title={t("empty")} />
      ) : (
        <ul className="divide-y rounded-xl border">
          {data.map((notification) => (
            <li key={notification.id} className={cn("flex items-start gap-3 p-4", !notification.readAt && "bg-accent/40")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", notification.readAt ? "bg-transparent" : "bg-primary")} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {notification.href ? (
                    <Link href={notification.href} className="hover:underline" onClick={() => !notification.readAt && markRead.mutate(notification.id)}>
                      {notification.title}
                    </Link>
                  ) : (
                    notification.title
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{notification.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{format.relativeTime(new Date(notification.createdAt))}</p>
              </div>
              {!notification.readAt && (
                <Button variant="ghost" size="icon-sm" onClick={() => markRead.mutate(notification.id)} aria-label={t("markRead")}>
                  <Check />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
