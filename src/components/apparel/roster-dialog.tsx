"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FileUp, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { ApparelIssue, RosterSummary } from "@/lib/apparel/types";
import { useApparel } from "@/stores/apparel";

// Import de l'effectif (CSV) : noms imprimés, numéros, tailles et quantités, contrôlés par
// l'API (doublons de numéros, tailles absentes du support, règlement choisi).

const EXAMPLE =
  "nom,nom_imprime,numero,taille,poste,quantite\nMamadou Diallo,DIALLO,10,M,Joueur,1\nFatoumata Camara,CAMARA,1,L,Gardienne,1";

export function RosterDialog({ onClose }: { onClose(): void }) {
  const t = useTranslations("apparel.roster");
  const design = useApparel((s) => s.design)!;
  const [csv, setCsv] = useState("");
  const [name, setName] = useState(design.roster?.name ?? "");
  const [problems, setProblems] = useState<string[]>([]);
  const [summary, setSummary] = useState<RosterSummary | null>(null);

  const importRoster = useMutation({
    mutationFn: () => api.apparel.importRoster(design.id, csv, name.trim() || undefined),
    onSuccess: ({ roster, summary: result }) => {
      setProblems([]);
      setSummary(result);
      useApparel.getState().setDesign({ roster });
      toast.success(t("imported", { count: result.players }));
    },
    onError: (error) => {
      setSummary(null);
      if (error instanceof ApiError && Array.isArray(error.problem.issues))
        setProblems((error.problem.issues as ApparelIssue[]).map((i) => i.message));
      else if (error instanceof ApiError && Array.isArray(error.problem.errors))
        setProblems(error.problem.errors);
      else setProblems([errorMessage(error)]);
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="text-muted-foreground grid gap-1 text-xs">
            {t("name")}
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={120}
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">{t("csv")}</span>
            <span className="flex gap-1">
              <Button size="xs" variant="ghost" onClick={() => setCsv(EXAMPLE)}>
                {t("example")}
              </Button>
              <Button size="xs" variant="outline" render={<label />} nativeButton={false}>
                <FileUp /> {t("file")}
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void file?.text().then(setCsv);
                  }}
                />
              </Button>
            </span>
          </div>
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            placeholder={EXAMPLE}
            aria-label={t("csv")}
          />
          <p className="text-muted-foreground text-[11px]">{t("columns")}</p>
          {problems.length > 0 && (
            <ul className="border-destructive/30 text-destructive grid gap-1 rounded-lg border p-2 text-xs">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {summary && (
            <div className="bg-muted/60 rounded-lg p-2.5 text-xs">
              <p className="font-medium">
                {t("result", { players: summary.players, garments: summary.garments })}
              </p>
              <p className="text-muted-foreground mt-1">
                {Object.entries(summary.bySize)
                  .map(([size, count]) => `${size} × ${count}`)
                  .join(" · ")}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={() => importRoster.mutate()} disabled={!csv.trim() || importRoster.isPending}>
            {importRoster.isPending && <Loader2 className="animate-spin" />} {t("import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
