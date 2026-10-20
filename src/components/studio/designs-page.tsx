"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Copy, LayoutTemplate, Loader2, MoreHorizontal, Palette, Plus, Printer, Smartphone, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { Link, useRouter } from "@/i18n/navigation";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { createDoc } from "@/lib/studio/doc";
import { customFormat, FORMAT_GROUPS, FORMATS, getFormat, type DesignFormat } from "@/lib/studio/formats";
import type { StudioDesignSummary } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

// Studio du projet : créations (publications, affiches, flyers, cartes, présentations) et
// création d'un nouveau document au format choisi.

const QUICK = ["post-square", "story", "flyer-a5", "business-card", "slide", "facebook-cover"];

function FormatShape({ format, className }: { format: DesignFormat; className?: string }) {
  const ratio = format.width / format.height;
  const w = ratio >= 1 ? 40 : 40 * ratio;
  const h = ratio >= 1 ? 40 / ratio : 40;
  return (
    <span className={cn("flex size-11 items-center justify-center", className)} aria-hidden="true">
      <span className="rounded-[3px] border-2 border-current" style={{ width: w, height: Math.max(8, h) }} />
    </span>
  );
}

export function NewDesignDialog({ open, onOpenChange, initialFormat }: { open: boolean; onOpenChange(open: boolean): void; initialFormat?: string }) {
  const t = useTranslations("studio.list");
  const tf = useTranslations("studio.formats");
  const onError = useApiErrorToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pid } = useProject();
  const [formatId, setFormatId] = useState(initialFormat ?? "post-square");
  const [custom, setCustom] = useState({ width: 1200, height: 1200 });
  const [name, setName] = useState("");
  const format = formatId === "custom" ? customFormat(custom.width, custom.height) : getFormat(formatId)!;
  const formatName = formatId === "custom" ? t("custom") : tf(`${formatId}.name`);

  const create = useMutation({
    mutationFn: () => api.studio.create(pid, { name: (name.trim() || formatName).slice(0, 120), format: format.id, doc: createDoc(format) }),
    onSuccess: (design) => {
      queryClient.invalidateQueries({ queryKey: qk.studio(pid) });
      router.push(`/studio/${design.id}`);
    },
    onError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("newTitle")}</DialogTitle>
          <DialogDescription>{t("newDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          {FORMAT_GROUPS.map((group) => (
            <fieldset key={group} className="grid gap-2">
              <legend className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`groups.${group}`)}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FORMATS.filter((f) => f.group === group).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormatId(f.id)}
                    aria-pressed={formatId === f.id}
                    className={cn("flex items-center gap-2 rounded-xl border p-2 text-left transition", formatId === f.id ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted")}
                  >
                    <FormatShape format={f} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{tf(`${f.id}.name`)}</span>
                      <span className="block text-[11px]">{f.print ? `${f.print.widthMm} × ${f.print.heightMm} mm` : `${f.width} × ${f.height} px`}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("custom")}</legend>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={formatId === "custom" ? "default" : "outline"} size="sm" onClick={() => setFormatId("custom")}>
                {t("customUse")}
              </Button>
              <Input type="number" min={64} max={8000} value={custom.width} onChange={(e) => setCustom({ ...custom, width: Math.max(64, Math.min(8000, Number(e.target.value) || 64)) })} onFocus={() => setFormatId("custom")} className="h-8 w-24" aria-label={t("width")} />
              <span className="text-muted-foreground">×</span>
              <Input type="number" min={64} max={8000} value={custom.height} onChange={(e) => setCustom({ ...custom, height: Math.max(64, Math.min(8000, Number(e.target.value) || 64)) })} onFocus={() => setFormatId("custom")} className="h-8 w-24" aria-label={t("height")} />
              <span className="text-sm text-muted-foreground">px</span>
            </div>
          </fieldset>
          <label className="grid gap-1.5 text-sm font-medium">
            {t("name")}
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={formatName} maxLength={120} />
          </label>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DesignCard({ design, canEdit }: { design: StudioDesignSummary; canEdit: boolean }) {
  const t = useTranslations("studio.list");
  const tf = useTranslations("studio.formats");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const known = getFormat(design.format);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.studio(design.projectId) });
  const duplicate = useMutation({
    mutationFn: () => api.studio.duplicate(design.id),
    onSuccess: () => {
      toast.success(t("duplicated"));
      invalidate();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: () => api.studio.remove(design.id),
    onSuccess: () => {
      toast.success(t("deleted"));
      invalidate();
    },
    onError,
  });
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/studio/${design.id}`} className="block">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[repeating-conic-gradient(var(--color-muted)_0_25%,transparent_0_50%)] [background-size:16px_16px] p-3">
          {design.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu en data URL
            <img src={design.thumbnail} alt="" className="max-h-full max-w-full rounded-sm shadow-md" />
          ) : (
            <LayoutTemplate className="size-8 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="grid gap-0.5 border-t px-3 py-2.5">
          <span className="truncate text-sm font-medium">{design.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {known ? tf(`${design.format}.name`) : `${design.width} × ${design.height}`} · {format.relativeTime(new Date(Math.min(Date.parse(design.updatedAt), now.getTime())), now)}
          </span>
        </div>
      </Link>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" size="icon-sm" className="absolute top-2 right-2 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100" aria-label={t("actions")} />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => duplicate.mutate()}>
              <Copy />
              {t("duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirm(true)}>
              <Trash2 />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteBody", { name: design.name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirm(false);
                remove.mutate();
              }}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StudioDesignsPage() {
  const t = useTranslations("studio.list");
  const tf = useTranslations("studio.formats");
  const { pid, can } = useProject();
  const canEdit = can("content.edit");
  const [dialog, setDialog] = useState<{ format?: string } | null>(null);
  const { data: designs, isLoading } = useQuery({ queryKey: qk.studio(pid), queryFn: () => api.studio.list(pid) });

  const features = [
    { icon: LayoutTemplate, key: "templates" },
    { icon: Wand2, key: "resize" },
    { icon: Palette, key: "brand" },
    { icon: Printer, key: "print" },
  ] as const;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canEdit && (
            <Button size="lg" onClick={() => setDialog({})}>
              <Plus />
              {t("new")}
            </Button>
          )
        }
      />

      {canEdit && (
        <section className="mb-8 grid gap-3" aria-label={t("quick")}>
          <h2 className="text-sm font-semibold">{t("quick")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK.map((id) => {
              const f = getFormat(id)!;
              return (
                <button key={id} type="button" onClick={() => setDialog({ format: id })} className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3 text-center text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-sm">
                  <FormatShape format={f} />
                  <span className="text-xs font-medium text-foreground">{tf(`${id}.name`)}</span>
                  <span className="text-[10px]">{f.print ? `${f.print.widthMm} × ${f.print.heightMm} mm` : `${f.width} × ${f.height}`}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-3" aria-label={t("mine")}>
        <h2 className="text-sm font-semibold">{t("mine")}</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3.6] rounded-xl" />)}</div>
        ) : !designs?.length ? (
          <div className="grid gap-6 rounded-2xl border border-dashed p-8 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <Smartphone className="mb-3 size-8 text-primary" aria-hidden="true" />
              <p className="text-lg font-semibold">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("emptyBody")}</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => setDialog({})}>
                  <Plus />
                  {t("new")}
                </Button>
              )}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, key }) => (
                <li key={key} className="rounded-xl bg-muted/60 p-3">
                  <Icon className="mb-1.5 size-4 text-primary" aria-hidden="true" />
                  <p className="text-sm font-medium">{t(`features.${key}.title`)}</p>
                  <p className="text-xs text-muted-foreground">{t(`features.${key}.body`)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {designs.map((design) => (
              <DesignCard key={design.id} design={design} canEdit={canEdit} />
            ))}
          </div>
        )}
      </section>

      {dialog && <NewDesignDialog key={dialog.format ?? "new"} open onOpenChange={(open) => !open && setDialog(null)} initialFormat={dialog.format} />}
    </>
  );
}
