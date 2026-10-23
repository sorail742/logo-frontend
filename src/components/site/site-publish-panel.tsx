"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { Copy, Download, ExternalLink, FileArchive, Globe, Loader2, MessageCircle, Rocket, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/common/button-link";
import { Field } from "@/components/common/field";
import { SvgView } from "@/components/brand/svg-view";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api, API_MODE } from "@/lib/api";
import { downloadBlob, svgToPngBlob } from "@/lib/render/export";
import { qrSvg } from "@/lib/render/qr";
import type { Website } from "@/lib/types";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;

export function SiteStatus({ website }: { website: Website }) {
  const t = useTranslations("site.status");
  if (!website.published) return <Badge variant="outline">{t("draft")}</Badge>;
  return website.dirty ? <Badge variant="secondary">{t("dirty")}</Badge> : <Badge>{t("live")}</Badge>;
}

/** Onglet « Publication » : adresse, mise en ligne, partage, QR code, export, suppression. */
export function SitePublishPanel({
  website,
  onWebsite,
  onDeleted,
  openDemo,
  publish,
  publishing,
  canEdit,
  canDelete,
  canDownload,
}: {
  website: Website;
  onWebsite: (website: Website) => void;
  onDeleted: () => void;
  /** Mode simulé : ouvre la page rendue dans le navigateur (pas d'adresse publique). */
  openDemo: () => void;
  /** Enregistre les dernières modifications puis publie (géré par l'éditeur). */
  publish: () => void;
  publishing: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}) {
  const t = useTranslations("site.publish");
  const format = useFormatter();
  const onError = useApiErrorToast();
  const [slug, setSlug] = useState(website.slug);
  const [confirming, setConfirming] = useState(false);
  const demo = API_MODE === "mock";

  const saveSlug = useMutation({
    mutationFn: () => api.websites.update(website.id, { slug }),
    onSuccess: (updated) => {
      onWebsite(updated);
      toast.success(t("slugSaved"));
    },
    onError,
  });
  const unpublish = useMutation({
    mutationFn: () => api.websites.unpublish(website.id),
    onSuccess: (updated) => {
      onWebsite(updated);
      toast.success(t("unpublished"));
    },
    onError,
  });
  const exportZip = useMutation({
    mutationFn: () => api.websites.exportZip(website.id),
    onSuccess: ({ url }) => {
      toast.success(t("exportReady"));
      window.location.assign(url);
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: () => api.websites.remove(website.id),
    onSuccess: () => {
      setConfirming(false);
      toast.success(t("deleted"));
      onDeleted();
    },
    onError,
  });

  const qr = qrSvg(website.url, { level: "M" });
  const open = () => (demo ? openDemo() : window.open(website.url, "_blank", "noopener"));
  const slugValid = SLUG.test(slug);
  const publishLabel = website.published ? t("republish") : t("publish");

  return (
    <div className="grid min-w-0 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">{t("address")}</CardTitle>
            <SiteStatus website={website} />
          </div>
          <CardDescription>
            {website.published && website.publishedAt
              ? `${t("publishedOn", { date: format.dateTime(new Date(website.publishedAt), { dateStyle: "medium", timeStyle: "short" }) })} · ${t("views", { count: website.views })}`
              : t("notPublished")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Field label={t("slugLabel")} hint={t("slugHint")} htmlFor="site-slug">
            <div className="flex items-center gap-2">
              <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">{website.url.replace(/\/[^/]*$/, "/")}</span>
              <Input
                id="site-slug"
                value={slug}
                maxLength={48}
                disabled={!canEdit}
                aria-invalid={!slugValid}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
            </div>
          </Field>
          {canEdit && slug !== website.slug && (
            <Button type="button" variant="outline" size="sm" disabled={!slugValid || saveSlug.isPending} onClick={() => saveSlug.mutate()}>
              {t("saveSlug")}
            </Button>
          )}
          {website.dirty && <p className="text-xs text-amber-700 dark:text-amber-400">{t("dirtyHint")}</p>}
          {demo && <p className="text-xs text-muted-foreground">{t("mockNotice")}</p>}
          <div className="flex flex-wrap gap-2">
            {canEdit && (!website.published || website.dirty) && (
              <Button type="button" disabled={publishing} onClick={publish}>
                {publishing ? <Loader2 className="animate-spin" /> : <Rocket />}
                {publishing ? t("publishing") : publishLabel}
              </Button>
            )}
            {(website.published || demo) && (
              <Button type="button" variant="outline" onClick={open}>
                <ExternalLink /> {t("open")}
              </Button>
            )}
            {canEdit && website.published && (
              <Button type="button" variant="ghost" disabled={unpublish.isPending} onClick={() => unpublish.mutate()}>
                <WifiOff /> {t("unpublish")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {website.published && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("qr")}</CardTitle>
            <CardDescription>{t("qrHint")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[8rem_1fr] sm:items-center">
            <SvgView svg={qr} label={t("qr")} className="size-32 rounded-lg border bg-white p-1" />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(website.url).then(() => toast.success(t("copied")), onError);
                }}
              >
                <Copy /> {t("copy")}
              </Button>
              <a
                className="inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[0.8rem] hover:bg-muted"
                href={`https://wa.me/?text=${encodeURIComponent(t("shareText", { url: website.url }))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-3.5" aria-hidden="true" /> {t("shareWhatsapp")}
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  svgToPngBlob(qr, { size: 1024, background: "#ffffff" })
                    .then((blob) => downloadBlob(blob, `qr-${website.slug}.png`))
                    .catch(onError);
                }}
              >
                <Download /> {t("qrDownload")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canDownload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileArchive className="size-4" aria-hidden="true" /> {t("export")}
            </CardTitle>
            <CardDescription>{t("exportHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            {website.free ? (
              <>
                <p className="text-sm text-muted-foreground">{t("exportFree")}</p>
                <ButtonLink href="/app/facturation" size="sm" variant="outline">
                  {t("upgrade")}
                </ButtonLink>
              </>
            ) : (
              <Button type="button" variant="outline" disabled={exportZip.isPending} onClick={() => exportZip.mutate()}>
                {exportZip.isPending ? <Loader2 className="animate-spin" /> : <Globe />} {t("export")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {canDelete && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">{t("danger")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" onClick={() => setConfirming(true)}>
              <Trash2 /> {t("delete")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
