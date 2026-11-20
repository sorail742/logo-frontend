"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FolderPlus, Mail, Plus, Search, Shirt, Sparkles, Type, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/common/button-link";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "@/components/common/native-select";
import { PageHeader } from "@/components/common/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useWorkspace } from "@/hooks/use-workspace";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { ENTITY_TYPES, PROJECT_STATUSES, type EntityType, type ProjectStatus } from "@/lib/types";

export default function DashboardPage() {
  const t = useTranslations();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const [q, setQ] = useState("");
  const [entityType, setEntityType] = useState<EntityType | "">("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const filters = { q: useDeferredValue(q), entityType, status };

  const { data: projects, isLoading } = useQuery({
    queryKey: qk.projects(workspace?.id ?? "none", filters),
    queryFn: () => api.projects.list(workspace!.id, filters),
    enabled: Boolean(workspace),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["workspaces", workspace?.id, "projects"] });
  const duplicate = useMutation({
    mutationFn: api.projects.duplicate,
    onSuccess: () => {
      toast.success(t("app.dashboard.duplicated"));
      refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: api.projects.remove,
    onSuccess: () => {
      toast.success(t("app.dashboard.deleted"));
      refresh();
    },
    onError,
  });

  const hasFilters = Boolean(q || entityType || status);
  const user = useSessionStore((s) => s.user);
  const latest = projects?.[0];
  const quick: { key: string; href: string; icon: LucideIcon; tone: string; disabled?: boolean }[] = [
    {
      key: "newProject",
      href: "/app/projets/nouveau",
      icon: Plus,
      tone: "bg-white text-primary",
      disabled: !can("project.create"),
    },
    {
      key: "studio",
      href: latest ? `/app/projets/${latest.id}/studio` : "/app/projets/nouveau",
      icon: Sparkles,
      tone: "bg-amber-300 text-amber-950",
    },
    {
      key: "textile",
      href: latest ? `/app/projets/${latest.id}/textile` : "/app/projets/nouveau",
      icon: Shirt,
      tone: "bg-teal-300 text-teal-950",
    },
    { key: "names", href: "/outils/generateur-de-noms", icon: Type, tone: "bg-emerald-200 text-emerald-950" },
    { key: "signature", href: "/outils/signature-email", icon: Mail, tone: "bg-sky-200 text-sky-950" },
  ];

  return (
    <>
      <section className="premium-panel relative isolate mb-10 overflow-hidden rounded-3xl p-6 sm:p-8">
        <div
          className="bg-primary/10 absolute -top-28 right-[-5rem] -z-10 size-72 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="bg-brand-accent/10 absolute right-20 bottom-[-6rem] -z-10 size-56 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <p className="text-primary mb-2 text-xs font-semibold tracking-[0.16em] uppercase">
          {t("app.dashboard.title")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.4rem]">
          {t("app.dashboard.hello", { name: user?.fullName.split(" ")[0] ?? "" })}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed sm:text-base">
          {t("app.dashboard.helloBody")}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quick
            .filter((item) => !item.disabled)
            .map(({ key, href, icon: Icon, tone }) => (
              <Link
                key={key}
                href={href}
                className="group interactive-lift border-border/80 bg-background/80 hover:border-primary/25 hover:bg-background flex min-h-16 items-center gap-3 rounded-2xl border p-3.5"
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-[1.04]",
                    tone,
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`app.dashboard.quick.${key}.title`)}</span>
                  <span className="block truncate text-xs opacity-80">
                    {t(`app.dashboard.quick.${key}.body`)}
                  </span>
                </span>
              </Link>
            ))}
        </div>
      </section>
      <PageHeader
        title={t("app.dashboard.title")}
        description={t("app.dashboard.description")}
        actions={
          can("project.create") && (
            <ButtonLink href="/app/projets/nouveau" size="lg">
              <Plus />
              {t("app.nav.newProject")}
            </ButtonLink>
          )
        }
      />
      <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("app.dashboard.search")}
            aria-label={t("app.dashboard.search")}
            className="pl-8"
          />
        </div>
        <NativeSelect
          value={entityType}
          onChange={(e) => setEntityType(e.target.value as EntityType | "")}
          aria-label={t("app.dashboard.allTypes")}
        >
          <option value="">{t("app.dashboard.allTypes")}</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`common.entityTypes.${type}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | "")}
          aria-label={t("app.dashboard.allStatuses")}
        >
          <option value="">{t("app.dashboard.allStatuses")}</option>
          {PROJECT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`common.projectStatus.${value}`)}
            </option>
          ))}
        </NativeSelect>
      </div>

      {isLoading || !projects ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        hasFilters ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("app.dashboard.noResults")}</p>
        ) : (
          <EmptyState
            icon={FolderPlus}
            title={t("app.dashboard.empty")}
            description={t("app.dashboard.emptyBody")}
            action={
              can("project.create") && (
                <ButtonLink href="/app/projets/nouveau" size="lg">
                  {t("app.nav.newProject")}
                </ButtonLink>
              )
            }
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDuplicate={can("project.create") ? () => duplicate.mutate(project.id) : undefined}
              onDelete={
                can("project.delete")
                  ? () => window.confirm(t("app.dashboard.deleteConfirm")) && remove.mutate(project.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
