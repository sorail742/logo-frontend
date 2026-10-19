"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { FileArchive, FileText, Layers, Link2, Loader2, Lock, Package } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/common/button-link";
import { CreditCost } from "@/components/common/credit-cost";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { JobProgress } from "@/components/common/job-progress";
import { PageHeader } from "@/components/common/page-header";
import { KitView } from "@/components/kit/kit-view";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useJob } from "@/hooks/use-job";
import { useProject } from "@/hooks/use-project";
import { useCredits } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { CREDIT_COSTS } from "@/lib/credits";
import { slugify } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { downloadBlob } from "@/lib/render/export";
import { buildKitZip } from "@/lib/render/kit-zip";
import type { BrandKit } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function KitPage() {
  const t = useTranslations("kit");
  const format = useFormatter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { project, pid, can } = useProject();
  const credits = useCredits();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guideJob, setGuideJob] = useState<string | null>(null);
  const [zipJob, setZipJob] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [password, setPassword] = useState("");
  const [expires, setExpires] = useState("");

  const { data: kits = [] } = useQuery({ queryKey: qk.brandKits(pid), queryFn: () => api.brandKits.list(pid) });
  const { data: logos = [] } = useQuery({ queryKey: qk.logos(pid), queryFn: () => api.logos.list(pid) });
  const { data: signatures = [] } = useQuery({ queryKey: qk.signatures(pid), queryFn: () => api.signatures.list(pid) });
  const kit = kits.find((k) => k.id === selectedId) ?? kits[0] ?? null;
  const invalidate = [qk.brandKits(pid)];
  const guide = useJob(guideJob, { invalidate });
  const zip = useJob(zipJob, { invalidate });

  const create = useMutation({
    mutationFn: () => api.brandKits.create(pid),
    onSuccess: (created) => {
      toast.success(t("created", { version: created.version }));
      setSelectedId(created.id);
      queryClient.invalidateQueries({ queryKey: qk.brandKits(pid) });
      queryClient.invalidateQueries({ queryKey: qk.project(pid) });
    },
    onError,
  });
  const share = useMutation({
    mutationFn: (enabled: boolean) => api.brandKits.share(kit!.id, { enabled, password: password || undefined, expiresAt: expires ? new Date(expires).toISOString() : null }),
    onSuccess: (updated) => {
      toast.success(t("shareUpdated"));
      queryClient.setQueryData<BrandKit[]>(qk.brandKits(pid), (list) => list?.map((k) => (k.id === updated.id ? updated : k)));
    },
    onError,
  });

  const name = project?.chosenName?.value ?? project?.title ?? "";
  const isFree = credits.data?.planCode === "FREE";
  const canEdit = can("content.edit");
  const shareUrl = kit?.shareToken && typeof window !== "undefined" ? `${window.location.origin}${locale === "fr" ? "" : `/${locale}`}/kit/${kit.shareToken}` : null;

  const downloadZip = async () => {
    if (!kit) return;
    if (kit.zipUrl && kit.zipUrl !== "client") {
      window.location.href = kit.zipUrl;
      return;
    }
    setZipping(true);
    try {
      const logo = kit.logoSpec;
      const blob = await buildKitZip(kit, {
        projectName: name,
        signatures,
        brand: { name, slogan: kit.slogan ?? undefined, logoUrl: null, primary: logo?.colors.primary ?? "#0f766e", secondary: logo?.colors.secondary ?? "#f59e0b" },
      });
      downloadBlob(blob, `kit-${slugify(name) || "marque"}-v${kit.version}.zip`);
    } catch (error) {
      onError(error);
    } finally {
      setZipping(false);
    }
  };

  if (!kits.length) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          icon={Package}
          title={t("empty")}
          description={logos.length ? t("emptyBody") : t("noLogo")}
          action={
            canEdit &&
            (logos.length ? (
              <Button size="lg" onClick={() => create.mutate()} disabled={create.isPending}>
                {t("create")}
              </Button>
            ) : (
              <ButtonLink href={`/app/projets/${pid}/logos`} size="lg">
                {t("logo")}
              </ButtonLink>
            ))
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canEdit && (
            <Button variant="outline" onClick={() => create.mutate()} disabled={create.isPending}>
              <Layers />
              {t("create")}
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">{kit && <KitView kit={kit} projectName={name} acronym={project?.chosenName?.acronym} meaning={project?.chosenName?.meaning} />}</div>
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("versions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1.5">
              {kits.map((k, index) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setSelectedId(k.id)}
                  aria-pressed={kit?.id === k.id}
                  className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm", kit?.id === k.id ? "border-primary bg-accent" : "hover:bg-muted")}
                >
                  <span>
                    <span className="font-medium">{t("version", { version: k.version })}</span>
                    <span className="block text-xs text-muted-foreground">{t("createdAt", { date: format.dateTime(new Date(k.createdAt), { dateStyle: "medium" }) })}</span>
                  </span>
                  {index === 0 && <Badge variant="secondary">{t("current")}</Badge>}
                </button>
              ))}
            </CardContent>
          </Card>

          {kit && can("export.download") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("deliverables")}</CardTitle>
                <CardDescription className="text-xs">{t("asyncNote")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-4" aria-hidden="true" />
                    {t("guide")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("guideBody")}</p>
                  {kit.guidePdfUrl ? (
                    <ButtonLink href={kit.guidePdfUrl} variant="outline">
                      {t("openGuide")}
                    </ButtonLink>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => api.brandKits.generateGuide(kit.id).then(({ jobId }) => setGuideJob(jobId), onError)}
                        disabled={guide.running || isFree}
                      >
                        {t("generateGuide")}
                      </Button>
                      <CreditCost cost={CREDIT_COSTS.BRAND_GUIDE_PDF} />
                    </div>
                  )}
                  <JobProgress event={guide.event} running={guide.running} />
                </div>
                <div className="grid gap-2 border-t pt-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <FileArchive className="size-4" aria-hidden="true" />
                    {t("zip")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("zipBody")}</p>
                  {kit.zipUrl ? (
                    <Button onClick={downloadZip} disabled={zipping}>
                      {zipping && <Loader2 className="animate-spin" />}
                      {zipping ? t("preparing") : t("downloadZip")}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => api.brandKits.generateZip(kit.id).then(({ jobId }) => setZipJob(jobId), onError)} disabled={zip.running || isFree}>
                      {t("generateZip")}
                    </Button>
                  )}
                  <JobProgress event={zip.event} running={zip.running} />
                </div>
                {isFree && (
                  <ButtonLink href="/app/facturation" size="lg">
                    {t("upgrade")}
                  </ButtonLink>
                )}
              </CardContent>
            </Card>
          )}

          {kit && canEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Link2 className="size-4" aria-hidden="true" />
                  {t("share")}
                </CardTitle>
                <CardDescription className="text-xs">{t("shareBody")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {shareUrl ? (
                  <>
                    <Input value={shareUrl} readOnly aria-label={t("share")} onFocus={(e) => e.target.select()} />
                    {kit.hasPassword && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="size-3.5" aria-hidden="true" />
                        {t("protected")}
                      </p>
                    )}
                    {kit.shareExpiresAt && <p className="text-xs text-muted-foreground">{format.dateTime(new Date(kit.shareExpiresAt), { dateStyle: "long" })}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => navigator.clipboard.writeText(shareUrl).then(() => toast.success(t("shareCopied")))}>
                        {t("shareCopy")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => share.mutate(false)} disabled={share.isPending}>
                        {t("shareDisable")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label={t("sharePassword")} htmlFor="share-password">
                      <Input id="share-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </Field>
                    <Field label={t("shareExpires")} htmlFor="share-expires">
                      <Input id="share-expires" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
                    </Field>
                    <Button onClick={() => share.mutate(true)} disabled={share.isPending}>
                      {t("shareEnable")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
