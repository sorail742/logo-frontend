"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/common/button-link";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { TagInput } from "@/components/common/tag-input";
import { api, errorMessage } from "@/lib/api";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";

/** Essai sans compte du générateur de noms : 3 par jour et par IP (POST /public/names/try). */
export function NameTry() {
  const t = useTranslations("marketing.nameTool");
  const tc = useTranslations("common");
  const tn = useTranslations("names.styles");
  const [entityType, setEntityType] = useState<EntityType>("ASSOCIATION");
  const [sector, setSector] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const run = useMutation({ mutationFn: () => api.names.tryPublic({ entityType, sector, keywords }) });

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form
        className="grid content-start gap-4 rounded-xl border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          run.mutate();
        }}
      >
        <Field label={t("type")} htmlFor="try-type">
          <NativeSelect id="try-type" value={entityType} onChange={(e) => setEntityType(e.target.value as EntityType)}>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {tc(`entityTypes.${type}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("sector")} htmlFor="try-sector">
          <Input id="try-sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder={t("sectorPlaceholder")} />
        </Field>
        <Field label={t("keywords")} htmlFor="try-keywords">
          <TagInput id="try-keywords" value={keywords} onChange={setKeywords} placeholder={t("keywordsPlaceholder")} max={5} />
        </Field>
        <Button type="submit" size="lg" disabled={run.isPending || (!sector.trim() && !keywords.length)}>
          <Sparkles />
          {t("submit")}
        </Button>
        {run.data && <p className="text-xs text-muted-foreground">{t("remaining", { count: run.data.remaining })}</p>}
        {run.error && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage(run.error)}
          </p>
        )}
      </form>
      <div aria-live="polite">
        {run.data ? (
          <div className="grid gap-4">
            <ul className="grid gap-3 sm:grid-cols-2">
              {run.data.names.map((name) => (
                <li key={name.value} className="rounded-xl border bg-card p-4">
                  <p className="text-lg font-semibold">{name.value}</p>
                  <Badge variant="secondary" className="mt-1">
                    {tn(name.style)}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">{name.meaning}</p>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
              {t("signupCta")}
              <ButtonLink href="/inscription">{tc("nav.signup")}</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground">{t("empty")}</div>
        )}
      </div>
    </div>
  );
}
