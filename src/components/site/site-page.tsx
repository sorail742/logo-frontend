"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckCircle2, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/common/button-link";
import { PageHeader } from "@/components/common/page-header";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { SiteEditor } from "./site-editor";

/** Avant la création : ce que le site contiendra, et le bouton qui l'assemble depuis le projet. */
function SiteIntro({
  hasLogo,
  onCreate,
  creating,
}: {
  hasLogo: boolean;
  onCreate: () => void;
  creating: boolean;
}) {
  const t = useTranslations("site");
  const { pid, can } = useProject();
  const features = t.raw("intro.features") as string[];
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <Card className="glow-card border-border/80 hover:border-primary/40 shadow-xs">
        <CardContent className="grid gap-6 py-6 md:grid-cols-[auto_1fr] md:items-start">
          <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
            <Globe className="size-7" aria-hidden="true" />
          </div>
          <div className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t("intro.title")}</h2>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{t("intro.body")}</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm">
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <SiteIntroAction
              hasLogo={hasLogo}
              canEdit={can("content.edit")}
              pid={pid}
              onCreate={onCreate}
              creating={creating}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SiteIntroAction({
  hasLogo,
  canEdit,
  pid,
  onCreate,
  creating,
}: {
  hasLogo: boolean;
  canEdit: boolean;
  pid: string;
  onCreate: () => void;
  creating: boolean;
}) {
  const t = useTranslations("site.intro");
  if (!canEdit) return <p className="text-muted-foreground text-sm">{t("viewerOnly")}</p>;
  if (!hasLogo) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">{t("noLogo")}</p>
        <ButtonLink href={`/app/projets/${pid}/logos`} variant="outline">
          {t("toLogos")}
        </ButtonLink>
      </div>
    );
  }
  return (
    <div>
      <Button type="button" size="lg" disabled={creating} onClick={onCreate}>
        {creating ? <Loader2 className="animate-spin" /> : <Globe />} {t("create")}
      </Button>
    </div>
  );
}

/** Onglet « Site web » d'un projet. */
export function SitePage() {
  const t = useTranslations("site");
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { pid } = useProject();
  const { data: website, isLoading } = useQuery({
    queryKey: qk.website(pid),
    queryFn: () => api.websites.get(pid),
  });
  const { data: logos = [], isLoading: logosLoading } = useQuery({
    queryKey: qk.logos(pid),
    queryFn: () => api.logos.list(pid),
  });

  const create = useMutation({
    mutationFn: () => api.websites.create(pid),
    onSuccess: (created) => {
      queryClient.setQueryData(qk.website(pid), created);
      toast.success(t("created"));
    },
    onError,
  });

  if (isLoading || logosLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!website)
    return (
      <SiteIntro hasLogo={logos.length > 0} onCreate={() => create.mutate()} creating={create.isPending} />
    );
  return <SiteEditor key={website.id} website={website} logos={logos} />;
}
