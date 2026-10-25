"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { Inbox, Mail, MailOpen, MessageCircle, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { whatsappHref } from "@/lib/render/site";
import type { Website, WebsiteMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const linkClass = "inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[0.8rem] hover:bg-muted";

/** Onglet « Messages » : messages reçus par le formulaire de contact du site. */
export function SiteMessagesPanel({ website }: { website: Website }) {
  const t = useTranslations("site.messages");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const key = qk.websiteMessages(website.id);
  const { data: messages, isLoading } = useQuery({ queryKey: key, queryFn: () => api.websites.messages(website.id) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: qk.website(website.projectId) });
  };
  const mark = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => api.websites.markMessage(website.id, id, read),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.websites.removeMessage(website.id, id),
    onSuccess: () => {
      toast.success(t("deleted"));
      refresh();
    },
    onError,
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!messages?.length) return <EmptyState icon={Inbox} title={t("title")} description={t("empty")} />;

  return (
    <div className="grid min-w-0 gap-3">
      {messages.map((message: WebsiteMessage) => {
        const whatsapp = message.phone ? whatsappHref(message.phone) : null;
        return (
          <Card key={message.id} className={cn(!message.readAt && "border-primary/50")}>
            <CardContent className="grid gap-2 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {message.name} {!message.readAt && <Badge className="ml-1">{t("unread")}</Badge>}
                </p>
                <time className="text-xs text-muted-foreground" dateTime={message.createdAt}>
                  {format.dateTime(new Date(message.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>
              <p className="text-sm whitespace-pre-line">{message.message}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {message.email && (
                  <a className={linkClass} href={`mailto:${message.email}`}>
                    <Mail className="size-3.5" aria-hidden="true" /> {t("reply")}
                  </a>
                )}
                {message.phone && (
                  <a className={linkClass} href={`tel:${message.phone.replaceAll(/[^\d+]/g, "")}`}>
                    <Phone className="size-3.5" aria-hidden="true" /> {t("call")}
                  </a>
                )}
                {whatsapp && (
                  <a className={linkClass} href={whatsapp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-3.5" aria-hidden="true" /> {t("whatsapp")}
                  </a>
                )}
                <span className="flex-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={mark.isPending}
                  onClick={() => mark.mutate({ id: message.id, read: !message.readAt })}
                >
                  {message.readAt ? <Mail /> : <MailOpen />}
                  {message.readAt ? t("markUnread") : t("markRead")}
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("delete")}
                  title={t("delete")}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(message.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
