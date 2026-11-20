"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Compass,
  FileCheck2,
  Info,
  Loader2,
  Save,
  Sliders,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { TagInput } from "@/components/common/tag-input";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { ENTITY_TYPES, NAME_STYLES, type Brief, type EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const BRIEF_FIELDS = [
  "entityType",
  "sector",
  "mission",
  "values",
  "audience",
  "tone",
  "maxLength",
  "mustInclude",
  "mustAvoid",
] as const;

const TAG_LIMITS = { values: 10, mustInclude: 10, mustAvoid: 20 } as const;

const VALUE_SUGGESTIONS = [
  "Innovation",
  "Solidarité",
  "Durabilité",
  "Excellence",
  "Proximité",
  "Confiance",
  "Audace",
  "Éthique",
];

const TONE_PRESETS = [
  "Chaleureux et accessible",
  "Professionnel et rigoureux",
  "Audacieux et dynamique",
  "Élégant et haut de gamme",
  "Inspirant et visionnaire",
];

const EMPTY_BRIEF: Brief = {
  sector: "",
  mission: "",
  values: [],
  audience: "",
  languages: ["fr"],
  nameStyles: [],
  maxLength: null,
  mustInclude: [],
  mustAvoid: [],
  tone: "",
};

function BriefForm() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { errors, onError, clear } = useFormErrors(BRIEF_FIELDS);
  const { project, pid, can } = useProject();
  const [brief, setBrief] = useState<Brief>(project?.brief ?? EMPTY_BRIEF);
  const [entityType, setEntityType] = useState<EntityType>(project?.entityType ?? "ASSOCIATION");

  const save = useMutation({
    mutationFn: async (goNext: boolean) => {
      if (project && entityType !== project.entityType) await api.projects.update(pid, { entityType });
      const updated = await api.projects.saveBrief(pid, brief);
      return { updated, goNext };
    },
    onSuccess: ({ updated, goNext }) => {
      queryClient.setQueryData(qk.project(pid), updated);
      toast.success(t("app.brief.saved"));
      if (goNext) router.push(`/app/projets/${pid}/noms`);
    },
    onError,
  });

  const set = <K extends keyof Brief>(key: K, value: Brief[K]) => {
    clear(key);
    setBrief((current) => ({ ...current, [key]: value }));
  };

  const tagHint = (key: keyof typeof TAG_LIMITS) =>
    t("app.brief.tagCount", { count: brief[key].length, max: TAG_LIMITS[key] });

  const toggle = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const addValueSuggestion = (val: string) => {
    if (brief.values.length < TAG_LIMITS.values && !brief.values.includes(val)) {
      set("values", [...brief.values, val]);
    }
  };

  const readOnly = !can("content.edit");

  return (
    <form
      className="space-y-8 pb-16"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(true);
      }}
    >
      {/* En-tête contextuel & statut */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full text-xs font-semibold">
              2
            </span>
            <span>Positionnement de marque</span>
            <span>•</span>
            <span className="text-foreground">Étape 2 sur 6</span>
          </div>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("app.brief.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("app.brief.description")}</p>
        </div>

        <div className="bg-card text-muted-foreground flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs shadow-xs sm:self-auto">
          <FileCheck2 className="text-primary size-3.5" aria-hidden="true" />
          <span>Sauvegarde automatique active</span>
        </div>
      </div>

      {/* Section 1 : Identité & Mission */}
      <section className="border-border/80 bg-card space-y-5 rounded-2xl border p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
            <Compass className="size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold tracking-tight">
              1. Identité fondamentale & Mission
            </h2>
            <p className="text-muted-foreground text-xs">
              Définissez la nature de votre organisation et son impact clé.
            </p>
          </div>
        </div>

        <fieldset disabled={readOnly} className="grid gap-5 sm:grid-cols-2">
          <Field label={t("app.brief.entityType")} htmlFor="entityType" error={errors.entityType}>
            <NativeSelect
              id="entityType"
              value={entityType}
              onChange={(e) => {
                clear("entityType");
                setEntityType(e.target.value as EntityType);
              }}
              className="bg-background h-11 rounded-xl text-sm"
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`common.entityTypes.${type}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t("app.brief.sector")} htmlFor="sector" error={errors.sector}>
            <Input
              id="sector"
              value={brief.sector}
              maxLength={120}
              onChange={(e) => set("sector", e.target.value)}
              placeholder={t("app.brief.sectorPlaceholder")}
              required
              className="bg-background h-11 rounded-xl text-sm"
            />
          </Field>

          <Field
            label={t("app.brief.mission")}
            htmlFor="mission"
            hint={t("app.brief.missionCount", { count: brief.mission.length })}
            error={errors.mission}
            className="sm:col-span-2"
          >
            <Textarea
              id="mission"
              value={brief.mission}
              maxLength={500}
              rows={3}
              onChange={(e) => set("mission", e.target.value)}
              placeholder={t("app.brief.missionPlaceholder")}
              className="bg-background resize-none rounded-xl text-sm leading-relaxed"
            />
          </Field>
        </fieldset>
      </section>

      {/* Section 2 : Positionnement, Valeurs & Tonalité */}
      <section className="border-border/80 bg-card space-y-5 rounded-2xl border p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
            <Target className="size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold tracking-tight">
              2. Public cible & Tonalité de marque
            </h2>
            <p className="text-muted-foreground text-xs">
              Guidez la perception émotionnelle et stratégique que doit susciter la marque.
            </p>
          </div>
        </div>

        <fieldset disabled={readOnly} className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("app.brief.audience")}
            htmlFor="audience"
            error={errors.audience}
            className="sm:col-span-2"
          >
            <Input
              id="audience"
              value={brief.audience}
              maxLength={300}
              onChange={(e) => set("audience", e.target.value)}
              placeholder={t("app.brief.audiencePlaceholder")}
              className="bg-background h-11 rounded-xl text-sm"
            />
          </Field>

          <div className="space-y-2 sm:col-span-2">
            <Field
              label={t("app.brief.values")}
              htmlFor="values"
              hint={tagHint("values")}
              error={errors.values}
            >
              <TagInput
                id="values"
                value={brief.values}
                max={TAG_LIMITS.values}
                onChange={(v) => set("values", v)}
                placeholder={t("app.brief.valuesPlaceholder")}
              />
            </Field>

            {brief.values.length < TAG_LIMITS.values && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-muted-foreground mr-1 text-xs">Suggestions :</span>
                {VALUE_SUGGESTIONS.filter((s) => !brief.values.includes(s))
                  .slice(0, 5)
                  .map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => addValueSuggestion(sugg)}
                      className="border-border text-muted-foreground hover:border-primary hover:text-primary rounded-full border border-dashed px-2.5 py-0.5 text-xs transition-colors"
                    >
                      + {sugg}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Field label={t("app.brief.tone")} htmlFor="tone" error={errors.tone}>
              <Input
                id="tone"
                value={brief.tone}
                maxLength={60}
                onChange={(e) => set("tone", e.target.value)}
                placeholder={t("app.brief.tonePlaceholder")}
                className="bg-background h-11 rounded-xl text-sm"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-muted-foreground mr-1 text-xs">Exemples :</span>
              {TONE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("tone", p)}
                  className="bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </fieldset>
      </section>

      {/* Section 3 : Paramètres de génération de nom */}
      <section className="border-border/80 bg-card space-y-5 rounded-2xl border p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
            <Sliders className="size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold tracking-tight">
              3. Préférences de génération de nom
            </h2>
            <p className="text-muted-foreground text-xs">
              Affinez les styles linguistiques et contraintes pour l&apos;algorithme de nommage.
            </p>
          </div>
        </div>

        <fieldset disabled={readOnly} className="space-y-5">
          <div>
            <label className="text-foreground mb-2 block text-sm font-semibold tracking-tight">
              {t("app.brief.styles")}
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {NAME_STYLES.map((style) => {
                const selected = brief.nameStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set("nameStyles", toggle(brief.nameStyles, style))}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-150",
                      selected
                        ? "border-primary bg-primary/[0.04] text-foreground ring-primary/20 font-medium shadow-2xs ring-1"
                        : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span className="text-xs sm:text-sm">{t(`app.nameStyles.${style}`)}</span>
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                        selected ? "border-primary bg-primary text-white" : "border-border",
                      )}
                    >
                      {selected && <Check className="size-2.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={t("app.brief.maxLength")}
              htmlFor="maxLength"
              hint={t("app.brief.maxLengthHint")}
              error={errors.maxLength}
            >
              <Input
                id="maxLength"
                type="number"
                min={3}
                max={30}
                inputMode="numeric"
                value={brief.maxLength ?? ""}
                onChange={(e) => set("maxLength", e.target.value ? Number(e.target.value) : null)}
                placeholder="Ex. 12 (laisser vide = sans limite)"
                className="bg-background h-11 rounded-xl text-sm"
              />
            </Field>

            <fieldset className="space-y-2">
              <legend className="text-foreground text-sm font-semibold tracking-tight">
                {t("app.brief.languages")}
              </legend>
              <div className="flex gap-4 pt-2">
                {(["fr", "en"] as const).map((lang) => {
                  const checked = brief.languages.includes(lang);
                  return (
                    <label
                      key={lang}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors",
                        checked
                          ? "border-primary bg-primary/[0.03] text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary size-4 rounded"
                        checked={checked}
                        onChange={() => set("languages", toggle(brief.languages, lang))}
                      />
                      {t(`app.languages.${lang}`)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="grid gap-5 border-t pt-2 sm:grid-cols-2">
            <Field
              label={t("app.brief.mustInclude")}
              htmlFor="mustInclude"
              hint={tagHint("mustInclude")}
              error={errors.mustInclude}
            >
              <TagInput
                id="mustInclude"
                value={brief.mustInclude}
                max={TAG_LIMITS.mustInclude}
                onChange={(v) => set("mustInclude", v)}
                placeholder="Mot ou racine imposée"
              />
            </Field>

            <Field
              label={t("app.brief.mustAvoid")}
              htmlFor="mustAvoid"
              hint={tagHint("mustAvoid")}
              error={errors.mustAvoid}
            >
              <TagInput
                id="mustAvoid"
                value={brief.mustAvoid}
                max={TAG_LIMITS.mustAvoid}
                onChange={(v) => set("mustAvoid", v)}
                placeholder="Terme ou syllabe à exclure"
              />
            </Field>
          </div>
        </fieldset>
      </section>

      {/* Barre d'action moderne */}
      {!readOnly && (
        <div className="border-border/80 bg-card flex flex-col-reverse items-center justify-between gap-4 rounded-2xl border p-4 shadow-xs sm:flex-row">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Sparkles className="text-primary size-3.5" />
            <span>Étape suivante : Génération et vérification de 10 propositions de noms</span>
          </div>

          <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => save.mutate(false)}
              disabled={save.isPending}
              className="h-11 rounded-xl px-5 text-sm font-medium"
            >
              <Save className="mr-1.5 size-4" />
              {t("common.actions.save")}
            </Button>

            <Button
              type="submit"
              size="lg"
              disabled={save.isPending || !brief.sector.trim()}
              className="h-11 rounded-xl px-6 text-sm font-semibold shadow-xs transition-all hover:shadow-md"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  {t("app.brief.saveAndContinue")}
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

export default function BriefPage() {
  const { project } = useProject();
  if (!project) return null;
  return <BriefForm key={project.id} />;
}
