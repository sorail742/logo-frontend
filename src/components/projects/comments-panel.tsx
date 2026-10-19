"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Comment } from "@/lib/types";

/** Commentaires sur un élément du projet, avec mentions @ (COL-02). */
type CommentsPanelProps = { pid: string; targetType: Comment["targetType"]; targetId: string };

/** Commentaires (COL-02), masqués tant que l'API ne les sert pas. */
export function CommentsPanel(props: CommentsPanelProps) {
  return api.isAvailable("comments") ? <CommentsPanelContent {...props} /> : null;
}

function CommentsPanelContent({ pid, targetType, targetId }: CommentsPanelProps) {
  const t = useTranslations("app.comments");
  const format = useFormatter();
  // Heure de référence des durées relatives (« il y a 3 minutes »), rafraîchie chaque minute.
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const [body, setBody] = useState("");
  const { data } = useQuery({ queryKey: qk.comments(pid), queryFn: () => api.comments.list(pid) });
  const create = useMutation({
    mutationFn: () => api.comments.create(pid, { targetType, targetId, body: body.trim() }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: qk.comments(pid) });
    },
    onError,
  });
  const comments = data?.filter((c) => c.targetId === targetId) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        <ul className="grid gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{comment.authorName}</span> · {format.relativeTime(new Date(comment.createdAt), now)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                {comment.body.split(/(@[\p{L}\d_-]+)/u).map((part, i) =>
                  part.startsWith("@") ? (
                    <span key={i} className="font-medium text-primary">
                      {part}
                    </span>
                  ) : (
                    part
                  ),
                )}
              </p>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (body.trim()) create.mutate();
          }}
        >
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("placeholder")} rows={2} className="min-h-0" aria-label={t("placeholder")} />
          <Button type="submit" size="icon-lg" disabled={!body.trim() || create.isPending} aria-label={t("send")}>
            <Send />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
