"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { BadgeCheck, Copy, Loader2, MoreHorizontal, Plus, Printer, Ruler, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/common/native-select";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { GARMENT_COLORS } from "@/lib/apparel/defaults";
import {
  TECHNIQUES,
  type ApparelDesignSummary,
  type ApparelTemplate,
  type PrintTechnique,
} from "@/lib/apparel/types";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { GarmentPreview } from "./garment-view";
import { STATUS_VARIANT } from "./status";

// Textile du projet : tenues (t-shirts, polos, maillots) et création d'une tenue sur un support.

/** Technique conseillée par support : DTF polyvalent, sublimation pour les maillots clairs. */
const DEFAULT_TECHNIQUE: Partial<Record<ApparelTemplate["category"], PrintTechnique>> = {
  POLO: "EMBROIDERY",
  FOOTBALL_JERSEY: "HEAT_TRANSFER_VINYL",
  BASKETBALL_JERSEY: "HEAT_TRANSFER_VINYL",
};

function NewApparelDialog({
  templates,
  initial,
  onClose,
}: Readonly<{
  templates: ApparelTemplate[];
  initial?: string;
  onClose(): void;
}>) {
  const t = useTranslations("apparel");
  const onError = useApiErrorToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pid } = useProject();
  const [templateId, setTemplateId] = useState(initial ?? templates[0]?.id ?? "");
  const template = templates.find((tpl) => tpl.id === templateId);
  const [technique, setTechnique] = useState<PrintTechnique>(
    (template && DEFAULT_TECHNIQUE[template.category]) ?? "DTF",
  );
  const [color, setColor] = useState("#ffffff");
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.apparel.create(pid, {
        templateId,
        name: (name.trim() || (template?.name ?? "Tenue")).slice(0, 120),
        technique,
        garmentColor: color,
      }),
    onSuccess: (design) => {
      void queryClient.invalidateQueries({ queryKey: qk.apparel(pid) });
      onClose();
      router.push(`/textile/${design.id}`);
    },
    onError,
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("list.newTitle")}</DialogTitle>
          <DialogDescription>{t("list.newDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              {t("list.support")}
            </legend>
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                aria-pressed={tpl.id === templateId}
                onClick={() => {
                  setTemplateId(tpl.id);
                  setTechnique(DEFAULT_TECHNIQUE[tpl.category] ?? "DTF");
                }}
                className={cn(
                  "grid gap-1 rounded-xl border p-2 text-center text-xs font-medium transition",
                  tpl.id === templateId ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted",
                )}
              >
                <GarmentPreview
                  category={tpl.category}
                  view={tpl.zones.some((z) => z.view === "FRONT") ? "FRONT" : (tpl.zones[0]?.view ?? "FRONT")}
                  color={color}
                  zones={tpl.zones}
                  className="bg-muted/60 mx-auto aspect-square w-full max-w-24 rounded-lg p-1"
                />
                {tpl.name}
              </button>
            ))}
          </fieldset>
          <div className="grid gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t("settings.fabric")}
            </span>
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">{t("settings.fabric")}</legend>
              {GARMENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={color === c}
                  aria-label={c}
                  title={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border shadow-xs transition hover:scale-110",
                    color === c && "ring-primary ring-offset-background ring-2 ring-offset-2",
                  )}
                  style={{ background: c }}
                />
              ))}
            </fieldset>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">
              {t("settings.technique")}
              <NativeSelect
                value={technique}
                onChange={(e) => setTechnique(e.target.value as PrintTechnique)}
              >
                {TECHNIQUES.map((tech) => (
                  <option key={tech} value={tech}>
                    {t(`techniques.${tech}.name`)}
                  </option>
                ))}
              </NativeSelect>
              <span className="text-muted-foreground text-xs font-normal">
                {t(`techniques.${technique}.hint`)}
              </span>
            </label>
            <label className="grid content-start gap-1.5 text-sm font-medium">
              {t("settings.name")}
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={template?.name}
                maxLength={120}
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={() => create.mutate()} disabled={!template || create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" /> : <Shirt />}
            {t("list.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DesignCard({
  design,
  template,
  canEdit,
}: Readonly<{
  design: ApparelDesignSummary;
  template?: ApparelTemplate;
  canEdit: boolean;
}>) {
  const t = useTranslations("apparel");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { pid } = useProject();
  const [confirm, setConfirm] = useState(false);
  // Aperçu avec les impressions : la tenue complète n'est chargée qu'à l'affichage de la carte.
  const full = useQuery({
    queryKey: qk.apparelDesign(design.id),
    queryFn: () => api.apparel.get(design.id),
    enabled: design._count.elements > 0,
    staleTime: 60_000,
  });
  const router = useRouter();
  // Copie en brouillon : la tenue validée reste intacte, la copie se personnalise librement.
  const duplicate = useMutation({
    mutationFn: () => api.apparel.duplicate(design.id),
    onSuccess: (copy) => {
      toast.success(t("list.duplicated"));
      void queryClient.invalidateQueries({ queryKey: qk.apparel(pid) });
      router.push(`/textile/${copy.id}`);
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: () => api.apparel.remove(design.id),
    onSuccess: () => {
      toast.success(t("list.deleted"));
      void queryClient.invalidateQueries({ queryKey: qk.apparel(pid) });
    },
    onError,
  });
  const views = template?.zones.map((z) => z.view) ?? [];
  const view = views.includes("FRONT") ? "FRONT" : (views[0] ?? "FRONT");

  return (
    <div className="group bg-card relative overflow-hidden rounded-xl border shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/textile/${design.id}`} className="block">
        <div className="bg-muted/50 flex aspect-[4/3.4] items-center justify-center p-3">
          {template ? (
            <GarmentPreview
              category={design.template.category}
              view={view}
              color={design.garmentColor}
              zones={template.zones}
              elements={full.data?.elements}
              className="size-full"
              label={design.name}
            />
          ) : (
            <Shirt className="text-muted-foreground size-8" aria-hidden="true" />
          )}
        </div>
        <div className="grid gap-1 border-t px-3 py-2.5">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{design.name}</span>
            <Badge variant={STATUS_VARIANT[design.status]} className="ml-auto shrink-0">
              {t(`status.${design.status}`)}
            </Badge>
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {design.template.name} · {t(`techniques.${design.technique}.name`)} ·{" "}
            {format.relativeTime(new Date(Math.min(Date.parse(design.updatedAt), now.getTime())), now)}
          </span>
        </div>
      </Link>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="secondary"
                size="icon-sm"
                className="absolute top-2 right-2 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                aria-label={t("list.actions")}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={duplicate.isPending} onClick={() => duplicate.mutate()}>
              <Copy />
              {t("list.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setConfirm(true)}>
              <Trash2 />
              {t("list.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("list.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("list.deleteBody", { name: design.name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              {t("list.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirm(false);
                remove.mutate();
              }}
            >
              {t("list.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Aucune tenue : présentation du module et bouton de création. */
function EmptyDesigns({ canEdit, disabled, onNew }: Readonly<{ canEdit: boolean; disabled: boolean; onNew(): void }>) {
  const t = useTranslations("apparel.list");
  const features = [
    { icon: Shirt, key: "realistic" },
    { icon: Ruler, key: "zones" },
    { icon: Printer, key: "print" },
    { icon: BadgeCheck, key: "proof" },
  ] as const;
  return (
    <div className="grid gap-6 rounded-2xl border border-dashed p-8 md:grid-cols-[1fr_1.2fr] md:items-center">
      <div>
        <Shirt className="text-primary mb-3 size-8" aria-hidden="true" />
        <p className="text-lg font-semibold">{t("emptyTitle")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("emptyBody")}</p>
        {canEdit && (
          <Button className="mt-4" onClick={onNew} disabled={disabled}>
            <Plus />
            {t("new")}
          </Button>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {features.map(({ icon: Icon, key }) => (
          <li key={key} className="bg-muted/60 rounded-xl p-3">
            <Icon className="text-primary mb-1.5 size-4" aria-hidden="true" />
            <p className="text-sm font-medium">{t(`features.${key}.title`)}</p>
            <p className="text-muted-foreground text-xs">{t(`features.${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApparelPage() {
  const t = useTranslations("apparel.list");
  const { pid, can } = useProject();
  const canEdit = can("content.edit");
  const [dialog, setDialog] = useState<{ template?: string } | null>(null);
  const templates = useQuery({
    queryKey: qk.apparelTemplates,
    queryFn: () => api.apparel.templates(),
    staleTime: 10 * 60_000,
  });
  const designs = useQuery({ queryKey: qk.apparel(pid), queryFn: () => api.apparel.list(pid) });
  const byId = new Map(templates.data?.map((tpl) => [tpl.id, tpl]));

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canEdit && (
            <Button size="lg" onClick={() => setDialog({})} disabled={!templates.data?.length}>
              <Plus />
              {t("new")}
            </Button>
          )
        }
      />

      {canEdit && templates.data && (
        <section className="mb-8 grid gap-3" aria-label={t("quick")}>
          <h2 className="text-sm font-semibold">{t("quick")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {templates.data.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setDialog({ template: tpl.id })}
                className="bg-card hover:border-primary grid gap-1 rounded-xl border p-3 text-center transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <GarmentPreview
                  category={tpl.category}
                  view={tpl.zones.some((z) => z.view === "FRONT") ? "FRONT" : (tpl.zones[0]?.view ?? "FRONT")}
                  color="#ffffff"
                  zones={tpl.zones}
                  className="bg-muted/60 mx-auto aspect-square w-full max-w-28 rounded-lg p-1"
                />
                <span className="text-xs font-medium">{tpl.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {t("zonesCount", { count: tpl.zones.length })}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3" aria-label={t("mine")}>
        <h2 className="text-sm font-semibold">{t("mine")}</h2>
        {designs.isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-[4/4.2] rounded-xl" />
            ))}
          </div>
        )}
        {!designs.isLoading && !designs.data?.length && (
          <EmptyDesigns canEdit={canEdit} disabled={!templates.data?.length} onNew={() => setDialog({})} />
        )}
        {designs.data && designs.data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {designs.data.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                template={byId.get(design.templateId)}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </section>

      {dialog && templates.data && (
        <NewApparelDialog
          templates={templates.data}
          initial={dialog.template}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
