"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogoPreview } from "@/components/brand/logo-preview";
import type { Project } from "@/lib/types";

export function ProjectProgress({ project }: { project: Project }) {
  const steps = Object.values(project.progress);
  const done = steps.filter(Boolean).length;
  return (
    <div className="flex gap-1" aria-label={`${done}/${steps.length}`}>
      {steps.map((ok, i) => (
        <span key={i} className={ok ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-muted"} />
      ))}
    </div>
  );
}

export function ProjectCard({
  project,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const name = project.chosenName?.value ?? project.title;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <Link href={`/app/projets/${project.id}`} className="absolute inset-0 z-0" aria-label={name} />
      <div className="flex aspect-[16/9] items-center justify-center border-b bg-muted/40">
        {project.previewSpec ? (
          <LogoPreview spec={project.previewSpec} className="h-full w-full bg-transparent p-6" />
        ) : (
          <span className="text-3xl font-semibold text-muted-foreground/60">{name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="grid gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-medium">{name}</h2>
            <p className="text-xs text-muted-foreground">
              {t(`common.entityTypes.${project.entityType}`)} · {t("app.dashboard.updated", { date: format.dateTime(new Date(project.updatedAt), { dateStyle: "medium" }) })}
            </p>
          </div>
          {(onDuplicate || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="relative z-10" aria-label="Actions" />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="size-4" />
                    {t("common.actions.duplicate")}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} variant="destructive">
                    <Trash2 className="size-4" />
                    {t("common.actions.delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t(`common.projectStatus.${project.status}`)}</Badge>
          <div className="flex-1">
            <ProjectProgress project={project} />
          </div>
        </div>
      </div>
    </article>
  );
}
