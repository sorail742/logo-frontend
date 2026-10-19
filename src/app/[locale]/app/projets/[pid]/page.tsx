"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/common/button-link";
import { NativeSelect } from "@/components/common/native-select";
import { LogoPreview } from "@/components/brand/logo-preview";
import { ProjectProgress } from "@/components/projects/project-card";
import { CommentsPanel } from "@/components/projects/comments-panel";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/types";

export default function ProjectOverviewPage() {
  const t = useTranslations();
  const format = useFormatter();
  // Heure de référence des durées relatives (« il y a 3 minutes »), rafraîchie chaque minute.
  const now = useNow({ updateInterval: 60_000 });
  const { project, pid, can } = useProject();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { data: activity } = useQuery({ queryKey: qk.activity(pid), queryFn: () => api.projects.activity(pid) });
  const update = useMutation({
    mutationFn: (status: ProjectStatus) => api.projects.update(pid, { status }),
    onSuccess: (data) => queryClient.setQueryData(qk.project(pid), data),
    onError,
  });

  if (!project) return null;
  const steps = [
    { key: "brief", href: "brief" },
    { key: "name", href: "noms" },
    { key: "logo", href: "logos" },
    { key: "signatures", href: "signatures" },
    { key: "kit", href: "kit" },
  ] as const;
  const next = steps.find((step) => !project.progress[step.key]);
  const done = steps.filter((step) => project.progress[step.key]).length;
  const stepLabel: Record<(typeof steps)[number]["key"], string> = {
    brief: t("app.steps.brief"),
    name: t("app.steps.names"),
    logo: t("app.steps.logos"),
    signatures: t("app.steps.signatures"),
    kit: t("app.steps.kit"),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("app.overview.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ProjectProgress project={project} />
            <p className="text-sm text-muted-foreground">{t("app.overview.stepsDone", { done, total: steps.length })}</p>
            {next && can("content.edit") && (
              <ButtonLink href={`/app/projets/${pid}/${next.href}`} size="lg" className="justify-self-start">
                {t("app.overview.next")} : {stepLabel[next.key]}
                <ArrowRight />
              </ButtonLink>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t("app.overview.chosenName")}</CardTitle>
            </CardHeader>
            <CardContent>
              {project.chosenName ? (
                <>
                  <p className="text-2xl font-semibold">{project.chosenName.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{project.chosenName.meaning}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("app.overview.noName")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t("app.overview.favoriteLogo")}</CardTitle>
            </CardHeader>
            <CardContent>
              {project.previewSpec ? (
                <LogoPreview spec={project.previewSpec} className="aspect-[2/1] rounded-lg" />
              ) : (
                <p className="text-sm text-muted-foreground">{t("app.overview.noLogo")}</p>
              )}
            </CardContent>
          </Card>
        </div>
        <CommentsPanel pid={pid} targetType="NAME" targetId={pid} />
      </div>
      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("app.overview.status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <NativeSelect value={project.status} onChange={(e) => update.mutate(e.target.value as ProjectStatus)} disabled={!can("content.edit")} aria-label={t("app.overview.status")}>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`common.projectStatus.${status}`)}
                </option>
              ))}
            </NativeSelect>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("app.overview.activity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activity?.length ? (
              <ol className="grid gap-3 text-sm">
                {activity.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">{item.actor}</span> {item.action}
                    <span className="block text-xs text-muted-foreground">{format.relativeTime(new Date(item.createdAt), now)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">{t("app.overview.noActivity")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
