"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Check, CloudOff, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { api, errorMessage } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { SiteContent, SiteSectionType } from "@/lib/render/site";
import type { Logo, Website } from "@/lib/types";
import { SiteContentPanel, type MediaActions } from "./site-content-panel";
import { SiteMessagesPanel } from "./site-messages-panel";
import { buildSiteHtml, SitePreview } from "./site-preview";
import { SitePublishPanel, SiteStatus } from "./site-publish-panel";
import { SiteStylePanel } from "./site-style-panel";

/** Délai entre la dernière modification et la sauvegarde automatique. */
const AUTOSAVE_MS = 800;

type SaveState = "idle" | "saving" | "saved" | "error";

/** Retire une image téléversée des sections qui l'utilisent (même règle que l'API). */
function withoutMedia(content: SiteContent, mediaId: string): SiteContent {
  return {
    ...content,
    sections: content.sections.map((section) => {
      if (section.type === "hero" && section.image?.kind === "media" && section.image.id === mediaId) return { ...section, image: null };
      if (section.type === "gallery") return { ...section, images: section.images.filter((img) => img.kind !== "media" || img.id !== mediaId) };
      return section;
    }),
  };
}

function SaveIndicator({ state }: Readonly<{ state: SaveState }>) {
  const t = useTranslations("site.status");
  if (state === "idle") return null;
  const icons = { saving: Loader2, saved: Check, error: CloudOff } as const;
  const Icon = icons[state];
  return (
    <output className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className={state === "saving" ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden="true" />
      {t(state)}
    </output>
  );
}

/** Éditeur du site : panneaux à gauche, aperçu en direct à droite, sauvegarde automatique. */
export function SiteEditor({ website, logos }: Readonly<{ website: Website; logos: Logo[] }>) {
  const t = useTranslations("site");
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { pid, can } = useProject();
  const canEdit = can("content.edit");
  const [tab, setTab] = useState("content");
  const [open, setOpen] = useState<SiteSectionType | null>("hero");
  const [content, setContent] = useState(website.content);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const latest = useRef(content);
  const pending = useRef(false);

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: qk.websiteBrand(website.id, website.displayedLogoId),
    queryFn: () => api.websites.brand(website.id),
    enabled: Boolean(website.displayedLogoId),
    staleTime: 5 * 60_000,
  });

  const setWebsite = useCallback((updated: Website) => queryClient.setQueryData(qk.website(pid), updated), [pid, queryClient]);

  /** Enregistre tout de suite les modifications en attente (avant publication, au départ de la page). */
  const flush = useCallback(async () => {
    if (!pending.current) return;
    pending.current = false;
    setSaveState("saving");
    try {
      const updated = await api.websites.update(website.id, { content: latest.current });
      setWebsite(updated);
      setSaveState(pending.current ? "saving" : "saved");
    } catch (error) {
      pending.current = true;
      setSaveState("error");
      throw error;
    }
  }, [setWebsite, website.id]);

  useEffect(() => {
    if (!pending.current) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      flush().catch((error: unknown) => toast.error(errorMessage(error)));
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [content, flush]);

  // Départ de la page avant la fin du délai : la dernière version part quand même.
  useEffect(
    () => () => {
      if (pending.current) api.websites.update(website.id, { content: latest.current }).catch(() => undefined);
    },
    [website.id],
  );

  const change = (next: SiteContent) => {
    latest.current = next;
    pending.current = true;
    setContent(next);
  };

  const publish = useMutation({
    mutationFn: async () => {
      await flush();
      return api.websites.publish(website.id);
    },
    onSuccess: (updated) => {
      setWebsite(updated);
      queryClient.invalidateQueries({ queryKey: qk.project(pid) });
      toast.success(t("publish.published"));
    },
    onError,
  });

  const changeLogo = useMutation({
    mutationFn: (logoId: string | null) => api.websites.update(website.id, { logoId }),
    onSuccess: (updated) => {
      setWebsite(updated);
      toast.success(t("style.logoSaved"));
    },
    onError,
  });

  const mediaActions: MediaActions = {
    media: website.media,
    upload: async (dataUrl, alt) => {
      try {
        await api.websites.addMedia(website.id, { dataUrl, alt });
        await queryClient.invalidateQueries({ queryKey: qk.website(pid) });
        toast.success(t("images.uploaded"));
      } catch (error) {
        onError(error);
      }
    },
    remove: (mediaId) => {
      api.websites
        .removeMedia(website.id, mediaId)
        .then((updated) => {
          setWebsite(updated);
          change(withoutMedia(latest.current, mediaId));
          toast.success(t("images.mediaDeleted"));
        })
        .catch(onError);
    },
  };

  const openDemo = () => {
    if (!brand) return;
    const page = new Blob([buildSiteHtml(website, latest.current, brand, false)], { type: "text/html" });
    window.open(URL.createObjectURL(page), "_blank", "noopener");
  };

  const panelProps = { brand, mediaActions, disabled: !canEdit };

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <SaveIndicator state={saveState} />
            <SiteStatus website={website} />
            {canEdit && (!website.published || website.dirty) && (
              <Button type="button" disabled={publish.isPending} onClick={() => publish.mutate()}>
                {publish.isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
                {website.published ? t("publish.republish") : t("publish.publish")}
              </Button>
            )}
          </>
        }
      />
      {!canEdit && <p className="mb-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="min-w-0">
          <TabsList className="w-full">
            <TabsTrigger value="content">{t("tabs.content")}</TabsTrigger>
            <TabsTrigger value="style">{t("tabs.style")}</TabsTrigger>
            <TabsTrigger value="publish">{t("tabs.publish")}</TabsTrigger>
            {canEdit && (
              <TabsTrigger value="messages">
                {t("tabs.messages")}
                {website.unreadMessages > 0 && <Badge className="ml-1 h-4 px-1.5 text-[10px]">{website.unreadMessages}</Badge>}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="content" className="mt-4">
            <SiteContentPanel content={content} onChange={change} open={open} onOpen={setOpen} {...panelProps} />
          </TabsContent>
          <TabsContent value="style" className="mt-4">
            <SiteStylePanel
              content={content}
              onChange={change}
              website={website}
              logos={logos}
              onLogoChange={(logoId) => changeLogo.mutate(logoId)}
              disabled={!canEdit}
            />
          </TabsContent>
          <TabsContent value="publish" className="mt-4">
            <SitePublishPanel
              website={website}
              onWebsite={setWebsite}
              onDeleted={() => queryClient.setQueryData(qk.website(pid), null)}
              openDemo={openDemo}
              publish={() => publish.mutate()}
              publishing={publish.isPending}
              canEdit={canEdit}
              canDelete={can("project.delete")}
              canDownload={can("export.download")}
            />
          </TabsContent>
          {canEdit && (
            <TabsContent value="messages" className="mt-4">
              <SiteMessagesPanel website={website} />
            </TabsContent>
          )}
        </Tabs>
        <div className="lg:sticky lg:top-4">
          <SitePreview website={website} content={content} brand={brand} loading={brandLoading} focus={tab === "content" ? open : null} />
        </div>
      </div>
    </div>
  );
}
