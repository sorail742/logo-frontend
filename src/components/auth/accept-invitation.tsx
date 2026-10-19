"use client";

import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/common/button-link";
import { api, errorMessage } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useSessionStore } from "@/stores/session";
import { AuthCard } from "./auth-card";

export function AcceptInvitation() {
  const t = useTranslations("auth.invitation");
  const { token } = useParams<{ token: string }>();
  const status = useSessionStore((s) => s.status);
  const setWorkspace = useSessionStore((s) => s.setWorkspace);
  const router = useRouter();
  const queryClient = useQueryClient();
  const accept = useMutation({
    mutationFn: () => api.workspaces.acceptInvitation(token),
    onSuccess: (workspace) => {
      toast.success(t("accepted", { name: workspace.name }));
      queryClient.invalidateQueries({ queryKey: qk.workspaces });
      setWorkspace(workspace.id);
      router.replace("/app");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <AuthCard title={t("title")} description={t("body")}>
      {status === "authenticated" ? (
        <Button size="lg" onClick={() => accept.mutate()} disabled={accept.isPending}>
          {t("accept")}
        </Button>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("loginFirst")}</p>
          <ButtonLink href={`/connexion?next=${encodeURIComponent(`/invitation/${token}`)}`} size="lg">
            {t("accept")}
          </ButtonLink>
        </>
      )}
    </AuthCard>
  );
}
