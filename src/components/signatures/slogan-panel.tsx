"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Check, Download, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SvgView } from "@/components/brand/svg-view";
import { CreditCost } from "@/components/common/credit-cost";
import { Field } from "@/components/common/field";
import { JobProgress } from "@/components/common/job-progress";
import { NativeSelect } from "@/components/common/native-select";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useJob } from "@/hooks/use-job";
import { api, newIdempotencyKey } from "@/lib/api";
import { CREDIT_COSTS } from "@/lib/credits";
import { qk } from "@/lib/query-keys";
import { downloadSvg } from "@/lib/render/export";
import { renderLogoSvg } from "@/lib/render/logo";
import { slugify } from "@/lib/format";
import { SLOGAN_TONES, type LogoSpec, type Slogan, type SloganKind, type SloganTone } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SloganPanel({ pid, canEdit, isAssociation, logoSpec }: { pid: string; canEdit: boolean; isAssociation: boolean; logoSpec: LogoSpec | null }) {
  const t = useTranslations("signatures.slogan");
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const [tone, setTone] = useState<SloganTone>("INSPIRING");
  const [kind, setKind] = useState<SloganKind>("SLOGAN");
  const [maxWords, setMaxWords] = useState(8);
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [jobId, setJobId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  const { data: slogans = [] } = useQuery({ queryKey: qk.slogans(pid), queryFn: () => api.slogans.list(pid) });
  const job = useJob(jobId, { invalidate: [qk.slogans(pid)] });
  const generate = useMutation({
    mutationFn: () => api.slogans.generate(pid, { tone, kind, maxWords, language }, newIdempotencyKey()),
    onSuccess: ({ jobId }) => setJobId(jobId),
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Slogan, "isFavorite" | "isChosen" | "text">> }) => api.slogans.update(id, patch),
    onSuccess: (_, { patch }) => {
      if (patch.isChosen) toast.success(t("chosenToast"));
      queryClient.invalidateQueries({ queryKey: qk.slogans(pid) });
      queryClient.invalidateQueries({ queryKey: qk.project(pid) });
    },
    onError,
  });

  const chosen = slogans.find((s) => s.isChosen && s.kind === "SLOGAN") ?? slogans.find((s) => s.isChosen);
  const combined = useMemo(() => (logoSpec && chosen ? { ...logoSpec, tagline: chosen.text } : null), [logoSpec, chosen]);
  const kinds: SloganKind[] = isAssociation ? ["SLOGAN", "DEVISE", "MISSION"] : ["SLOGAN"];
  const visible = slogans.filter((s) => s.kind === kind);

  return (
    <div className="grid gap-6">
      {canEdit && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <Field label={t("kind")} htmlFor="slogan-kind">
              <NativeSelect id="slogan-kind" value={kind} onChange={(e) => setKind(e.target.value as SloganKind)}>
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {t(`kinds.${k}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("tone")} htmlFor="slogan-tone">
              <NativeSelect id="slogan-tone" value={tone} onChange={(e) => setTone(e.target.value as SloganTone)}>
                {SLOGAN_TONES.map((value) => (
                  <option key={value} value={value}>
                    {t(`tones.${value}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("maxWords")} htmlFor="slogan-words">
              <Input id="slogan-words" type="number" min={2} max={20} value={maxWords} onChange={(e) => setMaxWords(Number(e.target.value) || 8)} />
            </Field>
            <Field label={t("language")} htmlFor="slogan-lang">
              <NativeSelect id="slogan-lang" value={language} onChange={(e) => setLanguage(e.target.value as "fr" | "en")}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </NativeSelect>
            </Field>
            <div className="flex items-center justify-end gap-3">
              <CreditCost cost={CREDIT_COSTS.SLOGANS_BATCH} />
              <Button size="lg" onClick={() => generate.mutate()} disabled={generate.isPending || job.running}>
                <Sparkles />
                {t("generate")}
              </Button>
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <JobProgress event={job.event} running={job.running} />
              <p className="text-xs text-muted-foreground">{t("similarWarning")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {visible.map((slogan) => (
            <li key={slogan.id} className={cn("flex items-center gap-2 rounded-xl border bg-card p-3", slogan.isChosen && "border-primary ring-2 ring-primary/20")}>
              {editing?.id === slogan.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    update.mutate({ id: slogan.id, patch: { text: editing.text } });
                    setEditing(null);
                  }}
                >
                  <Input value={editing.text} onChange={(e) => setEditing({ id: slogan.id, text: e.target.value })} autoFocus aria-label={t("edit")} />
                  <Button type="submit" size="sm">
                    OK
                  </Button>
                </form>
              ) : (
                <button type="button" className="flex-1 text-left text-sm" onClick={() => canEdit && setEditing({ id: slogan.id, text: slogan.text })} title={canEdit ? t("edit") : undefined}>
                  {slogan.text}
                </button>
              )}
              {canEdit && (
                <>
                  <Button variant="ghost" size="icon-sm" onClick={() => update.mutate({ id: slogan.id, patch: { isFavorite: !slogan.isFavorite } })} aria-pressed={slogan.isFavorite} aria-label="Favori">
                    <Heart className={cn(slogan.isFavorite && "fill-red-500 text-red-500")} />
                  </Button>
                  <Button variant={slogan.isChosen ? "secondary" : "outline"} size="sm" onClick={() => update.mutate({ id: slogan.id, patch: { isChosen: true } })} disabled={slogan.isChosen}>
                    {slogan.isChosen && <Check />}
                    {slogan.isChosen ? t("chosen") : t("choose")}
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("withLogo")}</CardTitle>
          <CardDescription>{t("withLogoBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          {combined ? (
            <div className="grid gap-3">
              <SvgView svg={renderLogoSvg(combined).svg} className="bg-checker aspect-[3/1] rounded-lg p-4" label={combined.text} />
              <Button variant="outline" className="justify-self-start" onClick={() => downloadSvg(renderLogoSvg(combined).svg, `${slugify(combined.text)}-signature.svg`)}>
                <Download />
                {t("downloadSvg")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noLogo")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
