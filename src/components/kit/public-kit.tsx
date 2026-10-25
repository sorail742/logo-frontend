"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Check, Copy, FileArchive, FileText, Lock, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { SvgView } from "@/components/brand/svg-view";
import { MockupGallery } from "@/components/logos/mockup-gallery";
import { ApiError, api } from "@/lib/api";
import { qrSvg } from "@/lib/render/qr";
import { KitView } from "./kit-view";
import { ComingSoon } from "@/components/common/coming-soon";

/** Partage de la page : QR code à scanner et lien à copier. */
function SharePage({ color }: { color: string }) {
  const t = useTranslations("kit.public");
  // Rendu après le chargement du kit, côté navigateur seulement : l'adresse est connue.
  const [url] = useState(() => (typeof window === "undefined" ? null : window.location.href));
  const [copied, setCopied] = useState(false);
  const svg = useMemo(() => (url ? qrSvg(url, { color, margin: 2 }) : null), [url, color]);
  if (!url || !svg) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-xl border p-4" aria-label={t("share")}>
      <SvgView svg={svg} label={t("qr")} className="size-28 shrink-0 rounded-lg bg-white" />
      <div className="grid min-w-0 flex-1 gap-2">
        <p className="text-sm font-medium">{t("share")}</p>
        <p className="text-xs text-muted-foreground">{t("shareBody")}</p>
        <Button variant="outline" size="sm" className="w-fit" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {t("copyLink")}
        </Button>
      </div>
    </section>
  );
}

export function PublicKit() {
  return api.isAvailable("brandKits") ? <PublicKitContent /> : <ComingSoon feature="brandKits" />;
}

function PublicKitContent() {
  const t = useTranslations("kit.public");
  const tk = useTranslations("kit");
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const { data, error, isLoading } = useQuery({
    queryKey: ["public-kit", token, password],
    queryFn: () => api.brandKits.publicKit(token, password),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (error instanceof ApiError && (error.code === "PASSWORD_REQUIRED" || error.code === "PASSWORD_INVALID")) {
    return (
      <form
        className="mx-auto grid max-w-sm gap-3 rounded-xl border p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setPassword(draft);
        }}
      >
        <Lock className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm">{t("password")}</p>
        <Input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={t("password")}
          aria-invalid={error.code === "PASSWORD_INVALID"}
          aria-describedby={error.code === "PASSWORD_INVALID" ? "kit-password-error" : undefined}
          autoFocus
        />
        {error.code === "PASSWORD_INVALID" && (
          <p id="kit-password-error" role="alert" className="text-sm text-destructive">
            {t("passwordInvalid")}
          </p>
        )}
        <Button type="submit">{t("unlock")}</Button>
      </form>
    );
  }

  if (error || !data) return <EmptyState icon={SearchX} title={t("notFound")} />;

  return (
    <div className="grid gap-6">
      <h1 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{t("title")}</h1>
      <KitView kit={data} projectName={data.projectName} acronym={data.acronym} meaning={data.meaning} />
      {data.logoSpec && !data.logoSvg && <MockupGallery spec={data.logoSpec} canDownload={false} isFree={false} showcase />}
      {(data.guidePdfUrl || data.zipUrl) && (
        <section className="flex flex-wrap items-center gap-2" aria-label={t("downloads")}>
          {data.guidePdfUrl && /^https?:\/\//.test(data.guidePdfUrl) && (
            <a href={data.guidePdfUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
              <FileText />
              {tk("openGuide")}
            </a>
          )}
          {data.zipUrl && /^https?:\/\//.test(data.zipUrl) && (
            <a href={data.zipUrl} className={buttonVariants()}>
              <FileArchive />
              {tk("downloadZip")}
            </a>
          )}
        </section>
      )}
      <SharePage color={data.logoSpec?.colors.text ?? "#111111"} />
      <p className="text-center text-xs text-muted-foreground">{t("madeWith")}</p>
    </div>
  );
}
