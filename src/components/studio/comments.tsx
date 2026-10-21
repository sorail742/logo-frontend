"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Check, CornerDownLeft, MessageSquare, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Comment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";
import { useStudio } from "@/stores/studio";
import { useStudioContext } from "./context";

// Commentaires épinglés sur une création : une épingle sur la page ouvre un fil (réponses,
// résolution). Les fils se relisent régulièrement pour suivre les échanges de l'équipe.

const REFRESH_MS = 15_000;

export interface Thread {
  root: Comment;
  replies: Comment[];
  /** Numéro d'affichage, dans l'ordre de création. */
  number: number;
}

export function designCommentsKey(pid: string, sdid: string) {
  return [...qk.comments(pid), "DESIGN", sdid] as const;
}

/** Fils de commentaires de la création ouverte, du plus ancien au plus récent. */
export function useDesignThreads() {
  const { projectId } = useStudioContext();
  const sdid = useStudio((s) => s.meta?.id ?? "");
  const query = useQuery({
    queryKey: designCommentsKey(projectId, sdid),
    queryFn: () => api.comments.list(projectId, { targetType: "DESIGN", targetId: sdid }),
    enabled: Boolean(projectId && sdid) && api.isAvailable("comments"),
    refetchInterval: REFRESH_MS,
  });
  const threads = useMemo(() => {
    const all = [...(query.data ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const roots = all.filter((c) => !c.parentId);
    return roots.map((root, i): Thread => ({ root, replies: all.filter((c) => c.parentId === root.id), number: i + 1 }));
  }, [query.data]);
  return { ...query, threads };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Body({ text }: { text: string }) {
  return (
    <p className="text-sm whitespace-pre-wrap">
      {text.split(/(@[\p{L}\d_.-]+)/u).map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-medium text-primary">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function useCommentActions() {
  const { projectId } = useStudioContext();
  const sdid = useStudio((s) => s.meta?.id ?? "");
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const refresh = () => queryClient.invalidateQueries({ queryKey: designCommentsKey(projectId, sdid) });
  const create = useMutation({
    mutationFn: (input: { body: string; anchor?: Comment["anchor"]; parentId?: string }) =>
      api.comments.create(projectId, { targetType: "DESIGN", targetId: sdid, body: input.body, anchor: input.anchor ?? undefined, parentId: input.parentId }),
    onSuccess: refresh,
    onError,
  });
  const resolve = useMutation({ mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) => api.comments.resolve(id, resolved), onSuccess: refresh, onError });
  const remove = useMutation({ mutationFn: (id: string) => api.comments.remove(id), onSuccess: refresh, onError });
  return { create, resolve, remove };
}

function Composer({ onSubmit, placeholder, autoFocus, pending, onCancel }: { onSubmit(body: string): void; placeholder: string; autoFocus?: boolean; pending: boolean; onCancel?: () => void }) {
  const t = useTranslations("studio.comments");
  const [body, setBody] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!autoFocus) return;
    ref.current?.focus();
    const frame = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);
  const send = () => {
    if (!body.trim()) return;
    onSubmit(body.trim());
    setBody("");
  };
  return (
    <div className="grid gap-1.5">
      <Textarea
        ref={ref}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
          }
          if (e.key === "Escape") onCancel?.();
        }}
        placeholder={placeholder}
        rows={2}
        maxLength={2000}
        className="min-h-0 resize-none text-sm"
        aria-label={placeholder}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{t("sendHint")}</span>
        <div className="flex gap-1">
          {onCancel && (
            <Button variant="ghost" size="xs" onClick={onCancel}>
              {t("cancel")}
            </Button>
          )}
          <Button size="xs" onClick={send} disabled={!body.trim() || pending}>
            <CornerDownLeft />
            {t("send")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Fil d'un commentaire : messages, réponse, résolution. */
function ThreadCard({ thread, onClose }: { thread: Thread; onClose(): void }) {
  const t = useTranslations("studio.comments");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const userId = useSessionStore((s) => s.user?.id);
  const { canEdit } = useStudioContext();
  const { create, resolve, remove } = useCommentActions();
  const resolved = Boolean(thread.root.resolvedAt);
  const messages = [thread.root, ...thread.replies];

  return (
    <div className="grid w-80 gap-3 rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{t("thread", { number: thread.number })}</span>
        <div className="flex items-center gap-0.5">
          {(canEdit || thread.root.authorId === userId) && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => resolve.mutate({ id: thread.root.id, resolved: !resolved })}
              aria-label={resolved ? t("reopen") : t("resolve")}
              title={resolved ? t("reopen") : t("resolve")}
            >
              {resolved ? <RotateCcw /> : <Check />}
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("close")} title={t("close")}>
            <X />
          </Button>
        </div>
      </div>
      <ol className="grid max-h-72 gap-3 overflow-y-auto">
        {messages.map((comment) => (
          <li key={comment.id} className="group flex gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{initials(comment.authorName)}</span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{comment.authorName}</span>·
                {format.relativeTime(new Date(Math.min(Date.parse(comment.createdAt), now.getTime())), now)}
                {comment.authorId === userId && (
                  <button
                    type="button"
                    onClick={() => remove.mutate(comment.id)}
                    className="ml-auto rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                    aria-label={t("delete")}
                    title={comment.parentId ? t("delete") : t("deleteThread")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </p>
              <Body text={comment.body} />
            </div>
          </li>
        ))}
      </ol>
      {resolved && <p className="rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{t("resolvedNote")}</p>}
      <Composer placeholder={t("reply")} pending={create.isPending} onSubmit={(body) => create.mutate({ body, parentId: thread.root.id })} />
    </div>
  );
}

/** Épingles de la page courante, fil ouvert et nouvelle épingle, au-dessus du canevas. */
export function CommentLayer() {
  const t = useTranslations("studio.comments");
  const doc = useStudio((s) => s.doc);
  const page = useStudio((s) => s.doc?.pages[s.pageIndex]);
  const zoom = useStudio((s) => s.zoom);
  const panX = useStudio((s) => s.panX);
  const panY = useStudio((s) => s.panY);
  const viewport = useStudio((s) => s.viewport);
  const commentMode = useStudio((s) => s.commentMode);
  const activeThread = useStudio((s) => s.activeThread);
  const draftPin = useStudio((s) => s.draftPin);
  const { threads } = useDesignThreads();
  const { create } = useCommentActions();
  if (!doc || !page || !api.isAvailable("comments")) return null;
  const state = useStudio.getState();

  const toScreen = (x: number, y: number) => ({ left: panX + x * doc.width * zoom, top: panY + y * doc.height * zoom });
  const visible = threads.filter((th) => th.root.anchor?.pageId === page.id && (commentMode || !th.root.resolvedAt || th.root.id === activeThread));
  const active = threads.find((th) => th.root.id === activeThread);
  const cardAt = (left: number, top: number) => ({
    left: left + 340 > viewport.width ? Math.max(8, left - 340) : left + 22,
    top: Math.max(8, Math.min(top - 20, viewport.height - 380)),
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {visible.map((th) => {
        const pos = toScreen(th.root.anchor!.x, th.root.anchor!.y);
        const resolved = Boolean(th.root.resolvedAt);
        return (
          <button
            key={th.root.id}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => state.openThread(th.root.id === activeThread ? null : th.root.id)}
            className={cn(
              "pointer-events-auto absolute flex size-8 -translate-y-full items-center justify-center rounded-full rounded-bl-none border-2 border-white text-xs font-bold shadow-lg transition hover:scale-110",
              resolved ? "bg-muted-foreground/70 text-white" : "bg-primary text-primary-foreground",
              th.root.id === activeThread && "ring-4 ring-primary/30",
            )}
            style={pos}
            aria-label={t("pin", { number: th.number, author: th.root.authorName })}
            title={th.root.body.slice(0, 80)}
          >
            {th.replies.length ? th.number : initials(th.root.authorName)}
          </button>
        );
      })}

      {active?.root.anchor?.pageId === page.id && (
        <div className="pointer-events-auto absolute" style={cardAt(toScreen(active.root.anchor.x, active.root.anchor.y).left, toScreen(active.root.anchor.x, active.root.anchor.y).top)}>
          <ThreadCard thread={active} onClose={() => state.openThread(null)} />
        </div>
      )}

      {draftPin && (
        <>
          <span className="absolute flex size-8 -translate-y-full items-center justify-center rounded-full rounded-bl-none border-2 border-white bg-amber-500 text-white shadow-lg" style={toScreen(draftPin.x, draftPin.y)} aria-hidden="true">
            <MessageSquare className="size-4" />
          </span>
          <div className="pointer-events-auto absolute w-80 rounded-2xl border bg-popover p-3 shadow-xl" style={cardAt(toScreen(draftPin.x, draftPin.y).left, toScreen(draftPin.x, draftPin.y).top)} onPointerDown={(e) => e.stopPropagation()}>
            <Composer
              autoFocus
              placeholder={t("placeholder")}
              pending={create.isPending}
              onCancel={() => state.setDraftPin(null)}
              onSubmit={(body) =>
                create.mutate(
                  { body, anchor: { pageId: page.id, x: draftPin.x, y: draftPin.y } },
                  { onSuccess: (comment) => state.openThread(comment.id) },
                )
              }
            />
          </div>
        </>
      )}

      {commentMode && !draftPin && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1.5 text-xs whitespace-nowrap text-background shadow">{t("modeHint")}</div>
      )}
    </div>
  );
}

/** Panneau des fils : ouverts ou résolus, toutes pages. */
export function CommentsListPanel() {
  const t = useTranslations("studio.comments");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const doc = useStudio((s) => s.doc);
  const commentMode = useStudio((s) => s.commentMode);
  const activeThread = useStudio((s) => s.activeThread);
  const { threads, isLoading } = useDesignThreads();
  const [filter, setFilter] = useState<"open" | "resolved">("open");
  if (!api.isAvailable("comments")) return <p className="text-xs text-muted-foreground">{t("unavailable")}</p>;
  const state = useStudio.getState();
  const list = threads.filter((th) => (filter === "open" ? !th.root.resolvedAt : th.root.resolvedAt));

  const show = (th: Thread) => {
    const index = doc?.pages.findIndex((p) => p.id === th.root.anchor?.pageId) ?? -1;
    if (index >= 0 && index !== state.pageIndex) state.setPage(index);
    state.openThread(th.root.id);
  };

  return (
    <div className="grid gap-3">
      <Button variant={commentMode ? "default" : "outline"} onClick={() => state.setCommentMode(!commentMode)}>
        <MessageSquare />
        {commentMode ? t("stopCommenting") : t("startCommenting")}
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("help")}</p>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5 text-xs">
        {(["open", "resolved"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={cn("rounded-md py-1.5 transition", filter === f ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}>
            {t(f, { count: threads.filter((th) => (f === "open" ? !th.root.resolvedAt : th.root.resolvedAt)).length })}
          </button>
        ))}
      </div>
      {isLoading ? null : !list.length ? (
        <p className="py-6 text-center text-xs text-muted-foreground">{filter === "open" ? t("emptyOpen") : t("emptyResolved")}</p>
      ) : (
        <ul className="grid gap-2">
          {list.map((th) => {
            const pageNumber = (doc?.pages.findIndex((p) => p.id === th.root.anchor?.pageId) ?? -1) + 1;
            return (
              <li key={th.root.id}>
                <button
                  type="button"
                  onClick={() => show(th)}
                  className={cn("grid w-full gap-1 rounded-xl border p-3 text-left transition hover:bg-muted", activeThread === th.root.id && "border-primary bg-primary/5")}
                >
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{th.number}</span>
                    <span className="font-medium text-foreground">{th.root.authorName}</span>
                    <span className="ml-auto">{pageNumber > 0 ? t("page", { number: pageNumber }) : ""}</span>
                  </span>
                  <span className="line-clamp-2 text-sm">{th.root.body}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {format.relativeTime(new Date(Math.min(Date.parse(th.root.createdAt), now.getTime())), now)}
                    {th.replies.length > 0 && ` · ${t("replies", { count: th.replies.length })}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
