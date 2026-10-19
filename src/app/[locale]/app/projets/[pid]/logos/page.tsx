"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ImagePlus, PenTool, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/common/button-link";
import { CreditCost } from "@/components/common/credit-cost";
import { EmptyState } from "@/components/common/empty-state";
import { JobProgress } from "@/components/common/job-progress";
import { PageHeader } from "@/components/common/page-header";
import { ImportLogoDialog } from "@/components/logos/import-logo-dialog";
import { LogoCard, type RelaunchKind } from "@/components/logos/logo-card";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useJob } from "@/hooks/use-job";
import { useProject } from "@/hooks/use-project";
import { api, newIdempotencyKey, type LogoGenerationInput } from "@/lib/api";
import { CREDIT_COSTS } from "@/lib/credits";
import { qk } from "@/lib/query-keys";
import { LOGO_STYLES, LOGO_TYPES, type Logo, type LogoStyle, type LogoType } from "@/lib/types";
import { cn } from "@/lib/utils";

const RELAUNCH_FEEDBACK: Record<RelaunchKind, string> = {
  simpler: "plus simple",
  otherIcon: "autre icône",
  sameColors: "mêmes couleurs",
};

function LogosContent() {
  const t = useTranslations("logos");
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const searchParams = useSearchParams();
  const { project, pid, can } = useProject();
  const [type, setType] = useState<LogoType>("ICON_TEXT");
  const [style, setStyle] = useState<LogoStyle>("MODERN");
  const [engine, setEngine] = useState<LogoGenerationInput["engine"]>("SVG_COMPOSER");
  const [customPalette, setCustomPalette] = useState<string[] | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(searchParams.get("import") === "1");

  const { data: logos = [] } = useQuery({ queryKey: qk.logos(pid), queryFn: () => api.logos.list(pid) });
  const job = useJob(jobId, {
    invalidate: [qk.logos(pid), qk.project(pid)],
    onDone: (event) => event.status === "SUCCEEDED" && toast.success(t("batchReady")),
  });

  const generate = useMutation({
    mutationFn: (input: Partial<LogoGenerationInput>) =>
      api.logos.generate(pid, { type, style, engine, palette: customPalette ?? undefined, ...input }, newIdempotencyKey()),
    onSuccess: ({ jobId }) => setJobId(jobId),
    onError,
  });
  const favorite = useMutation({
    mutationFn: (logo: Logo) => api.logos.update(logo.id, { isFavorite: !logo.isFavorite }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Logo[]>(qk.logos(pid), (list) => list?.map((l) => (l.id === updated.id ? updated : l)));
      queryClient.invalidateQueries({ queryKey: qk.project(pid) });
    },
    onError,
  });
  const importLogo = useMutation({
    mutationFn: (input: { svg?: string; pngDataUrl?: string; palette: string[] }) => api.logos.importLogo(pid, input),
    onSuccess: () => {
      toast.success(t("imported"));
      setImportOpen(false);
      queryClient.invalidateQueries({ queryKey: qk.logos(pid) });
      queryClient.invalidateQueries({ queryKey: qk.project(pid) });
    },
    onError,
  });

  const canEdit = can("generation.run");
  const busy = generate.isPending || job.running;
  const cost = engine === "IMAGE_VECTORIZE" ? CREDIT_COSTS.LOGOS_IMAGE_VECTORIZE : CREDIT_COSTS.LOGOS_SVG_COMPOSER;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canEdit && (
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <ImagePlus />
              {t("import")}
            </Button>
          )
        }
      />

      {project && !project.chosenName && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed p-4 text-sm">
          <span>{t("noName")}</span>
          <ButtonLink href={`/app/projets/${pid}/noms`} variant="outline">
            {t("chooseName")}
          </ButtonLink>
        </div>
      )}

      {canEdit && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("params")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("type")}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LOGO_TYPES.map((value) => (
                  <label key={value} className={cn("cursor-pointer rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50", type === value ? "border-primary bg-accent font-medium" : "hover:bg-muted")}>
                    <input type="radio" name="type" className="sr-only" checked={type === value} onChange={() => setType(value)} />
                    {t(`types.${value}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("style")}</legend>
              <div className="flex flex-wrap gap-2">
                {LOGO_STYLES.map((value) => (
                  <button key={value} type="button" aria-pressed={style === value} onClick={() => setStyle(value)} className={cn("rounded-full border px-3 py-1 text-sm", style === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                    {t(`styles.${value}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">{t("palette")}</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="palette" className="size-4 accent-[var(--primary)]" checked={!customPalette} onChange={() => setCustomPalette(null)} />
                {t("paletteAuto")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="palette" className="size-4 accent-[var(--primary)]" checked={Boolean(customPalette)} onChange={() => setCustomPalette(["#0f766e", "#f59e0b"])} />
                {t("paletteCustom")}
              </label>
              {customPalette && (
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  {customPalette.map((hex, index) => (
                    <span key={index} className="flex items-center gap-1 rounded-lg border p-1">
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => setCustomPalette((list) => list!.map((c, i) => (i === index ? e.target.value : c)))}
                        className="size-7 cursor-pointer rounded border-0 bg-transparent"
                        aria-label={`${t("palette")} ${index + 1}`}
                      />
                      <span className="font-mono text-xs">{hex.toUpperCase()}</span>
                      {customPalette.length > 2 && (
                        <button type="button" onClick={() => setCustomPalette((list) => list!.filter((_, i) => i !== index))} aria-label="×">
                          <X className="size-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {customPalette.length < 4 && (
                    <Button variant="ghost" size="sm" onClick={() => setCustomPalette((list) => [...list!, "#111827"])}>
                      <Plus />
                      {t("addColor")}
                    </Button>
                  )}
                </div>
              )}
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("engine")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["SVG_COMPOSER", "IMAGE_VECTORIZE"] as const).map((value) => (
                  <label key={value} className={cn("flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50", engine === value ? "border-primary bg-accent" : "hover:bg-muted")}>
                    <input type="radio" name="engine" className="sr-only" checked={engine === value} onChange={() => setEngine(value)} />
                    <span>
                      <span className="block text-sm font-medium">{t(`engines.${value}`)}</span>
                      <span className="block text-xs text-muted-foreground">{t(`engines.${value}Body`)}</span>
                    </span>
                    <CreditCost cost={value === "IMAGE_VECTORIZE" ? CREDIT_COSTS.LOGOS_IMAGE_VECTORIZE : CREDIT_COSTS.LOGOS_SVG_COMPOSER} />
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-end gap-3">
              <CreditCost cost={cost} />
              <Button size="lg" onClick={() => generate.mutate({})} disabled={busy}>
                <Sparkles />
                {t("generate")}
              </Button>
            </div>
            <JobProgress event={job.event} running={job.running} />
          </CardContent>
        </Card>
      )}

      {logos.length === 0 && !busy ? (
        <EmptyState icon={PenTool} title={t("empty")} description={t("emptyBody")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {logos.map((logo) => (
            <LogoCard
              key={logo.id}
              logo={logo}
              pid={pid}
              canEdit={canEdit}
              onFavorite={() => favorite.mutate(logo)}
              onRelaunch={(kind) =>
                generate.mutate({
                  feedback: RELAUNCH_FEEDBACK[kind],
                  referenceLogoId: logo.id,
                  palette: kind === "sameColors" ? [logo.current.spec.colors.primary, logo.current.spec.colors.secondary, logo.current.spec.colors.text, logo.current.spec.colors.background] : customPalette ?? undefined,
                })
              }
            />
          ))}
        </div>
      )}

      <ImportLogoDialog open={importOpen} onOpenChange={setImportOpen} onImport={(input) => importLogo.mutate(input)} busy={importLogo.isPending} />
    </>
  );
}

export default function LogosPage() {
  return (
    <Suspense>
      <LogosContent />
    </Suspense>
  );
}
