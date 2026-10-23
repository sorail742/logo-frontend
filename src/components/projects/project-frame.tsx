"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useProject } from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import { FileQuestion, Globe, Shirt, Sparkles, type LucideIcon } from "lucide-react";

const STEPS = [
  { id: "overview", path: "", done: null },
  { id: "brief", path: "/brief", done: "brief" },
  { id: "names", path: "/noms", done: "name" },
  { id: "logos", path: "/logos", done: "logo" },
  { id: "signatures", path: "/signatures", done: "signatures" },
  { id: "kit", path: "/kit", done: "kit" },
  { id: "studio", path: "/studio", done: null },
  { id: "textile", path: "/textile", done: null },
  { id: "site", path: "/site", done: "site" },
] as const;

/** Étapes facultatives, repérées par une icône plutôt que par un numéro. */
const STEP_ICONS: Partial<Record<(typeof STEPS)[number]["id"], LucideIcon>> = { studio: Sparkles, textile: Shirt, site: Globe };

function StepMarker({ id, index, done }: { id: (typeof STEPS)[number]["id"]; index: number; done: boolean }) {
  const Icon = done ? Check : STEP_ICONS[id];
  return Icon ? <Icon className="size-3" /> : index;
}

export function ProjectFrame({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { project, pid, isLoading, error } = useProject();

  if (error) return <EmptyState icon={FileQuestion} title={t("app.errors.projectNotFound")} />;
  const base = `/app/projets/${pid}`;

  return (
    <div>
      <div className="no-print mb-4">
        {isLoading || !project ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{project.chosenName?.value ?? project.title}</h1>
            <Badge variant="secondary">{t(`common.entityTypes.${project.entityType}`)}</Badge>
            <Badge variant="outline">{t(`common.projectStatus.${project.status}`)}</Badge>
          </div>
        )}
      </div>
      <nav className="no-print -mx-4 mb-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0" aria-label="Étapes du projet">
        <ol className="flex min-w-max gap-1">
          {STEPS.map((step, index) => {
            const href = `${base}${step.path}`;
            const active = step.path ? pathname.startsWith(href) : pathname === base;
            const done = step.done && project?.progress[step.done];
            return (
              <li key={step.id}>
                <Link
                  href={href}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm",
                    active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[11px]",
                      done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    <StepMarker id={step.id} index={index} done={Boolean(done)} />
                  </span>
                  {t(`app.steps.${step.id}`)}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
      {children}
    </div>
  );
}
