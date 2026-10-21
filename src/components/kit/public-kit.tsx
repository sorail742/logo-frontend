"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Lock, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ApiError, api } from "@/lib/api";
import { KitView } from "./kit-view";
import { ComingSoon } from "@/components/common/coming-soon";

export function PublicKit() {
  return api.isAvailable("brandKits") ? <PublicKitContent /> : <ComingSoon feature="brandKits" />;
}

function PublicKitContent() {
  const t = useTranslations("kit.public");
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const { data, error, isLoading } = useQuery({
    queryKey: ["public-kit", token, password],
    queryFn: () => api.brandKits.publicKit(token, password),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (error instanceof ApiError && error.code === "PASSWORD_REQUIRED") {
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
        <Input type="password" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={t("password")} autoFocus />
        <Button type="submit">{t("unlock")}</Button>
      </form>
    );
  }

  if (error || !data) return <EmptyState icon={SearchX} title={t("notFound")} />;

  return (
    <div className="grid gap-6">
      <h1 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{t("title")}</h1>
      <KitView kit={data} projectName={data.projectName} acronym={data.acronym} meaning={data.meaning} />
      <p className="text-center text-xs text-muted-foreground">{t("madeWith")}</p>
    </div>
  );
}
