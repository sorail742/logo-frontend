"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft, History, Redo2, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SvgView } from "@/components/brand/svg-view";
import { ButtonLink } from "@/components/common/button-link";
import { Field } from "@/components/common/field";
import { EditorControls } from "@/components/logos/editor-controls";
import { ExportPanel, VariantsGrid } from "@/components/logos/export-panel";
import { LogoMockups } from "@/components/logos/logo-mockups";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { useCredits } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { renderLogoSvg } from "@/lib/render/logo";
import { useLogoEditor } from "@/stores/logo-editor";

export default function LogoEditorPage() {
  const t = useTranslations("logos");
  const format = useFormatter();
  const { lid } = useParams<{ lid: string }>();
  const { pid, can } = useProject();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const credits = useCredits();
  const { present: spec, past, future, saved, load, undo, redo, markSaved } = useLogoEditor();
  const [saveOpen, setSaveOpen] = useState(false);
  const [label, setLabel] = useState("");

  const { data: logo } = useQuery({ queryKey: qk.logo(lid), queryFn: () => api.logos.get(lid) });
  const { data: versions = [] } = useQuery({ queryKey: qk.logoVersions(lid), queryFn: () => api.logos.versions(lid) });

  useEffect(() => {
    if (logo && useLogoEditor.getState().logoId !== logo.id) load(logo.id, logo.current.spec);
  }, [logo, load]);

  // Raccourcis clavier Ctrl+Z / Ctrl+Maj+Z
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      if ((event.target as HTMLElement).closest("input, textarea")) return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const save = useMutation({
    mutationFn: () => api.logos.saveVersion(lid, { spec: spec!, label: label.trim() || undefined }),
    onSuccess: (version) => {
      markSaved();
      setSaveOpen(false);
      setLabel("");
      toast.success(t("editor.saved", { number: version.number }));
      queryClient.invalidateQueries({ queryKey: qk.logoVersions(lid) });
      queryClient.invalidateQueries({ queryKey: qk.logo(lid) });
      queryClient.invalidateQueries({ queryKey: qk.logos(pid) });
      queryClient.invalidateQueries({ queryKey: qk.project(pid) });
    },
    onError,
  });

  const main = useMemo(() => (spec ? renderLogoSvg(spec).svg : ""), [spec]);
  const tiny = useMemo(() => (spec ? renderLogoSvg({ ...spec, iconFrame: spec.iconFrame === "none" ? "circle" : spec.iconFrame }, { layout: "icon" }).svg : ""), [spec]);

  if (!spec || !logo || useLogoEditor.getState().logoId !== lid) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  const dirty = saved !== spec;
  const canEdit = can("content.edit");

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={`/app/projets/${pid}/logos`} variant="ghost">
          <ArrowLeft />
          {t("editor.back")}
        </ButtonLink>
        <h2 className="text-lg font-semibold">{t("editor.title")}</h2>
        {dirty && <span className="text-xs text-amber-700 dark:text-amber-300">{t("editor.unsaved")}</span>}
        {canEdit && (
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={undo} disabled={!past.length} aria-label={t("editor.undo")} title={t("editor.undo")}>
              <Undo2 />
            </Button>
            <Button variant="outline" size="icon" onClick={redo} disabled={!future.length} aria-label={t("editor.redo")} title={t("editor.redo")}>
              <Redo2 />
            </Button>
            <Button onClick={() => setSaveOpen(true)} disabled={!dirty}>
              <Save />
              {t("editor.saveVersion")}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="order-2 lg:order-1">
          <CardContent className="pt-0">
            <fieldset disabled={!canEdit}>
              <EditorControls spec={spec} />
            </fieldset>
          </CardContent>
        </Card>

        <div className="order-1 grid content-start gap-6 lg:order-2">
          <Card>
            <CardContent className="grid gap-4">
              <SvgView svg={main} label={spec.text} className="bg-checker aspect-[16/9] rounded-lg p-6" />
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center overflow-hidden rounded-md border bg-white">
                    <SvgView svg={tiny} className="size-8" />
                  </div>
                  <div className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-neutral-900">
                    <SvgView svg={tiny} className="size-8" />
                  </div>
                  <span className="text-xs text-muted-foreground">{t("editor.readability")}</span>
                </div>
              </div>
              <LogoMockups spec={spec} />
            </CardContent>
          </Card>

          <VariantsGrid spec={spec} />

          <div className="grid gap-6 xl:grid-cols-2">
            {can("export.download") && <ExportPanel spec={spec} logoId={lid} isFree={credits.data?.planCode === "FREE"} saved={!dirty} />}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="size-4" aria-hidden="true" />
                  {t("editor.versions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-2">
                  {versions.map((version) => (
                    <li key={version.id} className="flex items-center gap-3 rounded-lg border p-2">
                      <SvgView svg={renderLogoSvg(version.spec).svg} className="bg-checker h-10 w-16 shrink-0 rounded p-1" />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-medium">
                          v{version.number}
                          {version.label ? ` · ${version.label}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{format.dateTime(new Date(version.createdAt), { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => useLogoEditor.getState().update(version.spec)}>
                          {t("editor.restore")}
                        </Button>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editor.saveVersion")}</DialogTitle>
          </DialogHeader>
          <Field label={t("editor.versionLabel")} htmlFor="version-label">
            <Input id="version-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("editor.versionLabelPlaceholder")} />
          </Field>
          <DialogFooter>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {t("editor.saveVersion")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
