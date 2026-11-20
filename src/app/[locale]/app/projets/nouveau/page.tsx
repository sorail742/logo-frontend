"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  AppWindow,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Coins,
  HandHeart,
  Layers,
  Loader2,
  Mail,
  PenTool,
  Route,
  Shapes,
  Sparkles,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/common/field";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useWorkspace } from "@/hooks/use-workspace";
import { api, ApiError } from "@/lib/api";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  EntityType,
  {
    icon: typeof HandHeart;
    hint: string;
  }
> = {
  ASSOCIATION: { icon: HandHeart, hint: "ONG, club, collectif, fédération" },
  APPLICATION: { icon: AppWindow, hint: "SaaS, app mobile, outil digital" },
  PLATFORM: { icon: Layers, hint: "Marketplace, portail, écosystème" },
  COMPANY: { icon: Building2, hint: "Startup, PME, agence, boutique" },
  EVENT: { icon: CalendarDays, hint: "Festival, tournoi, salon, sommet" },
  OTHER: { icon: Shapes, hint: "Projet personnel, concept créatif" },
};

type Path = "full" | "hasName" | "hasLogo" | "emailOnly";
const FIELDS = ["title", "existingName"] as const;

const PATHS: { id: Path; icon: typeof Route; badge?: string }[] = [
  { id: "full", icon: Route, badge: "Recommandé" },
  { id: "hasName", icon: Type },
  { id: "hasLogo", icon: PenTool },
  { id: "emailOnly", icon: Mail },
];

