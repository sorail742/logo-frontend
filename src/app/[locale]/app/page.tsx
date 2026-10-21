"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FolderPlus, Mail, Plus, Search, Sparkles, Type, type LucideIcon } from "lucide-react";
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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspace?.id, "projects"] });
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
    { key: "newProject", href: "/app/projets/nouveau", icon: Plus, tone: "bg-white text-primary", disabled: !can("project.create") },
    { key: "studio", href: latest ? `/app/projets/${latest.id}/studio` : "/app/projets/nouveau", icon: Sparkles, tone: "bg-amber-300 text-amber-950" },
    { key: "names", href: "/outils/generateur-de-noms", icon: Type, tone: "bg-emerald-200 text-emerald-950" },
    { key: "signature", href: "/outils/signature-email", icon: Mail, tone: "bg-sky-200 text-sky-950" },
  ];

  return (
    <>
      <section className="relative isolate mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-700 to-teal-900 p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-amber-300/25 blur-3xl" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] [background-size:20px_20px]" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("app.dashboard.hello", { name: user?.fullName.split(" ")[0] ?? "" })}</h1>
        <p className="mt-1 opacity-85">{t("app.dashboard.helloBody")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quick
            .filter((item) => !item.disabled)
            .map(({ key, href, icon: Icon, tone }) => (
              <Link key={key} href={href} className="group flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition group-hover:scale-105", tone)}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`app.dashboard.quick.${key}.title`)}</span>
                  <span className="block truncate text-xs opacity-80">{t(`app.dashboard.quick.${key}.body`)}</span>
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
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("app.dashboard.search")} aria-label={t("app.dashboard.search")} className="pl-8" />
        </div>
        <NativeSelect value={entityType} onChange={(e) => setEntityType(e.target.value as EntityType | "")} aria-label={t("app.dashboard.allTypes")}>
          <option value="">{t("app.dashboard.allTypes")}</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`common.entityTypes.${type}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | "")} aria-label={t("app.dashboard.allStatuses")}>
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
          <p className="py-10 text-center text-sm text-muted-foreground">{t("app.dashboard.noResults")}</p>
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
              onDelete={can("project.delete") ? () => window.confirm(t("app.dashboard.deleteConfirm")) && remove.mutate(project.id) : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}
