"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { FileArchive, FileText, Layers, Link2, Loader2, Lock, Package, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/common/button-link";
import { CreditCost } from "@/components/common/credit-cost";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { JobProgress } from "@/components/common/job-progress";
import { PageHeader } from "@/components/common/page-header";
import { KitView } from "@/components/kit/kit-view";
import { CommentsPanel } from "@/components/projects/comments-panel";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useJob } from "@/hooks/use-job";
import { useProject } from "@/hooks/use-project";
import { useCredits } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { downloadBlob } from "@/lib/render/export";
import { buildKitZip } from "@/lib/render/kit-zip";
import type { BrandKit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ComingSoon } from "@/components/common/coming-soon";

/** Les liens signés de l'API valent 15 min : la liste est relue avant leur expiration. */
const KIT_REFRESH_MS = 10 * 60_000;

export default function KitPage() {
  return api.isAvailable("brandKits") ? <KitContent /> : <KitComingSoon />;
}

function KitComingSoon() {
  const t = useTranslations("kit");
  return <ComingSoon feature="brandKits" title={t("title")} />;
}

/** Lien de téléchargement : URL signée de l'API (nouvel onglet) ou page interne (mode simulé). */
function FileLink({ href, children, variant = "outline" }: { href: string; children: ReactNode; variant?: "outline" | "default" }) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant })}>
        {children}
      </a>
    );
  }
  return (
    <ButtonLink href={href} variant={variant}>
      {children}
    </ButtonLink>
  );
}

/** Date choisie (AAAA-MM-JJ) : le lien reste valable jusqu'à la fin de cette journée. */
function endOfDay(date: string) {
  return new Date(`${date}T23:59:59`).toISOString();
}

