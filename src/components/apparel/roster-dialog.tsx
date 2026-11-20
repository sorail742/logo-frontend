"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Hash,
  Loader2,
  Plus,
  Search,
  Shirt,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useApparel } from "@/stores/apparel";

// Import de l'effectif (CSV) : noms imprimés, numéros, tailles et quantités, contrôlés par
// l'API (doublons de numéros, tailles absentes du support, règlement choisi).

const EXAMPLE =
  "nom,nom_imprime,numero,taille,poste,quantite\nMamadou Diallo,DIALLO,10,M,Joueur,1\nFatoumata Camara,CAMARA,1,L,Gardienne,1\nAbdoulaye Traore,TRAORE,7,M,Ailier,1\nSekou Toure,TOURE,4,XL,Defenseur,1\nMohamed Camara,CAMARA,9,L,Attaquant,1";

export function RosterDialog({ onClose }: Readonly<{ onClose(): void }>) {
  const t = useTranslations("apparel.roster");
  const design = useApparel((s) => s.design)!;
  const existingEntries = design.roster?.entries ?? [];
  const [activeTab, setActiveTab] = useState<"list" | "import">(
    existingEntries.length > 0 ? "list" : "import",
  );
  const [csv, setCsv] = useState("");
  const [name, setName] = useState(design.roster?.name ?? "");
  const [search, setSearch] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [summary, setSummary] = useState<RosterSummary | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const importRoster = useMutation({
    mutationFn: () => api.apparel.importRoster(design.id, csv, name.trim() || undefined),
    onSuccess: ({ roster, summary: result }) => {
      setProblems([]);
      setSummary(result);
      useApparel.getState().setDesign({ roster });
      toast.success(t("imported", { count: result.players }));
      setActiveTab("list");
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

  // Calculate live stats for existing roster
  const stats = useMemo(() => {
    const totalGarments = existingEntries.reduce((acc, e) => acc + (e.quantity || 1), 0);
    const bySize: Record<string, number> = {};
    const numberCounts = new Map<string, number>();

    for (const e of existingEntries) {
      bySize[e.size] = (bySize[e.size] ?? 0) + (e.quantity || 1);
      if (e.number && e.number.trim()) {
        const num = e.number.trim();
        numberCounts.set(num, (numberCounts.get(num) ?? 0) + 1);
      }
    }

    const duplicates = Array.from(numberCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([num]) => num);

    return { totalGarments, bySize, duplicates };
  }, [existingEntries]);

  // Client-side quick parser for CSV preview
  const liveCsvCheck = useMemo(() => {
    if (!csv.trim()) return null;
    const lines = csv
      .trim()
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length <= 1) return null;
    const dataLines = lines.slice(1);
    const numberCounts = new Map<string, number>();

    for (const line of dataLines) {
      const parts = line.includes(";") ? line.split(";") : line.split(",");
      const num = parts[2]?.trim();
      if (num) {
        numberCounts.set(num, (numberCounts.get(num) ?? 0) + 1);
      }
    }

    const dupes = Array.from(numberCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([num]) => num);

    return { count: dataLines.length, dupes };
  }, [csv]);

  // Filtered entries for search
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return existingEntries;
    const q = search.toLowerCase();
    return existingEntries.filter(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        e.playerName.toLowerCase().includes(q) ||
        (e.number && e.number.includes(q)) ||
        e.size.toLowerCase().includes(q),
    );
  }, [existingEntries, search]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Shirt className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
              <DialogDescription className="text-xs">{t("description")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex gap-1.5">
            <Button
              size="xs"
              variant={activeTab === "list" ? "default" : "outline"}
              onClick={() => setActiveTab("list")}
              disabled={existingEntries.length === 0}
            >
              <Users className="size-3.5" />
              Effectif actuel ({existingEntries.length})
            </Button>
            <Button
              size="xs"
              variant={activeTab === "import" ? "default" : "outline"}
              onClick={() => setActiveTab("import")}
            >
              <FileSpreadsheet className="size-3.5" />
              {existingEntries.length > 0 ? "Mettre à jour (CSV)" : "Importer un CSV"}
            </Button>
          </div>

          {activeTab === "import" && (
            <span className="flex items-center gap-1">
              <Button size="xs" variant="ghost" onClick={() => setCsv(EXAMPLE)}>
                {t("example")}
              </Button>
              <Button size="xs" variant="outline" onClick={() => fileInput.current?.click()}>
                <FileUp className="size-3.5" /> {t("file")}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="sr-only"
                tabIndex={-1}
                aria-label={t("file")}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void file?.text().then(setCsv);
                }}
              />
            </span>
          )}
        </div>

        {/* STATS OVERVIEW CARDS (Only when entries exist or when imported) */}
        {existingEntries.length > 0 && (
          <div className="grid gap-2.5 sm:grid-cols-4">
            <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
              <span className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
                Joueurs
                <Users className="text-primary size-3.5" />
              </span>
              <p className="mt-1 text-xl font-bold tabular-nums">{existingEntries.length}</p>
              <p className="text-muted-foreground text-[10px]">Inscrits sur la feuille</p>
            </div>

            <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
              <span className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
                Total Tenues
                <Shirt className="size-3.5 text-teal-600" />
              </span>
              <p className="mt-1 text-xl font-bold tabular-nums">{stats.totalGarments}</p>
              <p className="text-muted-foreground text-[10px]">Pièces à confectionner</p>
            </div>

            <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
              <span className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
                Tailles
                <span className="font-mono text-[10px]">{Object.keys(stats.bySize).length}</span>
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(stats.bySize).map(([size, count]) => (
                  <Badge key={size} variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
                    {size}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="glow-card bg-card rounded-xl border p-3 shadow-2xs">
              <span className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
                Contrôle Dossards
                {stats.duplicates.length === 0 ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="size-3.5 text-amber-600" />
                )}
              </span>
              {stats.duplicates.length === 0 ? (
                <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  0 Doublon détecté
                </p>
              ) : (
                <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Doublons: #{stats.duplicates.join(", #")}
                </p>
              )}
              <p className="text-muted-foreground text-[10px]">Numéros 1 à 99</p>
            </div>
          </div>
        )}

        {/* TAB 1: LISTE DE L'EFFECTIF */}
        {activeTab === "list" && (
          <div className="grid gap-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                placeholder="Rechercher par nom, numéro ou taille..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>

            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredEntries.map((e, idx) => (
                <div
                  key={e.id ?? `${e.playerName}-${e.number}-${idx}`}
                  className="glow-card bg-card hover:border-primary/40 flex items-center gap-2.5 rounded-xl border p-2.5 text-xs shadow-2xs transition"
                >
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold">
                    {e.number ? `#${e.number}` : "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold tracking-tight uppercase">
                      {e.displayName || e.playerName}
                    </p>
                    {e.playerName && e.playerName !== e.displayName && (
                      <p className="text-muted-foreground truncate text-[11px]">{e.playerName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {e.role && (
                      <Badge variant="outline" className="text-[10px]">
                        {e.role}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {e.size}
                    </Badge>
                    {e.quantity > 1 && (
                      <span className="text-muted-foreground font-mono text-[10px]">×{e.quantity}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: IMPORT CSV */}
        {activeTab === "import" && (
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

            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder={EXAMPLE}
              aria-label={t("csv")}
            />
            <p className="text-muted-foreground text-[11px]">{t("columns")}</p>

            {/* Live Client Validation feedback */}
            {liveCsvCheck && (
              <div className="bg-muted/60 flex items-center justify-between rounded-lg p-2.5 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {liveCsvCheck.count} joueurs détectés dans le fichier
                </span>
                {liveCsvCheck.dupes.length > 0 ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Doublons détectés : #{liveCsvCheck.dupes.join(", #")}
                  </Badge>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Numéros uniques validés
                  </span>
                )}
              </div>
            )}

            {problems.length > 0 && (
              <ul className="border-destructive/30 text-destructive grid gap-1 rounded-lg border p-2 text-xs">
                {problems.map((p) => (
                  <li key={p} className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {summary && (
              <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold">
                  {t("result", { players: summary.players, garments: summary.garments })}
                </p>
                <p className="mt-1 opacity-80">
                  {Object.entries(summary.bySize)
                    .map(([size, count]) => `${size} × ${count}`)
                    .join(" · ")}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2 flex items-center justify-between gap-2 border-t pt-3">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          {activeTab === "import" && (
            <Button onClick={() => importRoster.mutate()} disabled={!csv.trim() || importRoster.isPending}>
              {importRoster.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              {t("import")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
