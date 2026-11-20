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
import { NewOutfitModal } from "./new-outfit-modal";

// Textile du projet : tenues (t-shirts, polos, maillots) et création d'une tenue sur un support.

/** Technique conseillée par support : DTF polyvalent, sublimation pour les maillots clairs. */
const DEFAULT_TECHNIQUE: Partial<Record<ApparelTemplate["category"], PrintTechnique>> = {
  POLO: "EMBROIDERY",
  FOOTBALL_JERSEY: "HEAT_TRANSFER_VINYL",
  BASKETBALL_JERSEY: "HEAT_TRANSFER_VINYL",
};

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
    <div className="glow-card group bg-card border-border/80 hover:border-primary/40 relative overflow-hidden rounded-2xl border shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
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
function EmptyDesigns({
  canEdit,
  disabled,
  onNew,
}: Readonly<{ canEdit: boolean; disabled: boolean; onNew(): void }>) {
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
                className="glow-card bg-card hover:border-primary/50 border-border/80 grid gap-1 rounded-2xl border p-3.5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
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
        <NewOutfitModal
          templates={templates.data}
          initialTemplateId={dialog.template}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
