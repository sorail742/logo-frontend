"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AppWindow, Building2, CalendarDays, HandHeart, Layers, Mail, PenTool, Route, Shapes, Type } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useWorkspace } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<EntityType, typeof HandHeart> = {
  ASSOCIATION: HandHeart,
  APPLICATION: AppWindow,
  PLATFORM: Layers,
  COMPANY: Building2,
  EVENT: CalendarDays,
  OTHER: Shapes,
};

type Path = "full" | "hasName" | "hasLogo" | "emailOnly";
const PATHS: { id: Path; icon: typeof Route }[] = [
  { id: "full", icon: Route },
  { id: "hasName", icon: Type },
  { id: "hasLogo", icon: PenTool },
  { id: "emailOnly", icon: Mail },
];

export default function NewProjectPage() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { workspace } = useWorkspace();
  const [entityType, setEntityType] = useState<EntityType>("ASSOCIATION");
  const [title, setTitle] = useState("");
  const [path, setPath] = useState<Path>("full");
  const [existingName, setExistingName] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.projects.create(workspace!.id, {
        title: title.trim() || existingName.trim() || t(`common.entityTypes.${entityType}`),
        entityType,
        existingName: path === "hasName" ? existingName : undefined,
      }),
    onSuccess: (project) => {
      toast.success(t("app.newProject.created"));
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspace?.id, "projects"] });
      const next: Record<Path, string> = {
        full: `/app/projets/${project.id}/brief`,
        hasName: `/app/projets/${project.id}/logos`,
        hasLogo: `/app/projets/${project.id}/logos?import=1`,
        emailOnly: `/app/projets/${project.id}/signatures?onglet=email`,
      };
      router.push(next[path]);
    },
    onError,
  });

  const canSubmit = Boolean(workspace) && (path !== "hasName" || existingName.trim().length >= 2);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("app.newProject.title")} description={t("app.newProject.description")} />
      <form
        className="grid gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) create.mutate();
        }}
      >
        <fieldset>
          <legend className="sr-only">{t("app.brief.entityType")}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ENTITY_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              const selected = entityType === type;
              return (
                <label
                  key={type}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    selected ? "border-primary bg-accent font-medium text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <input type="radio" name="entityType" value={type} checked={selected} onChange={() => setEntityType(type)} className="sr-only" />
                  <Icon className="size-6" aria-hidden="true" />
                  {t(`common.entityTypes.${type}`)}
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label={t("app.newProject.workingTitle")} htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("app.newProject.workingTitlePlaceholder")} />
        </Field>

        <fieldset className="grid gap-3">
          <legend className="mb-1 font-medium">{t("app.newProject.start")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PATHS.map(({ id, icon: Icon }) => (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-4 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  path === id ? "border-primary bg-accent" : "hover:bg-muted",
                )}
              >
                <input type="radio" name="path" value={id} checked={path === id} onChange={() => setPath(id)} className="sr-only" />
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block font-medium">{t(`app.newProject.paths.${id}`)}</span>
                  <span className="block text-sm text-muted-foreground">{t(`app.newProject.paths.${id}Body`)}</span>
                </span>
              </label>
            ))}
          </div>
          {path === "hasName" && (
            <Field label={t("app.newProject.existingName")} htmlFor="existingName">
              <Input id="existingName" value={existingName} onChange={(e) => setExistingName(e.target.value)} autoFocus />
            </Field>
          )}
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={!canSubmit || create.isPending}>
            {t("app.newProject.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
