"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { LayoutTemplate, Package, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/common/button-link";
import { NativeSelect } from "@/components/common/native-select";
import { LogoPreview } from "@/components/brand/logo-preview";
import { CommentsPanel } from "@/components/projects/comments-panel";
import { ProjectOverviewGrid } from "@/components/projects/project-overview-grid";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { mix } from "@/lib/render/color";
import { cssFontFamily, getFont } from "@/lib/render/fonts";
import { pairedBody } from "@/lib/studio/brand";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/types";

export default function ProjectOverviewPage() {
  const t = useTranslations();
  const format = useFormatter();
  // Heure de référence des durées relatives (« il y a 3 minutes »), rafraîchie chaque minute.
  const now = useNow({ updateInterval: 60_000 });
  const { project, pid, can } = useProject();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { data: activity } = useQuery({
    queryKey: qk.activity(pid),
    queryFn: () => api.projects.activity(pid),
  });
  const { data: designs } = useQuery({ queryKey: qk.studio(pid), queryFn: () => api.studio.list(pid) });
  const update = useMutation({
    mutationFn: (status: ProjectStatus) => api.projects.update(pid, { status }),
    onSuccess: (data) => queryClient.setQueryData(qk.project(pid), data),
    onError,
  });

  if (!project) return null;
  const spec = project.previewSpec ?? null;
  const name = project.chosenName?.value ?? project.title;
  const heading = spec ? getFont(spec.fontId) : null;
  const body = spec ? getFont(pairedBody({ fontId: spec.fontId, fontWeight: spec.fontWeight }).fontId) : null;
  const palette = spec
    ? [spec.colors.primary, spec.colors.secondary, spec.colors.text, spec.colors.background]
    : [];
  const canEdit = can("content.edit");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid min-w-0 content-start gap-6">
        {/* ======================================================== */}
        {/* 1. TABLEAU DE BORD CANVA-STYLE (Progression + 8 Outils)  */}
        {/* ======================================================== */}
        <ProjectOverviewGrid
          pid={pid}
          project={project}
          designsCount={designs?.length ?? 0}
          canEdit={canEdit}
        />

        {/* ======================================================== */}
        {/* 2. FICHE D'IDENTITÉ DE MARQUE                            */}
        {/* ======================================================== */}
        <section className="premium-panel interactive-lift overflow-hidden rounded-3xl">
          <div className="grid md:grid-cols-[1.1fr_1fr]">
            <div
              className="studio-stage flex min-h-56 items-center justify-center p-8"
              style={{
                background: spec
                  ? `radial-gradient(circle at 30% 20%, #ffffff, ${mix(spec.colors.primary, "#ffffff", 0.88)})`
                  : undefined,
              }}
            >
              {spec ? (
                <LogoPreview
                  spec={spec}
                  className="aspect-[2/1] w-full max-w-sm bg-transparent transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <span className="text-muted-foreground text-sm">{t("app.overview.noLogo")}</span>
              )}
            </div>
            <div className="grid content-start gap-5 p-6">
              <div>
                <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
                  {t("app.overview.brand")}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {project.chosenName ? project.chosenName.meaning : t("app.overview.noName")}
                </p>
              </div>
              {palette.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-medium">
                    {t("app.overview.palette")}
                  </p>
                  <div className="flex gap-2">
                    {palette.map((color, i) => (
                      <span key={i} className="grid flex-1 gap-1">
                        <span
                          className="h-9 rounded-lg border border-black/5 shadow-xs transition-transform hover:scale-105"
                          style={{ background: color }}
                        />
                        <span className="text-muted-foreground font-mono text-[10px] uppercase">
                          {color.slice(1)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {heading && body && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/60 rounded-xl p-3">
                    <p className="text-muted-foreground text-[11px]">{t("app.overview.headingFont")}</p>
                    <p
                      className="truncate text-lg"
                      style={{ fontFamily: cssFontFamily(heading.id), fontWeight: 700 }}
                    >
                      {heading.name}
                    </p>
                  </div>
                  <div className="bg-muted/60 rounded-xl p-3">
                    <p className="text-muted-foreground text-[11px]">{t("app.overview.bodyFont")}</p>
                    <p className="truncate text-lg" style={{ fontFamily: cssFontFamily(body.id) }}>
                      {body.name}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`/app/projets/${pid}/studio`} size="lg">
                  <Sparkles />
                  {t("app.overview.openStudio")}
                </ButtonLink>
                <ButtonLink href={`/app/projets/${pid}/kit`} variant="outline" size="lg">
                  <Package />
                  {t("app.overview.kitLink")}
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. CRÉATIONS DU STUDIO                                   */}
        {/* ======================================================== */}
        <Card className="glow-card border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("app.overview.studioTitle")}</CardTitle>
            <Link
              href={`/app/projets/${pid}/studio`}
              className="text-primary text-sm font-medium hover:underline"
            >
              {t("app.overview.seeAll")}
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(designs ?? []).slice(0, canEdit ? 3 : 4).map((design) => (
                <Link key={design.id} href={`/studio/${design.id}`} className="group grid gap-1.5">
                  <span className="bg-muted/50 group-hover:border-primary flex aspect-square items-center justify-center overflow-hidden rounded-xl border p-2 transition group-hover:shadow-md">
                    {design.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element -- aperçu en data URL
                      <img
                        src={design.thumbnail}
                        alt=""
                        className="max-h-full max-w-full rounded shadow-sm transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <LayoutTemplate className="text-muted-foreground size-6" aria-hidden="true" />
                    )}
                  </span>
                  <span className="truncate text-xs font-medium">{design.name}</span>
                </Link>
              ))}
              {canEdit && (
                <Link href={`/app/projets/${pid}/studio`} className="group grid gap-1.5">
                  <span className="text-muted-foreground group-hover:border-primary group-hover:text-primary flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center text-xs transition">
                    <Plus className="size-5" aria-hidden="true" />
                    {t("app.overview.newDesign")}
                  </span>
                  {!designs?.length && (
                    <span className="text-muted-foreground text-xs">{t("app.overview.studioEmpty")}</span>
                  )}
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <CommentsPanel pid={pid} targetType="PROJECT" targetId={pid} />
      </div>

      <div className="grid content-start gap-6">
        <Card className="glow-card border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm">{t("app.overview.status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <NativeSelect
              value={project.status}
              onChange={(e) => update.mutate(e.target.value as ProjectStatus)}
              disabled={!canEdit}
              aria-label={t("app.overview.status")}
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`common.projectStatus.${status}`)}
                </option>
              ))}
            </NativeSelect>
          </CardContent>
        </Card>

        <Card className="glow-card border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm">{t("app.overview.activity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activity?.length ? (
              <ol className="before:bg-border relative grid gap-4 text-sm before:absolute before:top-1 before:bottom-1 before:left-[5px] before:w-px">
                {activity.map((item) => (
                  <li key={item.id} className="relative pl-6">
                    <span
                      className="border-background bg-primary/60 absolute top-1.5 left-0 size-[11px] rounded-full border-2"
                      aria-hidden="true"
                    />
                    <span className="font-medium">{item.actor}</span> {item.action}
                    <span className="text-muted-foreground block text-xs">
                      {format.relativeTime(
                        new Date(Math.min(Date.parse(item.createdAt), now.getTime())),
                        now,
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground text-sm">{t("app.overview.noActivity")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
