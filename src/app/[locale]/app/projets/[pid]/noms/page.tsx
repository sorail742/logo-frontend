"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Columns3, Sparkles, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/common/button-link";
import { CreditCost } from "@/components/common/credit-cost";
import { EmptyState } from "@/components/common/empty-state";
import { JobProgress } from "@/components/common/job-progress";
import { PageHeader } from "@/components/common/page-header";
import { AvailabilityResults, NameCard } from "@/components/names/name-card";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useJob } from "@/hooks/use-job";
import { useProject } from "@/hooks/use-project";
import { api, newIdempotencyKey, type NameGenerationInput } from "@/lib/api";
import { CREDIT_COSTS } from "@/lib/credits";
import { qk } from "@/lib/query-keys";
import type { NameSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "favorites" | "rejected";
const CHIPS = ["shorter", "serious", "playful", "local"] as const;
const CHIP_FEEDBACK: Record<(typeof CHIPS)[number], string> = {
  shorter: "plus court",
  serious: "plus sérieux",
  playful: "plus ludique",
  local: "langues locales",
};

export default function NamesPage() {
  const t = useTranslations("names");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { project, pid, can } = useProject();
  const [filter, setFilter] = useState<Filter>("all");
  const [feedback, setFeedback] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data: names = [] } = useQuery({ queryKey: qk.names(pid), queryFn: () => api.names.list(pid) });
  const job = useJob(jobId, {
    invalidate: [qk.names(pid), qk.project(pid)],
    onDone: (event) => event.status === "SUCCEEDED" && toast.success(t("batchReady")),
  });

  const patchCache = (updated: NameSuggestion) =>
    queryClient.setQueryData<NameSuggestion[]>(qk.names(pid), (list) => list?.map((n) => (n.id === updated.id ? updated : n)));

  const generate = useMutation({
    mutationFn: (input: NameGenerationInput) => api.names.generate(pid, input, newIdempotencyKey()),
    onSuccess: ({ jobId }) => setJobId(jobId),
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { isFavorite?: boolean; isRejected?: boolean } }) => api.names.update(id, patch),
    onSuccess: patchCache,
    onError,
  });
  const vote = useMutation({ mutationFn: ({ id, value }: { id: string; value: -1 | 1 }) => api.names.vote(id, value), onSuccess: patchCache, onError });
  const choose = useMutation({
    mutationFn: (name: NameSuggestion) => api.names.choose(pid, name.id),
    onSuccess: (updated, name) => {
      queryClient.setQueryData(qk.project(pid), updated);
      queryClient.invalidateQueries({ queryKey: qk.names(pid) });
      toast.success(t("chosenToast", { name: name.value }));
    },
    onError,
  });

  const check = async (name: NameSuggestion) => {
    setChecking((s) => new Set(s).add(name.id));
    try {
      const checks = await api.names.check(name.id);
      queryClient.setQueryData<NameSuggestion[]>(qk.names(pid), (list) => list?.map((n) => (n.id === name.id ? { ...n, checks } : n)));
      queryClient.invalidateQueries({ queryKey: qk.names(pid) });
    } catch (error) {
      onError(error);
    } finally {
      setChecking((s) => {
        const next = new Set(s);
        next.delete(name.id);
        return next;
      });
    }
  };

  const launch = (extra: Partial<NameGenerationInput> = {}) => {
    const text = [...chips.map((c) => CHIP_FEEDBACK[c as keyof typeof CHIP_FEEDBACK]), feedback.trim()].filter(Boolean).join(", ");
    generate.mutate({ feedback: [text, extra.feedback].filter(Boolean).join(", ") || undefined, referenceNameId: extra.referenceNameId });
  };

  const toggleCompare = (id: string) =>
    setCompare((list) => {
      if (list.includes(id)) return list.filter((v) => v !== id);
      if (list.length >= 4) {
        toast.info(t("compareMax"));
        return list;
      }
      return [...list, id];
    });

  const favorites = names.filter((n) => n.isFavorite && !n.isRejected);
  const rejected = names.filter((n) => n.isRejected);
  const visible = filter === "favorites" ? favorites : filter === "rejected" ? rejected : names.filter((n) => !n.isRejected);
  const busy = generate.isPending || job.running;
  const canEdit = can("generation.run");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          compare.length > 1 && (
            <Button variant="outline" onClick={() => setCompareOpen(true)}>
              <Columns3 />
              {t("compare", { count: compare.length })}
            </Button>
          )
        }
      />

      {!project?.brief && canEdit && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed p-4 text-sm">
          <span>{t("noBrief")}</span>
          <ButtonLink href={`/app/projets/${pid}/brief`} variant="outline">
            {t("fillBrief")}
          </ButtonLink>
        </div>
      )}

      {canEdit && (
        <div className="mb-6 grid gap-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">{t("feedback")}</p>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => {
              const selected = chips.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setChips((list) => (selected ? list.filter((c) => c !== chip) : [...list, chip]))}
                  className={cn("rounded-full border px-3 py-1 text-sm", selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  {t(`chips.${chip}`)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={t("feedbackPlaceholder")} aria-label={t("feedback")} className="flex-1" />
            <div className="flex items-center gap-3">
              <CreditCost cost={CREDIT_COSTS.NAMES_BATCH} />
              <Button size="lg" onClick={() => launch()} disabled={busy}>
                <Sparkles />
                {names.length ? tc("actions.regenerate") : t("generate")}
              </Button>
            </div>
          </div>
          <JobProgress event={job.event} running={job.running} />
        </div>
      )}

      {names.length > 0 && (
        <div className="mb-4 flex gap-1" role="tablist" aria-label="Filtres">
          {(["all", "favorites", "rejected"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn("rounded-lg px-3 py-1.5 text-sm", filter === key ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-muted")}
            >
              {t(`filters.${key}`, { count: key === "favorites" ? favorites.length : key === "rejected" ? rejected.length : names.length - rejected.length })}
            </button>
          ))}
        </div>
      )}

      {names.length === 0 && !busy ? (
        <EmptyState icon={Type} title={t("empty")} description={t("emptyBody")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((name) => (
            <NameCard
              key={name.id}
              name={name}
              isChosen={project?.chosenName?.id === name.id}
              canEdit={canEdit}
              canVote={can("comment.create")}
              checking={checking.has(name.id)}
              compareSelected={compare.includes(name.id)}
              onFavorite={() => update.mutate({ id: name.id, patch: { isFavorite: !name.isFavorite } })}
              onReject={() => update.mutate({ id: name.id, patch: { isRejected: !name.isRejected } })}
              onCheck={() => check(name)}
              onSimilar={() => launch({ feedback: "plus proche de celui-ci", referenceNameId: name.id })}
              onChoose={() => {
                if (project?.chosenName && !window.confirm(t("changeWarning"))) return;
                choose.mutate(name);
                if (!name.checks.length) check(name);
              }}
              onVote={(value) => vote.mutate({ id: name.id, value })}
              onToggleCompare={() => toggleCompare(name.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("compareTitle")}</DialogTitle>
            <DialogDescription>{t("compareHint")}</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
            {names
              .filter((n) => compare.includes(n.id))
              .map((name) => (
                <div key={name.id} className="grid content-start gap-2 rounded-lg border p-3">
                  <p className="text-lg font-semibold">{name.value}</p>
                  <p className="text-xs text-muted-foreground">{t(`styles.${name.style}`)}</p>
                  <p className="text-sm">{name.meaning}</p>
                  {name.score != null && <p className="text-sm font-medium">{t("score", { score: name.score })}</p>}
                  <p className="text-xs">{t("votes", { count: name.votes })}</p>
                  <AvailabilityResults checks={name.checks} />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
