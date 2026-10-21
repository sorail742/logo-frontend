"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Comment } from "@/lib/types";
import { useSessionStore } from "@/stores/session";

/** Commentaires sur un élément du projet, avec mentions @ (COL-02). */
type CommentsPanelProps = { pid: string; targetType: Comment["targetType"]; targetId: string };

/** Commentaires (COL-02), masqués tant que l'API ne les sert pas. */
export function CommentsPanel(props: CommentsPanelProps) {
  return api.isAvailable("comments") ? <CommentsPanelContent {...props} /> : null;
}

/** Mot à taper après @ pour mentionner un membre : son prénom, sans espace. */
function mentionHandle(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

function CommentsPanelContent({ pid, targetType, targetId }: CommentsPanelProps) {
  const t = useTranslations("app.comments");
  const format = useFormatter();
  // Heure de référence des durées relatives (« il y a 3 minutes »), rafraîchie chaque minute.
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const userId = useSessionStore((s) => s.user?.id);
  const { project, can } = useProject();
  const [body, setBody] = useState("");
  const { data } = useQuery({ queryKey: qk.comments(pid), queryFn: () => api.comments.list(pid) });
  const workspaceId = project?.workspaceId;
  const { data: members = [] } = useQuery({
    queryKey: qk.members(workspaceId ?? "none"),
    queryFn: () => api.workspaces.members(workspaceId!),
    enabled: Boolean(workspaceId),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: qk.comments(pid) });
  const create = useMutation({
    mutationFn: () => api.comments.create(pid, { targetType, targetId, body: body.trim() }),
    onSuccess: () => {
      setBody("");
      refresh();
    },
    onError,
  });
  const remove = useMutation({ mutationFn: (cid: string) => api.comments.remove(cid), onSuccess: refresh, onError });

  const comments = data?.filter((c) => c.targetType === targetType && c.targetId === targetId) ?? [];
  const others = members.filter((m) => m.userId !== userId);
  const canComment = can("comment.create");
  const canModerate = can("members.manage");
  const mention = (fullName: string) => setBody((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}@${mentionHandle(fullName)} `);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        <ul className="grid gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="group rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{comment.authorName}</span> ·{" "}
                  {/* Un commentaire plus récent que l'heure de référence (rafraîchie chaque minute) n'est pas « dans 4 secondes ». */}
                  {format.relativeTime(new Date(Math.min(Date.parse(comment.createdAt), now.getTime())), now)}
                </p>
                {(comment.authorId === userId || canModerate) && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="-mt-1 -mr-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => remove.mutate(comment.id)}
                    disabled={remove.isPending}
                    aria-label={t("delete")}
                    title={t("delete")}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap">
                {comment.body.split(/(@[\p{L}\d_.-]+)/u).map((part, i) =>
                  part.startsWith("@") ? (
                    <span key={i} className="font-medium text-primary">
                      {part}
                    </span>
                  ) : (
                    part
                  ),
                )}
              </p>
              {comment.mentions?.length > 0 && (
                <p className="sr-only">{t("mentioned", { names: comment.mentions.map((m) => m.fullName).join(", ") })}</p>
              )}
            </li>
          ))}
        </ul>
        {canComment && (
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (body.trim()) create.mutate();
            }}
          >
            <div className="flex gap-2">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("placeholder")} rows={2} className="min-h-0" aria-label={t("placeholder")} maxLength={2000} />
              <Button type="submit" size="icon-lg" disabled={!body.trim() || create.isPending} aria-label={t("send")}>
                <Send />
              </Button>
            </div>
            {others.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t("mention")}</span>
                {others.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => mention(member.fullName)}
                    className="rounded-full border px-2 py-0.5 text-foreground hover:bg-muted"
                    title={member.fullName}
                  >
                    @{mentionHandle(member.fullName)}
                  </button>
                ))}
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