export default function NewProjectPage() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { errors, setErrors, onError, clear } = useFormErrors(FIELDS);
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
    onError: (error) => {
      if (path === "hasName" && error instanceof ApiError && error.status === 422) {
        setErrors({ existingName: error.message });
        document.getElementById("existingName")?.focus();
      } else onError(error);
    },
  });

  const canSubmit = Boolean(workspace) && (path !== "hasName" || existingName.trim().length >= 2);

  return (
    <div className="mx-auto max-w-4xl pb-16">
      {/* En-tête de page moderne */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full text-xs font-semibold">
              1
            </span>
            <span>Configuration initiale</span>
            <span>•</span>
            <span className="text-foreground">Étape 1 sur 6</span>
          </div>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("app.newProject.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("app.newProject.description")}</p>
        </div>

        <div className="bg-card text-muted-foreground flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs shadow-xs sm:self-auto">
          <Coins className="text-brand-accent size-3.5" aria-hidden="true" />
          <span>0 crédit consommé pour l&apos;initialisation</span>
        </div>
      </div>

      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) create.mutate();
        }}
      >
        {/* 1. Sélection du type de structure */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-sm font-semibold tracking-tight">
              1. Type de projet ou de structure
            </h2>
            <span className="text-muted-foreground text-xs">Sélectionnez la catégorie adaptée</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ENTITY_TYPES.map((type) => {
              const { icon: Icon, hint } = TYPE_CONFIG[type];
              const selected = entityType === type;
              return (
                <label
                  key={type}
                  className={cn(
                    "glow-card glow-card-3d glow-card-shimmer group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4.5 transition-all duration-300 hover:-translate-y-1.5",
                    "hover:border-primary/50",
                    selected
                      ? "border-primary bg-primary/[0.03] ring-primary/20 shadow-md ring-2"
                      : "border-border/80 bg-card text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="entityType"
                    value={type}
                    checked={selected}
                    onChange={() => setEntityType(type)}
                    className="sr-only"
                  />

                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>

                    <div
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border transition-all",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border opacity-0 group-hover:opacity-100",
                      )}
                    >
                      {selected && <Check className="size-3" />}
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-foreground block text-sm font-semibold tracking-tight">
                      {t(`common.entityTypes.${type}`)}
                    </span>
                    <span className="text-muted-foreground mt-0.5 line-clamp-1 block text-xs">{hint}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* 2. Titre de travail */}
        <section className="border-border/80 bg-card rounded-2xl border p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-sm font-semibold tracking-tight">
                2. {t("app.newProject.workingTitle")}
              </h2>
              <p className="text-muted-foreground text-xs">
                Un repère interne modifiable à tout moment dans votre espace.
              </p>
            </div>
            <span className="text-muted-foreground text-xs tabular-nums">{title.length}/120</span>
          </div>

          <Field label="" htmlFor="title" error={errors.title}>
            <div className="relative">
              <Input
                id="title"
                value={title}
                maxLength={120}
                onChange={(e) => {
                  clear("title");
                  setTitle(e.target.value);
                }}
                placeholder={t("app.newProject.workingTitlePlaceholder")}
                className="bg-background focus-visible:ring-primary/20 h-11 rounded-xl text-sm shadow-2xs transition-colors"
              />
            </div>
          </Field>
        </section>

        {/* 3. Par où commencer ? */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-sm font-semibold tracking-tight">
              3. {t("app.newProject.start")}
            </h2>
            <span className="text-muted-foreground text-xs">
              Adaptez le parcours selon les éléments déjà en votre possession
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PATHS.map(({ id, icon: Icon, badge }) => {
              const selected = path === id;
              return (
                <label
                  key={id}
                  className={cn(
                    "glow-card glow-card-3d glow-card-shimmer group relative flex cursor-pointer gap-3.5 rounded-2xl border p-4.5 transition-all duration-300 hover:-translate-y-1.5",
                    "hover:border-primary/50",
                    selected
                      ? "border-primary bg-primary/[0.03] ring-primary/20 shadow-md ring-2"
                      : "border-border/80 bg-card",
                  )}
                >
                  <input
                    type="radio"
                    name="path"
                    value={id}
                    checked={selected}
                    onChange={() => setPath(id)}
                    className="sr-only"
                  />

                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground block text-sm font-semibold tracking-tight">
                        {t(`app.newProject.paths.${id}`)}
                      </span>
                      {badge && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary hover:bg-primary/15 text-[10px] font-medium"
                        >
                          <Sparkles className="mr-1 size-2.5" />
                          {badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                      {t(`app.newProject.paths.${id}Body`)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-all",
                      selected ? "border-primary bg-primary text-white" : "border-muted-foreground/30",
                    )}
                  >
                    {selected && <div className="size-1.5 rounded-full bg-white" />}
                  </div>
                </label>
              );
            })}
          </div>

          {path === "hasName" && (
            <div className="border-primary/20 bg-primary/[0.02] mt-3 rounded-2xl border p-5 shadow-xs">
              <Field
                label={t("app.newProject.existingName")}
                htmlFor="existingName"
                error={errors.existingName}
              >
                <Input
                  id="existingName"
                  value={existingName}
                  maxLength={40}
                  placeholder="Ex. Marka Studio"
                  onChange={(e) => {
                    clear("existingName");
                    setExistingName(e.target.value);
                  }}
                  autoFocus
                  className="bg-background h-11 rounded-xl text-sm shadow-2xs"
                />
              </Field>
              <p className="text-muted-foreground mt-2 text-xs">
                Ce nom sera immédiatement utilisé pour configurer le générateur de logo et le brand kit.
              </p>
            </div>
          )}
        </section>

        {/* Footer & Validation */}
        <div className="border-border/70 bg-card flex flex-col-reverse items-center justify-between gap-4 rounded-2xl border p-4 shadow-xs sm:flex-row">
          <div className="text-muted-foreground text-xs">
            <span>Création immédiate</span>
            <span className="mx-2">•</span>
            <span>Sauvegardé automatiquement dans votre espace</span>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit || create.isPending}
            className="h-11 w-full px-6 font-semibold shadow-xs transition-all hover:shadow-md sm:w-auto"
          >
            {create.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Initialisation…
              </>
            ) : (
              <>
                {t("app.newProject.create")}
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
