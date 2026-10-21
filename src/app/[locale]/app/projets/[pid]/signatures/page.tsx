"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { EmailSignatureBuilder } from "@/components/signatures/email-signature-builder";
import { HandwrittenPanel } from "@/components/signatures/handwritten-panel";
import { SloganPanel } from "@/components/signatures/slogan-panel";
import { StampPanel } from "@/components/signatures/stamp-panel";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useProject } from "@/hooks/use-project";
import { useCredits } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { initials } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { svgToPngDataUrl } from "@/lib/render/export";
import { renderLogoSvg } from "@/lib/render/logo";
import type { EmailSignatureData, HandwrittenData, Signature, SignatureKind, StampData } from "@/lib/types";
import type { EmailTemplateId } from "@/lib/render/email-signature";
import { ComingSoon } from "@/components/common/coming-soon";

const TABS = ["slogan", "email", "handwritten", "stamp"] as const;
type Tab = (typeof TABS)[number];

function SignaturesContent() {
  const t = useTranslations("signatures");
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const searchParams = useSearchParams();
  const { project, pid, can } = useProject();
  const credits = useCredits();
  const requested = searchParams.get("onglet") as Tab | null;
  const [tab, setTab] = useState<Tab>(requested && TABS.includes(requested) ? requested : "slogan");
  const [rendered, setRendered] = useState<{ spec: unknown; url: string } | null>(null);

  const { data: logos = [] } = useQuery({ queryKey: qk.logos(pid), queryFn: () => api.logos.list(pid) });
  const { data: slogans = [] } = useQuery({ queryKey: qk.slogans(pid), queryFn: () => api.slogans.list(pid) });
  const { data: signatures, isLoading } = useQuery({ queryKey: qk.signatures(pid), queryFn: () => api.signatures.list(pid) });

  const logoSpec = (logos.find((l) => l.isFavorite) ?? logos[0])?.current.spec ?? null;
  const name = project?.chosenName?.value ?? project?.title ?? "";
  const acronym = project?.chosenName?.acronym ?? initials(name, 4);
  const slogan = slogans.find((s) => s.isChosen && s.kind === "SLOGAN")?.text;

  // Aperçu : logo rasterisé localement. L'API fournit une URL HTTPS absolue pour la version finale.
  useEffect(() => {
    if (!logoSpec) return;
    let cancelled = false;
    svgToPngDataUrl(renderLogoSvg(logoSpec).svg, { size: 240 })
      .then((url) => !cancelled && setRendered({ spec: logoSpec, url }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [logoSpec]);

  const logoPng = logoSpec && rendered?.spec === logoSpec ? rendered.url : null;

  const brand = useMemo(
    () => ({
      name,
      slogan,
      logoUrl: logoPng,
      primary: logoSpec?.colors.primary ?? "#0f766e",
      secondary: logoSpec?.colors.secondary ?? "#f59e0b",
      poweredBy: credits.data?.planCode === "FREE" ? t("email.poweredBy") : null,
    }),
    [name, slogan, logoPng, logoSpec, credits.data?.planCode, t],
  );

  const create = useMutation({
    mutationFn: (input: { kind: SignatureKind; data: Signature["data"]; templateId?: string; attested?: boolean }) => api.signatures.create(pid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.signatures(pid) });
      queryClient.invalidateQueries({ queryKey: qk.project(pid) });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError,
  });

  const emailSignature = signatures?.find((s) => s.kind === "EMAIL");
  const stamp = signatures?.find((s) => s.kind === "STAMP") ?? null;
  const canEdit = can("content.edit");
  const planCode = credits.data?.planCode;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="mb-6 w-full justify-start overflow-x-auto sm:w-auto">
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="slogan">
          <SloganPanel pid={pid} canEdit={can("generation.run")} isAssociation={project?.entityType === "ASSOCIATION"} logoSpec={logoSpec} />
        </TabsContent>

        <TabsContent value="email">
          {isLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <EmailSignatureBuilder
              key={emailSignature?.id ?? "new"}
              brand={brand}
              initial={emailSignature?.data as EmailSignatureData | undefined}
              initialTemplate={(emailSignature?.templateId as EmailTemplateId | null) ?? "classic"}
              saving={create.isPending}
              batch={planCode === "PRO" || planCode === "AGENCY" ? "enabled" : "locked"}
              onSave={
                canEdit
                  ? (data, templateId) =>
                      (emailSignature
                        ? api.signatures.update(emailSignature.id, { data, templateId })
                        : api.signatures.create(pid, { kind: "EMAIL", data, templateId })
                      ).then(() => {
                        toast.success(t("email.saved"));
                        queryClient.invalidateQueries({ queryKey: qk.signatures(pid) });
                      }, onError)
                  : undefined
              }
            />
          )}
        </TabsContent>

        <TabsContent value="handwritten">
          <HandwrittenPanel
            defaultText={name}
            canEdit={canEdit}
            saving={create.isPending}
            onSave={(data: HandwrittenData, attested) =>
              create.mutateAsync({ kind: "HANDWRITTEN", data, attested }).then(
                () => true,
                () => false,
              )
            }
          />
        </TabsContent>

        <TabsContent value="stamp">
          {isLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <StampPanel
              key={stamp?.id ?? "new"}
              initial={
                (stamp?.data as StampData | undefined) ?? {
                  shape: "round",
                  ringText: name,
                  bottomText: "Conakry · Guinée",
                  centerText: acronym,
                  centerMode: "acronym",
                  ink: "blue",
                  inkEffect: false,
                }
              }
              existing={stamp}
              logoSpec={logoSpec}
              canEdit={canEdit}
              saving={create.isPending}
              onSave={(data, attested) =>
                (stamp ? api.signatures.update(stamp.id, { data, attested }) : api.signatures.create(pid, { kind: "STAMP", data, attested })).then(
                  (signature) => {
                    queryClient.invalidateQueries({ queryKey: qk.signatures(pid) });
                    queryClient.invalidateQueries({ queryKey: qk.project(pid) });
                    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
                    return signature;
                  },
                  (error) => {
                    onError(error);
                    return null;
                  },
                )
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function SignaturesPage() {
  if (!api.isAvailable("signatures")) return <SignaturesComingSoon />;
  return (
    <Suspense>
      <SignaturesContent />
    </Suspense>
  );
}

function SignaturesComingSoon() {
  const t = useTranslations("signatures");
  return <ComingSoon feature="signatures" title={t("title")} />;
}
