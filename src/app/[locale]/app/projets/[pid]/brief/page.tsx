"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { TagInput } from "@/components/common/tag-input";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { ENTITY_TYPES, NAME_STYLES, type Brief, type EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const onError = useApiErrorToast();
  const { project, pid, can } = useProject();
  // Monté par BriefPage une fois le projet chargé : les valeurs initiales viennent du projet.
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

  const set = <K extends keyof Brief>(key: K, value: Brief[K]) => setBrief((current) => ({ ...current, [key]: value }));
  const toggle = <T extends string>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const readOnly = !can("content.edit");

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(true);
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("app.brief.title")}</CardTitle>
          <CardDescription>{t("app.brief.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset disabled={readOnly} className="grid gap-5 sm:grid-cols-2">
            <Field label={t("app.brief.entityType")} htmlFor="entityType">
              <NativeSelect id="entityType" value={entityType} onChange={(e) => setEntityType(e.target.value as EntityType)}>
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`common.entityTypes.${type}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("app.brief.sector")} htmlFor="sector">
              <Input id="sector" value={brief.sector} onChange={(e) => set("sector", e.target.value)} placeholder={t("app.brief.sectorPlaceholder")} required />
            </Field>
            <Field label={t("app.brief.mission")} htmlFor="mission" hint={t("app.brief.missionCount", { count: brief.mission.length })} className="sm:col-span-2">
              <Textarea id="mission" value={brief.mission} maxLength={500} rows={3} onChange={(e) => set("mission", e.target.value)} placeholder={t("app.brief.missionPlaceholder")} />
            </Field>
            <Field label={t("app.brief.values")} htmlFor="values">
              <TagInput id="values" value={brief.values} onChange={(v) => set("values", v)} placeholder={t("app.brief.valuesPlaceholder")} />
            </Field>
            <Field label={t("app.brief.audience")} htmlFor="audience">
              <Input id="audience" value={brief.audience} onChange={(e) => set("audience", e.target.value)} placeholder={t("app.brief.audiencePlaceholder")} />
            </Field>
            <Field label={t("app.brief.tone")} htmlFor="tone">
              <Input id="tone" value={brief.tone} onChange={(e) => set("tone", e.target.value)} placeholder={t("app.brief.tonePlaceholder")} />
            </Field>
            <Field label={t("app.brief.maxLength")} htmlFor="maxLength" hint={t("app.brief.maxLengthHint")}>
              <Input
                id="maxLength"
                type="number"
                min={3}
                max={40}
                inputMode="numeric"
                value={brief.maxLength ?? ""}
                onChange={(e) => set("maxLength", e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="mb-1 text-sm font-medium">{t("app.brief.styles")}</legend>
              <div className="flex flex-wrap gap-2">
                {NAME_STYLES.map((style) => {
                  const selected = brief.nameStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => set("nameStyles", toggle(brief.nameStyles, style))}
                      className={cn("rounded-full border px-3 py-1 text-sm", selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                    >
                      {t(`app.nameStyles.${style}`)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium">{t("app.brief.languages")}</legend>
              <div className="flex gap-4">
                {(["fr", "en"] as const).map((lang) => (
                  <label key={lang} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={brief.languages.includes(lang)}
                      onChange={() => set("languages", toggle(brief.languages, lang))}
                    />
                    {t(`app.languages.${lang}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div />
            <Field label={t("app.brief.mustInclude")} htmlFor="mustInclude">
              <TagInput id="mustInclude" value={brief.mustInclude} onChange={(v) => set("mustInclude", v)} />
            </Field>
            <Field label={t("app.brief.mustAvoid")} htmlFor="mustAvoid">
              <TagInput id="mustAvoid" value={brief.mustAvoid} onChange={(v) => set("mustAvoid", v)} />
            </Field>
          </fieldset>
        </CardContent>
      </Card>
      {!readOnly && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="lg" onClick={() => save.mutate(false)} disabled={save.isPending}>
            {t("common.actions.save")}
          </Button>
          <Button type="submit" size="lg" disabled={save.isPending || !brief.sector.trim()}>
            {t("app.brief.saveAndContinue")}
          </Button>
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
