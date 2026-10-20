"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { svgToPngDataUrl } from "@/lib/render/export";
import { documentFonts } from "@/lib/studio/doc";
import { customFormat, FORMAT_GROUPS, FORMATS, type DesignFormat } from "@/lib/studio/formats";
import { renderPage } from "@/lib/studio/render";
import { adaptDoc } from "@/lib/studio/smart";
import { ensureFonts } from "@/lib/studio/text";
import { useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";
import { PageThumb } from "./panels/templates-panel";

// Redimensionnement magique : la création est recomposée pour d'autres formats (fonds étirés,
// décors ancrés aux coins, contenu regroupé et réparti), en copies ou sur place.

export function ResizeDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const t = useTranslations("studio.resize");
  const tf = useTranslations("studio.formats");
  const onError = useApiErrorToast();
  const doc = useStudio((s) => s.doc);
  const meta = useStudio((s) => s.meta);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState({ width: 1080, height: 1080 });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open || !doc) return;
    ensureFonts(documentFonts(doc)).then(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const targets: DesignFormat[] = selected.map((id) => (id === "custom" ? customFormat(custom.width, custom.height) : FORMATS.find((f) => f.id === id)!));
  const previews = useMemo(() => {
    if (!doc || !ready) return [];
    return selected.slice(0, 4).map((id) => {
      const format = id === "custom" ? customFormat(custom.width, custom.height) : FORMATS.find((f) => f.id === id)!;
      return { format, doc: adaptDoc(doc, format) };
    });
  }, [doc, ready, selected, custom.width, custom.height]);

  if (!doc || !meta) return null;

  const toggle = (id: string) => setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const label = (format: DesignFormat) => (format.id === "custom" ? t("customName", { width: format.width, height: format.height }) : tf(`${format.id}.name`));

  const createCopies = async () => {
    setBusy(true);
    try {
      await ensureFonts(documentFonts(doc));
      const out: { id: string; name: string }[] = [];
      for (const format of targets) {
        const adapted = adaptDoc(doc, format);
        const thumbnail = await svgToPngDataUrl(renderPage(adapted, 0), { size: 400 }).catch(() => undefined);
        const design = await api.studio.create(meta.projectId, { name: `${meta.name} — ${label(format)}`.slice(0, 120), format: format.id, doc: adapted, thumbnail });
        out.push({ id: design.id, name: design.name });
      }
      setCreated(out);
      toast.success(t("created", { count: out.length }));
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const resizeHere = async () => {
    const format = targets[0]!;
    await ensureFonts(documentFonts(doc));
    const state = useStudio.getState();
    state.change(() => adaptDoc(doc, format));
    state.select([]);
    if (format.id !== meta.format) useStudio.setState((s) => ({ meta: s.meta && { ...s.meta, format: format.id } }));
    setTimeout(() => useStudio.getState().fit(), 0);
    toast.success(t("resized", { format: label(format) }));
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setCreated([]);
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" aria-hidden="true" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {created.length ? (
          <div className="grid gap-2">
            {created.map((design) => (
              <Link key={design.id} href={`/studio/${design.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                <span className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500" aria-hidden="true" />
                  {design.name}
                </span>
                <ExternalLink className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[1fr_260px]">
            <div className="grid content-start gap-4">
              {FORMAT_GROUPS.map((group) => (
                <fieldset key={group} className="grid gap-1.5">
                  <legend className="mb-1 text-xs font-semibold">{t(`groups.${group}`)}</legend>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FORMATS.filter((f) => f.group === group && f.id !== meta.format).map((format) => (
                      <label key={format.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition", selected.includes(format.id) ? "border-primary bg-primary/5" : "hover:bg-muted")}>
                        <Checkbox checked={selected.includes(format.id)} onCheckedChange={() => toggle(format.id)} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{tf(`${format.id}.name`)}</span>
                          <span className="block text-[10px] text-muted-foreground">{format.print ? `${format.print.widthMm} × ${format.print.heightMm} mm` : `${format.width} × ${format.height} px`}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <fieldset className="grid gap-1.5">
                <legend className="mb-1 text-xs font-semibold">{t("custom")}</legend>
                <div className="flex items-center gap-2">
                  <Checkbox checked={selected.includes("custom")} onCheckedChange={() => toggle("custom")} aria-label={t("custom")} />
                  <Input type="number" min={64} max={8000} value={custom.width} onChange={(e) => setCustom({ ...custom, width: Math.max(64, Math.min(8000, Number(e.target.value) || 0)) })} className="h-8 w-24 text-xs" aria-label={t("width")} />
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input type="number" min={64} max={8000} value={custom.height} onChange={(e) => setCustom({ ...custom, height: Math.max(64, Math.min(8000, Number(e.target.value) || 0)) })} className="h-8 w-24 text-xs" aria-label={t("height")} />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </fieldset>
            </div>
            <div className="grid content-start gap-2">
              <p className="text-xs font-semibold">{t("preview")}</p>
              {!previews.length ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{t("previewEmpty")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {previews.map(({ format, doc: adapted }) => (
                    <figure key={format.id} className="grid gap-1">
                      <div className="overflow-hidden rounded-md border bg-white shadow-xs">
                        <PageThumb doc={adapted} page={adapted.pages[0]!} width={120} />
                      </div>
                      <figcaption className="truncate text-[10px] text-muted-foreground">{label(format)}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!created.length && (
          <DialogFooter>
            <Button variant="outline" onClick={resizeHere} disabled={selected.length !== 1 || busy}>
              {t("resizeHere")}
            </Button>
            <Button onClick={createCopies} disabled={!selected.length || busy}>
              {busy && <Loader2 className="animate-spin" />}
              {t("createCopies", { count: selected.length })}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
