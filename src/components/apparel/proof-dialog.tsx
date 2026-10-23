"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CircleAlert, Copy, ExternalLink, Link2Off, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import type { ApparelIssue } from "@/lib/apparel/types";
import { useApparel } from "@/stores/apparel";
import { useApparelEditor } from "./editor";

// Envoi du BAT : l'API contrôle la tenue, puis renvoie un lien que le client ouvre sans compte
// pour approuver. Toute modification ultérieure révoque le lien.

/** Contenu du dialogue : approuvé, contrôle en cours, erreurs bloquantes ou lien prêt. */
function ProofBody({
  approved,
  pending,
  issues,
  url,
  onClose,
}: {
  approved: boolean;
  pending: boolean;
  issues: ApparelIssue[] | null;
  url?: string;
  onClose(): void;
}) {
  const t = useTranslations("apparel.proof");
  if (approved) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
        <MailCheck className="size-4" aria-hidden="true" /> {t("approved")}
      </p>
    );
  }
  if (pending) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t("checking")}
      </p>
    );
  }
  if (issues) {
    return (
      <div className="grid gap-2">
        <p className="text-destructive text-sm font-medium">{t("blocked", { count: issues.length })}</p>
        <ul className="grid max-h-64 gap-1.5 overflow-y-auto">
          {issues.map((issue, i) => (
            <li key={`${issue.code}-${i}`}>
              <button
                type="button"
                className="border-destructive/30 hover:bg-muted flex w-full gap-2 rounded-lg border p-2 text-left text-xs"
                onClick={() => {
                  if (issue.elementId) useApparel.getState().select(issue.elementId);
                  onClose();
                }}
              >
                <CircleAlert className="text-destructive mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (!url) return null;
  return (
    <div className="grid gap-3">
      <p className="text-sm">{t("ready")}</p>
      <div className="flex gap-2">
        <Input value={url} readOnly onFocus={(e) => e.target.select()} aria-label={t("link")} />
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigator.clipboard.writeText(url).then(() => toast.success(t("copied")))}
          aria-label={t("copy")}
          title={t("copy")}
        >
          <Copy />
        </Button>
        <Button
          variant="outline"
          size="icon"
          render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
          aria-label={t("open")}
          title={t("open")}
        >
          <ExternalLink />
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">{t("editRevokes")}</p>
    </div>
  );
}

export function ProofDialog({ onClose }: { onClose(): void }) {
  const t = useTranslations("apparel.proof");
  const onError = useApiErrorToast();
  const { localId } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const [issues, setIssues] = useState<ApparelIssue[] | null>(null);
  const started = useRef(false);

  const send = useMutation({
    mutationFn: () => api.apparel.proof(design.id),
    onSuccess: ({ token }) => useApparel.getState().setDesign({ status: "PROOF_SENT", proofToken: token }),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 422 && Array.isArray(error.problem.issues)) {
        setIssues(
          (error.problem.issues as ApparelIssue[]).map((i) => ({ ...i, elementId: localId(i.elementId) })),
        );
        return;
      }
      onError(error);
    },
  });
  const revoke = useMutation({
    mutationFn: () => api.apparel.revokeProof(design.id),
    onSuccess: () => {
      useApparel.getState().setDesign({ status: "DRAFT", proofToken: null });
      toast.success(t("revoked"));
      onClose();
    },
    onError,
  });

  // Envoi dès l'ouverture (sauf tenue déjà approuvée).
  useEffect(() => {
    if (started.current || design.status === "APPROVED" || design.status === "IN_PRODUCTION") return;
    started.current = true;
    send.mutate();
  }, [design.status, send]);

  const url = send.data?.url;
  const approved = design.status === "APPROVED" || design.status === "IN_PRODUCTION";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ProofBody approved={approved} pending={send.isPending} issues={issues} url={url} onClose={onClose} />
        <DialogFooter>
          {design.proofToken && !approved && (
            <Button variant="ghost" onClick={() => revoke.mutate()} disabled={revoke.isPending}>
              <Link2Off /> {t("revoke")}
            </Button>
          )}
          <Button onClick={onClose}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