function KitContent() {
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

  const { data: kits = [] } = useQuery({
    queryKey: qk.brandKits(pid),
    queryFn: () => api.brandKits.list(pid),
    refetchInterval: KIT_REFRESH_MS,
  });
  const { data: logos = [] } = useQuery({ queryKey: qk.logos(pid), queryFn: () => api.logos.list(pid) });
  const { data: signatures = [] } = useQuery({ queryKey: qk.signatures(pid), queryFn: () => api.signatures.list(pid) });
  const kit = kits.find((k) => k.id === selectedId) ?? kits[0] ?? null;
  const invalidate = [qk.brandKits(pid)];
  const guide = useJob(guideJob, { invalidate });
  const zip = useJob(zipJob, { invalidate });

  const onCreated = (created: BrandKit, message: string) => {
    toast.success(message);
    setSelectedId(created.id);
    queryClient.invalidateQueries({ queryKey: qk.brandKits(pid) });
    queryClient.invalidateQueries({ queryKey: qk.project(pid) });
  };
  const create = useMutation({
    mutationFn: () => api.brandKits.create(pid),
    onSuccess: (created) => onCreated(created, t("created", { version: created.version })),
    onError,
  });
  const restore = useMutation({
    mutationFn: (kid: string) => api.brandKits.restore(kid),
    onSuccess: (created) => onCreated(created, t("restored", { version: created.restoredFrom ?? "", newVersion: created.version })),
    onError,
  });
  const share = useMutation({
    mutationFn: (enabled: boolean) =>
      api.brandKits.share(kit!.id, { enabled, password: password || undefined, expiresAt: expires ? endOfDay(expires) : null }),
    onSuccess: (updated) => {
      toast.success(t("shareUpdated"));
      setPassword("");
      queryClient.setQueryData<BrandKit[]>(qk.brandKits(pid), (list) => list?.map((k) => (k.id === updated.id ? updated : k)));
    },
    onError,
  });

  const startGuide = () =>
    api.brandKits.generateGuide(kit!.id, crypto.randomUUID()).then(({ jobId }) => {
      setGuideJob(jobId);
      toast.info(t("jobQueued"));
    }, onError);
  const startZip = () =>
    api.brandKits.generateZip(kit!.id).then(({ jobId }) => {
      setZipJob(jobId);
      toast.info(t("jobQueued"));
    }, onError);

  const name = project?.chosenName?.value ?? project?.title ?? "";
  const isFree = credits.data?.planCode === "FREE";
  const canEdit = can("content.edit");
  const shareUrl = kit?.shareToken && typeof window !== "undefined" ? `${window.location.origin}${locale === "fr" ? "" : `/${locale}`}/kit/${kit.shareToken}` : null;
  const today = new Date().toISOString().slice(0, 10);

  // Mode simulé : l'archive est assemblée dans le navigateur.
  const buildClientZip = async () => {
    if (!kit) return;
    setZipping(true);
    try {
      const logo = kit.logoSpec;
      const blob = await buildKitZip(kit, {
        projectName: kit.name ?? name,
        signatures,
        brand: { name: kit.name ?? name, slogan: kit.slogan ?? undefined, logoUrl: null, primary: logo?.colors.primary ?? "#0f766e", secondary: logo?.colors.secondary ?? "#f59e0b" },
      });
      downloadBlob(blob, `kit-${slugify(kit.name ?? name) || "marque"}-v${kit.version}.zip`);
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
        <div className="grid min-w-0 content-start gap-6">
          {kit && <KitView kit={kit} projectName={name} acronym={project?.chosenName?.acronym} meaning={project?.chosenName?.meaning} />}
          {kit && <CommentsPanel pid={pid} targetType="KIT" targetId={kit.id} />}
        </div>
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("versions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1.5">
              {kits.map((k, index) => (
                <div key={k.id} className={cn("flex items-center gap-1 rounded-lg border", kit?.id === k.id ? "border-primary bg-accent" : "hover:bg-muted")}>
                  <button type="button" onClick={() => setSelectedId(k.id)} aria-pressed={kit?.id === k.id} className="min-w-0 flex-1 px-3 py-2 text-left text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      {t("version", { version: k.version })}
                      {index === 0 && <Badge variant="secondary">{t("current")}</Badge>}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {k.restoredFrom ? t("restoredFrom", { version: k.restoredFrom }) : t("createdAt", { date: format.dateTime(new Date(k.createdAt), { dateStyle: "medium" }) })}
                    </span>
                  </button>
                  {canEdit && index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1 shrink-0"
                      onClick={() => restore.mutate(k.id)}
                      disabled={restore.isPending}
                      aria-label={`${t("restore")} — ${t("version", { version: k.version })}`}
                      title={t("restore")}
                    >
                      <RotateCcw />
                    </Button>
                  )}
                </div>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <FileLink href={kit.guidePdfUrl}>{t("openGuide")}</FileLink>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={startGuide} disabled={guide.running}>
                          {t("regenerate")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={startGuide} disabled={guide.running || isFree || !canEdit}>
                        {t("generateGuide")}
                      </Button>
                      <CreditCost cost={kit.guideCost} />
                    </div>
                  )}
                  {isFree && <p className="text-xs text-muted-foreground">{t("guideFree")}</p>}
                  <JobProgress event={guide.event} running={guide.running} />
                </div>
                <div className="grid gap-2 border-t pt-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <FileArchive className="size-4" aria-hidden="true" />
                    {t("zip")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("zipBody")}</p>
                  {kit.zipUrl === "client" ? (
                    <Button onClick={buildClientZip} disabled={zipping}>
                      {zipping && <Loader2 className="animate-spin" />}
                      {zipping ? t("preparing") : t("downloadZip")}
                    </Button>
                  ) : kit.zipUrl ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <FileLink href={kit.zipUrl} variant="default">
                        {t("downloadZip")}
                      </FileLink>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={startZip} disabled={zip.running}>
                          {t("regenerate")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button variant="outline" onClick={startZip} disabled={zip.running || !canEdit}>
                      {t("generateZip")}
                    </Button>
                  )}
                  {isFree && <p className="text-xs text-muted-foreground">{t("zipFree")}</p>}
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
                      <Input id="share-password" type="password" autoComplete="new-password" minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </Field>
                    <Field label={t("shareExpires")} htmlFor="share-expires">
                      <Input id="share-expires" type="date" min={today} value={expires} onChange={(e) => setExpires(e.target.value)} />
                    </Field>
                    <Button onClick={() => share.mutate(true)} disabled={share.isPending || (password.length > 0 && password.length < 4)}>
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
