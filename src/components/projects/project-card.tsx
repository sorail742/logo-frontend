"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Copy, MoreHorizontal, Shirt, Sparkles, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoPreview } from "@/components/brand/logo-preview";
import { mix } from "@/lib/render/color";
import type { Project } from "@/lib/types";

export function ProjectProgress({ project }: { project: Project }) {
  const steps = Object.values(project.progress);
  const done = steps.filter(Boolean).length;
  return (
    <div className="flex gap-1" aria-label={`${done}/${steps.length}`}>
      {steps.map((ok, i) => (
        <span
          key={i}
          className={ok ? "bg-primary h-1.5 flex-1 rounded-full" : "bg-muted h-1.5 flex-1 rounded-full"}
        />
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
  const colors = project.previewSpec?.colors;
  const steps = Object.values(project.progress);

  return (
    <article className="surface-elevated interactive-lift group relative flex flex-col overflow-hidden rounded-2xl">
      <Link href={`/app/projets/${project.id}`} className="absolute inset-0 z-0" aria-label={name} />
      <div
        className="relative flex aspect-[16/9] items-center justify-center border-b"
        style={{
          background: colors
            ? `radial-gradient(circle at 30% 20%, #ffffff, ${mix(colors.primary, "#ffffff", 0.9)})`
            : undefined,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/35 opacity-70"
          aria-hidden="true"
        />
        {project.previewSpec ? (
          <LogoPreview
            spec={project.previewSpec}
            className="h-full w-full bg-transparent p-7 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl text-2xl font-semibold">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
        {colors && (
          <span className="absolute bottom-3 left-3 flex -space-x-1.5" aria-hidden="true">
            {[colors.primary, colors.secondary, colors.text].map((c, i) => (
              <span key={i} className="size-4 rounded-full ring-2 ring-white" style={{ background: c }} />
            ))}
          </span>
        )}
        <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <Link
            href={`/app/projets/${project.id}/textile`}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-500/20 backdrop-blur hover:bg-white hover:text-emerald-950"
          >
            <Shirt className="size-3 text-emerald-600" aria-hidden="true" />
            Textile
          </Link>
          <Link
            href={`/app/projets/${project.id}/studio`}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-800 shadow-sm ring-1 ring-black/5 backdrop-blur hover:bg-white"
          >
            <Sparkles className="size-3 text-amber-500" aria-hidden="true" />
            {t("app.dashboard.openStudio")}
          </Link>
        </div>
      </div>
      <div className="grid gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-medium">{name}</h2>
            <p className="text-muted-foreground text-xs">
              {t(`common.entityTypes.${project.entityType}`)} ·{" "}
              {t("app.dashboard.updated", {
                date: format.dateTime(new Date(project.updatedAt), { dateStyle: "medium" }),
              })}
            </p>
          </div>
          {(onDuplicate || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="relative z-10" aria-label="Actions" />
                }
              >
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
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {t("app.dashboard.steps", { done: steps.filter(Boolean).length, total: steps.length })}
          </span>
        </div>
      </div>
    </article>
  );
}
