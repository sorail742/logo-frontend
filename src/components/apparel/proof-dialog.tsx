"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  FileCheck2,
  Link2Off,
  Loader2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
}: Readonly<{
  approved: boolean;
  pending: boolean;
  issues: ApparelIssue[] | null;
  url?: string;
  onClose(): void;
}>) {
  const t = useTranslations("apparel.proof");
  if (approved) {
    return (
      <div className="glow-card flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
        <MailCheck className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="text-sm font-bold">{t("approved")}</p>
          <p className="text-xs opacity-85">
            Le bon à tirer a été signé par le client. Prêt pour l&apos;atelier de confection.
          </p>
        </div>
      </div>
    );
  }
  if (pending) {
    return (
      <div className="glow-card bg-card flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center text-sm">
        <Loader2 className="text-primary size-8 animate-spin" aria-hidden="true" />
        <p className="font-semibold">{t("checking")}</p>
        <p className="text-muted-foreground text-xs">
          Vérification de la conformité réglementaire et génération du lien sécurisé...
        </p>
      </div>
    );
  }
  if (issues) {
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-destructive flex items-center gap-1.5 text-sm font-bold">
            <CircleAlert className="size-4" />
            {t("blocked", { count: issues.length })}
          </p>
          <Badge variant="destructive" className="text-[10px]">
            Correction requise
          </Badge>
        </div>
        <ul className="grid max-h-64 gap-2 overflow-y-auto pr-1">
          {issues.map((issue) => (
            <li key={`${issue.code}-${issue.elementId ?? issue.zoneKey ?? ""}-${issue.message}`}>
              <button
                type="button"
                className="glow-card hover:bg-muted/50 border-destructive/30 flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition"
                onClick={() => {
                  if (issue.elementId) useApparel.getState().select(issue.elementId);
                  onClose();
                }}
              >
                <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <span className="text-foreground font-semibold">{issue.message}</span>
                  {issue.code && (
                    <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">({issue.code})</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (!url) return null;
  return (
    <div className="glow-card bg-card grid gap-3 rounded-xl border p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-foreground flex items-center gap-1.5 text-xs font-bold">
          <ShieldCheck className="size-4 text-emerald-600" />
          {t("ready")}
        </span>
        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400">
          Lien public sans connexion
        </Badge>
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          readOnly
          onFocus={(e) => e.target.select()}
          aria-label={t("link")}
          className="font-mono text-xs"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => void navigator.clipboard.writeText(url).then(() => toast.success(t("copied")))}
          aria-label={t("copy")}
          title={t("copy")}
        >
          <Copy className="size-4" />
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "default", size: "icon" })}
          aria-label={t("open")}
          title={t("open")}
        >
          <ExternalLink className="size-4" />
        </a>
      </div>
      <p className="text-muted-foreground text-[11px]">
        Ce lien permet au client de prévisualiser la tenue sous tous les angles, de vérifier la grille des
        tailles et de signer numériquement.
      </p>
    </div>
  );
}

export function ProofDialog({ onClose }: Readonly<{ onClose(): void }>) {
  const t = useTranslations("apparel.proof");
  const onError = useApiErrorToast();
  const { localId } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const started = useRef(false);
  const [issues, setIssues] = useState<ApparelIssue[] | null>(null);

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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
              <FileCheck2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
              <DialogDescription className="text-xs">{t("description")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ProofBody approved={approved} pending={send.isPending} issues={issues} url={url} onClose={onClose} />
        <DialogFooter className="mt-2 border-t pt-3">
          {design.proofToken && !approved && (
            <Button variant="ghost" onClick={() => revoke.mutate()} disabled={revoke.isPending}>
              <Link2Off className="size-4" /> {t("revoke")}
            </Button>
          )}
          <Button onClick={onClose}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
