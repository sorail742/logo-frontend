"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FileQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useProject } from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import { ProjectTabs } from "./project-tabs";

export function ProjectFrame({ children }: Readonly<{ children: ReactNode }>) {
  const t = useTranslations();
  const { project, pid, isLoading, error } = useProject();

  if (error) return <EmptyState icon={FileQuestion} title={t("app.errors.projectNotFound")} />;

  return (
    <div className="space-y-4">
      {/* En-tête du projet avec titre et métadonnées */}
      <div className="no-print border-border/60 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        {isLoading || !project ? (
          <Skeleton className="h-8 w-64 rounded-lg" />
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              {project.chosenName?.value ?? project.title}
            </h1>

            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
              {t(`common.entityTypes.${project.entityType}`)}
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                project.status === "FINALIZED"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-border/80 bg-muted/40 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "mr-1.5 inline-block size-1.5 rounded-full",
                  project.status === "FINALIZED" ? "bg-emerald-500" : "bg-muted-foreground/60",
                )}
              />
              {t(`common.projectStatus.${project.status}`)}
            </Badge>
          </div>
        )}
      </div>

      {/* Navigation "Canva-Style" avec grandes cartes et statut */}
      <ProjectTabs pid={pid} project={project} />

      {/* Contenu principal de la page courante */}
      <div className="pt-1">{children}</div>
    </div>
  );
}
